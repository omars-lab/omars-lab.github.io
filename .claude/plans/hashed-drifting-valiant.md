# Dev-only hero TUNING PANEL (drag → URL params) + a skill + a "Building masks with Claude" technique post

## Context

Tuning the homepage hero variants (variant C = Moroccan studio facade, variant D = boutique storefront,
and especially the **arch MASK** that clips each scene to its arched opening) has been a slow loop:
Claude edits a number → restart/shoot → user looks → "a little more left / bigger / different curve" →
repeat. The recurring pain is **pinning the arch mask's position/size/side precisely**, plus placing the
sign and tuning glow/colors. The user wants to flip the loop: **a dev-only on-screen panel with toggles,
drag handles, and sliders that writes every adjustment to the URL query params.** The user drags the look
they want, the URL captures the exact state, they **share that URL**, and Claude **reads the params and
bakes them into the CSS as the new defaults** (the panel never ships). This both unblocks the C/D tuning
and is itself a reusable technique worth documenting.

Two extra deliverables the user asked for: a **skill** capturing the workflow, and a **`/designs` technique
post titled "Building masks with Claude"** (kind: design-story) telling the story of this collaboration
technique (drag-to-URL tuning + auto-tracing/pinning an arch mask + share-URL → bake-into-CSS).

Decisions locked with the user:
- **Controls:** arch mask (position/size/side), layout (sign + element positions), style (colors/glow/
  sizes), and a variant switch — all four.
- **Scope:** hero-only, **dev-only** (localhost + non-prod, the exact gate `DebugMenu` already uses), never
  ships to production. Smallest, safest build.
- **Output:** user shares the tuned URL; **Claude reads the params and bakes them into the CSS defaults**
  (the shipped variant matches; no panel in prod).

## What already exists (reuse, don't reinvent)

- **`src/components/DebugMenu/`** (`index.tsx` + `sections/` + `styles.module.css` + `types.ts`) — a
  floating, **localhost-only** developer panel, already mounted and **hard-gated**: `if
  (process.env.NODE_ENV === 'production') return null; if (!isLocalhost()) return null;` (index.tsx ~L89-92).
  It is built to host **pluggable sections**. The tuner becomes a NEW section here — no new mount, no new
  gate, automatically absent from prod (the e2e "dev-only-surfaces absence" test already guards this).
- **`src/theme/Root.tsx`** — swizzled Root that mounts `<DebugMenu/>` above the router. Nothing to change.
- **`src/experiments.ts`** — `isLocalhost()` (the shared gate) and `urlOverride()` (reads `?ab-...=` params).
  The tuner reuses `isLocalhost()` and mirrors the URL-param convention. `EXPERIMENTS['homepage-hero-anim']`
  is the variant registry the variant-switch buttons drive (`?ab-homepage-hero-anim=variant_c` etc).
- **`src/pages/index.tsx` + `index.module.css`** — the hero variants (`ChooserStudio`, `ChooserBoutique`,
  `ChooserFlash`, `ChooserStrip`) and their `.studio*` / `.boutique*` CSS. The tuner drives these via **CSS
  custom properties** (CSS vars) the variants read with fallbacks, so the panel sets vars and the CSS
  responds live.
- **`static/img/cards/arch-inner.png`** — the existing arch luminance mask, plus the 7 scene PNGs which all
  place the arch **identically** (the user confirmed). This consistency is what makes ONE mask / one set of
  arch params fit all scenes.
- **`/designs` design-story posts** (e.g. `designs/2026-06-03-sidebar-emoji-system.mdx`) — the format to
  mirror for the technique post: frontmatter (`slug`, `kind: design-story`, `title`, `description`,
  `authors`, `tags`, `date`), `<!-- truncate -->`, then Problem → Approach → sections.

## The build

### 1. The tuning model (URL params ⇄ CSS vars)

