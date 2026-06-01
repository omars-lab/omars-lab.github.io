# Plan: Blog "meh → great" — extended & re-grounded (next session)

## ⚠️ EXECUTION STATUS (updated 2026-06-01, mid-session)
- **Track A (avatar) — DONE & COMMITTED** (`499c802e` on `feat/ingress-attribution`):
  headshot self-hosted at `static/img/headshot.png`; `blog/authors.yml` + `designs/authors.yml`
  `oeid.image_url` → `/img/headshot.png`. Verified via generated `.docusaurus` author data.
- **Track B (vocabulary→terminology) — DONE & VERIFIED, INTENTIONALLY UNCOMMITTED.**
  Build shows exactly the 3 intended URL swaps (`/productivity|/development|/companies/
  terminology`), old `/…/vocabulary` retired, frozen `/definitions/*` item slugs intact,
  validator 0 errors. **NOT committed by decision:** the structure-contract files it edits
  (`scripts/validate-docs-structure.js`, `CLAUDE.md`, `review-reader-experience/SKILL.md`)
  ALSO carry a prior session's uncommitted ingress/ShareButton `description-*` work — and the
  **user said that ingress work is being committed in another session.** So Track B's edits sit
  uncommitted in the working tree; commit boundaries to be drawn once the ingress work lands
  (the other session should commit ITS lines; Track B's rename lines layer on top/around).
  Track B files touched: 3 folder/file `git mv`s + 2 `_category_.json` labels + 3 README
  slugs/titles/tags + validator + CLAUDE.md + SKILL.md (2 spots) + docs-topic-taxonomy memory.
- **IN-FLIGHT SCOPE IS BIGGER THAN FIRST MAPPED.** The uncommitted ingress work also modified
  `CLAUDE.md`, `SKILL.md`, and `validate-docs-structure.js` (description rules) — not just the
  posthog/component files. Track 0, when run, must account for all of these.
- Next: Track C (bare-urls) is independent of the shared files and safe to do; or pause for the
  other session to land ingress first.

## Context (why this plan, and what changed since it was written)
`.claude/plans/blog-meh-to-great.md` captured the post-restructure priorities to take the
blog from a personal scratchpad to a destination. This plan **re-verifies it against the
current tree** (numbers had drifted), **folds in two things it missed** (a complete-but-
uncommitted ingress-attribution feature; the homepage/avatar reality), and **adds three
user-requested tasks** from this session:
1. Use the illustrated headshot at `https://www.bytesofpurpose.com/headshot-2.png` as the
   **blog-post author avatar** (self-hosted).
2. Rename the **`vocabulary/` folders → `terminology/`** (folder + label + slugs).
3. Make the plan **track every task that needs completing** (the task ledger below).

The original plan's *reasoning* (fill+polish the surface, don't re-restructure) still holds.
This file is the authoritative working plan; `blog-meh-to-great.md` remains the narrative.

## Re-grounded evidence (measured THIS session, 2026-06-01)
| Claim in old plan | Current reality | Action |
|---|---|---|
| 159 pub / 131 drafts | ✅ confirmed (290 total) | — |
| Drafts: swdev 55 / prod 25 / pm 15 / pgrowth 13 | ✅ those 4 exact; **+7 more topics** (blogging 6, generative-ai 6, faith 6, interview-prep 2, entrepreneurship 2, companies 1) = 131 | publish sprint is **on hold** (user) |
| 4 blog posts | ✅ 4 (1 of them — DFS-vs-BFS — is `draft:true`) | blog revival item notes this |
| **151 bare-url errors** | ❌ **167 bare-url + 27 long-url = 194** (`make validate-links`) | P1 fix targets 167 |
| validate-structure: 0 err, 2 warns | ✅ exactly (documentation-techniques, problem-solving-techniques) | unchanged |
| onBrokenLinks 'warn' | ✅ 'warn' (+ onBrokenMarkdownLinks 'warn'); throw blocked by changelog shadowing blog index | P3 caveat |
| idea↔exec validator exists, 0 links | ✅ `idea-exec-link` rule present; **0** `## Execution`/`## Idea` authored | P2 wiring |
| folders are `4-development` etc. | ❌ **descriptive names now** (`software-development`, `product-management`, …); no numeric prefixes | old plan's path refs are stale — use real names |
| 1 experiment (support-button-copy) | ✅ at `docs/product-management/experiments/2026-05-31-support-button-copy.md` (`draft:true`) | P2 experiments |

