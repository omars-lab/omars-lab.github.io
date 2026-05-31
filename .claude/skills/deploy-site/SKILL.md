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
   silently no-ops in the deployed bundle. Always `source .env` first.
2. **`make deploy` runs `make secret-scan` first** — a leaked secret aborts deploy.
3. **MDX content bugs fail the build late** (during SSR), e.g. bare `<br>` (use
   `<br/>`) or unescaped `{word}` in `.mdx` (wrap in backticks). Run `make check`
   and a full build before deploying. See the `author-blog-post` skill.
4. Deploy publishes to the `gh-pages` branch via `yarn deploy` (USE_SSH, GIT_USER).

## Procedure

Run from the repo root.

```bash
# 1. Load build-time env (PostHog keys etc.) — REQUIRED for analytics.
set -a; source .env; set +a
test -n "$POSTHOG_KEY" && echo "PostHog: enabled" || echo "PostHog: DISABLED (no key)"

# 2. Secret scan (also runs automatically inside `make deploy`).
make secret-scan

# 3. Clean build — this is the real gate; fix any MDX/SSR errors before deploying.
( cd bytesofpurpose-blog && yarn build )

# 4. Deploy to GitHub Pages (gh-pages branch).
make deploy
```

`make deploy` already chains the secret scan + `yarn deploy`. Use the explicit
steps above when you want to validate the build first (recommended), or just
`source .env && make deploy` for a quick ship.

## Post-deploy verification

Use the `validate-deployment` skill, or inline:

```bash
# Public + reachable (200, no Cloudflare Access redirect):
curl -sS -I https://blog.bytesofpurpose.com | grep -iE '^HTTP|www-authenticate|location'

# PostHog beacon present in the live bundle:
curl -s https://blog.bytesofpurpose.com | grep -c 'posthog' && echo "posthog referenced in HTML/bundle"
```

GitHub Pages can take 1–2 minutes to propagate after `make deploy`.
