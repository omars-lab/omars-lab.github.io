# Hierarchy (a tree of ideas under one root)

**Pick this when:** a brainstorm, a role map, a concept tree, an outline. Ideas relate as a
single-rooted hierarchy, NOT a flow (nothing moves through steps) and NOT a comparison.

**Three ways, pick by need:**

- **`<MindMap>`** (default on this site): a themed inline-SVG mind map from mermaid `mindmap`
  text, with CLICKABLE nodes. A node whose whole label is a markdown link becomes an `<a>`.

  ```mdx
  <MindMap title="Orchestrating Roles" theme="blog">{`
  mindmap
    root((Orchestrating Roles))
      [The Starter](#the-starter)
      [The Executor](#the-executor)
      [The Finisher](/initiatives/other-post#finisher)
  `}</MindMap>
  ```

  `theme="blog"` (site tokens) for a NEW map; `theme="mindnode"` for one imported from / evoking a
  `.mindnode` file. Per-node tint with `:::green|mint|pink|blue|amber|violet`.

- **mermaid `mindmap`**: a quick static brainstorm with no links and no theming need.

- **an actual `.mindnode` file** as the source &rarr; use **`import-mindnode`** (it converts the
  bundle to mermaid text and previews it against the original before you embed).

**Gotchas:**
- Pass the mermaid text as CHILDREN in a template literal so `#`, parens, and newlines survive MDX.
- Malformed mindmap text THROWS at build (the syntax gate).
- For a directed flow or a decision fan-out use `flow.md`, NOT a mind map; mind maps are hierarchy,
  not movement.

**Owner:** `upgrade-post` (the `<MindMap>` catalog entry) &middot; `import-mindnode` (the
`.mindnode` path) &middot; `author-mermaid` (raw `mindmap` syntax).