**Two things the old plan never accounted for:**
- **Ingress-attribution feature is COMPLETE, TESTED, and UNCOMMITTED** on `feat/ingress-
  attribution` (5 modified files + ShareButton/Toast/BookmarkletButton components + 3 theme
  overrides + 3 e2e specs, all 10 tests green per `src/ingress-attribution-plan.md`). This is
  shippable work sitting in the tree — it must be committed/shipped and is the natural feeder
  for the P2 "exercise the apparatus" item.
- **Homepage has no headshot** — `src/pages/index.tsx` renders title + tagline + 2 buttons +
  `HomepageFeatures` (SVG icons) + `LatestPosts`. The avatar the user references is NOT on the
  served homepage; it's a separate asset at `/headshot-2.png` (verified 200, 489KB PNG).

---

## TASK LEDGER — everything that needs completing
Grouped by track. Each task is independently shippable; commit after each. `[hold]` = keep in
plan but do NOT execute this round (user deferred). Suggested order at the bottom.

### Track 0 — Land the in-flight ingress-attribution feature (NEW, highest priority)
This is finished work blocking a clean tree. Do it first so nothing else commits on top of it.
- **T0.1** Review the uncommitted ingress-attribution diff for correctness/secrets, then commit
  it on `feat/ingress-attribution` in cohesive chunks. Stage **only** ingress paths (lesson from
  Phase H: no blanket `git add`). Paths: `src/posthog.js`, `src/theme/MDXComponents.tsx`,
  `src/theme/Root.tsx`, `playwright.config.ts`, `src/posthog-integration-plan.md`,
  `src/ingress-attribution-plan.md`, `src/components/{ShareButton,Toast,BookmarkletButton}/`,
  `src/theme/{BlogPostItem/Header/Title,DocItem/Content}/`, `test/e2e/{ingress-attribution,
  bookmarklet-proof,bookmark-rewrite-proof}.spec.ts`.
- **T0.2** Verify: `make test-posthog` (needs `POSTHOG_TEST_MODE=1`; the 10 ingress e2e tests)
  + `make test-regression` (a11y/SEO + dev-surface-absence gates). Record results.
