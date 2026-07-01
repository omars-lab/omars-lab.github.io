---
name: verify-prod-deployment
description: Browser-based post-deploy verification for the live blog (blog.bytesofpurpose.com). The complement to validate-deployment (curl smoke checks); this drives a REAL browser to catch RENDER bugs the curl checks are blind to (a page can serve 200 with the right commit while a component renders blank, e.g. the studio-house door once shipped at opacity 0 from a prod-only CSS cascade race and every curl check passed). It FIRST waits for the CDN to propagate the exact bundle you just built (polls the live index's styles.<hash>.css until it matches build/ and serves 200; GitHub Pages + Cloudflare serve the OLD build for 1-3 min post-deploy), THEN confirms the deployed changes actually render, THEN watches for regressions (console errors + failed requests) on every page it loads, filtering the KNOWN-BENIGN noise (the CF Access /api/me CORS probe, the dmn_chk cookie, Infima vendor-prefixed CSS warnings). Run it AFTER `make deploy`, after validate-deployment. Use when verifying a deploy landed, debugging "the fix isn't live yet", or checking a deploy didn't regress a page.
---

# Verify a production deployment (in a browser)

`validate-deployment/check.sh` confirms the deploy is **reachable + correct commit + premium-gated**
via curl. It cannot see whether the page actually **renders**; a 200 with the right commit can still
ship a blank component. This skill is the browser layer: it waits for propagation, confirms the
**deployed change is really live**, and watches for regressions on the pages it visits.

> Real example this exists for: the studio-house centre **door** shipped at `opacity: 0` (a prod-only
> CSS equal-specificity cascade race). Every curl check passed; the arch was empty. A browser render
> check catches it; curl never will.

## Run it (AFTER `make deploy` + validate-deployment)

From the blog dir (so `@playwright/test` resolves); the local `build/` must be the one you just
deployed (do NOT rebuild in between, or the bundle-hash match will be wrong):

```bash
cd bytesofpurpose-blog
node scripts/verify-prod-deployment.mjs --url https://blog.bytesofpurpose.com --build build
```

Exit codes: **0** all good · **2** a verification failed · **3** propagation never completed in ~4min
(deploy may not have landed, or CDN is unusually slow; re-run in a few minutes).

Flags: `--url` (default the live site) · `--build` (default `build`) · `--expect-css styles.<hash>.css`
(skip auto-detecting the bundle from `build/`, e.g. when verifying a deploy you didn't build locally).

## What it asserts (in order)

1. **Propagation wait (the key step).** GitHub Pages + Cloudflare serve the OLD hashed bundles from
   cached edges for **1-3 min** after a deploy, returning 200 the whole time. So it polls the live
   `index.html` until the `styles.<hash>.css` it references **matches the hash in your local `build/`**
   AND that bundle serves 200 on the edge. Only then does it verify; otherwise it'd be testing the
   stale build. (Observed ~170s in one real deploy; the poll window is ~4 min.)
2. **Deployed change is live.** Because step 1 gates on YOUR build's bundle hash, a green run proves
   the exact assets you shipped are the ones serving; not a cached prior deploy.
3. **Render checks.** Loads `/`, `/craft`, `/handbook`, `/changelog` and asserts each has a non-empty
   `<title>` (rendered, not a blank error page). The homepage **hero** is sampled over ~14s: at every
   moment the studio house must show its **door OR a scene** (never both layers at opacity 0 = the
   empty-arch regression). Navbar presence is checked.
4. **Regression watch.** Every page visited feeds a console-error + failed-request collector; a
   non-benign entry FAILS the run. So a NEW error on a page it happens to load is caught, not just the
   thing you changed. Add surfaces to the `pages` array as the site grows.

## KNOWN-BENIGN console noise (do NOT chase these; the script already ignores them)

These appear on a normal anonymous prod load and are NOT site errors (documented so they're not
re-investigated every deploy):

- **Cloudflare Access**; the premium sign-in flow probes `/api/me` against `bytesofpurpose.cloudflareaccess.com`;
  the browser can't read that cross-origin response (`CORS header 'Access-Control-Allow-Origin' missing`,
  status 200) and the `dmn_chk_*` cookie is rejected for the apex domain. The app handles the failure
  (the control stays the "Sign in" button); this is the expected anonymous path, not a bug.
- **Infima vendor-prefixed CSS**; `-webkit-text-size-adjust`, `line-clamp`, `text-size-adjust`,
  "Ruleset ignored due to bad selector": Firefox logs "unknown property / declaration dropped". Cosmetic,
  from a dependency's bundled CSS.
- **Third-party analytics chatter**; `_ga_*` cookie expires overwritten, Reporting-Header JSON.

The allowlist lives in `BENIGN` at the top of `scripts/verify-prod-deployment.mjs`. If a genuinely new
benign source appears, add it there WITH a comment saying why it's safe; never widen it to silence a
real error.

## Where it fits

`deploy-site` (ships it) → `validate-deployment` (curl: 200/Access/PostHog/premium/commit) →
**verify-prod-deployment** (browser: propagation wait + render + regression watch). Run all three; this
one is last because it needs the propagated build. Pairs with `maintain-homepage-hero` (the hero it
render-checks) and the Playwright e2e (which tests the same surfaces pre-deploy on a build).
