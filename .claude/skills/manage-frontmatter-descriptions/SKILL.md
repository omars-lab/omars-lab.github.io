---
name: manage-frontmatter-descriptions
description: Draft, refresh, and heal the frontmatter `description:` of docs/blog pages on the Bytes of Purpose site — the field that powers BOTH the og:description SEO/social card AND the ShareButton share message ("Here's what it covers: <description>"). Use when a page is missing a description, the structure validator flags description-length/duplicate, or you want to preview/tune how a page reads when shared. Pairs with author-post (writing), validate-docs-structure (the audit), and the ingress-attribution ShareButton (the consumer).
---

# Manage frontmatter descriptions

The `description:` frontmatter is a **dual-purpose, ~50–160-char summary**. It feeds:

1. **SEO / social** — emitted as `og:description` + `<meta name="description">` in the
   built HTML (search snippet + LinkedIn/X/Slack link-preview card).
2. **The share message** — ShareButton (the ingress-attribution layer) composes
   `Hey, check out this post I came across: "<title>". Here's what it covers: <description>.`
   as the **email body and X tweet text**. A weak/missing description = a weak share.

This skill does the **judgment** a validator can't: write a good summary, preview exactly
how it reads when shared, and batch-heal flagged pages. The mechanical audit (which pages
are flagged, and why) comes from `validate-docs-structure.js`; the share output comes from
`preview-share-message.js` (parity with the real `ShareButton`). Source of truth for the
share wording: `bytesofpurpose-blog/src/components/ShareButton/index.tsx` (`composeMessage`)
and `src/ingress-attribution-plan.md`.

## The contract (matches the validator, keep in sync)

| Rule | Tier | What it means |
|---|---|---|
| `description-missing` | warn | no `description:` — share message is title-only, SEO card is auto-extracted |
| `description-length` | warn | outside **50–160 chars** — under 50 is too thin; over 160 is truncated in cards |
| `description-duplicate` | warn | identical `description:` reused across pages — each page needs a distinct summary |

Constants live in `bytesofpurpose-blog/scripts/validate-docs-structure.js`
(`DESC_MIN=50`, `DESC_MAX=160`). If you change a bound, change it there (the validator is
the enforcer) and in `scripts/preview-share-message.js` (the previewer), in lockstep — per
the repo's "structure decisions must update the structure checks" convention.

## Tools this skill drives

- **Audit** — `node bytesofpurpose-blog/scripts/validate-docs-structure.js | grep description-`
  (or `make validate-structure`). Lists every flagged page with the reason + char count.
- **Preview** — `node bytesofpurpose-blog/scripts/preview-share-message.js <file> [more…]`
  Shows the resolved title/summary, the **exact** friendly message, the email/X/LinkedIn
  intent URLs a page produces, and the 50–160 length verdict. This is parity code with
  `ShareButton` — use it to tune a description for how it actually reads when shared, not
  guess. Run it after editing a description to confirm the result.

## Writing a good description (the judgment part)

A description should read well **in all three places at once** — search snippet, link-card,
and the spoken-aloud share message. Guidelines:

- **50–160 chars.** Aim ~90–140: long enough to be a real summary, short enough to survive
  the card truncation.
- **Reads after "Here's what it covers:"** — the ShareButton prefix. So write the *topic*,
  not a sentence that assumes a lead-in. "Key terms for understanding companies from the
  inside — levels, competencies, and culture" reads cleanly; "In this post I will…" does not.
- **Distinct per page** — never reuse the same description across pages (kills both SEO and
  the share message). The duplicate check flags these.
- **No trailing period needed** — ShareButton strips one trailing `.` before re-adding it;
  either way is fine, but don't end with `…` (truncation marker).
- **Match the page** — it's a summary, not a tagline. Pull the real subject from the H1 +
  opening. Reuse `author-post` frontmatter conventions for everything else.

## Workflows

### 1. Heal a single page (missing / too-short / too-long)
1. `node scripts/preview-share-message.js <file>` — see the current verdict + how it shares.
2. Read the page (H1 + opening paragraphs) and write a 50–160-char `description:` in the
   frontmatter that summarizes the real content.
3. Re-run the preview — confirm `✓ … in the 50–160 range` and that the friendly message
   reads naturally.
4. Re-run the validator on the repo — confirm the page no longer appears in `description-*`.

### 2. Batch-heal the flagged corpus
1. `node scripts/validate-docs-structure.js | grep 'description-'` — the work list
   (currently ~55 length + ~15 duplicate; 0 missing — coverage is complete, this is
   quality/length/dedupe work, not gap-filling).
2. Work top-down; for each page run workflow 1. Prioritize `description-missing` (none today),
   then `description-duplicate` (worst for SEO — pages compete), then `description-length`.
3. After a batch, re-run the validator and confirm the count dropped; spot-check 2–3 with the
   preview script.

### 3. Tune a description for sharing
When a page will be actively shared, run the preview and read the **X tweet text** and
**email body** aloud. If "Here's what it covers: <summary>" sounds awkward, rewrite the
summary — the description is the single lever for all share channels. (LinkedIn composer
opens blank by design — it renders from OG tags, so the description still matters there.)

## Verification (always prove, don't assert)

Per the repo tenet (`always-prove-and-test`): never claim a description is "fixed" — prove it.
The runnable proof is the two scripts: the validator must stop flagging the page, and the
preview must show the `✓` verdict + a clean message. Show that output, don't summarize it.

## Related

- `author-post` — frontmatter + MDX rules for the rest of the page, AND owns the topic-folder
  contract (`homes/craft.md`) that includes these description rules.
- `review-reader-experience` — the IA audit; `validate-docs-structure.js` (which it audits with)
  is the validator that emits these description findings.
- `validate-links` — sibling link-hygiene lint.
- Consumer: `src/components/ShareButton/` + `src/ingress-attribution-plan.md`.
