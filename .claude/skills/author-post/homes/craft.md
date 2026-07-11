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

## Card a durable doc on a hub (`pattern` / `technique`)

A `pattern` or `technique` doc cards on its **CRAFT-sourced hub** (Patterns / Techniques) the moment
it carries **`kind:`** (the discriminator) + **`area:`** — the same ONE unified vocabulary as the
initiatives hubs: **`backend` / `frontend` / `script` / `plugin`** (else `other`). Unlike a dated
`/initiatives` log, a craft-hub doc STAYS in `/craft` (it is durable, not moved to `blog/`) and its
cards sort **A–Z by title** (no `date:`). Put the doc FLAT under the hub's source dir (the hub's own
`README` is the `kind: hub` landing, not a card). After adding `kind`+`area`, run
`make generate-assets` then `make validate-hubs`. A doc MOVED into a craft hub from another `/craft`
path needs a `{from,to}` redirect (published docs only) and any existing redirect whose `to:` pointed
at the old path must be repointed (`reorganize-content` + `validate-redirects`).

> **A `hub` doc itself, and a `showcase`, are structural** — each needs a registry/generator entry in
> the SAME change (hub → the `HUBS` manifest in `generate-hubs-data.js`, rendering `<Catalog>`;
> showcase → `usage_pattern` frontmatter). Do not author one without its owning skill: **`manage-hubs`**
> (add a NEW hub) / **`maintain-showcase`** (a showcase). This guide covers only carding a pattern/
> technique doc on a hub that exists.

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

- No em-dash; MDX-safe if it uses components. Link the first genuine glossary term (`mechanics.md`
  → "Glossary linking"; audit with `audit-glossary-links`). Healthy `description:`
  (`manage-frontmatter-descriptions`).
- If this doc MOVED from another path, pair it with a `{from,to}` redirect and collapse any chain
  (`reorganize-content` + `validate-redirects`).
- Gates: `make validate-structure`, `make validate-seo`, `make validate-links`, and
  `make validate-hubs` if it is or carries a hub-kind.

## Cross-links

`organize-post` (is this really durable-craft?) · `reorganize-content` (moving it in) ·
`manage-hubs` · `maintain-showcase` · `manage-docs-instances` (adding a whole new root) ·
`review-reader-experience` (the IA + the contract) · `author-post` (MDX pitfalls).
