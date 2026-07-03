---
slug: homepage-hero-anim
title: 'Homepage hero: scroll vs camera-flash vs train station'
kind: experiment-plan
sidebar_label: 'Hero animation test'
description: 'A/B/C test of the homepage hero animation: does a camera-flash rotator or a train-station slide draw more chooser-card clicks than the scrolling film strip, with identical cards and copy in all three arms?'
authors: [oeid]
tags: [experiments, ab-testing, posthog]
date: 2026-06-26
draft: false
stage: designed
priority: medium
flag: homepage-hero-anim
owner: Omar
---

<ExperimentOverview />

Does the **way the homepage hero cards animate** change how often a visitor clicks into a
section? All three arms show the **same** seven destination cards with the **same** copy and the
**same** links; the only thing that varies is the presentation. Three treatments: a seamless
scrolling film strip (all cards visible, auto-scrolling), a camera-flash rotator (one card at a
time, a white flash blooms from the arch and the scene switches), and a train-station gate (the
departure board hangs from a bracket and the scene slides past like a train pulling through).

<!-- truncate -->

## 1. Hypothesis

> **We believe** that presenting the hero chooser as a **single attention-grabbing scene** (either
> the **camera-flash rotator** or the **train-station slide**) rather than a **scrolling film
> strip** **will increase** the chooser-card click-through rate **because** a single clear,
> full-size destination at a time draws the eye, instead of a row of cards sliding past that a
> visitor has to track and catch.
> **We'll know we're right when** the `test` (flash) and/or `variant_c` (train) arm's `hero card
> clicked` rate beats `control` (scroll) at PostHog-reported significance.

The disproving outcome is real and worth naming: the single-scene treatments could perform **the
same or worse** if the motion reads as a distraction, if visitors wait for "their" card to come
around rather than clicking, or if one rotating card is a harder target to click than a row where
the card they want is already on screen. The two treatments also test each other: the flash is a
sharp interruption, the train slide is a smoother, more thematic transition, so the result tells us
not just whether single-scene beats the strip but which kind of motion lands better.

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
| `variant_c` | The **train-station gate**: the same single-scene portal, but the departure board hangs from a station bracket and the scene change is a train sliding past (the active scene slides off with motion blur as the next slides in, no flash). | The same single-scene focus as the flash, but with a smoother, thematic transition instead of a sharp interruption. |

Same seven cards, same copy, same links in all three arms. The **only** changed dimension is the
animation, so any difference in click-through is attributable to presentation, not content.

### Metric
- **Conversion:** `hero card clicked` (captured on the card link, with `hero_variant` =
  `scroll`/`flash`/`train` and `destination` = the card's route).
- **Exposure:** `$feature_flag_called` for `homepage-hero-anim`, recorded automatically when the
  page reads the flag.
- **Success signal:** clicks per exposed user (CTR), `test` and `variant_c` each vs `control` (and
  against each other). The `destination` property also lets us see whether a single-scene treatment
  shifts WHICH section gets clicked, not just how often.

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
PostHog feature flag `homepage-hero-anim`, an even three-way split across all visitors (~33% each),
sticky per person. The control arm is also the SSR default and the no-PostHog fallback, so the page
renders fully without JavaScript and only the client swaps to the flash or train gate for bucketed
`test` / `variant_c` users.

### Sample size & duration
This is a low-to-moderate-traffic blog, and a three-arm test needs more total traffic than a
two-arm one (each arm gets a third, not a half, of visitors), so expect this to run for **weeks**,
likely longer than a two-arm test would. Do not call significance on a handful of clicks; defer to
PostHog's experiment view for the readout. The homepage's high relative traffic still makes this one
of the faster experiments to power.

## 4. Risks & decisions

**Risks / confounders.**
- **Motion fatigue / accessibility:** a repeating flash could annoy or strobe; a repeating slide
  could distract. Mitigated: `prefers-reduced-motion` (and touch) users get a calm cross-fade with
  the flash bloom and the train slide both dialed out, and the rotation pauses on hover/focus so a
  card is a stable target.
- **Harder click target:** a single rotating card may be harder to click than a row where the
  wanted card is already visible. This is part of what the test measures, not just a risk.
- **Three-arm dilution:** splitting traffic three ways slows time-to-significance and makes a small
  flash-vs-train gap harder to resolve. If the data is thin, the primary read is each treatment vs
  control; treatment-vs-treatment is the secondary read.
- **Novelty effect:** early lift could fade. Let it run long enough that the curve settles.

**Decisions the result informs.**
- A single-scene treatment wins (flash or train lifts CTR at significance) → roll the winner to
  100%, retire the others. If both beat control, ship whichever is higher (break ties by the
  smoother/more-accessible read, which favors the train slide).
- `control` wins or null → keep the scrolling strip (shows all destinations, simpler, no rotation).
- Mixed (a treatment shifts WHICH section gets clicked without raising total CTR) → keep control,
  but note the destination-mix finding for future hero copy/order work.

## 5. Timeline / log

- **2026-06-26: designed.** Built the first two arms behind the `homepage-hero-anim` flag: the
  scrolling strip (`control`, the existing hero and the SSR/no-PostHog default) and the camera-flash
  rotator (`test`). Added the registry entry (`src/experiments.ts`), the flag-gated hero
  (`src/pages/index.tsx`), and the `hero card clicked` conversion event with the `hero_variant` +
  `destination` properties. Proven with Playwright (`test/e2e/homepage.spec.ts`): each arm renders
  under the forced flag, the flash shows one card at a time and rotates, and the control default
  holds.
- **2026-06-27: added variant C (train station).** Added a third arm (`variant_c` = `train`): the
  same single-scene portal re-staged as a station, where the departure board hangs from a bracket
  and the scene change is a train sliding past (slide + motion blur, no flash). It is purely
  additive, the `control` and `test` arms are byte-for-byte unchanged, and it reuses the same scene
  art + Vestaboard component. The `HeroChooser` switch became three-way and the e2e + visual
  regression suites gained a `variant_c` arm. **Remaining:** create + launch the live PostHog flag
  as an even three-way split (handed to `run-ab-test`).

## 6. Outcome

_Pending. The result and the decision land here once the data is in; at that point the post's
`kind` flips from `experiment-plan` to `experiment-result` and its `stage` advances._