A single source of truth: a **param schema** (key, label, kind: toggle|slider|drag|color|select, min/max/
step, the CSS var it maps to, and a default). The panel renders controls from the schema; each control
writes its value to BOTH the URL (`history.replaceState`, so no reload/scroll-jump) and a CSS custom
property on a hero root element. The hero variants read those vars with CSS fallbacks, e.g.
`mask-position: var(--arch-x, center) var(--arch-y, center); mask-size: var(--arch-size, contain);`
so with no panel and no params the baked default holds (prod is unaffected).

- **Arch mask controls** → `--arch-x`, `--arch-y` (mask-position), `--arch-w`/`--arch-h` or `--arch-size`
  (mask-size), `--arch-side` (a select that swaps which `mask-image` / flips via `scaleX(-1)` on the layer).
  The drag handle over the arch sets x/y; sliders set size/curve. This is the part that answers the masks
  question: the mask geometry becomes live, draggable, URL-captured numbers.
- **Layout controls** → drag the sign / arch / windows; their offsets land in `--sign-x/-y`, etc.
- **Style controls** → color pickers for terracotta/stone, sliders for glow strength/size/gaps → the
  relevant `--*` vars.
- **Variant switch** → buttons that set `?ab-homepage-hero-anim=<variant>` and reload (reusing the existing
  override), so you can tune each arm without hand-editing the URL.

### 2. The panel (a new DebugMenu section)

- `src/components/DebugMenu/sections/HeroTuner.tsx` (+ styles) — registered into the existing sections list.
  Renders the controls from the schema; a **drag layer** (pointer events → x/y %), sliders, color inputs,
  a variant button row, plus: a **"Copy URL"** button (the shareable state), a **"Reset"** button, and a
  **read-out** showing the current param string (so the user can paste it to Claude directly).
