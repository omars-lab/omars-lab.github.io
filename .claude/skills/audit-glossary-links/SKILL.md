---
name: audit-glossary-links
description: AUDIT a post (or the corpus) for glossary terms whose FIRST genuine term-of-art use is not linked to its definition — file-level triage that surfaces candidates. This skill is the AUDITOR; the linking CONTRACT it checks against (the first-genuine-use rule, the registry, the judgment calls, idempotency) lives in the author-post skill (mechanics.md, "Glossary linking"). Runs `validate-glossary-links.js` (`make validate-glossary`) + the warn hook. Use after writing/editing a post, or when the validator surfaces candidates. To DECIDE + APPLY a link (the semantic per-occurrence call), use author-post. Pairs with author-post (the contract + authoring), validate-links (general link hygiene), and the /glossary home (the term registry + definitions).
---

# Audit glossary links (which posts have an unlinked term-of-art first-use?)

This skill AUDITS. It answers one question: **does a post link the FIRST genuine (term-of-art) use
of each defined glossary term to its definition?** The mechanical check finds *candidates* — a
first-occurrence of a registered term that isn't a link — and it's a warn-tier reminder, because
telling a term-of-art ("Role" the CLI concept) from casual English ("role" in life) needs a semantic
read a regex can't do.

> **The CONTRACT lives in `author-post`.** The precise first-genuine-use rule, the registry
> (`scripts/lib/glossary-terms.json`), the genuine-vs-casual judgment calls, the skip-personal-posts
> rule, and idempotency are in **`author-post/mechanics.md` → "Glossary linking"** (linking a term
> while writing is a creation-time concern, so the rule lives with the authoring skill). To DECIDE
> and APPLY a link, open `author-post`; to AUDIT which posts still need one, stay here.

## Run the audit

```bash
make validate-glossary                          # whole corpus (the configured DIRS)
node scripts/validate-glossary-links.js <path>  # a single post
```

`validate-glossary-links.js` + the warn-tier PostToolUse hook
`.claude/hooks/validate-glossary-links-hook.sh` report each post's `first-instance-unlinked`
candidates (and a `linked-more-than-once` finding if an occurrence got double-linked). It skips the
kinds where these words are almost always casual (`question-set`/`reflection`/`legend`/`event-recap`)
and ignores frontmatter, code fences, inline code, and existing links.

**Warn-tier only** — it never blocks; the call is a judgment, the check is a reminder.

## Triage a finding

1. For each candidate, READ the occurrence in context (per `author-post/mechanics.md` → "Glossary
   linking"): is it the term-of-art, or ordinary English?
2. **Genuine + unlinked** → edit that first occurrence into a link to the term's `href`. Apply it
   per the contract in `author-post` (keep the visible text, link only the first, never double-link).
3. **Casual** → leave it plain. It stays a candidate on the next run; that's expected. **Note in
   your summary which candidates you judged casual** so the next audit isn't re-litigated.
4. **`linked-more-than-once`** → remove the extra links; only the first genuine use links.

## Extending the audit

Adding/moving a term edits `scripts/lib/glossary-terms.json` AND the `/glossary` home
(`src/pages/glossary.mdx`) in the same change; the validator reads the JSON so it stays in sync. The
rule the validator encodes and the contract in `author-post/mechanics.md` must not drift — update
both in lockstep.

## Relationship to the other skills

- **`author-post`** owns the linking CONTRACT (mechanics.md → "Glossary linking") + the act of
  applying a link while writing. This skill is the audit half that references it.
- **`validate-links`** is the general link-hygiene linter (bare/long/tracking/broken links); this
  skill is specifically the glossary first-use check.
- The **`/glossary`** home is the reader-facing registry + the definition pages the links point to.
