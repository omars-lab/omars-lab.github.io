---
name: setup-posthog
description: Set up or repair PostHog analytics for the Bytes of Purpose blog — obtain and place the four PostHog credentials (project key, host, personal API key, project ID), wire tracking, and validate events reach ingestion. Use when configuring PostHog from scratch, fixing missing keys, or enabling server-side stats readback.
---

# Set up PostHog analytics for the blog

PostHog is wired into the Docusaurus site via `src/posthog.js` (client module) +
`docusaurus.config.js` `customFields`. This skill covers getting the credentials and
validating the integration. See `bytesofpurpose-blog/src/posthog-integration-plan.md`
(what/why) and `posthog-issues.md` (gotchas & fixes).

## The four values (and exactly where to get each)

All live in the **repo-root `.env`** (gitignored). PostHog Cloud **US**.

| `.env` var | What it is | Where to get it |
|---|---|---|
| `POSTHOG_KEY` | Project API key (`phc_…`). **Public, write-only** — safe to ship in the client bundle. Used for tracking. | PostHog → **Settings → Project** → "Project API Key". |
| `POSTHOG_HOST` | Ingestion host. | `https://us.i.posthog.com` (US cloud). EU: `https://eu.i.posthog.com`. |
| `POSTHOG_PERSONAL_API_KEY` | Personal API key (`phx_…`). **Secret** — read scope, for the stats query API. | PostHog → top-right avatar → **Settings → Personal API keys** → **Create personal API key** → scopes: **Query: Read** (+ **Project: Read**) → copy once (shown only once). |
| `POSTHOG_PROJECT_ID` | Numeric project id, for the query API URL. | PostHog → **Settings → Project** → "Project ID" (a number, e.g. `12345`). |
| `POSTHOG_API_HOST` | API host for stats (NOT the ingestion host). | `https://us.posthog.com` (US). EU: `https://eu.posthog.com`. |

> Distinction that trips people up: `POSTHOG_HOST` (`us.i.posthog.com`) is for event
> **ingestion**; `POSTHOG_API_HOST` (`us.posthog.com`) is for the **query/stats** API.

### Quick path
```bash
# placeholders are pre-seeded in .env — open and fill the two FILL_ME_IN values:
code .env          # fill POSTHOG_PERSONAL_API_KEY and POSTHOG_PROJECT_ID
```

## Validate (events actually reach PostHog)

```bash
make test-posthog   # builds w/ POSTHOG_TEST_MODE=1, serves, Playwright asserts
                    # real POSTs to us.i.posthog.com (footer click, pageview, scroll)
```
Why test mode: PostHog's bot filter silently drops events from automated browsers
(Playwright) — `capture()` returns undefined. `POSTHOG_TEST_MODE=1` →
`opt_out_useragent_filter: true` so e2e can verify. Production never sets it.
(Full story: `posthog-issues.md` ISSUE-002.)

## Read stats back (server-side confirmation)

Needs `POSTHOG_PERSONAL_API_KEY` + `POSTHOG_PROJECT_ID`:
```bash
python3 .claude/skills/manage-cloudflare-access/posthog_stats.py daily --days 1
python3 .claude/skills/manage-cloudflare-access/posthog_stats.py pages --days 7
```

## Tracking is build-time

`POSTHOG_KEY`/`POSTHOG_HOST` are read by `docusaurus.config.js` during `yarn build`.
If unset, analytics silently no-ops. The `deploy-site` skill `source`s `.env` first
for exactly this reason. Production CSP must allow `connect-src https://us.i.posthog.com`
(and `https://us-assets.i.posthog.com` for the bundle) — verify after deploy.
