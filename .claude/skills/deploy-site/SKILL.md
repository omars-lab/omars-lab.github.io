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
unset POSTHOG_TEST_MODE                      # gotcha #2: never in prod
# Hard-fail rather than silently ship an analytics-less bundle:
[ -n "$POSTHOG_KEY" ] || { echo "❌ POSTHOG_KEY empty — aborting"; return 1 2>/dev/null || exit 1; }
echo "PostHog: enabled (${POSTHOG_KEY:0:8}…), TEST_MODE off"

# 2. Secret scan (also runs automatically inside `make deploy`).
make secret-scan

# 3. Clean build — the real gate; fix any MDX/SSR errors before deploying.
( cd bytesofpurpose-blog && yarn build )

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
