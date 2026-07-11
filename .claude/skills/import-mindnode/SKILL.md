---
name: import-mindnode
description: Turn an Apple MindNode `.mindnode` mind map into a themed, clickable <MindMap> embedded in a Bytes of Purpose post. Runs scripts/convert-mindnode.py (a .mindnode bundle -> Mermaid mindmap text), helps you add markdown-link nodes that jump to same-page headings or other pages, and wraps the result in the <MindMap> component (from @omars-lab/blog-ui; renders its own MindNode-styled SVG because mermaid's mindmap renderer supports neither node links nor theming). Includes a VISUAL VALIDATION loop: scripts/render-mindmap.mjs rasterizes the mind map to a PNG WITHOUT building the blog, so you can eyeball it against the bundle's own QuickLook/Preview.jpg. TRIGGERS on "convert this mindnode", "import a MindNode map", "embed a mind map", "turn my .mindnode into a diagram". Pairs with upgrade-post (the <MindMap> catalog entry for hand-authoring a map WITHOUT a .mindnode file), author-mermaid (mindmap syntax), modify-blog-ui-component (the <MindMap> internals), author-post (the post), serve-locally + validate-links (verify).
---

# Import a MindNode map onto the blog as a clickable, themed mind map

You have Apple MindNode `.mindnode` mind maps (in this repo's sibling vault, or anywhere on
disk) and you want them to become real blog content: a mind map that matches MindNode's look,
whose nodes you can CLICK to jump to a heading on the same page or to another page. This skill
is the end-to-end pipeline for that.

The three moving parts (all already built):

| Piece | Path | Role |
|-------|------|------|
| **Converter** | `bytesofpurpose-blog/scripts/convert-mindnode.py` | `.mindnode` bundle -> Mermaid mindmap text on stdout. Python 3 stdlib only. |
| **Component** | `@omars-lab/blog-ui` `<MindMap>` (`packages/blog-ui/src/components/MindMap/`) | Renders that mermaid text as a MindNode-themed inline SVG, with markdown-link nodes as real anchors. Globally registered in MDX (no per-post import). |
| **Preview CLI** | `bytesofpurpose-blog/scripts/render-mindmap.mjs` | Rasterizes the mind map to `.svg` + `.png` WITHOUT building the blog. The visual-validation half of the loop. |

## Why not just a ```mermaid fence?

Mermaid's own `mindmap` renderer cannot make nodes clickable
([mermaid-js/mermaid#4099](https://github.com/mermaid-js/mermaid/issues/4099)) and does not
reliably theme mindmap nodes ([#5156](https://github.com/mermaid-js/mermaid/issues/5156)). The
`<MindMap>` component parses the SAME mermaid mindmap syntax itself and draws its own SVG, so
you get the MindNode look AND real `<a>` links. The text stays valid mermaid, so it still
renders on mermaid.live for a quick check.

## The pipeline (do these in order)

### 1. Convert the bundle to mermaid text

```
python3 bytesofpurpose-blog/scripts/convert-mindnode.py "<path>/Foo.mindnode"
```

- Multiple top-level nodes -> a root is synthesized from the bundle name (override with
  `--root-label "..."`). A single top-level node becomes the `root((...))`.
- Cross-connection arrows (mermaid mindmaps cannot draw them) are emitted as trailing
  `%% cross-connection: A --> B` comments. Represent those in prose or as a sibling
  `<FlowDiagram>` if they matter.
- Top-level nodes are ordered left-to-right by their canvas x-position, so the output reads in
  the author's intended order.

Paste the output into a fenced block first and read it; sanity-check the hierarchy.

### 2. VISUAL VALIDATION LOOP (do this before touching the post)

Render the mind map to a PNG and compare it to the bundle's own preview. No blog build needed.

```
# straight from the bundle (runs the converter for you):
node bytesofpurpose-blog/scripts/render-mindmap.mjs \
  --mindnode "<path>/Foo.mindnode" \
  --out /tmp/foo-mindmap --title "Foo"

# open both side by side:
open /tmp/foo-mindmap.png "<path>/Foo.mindnode/QuickLook/Preview.jpg"
```

Flags: `--layout ltr|spread` (spread = MindNode's two-sided look, root centered), `--theme
light|dark`, `--svg-only` (skip PNG). PNG rasterization uses Playwright's bundled Chromium; if
that is unavailable it falls back to `rsvg-convert` (`brew install librsvg`).

Iterate: if the shape/labels are wrong, fix the mermaid text (or re-run the converter) and
re-render. Only move on when the PNG reads like the original. This is the loop the user asked
for: compare OUR mind map to the MindNode preview cheaply, without a full site build.

### 3. Add clickable links to nodes

A node whose ENTIRE label is a markdown link becomes a real anchor. Three targets:

```
mindmap
  root((Orchestrating Roles))
    [The Starter](#the-starter)            <- a heading on THIS post
    [The Executor](#the-executor)
    [Read the retro](/blog/some-post#retro) <- another page + anchor
    [MindNode](https://mindnode.com)        <- external (opens in a new tab)
```

- Same-page: `#kebab-heading` must match a real `## Heading` in the post (Docusaurus slugifies
  headings; check the rendered id).
- Cross-page: start with `/` (an absolute site path) and add `#anchor` for a heading there.
- Leave shape/plain nodes as-is; only wrap the ones that should navigate.

Re-run the preview (step 2) after adding links to confirm the linked nodes render with the
link affordance (underline + link tint).

### 4. Embed in the post

`<MindMap>` is globally registered (see `bytesofpurpose-blog/src/theme/MDXComponents.tsx`), so
no import. Pass the mermaid text as children in a TEMPLATE LITERAL so `#`, parens, and newlines
survive MDX:

```mdx
<MindMap title="Orchestrating Roles">{`
mindmap
  root((Orchestrating Roles))
    [The Starter](#the-starter)
    [The Executor](#the-executor)
    [The Finisher](#the-finisher)
`}</MindMap>
```

Props: `title` (required), `theme` (`mindnode` default cream/brown | `blog` for the site's
green/tea tokens; both respect light+dark), `layout` (`ltr` default | `spread`), `density`
(`comfortable` default | `compact` for big maps), `caption`, and `className`/`style` passthrough.
A node can carry an accent tint with a mermaid `:::name` class (`green`/`mint`/`pink`/`blue`/
`amber`/`violet`), e.g. `The Starter:::green`. Malformed mindmap text THROWS at build time (the
SSG fails) rather than shipping a broken diagram, so a green build is your syntax gate.

Preview any of these before embedding: `render-mindmap.mjs` takes `--style mindnode|blog`,
`--theme light|dark`, and `--density comfortable|compact`, so you can compare looks as PNGs
without a site build.

### 5. Verify

- `make build-blog-ui` (rebuild + relink the package if you touched the component; the Yarn-1
  `file:` stale-dist trap is covered in the modify-blog-ui-component skill).
- `make start` (or the serve-locally skill) and open the post: confirm the MindNode look in
  light AND dark mode, click a node -> it scrolls to the in-page heading, click a cross-page
  node -> it navigates.
- Run the validate-links skill on the new post so no anchor is dangling.

## Gotchas

- The `.mindnode` `contents.xml` is a binary plist despite the `.xml` name; the converter reads
  it with `plistlib` (no third-party deps). A newer zipped single-file `.mindnode` is handled
  as a fallback.
- No em-dashes (U+2014) in node labels or prose; the repo's em-dash hook flags them.
- Very large maps (hundreds of nodes) render tall in `ltr`; `spread` is more compact but only
  balances top-level branches. For a huge map, consider embedding a focused subtree.
- When showing the raw mermaid text INSIDE an MDX code block for the reader, use 4-backtick
  fences so the inner ```` ```mermaid ```` block is not swallowed (see author-mermaid).
