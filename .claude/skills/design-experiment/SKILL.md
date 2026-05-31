---
name: design-experiment
description: Write the PRE-experiment design doc for a new A/B test / experiment on the blog — hypothesis, variants + reasoning, the conversion metric + why, and the injection-point/placement rationale (why we test it where we do), success criteria, sample-size/duration thinking, and risks. Produces the experiment's entry in the published experiment-timeline folder (in `proposed`/`designed` state) and hands off to run-ab-test for execution. Use BEFORE writing any experiment code.
---

# Design an experiment (pre-experiment design doc)

The **first** phase of the experiment lifecycle. Output is one durable doc that is both
the **design** and the seed of the **living timeline** for the experiment. It hands off
to `run-ab-test` (execute) → `analyze-experiment` (analyze) → `conclude-experiment` (decide).

The doc lives in the **published** experiments section:
`bytesofpurpose-blog/docs/4-development/6-projects/experiments/<YYYY-MM-DD>-<flag-key>.md`
(start it from `_TEMPLATE.md` in that folder). The folder `README.md` is the timeline index.

## ▶️ FIRST STEP when this skill runs — create the tracking tasks

Create one Claude task per item below (TaskCreate), substituting specifics:
```tasks
- [ ] Frame a falsifiable hypothesis (We believe X causes Y because Z; right when <metric threshold>).
- [ ] Define variants (control + test), each a SINGLE changed dimension, with the reasoning per variant.
- [ ] Choose the conversion metric + exposure event, and justify WHY it's the right success signal.
- [ ] Decide + justify the injection point / placement (which component + page, why there, why not elsewhere).
- [ ] State success criteria, rough sample size / duration, and the decision the result will inform.
- [ ] List risks/confounders + rollback plan.
- [ ] Write the doc from _TEMPLATE.md, add a row to the experiments README timeline (status `designed`).
- [ ] Hand off: confirm with the user, then proceed to run-ab-test to build the injection point.
```

## What makes a good experiment design

- **Falsifiable hypothesis.** "We believe `<change>` will cause `<measurable effect>`
  because `<reason>`; we'll know when `<metric crosses threshold>`." If you can't state
  the disproving outcome, it's not an experiment.
- **One changed dimension per pair of variants** — otherwise the result isn't
  attributable. (Copy OR color OR placement, not all three.)
- **The metric is the action you actually care about**, measured as close to it as
  possible, and it must be an event PostHog captures (existing or newly added).
- **Placement is a deliberate choice, documented.** This is the part most designs skip:
  - *Why this surface* — enough traffic, close to the conversion, free of confounders.
  - *Why instrument this component/page and not another* — avoid splitting the signal
    across two surfaces (e.g. the navbar PayPal link vs the `<Support/>` component).
  - *What you deliberately did NOT instrument*, and why.
- **The result must change a decision.** Write down what you'll do for each outcome
  (ship test / keep control / iterate). No decision → don't run it.
- **Sample size & duration sanity:** low-traffic blog → expect weeks; never call
  significance on a handful of events (defer to PostHog's experiment view).

## Steps

1. Copy `_TEMPLATE.md` → `<YYYY-MM-DD>-<flag-key>.md` in the experiments docs folder.
2. Fill every section: hypothesis, motivation, variants table, metric + why, **placement
   + why here / why not elsewhere**, targeting, sample size/duration, risks, rollback.
3. Set the doc status to `designed` and add a row to the folder `README.md` timeline table.
4. Keep `draft: true` in frontmatter until you're happy to publish it on the blog.
5. Hand off to **`run-ab-test`**: it adds the registry entry (`src/experiments.ts`) + the
   component injection point, then creates/validates/launches the PostHog experiment.

## Cross-links
- Framework design doc (how A/B works mechanically): `designs/2026-05-31-ab-testing-framework.mdx`.
- Execute: **run-ab-test**. Analyze: **analyze-experiment**. Decide: **conclude-experiment**.
- Reference entry: `…/experiments/2026-05-31-support-button-copy.md`.
