# Plan: Binary-Pyramid Logo SVG + Navbar Wiring

## Context

The user wants a new brand logo built as an SVG: a **binary pyramid**. A central `1`
reads as a **Greek pillar**; flanking it on each side are `0`s, then `1`s, then `0`s…
**mirrored outward from the center** (center = `1`, then `0,1,0,1…` each direction).
Each column is a **vertical stack of its digit**; the `0`-stacks are packed tighter so
the column reads as a slender pillar (a "0-built 1"). Columns get **shorter and the
glyphs smaller as they move away from center**, and all columns share a baseline — so
the whole mark forms a **pyramid** of 1s and 0s.

A working prototype already proves the geometry (rendered during planning: central
serifed `1` pillar, flanking `0`/`1` stacks tapering to a clean pyramid). This plan
**refines** that prototype into polished light + dark SVGs and **wires them into the
navbar** (and the homepage JSON-LD logo URL). Scope is deliberately limited — favicons,
PWA icons, and the social card are **out of scope** (per user).

### Decisions locked with the user
- Alternation: **mirror from center**, center=`1`, outward `0,1,0,1…`.
- Column build: **digits stacked vertically**; `0`-stacks tighter than `1`-stacks.
- Glyphs **shrink with distance** from center → pyramid silhouette on a shared baseline.
- Color: light = `#676767` (matches existing `logo.svg`); dark = `#fff` (matches
  `logo_dark.svg`).
- Scope: **new SVG(s) + wire into navbar**, not a full brand regen.
- Design step: **refine and show 2–3 variants** as rendered PNGs before sign-off.

### Key constraint discovered
The navbar logo renders at **~32px tall** beside the "BytesOfPurpose" title
(`docusaurus.config.js:654-661`). A 6-ring pyramid (~104×103 in the prototype, wider
with more rings) shrinks to near-illegibility at that size. So the shipped logo must be
**roughly square / not-too-wide** (target viewBox aspect ≈ 1:1, ≤ ~140 wide) and stay
legible at 32px. Variants will be tuned for this: fewer rings (3–4 per side), bolder
strokes, tighter taper.

## Files

### New assets (the only "logo" files created)
- `bytesofpurpose-blog/static/img/logo-binary.svg` — light, `fill="#676767"`.
- `bytesofpurpose-blog/static/img/logo-binary_dark.svg` — dark, `fill="#fff"`.
  (Naming mirrors the existing `logo.svg` / `logo_dark.svg` pair.)

### Wiring (3 reference edits) — GATED on explicit manual approval
**Do NOT make these edits until the user explicitly approves wiring.** The design work
(SVGs) ships first; wiring is a separate, opt-in step. When approved:
- `bytesofpurpose-blog/docusaurus.config.js:659` — `src: 'img/logo.svg'`
  → `src: 'img/logo-binary.svg'`.
- `bytesofpurpose-blog/docusaurus.config.js:660` — `srcDark: 'img/logo_dark.svg'`
  → `srcDark: 'img/logo-binary_dark.svg'`.
- `bytesofpurpose-blog/src/pages/index.tsx:109` — JSON-LD Organization `logo`
  (`${url}/img/logo.svg`) → `${url}/img/logo-binary.svg`, so structured-data logo
  matches the visible brand.

### Untouched (explicitly out of scope)
`favicon.ico`, `favicon-16/32.png`, `apple-touch-icon.png`,
`android-chrome-192/512.png`, `site.webmanifest`, `social-card.svg/png`. The OG image
(`docusaurus.config.js:819`) still points at the existing `social-card.png`. The old
`logo.svg` / `logo_dark.svg` are left in place (no longer navbar-referenced, but still
used by favicons/social-card derivation, so they must NOT be deleted).

## Approach

