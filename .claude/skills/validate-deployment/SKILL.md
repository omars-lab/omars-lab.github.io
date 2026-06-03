---
name: validate-deployment
description: Verify the live Bytes of Purpose blog after a deploy — confirms it is publicly reachable (HTTP 200, no Cloudflare Access login), serves the build you just shipped (right commit, PostHog key in the bundle, social card + JSON-LD resolve), retrying through GitHub Pages / Cloudflare propagation lag. Use after deploying, or when asked whether the site is up / public / tracking.
---

# Validate the live blog deployment

Post-deploy smoke checks for `https://blog.bytesofpurpose.com`. Pairs with the
`deploy-site` skill (deploy) and `manage-cloudflare-access` (public/private).

## Run

```bash
make validate-deployment          # wraps check.sh against the live blog
# or directly, with an optional URL + expected commit SHA:
bash .claude/skills/validate-deployment/check.sh https://blog.bytesofpurpose.com <sha>
```

The `make` target is the post-deploy step in the `deploy-site` flow (SHA defaults to
local HEAD). Run it right after `make deploy`.

## ⚠️ Why validation must retry, and check build-specific markers

GitHub Pages + Cloudflare serve the **old** build from cached edges for **1–2 min**
after a deploy, returning `HTTP 200` the whole time. So "200 + the word posthog
appears" is a **false success signal** — it passes on a stale edge. Worse,
propagation is **partial**: the HTML can update while a brand-new asset path (e.g. a
new `og:image`) still 404s on the same edge — observed firsthand on the 2026-06-01
deploy. The script therefore asserts markers unique to *this* deploy and **retries
~120s** before failing. A single immediate curl showing the old build right after
deploy is **expected**, not a failure.

## What it checks

1. **Reachable & public** — `HTTP 200` and NO `www-authenticate: Cloudflare-Access`
   header / no `302` to `*.cloudflareaccess.com` (that header means Access is back on).
2. **PostHog wired** — confirms the `phc_` project key is in the **main JS bundle**
   (`assets/js/main.*.js`), NOT the HTML. PostHog loads from a chunk, so grepping
   `index.html` for "posthog" returns 0 even on a good build (this fooled the old
   check). A missing key here means `POSTHOG_KEY` was empty at **build** time — the
   `.env` `source` trap (see `deploy-site`).
3. **Social card resolves** — `og:image` is present AND the image itself serves 200
   (retried — new asset paths lag the most). A 404 card = blank link previews.
4. **Structured data** — homepage JSON-LD (WebSite/Organization) is present and
   parses (a build regression can silently drop it).
5. **Which commit is live** — reads the source SHA from the `origin/gh-pages` deploy
   commit message and compares to the expected SHA, so "did my change actually ship?"
   is answerable. (`yarn deploy` force-pushes gh-pages but does NOT update your local
   gh-pages ref — always read `origin/gh-pages`.)
6. **Fresh-ish** — prints `last-modified` / CF cache age as a propagation sanity check.
7. **Premium hard-gate live & safe** (only if a premium demo page exists) — on the LIVE
   site: the premium body ships as **ciphertext** (build sentinel ABSENT from the page),
   the **passphrase is absent** from the live JS chunks, and **`/api/unlock-key` is gated**
   (302/401/403 to an anonymous request — never a public 200 that would vend the key to
   everyone). This is the live counterpart to the build-time V5 gate
   (`verify-premium-encrypted.js`): V5 proves the *build* is safe before shipping; this
   proves the *deployed* site is. See `manage-infrastructure` for the Worker/key plumbing.

## Deeper verification

- **Events actually firing:** run the Playwright spec — `cd bytesofpurpose-blog &&
  npx playwright test posthog-events` (intercepts PostHog requests). See the
  PostHog integration plan at `bytesofpurpose-blog/src/posthog-integration-plan.md`.
- **Events landing server-side:** `manage-cloudflare-access` skill →
  `posthog_stats.py daily --days 1` (subject to ingestion lag).
