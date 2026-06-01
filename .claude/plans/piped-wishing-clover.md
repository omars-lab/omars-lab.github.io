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

---

## Execution findings & considerations (updated live during T1–T3)

### Confirmed numbers (from the actual repo, not estimates)
- **289 docs total**, every one has a `slug:`. Pre-freeze: **1 absolute** slug
  (`6-organization-techniques/README.md`), **288 relative**.
- **149 non-draft (built) + 140 `draft:true` (excluded from prod build) = 289.** This
  draft split matters: **draft docs do not appear in the prod build manifest or in
  `.docusaurus` metadata**, so their URLs cannot be read off a build — they must be
  derived from source logic.
- Baseline route manifest: **569 total HTML routes** (`find build -name '*.html'`),
  **502 under `/docs/`** (rest are blog/designs/changelog/tags/storybook). Snapshot at
  `.claude/plans/routes-before.txt` (gitignored; regenerable from a clean build).

### T1 — baseline (DONE)
- The committed `build/` was stale; cleared cache + dir and did a fresh `make build` of
  HEAD. Manifest captured. `make build` writes to `bytesofpurpose-blog/build` — the
  plan's `find build …` is **relative to `bytesofpurpose-blog/`**, not the repo root.
  (Gotcha: `cd` does NOT persist between Bash tool calls here — always use absolute
  paths or a single compound command when capturing the manifest.)

### T2 — URL freeze (DONE, keystone verified)
- **Derivation source of truth:** `plugins/draft-docs/index.js` → `toPermalink()` already
  encodes this repo's exact Docusaurus permalink rule (strip `NN-` prefixes; absolute
  slug `/x` ⇒ `/docs/x`; relative slug renames last segment; README/index ⇒ directory
  route). I cross-checked it against **all 149 built permalinks from `.docusaurus`
  metadata → 0 mismatches**, then trusted it to compute the 140 draft permalinks too.
- Froze every doc's slug to `slug: <permalink-without-/docs>` (absolute). 288 rewritten,
  1 already absolute, 0 errors. **Post-freeze manifest diff vs baseline = EMPTY (569=569).**
- **0 permalink collisions** across all 289 — so the plan's feared dup-slug collisions
  (`readme`×3, `tips`×2) were never route collisions: the folder path disambiguated them,
  and the freeze makes every slug a unique absolute path. (T3's "resolve dup slugs" step
  is therefore satisfied by Phase A; nothing to do.)
- **Working tree was already dirty at session start** (in-flight reader-experience edits:
  `sidebar_label`/`title` across ~45 docs, the `orgnaization`→`organization` folder typo
  rename, eval-doc edits, `my-frist`→`my-first` rename, navbar relabel, storybook regen).
  Per user: **commit everything, in grouped commits.** Landed as: (1) Phase-A freeze +
  in-flight doc edits, (2) navbar relabel, (3) storybook regen, (4) tooling/skills/plans,
  (5) gitignore for transient files. All gitleaks-clean.

### T3 — pre-move hygiene (IN PROGRESS)
- **Renamed** the 2 space-in-filename docs under `backend-projects/` to kebab-case
  (both drafts w/ absolute slugs → URL-invisible rename).
- **Broken `/docs/` body links:** audited all 222 hardcoded `/docs/` body links against
  the baseline manifest. **99 didn't resolve**: 25 point to *draft* docs (valid once
  published — leave), **74 truly broken**. Split into 3 buckets:
  - **A (~40 instances, deferred to T14):** links to a category landing page that
    resolves to an ugly *doubled* route (`/docs/techniques/techniques`,
    `…/blogging-techniques/blogging-techniques`) because each category README has
    `slug: <name>` appended under its own dir. Will be repointed when T14 cleans up
    category-README slugs (avoids fixing twice). Full list: `/tmp/truly-broken-links.txt`
    (regenerate via the audit script if `/tmp` is wiped). Captured in T14's description.
  - **B (DONE):** stale-prefix/typo roadmap links (`/docs/development/7-roadmaps/…`,
    `/docs/developing/…`) → `/docs/development/roadmaps/…`.
  - **C (DONE):** dead/renamed/slug-mismatch — incl. scripting sub-pages whose **slug
    differs from filename** (`leveraging-terminal-shortcuts.mdx` → slug
    `…/terminal-shortcuts`; `parsing-json.md` → slug `…/jq-mechanics`; `terminal-links.md`
    → slug `…/mechanic-terminal-links`); date-prefixed genai link; `5-initiatives`
    prefix; and `/docs/NAMING_CONVENTIONS` (no such doc anywhere → links converted to
    plain text). 16 redirect edits + 2 unlinks across 10 files.
  - **`onBrokenLinks` stays `'warn'` until T17** (bucket A still open until T14); flip to
    `'throw'` at ship.
