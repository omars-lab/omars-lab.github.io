---
name: maintain-homepage-hero
description: The guide to SAFELY changing the homepage hero — the A/B-tested chooser (scrolling card strip = control, camera-flash "departures" gate = test/flash, Lebanese-house scene gate = variant_c/studio, lit boutique storefront = variant_d/boutique), plus the SECOND composed experiment that picks the studio house's DRIVER (self-running timer = static, or a scroll-driven parallax = pin/inplace/horizontal/pickets). All share a Vestaboard split-flap board. Catalogs the key DECISIONS, the CODE ANCHORS (which symbol in which file owns each behavior), how to change common things (incl. the pin-scroll experience: released guard, forward snap, board settle-per-scene, compact pinned header; and the pickets picket-wave transition), and the GOTCHAS that bite (a retina compositing seam, a flash white-out, a board that fades on cross-fade, arrow keys that need a global listener, a snap that yanks the page back or rewinds, a picket reveal that needs FROM held under a strip clip). Use BEFORE editing src/pages/index.tsx, src/pages/index.module.css, src/lib/hero-tuning.ts, or src/components/SplitFlap — it tells you what each piece is for and what NOT to break.
---

# Maintain the homepage hero

The homepage hero is the **chooser**: it lets a visitor pick a door into the site. It is driven by
TWO composed experiments in `src/experiments.ts`:

**`homepage-hero-anim`** picks WHICH hero:

- **`control` = the scrolling strip** — all destination cards in a row, auto-scrolling (a marquee).
- **`test`/`flash` = the camera-flash "departures" gate** (`ChooserFlash`) — an arched portal whose
  scene cross-fades behind a flash of light, captioned by a split-flap **Vestaboard** that rolls
  through the alphabet to name the destination. Auto-rotates on a timer; `←`/`→` also step it.
- **`variant_c`/`studio` = the Lebanese central-hall HOUSE** (`ChooserStudio` / `ParallaxStudio` +
  the shared `StudioFacade`) — a roof + terracotta body + three arches + a hanging Vestaboard, where
  the centre DOOR opens onto each destination scene behind a masked white flash. This is the DEFAULT
  hero. Its DRIVER is chosen by the second experiment (below).
- **`variant_d`/`boutique` = the lit boutique storefront** (`ChooserBoutique`) — a 3-arch storefront,
  timer-driven.

**`homepage-hero-scroll`** picks the studio house's DRIVER (only matters when anim resolves to
`studio`): **`control`/`static`** = the self-running rAF TIMER house (the default), or a SCROLL-driven
parallax. Four parallax models: **`pin`** (the house pins full-screen in a tall runway; scrolling
advances the scenes, then releases), **`inplace`** (normal flow; scenes advance as the house travels
through the viewport), **`horizontal`** (pin + a horizontal pan strip behind the facade; degrades to
`pin` on mobile), and **`pickets`** (pin, but each crossing plays a staggered per-strip flash WAVE that
reveals the next scene strip-by-strip, fully scrubbable so a mid-crossing stop is stable and needs NO
snap; see the pickets gotcha). All four parallax models and the timer share ONE progress model
(`deriveSceneState`) fed by different drivers, so the transitions are consistent regardless of driver.
See the parallax how-to + gotchas below.

The override URL uses the variant KEY: `?ab-homepage-hero-anim=control|test|variant_c|variant_d` and
`?ab-homepage-hero-scroll=pin|inplace|horizontal|pickets` (NOT the values `scroll`/`flash`/`studio`). All arms
show the SAME destinations + copy; only the PRESENTATION differs (that's what makes the A/B
attributable). Changing the hero means touching subtle motion + compositing + a custom component, and
several non-obvious things bite. This skill is the map.

> **Design story** (the WHY + the bugs): `designs/2026-06-26-vestaboard-flash-hero.mdx`.
> **Experiment** (hypothesis + metric): `/initiatives/homepage-hero-anim` (`blog/2026-06-26-homepage-hero-anim.md`).
> **Drift guard**: `scripts/validate-hero-anchors.js` checks the symbols this skill names still exist;
> the PostToolUse hook `.claude/hooks/hero-anchor-hook.sh` warns when you edit a hero file so you
> review this skill. **If you rename a symbol below, update this skill + the validator in the same change.**

## Code anchors (symbol → what it owns)

The anchors are **symbol names** (not line numbers, which drift). The validator checks each still exists.

