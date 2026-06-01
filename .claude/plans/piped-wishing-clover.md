# Plan: Restructure docs into a topic-based information architecture

## Context

`bytesofpurpose-blog/docs/` (~290 docs) is organized by the **author's filing buckets**
— `2-definitions`, `3-mental-models`, `5-craftsmanship`, `6-techniques`, `7-skills`,
`8-habits`, `10-prompts`. A reader can't browse by subject. The goal (from a reader-
experience review): make the **root sidebar = TOPICS a reader browses by**, with a
**consistent inner structure** in every topic, and a **Welcome page that indexes the
topics + explains the site**.

### ⚠️ Critical correction discovered during planning
Earlier in this work I recorded that "every doc has an explicit `slug`, so moving a
file doesn't change its URL." **That is false for this repo** and is now disproven:
- **289 of 290 docs use *relative* slugs** (no leading `/`). Docusaurus prepends the
  folder-derived route prefix to a relative slug, so **the folder path IS in the URL**.
- Proof: three docs all have `slug: readme` but live at different URLs
  (`/docs/prompts/readme`, `/docs/techniques/development-techniques/tool-composition-techniques/readme`,
  …). They only coexist because the folder disambiguates them.
- `onBrokenLinks: 'warn'` (not throw) and **no redirects plugin** → moving folders
  would **silently break ~250 URLs**.

So the reorg is **not** inherently URL-safe. The plan below makes it safe via a
**URL-freeze step** before any folder moves. (The `review-reader-experience` skill and
the `docs-topic-taxonomy` memory both carry the wrong claim and must be corrected —
listed as action items below.)

## Decisions locked with the user
- Root categories = **topics**; Mental Models **dissolves** into topics.
- **10 topics**: 🧩 Development · 🤖 Generative AI · ⚡ Productivity · 🏢 Companies {Roles, Culture} · 🎯 Interview Prep · ✍️ Blogging (authoring this site) · 🖥️ Scripting · 🚀 Entrepreneurship · 🕌 Faith · 🌱 Personal Growth
- **Habits dissolve** — each `8-habits/*` doc distributes to its topic (fans out across ~6 topics; no single "habits" residue).
- **Prompts are not a topic** — each topic carries the *reader-relevant* subset in a `prompts/` sub-folder. **Exception:** author-tooling prompts (`evals/`, `heal/`, `meta/prompt-maturity`, `refactor/role-refactoring`) go to **Blogging**, not distributed.
- **Interview Prep** = standalone topic (DSA + coding challenges + behavioral/system-design prep + career levels/skills — one "getting hired" journey, 26 docs).
- **Blogging** = standalone topic (the 39-doc `3-blogging-techniques` cluster + `4-documentation-techniques` + the QA-rubric prompts).
- **Content-type guide** wording: draft Docs/Blog/Designs/Changelog defs; user refines.

## The recurring inner structure (every topic looks the same)
```
<n>-<topic>/
  README.mdx        # topic overview (position 0)
  vocabulary.mdx    # consolidated glossary for this topic (fixed position 1, where it exists)
  <content pages>   # the docs, sub-grouped via prefixed _category_.json folders
  prompts/          # this topic's reader-relevant prompts (fixed: sorts last)
```
Vocabulary sources: Productivity ← CLI/Dev/PM Terms; Development ← Blog/Portfolio Terms;
Companies ← author a new glossary (essays exist, no glossary yet).

## Execution — sequence matters (each step independently verifiable & revertable)

### Phase 0 — Baseline
Fresh `make build` of current HEAD; snapshot the route manifest:
`find build -name '*.html' | sort > /tmp/routes-before.txt`. (The committed `build/`
is stale — do not reuse it.)

### Phase A — Freeze URLs (NO folder moves) — the keystone
Script-convert all 289 relative slugs to **absolute** (`slug: /docs/<current-built-route>`),
derived from the Phase-0 manifest. Rebuild. **Assert manifest diff == empty** (URLs
identical). Commit. From here, folder location no longer affects any URL — the reorg
becomes purely cosmetic. Use `6-organization-techniques/README.md` (the lone existing
absolute slug) as the pattern.

### Phase B — Pre-move hygiene
- Resolve duplicate slug values (`readme` ×3, `tips` ×2) so they can't collide once
  folders merge. Add a `(target-folder, slug)` uniqueness check to the migration map.
