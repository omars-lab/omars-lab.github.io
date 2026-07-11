---
name: import-reconstruction
description: Turn an Islamic-geometric-pattern reconstruction built with the bikar/qiyas CLIs into a draft Designs blog post (a first-person design log). Covers the two-CLI loop (bikar renders a .igp DSL recipe to SVG; qiyas reads the SVG back and reports symmetry/shapes), the "no letters" constraint that holds by construction (bikar has no text primitive), committing the rendered SVG variants as SOURCE (NOT gitignored — bikar is a private CLI absent at build), embedding via SvgVariantGrid, citing private source repos with the Evidence privacy rule (clickable permalink only in dev or for public repos), turning qiyas's honest findings into the narrative, and proving it with a rerunnable Playwright spec. Use when the user reconstructs a pattern/logo with bikar+qiyas and wants it written up as a /designs post. Distinct from import-co-design (which transforms an existing HLD markdown doc); this CREATES the artifact from CLI runs. Pairs with author-post (MDX pitfalls), upgrade-post (richer components), review-reader-experience (the em-dash tell).
---

# Import a bikar/qiyas reconstruction as a Designs post

You reconstruct Islamic geometric patterns (and logo marks) by writing a recipe in the
**bikar** DSL, rendering it to SVG, then asking **qiyas** what it sees. This skill turns one
such reconstruction into a **draft Designs post** (`/designs/design-<name>`) written as a
first-person **design log**: the idea, the constraint, the recipe, the iterations that
failed, and what the second CLI honestly reported back.

It is **not** the same as `import-co-design`. That skill *transforms* an existing HLD
markdown doc into a post with a deterministic Node transformer. This skill **creates** the
artifact: there is no source markdown — the source is an image plus a sequence of CLI runs,
and the writing IS the work. Reach for `import-co-design` when you have a `CO-DESIGN-*-hld.md`
to publish; reach for THIS when you have a `.igp` recipe and a qiyas report.

Reference implementation (the first run of this skill): the rosette-of-zeros post —
`bytesofpurpose-blog/designs/2026-06-09-rosette-of-zeros.mdx`, recipe
`designs/_rosette-zeros/rosette-zeros.igp`, variants `designs/_rosette-zeros-variants.js`,
proof `test/e2e/reconstruction-posts.spec.ts`.

## The two CLIs (the round trip)

The sibling source repos live at `~/Workspace/git/{bikar,qiyas,sacred-patterns}` (NOT under
this repo). They are **private** except sacred-patterns.

- **bikar** — DSL renderer. A recipe is a `blueprint NAME` block (the construction: circles,
  `divide … into N`, arcs, faces, `rotate N around <pt>`) plus a `pattern NAME on NAME` block
  (styling: `circles color #HEX width N`, `fill void where …`). `bikar render in.igp -o out.svg`
  emits SVG with `data-*` attributes (the DSL is the source of truth). Also `parse` and
  `validate`.
- **qiyas** ("measurement") — semantic reader. `qiyas encode out.svg --verbose` reports every
  shape + the dominant rotational fold + confidence. `qiyas zone-audit` decomposes the figure
  into concentric zones. `qiyas validate ref recon` diffs two drawings. It reads bikar's
  `data-symmetry-fold` as authoritative on the SVG fast-path.

The post's spine is this loop: **bikar draws → qiyas checks → you adjust the recipe.**

## The "no letters" constraint holds BY CONSTRUCTION

bikar has **no text primitive** — there is no token that emits an SVG `<text>` element. So any
"no letters / no glyphs in the SVG" requirement is satisfied automatically: a "0" must be a
*drawn ring* (a `circle`), a digit can only be geometry. Do not present this as a rule you
imposed; it is baked into the tool. **Always verify it in the rendered output**, not just
claim it: `grep -c '<text' out.svg` must be `0`, and the Playwright spec asserts
`article.locator('svg text')` has count 0 in the hydrated DOM.

## bikar gotchas that ARE the iteration log (don't hide them)

The honest struggle is the post's best content. The ones hit so far:

- **`rotate N` does NOT replicate a bare construction `circle`.** `rotate` replicates *drawn
  edges* (segments, arcs, filled faces). A `circle` is scaffolding — points hang on it, it is
  not copied. A `circle` inside `rotate 8` yields the original + rotated nothing = 2 circles,
  not 8.
