# Pickets scrub fidelity: fix lag + skipped pickets/scenes on scroll nudges

## Context

The whole point of the pickets mode is IMMEDIATE, scrubbable feedback: every scroll position is a
picture, and scrolling travels *through* every picket. Instead the user (Chromium, real trackpad)
sees: scroll lags, a small forward nudge teleports to the NEXT SCENE, pickets get skipped, and the
desired wave never reads. Requirement: cycle through ALL pickets and ALL scenes with immediate
scrolls in rapid succession.

## Diagnosis (the math already explains most of it)

Geometry today (7 scenes, 8 stops, `SCENE_VH = 0.85`, `TRANSITION_FRACTION = 0.5` in
`bytesofpurpose-blog/src/pages/index.tsx`):

- spacer = 595vh, scrollable = 495vh → one stop slice ≈ 62vh → **one crossing ≈ 31vh ≈ 250px**
- with `PICKET_SPREAD = 2.5`, one picket's entire rise-and-fall ≈ **71px of scroll**

A macOS inertial nudge glides 300–1500px and scroll jumps 100px+ *between two rAF frames*. The
renderer is a pure `f(scrollY)` of RAW scroll (smoothing was removed earlier), so it **teleports
past pickets and whole crossings** even at a perfect 60fps. Two prior states were each half-wrong:

- OLD smoothing (tau 120ms + 400–2000ms thrash frames) → wave TRAILED, "moves only after I stop".
- Current raw tracking → wave TELEPORTS, "nudge jumps to the next scene".

The fix is BOTH: a longer scroll runway per crossing (user approved ~1.5 viewport-heights per
scene), and a SHORT catch-up renderer (tau ≈ 70ms + a minimum close-rate) that sweeps the displayed
frame *through* every skipped state. Any residual per-frame paint cost (the 9 masked strips) is
diagnosed with a real trace before touching it. Browser: Chromium (CDP throttle + tracing apply).

