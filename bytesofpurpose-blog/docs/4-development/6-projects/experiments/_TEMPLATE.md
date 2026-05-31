---
# Copy this file to <YYYY-MM-DD>-<flag-key>.md and fill it in.
# This doc is BOTH the experiment's design and its living timeline.
slug: experiment-<flag-key>
title: '<Experiment title>'
description: '<one-line: what we are testing and why>'
authors: [oeid]
tags: [experiments, ab-testing]
draft: true            # flip to false to publish on the blog
sidebar_position: 99
---

> **Status:** `proposed` · **Owner:** Omar · **Flag:** `<flag-key>` · **Created:** <YYYY-MM-DD>
>
> Lifecycle: `proposed` → `designed` → `draft` → `running` → `analyzing` → `concluded` → `rolled-out` / `abandoned`

A one-paragraph summary of the experiment a reader can grasp in 15 seconds:
what changes between variants, on which surface, and what we hope to learn.

<!-- truncate -->

## 1. Hypothesis

> **We believe** that `<change>` **will cause** `<measurable effect>` **because** `<reasoning>`.
> **We'll know we're right when** `<success criterion / metric threshold>`.

State it falsifiably. A hypothesis you can't disprove isn't an experiment.

## 2. Why this experiment (motivation)

What prompted it, what decision the result will inform, and what we'll do
differently depending on the outcome. If the answer doesn't change a decision,
reconsider running it.

## 3. Design

### Variants
| Variant | What the user sees / gets | Why this variant |
|---|---|---|
| `control` | <baseline> | the current behavior |
| `test` | <change> | <the lever we think matters> |

Keep variants to a **single changed dimension** so the result is interpretable.

### Metric
- **Primary (conversion):** `<event name>` — *why this is the right success signal.*
- **Guardrail(s):** <metric(s) that must not regress>.
- **Exposure:** `$feature_flag_called` (recorded by `getFeatureFlag`).

### Placement / injection point — *and why here*
- **Component:** `src/components/<X>` · **Page(s):** `<path>`.
- **Why this placement:** <why this surface gives a clean, sufficient signal — traffic
  volume, proximity to the conversion, no confounding elements, etc.>
- **Why NOT elsewhere:** <surfaces we deliberately did not instrument, and why>.

### Targeting & assignment
- Split: <e.g. 50/50>. Assignment: PostHog hashes `distinct_id` (sticky per user).
- Any forced cohorts / release conditions: <none | describe>.

### Sample size & duration
- Rough traffic estimate, minimum detectable effect, and how long we expect to run
  before calling significance. (Don't decide on a handful of events.)

## 4. Risks & decisions
- SSR shows control first paint (flags resolve client-side) — acceptable?
- Anything that could confound the result, and how we mitigate it.
- Rollback plan.

## 5. Timeline / log

| Date | State | Note |
|---|---|---|
| <YYYY-MM-DD> | proposed | designed via the `design-experiment` skill |

## 6. Outcome

*(Fill in at conclusion.)* Winner, the numbers (exposure + conversion split, lift,
significance), the decision made, and what we rolled out / learned.

---
**Links:** PostHog experiment `<id/url>` · registry `src/experiments.ts` · framework
[`designs/*-ab-testing-framework`](#) · execution skill `run-ab-test` · design skill
`design-experiment`.