- **A full-circle arc (start point == end point) draws nothing** — the sweep direction is
  ambiguous. Split into two half-arcs (as bikar's own rosette fixtures do).
- **A lone open arc is not a fillable face.** `fill` only fills closed regions.
- **The escape hatch:** a `circle` on its own already renders as a ring outline. A circle *is*
  a zero. The rosette recipe became eight explicit `circle Z0..Z7 center(C0.cptK)` on the eight
  division points of a ninth circle — no `rotate` at all. Trade-off: only `rotate` stamps
  `data-symmetry-fold`, so without it qiyas must infer the fold from geometry (it did: fold=8).

Capture each failed attempt + what qiyas saw as a numbered iteration table. That table is the
reason to build it this way instead of by hand.

## qiyas's honest findings ARE the narrative

qiyas will recover some things and miss others. Write down BOTH — the misses are more
interesting than the hits:

- It recovered fold=8 (confidence 0.94) with no hint — the round trip closed.
- Its **rosette detector did not fire**: it labeled all shapes plain `circle`s, because that
  detector wants a ring of *petals* (polygon/star-ish), not a ring of circles. "It can measure
  the symmetry exactly and still have no word for the shape" — that gap is the theme.
- Comparing the image **to itself** scored symmetry 1.00 but overall match 0.73, reporting a
  **45° rotation** (one eighth of a turn). A perfectly 8-fold figure looks identical to itself
  rotated one seat, so the matcher "aligns" to a rotated twin. Perfect symmetry → orientation
  ambiguity, shown as a number.

Run the full pass: `encode` + `zone-audit` (+ `validate` if comparing to a target). Save the
zone-audit visualization to `static/img/<name>-qiyas-zones.png` and embed it.

## Variants ship as SOURCE — do NOT gitignore them

This is the load-bearing difference from the binary-pyramid post. `_binary-pyramid-variants.js`
is **gitignored** because `generate-logo-variants-data.js` regenerates it at `prebuild` from an
in-repo JS geometry source (`src/lib/binary-pyramid-logo.js`). A reconstruction has **no in-repo
source to regenerate from** — the SVG strings are raw output of the **private bikar CLI**, which
is absent on a fresh checkout and in the gh-pages CI build. So:

- **Commit `designs/_<name>-variants.js` as source.** If it is gitignored, `yarn build` breaks
  the moment anyone builds without bikar installed (i.e. CI). Checking it in is what keeps the
  build green anywhere. (Verified: the rosette prod build is `[SUCCESS]` with no bikar present.)
- **Gitignore only the scratch working dir** (`designs/_<name>/`), but **keep the final recipe**
  for reproducibility. Pattern in `bytesofpurpose-blog/.gitignore`:
  ```
  designs/_<name>/*
  !designs/_<name>/<name>.igp
  ```

The variants module is a plain `export const VARIANTS = [{id,label,group,svg}, …]` where `svg`
is the raw bikar `<svg>…</svg>` string. Hand-generate it from the renders (one entry per
variant you want to show); group entries so `SvgVariantGrid` can filter (`group="final"`,
`group="iters"`).

## The post shape (first-person design log)

Frontmatter mirrors the other Designs posts (`draft: true` always — publishing is the user's
content-review call via `publish-site`):

```
---
slug: design-<name>
sidebar_position: <next free>
title: <human title, no em-dash>
description: 'A design log: <one sentence>.'   # feeds og:description + ShareButton
authors: [oeid]
tags: [design, geometry, cli, dsl, ...]
kind: system-design   # a build/architecture write-up that paints the whole picture; drives the 🏗️ sidebar emoji + validate-post-outline checks (see author-post). Without it, the post trips a `missing-kind` advisory.
draft: true
---

import SvgVariantGrid from '@site/src/components/SvgVariantGrid';
import {VARIANTS} from './_<name>-variants.js';
```

Recommended sections (the rosette post is the template):
1. **The idea** — one move, in plain language; link any prior related design post.
2. **The constraint** — no letters; bikar literally can't draw text → pure geometry.
3. **The two tools** — one line each: bikar draws from a recipe, qiyas reads it back.
4. **The recipe + the iterations** — show the `.igp` in a fenced code block; a numbered
   iteration table of what you changed and what happened (include the failures).
5. **What qiyas saw** — `encode` verdict (fold, confidence), the detector miss, the
   self-rotation ambiguity; embed the zone-audit PNG.
6. **What the CLIs made easy / honest** — close on the round-trip theme.

Embed renders right after the intro and inside the iterations:
```
<SvgVariantGrid variants={VARIANTS} group="final" previewHeights={[40]} />
<SvgVariantGrid variants={VARIANTS} group="iters" previewHeights={[40]} />
```

## Honor the Write hooks (these BLOCK or warn on save)

- **em-dash hook BLOCKS.** No literal `—` (U+2014) anywhere in `designs/*.mdx`. Write with
  commas, colons, periods, parens. (See `review-reader-experience` → "the em-dash tell".)
- **MDX build-breakers:** bare `<br>`, unescaped `{braces}`, a stray `<` before a space/digit.
  See `author-post`.
- **validate-docs-structure / validate-links / validate-draft** run warn-tier on save.
- **validate-footnotes** (only if you add Evidence footnotes — see below).

## Citing the private source repos: the Evidence privacy rule

If you cite a line range in bikar/qiyas/sacred-patterns to justify a claim, use the
**Evidence** footnote component (`src/components/Evidence`) — never a raw GitHub link.
In a GFM footnote definition, place an `Evidence` element with these attributes (shown
here with the angle brackets spelled out so this doc itself doesn't trip the footnote
validator — write real angle brackets in an actual post):

```
import Evidence from '@site/src/components/Evidence';
...a claim.[^x]

[^x]: (Evidence) repo="bikar" sha="<pinned-sha>" path="<path>" lines="46-52"
  note="what these lines justify"
```

The required attributes are `repo`, `sha`, `path`, `note` (`lines` optional).

**The rule (load-bearing):** a clickable permalink renders ONLY in dev/localhost OR for a
**public** repo (per `src/data/evidence-repos.json`). In the prod build a **private** repo
degrades to prose-only — no href, no 404, no leaked path/SHA. qiyas and bikar are private
(owner `NaqshCoffee`); sacred-patterns is public (owner `omars-lab`). The offline validator
`scripts/validate-footnotes.js` + the PostToolUse hook check the SHA is real and pushed, the
path exists at that SHA, and the line range is in bounds — so a footnote can't ship a broken
or unpushed permalink. The rosette post happens to use NO Evidence footnotes; the image→DSL
post (`blog/2026-06-07-recreating-an-image-as-dsl.md`) is the worked example.

## Prove it with a rerunnable Playwright spec

Verification is a **rerunnable spec**, not a manual browser pass. Add/extend
`test/e2e/reconstruction-posts.spec.ts` (registered in `playwright.config.ts` under both the
`dev` and `prod` projects). Assert, against the live dev server (:3000, which serves drafts):

- the page is 200 and `SvgVariantGrid` renders ≥1 inline `<svg>` per group;
- **zero `<text>`** elements in any rendered SVG (the constraint, in the DOM);
- the iteration table, the recipe code block, and the qiyas zone PNG all render (image decodes:
  `naturalWidth > 0` — scroll into view + `expect.poll`, Docusaurus lazy-loads images);
- if you used Evidence: the permalinks are clickable in dev.

And against a prod build (:4173): the draft 404s, and (defensive) no private
`github.com/NaqshCoffee/<repo>/blob/` href ships if the post is ever published. Run:
`npx playwright test --project=dev reconstruction-posts`.

> Gotcha when authoring the spec: a literal `*/` inside a JSDoc block comment (e.g. a path
> glob like `NaqshCoffee/<repo>/blob/*`) prematurely closes the comment and breaks parsing.
> Rephrase to avoid `*/` in prose.

## Build gate

Before handing off: `( cd bytesofpurpose-blog && yarn build )` → `[SUCCESS]`. This is the real
gate — it proves the committed variants import resolves with **no bikar present** (the whole
reason to commit them as source) and that the draft is correctly excluded from prod.

## Ship

Draft only — never un-draft here. Commit the post + variants + final recipe + qiyas PNG + spec
on a feature branch (per the repo's commit→PR→ask-to-merge convention; `import-reconstruction`
work and other workstreams get independent branches/PRs). Publishing is the user's call via
`publish-site`. To make the post richer (animated diagrams, admonitions, carousels), see
`upgrade-post`.
