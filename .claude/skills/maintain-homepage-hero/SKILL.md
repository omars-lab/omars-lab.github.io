---
name: maintain-homepage-hero
description: The guide to SAFELY changing the homepage hero — the A/B/C-tested chooser with three variants (a scrolling card strip = control, a camera-flash "departures" gate = test, and a train-station gate where the board hangs and the scene slides like a train = variant_c). All share a Vestaboard split-flap board. Catalogs the key DECISIONS, the CODE ANCHORS (which symbol in which file owns each behavior), and the GOTCHAS that bite when you touch it (a retina compositing seam, a flash white-out, a board that fades on cross-fade, arrow keys that need a global listener). Use BEFORE editing src/pages/index.tsx, src/pages/index.module.css, or src/components/SplitFlap — it tells you what each piece is for and what NOT to break.
---

# Maintain the homepage hero

The homepage hero is the **chooser**: it lets a visitor pick a door into the site. It is an **A/B/C
experiment** (`homepage-hero-anim`, registered in `src/experiments.ts`):

- **`control` = the scrolling strip** — all destination cards in a row, auto-scrolling (a marquee).
- **`test` = the camera-flash "departures" gate** — an arched portal whose scene cross-fades behind
  a flash of light, captioned by a split-flap **Vestaboard** that rolls through the alphabet to name
  the destination.
- **`variant_c` = the train-station gate** — the same portal + Vestaboard, re-staged as a station:
  the board HANGS from a bracket (with a subtle idle sway) and the scene change is a TRAIN SLIDING
  PAST (the active scene slides out with motion blur as the next slides in, NO flash). The slide
  carries the transition. Phase 1 is the slide + the hang; the station DRESSING (iron frame, amber
  glow, station clock) is a deferred backlog tracked in `.claude/plans/hashed-drifting-valiant.md`.

