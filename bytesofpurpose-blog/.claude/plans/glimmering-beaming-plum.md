# Plan: Hub system — kinds + unified `area`, move 34 logs, Tinkering/Research hubs, formalize

## Context

Continues the "durable vs temporal" reorg (PRs #145 Projects hub + 25 moved logs, #146 bookmarks,
#147 repo catalog merged; #148 restart-hook in review). The user flagged more dated logs still in
`/craft` under Software Development — `*/projects`, `*/tinkering`, `*/research` — all dated
`@done()`/`[ ]` task logs (build logs, "Tinkering with X", "Learning X" to-learn lists). These are
temporal, acted-on work → belong on `/initiatives`, indexed by durable `/craft` **hubs**.

The user then pushed the design further, and these decisions are now locked:
- **/craft docs CAN carry `kind:`** (41 `showcase` docs already do; the outline validator already
  applies a kind's outline to docs). "Not all craft docs are the same" → make a hub a real type.
- **Unified `area:` frontmatter** (not per-hub `project_area`/`tinker_area`/`research_area`), so
  the model scales to "many research hubs in different areas."
- **A hub = posts of a given `kind:` grouped by `area:`.** Discriminate by kind: new `kind: project`
  (🔨) + `kind: tinkering` (🔧); reuse existing `kind: research` (🔬). Research posts ALSO carry
  `kind: research` so they auto-card on the EXISTING Research board — hub complements the board.
- **`kind: hub`** (🗂️) for the hub doc pages, WIRED (not inert): docs get a kind-emoji like blogs.

Scope confirmed: move ALL 34 files; build Tinkering + Research hubs; migrate the Projects hub to the
new `kind: project` + unified `area`; formalize (CLAUDE.md convention + `manage-hubs` skill).

## The frontmatter model (backbone)

Every hub-eligible `/initiatives` post carries:
- `kind:` — the activity: `project` 🔨 | `tinkering` 🔧 | `research` 🔬 (all NEW/reused blog kinds)
- `area:` — the domain: `backend` | `frontend` | `script` | `plugin` (one unified field)

A hub doc (`/craft/software-development/{projects,tinkering,research}/README.md`) carries
`kind: hub` and renders `<Catalog kind="project|tinkering|research"/>`, which groups that kind's
posts by `area`. The generator is manifest-driven so adding a hub is a config entry, not new code.

## The 34 files (ALL `draft: true` → NO redirects needed)

- **projects (13):** backend-development/projects (8) + plugins/projects (5) → `kind: project`,
  `area: backend|plugin`
- **tinkering (10):** backend (3) + frontend (1) + plugins (3) + scripting (3) → `kind: tinkering`,
  `area: backend|frontend|plugin|script`
- **research (11):** backend (8) + frontend (2) + scripting (1) → `kind: research`,
  `area: backend|frontend|script`

3 files lack `date:` (add from git-creation: my-first-vscode-plugin 2021-09-15, learning-aws /
learning-bash 2025-09-14). Since ALL are draft, the validate-redirects gate needs no entries (a draft
has no public `/craft` URL; a redirect→draft would fail the gate — proven in #145).

## Implementation

### Part A — the kind system (`blog-kinds.json` + validators + docs emoji)
1. `scripts/lib/blog-kinds.json`: add `project` (🔨), `tinkering` (🔧), `hub` (🗂️). Give each an
   `outline`. For `hub`: outline = renders a `<*Catalog/>` (a component tag in body) + non-empty
   `description`. Mark `hub`/`project`/`tinkering` appropriately (no thought/mindset flag; they are
   neutral/durable-ish like `reflection`). `research` already exists — unchanged.
2. `scripts/validate-post-outline.js` already scans docs and applies a kind's outline when the kind
   is in `blog-kinds.json` — so `kind: hub`'s outline is enforced for free. Confirm the `demonstrates`-
   style check for the catalog tag; add a `hub` CHECKS entry if a new outline id is introduced.
3. `plugins/draft-docs/index.js`: the blog loop derives a kind-emoji (`BLOG_KIND_EMOJI[data.kind]`)
   for sidebar labels; the DOCS walk does not. Extend the docs walk to derive the same kind-emoji so
   a `kind: hub` doc shows 🗂️ in the sidebar (mirrors the blog logic already in the file). Keep
   folder-emoji (`emoji-map.json`) as the fallback when a doc has no kind.
4. Keep the kind→emoji legend tables in lockstep (the Start Here / Thoughts legends read blog-kinds;
   the new kinds are docs-oriented so they need no thought/mindset legend row, but the outline
   validator + any "all kinds" table must not break).

### Part B — unified `area` + generic Catalog (refactor ProjectsCatalog)
5. Generalize `scripts/generate-projects-data.js` → `scripts/generate-hubs-data.js` driven by a
   `HUBS` manifest (mirrors `generate-kanban-data.js`'s `BOARDS`):
   `{ project: {kind:'project', out:'ProjectsCatalog', areas:[...]}, tinkering: {...},
   research: {...} }`. Scan `blog/` once; for each post with a hub `kind` + `area`, bucket into that
   hub's `<area>` list. Read `area:` (unified) — NOT `project_area`. Emit one JSON per hub
   (`{ProjectsCatalog,TinkeringCatalog,ResearchCatalog}/*-data.json`). Reuse the existing draft
   handling (keep+mark, don't drop).
6. Generalize the component: `ProjectsCatalog/index.tsx` → a generic `<Catalog>` taking a `kind`
   prop + an AREA_META map, reused for all three (the CSS module is already fully generic — share
   verbatim). Provide thin `ProjectsCatalog`/`TinkeringCatalog`/`ResearchCatalog` wrappers OR one
   `<Catalog kind="…"/>` registered in `MDXComponents.tsx`. (Component-side is ~90% generic per
   exploration.)
7. **Migrate the 25 existing #145 posts**: `project_area:` → `area:`, `kind: reflection` →
   `kind: project`. Update the Projects hub README to `kind: hub` + `<Catalog kind="project"/>`.
   Retire `project_area` everywhere (generator no longer reads it).
8. Wiring per generated asset (the generated-asset convention): package.json `generate-*` +
   `generate-assets` chain; `.gitignore` lines for the new `*-data.json`; the
   `.claude/hooks/block-generated-edits.sh` case entries (this hook DOES exist — it fired on JSON
   writes this session; the Explore agent ran in a stale checkout and missed it).

### Part C — move the 34 logs (same surgical mechanism as #145, proven)
9. Node script: for each file, surgical frontmatter reshape (NOT gray-matter reserialize — mangles
   emoji titles): `slug`→bare; add `date:` if missing; set `kind:` (project/tinkering/research);
   add `area:`. `git mv` into `blog/` as `YYYY-MM-DD-<slug>.md`. Body untouched. Draft preserved.
10. Retire the emptied `*/projects`, `*/tinkering`, `*/research` folders + their `_category_.json`.
    Fold `frontend-development/research/README.md` into the new Research hub (move content, redirect
    if it were published — it's draft, so just retire). No redirects (all 34 are draft).

### Part D — the three hubs
11. New hub docs `docs/craft/software-development/{tinkering,research}/README.md` (`kind: hub`,
    absolute slug, `_category_.json`, description, `<Catalog kind="…"/>`), mirroring the Projects
    hub. Projects hub migrated in step 7. Position them near the top under Software Development.

### Part E — formalize (CLAUDE.md convention + manage-hubs skill)
12. **CLAUDE.md operating convention** "every hub is defined by a (kind, area) in the hub registry",
    following the repo's convention template (registry file + exported symbol → validator → warn
    hook → blocking `make` gate → owning skill). The registry = the `HUBS` manifest in
    `generate-hubs-data.js`. A `make validate-hubs` (+ warn hook) checks: every `kind: hub` doc has a
    matching manifest entry + renders a `<Catalog>`; every hub-kind post has a valid `area`.
13. **`manage-hubs` skill** (`.claude/skills/manage-hubs/SKILL.md`): the single source of truth —
    the hub registry (kind→area→page), the generic generator+component pattern, the generated-asset
    wiring checklist, add-a-hub steps. Add a row to the CLAUDE.md "Skills map (SDLC)" table. Pairs
    with `groom-initiatives`, `implement-with-design-system`, `maintain-showcase`.

## Critical files
- `scripts/lib/blog-kinds.json` (add project/tinkering/hub kinds)
- `scripts/validate-post-outline.js` (hub outline enforcement — mostly already works for docs)
- `plugins/draft-docs/index.js` (derive kind-emoji for DOCS, not just blogs)
- `scripts/generate-projects-data.js` → `scripts/generate-hubs-data.js` (manifest-driven, reads `area`)
- `src/components/ProjectsCatalog/` → generic `src/components/Catalog/` (+ CSS reused verbatim)
- `src/theme/MDXComponents.tsx` (register the generic Catalog / wrappers)
- `docs/craft/software-development/{projects,tinkering,research}/README.md` (hub docs, `kind: hub`)
- `package.json`, `.gitignore`, `.claude/hooks/block-generated-edits.sh` (generated-asset wiring)
- `scripts/validate-hubs.js` + `.claude/hooks/validate-hubs-hook.sh` + Makefile target (new gate)
- `CLAUDE.md` (new operating convention + Skills-map row), `.claude/skills/manage-hubs/SKILL.md`
- The 34 content files (git mv + reshape) + the 25 #145 posts (project_area→area, reflection→project)

## Verification
- `make build` SUCCESS; the 3 hubs render area groups; moved posts resolve under `/initiatives` in
  the prod build; drafts excluded from `/initiatives` but shown-muted in hubs; `kind: research`
  posts appear on the existing Research board; `kind: hub` docs show 🗂️ in the sidebar.
- `make validate-redirects` (no new entries; still clean), `validate-structure`, `validate-links`,
  `validate-post-outline` (hub outline), and the NEW `make validate-hubs` all pass.
- `generate-assets` runs the unified hub generator; emits all three `*-data.json`.
- Visual + mobile pass on the new Tinkering + Research hubs (375px reflow + desktop).

## Sequencing (PRs)
1. **PR 1 — kind system + generic Catalog + migrate Projects** (Parts A, B): additive kinds, docs
   emoji, generic generator/component, migrate the 25 existing posts. Provable in isolation (Projects
   hub keeps working, now via `kind: project` + `area`).
2. **PR 2 — move the 34 logs + Tinkering/Research hubs** (Parts C, D): depends on PR 1's kinds +
   generic Catalog existing.
3. **PR 3 — formalize** (Part E): CLAUDE.md convention + `validate-hubs` gate + `manage-hubs` skill.

Each PR: verify locally, put evidence in the body, ask before merging, squash-merge, sync master.
Rebase later PRs on freshly-merged master (learned from this session's conflict resolution).
