# Authoring an `/initiatives` post (a temporal thing I DID)

**Home:** the Initiatives blog instance (`bytesofpurpose-blog/blog/`, route `/initiatives`; the
legacy `/blog/*` and `/thoughts/*` roots both redirect here). An initiative is **temporal and
acted-on** — a dated thing I did. Its frontmatter makes it a **kanban card** and/or a **hub card**.

**File:** `blog/YYYY-MM-DD-<kebab>.md` (usually `.md`; use `.mdx` if it embeds components).

## Pick the `kind:`

| kind | emoji | Use for |
|---|---|---|
| `project` | 🔨 | a build / project log |
| `tinkering` | 🔧 | a smaller hands-on experiment with a tool |
| `research` | 🔬 | a research write-up (also cards on the Research board) |
| `prompt` | 💬 | a reusable prompt / prompt-engineering log |
| `experiment-plan` | 📝 | an A/B or product experiment BEFORE results (flips to `experiment-result` 📊 when the Outcome lands) |
| `reflection` | 💭 | a dated reflection on work done |
| `event-recap` | 🎙️ | a recap of a talk/event |

Most of these carry an **`area:`** (`backend`/`frontend`/`script`/`plugin`) so they card on the
matching **hub** (`manage-hubs`). Experiments are their own lifecycle — see below.

## Frontmatter template

```yaml
---
slug: <kebab>                     # blog slug (no design-/topic prefix)
title: '🔨 <What I did — reads as a completed action>'   # kind emoji + action title
description: <50 to 160 chars; no em-dash; feeds og + share>
authors: [oeid]
tags: [<3-5>]
date: 2026-07-04                  # REQUIRED on blog posts (drives ordering + the timeline)
draft: true
kind: project
area: backend                     # for the hub
# --- kanban card fields, when it boards ---
board: ideas                      # or omit; boards are per the kind→board map
stage: backlog                    # backlog / in-progress / done (advancing = editing this)
priority: low
---
```

Body: intro → `<!-- truncate -->` → the log. Title VOICE matters — an initiative reads as what I
DID (`name-post`).

## Experiments have their own lifecycle

An experiment is ONE `/initiatives` post whose `stage` places it on the **Experimentation board**.
Do not hand-roll it — use the lifecycle skills in order: **`design-experiment`** (the plan) →
`run-ab-test` → `analyze-experiment` → `decide-experiment` → `conclude-experiment`. The `kind:`
flips `experiment-plan` → `experiment-result` when the Outcome lands.

## Concluding an initiative

When the work concludes, **distill the durable LEARNING up into `/craft`** (a `technique`/`pattern`/
`framework` doc) — the temporal log stays; the lasting lesson graduates. See the CLAUDE.md
durable-vs-temporal tenet + `groom-initiatives`.

## Validate + cross-links

- No em-dash; `date:` present; healthy `description:`. Gates: `make validate-seo`,
  `make validate-links`, `make validate-hubs` (if it cards on a hub), `make validate-naming`.
- `groom-initiatives` (board contract: kind/stage/priority, advancing, concluding) ·
  `manage-hubs` (the by-area hub) · the experiment-lifecycle skills · `name-post` ·
  `author-blog-post` (MDX/frontmatter) · `upgrade-post` (components).
