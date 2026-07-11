---
name: author-diagram
description: The CHOOSER for diagrams on the Bytes of Purpose site — decides WHICH of the many diagram types (a dozen mermaid types plus the custom FlowDiagram / UseCaseDiagram / MindMap / DiagramWithFootnotes / ComparisonMatrix components plus Figma / Google Drawing / PlantUML / .mindnode embeds) best fits what you are trying to show, by running a short adaptive AskUserQuestion interview, then HANDS OFF to the skill that owns that type's mechanics. It routes and dispatches; it does not duplicate the deep skills. Use when the user says "which diagram should I use", "what's the best way to show X", "make a diagram for this", "help me pick a diagram", or hands over something to visualize without naming the diagram type. Distinct from author-mermaid (raw mermaid syntax per type) and upgrade-post (the component catalog) — this skill CHOOSES, then calls them. Pairs with author-mermaid (mermaid syntax), upgrade-post (FlowDiagram/MindMap/UseCaseDiagram/DiagramWithFootnotes/ComparisonMatrix), import-mindnode (a .mindnode file), import-co-design (a work-repo HLD), and author-post (embedding the result).
---

# Author a diagram (choose the type, then hand off)

The hard part of a diagram is not drawing it, it is CHOOSING it. This site has many ways to draw
one, and the right pick depends entirely on what you are trying to SHOW, not on which tool you
like. This skill is the **chooser**: it interviews you about the intent, routes to the single best
diagram type, then opens the matching `types/*.md` checklist and hands the mechanics to the skill
that owns them. It does NOT duplicate those skills; each subfile is a short "you picked X, here is
the snippet, the gotchas, and who owns it" checklist.

## Step 0 — is the type already obvious?

