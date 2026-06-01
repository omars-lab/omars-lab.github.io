# Plan: Finish the ingress-attribution follow-up backlog (#1–#8)

## Context

The `feat/ingress-attribution` branch carries a proven, committed feature (ShareButton +
ingress reader + bookmarklet + the `manage-frontmatter-descriptions` skill). Working through
that feature surfaced a backlog of 8 follow-up tasks. Over this session #3/#6/#8 and the
duplicate-description half of #2 were completed and committed; this plan captures the full
state and the concrete steps to **finish every open task** in one coherent pass.

Two cross-cutting realities shaped the plan:
- **A concurrent "Track C" session** shares this working tree (navbar/terminology/IA work).
  Its own plans (`post-session-cleanup.md`) explicitly assign *descriptions + ingress* to THIS
  session and *navbar/terminology/IA* to itself — a clean ownership split. Per the user, we
  proceed as if Track C is settled, but still **stage only our own paths** and **skip the 2
  files Track C has live** (`my-problem-solving-approach.mdx`, `my-contributions.mdx`).
- **The "always prove and test" tenet** (memory `always-prove-and-test`): every claim is backed
  by a runnable check — here, the validator (`validate-docs-structure.js`) and the e2e/unit
  suites — not assertion.

## Status snapshot

| # | Task | State |
|---|------|-------|
| #3 | Full `make test-regression` | ✅ done — 24 pass / 3 fail (3 = pre-existing `draft-sidebar`, proven not ours) |
| #6 | `im` super-property decision | ✅ done — keep landing-only (committed `a8e478d0`) |
| #8 | X tweet-length truncation | ✅ done — cap 200 + word-trim + ellipsis (committed `a8e478d0`; 7 unit + e2e) |
| #2a | 14 duplicate descriptions | ✅ done — all distinct (committed `0b7ddb12`; validator dup 14→0) |
| #2b | 55 length warnings | ⏳ **this plan** — 24 too-short (<50ch), 31 too-long (>160ch) |
| #7 | 2 framing folders | ⏳ **this plan** — split folder 1, rename folder 2 |
| #4 | duplicate `/changelog` route | ✅ **close as working-as-intended** (intentional shadow) |
| #1 | push + PR | ⏳ **held by user** — final gate |

## Work to execute

### Step A — Close #4 (no code) 
The `/changelog` duplicate route is an **intentional, documented** shadow: `src/pages/changelog.tsx`
deliberately overrides the changelog blog instance's auto-index, and `onDuplicateRoutes` is left
at `warn` on purpose (see the comment block at `docusaurus.config.js:20-30`). Not a bug.
- **Action:** mark task #4 completed (working-as-intended). No file change. The existing comment
  already records the rationale.

### Step B — Heal the 55 length warnings (#2b)
Each page already has a description; the work is **tuning length to 50–160 chars** with judgment,
reusing the page's `title`/`sidebar_label` + opening prose. Drive it with the owning skill
`manage-frontmatter-descriptions` and verify each with `scripts/preview-share-message.js`.

