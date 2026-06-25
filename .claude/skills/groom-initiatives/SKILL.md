---
name: groom-initiatives
description: Capture and advance a temporal initiative (an idea, experiment, or project) as an /initiatives blog POST whose frontmatter drives a kanban board — NOT a /craft doc. Use when starting a new idea/experiment, moving a card across a board (a `stage` frontmatter change), or concluding one and distilling the durable learning back into /craft. Board-aware: knows the Experimentation + Ideas boards, their columns, and the kind→board mapping. Pairs with the experiment-lifecycle skills (design/run/analyze/decide/conclude-experiment) which drive the Experimentation board specifically, and with author-blog-post (MDX/frontmatter pitfalls).
---

# Groom initiatives (board-aware capture + advancement)

The site is split **durable vs temporal** (see the Legend hub, `/initiatives/legend`):

- **`/craft` (+ `/journey`) = DURABLE** — distilled learnings, frameworks, strategy. The
  lasting lesson.
- **`/initiatives` (the blog) = TEMPORAL** — the dated things actually done: ideas,
  experiments, project logs. Each links **up** to the durable Craft insight it informed.

A temporal initiative is therefore an **`/initiatives` blog post**, never a `/craft` doc. Its
frontmatter makes it a **card on a kanban board**; advancing the work = editing one frontmatter
field. This skill is the contract for that lifecycle.

## The boards (the board-aware part)

Cards are generated from post frontmatter by `scripts/generate-kanban-data.js`
(`npm run generate-assets` → the gitignored `src/components/KanbanBoard/kanban-data.json`);
the `<KanbanBoard board="…"/>` component renders them. **Never hand-edit kanban-data.json** —
it regenerates (the `block-generated-edits` hook refuses writes to it). To move a card, edit
the POST.

| Board | A card is a post with… | Columns (the `stage` values) |
|---|---|---|
| **experiments** | `kind: experiment-plan` 📝 or `kind: experiment-result` 📊 | `proposed` → `designed` → `running` → `analyzing` → `concluded` |
| **ideas** | any kind + explicit `board: ideas` frontmatter | `backlog` → `exploring` → `building` → `shipped` |

A post opts into a board by its **kind** (experiments) or an explicit **`board: ideas`**
(ideas) — never by accident. A `kind: experiment-result` post always shows in the terminal
`concluded` column regardless of `stage`. Unknown/empty `stage` → the board's first column.
(Synonyms are accepted, e.g. `draft`→`designed`, `live`→`running`, `done`→`concluded`,
`wip`→`building` — see the generator's `STAGE_SYNONYMS`.)

## Required frontmatter for a board card

```yaml
kind: experiment-plan        # or experiment-result; or any kind + `board: ideas`
stage: running               # the column it sits in (see the table)
priority: medium             # core | high | medium | low — drives the card's pill
title: "..."                 # the card title
description: "..."            # becomes the card summary (or use `summary:`)
draft: false                 # DRAFTS ARE SKIPPED — a draft post is not carded (it 404s in prod)
date: YYYY-MM-DD
```

`draft: true` posts are intentionally NOT carded (the generator skips them) — a card linking to
a draft would 404 in the prod build. Publish the post (`draft: false`) for it to appear on the
board.

## The lifecycle

1. **Capture.** A new idea/experiment is a NEW `/initiatives` post (start from the
   `author-blog-post` skill for the MDX/frontmatter pitfalls). Set `kind` + `stage` (first
   column) + `priority`. For an idea, add `board: ideas`. Publish when it's real enough to show.
2. **Advance.** Moving the work forward = changing **one field**: bump `stage` to the next
   column (e.g. `designed` → `running`). For an experiment, the `kind` itself flips
   `experiment-plan` 📝 → `experiment-result` 📊 once the Outcome lands (the
   experiment-lifecycle skills own this flip). Rebuild / `make generate-assets` and the card moves.
3. **Conclude + distill.** When an initiative ends, the temporal post stays as the record, but
   the **durable learning goes UP into `/craft`** (or `/journey`): add/extend the relevant
   framework/strategy doc with what you'd keep next time, and link the temporal post to it. The
   board card lands in its terminal column (`concluded` / `shipped`). The lasting lesson must
   not live only in the dated post.

## Where this skill hands off

- **Experiments** specifically are driven by the experiment-lifecycle skills
  (`design-experiment` → `run-ab-test` → `analyze-experiment` → `decide-experiment` →
  `conclude-experiment`). Those own the experiment POST + the `kind` plan→result flip + the
  Experimentation board. This skill is the general board contract they specialize.
- **MDX/frontmatter mechanics** (bare `<br>`, unescaped `{word}`, the `kind`/`sidebar_label`
  system) → `author-blog-post`.
- **The board component / generator** is owned by the KanbanBoard code; this skill owns the
  *workflow* (which frontmatter, which column, when to distill).

## Adding a board or a column

If you add a board or change a board's columns, update BOTH `scripts/generate-kanban-data.js`
(`BOARDS` + `STAGE_SYNONYMS`) AND `src/components/KanbanBoard/index.tsx` (`BOARD_CONFIG`) in
lockstep, and update the boards table above. The two must agree on column ids.
