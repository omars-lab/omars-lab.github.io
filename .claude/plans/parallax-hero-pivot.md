# Parallax hero pivot — scroll-driven scene traversal (3 variants) + navbar sync

## What the user asked for
Pivot the homepage hero from a TIMER animation to a **scroll-driven parallax**: as you scroll, the
centre **door transforms into the different scenes** (the 7 `CHOOSER_CARDS`), the **board updates**
to each scene's title, scrolling **decides which scenes we traverse**, and the **matching top navbar
item highlights** for the active scene. Keep the **white flash** as the per-scene transition (now
triggered by scroll position, not a timer).

## Locked decisions (from the user)
1. **Scroll model: implement ALL THREE**, togglable via the experiment framework (A/B/C):
   - **pin** — hero `position:sticky` in a tall spacer; scroll advances scenes 1-by-1, releases after #7.
   - **inplace** — hero in normal flow; door morphs by how far the hero has scrolled through the viewport.
   - **horizontal** — vertical scroll → horizontal pan across the 7 scenes inside a pinned hero.
2. **Transition: keep the white flash**, scroll-triggered (crossing a scene threshold pops the flash +
   reflips the board), not timed.
3. **Navbar sync: highlight the matching top navbar item** (`CHOOSER_CARDS[i].to` === navbar `to`).

## The 7 scenes → navbar map (already aligned)
`CHOOSER_CARDS[i].to`: `/craft`, `/journey`, `/thoughts`, `/mindset`, `/initiatives`, `/questions`,
`/designs` — each equals an existing top-navbar `to`. So navbar highlight = find the navbar `<a>` whose
`href` ends with the active card's `to`, add an active class.

## Architecture (reuse, don't rewrite)
Current `ChooserStudio` (index.tsx ~425-611) already has: `active`/`mode`/`flashing` state, `step(delta)`
flash transition, door/scene cross-fade layers, the `SplitFlap` board, `gateRef`+`applyHeroParams`.

Refactor into:
- **`useScrollScene(opts)`** — the shared engine (task #141). Input: a ref to the scroll container/spacer
  + count (7). Output: `{active, mode, flashing}` derived from scroll progress. Crossing a per-scene
  threshold sets `flashing` true briefly (reuse `STUDIO_FLASH_MS`/`HOLD`) and advances `active`/`mode`.
  SSR-safe (no window at module load), `prefers-reduced-motion` → no flash, instant scene set.
- **`<StudioFacade active mode flashing/>`** — presentational facade (the JSX from 513-608), pure props.
  Both the old timer `ChooserStudio` and the 3 new scroll variants render this.
- **3 wrappers** that own the scroll mechanics + feed the engine:
  - `ChooserParallaxPin` (#142), `ChooserParallaxInplace` (#143), `ChooserParallaxHorizontal` (#144).
- **`useNavbarSceneHighlight(active)`** (#146) — effect that toggles an active class on the matching
  navbar link; reverts on unmount / hero leaving viewport. SSR-safe, no fighting Docusaurus route logic
  (homepage is `/`, so nothing is active by default → we own the highlight cleanly).

## Experiment wiring (#145)
`src/experiments.ts` `EXPERIMENTS`: add scroll-model variants. Decision: add a NEW experiment key
`homepage-hero-scroll` with variants `pin` | `inplace` | `horizontal` (+ maybe `control` = current
timer studio), OR extend `homepage-hero-anim`. Lean: NEW key so the existing anim A/B stays clean and we
can run the scroll-model A/B/C independently. `HeroChooser` switch resolves the variant → picks the
wrapper. Localhost override: `?ab-homepage-hero-scroll=pin|inplace|horizontal`.

## Guardrails
- **Prod-safe / no scroll trap**: reduced-motion + a keyboard path; pin/horizontal must RELEASE so the
  page below the hero is reachable (never permanently jack the wheel).
- **No hi-DPI seam**: keep `isolation:isolate` on the flashing arch; any new transform/filter stays inside it.
- **DebugMenu/tuner absent from prod** (existing e2e absence test must pass).
- **Hero anchors**: update `validate-hero-anchors.js` for the new symbols; e2e/visual specs for 3 variants.
- Track each as a task (#141-147); visual+mobile pass per variant before the PR.

## Build order
141 engine → (142 pin ‖ 143 inplace ‖ 144 horizontal) → 145 experiment wiring + 146 navbar sync →
147 verify (visual/mobile/reduced-motion/prod) → commit → PR on user go-ahead.
