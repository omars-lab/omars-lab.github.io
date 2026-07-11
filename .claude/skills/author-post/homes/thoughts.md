# Authoring a `/thoughts`, `/mindset`, or `/questions` post (a temporal thought)

These three blog instances hold the **temporal thought and its curated forms**. The dividing line
is **occurrence vs. curation**:

- **`/thoughts`** — an idea/question that just **OCCURRED to me** and I have NOT acted on (the raw
  mental event). Files: `bytesofpurpose-blog/thoughts/YYYY-MM-DD-<kebab>.md`.
- **`/mindset`** — a thought I deliberately **KEEP to shape how I think** (curated inputs). Files:
  `bytesofpurpose-blog/mindset/…`.
- **`/questions`** — a deliberate **SET of questions** I ask. Files: `bytesofpurpose-blog/questions/…`.

If the thought has been **acted on**, it is not a thought anymore — author it as an `/initiatives`
post (`homes/initiatives.md`). If it distilled into a lasting lesson, it goes to `/craft`. Classify
with `organize-post` when the graduation is unclear.

## Pick the `kind:` (each carries exactly one collection flag)

| kind | emoji | Home | It is… |
|---|---|---|---|
| `idea` | 💡 | `/thoughts` | an idea that occurred to me (unactioned) |
| `simulation` | 🔮 | `/thoughts` | a "what if I ran this forward" thought |
| `prediction` | 🎯 | `/thoughts` | a dated prediction |
| `critique` | 🔍 | `/thoughts` | a critical read of something |
| `research` | 🔬 | `/thoughts` | an open research thread (also boards) |
| `design-story` | 📐 | `/thoughts` | a narrative about a design (points to the HLD in `/designs`) |
| `quote-set` | 🗣️ | `/mindset` | a curated set of quotes that moved me |
| `principle` | 🪞 | `/mindset` | a principle I live by |
| `question-set` | ❓ | `/questions` | an important set of questions |

## Title VOICE — the #1 tell to get right

An unactioned thought must read as an **OPEN QUESTION**, not a finished thing. "Should I auto-surface
my other work streams?" — NOT "My work-stream auto-surfacer". Titling an idea like a completed
initiative is the classic mismatch `validate-naming` + `audit-post-names` catch. Run **`audit-post-names`** when titling.

## Frontmatter template (a `/thoughts` idea; boards as an Ideas card)

```yaml
---
slug: idea-<kebab>
title: 'Should I <...>?'          # reads as an open question
sidebar_label: '<Short?>'
description: <50 to 160 chars; no em-dash; feeds og + share>
authors: [oeid]
tags: [ideas, <2-4 more>]
date: 2026-07-04                  # REQUIRED
kind: idea
board: ideas                     # → a card on the Ideas board (/craft/product-management/ideas)
stage: backlog
priority: low
draft: false
---
```

Any theme tag you put on a `board:`-carrying post needs a one-line **gloss** in the tag registry
(`src/lib/idea-tags.ts`) in the same change — the CLAUDE.md "board tag tooltip" convention.

## Mindset + Questions specifics

- **Mindset quotes** use the quote kit (`<EditorialQuote>`/`<PosterQuote>`/`<QuoteSet>` — see
  `upgrade-post`). Settle attribution HONESTLY first (`verify-quote-attribution`) and, if adding a
  `video=`, verify the link (`find-quote-video`).
- **Questions** use the question-set kit (`<Question>` cards + badges, `<QuestionSection>` — see
  `upgrade-post`).
- Each instance has a reader legend that teaches the boundary by example
  (`/thoughts/about-my-thoughts`, `/mindset/about-my-mindset`, `/questions/about-my-questions`).

## Validate + cross-links

- No em-dash; `date:` present; healthy `description:`; title-voice via `audit-post-names`.
  Gates: `make validate-naming`, `make validate-seo`, `make validate-idea-tags` (board posts),
  `make validate-links`.
- `organize-post` (which thought kind / has it graduated?) · `mature-content` (firm up a raw idea) ·
  `groom-initiatives` (board an idea, advance it) · `upgrade-post` (quote/question kits) ·
  `audit-post-names` · `verify-quote-attribution` + `find-quote-video` (mindset) · `author-post`.
