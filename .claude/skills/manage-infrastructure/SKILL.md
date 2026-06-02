---
name: manage-infrastructure
description: Guided first-time provisioning of the premium-content infrastructure for blog.bytesofpurpose.com — scope the CF_API_TOKEN, set the StatiCrypt passphrase in .env, deploy the access-gate Worker with wrangler, and verify the key-vend end-to-end. Use when standing up (or re-provisioning) the premium gate's server side, or when /api/unlock-key 404s / returns no passphrase.
---

# Manage Infrastructure (premium-gating Worker provisioning)

This skill is the **step-by-step runbook** for the *server side* of premium content
gating: the Cloudflare Worker (`workers/access-gate/`) that vends the StatiCrypt
passphrase to LinkedIn-signed-in readers. It complements two skills that own
neighbouring concerns — keep them in lockstep, don't duplicate:

- **`manage-cloudflare-access`** owns Access *apps/policies* (the path-scoped gate in
  front of `/api/*` is already created there — `Access Gate (blog /api/*)`, AUD wired
  into `wrangler.toml`). This skill assumes that gate exists and does NOT re-create it.
- **`manage-premium-content`** owns the *editorial* policy (what's premium) and
  **`deploy-site`** owns the encrypted-build/deploy. This skill is purely the Worker +
  token + secret provisioning that those depend on.

Why a separate skill: provisioning is a **one-time, multi-actor runbook** (dashboard +
`.env` + `wrangler`) with three blockers that gate each other. Day-to-day Access admin
(`manage-cloudflare-access`) shouldn't carry it.

## The mental model

Premium body ships **encrypted** in the public bundle. To read it, the browser fetches
`/api/unlock-key`; that path is gated by a Cloudflare Access app (LinkedIn-any) and
backed by the **access-gate Worker**, which returns the single `PREMIUM_PASSPHRASE`
only to a valid Access JWT. **The passphrase the Worker vends MUST equal the
`STATICRYPT_PASSPHRASE` used to encrypt at build time** — same value in two places
(`.env` for the build, a Worker secret for the vend).

Three blockers, in dependency order: **#19 token scope → #20 .env passphrase → #21
deploy**. #21 needs both.

## ⚠️ Confirming what CF_API_TOKEN can do (you can't list its scopes)

A CF token can't read its own permission list unless it carries `User → API Tokens →
Read` (ours doesn't → that call returns `9109`). So **confirm scope by behaviour**: hit
one endpoint per permission and read `200/OK` vs `403/10000`. Helper:

```bash
bash .claude/skills/manage-infrastructure/confirm-token-scopes.sh
```

Expected BEFORE #19 (verified 2026-06-02):

```
  Access: Apps (have already)        OK
  Workers Scripts:Edit (#19 need)    code 10000
  Workers Routes:Edit (#19 need)     code 10000
```

`code 10000` = scope MISSING. When BOTH Workers rows read `OK`, #19 is done.

---

## Step 1 — #19: add the two Workers scopes (DASHBOARD, not a command)

Token scopes are editable only in the dashboard. Open the
[Cloudflare API Tokens page](https://dash.cloudflare.com/profile/api-tokens), edit the existing `CF_API_TOKEN`
(keep everything it has — Access: Edit, Zone DNS, Tunnel), and **add**:

- **Account → Workers Scripts → Edit**
- **Zone → Workers Routes → Edit**  (scope to zone `bytesofpurpose.com`)

The token *value* is unchanged, so `.env` doesn't change. Then confirm:

```bash
bash .claude/skills/manage-infrastructure/confirm-token-scopes.sh   # both Workers rows → OK
```

## Step 2 — #20: put the passphrase in `.env`

The repo is PUBLIC with gitleaks hooks; `.env` is gitignored and the **only** home for
this secret. Pick a strong value (e.g. `openssl rand -base64 32`) — don't paste it into
chat or any tracked file:

```bash
cd /Users/omareid/Workspace/git/projects/omars-lab.github.io
echo 'STATICRYPT_PASSPHRASE=<your-strong-secret>' >> .env
grep -c '^STATICRYPT_PASSPHRASE=' .env && git check-ignore .env   # expect: 1  then  .env
```

## Step 3 — #21: set the Worker secret (== #20) and deploy

Do this AFTER #19 + #20. `wrangler` reads the token from `CLOUDFLARE_API_TOKEN`, so no
`wrangler login` is needed. The secret you type **must be byte-for-byte the #20 value**:

```bash
cd /Users/omareid/Workspace/git/projects/omars-lab.github.io/workers/access-gate
export CLOUDFLARE_API_TOKEN=$(grep -E '^CF_API_TOKEN=' ../../.env | cut -d= -f2- | sed 's/[[:space:]]*#.*//' | tr -d ' "'"'"'')
npx wrangler secret put PREMIUM_PASSPHRASE     # paste the SAME value as STATICRYPT_PASSPHRASE
npx wrangler deploy
```

`wrangler.toml` already has `TEAM_DOMAIN`, `POLICY_AUD`, and the two `/api/*` routes —
nothing to fill in.

## Step 4 — verify

```bash
cd /Users/omareid/Workspace/git/projects/omars-lab.github.io
# Unauthenticated → Access 302s to LinkedIn BEFORE the Worker runs (correct):
curl -sS -I https://blog.bytesofpurpose.com/api/unlock-key | grep -iE '^HTTP|location'
```

The real end-to-end check needs a browser: sign in with LinkedIn on
`https://blog.bytesofpurpose.com`, then from that origin's console —

```js
await (await fetch('/api/me',         {credentials:'include'})).json()  // → {email,…}
await (await fetch('/api/unlock-key', {credentials:'include'})).json()  // → {passphrase}
```

Worker JWT logic (verify vs team JWKS, `aud`==POLICY_AUD, require `email`) is
unit-tested: `cd workers/access-gate && npm test`.

## Dev/prod parity (local premium behaves like prod)

Two pieces make `make start` look identical to prod for premium:

1. **Dev encrypts.** `make start` exports `STATICRYPT_PASSPHRASE` from `.env`, so
   `rehype-premium-encrypt.js` encrypts premium bodies in dev too (ciphertext in the
   dev-served page + a `static/premium/<id>.json` sidecar; the cleartext sentinel is
   absent from all `.docusaurus` compiled output). A bare `yarn start` without the env
   var renders premium plaintext — authoring-only fallback.
2. **Dev borrows the real key.** `plugins/dev-api-proxy` proxies `localhost/api/*` →
   `https://blog.bytesofpurpose.com/api/*` (webpack-dev-server v5 array-form proxy,
   `changeOrigin:true`). Unauthenticated `/api/me` through the proxy returns the
   Worker's `302` to LinkedIn (proven) instead of the SPA fallback. To DECRYPT locally,
   **sign in once on `https://blog.bytesofpurpose.com`** so the browser holds the
   `CF_Authorization` cookie; the proxy forwards it upstream and `/api/unlock-key` vends
   the passphrase. No dev-only key, no client fallback — `src/lib/auth.tsx` `signIn()`
   navigates to the Access path unconditionally (the old localhost toast was removed).

> Config/plugin changes need a dev-server RESTART (hot reload won't pick them up).
> If the authenticated `/api/unlock-key` still 401/302s after a domain sign-in, the
> httpOnly+domain-scoped cookie isn't reaching the Worker through the proxy — a CF
> Access *service token* is the fallback (offered, not yet chosen).

## Dev auth = CF Access service token (NOT a forwarded cookie)

Cookie-forwarding dev auth **cannot work** and we proved it both ways: (1) the Access
login nonce is origin-bound, so starting the flow from `localhost` and finishing on
`blog.bytesofpurpose.com` yields **"Invalid login session"**; (2) `CF_Authorization` is
`HttpOnly` + domain-scoped to `blog.bytesofpurpose.com`, so the browser never sends it to
`localhost` and the proxy has nothing to forward. Cloudflare's documented localhost-dev
answer is a **service token** (static `Cf-Access-Client-Id`/`-Secret` header pair, no
browser login). Setup:

1. **Create the service token** — Zero Trust → Access controls → Service credentials →
   Service Tokens → Create. Copy the Client ID + Secret (**secret shown once**).
2. **Add a Service Auth policy** to the `Access Gate (blog /api/*)` app
   (id `844eef3a-…`) — action **Service Auth**, Include → Service Token → that token.
   It sits ALONGSIDE the LinkedIn policy, so prod browser auth is unchanged (a request is
   admitted by EITHER a LinkedIn session OR the token headers).
3. **Put the creds in gitignored `.env`** — `CF_ACCESS_CLIENT_ID` /
   `CF_ACCESS_CLIENT_SECRET`. `make start` exports them; `plugins/dev-api-proxy` injects
   them on proxied `/api/*` requests (dev-only — `yarn build` never runs the proxy).

> The token-side work needs Access scopes on `CF_API_TOKEN` beyond the basics:
> `Access: Apps and Policies: Edit` (policies subresource) **and**
> `Access: Service Tokens: Read` (to resolve the token id for the policy include).
> The base `Access: Apps` grant can list apps yet still `10000` on `/policies` — add the
> full edit tier. Or just add the policy in the dashboard.

### Validate it — `make validate-dev-service-token`

```bash
make validate-dev-service-token
```

Curls the Worker with the `.env` service-token headers: passes when `/api/me` → `200`
and `/api/unlock-key` vends `{passphrase}` (the headless equivalent of the browser
LinkedIn unlock). A `302` means the Service Auth policy isn't live yet (add it / wait for
propagation). Run this after step 2 to confirm dev can decrypt before starting the server.

## Rotating the passphrase

The passphrase lives in **two places that must stay equal**: `STATICRYPT_PASSPHRASE` in
`.env` (encrypts premium bodies at build time) and the Worker's `PREMIUM_PASSPHRASE`
(vended to readers). To rotate both atomically:

```bash
make rotate-premium-secret
```

It generates one new 44-char alphanumeric value, writes it to `.env`, pushes it to the
Worker (`wrangler secret put`), and redeploys the Worker so it picks the new secret up.

> ⚠️ **A rotate invalidates already-published premium content** — it was encrypted with
> the OLD passphrase and will no longer decrypt. After rotating you MUST re-encrypt and
> redeploy the SITE so the published ciphertext matches the new key:
> `make build-premium && make deploy` (or run the `deploy-site` skill). The target prints
> this reminder; it does not deploy the site for you.

If the Worker `secret put`/deploy step fails mid-rotate, `.env` already holds the NEW
value while the Worker may still vend the OLD — just re-run `make rotate-premium-secret`
to resync (it regenerates, but both ends end up equal again).

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `confirm-token-scopes.sh` Workers rows show `code 10000` | #19 not done | add the two Workers scopes in the dashboard (Step 1) |
| `wrangler deploy` → auth / 10000 error | token scope missing or `CLOUDFLARE_API_TOKEN` unset | redo Step 1; re-export the token (Step 3) |
| `/api/unlock-key` 302s to login | normal when unauthenticated — Access gate runs before the Worker | sign in with LinkedIn; that's expected |
| Browser unlock returns wrong/garbled plaintext | Worker `PREMIUM_PASSPHRASE` ≠ build `STATICRYPT_PASSPHRASE` | re-run Step 3 with the exact #20 value, redeploy |
| Service token → `/api/me` 401 `no_email` | EXPECTED — service tokens are non-identity (no email claim) | none; the dev path uses `/api/unlock-key`, which vends to any admitted JWT. The Worker scopes the email check to `/api/me` only (fixed 2026-06-02) |
| Service token → `/api/unlock-key` 302/401 | Service Auth policy not on the `/api/*` app yet, or token re-rolled in `.env` | add the policy (or re-add Access scopes + create via API); `make validate-dev-service-token` |
| `CF_API_TOKEN` blank after sourcing `.env` | `.env` has shell-special chars that break `source` | use the per-var `grep|cut|sed|tr` extraction (as the helper + Step 3 do) — never `source .env` |

## The account + token gotcha (verified 2026-06-02)

- The blog's zone `bytesofpurpose.com` lives on the **bytesofpurpose** Cloudflare
  account, id **`e22f4531704a3141ddb150ac47eabc87`** (dashboard
  `dash.cloudflare.com/e22f4531704a3141ddb150ac47eabc87/home/overview`). A scoped token
  can't read the account's display *name*, so the id is the source of truth — don't
  guess the name.
- **One `CF_API_TOKEN` must carry BOTH scope families.** `cf_access.py` (Access admin)
  needs Account:`Access: Apps: Edit`; the Worker deploy needs Account:`Workers Scripts:
  Edit` + Zone:`Workers Routes: Edit`. A token with only the Workers scopes deploys the
  Worker but makes every `cf_access.py` call return `code 10000`. Grant all three on the
  single token so both workflows keep working.

## Current state (verified 2026-06-02)

- #19 token scope: **DONE** — a re-minted `CF_API_TOKEN` (`cfut_0gc…`) carries
  Account:`Workers Scripts: Edit` + Zone:`Workers Routes: Edit` (both probe `OK`).
  ⚠️ This token does NOT carry `Access: Apps: Edit` (probes `code 10000`), so
  `cf_access.py` calls fail on it — re-add that scope to the same token when you next
  need Access admin (see the one-token-both-families gotcha above).
- #20 `.env` passphrase: **DONE** — a 44-char random alphanumeric `STATICRYPT_PASSPHRASE`
  (generated via `tr -dc A-Za-z0-9 </dev/urandom`).
- #21 Worker deploy: **DONE** — `wrangler secret put PREMIUM_PASSPHRASE` (== `.env`) +
  `wrangler deploy`. Worker `access-gate` is live; routes `/api/me` + `/api/unlock-key`
  bound to the zone; unauthenticated `/api/unlock-key` → `302` to LinkedIn (verified).
  Worker created fresh by the deploy (it had never been deployed before).
- Access gate app (`Access Gate (blog /api/*)`) and LinkedIn IdP: **already live**
  (owned by `manage-cloudflare-access`).
- Rotation: `make rotate-premium-secret` (see "Rotating the passphrase" above).

> Remaining go-live work is the SITE side, not infra: encrypted build + deploy
> (`deploy-site`), and the dev/prod-parity items (#25–#27) in
> `bytesofpurpose-blog/.claude/plans/CONTINUE-premium-gating.md`. The browser
> `/api/unlock-key → {passphrase}` end-to-end check happens there (#27).
