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
| Idea tree / brainstorm | `mindmap`, or the **`<MindMap>` component** | radial hierarchy; use `<MindMap>` (see upgrade-post) when you want it THEMED to the site + CLICKABLE nodes, which mermaid's own mindmap cannot do |
| Dated milestones | `timeline` | chronological events |
| What a system TOUCHES at its boundary | `architecture-beta` (context) | hub-and-spoke; see Context diagram |
| **Use-case diagram (UML)** | `flowchart` (no native type) | actors + oval use cases; see recipe |
| **Fork in the road** (diverging future options) | `flowchart` | one foundation node fans out to N divergent paths; see recipe. For a North Star / vision section naming >1 direction |

**Three "boundary/relationship" diagrams that are easy to confuse — pick deliberately:**
- **Flow** (`flowchart`/`graph`): something MOVES through steps (A→B→C). Activity/data flow.
- **Context** (`architecture-beta`): what a system TOUCHES — its neighbors/stores/deps at the
  boundary. Hub-and-spoke, NOT a sequence. (See "Context diagram" below.)
- **Use-case** (`flowchart`, mapped): which ACTORS use which capabilities. Actors ↔ ovals.
  (See "Use-case diagram" below.)

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

#### Real provider icons (AWS / Azure / GCP / brand logos) — VERIFIED in this repo
The 5 built-ins are generic. For real icons, this repo registers the **iconify `logos`
pack** (200k+ brand icons) on mermaid, so you can use `logos:<name>` directly:
```
architecture-beta
  group cloud(logos:aws)[AWS]
  service api(logos:aws-api-gateway)[API Gateway] in cloud
  service fn(logos:aws-lambda)[Lambda] in cloud
  service db(logos:aws-aurora)[Aurora] in cloud
  api:R --> L:fn
  fn:R --> L:db
```
- **AWS:** `logos:aws`, `logos:aws-lambda`, `logos:aws-api-gateway`, `logos:aws-aurora`,
  `logos:aws-s3`, `logos:aws-dynamodb`, … (the `logos` set has the full `aws-*` catalog).
- **Azure:** `logos:microsoft-azure`, `logos:azure-icon`, plus service marks where present.
- **GCP:** `logos:google-cloud`, `logos:google-cloud-functions`, …
- **Generic/local stacks:** `logos:nodejs-icon`, `logos:git-icon`, `logos:chrome`,
  `logos:claude`, `logos:markdown`, `logos:docker-icon`, `logos:postgresql`, etc.
- Browse names at icones.js.org (the **`logos`** collection). If an icon name is wrong it
  silently shows nothing — verify in the browser.

HOW it's wired (so a new repo can replicate): `src/mermaid-icons.js` (a clientModule
registered in `docusaurus.config.js`) imports the `mermaid` singleton and calls
`mermaid.registerIconPacks([{name:'logos', loader:()=>import('@iconify-json/logos').then(m=>m.icons)}])`
before any diagram renders. The pack is a devDependency (`@iconify-json/logos`). To add
another set (e.g. a dedicated AWS set), `yarn add -D @iconify-json/<set>` and add another
entry to that array. This works WITH `@docusaurus/theme-mermaid` (which owns
`mermaid.initialize`) because registerIconPacks mutates the same singleton.

#### Worked example in the repo
`designs/_mockups/markdown-review-studio.mdx` renders a local-machine topology with
`logos:apple / chrome / nodejs-icon / git-icon / markdown / claude`. Note: inside a JSX
component (a mockup sidecar) you can't use a ```` ```mermaid ```` fence — import
`@theme/Mermaid` and render `<Mermaid value={theString} />` instead (define the string
INSIDE the component, not at module top level, or MDX fails to compile).

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

