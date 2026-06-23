---
name: author-mermaid
description: Author a mermaid diagram of the right KIND with correct, verified syntax for embedding in a Bytes of Purpose blog/design post — flowchart, sequence, ER, state, class, gitGraph, mindmap, timeline, and the newer mermaid 11 types (architecture-beta, kanban, quadrantChart, C4). Per-type skeletons + when-to-use each + the site gotchas (do NOT hardcode classDef/style colors — the light/dark theme colors them; the .mermaid-animated wrapper + the flow-dot for flow diagrams; the em-dash hook flags U+2014 inside labels; 4-backtick nesting when showing a mermaid block INSIDE an mdx code block). Use when asked to "make a diagram / kanban board / quadrant chart / git graph / architecture diagram / use-case diagram" for a post, or when a diagram won't parse. Pairs with the diagramming docs (docs/craft/blogging/diagramming), upgrade-post, and import-co-design.
---

# Author a mermaid diagram

Pick the right diagram TYPE for what you're showing, use the correct syntax (the newer
types are easy to get subtly wrong), and follow the site's coloring/animation conventions.
This repo runs **mermaid 11.15** — all types below are verified to render here.

## Pick the type

| You want to show… | Use | Notes |
|---|---|---|
| A data/activity FLOW (A→B→C, pipelines, request/response) | `flowchart` / `graph` | the workhorse; pairs with the flow-dot animation |
| A time-ordered interaction between actors/systems | `sequenceDiagram` | who-calls-whom over time |
| Data entities + relationships | `erDiagram` | tables/fields + cardinality |
| Object/type structure | `classDiagram` | classes, fields, methods, inheritance |
| Lifecycle / status machine | `stateDiagram-v2` | states + transitions |
| System/infra topology (groups of services) | `architecture-beta` | cloud/db/server icons, grouped |
| A work board (columns + cards) | `kanban` | To Do / Doing / Done with card metadata |
| 2×2 prioritization (effort vs value, etc.) | `quadrantChart` | plotted points in 4 quadrants |
| Git branching/merging story | `gitGraph` | commits, branches, merges |
| Idea tree / brainstorm | `mindmap` | radial hierarchy |
| Dated milestones | `timeline` | chronological events |
| **Use-case diagram (UML)** | NOT native — see below | map to flowchart or C4 |

**"Use-case diagram" is not a native mermaid type.** Map it: for actors-and-use-cases, a
`flowchart LR` with actor nodes on the left pointing at use-case nodes (or stadium shapes)
reads as a use-case diagram; for system-context boundaries, use `C4Context`.

## Verified skeletons (mermaid 11)

### flowchart (the default; flow-dot-friendly)
```
flowchart LR
  A[Discover] --> B[Scan] --> C[Score] --> D[Draft]
```

### architecture-beta (system/infra topology)
Declaration `architecture-beta`; `group id(icon)[Title]`; `service id(icon)[Title] in group`;
edges `id:DIR --> DIR:id` where DIR is `T|B|L|R`. Built-in icons: `cloud database disk internet server`.
```
architecture-beta
  group api(cloud)[API]
  service db(database)[Database] in api
  service server(server)[Server] in api
  db:R --> L:server
```

### kanban (work board)
`kanban`; a column is `columnId[Title]`; cards are INDENTED under it as `cardId[Text]`;
optional metadata `@{ assigned: …, ticket: …, priority: Very High|High|Low|Very Low }`.
```
kanban
  todo[To Do]
    t1[Write docs]@{ assigned: Alice, priority: High }
  doing[In Progress]
    t2[Review code]@{ ticket: PROJ-123 }
  done[Done]
    t3[Deploy]
```

### quadrantChart (2×2 prioritization)
`x-axis L --> R`, `y-axis bottom --> top`; quadrants: `quadrant-1`=top-right, `-2`=top-left,
`-3`=bottom-left, `-4`=bottom-right; points `Label: [x, y]` with x,y in 0–1.
```
quadrantChart
  title Effort vs Value
  x-axis Low Effort --> High Effort
  y-axis Low Value --> High Value
  quadrant-1 Major Projects
  quadrant-2 Quick Wins
  quadrant-3 Fill-ins
  quadrant-4 Thankless
  Feature A: [0.3, 0.8]
  Feature B: [0.7, 0.4]
```

### gitGraph (branching story)
`gitGraph LR:` (or `TB:`); `commit id: "…" tag: "…" type: NORMAL|REVERSE|HIGHLIGHT`;
`branch name`; `checkout name`; `merge name`; `cherry-pick id: "…"`.
```
gitGraph LR:
  commit id: "init"
  branch feature
  commit id: "work"
  checkout main
  merge feature tag: "v1"
```

