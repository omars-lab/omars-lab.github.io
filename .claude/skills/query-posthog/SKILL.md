---
name: query-posthog
description: Query PostHog analytics for the blog using the official @posthog/cli (HogQL) — confirm events are landing, report visitors/pageviews/top pages/read-time, and debug ingestion. Use when asked to check analytics, verify events reached PostHog, or pull traffic numbers for bytesofpurpose.com.
---

# Query PostHog (official CLI)

Read-back and reporting for the blog's PostHog data using PostHog's **official CLI**
(`@posthog/cli`). This is the authoritative way to confirm events actually landed
(vs. the Playwright spec which only proves they left the browser). For wiring up
PostHog and obtaining keys, see the `setup-posthog` skill.

## Prerequisites

Credentials in the repo-root `.env` (gitignored):
- `POSTHOG_PERSONAL_API_KEY` — **personal** key, starts `phx_` (NOT the `phc_`
  project key — the project key returns 401 "Personal API key … is invalid").
- `POSTHOG_PROJECT_ID` — numeric (e.g. `448205`).
- `POSTHOG_API_HOST` — `https://us.posthog.com` (US cloud).

The CLI reads these via `POSTHOG_CLI_API_KEY` / `POSTHOG_CLI_PROJECT_ID` /
`POSTHOG_CLI_HOST`. Map them from `.env` (helper below).

## Install / run

No global install needed — run via npx (first run downloads it):

```bash
npx --yes @posthog/cli@latest --version
```

The query command is **experimental**: `posthog-cli exp query run "<HogQL>"`
(also `exp query check` to type-check, `exp query editor` for interactive). It prints
JSON-lines to stdout.

## Run a query (copy-paste)

```bash
cd <repo-root>
# Map .env → CLI env (strips inline comments/quotes/spaces). One line each so it
# works in any shell:
export POSTHOG_CLI_API_KEY=$(grep -E '^POSTHOG_PERSONAL_API_KEY=' .env | head -1 | cut -d= -f2- | sed 's/[[:space:]]*#.*//' | tr -d ' "'\''')
export POSTHOG_CLI_PROJECT_ID=$(grep -E '^POSTHOG_PROJECT_ID=' .env | head -1 | cut -d= -f2- | sed 's/[[:space:]]*#.*//' | tr -d ' "'\''')
export POSTHOG_CLI_HOST=$(grep -E '^POSTHOG_API_HOST=' .env | head -1 | cut -d= -f2- | sed 's/[[:space:]]*#.*//' | tr -d ' "'\''')

npx --yes @posthog/cli@latest exp query run "<HogQL query>"
```

## Useful queries

```sql
-- Confirm events are landing (by type, last 7 days)
SELECT event, count() AS n, max(timestamp) AS last_seen
FROM events WHERE timestamp > now() - INTERVAL 7 DAY
GROUP BY event ORDER BY n DESC LIMIT 25

-- Pageviews + unique visitors for the blog, last 30 days
SELECT count() AS pageviews, count(DISTINCT person_id) AS visitors
FROM events
WHERE event = '$pageview' AND properties.$host = 'blog.bytesofpurpose.com'
  AND timestamp > now() - INTERVAL 30 DAY

-- Top pages
SELECT properties.$pathname AS path, count() AS views
FROM events WHERE event = '$pageview' AND timestamp > now() - INTERVAL 7 DAY
GROUP BY path ORDER BY views DESC LIMIT 25

-- Daily trend
SELECT toDate(timestamp) AS day, count() AS views, count(DISTINCT person_id) AS visitors
FROM events WHERE event = '$pageview' AND timestamp > now() - INTERVAL 14 DAY
GROUP BY day ORDER BY day
```

## Confirming an integration change end-to-end

1. `make test-posthog` — proves events leave the browser to ingestion (Playwright).
2. Wait ~30–60s for ingestion, then run the "by type" query above — proves they
   **landed**. Test-mode events are tagged `$browser_type='bot'`; filter them out
   for real traffic: `AND properties.$browser_type != 'bot'`.

## Alternative (no npx download)

`posthog_stats.py` in the `manage-cloudflare-access` skill hits the same Query API
directly (curl/python) with `stats` / `pages` / `daily` subcommands — use it if you
prefer not to download the CLI.

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `unrecognized subcommand 'query'` | `query` is **not** top-level; it lives under `exp`. | Use `exp query run "<SQL>"` (also `exp query check` / `editor`). |
| `unrecognized subcommand 'SELECT …'` | Missing the `run` verb. | `exp query run "<SQL>"`. |
| `Couldn't find POSTHOG_CLI_API_KEY and POSTHOG_CLI_PROJECT_ID` | Env vars not exported (often a multi-line `sed` mapping that broke). | Use the one-line-per-var mapping in "Run a query" above; verify `echo $POSTHOG_CLI_API_KEY \| cut -c1-4` = `phx_`. |
| `401 authentication_failed … Personal API key … invalid` | Used the `phc_` project key, not a `phx_` personal key. | Create a personal key (Settings → Personal API keys, scope Query: Read). |
| Query returns 200 but **no rows / zeros** for recent events | Either nothing ingested yet (wait 30–60s) or you're counting bot test traffic. | Re-run after a beat; for real traffic add `AND properties.$browser_type != 'bot'`. |
| `source .env` blanks the keys | Earlier `.env` values contain shell-special chars. | Don't `source`; extract per-var (see the mapping block). |

## Caveats

- `exp query` is labelled experimental ("subject to change") by PostHog.
- The official CLI's main job is sourcemap/symbol uploads + `login`; querying lives
  under `exp`. If `exp query` disappears in a future version, fall back to
  `posthog_stats.py` / the raw Query API (`POST {host}/api/projects/{id}/query/`).
