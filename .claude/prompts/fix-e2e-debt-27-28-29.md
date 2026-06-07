# Fix e2e test debt (#27, #28, #29) → then deploy the design refresh

You are starting a **clean session** to resolve three pre-existing e2e test failures,
then deploy the already-merged frontend design refresh to gh-pages. Work in a **new git
worktree** (repo convention). Track the work as tasks (TaskCreate/TaskUpdate).

## Background (what already happened)

- PR **#26** ("Refresh blog frontend to executive editorial identity — Fraunces + Geist,
  cream + coral") is **already squash-merged to `master`** (commit `1ea63e15`). It re-skinned
  the blog to mirror the portfolio (bytesofpurpose.com): Fraunces serif headings + Geist body,
  warm cream paper (light) / warm-ink (dark), burnt-terracotta `#b33e1e` accent replacing blue,
  redesigned hero, warmed footer. **Do not redo or revert any of that.**
- A full `make test-regression` run on 2026-06-05 found:
  - **prod project: 35/35 green** (axe WCAG 2 A/AA light+dark, SEO, dev-only-surfaces-absent).
  - **dev: 1 failure**, **posthog: 11 failures** — ALL pre-existing test debt unrelated to the
    design change (the PR diff touched none of the relevant files). Filed as #27/#28/#29.

## The three issues to fix

### #27 — `craft-self-split.spec.ts` asserts navbar "Self" (renamed to "Journey")
- File: `bytesofpurpose-blog/test/e2e/craft-self-split.spec.ts`.
- The nav item was renamed Self→Journey in commit `230d01aa` (#25); `docusaurus.config.js`
  truth is `label: 'Journey'`. Update the `'Self'` navbar assertions (line ~54) AND the
  doc-comment references to "Self" to **'Journey'**. The sidebar-isolation assertions already
  target `/journey` — verify they still pass.
- Verify: `make` dev project (see "Running tests" below) — the spec must go green.

### #28 — `ingress-attribution.spec.ts` `DOC_URL='/welcome'` is a dead route
- File: `bytesofpurpose-blog/test/e2e/ingress-attribution.spec.ts` (DOC_URL ~line 28).
- `/welcome` no longer exists (the chooser was folded into `src/pages/index.tsx`; there is no
  `src/pages/welcome.mdx`). It falls through to the homepage hero, which has **no share-control**,
  so all 9 `DOC_URL` assertions fail. The share control itself WORKS — verified live on
  `/craft/blogging/docs-vs-blog-posts` (that's the spec's own `BLOG_URL`, whose tests passed).
- Fix: repoint `DOC_URL` to a **real doc that injects the share control** (the share control is
  injected by `src/theme/DocItem/Content/index.tsx`). A safe choice is another `craft` doc with a
  normal H1. Re-check the assertions on lines ~106/126/146/203/282/296/309.
- Also consider adding a `/welcome → /` client-redirect in `docusaurus.config.js`
  `createRedirects` so external links to `/welcome` don't 404 (optional, mention to user).
- Verify: `make test-posthog` — the 9 ingress tests go green.

### #29 — `support-ab-test.spec.ts` expected copy drifts from live PostHog flag
- File: `bytesofpurpose-blog/test/e2e/support-ab-test.spec.ts` (assertions ~line 41-48).
- The test hardcodes per-variant copy ("Donate \$5" / "Buy me a coffee") but the served copy
  comes from the **live PostHog experiment payload**, which has drifted (same run rendered
  "Buy me a coffee" / "Support the dev"). Decouple from live flag state: **stub the flag/payload
  in-test** so the expected copy is deterministic (follow the `run-ab-test` skill's Playwright
  flag-injection pattern), OR read expected copy from the component's source of truth.
- Reconcile against the current experiment definition under
  `bytesofpurpose-blog/docs/4-development/6-projects/experiments/`.
- Verify: `make test-posthog` — the support-ab pair goes green.

## Running tests (important env notes)

- Run from the repo root; needs the gitignored `.env` (PostHog keys) — present in the main
  checkout. If working in a worktree, copy `.env` in (it's gitignored) and remove it when done.
- A user dev server may occupy **:3000** — do NOT kill it. The Playwright `dev` project's
  webServer reuses an existing server when `CI` is unset; to isolate, start your own merged-master
  dev server on a free port (e.g. `yarn start --port 3737`), then run
  `E2E_DEV_BASE_URL=http://localhost:3737 yarn playwright test --project=dev` (reuses :3737).
- prod + posthog projects build their own artifacts and serve **:4173** (`make test-prod-checks`,
  `make test-posthog`). Run each in the FOREGROUND so the serve stays alive (a prior `nohup … &`
  detach caused spurious CONNECTION_REFUSED).
- Goal: **dev, prod, AND posthog all green** (`make test-regression`, modulo the user's :3000).

## Land the fixes

- Per repo convention: **commit → feature branch → push → open PR → ask the user to merge →
  squash-merge** (`gh pr merge --squash --delete-branch`) → sync master. One PR for the test
  fixes is fine (they're related debt). Put the green regression evidence in the PR body.
- Update **ISSUES.md** in the same step when the issues close (mark #27/#28/#29 closed with the
  PR number) — GitHub is source of truth; keep the index honest.

## THEN deploy the design refresh to gh-pages (the user's explicit trigger)

Only after #27–#29 are fixed and the regression is green:
- Use the **`deploy-site`** skill (secret-scan → build with PostHog env → gh-pages → verify).
  It is **fail-closed**: it exports `STATICRYPT_PASSPHRASE` from `.env`, refuses to ship premium
  docs if it's empty, runs gitleaks + the V5 leak gate, and re-checks after the rebuild. Don't
  bypass those gates.
- After deploy, use **`validate-deployment`** to confirm the live site
  (https://blog.bytesofpurpose.com) returns 200, the new Fraunces/Geist + cream/coral design is
  live, and the PostHog beacon fires.
- Confirm the deploy with the user before running it (outward-facing action).

## Definition of done
1. #27, #28, #29 fixed; `make test-regression` green (dev + prod + posthog).
2. Fix PR squash-merged to master; ISSUES.md marks the three closed.
3. Design refresh deployed to gh-pages and validated live.
