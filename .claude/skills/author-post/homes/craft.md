# Authoring a `/craft` doc (and `/knowledge`, `/habits` — same shape)

**Home:** the Craft docs instance (`bytesofpurpose-blog/docs/craft/…`, route `/craft`). Craft is
the durable **"how I see the world / how I do the work"** — the outward how. Same mechanics apply
to the sibling durable docs roots **`/knowledge`** (mental models) and **`/habits`** (practices);
only the topic set + route differ. `/journey` is also docs-shaped but has its own guide.

## The topic-folder contract (the source of truth)

The docs are **five separate `plugin-content-docs` instances**, each a topic-based IA with the
same recurring folder contract. **This is the source of truth for that contract** (the
`review-reader-experience` skill AUDITS against it; `scripts/validate-docs-structure.js` enforces it
via `make validate-structure` + a warn-only `Write|Edit` hook). The contract:

- **The FIVE docs instances** (each `docs/<name>/`, each its own navbar `docSidebar` +
  `sidebars-<name>.js`, preset default docs disabled): **`craft`** → `/craft` (how I do the work),
  **`journey`** → `/journey` (why I build; plugin id is still `'self'`, old `/self/*` 301s to
  `/journey/*`), **`knowledge`** → `/knowledge` (durable mental models), **`habits`** → `/habits`
  (practices), **`handbook`** → `/handbook` (the reader's guide; plugin id `'legend'`). There is NO
  single `/docs` root and no `docs/welcome/`. Adding/renaming/splitting a whole instance is owned by
  `manage-docs-instances`. Within an instance, a reader-facing TOPIC is a direct child dir with a
  `_category_.json` (the validator detects topics by structure, not a name pattern).
- **Every doc has an ABSOLUTE, INSTANCE-RELATIVE `slug:`** — the slug is relative to the instance
  root and the `draft-docs` plugin prepends the instance segment. A topic README uses `slug: /` →
  permalink `/craft`; a nested doc uses `slug: /software-development/patterns/x` → `/craft/…/x`. Do
  NOT bake the instance prefix into the value (`slug: /craft/…` DOUBLES to `/craft/craft/…`). A
  missing/relative slug is the only **ERROR** tier (the rest are warn-tier advisories).
- **Folder NAMES carry no numeric ordering prefix.** Order comes from `_category_.json` `"position"`
  (folders) + `sidebar_position` (docs) — never the name (a prefix couples order to identity;
  bumping a position is a 1-line history-clean edit).
- Each topic folder has a `README.{md,mdx}` landing (absolute instance-relative slug) + a
  `_category_.json` (label + position). A topic README pins itself `👋 Welcome`
  (`sidebar_label: '👋 Welcome'` + `sidebar_position: 0`).
- **Every `_category_.json` `label` LEADS with an emoji** (the sidebar scans visually). Reuse the
  emoji a sibling of the same kind uses; source of truth is `scripts/lib/emoji-map.js` (the
  `suggest-emoji` skill). A `kind:`-carrying doc gets its emoji at runtime and is exempt.
- Every sub-folder with docs has a `_category_.json` (no orphan categories). Names are
  **kebab-case** (`_`-prefixed like `_TEMPLATE` exempt). No framing-word/topic-echo folder names
  (`*-techniques`/`*-craftsmanship`/`definitions` → use a reader-facing topic noun).
- **Folder depth ≤ 5** under an instance root. A `terminology/` category sorts **first**; a
  `prompts/` category sorts **last**.
- **Every doc carries a healthy `description:`** (present, ~50–160 chars, distinct) — it feeds
  `og:description` + the ShareButton message (`manage-frontmatter-descriptions`).
- **A move pairs with a `{from,to}` client-redirect** (targets use the real served path —
  `/craft/…`, not `/docs/…`) so old URLs resolve; the drift-free move loop (repoint + collapse
  redirect chains) is owned by `reorganize-content`, gated by `validate-redirects`.
- Two cross-topic link conventions the validator warns on: the **idea↔execution mapping** (a PM
  idea doc's `## Execution` links to the built artifact; the artifact's `## Idea`/`## Origin` links
  back) and the **blog↔doc trigger** (`blog_*` frontmatter pairing a durable doc with its `/blog/`
  announcement). A retired root namespace (`/mental-models/*`) is warn-flagged (`legacy-namespace`)
  — mental-models content is a per-topic subdir now, not a cross-cutting root.

> **Any decision that changes this structure or its conventions** (add/rename/retire a topic, change
> the recurring shape, add a naming rule, change slug/draft policy) MUST update
> `validate-docs-structure.js` + THIS section in the same change, so the docs and checks never drift
> (the CLAUDE.md "structure decisions must update the structure checks" tenet).

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
`review-reader-experience` (the IA audit that checks this contract) · `mechanics.md` (MDX pitfalls).
