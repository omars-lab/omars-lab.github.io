---
name: import-co-design
description: Import a public co-design HLD (architecture/co-designs/public/CO-DESIGN-*-hld.md from the work repo) into the Bytes of Purpose Designs blog (/designs) as a build-clean .mdx post, and produce the /thoughts showcase post that summarizes the collection. Runs a deterministic, idempotent transformer that maps frontmatter, de-em-dashes the body (the em-dash voice hook BLOCKS — in designs/*.mdx), fixes MDX build-breakers, rewrites cross-doc links to /designs slugs, converts <a id> footnotes to GFM + labeled scope-notes to admonitions, and wraps the first mermaid diagram for the opt-in flow animation. Use when the user wants to publish a co-design as a design doc, refresh an imported one after the source changed, or stand up the showcase post. Pairs with author-blog-post (MDX pitfalls), publish-site (un-draft + deploy), manage-frontmatter-descriptions (the description field).
---

# Import a co-design HLD into the Designs blog

You author architecture HLDs ("co-designs") with Claude in a separate work repo
(`~/Workspace/work-git/docs/architecture/co-designs/public/CO-DESIGN-*-hld.md`). This skill
turns one (or all) of them into a **Designs-blog post** (`/designs/design-<name>`), and the
collection into a single **`/thoughts` showcase post** that says "here's what I co-designed,
check it out." It is a **repeatable, idempotent pipeline**: re-run it whenever a source HLD
changes and it UPDATEs the matching post in place (never duplicates).

The whole thing is one Node transformer + a Make target + proofs (unit + Playwright). The
transformer is the source of truth for the mechanics; this file explains the why and the flow.

## Philosophy: the co-design is the simple markdown; the blog design is the UPGRADE

Importing is a **transformation, not a copy**. The source co-design is terse, internal
markdown — written to think, for an audience that already has the context. The imported
blog design is the **upgrade**: it should be **pretty, easy for a general reader to follow
and understand, and paint the WHOLE picture** of the idea. Every mechanical step below
serves that goal:

- **Readable**: de-em-dashed, MDX-clean, with footnotes and admonitions that aid scanning.
- **Visual**: the architecture/flow diagrams come alive (marching dashes + a traveling
  flow-dot on flows), in on-brand colors that work light and dark.
- **Concrete**: a co-design is conceptual; a reader cannot picture the product from prose.
  So a design post should also show **what it would LOOK like** — UX **mockups** (the
  `<Mockup>` component) that frame a live HTML impression of the screens. These are
  hand-crafted (you cannot derive a UI from terse markdown) and live in a **sidecar** the
  importer preserves (see the mockups step below).

When deciding anything during an import, ask "does this make the design easier to follow and
more vividly painted for a newcomer?" — not just "is it a faithful copy?"

## Why this is not a copy-paste

The Designs blog is a Docusaurus `plugin-content-blog` instance (`designs/`, route `/designs`).
Pasting an HLD in breaks for four reasons, all handled by the transformer:

1. **The em-dash hook BLOCKS.** `.claude/hooks/em-dash-voice-hook.sh` rejects any `—` (U+2014)
   in `designs/*.mdx` — **including inside mermaid blocks and frontmatter**, with no code-fence
   exemption. The source HLDs have hundreds. Per-occurrence prompting is infeasible, so the
   transformer de-em-dashes in bulk (context-aware) and escapes mermaid-label dashes to the
   `&#8212;` entity (renders identically; the hook greps source bytes and never sees it).
2. **MDX is stricter than markdown.** Bare autolinks `<https://x>` and a stray `<` before a
   space/digit (`< 50ms`) parse as JSX and fail the build. The transformer rewrites autolinks
   to real markdown links and escapes stray `<` to `&lt;`.
3. **Cross-doc links** between co-designs (`./CO-DESIGN-…-hld.md`) must point at `/designs`
   slugs; links to a co-design we did NOT import are de-linked to plain text (no dangling link).
4. **Round-trip identity.** Re-importing must update the right file, so each post carries a
   `source:` provenance block and the transformer matches on `source.id`.

## What the transformer does

`.claude/skills/import-co-design/import-co-design.js`, given a source HLD:

1. **Frontmatter** → Designs shape: `slug: design-<kebab>`, `sidebar_position` (next free, or
   preserved on update), `title` (lead phrase, de-em-dashed), `description` (first exec-summary
   sentence, ~≤158 chars), `authors: [oeid]`, subject-derived `tags`, `draft: true`, and a
   `source:` provenance block `{repo, path, id, status, imported}`. Filename
   `YYYY-MM-DD-<kebab>.mdx` from the source `date`.
2. **Footnotes**: the source's `[[aN]](#aN)` references become GFM caret-style references, and
   its `<a id="aN"></a>**[aN]** …` definition lines become GFM caret-style definitions, so
   Docusaurus renders a real footnotes section. The Evidence component is NOT used (these are
   external URL citations), so the footnotes validator does not apply to them.
3. **Admonitions**: single-line labeled blockquotes (`> **Scope note:** …`, `Terminology`,
   `Legend`, `Phased rollout`, `Completeness check`, `Design implication`, `Note`, `Assumption`)
   → `:::note` / `:::info` / `:::tip` / `:::warning`. Plain and multi-line blockquotes are left
   alone (so a pull-quote is never mangled). Inline `**[Assumption: …]**` stays bold text — it
   can't become a block admonition mid-sentence.
4. **De-em-dash** (fence-aware): inside ```` ```code/mermaid ```` and inline `` `code` `` →
   `&#8212;`/`&#8211;` entities; prose → context rules: numeric range `60–70` → "60 to 70";
   aside pair `A — x — B` → "A, x, B"; sentence break ` — ` → period (before a capital) or
   semicolon; heading/decision-label dash (`## X — Y`, `**D1 — …**`, `D3 — …`) → colon.
5. **MDX-safety**: autolinks → markdown links (host/path as text); stray `<` → `&lt;`.
6. **Cross-doc links** → `/designs/<mapped-slug>`; non-imported co-designs de-linked.
7. **Strip diagram colors**: remove hardcoded `classDef`/`class`/`style fill:` directives
   inside mermaid blocks so the site's mermaid theme (light `base` + `dark`) controls color
   in BOTH modes (hardcoded fills override the theme and break dark mode).
8. **Animate** the FIRST mermaid block: wrap it in `<div className="mermaid-animated …">`.
   The marching-ants dashes (CSS) animate on every wrapped diagram; a **traveling flow-dot**
   (the `src/mermaid-flow-dot.js` client module) is added only to FLOW diagrams. The source
   declares flow-intent with a `%% animate: flow|none` directive in the mermaid block, which
   the importer maps to `.flow-dot` / `.no-flow-dot` on the wrapper (else the client's
   edge-label heuristic decides). Deterministic + idempotent. Full writeup:
   `docs/craft/blogging/diagramming/animated-diagrams`; the component catalog is the
   `upgrade-post` skill.
9. **Preserve UX mockups**: if the post's frontmatter carries `mockups: ./_mockups/<name>.mdx`,
   keep that field and inject `import Mockups … <Mockups />` after the truncate marker. The
   sidecar is a hand-authored, importable React component of `<Mockup>` blocks; the importer
   NEVER regenerates it, so the "what it looks like" mocks survive every re-import.
10. **Idempotent write**: if a Designs post already has a matching `source.id`, UPDATE that file
    (keeping its slug + `sidebar_position` + `mockups`); else CREATE `YYYY-MM-DD-<kebab>.mdx`.

Everything is `draft: true` on import. Publishing is a separate, deliberate step (`publish-site`).

## Run it (the repeatable pipeline)

```bash
# Import all public HLDs (skips *-research-* and any non-public), prove the transforms,
# and assert zero em-dash leak. Idempotent — safe to re-run after a source edits.
make import-co-designs                       # uses CODESIGN_SRC default
make import-co-designs CODESIGN_SRC=/path/to/co-designs/public   # override source dir

# Or invoke the transformer directly:
IMPORT_DATE=$(date +%Y-%m-%d) \
  node .claude/skills/import-co-design/import-co-design.js --all <co-designs/public/>
node .claude/skills/import-co-design/import-co-design.js <one.md> [more.md…]   # single(s)
node .claude/skills/import-co-design/import-co-design.js --dry-run <one.md>    # preview
```

The per-file summary reports: `pos`, em-dash `prose`/`fenced` counts, `links` rewritten/de-linked,
`footnotes`, `admonitions`, `animated`. `--all` builds the source-id→slug map so cross-doc links
resolve across the batch.

## Verify (always prove — repo tenet)

```bash
# 1) Unit proofs of every transform (fast, no server). make import-co-designs runs this.
( cd bytesofpurpose-blog && npx jest test/unit/import-co-design.test.ts )

# 2) No raw em-dash shipped (the blocking hook scans source bytes). make … runs this too.
grep -rln $'—' bytesofpurpose-blog/designs/*.mdx   # expect: nothing

# 3) Rendered proof — REAL browser (mermaid renders client-side; static HTML can't show it).
#    Drafts are served on the dev server (:3000). MUST clear the cache first (see gotcha).
( cd bytesofpurpose-blog && yarn docusaurus clear && yarn playwright test --project=dev co-design-imports )
```

The e2e spec (`test/e2e/co-design-imports.spec.ts`, in the `dev` + `prod` Playwright projects)
asserts each post 200s + has its H1, mermaid renders to SVG (no raw fence leak), no literal
em-dash in rendered prose, the `.mermaid-animated` wrapper is present, admonitions + GFM
footnotes render, and the storefront→site-scanner cross-link resolves. In `prod` it asserts the
drafts 404 (they're not published yet).

## The showcase /thoughts post

After importing, write/refresh one post at
`bytesofpurpose-blog/blog/YYYY-MM-DD-system-designs-co-designed-with-claude.md`
(slug `system-designs-co-designed-with-claude`, `authors: [oeid]`, `draft: true`): a short
first-person intro on co-designing HLDs with Claude → `<!-- truncate -->` → one paragraph per
design (the story + why) each linking to its `/designs/design-…` post → a closing note. It is a
plain post (NO `blog_trigger` — that convention is docs-only). De-em-dash it like any content.

## Enrichments (when finalizing a post)

The full component catalog + when/how/gotchas lives in the **`upgrade-post`** skill. For
co-design imports specifically:

- **Animated diagram** — automatic + re-import-safe: the importer wraps the first mermaid
  block in `.mermaid-animated` and stamps `.flow-dot`/`.no-flow-dot` from the source
  `%% animate:` directive. Nothing to do post-import; to change the flow-intent, edit the
  directive in the SOURCE HLD and re-import. (Marching dashes everywhere; traveling dot on
  flow diagrams.)
- **Mermaid colors** — automatic: hardcoded fills are stripped on import so the light/dark
  theme controls color. Don't re-add `classDef`/`style fill:`.
- **`<DiagramWithFootnotes>`** (numbered legend) — a MANUAL enrichment; a re-import would
  clobber it, so only add it to a FINALIZED post you won't re-import. See `upgrade-post` for
  the snippet.
- **UX mockups** (`<Mockup>`) — the "what it looks like" upgrade, and re-import-SAFE via the
  sidecar pattern: create `designs/_mockups/<name>.mdx` (a default-exported component of
  `<Mockup>` blocks), add `mockups: ./_mockups/<name>.mdx` to the post frontmatter, and the
  importer injects + preserves the import/render and never regenerates the sidecar. This is
  the recommended way to "paint the whole picture" of an imported design. Hand-craft one or
  two mockups of the key screens; keep the inner HTML simple + theme-token-styled.

## Publish

When a design is ready to go public, hand off to `publish-site`: it triages `draft:true`
readiness, flips the approved ones to `draft:false`, then runs `deploy-site`. Do not flip drafts
here.

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `MDX compilation failed … Unexpected character /` | A bare autolink `<https://…>` or stray `<` slipped through | Re-run the transformer (the `mdxSafeLine` pass handles it); if hand-edited, wrap URLs as `[text](url)` and escape `<` to `&lt;`. |
| `Cannot parse JSON: Unexpected end of JSON input` on build | **Stale `.docusaurus` cache** poisoned by a PRIOR failed MDX build (NOT a content bug) | `rm -rf bytesofpurpose-blog/node_modules/.cache bytesofpurpose-blog/.docusaurus` then rebuild. Always clear cache before the verification build. |
| Imported posts don't appear in `yarn build` output | They are `draft: true`; production EXCLUDES drafts | Expected. To compile-check them, temporarily flip to `draft:false`, clean-build, revert (the e2e dev project tests them as drafts on :3000 — preferred). |
| e2e draft tests fail with "404 in dev" / draft-less sidebar | Dev server reused a stale cache from a prior `yarn build` (prod artifacts exclude drafts) | `yarn docusaurus clear` before `playwright test --project=dev` (the `make test-e2e` target does this). |
| ALL e2e tests suddenly fail on `H1 toBeVisible` right after a `docusaurus clear` | A STALE dev server is still listening on :3000 from a prior run; Playwright's `reuseExistingServer` reuses it, but its cache was just wiped → it serves broken pages | Kill it first: `lsof -ti :3000 \| xargs kill -9`, then re-run (Playwright starts a fresh server). Clear the cache BEFORE the server starts, never under a running one. |
| em-dash hook BLOCKS your manual `Edit` to a designs post | A `—` is in the new text | The transformer leaves files em-dash-free; if hand-editing, use a comma/period/colon (see the de-em-dash rules) — never paste a raw `—`. |
| Re-import created a duplicate instead of updating | The existing post's `source.id` doesn't match the source `id` (e.g. it was hand-renamed) | Restore the `source.id` in the post's frontmatter to the source HLD's `id`, then re-run. |
| A scope-note didn't become an admonition | It's multi-line, unlabeled, or its label isn't in the map | Expected for plain/multi-line quotes. To add a label, extend `ADMONITION_LABELS` in the transformer. |

## Files

- `.claude/skills/import-co-design/import-co-design.js` — the transformer (exports pure functions for tests).
- `bytesofpurpose-blog/test/unit/import-co-design.test.ts` — 37 unit proofs.
- `bytesofpurpose-blog/test/e2e/co-design-imports.spec.ts` — rendered proofs (dev + prod projects).
- `bytesofpurpose-blog/src/components/DiagramWithFootnotes/` — the numbered-legend component.
- `bytesofpurpose-blog/src/css/custom.css` — the opt-in `.mermaid-animated` edge animation.
- `Makefile` → `import-co-designs` target.

## Learnings log (newest first)

- 2026-06-22 — Philosophy + mockups. Reframed the import as an UPGRADE (co-design = terse
  internal MD; blog design = pretty, follow-able, whole-picture). Added UX mockups via a new
  `<Mockup>` component (framed live HTML, theme-aware) and a re-import-safe SIDECAR pattern:
  mockups live in `designs/_mockups/<name>.mdx` (a default-exported component), linked from
  the post's `mockups:` frontmatter; the importer injects/preserves the import+render and
  never regenerates the sidecar. (Mockups can't be derived from terse markdown, so they're
  hand-crafted — the sidecar keeps them out of the regenerated body.)
- 2026-06-22 — Animation + theming pass. Added a traveling flow-dot (sequential, graph-walk
  ordered) layered on the marching dashes, gated to FLOW diagrams by CONTENT (a
  `%% animate: flow|none` source directive, else an edge-label-verb heuristic) — NOT graph
  shape; the heuristic misses flows whose verbs live in node names, so mark real flows
  explicitly. Switched mermaid to a per-mode theme (light `base` tuned to brand + `dark`) and
  the importer now STRIPS hardcoded `classDef`/`style fill:` (they overrode the theme and
  broke dark mode). The original animation CSS never fired because the selector didn't match
  Docusaurus's `.docusaurus-mermaid-container` + `path.flowchart-link` DOM — assert the
  animation actually moves, not just that a wrapper class exists. Reference-style link
  DEFINITIONS tripped validate-links as bare-url (fixed the validator).
- 2026-06-22 — First build. The em-dash hook (no fence exemption) forces bulk de-em-dash +
  `&#8212;` for mermaid labels. MDX breaks on bare `<url>` autolinks and `< ` even though the
  grep-based hazard scan missed them — the BUILD is the real check. A failed MDX compile
  POISONS `.docusaurus`, surfacing later as a misleading "Cannot parse JSON" — always clear the
  cache before the verification build. Mermaid renders client-side, so only Playwright can prove
  diagrams render (static HTML shows none).
