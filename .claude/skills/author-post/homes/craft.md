# Authoring a `/craft` doc (and `/knowledge`, `/habits` — same shape)

**Home:** the Craft docs instance (`bytesofpurpose-blog/docs/craft/…`, route `/craft`). Craft is
the durable **"how I see the world / how I do the work"** — the outward how. Same mechanics apply
to the sibling durable docs roots **`/knowledge`** (mental models) and **`/habits`** (practices);
only the topic set + route differ. `/journey` is also docs-shaped but has its own guide.

## The topic-folder contract (docs are folders, not loose files)

Docs are organized as **topics** (a reader-facing topic under the instance), each a folder with:
- a **README landing** carrying an **absolute, instance-relative `slug:`** (a topic README uses
  `slug: /` → permalink `/craft`; a nested doc uses `slug: /software-development/patterns/x`).
- a **`_category_.json`** (label + `position`; order via `position`, NEVER a numeric folder prefix).
- optional `terminology/` (first) and `prompts/` (last).
- **kebab-case** names, **no numeric name prefix**, no framing-word/topic-echo folders, depth ≤ 5.

Full contract + validator: the **`review-reader-experience`** skill ("Topic-folder contract") and
`scripts/validate-docs-structure.js` (`make validate-structure`).

## Pick the `kind:`

| kind | emoji | Use for | Owning skill |
|---|---|---|---|
| `pattern` | 🧱 | how tools COMPOSE (a multi-tool recipe) | `manage-hubs` (patterns hub) |
| `technique` | 🔩 | a self-contained how-to | `manage-hubs` (techniques hub) |
| `framework` | 🧩 | a reusable mental framework / model | — |
| `tutorial` | 🧪 | a step-by-step walkthrough | — |
| `reference` | 📖 | a lookup/reference doc | — |
| `hub` | 🗂️ | a durable INDEX page cataloging posts by area via `<Catalog>` | **`manage-hubs`** (required registry entry) |
| `showcase` | 🎛️ | a live component demo (the `/handbook/components/*` reference) | **`maintain-showcase`** |

A **hub** and a **showcase** are special: each needs a registry/generator entry in the SAME change
(hub → `HUBS` in `generate-hubs-data.js`; showcase → `usage_pattern` frontmatter). Do not author one
without reading its owning skill.

A doc that should appear on a hub also carries an **`area:`** (`backend`/`frontend`/`script`/`plugin`).

## Frontmatter template

```yaml
---
title: '<Concept name — the lasting thing>'
description: <50 to 160 chars; no em-dash; feeds og + share>
slug: /<topic>/<...>/<kebab>      # ABSOLUTE + INSTANCE-RELATIVE (no /craft prefix)
kind: technique                   # per the table
area: frontend                    # only if it cards on a hub
authors: [oeid]
tags: [<topic>, <2-4 more>]
---
```

A topic README landing additionally pins itself: `sidebar_label: '👋 Welcome'` +
`sidebar_position: 0` (see any `docs/craft/*/README.mdx`).

## Conventions + validate

- No em-dash; MDX-safe if it uses components. Link the first genuine glossary term
  (`link-glossary-terms`). Healthy `description:` (`manage-frontmatter-descriptions`).
- If this doc MOVED from another path, pair it with a `{from,to}` redirect and collapse any chain
  (`reorganize-content` + `validate-redirects`).
- Gates: `make validate-structure`, `make validate-seo`, `make validate-links`, and
  `make validate-hubs` if it is or carries a hub-kind.

## Cross-links

`organize-post` (is this really durable-craft?) · `reorganize-content` (moving it in) ·
`manage-hubs` · `maintain-showcase` · `manage-docs-instances` (adding a whole new root) ·
`review-reader-experience` (the IA + the contract) · `author-post` (MDX pitfalls).
