# Plan: Finish the docs topic-restructure (T14 → T20)

## Context

This session executed the bulk of the topic-based docs restructure (T1–T13 done, T14 in
progress). The docs root is now exactly `1-welcome` + 10 topics; all 282 moved docs kept
their frozen URLs; only 2 published routes were deliberately retired. **What remains is
finish-work**: complete the label/link cleanup (T14), build the structure/index
validators + hooks the user explicitly asked for (T15/T20), correct a stale doc claim
(T16), triage drafts (T18), evaluate a slugs skill (T19), and ship (T17).

The full history + findings live in `.claude/plans/piped-wishing-clover.md` and the
handoff at `.claude/plans/RESTRUCTURE-HANDOFF.md`. This plan is the execution path for
the tail end.

**Invariant that has protected every step (keep using it):** baseline route manifest is
`.claude/plans/routes-before.txt` (569 routes). After any change: clean `make build`,
`find build -name '*.html' | sort`, then `comm` vs baseline — REMOVED routes must be only
the approved retirements; ADDED routes must be only intended new landings + tag pages.
`make build` writes to `bytesofpurpose-blog/build`; `cd` does not persist across Bash
calls (use absolute paths). Drafts are excluded from the prod build.

## Current uncommitted state (T14, mid-flight — build passes)

Working tree has ~30 `_category_.json` label/position fixes + 3 topic-slug cleanups
(`/development`, `/blogging`, `/scripting`) + Welcome link updates + 2 new wrapper
categories (`2-development/{techniques,workspace}`). Build is green. This needs the
broken-link cleanup below, then one commit.

## Step 1 — Finish T14 (labels done; fix the 5 dead category links)

Label/position/slug work is **done in the working tree**. Remaining: the **5 NO-DOC
broken links** (targets that no doc has — must fix the link text). All are old
"doubled category route" links now stale after the reorg:

| Broken target (xN) | Correct current target |
|---|---|
| `/docs/techniques/blogging-techniques/adding-content` (x5) | `/docs/techniques/blogging-techniques/adding-content/adding-content` |
| `/docs/techniques/blogging-techniques` (x4) | `/docs/techniques/blogging-techniques/blogging-techniques` |
| `/docs/techniques/blogging-techniques/embed-diagrams` (x2) | `/docs/techniques/blogging-techniques/embed-diagrams/embed-diagrams` |
| `/docs/techniques/blogging-techniques/embed-code` (x1) | `/docs/techniques/blogging-techniques/embed-code/embed-code` |
| `/docs/techniques/documentation-techniques` (x1) | `/docs/techniques/blogging-techniques/documentation-techniques/documentation-techniques`? — VERIFY against manifest |

Resolve each against `/tmp/routes-after-t14.txt` (regenerate from a build if wiped):
the README of each sub-folder is the real landing (frozen slug = `…/<name>/<name>`).
These all live in `4-blogging/` docs (adding-content/, README, changelog-system). Use a
small node script (same shape as the T3 link-fixer) to rewrite `](old)` → `](correct)`.

The **21 DRAFT-target** broken links are expected (those docs are `draft:true`, resolve
when published in T18) — leave them; `onBrokenLinks:'warn'` tolerates them.

**Verify:** rebuild → manifest delta vs baseline = +clean topic landings
(`/docs/{development,blogging,scripting}` etc.), −the 3 now-retired ugly slugs + the 2
T9 retirements; NO-DOC broken count drops to 0. Commit T14 (one commit:
"Phase F (T14): clean category labels/positions + topic slugs + dead category links").

## Step 2 — T16: correct the false "slug decouples URL from path" claim (independent)

Replace the wrong claim in **both**:
- `.claude/skills/review-reader-experience/SKILL.md` (IA-audit section)
- the `docs-topic-taxonomy` memory at
  `~/.claude/projects/.../memory/docs-topic-taxonomy.md`
- and the CLAUDE.md skills-map row added this session that repeated it.

Correct text: *relative* slug ⇒ folder path is in the URL (moving the folder moves the
URL); *absolute* slug (`slug: /…`) pins the URL regardless of folder; drafts are excluded
from the prod build; `onBrokenLinks:'warn'` + no redirects plugin ⇒ a changed slug VALUE
silently 404s. Reference the URL-freeze technique used here. No build needed.

## Step 3 — T20 + T15: structure validator + index-drift check + hook (the user's ask)

The user explicitly asked for a hook that checks topic-folder structure/conventions and
stays in lockstep with structure decisions (now codified in CLAUDE.md). Build ONE
validator with multiple checks (decided: co-implement T15+T20), mirroring
`bytesofpurpose-blog/scripts/validate-links.js` + `.claude/hooks/validate-links-hook.sh`.

**`bytesofpurpose-blog/scripts/validate-docs-structure.js`** — scans `docs/`, asserts the
recurring topic-folder contract. Checks (warn-tier unless noted), reusing `gray-matter`:
- every doc has a frontmatter `slug:` and it is **absolute** (`/…`) — ERROR (this is the
  whole URL-freeze guarantee; a relative slug silently re-couples URL to path);
- each root topic folder has a `README.{md,mdx}` with an absolute slug + a
  `_category_.json` (label + position);
