---
name: manage-cloudflare-access
description: Administer Cloudflare Access for bytesofpurpose.com — list Access apps and policies, make a subdomain public or private, and pull PostHog visitor stats. Use when asked to make the blog (or any *.bytesofpurpose.com host) public/private, audit who can reach a subdomain, or report site traffic.
---

# Manage Cloudflare Access (bytesofpurpose.com)

Administers Cloudflare **Zero Trust Access** for the `bytesofpurpose.com` zone and
reports visitor stats from **PostHog**. `wrangler` cannot manage Access — these
scripts call the Cloudflare API directly.

## Credentials

All secrets live in the repo-root **`.env`** (gitignored — never commit it):

- `CF_API_TOKEN` — Cloudflare token scoped `Account: Access: Edit` (+ Zone DNS, Tunnel).
- `POSTHOG_PERSONAL_API_KEY`, `POSTHOG_PROJECT_ID`, `POSTHOG_API_HOST` — for stats.

The scripts auto-load `.env` from the repo root. The account id
(`e22f4531704a3141ddb150ac47eabc87`) is hardcoded in `cf_access.py`.

## Architecture you must understand before changing anything

A single **wildcard app `Private Site` (`*.bytesofpurpose.com`)** locks down every
subdomain to one allowed email. Public subdomains each have their **own** Access app
with a `bypass`/everyone policy that **overrides** the wildcard for that exact host.
There is no inheritance to delete — making a host public means *adding* a bypass app
for it; making it private means *removing* that app so it falls back under the wildcard.

> ⚠️ **Never delete or open up the `Private Site` wildcard app.** Doing so exposes
> every protected subdomain at once. `make-private` refuses to touch it.

## Commands

Run from the repo root.

### Cloudflare Access — `cf_access.py`

```bash
# List every Access app + its policies (wildcard is flagged)
python3 .claude/skills/manage-cloudflare-access/cf_access.py list

# Inspect one app (by subdomain label, full host, or app id)
python3 .claude/skills/manage-cloudflare-access/cf_access.py show blog

# Make a host PUBLIC — creates a bypass-everyone app scoped to that host
python3 .claude/skills/manage-cloudflare-access/cf_access.py make-public blog

# Make a host PRIVATE again — deletes its public app (falls back to wildcard).
# Refuses if the match is the wildcard itself.
python3 .claude/skills/manage-cloudflare-access/cf_access.py make-private blog
```

After a change, verify with curl — a public host returns `200` with no
`www-authenticate: Cloudflare-Access` header; a private one `302`s to
`*.cloudflareaccess.com`:

```bash
curl -sS -I https://blog.bytesofpurpose.com | grep -iE '^HTTP|www-authenticate|location'
```

### Visitor stats — `posthog_stats.py`

PostHog Cloud (US). Defaults to the `blog.bytesofpurpose.com` host; pass
`--host ''` for all sites or `--host art.bytesofpurpose.com` for another.

```bash
python3 .claude/skills/manage-cloudflare-access/posthog_stats.py stats --days 30
python3 .claude/skills/manage-cloudflare-access/posthog_stats.py pages --days 7
python3 .claude/skills/manage-cloudflare-access/posthog_stats.py daily --days 14
```

Tracking is wired into the blog via `bytesofpurpose-blog/src/posthog.js` (a
Docusaurus client module) and is inert until `POSTHOG_KEY` is set at build time.

## Current state (reference)

- `blog.bytesofpurpose.com` → **public** (app `Blog (Public)`, bypass everyone).
- Other public hosts: `www`, `site`, `art`, `mcp`, `analytics`, `coffee-house`.
- Everything else under `*.bytesofpurpose.com` → private (wildcard, one allowed email).
