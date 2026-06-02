# CONTINUE — premium-gating: dev/prod parity + go-live (resume in a fresh session)

**Last updated 2026-06-02.** Read this first, then `delightful-giggling-scroll.md`
(full plan + STATUS block) and the memory `premium-gating-architecture.md`. Recreate the
task list (the live list is per-session) from the OPEN TASKS below.

## Where we are

The premium-gating feature is **code-complete and committed** to branch
`feat/premium-content-gating` (commit `d874e9a9`, NOT pushed). It is **verified locally**
(premium e2e 2/2, navbar 2/2, Worker JWT 7/7, V5 clean on a cache-busted encrypted build,
383 MDX compile, validate-structure 0 errors, validate-links clean) but **not live**.

Since the commit, the user changed the dev/prod design. The conflicting half-edits were
reverted — the working tree only has the design-doc update pending (commit it). The new
direction is documented but **NOT yet implemented**:

### NEW DECISIONS (user-confirmed 2026-06-02) — implement these

1. **Dev must behave like prod for premium.** `yarn start` should ENCRYPT premium bodies
   (ciphertext in dev source too) so the gate looks identical locally.
2. **Dev pulls the unlock key from the REAL Worker** — NOT a dev-only key, NO client
   fallback. Mechanism: a **Docusaurus dev-server proxy** forwarding `localhost/api/*` →
   `https://blog.bytesofpurpose.com/api/*`, carrying the reader's real Access cookie
   (sign in once on the domain). Client keeps using relative `/api/*`.
3. **Both dev + prod `STATICRYPT_PASSPHRASE` live in the gitignored `.env`** — never a
   hardcoded constant.
4. **Remove the localhost toast / `isApiUnreachable` short-circuit** in `src/lib/auth.tsx`
   (it was the #17 work) — no longer needed once `/api/*` works in dev via the proxy.
   `signIn()` goes back to navigating to the Access login path unconditionally.
5. Captured in the design doc (`designs/2026-06-02-premium-content-gating.mdx` → new
   "Dev/prod parity" section + corrected localhost FAQ + reworded prod/dev bullet). This is
   the pending working-tree change — commit it.

## OPEN TASKS (recreate with these subjects + deps)

**Implementation (mine, in order):**
- **#25 Dev encrypts (key from .env):** Makefile `start` target must extract
  `STATICRYPT_PASSPHRASE` from `.env` (per-var `xenv` pattern — same as `make test-posthog`
  / the `build-premium` deploy flow) and export it for `yarn start`. Do NOT hardcode.
- **#26 Dev `/api/*` proxy → real Worker:** add the dev-server proxy. VERIFY the exact
  Docusaurus-3 mechanism — likely a tiny local plugin returning
  `{ configureWebpack: () => ({ devServer: { proxy: [{ context:['/api'],
  target:'https://blog.bytesofpurpose.com', changeOrigin:true, secure:true }] } }) }`.
  Watch httpOnly + domain-scoped + SameSite cookie forwarding — it may NOT forward the
  Access cookie cross-origin; if it doesn't, STOP and ask the user how to auth dev (a CF
  Access *service token* was offered and NOT chosen, so re-confirm). PROVE the unlock works
  end-to-end. Then REVERT the localhost toast in `auth.tsx`. **Blocked by #21** (Worker must
  be deployed for the proxy to reach anything).
- **#27 Verify dev==prod:** dev `yarn start` shows the encrypted gate (sentinel absent from
  dev page source); dev unlock via the proxy works after a domain sign-in; grep proves no
  dev-only key exists anywhere. Extend the e2e if feasible. **Blocked by #25, #26, #21.**
- **#28 (DONE, pending commit):** design-doc parity decisions captured.
- **#23 Deploy:** run `deploy-site` → `make build-premium` (cache-bust + encrypt + V5
  blocking gate) → `make deploy` (gh-pages) → `validate-deployment`. **Blocked by #20.**
- **#24 (optional):** un-draft `designs/2026-06-02-premium-content-gating.mdx`.

**USER-OWED — go-live blockers (call out, do NOT attempt):**
- **#19** Add `Workers Scripts: Edit` + `Workers Routes: Edit` to `CF_API_TOKEN`.
- **#20** Put a REAL `STATICRYPT_PASSPHRASE` in gitignored `.env` (MUST equal the Worker
  secret).
- **#21** `cd workers/access-gate && npx wrangler secret put PREMIUM_PASSPHRASE` (== #20)
  `&& npx wrangler deploy`. **Until done, `/api/unlock-key` 404s — so the dev proxy (#26)
  AND prod both have nothing to vend.** Blocked by #19 + #20.

Dep summary: #26←#21 · #27←#25,#26,#21 · #21←#19,#20 · #23←#20.

## Gotchas to respect

- Repo PUBLIC + gitleaks pre-commit/pre-push. `.env` is the ONLY home for
  `STATICRYPT_PASSPHRASE`. Branch off master; commit/push only when asked.
- **CACHE GOTCHA:** clear `node_modules/.cache` + `.docusaurus` before any encrypted build
  (`make build-premium` + `make test-premium-e2e` already do).
- Dev server hot-reloads source but NOT config/plugin changes → the proxy plugin needs a
  RESTART.
- Verification discipline: prove every claim with a runnable test/output (repo tenet).
- CLAUDE.md conventions are BINDING: track work as tasks; archive ≥10 completed to the
  changelog then delete; info goes in the proper skill; structure decisions update the
  structure checks in the SAME change.

## Proof commands

- `make test-premium-e2e` → expect 2/2 (hard-gate ciphertext-absence + decrypt round-trip
  + theming assertions).
- `STATICRYPT_PASSPHRASE=… make build-premium` → V5 "all premium body(ies) absent… OK".
- `make validate-structure` (0 errors) · `make validate-links` · `npx docusaurus-mdx-checker`.

## Current branch / commit

`feat/premium-content-gating` @ `d874e9a9` (54 files, gitleaks-clean, NOT pushed).
Pending working-tree change: the design-doc dev/prod-parity edits (#28) — commit them.
