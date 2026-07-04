# Authoring a `/journey` doc

**Home:** the Journey docs instance (`bytesofpurpose-blog/docs/journey/…`, route `/journey`; the
plugin `id` is still `'self'` internally, and old `/self/*` URLs 301 to `/journey/*`). Journey is
the durable **"what drives me forward / why I build"** — the inward why, the counterpart to Craft's
outward how.

## It shares Craft's docs mechanics

Journey is a docs instance with the **same topic-folder contract, slug rule, and validators** as
Craft. **Read `homes/craft.md` for the mechanics** (topic README + `_category_.json`, absolute
instance-relative slug, kebab names / no numeric prefix, `{from,to}` redirect on a move, the gates).
Only two things differ:

1. **The nature of the content.** Journey holds the inward "why": faith, principles that drive the
   work, what building means. If a piece is really an outward "how I do the work" learning, it
   belongs in `/craft`, not here — classify with `organize-post` when unsure.
2. **The topics/areas.** Journey's topics are **faith, personal-growth, entrepreneurship,
   productivity**. Slugs are instance-relative to the journey root (`slug: /faith/x` → `/journey/faith/x`).

## Frontmatter template

```yaml
---
title: '<The lasting "why" — a driver, a conviction, a lesson>'
description: <50 to 160 chars; no em-dash; feeds og + share>
slug: /<topic>/<kebab>            # ABSOLUTE + INSTANCE-RELATIVE (no /journey prefix)
kind: reflection                  # or framework/reference as fits; see homes/craft.md table
authors: [oeid]
tags: [<topic>, <2-4 more>]
---
```

## The other durable roots

`/knowledge` (durable mental models) and `/habits` (habitual practices) are ALSO sibling durable
docs roots with this same shape — author them per `homes/craft.md` too. Adding, renaming, or
splitting a whole root instance is a bigger operation owned by **`manage-docs-instances`** (the
8-touchpoint registration checklist).

## Cross-links

`homes/craft.md` (the shared docs mechanics) · `organize-post` (durable why vs how) ·
`manage-docs-instances` (root-level changes) · `reorganize-content` (moves) · `author-blog-post`.
