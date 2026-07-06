# Scroll-synced hero: fix the pin parallax so door + Vestaboard travel together

## Context

The scroll-driven parallax hero already exists and is live in the code (PR #110): `ParallaxStudio` +
the pure `deriveSceneState` engine in `bytesofpurpose-blog/src/pages/index.tsx`, reachable via
`?ab-homepage-hero-scroll=pin|inplace|horizontal`. The default `/` renders the timer house. The user
experienced the parallax as "failed". Live probing on :3000 (chrome-devtools, pin model) confirmed
three real defects plus one layout gap:

1. **Yank-back trap (P0).** Flick to the bottom of the page, stop, and ~300ms later the page
   auto-scrolls itself ~1900px back up into the hero (observed: y=5758 → y=3885, every time).
   Root cause: the snap effect (index.tsx:1030-1070) clamps progress to 1 once you are past the
   runway, and `within ≈ 0.999 > settledFrac` always reads as "stopped mid-transition", so it fires
   a glide back to the last scene no matter how far below the hero you are. Everything below the
   hero is a no-rest zone. (The e2e "releases" test only asserts the bottom is momentarily
   reachable, so it never caught this.)
2. **Backward snap (P1).** Stopping mid-transition always rewinds to the stop you were LEAVING:
   `Math.round(p * stops - 0.5)` can never round forward (observed: 1976 → 2176 scrolled, stop,
   yanked back to 1891) — even when you stopped past the flash peak where the door already shows
   the NEXT scene. The snap contradicts what the visuals committed to.
3. **Board is noise while scrolling (the "sync" ask).** `spinning={scrolling}` (index.tsx:1134)
   churns random glyphs during ANY scroll activity — including the snap's own glide — so the board
   only ever shows a scene title when everything is fully stopped. Door and board are never in sync
   mid-journey.
4. **Fold fit.** At scroll 0 the title block (~270px) sits above the pinned viewport, so the house
   + WELCOME board start half below the fold (`.heroBanner[data-parallax-pinned]` today only trims
   `padding-top` to 1rem).

**User decisions (asked + answered):**
- Fix behind the `?ab-homepage-hero-scroll=pin` override first; flipping the homepage default is a
  separate follow-up decision after reviewing on localhost.
- **Pin** is the model to polish (mobile already degrades horizontal → pin, so one model covers both).
- **Free scrub + release**: never hijack scroll; a fast flick flies through and the page rests
  wherever the user stops. Snap only tidies a mid-transition rest while the hero is pinned.
- **Board settles per scene**: churn only during the flash transition; entering a scene's settled
  zone rolls the board to that scene's title even while still scrolling.
- **Compact header when pinned** so the full house + WELCOME is framed at scroll 0.

## Design invariants

- **Released = untouchable.** Once the user has scrolled past the runway (or is above it), the hero
  never writes to scroll again.
- **Snap agrees with the visuals.** A mid-transition stop lands on the stop whose scene the door is
  ALREADY showing (the swap happens at the flash peak, t ≥ 0.5): before the peak → back to the
  current stop, past the peak → forward to the next. No rewinds past a committed swap.
- **Snap logic mirrors `deriveSceneState`.** The last stop's whole slice is settled there
  (`s === nextStop` guard); the snap must use the same rule so they can't disagree.
- **Board target = the scene the door shows** (unchanged rule); churn is scoped to transition zones
  only, so board/door/flash arrive together at every stop.
- All existing invariants hold: passive listeners, `prefers-reduced-motion` skips snap + flash, no
  `mix-blend-mode`/`filter` on animating layers (hi-DPI seam), `?hero-scene` seam untouched.

## Changes

All in `bytesofpurpose-blog/` unless noted.

### 1. Fix the snap effect — `src/pages/index.tsx` (the effect at ~1030-1070)

Inside the existing effect, after computing `rect`/`scrollable`:
- **Released guard:** compute the RAW (unclamped) progress `raw = -rect.top / scrollable`; if
  `raw < 0 || raw >= 1` return (hero not pinned — never touch scroll). This alone kills the
  yank-back trap.
- **Last-stop guard:** derive `s` (current stop) as `deriveSceneState` does; if `s === stops - 1`
  return (the last slice is entirely settled, mirroring the `s === nextStop` branch at
  index.tsx:546).
- **Forward-bias:** replace `const stop = Math.round(p * stops - 0.5)` with the visual-match rule:
  `t = (within - settledFrac) / TRANSITION_FRACTION; targetStop = t >= 0.5 ? s + 1 : s;`
  then `targetP = (targetStop + settledFrac / 2) / stops` as today.
- Keep the rAF ease, the `snapActive` re-entry guard, and the abort-on-genuine-user-scroll delta
  check exactly as they are (they were the hard-won part; see the code comments).

### 2. Board settles per scene — `src/pages/index.tsx` (~1134)

Change `<StudioFacade {...scene} spinning={scrolling} />` to scope churn to transition zones:

```tsx
spinning={scrolling && scene.boardFromText !== scene.boardToText}
```

`boardFromText === boardToText` exactly when `deriveSceneState` is in a settled zone, so this is a
pure, engine-consistent test: while the wheel moves THROUGH a settled zone the board rolls to that
stop's title (normal per-cell flap-roll, since `text` is already the shown scene's title); crossing
a transition churns; the snap glide's tail (which ends inside the settled zone) lets the board
settle as the glide lands. Update the adjacent comment (index.tsx:762-767 and 1133) to describe the
new rule. No SplitFlap changes needed — `spinning` + `text` props already do the right thing.

