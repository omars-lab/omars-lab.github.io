# PostHog Integration — Issues & Debugging Log

Running log of problems hit while integrating PostHog, the diagnosis, and the fix.
Companion to `posthog-integration-plan.md`. Newest first.

---

## ISSUE-003 — Server-side readback (`posthog_stats.py`) not yet usable (OPEN)

**Symptom.** The HogQL stats helper (`.claude/skills/manage-cloudflare-access/
posthog_stats.py`) can't run: it needs `POSTHOG_PERSONAL_API_KEY` (`phx_…`) and the
numeric `POSTHOG_PROJECT_ID`. The wizard only created the public project key
(`POSTHOG_KEY=phc_…`) and put it in `bytesofpurpose-blog/.env`, not the repo-root
`.env` the helper reads.

**Impact.** Browser-side ingestion is already proven (Playwright sees the POST to
`us.i.posthog.com` — ISSUE-002). Readback is the independent "did it LAND" check.

**To resolve (needs user):**
1. PostHog → Settings → Personal API keys → create a key with `query:read` (and
   `project:read`) scope → it looks like `phx_…`.
2. PostHog → Settings → Project → copy the numeric Project ID.
3. Add to the **repo-root** `.env`:
   `POSTHOG_PERSONAL_API_KEY=phx_…`, `POSTHOG_PROJECT_ID=<num>`,
   `POSTHOG_API_HOST=https://us.posthog.com`.
4. Run `python3 .claude/skills/manage-cloudflare-access/posthog_stats.py daily --days 1`.

Quickest manual confirm without keys: PostHog UI → Activity (live events) — the test
events (`$pageview`, `$autocapture`, `scroll depth`) from `make test-posthog` should
appear, tagged `$browser_type=bot`.

---

## ISSUE-002 — `capture()` returns undefined; events dropped as "bot-detected" (RESOLVED)

**Symptom.** After ISSUE-001's fix, `window.posthog` was an object and config was
correct (`api_host: us.i.posthog.com`, `has_opted_out:false`, `__loaded:true`), but
`posthog.capture()` returned `undefined` and STILL zero `POST` to ingestion. Probing
the running instance showed the smoking gun: **`capture_disabled: "bot-detected"`**.

**Root cause.** PostHog's default user-agent filter classifies **Playwright's
automated browser as a bot** and silently drops its events (capture returns
undefined). This is expected PostHog behavior — real human visitors are unaffected.
Our integration was correct the whole time; the *test* couldn't observe it.

**Web-searched fix (PostHog docs + posthog-js issues).** Set
`opt_out_useragent_filter: true` for the test environment. PostHog then tags
`$browser_type=bot` but processes the events. There's also a community matcher lib
`playwright-posthog`.

**Fix (applied).** Added a `posthogTestMode` customField
(`POSTHOG_TEST_MODE=1` at build time) → passes `opt_out_useragent_filter: true`.
Production builds never set it, so the bot filter stays on in prod. e2e builds with
the flag can verify real ingestion.

**Verification.** ✅ CONFIRMED 2026-05-31: `make test-posthog` (build with
`POSTHOG_TEST_MODE=1` + serve + Playwright) — all 4 tests pass: window.posthog
attaches, `$pageview` POSTs to `us.i.posthog.com`, autocapture fires on footer
click, scroll depth captures. Events reach ingestion.

---

## ISSUE-001 — Events never sent; `window.posthog` undefined (RESOLVED)

**Symptom.** Playwright validation showed events not reaching PostHog. Probing the
network: only `GET us-assets.i.posthog.com` (the JS bundle/config/surveys) — **zero
`POST` to the ingestion host `us.i.posthog.com/i/v0/e/`**. In-browser
`typeof window.posthog === 'undefined'`, even on the **production** build with the
key correctly baked in (`phc_kywb…` present in `build/assets/js/main.*.js`).

**Web-searched facts (PostHog docs):**
- Ingestion endpoint is `POST {api_host}/i/v0/e/` (or `/batch`); events ARE batched
  and flushed in a background job. Assets load from `…-assets.i.posthog.com`.
  → so seeing only `us-assets` GETs = SDK loaded but **never initialised/sent**.
- posthog-js loads asynchronously; **dynamic `import('posthog-js')` inside an SSR/
  hydration context (Docusaurus client module) races hydration** and can leave the
  instance unattached / events unsent. Recommended: import from a single module,
  use the `loaded` callback to know when it's ready.

**Root cause.** `src/posthog.js` used `import('posthog-js').then(({default}) => …)`
(dynamic). The init never reliably completed in the Docusaurus client-module
context, so no instance, no capture.

**Fix (applied).** Switch to a **static** `import posthog from 'posthog-js'` at the
top of the client module (safe — Docusaurus runs client modules only in the
browser). Move the first `$pageview` into posthog's `loaded` callback and assign
`window.posthog = ph` there so readiness is deterministic and debuggable.

**Verification.** Rebuild with `POSTHOG_KEY` exported, `yarn serve`, Playwright probe
must show `typeof window.posthog === 'object'` and ≥1 `POST` to `us.i.posthog.com`.
Status: re-validating.

### Test-harness gotchas found along the way (so they don't recur)
- **Firefox not installed** → `npx playwright install firefox` (config runs Firefox).
- **Stale `yarn start` reused** (`reuseExistingServer: !CI`) served an old build
  WITHOUT the key → tests skipped. Kill `:3000` first, or run with `CI=1`.
- **Dev server (`yarn start`) doesn't get `POSTHOG_KEY`** unless exported before
  Playwright launches it. Validate against the **production build** (`yarn serve`)
  where the key is baked in — that's the honest test.
- PostHog request bodies may be compressed/encoded; assert on event *presence*
  (host + POST) and `window.posthog.capture` round-trips, not raw JSON parsing.
