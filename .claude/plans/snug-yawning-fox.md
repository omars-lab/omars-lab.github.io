# Improving our blog, influenced by earlbear-blog + the frontend-design lens

## Context

The `earlbear-blog` (`/Users/omareid/Workspace/git-earlbear/earlbear-blog`, an Astro
site) has independently evolved a set of ideas worth incorporating into our
Docusaurus blog. Four parallel research passes over its commits, components, skills,
and hooks — cross-checked against an inventory of what we already have — surface a
**targeted** set of gaps (not a wholesale import; our governance culture, design
system, and content-type component set are already richer in most dimensions).

The three things earlbear does that we genuinely lack:

1. **A prop-driven, build-time diagram kit with legibility gates.** We render diagrams
   by hand-authoring raw mermaid (23 posts/docs do this; only 1 uses our animated
   wrapper). Earlbear authors diagrams as *data* (`nodes`/`edges` arrays) through
   zero-dependency components that generate inline SVG at build and **fail the build**
   on a tangled layout or a dangling id. We have no `FlowDiagram`, `UseCaseDiagram`,
   `ComparisonMatrix`, or `Accordion`.
2. **"A picture is worth a thousand words" as governance.** An advisory hook nudges
   when a section is a wall of text with no visual; a frontmatter contract declares the
   visuals a post owes and checks the body delivers.
3. **Editorial + rationale discipline** we don't have: a required **`questions` this
   post answers** field (dovetails with our "frame each task around the MAIN QUESTION"
   convention), a **used-but-not-imported MDX check** (catches the exact bug our
   draft-exclusion build hides), and **feature "why"-docs with content-hash drift
   auto-heal** (the crown-jewel governance idea).

**Decisions locked with the user:** full diagram kit including `UseCaseDiagram`; adopt
all four governance/editorial ideas; deliver as a **phased plan of independent PRs**
(per our commit → PR → ask-to-merge → squash convention). Each phase below is its own
branch/PR and can merge independently.

**The frontend-design lens (applied throughout):** the diagram kit is not a generic
Mermaid reskin — it is our *signature*. Every component derives its palette, type, and
motion from `src/css/custom.css` tokens (no raw hex, per `implement-with-design-system`),
so a flow/loop/use-case reads unmistakably as *our* blog. Boldness spent in one place:
the **build-time legibility gate** (a diagram that can't be read cleanly does not ship)
is the distinctive move; everything around it stays quiet and token-disciplined.

---

## Guiding constraints (repo conventions this plan honors)

- **Components live in `@omars-lab/blog-ui`** (`packages/blog-ui/`), the reusable-component
  package (tsup ESM+dts+bundled CSS, `file:`-linked, registered in
  `src/theme/MDXComponents.tsx`). Follow the `modify-blog-ui-component` skill: edit
  source under `packages/blog-ui/src/components/`, `make build-blog-ui` to rebuild+RELINK
  (mind the Yarn-1 stale-dist cache gotcha), register in `MDXComponents.tsx`.
- **Design system is the source of truth.** All color/type/motion via `custom.css`
  tokens; no raw hex; pastels are accent fills only; all motion respects
  `prefers-reduced-motion`. Enforced by `validate-ds-tokens` + `check-contrast`.
- **No em-dash in reader-facing content** (blocking hook). Applies to any legend/label
  text the components render. Our voice **keeps emoji** (opposite of earlbear's
  no-emoji rule) — do not port their emoji ban.
- **Governance pattern we already use** (and these additions follow): a `scripts/validate-*.js`
  with a `--file`-scoped mode + a full-sweep mode, wired as a warn-tier PostToolUse
  `Write|Edit` hook, with a blocking `make` gate. New hooks register in `.claude/settings.json`.
- **Generated assets** are gitignored + rebuilt by `generate-assets` and blocked from
  hand-editing; any new generated data (e.g. a diagram catalog JSON) follows that model.
- **Every new interactive component gets a visual + mobile pass** (375px + desktop)
  before its commit lands (operating convention).

---

## Phase 1 — `FlowDiagram` (the proof + the workhorse) · PR #1

**Goal.** A prop-driven directed-flow component in `blog-ui` that renders inline SVG at
build time in five shapes — `pipeline` (A→B→C), `loop` (nodes on an ellipse, last→first
closes), `sequence` (vertical), `branch` (fan-out for forks/decisions), `swimlane`
(labeled owner bands) — with **shape auto-inference** (back-edge → loop; out-degree ≥2 →
branch) and a **build-time overlap gate** that throws (not warns) on a tangled layout or
a dangling edge id, with an `allowOverlap` escape hatch.

**Why it's the right first port.** Highest leverage (covers the majority of our 23
hand-mermaid diagrams), and the layout math + gate functions are **pure TypeScript** that
port from earlbear's `FlowDiagram.astro` unchanged. It proves the whole pattern on our
React/Docusaurus stack before the expensive `UseCaseDiagram`.

