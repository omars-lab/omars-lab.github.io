---
name: audit-test-realism
description: Audit the Playwright e2e suites for INPUT + JOURNEY realism — do the tests drive the site the way a real visitor actually does, or with synthetic shortcuts that pass while the real gesture breaks? Two lenses — (1) INPUT FIDELITY (a uniform `window.scrollTo` teleport vs a real inertial trackpad flick with decaying momentum + coalesced events; `.click()` vs a touch tap on a `hasTouch` context; instant navigation vs the back button, an anchor link, a shared URL) and (2) JOURNEY COVERAGE (all the ways people ARRIVE and MOVE — organic search landing deep, navbar/sidebar, in-post links, back/forward, mobile one-handed — and whether each works). Emits a prioritized gap report (journey → existing coverage → the realistic test that's missing); does NOT auto-edit. Use after a scroll/gesture/interaction change, when a bug slipped past green tests, or when asked "are we testing this like a real user?". Born from the pickets scroll bug that a uniform scrollTo test could not see and a decaying-flick test caught.
---

# Audit test realism (are we testing like a real user?)

A green e2e suite proves the site works **the way the tests drive it** — which is not the same as
**the way a person drives it**. The gap is the whole point of this skill. The canonical example is
live in this repo: the `pickets` hero scroll mode teleported past whole crossings on a real trackpad
flick, and **every homepage test passed**, because they scrubbed the hero with a uniform
`window.scrollTo(0, y)` that lands exactly where you tell it. A person's inertial flick moves
hundreds of pixels *between two animation frames*; the uniform teleport never reproduced that, so the
renderer's "teleport" bug was invisible to the suite. Only a **decaying-momentum flick that samples
every frame** (`[pickets] an inertial FLICK sweeps THROUGH…`, `test/e2e/hero-perf.spec.ts`)
reproduced it. Same class as the mobile audit's insight: *"responsive" only proves the page fits; it
does not prove a phone user can use it.* Here: **"the test passes" only proves the synthetic input
works; it does not prove the real gesture does.**

This skill audits the Playwright suites through a real visitor's hands and emits a **prioritized gap
report** — it does NOT auto-edit (same contract as `audit-mobile-experience` /
`review-reader-experience`). Fixes go through the owning surface's skill (the hero →
`maintain-homepage-hero`; a component → `modify-blog-ui-component`), and the e2e mechanics live in
`test/e2e/README.md` + `verify-change`.

Pairs with: `audit-mobile-experience` + `audit-desktop-experience` (the visual/reach lens on the
rendered page), `verify-change` (which tier proves a change), `test/e2e/README.md` (the project model).

## Audit from the VISITOR's hands, not the test runner's convenience

Before reading a single spec, picture the actual person and how their input REACHES the page, because
a test driver takes shortcuts a person cannot:

- **A person's scroll is inertial + quantized + coalesced.** A trackpad flick delivers real events
  while fingers touch, then a *synthesized momentum tail* after they lift; a mouse wheel arrives in
  chunky notches. The browser **coalesces** several into one `scroll` event, so position jumps
  100px+ between two frames. A test's `window.scrollTo(0, target)` lands *exactly* on target in one
  step with a clean event — it can never reproduce the jump, the overshoot, or the mid-gesture stop.
- **A person taps with a thumb, not a synthetic click.** `.click()` dispatches a click at an
  element's center regardless of touch support; a real phone user fires `touchstart`/`touchend` on a
  `hasTouch` context and misses a sub-44px target. A suite of `.click()`s proves the handler runs,
  not that the target is tappable.
- **A person navigates in ways a `page.goto` skips.** They land on a deep post from Google (no
  homepage warm-up), hit the **back button** (bfcache, restored scroll), click an **anchor link**
  (hash scroll), open a **shared URL** (ingress params), or **reload** mid-flow. A test that always
  `goto`s the exact final URL never exercises the arrival path where state actually breaks.
- **A person stops, reverses, and hesitates.** They scroll halfway into a transition and stop; they
  flick down then immediately back up. A test that drives straight to a settled state never sees the
  mid-gesture freeze or the reverse — exactly where a scrubbed animation stops being a pure function.

So for every interaction ask: **"Does the test's INPUT match how a person's input actually arrives —
its physics, its device, its arrival path — or does the shortcut hide the failure mode?"** The two
highest-signal tells a review catches every time: **a uniform `scrollTo`/`goto` standing in for a
gesture with physics**, and **a `.click()` standing in for a touch tap on a surface real users touch**.