### 3. Compact pinned header + fold fit — `src/pages/index.module.css`

- Extend `.heroBanner[data-parallax-pinned]` (line 24): shrink `.heroTitle` (~4rem → ~2rem),
  `.heroSubtitle` (~1.5rem → ~1rem), tighten eyebrow/margins/padding. Use design-system `--text-*`
  / `--space-*` tokens where a named token matches (the `implement-with-design-system` skill; the
  ds-tokens hook will warn otherwise).
- Cap the house so header + full house fit in one viewport at scroll 0: on the pinned gate only
  (`.parallaxSticky.studioGate` or `.parallaxStick .studioGate`), cap width by viewport height,
  e.g. `max-width: min(var(--body-w, 720px), calc((100vh - <header-allowance>) * <ratio>))`
  (house total height ≈ width × ~0.85: 2:1 body + roof + hanging board). Dial the exact
  allowance/ratio live with the Hero Tuner (`tune-hero-visually` skill) and bake the defaults.
  Keep the mobile block (index.module.css:1122-1211, `100svh`, door-only) working — verify at 375px.
- The `data-parallax-pinned` attribute wiring already exists (index.tsx:1083-1088); no TSX change.

### 4. e2e regression tests — `test/e2e/homepage.spec.ts` (the existing parallax describe block)

- **`[pin] resting below the hero is stable`** (the P0 regression): wheel fast to page bottom, wait
  ~2.5s (snap idle 140ms + glide time), assert `scrollY` unchanged (± a few px). This is the test
  the old "releases" assertion missed.
- **`[pin] mid-transition stop snaps FORWARD past the flash peak`**: scroll into a transition past
  its midpoint, stop, wait for the glide, assert `data-active-scene` kept the NEW scene and
  `scrollY` moved forward (≥ stop position), and the flash cleared (existing helper).
- **`[pin] board settles to the active scene's title`**: after a stop + settle, normalize the board
  text (SplitFlap renders multiple faces per cell — collapse consecutive duplicate glyphs) and
  assert it contains the title matching `data-active-dest`.
- Existing assertions (spacer present, `?hero-scene` seam, navbar highlight, default-`/` has no
  spacer) stay untouched — the default is NOT flipping in this change.

### 5. Lockstep obligations (same change)

- `.claude/skills/maintain-homepage-hero/SKILL.md`: update the parallax gotchas — the released
  guard ("the hero never touches scroll below the runway"), the forward-snap visual-match rule, the
  board settle-per-scene rule, the compact pinned header. Run `make validate-hero-anchors` (no
  anchored symbols are renamed by this plan; if any helper gets extracted/named, add its anchor to
  `scripts/validate-hero-anchors.js` + the SKILL.md table in the same change).
- No new URL params, no generated assets, no experiment set changes.
- No literal em-dash in any reader-facing text (skill/test names/comments — the em-dash hook).

## Execution order + tasks (create via TaskCreate at start)

1. Fix snap: released guard + last-stop guard + forward bias (index.tsx).
2. Scope board churn to transition zones (index.tsx).
3. Compact pinned header + house fold fit, dialed via Hero Tuner (index.module.css).
4. e2e: yank-back regression + forward-snap + board-sync assertions (homepage.spec.ts).
5. Lockstep: SKILL.md gotchas + validate-hero-anchors green.
6. Verify end-to-end (below), then branch → PR → ask user to merge (never commit to master).

## Verification

1. **Live probes on :3000** (dev server already running; re-run the exact chrome-devtools scripts
   used to diagnose, at `/?ab-homepage-hero-scroll=pin`):
   - Fast-flick to bottom → wait 2.5s → `scrollY` stays at bottom (was: yanked to 3885).
   - Scroll to mid-transition just past the flash peak → stop → glide lands FORWARD on the next
     scene's settled center; `data-active-scene` matches the door image and the board title.
   - Slow continuous scrub through all 7 scenes → board shows each title in its settled zone
     (churn only during flashes), navbar highlight tracks, WELCOME at the top.
   - At scroll 0: full house + WELCOME framed under the compact header (screenshot).
2. **Mobile pass (repo convention):** 375px viewport at the same URL — full pinned house fits
   (`100svh`, door-only), board readable, tap-through to a destination works, no horizontal
   overflow.
3. **Tests:** `make validate-hero-anchors`; run the homepage e2e per `test/e2e/README.md`
   (prod-build project: `make build` derivative serve on :4173) — the parallax block including the
   3 new tests, plus the existing default-`/` assertions to prove the default did not change.
4. **Hooks/gates:** ds-tokens + contrast warnings clean on the CSS edit; no em-dash hook trips.

## Out of scope (explicit follow-ups)

- Flipping `DEFAULT_SCROLL_MODEL` to `pin` (a one-line routing change at index.tsx:1212 + homepage
  e2e default assertions + skeleton height parity) — decide after reviewing the fixed experience.
- Launching the `homepage-hero-scroll` PostHog flag for a real A/B.
- `inplace`/`horizontal` polish (they inherit the snap + board fixes automatically since the code
  is shared, but only pin gets the fold-fit/visual pass).
- Parallax visual-regression baselines (pending task #119) and the known-unsolved Firefox
  arch-stack seam (SKILL gotcha 15).
