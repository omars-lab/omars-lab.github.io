# Continuation prompt — Premium gating + auth (resume in a fresh session)

Paste the block below as the first message of a new Claude Code session. It is
self-contained: it points at the binding docs, states exactly what's DONE vs OPEN, and
lists every open task with its dependencies.

---

Continue implementing the approved plan at
`bytesofpurpose-blog/.claude/plans/delightful-giggling-scroll.md`.

START by reading, in full:
1. `CLAUDE.md` (repo root) — operating conventions are BINDING (track work as tasks;
   archive ≥10 completed tasks to the changelog then delete; "info goes in the proper
   skill"; "structure decisions update the structure checks" in the SAME change).
2. `bytesofpurpose-blog/.claude/plans/delightful-giggling-scroll.md` — read the "⏱ STATUS"
   block at the top FIRST, especially the "⚙️ Phase F progress" + "⚠️ CACHE GOTCHA" blocks.
3. The memory `premium-gating-architecture.md` (in the auto-memory dir) — the architecture
   + the proven crux finding (encrypt at MDX-compile, not post-build).

Then recreate the task list with TaskCreate (the live list is per-session). Create COMPLETED
tasks for the done work and PENDING tasks (with deps) for what's left — see both lists below.

## What is DONE & PROVEN (do NOT redo — verify by reading the files)
- **Phase A/B/C, decrypt-crux, S1** — from prior sessions (see plan STATUS).
- **Phase D** — `/api/me` → `identify()` + internal-tester filter in `src/posthog.js`
  (localhost 200+HTML → `r.json()` throws → `.catch` no-ops; verified live, 0 console errors).
- **Phase E (+V4)** — `src/lib/auth.tsx` (`AuthProvider`/`useAuth`/`signIn`/`signOut`/
  `fetchUnlockKey`, one shared `/api/me` in `Root.tsx`); `src/components/AuthNavbarItem`
  (button⇆avatar); `'custom-auth'` navbar item position:right. e2e
  `test/e2e/navbar-auth.spec.ts` 2/2 (dev project). Verified live.
- **M1** — memory `premium-gating-architecture.md` + MEMORY.md pointer.
- **Phase F core (the hard gate) — PROVEN:**
  - `plugins/rehype-premium-encrypt.js` — encrypts `premium:true` body HTML at the rehype
    stage → `static/premium/<id>.json`; replaces body with `<PremiumGate payload teaser/>`;
    preserves top-level `mdxjsEsm` nodes. No-ops without `STATICRYPT_PASSPHRASE` (dev).
  - `src/lib/premium-crypto.ts` — pure-WebCrypto decrypt, byte-compatible with staticrypt's
    `encode()` (proven). (Client must NOT import staticrypt's engine → it `require`s
    `node:crypto`, unbundlable.)
  - `src/components/PremiumGate` (fetch key+payload → decrypt → inject), `src/components/
    Premium` (inline SOFT-gate blur), both in `src/theme/MDXComponents.tsx`;
    `src/components/SignInModal` (+ host in `Root.tsx`); sidebar `LockBadge`
    (`src/theme/DocSidebarItem/lockBadge.tsx`, prod-visible) wired into `…/Link/index.tsx`.
  - **V1+V2+hook lockstep:** `scripts/validate-docs-structure.js` premium-type/
    premium-draft-conflict/premium-needs-teaser; `plugins/draft-docs/index.js`
    `premiumPermalinks`; `.claude/hooks/validate-docs-structure-hook.sh` premium advisory.
    Verified with fixtures.
  - **V5 blocking gate** `scripts/verify-premium-encrypted.js` — greps WHOLE build (HTML+JS+
    JSON) for each premium doc's body fingerprints (must be absent) + sidecar ciphertext.
    PROVEN to catch an injected leak (exit 2) + pass clean (exit 0). Wired: deploy-site
    step 3b, `.githooks/pre-push`, `make verify-premium`. Shared enum: `scripts/lib/
    premium-docs.js` (payloadId in lockstep with the plugin).
  - **e2e** `test/e2e/premium-gating.spec.ts` + `premium` Playwright project +
    `make test-premium-e2e`: **2/2 PASS** — anonymous body absent from HTML+all JS chunks
    (V3); signed-in decrypt round-trip works against the real encrypted build.
  - **S3** deploy-site skill updated (STATICRYPT_PASSPHRASE env, V5 gate, token scope).
  - Demo fixture `docs/craft/premium-gating-demo.mdx` (sentinels PREMIUMSENTINELBODY/CODE).
  - HARD-GATE PROVEN on a clean cache-cleared build: sentinel in neither HTML nor JS.

## Ground rules / gotchas to respect
- **Repo is PUBLIC + gitleaks hook.** Never commit secrets (`STATICRYPT_PASSPHRASE`,
  `PREMIUM_PASSPHRASE`, LinkedIn secret) — CF / Worker secrets / gitignored `.env` only.
  Don't commit or push unless asked; branch off master first.
- **CACHE GOTCHA (dangerous):** `node_modules/.cache` + `.docusaurus` can serve a premium
  doc's STALE compiled output so the rehype plugin doesn't re-run → no sidecar → V5 aborts
  (good) but a naive build looks done while it would ship plaintext. Always clear
  `node_modules/.cache` before an encrypted build (`make test-premium-e2e` already does;
  deploy-site must too — task #18).
- **Verification discipline:** prove every claim with a runnable test/output. The hard-gate
  proof is `make test-premium-e2e` (2/2) + `make verify-premium` after a built `STATICRYPT_
  PASSPHRASE=…` build. Clear caches before declaring bundle-cleanliness.
- A live dev `yarn start` (:3000) hot-reloads; config/plugin changes need a RESTART. In dev
  `STATICRYPT_PASSPHRASE` is unset so premium bodies render in clear (authoring) — that's
  correct; the gate is a prod concern.

## OPEN tasks (recreate with these subjects + deps)
Pending, no deps (can start immediately):
- **S2 — PostHog internal-filter docs (with B0):** `setup-posthog` skill: `$host`
  (localhost/127.0.0.1) + `is_internal` internal-user filters; `?internal=1` convention.

Pending, BLOCKED BY Phase-F-finalize (do these as the remaining F work, then unblock):
- **#16 (USER) SignInModal "track interest" button → PostHog:** add a button on the modal
  (shown when a locked/sneak-peek surface is pressed) to register interest in making this
  content public; fires `posthog.capture('premium_interest', {path, what})`; document it in
  `src/posthog-integration-plan.md`. Distinct from the LinkedIn sign-in CTA.
- **#17 (USER) localhost sign-in graceful-degrade:** clicking "Sign in" on :3000 navigates
  to `/api/me?redirect_url=…` which 404s (no Worker in dev). `signIn()` should detect
  localhost / no-`/api/*` and show a toast/note instead of a dead nav. Applies to
  `AuthNavbarItem` + `SignInModal`.
- **#18 (USER) cache-bust premium encryption:** clear `node_modules/.cache` in deploy-site
  (and confirm in test-premium-e2e — done); consider a companion `postBuild` plugin that
  copies `static/premium`→`build/premium` AND hard-fails if a premium doc lacks a sidecar;
  document the cache gotcha in the deploy-site skill + premium memory.
- **#15 (USER) theme the premium gate + SignInModal to feel part of the blog:** branded
  fonts/colors/voice; align with `review-reader-experience`. NB the arch uses NO staticrypt
  password page (Worker vends the key machine-to-machine) — the reader-facing surfaces are
  `PremiumGate` + `SignInModal`. Theme staticrypt `password_template.html` only if a no-JS
  fallback is later wanted. (Clarify which surface the user means if ambiguous.)
- **S4 + S5 skills:** S4 `author-blog-post` — how to mark a doc `premium` (+ `premium_teaser`),
  soft `<Premium>` vs hard whole-doc gate. S5 NEW skill `manage-premium-content` — the
  editorial POLICY (what's premium vs free vs draft; teaser selection; tiering checklist;
  composes with `draft`); cross-link V1/V5.

Pending, BLOCKED BY Phase F complete:
- **#14 (USER) easter-egg in the System Design** (`designs/2026-06-02-premium-content-
  gating.mdx`): white-on-white text revealing premium content is free via the public GitHub
  repo (source MDX is public; only the BUILT site encrypts). Honest + playful. Also document
  the HONEST CAVEAT: the hard-gate protects the deployed site, not the source.
- **#11 Phase G finalize** the design doc after F settles; reconcile against the shipped
  implementation; final `make validate-structure` / `make validate-links`.

## Build order from here
1. Finish the user-requested F polish: #16 (interest button), #17 (localhost degrade),
   #18 (cache-bust deploy), #15 (theme gate/modal). Re-run `make test-premium-e2e` (keep
   2/2) + `make verify-premium` after each.
2. S4 + S5 skills; S2 PostHog docs.
3. Phase G finalize incl. the #14 easter egg + honest caveat.
4. When ≥10 completed tasks accumulate, archive to `bytesofpurpose-blog/changelog/
   CLAUDE-CHANGELOG.md`, run `node bytesofpurpose-blog/scripts/generate-changelog-data.js`,
   then delete them (per CLAUDE.md).

## Manual steps the USER owes (call out, don't attempt) — only these block go-live
- Add `Workers Scripts: Edit` + `Workers Routes: Edit` to `CF_API_TOKEN`.
- `cd workers/access-gate && npx wrangler secret put PREMIUM_PASSPHRASE` (MUST equal the
  `STATICRYPT_PASSPHRASE` used at build) `&& npx wrangler deploy`.

## Uncommitted state at handoff
Many new/modified files (none committed — awaiting user). New: `src/lib/auth.tsx`,
`src/lib/premium-crypto.ts`, `src/components/{AuthNavbarItem,SignInModal,PremiumGate,
Premium}`, `src/theme/DocSidebarItem/lockBadge.*`, `plugins/rehype-premium-encrypt.js`,
`scripts/lib/premium-docs.js`, `scripts/verify-premium-encrypted.js`,
`test/e2e/{navbar-auth,premium-gating}.spec.ts`, `.githooks/pre-push`,
`docs/craft/premium-gating-demo.mdx`. Modified: `posthog.js`, `Root.tsx`,
`MDXComponents.tsx`, `NavbarItem/ComponentTypes.tsx`, `DocSidebarItem/Link/index.tsx`,
`docusaurus.config.js`, `playwright.config.ts`, `Makefile`, `validate-docs-structure.js`
(+ hook), `draft-docs/index.js`, `deploy-site/SKILL.md`. staticrypt + hast-util-to-html
added as devDeps. Leftover: `build/`, `static/premium/` from the last e2e build (gitignored
or removable).
