# Plan — A rosette logo of "0"-rings via the bikar/qiyas CLIs, written up as a Designs post

## Context

The existing **Gold Ionic** binary-pyramid logo variant (`/designs/design-binary-pyramid-logo`)
draws each "0" as a **geometric oval ring** (an annulus), stacked into vertical chains inside the
column shafts. There is no font/glyph involved — `binary-pyramid-logo.js`'s `ellipse()` helper draws
the ring with two concentric ovals + `fill-rule="evenodd"`. The user wants to take that *column of 0s*
idea and turn it into a **radially symmetric rosette**: a chain of "0"-rings wrapped around a center,
generated through the **bikar** DSL and validated with **qiyas**, then captured as a new Designs blog
post that tracks the iterations and the learnings of using the CLIs.

**Hard constraint from the user: NO letters/text anywhere in the SVG.** This is satisfied *by
construction* — bikar has **no text primitive at all** (confirmed: no `Text` token in
`bikar/packages/core/src/dsl/tokens.ts`, no `<text>` emission in `svg-renderer.ts`). Every "0" is a
geometric ring (annulus), not a typed character. So "a chain of 0s" = "a ring of annuli," pure geometry.

**Intended outcome:** one reproducible `.igp` recipe that renders an N-fold rosette of ring-shaped
"0"s, a qiyas validation showing the detector *sees* an N-fold rosette, and a draft Designs post that
narrates the build + iterations in Omar's voice (the same honest field-journal tone as the image→DSL post).

## What the CLIs can actually do (grounded)

**bikar** (`bikar render|parse|validate <in.igp>`; entry `packages/cli/src/index.ts`):
- `rotate N around <pt>` + indented body = **the rosette primitive** (`evalRotate`,
  `packages/core/src/dsl/evaluator.ts:1832`). It replicates the body N times at 360/N°, tagging copies
  with `data-symmetry-fold="N"`.
- A ring/"0" is built as an **arc-bounded `face`** with two concentric arcs (outer circle arc + inner
  circle arc), per `ast.ts:745` (a face may have 2+ arcs). No annulus sugar — it's hand-authored arcs.
- `circle ... radius`, `divide ... into N`, `palette`, `fill void where ...`, `classify` are all real.
- `render --emit-truth <gt.json> --image <name.png> --width --height` emits the SVG **plus** a
  ground-truth JSON and stamps `data-*` (sides/face-class/symmetry-fold) on every face.

**qiyas** (`qiyas encode|diff|validate|zone-audit|score ...`; entry `qiyas.cli:main`):
- `encode <svg>` auto-uses the **SVG fast-path** and reads bikar's `data-symmetry-fold` as authoritative
  (`stages/svg_primitives.py`), so it won't fight us on the fold.
- It has a real **`rosette` detector** (`stages/detectors/rosette.py`) that infers N-fold from petals on
  a ring, and `zone-audit` for concentric-ring coverage.
- `qiyas validate ref recon` is the one-shot encode-both-and-diff with an HTML report.
- Caveat (honest): qiyas's shape enum has no first-class "ring/annulus" type — rings are seen via the
  rosette detector's petal-on-ring logic + `zone-audit` annulus bins, not as a "ring" shape. We validate
  **the rosette structure and the fold**, not "it counted 8 perfect annuli."
- Run locally via `make local.install` then `qiyas …` (native uv), or the prebuilt Docker image.

## Approach (recommended)

Three artifacts, built in order. Keep the bikar recipe + renders in a working dir under the blog repo
so the post can reference them; the recipe itself can also live in `bikar/recipes/` if we want it tracked
there (decision below).

### 1. Author the bikar recipe — `rosette-zeros.igp`
A single ring of N annulus-"0"s around the center, built with `rotate`:
```
pattern rosette_zeros
circle C0 center(0,0) radius 100      # the ring the 0s sit on
divide C0 into 8                      # 8 seats (fold = 8)
palette gold
  ring  = #E8C46A
  deep  = #B8860B
rotate 8 around C0.center
  circle Couter center(C0.cpt0) radius 26   # one "0": outer rim
  circle Cinner center(C0.cpt0) radius 16   # inner hole
  divide Couter into 1
  divide Cinner into 1
  face .zero
    arc Couter.cpt0 -> Couter.cpt0 on Couter   # outer ring
    arc Cinner.cpt0 -> Cinner.cpt0 on Cinner   # inner hole (reverse) -> annulus
fill void where class == zero color ring
```
Iterate on exact arc syntax against real bikar test fixtures (`face-statement.test.ts`,
`ch-patterns-snapshot.test.ts`) — the arc-pair-makes-a-ring detail is the part most likely to need 2–3
tries, and that struggle is exactly the iteration the post documents. Optionally add a second, inner ring
(different N) for a richer "chain of 0s" rosette, and a center "0".

Render:
```
node packages/cli/dist/index.js render rosette-zeros.igp \
  -o rosette-zeros.svg --emit-truth rosette-zeros.gt.json \
  --image rosette-zeros.png --width 512 --height 512
```