All files under `bytesofpurpose-blog/` unless noted. Branch: `feat/hero-pickets-scroll-mode` (PR #199).

## Phase 0 — Diagnose with evidence (before any fix)

1. **Geometry numbers into `?hero-perf=1`**: at perf-start, log `crossing=<px> picket=<px>
   slice=<px>` computed from the live spacer rect. Instantly confirms the runway hypothesis on the
   user's machine, and stays useful forever.
2. **Trace the residual lag**: chrome-devtools MCP performance trace on :3000 at 6× CPU throttle
   while driving a realistic inertial gesture (decaying-delta scroll steps at rAF cadence, NOT
   uniform scrollTo). Read where frame time goes: style recalc? paint of the masked `.studioPicket`
   strips? the reveal `clipPath` layer? React reconcile of `StudioFacade`? Record findings; only
   fix what the trace convicts (Firefox layer-explosion lesson: no speculative `will-change`).

## Phase 1 — Geometry: give each crossing a real runway (`src/pages/index.tsx`)

- Per-model scene length: keep `SCENE_VH = 0.85` for pin/horizontal; add `PICKET_SCENE_VH = 1.5`.
  The spacer div in `ParallaxStudio` (renders `count * SCENE_VH * 100vh`) picks by model.
- Per-model transition share: make `deriveSceneState(p, count, reduce, transitionFraction = 0.5)`
  a parameter; pickets passes `PICKET_TRANSITION_FRACTION = 0.7` (more of each slice is crossing,
  ~30% settled dwell so each scene still gets a legible rest + board title).
  - Thread it through `useScrollScene` (optional param) and the `rawBoardText` derive call.
  - `jumpToScene`'s `targetP` uses `settledFrac` → must use the model's fraction.
  - The snap effect is pin-only (pickets already early-returns) → keeps 0.5. Pin bit-identical.
- Result: crossing ≈ 0.7 × (1050vh − 100vh)/8 ≈ **83vh ≈ 660px** (~2.7× today); one picket ≈ 190px.

## Phase 2 — Catch-up renderer: sweep THROUGH skipped states (`src/pages/index.tsx`)

New hook `useCatchUpProgress(progressRef, tick, enabled): {ref, tick, active}`, pickets-only:

- rAF loop eases a `displayedRef` toward `progressRef.current`:
  `cur += gap * (1 - exp(-dt/TAU))` with `TAU = 0.07s`, PLUS a **minimum close rate** so any gap
  closes within ≤ ~300ms (`step = max(easeStep, |gap| * dt / 0.3)`) — a huge flick sweeps through
  everything quickly instead of animating for seconds. Snap exact + stop the loop when
  `|gap| < 0.0004`.
- The loop is self-driving until converged (starts on tick change), so motion is visible DURING a
  burst and finishes ~0.3s after — with 16ms frames this cannot reproduce the old "only after
  stop" (that needed 400ms+ frames).
- NEVER writes to scroll (read-only; no scroll-jack). `enabled=false` / reduced motion /
  `forcedProgress()` (`?hero-progress`) → passthrough of the raw ref/tick (visual baselines and
  the freeze seam unaffected).
- Wiring in `ParallaxStudio`: pickets renders EVERYTHING (wave, reveal clip, scene commits,
  festoon, navbar `active`) from the displayed progress — one coherent picture; a fast flick
  visibly flips through each scene in order. Two deliberate exceptions stay on RAW progress:
  - `rawBoardText` (board settle target — already raw; keeps the settle-roll destination fixed).
  - The board-churn `spinning` flag becomes `scrolling || catchUp.active` so the board keeps
    churning while the wave is still sweeping after fingers lift.

## Phase 3 — Per-frame paint cost (evidence-gated by the Phase 0 trace)

- `React.memo(StudioPickets)` (its `flash` array is the only per-frame prop) — cheap, do always.
- IF the trace shows the strips repainting + re-masking per frame: `will-change: opacity` on
  `.studioPicket` (9 small layers, scoped — the same pattern as the `.foldDown` fix). IF the
  reveal `clipPath` layer repaints the full masked image per quantized step, isolate that layer.
  Nothing speculative; each CSS change re-verified in the trace.

## Phase 4 — Tests that REPRODUCE these regressions (fail-before / pass-after)

In `test/e2e/hero-perf.spec.ts` (Chromium project, CPU-throttled):

1. **Inertial-flick scrub test** (the missing one): drive a decaying-momentum burst (~1.5
   crossings in ~400ms) at 6× throttle; sample per frame the brightest strip index + `active`.
   Assert the brightest strip passes through ≥5 distinct ordered positions per crossing (wave
   TRAVELED, no teleport) and no scene commit is skipped in the rendered sequence. **Confirm it
   FAILS on the current raw-only code** (that's the bug), then passes.
2. **Rapid-succession cycle test**: three fast back-to-back flicks spanning 3 crossings → all 3
   scene commits observed in order, and the wave converges (no lit strip) within ~600ms of the
   last input (guards both "skips scenes" and "keeps animating forever").

In `test/e2e/homepage.spec.ts`:

3. **Runway gate**: read the live spacer height and assert one pickets crossing spans ≥ 60vh of
   scroll (catches anyone shrinking the runway back).
4. Existing guards stay green and are the anti-regression pair: the live-motion burst test (no
   return of trailing) + the traveling-band test (no return of the bloom).

## Phase 5 — Lockstep obligations (same change)

- `scripts/validate-hero-anchors.js`: anchors for `useCatchUpProgress`, `PICKET_SCENE_VH`,
  `PICKET_TRANSITION_FRACTION`; update the "raw scroll, no smoothing" prose (it is now
  raw-scroll INPUT + catch-up DISPLAY).
- `.claude/skills/maintain-homepage-hero/SKILL.md`: replace the "pickets reads RAW scroll" note
  with the two failure modes (trailing vs teleporting) + the tau/min-close-rate rule + the runway
  numbers; new gotcha for the per-model `transitionFraction`.
- `test/e2e/visual.spec.ts`: the `PICKET_STATES` frozen `p` values remap under
  `transitionFraction = 0.7` (e.g. settled scene-0 center → `(1 + 0.15)/8 ≈ 0.144`); recompute the
  three states and regenerate the 6 pickets baselines. Flash/pin baselines untouched.
- No new URL params; no generated assets; no em-dash in any comment (the hook blocks index.tsx).

## Verification

1. **Trace-verified**: re-run the Phase 0 chrome-devtools trace at 6× throttle after each phase;
   frame times stay <50ms, and the paint cost item found in Phase 0 is demonstrably gone.
2. **Live feel pass on :3000** (`?ab-homepage-hero-anim=variant_c&ab-homepage-hero-scroll=pickets&hero-perf=1`):
   slow scroll = strip-by-strip scrub; a nudge = the wave visibly sweeps through and lands (mid or
   next stop, never a teleport); a hard flick = scenes flip through IN ORDER; stop mid-wave =
   frozen picture; scroll up = exact reverse; board churns while the wave moves, settles after.
3. **Tests**: new hero-perf tests fail-before/pass-after; full pickets suite + pin suite + the 6
   regenerated visual baselines; `make validate-hero-anchors`.
4. **The user's machine is the ground truth**: hand over with `?hero-perf=1` and read their pasted
   console (geometry line + frame stats) before calling it fixed. My machine under-reproduces.
5. Commit → push to PR #199 → ask the user to review/merge (never self-merge).

## Out of scope

- Flipping `DEFAULT_SCROLL_MODEL`, launching the PostHog flag, merging/deploying PR #199.
- Firefox-specific profiling (user confirmed Chromium; the Firefox glyph fix stays as-is).