- Grep hardcoded `/docs/...` body links; temporarily set `onBrokenLinks: 'throw'` and
  run `validate-links` to surface in-body links that a move would 404. Fix them.
- Rename the two space-in-filename docs under `backend-projects/`.

### Phase C — Build the migration map (review artifact)
`topic-migration-map.tsv`: every current path → target topic path, columns:
current-built-route · target-folder · slug · draft · is-category-README ·
(folder+slug) uniqueness key · inbound-`/docs/`-link count. Hand-review per topic.

### Phase D — Move topic-by-topic (NOT whole-tree)
Pilot with **Generative AI** (well-scoped, mostly published, pulls from 4 roots) to
prove the pipeline end-to-end. Then unambiguous topics (Scripting, Faith), then the
big/contested ones (Blogging, Development, Interview Prep, Companies). After **each**
topic: `git mv` per map → rebuild → **assert manifest diff empty** (any non-empty entry
is a real bug) → eyeball the sidebar render. Commit per topic.

### Phase E — Cross-cutting structures
Consolidate `vocabulary.mdx` per topic; distribute `prompts/` subsets (author-tooling
prompts → Blogging); fan out habits. Fix typo `terminology-project-managementment` →
`-project-management`.

### Phase F — Welcome + categories + ship
Rebuild `welcome/README.md`:
1. **Topic index — one entry per topic with a reader-facing blurb**: what kind of
   content lives there + **who benefits** (the audience) + when to read it. E.g.
   "🎯 Interview Prep — DSA, coding patterns, behavioral & system-design prep, and what
   companies expect at each level. *For: job-seekers and anyone leveling up.*" One such
   2–3 line card per topic, so a cold visitor self-routes to the right topic.
2. **Recurring-structure guide** — explain the shared shape (overview / vocabulary /
   prompts) so the reader learns it once.
