# Project (a BOARD, a GIT story, MILESTONES, a 2x2)

**Pick this when:** you are showing work state or planning shape. Four mermaid types, one per
intent:

- **`kanban`** &mdash; a work board (columns + cards). Cards INDENT under the column line; optional
  `@{ assigned:…, ticket:…, priority: High }` metadata.

  ````mdx
  ```mermaid
  kanban
    todo[To Do]
      Task A
    doing[Doing]
      Task B
  ```
  ````

- **`gitGraph`** &mdash; a git branching/merging story (`commit`, `branch`, `checkout`, `merge`).
- **`timeline`** &mdash; dated milestones (chronological events).
- **`quadrantChart`** &mdash; a 2x2 prioritization (effort vs value). Points are `Label: [x, y]`
  with x,y as **0&ndash;1 floats** (out-of-range coords go off-chart).

**Gotchas:**
- kanban cards must be INDENTED under their column, or they detach.
- quadrant coords must be 0&ndash;1 floats.
- These are state/planning diagrams, not flows: no `flow-dot` animation.
- For an INTERACTIVE board that indexes real posts as cards (not a static picture), that is the
  `<KanbanBoard>` component, a different thing; see `upgrade-post`.

**Owner:** `author-mermaid` (per-type syntax). The interactive `<KanbanBoard>` is owned by
`upgrade-post`.
