# Split docs into "Craft" and "Self" (two-tier IA + folder-mirrored slug rewrite)

## Context

The docs sidebar is one flat list of 10 topics behind a single **"Learn"** navbar
item. The user wants to express a real conceptual split — **Craft** (how I see the
world, that others benefit from) vs **Self** (how I see myself; reference material
that mainly benefits me). The split should be structural and visible, not just a
private organizing principle.

Decisions already made (fixed):
- **Craft** = generative-ai, software-development, product-management, productivity,
  blogging, interview-prep, companies, entrepreneurship.
  **Self** = faith, personal-growth.
- **Physically move** the 10 topic folders under new `docs/craft/` and `docs/self/`
  parents. `docs/welcome/` stays at root.
- **Rewrite all slugs to be folder-path mirrored** — new absolute slug == new folder
  path (e.g. `docs/craft/software-development/x` → `/craft/software-development/x`;
  topic README → `/craft/<topic>`, no doubling). This intentionally discards today's
  *themed* slugs (`/development`, `/techniques/*`, `/skills/*`, `/habits/*`,
  `/craftsmanship/*`) which currently cross folder boundaries.
- **Two navbar items** ("Craft", "Self"), each opening its own sidebar.
- **Preserve every old URL** via redirects.

Outcome: a two-tier site (`/docs/craft/...`, `/docs/self/...`) with self-documenting
URLs that match the folder tree, old URLs redirected, the navbar showing the split,
and all validators/tests/structure-checks updated to encode the new contract.

## Key facts that shape the approach

- **Slugs are themed, not folder-matched today**, and cross folders (`/development/*`
  spans both software-development AND product-management; `/techniques/*` spans 4
  topics). So old→new is **per-file**, never a prefix substitution. 299 docs carry
  slugs; ~120 cross-doc `](/docs/<oldslug>...)` links exist across 46 docs.
- **Absolute-slug is the ONLY ERROR-tier rule** (`validate-docs-structure.js`),
  enforced warn-only by the PostToolUse hook. Keep explicit slugs — do **not** switch
  to path-derived URLs (would force relaxing the one hard contract the system is
  built on). Folder-mirrored slugs are machine-generated + machine-verifiable, giving
  derivation's tidiness with the explicit contract's safety.
- **Topic detection is positional**: `topicFolders()` = direct children of `docs/`
  with a `_category_.json`. After the move, **only `craft` and `self`** are topics;
  the 10 moved topics become sub-categories. So craft/self must each get a
  `_category_.json` (emoji label) + `README` with absolute slug to satisfy
  `checkTopicRoots()`.
- **Depth: moving re-roots the depth count and pushes the deepest chains to 5.**
  `software-development/frontend-development/techniques/storybook-typescript-babel`
  and `blogging/prompts/evals/{all-posts,specific-posts}` are 4 levels under their
  topic today; under `craft/` they become **depth-5**, tripping the `depth ≤ 4` warn.
  → bump the contract to `≤ 5` (we deliberately added a top tier) in the validator
  AND in CLAUDE.md / the `review-reader-experience` skill contract.
- `FRAMING_RE` does NOT match `craft`/`self` (safe). `LEGACY_SLUG_PREFIXES`
  (`/mental-models/`) unaffected (new slugs never start with it).
- **Two silent-breakage traps**: (1) the 20 existing redirects' `to:` values point at
  OLD themed slugs that will vanish — must be re-pointed; (2) welcome/README's 10
  topic cards (`/docs/development` etc., lines 20–63) all go stale.

## Approach

Drive the bulk rewrite with **one reviewable Node script** (`scripts/migrate-ia.js`)
so 299 slug edits + ~120 link edits + redirect generation are mechanical and
idempotent — not hand edits.

### Ordered steps (dependency-driven)

0. **Baseline**: clean tree, migration branch, capture `make validate-structure` +
   `make validate-links` baseline.

1. **`migrate-ia.js --plan` (PRE-move, read-only)**: walk current `docs/`, record each
   file's OLD frontmatter slug keyed by file path. Compute target folder path (apply
   the fixed topic→parent map) and the NEW folder-mirrored slug (README → its dir, no
   doubling; welcome excluded). Emit `{oldSlug→newSlug}` + `{filePath→newSlug}` and a
   **collision report**. This map is the source of truth for steps 4–6.

2. **Move folders with `git mv`** (history-preserving, renders as renames):
   `git mv docs/<topic> docs/craft/<topic>` ×8, `docs/self/<topic>` ×2. Leave
   `docs/welcome/`. Slugs are now stale-but-valid; site still builds (explicit slugs).

