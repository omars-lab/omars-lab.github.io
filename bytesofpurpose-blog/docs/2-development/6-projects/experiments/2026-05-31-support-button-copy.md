---
slug: /development/projects/experiments/experiment-support-button-copy
title: 'Support button copy'
description: 'A/B test: does "Support the dev 💜" drive more PayPal clicks than "Buy me a coffee ☕"?'
authors: [oeid]
tags: [experiments, ab-testing, posthog]
draft: true
sidebar_position: 1
---

> **Status:** `running` (launched 2026-05-31; first data read done, far from significance) · **Owner:** Omar · **Flag:** `support-button-copy` · **Created:** 2026-05-31
>
> Lifecycle: `proposed` → `designed` → `draft` → **`running`** → `analyzing` → `concluded` → `rolled-out` / `abandoned`

Does the **wording** of the Support button change how often readers click it? We
compare the current "Buy me a coffee ☕" against a more direct "Support the dev 💜" on
the docs footer, measuring clicks to the PayPal donate form.

<!-- truncate -->

## 1. Hypothesis

> **We believe** that framing the ask as supporting *the developer* ("Support the dev 💜")
> rather than buying *a coffee* ("Buy me a coffee ☕") **will increase** the click-through
> rate on the Support button **because** it ties the action to a person and an ongoing
> effort rather than a one-off treat.
> **We'll know we're right when** the `test` variant's conversion rate beats `control`
> at PostHog-reported significance.

## 2. Why this experiment

The Support button is the blog's only monetization/appreciation surface. Copy is the
cheapest lever to test (no layout or flow change), so it's a good first experiment to
exercise the whole framework end-to-end. The result decides the button's default copy
going forward; a null result is still useful (keep the friendlier "coffee" framing).

## 3. Design

### Variants
| Variant | What the user sees | Why this variant |
|---|---|---|
| `control` | **Buy me a coffee ☕** | the current, friendly, low-commitment framing |
| `test` | **Support the dev 💜** | direct, person- and effort-oriented ask |

Single changed dimension: button label only. Everything else (PayPal form, amount,
placement) is identical, so any difference is attributable to copy.

### Metric
- **Primary (conversion):** `support button clicked` — fired on the donate form's
  `onSubmit`, tagged with `variant` + `$feature/support-button-copy`. This is the exact
  action we care about (intent to donate), one step before leaving for PayPal.
- **Exposure:** `$feature_flag_called` for `support-button-copy`, recorded when the
  component reads the flag via `getFeatureFlag`.
- **Guardrail:** none meaningful for a label swap.

### Placement / injection point — and why here
- **Component:** `src/components/SupportButton` (`<Support/>`). **Page:** the docs footer
  embed (`/docs/techniques/blogging-techniques/embed-structural-components/footer`).
- **Why this placement:** the `<Support/>` component is the single source of the button,
  so instrumenting it covers every place the button renders with no duplication. The
  conversion event sits on the form submit — as close to the actual donate action as we
  can measure client-side — minimizing confounders between exposure and conversion.
- **Navbar "Buy Me a Coffee?" link (revised 2026-06-01):** originally a separate static
  PayPal link left OUT of the test. Revised decision — the static link was converted to
  the `NavbarCoffee` React component (`src/components/NavbarCoffee`, registered via the
  `custom-coffee` navbar item type in `src/theme/NavbarItem/ComponentTypes.tsx`) so it
  reads the **same** `support-button-copy` flag. Why the change: the docs-footer
  `<Support/>` appears on only one page, so most visitors (incl. the homepage) never saw
  the experiment — exposure was tiny. Putting the navbar on the same flag makes the
  variant visible site-wide. Both surfaces tag the conversion with `surface` (`navbar` vs
  the footer form) + `$feature/support-button-copy`, so attribution is preserved while the
  variant is shared. Tradeoff accepted: exposure is now dominated by the sitewide navbar,
  so this primarily measures the label's effect via the navbar surface.

### Targeting & assignment
- Split **50/50**. PostHog hashes the visitor's `distinct_id`, so assignment is sticky
  per browser. No forced cohorts. (IDs are anonymous per-browser until we `identify()`.)

### Sample size & duration
- Low-traffic blog, so expect this to need several weeks to reach significance. Don't
  call it on a handful of clicks — defer to PostHog's experiment significance view.

## 4. Risks & decisions
- **SSR shows control first paint** (flags resolve client-side). Accepted — no layout
  shift, no blank flash.
- **Anonymous ids:** assignment is per-browser, not per-person. Fine for a blog.
- **Override flakiness:** `overrideFeatureFlags`+reload didn't re-bucket reliably in
  tests → local forcing uses the `?ab=` URL param (localhost-gated). Production visitors
  can't self-assign.
- **Rollback:** flip the flag to 100% control in PostHog (instant, no deploy).

## 5. Timeline / log

| Date | State | Note |
|---|---|---|
| 2026-05-31 | designed | hypothesis + design captured here |
| 2026-05-31 | injection point | `<Support/>` reads `EXPERIMENTS['support-button-copy']` via `resolveVariant`; conversion tagged with variant |
| 2026-05-31 | playwright validated | both variants render the right copy (`support-ab-test.spec.ts`); event ingestion proven separately |
| 2026-05-31 | draft created | PostHog experiment **id 374363**, linked flag 696584, 50/50, goal `support button clicked` — via `create_experiment.py --create`, read-back validated |
| 2026-05-31 | **running** | launched 19:16:55 UTC (`create_experiment.py --launch`) — now bucketing real traffic 50/50 |
| 2026-05-31 | live | site deployed to gh-pages (PostHog on, bot filter ON); experiment now collecting real exposures/conversions. This doc kept `draft:true` (hidden). |
| 2026-05-31 | analyzing | first data read: 3/3 exposure split (clean), 0 conversions. Pipeline confirmed. Recommendation: keep running (low confidence, tiny N). |
| 2026-06-01 | surface added | navbar "Buy Me a Coffee?" link wired into the **same** flag (`NavbarCoffee` + `custom-coffee` navbar type) so the variant shows site-wide, not just the one docs-footer page. Conversions tagged `surface=navbar/footer`. Broadens exposure (see Placement note + risk below). Covered by `debug-menu.spec.ts` (navbar copy flips on the homepage). |

## 6. Outcome

*Pending — experiment not yet launched.* Will record: exposure + conversion split by
variant, conversion-rate lift, PostHog significance, the decision, and what was rolled out.

---
**Links:** PostHog experiment id `374363` (project 448205) · registry
[`src/experiments.ts`](https://github.com/omars-lab/omars-lab.github.io/blob/master/bytesofpurpose-blog/src/experiments.ts) ·
component `src/components/SupportButton` · framework design doc
`designs/2026-05-31-ab-testing-framework.mdx` · skills `design-experiment` →
`run-ab-test` → `analyze-experiment` → `conclude-experiment`.
