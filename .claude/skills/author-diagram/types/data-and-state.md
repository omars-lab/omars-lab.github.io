# Data + state (STRUCTURE and LIFECYCLES)

**Pick this when:** you are showing the SHAPE of data/types, or how something moves between
STATES. Three mermaid types, one per intent:

- **`erDiagram`** &mdash; data entities + relationships (tables, fields, cardinality). The clean way
  to render a schema / star schema.

  ````mdx
  ```mermaid
  erDiagram
    POST ||--o{ COMMENT : has
    POST { string slug string title }
  ```
  ````

- **`classDiagram`** &mdash; object/type structure (classes, fields, methods, inheritance).

- **`stateDiagram-v2`** &mdash; a lifecycle / status machine (states + transitions).

  ````mdx
  ```mermaid
  stateDiagram-v2
    [*] --> Draft
    Draft --> Review
    Review --> Published
    Review --> Draft
  ```
  ````

**Gotchas:**
- These are RELATIONSHIP diagrams, not flows: do NOT wrap them in `flow-dot` animation.
- Standard mermaid-11 syntax; if unsure of a construct, probe-verify (render it) before shipping.
- Mermaid labels needing a dash use `&#8212;`.

**Owner:** `author-mermaid` (per-type syntax + gotchas). For a DB schema authored as text outside
mermaid (DBML / C4-PlantUML), see the diagramming docs referenced there.
