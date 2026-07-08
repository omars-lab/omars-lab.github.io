# Flow (something MOVES through steps)

**Pick this when:** a request/response, a pipeline, an experiment loop, a handoff, or a
decision fan-out. Something travels from A to B to C.

**Two ways, pick by need:**

- **`<FlowDiagram>`** (default): a prop-driven inline-SVG flow, on-brand, with a build-time
  legibility gate and clickable node detail. It INFERS the shape from the graph: `pipeline`
  (A&rarr;B&rarr;C), `loop` (a back-edge), `sequence` (vertical stack), `branch` (a fork / 2+
  out-edges &mdash; a decision tree), `swimlane` (owner bands via each node's `lane`). Reach for
  this first.

  ```mdx
  <FlowDiagram title="Publish pipeline" legend
    desc="Draft flows through review to a live deploy."
    nodes={[
      {id: 'draft', label: 'Draft'},
      {id: 'review', label: 'Review', detail: 'A reader-experience pass.'},
      {id: 'deploy', label: 'Deploy', kind: 'external'},
    ]}
    edges={[{from: 'draft', to: 'review'}, {from: 'review', to: 'deploy', label: 'approved'}]}
  />
  ```

- **mermaid `flowchart`**: a quick hand-authored flow, or one needing mermaid features
  FlowDiagram lacks. Animate it as a flow.

  ````mdx
  <div className="mermaid-animated flow-dot">

  ```mermaid
  flowchart LR
    A[Draft] --> B[Review] --> C[Deploy]
  ```

  </div>
  ````

**Gotchas:**
- `<FlowDiagram>` FAILS the build on a dangling edge id or a tangled layout (>25% crossing edges);
  reorder so it reads without backtracking, or pass `allowOverlap` to downgrade to a warning.
- `.md` cannot embed `<FlowDiagram>`; use `.mdx`.
- Only FLOWS get the `flow-dot` animation; do not animate relationship diagrams.

**Owner:** `upgrade-post` (the `<FlowDiagram>` catalog entry) &middot; `author-mermaid` (the raw
`flowchart` mechanics). Go there for the full API.
