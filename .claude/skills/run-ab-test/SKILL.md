---
name: run-ab-test
description: Run a PostHog A/B experiment on the blog end-to-end — define the experiment, add the feature-flag injection point in component code, validate both variants with Playwright, confirm the variant split + conversions in the data, and roll out the winner. Generalized per-experiment workflow with a task template. Use when setting up, validating, or analysing any A/B test on the site.
---

# Run an A/B test (PostHog experiment)

A repeatable, **per-experiment** workflow for A/B testing on the Bytes of Purpose
blog using PostHog experiments + feature flags. This is the **execute** phase of the
experiment lifecycle:

**`design-experiment`** (design doc) → **run-ab-test** (build + create/validate/launch) →
**`analyze-experiment`** (results) → **`conclude-experiment`** (roll out the winner).

Each experiment has **one timeline doc** at
`bytesofpurpose-blog/docs/4-development/6-projects/experiments/<date>-<flag-key>.md`
(design + living status + outcome). Keep that doc's status + the folder `README.md`
timeline table current as the experiment moves through this skill (injection point →
draft → validated → running). Pairs with `setup-posthog` (keys), `query-posthog`
(readback), `author-blog-post` (component edits).

## ▶️ FIRST STEP when this skill runs — create the tracking tasks

For the experiment being set up, create one Claude task per item in the **Task
template** below (via TaskCreate), substituting the experiment's specifics
(`<FLAG_KEY>`, `<variant copy>`, `<component>`, `<conversion event>`). Mark each
in_progress/completed as you go. Do this BEFORE writing code so the run is tracked.
One task set per experiment — if several experiments are in flight, prefix task
subjects with the flag key.

### Task template
```tasks
- [ ] Define experiment: pick <FLAG_KEY>, variants (control/test) + copy, the
      conversion event, and which component/page is the injection point.
- [ ] Create the PostHog experiment/flag (scripted): create_experiment.py
      --create → --validate, then --launch after user confirms. Needs a
      WRITE-scoped key (POSTHOG_WRITE_API_KEY). Launch is the user-gated step.
- [ ] Add the injection point in code: read the flag in <component>, render per
      variant, capture exposure (getFeatureFlag) + tag the conversion with variant.
- [ ] Add/extend a Playwright spec: force each variant, assert the right copy
      renders and exposure+conversion events fire to ingestion.
- [ ] Build test-mode + run the spec: `make test-posthog` /
      `npx playwright test <spec>`. All variants green.
- [ ] Confirm exposure split in data: query $feature_flag_called by variant
      (exclude $browser_type='bot').
- [ ] Confirm conversion split in data: query <conversion event> by variant.
- [ ] Run until significance in PostHog; record the decision.
- [ ] Update the experiment timeline doc status as you go (draft → validated → running)
      and keep the experiments README table row current.
- [ ] Roll out winner (flag → 100% winner, or hard-code) and clean up the loser.
      (Handled by the `conclude-experiment` skill.)
```

## Step 1 — Define the experiment

Decide and write down: flag key (kebab-case), the 2+ variants and their copy/behavior,
the **conversion event** (an existing or new `posthog.capture` event), and the
**injection point** (the component + the page that renders it). Keep variants to a
single changed dimension so results are interpretable.

## Step 2 — Add the code injection point

This is the core wiring. Pattern (grounded in posthog-js):

```tsx
import posthog from 'posthog-js';

const FLAG_KEY = '<flag-key>';
const VARIANT = { control: '<copy A>', test: '<copy B>' };

function Component() {
  const [variant, setVariant] = React.useState('control');
  React.useEffect(() => {
    // onFeatureFlags ensures flags are loaded; getFeatureFlag records the
    // $feature_flag_called EXPOSURE event automatically.
    return posthog.onFeatureFlags(() => {
      setVariant((posthog.getFeatureFlag(FLAG_KEY) as string) || 'control');
    });
  }, []);
  return (
    <button
      data-testid="<flag-key>-button"
      onClick={() => posthog.capture('<conversion event>', { variant, [`$feature/${FLAG_KEY}`]: variant })}
    >
      {VARIANT[variant] ?? VARIANT.control}
    </button>
  );
}
```

Injection-point checklist:
- `data-testid` on the element so Playwright can target it deterministically.
- Default to `control` for SSR (flags resolve client-side; never blank-flash).
- Tag the conversion event with the variant (`variant` + `$feature/<key>`) so the
  split is queryable even without the experiment stats engine.
- Confirm the component is actually rendered on a real page (grep the build) —
  components only used in Storybook won't get traffic.

**Shared framework:** declare the experiment in `bytesofpurpose-blog/src/experiments.ts`
(`EXPERIMENTS` registry) and read it with `resolveVariant(exp, setVariant)` — that
helper handles the localhost URL override + PostHog flag + exposure for you.
**Reference:** `src/components/SupportButton/index.tsx` (flag `support-button-copy`,
control "Buy me a coffee ☕" / test "Support the dev 💜", conversion
`support button clicked`, on the docs footer page). **Design doc:**
`designs/2026-05-31-ab-testing-framework.mdx`.