| Symbol | File | Owns |
|---|---|---|
| `EXPERIMENTS['homepage-hero-anim']` | `src/experiments.ts` | the anim flag key + variants (`control`=`scroll` strip, `test`=`flash` gate, `variant_c`=`studio` house, `variant_d`=`boutique`) |
| `HeroChooser` | `src/pages/index.tsx` | resolves BOTH experiments (URL override → PostHog flag → control fallback after `RESOLVE_TIMEOUT_MS`); picks strip / flash / studio / boutique, and for studio picks the DRIVER (timer vs pin/inplace/horizontal parallax). Renders a skeleton until resolved (no flash-of-strip). `DEFAULT_HERO='studio'`, `DEFAULT_SCROLL_MODEL='static'`. |
| `ChooserStrip` | `src/pages/index.tsx` | the CONTROL marquee (renders `CHOOSER_CARDS` twice for a seamless loop) |
| `ChooserFlash` | `src/pages/index.tsx` | the TEST/flash gate: the portal + persistent board + the rotation/flash choreography (timer + arrow keys) |
| `ChooserStudio` | `src/pages/index.tsx` | variant_c/studio, TIMER driver: the Lebanese house self-running on a rAF clock (`useTimerScene`); renders `StudioFacade`. The DEFAULT hero. |
| `ChooserBoutique` | `src/pages/index.tsx` | variant_d/boutique: the lit 3-arch storefront gate (timer-driven) |
| `CHOOSER_CARDS` | `src/pages/index.tsx` | the destinations array (to ADD a door: append an entry + drop its arched PNG in `static/img/cards/`) |
| `step` (in `ChooserFlash` / `ChooserBoutique`) | `src/pages/index.tsx` | ONE scene change (`delta` = ±1): advance `active`, fire the flash, hold, recede. Used by both auto-rotate and the arrows. (The studio house does NOT use `step` — it uses `deriveSceneState`.) |
| `FLASH_INTERVAL_MS` / `FLASH_HOLD_MS` / `FLASH_LEAD_MS` | `src/pages/index.tsx` | the flash TIMING (how long a card shows / the light lingers / the lead before the flash) |
| `FLASH_SETTLE_MS` | `src/pages/index.tsx` | the board's TOTAL roll time (passed to `SplitFlap` as `settleMs`) |
| `FLASH_BOARD_COLS` / `FLASH_BOARD_ROWS` | `src/pages/index.tsx` | the board's fixed grid (widen the board by adding COLS, not stretching) |
| `.flashArch` / `.flashArchWrap` | `src/pages/index.module.css` | the flash light + its arch-shaped MASK (see gotchas) |
| `.flashArchBox` | `src/pages/index.module.css` | the portal box; `isolation: isolate` contains the flash's stacking context |
| `.flashBoard` | `src/pages/index.module.css` | the Vestaboard housing (the dark bezel; width comes from tile count) |
| `--portal-w` (on `.flashGate`) | `src/pages/index.module.css` | the SHARED width axis (arch box + the gate derive from it) |
| `.studioGate` / `.studioPeek` | `src/pages/index.module.css` | variant_c gate + the arch-masked scene peek (mask position via `--arch-*`) |
| `.boutiqueGate` / `.boutiquePeek` | `src/pages/index.module.css` | variant_d gate + its masked lit opening |
| `SplitFlap` default export | `src/components/SplitFlap/index.tsx` | the Vestaboard component (text → fixed grid → deck-roll; `spinning` churns then settles) |
| `DECK` (in `SplitFlap`) | `src/components/SplitFlap/index.tsx` | the flap charset the cells roll THROUGH (`' A-Z0-9punct'`) |
| `.foldDown` / `.foldUp` / `.leaf` | `src/components/SplitFlap/styles.module.css` | the 3D flap fold (leaves must stay OPAQUE — see gotchas) |
| `EXPERIMENTS['homepage-hero-scroll']` | `src/experiments.ts` | the SCROLL-MODEL flag (`control`=`static` timer, `pin`, `inplace`, `horizontal`, `pickets`). Composed with `homepage-hero-anim`: when anim resolves to `studio`, this picks timer vs parallax wrapper. |
| `useScrollScene` | `src/pages/index.tsx` | the parallax ENGINE: maps a `[0,1]` scroll progress → `{active, mode, flashing, transition}`; crossing a scene band fires the camera flash (scroll-triggered, not timed); reduced-motion snaps with no flash. `transition` (the crossing phase + from/to) is what the picket renderer reads |
| `useScrollProgress` | `src/pages/index.tsx` | the rAF-throttled, PASSIVE, SSR-safe scroll/resize listener that writes the progress fraction (each model supplies its own `compute`) |
| `picketStates` | `src/pages/index.tsx` | PURE: per-strip `{flash, revealed}` + the reveal `revealRight%` for a crossing at phase `t` (`PICKET_COUNT`=9, `PICKET_SPREAD`=0.5). The staggered wave; `revealed` is monotone so the new scene is ONE contiguous-left clip, not N slices |
| `StudioFacade` | `src/pages/index.tsx` | the presentational Lebanese central-hall house (roof + body + 3 arches + hanging board + door↔scene flash), driven by props; rendered by BOTH the timer `ChooserStudio` and `ParallaxStudio`. In `picketed` mode, mid-crossing it holds FROM fully lit + reveals TO under a strip clip + renders `StudioPickets`; base-URLs all scene/door imgs ONCE at the top so hook count is constant |
| `StudioPickets` | `src/pages/index.tsx` | the picket-wave OVERLAY: `PICKET_COUNT` strips, each with an inline per-strip opacity (its point on the wave), masked to the arch + isolated like `.studioFlash`. Replaces the single flash in the pickets model |
| `ParallaxStudio` | `src/pages/index.tsx` | the scroll-driven hero, one component for all 4 models (`pin`/`inplace`/`horizontal`/`pickets`); pin/horizontal/pickets use a tall spacer + sticky and RELEASE after the last scene (never traps the wheel). `pickets` uses pin-style geometry with its OWN taller runway (`PICKET_SCENE_VH`), SKIPS the snap (every rest is stable) and renders from a catch-up display progress (`useCatchUpProgress`) chasing the raw scroll |
| `useNavbarSceneHighlight` | `src/pages/index.tsx` | lights the top-navbar `<a>` matching the active scene's destination; only while the hero is on-screen (IntersectionObserver), reverts on leave |
| `StudioFestoon` | `src/pages/index.tsx` | the festoon string-light PROGRESS indicator: one bulb per scene, lit L-to-R by `active`. With `onJump` (scroll models) each bulb is a `<button>` that scrolls to that scene; without it (timer house) they are read-only spans. |
| `jumpToScene` (in `ParallaxStudio`) | `src/pages/index.tsx` | scroll to scene `i`'s settled centre (the festoon bulbs call it). Reuses the snap's rAF ease + a jump-generation token so a new jump supersedes an in-flight one; reduced-motion jumps instantly. |
| `directionRef` (in `ParallaxStudio` / `useScrollProgress`) | `src/pages/index.tsx` | the last scroll direction (+1 down, -1 up); the snap glides WITH it so it never pulls you against your scroll |
| `.studioFestoon` / `.studioBulb` / `.studioBulbLit` | `src/pages/index.module.css` | the festoon swag + a bulb + its lit (warm-glow) state |
| `.studioPickets` / `.studioPicket` | `src/pages/index.module.css` | the picket-wave container (arch-masked, isolated, z above the scene layers) + one strip. Strip `left`/`width`/`opacity` are inline; `width` is `1/N + 0.5px` so anti-aliasing paints NO seam between neighbours. Reduced motion zeroes every strip |
| `.parallaxSpacer` / `.parallaxStick` | `src/pages/index.module.css` | the tall scroll runway + the sticky pinned viewport (pin/horizontal/pickets) |
| `.parallaxPanTrack` | `src/pages/index.module.css` | the horizontal-pan depth backdrop (the 7 scenes panned behind the facade; isolated, low-opacity) |
| `.navbarSceneActive` | `src/pages/index.module.css` | the active-scene navbar highlight style |

