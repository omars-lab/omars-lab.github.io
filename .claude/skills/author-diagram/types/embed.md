# Embed (you already HAVE the artifact)

**Pick this when:** the diagram exists outside this repo and you want to bring it in, rather than
author one from scratch. Route by the artifact:

- **A `.mindnode` file** &rarr; **`import-mindnode`**. It converts the bundle to mermaid text,
  previews it as a PNG against the original, and wraps it in `<MindMap>`. Do not hand-transcribe.

- **A work-repo HLD** (`~/Workspace/work-git/.../CO-DESIGN-*-hld.md`) &rarr; **`import-co-design`**.
  Its transformer de-em-dashes, fixes MDX, classifies the diagrams, and is idempotent (re-run on
  source edits). Do not hand-copy.

- **A Figma board** &rarr; a JSX `<iframe>` from `embed.figma.com/board/...` (convert HTML attrs to
  JSX: `style={{}}`, `allowFullScreen`). See `/handbook/components/diagrams/diagrams-figma`.

- **A Google Drawing** &rarr; a published `<img>` from `docs.google.com/drawings/d/e/...pub`. See
  `/handbook/components/diagrams/diagrams-google-drawing`.

- **PlantUML / C4 / DBML** text you already have &rarr; a ```plantuml fence (or the diagramming
  docs' recipe). See `/blogging/diagramming/diagrams-as-text`.

**Gotchas:**
- Prefer CONVERTING a `.mindnode` or HLD (via its importer) over embedding a screenshot; the
  imported version is themed, searchable, and version-controlled.
- An `<iframe>` embed is client-only; screenshot-verify it renders.

**Owner:** `import-mindnode` (`.mindnode`) &middot; `import-co-design` (HLD) &middot; the
per-tool showcases under `/handbook/components/diagrams/*`.
