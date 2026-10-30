# Sign-in errors for `/api/me` in the browser console

Found 2026-10-30 while working through the hub's blog upkeep list (TP20). Not fixed yet;
this note is what we know and the fix we would try.

## What you see

Every page logs two errors in the browser console for a reader who is not signed in:

```
Access to fetch at 'https://bytesofpurpose.cloudflareaccess.com/cdn-cgi/access/login/blog.bytesofpurpose.com?kid=...'  (shortened)
Failed to load resource: net::ERR_FAILED
```

It happens on the live site (seen with headless Chrome on `/craft`, 2026-10-30) and on a local
preview at `127.0.0.1`. The page still works: the navbar shows "Sign in" and nothing breaks.

## Why

Two places ask `/api/me` who the reader is, once per page load:

- `bytesofpurpose-blog/src/lib/auth.tsx` (`fetchMe`, for the Sign in button and premium pages)
- `bytesofpurpose-blog/src/posthog.js` (to tag a signed-in reader in analytics)

For a reader with no Cloudflare Access session, `/api/me` answers with a **302 to the Access login
page on another domain** (checked with `curl`: `302` to `bytesofpurpose.cloudflareaccess.com/...`).
`fetch` follows redirects by default, so the browser goes to the login page, which sends no CORS
header, and the browser logs the block. Both callers catch the failure and treat the reader as
anonymous, which is the right answer, but the browser logs the error before our code sees it.

Locally:

- `make start` (port 3000) sends `/api/*` to the live Worker through `plugins/dev-api-proxy`. With no
  service token in `.env` (a fresh worktree has no `.env`), the proxy cannot sign in, so it gets the
  same 302 and the browser logs the same error.
- A built site served locally (`make serve`) has no `/api` at all, so the call gets a 404 or the
  site's fallback page. That logs a failed request but no CORS error.

`scripts/verify-prod-deployment.mjs` already lists this as known noise, so the deploy check skips it.

## The fix we would try

Pass `redirect: 'manual'` to both `fetch('/api/me', ...)` calls. The browser then stops at the 302
and hands back an "opaque redirect" response (`ok` is false) instead of following it, so nothing
is logged and both callers fall through to "anonymous", as they do today.

Why it was not done in this change:

- It touches the live sign-in path for every visitor, and we could not check a signed-in session
  here (that needs Omar's Access login or the service token, neither in this worktree).
- One case to rule out first: a reader whose Access session for this site has expired but whose
  login is still valid. Access may bounce them through a redirect and back. Today that bounce also
  fails on CORS, so `redirect: 'manual'` should change nothing, but it is worth confirming in a
  real signed-in browser before shipping.

To finish it: make the change, sign in on the live site in a real browser, confirm the avatar still
shows and premium pages still unlock, run `test/e2e/navbar-auth.spec.ts`,
`test/e2e/signin-redirect.spec.ts` and `test/e2e/premium-gating.spec.ts` (they stub `/api/me`, so
they should pass unchanged), then drop the `/api/me` entry from the known-noise list in
`verify-prod-deployment.mjs`.