### 2. Validate with qiyas
```
qiyas encode rosette-zeros.svg -o rosette-zeros.encoding.json --verbose
# expect: dominant_fold=8, a rosette shape (or N petals on a ring)
qiyas validate <ref> rosette-zeros.svg --tier 2 --output-dir out/   # if comparing to a target
qiyas zone-audit rosette-zeros.svg rosette-zeros.svg --symmetry-fold 8 --out out/zone/
```
Capture the encoding JSON's `dominant_fold` + `rosette` block + the tier-2 HTML screenshot. These become
the "what the computer saw" evidence in the post. Record honestly where qiyas reads the ring as a
rosette-of-circles vs something fuzzier — that's a finding, not a failure.

### 3. New Designs blog post (draft)
`bytesofpurpose-blog/designs/2026-06-09-rosette-of-zeros.mdx` (date = today), matching the existing
designs frontmatter (slug/sidebar_position/title/description/authors/tags/draft:true). Structure:
1. The idea — take the Gold Ionic column's chain of 0-rings and bend it into a rosette; link the prior
   binary-pyramid design post.
2. The constraint — no glyphs: a "0" is an annulus, and bikar literally can't draw text, so this is pure
   compass-and-straightedge geometry. (Reinforces the house ethos.)
3. The two tools — bikar draws from a recipe, qiyas reads the drawing back and scores it (one-liners).
4. The recipe — show `rosette-zeros.igp`, explain `rotate N` as the rosette move and the two-arc `face`
   as the "0".
5. The iterations — the real 2–3 tries to get the annulus arcs right / the fold to read cleanly
   (tracked as a numbered iteration log, the same way the binary-pyramid post logs what worked / didn't).
6. What qiyas saw — the encoding's `dominant_fold=8` + rosette detection + the tier-2 report image; and
   the honest caveat about ring-vs-rosette detection.
7. Embed the result — render the final SVG into the page. Reuse the existing `SvgVariantGrid` (it takes
   raw `{id,label,svg}` objects and injects via `dangerouslySetInnerHTML`) by feeding it the bikar SVG
   string(s), OR a tiny inline `<img>`/SVG include. (Decision below — prefer reusing SvgVariantGrid so
   we don't add a component.)
8. Closing learnings — what the CLIs made easy/hard; tie back to the image→DSL post's "round-trip" theme.

The post goes through the same Write hooks (em-dash, links, footnotes, draft, structure). Honor them:
no literal em-dash in prose; if I cite bikar/qiyas source for a claim, use the Evidence footnote
component already built (private repos render a dev-only link, prose in prod), so the build stays green.

## Critical files
- **bikar recipe (new):** `rosette-zeros.igp` (working copy in blog repo; optionally tracked in
  `bikar/recipes/`). Reference syntax: `bikar/recipes/star8.igp`,
  `bikar/packages/core/tests/kernel/face-statement.test.ts`,
  `…/tests/canonical/ch-patterns-snapshot.test.ts` (the `rotate 10` rosette).
- **bikar CLI:** `bikar/packages/cli/dist/index.js` (already built).
- **qiyas CLI:** run via `qiyas/Makefile` (`make local.install`), `qiyas/src/qiyas/cli.py`.
- **new post (new):** `bytesofpurpose-blog/designs/2026-06-09-rosette-of-zeros.mdx`.
- **reuse:** `bytesofpurpose-blog/src/components/SvgVariantGrid/index.tsx` (embed SVG),
  `bytesofpurpose-blog/src/components/Evidence/index.tsx` (sourced-claim footnotes).
- **render artifacts (new, in blog repo working dir):** `rosette-zeros.svg/.png/.gt.json`,
  `out/` qiyas reports.

## Verification (end-to-end)
1. `node bikar/packages/cli/dist/index.js validate rosette-zeros.igp` → exit 0 (recipe parses).
2. `… render … --emit-truth …` → SVG produced; grep the SVG to **prove no `<text>` element exists**
   (the user's hard constraint) and that `data-symmetry-fold="8"` is present.
3. `qiyas encode rosette-zeros.svg --verbose` → `dominant_fold` = the chosen N and a rosette/petal-ring
   in the shapes; capture the JSON + tier-2 HTML.
4. Post: `make check` (MDX lint) + `( cd bytesofpurpose-blog && yarn build )` → `[SUCCESS]`; the em-dash
   and footnote hooks pass on save; the rendered `/designs/rosette-of-zeros` page shows the SVG.
5. Draft only — nothing deploys; Omar reviews and publishes.

## Decisions (confirmed with the user)
- **Rosette form: single 8-fold ring** of annulus-"0"s around a center via `rotate 8` (+ optional center
  "0"). Cleanest recipe; the iteration story is getting the two-arc annulus + clean fold, not multi-ring
  complexity.
- **qiyas depth: full pass** — `encode` (show `dominant_fold=8` + rosette) **plus** `validate` /
  `zone-audit` and the **tier-2 HTML "what the computer saw" report**; write up the honest caveats
  (ring-vs-rosette detection, no first-class annulus type).
- **Recipe home: blog repo only** — `rosette-zeros.igp` lives in a working dir inside the blog repo so the
  post is self-contained. No bikar-repo commit.
- **Embedding:** reuse `SvgVariantGrid` with the raw bikar SVG string (no new component) — confirm at build
  time it accepts a one-item variants array cleanly; fall back to a minimal inline SVG include if it fights.

## Remaining unknown (resolved during build, not blocking)
- The exact bikar arc syntax that makes two concentric arcs read as one annulus face is the part most
  likely to need 2–3 tries against the real fixtures. That struggle IS the post's iteration log — I'll
  capture each attempt + what qiyas saw, rather than hide it.
```
