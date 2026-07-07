# `pickets` scroll mode: a scrubbable picket-wave transition (pin-with-pickets)

## Context

The pin model transitions scenes with ONE full-door flash: `flash = sin(π·t)` and the image swaps
under the peak at `t = 0.5`. It works, but a stop mid-transition needs the snap to tidy it, and the
transition is a single event you pass through rather than something scroll *travels*.

The user wants a new mode, `pickets` ("pin-with-pickets"): the door is divided into N vertical
pickets; as you scroll into a transition a translucent flash picket appears at the LEFT, the wave
sweeps right with brighter pickets joining behind it until the whole door is flash (a bell curve of
intensity across the pickets), then the left pickets dim first, revealing the NEW image picket by
picket, left to right. Scrolling up runs the identical wave in reverse. Every scroll position is a
legitimate, stable picture, so **no snap/bounce is needed** — you can stop mid-wave and go back.
This is "more true to scrolling": you must travel through all the pickets.

Research (Codrops SVG-mask scroll transitions, GSAP ScrollTrigger guidance, CSS mask blinds):
- The staggered-strip wipe is a known pattern, but published versions are time-triggered. Ours is
  scroll-SCRUBBED: per-picket state is a pure function of progress, hence reversible.
- Natural-feel guidance: never scroll-jack; native scroll drives; a small catch-up lag (~0.1-0.3s)
  makes discrete wheel steps read as a liquid wave instead of chunky jumps.
- Adjacent strips need a tiny overlap (+~0.5px) or anti-aliasing paints hairline seams (same bug
  class as our hi-DPI arch seam; also: NO mix-blend-mode/filter on the strips).

## The engine math (generalizes the existing flash; N=1 degenerates to today's pin)

All in the existing pure model. For a transition at progress `t ∈ [0,1]` (the existing
`t = (within - settledFrac) / TRANSITION_FRACTION` from `deriveSceneState`), with `N` pickets and
stagger spread `S`:

```
local_i = clamp( (t * (1 + S) - (i / (N - 1)) * S), 0, 1 )   // picket i's own timeline
flash_i = reduce ? 0 : sin(π * local_i)                       // same hump as today, per picket
revealed_i = local_i >= 0.5                                    // picket i shows the NEW image
```

Properties (why this matches the ask):
- `local_i` decreases with `i`: the LEFT picket leads, the wave sweeps left→right.
- At `t = 0.5` with `S = 0.5`: local ranges 0.75 (left, dimming, new image) → 0.25 (right,
  brightening, old image), center = 1.0 flash. The whole door is lit with a bell across pickets.
- `revealed` is monotone in `i`, so the revealed region is always a CONTIGUOUS LEFT strip:
  the new image needs ONE `clip-path: inset(0 R% 0 0)`, not N slices.
  `R = 100 * (1 - revealCount / N)` where `revealCount = |{i : local_i >= 0.5}|` (quantized to
  picket boundaries: the reveal visibly advances picket by picket).
