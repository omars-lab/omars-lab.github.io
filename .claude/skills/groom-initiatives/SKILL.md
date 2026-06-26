---
name: groom-initiatives
description: Capture and advance a temporal initiative (an idea, experiment, or project) as an /initiatives blog POST whose frontmatter drives a kanban board — NOT a /craft doc. Use when starting a new idea/experiment, moving a card across a board (a `stage` frontmatter change), or concluding one and distilling the durable learning back into /craft. Board-aware: knows the Experimentation + Ideas boards, their columns, and the kind→board mapping. Pairs with the experiment-lifecycle skills (design/run/analyze/decide/conclude-experiment) which drive the Experimentation board specifically, and with author-blog-post (MDX/frontmatter pitfalls).
---

# Groom initiatives (board-aware capture + advancement)

The site is split **durable vs temporal** (see the Legend hub, `/legend`):

- **`/craft` (+ `/journey`) = DURABLE** — distilled learnings, frameworks, strategy. The
  lasting lesson.
- **TEMPORAL = two blogs, split by whether I have ACTED on the idea yet:**
  - **`/thoughts` (Thoughts & Ideas) = UNACTIONED** — ideas I have HAD but not acted on
    (captures, "should I…", not yet materialized). A candidate, not a commitment.
  - **`/initiatives` (the blog) = ACTED-ON** — the dated things actually done: experiments,
    project logs, posts. Each links **up** to the durable Craft insight it informed.

An idea **graduates** from `/thoughts` to `/initiatives` the moment work begins on it. So a raw
**unactioned idea is a `/thoughts` post**; an **acted-on experiment/project is an `/initiatives`
post**; neither is ever a `/craft` doc. Its frontmatter makes it a **card on a kanban board** (the
boards live in `/craft`, durable; the posts live on the blogs, temporal); advancing the work =
editing one frontmatter field. This skill is the contract for that lifecycle.

## The boards (the board-aware part)

Cards are generated from post frontmatter by `scripts/generate-kanban-data.js`
(`npm run generate-assets` → the gitignored `src/components/KanbanBoard/kanban-data.json`);
the `<KanbanBoard board="…"/>` component renders them. **Never hand-edit kanban-data.json** —
it regenerates (the `block-generated-edits` hook refuses writes to it). To move a card, edit
the POST.

| Board | Lives at | A card is a post (in…) with… | Columns (the `stage` values) |
|---|---|---|---|
| **experiments** | `/craft/product-management/experiments` | an `/initiatives` post, `kind: experiment-plan` 📝 / `experiment-result` 📊 | `proposed` → `designed` → `running` → `analyzing` → `concluded` |
| **ideas** | `/craft/product-management/ideas` | a **`/thoughts`** post + explicit `board: ideas` frontmatter | `backlog` → `exploring` → `building` → `shipped` |

The generator (`generate-kanban-data.js`) scans BOTH blog dirs: `blog/` (→ `/initiatives`, the
experiment posts) and `thoughts/` (→ `/thoughts`, the idea posts), and links each card to the
right instance. A post opts into a board by its **kind** (experiments) or an explicit
**`board: ideas`** (ideas) — never by accident. A `kind: experiment-result` post always shows in the terminal
`concluded` column regardless of `stage`. Unknown/empty `stage` → the board's first column.
(Synonyms are accepted, e.g. `draft`→`designed`, `live`→`running`, `done`→`concluded`,
`wip`→`building` — see the generator's `STAGE_SYNONYMS`.)

## The kinds of a Thought (the /thoughts taxonomy)

A `/thoughts` post is an UNACTIONED thought, and there are KINDS of thought — set by the post's
`kind:` frontmatter (the same kind system the rest of the site uses; the source of truth is
`scripts/lib/blog-kinds.json`, where each thought kind carries `thought: true` + a `thoughtGloss`,
and the validator + the `<ThoughtKindLegend>` render from it):

| `kind:` | Emoji | The thought is… |
|---|---|---|
| `idea` | 💡 | something I might build or do (also the `board: ideas` kind) |
| `question-set` | ❓ | a set of questions I ask myself (the question-set kit + the Legend) |
| `simulation` | 🔮 | a hypothetical walk-through ("if X then Y then Z; what if 1,2,3") |
| `prediction` | 🎯 | a falsifiable bet about the future |
| `critique` | 🔍 | an evaluation of something that exists (what's wrong / how it works) |
| `principle` | 🪞 | an observation maturing into a rule (the raw feeder for a durable Craft lesson) |
| `design-story` | 📐 | how something would be structured (the shipped HLD lives in `/designs`) |

The `/thoughts` landing (`/thoughts/about-my-thoughts`) is the reader-facing legend. When you
publish or classify a `/thoughts` post, set the most specific kind; an `idea` graduates to an
`/initiatives` project when acted on, a `principle` graduates UP into `/craft` when it holds. The
**`organize-post`** skill classifies an arbitrary post into the right home + kind.

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

1. **Capture.** A new UNACTIONED idea is a NEW **`/thoughts`** post (`board: ideas`); a new
   experiment/acted-on initiative is a NEW **`/initiatives`** post. (Start from the
   `author-blog-post` skill for the MDX/frontmatter pitfalls.) Set `kind` + `stage` (first
   column) + `priority`. Publish when it's real enough to show. When an idea moves from "thought
   about" to "working on it," MOVE the post `blog/` ↔ `thoughts/` and pair the move with a
   `{from,to}` redirect (the move/split-don't-delete + redirect rules).
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
