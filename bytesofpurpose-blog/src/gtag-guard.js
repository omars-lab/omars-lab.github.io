import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';

// Guard against `window.gtag is not a function` — AND turn the failure into a
// signal: detect ad-block and record it in PostHog.
//
// @docusaurus/plugin-google-gtag's client module calls `window.gtag(...)` on
// every route change (onRouteDidUpdate) WITHOUT checking it exists. In a prod
// build the plugin injects an inline snippet that defines `window.gtag` — but
// when an ad-blocker / privacy extension (uBlock, Brave Shields, …) or a network
// failure blocks the Google Tag script, that definition never runs and the
// unguarded call throws an uncaught runtime error on the page.
//
// Registered via `clientModules` in docusaurus.config.js BEFORE the gtag plugin's
// module. Two jobs, both at import time (which runs before any onRouteDidUpdate):
//   1. Install the exact stub Google's bootstrap uses (push args onto dataLayer).
//      If real gtag.js loads it shares this same queue (no analytics lost); if
//      blocked, the stub absorbs the calls harmlessly (no throw). We only DEFINE
//      gtag when it's missing — never overwrite a real one.
//   2. Detect whether the Google Tag script was actually blocked, and report it
//      to PostHog as a super-property (`adblock_detected`, attached to every
//      subsequent event) + a person property, so we can segment behavior by
//      ad-block state. The detection is also exposed as window.__adblockDetected.

if (ExecutionEnvironment.canUseDOM) {
  // ---- 1. gtag stub (prevents the uncaught error) -------------------------
  window.dataLayer = window.dataLayer || [];
  if (typeof window.gtag !== 'function') {
    window.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer.push(arguments);
    };
  }

  // ---- 2. ad-block detection ---------------------------------------------
  // A bait request to the same Google-Tag host the gtag plugin uses. Content
  // blockers cancel it (→ fetch rejects, or an injected <script> errors); when
  // unblocked it resolves (no-cors → opaque response, which still counts as a
  // successful network round-trip). We treat "request failed/cancelled" as
  // ad-block, matching what actually breaks window.gtag.
  const BAIT = 'https://www.googletagmanager.com/gtag/js?id=adblock-probe';

  const report = (detected) => {
    window.__adblockDetected = detected;
    // PostHog may not be initialized yet (its client module runs after this).
    // Poll briefly for window.posthog, then register the state. register() sets
    // a SUPER PROPERTY (attached to every future event); we also set a person
    // property so it's queryable on the user profile.
    let tries = 0;
    const id = window.setInterval(() => {
      const ph = window.posthog;
      if (ph && typeof ph.register === 'function') {
        window.clearInterval(id);
        ph.register({adblock_detected: detected});
        try {
          ph.setPersonProperties({adblock_detected: detected});
        } catch {
          // setPersonProperties may be unavailable on very old loads — the
          // super-property registration above is the primary signal.
        }
        // One explicit event per SESSION so it's easy to find/segment without
        // adding a per-pageview event to every visit (the super-property above
        // already tags every event). sessionStorage-gated.
        try {
          if (!window.sessionStorage.getItem('adblock_state_sent')) {
            ph.capture('adblock_state', {adblock_detected: detected});
            window.sessionStorage.setItem('adblock_state_sent', '1');
          }
        } catch {
          ph.capture('adblock_state', {adblock_detected: detected}); // storage blocked → still send
        }
      } else if (++tries > 40) {
        window.clearInterval(id); // ~10s; give up quietly (no PostHog → nothing to record)
      }
    }, 250);
  };

  // Prefer fetch (no-cors) so we don't need CORS headers; fall back to a script
  // probe for very old browsers. A rejection / load-error ⇒ blocked.
  if (typeof fetch === 'function') {
    fetch(BAIT, {method: 'HEAD', mode: 'no-cors', cache: 'no-store'})
      .then(() => report(false))
      .catch(() => report(true));
  } else {
    const s = document.createElement('script');
    s.src = BAIT;
    s.onload = () => {
      report(false);
      s.remove();
    };
    s.onerror = () => {
      report(true);
      s.remove();
    };
    document.head.appendChild(s);
  }
}
