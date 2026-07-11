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

Most of these carry an **`area:`** so they card on the matching **hub**. Experiments are their own
lifecycle — see below.

## Card it on a hub (the per-post contract)

A **hub** is a durable `/craft` index page that gathers all the `/initiatives` logs of one activity
`kind` and lays them out by area. A post cards on its kind's hub the moment it carries the two
fields:

- **`kind:`** — the activity, and the hub discriminator (`project` → Projects hub, `tinkering` →
  Tinkering, `research` → Research, `prompt` → Prompts).
- **`area:`** — the DOMAIN it groups under. **ONE unified field** (not a per-hub `*_area`), with a
  fixed vocabulary: **`backend` / `frontend` / `script` / `plugin`** (anything else falls into
  `other`). Moving a post between areas is a one-field `area:` edit and it re-sorts on the hub
  automatically, so the hub can never drift from its entries.

After adding/changing `kind`+`area`, run `make generate-assets` (rebuilds the hub JSON) then
`make validate-hubs` (it names the exact file if an `area:` is missing or invalid).

**Re-homing a mis-filed durable doc onto a hub.** If a dated log was mis-filed as a durable `/craft`
doc, move it into `blog/`: a SURGICAL frontmatter reshape (slug → bare, ensure `date:`, set `kind:`,
add `area:`) + `git mv` into `blog/` as `YYYY-MM-DD-<slug>`. **Never a gray-matter reserialize** — it
escapes emoji titles (`\U0001F528`); rewrite only the changed keys by hand. An all-draft move needs
no redirect (a draft has no public `/craft` URL, and the redirect gate rejects a draft target); add
the `{from,to}` redirect when the post is published. This is a `reorganize-content` move.

> **Adding a NEW hub** (a new activity index page, not just carding a post on an existing one) is a
> structural op owned by **`manage-hubs`** — the `HUBS` registry, the generator + `<Catalog>`
> component, the add-a-hub checklist. This guide covers only putting a POST on a hub that exists.

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
DID (`audit-post-names`).

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
  `manage-hubs` (the by-area hub) · the experiment-lifecycle skills · `audit-post-names` ·
  `author-post` (MDX/frontmatter) · `upgrade-post` (components).
