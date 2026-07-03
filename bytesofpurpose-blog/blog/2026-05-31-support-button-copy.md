---
slug: support-button-copy
title: 'Support CTA: link vs button'
kind: experiment-plan
sidebar_label: 'Support CTA test'
description: 'A/B test: does a styled button draw more PayPal donate clicks than a plain text link, with identical "$5 coffee" copy?'
authors: [oeid]
tags: [experiments, ab-testing, posthog]
date: 2026-05-31
draft: false
stage: running
priority: medium
flag: support-button-copy
owner: Omar
---

<ExperimentOverview note="re-scoped 2026-06-01 from a copy test to a presentation test; same flag key" />

Does the **presentation** of the coffee CTA, a plain text link vs. a styled button,
change how often readers click through to PayPal? Both arms show the **same** copy
("Buy me a $5 coffee ☕") on the **/support** page; the only thing that varies is whether
that copy renders as an inline text link or a prominent button.

<!-- truncate -->

> **⚠️ Re-scoped 2026-06-01 (copy → presentation).** This experiment originally tested
> *copy* ("Buy me a coffee ☕" vs "Support the dev 💜") on the docs-footer `<Support/>`
> button. On **2026-06-01** it was pivoted to test *presentation* (text link vs styled
> button) on the **/support** page coffee CTA, with identical copy in both arms. The
> **flag key (`support-button-copy`) and the conversion event name (`support button
> clicked`) were intentionally kept the same** so the PostHog funnel stays continuous.
> **Consequence:** any exposures/conversions recorded **before 2026-06-01** belong to the
> OLD copy test and **must be excluded** from the presentation analysis. Split every query
> on 2026-06-01.

## 1. Hypothesis

> **We believe** that rendering the coffee CTA as a **styled button** rather than a **plain
> text link** **will increase** the click-through rate to the PayPal donate form **because**
> a button is a more salient, affordance-clear call to action than inline link text.
> **We'll know we're right when** the `test` (button) variant's conversion rate beats
> `control` (link) at PostHog-reported significance.

## 2. Why this experiment

The coffee CTA is the blog's primary monetization/appreciation surface, now consolidated
onto the dedicated **/support** page alongside the other channel CTAs (GitHub, LinkedIn,
Shopify). Presentation is a cheap, single-dimension lever to test, no copy, flow, or
destination change, so it isolates the effect of visual prominence. The result decides
how the coffee CTA should render going forward; a null result is still useful (keep the
quieter link style that visually matches the sibling channel CTAs).

## 3. Design

### Variants
| Variant | What the user sees | Why this variant |
|---|---|---|
| `control` | "Buy me a $5 coffee ☕" rendered as a **plain text link** (styled to match the sibling channel CTAs) | the quieter, in-context framing that blends with the other /support channels |
| `test` | "Buy me a $5 coffee ☕" rendered as a **styled button** (`button button--primary button--lg`) | a prominent, high-affordance call to action |

Single changed dimension: **presentation (link vs button)**. The copy is **identical** in
both arms (`'Buy me a $5 coffee ☕'`, defined once in `src/experiments.ts`), and the
destination (PayPal donate form, **$5**) is identical, so any difference is attributable to
presentation alone.

### Metric
- **Primary (conversion):** `support button clicked`, fired on the CoffeeButton's
  `onClick`, tagged with `variant`, `surface: 'support-page'`, and
  `$feature/support-button-copy`. This is the action we care about (intent to donate), one
  step before leaving for PayPal.
- **Exposure:** `$feature_flag_called` for `support-button-copy`, recorded when
  `CoffeeButton` reads the flag via `resolveVariant` → `getFeatureFlag`.
- **Guardrail:** none meaningful for a presentation swap.

### Placement / injection point, and why here
- **Component:** `src/components/Support/CoffeeButton` (`<CoffeeButton/>`). **Page:** the
  **/support** page (`src/pages/support.tsx`), rendered as the coffee channel's CTA.
- **Why this placement:** the /support page is the single, intentional home for the coffee
  ask, so the CTA renders exactly once and the experiment has no duplication. `CoffeeButton`
  reads `variant === 'test'` to decide between the button and link rendering; the conversion
  event sits on the same element's `onClick`, as close to the donate action as we can
  measure client-side, minimizing confounders between exposure and conversion.
