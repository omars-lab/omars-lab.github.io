---
name: deploy-site
description: Build and deploy the Bytes of Purpose blog (Docusaurus → GitHub Pages at blog.bytesofpurpose.com), with the secret scan, PostHog env injection, and post-deploy public/200 verification. Use when asked to deploy, publish, or ship the blog/site.
---

# Deploy the Bytes of Purpose blog

Deploys the Docusaurus site to GitHub Pages (`gh-pages` branch), served at
`https://blog.bytesofpurpose.com` via CNAME. The blog is **public** (Cloudflare
Access bypass app); see the `manage-cloudflare-access` skill if that changes.

## Critical gotchas (why this skill exists)

1. **PostHog needs env at BUILD time.** `POSTHOG_KEY` / `POSTHOG_HOST` are read by
   `docusaurus.config.js` during `yarn build`. If they aren't exported, analytics
   silently no-ops in the deployed bundle.
   **🔴 Do NOT `source .env`.** Some values contain shell-special chars (`&`, etc.)
   that make `source .env` fail with a parse error — and it fails *silently for the
   vars after the bad line*, leaving `POSTHOG_KEY` empty. This bit a real deploy
   (2026-06-01). Extract per-var instead (the pattern `make test-posthog` uses), and
   **hard-fail if the key is empty** rather than shipping an analytics-less build.
2. **`POSTHOG_TEST_MODE` must NEVER be set for a production deploy.** It disables
   PostHog's bot filter (only for e2e). Explicitly `unset` it before building.
3. **`make deploy` runs `make secret-scan` first** — a leaked secret aborts deploy.
   It is also **fail-closed for premium** (secure-by-default tenet, see CLAUDE.md):
   `docusaurus deploy` REBUILDS (it ignores a prebuilt `build/`), so `make deploy` now
   exports `STATICRYPT_PASSPHRASE` + `POSTHOG_KEY`/`POSTHOG_HOST` from `.env` into that
   rebuild automatically, **ABORTS** if any `premium: true` doc exists while the
   passphrase is empty (never ships cleartext premium by omission), and **re-runs V5**
   on the shipped build as a post-deploy gate. So a bare `make deploy` is safe — you no
   longer hand-export the passphrase (the manual `export` below is legacy/explicit-build
   only).
3a. **Premium content needs `STATICRYPT_PASSPHRASE` at BUILD time, a CACHE-BUSTED build,
   and a BLOCKING verify gate before publish.** `premium: true` docs are encrypted at
   MDX-compile by `plugins/rehype-premium-encrypt.js`, which reads `STATICRYPT_PASSPHRASE`
   (gitignored `.env`; MUST equal the Worker's `PREMIUM_PASSPHRASE` secret). If the
   passphrase is unset the build leaves premium bodies in CLEAR.
   **🔴 CACHE GOTCHA (dangerous):** webpack's `node_modules/.cache` + `.docusaurus` can
   serve a premium doc's STALE compiled output, so `rehype-premium-encrypt.js` never
   re-runs → no `static/premium/<id>.json` sidecar → a naive `yarn build` looks done while
   it would ship PLAINTEXT. **Always clear `node_modules/.cache` + `.docusaurus` before an
   encrypted build.** Use the dedicated **`make build-premium`** target — it clears both
   caches, requires `STATICRYPT_PASSPHRASE`, builds, and runs V5; it is the production
   build path whenever any doc is premium. (V5 also catches the stale-cache case: a missing
   sidecar → non-zero exit → deploy aborts.) After building you MUST run
   `node bytesofpurpose-blog/scripts/verify-premium-encrypted.js` (V5) — `make build-premium`
   does this for you — it scans the built output and **exits non-zero (deploy aborts)** if
   any `premium: true` body's plaintext is present in the HTML or JS chunks, or a sidecar is
   missing. Never skip it. (It also runs as a pre-push hook.) The deploy token also needs
   `Workers Scripts: Edit` + `Workers Routes: Edit` for the Worker deploy — see
   `manage-cloudflare-access`.
4. **MDX content bugs fail the build late** (during SSR), e.g. bare `<br>` (use
   `<br/>`) or unescaped `{word}` in `.mdx` (wrap in backticks). Run `make check`
   and a full build before deploying. See the `author-blog-post` skill.
5. Deploy publishes to the `gh-pages` branch via `yarn deploy` (USE_SSH, GIT_USER).

## Procedure

Run from the repo root.

**Run extraction + build + deploy in ONE shell** — env vars set in one Bash call
don't persist to the next.

```bash
# 1. Load build-time env per-var (NOT `source .env` — see gotcha #1).
xenv() { grep -E "^$1=" .env | head -1 | cut -d= -f2- | sed 's/[[:space:]]*#.*//' | tr -d ' "'\'''; }
export POSTHOG_KEY="$(xenv POSTHOG_KEY)"
export POSTHOG_HOST="$(xenv POSTHOG_HOST)"
export STATICRYPT_PASSPHRASE="$(xenv STATICRYPT_PASSPHRASE)"   # premium encrypt (gotcha #3a)
unset POSTHOG_TEST_MODE                      # gotcha #2: never in prod
# Hard-fail rather than silently ship an analytics-less bundle:
[ -n "$POSTHOG_KEY" ] || { echo "❌ POSTHOG_KEY empty — aborting"; return 1 2>/dev/null || exit 1; }
echo "PostHog: enabled (${POSTHOG_KEY:0:8}…), TEST_MODE off"

# 2. Secret scan (also runs automatically inside `make deploy`).
make secret-scan

# 3. Cache-busted ENCRYPTED build + V5 gate in one target — the real gate; fix any MDX/SSR
#    errors before deploying. `make build-premium` clears node_modules/.cache + .docusaurus
#    (the cache gotcha — see #3a), requires STATICRYPT_PASSPHRASE, builds (premium bodies
#    encrypted at compile time), then runs the blocking V5 gate. If there is NO premium
#    content you can use a plain `( cd bytesofpurpose-blog && yarn build )` instead.
make build-premium \
  || { echo "❌ build or premium gate failed — aborting deploy"; return 1 2>/dev/null || exit 1; }

# 4. Deploy to GitHub Pages (gh-pages branch).
make deploy
```

`make deploy` already chains the secret scan + `yarn deploy`. The explicit build in
step 3 lets you catch MDX/SSR errors before publishing (recommended). For a quick
ship, steps 1+4 in one shell still suffice — just never skip the per-var extraction.

## Post-deploy verification

**Use the `validate-deployment` skill** — it retries through propagation lag and
asserts the build you just shipped is actually live:

```bash
bash .claude/skills/validate-deployment/check.sh https://blog.bytesofpurpose.com "$(git rev-parse --short HEAD)"
```

It checks: 200/public, the `phc_` key in the **JS bundle** (not the HTML — PostHog
loads from a chunk, so `grep posthog index.html` returns 0 even on a good build),
the `og:image` social card resolves to 200, homepage JSON-LD parses, and
`origin/gh-pages` was built from your commit.

GitHub Pages + Cloudflare can take **1–2 minutes** to propagate, and propagation is
**partial** (HTML can update while a new asset path still 404s on the same edge).
A single immediate curl showing the old build right after deploy is **expected** —
that's why validation retries. Don't report a stale read as a failed deploy.