The parallax pivot's design story (the three scroll models, the navbar sync, the influence) lives in
the **House** design post (`designs/2026-06-28-lebanese-house-hero.mdx`); the **Vestaboard** post
(`designs/2026-06-26-vestaboard-flash-hero.mdx`) covers the reusable board + flash component.

## How to make common changes

- **Add a destination door:** append to `CHOOSER_CARDS` + add its arched PNG to `static/img/cards/`.
  Both arms pick it up. (The board auto-fits via word-wrap; check the longest title still fits
  `FLASH_BOARD_ROWS`.)
- **Tune the flash:** speed = the CSS `transition` durations on `.flashArch.flashOn` /
  `:not(.flashOn)` (the perceived ramp/recede) PLUS `FLASH_HOLD_MS` + `FLASH_INTERVAL_MS` (the beat).
  Keep the peak alpha of the `.flashArch` gradient BELOW opaque (see white-out gotcha).
- **Tune the board:** `FLASH_BOARD_COLS` widens it via filler tiles (NOT a wider bezel);
  `FLASH_SETTLE_MS` is the roll duration; `.flashBoard` font-size scales the tiles.
- **Change the rotation logic / add a control (flash/boutique):** go through `step(delta)` so the flash
  + flip stay in sync; the auto-interval re-arms on `active` change (so manual nav resets it, no
  double-fire). (The studio house does NOT use `step` — it is progress-driven, see below.)