- **T0.3** Decide merge timing: does ingress-attribution ship in the same deploy as the
  rest, or merge to `master` on its own? (Recommend its own merge — it's self-contained.)

### Track A — Avatar (NEW, user-requested)
- **T-A1** Fetch `https://www.bytesofpurpose.com/headshot-2.png` → save to
  `bytesofpurpose-blog/static/img/headshot.png` (self-host; version-controlled).
- **T-A2** Update `blog/authors.yml` → `oeid.image_url: /img/headshot.png` (replaces the
  GitHub avatar `https://github.com/omars-lab.png`). Leave `cursor` author untouched.
- **T-A3** Verify the circular author photo renders on a built blog post (avatar uses Docusaurus'
  `avatar__photo` class — already circular). Scope = **blog author avatar only** (not homepage,
  not navbar — per user).

### Track B — Rename `vocabulary/` → `terminology/` (NEW, structure decision)
Per CLAUDE.md, a structure change **must update the validator + skill + CLAUDE.md in the same
change**. User chose: **rename slugs too** (old `/…/vocabulary` URLs become accepted 404s).
Folders affected: `docs/productivity/vocabulary/`, `docs/software-development/vocabulary/`, and
standalone file `docs/companies/vocabulary.mdx`. (Note: item docs already use `terminology-*`
filenames, so this aligns folder↔file naming.)
- **T-B1** `git mv` the two folders → `terminology/`; `git mv docs/companies/vocabulary.mdx →
  terminology.mdx`. Update each `_category_.json` `"label": "Vocabulary"` → `"Terminology"`.
- **T-B2** Update the **landing README slugs**: `/productivity/vocabulary` → `/productivity/
  terminology`; `/development/vocabulary` → `/development/terminology`; `/companies/vocabulary`
  → `/companies/terminology`. The 7 item docs keep their frozen `/definitions/...` slugs (no
  change). Record the 3 retired URLs in the manifest diff.
- **T-B3** Update the validator: `scripts/validate-docs-structure.js` hardcodes `vocabulary`
  as the "sorts-first" folder (lines ~14, 40, 74, 201–207, rule key `vocab-first`). Rename the
  rule/string to `terminology` (or accept both during transition). Re-run `make validate-structure`
  → expect still 0 errors.
- **T-B4** Update docs of the contract in the SAME change: `CLAUDE.md` (the topic-folder-
  contract paragraph mentions `vocabulary/` first), the `review-reader-experience` SKILL.md
  "Topic-folder contract + validator" section, and the `docs-topic-taxonomy` memory file.
- **T-B5** Update inbound references: `tags: [vocabulary, …]` in the renamed files and any prose
  links; sidebar/nav labels if any say "Vocabulary".
- **T-B6** Verify: clean build + manifest diff (the 3 old `/…/vocabulary` URLs are the only
  removals; the 3 new `/…/terminology` the only adds) + `make validate-structure` +
  `make validate-links`.

### Track C — Polish: bare-url link hygiene (P1 from old plan)
- **T-C1** `node scripts/validate-links.js --fix` (offline rewrite of the **167** bare URLs →
  `[label](url)`). Optionally `--fix --titles` for nicer labels (network; review the diff).
- **T-C2** Skim the diff for bad auto-labels; hand-fix as needed. Re-run `make validate-links`
  → bare-url count → 0 (long-url warns may remain; triage separately).
- **T-C3** Commit. (Do this BEFORE any onBrokenLinks:'throw' flip.)

### Track D — Blog revival (P1 from old plan)
- **T-D1** Decide DFS-vs-BFS post: finish + un-draft, or leave drafted. (It's the one `draft:true`
  blog post.)
- **T-D2** Seed 3–5 short dated posts from work already done — strong candidates:
  "Why I restructured my docs into topics" (Phases A–H narrative), "Idea → execution: linking PM
  to code", "How I track where my links go" (the ingress-attribution story — ties Track 0 to the
  blog). Cadence > length. Use `author-blog-post` skill (frontmatter/MDX pitfalls). Author = `oeid`.

### Track E — Idea↔execution wiring (P2 from old plan)
- **T-E1** Identify 5–10 obvious PM-idea ↔ built-artifact pairs (e.g. PM `ideas/`/`roadmaps/`
  entries that became `software-development/*/projects/*` docs).
- **T-E2** Add `## Execution` link in each PM doc → the built artifact; `## Idea` link back in the
  artifact. The `idea-exec-link` validator keeps them honest (links must resolve).
- **T-E3** `make validate-structure` → no new `idea-exec-link` warns. Commit.

### Track F — Experiment apparatus (P2 from old plan)
- **T-F1** Decide: run 1–2 real experiments (CTA copy / nav label / topic-landing hero) to
  populate the lab notebook, OR explicitly document the apparatus as dormant. The new
  ingress-attribution events (`egress_share`, `ingress`, …) are now a live data source — a
  share-CTA experiment is a natural first real test. Skill chain: `design-experiment` →
  `run-ab-test` → `analyze-experiment` → `decide-experiment` → `conclude-experiment`.
- **T-F2** If running: keep the experiment doc + README timeline table current per phase.

### Track G — First-impression polish (P3 from old plan)
- **T-G1** Homepage audit (`src/pages/index.tsx` + `HomepageFeatures`): does it sell the site in
  5s — who/what/where-to-start? (Avatar is explicitly OUT of scope for homepage per user.)
