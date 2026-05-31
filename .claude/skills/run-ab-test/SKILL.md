---
name: run-ab-test
description: Run a PostHog A/B experiment on the blog end-to-end — define the experiment, add the feature-flag injection point in component code, validate both variants with Playwright, confirm the variant split + conversions in the data, and roll out the winner. Generalized per-experiment workflow with a task template. Use when setting up, validating, or analysing any A/B test on the site.
---

# Run an A/B test (PostHog experiment)

A repeatable, **per-experiment** workflow for A/B testing on the Bytes of Purpose
blog using PostHog experiments + feature flags. Pairs with `setup-posthog` (keys),
`query-posthog` (data readback), `author-blog-post` (component edits).

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
- [ ] Create the PostHog experiment/flag in the UI: key <FLAG_KEY>, variants
      50/50, goal metric = <conversion event>. (Manual, user.)
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
- [ ] Roll out winner (flag → 100% winner, or hard-code) and clean up the loser.
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

### Forcing a variant — three mechanisms

| Who | How | Scope |
|---|---|---|
| Test/QA yourself, locally | URL param `?ab=test`, `?ab-<key>=test`, or `?ab=flagA:test,flagB:control` | localhost only |
| Preview yourself, anywhere | devtools `posthog.featureFlags.overrideFeatureFlags({flags:{'<key>':'test'}})` | your browser |
| Force a specific customer/cohort | PostHog UI → flag → Release conditions → match email/distinct_id/cohort → 100% variant | server-side, sticky |

## Step 3 — Create the experiment in PostHog (manual)

PostHog → **Experiments → New experiment** → feature flag key `<FLAG_KEY>`, variants
`control`+`test` (50/50), goal metric = `<conversion event>`. Launch. (Or just a
multivariate **feature flag** with those variant keys for a plain A/B.)

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

Quick interactive debug: `npx playwright test <spec> --headed --debug`, or add a
throwaway spec that `console.log`s `page.evaluate(() => ({ ph: typeof window.posthog,
variant: window.posthog?.getFeatureFlag('<key>') }))`. See
`bytesofpurpose-blog/src/posthog-issues.md` for the full debugging history.