**Approach.**
- New component `packages/blog-ui/src/components/FlowDiagram/` (`.tsx` + a CSS module or
  bundled CSS). Port the pure-TS layout functions (branch longest-path levelling,
  swimlane forward-edge ranking + compression, `rimPoint` edge geometry, the
  segment-crossing overlap test) into a `layout.ts` helper — these are copy-with-attribution
  from the Astro source.
- **Astro→React translations** (all mechanical, documented in research):
  `set:html` → render SVG as JSX; the inline-script detail modal → React `useState` +
  a `<dialog>`/portal (simpler in React); `style={`--i:${i}`}` → `style={{'--i': i}}`;
  the id `salt` (title slug) still namespaces gradient/marker ids so multiple diagrams
  per page don't collide.
- **Theming from our tokens:** define an 8-color data palette + surface/ink tokens in
  `custom.css` (analogous to earlbear's `--eb-data-1..8`), draw-in edge animation via
  `stroke-dasharray/dashoffset` gated behind `prefers-reduced-motion`. Node kinds
  (`default`/`store`/`external`/`edge`) tint/mark boxes; optional `legend` prop renders a
  key for the kinds actually used.
- **The gate decision (conscious choice):** a thrown error fails `docusaurus build`
  during SSG (same as Astro). Keep it a hard throw for `make build`, but message it
  actionably (name the crossing edges / the dangling id) so an author can fix or set
  `allowOverlap`.
- Register in `MDXComponents.tsx`; add an `upgrade-post` catalog entry (WHAT/WHEN/HOW/gotchas).

**Prove it (the `new-diagram-kind` discipline).** Convert **one real** hand-mermaid post
to `<FlowDiagram>` as the proof it makes an actual post clearer; screenshot desktop +
375px; confirm the gate fires on a deliberately-bad spec. Do not ship a bench page.

**Files:** `packages/blog-ui/src/components/FlowDiagram/*` (new),
`packages/blog-ui/src/index.ts` (export), `src/theme/MDXComponents.tsx` (register),
`src/css/custom.css` (data palette + draw-in keyframes),
`.claude/skills/upgrade-post/SKILL.md` (catalog entry), one converted post.

---

## Phase 2 — `ComparisonMatrix` + `Accordion` (the decision-post kit) · PR #2

**Goal.** Two near-trivial ports that together serve decision/option posts.
- **`ComparisonMatrix`** — a semantic `<table>` (proper `<th scope>`), options as columns
  / criteria as rows, the `chosen` column highlighted + badged, ratings `yes|no|partial`
  → glyph marks (● ○ ◐) with sr-only labels, scrolls in its own `overflow-x:auto` wrapper
  on mobile. Build-time gate: every cell key must reference a real option id or throw.
- **`Accordion`** — native `<details>/<summary>` (zero JS, keyboard-accessible free),
  optional `verdict` pill ("chosen"/"rejected") so folded options stay scannable.

**Note on overlap with what we have.** Our `OptionGrid`/`OptionTile`/`DecisionNote`
(design-system specimens, used in 2 handbook files) show *explored design directions* with
a chosen ring + WHY. `ComparisonMatrix` is the complementary **criteria×options table** for
head-to-head decision posts — different job, keep both. The `upgrade-post` catalog entry
should say when to reach for which.

**Approach.** Near 1:1 JSX ports (research rated both TRIVIAL). Token-styled; `body`
content passed as React children (drop earlbear's raw-HTML-string `set:html`). Register +
catalog + prove each on a real decision post (a 375px + desktop pass; a matrix that
overflows must scroll, not squish).

**Files:** `packages/blog-ui/src/components/{ComparisonMatrix,Accordion}/*` (new),
package export, `MDXComponents.tsx`, `custom.css` (matrix/mark styles),
`upgrade-post/SKILL.md`.

---

## Phase 3 — `UseCaseDiagram` (the ambitious one) · PR #3

**Goal.** A spec-honoring UML use-case diagram: actors outside a system-boundary rectangle,
use cases as ovals inside, solid association lines, dashed `«include»`/`«extend»` arrows,
with a **two-sided actor layout** (internal/system left, external right so lines fan to the
nearest edge), **barycenter crossing reduction** (order rows by average input-order of the
actors touching them), and **two blocking gates**: the ≥75%-crossing-free overlap gate and
a unique **actor line-angle balance gate** (each actor's up/down line split within one, and
its average line more horizontal than vertical).

**Why it's phase 3.** Most sophisticated layout in the kit (research: MEDIUM port). Two
extra Astro-isms beyond Phase 1: the actor-glyph function (rewrite to return **JSX**, not
`set:html` strings) and the branded-monogram file read (`readFileSync` of an SVG) → inline
our own actor glyphs as JSX (a person / a gear / our mark) rather than reading from disk.
Mermaid has no real use-case support, so this is a capability we simply don't have any way
to author today.

**Approach.** Port `actors.ts` glyph math (gear = ring + computed teeth; person = head +
shoulders arc, all `currentColor`) as JSX-returning functions. Port the side-pull +
barycenter placement and both gates from `UseCaseDiagram.astro`. Click-to-focus modal via
React state (surfaces computed "Used by / Includes / Extends"). Register + catalog + prove
on a real post (our audience/actors map well to an "who uses X" post). Visual + mobile pass.

**Files:** `packages/blog-ui/src/components/UseCaseDiagram/*` (new, incl. `actors.tsx`,
`layout.ts`), package export, `MDXComponents.tsx`, `custom.css`, `upgrade-post/SKILL.md`.

**Optional (defer unless wanted):** the ~130-line extended-Mermaid flowchart parser
(`mermaid-parse.ts`, TRIVIAL port, pure TS) that lets authors write `flowchart LR` syntax
that renders through `FlowDiagram`. Earlbear ships it but **no post uses it** — low ROI for
us given our authors already write mermaid; note as a future option, don't build now.

---

## Phase 4 — Visual-density + visual-expectations governance · PR #4

**Goal.** Make "wall of text with no visual" a *deliberate* choice, and let a post declare
the visuals it owes.

- **`scripts/validate-visual-density.js`** (+ `validate-visual-density-hook.sh`, warn-tier
  PostToolUse `Write|Edit`; blocking `make validate-visual-density`). Port earlbear's
  `check-visual-density.py` logic: split on H2; count **prose words only** (toggle out
  fenced code, skip lines starting `<`/`|`/`import`); flag a section with `> ~280` words
  and **no visual** (our `VISUAL_RE`: the new `FlowDiagram|UseCaseDiagram|ComparisonMatrix|
  Accordion` + existing `DiagramWithFootnotes|Mockup|Walkthrough|Gif|SlideDeck|Timeline|
  Carousel|SvgVariantGrid|Graph`, plus `<img>/<svg>/<table>`, markdown table rows, and a
  code fence as a legit break). Advisory, names the section, never blocks.
- **Visual-expectations via our existing `blog-kinds.json` outline contract** (do NOT add a
  parallel `expects` field — we already have the seam). Extend `validate-post-outline.js`'s
  per-kind `CHECKS`/`outline` so a kind can require a **visual element** satisfied by the new
  components (e.g. a decision/comparison kind → `<ComparisonMatrix>` or `<Accordion>`; a
  flow/architecture element → `<FlowDiagram>` or `<DiagramWithFootnotes>` or a mermaid fence).
  This reuses machinery that already exists and stays warn-tier, matching earlbear's intent
  ("a comparison post never ships as a wall of prose") without new frontmatter.

**Files:** `scripts/validate-visual-density.js` (new), `.claude/hooks/validate-visual-density-hook.sh`
(new), `.claude/settings.json` (wire), `Makefile` (target), `scripts/validate-post-outline.js`
+ `scripts/lib/blog-kinds.json` (extend visual elements for relevant kinds).

---

## Phase 5 — `questions` frontmatter field + rendered box · PR #5

**Goal.** Every substantive post declares the reader-questions it answers (from "the request
that prompted it"), rendered as a "Questions this post answers" box at the top, validated to
be non-empty and each item ending in `?`.

**Why it fits us specifically.** This is the frontmatter mirror of our existing operating
convention "frame each task around the MAIN QUESTION." The task list already reads as
questions-in-flight; this makes the *published post* carry the same framing for the reader.

**Approach.**
- Add optional `questions: string[]` to the blog/docs frontmatter (start **optional +
  advisory**, unlike earlbear's required, to avoid retrofitting the whole corpus at once;
  a follow-up can tighten to required-for-new-posts once seeded).
- Render via a small `<PostQuestions>` treatment (a token-styled aside, accessible landmark)
  — either a blog-ui component surfaced through a swizzle/wrapper, or (simplest) a
  `DocItem`/`BlogPostItem` swizzle that reads the field. Confirm the exact render seam during
  implementation (Docusaurus swizzle vs. an MDX component authors drop in; prefer the
  automatic swizzle so it can't be forgotten).
- **`scripts/validate-questions.js`** (+ warn hook + `make` gate): if `questions` present,
  each must be non-empty and end in `?`. Wire the `author-blog-post` / `name-post` skills to
  suggest the field from the driving task's MAIN QUESTION.

**Files:** frontmatter schema / swizzled item (`src/theme/...`), a `<PostQuestions>` style,
`scripts/validate-questions.js` (new) + hook + Makefile, `custom.css` (box style),
`author-blog-post/SKILL.md` (mention the field).

---

## Phase 6 — Used-but-not-imported MDX check · PR #6

**Goal.** Catch the "used `<FlowDiagram>` but forgot to import it" bug **statically** — the
exact class our production build hides, because drafts are excluded from `docusaurus build`
so a broken draft passes every existing gate until it renders.

**Approach.** Port earlbear's `check-diagrams.py` reasoning to
`scripts/validate-mdx-imports.js`: for each `.mdx`, every Capitalized JSX tag used must have
a matching `import` **or** be a globally-registered `MDXComponents` component (our case is
subtler than earlbear's — most of our components are auto-injected via `MDXComponents.tsx`
and need NO import, so the check must load that registry as the allowlist and only flag tags
that are neither imported nor globally registered). Strip code fences + inline-code spans;
ignore lowercase tags; whitelist `Fragment`. **Blocking** (`make validate-mdx-imports`, exit
2) + a PostToolUse hook, since a missing import is a real render break, not taste.

**Files:** `scripts/validate-mdx-imports.js` (new, reads `MDXComponents.tsx` for the global
allowlist), `.claude/hooks/validate-mdx-imports-hook.sh` (new), `.claude/settings.json`,
`Makefile`.

---

## Phase 7 — Feature "why"-docs + content-hash drift auto-heal · PR #7 (heaviest)

**Goal.** Document **why** a component/feature exists, linked to the exact code that
implements it via content-hashed anchors; **auto-heal** when code moves (silently re-key),
**warn** on real in-place drift, and **never** auto-bless changed content (that requires a
human reconcile). This is the crown-jewel governance idea and the biggest build.

**Approach (port earlbear's `features_lib.py` model, pure Python + git — 100% portable).**
- `docs-internal/features/<id>.md` (or a repo-root `features/`): a `## Why` (durable prose)
  + a `## Code` section of GitHub-permalink anchors (`blob/<sha>/<path>#Lstart-Lend — label`).
- A cache `features/.anchors.json` keyed `path#Lstart-Lend` → `{block_hash, context_hash,
  feature, label}`. Hashing **normalizes** (strip trailing ws, collapse blank runs) so
  formatting edits don't trip; the ±3-line context hash disambiguates identical blocks.
- Drift classifier: `ok` (hash matches) / `moved` (found elsewhere by sliding-window hash
  match, unambiguous) / `drift` (same location, content changed) / `missing`. On `moved`,
  auto-heal: re-key the cache + rewrite the permalink in the doc — silently, no noise.
- **The invariant:** a hook may only re-key *unchanged* content; changed content needs the
  reconcile flow (re-read the `## Why`, re-pin). Full sweep exits non-zero on unreviewed
  drift → gate it in the deploy pre-flight.
- Retarget for us: `owner/repo` = `omars-lab/omars-lab.github.io`; `SCAN_IGNORE_DIRS` adds
  `build*`, `.docusaurus`, `node_modules`, `static/storybook`.
- Ship with a **`feature-docs` skill** (author/reconcile flow) + a `manage-feature-docs`
  entry in the skills map, and seed 3-5 real why-docs (e.g. the premium-gating architecture,
  the diagram-legibility gate, the audience-of-one hero) so it starts alive, not empty.

**Files:** `scripts/features_lib.py` + `features_check.py` (new, ported),
`.claude/hooks/check-feature-docs-hook.sh` (new), `.claude/settings.json`, `Makefile`,
`features/` dir + `README.md` + seed docs, `.claude/skills/feature-docs/SKILL.md` (new),
CLAUDE.md skills-map row + a `.gitignore` entry for `.anchors.json` if we treat it as cache.

---

## Sequencing & independence

- **1 → 2 → 3** are the diagram-kit build (each its own PR; 2 and 3 both depend on the
  Phase-1 token/data-palette groundwork, so land 1 first, then 2 and 3 can go in either order).
- **4** (visual-density/expectations) is best **after** the components exist, so its
  `VISUAL_RE` / outline elements can reference them (soft dependency on 1–3; can start once
  `FlowDiagram` lands).
- **5** (questions field), **6** (mdx-imports check), **7** (feature-docs) are **fully
  independent** of the diagram work and of each other — can be picked up in any order,
  parallel to the component phases.
- Recommended real-world order: **1, 6, 5** first (fast, high-value, low-risk), then **2, 3,
  4** (the rest of the kit + its governance), then **7** (the heavy governance build) last.

## Verification (per phase, end-to-end)

- **Components (1-3):** `make build-blog-ui` (rebuild+relink; watch the Yarn-1 stale-dist
  cache gotcha) → `make start`, open the converted proof post, confirm the diagram renders
  and the **gate fires** on a deliberately-bad spec (`make build` should fail loudly) →
  **visual + mobile pass** at 375px + desktop (tap targets, no horizontal overflow, matrix
  scrolls) → `make validate-ds-tokens` + `make check-contrast` clean → real-browser check
  per `verify-change`.
- **Governance (4-7):** run the new `make validate-*` on a **planted violation** and confirm
  it flags (exit non-zero / warn as designed) and passes clean on good input — the fail-closed
  "prove it bites" discipline. For feature-docs, move a documented code block and confirm
  the anchor **auto-heals** with no warning; change a block in place and confirm it **warns**.
- **Whole-site regression** before each merge: `make build` succeeds (SSG runs the gates),
  `make validate-links` / `validate-redirects` / `validate-seo` unaffected.

## Explicitly NOT doing (earlbear-specific, low ROI, or conflicts with us)

- Their **no-emoji / no-exclamation** voice rule (opposite of our deliberate emoji-in-kinds
  system).
- The **audience-split** dual internal/external build, **design-system vendoring** (`sync-design`),
  **gh-pages-branch deploy** mechanics, **manage-authors** collection — all earlbear infra
  workarounds we either don't need or already solve natively.
- The **concurrent-commit** multi-session git-safety model — valuable in principle, but we
  have our own commit → PR → squash convention; revisit only if we start running many
  concurrent sessions on one clone.
- The **extended-Mermaid parser** (Phase 3 note) — build only if authoring friction warrants.
- The **"$/% needs a citation footnote"** rule — genuinely good, but a separate editorial
  decision; note as a future option, out of scope here.