### 1. Generator script (build artifact, not committed to the site)
Refine the prototype generator (currently `/tmp/genlogo.js`) — a small Node script that
computes the geometry and emits the SVG. Parameters to expose for variant tuning:
- `RINGS` (columns per side; try **3 and 4** for navbar legibility vs. the 6 of the draft),
- `CENTER_COUNT` (glyphs in the center column) and the taper to `MIN_COUNT`,
- per-ring glyph `scale` falloff,
- horizontal column spacing,
- `0`-stack vertical compression factor.
The script is a local tool under `/tmp` (or `bytesofpurpose-blog/scripts/` only if the
user later wants it reproducible/committed — default: keep it in `/tmp`, commit only the
resulting SVGs, matching how `logo.svg`/`social-card.svg` are hand-authored static files).

### 2. Glyph refinement (the "pillar" feel)
- **`1` glyph** → Greek column: a shaft with a **capital** (top serif slab) and a
  **base** (bottom serif slab); optionally subtle **fluting** (1–2 thin vertical lines)
  on the center pillar only, since fluting is invisible on the small outer glyphs.
- **`0` glyph** → a vertically-elongated **ring** (ellipse with `fill-rule:evenodd`
  donut hole), stacked tight so a column of them reads as a fluted pillar of beads.
- Even stroke weights so the mark holds at 32px (avoid hairlines that vanish).

### 3. Produce 2–3 variants, render, and get a pick
Render each variant with `rsvg-convert` (confirmed installed) at both **large (≈600px)**
and **navbar-size (≈32px tall)** so the user judges legibility at real size. Candidate
axes for the 2–3 variants:
- **A — Compact (3 rings/side):** square-ish, boldest, best at 32px.
- **B — Classic (4 rings/side):** the draft's fuller pyramid, slightly wider.
- **C — Center-pillar emphasis:** A/B but with fluting + stronger capital/base on the
  central `1` so the "Greek pillar" reads even when small.
Present rendered PNGs via the file-send tool; user picks one (and light/dark are the
same geometry recolored).

### 4. Finalize SVGs
- Hand-clean the chosen SVG: tidy `viewBox` (square-ish, e.g. `0 0 128 128`-class),
  a `<title>` for a11y, single `<g fill="…">` wrapper to match `logo.svg`'s structure.
- Emit the `_dark.svg` twin with `fill="#fff"`.
- **Avoid the em-dash content hook**: the BLOCKING `em-dash-voice-hook.sh` fires on
  `Write|Edit`. Use a plain hyphen / "to" in any `<title>`/comment text (no literal `—`)
  so the write isn't blocked.

### 5. Wire into navbar + JSON-LD — ONLY after explicit approval
**Pause here.** Deliver the finalized SVGs and the render previews first, then wait for
the user to explicitly say to wire it in. Only then make the 3 edits above. Light/dark
switching is automatic via Docusaurus `navbar.logo.src` / `srcDark`.

## Verification
1. **Static render check:** `rsvg-convert -w 600` and a `-h 32` render of the final
   light SVG, plus the dark SVG on a dark background, to confirm legibility at navbar
   size and correct donut holes / pillar serifs.
2. **Build + serve:** from repo root run the dev server (or prod build) and load the
   site; confirm the new logo shows in the navbar in **both** light and dark mode
   (toggle theme) next to "BytesOfPurpose", with no broken-image. (Use chrome-devtools
   MCP screenshot at the navbar, light + dark.)
3. **JSON-LD check:** view homepage source / built `index.html` and confirm the
   Organization `logo` URL now ends `/img/logo-binary.svg`.
4. **No-regression on out-of-scope assets:** confirm favicon and OG/social-card meta
   still resolve to their unchanged files (the old `logo.svg`/`logo_dark.svg` and
   `social-card.png` remain present and referenced where they were).
5. Per repo convention, this is a non-trivial change → land it on the current feature
   branch via commit + PR (not direct to `master`), and ask before merging.

## Out of scope / follow-ups (not doing now)
- Regenerating favicons / PWA icons / `social-card.*` from the new mark (would be the
  "full brand replacement" path; can be a later PR).
- Deleting the old `logo.svg` / `logo_dark.svg` (still consumed by favicon/social-card
  lineage; leave them).