3. **Scaffold craft/self topic roots**:
   - `docs/craft/_category_.json` → `{"label":"🛠️ Craft","position":1}`
   - `docs/craft/README.mdx` → `slug: /craft` + `description:` (≥50 chars)
   - `docs/self/_category_.json` → `{"label":"🪞 Self","position":2}` (distinct emoji
     from personal-growth's 🌱)
   - `docs/self/README.mdx` → `slug: /self` + `description:`
   - Bump the 10 moved topics' `_category_.json position` if needed so ordering reads
     well within each group (current 1–10 still sort correctly; adjust only for taste).

4. **`migrate-ia.js --apply-slugs`**: line-level rewrite of ONLY the `slug:` value
   inside each file's frontmatter fence (no full MDX round-trip). welcome excluded.

5. **`migrate-ia.js --apply-links`**: rewrite `](/docs/<oldslug>...)` across all docs
   (incl. welcome) using the map — strip `#anchor`/trailing `/`, **exact-segment /
   longest match** (avoid `/development` matching `/development-foo`), reattach
   suffix. Relative `../` links stay within their topic — leave them.

6. **`migrate-ia.js --emit-redirects`** → update `docusaurus.config.js` redirects
   (~217–244): (a) add `{from:'/docs'+oldSlug, to:'/docs'+newSlug}` for every changed
   slug — this resolves the `/development/*` ambiguity because the map knows each
   file's real folder; (b) re-point the 20 existing entries' `to:` through the map;
   collapse any redirect chains to the final target.

7. **`sidebars.js`**: replace `tutorialSidebar` with:
   ```js
   craftSidebar: ['welcome/README', {type:'autogenerated', dirName:'craft'}],
   selfSidebar:  ['welcome/README', {type:'autogenerated', dirName:'self'}],
   changelogSidebar: [{type:'autogenerated', dirName:'.'}],  // unchanged
   ```
   welcome appears first in both; each parent autogenerates its topics by
   `_category_.json position`.

8. **Navbar** (`docusaurus.config.js` ~264–267): replace the `Learn` doc item with
   ```js
   {label:'Craft', type:'docSidebar', sidebarId:'craftSidebar', position:'left'},
   {label:'Self',  type:'docSidebar', sidebarId:'selfSidebar',  position:'left'},
   ```

9. **Update structure checks + content + tests** (per the "structure decisions must
   update the checks" convention):
   - `validate-docs-structure.js`: bump depth rule `≤4` → `≤5` (childDepth>=6 warns);
     update `checkWelcomeDrift` to expect the new welcome cards; (optional) add a
     warn that `slug === '/'+pathRelativeToDocs` to lock the folder-mirror invariant.
   - `CLAUDE.md` + `review-reader-experience` SKILL.md: document the new two-tier
     Craft/Self contract, the `≤5` depth allowance, and the folder-mirrored-slug rule.
   - `docs/welcome/README.mdx`: update the 10 topic cards to new slugs (and the
     `/docs/techniques/...docs-vs-blog-posts` link, line 97). Optionally regroup into
     two Craft/Self card clusters.
   - **E2E specs** — update hardcoded paths to new slugs:
     `ai-framework-landscape` → `/docs/craft/generative-ai/mental-models/...`
     (graph-selection-state.spec.ts ×7 + README); the `embed-structural-components/
     {footer,graph}` paths → their new `/docs/craft/blogging/...` path (support-ab-test,
     debug-menu, graph-renderer, graph-title-rendering); `/docs/definitions/definitions`
     → new craft path (dev-only-surfaces, draft-sidebar). `/docs/welcome/intro` and the
     two `src/` homepage CTAs are unchanged.
   - Hook `.claude/hooks/validate-docs-structure-hook.sh`: no change (warn-only).

## Critical files

- `scripts/migrate-ia.js` — **new**, the migration engine (4 flag-driven phases).
- `bytesofpurpose-blog/docusaurus.config.js` — navbar (~264) + redirects (~217–244).
- `bytesofpurpose-blog/sidebars.js` — two sidebars.
- `bytesofpurpose-blog/scripts/validate-docs-structure.js` — depth `≤5`, welcome-drift,
  optional folder-mirror assertion.
- `bytesofpurpose-blog/docs/welcome/README.mdx` — topic cards (lines 20–63, 97).
- New: `docs/craft/{_category_.json,README.mdx}`, `docs/self/{_category_.json,README.mdx}`.
- `CLAUDE.md` + `review-reader-experience` SKILL.md — contract update.
- 10 e2e specs under `test/e2e/` — hardcoded slug updates.

## Riskiest steps

1. **Redirects `to:` going stale + welcome cards going stale (step 6/9)** — silent
   (build still passes) but break live URLs. Generate redirects from the same map;
   verify welcome-drift after.
2. **Link-rewrite prefix collisions (step 5)** — `/development` vs `/development-x`.
   Use exact-segment longest-match, not substring replace.
3. **Slug collisions (step 1)** — script must assert new-slug uniqueness and abort on
   conflict (e.g. a `foo/README` + sibling `foo.md`).
4. **Depth re-rooting** — confirmed deepest chains hit depth-5; the `≤5` bump must
   land or the warn fires on every build.

## Verification

1. `make validate-structure` → exit 0; no `topic-readme` (craft/self scaffolded),
   no `welcome-drift`, no `absolute-slug`, no `depth` warn after the `≤5` bump.
2. `make validate-links` → no `test-stale-slug`, no broken `/docs/...`, all cross-links
   resolve.
3. `npm run build` (prod) → compiles; Docusaurus fails on duplicate routes (catches
   slug collisions) and bad sidebar doc-ids/dirNames.
4. `npm start` (dev) → click **Craft** (welcome + 8 topics) and **Self** (welcome + 2
   topics); confirm welcome in both and `_category_.json`-ordered topics.
5. **Redirect spot-checks** (prod serve): hit one old URL per themed namespace —
   `/docs/development/...`, `/docs/techniques/...`, `/docs/skills/...`, legacy
   `/docs/mental-models/...`, `/blog/docs-vs-blog-posts` — each lands on the right new
   `/docs/craft|self/...` page.
6. `make test-regression` → after e2e slug updates; graph specs must pass on new slugs.
7. Review the `git mv` diff to confirm renames + only `slug:`/link lines changed in
   content files.

## Out of scope (explicitly)

- Habits consolidation (the 25 scattered `habits-*` files) — deferred.
- Any topic membership change beyond the Craft/Self assignment above.