- Pure function of `t` → scrolling up plays the exact reverse. No state, no snap needed.
- Reduced motion: `flash_i = 0` everywhere and reveal snaps at `t >= 0.5` (today's behavior).

Constants: `PICKET_COUNT = 9` (odd, so a center picket peaks at mid), `PICKET_SPREAD = 0.5`.
Start with these; dial by eye during the live review (they are JS constants, not Hero Tuner CSS
vars, since the math runs in JS).

## Changes

All in `bytesofpurpose-blog/` unless noted.

### 1. Register the variant — `src/experiments.ts` (lines 71-79)

Add `pickets: 'pickets'` to `EXPERIMENTS['homepage-hero-scroll'].variants`. URL override
`?ab-homepage-hero-scroll=pickets` then validates for free (`urlOverride` checks
`exp.variants[perFlag]`; the `ab-` prefix is already in the url-params registry — no registry edit).

### 2. Expose the transition to the renderer — `src/pages/index.tsx` `deriveSceneState` (527-577)

Extend `SceneState` with one optional field (non-breaking for all existing consumers):

```ts
transition: null | {t: number; fromScene: number; toScene: number; fromDoor: boolean};
```

- Settled branch returns `transition: null`.
- Transition branch returns `{t, fromScene, toScene, fromDoor}` (all already computed locally).
- `timerScene` returns `transition: null` (the timer hero never renders pickets).
- Everything else (`active`/`shown`/`mode`/`flash`/`boardProgress`/board texts, the `t >= 0.5`
  commit rule, the last-stop guard) is untouched, so pin/inplace/horizontal are bit-identical.

### 3. Route the new model — `src/pages/index.tsx`

- `type ScrollModel = 'pin' | 'inplace' | 'horizontal' | 'pickets';` (line 1087).
- `HeroChooser` (1427-1430): add `if (scroll === 'pickets') return <ParallaxStudio model="pickets" />;`.
- `ParallaxStudio`:
  - `compute` (1109-1124): `pickets` uses the SAME pin geometry (sticky + tall spacer). No change
    beyond the model union (the pin branch already covers `model !== 'inplace'`; verify the
    conditional shape and include pickets with pin/horizontal).
  - **Snap effect (1154-1208): skip entirely for pickets** — extend the early guard to
    `model === 'inplace' || model === 'pickets'`. Every rest position is stable by design.
    (The released guard / direction bias stay for pin; untouched.)
  - Mobile fallback (1102-1104): leave `horizontal → pin`; `pickets` works as-is on mobile
    (same pin geometry), no fallback needed.
  - `jumpToScene` + festoon: unchanged (a bulb jump still glides to a settled center; fine).
  - Pass the mode down: `<StudioFacade {...scene} picketed={model === 'pickets'} ... />`.

### 4. Smoothed progress for the liquid feel — `src/pages/index.tsx` (new small hook)

Wheel events are quantized; raw scrub makes the wave jump in chunks. Add a tiny hook used ONLY by
the pickets model (pin/etc. keep instant scrub):

```ts
function useSmoothedProgress(progressRef, tick, enabled): {ref, tick}
```

- A rAF loop lerps a `smoothRef` toward `progressRef.current` with an exponential catch-up
  (time constant ~120ms, i.e. `cur += (target - cur) * (1 - exp(-dt/0.12))`), stopping (and
  snapping exact) when within ~0.0005. Bumps its own tick so `useScrollScene` re-derives.
- NEVER writes to scroll (read-only smoothing of the derived value — no scroll-jack).
- `enabled=false` (or reduced motion) → passthrough of the raw ref/tick, zero overhead.
- ParallaxStudio: `const sm = useSmoothedProgress(progressRef, tick, model === 'pickets' && !reduce);`
  then `useScrollScene(sm.ref, count, sm.tick)`.

### 5. Render the pickets — `src/pages/index.tsx` `StudioFacade` (845-995) + `index.module.css`

New prop `picketed?: boolean`. When `picketed && transition` (from `scene.transition`):

- **Layers during a picket transition** (replaces the mode-swap-at-peak for the visual only):
  - OLD content fully on: if `fromDoor`, keep `.studioDoorLayer` on; else `fromScene`'s
    `.studioPeekImg` gets `studioPeekImgActive`.
  - NEW image on top, clipped: `toScene`'s img ALSO active, with inline
    `clipPath: inset(0 ${R}% 0 0)` (the DOM order already puts `.studioDoorScene` above
    `.studioDoorLayer`, and later imgs above earlier ones inside the scene container — verify and
    rely on it; add an explicit picket z-index class only if needed).
  - When settled (`transition: null`) render exactly as today (single active img / door layer),
    so pin's existing behavior is the shared settled path.
- **New `StudioPickets` subcomponent**: renders inside the arch (sibling of `.studioFlash`) a
  `.studioPickets` container (absolute inset 0, `pointer-events: none`, the SAME
  arch-mask-white luminance mask + `isolation: isolate` as `.studioFlash`, z-index above the
  scene layers like the flash) holding `PICKET_COUNT` spans `.studioPicket`:
  - `left: (i / N) * 100%`, `width: calc(100% / N + 0.5px)` (the +0.5px kills hairline seams).
  - background: the same warm white as `.studioFlash` (a simple vertical
    `linear-gradient(rgba(255,255,255,.95), rgba(255,255,255,1) 45%, rgba(255,255,255,.9))`
    so it reads as light, not paint), `opacity: flash_i` via inline style.
  - NO transition on opacity (scrub-exact, same rule as `.studioFlash`), NO mix-blend/filter.
- The single `.studioFlash` stays for pin; in pickets mode `flash` from the engine still exists
  but the facade sets `--flash-o: 0` when `picketed` (the pickets ARE the flash).
- Reduced motion: `.studioPicket { opacity: 0 !important }` alongside the existing
  `.studioFlash` reduced-motion override; the reveal clip still applies (instant-swap semantics
  preserved via `revealed` quantization: with `flash_i = 0`, `local_i >= 0.5` still flips at the
  same scroll positions — acceptable and still scrub-true; verify it feels right, else fall back
  to the plain `shown` swap under reduce).
- Board/festoon/navbar: UNCHANGED — `boardProgress`/`spinning`/`active` all still come from the
  engine's existing fields, so board churn + settle-per-scene + festoon lighting behave exactly
  as pin does today.

Per-picket math helper: a small pure `picketStates(t, n, spread, reduce): {flash, revealed}[]`
next to `deriveSceneState` (unit-testable shape, mirrors the engine style).

### 6. e2e — `test/e2e/homepage.spec.ts`

- Add `'pickets'` to `SCROLL_MODELS` (line 216): the shared loop auto-covers gate render +
  `?hero-scene=N` determinism + navbar highlight for the new mode.
- New pickets-specific tests:
  - `[pickets] a mid-transition REST is STABLE (no snap)`: wheel into a transition, stop, wait
    2.5s, assert `scrollY` unchanged (the anti-snap contract) AND some `.studioPicket` opacity > 0
    (the wave is holding).
  - `[pickets] the reveal advances LEFT to RIGHT and is reversible`: mid-transition, read the new
    image's `clip-path` inset right-% twice while wheeling down (must decrease = more revealed),
    then wheel up and assert it increases again (reverse works).
  - `[pickets] past the wave the NEW scene is committed`: scroll through a full transition,
    settle, assert `data-active-scene` advanced and no `.studioPicket` has opacity > 0.05.
  - `[pickets] resting BELOW the hero is stable` (inherit the pin regression: released =
    untouchable — should hold trivially since snap is off, but assert it).

### 7. Lockstep obligations (same change)

- `scripts/validate-hero-anchors.js`: add anchors for `StudioPickets`, `picketStates`,
  `useSmoothedProgress`, `.studioPicket`; update the prose in the line-63/67 `what` strings from
  "pin/inplace/horizontal" to include pickets.
- `.claude/skills/maintain-homepage-hero/SKILL.md`: document the pickets model (the per-picket
  math, the contiguous-left-reveal invariant that makes one clip-path sufficient, the +0.5px
  seam overlap, snap-is-off-by-design, the smoothing hook's no-scroll-write rule) as new gotchas;
  update the scroll-model list.
- No new URL params (covered by the `ab-` prefix), no generated assets, no design-token literals
  beyond the flash whites already in use (ds-tokens hook should stay quiet; heed any warning).
- No literal em-dash in reader-facing text/comments (the em-dash hook blocks index.tsx edits).

## Execution order + tasks (TaskCreate at start)

1. Engine: `transition` field on SceneState + `picketStates` helper (+ keep timer path null).
2. Variant + routing: experiments.ts, ScrollModel, HeroChooser, snap guard, mobile check.
3. Renderer: StudioFacade `picketed` path + `StudioPickets` + CSS (mask, seams, reduced-motion).
4. Smoothing: `useSmoothedProgress`, pickets-only.
5. e2e: SCROLL_MODELS + the 4 pickets tests.
6. Lockstep: anchors + SKILL.md.
7. Verify (below) → branch → PR → ask user to merge.

## Verification

1. **Live on :3000** at `/?ab-homepage-hero-anim=variant_c&ab-homepage-hero-scroll=pickets`
   (chrome-devtools):
   - Slow scroll into a transition: left picket lights first, wave sweeps right, full-door bell at
     mid, left pickets dim revealing the new image picket by picket; board churns then settles.
   - Stop anywhere mid-wave: NOTHING moves (no snap), the partial picture holds; scroll up:
     the wave runs backward and the old image returns.
   - Fast flick to bottom: page rests at bottom (released guard irrelevant but assert stability).
   - Screenshot the mid-wave state for the user (the money shot: bell of flash + partial reveal).
   - Compare feel with/without smoothing (temporarily force `enabled=false`) and tune the time
     constant with the user.
2. **Both directions + festoon**: bulb click still glides; festoon lights track `active`.
3. **Mobile pass (repo convention)**: 375px viewport, same URL: pickets legible at small width
   (9 pickets across ~340px arch ≈ 38px each: fine), no horizontal overflow, tap-through works.
4. **Reduced motion**: emulate `prefers-reduced-motion`; no picket flash, swaps still happen,
   nothing animates.
5. **Tests**: `make validate-hero-anchors`; homepage e2e per `test/e2e/README.md` (the parallax
   block incl. the new pickets tests); existing pin tests stay green (regression: engine fields
   unchanged).
6. **Hooks/gates**: em-dash, ds-tokens, contrast quiet.

## Out of scope (explicit follow-ups)

- Flipping `DEFAULT_SCROLL_MODEL` (pin vs pickets vs static stays a separate decision after the
  live review).
- Launching the `homepage-hero-scroll` PostHog flag.
- Hero-Tuner sliders for `PICKET_COUNT`/`PICKET_SPREAD` (JS-side math; the tuner is CSS-var-only —
  only add if dial-in demands it).
- Visual-regression baselines for parallax (pending task) and the unsolved Firefox arch seam.