- **`onDuplicateRoutes:'throw'`** added — and it immediately **caught 2 PRE-EXISTING
  duplicate routes in the changelog plugin** (the default `'warn'` had hidden them):
  (1) a duplicate `content-docs-changelog-system-documentation` `.md` AND `.mdx` (identical
  files) → removed the `.md`, regenerated changelog data; (2) a `/changelog` index
  collision (under investigation at time of writing). Per user: **fix the dupes now** so
  the guard stays on through the reorg. This is the kind of latent collision the plan
  wanted surfaced before folder merges.

### New considerations raised
- **T19 (new task): evaluate a dedicated `manage-doc-slugs` skill** capturing the
  slug/URL/draft/404 nuances (relative-vs-absolute slug → URL coupling; the URL-freeze
  technique + `toPermalink` validation; drafts excluded from prod build so derive URLs
  from source; `onBrokenLinks:'warn'` + no redirects plugin ⇒ silent 404 on slug-value
  change; category-README doubled routes; `onDuplicateRoutes` default `'warn'`). Likely
  folds into / cross-links T15's `maintain-doc-indexes` + the `review-reader-experience`
  IA audit. Decide skill-vs-fold during T15/T19.
- **Changelog content has latent dup-route / `.md`+`.mdx` hygiene issues** independent of
  docs — worth a separate sweep, but only the build-blocking ones are fixed here.

### T4 — migration map (DONE) — `.claude/plans/topic-migration-map.tsv`
- All **289 docs assigned, 0 unassigned, 0 contested.** Counts: development 100 ·
  blogging 59 · productivity 40 · interview-prep 23 · generative-ai 18 ·
  personal-growth 13 · companies 12 · scripting 9 · faith 6 · entrepreneurship 2.
  Plus **7 no-move**: welcome (root) + 6 dissolving bucket READMEs
  (`2-definitions`, `5-craftsmanship`, `6-techniques`, `7-skills`, `10-prompts` indexes
  + `10-prompts/future-plans`) — their intro content gets rehomed into the new topic
  READMEs in T13/T14, not blindly deleted.
- **Taxonomy decisions locked with Omar (overriding earlier ambiguity):**
  - career-levels + skills cluster → **Companies/{roles,skills}** (NOT interview-prep).
    Interview Prep instead gets a **new authored doc** that references level/skill
    differences as part of prep (track in T8).
  - `7-skills/refining-soft-skills/` → **Companies/skills** (general-employee skills
    subfolder, not interview-specific).
  - `habits-mastering` + `habits-managing-finances` → **Personal Growth**.
  - Companies sub-structure is now **{roles, culture, skills}**.
- **Map is the review artifact**; `target_path` column is the *proposed* destination.
  **Per-topic internal layout is finalized during each Phase-D move** (eyeball sidebar):
  - drop redundant topic-echoing `*-techniques` subfolders (`3-productivity/
    organization-techniques/`, `4-blogging/blogging-techniques/`, `5-scripting/
    scripting-techniques/`) — keep genuinely useful sub-groups (blogging embed-*/adding-*);
  - **GenAI pulls from 6 source roots** → regroup its 18 docs into ~3 clean sub-groups
    rather than echoing old folder names;
  - Faith: reframe the `backend-projects/home-automation` nesting to faith-centric.
- Builder scripts saved (`build-migration-map.js`, `add-target-paths.js`) so the map
  regenerates if the inventory changes.

### T5 — GenAI pilot move (DONE) — pipeline proven
- Moved 18 docs from 6 source roots into `1-generative-ai/{fundamentals,building-systems,
  my-genai-workflow}` (+ `my-genai-workflow/initiatives/`). Added topic README
  (`slug: /generative-ai`) + 5 `_category_.json` labels; removed 2 orphaned source
  category files + emptied dirs.
- **Verification model established (use for every Phase-D topic):**
  1. `git mv` per topic move-list (helper: `/tmp/do-moves.sh <tsv>`).
  2. Remove orphaned `_category_.json` + `rmdir` emptied source dirs.
  3. Add new topic README (absolute slug) + `_category_.json` for topic & sub-groups.
  4. Rebuild; assert **manifest == baseline + expected new landing routes** (NOT just
     "empty diff" — each topic README adds exactly one new landing route). Cumulative
     expected-new-landings tracked in `/tmp/expected-new-routes.txt`
     (baseline `/tmp/routes-before.txt`; GenAI added `build/docs/generative-ai.html`).
  5. Confirm moved docs' permalinks UNCHANGED via `.docusaurus` metadata.
- **Proven:** moved docs keep frozen URLs (e.g. genai docs still resolve at
  `/docs/skills/solving-system-design/...`, `/docs/mental-models/...`); manifest delta
  was exactly +1. The reorg is cosmetic-only, as designed.
- **Sidebar visual eyeball deferred to a single batched pass at T17** (across all topics)
  rather than per-topic browser spin-up — the per-phase manifest+metadata checks already
  guarantee correctness; visual is for label/ordering polish.
