# Phase G — Split Development into Product Management + Software Development

## Origin
During T18 (draft triage) Omar redirected: Development is too large and should be
reorganized by **domain sub-topic**, and the idea/lifecycle buckets belong in a separate
**Product Management** topic. This plan captures the design + decisions and supersedes
the simpler "sub-topics under Development" sketch in `dev-restructure-map.tsv`.

## Locked decisions (from Omar, this session)
1. **Rename** Development → **Software Development**.
2. **New root topic: Product Management** — owns the idea→ship LIFECYCLE: ideas,
   research(overview), POCs, experiments, initiatives, projects(index), roadmaps.
3. **Software Development** owns the BUILD DOMAINS as sub-topics, each repeating the
   recurring shape (`projects/ research/ techniques/`, + `tinkering/` where it fits):
   - `backend-development/`
   - `frontend-development/`
   - `scripting/`  (folded in from the root `5-scripting/` topic — Scripting ceases to
     be a root topic; its Welcome card is removed)
   - `plugins/`
   Cross-cutting `vocabulary/` + `prompts/` stay at the Software Development root.
4. **Developed artifacts live in Software Development; ideas live in Product Management.**
   There must be a **mapping between idea files (PM) ↔ execution files (SW Dev)**.
5. **Mapping encoding: in-body markdown links + convention.** A PM idea/initiative doc
   links to its execution artifact(s) under an `## Execution` section; the SW Dev
   artifact links back under an `## Idea` (or `## Origin`) section. (NOT frontmatter
   cross-refs, NOT a central manifest.)
6. **Validation is WARN-only** (consistent with the existing structure validator where
   only absolute-slug is ERROR). The mapping convention is checked by the validator +
   the warn-only PostToolUse hook — never blocks.
7. **URLs FROZEN**: every doc keeps its existing ABSOLUTE slug. Moving files changes
   folder path + sidebar only; ZERO URL changes / 404s. (Same invariant as Phases A–F.)
8. **Depth rule relaxed to ≤4** (sub-topic / bucket / project = depth 4 is legitimate).
   Validator + skill contract + CLAUDE.md updated in the SAME change as the moves.
9. **Structure must be DOCUMENTED in Welcome AND VALIDATED via hooks.** Welcome gets:
   the two changed/new topic cards (Software Development reshaped; Product Management
   new), the lifecycle(PM)↔domain(SWDev) split explanation, and the idea↔execution
   mapping convention. The Welcome-drift validator check already guards the cards.
10. **Sequencing:** Phase G (restructure) FIRST, then resume T18 draft triage + T17 ship
    against the new structure.

## RESOLVED decisions (Omar confirmed, this session)
- **Habit docs** `habits-developing.mdx`, `habits-tinkering.mdx` → **move to Personal
  Growth** (10-personal-growth/), co-located with other habits.
- **Scripting card removed from Welcome + root sidebar** — Scripting becomes
  `2-development/scripting/`; the lifecycle/domain explainer covers it. URLs frozen.
- **idea-vs-built classification of tinkering + my-firsts** (the core new rule:
  unbuilt wishlist/checklist → Product Management/ideas; actually-built/executed →
  Software Development artifact in its domain):
  - → **product-management/ideas** (8): my-first-intellij-plugin, my-first-ios-app,
    my-first-mac-menubar-app, my-first-noteplan-plugin, my-first-react-app,
    tinker-browser-automation, unorganized-software-development-ideas,
    unorganized-tool-script-development-ideas.
  - → **Software Development** (in their domain): my-first-chrome-plugin → plugins;
    my-first-vscode-plugin → plugins; my-first-brew-plugin → plugins (work started);
    tinker-applescript, tinker-linux, tinker-mac-automation → scripting/tinkering;
    tinker-graphql, tinker-type-projections, tinker-timeouts → backend/tinkering
    (timeouts: work started); tinker-geometric-design → frontend/tinkering.
- This idea/built split SEEDS the idea↔execution mapping: the PM idea docs are exactly
  what will carry `## Execution` links to their future SW Dev artifacts.

## Proposed trees (from `dev-pm-restructure-map.tsv`: 93 DEV, 14 PM, 2 REVIEW)
```
docs/
  product-management/          (NEW root topic — lifecycle)
    ideas/  research/  pocs/  experiments/  initiatives/  projects/(index)  roadmaps/
  2-development/               (label → "Software Development"; slug /development kept)
    vocabulary/  prompts/      (root-level, cross-cutting)
    backend-development/   projects/ research/ techniques/ tinkering/
    frontend-development/  projects/ research/ techniques/ tinkering/
    scripting/             projects/ research/ tinkering/   (folded from 5-scripting/)
    plugins/               projects/ tinkering/
```

## Idea↔execution mapping convention (to encode + validate)
- A Product Management idea/initiative/POC doc SHOULD have an `## Execution` section
  containing markdown link(s) to its SW Dev artifact(s) (absolute `/development/...`).
- A SW Dev project/artifact that came from a PM idea SHOULD have an `## Idea` (or
  `## Origin`) section linking back to the PM doc (absolute `/product-management/...`).