### use-case diagram (VERIFIED recipe — no native type, built from a flowchart)
Mermaid has no UML use-case type. The pattern that renders here: **actors as emoji nodes**
(`👤` — note `fa:fa-user` does NOT render in this repo, the icon is dropped), **use cases as
stadium/oval nodes `([...])`**, a **system-boundary `subgraph`**, plain `---` associations,
and `-. include .->` / `-. extend .->` for the UML stereotypes. Verified-rendering skeleton:
```
flowchart LR
  reviewer["👤 Reviewer"]
  author["👤 Author"]
  subgraph system[Review Studio]
    uc1([View document])
    uc2([Leave anchored comment])
    uc3([Run Claude on comments])
    uc4([Browse history])
  end
  reviewer --- uc1
  reviewer --- uc2
  reviewer --- uc3
  author --- uc1
  author --- uc4
  uc3 -. include .-> uc2
```
Keep actors on one side (`flowchart LR` puts them left), the use cases inside the boundary,
and few associations per actor so the lines stay clean (visual-verify).

### fork in the road (diverging future directions — for a North Star / vision section)
When a design's closing vision names MORE THAN ONE possible future, show that the options DIVERGE
rather than listing them: a `flowchart LR` where the current foundation is one node that fans out to
N future-direction nodes. Each branch label is the trigger/bet that leads down that path; the
direction nodes are stadium `([...])` ovals (a "destination" shape). Keep the paths as siblings (do
NOT chain them) so the fork reads as *alternatives*, not a sequence. Do NOT hardcode colors — the
theme colors it. Verified-rendering skeleton:
```
flowchart LR
  found([Today: usage reporting])
  found -->|"admin the fleet"| a([Admin control plane])
  found -->|"compare teams"| b([Benchmarking service])
  found -->|"cut spend"| c([Cost-optimization advisor])
  found -->|"prove compliance"| d([Compliance export])
```
This is a `refine-design-post` axis-4 candidate: the skill proposes it when a North Star section names
2+ directions. One direction needs no fork (a sentence does). Label the branches with the bet that
opens each path, and keep the direction nodes short (they are destinations, not descriptions).

### context diagram (architecture-beta hub — what a system TOUCHES)
Shows a system and the actors/stores/dependencies at its boundary — NOT internal flow. One
`group` is the boundary; the core service is the hub; its neighbors sit around it with ports
that FACE the hub (so no edge crosses a node). This is the markdown-review "How it's wired"
diagram. Recipe:
```
architecture-beta
  group machine(logos:apple)[Local Machine]
  service git(logos:git-icon)[Git Repo] in machine
  service ui(logos:chrome)[Browser UI] in machine
  service server(logos:nodejs-icon)[Review Server] in machine
  service claude(logos:claude)[Claude Code CLI] in machine
  service files(logos:markdown)[Markdown Files] in machine
  ui:R --> L:server
  server:T --> B:git
  server:R --> L:claude
  server:B --> T:files
```
Declaration order places the hub's neighbors on its sides — declare them around the hub and
each edge leaves the side its target sits on (see Arrow & layout hygiene).

(For `erDiagram`, `classDiagram`, `mindmap`, `timeline`, `C4Context` use the standard
mermaid-11 syntax; if unsure, probe-verify per the workflow below before shipping. Note: for a
`mindmap` on THIS site, prefer the `<MindMap>` component over a raw ```mermaid fence. It renders
the same mindmap text but themed to the site and with clickable nodes; see the upgrade-post
catalog and the import-mindnode skill.)

## Flowchart mechanisms (shapes / links / subgraphs / styling)

The flowchart is the workhorse — know its parts:

**Node shapes** (the bracket IS the shape): `A[rect]` · `A(rounded)` · `A([stadium/oval])` ·
`A[[subroutine]]` · `A[(cylinder/db)]` · `A((circle))` · `A{rhombus/decision}` ·
`A{{hexagon}}` · `A[/parallelogram/]` · `A>asymmetric]`. (Mermaid 11 also has the generic
`A@{ shape: rounded }` form.) Pick shape by meaning: decision → rhombus, store → cylinder,
use-case → stadium, process → rect.

**Links:** `A-->B` (arrow) · `A---B` (line, no arrow — good for associations) · `A-.->B`
(dotted) · `A==>B` (thick) · labels: `A-- text -->B` or `A-->|text|B` · chain: `A-->B-->C`.

**Subgraphs (grouping + boundaries):**
```
flowchart LR
  subgraph box[System Boundary]
    direction TB
    a --> b
  end
  user --> box
