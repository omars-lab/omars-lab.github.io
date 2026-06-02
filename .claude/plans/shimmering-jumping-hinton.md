# Plan: Emoji-prefix sidebar convention — validator rule, hook surfacing, review-skill guidance, consolidated emoji doc

## Context

The sidebar reads best when every section label leads with an emoji (screenshot: 👋 Welcome,
🤖 Generative AI, 🧩 Software Development …). It's an *unwritten* convention — nothing enforces
it, and it has already drifted: **18 of ~95 `_category_.json` labels have no leading emoji**
("Terminology", "Prompts", "Skills", "Cultural Values", "Career Levels", "Building GenAI
Systems", …). The user wants (1) a check that flags labels lacking a leading emoji, (2) the
review skill to treat emoji consistency as a first-class audit item and *suggest* an emoji from
a documented topic→emoji map (not free-classify), and (3) all of this consolidated with the
existing emoji doc rather than scattered.

This repo already owns the IA contract in `validate-docs-structure.js` + a warn-only PostToolUse
hook + the `review-reader-experience` skill, and per CLAUDE.md *"structure decisions must update
the structure checks."* So the emoji-prefix rule belongs in that same trio. There is already a
personal emoji-taxonomy doc at `docs/productivity/terminology/emojis.mdx`
(slug `/definitions/emojis-for-activities`) — it documents NotePlan *activity* emojis, not
*sidebar-label* emojis. We consolidate by adding a sidebar-label emoji section there and pointing
the validator + skill at it.

### Key measurement that shapes the design
- **Category labels** (`_category_.json`): 18 missing emoji → small, actionable set.
- **Doc leaf labels** (`sidebar_label`/`title`): **230 of 296 (78%) have no emoji.** A flat warn
  on every doc label would bury the 18 real category findings under a 230-line wall. So the
  doc-level check must be a **separate, quieter tier** — reported as an aggregate count, not 230
  individual lines — while the **category-level check is the enforced default**.

### Investigated: the "filename as label" symptom (`habits-mastering`, `habits-growing-professionally`)
The user's 2nd screenshot shows raw filenames in the sidebar. **Root cause: this is a dev-only
DRAFT artifact, not an authoring defect.** Findings:
- All three (`personal-growth/habits-mastering.mdx`, `habits-growing-professionally.mdx`,
  `habits-building-habits.mdx`) are `draft: true` and **do have proper titles**
  (`📈 Mastering`, `📈 Growing Professionally`, `🏗️ Building Habits`).
- Measured: **0 of 296 docs lack both `title` and `sidebar_label`** — so no doc would *ever*
  show its filename in a production sidebar.
- Drafts are excluded from prod builds entirely (`plugins/draft-docs/index.js`); in `yarn start`
  dev the draft entry falls back to the doc-id (filename) because the draft's metadata isn't
  fully registered in the sidebar. The swizzled `DocSidebarItem/draftBadge.tsx` gates on
  localhost+non-prod, so **nothing leaks to the deployed site.**

**Conclusion / scope impact:** there is no label to "fix" for those filenames — they're a
dev-only draft quirk that never ships. BUT we add a cheap guard so the *authoring* invariant the
user cares about ("no doc should fall back to its filename") is enforced going forward:
a warn-tier **`sidebar-label-missing`** rule that flags any doc with neither `title` nor
`sidebar_label` (today: 0 — so it's a regression guard, not a backlog). This is in-scope; the
dev-only draft rendering quirk itself is out of scope (separate concern owned by the draft
plugin) and called out as a note.

## Approach

### 1. Validator: add an `emoji-prefix` rule (`bytesofpurpose-blog/scripts/validate-docs-structure.js`)

Add a shared emoji-detection helper + two findings kinds, both **warn-tier** (consistent with
"only absolute-slug is ERROR"):

- **`emoji-prefix-category`** [warn] — a `_category_.json` `label` that does not start with an
  emoji. This is the primary, per-finding rule (≈18 today).
- **`emoji-prefix-doc`** [warn, aggregated] — docs whose resolved sidebar label
  (`sidebar_label` || `title`) lacks a leading emoji. To avoid a 230-line wall, emit **one
  aggregate finding** (e.g. `230 doc labels lack a leading emoji — see make validate-structure
  --emoji for the list`) rather than one per doc, OR gate the per-doc detail behind an
  `--emoji` flag. Default full run shows only the aggregate line + the per-category findings.
- **`sidebar-label-missing`** [warn, per-finding] — a doc with **neither** `title` nor
  `sidebar_label` frontmatter, so its sidebar entry would fall back to the raw filename
  (the `habits-mastering` symptom, generalized). Today this is **0 docs** — a regression guard.
  Checked in `checkDoc`, so the scoped/hook path covers it too (cheap, per-file).

Implementation details:
- Add `startsWithEmoji(str)` helper near the top (with the `KEBAB_RE` etc.). Detection: first
  code point in an emoji range — `cp >= 0x1F000` OR `0x2190–0x2BFF` OR `0x2600–0x27BF` OR the
  standalone `0x2B50`/`0x2728`; tolerate a leading variation selector. Reuse this exact logic in
  the hook (below) — keep them in lockstep.
- Register both kinds in the `SEVERITY` map (lines ~85–113) with a header-comment block
  explaining *why* (sidebar scannability) and pointing to `/definitions/emojis-for-activities`.
- Category check: extend the existing `_category_.json` handling. `readCategory(full)` already
  exists (line 164); in `walkDir`'s `hasCategory(full)` branch (~line 316) read `cat.label` and
  flag if `!startsWithEmoji(label)`. Also cover **topic-root** categories in `checkTopicRoots`
  (line 362) so the 11 root topics are checked too.
- Doc check: in `checkDoc` (line 192) compute `label = data.sidebar_label || data.title`; if set
  and not emoji-led, push to a module-level counter. After the walk, in `main()`'s full-run
  branch, emit the single aggregate `emoji-prefix-doc` finding (and the full list only under
  `--emoji`). The scoped/hook path (`targets.length`) must **not** add doc-emoji findings (it's
  advisory-only and `--error-only`, so warn-tier never surfaces there anyway).
- Update the file's top-of-file invariants comment block (lines ~18–67) to document both kinds.

### 2. Hook: surface category emoji drift on edit (`.claude/hooks/validate-docs-structure-hook.sh`)

The hook is warn-only / never-blocks and currently surfaces `absolute-slug` (ERROR) + a
numeric-prefix advisory. Add a parallel **emoji advisory**: when the edited file is a
`_category_.json` (or a doc) whose label lacks a leading emoji, print a short advisory to stderr
(exit 0). Mirror the numeric-prefix advisory block (lines ~51–68): a small inline check using the
same emoji-range test. This keeps the nudge at the natural moment (editing the label) without a
full tree walk. Cross-reference `/definitions/emojis-for-activities` in the message so the author
knows where to pick an emoji.

### 3. Consolidate into the emoji doc (`bytesofpurpose-blog/docs/productivity/terminology/emojis.mdx`)

Add a new top section — **"🧭 Sidebar Topic Emojis"** — that is the single source of truth for
the sidebar-label convention:
- State the rule: *every sidebar section (`_category_.json` label) leads with one emoji so the
  sidebar scans visually.*
- A **topic→emoji map table** seeded from the current good labels (👋 Welcome, 🤖 Generative AI,
  🧩 Software Development, 📋 Product Management, ⚡ Productivity, ✍️ Blogging, 🎯 Interview Prep,
  🏢 Companies, 🚀 Entrepreneurship, 🕌 Faith, 🌱 Personal Growth, 🧠 Mental Models, ⚙️ Backend,
  🎨 Frontend, 💻 Scripting/Workspace, …) plus suggested emoji for the 18 currently-missing
  sub-topics (Terminology 📖, Prompts 💬, Skills 🛠️, Cultural Values 🤝, Career Levels 📈, …).
- Note that `validate-docs-structure.js` enforces it (warn-tier) and the
  `review-reader-experience` skill audits it.
- Keep frontmatter healthy (absolute slug already present; `description` already good). This is
  the consolidation: activity emojis + sidebar emojis now live in one doc.

### 4. Review skill: emoji-consistency audit item (`.claude/skills/review-reader-experience/SKILL.md`)

In the Sidebar/label section (around lines 60–69, near the "Jargon category names" /
"Repetitive sibling labels" bullets), add a **"Emoji prefix on section labels"** bullet:
- Every `_category_.json` label should lead with an emoji (cite the validator's
  `emoji-prefix-category` finding + `make validate-structure`).
- When one is missing, **suggest** an emoji from the topic→emoji map in
  `/definitions/emojis-for-activities` (deterministic lookup the reviewer reasons over — *not*
  free model-classification), choosing one consistent with sibling topics.
- Include a copy-pasteable one-liner to list offenders (the `node -e` emoji scan used during
  planning) and the `perl -0pi` style edit to prepend the emoji to a `_category_.json` label.

### 5. Wire docs/CLAUDE conventions

- The contract lives in the `review-reader-experience` skill (per CLAUDE.md). Add the
  emoji-prefix rule to its "Topic-folder contract + validator" section so the skill stays the
  source of truth, in lockstep with the validator.
- No CLAUDE.md edit strictly required (it routes to the skill), but optionally add "leading-emoji
  category labels" to the recurring-contract sentence.

### 6. Apply the 18 missing category emojis (the visible payoff)

Prepend a map-derived emoji to each of the 18 `_category_.json` labels currently missing one,
using the topic→emoji map from §3 so the choices are consistent with siblings. Proposed mapping
(reviewer can adjust any before/while applying):

| File | Current label | → |
|---|---|---|
| `generative-ai/building-systems` | Building GenAI Systems | 🏗️ |
| `generative-ai/my-genai-workflow` | My GenAI Workflow | 🔄 |
| `generative-ai/my-genai-workflow/initiatives` | LLM Initiatives | 🚀 |
| `software-development/terminology` | Terminology | 📖 |
| `software-development/frontend-development/techniques/storybook-typescript-babel` | Storybook + TypeScript + Babel | 📚 |
| `software-development/prompts` | Prompts | 💬 |
| `blogging/prompts` | Prompts | 💬 |
| `interview-prep/preparing` | Preparing for Interviews | 📝 |
| `interview-prep/prompts` | Prompts | 💬 |
| `faith/automations` | Automations | ⚙️ |
| `faith/apps` | Apps & Trackers | 📱 |
| `personal-growth/prompts` | Prompts | 💬 |
| `companies/skills` | Skills | 🛠️ |
| `companies/mental-models/cultural-values` | Cultural Values | 🤝 |
| `companies/mental-models/skills` | Skills | 🛠️ |
| `companies/mental-models/career-levels` | Career Levels | 📈 |
| `productivity/terminology` | Terminology | 📖 |
| `productivity/prompts` | Prompts | 💬 |

Edit only the `label` value in each file (positions/structure untouched). After this, the full
validator run should report **0** `emoji-prefix-category` findings.

## Files to modify

| File | Change |
|---|---|
| `bytesofpurpose-blog/scripts/validate-docs-structure.js` | `startsWithEmoji` helper; `emoji-prefix-category` (per-finding) + `emoji-prefix-doc` (aggregate / `--emoji`-gated) + `sidebar-label-missing` (per-finding, filename-leak guard) kinds; check category + topic-root labels; update invariants comment + SEVERITY map |
| `.claude/hooks/validate-docs-structure-hook.sh` | emoji advisory block (warn-only, exit 0), mirroring the numeric-prefix advisory; same emoji-range test |
| `bytesofpurpose-blog/docs/productivity/terminology/emojis.mdx` | new "Sidebar Topic Emojis" section: rule + topic→emoji map (incl. the 18 gaps) + pointer to validator/skill |
| `.claude/skills/review-reader-experience/SKILL.md` | "Emoji prefix on section labels" audit bullet + map-driven suggestion + lister/editor one-liners; note rule in contract section |
| 18× `**/_category_.json` (see §6 table) | prepend the map-derived emoji to each `label` |

## Verification

1. **Validator, full run** — `cd bytesofpurpose-blog && node scripts/validate-docs-structure.js`
   (or `make validate-structure`). Before §6 fixes: ~18 `emoji-prefix-category` warns naming the
   exact files from planning (Terminology, Prompts, Skills, …) + **one** aggregate
   `emoji-prefix-doc` line (≈230). After §6 fixes: **0** `emoji-prefix-category`.
   `sidebar-label-missing` = **0** (the guard fires on none today — confirms no false positive).
2. **`--emoji` detail (if implemented)** — `node scripts/validate-docs-structure.js --emoji`
   lists the per-doc offenders; default run does not.
3. **No false positives** — confirm the 11 good root topics + emoji-led sub-topics
   (🧠 Mental Models, ⚙️ Backend Development, …) are NOT flagged. Spot-check `✍️ Blogging` and
   `⚖️`-style labels with a leading **variation selector** parse correctly (the helper tolerates
   VS16).
4. **`--error-only` unchanged** — `node scripts/validate-docs-structure.js --error-only` exits 0
   (emoji rules are warn-tier; only absolute-slug is ERROR). Confirms the hook never blocks on
   emoji.
5. **Hook advisory** — edit a `_category_.json` label to drop its emoji and confirm the hook
   prints the emoji advisory to stderr but still exits 0 (Write succeeds). Restore.
6. **Doc renders** — `make dev`, open `/definitions/emojis-for-activities`, confirm the new
   "Sidebar Topic Emojis" section + table render (no MDX break from emoji/`{}`/`<br>`).
7. **Skill** — re-read the new bullet; confirm the lister one-liner runs and prints the 18
   offenders.

## Out of scope / follow-up (not in this change unless you say so)
- **Fixing the 18 missing category emojis** — this change adds the *check + map + guidance*; it
  does not mutate the 18 `_category_.json` files. Doing the fixes is a natural immediate
  follow-up (the map in emojis.mdx tells us which emoji each gets). Say the word and I'll apply
  them in the same pass.
- Backfilling emoji onto the 230 leaf-doc labels (large, optional, lower value).
