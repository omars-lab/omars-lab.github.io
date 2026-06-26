---
name: maintain-showcase
description: Maintain the component showcases under docs/legend/components/* — the site's reference for its embeddable abilities (a card, a diagram, a code embed, a YouTube/Figma embed). Each showcase is a `kind: showcase` 🎛️ doc that demonstrates ONE technique live and carries an auto-generated "used in" index of the published posts that actually leverage it. Use when adding a NEW showcase, when a showcase's "Used in" list looks wrong (empty when it shouldn't be, or noisy/over-matching), when adding a new reusable component that deserves a showcase, or when the detection pattern needs tuning. Owns the `usage_pattern` → `<UsedIn>` → generate-component-usage.js loop. Pairs with upgrade-post (the catalog of what each component is + when to use it), author-blog-post (frontmatter/MDX mechanics), and review-reader-experience (the IA the showcases live in).
---

# Maintain a component showcase

A **showcase** is one doc under `docs/legend/components/*` that demonstrates a single
structural ABILITY of the blog — a `<Card>`, a mermaid diagram, a code embed, a Figma/YouTube
embed — rendered live, so a reader (or future me) can see what it looks like and copy how to
embed it. The showcases together are the site's **component reference**, the `🎛️ Components`
section under Legend. This skill owns keeping them correct: the demonstration, the `kind`, and
above all the **"Used in" index** that links each technique to the posts that actually use it.

> **What lives where (don't duplicate):**
> - **`upgrade-post`** is the agent-facing CATALOG: what each component is, when to reach for
>   it, the exact MDX snippet, the gotchas. Reach there to decide WHICH component.
> - **`author-blog-post`** owns frontmatter + the MDX build-breakers.
> - **THIS skill** owns the showcase docs themselves: the `kind: showcase` contract, the live
>   demonstration, and the drift-proof `usage_pattern` → `<UsedIn>` "used in" machinery.

## The anatomy of a showcase doc

Every showcase under `docs/legend/components/*` is a `kind: showcase` doc with:

1. **An absolute `slug:`** under `/components/*` (e.g. `/components/structural/card`). Instance-
   relative under the `legend` instance; a move pairs with a `{from,to}` redirect like any page.
2. **`kind: showcase`** — drives the `🎛️` sidebar emoji (from `blog-kinds.json`) and the
   per-kind outline check (`validate-post-outline.js`: a showcase must contain a live
   demonstration — the component rendered in the body, OR a code/usage example, OR an
   image/iframe/link-list).
3. **A live demonstration** — the component actually rendered (e.g. an `<Card>` block), or a
   fenced code example showing how to embed it. This is the whole point; a showcase with only
   prose warns.
4. **A `usage_pattern:`** in frontmatter — the literal substring(s) a REAL use of this technique
   leaves in a post body (see below). This is how the "used in" index finds usages.
5. **A `<UsedIn slug="…"/>`** at the end — renders the generated "used in" list.

## The "used in" index — how it works (drift-proof by construction)

The index is **generated from the corpus, never hand-maintained** — the same model as the
kanban/changelog/todos data. The loop:

```
showcase frontmatter `usage_pattern`  →  generate-component-usage.js scans every published
post/doc body for that substring  →  src/components/UsedIn/component-usage.json  →  <UsedIn>
reads it and renders the list
```

- **Generator:** `bytesofpurpose-blog/scripts/generate-component-usage.js`. Wired into
  `npm run generate-assets` (so it runs on every `prestart`/`prebuild`). Scans the docs
  instances (`craft`, `journey`, `legend`) + the blog instances (`blog`/initiatives, `designs`,
  `thoughts`, `mindset`, `questions`).
- **Output:** `src/components/UsedIn/component-usage.json`, shape
  `{ "<showcase-slug>": [ {title, permalink} ] }`. **Gitignored + regenerated** — NEVER hand-edit
  it (the `block-generated-edits` PreToolUse hook refuses writes to it; edit the showcase's
  `usage_pattern` instead).
- **Component:** `src/components/UsedIn/index.tsx`, registered in `src/theme/MDXComponents.tsx`.
  `<UsedIn slug="/components/structural/card" />` renders the list, or a quiet "Not used in a
  published post yet." line when the list is empty (so a fresh showcase reads honestly, not
  broken).
- **Self-exclusion + draft-safety:** the showcase docs are excluded from the scan (a showcase
  never lists itself), and `draft: true` pages are excluded (so a card never links to a page
  that 404s in prod).

## Choosing a good `usage_pattern` — the one judgment call

The pattern is a **literal substring** (not a regex). A post matches if ANY listed pattern is
present in its body. The art is picking a marker that is **distinctive** — it catches genuine
use and avoids noise. Heuristics, in order of preference:

1. **A component tag is ideal** — `<Card`, `<Timeline`, `<TOCInline`, `<Gist `, `<FancyButton`,
   `<GraphRenderer`, `<Highlight`. Unambiguous: the tag IS the usage.
2. **A fenced-block language tag** for code/diagram techniques — `` ```mermaid ``,
   `` ```py title= ``. Tighten when two showcases would otherwise claim the same posts (see the
   overlap rule below).
3. **A URL/host fingerprint** for external embeds — `embed.figma.com`, `youtube.com/embed`,
   `docs.google.com/drawings`, `nbviewer`. Robust because the embed URL is the usage.
4. **A frontmatter/markup marker** for structural techniques — `<!-- truncate -->`,
   `sidebar_label:`, `:::tip`, `<details>`.

**Avoid OVER-broad patterns.** A bare `.png` or `](` matches almost everything; prefer the
tightest marker that still catches real use. If a technique is inherently common (internal
links, plain code blocks), accept a longer list OR scope it (`](/initiatives/` for intra-site
links) and know the list will be large but accurate.

**The overlap rule — two showcases must not claim the same posts for the same reason.** When two
showcases cover related techniques (e.g. "Mermaid" and "Flow Charts", both mermaid; "Mermaid"
and "Sequence Diagrams"), make the more-specific one match a SUBSET marker, not the shared one:

| Showcase | Pattern | Why |
|---|---|---|
| `diagrams-mermaid` | `` ```mermaid `` | the catch-all: any mermaid diagram |
| `diagrams-flow-charts` | `flowchart `, `graph TD`, `graph LR`, `graph TB` | only flowchart-type mermaid (a subset) |
| `diagrams-puml-sequence` | `plantuml`, `.puml` | only real PlantUML, NOT mermaid's `sequenceDiagram` keyword |

The subset showcase ends up a near-subset of the catch-all in the counts — that's correct and
expected, not a bug.

**An empty list is a valid, honest answer.** If a component genuinely isn't used in any
published post yet (Card, FancyButton, Graph, Highlight, TOCInline, Timeline are common cases),
the showcase shows "Not used in a published post yet." Do NOT loosen the pattern to manufacture
hits — that's worse than an honest empty line.

## Playbook A — add a NEW showcase

1. **Decide it's a showcase.** It demonstrates one embeddable ability of the blog. Home it under
   the right `docs/legend/components/<group>/` (`structural` / `diagrams` / `code` / `external`).
   New group → add a `_category_.json` and a README landing.
2. **Write the doc:** absolute `slug:` under `/components/*`, `kind: showcase`, a `description:`,
   and a **live demonstration** (render the component AND/OR a code example — not prose alone, or
   the outline check warns).
3. **Add `usage_pattern:`** to the frontmatter (see "Choosing a good pattern"). Check the overlap
   rule against sibling showcases.
4. **Append `<UsedIn slug="<this doc's slug>" />`** at the end.
5. **Regenerate + verify:** `npm run generate-component-usage` (or `make generate-assets`), then
   confirm the count is sensible: `node -e "const d=require('./src/components/UsedIn/component-usage.json'); console.log(d['<slug>'])"`.
6. **If the move/rename touched URLs**, add the `{from,to}` redirect and let `validate-redirects`
   pass.
7. **Build** (`yarn build`) to prove `<UsedIn>` renders. Commit → PR → ask to merge.

## Playbook B — the "Used in" list looks WRONG

| Symptom | Likely cause | Fix |
|---|---|---|
| Empty, but you KNOW posts use it | pattern too narrow, or the marker isn't what posts actually write | grep the corpus for what real usages contain (`grep -rl '<thing' blog designs thoughts mindset questions docs`), set `usage_pattern` to that |
| Huge / noisy list | pattern too broad (matches incidental text) | tighten to a component tag / URL fingerprint; or scope it (e.g. `](/initiatives/` not `](`) |
| Two showcases list identical posts | shared marker | apply the **overlap rule** — give the specific showcase a subset marker |
| A draft post appears | (shouldn't — generator excludes drafts) | confirm the post's `draft: true`; if it's published it's a legit hit |
| The showcase lists ITSELF | (shouldn't — generator self-excludes) | confirm the file is under `docs/legend/components/` |

After any pattern change: **regenerate** (`npm run generate-component-usage`) and re-check the
count. The JSON is gitignored, so the change you COMMIT is the `usage_pattern` edit, not the JSON.

## Guardrails (the repo tenets, applied here)

- **Never hand-edit `component-usage.json`** — it's generated; edit the `usage_pattern` source and
  regenerate. The `block-generated-edits` hook enforces this.
- **Prove it.** A pattern change isn't done until you've regenerated and shown the new count is
  sensible (the prove-don't-assert tenet). A new showcase isn't done until `yarn build` renders it.
- **Move, don't delete.** Retiring a showcase = move/redirect its content, not drop it.
- **No literal em-dashes** in the showcase prose (the blocking em-dash hook).
- **Track the work as a task**, and a showcase that renders content gets the visual + mobile pass
  (the new-interactive-component convention) before its commit lands.

## Files this skill owns

| File | Role |
|---|---|
| `docs/legend/components/**` | the showcase docs (source: `slug`, `kind: showcase`, `usage_pattern`, demonstration, `<UsedIn>`) |
| `scripts/generate-component-usage.js` | the generator (scans corpus → JSON) |
| `src/components/UsedIn/{index.tsx,styles.module.css}` | the `<UsedIn>` component |
| `src/components/UsedIn/component-usage.json` | generated output (gitignored; never hand-edit) |
| `scripts/lib/blog-kinds.json` | defines `kind: showcase` 🎛️ |
| `scripts/validate-post-outline.js` | the `demonstrates` check for showcases |
