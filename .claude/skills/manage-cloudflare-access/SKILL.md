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
  - For the **IdP read** commands (`list-idps`/`show-idp`) and the LinkedIn-policy
    `create-gated-app`, the token also needs **`Access: Organizations, Identity
    Providers, and Groups: Read`**. Without it those calls return
    `code 10000 Authentication error` while `list`/`make-public` still work
    (they only need `Access: Apps: Edit`). Add the scope in the Cloudflare
    dashboard → My Profile → API Tokens.
  - For deploying the **access-gate Worker** (`wrangler deploy`), the token also
    needs **`Account: Workers Scripts: Edit`** (+ the route needs
    `Zone: Workers Routes: Edit`). The token has neither today — add them when
    you set up the Worker.
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

# List / inspect Zero Trust login methods (IdPs). Read-only.
# (needs the Access: Identity Providers: Read scope — see Credentials)
python3 .claude/skills/manage-cloudflare-access/cf_access.py list-idps
python3 .claude/skills/manage-cloudflare-access/cf_access.py show-idp LinkedIn

# Create a PATH-SCOPED gated app (protects the Worker's /api/* endpoints) and
# print its AUD tag (→ the Worker's POLICY_AUD). Default policy allows any
# LinkedIn-authenticated user. This is NOT make-public — it gates a path.
python3 .claude/skills/manage-cloudflare-access/cf_access.py \
    create-gated-app blog.bytesofpurpose.com/api/me --policy linkedin-any
python3 .claude/skills/manage-cloudflare-access/cf_access.py \
    create-gated-app blog.bytesofpurpose.com/api/unlock-key --policy linkedin-any
```

## LinkedIn sign-in + the premium key-vending Worker (path-scoped Access)

The premium-content feature adds a tiny Cloudflare Worker (`workers/access-gate/`,
deployed with `wrangler`) sitting behind a **path-scoped** Access app that allows
any **LinkedIn-authenticated** user. The Worker vends identity (`/api/me`) and the
StatiCrypt decryption passphrase (`/api/unlock-key`). See the
*premium-content-gating* system design and `manage-premium-content` for the why.

This is a new *shape* for the blog (first path-scoped, IdP-policy, Worker-backed
app — the rest is wildcard-private + per-host-bypass), but **not new for the
account**: the **LinkedIn OIDC IdP already exists** and is in active use.

### ✅ The LinkedIn IdP is ALREADY set up — no dashboard needed for Access

The sibling infra repo `private-site` already configured a LinkedIn login method
on **this same Cloudflare account** (`e22f4531704a3141ddb150ac47eabc87`): its
`*.bytesofpurpose.com` "Private Site" app has a `LinkedIn Login` policy requiring
`login_method id = cf942d89-9ecb-49a0-909c-f46dcdd9f9e8`
(see `private-site/agent/sync-access-emails.sh`). So **steps that used to be
"manual dashboard"** (create the LinkedIn dev app, add the CF login method) are
**already done**.

`create-gated-app` reuses that IdP id. Listing IdPs needs the
`Access: Identity Providers: Read` scope (this token lacks it → `code 10000`), but
we don't need to list — `resolve_linkedin_idp_id()` reads the id off an existing
app policy using only `Access: Apps: Edit` (which the token has), with the known
id as a final fallback. **So the whole Access side is CLI-only, with the current
token.** Verified live 2026-06-02.

Run it (idempotent; prints the AUD → the Worker's `POLICY_AUD`). Pass **both
paths in ONE call** so they share a single app + single AUD (the Worker validates
against one `POLICY_AUD`):

```bash
python3 .claude/skills/manage-cloudflare-access/cf_access.py \
    create-gated-app blog.bytesofpurpose.com/api/me \
                     blog.bytesofpurpose.com/api/unlock-key --policy linkedin-any
```

**LIVE (created 2026-06-02):** one app `Access Gate (blog /api/*)`
(id `844eef3a-a277-44a5-8f28-8c3a634c8d07`) covers both paths;
`POLICY_AUD = fe391e80ed513298c3bd38a0c10765691337d568cf495c09d54d631a63555326`
(already written into `workers/access-gate/wrangler.toml`). Verified:
`curl -I https://blog.bytesofpurpose.com/api/me` → `302` to the LinkedIn login.
Cleanup helper: `cf_access.py delete-app <app-id>` (refuses the wildcard).

### Deploy the Worker

```bash
cd workers/access-gate
# 1. Fill TEAM_DOMAIN + POLICY_AUD in wrangler.toml (POLICY_AUD = the AUD from step 3).
# 2. Set the passphrase secret (MUST equal STATICRYPT_PASSPHRASE used to encrypt):
npx wrangler secret put PREMIUM_PASSPHRASE
# 3. Deploy (needs Workers Scripts: Edit + Workers Routes: Edit on CF_API_TOKEN):
npx wrangler deploy
```

### Verify the gate

```bash
# Unauthenticated → Access 302s to the login flow before the Worker runs:
curl -sS -I https://blog.bytesofpurpose.com/api/me | grep -iE '^HTTP|location'
# After signing in with LinkedIn in a browser, from that origin's console:
#   await (await fetch('/api/me', {credentials:'include'})).json()        → {email,...}
#   await (await fetch('/api/unlock-key', {credentials:'include'})).json() → {passphrase}
# curl WITHOUT the CF_Authorization cookie → 401 (or 302 from Access).
```

The Worker's JWT gate (verify signature vs team JWKS, check `aud`==POLICY_AUD,
require an `email` claim) is unit-tested in `workers/access-gate/test/worker.test.mjs`
(`npm test` there) — runs the real `jose` verify with a locally-minted keyset.

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
  - `coffee-house` is already `Public - StatiCrypt` (bypass everyone; StatiCrypt
    handles the gating client-side) — a precedent that StatiCrypt is already used
    on this account.
- Everything else under `*.bytesofpurpose.com` → private (wildcard, one allowed email).
- **Path-scoped LinkedIn-gated apps** for `blog.bytesofpurpose.com/api/me` and
  `/api/unlock-key` (the premium key-vending Worker) — created via
  `create-gated-app`. These gate a PATH while the rest of the blog host stays
  public; only `/api/*` requires sign-in.
