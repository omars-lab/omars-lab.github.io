---
name: manage-kinds
description: Add, rename, or retire a blog post KIND — the controlled vocabulary in blog-kinds.json that drives every post's sidebar emoji + outline contract. Owns the add-a-kind LOCKSTEP (the ~5 places that must move together: the registry JSON, the outline CHECKS test, the reader legend, the collection legend if flagged, and the authoring guidance). Use when the user says "add a new kind", "add a post type", "rename/retire the X kind", "we need a kind for Y", or when validate-kinds-guidance / validate-post-outline flags kind drift. Mirrors manage-hubs (system-owning skill + fail-closed guard). Pairs with author-post (the authoring guidance that consumes kinds), organize-post (which classifies a post into a kind), and suggest-emoji (the sidebar-emoji convention kinds mirror).
---

# Manage kinds (the post-KIND taxonomy)

A **kind** is the TYPE of a blog post (not its topic): `idea` 💡, `question-set` ❓, `system-design`
🏗️, `project` 🔨, … Every post declares one, and the kind drives two mechanical things — the
**sidebar emoji** (auto-derived, never hand-typed) and the **outline contract** (the structural
elements a post of that kind should contain). This skill owns the taxonomy so it never drifts across
its consumers.

## The single source of truth

**`bytesofpurpose-blog/scripts/lib/blog-kinds.json`** is the ONE registry. Each entry:

```json
"idea": {
  "emoji": "💡",
  "description": "An unactioned idea: something I might build or do, captured before I've acted on it. …",
  "thought": true,                       // a collection flag (at most one): thought / mindset / question / docKind
  "thoughtGloss": "Something I might build or do",
  "outline": [
    {"id": "description", "label": "a non-empty `description:` frontmatter (…)"}
  ]
}
```

- **`emoji`** — the sidebar emoji (one, no skin-tone variants that break width).
- **`description`** — one sentence: what this kind IS + which home/collection it lives in.
- **A collection flag** (optional, at most ONE): `thought: true` (a `/thoughts` post), `mindset:
  true` (`/mindset`), `question: true` (`/questions`), `docKind: true` (a `/craft` doc, not a blog
  post). A flagged kind also carries its `*Gloss` one-liner. No flag → a plain blog post.
- **`outline`** — the structural elements the post should contain, each `{id, label}`. The `id` maps
  to a TEST in `validate-post-outline.js`'s `CHECKS`; the `label` is the human contract text. Reuse
  an existing `id` (e.g. `description`, `sections`, `mockup`, `decisions`) when the check already
  exists — only a genuinely new structural requirement needs a new `id` + a new test.

## Who consumes it (do NOT hand-maintain a parallel copy anywhere)

`validate-post-outline.js` (outline + legend-drift), `validate-post-naming.js`,
`validate-docs-structure.js`, the `draft-docs` plugin (sidebar emoji), and the
`ThoughtKind`/`KanbanBoard`/`DocSidebarItem` components all READ the JSON. The authoring skill
(`author-post`) points at it as the source of truth. So the JSON is the only place the vocabulary
lives; everything else derives.

## Add a NEW kind — the lockstep

Do ALL of these in the SAME change (the order that fails fastest first):

1. **Add the entry to `blog-kinds.json`** — `emoji`, `description`, the collection flag +
   `*Gloss` if it belongs to a collection, and its `outline`.
2. **If the outline introduces a NEW `id`,** add a matching test to the `CHECKS` registry in
   `scripts/validate-post-outline.js` (the JSON owns WHAT each kind requires; the test owns HOW to
   detect it). Reusing an existing `id` needs no code change. (The validator prints a lockstep
   warning if an `id` has no test.)
3. **Add a row to the reader "Start Here" legend** — the legend page the `legend-drift` check reads
   (`docs/handbook/README.mdx`; the `LEGEND_POST` in `validate-post-outline.js`). `legend-drift`
   FAILS the outline check until the legend's emoji table matches the JSON, so this is enforced.
4. **If the kind is `thought`/`mindset`/`question`-flagged,** add it to the matching collection
   legend too (`/thoughts/about-my-thoughts` `<ThoughtKindLegend>`, `/mindset/about-my-mindset`
   `<MindsetKindLegend>`, `/questions/about-my-questions`), so the reader legend by-collection stays
   complete.
5. **Authoring guidance:** the kind is covered by its home guide + the JSON outline automatically.
   Add a dedicated **`author-post/kinds/<name>.md`** checklist ONLY if the kind has real authoring
   specifics beyond its home's shared shape (like `kinds/idea.md` does for the Ideas board). Most
   kinds do not need one. Do NOT re-list the kind in a table in `mechanics.md` — it points at the
   JSON on purpose.

Then verify: `make validate-post-outline` (outline + legend-drift green) and
`make validate-kinds-guidance` (the authoring guidance is in lockstep).

## Rename or retire a kind

- **Rename:** change the key in `blog-kinds.json`, update every post's `kind:` frontmatter (grep
  `kind: <old>` across `blog/ thoughts/ mindset/ questions/ designs/ docs/`), rename any
  `author-post/kinds/<old>.md` → `<new>.md`, and update the legend rows + any `CHECKS` id names.
  `validate-kinds-guidance` flags an orphaned `kinds/<old>.md`; `validate-post-outline` flags posts
  whose `kind:` is now `unknown-kind`.
- **Retire:** only when no post uses it (grep first). Remove the JSON entry, the legend row, any
  `kinds/<name>.md`, and its `CHECKS` id if unused elsewhere. Leaving a `kinds/<name>.md` behind is
  an ERROR the guard catches.

## The guards (fail-closed)

- **`validate-post-outline.js`** (`make validate-post-outline` + the `Write|Edit` hook) — the DATA
  side: `missing-kind`, `unknown-kind`, per-kind outline, and **`legend-drift`** (the reader legend
  vs the JSON). It prints the full legend inline on a finding.
- **`validate-kinds-guidance.js`** (`make validate-kinds-guidance` + the
  `validate-kinds-guidance-hook.sh` warn hook) — the GUIDANCE side: a `kinds/<name>.md` for a kind
  not in the JSON (**orphan-kind-file**, ERROR), the missing SOURCE-OF-TRUTH pointer in
  `mechanics.md` (**missing-sot**, ERROR), a stale `kind:` reference in the guidance
  (**stale-kind-ref**, warn), and uncovered kinds (informational).

Between them, the DATA (JSON ↔ validators ↔ reader legend) and the GUIDANCE (JSON ↔ author-post
skill) both stay drift-free.

## Relationship to the other skills

- **`author-post`** — the authoring skill that CONSUMES kinds (`mechanics.md` documents the kind
  system pointing at the JSON; `kinds/*.md` are the per-kind checklists). This skill owns the
  vocabulary; `author-post` owns how to WRITE each kind.
- **`organize-post`** — classifies a post INTO a kind (durable vs temporal → which kind). It reads
  the vocabulary; this skill defines it.
- **`suggest-emoji`** — the docs-folder sidebar-emoji convention (`emoji-map.json`) that the kind
  emoji system mirrors. Separate registry, same idea.
- **`manage-hubs`** — the sibling system-owning skill for the durable-hub registry; the model this
  skill mirrors (a system owner + a fail-closed drift guard).
