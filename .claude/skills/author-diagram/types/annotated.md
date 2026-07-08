# Annotated (a diagram whose STEPS each need a sentence)

**Pick this when:** you have a real diagram (usually mermaid) whose nodes each deserve a sentence
of explanation, and you want a numbered legend tying badges in the labels to those explanations.
This is a WRAPPER around another diagram, not a diagram type of its own.

**Author with `<DiagramWithFootnotes>`:** author the mermaid with numbered badges in the labels
(&#9312;&#9313;&#9314;), then render the matching explanations as a legend.

**When to reach for it vs alternatives:**
- The diagram is a FLOW and each step is self-explanatory &rarr; plain `<FlowDiagram>` (`flow.md`),
  which already gives a node a click-to-focus `detail` modal.
- The diagram is a flow but each step needs a full sentence of standing context visible at once
  &rarr; `<DiagramWithFootnotes>`.
- A non-flow diagram (class / ER / context) that needs per-node notes &rarr;
  `<DiagramWithFootnotes>`.

**Gotchas:**
- It is a MANUAL opt-in; a content re-import clobbers it, so add it only on finalized pages.
- `.md` cannot embed it; use `.mdx`.

**Owner:** `upgrade-post` (the `<DiagramWithFootnotes>` catalog entry).