The override URL uses the variant KEY: `?ab-homepage-hero-anim=control` / `=test` / `=variant_c`
(NOT the value `scroll`/`flash`/`train`). All three arms show the SAME destinations + copy; only the
PRESENTATION differs (that's what makes the A/B/C attributable). Changing the hero means touching
subtle motion + compositing + a custom component, and several non-obvious things bite. This skill is
the map.

> **Design story** (the WHY + the bugs): `designs/2026-06-26-vestaboard-flash-hero.mdx`.
> **Experiment** (hypothesis + metric): `/initiatives/homepage-hero-anim` (`blog/2026-06-26-homepage-hero-anim.md`).
> **Drift guard**: `scripts/validate-hero-anchors.js` checks the symbols this skill names still exist;
> the PostToolUse hook `.claude/hooks/hero-anchor-hook.sh` warns when you edit a hero file so you
> review this skill. **If you rename a symbol below, update this skill + the validator in the same change.**

## Code anchors (symbol → what it owns)

The anchors are **symbol names** (not line numbers, which drift). The validator checks each still exists.

| Symbol | File | Owns |
|---|---|---|
| `EXPERIMENTS['homepage-hero-anim']` | `src/experiments.ts` | the flag key + variants (`control`=`scroll`, `test`=`flash`, `variant_c`=`train`) |
| `HeroChooser` | `src/pages/index.tsx` | resolves the variant (URL override → PostHog flag → control fallback after `RESOLVE_TIMEOUT_MS`), picks strip vs flash gate vs train gate (a 3-way switch). Renders a skeleton until resolved (no flash-of-strip). |
| `ChooserStrip` | `src/pages/index.tsx` | the CONTROL marquee (renders `CHOOSER_CARDS` twice for a seamless loop) |
| `ChooserFlash` | `src/pages/index.tsx` | the TEST gate: the portal + persistent board + the rotation/flash choreography |
| `ChooserTrain` | `src/pages/index.tsx` | the VARIANT_C gate: the portal where scenes SLIDE (train) + the HANGING board. Tracks `prev` + `dir` so the leaving + entering scenes slide the right way. |
| `TRAIN_SLIDE_MS` / `TRAIN_INTERVAL_MS` | `src/pages/index.tsx` | the train-slide duration / the beat between scene changes (variant C) |
| `CHOOSER_CARDS` | `src/pages/index.tsx` | the destinations array (to ADD a door: append an entry + drop its arched PNG in `static/img/cards/`) |
| `step` (in `ChooserFlash`) | `src/pages/index.tsx` | ONE scene change (`delta` = ±1): advance `active`, fire the flash, hold, recede. Used by both auto-rotate and the arrows. |
| `FLASH_INTERVAL_MS` / `FLASH_HOLD_MS` / `FLASH_LEAD_MS` | `src/pages/index.tsx` | the flash TIMING (how long a card shows / the light lingers / the lead before the flash) |
| `FLASH_SETTLE_MS` | `src/pages/index.tsx` | the board's TOTAL roll time (passed to `SplitFlap` as `settleMs`) |
| `FLASH_BOARD_COLS` / `FLASH_BOARD_ROWS` | `src/pages/index.tsx` | the board's fixed grid (widen the board by adding COLS, not stretching) |
| `.flashArch` / `.flashArchWrap` | `src/pages/index.module.css` | the flash light + its arch-shaped MASK (see gotchas) |
| `.flashArchBox` | `src/pages/index.module.css` | the portal box; `isolation: isolate` contains the flash's stacking context |
| `.flashBoard` | `src/pages/index.module.css` | the Vestaboard housing (the dark bezel; width comes from tile count) |
| `--portal-w` (on `.flashGate`) | `src/pages/index.module.css` | the SHARED width axis (arch box + the gate derive from it) |
| `.trainGate` / `.trainArchBox` | `src/pages/index.module.css` | variant C gate + its portal (clips the slide via `overflow:hidden` + `isolation:isolate` to contain the blur layer) |
| `.trainArchImgLeaving` + `trainEnterFromRight` keyframes | `src/pages/index.module.css` | the train-slide: active/leaving scenes + the slide-and-blur keyframes (blur peaks mid-travel, 0 at rest) |
| `.trainHanger` / `.trainBoardSwing` + `trainSway` | `src/pages/index.module.css` | the bracket the board hangs from (mount bar + cables) + the idle sway |
| `SplitFlap` default export | `src/components/SplitFlap/index.tsx` | the Vestaboard component (text → fixed grid → deck-roll) |
| `DECK` (in `SplitFlap`) | `src/components/SplitFlap/index.tsx` | the flap charset the cells roll THROUGH (`' A-Z0-9punct'`) |
| `.foldDown` / `.foldUp` / `.leaf` | `src/components/SplitFlap/styles.module.css` | the 3D flap fold (leaves must stay OPAQUE — see gotchas) |
| `EXPERIMENTS['homepage-hero-scroll']` | `src/experiments.ts` | the SCROLL-MODEL flag (`control`=`static` timer, `pin`, `inplace`, `horizontal`). Composed with `homepage-hero-anim`: when anim resolves to `studio`, this picks timer vs parallax wrapper. |
| `useScrollScene` | `src/pages/index.tsx` | the parallax ENGINE: maps a `[0,1]` scroll progress → `{active, mode, flashing}`; crossing a scene band fires the camera flash (scroll-triggered, not timed); reduced-motion snaps with no flash |
| `useScrollProgress` | `src/pages/index.tsx` | the rAF-throttled, PASSIVE, SSR-safe scroll/resize listener that writes the progress fraction (each model supplies its own `compute`) |
| `StudioFacade` | `src/pages/index.tsx` | the presentational Lebanese central-hall house (roof + body + 3 arches + hanging board + door↔scene flash), driven by props; rendered by BOTH the timer `ChooserStudio` and `ParallaxStudio` |
| `ParallaxStudio` | `src/pages/index.tsx` | the scroll-driven hero, one component for all 3 models (`pin`/`inplace`/`horizontal`); pin/horizontal use a tall spacer + sticky and RELEASE after the last scene (never traps the wheel) |
| `useNavbarSceneHighlight` | `src/pages/index.tsx` | lights the top-navbar `<a>` matching the active scene's destination; only while the hero is on-screen (IntersectionObserver), reverts on leave |
| `.parallaxSpacer` / `.parallaxStick` | `src/pages/index.module.css` | the tall scroll runway + the sticky pinned viewport (pin/horizontal) |
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
- **Change the rotation logic / add a control:** go through `step(delta)` so the flash + flip stay in
  sync; the auto-interval re-arms on `active` change (so manual nav resets it, no double-fire). The
  train gate has its OWN `step(delta)` (it records `prev` + `dir` for the cross-slide, no flash).
- **Tune the train (variant C):** the slide speed = `TRAIN_SLIDE_MS` (JS, clears `prev` when the slide
  ends) which must match the `--train-slide` fallback in the `trainEnter*/trainExit*` keyframes; the
  blur strength = the `blur(...)` value in those keyframes; the hang sway = the `trainSway` keyframe
  amplitude on `.trainBoardSwing`. The DRESSING backlog (iron frame, amber glow, clock, modern-vs-
  Victorian theme) is deferred — see `.claude/plans/hashed-drifting-valiant.md` before adding it.

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
8. **The train-slide's `filter: blur()` is the SAME GPU-layer seam risk as the flash** (gotcha 3).
   It's kept safe by `overflow:hidden` + `isolation:isolate` on `.trainArchBox` (the blur is clipped
   and the box has its own stacking context) and by returning blur to `0` at the slide's start AND
   end (so there's no blurred layer at rest). Don't add `mix-blend-mode`, and don't let the blur
   linger non-zero between slides; re-check at DPR=2 mid-slide if you touch the keyframes.
9. **Variant C uses the variant KEY in the URL override**, `?ab-homepage-hero-anim=variant_c` (not
   `=train`). `urlOverride` matches the variant key, and `train` is the VALUE; `=train` silently falls
   through to control. The e2e + visual specs force `variant_c`.
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
13. **The flash gradient must fade to alpha 0 BEFORE the arch boundary** (a THIRD white-line mechanism,
    distinct from the GPU seam — this one is the bloom itself). `.studioFlash`'s radial gradient is
    clipped by the arch mask; if its OUTER stop has any white left (the old `rgba(255,255,255,0.35)
    100%`), the mask's soft anti-aliased edge LEAKS that white as a thin outline tracing the arch top
    into the teal — visible the moment `--flash-o` ramps up on scroll ("a white line as soon as I
    scroll"). Fix: end the gradient at `rgba(255,255,255,0) ~96%` so there's no white at the mask edge.
    Diagnose by FORCING `.studioFlash{opacity:0.5}` and looking for an arch-tracing outline. Don't
    raise the end-alpha back above 0.

## Verify any change

- `make test-e2e` (the `homepage.spec.ts` functional A/B/C assertions: control=strip, test=flash
  gate, variant_c=train gate, one active scene each, arrows slide).
- **`make test-visual`** — the VISUAL regression baselines (hero across DPR 1+2, viewports, light+dark,
  settled + mid-flash + the train gate settled). This is what catches the retina seam / white-out /
  overflow. After an INTENTIONAL visual change, regenerate with `make test-visual-update` and commit
  the new baselines.
- `yarn build` exit 0.
- Eyeball it on the dev server at `/?ab-homepage-hero-anim=test`, `=variant_c`, and `=control`, light
  + dark, and at a retina DPR if you can — the seam class of bug hides at DPR=1.