### Putting one experiment on a sitewide surface (e.g. the navbar)

A component embedded in one doc only gets exposure on that page — most visitors
(incl. the homepage) never see it, so the experiment barely collects data. To make a
variant visible **sitewide**, put a high-traffic surface on the **same flag**:

- The navbar can't read a flag as a `type:'html'` link (HTML strings can't run
  hooks). Convert it to a **React component** and register a **custom navbar item
  type** by swizzling `@theme/NavbarItem/ComponentTypes` (add `'custom-coffee':
  NavbarCoffee`), then use `{ type: 'custom-coffee', position: 'right' }` in
  `docusaurus.config.js`. **Reference:** `src/components/NavbarCoffee` + that swizzle
  — it reads `support-button-copy` via the same `resolveVariant`.
- When **multiple surfaces** share one flag, tag each conversion with a `surface`
  prop (e.g. `surface: 'navbar'` vs the footer form) alongside
  `[`$feature/<key>`]: variant`, so attribution stays separable while the variant is
  shared. Note the tradeoff: a sitewide surface will **dominate exposure**, so the
  result mostly measures that surface — record this in the experiment doc (see the
  2026-06-01 revision in `…/experiments/2026-05-31-support-button-copy.md`).
- A React navbar component ships in prod (unlike the dev-only DebugMenu), so its
  change **needs a deploy**; verify with a regression run + `validate-deployment`.

### Forcing a variant — three mechanisms

| Who | How | Scope |
|---|---|---|
| Test/QA yourself, locally | the **floating DebugMenu** (bottom-right on `yarn start`) → Experiments → click a variant; or the URL param `?ab=test`, `?ab-<key>=test`, `?ab=flagA:test,flagB:control` it writes | localhost only |
| Preview yourself, anywhere | devtools `posthog.featureFlags.overrideFeatureFlags({flags:{'<key>':'test'}})` | your browser |
| Force a specific customer/cohort | PostHog UI → flag → Release conditions → match email/distinct_id/cohort → 100% variant | server-side, sticky |

The **DebugMenu** (`src/components/DebugMenu`, mounted via the swizzled
`@theme/Root`) is the easiest QA entry point: it lists every registered experiment,
shows the resolved variant + its source, and toggles variants by writing the same
`?ab-<key>=<variant>` URL param. It renders ONLY on localhost in a dev build (it's
stripped from the production bundle). Covered by `test/e2e/debug-menu.spec.ts`.

## Step 3 — Create the experiment in PostHog (scripted: create → validate → launch)

**No browser needed.** The official `@posthog/cli` has no flag/experiment *create*
command (only `query`/`task`/`endpoints`/`schema`), but PostHog's **REST API** does, and
`create_experiment.py` (in this skill dir) drives it. The flow is deliberately staged so
"go live" is a separate step: **create a DRAFT → validate it → ask the human → launch.**

```bash
python3 .claude/skills/run-ab-test/create_experiment.py --check     # dry-run, shows the payload
python3 .claude/skills/run-ab-test/create_experiment.py --create    # POST a DRAFT (no traffic yet)
python3 .claude/skills/run-ab-test/create_experiment.py --validate  # read back: variants/goal/draft
# → confirm with the user, THEN:
python3 .claude/skills/run-ab-test/create_experiment.py --launch     # start it (buckets real traffic)
```

One POST to `/api/projects/<id>/experiments/` with `parameters.feature_flag_variants`
creates the experiment **and** its linked multivariate flag. Launch = PATCH `start_date`.
**Draft vs launched:** a draft is wired but dormant — real visitors all fall through to
`control`, no `$feature_flag_called` exposure, stats paused; launching sets `start_date`
and begins the 50/50 sticky split. (To customize: edit `FLAG_KEY`/`VARIANTS`/
`CONVERSION_EVENT` at the top of the script — it mirrors `src/experiments.ts`.)

**Keys / scopes (gotcha):** reads use `POSTHOG_PERSONAL_API_KEY` (read-only); **writes
(create/launch) need a separate `POSTHOG_WRITE_API_KEY`** with scopes `experiment:write`
+ `feature_flag:write`. A read-only key returns `403 permission_denied: API key missing
required scope 'experiment:write'`. Keep them separate (least privilege); the script
auto-selects which key per operation.