- **T-G2** Topic-landing READMEs: make each a real "start here" (2–3 sentence orientation + 3
  best docs), not an auto-list. High-traffic, hand-crafted.
- **T-G3** Run `review-reader-experience` end-to-end on the post-restructure site → prioritized
  reader-eyes report (labels, nav, voice, dead ends) → triage findings into a follow-up.

### Track H — Tighten the build contract (P3 from old plan; AFTER C + publish)
- **T-H1** Flip `onBrokenLinks: 'warn' → 'throw'` — but first resolve the changelog-shadows-blog-
  index issue that currently forces 'warn' (see docusaurus.config.js comment, lines ~18-29).
- **T-H2** Resolve or formally accept the 2 framing-folder warns (documentation-techniques,
  problem-solving-techniques).

### Track P — Publish sprint (P0 from old plan) — **[hold]**
User: *"hold on publishing for now."* Keep documented; do NOT flip drafts this round.
- **[hold] T-P1** When resumed: `draft-triage.tsv` marks ~90 `publish?`, ~30 `keep`, ~10 `delete?`.
  Read each `publish?` doc for real quality (not word count), publish the ready ones per topic,
  delete empty stubs, keep thin-but-intentional as drafts. Target 131 → ~60.
- **[hold] T-P2** Re-run manifest diff after each batch (publishing ADDS the draft's route — verify
  it's the intended one).

---

## Suggested next-session order
1. **Track 0** (commit + verify ingress-attribution) — clears the tree first.
2. **Track A** (avatar) — tiny, self-contained, visible win.
3. **Track B** (vocabulary → terminology) — structure change; do as one atomic commit
   (mv + slugs + validator + CLAUDE.md + skill + memory) so docs and checks never drift.
4. **Track C** (bare-url --fix) — fast polish, makes everything look finished.
5. **Track D** (blog revival, incl. the ingress-attribution post) — proves the site is alive.
6. **Track E** (idea↔exec wiring) — makes the PM/SWDev split navigable.
7. **Track G3** (reader-experience audit) — triage its findings into the following session.
8. (Stretch) **Track F** (experiment) + **Track H** (onBrokenLinks:'throw').
9. **Track P** remains on hold until the user lifts it.

## Guardrails (carried from the restructure — unchanged)
- All slugs ABSOLUTE/frozen; never reintroduce a relative slug. The only intentional URL change
  this round is the 3 `/…/vocabulary` → `/…/terminology` landings (Track B, user-approved).
- Manifest diff (`.claude/plans/routes-before.txt`, 569 routes baseline) after any change that
  moves/adds/removes routes. Builds collide across sessions (shared build/.docusaurus) —
  coordinate before building; run builds in the background (~45s).
- `make validate-structure` (0 errors) + `make validate-links` before any deploy.
- **A structure decision must update the validator + skill + CLAUDE.md in the same change**
  (Track B encodes this explicitly).
- Stage only your own paths in commits — never a blanket `git add` (Phase H lesson; especially
  relevant now with ingress-attribution + this work coexisting in the tree).
- Secrets: gitleaks pre-commit hook active; repo is public. Rotate, don't just scrub.

## Verification (end-to-end)
- **Ingress (T0):** `POSTHOG_TEST_MODE=1 make test-posthog` (10 e2e green) + `make test-regression`.
- **Avatar (A):** build, open a blog post, confirm the circular `headshot.png` shows as author photo.
- **Terminology (B):** `make validate-structure` (0 err) + clean build + manifest diff shows ONLY
  the 3 expected URL swaps + `make validate-links`.
- **Links (C):** `make validate-links` → bare-url=0.
- **Idea↔exec (E):** `node scripts/validate-docs-structure.js --json` → no `idea-exec-link` warns.
- **Whole site:** `make validate-structure && make validate-links && make test-regression` clean
  before any `deploy-site`.