```

**Styling — AVAILABLE but COLOR-CONSTRAINED here.** `classDef name …`, `class A,B name`,
the `A:::name` shorthand, `style A …`, and `linkStyle 0 …` all work. BUT do not set fill/
stroke COLORS (the light/dark theme owns color — see Site conventions). Use these only for
non-color structure if needed (e.g. `stroke-dasharray` to mark a provisional/future node).
For everyday diagrams, set NO style at all and let the theme handle it.

## Arrow & layout hygiene (clean arrows are a CONTENT-quality bar, not automatic)

Mermaid will happily render a valid-but-MESSY diagram — edges that cross through nodes,
long detour edges, arrows overlapping labels. A diagram with crossing arrows reads as
sloppy. Rules:

**architecture-beta** (the layout is driven by service ORDER + the T/B/L/R ports you pick):
- **Pick the port that FACES the target.** A hub with spokes: `server:T --> B:git` (git
  above), `server:R --> L:claude` (claude right), `server:B --> T:files` (files below),
  `ui:R --> L:server` (ui left). Each edge leaves the side the target sits on.
- **Order services so connected ones are ADJACENT.** Declaration order places services; if
  you connect two services that end up far apart, the edge takes a long ugly detour. Declare
  a hub's neighbors around it (e.g. `git, ui, server, claude, files`).
- **An edge that crosses through a node = a routing smell.** Reorder services or repick
  ports until no edge passes over a node or another edge. (The markdown-review
  `server→claude` edge originally cut diagonally across the Server node because claude was
  declared in the wrong slot and used `R-->L` back over everything; reordering + facing
  ports fixed it.)
- **Drop edges that force a detour** if they don't carry essential meaning — fewer, clean
  edges beat a complete-but-tangled graph.

**flowchart**: keep ONE primary direction (`LR` or `TB`); group related nodes in
`subgraph`s so edges stay local; keep edge labels short (long labels overlap the line);
prefer a few clear edges over a hairball. If two edges must cross, that's fine — but an
edge crossing a NODE is not.

**The bar:** after rendering, the arrows should read at a glance — no line through a box, no
label sitting on a line, no edge wandering across the whole diagram. If it doesn't, fix the
ports/order; don't ship it. This is verified VISUALLY (see Verify below), not by "an SVG
rendered."

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
   `designs/*.mdx` (including mermaid node labels) BLOCKS the edit. **Do NOT reach for the
   `&#8212;` / `&mdash;` HTML entity to dodge it** — the entity RENDERS as an em-dash, reads as
   the same AI voice, and the hook now flags it too (inside mermaid fences as well). Rephrase the
   label instead: a colon, a comma, or two words. En-dash `–` and hyphen `-` are fine.
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
   mermaid console error.
3. **VISUAL-VERIFY — mandatory, not optional.** "An SVG rendered" does NOT mean it looks
   right. SCREENSHOT the diagram (target it by `aria-roledescription="architecture"` etc. —
   a post can have many mermaid blocks, so don't grab `.last()`) and EYEBALL it for: arrows
   crossing through nodes, edges overlapping labels, long detour edges, icons that didn't
   resolve (blank where a `logos:` icon should be), and dark-mode legibility. If the arrows
   aren't clean, fix the ports/order (see Arrow & layout hygiene) and re-shoot. Skipping
   this is how a tangled diagram ships looking valid.

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Red "Syntax error in text" box where the diagram should be | a typo the build can't catch (beta types are strict) | re-check against the skeleton above; probe-verify in the browser. |
| `architecture-beta` edge does nothing / errors | wrong edge syntax | it's `id:DIR --> DIR:id` (e.g. `db:R --> L:server`), not `id --> id`. |
| `kanban` cards not under their column | indentation | cards must be INDENTED under the column line. |
| `quadrantChart` points off-chart | coords out of range | x,y are 0–1 floats. |
| Diagram is the wrong colors / unreadable in dark mode | hardcoded `classDef`/`style fill:` | remove them; let the theme color it. |
| Edit blocked: em-dash in a node label | literal `—` OR a `&#8212;`/`&mdash;` entity in the label | rephrase the label (colon/comma/two words). The entity is NOT a valid dodge, it renders as an em-dash and is flagged too. |
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