**Exclusions (do NOT touch — staged by Track C / handled in #7):**
- `docs/companies/skills/my-problem-solving-approach.mdx` — Track C's Q1 (live rename).
- `docs/personal-growth/my-contributions.mdx` — Track C's Q2 (live blog→doc move).
- `docs/interview-prep/coding-challenges/problem-solving-techniques/{README,look-ahead}.mdx` —
  inside #7's framing folder; heal these **as part of Step C** so the files aren't edited twice.

That leaves **~51 files** for Step B. Approach, mirroring the proven `.claude/plans/heal-descriptions.js`
batch pattern (idempotent exact-line replace) but with per-page judgment:
- **Too-short (<50ch, 24 files)** — expand into a real summary. E.g. `tips/README.md`
  ("Consolidating my tips." → a sentence on what the tips cover).
- **Too-long (>160ch, 31 files)** — trim to ≤160 without losing the core (many are READMEs and
  the DSA `understanding-*` pages with 170–196ch descriptions).
- Representative paths span every topic: `software-development/` (13), `interview-prep/` (10),
  `productivity/` (7), `blogging/` (7), `generative-ai/` (6), `personal-growth/` (4),
  `product-management/` (3), `companies/` (3), `welcome/` (1).
- **Verify:** after each batch, `node scripts/validate-docs-structure.js | grep description-length`
  count drops; spot-check 2–3 with `preview-share-message.js` for a clean `✓` + readable share text.
- **Critical files:** the 51 docs; reuse `scripts/preview-share-message.js` + the
  `manage-frontmatter-descriptions` SKILL; batch via a one-off node script in `.claude/plans/`.

### Step C — Resolve the 2 framing folders (#7)
The validator's `FRAMING_RE = /-techniques$|-craftsmanship$|^definitions$/`
(`validate-docs-structure.js:98`) flags two folders. **Slug policy: keep absolute slugs frozen**
(rename the folder only — URLs don't move, zero redirects; that's the whole absolute-slug
contract). Update each folder's `_category_.json` label/position in lockstep.

- **Folder 1 — SPLIT** `docs/blogging/documentation-techniques/` (it's mixed):
  - `diagramming/` ← `diagramming-with-plantuml`, `diagrams-as-text`, `getting-icons`
  - `automation/` ← `leveraging-google-app-scripts`, `http-to-xcallback`
  - Move via `git mv`; add a `_category_.json` to each new folder; retire the old umbrella
    README (fold its intro into the two new READMEs or drop it). Heal the in-folder length
    warn on `diagramming-with-plantuml.mdx` (25ch) here.
- **Folder 2 — RENAME** `docs/interview-prep/coding-challenges/problem-solving-techniques/`
  → `algorithm-patterns/` (cohesive: bitwise, cycle-detection, look-ahead, path-traversal,
  subsets). `git mv` the folder; keep child slugs frozen. Heal the 2 in-folder length warns
  (`README.mdx` 48ch, `look-ahead.mdx` 45ch) here.
- **Verify:** `node scripts/validate-docs-structure.js | grep framing-folder` → **0**; a clean
  `make build` (or dev-server route check) confirms no route moved (slugs unchanged); the
  per-topic sidebars still render the moved docs.

### Step D — Commit in logical groups (stage only our paths)
Following this session's established pattern (gitleaks pre-commit runs on each):
1. `docs(descriptions): heal NN length warnings` — Step B's ~51 docs + the batch script.
2. `refactor(docs): split documentation-techniques → diagramming + automation; rename
   problem-solving-techniques → algorithm-patterns` — Step C's moves + `_category_.json` +
   the 3 in-folder description heals.
3. (Step A is task-tracker only — no commit.)
Each commit: `git diff --cached --name-only` must show **no Track C paths**
(`docusaurus.config.js`, `my-problem-solving-approach`, `my-contributions`).

### Step E — #1 (push + PR) — USER GATE
Do **not** auto-run. When the user gives the word: push `feat/ingress-attribution`, open a PR
summarizing the feature + the follow-up batch. Branch is already regression-verified (Step #3).

## Verification (end-to-end)

1. **Structure validator is the source of truth:**
   `node bytesofpurpose-blog/scripts/validate-docs-structure.js`
   → after Steps B+C: `description-duplicate=0`, `description-length=0`, `framing-folder=0`,
   `absolute-slug` errors `=0` (the only ERROR tier).
2. **Share text reads well:** `node scripts/preview-share-message.js <healed file>` shows a `✓`
   length verdict and a natural "Here's what it covers: …" message (and the capped X variant).
3. **No URLs moved (Step C):** `make build` then diff the emitted `build/**/*.html` route set
   against the pre-change baseline — the folder renames must produce **zero** route changes.
4. **No regressions:** the already-green suites stay green — `make test-posthog` (19/19) and the
   `composeMessage` unit test (7/7). Full `make test-regression` once more before the PR.
5. **Clean isolation:** every commit's staged set excludes Track C's files.

## Out of scope / deferred
- **Bookmarklet reach** (surface beyond welcome) — decided deferred in #8.
- **Track C's lanes** (navbar, terminology, blog→doc moves, publish sprint) — owned elsewhere.
- The 3 pre-existing `draft-sidebar` failures — proven not ours; separate fix if ever wanted.

---

# LOOP PROTOCOL (run this file via `/loop` in a fresh session)

This section makes the plan **self-executing after `/clear`** — the next session has none of the
prior chat context, so trust ONLY this file + the live repo state. Each tick does one queue item,
verifies it, records progress here, and stops. Re-running is safe (every tick re-derives state).

### Each tick
1. **Re-derive state — never trust a previous tick's memory.**
   - `git branch --show-current` must be `feat/ingress-attribution` (else stop + ask).
   - Run the lowest-unchecked queue item's **done-when** check FIRST. If it already passes, tick
     it and move on.
2. **Pick the lowest-numbered unchecked item whose done-when fails.** That's this tick's work.
   If all pass → **Termination**.
3. **Do only that item.**
4. **Verify** with the item's stated check (validator / build / tests). Never tick an item on an
   unverified change. If blocked, record the blocker in the item and stop.
5. **Record progress**: tick the checkbox + append `// done <date>: <evidence>`.
6. **Defer-to-user gate (hard stop):** committing is allowed (user already authorized "commit in
   logical groups" — stage ONLY our paths, gitleaks runs on commit). But **pushing / opening a PR
   (LQ4) is a hard stop** — prepare and mark blocked-on-user, do not run it autonomously.
7. **Stop the tick.** One item per tick keeps each change verifiable.

### Guardrails (every tick)
- **Tenet (memory `always-prove-and-test`):** prove every claim with a runnable check (the
  validator / `preview-share-message.js` / the e2e+unit suites). Never assert.
- **Track C isolation:** a concurrent session owns `docusaurus.config.js`, terminology renames,
  and the 2 live files `docs/companies/skills/my-problem-solving-approach.mdx` +
  `docs/personal-growth/my-contributions.mdx`. NEVER stage those. Before every commit:
  `git diff --cached --name-only | grep -E 'docusaurus.config|my-problem-solving|my-contributions'`
  must be EMPTY.
- **Slugs stay frozen** on the #7 folder moves (rename folders only; URLs must not move).
- Run validator/build from `bytesofpurpose-blog/`.

### Termination
Stop when every LQ item is checked or blocked-on-user. Emit one line: what got done + what's
blocked-on-user (LQ4 push/PR). Send a `PushNotification` one-liner, then stop (no re-arm).

## Work queue (loop consumes top-down)

- [x] **LQ1 — Heal the ~51 length warnings (Step B).** // done 2026-06-01: healed 50 docs via .claude/plans/heal-length-warnings.js (changed=50, all 50–160); validator description-length now lists ONLY the 5 excluded (my-problem-solving-approach, my-contributions, problem-solving-techniques README+look-ahead, diagramming-with-plantuml); spot-checked welcome/understanding-graphs/tips → ✓ verdicts + clean share text; committed 3fff008c (no Track C paths staged).
  - **done-when:** `cd bytesofpurpose-blog && node scripts/validate-docs-structure.js | grep -c description-length`
    returns `0` **excluding** the 4 excluded files (2 Track C + the 2 in `problem-solving-techniques/`,
    which LQ2 handles). Practically: only those ≤4 may remain after this item.
  - **work:** per Step B — expand the 24 too-short, trim the 31 too-long to 50–160 chars, drawing
    from each page's title + opening prose. Use the `manage-frontmatter-descriptions` skill;
    batch via a one-off `.claude/plans/heal-length-*.js` (idempotent exact-line replace).
    SKIP the 4 excluded files.
  - **verify:** validator `description-length` count drops to the excluded-only remainder;
    spot-check 2–3 with `node scripts/preview-share-message.js <file>` → `✓` verdict + clean message.
  - **defer?:** commit after (stage only healed docs + the batch script).

- [x] **LQ2 — Split + rename the 2 framing folders (Step C).** // done 2026-06-01: SPLIT documentation-techniques → top-level diagramming/ + automation/ (retired umbrella README+_category_; added _category_+README to each); RENAMED problem-solving-techniques → algorithm-patterns (label updated). All child slugs FROZEN. validator framing-folder 2→0; build route set proves zero URL movement (4 non-draft children still emit at /techniques/documentation-techniques/...; algo children at /skills/.../problem-solving-techniques/...; +2 new landings, −1 retired umbrella). Healed 3 in-folder descriptions + repointed 1 dangling umbrella link in adding-docs. Pre-existing draft broken-link (google-app-scripts, draft:true) carried forward unchanged — NOT a regression. Committed c4ce7baa (no Track C paths). NOTE: surfaced a gap → validators are not draft/link-aware (see user Q below).
  - **done-when:** `cd bytesofpurpose-blog && node scripts/validate-docs-structure.js | grep -c framing-folder`
    returns `0`.
  - **work:** SPLIT `docs/blogging/documentation-techniques/` → `diagramming/` (plantuml,
    diagrams-as-text, getting-icons) + `automation/` (google-app-scripts, http-to-xcallback) via
    `git mv`; add a `_category_.json` to each; retire the old umbrella README. RENAME
    `docs/interview-prep/coding-challenges/problem-solving-techniques/` → `algorithm-patterns/`.
    Keep all child slugs FROZEN. Heal the 3 in-folder length warns here (diagramming-with-plantuml
    25ch, the algorithm-patterns README 48ch + look-ahead 45ch).
  - **verify:** `framing-folder=0`; `make build` then diff emitted `build/**/*.html` route set vs a
    pre-change capture → **zero** route changes (slugs frozen); moved docs still render in sidebars.
  - **defer?:** commit after (stage only the moved/renamed docs + `_category_.json`).

- [x] **LQ3 — Final full regression before PR.** // done 2026-06-01: composeMessage 7/7 ✓; test-posthog 21 pass + 1 flaky-pass (window.open race, passed retry #1) = 0 real fails ✓; prod a11y+SEO 35/35 ✓. THREE confounds investigated & cleared, NOT regressions from my work: (1) 3 graph-selection-state dev failures = stale :3000 dev-server webpack error-overlay intercepting clicks — proven by re-running clean on a fresh :3100 server → 6/6 pass; (2) build ENOENT on .docusaurus/*.json = a COMPETING concurrent `docusaurus build` (PID 40323, Track C) corrupting the cache — standalone `yarn build` after `docusaurus clear` compiled clean (exit 0); (3) 3 known draft-sidebar dev failures (pre-existing). ONE real pre-existing a11y blocker FIXED per user: BookmarkletButton #fff-on-primary failed contrast in dark (2.70:1) → primary-darkest (5.24:1 dark / 8.70:1 light), committed 62a9c26e; full prod project re-run 35/35 green. NOTE: `make test-regression` halts at first failing sub-make (test-e2e), so test-prod-checks/test-posthog must be run separately — the chain never reaches them when dev has any failure.
  - **done-when:** `make test-regression` run on the branch, results read: only the 3 known
    `draft-sidebar` dev tests fail (everything else green), AND `make test-posthog` = 19/19, AND
    `cd bytesofpurpose-blog && npx jest test/unit/composeMessage.test.ts` = 7/7.
  - **work:** stop any dev server on :3000 first (regression's dev project needs the port); run it;
    read per-project results (exit 0 only reflects the last sub-make — inspect the log).
  - **verify:** as done-when. If anything beyond draft-sidebar fails, it's a real regression — fix
    within the tick or record the blocker and stop.
  - **defer?:** no (read-only validation).

- [ ] **LQ4 — Push + open PR. [HARD STOP — blocked-on-user]**
  - **done-when:** branch pushed + PR open.
  - **work:** push `feat/ingress-attribution`; open a PR summarizing the ingress feature + this
    follow-up batch. **Do NOT run autonomously** — prepare the push command + PR body, mark
    blocked-on-user, and stop. (Confirm target/base with the user.)
  - **defer?:** YES — outward-facing.

(#4 was closed as working-as-intended — no queue item; #2a/#3-first-run/#6/#8 already committed
this session: `a8e478d0`, `0b7ddb12`.)