- every sub-folder containing docs has a `_category_.json`;
- no `_category_.json` in a dir with zero docs (orphan);
- kebab-case filenames, no spaces;
- no redundant topic-echo / `-techniques` framing-word sub-folder names;
- folder depth ≤ 3 under a topic;
- convention positions: `vocabulary/` sorts first, `prompts/` sorts last.
Flags: `--json`, `--error-only` (exit 2 for the hook). Add **index-drift** check (T15):
diff the Welcome topic cards (`docs/1-welcome/README.md` `### [Topic](slug)` headings)
against the actual root topic folders + their READMEs' slugs; warn on drift.

**`.claude/hooks/validate-docs-structure-hook.sh`** — mirror `validate-draft-hook.sh`
(non-blocking/warn-only): on `Write|Edit` of a `docs/**` `_category_.json`, README, or any
doc, run the validator `--error-only` scoped to the changed path; print findings, never
block. Register in `.claude/settings.json` PostToolUse `Write|Edit` array (alongside the
two existing hooks).

**Makefile**: add `validate-structure:` target (mirrors `validate-links:`).

**Skill**: fold the contract into the existing `review-reader-experience` skill (add a
"topic-folder contract + validator" section) rather than a new skill — it already owns
docs IA. Cross-link from the CLAUDE.md skills map. (T19's slug/draft/404 knowledge folds
in here too as a short "slug & URL rules" subsection — satisfies T19 without a separate
skill; note that decision in the T19 task.)

**Verify:** `make validate-structure` runs clean (or only expected warns) on the current
tree; deliberately break one rule in a scratch edit and confirm it's caught; confirm the
hook fires on a `_category_.json` edit without blocking.

## Step 4 — T18: draft triage (137 drafts)

Inventory (now): development 73 · productivity 26 · personal-growth 11 · genai 6 ·
blogging 6 · faith 6 · scripting 4 · interview 2 · entrepreneurship 2 · companies 1.
Produce a triage table (publish / keep-draft / delete) — this is a **decision artifact for
Omar**, not an autonomous mass-publish. Approach:
- generate `.claude/plans/draft-triage.tsv` (path · topic · title · last-modified · has-real-content?)
  via a read-only script;
- group by topic; flag stubs (tiny/placeholder bodies) as delete-candidates and
  substantive drafts as publish-candidates;
- present the summary + recommendations; let Omar decide per group (AskUserQuestion or a
  marked-up TSV). Only flip `draft:false` / delete after his call.
Publishing a draft ADDS its route (and resolves the draft-target broken links from T14) —
re-run the manifest check after any publish batch.

**DECISION (locked): triage → WAIT.** I produce the recommendation table and pause for
Omar's per-group decisions. NO autonomous `draft:false` flips or deletes until he calls it.

## Step 5 — T17: ship (last)

**DECISION (locked): build-verify → STOP.** Take it to deploy-ready (clean build +
manifest + validators + `test-regression` + visual sidebar pass) and STOP. Omar triggers
the actual `deploy-site`/`publish-site`. I do NOT run the irreversible deploy.

1. Full clean `make build`; manifest diff vs baseline — confirm only intended adds
   (10 topic landings + new docs + tag pages) and only approved removals (the 2 T9
   retirements + the 3 T14 ugly slugs). Record the **5 retired URLs** in the ship notes.
2. `make validate-links` clean; `make validate-structure` clean.
3. `make test-regression` (dev graph + prod a11y/SEO + posthog) — needs `POSTHOG_KEY`
   in `.env`.
4. **One batched visual sidebar pass** via chrome-devtools across all 10 topics: topics
   render in order 1–10, labels clean, depth ≤3, no orphan categories. (Deferred here
   from every Phase-D move on purpose.)
5. Decide redirects for the 5 retired URLs: either accept 404s (user already accepted for
   the 3 ugly slugs) or add `@docusaurus/plugin-client-redirects`. Flipping
   `onBrokenLinks:'throw'` requires the DRAFT-target links resolved first → do AFTER T18
   publish, or keep `'warn'` for ship and tighten later.
6. `publish-site` (triage gate) → `deploy-site` → `validate-deployment` (200 / Access /
   PostHog beacon). Use the existing skills.

## Sequencing / dependencies

T14 → commit. T16 independent (any time). T20+T15 independent of T18 (do before ship so
the validator guards the final state). T18 before T17's throw-flip. T17 last.
Order: **T14 → T16 → T15/T20 → T18 → T17.** (T19 satisfied inside T15.)

## Critical files

- `bytesofpurpose-blog/docs/4-blogging/**` — the 5 dead category links to fix (T14).
- `bytesofpurpose-blog/scripts/validate-docs-structure.js` (new) — mirrors
  `scripts/validate-links.js`.
- `.claude/hooks/validate-docs-structure-hook.sh` (new) — mirrors
  `.claude/hooks/validate-draft-hook.sh`.
- `.claude/settings.json` — register the new PostToolUse hook.
- `Makefile` — `validate-structure` target.
- `.claude/skills/review-reader-experience/SKILL.md` — contract section + T16 correction.
- `~/.claude/projects/.../memory/docs-topic-taxonomy.md` + `CLAUDE.md` — T16 correction.
- `.claude/plans/{draft-triage.tsv}` (new) — T18 decision artifact.

## Verification (end-to-end)

Per-step manifest diff (above) is the spine. Final gate at T17: clean build + manifest
diff (only intended deltas) + `make validate-links` + `make validate-structure` +
`make test-regression` + visual sidebar pass + `validate-deployment` post-deploy.
