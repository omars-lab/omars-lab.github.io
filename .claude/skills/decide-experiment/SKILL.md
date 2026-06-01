---
name: decide-experiment
description: Turn an experiment's analysis into a formal, recorded DECISION — apply the decision criteria (significance threshold, minimum detectable effect, sample size, guardrails) plus business judgment to the recommendation from analyze-experiment, weigh the options, and write a decision readout into the experiment's timeline doc. Produces the "how we made the call" record; hands the chosen action to conclude-experiment. Use after analyzing results, when deciding ship vs keep vs keep-running.
---

# Decide an experiment (analysis → decision)

The **judgment** phase, between data and action:

`analyze-experiment` (data + recommendation) → **decide-experiment** (apply criteria +
judgment → recorded decision) → `conclude-experiment` (execute the rollout).

Analysis tells you what the numbers say and recommends a direction; **this skill is where
the call is actually made and justified**, so the decision is deliberate and auditable —
not a gut reaction to a dashboard. It writes nothing to PostHog (read-only on infra); its
output is a decision readout in the timeline doc.

## ▶️ FIRST STEP — create the tracking tasks

```tasks
- [ ] Pull the analysis Recommendation + numbers from the timeline doc (run analyze-experiment if stale).
- [ ] Check decision GATES: significance reached? sample ≥ target / MDE? guardrails intact? no SRM?
- [ ] Weigh options (ship test / keep control / keep running / iterate) against criteria + business context.
- [ ] Write the Decision readout into the timeline doc (## 8. Decision) and set status.
- [ ] Hand the chosen action to conclude-experiment (execution is user-gated).
```

## Step 1 — Gather the inputs

From the experiment's timeline doc (`…/experiments/<date>-<flag-key>.md`):
- the **Outcome** numbers (exposures, conversions, rate, lift per variant),
- the **Recommendation** block analyze-experiment wrote.
If they're missing or stale, run `analyze-experiment` first — don't decide on old data.

## Step 2 — Apply the decision gates

A decision is only as good as the gates it clears. Check each, explicitly:

| Gate | Question | If it fails |
|---|---|---|
| **Significance** | Did PostHog's experiment view reach the significance threshold (e.g. 95% / prob-to-be-best)? | Lean **keep running** (or stop for futility). |
| **Sample / MDE** | Enough exposures to detect the minimum effect you cared about? | Low confidence — **keep running** unless futile. |
| **Guardrails** | Did any guardrail metric regress (e.g. bounce, errors)? | Don't ship test even if conversion won. |
| **SRM** | Is the split ~50/50 as assigned? A skew signals an instrumentation bug. | Distrust the result; fix + rerun. |
| **Practical effect** | Is the lift big enough to *matter*, not just be significant? | A tiny significant lift may not be worth the complexity. |
| **External validity** | Novelty effect, seasonality, a one-off traffic spike? | Discount accordingly; maybe extend. |

## Step 3 — Weigh the options

Lay out the real choices and pick one, tied to the gates above and to business context
(what the result is *for*):
- **Ship `test`** — beats control at significance, guardrails intact, effect worth it.
- **Keep `control`** — control wins, or test fails to beat it (a valid null result).
- **Keep running** — underpowered / not yet significant and not futile.
- **Iterate** — inconclusive but suggestive → design a v2 (new variant), don't just ship.

The recommendation from analysis is an input, not a verdict — you can override it with
stated reasoning (e.g. "significant but lift too small to justify maintaining the flag →
keep control"). That override IS the value of this step; record the why.

## Step 4 — Write the decision readout

Append a **## 8. Decision** block to the timeline doc — the durable "how we made the call":

```
**Decision:** ship `test` | keep `control` | keep running | iterate (v2)
**Date / decided by:** <date> / Omar
**Evidence:** <the numbers + significance that drove it>
**Gates:** significance ✅/❌ · sample/MDE ✅/❌ · guardrails ✅/❌ · SRM ✅/❌
**Rationale:** <why this option over the others, incl. any override of the analysis rec>
**Action handed to conclude-experiment:** <flag → 100% test | flag → 100% control | none yet>
**Revisit:** <when/whether to re-run or follow up>
```

Update the status line (`analyzing` → `concluded`, or stay `running` if "keep running")
and the README timeline table. For decisions that warrant a fuller write-up, the
`documenting-tech-designs` / `preparing-decision-docs` skills can structure a standalone
decision doc — but the timeline block is the minimum durable record.

## Step 5 — Hand off

Pass the chosen action to **`conclude-experiment`**, which performs the rollout
(`roll_out.py --winner …`) — that step is **user-gated** (shipping to 100% of real
visitors). Decide-experiment itself changes no infrastructure.

## Cross-links
- Upstream: **analyze-experiment** (data + recommendation). Downstream:
  **conclude-experiment** (execute). Data: **query-posthog**. Full lifecycle starts at
  **design-experiment**.
