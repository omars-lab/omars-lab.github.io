---
slug: homepage-hero-anim
title: 'Homepage hero: scroll vs camera-flash'
kind: experiment-plan
sidebar_label: 'Hero animation test'
description: 'A/B test: does a camera-flash hero rotator draw more homepage chooser-card clicks than the seamless scrolling film strip, with identical cards and copy in both arms?'
authors: [oeid]
tags: [experiments, ab-testing, posthog]
date: 2026-06-26
draft: false
stage: designed
priority: medium
---

> **Status:** `designed` · **Owner:** Omar · **Flag:** `homepage-hero-anim` · **Created:** 2026-06-26
>
> Lifecycle: `proposed` → **`designed`** → `running` → `analyzing` → `concluded` → `rolled-out` / `abandoned`

Does the **way the homepage hero cards animate** change how often a visitor clicks into a
section? Both arms show the **same** seven destination cards with the **same** copy and the
**same** links; the only thing that varies is the presentation: a seamless scrolling film
strip (all cards visible, auto-scrolling) versus a camera-flash rotator (one card at a time,
a white flash blooms from the arch and the scene switches to the next card).

<!-- truncate -->

## 1. Hypothesis

> **We believe** that presenting the hero chooser as a **camera-flash rotator** rather than a
> **scrolling film strip** **will increase** the chooser-card click-through rate **because**
> the flash draws the eye and presents one clear, full-size destination at a time, instead of
> a row of cards sliding past that a visitor has to track and catch.
> **We'll know we're right when** the `test` (flash) variant's `hero card clicked` rate beats
> `control` (scroll) at PostHog-reported significance.

The disproving outcome is real and worth naming: the flash could perform **the same or worse**
if the motion reads as a distraction, if visitors wait for "their" card to come around rather
than clicking, or if a single rotating card is a harder target to click than a row where the
card they want is already on screen.

## 2. Why this experiment

The homepage hero chooser is the **first thing every visitor sees** and the primary way they
choose where to go (Craft, Journey, Ideas, Mindset, Initiatives, Questions, Designs). Animation
is a cheap, single-dimension lever: no copy, destination, or layout change, so it isolates the
effect of presentation. The result decides how the hero should animate going forward, and a null
result is still useful (keep the scrolling strip, which shows all destinations at once and needs
no rotation). The implementation for both arms is already built and proven (see section 5), so
the cost from here is only the live flag and the wait for data.

## 3. Design

### Variants
| Variant | What the user sees | Why this variant |
|---|---|---|
| `control` | The seamless **scrolling film strip**: all seven cards in a row, auto-scrolling sideways in an infinite loop, pausing on hover (swipe reel on touch). | Shows every destination at once; the visitor's target is already on screen. |
| `test` | The **camera-flash rotator**: one card at a time; every few seconds a white flash blooms from the arch and the scene switches to the next destination. | A single, full-size, attention-grabbing card; the flash is the hook. |

Same seven cards, same copy, same links in both arms. The **only** changed dimension is the
animation, so any difference in click-through is attributable to presentation, not content.

### Metric
- **Conversion:** `hero card clicked` (captured on the card link, with `hero_variant` =
  `scroll`/`flash` and `destination` = the card's route).
- **Exposure:** `$feature_flag_called` for `homepage-hero-anim`, recorded automatically when the
  page reads the flag.
- **Success signal:** clicks per exposed user (CTR), `test` vs `control`. The `destination`
  property also lets us see whether the flash shifts WHICH section gets clicked, not just how often.

### Placement / injection point, and why here
- **Why this surface:** the homepage hero is the highest-traffic single surface on the site and
  the one most directly tied to the conversion (the click happens inside the component). Every
  visitor passes through it, so it accrues exposures fastest.
- **Why instrument here and not elsewhere:** the navbar links to the same destinations, but it is
  not the experiment surface; instrumenting both would split the signal across two surfaces and
  muddy attribution. The conversion event lives on the **hero card link only**.
- **What I deliberately did NOT instrument:** the navbar and footer navigation, and the
  `HomepageFeatures` / `LatestPosts` sections below the hero. They are out of scope for this test.

### Targeting & assignment
PostHog feature flag `homepage-hero-anim`, 50/50 across all visitors, sticky per person. The
control arm is also the SSR default and the no-PostHog fallback, so the page renders fully without
JavaScript and only the client swaps to the flash for bucketed `test` users.

### Sample size & duration
This is a low-to-moderate-traffic blog, so expect the test to run for **weeks**, not days. Do not
call significance on a handful of clicks; defer to PostHog's experiment view for the readout. The
homepage's high relative traffic should make this one of the faster experiments to power.

## 4. Risks & decisions

**Risks / confounders.**
- **Motion fatigue / accessibility:** a repeating flash could annoy or strobe. Mitigated:
  `prefers-reduced-motion` (and touch) users get a calm cross-fade with the white bloom dialed
  out, and the rotation pauses on hover/focus so a card is a stable target.
- **Harder click target:** a single rotating card may be harder to click than a row where the
  wanted card is already visible. This is part of what the test measures, not just a risk.
- **Novelty effect:** early lift could fade. Let it run long enough that the curve settles.

**Decisions the result informs.**
- `test` wins (flash lifts CTR at significance) → roll the flash to 100%, retire the scroll arm.
- `control` wins or null → keep the scrolling strip (shows all destinations, simpler, no rotation).
- Mixed (flash shifts WHICH section gets clicked without raising total CTR) → keep control, but
  note the destination-mix finding for future hero copy/order work.

## 5. Timeline / log

- **2026-06-26: designed.** Built both arms behind the `homepage-hero-anim` flag: the scrolling
  strip (`control`, the existing hero and the SSR/no-PostHog default) and the camera-flash rotator
  (`test`). Added the registry entry (`src/experiments.ts`), the flag-gated hero
  (`src/pages/index.tsx`), and the `hero card clicked` conversion event with the `hero_variant` +
  `destination` properties. Proven with Playwright (`test/e2e/homepage.spec.ts`): each arm renders
  under the forced flag, the flash shows one card at a time and rotates, and the control default
  holds. **Remaining:** create + launch the live PostHog flag at 50/50 (handed to `run-ab-test`).

## 6. Outcome

_Pending. The result and the decision land here once the data is in; at that point the post's
`kind` flips from `experiment-plan` to `experiment-result` and its `stage` advances._