If the request already names the shape ("draw the request FLOW", "a use-case diagram", "map my
role hierarchy"), skip the interview and go straight to the routing table. Only interview when the
intent is ambiguous. Ask with **`AskUserQuestion`**, on genuine ambiguity only, small labelled
option sets, your recommendation first. Do not interrogate when one answer is clearly right.

## The interview (ask these in order; stop as soon as the type is settled)

### Q1 — what are you trying to SHOW?

The whole choice hangs on intent. Offer these (group the long list into a first cut, then narrow):

- **Something MOVES through steps** (a pipeline, request/response, an experiment loop) &rarr; the
  FLOW family. Go to Q2a.
- **Who USES what** (actors and the capabilities they reach) &rarr; a use-case diagram. `use-case.md`.
- **A HIERARCHY of ideas** (a brainstorm, a role map, a concept tree) &rarr; the mind-map family.
  Go to Q2b.
- **A head-to-head CHOICE** (options scored against criteria) &rarr; the decision kit. `comparison.md`.
- **The STRUCTURE of data or types** (entities, tables, classes) &rarr; ER / class. `data-and-state.md`.
- **A LIFECYCLE / state machine** (states and transitions) &rarr; stateDiagram. `data-and-state.md`.
- **A time-ordered INTERACTION** (who-calls-whom over time) &rarr; a sequence diagram. `sequence.md`.
- **What a system TOUCHES or how it is BUILT** (topology, neighbors, deps) &rarr; the topology
  family. Go to Q2c.
- **A BOARD of work / a git story / MILESTONES / a 2x2** &rarr; the project family. `project.md`.
- **What a UI LOOKS like** &rarr; a Mockup (not a diagram; see `upgrade-post`). `embed.md`.
- **Something in MOTION** &rarr; a Gif (see `upgrade-post`). `embed.md`.

> Tell: "how does X get from A to B" is a flow; "who does what with X" is use-case; "how do these
> ideas relate under one root" is a mind map; "which option wins" is the decision kit.

### Q2a (FLOW) — what shape is the flow, and do you want it on-brand?

- A strict line A &rarr; B &rarr; C, a loop, a vertical stack, a fork/decision, or owner-lanes, AND
  you want an on-brand SVG with a build-time legibility gate + clickable node detail &rarr;
  **`<FlowDiagram>`** (it infers pipeline/loop/sequence/branch/swimlane). `flow.md`.
- A quick hand-authored flow, or one that needs mermaid features FlowDiagram lacks &rarr; a
  **mermaid `flowchart`** (animate it with the flow-dot). `flow.md`.

> Tell: reach for `<FlowDiagram>` first (data-driven, gated, themed); drop to a raw mermaid
> flowchart only when you need something it cannot express.

### Q2b (HIERARCHY) — clickable + themed, or a throwaway sketch?

- You want the branches to be CLICKABLE (jump to a heading or page) and themed to the site &rarr;
  **`<MindMap>`**. `hierarchy.md`.
- A quick static brainstorm with no links &rarr; a raw **mermaid `mindmap`**. `hierarchy.md`.
- The source is an actual Apple **`.mindnode`** file &rarr; **`import-mindnode`** (it converts +
  previews for you). `hierarchy.md` / `embed.md`.

### Q2c (BOUNDARY / TOPOLOGY) — which of the three confusable ones?

Reuse author-mermaid's disambiguation exactly:

- **Flow** (`flowchart` / `<FlowDiagram>`): something MOVES through steps (A &rarr; B &rarr; C).
- **Context / topology** (`architecture-beta`): what a system TOUCHES, its neighbors/stores/deps at
  the boundary. Hub-and-spoke, NOT a sequence. `topology.md`.
- **Use-case** (`<UseCaseDiagram>`): which ACTORS use which capabilities. `use-case.md`.

> Tell: draw the boundary you actually mean. "the payment service calls Stripe and reads the DB" is
> topology; "a customer checks out and an admin issues a refund" is use-case; "the request goes
> through auth then billing then fulfillment" is a flow.

### Q3 (only if still ambiguous) — is there a SOURCE artifact?

- A **`.mindnode`** file &rarr; **`import-mindnode`**.
- A **work-repo HLD** (`~/Workspace/work-git/.../CO-DESIGN-*-hld.md`) &rarr; **`import-co-design`**
  (it classifies the diagrams and imports idempotently).
- A **Figma board / Google Drawing / PlantUML** you already have &rarr; embed it. `embed.md`.

## Routing table (the answer &rarr; the owner)

| The intent points to&hellip; | Diagram type | Author it with | Subfile / owner skill |
|---|---|---|---|
| Something moves through steps | `<FlowDiagram>` (or mermaid `flowchart`) | prop spec / fence | `flow.md` &middot; upgrade-post / author-mermaid |
| A hierarchy you can click | `<MindMap>` (or mermaid `mindmap`) | mermaid mindmap text | `hierarchy.md` &middot; upgrade-post / import-mindnode |
| Who uses what | `<UseCaseDiagram>` | actors/useCases/links | `use-case.md` &middot; upgrade-post |
| Which option wins | `<ComparisonMatrix>` + `<Accordion>` | options/criteria | `comparison.md` &middot; upgrade-post |
| A time-ordered interaction | mermaid `sequenceDiagram` | fence | `sequence.md` &middot; author-mermaid |
| Data or type structure, a lifecycle | mermaid `erDiagram` / `classDiagram` / `stateDiagram-v2` | fence | `data-and-state.md` &middot; author-mermaid |
| What a system touches / how it is built | mermaid `architecture-beta` (topology or context), C4 | fence | `topology.md` &middot; author-mermaid |
| A board / git story / milestones / a 2x2 | mermaid `kanban` / `gitGraph` / `timeline` / `quadrantChart` | fence | `project.md` &middot; author-mermaid |
| A diagram whose steps each need a sentence | `<DiagramWithFootnotes>` (mermaid + numbered legend) | wrapper | `annotated.md` &middot; upgrade-post |
| A Figma / Google Drawing / PlantUML / `.mindnode` you already have | embed / import | iframe / img / fence / converter | `embed.md` &middot; import-mindnode / import-co-design |

## When it is genuinely TWO diagrams, author both

A post often needs more than one: a FLOW of the pipeline AND a COMPARISON of the options it chose
between; a topology AND a sequence. Do not cram two intents into one diagram. Pick the type for
each intent from the table and author them separately, each in the section that needs it. (Same
"split, do not force" instinct as `organize-post`.)

## How to run it

1. **Read the request.** Name the ONE thing it is trying to show (or the few, if mixed).
2. **If the type is obvious, skip the interview.** Otherwise run Q1 &rarr; the narrowing follow-up,
   via `AskUserQuestion`, recommendation first, only on real ambiguity.
3. **Open the matching `types/*.md`** for the confirming heuristic + the snippet skeleton + the
   gotchas that bite.
4. **Author it through the owner skill** named in that subfile (author-mermaid for a fence,
   upgrade-post for a component, import-mindnode / import-co-design for a source artifact). Do NOT
   restate their mechanics here.
5. **Verify** per the owner's gate: `<FlowDiagram>` / `<UseCaseDiagram>` / `<MindMap>` FAIL the
   build on a bad spec (a dangling edge id, a tangled layout, malformed mindmap text), so a green
   `yarn build` is the syntax gate; mermaid renders client-side, so screenshot-check it (crossing
   arrows, unresolved `logos:` icons, dark-mode legibility).

## Universal gotchas (hold for every type)

1. **No hardcoded mermaid colors.** Never `classDef` / `style fill:` COLOR directives; the theme
   colors diagrams in light + dark. (See author-mermaid.)
2. **The em-dash hook BLOCKS** a literal `&#8212;` (U+2014) or a `--` prose dash anywhere in
   `docs`/`blog`/`designs`/`src`. In a mermaid label use the `&#8212;` entity; in prose use commas
   / colons / `&middot;`.
3. **`.md` cannot embed JSX.** Any post using `<FlowDiagram>` / `<MindMap>` / `<UseCaseDiagram>` /
   `<ComparisonMatrix>` MUST be `.mdx`. A plain `mermaid` fence works in `.md`.
4. **Show a mermaid block INSIDE an mdx code block with 4-backtick fences** so the inner
   ` ```mermaid ` is not swallowed.
5. **Animate FLOWS only.** Wrap a flow in `<div className="mermaid-animated flow-dot">`; do not
   animate context / relationship / hierarchy diagrams (the traveling dot looks random).

## Files

- `types/flow.md` &mdash; a movement/process flow (`<FlowDiagram>` vs mermaid `flowchart`, and when each).
- `types/hierarchy.md` &mdash; an idea/role/concept tree (`<MindMap>` vs mermaid `mindmap` vs a `.mindnode` import).
- `types/use-case.md` &mdash; who-uses-what (`<UseCaseDiagram>`).
- `types/comparison.md` &mdash; a head-to-head choice (`<ComparisonMatrix>` + `<Accordion>`).
- `types/sequence.md` &mdash; a time-ordered interaction (mermaid `sequenceDiagram`).
- `types/data-and-state.md` &mdash; data/type structure + lifecycles (`erDiagram` / `classDiagram` / `stateDiagram-v2`).
- `types/topology.md` &mdash; what a system touches / how it is built (`architecture-beta`, context, C4).
- `types/project.md` &mdash; a board / git story / milestones / a 2x2 (`kanban` / `gitGraph` / `timeline` / `quadrantChart`).
- `types/annotated.md` &mdash; a diagram whose steps each need a sentence (`<DiagramWithFootnotes>`).
- `types/embed.md` &mdash; a Figma / Google Drawing / PlantUML / `.mindnode` you already have.