### sequenceDiagram
```
sequenceDiagram
  actor U as User
  participant S as Server
  U->>S: request
  S-->>U: response
```

### stateDiagram-v2
```
stateDiagram-v2
  [*] --> Draft
  Draft --> Review
  Review --> Shipped
  Shipped --> [*]
```

(For `erDiagram`, `classDiagram`, `mindmap`, `timeline`, `C4Context` use the standard
mermaid-11 syntax; if unsure, probe-verify per the workflow below before shipping.)

## Site conventions (IMPORTANT — these differ from vanilla mermaid)

1. **Do NOT hardcode colors.** No `classDef`/`style X fill:…,stroke:…` color directives.
   The site mermaid theme (light `base` tuned to the brand + `dark`) colors diagrams in BOTH
   modes; hardcoded fills override it and break dark mode. (The `import-co-design` importer
   strips these automatically; author new diagrams without them.)
2. **Flow animation is opt-in.** To animate a FLOW diagram (marching dashes + a traveling
   dot), wrap it: `<div className="mermaid-animated flow-dot">` … ```` ```mermaid ```` … `</div>`.
   See the `author-walkthrough` / `upgrade-post` skills and the
   `docs/craft/blogging/diagramming/animated-diagrams` doc. Don't animate context/relationship
   diagrams (the dot looks random).
3. **Em-dash hook applies inside labels.** A literal `—` (U+2014) ANYWHERE in a
   `designs/*.mdx` (including mermaid node labels) BLOCKS the edit. In a label, use the entity
   `&#8212;` (renders as an em-dash, the hook can't see it) or rephrase. En-dash `–` and hyphen
   `-` are fine.
4. **Nesting in docs.** When you show a ```` ```mermaid ```` block INSIDE an `mdx` code fence
   (i.e. documenting it), the OUTER fence needs **4 backticks** (` ```` `), or the inner triple
   fence closes it early and breaks the MDX build.
5. **Labels with `{braces}` / `<…>`** in prose around a diagram are MDX hazards (not inside the
   fence). See `author-blog-post`.

## Verify (mermaid renders client-side — a build is not enough)

A diagram that compiles can still fail to PARSE in the browser (no SVG, a red error box),
especially the beta types. Prove it renders:

1. Put the diagram in a `draft: true` page.
2. `( cd bytesofpurpose-blog && yarn docusaurus clear && yarn start )` and open the page on
   `:3000`, OR run a quick Playwright check: the diagram's `.docusaurus-mermaid-container`
   must contain an `<svg>`, and there must be NO "Syntax error"/"Parse error" text and no
   mermaid console error. (This is exactly how these skeletons were verified.)

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Red "Syntax error in text" box where the diagram should be | a typo the build can't catch (beta types are strict) | re-check against the skeleton above; probe-verify in the browser. |
| `architecture-beta` edge does nothing / errors | wrong edge syntax | it's `id:DIR --> DIR:id` (e.g. `db:R --> L:server`), not `id --> id`. |
| `kanban` cards not under their column | indentation | cards must be INDENTED under the column line. |
| `quadrantChart` points off-chart | coords out of range | x,y are 0–1 floats. |
| Diagram is the wrong colors / unreadable in dark mode | hardcoded `classDef`/`style fill:` | remove them; let the theme color it. |
| Edit blocked: em-dash in a node label | literal `—` in the label | use `&#8212;` or rephrase. |
| The mermaid example in my DOC broke the page | 3-backtick nesting | wrap the example in a 4-backtick `mdx` fence. |

## Files / references

- `docs/craft/blogging/diagramming/` — the reader-facing diagramming docs (diagrams-as-text,
  animated-diagrams, plantuml, icons).
- Official syntax (verify newer types here): mermaid.js docs for architecture, kanban,
  quadrantChart, gitgraph.
- Theme config: `bytesofpurpose-blog/docusaurus.config.js` (themeConfig.mermaid).

## Learnings log (newest first)

- 2026-06-23 — Created. Verified architecture-beta / kanban / quadrantChart / gitGraph all
  render in this repo's mermaid 11.15 (probe page → 4 SVGs, no errors). quadrant points
  inherit the brand terracotta from the theme. "Use-case diagram" is not native mermaid →
  map to flowchart-with-actors or C4. The site's no-hardcoded-colors rule + the em-dash-in-
  labels rule are the two gotchas that bite most.
