---
name: prune-content
description: The classifier + disposition recipe for DEAD WEIGHT in the docs — the "should this exist at all?" pass, distinct from reorganize-content's "where does this go?". Detects the useless-content signals (an empty-except-heading stub, a doc whose title/label DUPLICATES its parent group, an orphan _category_.json with no docs, a page superseded by another, a near-duplicate, a doc with no inbound links) and decides a disposition per finding — DELETE (only when you can name where every line went), FOLD UP into the parent/sibling, REVIVE (it's captured intent, not dead), or LEAVE (with a note). Honors the hard tenet "removing a file is a SMELL": a thin draft with a TODO/checklist is CAPTURED INTENT and is kept, not pruned. Use when the user says "clean up / prune / this is useless / is this still needed / find dead docs / this is redundant", or a reorg leaves a stub behind. Pairs with reorganize-content (which MOVES the good stuff and often leaves stubs to prune), organize-post (classify what a live doc is), and review-reader-experience (the IA audit that surfaces mis-homed/orphan docs).
---

# Prune content (find dead weight → decide its fate)

`reorganize-content` moves GOOD content to the right home. This skill asks a different question of a
doc: **should it exist at all?** It is the cleanup pass — and it is where the repo's hardest tenet
bites: **removing a file is a SMELL.** Most "useless-looking" docs are NOT deletes; they are folds,
revives, or leaves. The whole skill is about telling those apart, so a cleanup never silently loses
work.

## The one distinction that matters: DEAD vs CAPTURED INTENT

A thin/empty doc is one of two very different things:

- **CAPTURED INTENT** — a `draft: true` placeholder with a TODO, a checklist, a link to chase, a
  heading + one bullet of "what I want to write here." This is a PLAN, not dead weight. **Keep it**
  (or REVIVE it via `mature-content`). Deleting it loses the intent. Most thin drafts are this.
- **DEAD** — content whose purpose is GONE: an empty shell left after its real content MOVED
  elsewhere (name where), a duplicate fully superseded by another page, a stub that was never more
  than a heading AND has no plan in it. **This** is what prunes.

> The worked example: `workspace/setup/README.md` was DEAD — a `# Workspace` heading with no body,
> whose one-time content (a project log) had already moved to `/initiatives`, and whose title
> duplicated its parent group. Contrast `entrepreneurship/learning-business.md` — also thin, also
> draft, but it carries "What can I learn about business?" + a video to watch = CAPTURED INTENT, so
> it stays. Same thinness, opposite disposition.

## Detection signals (where dead weight hides)

Run these to build a candidate list — then CLASSIFY each (most candidates are keeps):

- **Empty-except-heading stub.** Body is just a `# Title` (0–1 real lines, no TODO/plan). `awk` the
  post-frontmatter body, strip blank + `#` lines, count what's left.
- **Title/label DUPLICATES the parent group.** A doc titled "Workspace" inside the `workspace/`
  group (renders "Workspace → Workspace" in the sidebar) — a leftover shell or a mis-scoped landing.
- **Orphan `_category_.json`.** A folder with a category label but NO `.md`/`.mdx` docs and no
  subfolders — renders an empty sidebar section. (Distinct from a folder that legitimately holds only
  subfolders.)
- **Superseded / near-duplicate.** Two docs covering the same ground after a merge that half-finished
  (e.g. an old page whose content was folded into a new one but the old file survived). `grep` a
  distinctive sentence across `docs/`.
- **No inbound links + stale draft.** A `draft: true` doc nothing links to, untouched for a long
  time, with no plan in the body — a candidate, but confirm it's not simply "not written yet."
- **Left-behind shell after a move.** After a `reorganize-content` pass, the source folder often
  keeps an empty `_category_.json` or a pointer README whose target moved — the classic prune.

## The disposition (decide one per finding)

For each candidate, pick ONE and record WHY:

1. **REVIVE** — it's captured intent worth finishing. Hand to `mature-content` (the interview that
   fills it out). Default for a thin draft with a plan.
2. **FOLD UP** — its little content belongs in the parent/sibling. MOVE the content across (prove the
   fold: `grep` a phrase in the target), then remove the now-empty file. Redirect its URL if it was
   published. This is a `reorganize-content` merge — hand off or follow that recipe.
3. **LEAVE (with a note)** — thin but legitimate (a category README that's meant to be short, a
   prompt doc that embeds a component, a genuinely-not-written-yet placeholder you're keeping). Do
   nothing; optionally note it so the next pass doesn't re-flag it.
4. **DELETE** — ONLY when the content is genuinely dead AND you can NAME where it went (or that there
   was nothing: "never had a body; its former content moved to X in PR #N"). This is the smell path —
   justify it out loud before doing it.

**The delete guard (say all three before `git rm`):** (a) the body has no content worth keeping and
no captured plan; (b) you can name where any former content went, or confirm there never was any
(check `git log -p` for the file); (c) removing it loses nothing a reader or future-you would want.
If you can't say all three, it's a REVIVE/FOLD/LEAVE, not a delete.

## Mechanics of a prune (once you've decided DELETE or FOLD)

- **DELETE a draft:** `git rm` the file (+ its `_category_.json` if the folder empties), `rmdir` the
  folder. A `draft: true` doc has NO public URL, so it needs NO redirect (and the redirect gate
  REJECTS a draft target anyway). Verify no other doc links to it (`grep -rn "<slug>" docs/ src/`).
- **DELETE a PUBLISHED doc:** rare — prefer FOLD. If truly dead, `git rm` it AND add a `{from,to}`
  redirect to the most-relevant surviving page (a dead published URL must not 404). This is the
  `reorganize-content` redirect recipe (repoint/collapse chains too).
- **FOLD:** follow `reorganize-content` step 5 (move content across, prove the fold, remove the
  shell, redirect if published).
- **Then validate:** `( cd bytesofpurpose-blog && npm run generate-assets )` → `make validate-redirects`
  → `make validate-structure` → `make build` (empty "Broken links" list). An orphan-category removal
  or a stub delete should leave all green.

## What NOT to prune (false positives)

- A thin `README.md` that is a **topic/category LANDING** (its job is a short intro + the sidebar
  tree does the rest).
- A **prompt / showcase** doc that looks thin because it EMBEDS a component or a code block (the
  value is the embed, not the prose).
- A `draft: true` with a **TODO/checklist/plan** — captured intent (REVIVE, don't delete).
- A folder that holds **only subfolders** (not an orphan — it's a grouping node).
- Anything you can't name a replacement for. When unsure: LEAVE and ask.

## Verify + ship
- `make build` with an empty "Broken links" list; `make validate-redirects` clean.
- For each DELETE, the commit message NAMES where the content went (or that it never had any) — the
  audit trail that keeps the smell honest.
- Standing workflow: branch → PR (list each finding + its disposition + the evidence) → ask to merge.

## Pairs with
`reorganize-content` (a prune often becomes a FOLD/move; a move often LEAVES a stub to prune —
they're two ends of the same cleanup); `organize-post` (to re-classify a doc you're unsure about
before deciding its fate); `mature-content` (the REVIVE path for captured intent);
`review-reader-experience` (the IA audit that surfaces orphans + mis-homed docs to prune).
