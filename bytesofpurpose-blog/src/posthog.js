// PostHog analytics client module for Docusaurus.
// Loads only in the browser, only when a project key is configured.
// The project key (phc_...) is a public, write-only ingestion key — safe to ship.
// See ./posthog-integration-plan.md for the full instrumentation plan & decisions.
//
// NB: posthog-js is imported STATICALLY (not via dynamic import()). A dynamic
// import inside the Docusaurus client module races hydration and leaves
// window.posthog undefined / events unsent. Docusaurus only executes client
// modules in the browser, so a static import is safe and reliable.
import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';
import siteConfig from '@generated/docusaurus.config';
import posthog from 'posthog-js';
import {isInternalTester} from './internal-testers';

if (ExecutionEnvironment.canUseDOM) {
  const {posthogKey, posthogHost, posthogTestMode} = siteConfig.customFields || {};
  if (posthogKey) {
    // ---- Ingress attribution: read the `im` marker on arrival ---------------
    // Egress affordances (the ShareButton) tag outgoing URLs with ?im=<marker>.
    // On arrival we record the marker, then strip it so it never persists in the
    // address bar or compounds when the visitor re-shares the page.
    // NB: defined BEFORE posthog.init() — init() invokes the `loaded` callback
    // synchronously, which calls captureIngress(); a `const` declared after init()
    // would still be in the temporal dead zone at that point (ReferenceError).
    const captureIngress = () => {
      const url = new URL(window.location.href);
      const marker = url.searchParams.get('im');
      if (marker) {
        posthog.capture('ingress', {
          marker,
          path: url.pathname,
          referrer: document.referrer || null,
        });
        url.searchParams.delete('im');
        const cleaned = url.pathname + url.search + url.hash;
        window.history.replaceState(null, '', cleaned);
      } else if (
        !document.referrer &&
        performance.getEntriesByType('navigation')[0]?.type === 'navigate'
      ) {
        // Untagged direct arrival on a deep page ≈ bookmark / typed URL / return.
        posthog.capture('ingress', {marker: 'direct_or_bookmark', path: url.pathname});
      }
    };

    posthog.init(posthogKey, {
      api_host: posthogHost,
      // Pageviews are driven manually (Docusaurus is a SPA; the default only
      // fires on hard loads). Pageleave gives time-on-page / read time + bounce.
      capture_pageview: false,
      capture_pageleave: true,
      // Broad automatic capture: every click/link incl. footer, navbar,
      // edit-page, social icons — no per-element code. Outbound (external) link
      // clicks are captured by autocapture automatically.
      autocapture: true,
      person_profiles: 'identified_only',
      autocapture_exceptions: true,
      // PostHog drops events from automated/bot user agents (e.g. Playwright),
      // silently — capture() returns undefined. Only in an explicit test build
      // (POSTHOG_TEST_MODE=1) do we opt out of the UA filter so e2e can verify
      // events actually reach ingestion. Production stays filtered. See
      // ./posthog-issues.md ISSUE-001.
      opt_out_useragent_filter: !!posthogTestMode,
      loaded: (ph) => {
        // Expose for debugging / e2e validation and fire the first pageview once
        // we know the instance is ready.
        window.posthog = ph;

        // ---- Internal-traffic tagging (B1: opt-in super property) -------------
        // Visiting any page with ?internal=1 once persistently marks THIS browser
        // as internal: localStorage remembers it, and register() pins is_internal
        // onto every subsequent event as a super property. PostHog's internal-user
        // filter (project 448205) then hides is_internal=true from reports. This
        // is the pre-sign-in layer; Phase D adds an email-keyed layer on top.
        const p = new URLSearchParams(window.location.search);
        if (p.get('internal') === '1') localStorage.setItem('bop_internal', '1');
        if (localStorage.getItem('bop_internal') === '1') {
          ph.register({is_internal: true});
          // Strip ?internal from the address bar so it neither persists nor
          // re-shares (mirrors the `im`-marker strip below).
          if (p.get('internal') !== null) {
            const url = new URL(window.location.href);
            url.searchParams.delete('internal');
            window.history.replaceState(
              null,
              '',
              url.pathname + url.search + url.hash,
            );
          }
        }

        ph.capture('$pageview');
        // Ingress attribution: read (+ strip) the `im` marker on first load. Run
        // after the first $pageview so the landing pageview isn't suppressed by
        // the strip's replaceState. See src/ingress-attribution-plan.md.
        captureIngress();

        // ---- Identity (Phase D): promote signed-in readers to real persons ----
        // The Cloudflare Worker behind Access vends the signed-in identity at
        // /api/me (validated against the team JWKS). With a valid Access JWT it
        // returns {email}; we then identify() the visitor (person_profiles is
        // 'identified_only', so this is what promotes an anonymous visitor to a
        // real person) and, if that email is on the internal-tester roster,
        // register is_internal so PostHog's internal-user filter hides our own
        // traffic. Anonymous visitors get a 401 (Access redirects before the
        // Worker runs) and no-op here. On localhost there is no Worker: the
        // dev server answers /api/me with a 200 + the SPA fallback HTML, so
        // r.json() throws a SyntaxError that the .catch swallows — the visitor
        // stays anonymous either way. See src/internal-testers.ts + the
        // premium-content-gating design.
        fetch('/api/me', {credentials: 'include'})
          .then((r) => (r.ok ? r.json() : null))
          .then((d) => {
            if (!d?.email) return;
            ph.identify(d.email);
            if (isInternalTester(d.email)) ph.register({is_internal: true});
          })
          .catch(() => {}); // localhost / anon / network: silently stay anonymous
      },
    });

    // ---- Scroll depth: fire 25/50/75/100% milestones once per page ----------
    let reached = new Set();
    const checkScroll = () => {
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - doc.clientHeight;
      if (scrollable <= 0) return;
      const pct = Math.round((doc.scrollTop / scrollable) * 100);
      [25, 50, 75, 100].forEach((m) => {
        if (pct >= m && !reached.has(m)) {
          reached.add(m);
          posthog.capture('scroll depth', {depth: m, path: location.pathname});
        }
      });
    };
    window.addEventListener('scroll', checkScroll, {passive: true});

    // ---- Detect client-side route changes (patch history) -------------------
    // Compare on PATHNAME (not full href) so the ingress `im`-strip — which calls
    // replaceState to change only the query string — does not register as a new
    // route and double-fire $pageview.
    let last = window.location.pathname;
    const onRouteChange = () => {
      if (window.location.pathname !== last) {
        last = window.location.pathname;
        reached = new Set(); // reset scroll milestones for the new page
        posthog.capture('$pageview');
        captureIngress(); // read/strip any ?im= marker on SPA navigations too
        requestAnimationFrame(checkScroll); // handle short / pre-scrolled pages
      }
    };
    const wrap = (fn) => function () {
      const r = fn.apply(this, arguments);
      onRouteChange();
      return r;
    };
    history.pushState = wrap(history.pushState);
    history.replaceState = wrap(history.replaceState);
    window.addEventListener('popstate', onRouteChange);

    // ---- Egress signals: bookmark intent + generic copy --------------------
    // Bookmark intent: the browser owns ⌘D/Ctrl+D and snapshots the address bar,
    // so we CANNOT tag the bookmarked URL — we only log the intent. No
    // preventDefault, no URL mutation (the native bookmark proceeds untouched).
    // See src/ingress-attribution-plan.md.
    window.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'd') {
        posthog.capture('bookmark_intent', {path: window.location.pathname});
      }
    });

    // Generic copy: capture that a copy happened, but DO NOT mutate the clipboard
    // payload (would corrupt copied code blocks / quotes). Only the ShareButton's
    // explicit copy-link control writes a tagged URL.
    document.addEventListener('copy', () => {
      const hasSelection = !!(document.getSelection()?.toString());
      posthog.capture('egress_copy', {path: window.location.pathname, hasSelection});
    });
  }
}