3. **Content-type guide** — Docs vs Blog vs Designs vs Changelog (draft; user refines).
Renumber prefixes + rewrite `_category_.json` labels (URL-invisible).
Full prod build + manifest diff (zero unexpected changes) + `make test-regression` +
reader-experience visual pass → `publish-site`/`deploy-site` → `validate-deployment`.
Then draft triage (#9) in place.

## Critical files
- `bytesofpurpose-blog/docusaurus.config.js` — `onBrokenLinks` (flip to throw during
  migration), `onDuplicateRoutes` (unset → set to throw), no redirects plugin.
- `bytesofpurpose-blog/sidebars.js` — `{type:'autogenerated', dirName:'.'}`: the
  folder-tree-IS-the-sidebar contract; numeric prefixes set order (URL-invisible).
- `bytesofpurpose-blog/docs/6-techniques/6-organization-techniques/README.md` — the one
  absolute-slug doc; template for the Phase-A freeze.
- `bytesofpurpose-blog/docs/6-techniques/3-blogging-techniques/README.mdx` — 39-doc
  cluster → new Blogging topic.
- `bytesofpurpose-blog/docs/10-prompts/evals/README.md` — author-tooling prompts → Blogging.

## Keeping index docs in sync (new skill + hook)
Welcome's topic index, each topic `README.mdx`, and the `_category_.json` labels are
hand-maintained and will **drift** as topics are added/renamed/removed. Address with
existing repo patterns (there are already PostToolUse `Write|Edit` hooks —
`validate-links-hook.sh`, `validate-draft-hook.sh` — and generator scripts under
`bytesofpurpose-blog/scripts/`):
- **New skill `maintain-doc-indexes`** (or fold into `review-reader-experience`):
  regenerate/verify the Welcome topic index + per-topic overviews from the actual
  folder tree + `_category_.json` labels. Owns the recurring-structure contract.
- **Sync check** — a script `scripts/validate-topic-index.js` (mirrors
  `generate-changelog-data.js`/`validate-links.js`) that diffs Welcome's listed topics
  against the real root folders and fails/warns on drift.
- **Hook** — add a PostToolUse entry (same `Write|Edit` matcher already in
  `.claude/settings.json`) that runs the sync check when a `_category_.json` or a topic
  README changes, so Welcome can't silently go stale. Warn-only first (match the
  draft-hook's non-blocking style).
Decide skill-vs-fold and generate-vs-validate during execution; scoped here so it isn't
forgotten.

## Doc-cleanup correction items (do as part of this work)
- Fix the false "slug decouples URL from path" claim in the `review-reader-experience`
  skill IA audit **and** the `docs-topic-taxonomy` memory — replace with the
  relative-slug reality + the URL-freeze technique.

## Verification
1. Per-phase **route-manifest diff** must be empty (Phase A and every Phase-D topic).
2. `make test-regression` (Playwright e2e: a11y/SEO gates + dev-only-surface absence).
3. Visual sidebar pass via chrome-devtools (topics render, depth ≤3, labels clean).
4. `validate-links` clean; `onBrokenLinks: throw` passes before ship.
5. `validate-deployment` post-deploy (200 / Access / PostHog beacon).

## Tracking — task list (recreate these via TaskCreate when resuming)

**Instruction for a fresh session:** this plan is self-contained. On resume, run
`TaskList` first; if empty, recreate the tasks below with `TaskCreate` (in order, IDs
will differ), set up the blocked-by chain noted, then start at the first pending task.
Mark `in_progress` before starting each and `completed` when its verification passes.
Do the phases **in order** — each is gated by the prior one's empty route-manifest diff.

Pre-req context to re-derive on resume: 289/290 docs use **relative** slugs (folder path
is in the URL); `onBrokenLinks:'warn'`; no redirects plugin; the 10 topics are
Development · Generative AI · Productivity · Companies{Roles,Culture} · Interview Prep ·
Blogging · Scripting · Entrepreneurship · Faith · Personal Growth.

| # | Phase | Task | Blocked by |
|---|---|---|---|
| T1 | 0 | Capture fresh route-manifest baseline (`find build -name '*.html'|sort`; don't reuse stale `build/`) | — |
| T2 | A | **Freeze URLs** — convert all 289 relative slugs → absolute `/docs/<route>`; rebuild; assert manifest diff EMPTY; commit | T1 |
| T3 | B | Pre-move hygiene: resolve dup slugs (`readme`×3,`tips`×2); fix hardcoded `/docs/` body links (set `onBrokenLinks:throw`, run `validate-links`); rename 2 space-filenames; set `onDuplicateRoutes:throw` | T2 |
| T4 | C | Build `topic-migration-map.tsv` (cols: route·target·slug·draft·is-README·uniq-key·inbound-links); hand-review per topic | T3 |
| T5 | D | Move **Generative AI** (pilot — proves pipeline); rebuild; assert diff empty | T4 |
| T6 | D | Move **Scripting** + **Faith** (unambiguous) | T5 |
| T7 | D | Move **Blogging** (39-doc cluster + doc-techniques + author-tooling prompts) | T5 |
| T8 | D | Move **Interview Prep** (DSA+coding+behavioral+levels/skills, 26 docs) | T5 |
| T9 | D | Move **Development** + **Productivity** + **Companies**{Roles,Culture} + **Entrepreneurship** + **Personal Growth**; dissolve Mental Models | T5 |
| T10 | E | Consolidate `vocabulary.mdx` per topic (Productivity←CLI/Dev/PM; Development←Blog/Portfolio; author Companies glossary) | T9 |
| T11 | E | Distribute `prompts/` subsets per topic (author-tooling→Blogging); fan out 26 habits to their topics | T9 |
| T12 | E | Fix typo `terminology-project-managementment`→`-project-management` | T10 |
| T13 | F | Rebuild **Welcome**: topic index w/ per-topic blurb (content + **who benefits** + when) + recurring-structure guide + content-type guide (Docs/Blog/Designs/Changelog) | T9 |
| T14 | F | Renumber prefixes + rewrite `_category_.json` labels (URL-invisible) | T13 |
| T15 | F | New skill `maintain-doc-indexes` + `scripts/validate-topic-index.js` + PostToolUse hook (warn-only) to keep Welcome/index in sync | T13 |
| T16 | — | Correct the false "slug decouples URL from path" claim in `review-reader-experience` skill IA audit + `docs-topic-taxonomy` memory | — |
| T17 | F | Ship: full build + manifest diff + `make test-regression` + visual sidebar pass → `publish-site`/`deploy-site` → `validate-deployment` | T14 |
| T18 | — | Draft triage (#9): inventory all `draft:true`, decide publish/keep/delete | T9 |

Carry-over standalone reader-experience tasks (independent of the reorg): rewrite 4
writer-voice intros (#4), category-name voice call (#7), flatten remaining deep paths (#3).

Durable prefs: `docs-topic-taxonomy` memory + `review-reader-experience` skill (correct
per T16). Detail: `.claude/plans/topic-taxonomy-proposal.md`.