Manual fallback (if you'd rather click): PostHog → **Experiments → New experiment** →
flag key `<FLAG_KEY>`, variants `control`+`test` (50/50), goal = `<conversion event>`.

## Step 4 — Validate both variants (Playwright)

Force each variant with the **localhost URL param** `?ab=<variant>` (deterministic,
applied pre-hydration — much more reliable than `overrideFeatureFlags`+reload, which
was flaky). Assert copy + that the conversion event reaches ingestion. Run against the
production build with `POSTHOG_TEST_MODE=1` (PostHog drops bot/automated-browser
events otherwise — see `posthog-issues.md` ISSUE-002). Point the spec at the page that
renders the component (`PH_AB_PAGE`), not `/`.

```bash
set -a; source .env; set +a
make test-posthog                                   # builds test-mode + runs posthog specs
# or one spec:
( cd bytesofpurpose-blog && POSTHOG_TEST_MODE=1 yarn build && yarn serve --port 4173 --no-open & ); sleep 6
PH_BASE_URL=http://localhost:4173 npx playwright test <spec> --reporter=list
```
Reference spec: `bytesofpurpose-blog/test/e2e/support-ab-test.spec.ts`.

**Per-variant screenshots:** the spec captures each variant to
`test-results/ab/<flag-key>-<variant>.png` (artifacts only — no baseline diff, so a
visual change never fails the run). Use them to eyeball control-vs-treatment without
re-running, or to embed in the experiment's timeline doc. `test-results/` is gitignored;
copy a PNG into the experiments docs folder if you want it committed into the lab notebook.

## Step 5 — Confirm the data (query-posthog)

Map `.env` → CLI env (see `query-posthog`), then:

```sql
-- Exposure split
SELECT properties.$feature_flag_response AS variant, count() AS exposures
FROM events
WHERE event = '$feature_flag_called' AND properties.$feature_flag = '<FLAG_KEY>'
  AND properties.$browser_type != 'bot' AND timestamp > now() - INTERVAL 14 DAY
GROUP BY variant ORDER BY variant

-- Conversion split
SELECT properties.variant AS variant, count() AS conversions
FROM events
WHERE event = '<conversion event>' AND properties.$browser_type != 'bot'
  AND timestamp > now() - INTERVAL 14 DAY
GROUP BY variant ORDER BY variant
```
Conversion rate = conversions / exposures per variant. Let PostHog's experiment view
call significance; don't decide on a handful of events.

## Step 6 — Roll out the winner

Set the flag to 100% of the winner in PostHog (instant, no deploy), or hard-code the
winning copy and retire the flag. Record the result in this skill +
`posthog-integration-plan.md`, and close the experiment's tasks.

## Troubleshooting

Symptoms seen while building this workflow and how to resolve them:

| Symptom | Cause | Fix |
|---|---|---|
| Playwright test **times out** waiting for the element | The component isn't on the page you pointed at (e.g. it's only in a Storybook story, or it's the navbar link not the `<Support>` component). | `grep -rl "data-testid=\"<key>-button\"" build/` to find which built page renders it; set `PH_AB_PAGE` to that path. Confirm with `curl -s <url> | grep data-testid`. |
| `window.posthog` is **undefined** in the test | The served build was built **without** `POSTHOG_KEY` exported (init is gated on the key). | Rebuild with `set -a; source .env; set +a; POSTHOG_TEST_MODE=1 yarn build`. Verify: `grep -rl "$POSTHOG_KEY_PREFIX" build/assets/js/main.*.js`. |
| Variant copy never changes / always control | `overrideFeatureFlags()` doesn't re-fire `onFeatureFlags`, so React state never updates (confirmed: flag flips but copy doesn't). | Use the localhost URL param `?ab=<variant>` instead — deterministic, pre-hydration. SSR always shows the control default; that's expected. |
| Events fire in test but **0 in the data** | PostHog bot filter drops automated-browser events. | Build with `POSTHOG_TEST_MODE=1` (`opt_out_useragent_filter`). Verify flag in bundle: `grep -rl opt_out_useragent_filter build/assets/js/*.js`. In queries, real traffic = `properties.$browser_type != 'bot'`. |
| Two buttons match the locator | The navbar has its own "Buy Me a Coffee?" PayPal link separate from `<Support>`. | Target the component's unique `data-testid`, not button text. |
| `$feature_flag_called` missing in data | Variant read with `getAllFlags`/payload instead of `getFeatureFlag`. | Only `getFeatureFlag(key)` records the exposure event. |
| `create_experiment.py` **403 `permission_denied: API key missing required scope 'experiment:write'`** | The personal key is read-only (made for `query-posthog`). | Create a separate WRITE key (scopes `experiment:write` + `feature_flag:write`), put it in `.env` as `POSTHOG_WRITE_API_KEY`. The script uses the write key only for `--create`/`--launch`. |
| `create_experiment.py` says **"no experiment exists"** right after a successful `--create` | Caller passed `FLAG_KEY` where `find_existing` expects the **API auth key** (the param was named `key`, shadowing the flag-key constant → the call silently auth-failed and returned None). | Pass the resolved auth key to `find_existing(auth_key, …)`, not the flag key. Fixed; param renamed `auth_key`. Lesson: don't name an auth-token param `key` next to a `FLAG_KEY` constant. |
| Need to create flags/experiments from the CLI | The official `@posthog/cli` has **no** flag/experiment create command. | Use the REST API (`create_experiment.py`) — `@posthog/cli` is only for `query`/`task`/`endpoints`/`schema`. |

Quick interactive debug: `npx playwright test <spec> --headed --debug`, or add a
throwaway spec that `console.log`s `page.evaluate(() => ({ ph: typeof window.posthog,
variant: window.posthog?.getFeatureFlag('<key>') }))`. See
`bytesofpurpose-blog/src/posthog-issues.md` for the full debugging history.