- **History (pre-2026-06-01 placement, now retired):** the test previously lived on the
  docs-footer `<Support/>` component, and a navbar "Buy Me a Coffee?" link
  (`NavbarCoffee` / `custom-coffee` navbar type) was briefly wired into the same flag to
  broaden exposure. As of the 2026-06-01 re-scope the experiment is driven solely by the
  /support-page `CoffeeButton`. (See the re-scope callout above for why the flag/event
  names were preserved.)

### Targeting & assignment
- Split **50/50**. PostHog hashes the visitor's `distinct_id`, so assignment is sticky
  per browser. No forced cohorts. (IDs are anonymous per-browser until we `identify()`.)

### Sample size & duration
- Low-traffic blog, so expect this to need several weeks to reach significance. Don't
  call it on a handful of clicks, defer to PostHog's experiment significance view. Note
  the effective sample for the **presentation** test starts at 2026-06-01, not 2026-05-31.

## 4. Risks & decisions
- **SSR shows control first paint** (flags resolve client-side). Accepted, the control is
  a link and the test is a button, so there is a possible presentation flash on bucket-in;
  acceptable for a low-traffic blog.
- **Anonymous ids:** assignment is per-browser, not per-person. Fine for a blog.
- **Funnel continuity vs. meaning:** keeping the flag key and event name across the
  copy→presentation re-scope preserves the historical funnel but changes its **meaning** on
  2026-06-01. Every analysis must split on that date (see callout + M2 monitoring note).
- **Override flakiness:** `overrideFeatureFlags`+reload didn't re-bucket reliably in
  tests → local forcing uses the `?ab=` URL param (localhost-gated). Production visitors
  can't self-assign.
- **Rollback:** flip the flag to 100% control in PostHog (instant, no deploy).

## 5. Timeline / log

| Date | State | Note |
|---|---|---|
| 2026-05-31 | designed | original **copy** hypothesis + design captured (footer `<Support/>`, "coffee" vs "support the dev") |
| 2026-05-31 | injection point | `<Support/>` read `EXPERIMENTS['support-button-copy']` via `resolveVariant`; conversion tagged with variant |
| 2026-05-31 | playwright validated | both variants rendered the right copy (`support-ab-test.spec.ts`); event ingestion proven separately |
| 2026-05-31 | draft created | PostHog experiment **id 374363**, linked flag 696584, 50/50, goal `support button clicked`, via `create_experiment.py --create`, read-back validated |
| 2026-05-31 | **running** | launched 19:16:55 UTC (`create_experiment.py --launch`), bucketing real traffic 50/50 |
| 2026-05-31 | live | site deployed to gh-pages (PostHog on, bot filter ON). Doc kept `draft:true` (hidden). |
| 2026-05-31 | analyzing | first data read: 3/3 exposure split (clean), 0 conversions. Pipeline confirmed. |
| 2026-06-01 | **re-scoped (copy → presentation)** | Experiment pivoted from a copy test to a **presentation** test: both arms now show identical copy ("Buy me a $5 coffee ☕"); `control` = plain text **link**, `test` = styled **button**. Moved to the **/support** page coffee CTA (`src/components/Support/CoffeeButton`); footer `<Support/>` + navbar `NavbarCoffee` surfaces retired from the flag. PayPal amount raised to **$5**. **Flag key + conversion event name unchanged** for funnel continuity, so pre-2026-06-01 data is OLD-copy-test data and excluded from the presentation analysis. |

## 6. Outcome

*Pending, collecting presentation-test data since 2026-06-01.* Will record: exposure +
conversion split by variant (filtered to ≥2026-06-01), conversion-rate lift, PostHog
significance, the decision, and what was rolled out.

---
**Links:** PostHog experiment id `374363` (project 448205) · registry
[`src/experiments.ts`](https://github.com/omars-lab/omars-lab.github.io/blob/master/bytesofpurpose-blog/src/experiments.ts) ·
component `src/components/Support/CoffeeButton` · page `src/pages/support.tsx` · framework
design doc `designs/2026-05-31-ab-testing-framework.mdx` · skills `design-experiment` →
`run-ab-test` → `analyze-experiment` → `conclude-experiment`.
