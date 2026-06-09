# Handoff prompt — Binary-Pyramid Logo (clean session)

Copy everything in the "PROMPT" block below into a fresh session.

---

## PROMPT

I've been designing a "binary-pyramid" logo for this Docusaurus site (blog.bytesofpurpose.com).
The **design-exploration infrastructure is already built and committed to master** (commit #32).
I want to (a) keep refining the look, and (b) eventually turn a chosen variant into the real
site logo. Here's the state, then what's left.

### What already exists (committed, working — do NOT rebuild)
- **`bytesofpurpose-blog/src/lib/binary-pyramid-logo.js`** — the geometry generator, the SINGLE
  SOURCE OF TRUTH. Pure ESM `generateLogoSvg(cfg, fill)`, runs in both Node and the browser.
  Config knobs: `pillar` (greek|doric|ionic|bar), `ring` (oval|circle|rrect), `colMode:'arch'`
  (real columns) + `volute` (spiral|curl), `colStack`+`stackGap`, `shaftZeros`+`barColor`/
  `zeroColor` (interlaced bars + 0-chains, solid edges), `flat`, `noZeros`, `arrange`
  (pyramid|wedge|ground|avenue), `scene` (desert|dusk|night) + `glow`, `mark` (full|triad|single),
  plus rings/centerCount/colGap/horizon/recede/etc.
- **`scripts/generate-logo-variants-data.js`** — build step (wired into `prestart`/`prebuild`)
  that renders the variant list into **`designs/_binary-pyramid-variants.js`**, which is a
  **gitignored build artifact** (regenerated on every build/gh-pages deploy, never committed).
- **`scripts/render-logo.js`** — Node CLI for ad-hoc terminal renders:
  `node scripts/render-logo.js '<json-cfg>' '<fill>' > out.svg` (pipe to `rsvg-convert` for PNG).
- **`src/components/SvgVariantGrid/`** — the gallery component (dark toggle, fixed-px previews,
  `group` filter, and a `pillarBackdrop` mode = full-height colonnade behind a sideways card band).
- **`src/components/BinaryPyramid/`** — renders the logo CLIENT-SIDE from a config (the on-demand path).
- **`designs/2026-06-04-binary-pyramid-logo.mdx`** — the design post (slug `/designs/design-binary-pyramid-logo`),
  currently **`draft: true`**. Documents the whole journey: stacked-glyph (failed totem) → real
  arch columns (Ionic spiral / Doric) → stacked drums → arrangements (colonnade, no-zeros pyramid,
  wedge) → perspectives (ground / avenue) → gold interlaced bars+0s → sleek scene backdrops.

To preview: `cd bytesofpurpose-blog && yarn start`, then open the post at the dev URL
`/designs/design-binary-pyramid-logo` on `localhost:3000` (draft posts show in dev). SVGs render
client-side, so give the galleries a beat after load.

### What's LEFT / worth doing

**1. (Decision needed from me) Pick the final logo direction.** The gallery has ~19 variants.
   No single one is chosen yet. Likely a **two-tier** outcome: a detailed mark as the HERO
   (welcome page / social card / this post) + a SIMPLER reduction for the 32px navbar/favicon
   (the full pyramid and fine volutes/flutes blur at 32px — the `mark:'triad'` reduction was the
   most legible small). Ask me which hero variant + which navbar reduction I want before finalizing.

**2. Finalize the chosen variant into real logo SVG file(s).** Export static
   `static/img/logo-binary.svg` (light, `#676767`) + `logo-binary_dark.svg` (white) from the
   generator. These are the real brand assets, so they should be COMMITTED static files (not
   runtime-generated), matching the existing `logo.svg`/`logo_dark.svg` pair.

**3. (GATED — do NOT do without my explicit go-ahead) Wire the new logo into the site.**
   When I approve: `docusaurus.config.js:662-663` navbar `src`/`srcDark` → the new files, and
   `src/pages/index.tsx:110` JSON-LD `logo` URL. Optionally regenerate favicons/PWA icons/social
   card (bigger "full brand replacement" scope — confirm with me first). The old `logo.svg`/
   `logo_dark.svg` must stay (favicon/social-card lineage still uses them).

**4. VISUAL PASS — confirm the logo actually looks good/professional in situ (REQUIRED before
   we call it done).** Wiring it in is not the same as it looking right. After step 3, run the
   site and LOOK at the rendered logo in real context, not just the SVG in isolation:
   - Run the site (`yarn start`, or a prod build + `yarn serve`) and view the **navbar** at
     normal zoom. Is the logo crisp at its real ~32px height? Legible? Balanced next to the
     "BytesOfPurpose" wordmark (size, vertical alignment, spacing)? Not muddy or too busy?
   - Check **both light AND dark mode** (toggle the theme) — confirm `srcDark` swaps correctly
     and contrast holds in each.
   - Check it on the **homepage**, the **welcome/chooser** page, and a **docs** page (the navbar
     is global, but framing differs).
   - Check **mobile** width (responsive / narrow viewport) — the navbar logo must still read.
   - Use the **`visual-site-review`** skill for a structured screenshot-driven pass; and/or the
     **`audit-desktop-experience`** + **`audit-mobile-experience`** skills (they drive
     chrome-devtools MCP against the prod build at :4173 and produce a prioritized report).
     Capture before/after navbar screenshots so I can compare the new logo vs the old.
   - Report findings to me (does it look professional? any alignment/size/legibility issues?) and
     fix the easy ones (logo viewBox padding, navbar height/scale tweaks) before we finalize.
   This visual pass is the real acceptance gate for the logo, not just "the SVG renders."

**5. Un-draft + publish the design post** when I'm happy with it (flip `draft: true` → remove it,
   then it deploys via the normal publish flow). Optional polish first: the pillar-backdrop
   colonnade currently CROPS the columns (`preserveAspectRatio="xMidYMid slice"`); I may want
   `meet` + a taller band so whole pillars protrude uncropped — ask me.

**6. Open design tweaks I might still ask for** (only if I bring them up): larger/fewer 0s per
   shaft chain; two-tone gold contrast; deeper gold on the light theme; reflections under the
   columns; encoding a real bit pattern (e.g. spelling something) in the shaft.

### Conventions to respect (from CLAUDE.md)
- **Never commit to master directly** — feature branch → PR → ask me to merge → squash.
- **No literal em-dash (`—`) in reader-facing content** — a blocking PostToolUse hook rejects it;
  use hyphens / "to" / parens. (The post is already clean.)
- Track non-trivial work as tasks (TaskCreate/TaskUpdate).
- The generated `_binary-pyramid-variants.js` stays gitignored; regenerate via the build, never hand-edit.

Sequence: pick direction (1) → export SVGs (2) → [my go-ahead] wire in (3) → VISUAL PASS in
situ (4, the acceptance gate) → un-draft/publish the post (5). Start by reading the design post +
the generator, then ask me which direction to finalize (item 1).
```

---

(End of handoff. The infra is done; the remaining work is a design decision from the user, then
export → gated wiring → a visual pass on the live site to confirm it looks professional → publish.)
