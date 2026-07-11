---
name: link-glossary-terms
description: Read a blog post and link the FIRST GENUINE (term-of-art) use of each defined glossary term to its definition — using judgment to tell a term-of-art ("Role" the CLI concept) from casual English ("role" in life), which a regex cannot. Use after writing/editing a post, or when the validate-glossary-links validator surfaces candidates. The validator + its warn-tier hook find candidates mechanically; THIS skill makes the semantic call and applies the link. Idempotent: never double-links. Pairs with author-post (MDX) and the /glossary home (the term registry + definitions).
---

# Link glossary terms (the semantic first-genuine-use linker)

The site has a single [Glossary](/glossary): ~19 defined terms of art (System, Service,
Library, Package, Initiative, Project, Role, Skill, Workflow, …), each with a definition page
under `/craft`. The convention: **the first time a post uses one of these as the TERM OF ART,
that occurrence links to its definition; later uses, and all casual-English uses, stay plain.**

The hard part is not finding the word — it is deciding whether *this* use is the term-of-art.
A regex cannot: "Role" is the CLI Role concept in one post and a person's role in life in
another; "Libraries" is the package sense or the building. So the mechanical
`validate-glossary-links` validator only finds **candidates**; this skill makes the **call**.

## The registry

`bytesofpurpose-blog/scripts/lib/glossary-terms.json` is the source of truth: each `term` →
its definition `href` (+ `aliases`, e.g. the plural). Read it first. It is kept in lockstep
with the `/glossary` home (`src/pages/glossary.mdx`).

## The rule (precise)

For a given post, for each registered term:

1. **Find the first occurrence** in the PROSE (ignore frontmatter, code fences, inline code,
   and text that is already a link).
2. **Judge it.** Is this occurrence the TERM OF ART as the glossary defines it — i.e. would a
   reader benefit from the definition here — or is it ordinary English that happens to share
   the word? Read the sentence and the surrounding context, not just the token.
   - Genuine (link it): "the scanner is one **Service** that calls another" (the architecture
     sense); "an **Initiative** is a goal-bearing effort" (the PM sense).
   - Casual (leave plain): "what **role** do you play in your family?"; "public **libraries**
     keep reading cheap"; "the **plan** for Saturday".
3. **Link only the FIRST genuine occurrence**, to the term's `href`:
   `[Service](/craft/software-development/terminology/terminology-portfolio)`. Keep the visible
   text exactly as written (including its capitalization/plural). Do NOT link later occurrences
   of the same term, and do NOT link casual uses.
4. **Skip personal/meta posts.** In `question-set`, `reflection`, `legend`, and `event-recap`
   posts these words are almost always casual; the validator already skips those kinds, and so
   should you unless a use is unmistakably the term-of-art.

## Applying it to a post

1. Run `node scripts/validate-glossary-links.js <path>` (or `make validate-glossary`) to get
   the candidate first-occurrences.
2. For each candidate, READ the occurrence in context and decide genuine vs casual.
3. For each GENUINE one not yet linked, edit that first occurrence into a markdown link to the
   term's `href`. Leave everything else.
4. Re-run the validator: a genuine term you linked drops off the `first-instance-unlinked` list;
   a casual one you (correctly) left plain stays as a candidate — that is expected, it is advice,
   not a defect. Note in your summary which candidates you judged casual so the next run is not
   re-litigated.

## Idempotency

Re-running must not double-link. Because step 3 only links an occurrence that is **not already
a link**, and only the FIRST genuine one, a second pass finds it already linked and does
nothing. The validator's `linked-more-than-once` finding catches an accidental double-link.

## Adding / moving a term

Update `scripts/lib/glossary-terms.json` (term + href + aliases) AND the `/glossary` home in
the same change. If a definition page moves, update the `href` there and pair the move with a
`{from,to}` redirect (the standard rule). The validator reads the JSON, so it stays in sync.