- **Change the studio house's DRIVER or its progress model:** the house's every animatable piece (flash
  bloom, door/scene swap, board flip) is a pure function of ONE progress `p in [0,1]` via
  `deriveSceneState(p, count, reduce)`. TWO drivers feed it: `useTimerScene` (rAF clock, the default) and
  `useScrollScene` (scroll position, the parallax). To retune the timing, change `deriveSceneState`
  (shared by both) or `TRANSITION_FRACTION` (how much of each scene's slice is the crossing vs settled).
  To flip the homepage DEFAULT to scroll, change `DEFAULT_SCROLL_MODEL` in `HeroChooser` (a one-line
  routing change) AND update the homepage e2e `DEFAULT (bare /)` assertion (it asserts NO
  `.parallaxSpacer`) + the skeleton height parity.

### Change the PIN scroll experience (the scroll-synced parallax)

The pin model pins the house full-screen in a tall `.parallaxSpacer` runway; scrolling the runway
advances the scenes, then the hero releases and the page scrolls on. Four things were hard-won here
(see the matching gotchas 17-20); touch them carefully:

- **The released guard (gotcha 17):** the snap effect in `ParallaxStudio` must compute the RAW
  (unclamped) progress `raw = -rect.top / scrollable` and BAIL when `raw < 0 || raw >= 1`. Above/below
  the runway the hero is off-screen or released, so it must NEVER write scroll. Clamping progress to
  `[0,1]` before this check is what made the page YANK BACK ~2000px into the hero after a fast flick to
  the bottom. Never re-clamp before the guard.
- **The forward snap (gotcha 18):** when scrolling STOPS mid-transition, the snap picks its target with
  the SAME rule the visuals use: past the flash peak (`t >= 0.5`) the door already shows the NEXT scene,
  so land FORWARD (`s + 1`); before the peak land back on `s`. Also bail when `s === stops - 1` (the last
  slice is entirely settled). Do not go back to `Math.round(...)` (it can only rewind).
- **The board settle-per-scene (gotcha 19):** `ParallaxStudio` passes
  `spinning={scrolling && scene.boardFromText !== scene.boardToText}` so the Vestaboard churns ONLY in
  the flash transition and rolls to the scene title the moment you enter a settled zone (even while still
  scrolling). Don't widen it back to `spinning={scrolling}` (churns the whole journey; board never syncs).
- **The compact pinned header + fold fit (gotcha 20):** when a pinned model is active, the closest
  `<header>` gets `data-parallax-pinned` (set in `ParallaxStudio`), and `.heroBanner[data-parallax-pinned]`
  shrinks the title block while `.parallaxSticky` caps the house width by viewport height so the whole
  house + WELCOME frames at scroll 0. The cap is
  `min(--body-w, (100vh - 2*--pin-house-offset) / --pin-house-ratio)`; both knobs are Hero-Tuner
  params (`pinHouseOffset` / `pinHouseRatio` in `src/lib/hero-tuning.ts`), dial live and bake defaults.
  Re-check the `≤600px` mobile block still FILLS the pinned viewport door-only (it overrides the cap).
- **The snap follows scroll DIRECTION (gotcha 18):** `useScrollProgress` records the last scroll
  direction into `directionRef`; the snap glides that way (down → next scene, up → current) so it never
  pulls you against your momentum. Do not revert to a peak-only / nearest-centre rule (it yanked a
  just-past-centre stop backward).
- **The festoon = the progress indicator (gotchas 21-22).** `StudioFestoon` draws a swag of bulbs, one
  per scene, lit L-to-R by `active`. In the scroll models each bulb is a `<button>` that calls
  `jumpToScene(i)`; the timer house passes no `onJump`, so they are read-only spans. `jumpToScene`
  eases to the scene's settled centre with the same rAF glide as the snap.

### Change the PICKETS scroll experience (the scrubbable picket-wave transition)

`pickets` is `pin` with a different CROSSING render. Instead of one flash blooming the whole door, the
arch is `PICKET_COUNT` (9) vertical strips and the SAME `sin` hump is STAGGERED across them (`picketStates`),
so a bell of light sweeps left→right and the next scene wipes in strip-by-strip. It reuses all of pin's
geometry + the festoon + the board; only the crossing visual + the snap differ (see gotcha 23).

- **Tune the wave:** `PICKET_COUNT` (strip count, odd so a centre strip peaks at mid) and `PICKET_SPREAD`
  (how far the right strips lag the left; 0 = all flash together = the single flash, higher = a longer
  sweep) are JS constants next to `deriveSceneState`. They are NOT Hero-Tuner CSS vars (the math runs in
  JS), so change them in code, not the panel.
- **The wave renders from a CATCH-UP display progress (`useCatchUpProgress`), between TWO proven
  failure modes.** Scroll INPUT is quantized + inertial: a trackpad flick moves hundreds of px BETWEEN
  two animation frames, so a pure `f(rawScroll)` renderer TELEPORTS (skips pickets, a nudge jumps a
  scene) no matter how fast it renders. But a long smoothing (an early version: ~0.35s trail on
  thrashing frames) made the wave TRAIL, playing only AFTER you stopped. The answer threads between:
  a displayed progress CHASES the raw scroll with a short ease (`CATCHUP_TAU_S` 70ms) + a close-rate
  floor (`CATCHUP_MAX_S` 300ms) + a SPEED CAP (`CATCHUP_MAX_RATE` 0.5 progress/s) so a multi-crossing
  flick visibly sweeps every picket and scene in order instead of closing arbitrarily fast (this is
  GSAP ScrollTrigger's numeric `scrub`, tuned snappy). Rules: it NEVER writes scroll; raw passthrough
  under reduced motion + the `?hero-progress` freeze; the board settle TARGET stays derived from RAW
  progress (a moving target strands the flap roll); `spinning` = `scrolling || catchUp.active` so the
  board churns while the wave still sweeps. Guarded by `[pickets] the wave tracks the scroll LIVE`,
  `... render STORM`, and hero-perf's `inertial FLICK sweeps THROUGH` + `rapid-succession flicks`.
- **The wave's scrub fidelity IS its scroll runway.** Pickets has its OWN spacer height
  (`PICKET_SCENE_VH` 1.5 vs pin's 0.85) and its own crossing share (`PICKET_TRANSITION_FRACTION` 0.7 vs
  0.5; `deriveSceneState` takes it as a param) so one crossing spans ~650px of scroll instead of ~250px.
  Shrink either and a single trackpad nudge out-scrolls a whole crossing again. Guarded by
  `[pickets] each crossing spans a REAL scroll runway`. `?hero-perf=1` logs the live px per
  crossing/picket in its GEOMETRY line.
- **The reveal is ONE clip, not N slices:** because `revealed` is monotone in strip index, the new scene
  is always a contiguous LEFT block, so the picket reveal layer is a single `.studioDoorScene` clipped by
  `clip-path: inset(0 revealRight% 0 0)`. Keep the FROM layer (door or the scene you are leaving) fully lit
  UNDER it (gotcha 23) so the strips reveal the new scene over a stable base.
- **No snap by design:** pickets extends the snap effect's early guard (`model === 'pickets'` bails) and
  the mid-crossing rest is a stable picture. Do NOT add a snap back; it would fight the scrub-and-reverse
  contract that is the whole point of the mode.
- **Freeze a specific frame with `?hero-progress=P`** (localhost only): pins the engine's raw progress
  `p in [0,1]` directly, bypassing scroll, so you can park on an EXACT pickets crossing PHASE
  (a mid-wave frame) or a settled scene — deterministic for manual QA + e2e. `?hero-scene=N` only pins
  SETTLED scenes; `hero-progress` can freeze a transition. Under the pickets mapping
  (`PICKET_TRANSITION_FRACTION` 0.7): `&hero-progress=0.081` ≈ the door→scene-0 peak;
  `&hero-progress=0.144` ≈ scene 0 settled (p = (stop + within)/8). Owner `forcedProgress` (index.tsx),
  registered in the URL-param registry; the catch-up hook passes it through untouched.

## ⚠️ Gotchas (the things that bite — don't re-break these)

1. **The flash must be light OVER the scene, NOT a white-out.** `.flashArch` uses a SEMI-TRANSPARENT
   white radial (peak alpha well below 1.0). Push it to opaque white and the scene vanishes into a
   flat void. Keep the layered semi-transparent stops.
2. **The flash is bound to the EXACT arch via a luminance MASK** (`mask-image: arch-inner.png` on
   `.flashArchWrap`), NOT a `border-radius` approximation. The mask is the real arch silhouette, so
   the light lines up with the drawn frame on every card. Don't swap it for `border-radius`.
3. **No `mix-blend-mode` / `filter` on the animating flash.** Both force a GPU compositing layer whose
   fractional-pixel edge paints a faint SEAM in the hero — visible ONLY on hi-DPI (retina) and ONLY
   while the flash animates ("a line that comes and goes"). The fix was to drop them (and the arch
   image's `drop-shadow` filter) and use plain semi-transparent white + `isolation: isolate` on the
   box. See `[[mix-blend-hidpi-seam]]`. If a stray line reappears, suspect a new `filter`/`blend`/
   `transform` layer; confirm it vanishes at DPR=1.
4. **The board must NOT fade on a scene change.** It's a PERSISTENT single instance OUTSIDE the
   cross-fading arch images (so only the flaps flip, the board stays put). Don't move it inside the
   cross-fade.
5. **Split-flap leaves must be OPAQUE.** Transparent flap halves let the bright tile bleed through the
   hinge as white hairlines. `.leaf` has a solid dark `background-color`.
6. **Arrow keys need a GLOBAL listener.** `←`/`→` nav is a `window` `keydown` (in `ChooserFlash`), NOT
   an `onKeyDown` on the gate — otherwise it only works after the gate is focused (it did nothing on a
   fresh page). Ignore keypresses while typing in an input.
7. **The hero must fit ABOVE THE FOLD.** The whole gate (title → arch → board) is tuned to sit in a
   laptop viewport; the hero band padding + subtitle margin are tight on purpose. If you enlarge the
   portal, re-check the board isn't pushed off-screen.
8. **ANY animated `filter: blur()` is the SAME GPU-layer seam risk as the flash** (gotcha 3). (An
   earlier train-slide variant used a motion-blur here; it was replaced by the studio house, but the
   lesson stands for any future blur.) Keep a blurred layer CLIPPED (`overflow:hidden`) inside a box
   with its OWN stacking context (`isolation:isolate`), and return the blur to `0` at rest (no blurred
   layer sitting composited when nothing is moving). Don't pair it with `mix-blend-mode`; re-check at
   DPR=2 while the blur is mid-animation if you add one.
9. **A URL override matches the variant KEY, not the VALUE.** `urlOverride` reads
   `?ab-homepage-hero-anim=<KEY>` where KEY is `control`/`test`/`variant_c`/`variant_d` (NOT the values
   `scroll`/`flash`/`studio`/`boutique`); an unknown key silently falls through to control. So the studio
   house is forced with `=variant_c` (or the alias `=studio`, which `HeroChooser` also accepts), and the
   scroll model with `?ab-homepage-hero-scroll=pin|inplace|horizontal`. The e2e + visual specs force
   `variant_c` + a scroll model this way.
10. **A negative-margin OVERLAP between two same-context elements is ALSO a DPR-seam source** (another
    `[[mix-blend-hidpi-seam]]` instance). `.studioRoof` overlaps `.studioBody`'s top edge with a
    negative `margin-bottom` so the eave covers the body's lighter top gradient edge. At `-1px` the
    overlap landed on a FRACTIONAL device pixel at DPR 2/3 (worse on mobile = higher DPR), leaving that
    lighter edge peeking out as a faint full-width horizontal hairline across the teal ABOVE the arch,
    ONLY while scrolling the parallax (when the facade is on a GPU layer). Fix: `-2px` (an overlap big
    enough to always cover, regardless of the device grid). Diagnose by live-disabling each candidate
    (`filter`/overflow/border/margin) one at a time and re-shooting MID-SCROLL at DPR 2 AND 3.
11. **The board TITLES are CENTERED per-message; the board is WIDER than the longest title.**
    `wrapToGrid` centers each line on its own width (so short titles like WELCOME sit dead-center),
    and `STUDIO_BOARD_COLS` (24 desktop) / `STUDIO_BOARD_COLS_MOBILE` (22) are wider than the longest
    title (19) so every title has blank flap tiles flanking it. (An earlier shared-width-stable scheme
    kept shared-prefix cells from flipping but left short titles left-hugging; the user chose true
    centering, accepting that CRAFT↔JOURNEY re-centers ~19 cells.) Don't re-narrow the board to the
    title width or centering loses its margin.
12. **`.studioBoardRail` is a MOBILE-ONLY gold railing** in the teal gap below the hanging board /
    above the door (the side-window railings are hidden on mobile). It's `display:none` by default and
    shown only in the `≤600px` media query. The dev-only-surfaces e2e doesn't guard it (it's real
    content), so if you touch the mobile facade, re-check it still sits in the gap, not over the door.
    **It must NOT use `filter: drop-shadow`** — the filter is a GPU layer whose fractional-pixel bottom
    edge paints a white hairline UNDER the rail on hi-DPI (the seam family again). The rail ships with
    no shadow; if you want grounding, use a non-filter `box-shadow` on a solid element.
13. **The flash gradient must fade to alpha 0 BEFORE the arch boundary** (a white-line mechanism
    distinct from the GPU seam — this one is the bloom itself). `.studioFlash`'s radial gradient is
    clipped by the arch mask; if its OUTER stop has any white left (the old `rgba(255,255,255,0.35)
    100%`), the mask's soft anti-aliased edge LEAKS that white as a thin outline tracing the arch top
    into the teal — visible the moment `--flash-o` ramps up on scroll ("a white line as soon as I
    scroll"). Fix: end the gradient at `rgba(255,255,255,0) ~96%` so there's no white at the mask edge.
    Diagnose by FORCING `.studioFlash{opacity:0.5}` and looking for an arch-tracing outline. Don't
    raise the end-alpha back above 0.
14. **Rail edges are SOLID BORDERS, not gradient stops — a gradient edge ON a box edge is a FIREFOX
    white fringe.** Both rails (`.studioBoardRail`, `.studioWindowRail`) had their top/bottom rails as
    a vertical `linear-gradient` whose color-stop sat ON the box's top/bottom edge; FIREFOX antialiases
    that stop against the edge into a faint WHITE hairline (the "line under the rail" — present without
    scrolling, moved WITH the rail, INVISIBLE in Chrome, which is why it took several rounds). It is
    NOT the `transparent` keyword (swapping it for `rgba(217,164,65,0)` did NOT fix it — red herring);
    it's the gradient-edge AA. **Fix: SOLID `border-top`/`border-bottom` for the rails (crisp in
    Firefox) + the gradient draws ONLY the balusters with `background-clip: content-box` so it never
    touches the borders.** General rules: (a) a stray line that repros in ONE browser but not another
    is a gradient/AA rendering difference, not a GPU seam — test `playwright`'s bundled `firefox`, not
    just chromium; (b) BISECT (solid bg / no bg / gradient) before theorizing; (c) for a crisp edge in
    Firefox use a solid border, not a gradient stop on the edge.
15. **KNOWN-UNSOLVED: a faint Firefox-only line at the door-arch LAYER-STACK top, under vigorous
    scroll.** Distinct from #14 (that was the rail's own edge). The centre door arch is a STACK of ~10
    GPU-composited layers (door `<img>`, 8 scene `<img>`s, the flash) — most clipped by `mask-image`
    (a layer-promoter), inside a box that's `transform: scale()`-ed AND `filter: drop-shadow`-ed (two
    more promoters). They all share a box-TOP up in the teal (the box is taller than the dome), and
    FIREFOX antialiases that shared layer-stack top edge into a faint ~1px line that resurfaces under
    vigorous scrolling. Removing ONE promoter (transform→width, filter→inner img, isolation, clip-path)
    REDUCES it but never kills it — another layer keeps an edge at the same y. **Do NOT repeat the
    per-property whack-a-mole** — it's exhausted (see the `firefox-arch-seam-investigation` memory for
    everything tried). The only thing likely to FULLY fix it is collapsing the door+scene+flash stack
    into ONE pre-composited layer (one layer can't seam against itself) — a real restructure, deferred.
    The PNG coords are NOT the cause (`validate-arch-assets.js` confirms all scenes conform). It's
    faint, Firefox-only, vigorous-scroll-only; on the default animation house a normal visitor rarely
    triggers it.
16. **A filled `.studioFacade` background BLEEDS THROUGH the clipped roof triangle's corners.** The
    `StudioFacade` is `.studioFacade` (container) → `.studioRoof` (a `<div>` clipped to a triangle via
    `clip-path: polygon(50% 0,100% 100%,0 100%)`) + `.studioBody` (the teal wall). The roof+body FULLY
    cover the facade (roofH + bodyH ≈ facadeH, body is full-width), so the facade needs NO background of
    its own — and it must NOT have one, because the roof's transparent triangle CORNERS reveal whatever
    the facade paints as a RECTANGULAR slab around the triangle ("fill around the triangle / it doesn't
    look like a triangle"). Light mode leaves `.studioFacade` transparent (clean triangle on the page);
    a dark-mode `[data-theme='dark'] .studioFacade { background: … }` (added to "tint the dusk wall")
    re-introduces the slab — WRONG, the teal `.studioBody` already paints the wall in BOTH themes. Fix:
    keep `.studioFacade` transparent in every theme; tint the WALL on `.studioBody`, never the container.
    Diagnose by probing `elementsFromPoint` at a roof CORNER (outside the triangle) — if it hits
    `.studioFacade` with a non-transparent bg, that's the bleed.
17. **The pin snap must be RELEASED-AWARE: never write scroll when the hero is not pinned.** The
    snap-to-scene effect in `ParallaxStudio` reads the spacer's `getBoundingClientRect()` and eases the
    page to the nearest settled scene when scrolling stops mid-transition. The trap: it used to CLAMP
    progress to `[0,1]` FIRST, so once you scrolled PAST the runway (progress pinned at 1) it still read
    "stopped mid-transition on the last scene" and glided the page ~2000px back UP into the hero after a
    fast flick to the bottom (a horrible yank-back; the whole area below the hero was a no-rest zone).
    **Fix: compute the RAW unclamped progress `raw = -rect.top / scrollable` and BAIL when
    `raw < 0 || raw >= 1`** (above the runway = off-screen, at/below 1 = released). Only snap while the
    hero is genuinely PINNED. The e2e `[pin] resting BELOW the hero is stable` guards this (stop at the
    bottom, wait 2.5s, assert scrollY held). Never re-introduce a pre-guard clamp.
18. **The pin snap must land FORWARD past the flash peak, matching the visuals.** `deriveSceneState`
    swaps the door to the NEXT scene at the flash PEAK (`t >= 0.5`). So a stop PAST the peak has already
    committed to the next scene on screen; snapping BACKWARD to the scene you were leaving contradicts
    the door + board. The old target `Math.round(p*stops - 0.5)` could only ever rewind. **Fix: mirror
    the engine — `t = (within - settledFrac)/TRANSITION_FRACTION; targetStop = t >= 0.5 ? s+1 : s`**, and
    bail on the last stop (`s === stops-1`, whose whole slice is settled). Guarded by `[pin] STOP past
    the flash peak SNAPS FORWARD`.
19. **The board churns ONLY in transitions, so it settles per-scene while scrolling.**
    `ParallaxStudio` passes `spinning={scrolling && scene.boardFromText !== scene.boardToText}` to the
    facade. `boardFromText === boardToText` is exactly `deriveSceneState`'s SETTLED condition, so the
    Vestaboard churns random glyphs only while crossing between scenes and rolls to the scene's title the
    moment you enter its settled zone (even if the wheel is still moving) — door + flash + board land on
    the SAME scene together. The old `spinning={scrolling}` churned during ANY scroll activity, so the
    board only ever showed a title on a FULL stop (never in sync mid-journey). Don't widen it back.
    Guarded by `[pin] board SETTLES to the scene title while still scrolling`.
20. **The pinned hero COMPACTS the title block + caps the house to fit the first viewport.** At scroll 0
    the eyebrow/title/subtitle sit ABOVE the pinned viewport, so a full-size title pushed the house half
    below the fold. `ParallaxStudio` marks the closest `<header>` with `data-parallax-pinned`;
    `.heroBanner[data-parallax-pinned]` shrinks the title block (uses `--text-*`/`--space-*` tokens), and
    `.parallaxSticky` caps the house width by viewport height:
    `min(--body-w, (100vh - 2*--pin-house-offset) / --pin-house-ratio)` (the sticky CENTRES the house in
    a 100vh box that starts `offset` px down at scroll 0, so `facadeH <= vh - 2*offset`). Both knobs are
    Hero-Tuner params (`pinHouseOffset` default `189px`, `pinHouseRatio` default `0.75` in
    `src/lib/hero-tuning.ts` — keep the schema defaults in lockstep with the CSS fallbacks). The `≤600px`
    mobile block OVERRIDES this (the house FILLS the pinned `100svh` viewport door-only); re-check both
    desktop AND 375px if you touch either.
21. **A festoon bulb BEHIND the board is an unclickable tap target.** `StudioFestoon` strings the bulbs
    across the top of the body, but on DESKTOP the wide Vestaboard sits high and covers the middle. If
    the festoon's `z-index` is below the board, the middle bulbs are not just visually hidden, the board
    INTERCEPTS their pointer events (Playwright reports "a glyph span intercepts pointer events" and the
    click times out). Fix: the festoon is `z-index: 6` (IN FRONT of the board, which is `z-index: 3`), so
    a real-festoon look AND every bulb stays clickable. If you re-layer the board or festoon, re-verify a
    middle bulb is clickable on desktop (not only the flanking ones). On mobile the board hangs lower, so
    all bulbs are already clear.
22. **A festoon bulb click must NOT fire the gate `<Link>`.** The whole facade is inside the destination
    `<Link>` (the click-through gate). A bulb's `onClick` therefore does `e.preventDefault()` +
    `e.stopPropagation()` and calls `jumpToScene` instead of navigating; without it, clicking a bulb
    would navigate to that scene's page rather than scroll to it. The e2e asserts the URL stays `/` after
    a bulb click. `jumpToScene` bumps a jump-generation token so a second bulb click cleanly supersedes
    an in-flight jump (two rAF loops writing scroll would otherwise fight); reduced-motion jumps instantly.

23. **The picket wave needs the FROM content held FULLY LIT under the reveal clip, and its images
    base-URL'd at the top.** In `pickets` mode mid-crossing, `StudioFacade` does NOT do the pin peak-swap
    (`shown` flipping at `t >= 0.5`); instead it forces the FROM layer on (the door if `fromDoor`, else
    `fromScene`) and paints the TO scene OVER it in a separate `.studioDoorScene` clipped by
    `clip-path: inset(0 revealRight% 0 0)`, so the strips reveal the new scene over a stable base. Two
    traps: (a) if you let `shown` swap under the wave, the base flickers to the new scene early and the
    reveal has nothing to wipe over; (b) the reveal `<img>` must reuse a `useBaseUrl` result computed at
    the TOP of the component (all card/door/window URLs are mapped ONCE into `cardUrls`/`doorUrl`) — a
    `useBaseUrl(...)` call INSIDE the `{wave && ...}` branch changes the hook COUNT between settled and
    crossing renders and crashes React with "Rendered more hooks than during the previous render." Also:
    `--flash-o` is forced to 0 in picket mode (the pickets ARE the flash), and `.studioPickets` sits at
    `z-index: 4` (above the scene layers + the off single-flash) so the wave reads as the top bloom.

24. **The pickets BOARD churns while scrolling, then does a strand-free roll to a scramble (mid-crossing)
    or the title (settled).** `ParallaxStudio` passes `spinning={scrolling}` for pickets (churn only while
    the wheel moves). On STOP the resting state is chosen from the RAW progress (see `rawBoardText` +
    `boardTextOverride`), NOT the smoothed scene: mid-crossing → a DETERMINISTIC `picketBoardScramble`
    (a stable random string, so a mid-wave rest reads as a departure board frozen mid-swap, not the
    destination title early); settled → the scene title. The settle is a real ~`PICKET_BOARD_SETTLE_MS`
    (750ms) roll via SplitFlap's `settleRollMs`. FOUR traps, each of which stranded the flap cells
    ("DISCOVUEUR", punctuation stuck mid-roll) until fixed — do not reintroduce any:
    (a) the board target must be STABLE through the settle; the SMOOTHED scene keeps easing for ~120ms
    after a stop and flips scramble↔title mid-roll, remounting cells mid-fold. Derive it from RAW progress
    (`rawBoardText`), which is fixed the instant you stop.
    (b) the scramble is sized to the DESTINATION title (same length + space positions), so scramble→title
    is an in-place per-cell swap; a different-length scramble re-centers the grid and shifts cell slots.
    (c) on settle, `SpinningCell` mounts a FRESH `Cell` (never rolls a churning cell in place — a churn
    tick or a re-render mid-fold strands the two faces).
    (d) the fresh settle `Cell` rolls from BLANK (`ROLL_FROM`) FORWARD via `from`; blank is deck index 0
    so every target is a bounded forward roll (A,B,C..) that arrives with its neighbours. A non-blank
    start glyph makes targets before it in the deck wrap through the whole punctuation tail (wildly
    different arrival times, ugly). pin/inplace/horizontal keep the instant SNAP (`settleRollMs` unset).
    (e) BLANK-target cells do NOT churn (they stay blank while spinning) and SNAP on settle. The board
    pads short text to a fixed 3-row grid; if the 2 padding rows churned, all rows would fill and then
    COLLAPSE 3-rows→1 in one frame on stop (a jarring jump). Keeping padding cells blank throughout means
    the board is always a SINGLE centered row and the churn→title settle is an in-row flap, not a
    row-count jump. Guarded by the `[pickets] the board churns as a SINGLE row` e2e.

25. **FIREFOX-ONLY: split-flap letters "glitch downward" mid-crossing — fix it on the FOLD LEAVES, NOT
    every glyph (that lags scroll).** During a flap, each leaf clips a full-height `.glyph` and rotates
    it (`rotateX`). Firefox RE-RASTERIZES the clipped glyph every frame of the fold and its sub-pixel
    vertical position DRIFTS, so letters visibly drop ~8px then snap back (Chrome composites it right).
    The fix is `will-change: transform` on the MOVING leaves `.foldDown`/`.foldUp` only, and ONLY IN
    FIREFOX (scoped via `@supports (-moz-appearance: none)` in SplitFlap/styles.module.css). Chromium
    never had the drift, and a perf trace proved the standing promotion HURT it: while the pickets
    board churns during scroll, every churn-tick glyph change invalidated a promoted layer, storming
    the compositor commit (100ms+ `Commit` events). **Do NOT put the promotion on `.glyph`** (or
    `.leaf`, or `.cell`): the board has ~144 static glyph spans, and promoting all of them explodes
    the layer count in EVERY browser. Two subtleties: (a) it's a PAINT artifact, so
    `getBoundingClientRect` reports the correct layout — verify the FIX by screenshotting the board
    mid-churn IN FIREFOX (the `dev` Playwright project is Firefox); (b) `translateZ(0)` computes to a
    2D `matrix(1,0,0,1,0,0)` in Firefox, so a computed-style check for `translateZ` misses it — the
    regression guard checks `transform !== 'none'` on a RESTING (non-flipping) glyph instead. Guarded
    by `[pickets] the board does NOT layer-promote every glyph` (a frame-timing test does NOT catch
    this — a fast CI box composites 144 layers fine).

26. **The board CHURN must flip DIRECT, one fold per tick, sized to finish inside the tick.** A churn
    tick retargets the spinning cell to a RANDOM glyph; letting `Cell` deck-roll toward it (its normal
    mode) spawns dozens of timer + state updates per second per cell, and a fold LONGER than the tick
    period never completes, leaving every cell stuck mid-flip mutating text inside the moving leaves —
    combined across ~20 churning cells this was a main-thread storm that coalesced a whole trackpad
    gesture's scroll events into ONE delivery (the "multi-second hitch" logs). `SpinningCell` passes
    `direct` + `settleMs ≈ periodMs - 20` for churn ticks (index.tsx of SplitFlap); the true deck roll
    remains for real text changes and the pickets settle roll. Same-site TABS SHARE a renderer process:
    leftover hero tabs (e.g. an old `?hero-perf=1` tab) churn on the SAME main thread as the page you
    are testing — close them before judging scroll perf.

## Verify any change

- `make validate-hero-anchors` — confirms every symbol this skill names still exists (exit 2 on drift).
  **If you rename an anchored symbol, update this skill AND `scripts/validate-hero-anchors.js` in the
  same change.**
- `make test-e2e` (the `homepage.spec.ts` functional assertions: control=strip, test=flash gate,
  variant_c=studio house, one active scene each, arrows step; the parallax block covers pin/inplace/
  horizontal/pickets scene-forcing + navbar sync + the four pin behaviors: advance-then-release, snap
  clears the flash, resting-below-is-stable, snap-forward, board-settles-while-scrolling; plus the four
  pickets behaviors: mid-crossing rest is STABLE (no snap), reveal wipes L→R and REVERSES on scroll-back,
  the new scene commits past the wave, resting-below-is-stable). Note the `?hero-scene=N` navbar-highlight
  test is a PRE-EXISTING flake (IntersectionObserver race on rapid multi-scene nav, fires on any model
  under load); it passes in isolation and CI retries absorb it.
- **`make test-visual`** — the VISUAL regression baselines (hero across DPR 1+2, viewports, light+dark,
  settled + mid-flash). This is what catches the retina seam / white-out / overflow. After an
  INTENTIONAL visual change, regenerate with `make test-visual-update` and commit the new baselines.
- `yarn build` exit 0.
- Eyeball it on the dev server across arms: `/?ab-homepage-hero-anim=test` (flash), `=variant_c`
  (studio timer house), `=variant_d` (boutique), `=control` (strip), and the scroll models
  `/?ab-homepage-hero-scroll=pin|inplace|horizontal|pickets`, light + dark, at a retina DPR if you can (the
  seam class of bug hides at DPR=1). For `pin`, run the scroll checks by hand: flick to the bottom and confirm
  the page HOLDS (no yank-back); stop mid-transition past the flash peak and confirm the snap goes
  FORWARD; slow-scrub and confirm the board shows each title in its settled zone; and confirm the whole
  house + WELCOME frames at scroll 0 on desktop AND fills the viewport door-only at 375px. For `pickets`,
  slow-scrub a crossing and confirm the light wave sweeps L→R and the new scene wipes in strip-by-strip;
  STOP mid-wave and confirm nothing moves (no snap); scroll back and confirm the wave reverses.