## Lens 1 — INPUT FIDELITY (does the driver match the gesture's physics + device?)

Walk every spec that drives motion or interaction and classify its input. The realism ladder, low to
high, with when each is honest:

| Input the test uses | Honest for | DISHONEST when (the gap) |
|---|---|---|
| `window.scrollTo(0, y)` (+ dispatched `scroll`) | asserting a state at a KNOWN position (a frozen frame, a settled zone) | standing in for a GESTURE — it teleports, so it hides skip/teleport/coalescing bugs in anything scrubbed by scroll |
| `mouse.wheel(0, dy)` | a single discrete notch | a flick — one event, no momentum tail, no coalescing |
| a **decaying-momentum flick** (a rAF loop: `v *= ~0.86` each frame, `scrollTo` the running sum, sample per frame) | scrubbed animations, scroll-linked reveals, momentum start/stop | (this IS the realistic path; the gap is its ABSENCE) |
| CDP `Input.synthesizeScrollGesture` (Chromium) | the closest to a real OS gesture (true momentum, speed param) | only in Chromium; the repo's decaying-flick loop is the cross-browser stand-in |
| `.click(selector)` | a desktop pointer click; asserting a handler fires | standing in for a phone TAP on a touch surface (no `hasTouch`, center-hits a target a thumb would miss) |
| `page.touchscreen.tap(x,y)` / `locator.dispatchEvent('touch…')` on a `hasTouch` context | a real touch tap/swipe | (realistic — the gap is that NO project enables `hasTouch`, see below) |
| `page.goto(finalUrl)` | testing the page in isolation | standing in for an ARRIVAL — skips deep-landing, back-button, anchor, shared-URL, reload paths |

For each dishonest row, the finding is: *"`<spec>` drives `<interaction>` with `<synthetic input>`; a
real `<gesture>` would `<physics the shortcut hides>`; the failure mode is currently untestable. Add a
realistic test (pattern below)."*

**The proven realistic-flick pattern** (copy from `test/e2e/hero-perf.spec.ts`): a rAF loop with
decaying velocity, sampling the rendered state every frame DURING the flick and the momentum tail,
under `Emulation.setCPUThrottlingRate` (6×) so a fast CI box reproduces a mid-device — asserting the
animation SWEEPS through intermediate states (not just that it ends correctly), and that no state is
skipped. This is what a uniform `scrollTo` structurally cannot assert.

## Lens 2 — JOURNEY COVERAGE (are all the ways people ARRIVE + MOVE tested?)

A person does not experience the site as isolated `goto`ed pages. Map the real journeys and check each
has a test that drives it *the way it happens*:

- **Arrival**: organic search → a DEEP post (cold, no homepage), a SHARED URL (with ingress `?im=`/
  `?internal=` params → the attribution reader + toast), a bookmark, a social card. → Does a test
  `goto` the deep URL COLD and assert it renders + attributes correctly (not via the homepage)?
- **In-site movement**: navbar tabs (each docs instance shows ONLY its topics), the sidebar, an
  in-post link (relative links resolve against the SLUG), the **back/forward** button (restored
  scroll, bfcache), an **anchor** `#heading` link (hash scroll), the festoon/hero jump controls.
- **Re-entry**: reload mid-scroll, a redirect (`/blog/*` → `/initiatives/*`), a 404 → recovery.
- **Device context**: the SAME journey one-handed on a phone (touch, thumb reach) — which today is
  **structurally untestable** (see the standing gap below).

For each journey with no realistic test, the finding names the journey, what could break on it (state
carried from a warm homepage that a cold deep-land lacks; scroll not restored on back; a hash link
that lands above the target under the pinned hero), and the test to add.

## The standing STRUCTURAL gap (name it every audit, do not silently pass it)

**No Playwright project enables touch or a mobile viewport.** Every project in `playwright.config.ts`
is Desktop (`devices['Desktop Firefox']` / `Desktop Chrome`), so `hasTouch` is false and there is no
mobile viewport project. Consequences the suite CANNOT currently catch, and must not be reported as
covered:

- touch taps / swipes (only synthetic `.click()` runs; a sub-44px tap target passes)
- mobile-viewport reflow + the mobile-only surfaces (the hero goes door-only under a breakpoint; the
  KanbanBoard auto-scroll-to-populated-column bug was mobile-only)
