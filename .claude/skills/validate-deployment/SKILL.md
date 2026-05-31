---
name: validate-deployment
description: Verify the live Bytes of Purpose blog after a deploy — confirms it is publicly reachable (HTTP 200, no Cloudflare Access login), serves the latest content, and has the PostHog analytics beacon. Use after deploying, or when asked whether the site is up / public / tracking.
---

# Validate the live blog deployment

Post-deploy smoke checks for `https://blog.bytesofpurpose.com`. Pairs with the
`deploy-site` skill (deploy) and `manage-cloudflare-access` (public/private).

## Run

```bash
bash .claude/skills/validate-deployment/check.sh
```

Optionally pass a URL: `bash check.sh https://blog.bytesofpurpose.com`

## What it checks

1. **Reachable & public** — `HTTP 200` and NO `www-authenticate: Cloudflare-Access`
   header / no `302` to `*.cloudflareaccess.com` (that header means Access is back on).
2. **PostHog wired** — the served HTML/bundle references `posthog` (analytics live).
3. **Fresh-ish** — prints the `last-modified` / CF cache age so you can sanity-check
   that the new deploy propagated (GitHub Pages + CF can lag 1–2 min).

## Deeper verification

- **Events actually firing:** run the Playwright spec — `cd bytesofpurpose-blog &&
  npx playwright test posthog-events` (intercepts PostHog requests). See the
  PostHog integration plan at `bytesofpurpose-blog/src/posthog-integration-plan.md`.
- **Events landing server-side:** `manage-cloudflare-access` skill →
  `posthog_stats.py daily --days 1` (subject to ingestion lag).