- It only does anything when `isLocalhost()` + non-prod (inherited from DebugMenu's gate). In prod the whole
  DebugMenu returns null, so there is ZERO shipped surface (guarded by the existing e2e absence test).
- An **arch-mask overlay helper**: a toggle that overlays the current mask on the live scene at ~50% opacity
  so the user can SEE the mask vs the drawn arch while dragging (the "pin the mask" affordance), and verify
  alignment.

### 3. Reading params at runtime (dev only)

- A tiny `applyHeroParams()` util (in the hero or a small `src/lib/hero-tuning.ts`): on localhost, parse the
  hero `--*` params from the URL and set them as inline CSS vars on the hero root. No-op off localhost. So a
  **shared URL reproduces the look** in any localhost session (and the panel reflects them). Prod ignores
  them entirely (defaults baked in CSS win).

### 4. The arch-mask pinning utility (the technique's core)

- A small **Node script** `scripts/trace-arch-mask.js` (dev tool, not shipped): reads a scene PNG
  (`craft.png`), detects the drawn arch outline, and emits a pixel-exact mask PNG + the arch's bounding
  geometry (x/y/w/h/curve as %), which seed the panel's defaults. Because all scenes place the arch
  identically, tracing ONE yields params that fit ALL. Pair it with an **overlay-proof** screenshot
  (mask over a scene) so alignment is provable, per the repo's prove-don't-assert tenet.
- (If auto-trace proves fiddly, the fallback is: the panel's drag handles let the user pin it by eye and the
  URL captures it — same outcome, human-in-the-loop.)

### 5. The skill

- `.claude/skills/tune-hero-visually/SKILL.md` — owns the workflow: when the user wants to dial in a hero
  variant's look, point them at the dev panel (`/?ab-...=variant_c` + open DebugMenu → Hero Tuner), have them
  drag/slide to taste, **Copy URL**, paste it back; Claude reads the `--*` params and **bakes them into the
  CSS** as the new defaults, then removes reliance on the URL. Documents the param schema, the CSS-var
  contract (every tunable is a `var(--x, default)`), the localhost gate, and the mask-pinning method
  (auto-trace + overlay-proof). Cross-links `maintain-homepage-hero`. Add to the CLAUDE.md skills map.

### 6. The technique post ("Building masks with Claude")

- `designs/<YYYY-MM-DD>-building-masks-with-claude.mdx`, `kind: design-story`, `draft: true` initially.
  Tells the story: the slow tweak-shoot loop → the insight (consistent art = one mask) → the drag-to-URL
  panel → pinning the arch mask (auto-trace + the 50% overlay proof) → share-URL → Claude bakes it into CSS.
  Honors repo conventions: no literal em-dashes in prose, MDX-safe (backtick any `<Tag>`/`{braces}`),
  absolute `slug`, healthy `description`. Optionally weave a `DiagramWithFootnotes`/animated-mermaid of the
  URL ⇄ CSS-var ⇄ share loop (see `upgrade-post`).

## Files

- NEW: `src/components/DebugMenu/sections/HeroTuner.tsx` (+ a `.module.css`), registered in DebugMenu's
  section list (`src/components/DebugMenu/index.tsx` / `types.ts`).
- NEW: `src/lib/hero-tuning.ts` — the param schema + `applyHeroParams()` + the URL⇄var helpers.
- NEW: `scripts/trace-arch-mask.js` — the mask auto-trace + geometry emitter (dev tool).
- EDIT: `src/pages/index.module.css` — convert the tunable hero properties (arch mask position/size/side,
  sign offset, glow, colors, gaps) to `var(--*, <current default>)` so the panel can drive them and the
  baked default still holds in prod.
- EDIT (small): `src/pages/index.tsx` — call `applyHeroParams()` for the hero variants on localhost; add a
  hero-root element/attr the vars attach to.
- NEW: `.claude/skills/tune-hero-visually/SKILL.md` + a one-line entry in the root `CLAUDE.md` skills map.
- NEW: `designs/<date>-building-masks-with-claude.mdx` (design-story, draft).
- Possibly EDIT: `maintain-homepage-hero` SKILL.md (cross-link the new tuner skill) +
  `validate-hero-anchors.js` (add the CSS-var contract anchors so the skill stays in lockstep).

## Keep working (don't regress)

- **Prod ships nothing new.** The panel + param-reading are localhost+dev gated (DebugMenu's existing
  double gate); the CSS vars all have baked fallbacks, so a prod build with no panel and no URL params
  renders exactly the committed defaults. The existing e2e **dev-only-surfaces absence** test must still
  pass (DebugMenu/tuner absent from the prod build).
- **control + flash variants untouched.** The tuner targets the studio/boutique (and the mask); scroll +
  flash keep their current CSS.
- **No retina seam reintroduced.** Any tuner-driven `filter`/`mix-blend` stays inside the isolated arch box
  (the hard-won lesson); verify at DPR=2.
- The variant C/D look work (restore studio facade, fix boutique empty arches) RESUMES after the panel
  exists, USING the panel to pin the mask + placements quickly (that's the whole point).

## Verification

- **Dev panel:** `make start`, open `/?ab-homepage-hero-anim=variant_c` (and `=variant_d`), open DebugMenu →
  Hero Tuner. Drag the arch handle + move sliders; confirm the look updates LIVE and the URL params update.
  Copy URL, open it in a fresh tab → the same look reproduces. Toggle the mask-overlay → the mask aligns to
  the drawn arch.
- **Mask trace:** run `node scripts/trace-arch-mask.js craft.png` → emits a mask + geometry; overlay-proof
  screenshot shows it lines up with the drawn arch.
- **Bake-back:** take a sample tuned URL, read its params, write them as the CSS-var defaults, reload with
  NO params → the look persists (proves the bake path).
- **Prod safety:** `yarn build`; grep the built JS/HTML to confirm NO HeroTuner/DebugMenu strings ship (or
  run the existing dev-only-surfaces absence e2e). `make test-visual` for the hero variants stays green
  (panel-off baselines unchanged).
- **Post + skill:** `yarn build` clean on the new MDX (no em-dash/MDX-break); `make validate-structure` /
  `validate-seo` advisories addressed; skill present in the CLAUDE.md map.

## Sequencing note

Build the **panel + mask-pinning first** (this plan). THEN use it to quickly nail variant C's restored
terracotta-facade look (target: `~/Desktop/Screenshot 2026-06-27 at 3.15.45 PM.png`) and variant D's
boutique arches/glow — those tuning tasks (#122, #121) resume after the tool exists and become fast.
