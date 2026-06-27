---
name: maintain-homepage-hero
description: The guide to SAFELY changing the homepage hero — the A/B-tested chooser with two variants (a scrolling card strip = control, and a camera-flash "departures" gate with a Vestaboard split-flap board = test). Catalogs the key DECISIONS, the CODE ANCHORS (which symbol in which file owns each behavior), and the GOTCHAS that bite when you touch it (a retina compositing seam, a flash white-out, a board that fades on cross-fade, arrow keys that need a global listener). Use BEFORE editing src/pages/index.tsx, src/pages/index.module.css, or src/components/SplitFlap — it tells you what each piece is for and what NOT to break.
---

# Maintain the homepage hero

The homepage hero is the **chooser**: it lets a visitor pick a door into the site. It is an **A/B
experiment** (`homepage-hero-anim`, registered in `src/experiments.ts`):

- **`control` = the scrolling strip** — all destination cards in a row, auto-scrolling (a marquee).
- **`test` = the camera-flash "departures" gate** — an arched portal whose scene cross-fades behind
  a flash of light, captioned by a split-flap **Vestaboard** that rolls through the alphabet to name
  the destination.

Both arms show the SAME destinations + copy; only the PRESENTATION differs (that's what makes the
A/B attributable). Changing the hero means touching subtle motion + compositing + a custom component,
and several non-obvious things bite. This skill is the map.

> **Design story** (the WHY + the bugs): `designs/2026-06-26-vestaboard-flash-hero.mdx`.
> **Experiment** (hypothesis + metric): `/initiatives/homepage-hero-anim` (`blog/2026-06-26-homepage-hero-anim.md`).
> **Drift guard**: `scripts/validate-hero-anchors.js` checks the symbols this skill names still exist;
> the PostToolUse hook `.claude/hooks/hero-anchor-hook.sh` warns when you edit a hero file so you
> review this skill. **If you rename a symbol below, update this skill + the validator in the same change.**

## Code anchors (symbol → what it owns)

The anchors are **symbol names** (not line numbers, which drift). The validator checks each still exists.

| Symbol | File | Owns |
|---|---|---|
| `EXPERIMENTS['homepage-hero-anim']` | `src/experiments.ts` | the flag key + variants (`control`=`scroll`, `test`=`flash`) |
| `HeroChooser` | `src/pages/index.tsx` | resolves the variant (URL override → PostHog flag → control fallback after `RESOLVE_TIMEOUT_MS`), picks strip vs gate. Renders a skeleton until resolved (no flash-of-strip). |
| `ChooserStrip` | `src/pages/index.tsx` | the CONTROL marquee (renders `CHOOSER_CARDS` twice for a seamless loop) |
| `ChooserFlash` | `src/pages/index.tsx` | the TEST gate: the portal + persistent board + the rotation/flash choreography |
| `CHOOSER_CARDS` | `src/pages/index.tsx` | the destinations array (to ADD a door: append an entry + drop its arched PNG in `static/img/cards/`) |
| `step` (in `ChooserFlash`) | `src/pages/index.tsx` | ONE scene change (`delta` = ±1): advance `active`, fire the flash, hold, recede. Used by both auto-rotate and the arrows. |
| `FLASH_INTERVAL_MS` / `FLASH_HOLD_MS` / `FLASH_LEAD_MS` | `src/pages/index.tsx` | the flash TIMING (how long a card shows / the light lingers / the lead before the flash) |
| `FLASH_SETTLE_MS` | `src/pages/index.tsx` | the board's TOTAL roll time (passed to `SplitFlap` as `settleMs`) |
| `FLASH_BOARD_COLS` / `FLASH_BOARD_ROWS` | `src/pages/index.tsx` | the board's fixed grid (widen the board by adding COLS, not stretching) |
| `.flashArch` / `.flashArchWrap` | `src/pages/index.module.css` | the flash light + its arch-shaped MASK (see gotchas) |
| `.flashArchBox` | `src/pages/index.module.css` | the portal box; `isolation: isolate` contains the flash's stacking context |
| `.flashBoard` | `src/pages/index.module.css` | the Vestaboard housing (the dark bezel; width comes from tile count) |
| `--portal-w` (on `.flashGate`) | `src/pages/index.module.css` | the SHARED width axis (arch box + the gate derive from it) |
| `SplitFlap` default export | `src/components/SplitFlap/index.tsx` | the Vestaboard component (text → fixed grid → deck-roll) |
| `DECK` (in `SplitFlap`) | `src/components/SplitFlap/index.tsx` | the flap charset the cells roll THROUGH (`' A-Z0-9punct'`) |
| `.foldDown` / `.foldUp` / `.leaf` | `src/components/SplitFlap/styles.module.css` | the 3D flap fold (leaves must stay OPAQUE — see gotchas) |

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
  sync; the auto-interval re-arms on `active` change (so manual nav resets it, no double-fire).

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

## Verify any change

- `make test-e2e` (the `homepage.spec.ts` functional A/B assertions: control=strip, test=gate, one
  active scene, rotates).
- **`make test-visual`** — the VISUAL regression baselines (hero across DPR 1+2, viewports, light+dark,
  settled + mid-flash). This is what catches the retina seam / white-out / overflow. After an
  INTENTIONAL visual change, regenerate with `make test-visual-update` and commit the new baselines.
- `yarn build` exit 0.
- Eyeball it on the dev server at `/?ab-homepage-hero-anim=test` (and `=control`), light + dark, and
  at a retina DPR if you can — the seam class of bug hides at DPR=1.
