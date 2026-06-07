---
name: refresh-references
description: Refresh the reference carousels on a blog post by appending cards to its data file in src/data/references/, without editing the post body. Use when the user finds a new book, blog, course, video, paper, repo, or other resource worth adding to a post's carousels, when a reference JSON is flagged stale by validate-references, or when reconciling a post's references against its personalbook source note. Keeps source->JSON provenance so the freshness check stays accurate.
---

# Refresh References

## Your Role

You keep the **living reference lists** on blog posts current. Many posts render
horizontally-scrollable carousels of resources (books, courses, blogs, papers, …)
whose data lives in JSON, not in the post body. Your job is to add newly-found
resources to those JSON files, keep each file's provenance pointing at the source
note it was abstracted from, and confirm the post still renders.

You never rewrite the post's prose to add a link. A reference is data; it goes in
the data file.

## The architecture (know this first)

| Piece | Path | Role |
|-------|------|------|
| **Carousel** | `src/components/Carousel/` | Generic, dependency-free (CSS scroll-snap) horizontally-scrollable cards. |
| **CategoryCarousel** | `src/components/CategoryCarousel/` | `<CategoryCarousel topic="..." category="..." />` — looks a category up in the data and renders a Carousel. Posts use this. |
| **References data** | `src/data/references/` | One JSON per topic, consolidated here for ALL posts. `index.ts` is the registry. |
| **Freshness check** | `.claude/scripts/validate-references.sh` | Flags a JSON as STALE when its source note got new commits after the JSON's `source_commit`. |

A post pulls cards with `<CategoryCarousel topic="learning-resources" category="books" />`.
That reads `src/data/references/learning-resources.json` → the `books` array. To add
a card, you append to that array. **The post body never changes.**

### Data file shape

```json
{
  "_provenance": {
    "source": "<repo-relative path in personalbook>",
    "source_commit": "<commit the JSON was last reconciled against>",
    "note": "what was abstracted / what was deliberately left private"
  },
  "books": [
    { "title": "...", "description": "...", "meta": "domain.com", "href": "https://..." }
  ],
  "courses": [ ... ]
}
```

- Each non-`_provenance` key is a **category**; its value is an array of cards.
- A card: `title` (required), `description`, `meta` (small footer, e.g. a domain),
  `href` (makes the whole card a link; external hrefs open in a new tab).
- `_provenance` ties the file back to the personalbook note it was abstracted from,
  so `validate-references.sh` can tell when the source moved on.

## When to use

- "Add this blog/book/course to the learning-resources post."
- "I found a new reference for <post> — put it in the carousel."
- `validate-references` flagged a file STALE → reconcile it against its source.
- Standing up references for a **new** post (create the topic JSON + register it).

## Adding references to an existing topic

1. **Find the topic file** in `src/data/references/` (e.g. `learning-resources.json`).
   The post tells you the topic key via its `<CategoryCarousel topic="..." />` tags.
2. **Append the card(s)** to the right category array. Create the category key if it
   doesn't exist yet (and add a `<CategoryCarousel category="<new>" />` in the post
   only if you're introducing a brand-new section — otherwise leave the post alone).
3. **Privacy gate (important).** These JSONs are PUBLIC. When pulling cards from a
   personalbook source note, include only **public, non-personal** resources (URLs,
   public figures, published works). Never copy named private contacts, personal
   to-dos, dated personal annotations, or anything tied to a specific private
   person/event. (This mirrors the `scan-blog-worthy` personal-vs-public line.)
4. **Re-stamp provenance** if you reconciled against the source: set
   `_provenance.source_commit` to the source note's current commit
   (`git -C <personalbook> log --format='%H' -1 -- "<source>"`).
5. **Validate + verify render:**
   ```bash
   .claude/scripts/validate-references.sh   # expect: fresh, 0 errors
   npm run start -- --no-open               # confirm the post's carousels still render
   ```

## Reconciling a STALE file

`validate-references.sh` warns `STALE: N commit(s) touched '<source>' since
source_commit …` when the source note grew but the JSON didn't. To reconcile:

1. Diff the source note since `source_commit` to see what was added:
   `git -C <personalbook> diff <source_commit> HEAD -- "<source>"`.
2. Pull any **new public resources** into the matching category arrays (privacy gate
   above still applies).
3. Re-stamp `_provenance.source_commit` to the source's current commit.
4. `.claude/scripts/validate-references.sh` → should report the file fresh again.

## Standing up references for a new post

1. Create `src/data/references/<topic>.json` with a `_provenance` block and your
   category arrays.
2. Register it in `src/data/references/index.ts`: import the JSON and add it to the
   `references` map under the topic key.
3. In the post (`.mdx`, not `.md` — carousels need component imports), add
   `import CategoryCarousel from '@site/src/components/CategoryCarousel';` and drop
   `<CategoryCarousel topic="<topic>" category="<cat>" />` under each section.
4. Validate + render as above.

## Guardrails

- **Never edit the post body to add a reference.** Data goes in the data file.
- **Public only.** The JSONs ship to the public site; apply the personal-vs-public
  line from `scan-blog-worthy`. When unsure, leave it out.
- **Keep provenance honest.** If you reconcile a file against its source, re-stamp
  `source_commit`. A wrong commit makes the freshness check lie.
- **`.md` can't import components.** A post that needs carousels must be `.mdx`.
- Verify the render after changes — a malformed JSON or a missing category silently
  yields an empty carousel.

## Learnings log

Newest first. One line each: date — what changed — why.

- 2026-06-06 — Created the skill + `src/components/Carousel`,
  `src/components/CategoryCarousel`, `src/data/references/` (consolidated, one JSON
  per topic, provenance-tracked), and `validate-references.sh` which flags a JSON
  stale when its personalbook source got commits after `source_commit`. First topic:
  `learning-resources` (19 public links abstracted from The Learner's note; named
  mentors kept private). — User wanted post reference lists to be refreshable
  without editing the post, consolidated under one references dir, with a hook that
  detects when the source changed and the JSON needs updating.
