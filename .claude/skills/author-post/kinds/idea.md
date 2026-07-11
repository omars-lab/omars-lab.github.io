# Authoring an `idea` post (💡 a raw idea, unactioned)

An **idea** is the raw front of the idea-to-ship lifecycle: *something I might build or do, captured
before I've acted on it.* It is a **`/thoughts` post** (`kind: idea`), and — because ideas are the
thing I most want to track and revisit — it typically **cards on the Ideas board**
(`/craft/product-management/ideas`) via `board: ideas`.

> An idea GRADUATES when I act on it: it becomes an **`/initiatives`** post (a project/tinkering log
> — see `homes/initiatives.md`). If instead I keep it to shape how I think, it's a `/mindset`
> principle; if it distills into a lasting lesson, it goes to `/craft`. If the idea has ALREADY been
> acted on, it is not an idea anymore — author it as an initiative. Classify with `organize-post`
> when the graduation is unclear.

## The one thing to get right: title VOICE

An idea must read as an **OPEN QUESTION**, not a finished thing. This is the single most common
mistake and the `audit-post-names` audit is built to catch it.

- ✅ "Should I build a NotePlan plugin?" · "What if I auto-surfaced my other work streams?" ·
  "Is a menu-bar app worth it?"
- ❌ "My First NotePlan Plugin" · "Building a Menu-Bar App" · "A Work-Stream Auto-Surfacer"
  (these read as things I already built).

The full contract lives in **`mechanics.md` → "Naming"**. Run the audit with `make validate-naming`.
The `sidebar_label` should be the question's gist, even shorter (e.g. "NotePlan plugin?").

## Frontmatter template (a `/thoughts` idea that boards)

```yaml
---
slug: idea-<kebab>
title: 'Should I <...>?'          # reads as an open question (see Naming)
sidebar_label: '<Short?>'         # the question's gist
description: <50 to 160 chars; no em-dash; feeds og + share>
authors: [oeid]
tags: [ideas, <2-4 more>]         # 'ideas' is the always-on tag; the rest are THEME tags
date: 2026-07-11                  # REQUIRED on blog posts
kind: idea
board: ideas                      # → a card on the Ideas board (/craft/product-management/ideas)
stage: backlog                    # backlog / in-progress / done — advancing = editing this
priority: low                     # low / medium / high
draft: false
---
```

- **File:** `bytesofpurpose-blog/thoughts/YYYY-MM-DD-<kebab>.md` (`.mdx` only if it embeds a component).
- **`board: ideas` makes it a kanban card.** The board is generated from frontmatter — `stage` and
  `priority` place and rank it; you advance the idea by editing `stage`. The board contract (fields,
  the kind→board map, capture→advance→distill) is owned by **`groom-initiatives`**.
- **Every THEME tag on a board post needs a one-line gloss** in the tag registry
  (`src/lib/idea-tags.ts`, `IDEA_TAG_GLOSS`) in the SAME change — the CLAUDE.md "board tag tooltip"
  convention, enforced by `make validate-idea-tags` (warn-tier). The always-on `ideas`/`idea`/
  `thoughts` tags don't need a gloss; your added theme tags do.

## Outline (what the body needs)

The `idea` kind's only structural requirement (per `blog-kinds.json`) is a **non-empty
`description:`** (it powers the social card + share text). Beyond that an idea is deliberately light:
capture the idea, why it appeals, and what's unresolved. If the idea is still a raw braindump, run
**`mature-content`** first — it interview-drives a rough idea to board-ready (motivation, value,
scope, to-dos, success criteria) before you author.

## Validate + hand-offs

- Gates: `make validate-naming` (title voice), `make validate-idea-tags` (board tag glosses),
  `make validate-seo` (description health), `make validate-links`.
- **`organize-post`** — is this really an unactioned idea (vs a different thought kind, or already an
  initiative)? · **`mature-content`** — firm up a raw idea before authoring · **`groom-initiatives`**
  — the Ideas-board contract; boarding it, advancing it, concluding it · **`audit-post-names`** — the
  title-voice audit · **`mechanics.md`** — MDX/frontmatter/naming mechanics · **`homes/thoughts.md`**
  — the sibling thought kinds (simulation/prediction/critique/research/design-story) and the
  mindset/questions instances.
