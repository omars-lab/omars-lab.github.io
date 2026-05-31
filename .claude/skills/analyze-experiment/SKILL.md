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
- [ ] Write results into the experiment timeline doc (Outcome + log; status → analyzing/concluded).
- [ ] Recommend a decision, hand off to conclude-experiment (user-gated).
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
- Update the status line + the **README timeline table** row.

Then recommend a decision and hand off to **`conclude-experiment`** (the act-on-it phase).
Do not flip flags here — analysis is read-only.

## Troubleshooting
| Symptom | Cause | Fix |
|---|---|---|
| 0 exposures | Flag never launched, or read with `getAllFlags` not `getFeatureFlag`. | Launch (`--launch`); ensure component uses `getFeatureFlag`. |
| Conversions but 0 exposures | Conversion fires but exposure isn't recorded. | Component must call `getFeatureFlag(key)` (records `$feature_flag_called`). |
| Counts look low / all bot | Bot filter, or `POSTHOG_TEST_MODE` data polluting. | Exclude `$browser_type='bot'`; ignore test-mode events when judging real results. |
| 401 on query | Used the `phc_` project key as the personal key. | Use the read-only `phx_` `POSTHOG_PERSONAL_API_KEY` (see `query-posthog`). |
