---
name: analyze-experiment
description: Analyze a running blog A/B experiment — pull the exposure split ($feature_flag_called) and conversion split (by variant) from PostHog, exclude bot traffic, compute conversion rate + lift, check significance, and WRITE the findings into the experiment's timeline doc (Outcome section + timeline log + status). Use once an experiment has been running and you want to read results, or before deciding a winner.
---

# Analyze an experiment

The **analyze** phase. Reads results from PostHog and records them in the experiment's
timeline doc so the decision (next phase, `conclude-experiment`) is grounded in written
numbers. Pairs with `query-posthog` (the readback mechanism).

## ▶️ FIRST STEP — create/locate the tracking tasks

```tasks
- [ ] Confirm the experiment is live + has enough traffic (don't analyze a handful of events).
- [ ] Pull exposure split: $feature_flag_called by $feature_flag_response (exclude bots).
- [ ] Pull conversion split: <conversion event> by variant (exclude bots).
- [ ] Compute conversion rate per variant + lift; note PostHog's significance verdict.
- [ ] Write results into the experiment timeline doc (Outcome + log; status → analyzing).
- [ ] Emit a Recommendation block (ship/keep/keep-running + confidence + why); hand off to decide-experiment.
```

## Step 1 — Sanity gates before reading anything

- Is the flag **launched** (`start_date` set)? A draft buckets no one. Check with
  `create_experiment.py --validate` or the PostHog UI.
- Is there **enough** traffic? Low-traffic blog → resist calling it early.
- Always **exclude bots**: `properties.$browser_type != 'bot'` (PostHog's filter is off
  in our test builds; real traffic should still be filtered in queries).

## Step 2 — Pull the data (query-posthog)

Map `.env` → CLI env per the `query-posthog` skill (per-var extraction, not `source`),
then run (substitute `<FLAG_KEY>` / `<conversion event>`):

```sql
-- Exposure split
SELECT properties.$feature_flag_response AS variant, count() AS exposures
FROM events
WHERE event = '$feature_flag_called' AND properties.$feature_flag = '<FLAG_KEY>'
  AND properties.$browser_type != 'bot' AND timestamp > now() - INTERVAL 30 DAY
GROUP BY variant ORDER BY variant

-- Conversion split
SELECT properties.variant AS variant, count() AS conversions
FROM events
WHERE event = '<conversion event>' AND properties.$browser_type != 'bot'
  AND timestamp > now() - INTERVAL 30 DAY
GROUP BY variant ORDER BY variant
```

## Step 3 — Compute & interpret

- **Conversion rate** per variant = conversions / exposures.
- **Lift** = (test rate − control rate) / control rate.
- **Significance:** read PostHog's **experiment results view** for the proper test —
  don't eyeball it or hand-roll a p-value. Note the probability-to-be-best / significance
  it reports, and whether it has reached the threshold.
- Watch for **sample-ratio mismatch** (exposures wildly off 50/50 → assignment/instrumentation bug).

## Step 4 — Write it into the timeline doc

Open `…/experiments/<date>-<flag-key>.md` and:
- Fill the **## 6. Outcome** section: per-variant exposures/conversions/rate, lift,
  significance verdict, and a one-line read.
- Append a **timeline log** row (date, state `analyzing` or `concluded`, note).
- Bump the post's `stage` frontmatter (`running` → `analyzing`) so its card moves on the
  Experimentation board; once the Outcome is final, flip `kind: experiment-plan` →
  `experiment-result` (the card lands in the terminal `concluded` column).

## Step 5 — Emit a recommendation (feeds the decision)

Analysis doesn't just report — it **recommends**, so the decision step has something to
act on. Write a short **## 7. Recommendation** block in the timeline doc:

```
**Recommendation:** ship `test` | keep `control` | keep running
**Confidence:** high | medium | low  (from significance + sample size)
**Why:** <one or two sentences grounded in the numbers — lift, significance, guardrails>
**Caveats:** <SRM, low sample, novelty effect, seasonality, anything that weakens it>
```

Rules for the recommendation:
- **keep running** if not significant AND sample is still small (most common early).
- **ship test** only if it beats control at significance with no guardrail regression.
- **keep control** if control wins, or test ≤ control at significance (null result —
  still a real, useful outcome).
- State confidence honestly; a significant result on tiny N is still low-confidence.

This is a **recommendation, not the decision** — it's read-only (don't flip flags here).
Hand off to **`decide-experiment`**, which applies the decision criteria + human judgment
and records the formal decision; then **`conclude-experiment`** executes it.

## Troubleshooting
| Symptom | Cause | Fix |
|---|---|---|
| 0 exposures | Flag never launched, or read with `getAllFlags` not `getFeatureFlag`. | Launch (`--launch`); ensure component uses `getFeatureFlag`. |
| Conversions but 0 exposures | Conversion fires but exposure isn't recorded. | Component must call `getFeatureFlag(key)` (records `$feature_flag_called`). |
| Counts look low / all bot | Bot filter, or `POSTHOG_TEST_MODE` data polluting. | Exclude `$browser_type='bot'`; ignore test-mode events when judging real results. |
| 401 on query | Used the `phc_` project key as the personal key. | Use the read-only `phx_` `POSTHOG_PERSONAL_API_KEY` (see `query-posthog`). |