- Validator check `idea-exec-link` (WARN): for each link in an `## Execution` /
  `## Idea` section, the target slug resolves to an existing doc; and (advisory) the
  back-link exists on the other side. Never blocks.

## Validator / hook / docs changes (lockstep with the moves)
- `scripts/validate-docs-structure.js`: depth ≤3 → ≤4; add `idea-exec-link` warn check;
  the Welcome-drift check picks up the new PM card + dropped Scripting card automatically.
- `review-reader-experience` SKILL.md "Topic-folder contract" section: document depth ≤4,
  the PM/SWDev split, and the idea↔execution mapping convention.
- `CLAUDE.md`: update the topic list (add Product Management, rename to Software
  Development, note Scripting folded in) + the structure-decision convention.
- `docs/1-welcome/README.md`: reshaped Software Development card + new Product Management
  card + the lifecycle↔domain + mapping-convention explainer.
- Memory `docs-topic-taxonomy.md`: record the PM/SWDev split decision.

## Verification (same invariant spine as Phases A–F)
Clean `make build`; manifest diff vs `routes-before.txt` — REMOVED must be ONLY
already-approved retirements (no NEW removals; all slugs frozen); ADDED only the new PM
landing routes + any intended new category landings. `make validate-structure` clean
(0 errors; warns acceptable). `make validate-links`. Then resume T18 → T17.

## Status (updated mid-session)
- **G1 design**: ✅ approved by Omar.
- **G2 moves**: ✅ DONE in working tree, NOT yet committed. 103 `git mv` via
  `.claude/plans/dev-pm-move.js --apply` + 5 corrective moves (sql-query-analyzer→
  prompts, terminology-*→vocabulary, setup-machine/running-ha→workspace) + 3 README
  renames to kebab-case (security-techniques.md, tool-composition.mdx, hello-worlds.mdx).
  30 stale `_category_.json` removed from emptied dirs; 28 new category files created;
  `5-scripting/` dissolved; root relabeled "🧩 Software Development".
- **G3 mapping check**: ✅ `idea-exec-link` warn check added to validate-docs-structure.js.
- **G4 depth + lockstep**: ✅ depth ≤3→≤4 in validator; SKILL.md contract section,
  CLAUDE.md, and docs-topic-taxonomy memory all updated.
- **Validator status**: `node scripts/validate-docs-structure.js` → 0 errors, 3 warns
  (2 pre-existing blogging/interview `-techniques` framing folders + 1 welcome-drift for
  the Scripting card, which G5 removes). PASSES.
- **⏸️ BUILD GATE NOT PASSED**: clean build + route-manifest diff vs routes-before.txt
  NOT yet run — PAUSED because another session was building (shared build/.docusaurus
  collision caused a spurious `__server/server.bundle.js` ENOENT). MUST run a clean
  build + manifest diff (expect: only new product-management/* landing routes ADDED;
  the 5 prior approved retirements REMOVED; NO new doc-URL removals — all slugs frozen)
  before committing Phase G.
- **G5 Welcome**: ✅ done — dropped Scripting card; added Product Management card;
  added lifecycle↔domain + mapping-convention explainer; created PM topic landing
  README (`slug: /product-management`). Welcome-drift warn cleared.
- **PM folder numbered**: `product-management/` → `5-product-management/` (slot freed by
  Scripting), position 5, so the validator treats it as a first-class numbered root
  topic (the drift/topic-readme checks only recognize `^\d+-` folders). Slug unchanged.
- **Manifest verified (build 3)**: 590 routes, IDENTICAL diff to pre-G — the 103 moves
  removed ZERO doc URLs (all slugs frozen). Only the 5 prior approved retirements show
  as removed. PM docs are draft → not yet in manifest (appear on T18 publish).
- **G6 numbering standardization**: still pending as a broader sweep (task #11) — the PM
  rename is one instance; the general mixed-prefix inconsistency across sub-folders
  remains to decide (position-based vs prefix-based).
- **Final build (build 4)**: IN PROGRESS — confirms Welcome + PM README + folder rename;
  expect `/product-management` ADDED as a new route (PM landing, draft:false).

### Resume checklist (when build dir is free)
1. `cd bytesofpurpose-blog && rm -rf build .docusaurus && yarn clear`
2. `make build` (background) → on success: `find build -name '*.html' | sort >
   /tmp/routes-g.txt` (RUN FROM bytesofpurpose-blog/ — cd doesn't persist across Bash
   calls; the earlier 2-route result was a wrong-dir artifact).
3. `comm -23 .claude/plans/routes-before.txt /tmp/routes-g.txt` → removals must be ONLY
   the 5 already-approved retirements (craftsmanship/craftsmanship, techniques/techniques,
   development/development, blogging-techniques/blogging-techniques,
   scripting-techniques/scripting-techniques). Zero NEW doc-URL removals.
4. `make validate-structure` (0 errors) + `make validate-links`.
5. Do G5 (Welcome), rebuild, re-diff. Then commit Phase G as one batch.
6. Resume the loop: G6, then T18 draft decisions, then T17 ship.