- iOS Safari scroll/fixed-position quirks (Playwright emulates Safari with desktop WebKit anyway)

The mobile EXPERIENCE is currently audited manually + visually (`audit-mobile-experience`, the
CLAUDE.md "visual + mobile pass" convention), NOT in automated e2e. Adding a `hasTouch` +
375px-viewport project is a **deliberate infra decision** (a real cost: new baselines, a slower
suite), noted as out of scope in that convention — so an audit RECOMMENDS it as the highest-leverage
structural fix but does not assume it exists. Every report states this gap explicitly.

## How to run the audit

1. **Inventory the input.** For each `*.spec.ts`, grep its drivers and classify against the Lens-1
   ladder (a fast first pass):
   ```bash
   cd bytesofpurpose-blog
   for f in test/e2e/*.spec.ts; do
     echo "--- $(basename "$f") ---"
     grep -oE "window\.scrollTo|mouse\.wheel|dispatchEvent\(new (Event|WheelEvent|MouseEvent|KeyboardEvent)|\.click\(|\.tap\(|page\.touchscreen|synthesizeScrollGesture|requestAnimationFrame|page\.goto" "$f" | sort | uniq -c | sort -rn
   done
   ```
   A spec heavy on `window.scrollTo` / `.click(` / `page.goto` with ZERO `requestAnimationFrame` or
   `touchscreen` is a candidate: it may be driving a gesture/tap/arrival with a shortcut.
2. **Read the flagged specs for INTENT.** A `scrollTo` that pins a KNOWN position to assert a settled
   state is fine (honest use). A `scrollTo` that stands in for "the user scrolls into the transition"
   is the gap. Judge by what the assertion depends on: if correctness depends on the PATH taken
   (intermediate frames, momentum, coalescing), a teleport is dishonest.
3. **Map journeys → coverage** (Lens 2). List the real arrival + movement paths; mark which have a
   test that drives them realistically.
4. **Confirm the structural gap** (`grep -n "hasTouch\|devices\[" playwright.config.ts` → all
   Desktop) and state it.
5. **Emit the prioritized report** (below). For a HIGH finding, sketch the realistic test (or point
   at the `hero-perf.spec.ts` flick pattern to copy). Optionally PROVE a finding the way the pickets
   work did: write the realistic test, show it FAILS on the current behavior the synthetic test
   passed (fail-before), which converts "might be a gap" into "is a gap".

## Prioritize (same P0/P1/P2 shape as the sibling audits)

- **P0 (a real failure mode is untestable):** a user-facing interaction whose correctness depends on
  input PHYSICS the suite only drives synthetically, so a real regression would ship green — e.g. a
  scroll-scrubbed animation tested only with uniform `scrollTo` (the pickets class); a touch-only
  affordance with no touch test.
- **P1 (a journey is only half-covered):** the interaction is tested but not the way it arrives — a
  deep-land tested via the homepage, a back-button path with no restored-scroll assertion, an anchor
  link never followed.
- **P2 (fidelity nice-to-have):** a discrete `.click()`/`scrollTo` that works but could be a more
  realistic tap/gesture; a hardening opportunity.

Report each finding as: **spec + interaction · the real gesture/journey · what the synthetic input
hides · the realistic test to add (pattern/reference) · [proven fail-before?]**. Findings that are
**fixed in the same change** close in the PR; **deferred** ones become GitHub issues (dedup via
`ISSUES.md`, per the CLAUDE.md convention) tagged with the originating skill + audit date.

## Guardrails (honesty, same tenet as the rest of the repo)

- **Prove the gap, don't assert it.** A claim that "the real gesture breaks this" is only credible
  with a fail-before test (the pickets teleport was proven by a flick test failing on raw-only code).
  Label an UNPROVEN gap as a hypothesis, not a defect.
- **Do not over-report honest shortcuts.** A `scrollTo` to a frozen `?hero-progress` frame, a
  `.click()` on a desktop-only control, a `goto` to test a page in isolation — these are correct.
  Flag input only where correctness depends on the path/physics/device the shortcut removes.
- **Name the structural gap every time** rather than quietly treating desktop-only coverage as
  complete — that silent pass is the same failure the mobile-parity trap warns about.
- **Report-only.** This skill finds and prioritizes; it never edits tests or source.
