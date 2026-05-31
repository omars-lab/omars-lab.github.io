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

if (ExecutionEnvironment.canUseDOM) {
  const {posthogKey, posthogHost, posthogTestMode} = siteConfig.customFields || {};
  if (posthogKey) {
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
        ph.capture('$pageview');
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
    let last = window.location.href;
    const onRouteChange = () => {
      if (window.location.href !== last) {
        last = window.location.href;
        reached = new Set(); // reset scroll milestones for the new page
        posthog.capture('$pageview');
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
  }
}
