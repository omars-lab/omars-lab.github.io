---
name: design-experiment
description: Write the PRE-experiment design doc for a new A/B test / experiment on the blog — hypothesis, variants + reasoning, the conversion metric + why, and the injection-point/placement rationale (why we test it where we do), success criteria, sample-size/duration thinking, and risks. Produces the experiment as an /initiatives blog post (kind experiment-plan, stage proposed/designed) — a card on the Experimentation board — and hands off to run-ab-test for execution. Use BEFORE writing any experiment code.
---

# Design an experiment (pre-experiment design doc)

The **first** phase of the experiment lifecycle. Output is one durable doc that is both
the **design** and the seed of the **living timeline** for the experiment. It hands off
to `run-ab-test` (execute) → `analyze-experiment` (analyze) → `conclude-experiment` (decide).

The experiment is an **`/initiatives` blog POST** (the temporal half of the site), NOT a
`/craft` doc:
`bytesofpurpose-blog/blog/<YYYY-MM-DD>-<flag-key>.md` with `kind: experiment-plan` 📝,
`stage: designed` (or `proposed`), and `priority`. It is a card on the **Experimentation
board** (`/craft/product-management/experiments`, `<KanbanBoard board="experiments"/>`) — the card's
column is its `stage` frontmatter. There is no `_TEMPLATE.md` and no README timeline table;
the board replaces them. The durable PM experiment FRAMEWORK stays in
`/craft/product-management/experiments` (the lasting how-to, not the dated instance). See the
`groom-initiatives` skill for the board contract.

## ▶️ FIRST STEP when this skill runs — create the tracking tasks

Create one Claude task per item below (TaskCreate), substituting specifics:
```tasks
- [ ] Frame a falsifiable hypothesis (We believe X causes Y because Z; right when <metric threshold>).
- [ ] Define variants (control + test), each a SINGLE changed dimension, with the reasoning per variant.
- [ ] Choose the conversion metric + exposure event, and justify WHY it's the right success signal.
- [ ] Decide + justify the injection point / placement (which component + page, why there, why not elsewhere).
- [ ] State success criteria, rough sample size / duration, and the decision the result will inform.
- [ ] List risks/confounders + rollback plan.
- [ ] Write the `/initiatives` experiment POST (`kind: experiment-plan`, `stage: designed`, `priority`); it becomes a card on the Experimentation board.
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

1. Create `blog/<YYYY-MM-DD>-<flag-key>.md` with `kind: experiment-plan`, `stage: designed`
   (or `proposed`), `priority`, and the blog frontmatter (`title`/`sidebar_label`/`description`/
   `authors`/`tags`/`date`). It becomes a card on the Experimentation board.
2. Fill every section: hypothesis, motivation, variants table, metric + why, **placement
   + why here / why not elsewhere**, targeting, sample size/duration, risks, rollback. (The
   outline matches the `experiment-plan` kind contract in `scripts/lib/blog-kinds.json`.)
3. Publishing the post (`draft: false`) is what puts the card on the board — a draft post is
   NOT carded (and would 404 in prod). Keep `draft: true` only while it's not ready to show.
4. Hand off to **`run-ab-test`**: it adds the registry entry (`src/experiments.ts`) + the
   component injection point, then creates/validates/launches the PostHog experiment.

## Cross-links
- Framework design doc (how A/B works mechanically): `designs/2026-05-31-ab-testing-framework.mdx`.
- Board contract + lifecycle: **groom-initiatives**.
- Execute: **run-ab-test**. Analyze: **analyze-experiment**. Decide: **conclude-experiment**.
- Reference post: `blog/2026-05-31-support-button-copy.md` (`/initiatives/support-button-copy`).
