# Plan: Post-session cleanup — consolidated to-do queue + /loop prompt

## Context
This session accumulated several in-flight edits and a stream of new requests. Per the user's
instruction, this plan **consolidates everything still to do** into one actionable queue and ends
with a **`/loop` prompt** to run as a post-session cleanup pass (one task per iteration, verify,
commit, advance; stop at explicit gates). It complements two sibling plans:
- `compressed-greeting-quasar.md` — the broad "meh→great" structural/polish plan (Tracks A/C done,
  B done-uncommitted, G3 audit done).
- `blog-content-review.md` — all CONTENT work, **on hold** (publish sprint, blog revival, voice).
- `reader-experience-audit-2026-06-01.md` — the audit report feeding both.

**Standing rule (memory `prefer-reader-facing`):** always choose reader-facing labels over
builder words — apply, don't just propose.

## State at session end (what's already committed vs. pending)
- ✅ COMMITTED on `feat/ingress-attribution`: Track A avatar (`499c802e`), Track C bare-urls (`620fe909`).
- 🟡 DONE, UNCOMMITTED (in working tree):
  - **Navbar reader-facing** (`docusaurus.config.js`): `Changelog`→"What's New", `Designs`→
    "System Designs", `Components` REMOVED from navbar → added to footer "Other Works" as
    **"Blob UI Kit Building Blocks"** (`/storybook/`). Config parses ✓.
  - **Slug typo fix**: `my-problem-sovling-approach.mdx` → `my-problem-solving-approach.mdx` +
    slug `…/my-problem-solving-approach` (old URL 404s, accepted; no inbound links). Validator 0 errors ✓.
  - **Track B** terminology rename (verified; gated on the other session's ingress commit — see below).
- 🔵 OWNED BY ANOTHER SESSION: the ingress-attribution feature + its `description-*` validator
  rules in `validate-docs-structure.js` / `CLAUDE.md` / `SKILL.md`. **Do NOT commit those files'
  ingress lines here.** Track B's rename lines live in the same 3 files → Track B commit waits.

---

## QUEUE (one task per /loop iteration; commit after each; stage only your own paths)

### Q1 — Commit the navbar + slug structural fixes (READY NOW)
Independent of the ingress/Track-B entanglement (different files).
- Stage ONLY: `docusaurus.config.js` + the `my-problem-solving-approach.mdx` rename (R+M).
- **Verify:** `node -e "require('./bytesofpurpose-blog/docusaurus.config.js')"` parses;
  `make validate-structure` 0 errors; grep confirms no `sovling` remains.
- Commit: `Q1: reader-facing navbar (What's New / System Designs; UI Kit → footer) + fix sovling→solving slug`.
- ⚠️ The slug change retires `/skills/refining-soft-skills/my-problem-sovling-approach` (404). Record it.

### Q2 — Move `my-contributions` blog post → personal-growth doc + reference from prep plan
Source: `blog/2025-09-27-my-contributions.mdx` (slug `my-contributions`; imports
`ContributionTimeline`, `@theme/Tabs`/`TabItem` — all work in docs, confirmed).
- `git mv blog/2025-09-27-my-contributions.mdx docs/personal-growth/my-contributions.mdx`.
- Frontmatter: slug → **`/personal-growth/my-contributions`** (absolute); add `authors: [oeid]`;
  keep title/description/tags/date; `draft: false`.
- Add a reference link in `docs/interview-prep/preparing/README.md` (Phase 2 "Story Development"):
  `- **Review your [🚀 My Contributions](/docs/personal-growth/my-contributions)** — a portfolio
  of real impact to ground interview stories.`
- **Verify:** clean build; `/personal-growth/my-contributions` route exists; old `/blog/my-contributions`
  is GONE (404 accepted — no redirects plugin); `make validate-structure` + `make validate-links` clean.
- ⚠️ Retires the `/blog/my-contributions` URL. Record it. Commit `Q2: move My Contributions blog→personal-growth doc + link from interview prep`.

### Q3 — Build the "Vote on post ideas" feature (NEW; mirror the Changelog pipeline exactly)
**Architecture (reuse, don't invent):** folder of idea markdown → build-time generator → JSON →
custom `/vote` page rendering Cards with a Vote button. This is the EXACT changelog pattern
(`changelog/` → `scripts/generate-changelog-data.js` → `src/components/Changelog/changelog-data.json`
→ `src/pages/changelog.tsx`), wired via `package.json` `prestart`/`prebuild`.
- **Ideas folder:** `ideas/` (repo root of bytesofpurpose-blog), one `.md` per idea with frontmatter:
  `title`, `description`, `type` (post|design|doc|tool), `status` (idea|drafting|published), `date`,
  optional `id`. (Separate folder per the user's ask.)
- **Generator:** `scripts/generate-ideas-data.js` (copy changelog generator) → `src/components/
  Vote/ideas-data.json`. Add `generate-ideas` to `package.json` + chain into `prestart`/`prebuild`
  alongside `generate-changelog`.
- **Page:** `src/pages/vote.tsx` (+ `vote.module.css`) — `<Layout title="Vote on Post Ideas">`,
  render a responsive grid of idea **Cards** (reuse `src/components/Card/*`: CardHeader=title,
  CardBody=description, CardFooter = a `type` badge + the **Vote** button).
- **Vote control:** reuse/extend `src/components/VoteButton/index.tsx` (already captures
  `posthog.capture('blog post voted', …)`) → a `Vote`/`IdeaVote` that captures
  `posthog.capture('idea_voted', { idea_id, idea_title, type, page_path })`. (Votes are signal-only
  via PostHog; no backend/persistent count this round — note that limit explicitly on the page.)
**DECISIONS LOCKED (user, this session):** storage = **markdown folder + PostHog signal**
(votes fire `idea_voted`, NO live counter v1); nav = **top navbar, left** (the standard horizontal
bar), plain link.
- **Navbar:** add `{ label: 'Vote', to: '/vote', position: 'left' }` in `docusaurus.config.js`
  (top horizontal bar, left, next to Learn/Blog/System Designs/What's New — reader-facing).
- **Seed idea cards** (exactly 2, confirmed — create these `.md` files in `ideas/`, type: post):
  1. **"AI taught me how to review code"**
  2. **"AI taught me how to manage"**
- **Verify:** `make build`; `/vote` renders the 2 seed cards; clicking Vote fires `idea_voted`
  (prove via `POSTHOG_TEST_MODE=1` + a capture spy, per the always-prove-and-test tenet); a11y/SEO
  e2e still green. Note on the page that votes are signal-only (no live count) in v1. Commit in
  cohesive chunks (generator+data, page+component, navbar, seeds).

### Q4 — (OPTIONAL) second slug typo: `prepraring-questions-to-ask-interviewers.md`
`docs/interview-prep/preparing/prepraring-questions-to-ask-interviewers.md` — "prepraring" typo.
Check its slug value; if the typo is in the slug, fixing it 404s the old URL (same trade-off as Q1).
Low priority — only if user wants the tidy. Surface, don't auto-fix the slug.

### Q5 — Commit Track B (terminology rename) — GATED
Only after the OTHER session has committed its ingress/`description-*` work in the 3 shared files
(`validate-docs-structure.js`, `CLAUDE.md`, `review-reader-experience/SKILL.md`). Then commit Track B's
rename lines (folders/slugs/labels already done; see `compressed-greeting-quasar.md` for the full list).
Until then: **leave uncommitted; do not stage those 3 files.** >>> WAIT GATE — do not force. <<<

---

## The /loop prompt (paste after /clear to run the cleanup)

```
/loop Post-session cleanup for the bytesofpurpose blog. Work ONE task per iteration from
.claude/plans/post-session-cleanup.md: pick the next ready task (Q1→Q2→Q3→Q4), do it, VERIFY,
commit (stage ONLY that task's paths — never a blanket git add; the tree has another session's
uncommitted ingress work + Track B's uncommitted terminology rename that must NOT be swept in),
then advance. Honor these invariants every iteration:
- Branch feat/ingress-attribution. gitleaks pre-commit hook is active — never commit secrets.
- All doc slugs ABSOLUTE; the only intentional URL retirements this pass are Q1 (sovling→solving)
  and Q2 (/blog/my-contributions). Record each retired URL. No redirects plugin — a slug-value
  change 404s silently; that's accepted for these two.
- Builds are ~45s and collide across sessions (shared build/.docusaurus) — run in background,
  prep the next edit while waiting, don't poll-burn iterations.
- After any route-affecting change: clean build + confirm only the intended route deltas +
  make validate-structure (0 errors) + make validate-links before considering it done.
- PROVE behavior, don't assert it (always-prove-and-test tenet): for Q3 votes, build with
  POSTHOG_TEST_MODE=1 and assert idea_voted fires via a capture spy.
START: Q1 (commit navbar + slug — ready now, no entanglement).
Q3 decisions are LOCKED: markdown folder in /ideas/ + PostHog 'idea_voted' signal (no live
counter), top-navbar left 'Vote' link, exactly 2 seed cards (AI taught me how to review code; AI
taught me how to manage). Mirror the changelog generator pipeline.
GATES: Q5 (commit Track B terminology) is BLOCKED until the other session commits the shared
ingress/description files (validate-docs-structure.js, CLAUDE.md, SKILL.md) — do NOT attempt it;
skip and surface. STOP after Q4 (or at any gate) and hand back; do not run the actual deploy.
```

## Guardrails (carried)
- Stage only your own paths; another session's ingress work + Track B coexist uncommitted.
- `make validate-structure` (0 err) + `make validate-links` before deploy.
- Structure decisions update the validator + skill + CLAUDE.md in the same change.
- Reader-facing over builder words (memory `prefer-reader-facing`).
