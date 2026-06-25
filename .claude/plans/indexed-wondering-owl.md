# Unified Plan — Durable/Temporal Reframing + Legend, Boards, Kinds, IA Moves

## Context

Over one session the user raised 14 separate asks (tracked as tasks #1–#14). Mid-planning,
the user reframed the whole site around a **durable vs temporal** model, which becomes the
organizing principle for everything else:

- **`/craft` (docs) = DURABLE** — distilled learnings, strategy, insight, frameworks,
  terminology. Return-to knowledge that stays true over time. (Sibling of `/journey`, which
  is durable self-knowledge.)
- **`/initiatives` (blog, renamed from `/thoughts`) = TEMPORAL** — individual, dated
  initiatives, experiments, project logs. The specific things actually done. A temporal post
  links **up** to the durable craft insight it informed.

This reframing reslots the original tasks: experiments **move** from `/craft` to the blog as
posts; the kanban becomes a **board of those temporal posts**; the **Legend** section
documents this very model; and the blog root gets renamed to match.

**Decisions locked with the user** (via AskUserQuestion):
1. **Legend** = a navbar item → a legend **hub page** (NOT a new docs instance). The hub is
   the simplified `a-guide-to-these-posts`, documenting the durable/temporal model + emoji +
   post-kinds + section differences + terminology links.
2. **Blog rename** `/thoughts` → `/initiatives` (navbar "Initiatives"), done **first** so
   everything else targets final routes. Two-hop legacy redirects: `/blog/*` AND `/thoughts/*`
   → `/initiatives/*`.
3. **Experiments** move to `/initiatives` as **blog posts** with real kinds
   `experiment-plan` 📝 → `experiment-result` 📊 (kind flips on one post as the Outcome lands).
4. **Kanban** = build-from-scratch interactive React component; cards **generated from post
   frontmatter**; card click → modal → links to the full post. **Multiple boards** (an
   Experimentation board, an Ideas/Initiatives board) from one reusable component.
5. **Experimentation board post** in `/initiatives` is the index; experiment posts are its
   cards; the board **replaces** the old experiments README timeline.
6. **Skills** (idea-grooming + reworked experiment-lifecycle) must be **board-aware**: know
   which board a kind belongs to and how advancing a card maps to a stage + frontmatter change.
7. **Sequencing** = one big sequenced effort on a single branch, dependency-ordered commits,
   **one PR at the end** (per the repo's commit→PR→ask-to-merge convention).

Intended outcome: a coherent site where durable knowledge and temporal initiatives are
clearly separated, a Legend explains the model, kanban boards index the temporal work, the
post-kind taxonomy covers learning plans + experiments, glossary terms auto-link to their
definitions, and the skills drive the board-based workflow — all URL-safe via paired
redirects and all structure/outline/link checks green.

**Later additions to scope** (after the 7 decisions above):
8. **Glossary auto-linking** (new commit C9): the FIRST instance of a glossary term in a blog
   post gets a footnote-style anchor link to that term's specific definition in the single
   glossary home (built in C5). This is its OWN skill + a validator + a warn-tier hook, then
   applied across existing posts.

**Build-system hardening (raised mid-C1, FOLDED into this branch)** — three "CB" commits:
9. **CB1 — generated-asset pipeline (DONE).** Generated-from-frontmatter assets were a
   footgun (`ideas-data.json` regenerated every build yet committed). Now fail-closed:
   untracked + gitignored generated data; a single `generate-assets` npm/Make target
   (wired into prestart/prebuild) regenerates ALL dynamic assets; a PreToolUse Write|Edit
   hook (`.claude/hooks/block-generated-edits.sh`) BLOCKS edits to generated outputs +
   build-derived dirs (exempts secrets + the committed `_rosette-zeros-variants.js` source);
   CLAUDE.md convention added. **C4's kanban generator MUST be born inside `generate-assets`
   with its output gitignored + added to the hook** (the hook + gitignore already name
   `kanban-data.json`).
10. **CB2 — build-system `/designs` post** (user: write it now): showcase the build pipeline
    — folders, the `generate-assets` target, each generator's frontmatter→asset→consumer
    mapping, the fail-closed hygiene + the committed-source exception. Depends on CB1 (ideally
    after C4 so kanban is real; can ship pre-C4 and mention kanban as upcoming).
11. **CB3 — visual + mobile validation for OUR components** (user request): prove the
    KanbanBoard, its card modal, and the question-set cards render correctly and are genuinely
    mobile-friendly (not desktop-shrunk). Reuse `audit-mobile-experience` (chrome-devtools MCP
    on :4173 + visual-rubric screenshot) + Storybook stories at a mobile viewport. (1) BAKE a
    visual+mobile pass into C4's verify gate (tap targets ≥44px, no horizontal overflow,
    ≥16px text, columns reflow, modal usable one-handed, touch close works); (2) add a STANDING
    convention that every new interactive component gets a visual+mobile pass before its commit
    is done; (3) OPTIONAL mobile-viewport Playwright project (decide at execution — today all
    projects are Desktop Firefox; no mobile/visual spec exists). Defer findings → GitHub issues
    (ISSUES.md dedup). Depends on C4.

**This plan file is the durable record of record.** The session may be cleared; the task list
lives in the transcript but THIS FILE survives. The embedded "Task list (loop-ready)" section
below mirrors the tracked tasks 1:1 (IDs, dependencies, verify gates) so work can resume from
the file alone. If you resume and the task list is empty, re-create the tasks from that table.

**Loop-readiness:** the work is shaped as 10 dependency-ordered commits (C1–C10), each a
self-contained task with its own verify gate. To drive autonomously:
`/loop implement the next unblocked commit from .claude/plans/indexed-wondering-owl.md`.
Each iteration: claim the lowest-ID unblocked task → do that commit on branch
`feat/durable-temporal-reframe` → run its verify gate → mark complete → continue. The FINAL
PR merge is MANUAL (CLAUDE.md: never self-merge) — the loop opens the PR and stops to ask.

---

## Key facts from exploration (so execution reuses, not reinvents)

- **Docs instances** (`docusaurus.config.js`): `craft` (path `docs/craft`, route `/craft`,
  `sidebars-craft.js`) and `self` (path `docs/journey`, route `/journey`, `sidebars-self.js`).
  Preset `docs:false` (line 149). Sidebars are `{type:'autogenerated', dirName:'.'}`.
- **Blog**: `plugin-content-blog` `routeBasePath:'thoughts'` (line 154). Navbar "Thoughts"
  `to:'/thoughts'` (~line 719).
- **Redirects**: manual `{from,to}` array + `createRedirects(existingPath)` (lines ~677-685):
  `/journey/*`→`/self/*`, `/thoughts/*`→`/blog/*`. ~20 source files reference `/thoughts`.
- **draft-docs plugin** (`plugins/draft-docs/index.js`): computes per-instance permalinks from
  the first path segment under `docs/` (no change needed to add a topic); **hardcodes blog
  instances** `{dir:'blog', base:'/thoughts'}` + `{dir:'designs', base:'/designs'}` (lines
  55-58 — **must change for the rename**); auto-prepends `kind:` emoji to **blog** sidebar
  labels (lines 135-153, `BLOG_KIND_EMOJI` reads `blog-kinds.json`).
- **Kind taxonomy**: source of truth `scripts/lib/blog-kinds.json`; outline tests in
  `scripts/validate-post-outline.js` `CHECKS` registry (ids: `description`, `sections`,
  `question-cards`, `section-banner`, `framework-laid-out`, `steps-or-artifact`, `mockup`,
  `decisions`, `links-to-design`, `legend-explainer`). `legend-drift` check compares the
  emoji table in `blog/2026-06-24-a-guide-to-these-posts.mdx` (rows whose first cell starts
  with an emoji) against the JSON. Kind enforcement is **blog-only** (`isBlogPost` regex);
  `DEFAULT_DIRS=['blog','designs','docs']`.
- **Structure validator** (`scripts/validate-docs-structure.js`): discovers topics
  dynamically (any `docs/<x>` with a `_category_.json`, except `welcome`) — **no change to add
  a topic**. BUT `checkWelcomeDrift()` **hardcodes** `['/craft','/journey']` (would only need a
  change if adding a new *instance*, which we are NOT).
- **Modal prior art**: `packages/blog-ui/src/components/Question/index.tsx` — CustomEvent +
  single `QuestionModalHost` mounted in Root; `role="dialog" aria-modal="true"`; Escape handling.
  Copy this pattern for the kanban card modal.
- **Data-generator prior art**: `scripts/generate-ideas-data.js` (frontmatter → JSON in
  `src/components/Vote/ideas-data.json`); `generate-changelog-data.js`. Mirror for kanban.
- **Static SVG kanban**: `static/img/kanban-structure.svg` (non-interactive) — visual reference
  only; the interactive component is new.
- **Experiment template** `docs/craft/product-management/experiments/_TEMPLATE.md`: one doc,
  sections 1-4 = plan (Hypothesis/Why/Design/Risks), 5 = timeline, 6-8 = Outcome/
  Recommendation/Decision. No `kind:` today. README has a timeline table.
- **Experiment-lifecycle skills** (`design/run/analyze/decide/conclude-experiment`) and
  `author-blog-post` live **outside** the project `.claude/skills/` (global/plugin scope) —
  edits to them are out-of-repo; flag clearly. `blog-kinds.json` already says author-blog-post
  *points at* the JSON, so adding kinds needs no skill edit for vocabulary.

---

## The plan — one branch, dependency-ordered commits

Branch: `feat/durable-temporal-reframe` (single branch; one PR at end).

### Commit 1 — Rename the blog `/thoughts` → `/initiatives` (do FIRST)
Broadest-surface change; doing it first means every later commit targets final routes.
- `docusaurus.config.js`: blog `routeBasePath:'thoughts'`→`'initiatives'` (line 154); navbar
  item label "Thoughts"→"Initiatives", `to:'/thoughts'`→`'/initiatives'` (~719); homepage card
  text refs.
- `createRedirects` (lines ~677-685): add a branch so **both** legacy roots resolve —
  `/initiatives/*` → emit `/thoughts/*` AND `/blog/*` (two-hop legacy). Keep the existing
  `/journey`→`/self` branch.
- `plugins/draft-docs/index.js` line 56: blog instance `base:'/thoughts'`→`'/initiatives'`.
- Sweep the ~20 source files referencing `/thoughts` (intra-site links) + e2e specs
  (`test/e2e/**`) referencing `/thoughts` slugs → `/initiatives`.
- Verify: `make build` clean; spot-check a redirect (`/thoughts/<post>` and `/blog/<post>`
  both → `/initiatives/<post>`).

### Commit 2 — Post-kind taxonomy: add `learning-plan`, `experiment-plan`, `experiment-result`
(Tasks #13, #14-kinds.) All three new kinds in one lockstep change.
- `scripts/lib/blog-kinds.json`: add three entries `{emoji, description, outline:[{id,label}]}`.
  - `learning-plan` (emoji TBD at execution — candidate 🎓; confirm distinct from existing 9).
    Outline: goal/outcome, prerequisites, a sequenced curriculum/milestones, resources,
    checkpoint, `description`.
  - `experiment-plan` 📝 — outline: hypothesis, design, `description`.
  - `experiment-result` 📊 — outline: outcome, decision, `description`.
- `scripts/validate-post-outline.js` `CHECKS`: add a test fn per **new** outline id (reuse
  `description`, `sections`, `framework-laid-out`, `steps-or-artifact` where they fit; write
  new ones for hypothesis/design/outcome/decision/curriculum/checkpoint as needed).
- `blog/2026-06-24-a-guide-to-these-posts.mdx`: add a legend-table row per new kind (emoji in
  first cell) so `legend-drift` passes. (This file is also simplified in Commit 5 — keep the
  table intact there.)
- Verify: `node scripts/validate-post-outline.js` (warn-tier; expect no `legend-drift`,
  no `unknown-kind`).

### Commit 3 — Move experiments to `/initiatives` as posts (kinds applied)
(Task #14-move.) Depends on Commit 1 (route) + Commit 2 (kinds).
- Move `docs/craft/product-management/experiments/2026-05-31-support-button-copy.md` →
  `blog/<date>-support-button-copy.md` (becomes an `/initiatives` post); set
  `kind: experiment-plan` (later flips to `experiment-result`); convert doc frontmatter → blog
  frontmatter (`kind`, `sidebar_label`, blog `authors`/`tags`/`date`).
- Add `{from:'/craft/product-management/experiments/2026-05-31-support-button-copy',
  to:'/initiatives/<slug>'}` redirect (and the legacy two-hop is automatic via createRedirects).
- Retire `docs/.../experiments/_TEMPLATE.md` + `README.md` timeline (board replaces them) — or
  leave a stub README pointing to the board. `/craft` keeps the **durable** PM lifecycle
  framework only (the distilled insight), not the dated experiment instances.
- Verify: `validate-links` (no stale slugs), build clean, old experiment URL 301s.

### Commit 4 — Interactive `KanbanBoard` component + generator + Experimentation board post
(Tasks #11-component, #14-board.) Depends on Commit 3 (experiment posts exist as data).
- New: `src/components/KanbanBoard/{index.tsx, KanbanBoard.module.css, types.ts}`; a card
  modal reusing the **Question** CustomEvent+host pattern from
  `packages/blog-ui/src/components/Question/index.tsx`.
- New: `scripts/generate-kanban-data.js` — scans posts of a given kind, reads frontmatter
  (`stage`/column, `priority`, `title`, `summary`, permalink) → `kanban-data.json` (mirror
  `generate-ideas-data.js`). **Per CB1: add it to the `generate-assets` npm target (NOT a new
  inline prestart/prebuild entry — `generate-assets` is the single source of truth); the
  output `src/components/KanbanBoard/kanban-data.json` is ALREADY gitignored + ALREADY named in
  the block-generated-edits hook — confirm both, don't re-add.**
- Component is **board-parameterized** (a `board`/`kind` prop selects the data slice +
  columns), so the same component renders the **Experimentation** board (cards = experiment
  posts; columns Plan 📝 | Running | Result 📊) and the **Ideas/Initiatives** board.
- Register `<KanbanBoard/>` in `src/theme/MDXComponents.tsx`; add
  `src/components/KanbanBoard/KanbanBoard.stories.tsx` (repo convention: every component has a
  story); add an e2e assertion (board renders, card opens modal).
- New post: `blog/<date>-experimentation.md` (`kind: legend` or a board kind) embedding the
  Experimentation `<KanbanBoard board="experiments"/>` — this is the board/index that replaces
  the README timeline.
- **Per CB3 — visual + mobile validation (part of this commit's gate, not optional):** after the
  board renders, run a visual+mobile pass on the component — Storybook story at a MOBILE viewport
  (tap targets ≥44px, no horizontal overflow, ≥16px text, columns reflow/scroll, modal usable
  one-handed, Escape/scrim/touch close works) AND the `audit-mobile-experience` rubric on the
  board POST page at :4173 with a screenshot to the Dropbox audit dir. Defer findings → GitHub
  issues (ISSUES.md dedup); fix cheap ones in-PR.
- Verify: Storybook builds; `make start` renders the board; click a card → modal → link to the
  experiment post; e2e green; **board + modal pass the mobile rubric (no P0); `generate-assets`
  emits `kanban-data.json` and it is untracked.**

### Commit 5 — PM topic cleanup + Ideas board + Legend hub + simplify guide
(Tasks #11-cleanup, #10, #1/#2/#3.) Depends on Commit 4 (board component).
- **PM cleanup** under durable/temporal: keep the durable lifecycle **framework/strategy** in
  `/craft/product-management`; move the individual dated ideas/initiatives/projects to
  `/initiatives` (each move + `{from,to}` redirect); consolidate the two
  `unorganized-*-ideas.md` dumps; prune/fill thin sections (initiatives/projects/tinkering).
  Add an **Ideas/Initiatives** `<KanbanBoard board="ideas"/>` where appropriate.
- **Legend hub**: simplify `blog/2026-06-24-a-guide-to-these-posts.mdx` into a lean pointer
  hub ("if you want emoji usage → see here", "difference between sections → see here",
  "terminology → see here"), KEEPING the drift-checked emoji table (or moving it to a linked
  legend post and updating the drift-check source-of-comparison accordingly — decide at
  execution; simplest is keep the table on the hub). Add the **durable vs temporal** explainer.
- **Navbar "Legend"** item → the hub (give it slug `/legend` with a redirect from the old
  slug, or point navbar at the current URL — decide at execution; `/legend` is cleaner).
- **Terminology** (`/craft/software-development/terminology`) and other glossary pages: link
  from the Legend hub. (They can stay in place — durable content belongs in `/craft`; the
  Legend just indexes them. Only move if the user wants a single glossary home, which needs
  redirects.)
- Verify: `make validate-structure`, `validate-links`, em-dash hook (no literal — in
  reader-facing content), build clean.

### Commit 6 — Craft Leadership topic + move `how-i-ask-others-questions`
(Tasks #5, #6.) Independent of the board work; depends on Commit 1 (route).
- New topic `docs/craft/leadership/` with `README` (absolute instance-relative `slug:
  /leadership`), `_category_.json` (label + emoji + position). Validator auto-discovers it.
- Move `blog/<...>how-i-ask-others-questions` → `docs/craft/leadership/how-i-ask-others-
  questions.mdx` (blog→doc frontmatter conversion); `{from:'/initiatives/how-i-ask-others-
  questions', to:'/craft/leadership/...'}` redirect.

### Commit 7 — Journey: rename topic, Self Reflection topic, move `what-i-ask-myself`, tag + cross-ref
(Tasks #4, #7, #8, #9.) Depends on Commit 1.
- **#4 Rename** `personal-growth` → "Personal Habits": change the **label** in
  `docs/journey/personal-growth/_category_.json` + README title + emoji. **Label-only by
  default → no redirect** (slug unchanged). If the user wants the URL changed too, rename slug
  + add redirect (confirm at execution).
- **#7 Self Reflection**: new top-level `docs/journey/self-reflection/` (README `slug:
  /self-reflection`, `_category_.json` label+emoji+position).
- **#8 Move** `blog/<...>what-i-ask-myself` → `docs/journey/self-reflection/...` (blog→doc;
  redirect from `/initiatives/what-i-ask-myself`).
- **#9 Tag + cross-ref**: apply a shared tag (name TBD, e.g. `ask-myself`) to all
  ask-myself **blog** posts that REMAIN in `/initiatives` (the examples); from the Self
  Reflection doc(s), link to the tag collection page `/initiatives/tags/<tag>` as examples.
  (Resolve the tension: the reflection EXPLAINER lives in `/journey` docs; the tagged EXAMPLE
  posts stay as `/initiatives` blog posts.)

### Commit 8 — Skills: board-aware idea-grooming skill + reworked experiment skills
(Tasks #12, #14-skills.) Depends on Commits 4 (boards) + 3 (experiment posts).
- New **idea-grooming skill** (project `.claude/skills/<name>/SKILL.md`): where a new
  idea/initiative is captured (an `/initiatives` post, not a `/craft` doc), required
  frontmatter (`kind`/`stage`/`priority`), how advancing a card = a `stage` frontmatter change
  that moves it across board columns, how to distill a durable learning back into `/craft` on
  conclusion. **Board-aware**: enumerate the boards (Experimentation, Ideas/Initiatives), each
  board's columns, and the kind→board mapping. Register in the CLAUDE.md skills map.
- **Rework experiment-lifecycle skills** (`design/run/analyze/decide/conclude-experiment`) to
  drive a `/initiatives` experiment **post** (kind flips plan→result) + the **board**, instead
  of a `/craft` doc + README table. **CAVEAT**: these skills + `author-blog-post` live outside
  the repo (global/plugin scope) — edits are out-of-repo; if not editable here, capture the
  required changes in the PR description / a follow-up and flag explicitly.
- Use `condense-skill` to tighten the new skill after drafting.

### Commit 9 — Glossary-linking skill + validator + hook + apply (NEW)
(User request.) Build a glossary auto-linking SYSTEM as its own skill with hooks + validation,
then APPLY it. Rule: the FIRST instance of a glossary term in a blog post gets a footnote-style
anchor link to that term's specific definition in the single glossary home (built in C5);
"if applicable" = only when the term is defined and only the first occurrence per post.
- **Skill**: new `.claude/skills/<glossary-linking>/SKILL.md` — how a definition gets a stable
  anchor id in the glossary home; how a post links the first instance to that anchor
  (footnote link); the first-instance-only / only-if-defined rule; how to apply it to a post.
  Register in the CLAUDE.md skills map.
- **Validator**: `scripts/validate-glossary-links.js` (warn-tier) — flags (a) a glossary
  term's first instance in a post NOT linked, (b) a glossary link → missing definition anchor
  (broken), (c) a term linked more than once per post (only the first should link). Wire into
  `make` (e.g. `make validate-glossary`) + the validation suite.
- **Hook**: `.claude/hooks/validate-glossary-links-hook.sh` PostToolUse `Write|Edit`, registered
  in `.claude/settings.json` alongside the other content hooks — **warn-tier** (mirror the
  warn-only hooks; NOT blocking unless the user asks).
- **Apply**: run across existing blog posts to add first-instance footnote anchors where
  applicable. Idempotent — re-running must not double-link.
- Verify: validator runs (warn-tier, exits 0); hook fires on a Write/Edit and surfaces a
  planted missing-link; a sample post shows the first-instance term linked to the right anchor;
  `make build` clean; em-dash hook clean on new reader-facing text.
- **Depends on C5** (the single glossary home + anchored definitions must exist first).

### Commit 10 — Docs-of-record + CLAUDE.md conventions update + PR (LAST)
- Update `CLAUDE.md` to encode the **durable(`/craft`) vs temporal(`/initiatives`)** model,
  the `/thoughts`→`/initiatives` rename, the board/kind conventions (new kinds + kanban boards),
  the new **idea-grooming** skill AND the **glossary-linking** skill in the skills map table,
  and the glossary-linking convention (CLAUDE.md tenet: structure decisions update the
  structure docs/checks in lockstep).
- Archive the completed tasks to the changelog (≥10 completed will be hit): append a dated
  batch to `bytesofpurpose-blog/changelog/CLAUDE-CHANGELOG.md`, run
  `node bytesofpurpose-blog/scripts/generate-changelog-data.js`, then delete the completed
  tasks.
- **PR (not a commit)**: push `feat/durable-temporal-reframe`; `gh pr create` with a body
  summarizing C1–C9 + the CB1–CB3 build-system hardening + verification evidence + any
  out-of-repo experiment/author skill follow-ups (from C8). **DO NOT MERGE** — ask the user to
  merge (CLAUDE.md: never self-merge).
- Depends on: all of C1–C9 **and CB1–CB3**.

---

## Dependency graph (commit order)
```
C1 rename ─► C2 kinds ─► C3 move experiments ─► C4 KanbanBoard+ExpBoard ─► C5 PM/Legend/glossary-home ─► C9 glossary skill+hook
   │                            │                                                                              │
   ├─► C6 Leadership+move        └─► C8 board-aware skills ◄── C4                                              │
   ├─► C7 Journey rename/SelfReflection/move/tag                                                              │
   └──────────────────────────────────────────────────► C10 CLAUDE.md + changelog + PR (last) ◄─────────────┘
```
C6 and C7 only need C1 (authorable anytime after the rename). C8 needs C3 (experiment posts) +
C4 (boards). C9 needs C5 (glossary home). C10 needs ALL of C1–C9, then opens the PR (no merge).

**Build-system hardening (folded in, raised mid-C1):**
```
CB1 generated-asset pipeline (DONE) ─► CB2 build-system /designs post ◄── (ideally) C4
                                   └─► (C4's kanban generator must join generate-assets)
C4 KanbanBoard ─► CB3 visual+mobile validation of our components
C10 (last) now also depends on CB1, CB2, CB3.
```
CB1 is DONE. CB2 depends on CB1 (best after C4). CB3 depends on C4. C4 additionally depends on
CB1 (kanban generator born inside `generate-assets`, output gitignored + in the guard hook).

## Task list (loop-ready) — mirrors the tracked tasks 1:1 (durable copy in case the list is cleared)
| Task ID | Commit | Subject | Blocked by (task IDs) | Verify gate |
|---|---|---|---|---|
| 15 | C1 | Rename blog `/thoughts` → `/initiatives` (FIRST) | — | `make build` clean; `/thoughts/*` AND `/blog/*` → `/initiatives/*` |
| 16 | C2 | Add kinds learning-plan 📚 / experiment-plan 📝 / experiment-result 📊 | 15 | `node scripts/validate-post-outline.js` — no legend-drift / unknown-kind |
| 17 | C3 | Move experiments → `/initiatives` posts (apply kinds) | 15, 16 | `make validate-links`; build clean; old experiment URL 301s |
| 18 | C4 | Interactive `KanbanBoard` + generator + Experimentation board post | 17 | Storybook builds; board renders; card→modal→post; `make test-regression` |
| 19 | C5 | PM cleanup + Ideas board + Legend hub `/legend` + simplify guide + glossary home | 18 | validate-structure + validate-links + em-dash + outline (legend-drift) + build |
| 20 | C6 | Craft Leadership topic + move how-i-ask-others-questions | 15 | validate-structure + validate-links + build; old URL 301s |
| 21 | C7 | Journey: Personal Habits (label-only) + Self Reflection topic + move what-i-ask-myself + ask-myself tag | 15 | validate-structure + validate-links + build; `/initiatives/tags/ask-myself` renders |
| 22 | C8 | Board-aware idea-grooming skill + rework experiment-lifecycle skills | 17, 18 | new SKILL.md present + registered in CLAUDE.md skills map |
| 23 | C9 | Glossary-linking skill + validator + warn-tier hook + apply | 19 | validator exits 0; hook surfaces planted missing-link; sample post linked; build |
| 24 | C10 | CLAUDE.md conventions + archive tasks to changelog + open PR (no merge) | ALL of C1–C9 + CB1–CB3 | both new skills in CLAUDE.md map; changelog renders; full suite green; PR opened |
| CB1 | CB1 | Gitignore generated assets + `generate-assets` target + edit-guard hook + guidance **(DONE)** | — | hook exits 2 on generated paths / 0 on source+exception+secrets; `generate-assets` recreates all 3; fresh-checkout build clean; none tracked |
| CB2 | CB2 | Build-system `/designs` post (folders, generators, frontmatter→asset→consumer, fail-closed hygiene) | CB1 (best after C4) | build clean; em-dash clean; outline ok; renders at `/designs/<slug>` |
| CB3 | CB3 | Visual + mobile validation of our components (KanbanBoard, modal, cards) | C4 | board+modal pass mobile rubric (no P0); screenshot in Dropbox audit dir; convention documented; mobile spec (if added) green |

> **ID note (post-clear resume):** the original session used task IDs 15–24. After a clear
> mid-effort, tasks were re-created with fresh IDs — C1–C10 → IDs **1–10**, and the three
> build-system commits as **CB1=#11, CB2=#12, CB3=#13**. The Commit/CB labels (not the numeric
> IDs) are the stable handle; map by label, not number, on resume.

To resume after a clear: if the task list is empty, re-create the tasks from this table
(subjects + blocked-by + the per-commit detail in the "Commit N" / "CB" sections above), then
drive the loop. **CB1 is already DONE** (committed `16bb4b95`). The full per-commit instructions,
file paths, and locked decisions are in the sections above — this table is the index, not a
replacement for them.

---

## Verification (end-to-end)
- **Build gates**: `make build` clean (MDX build-breakers: no bare `<br>`, no unescaped
  `{word}`); `make validate-structure`; `make validate-links` (no broken/stale/published→draft);
  `node scripts/validate-post-outline.js` (no `legend-drift`/`unknown-kind`; new kinds'
  outlines satisfied); em-dash hook (no literal — in reader-facing content).
- **Redirects**: curl/build-check that `/blog/<post>`, `/thoughts/<post>` → `/initiatives/<post>`;
  each moved page's old URL 301s (experiments, how-i-ask-others-questions, what-i-ask-myself,
  PM ideas).
- **Component**: Storybook builds; `make start` (drafts visible) → both boards render; clicking
  a card opens the modal and links to the post; `make test-regression` (prod build :4173) green
  incl. a11y/SEO + the new board e2e assertion. (Dev server: restart to clear the stale
  route table after route renames/moves; curl gives a false 200 on the dev SPA — verify in
  browser.)
- **Manual read-through**: Legend hub reads as a clear "how this blog works" (durable vs
  temporal) front door; Craft holds only durable content; Initiatives holds the dated work.

## Locked execution decisions (resolved with user — no longer open)
- **`learning-plan` emoji = 📚** (books). Distinct from the 9 existing kinds + experiment 📝/📊.
- **Legend hub route = `/legend`**: simplified `a-guide-to-these-posts` gets slug `/legend`;
  add a `{from: <old guide URL>, to: /legend}` redirect; navbar "Legend" → `/legend`.
- **#4 rename = LABEL-ONLY**: "Personal Growth" → "Personal Habits" via `_category_.json`
  label + README title + emoji. Slug `/journey/personal-growth` UNCHANGED → **no redirect**.
- **#9 tag = `ask-myself`**: apply to the ask-myself example posts that stay in `/initiatives`;
  Self Reflection doc links to `/initiatives/tags/ask-myself`.
- **Terminology = MOVE to a single glossary home under the Legend area** (with `{from,to}`
  redirects for `/craft/software-development/terminology` + any other glossary pages).
- **Experiment/author skills**: the loop ATTEMPTS to edit them in place if reachable; if they
  are out-of-repo/unreachable, capture the required changes in the PR body as a follow-up.
