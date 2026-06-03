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

Needs `POSTHOG_PERSONAL_API_KEY` (the `phx_` personal key — **not** the `phc_`
project key) + `POSTHOG_PROJECT_ID`. Two ways:

**Official PostHog CLI** (authoritative — see the `query-posthog` skill for full
usage). The query command lives under `exp` and is experimental:
```bash
npx --yes @posthog/cli@latest --version          # first run downloads it
# map .env → CLI env, then:
POSTHOG_CLI_API_KEY=$phx POSTHOG_CLI_PROJECT_ID=$pid POSTHOG_CLI_HOST=$host \
  npx --yes @posthog/cli@latest exp query run \
  "SELECT event, count() FROM events WHERE timestamp > now() - INTERVAL 7 DAY GROUP BY event"
```

**No-download alternative** (raw Query API via curl/python):
```bash
python3 .claude/skills/manage-cloudflare-access/posthog_stats.py daily --days 1
python3 .claude/skills/manage-cloudflare-access/posthog_stats.py pages --days 7
```

> Gotcha: a `phc_` key in the personal-key slot returns
> `401 Personal API key … is invalid`. Personal keys start with `phx_` and are
> created under **Settings → Personal API keys** (different page from the project key).

## Internal-user filtering (keep your own + testers' traffic out of the numbers)

PostHog drops bot UAs but has no native notion of "internal." We tag internal traffic
two ways and add matching **internal-user filters** in the project so reports exclude it.

**The two signals we emit** (both in `src/posthog.js` / `src/lib/auth.tsx`):

1. **`is_internal` super-property** — set when either holds:
   - the visitor opted in via **`?internal=1`** (a one-time per-browser marker:
     `posthog.js` reads it, persists `localStorage.bop_internal=1`, calls
     `ph.register({is_internal: true})`, then strips `internal` from the URL); or
   - a signed-in reader's email is on the **internal-tester roster**, which now
     lives **server-side in the Worker** (`workers/access-gate/src/index.ts`, const
     `INTERNAL_EMAILS`) — NOT in the public bundle. `/api/me` returns
     `{email, isInternal}`; `posthog.js` does `identify(email)` then
     `if (d.isInternal) ph.register({is_internal: true})`. (Moved out of the old
     `src/internal-testers.ts`, which leaked the emails publicly; the flag is now
     server-authoritative + unspoofable. Add a tester by editing the Worker const +
     `wrangler deploy`.)
2. **`$host`** — PostHog's built-in property; on local dev it's `localhost` / `127.0.0.1`.

**Configure the filters (PostHog UI, project `448205`):**
Settings → Project → Product analytics → **Internal & test users** → add filters:
- `Host` (`$host`) **equals** `localhost` **or** `127.0.0.1` — strips dev traffic.
- `is_internal` **equals** `true` — strips the author + tagged testers.

These are *report* filters (the events are still ingested; they're hidden from insights
by default). Confirm with `query-posthog`: a tagged event has `properties.is_internal=true`;
a fresh isolated browser has no such prop. The `?internal=1` convention is the quick
pre-sign-in layer; the tester-list is the durable post-sign-in layer.

## Tracking is build-time

`POSTHOG_KEY`/`POSTHOG_HOST` are read by `docusaurus.config.js` during `yarn build`.
If unset, analytics silently no-ops. Production CSP must allow
`connect-src https://us.i.posthog.com` (and `https://us-assets.i.posthog.com` for the
bundle) — verify after deploy.

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Query API → `401 "Personal API key … is invalid"` | Pasted the **project** key (`phc_`) into `POSTHOG_PERSONAL_API_KEY`. | Use a **personal** key (`phx_`) from Settings → Personal API keys (scope Query: Read). |
| Build runs but no analytics on the live/served site | `POSTHOG_KEY` empty at build time. | Confirm it's in the bundle: `grep -rl "phc_" bytesofpurpose-blog/build/assets/js/main.*.js`. |
| `source .env` leaves `POSTHOG_KEY` empty even though it's in the file | Earlier `.env` values contain shell-special chars (`!`, `&`, spaces, parens) that break `source`, blanking later vars. | Don't `source`; extract per-var: `grep -E '^POSTHOG_KEY=' .env \| cut -d= -f2- \| sed 's/[[:space:]]*#.*//' \| tr -d ' "'\'''`. (The `make test-posthog` target already does this.) |
| Events leave the browser but never appear in PostHog | Bot/UA filter drops automated-browser events. | Build with `POSTHOG_TEST_MODE=1` for e2e; for real traffic filter `properties.$browser_type != 'bot'`. See `posthog-issues.md` ISSUE-002. |
| `window.posthog` undefined in browser | Dynamic import raced hydration (old bug) or key unset. | Static import in `src/posthog.js` (fixed); ensure key is set. See ISSUE-001. |

Full debugging history: `bytesofpurpose-blog/src/posthog-issues.md`.
