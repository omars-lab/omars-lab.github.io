# Docs Topic-Restructure — Session Handoff (remaining work)

**Purpose:** durable pickup doc for the remaining pending tasks after this session is
cleared. The authoritative full plan is `.claude/plans/piped-wishing-clover.md`; the
migration map is `.claude/plans/topic-migration-map.tsv`. This file is the short
"what's left + how to resume" view.

## Status as of this handoff

**DONE (committed, verified):** T1 baseline · T2 URL-freeze (289 docs → absolute slugs)
· T3 pre-move hygiene · T4 migration map · **T5–T9 ALL topic moves + every framing-word
bucket dissolved.** The docs root is now exactly 11 entries: `1-welcome` + the 10 topics
(`1-generative-ai`, `2-development`, `3-productivity`, `4-blogging`, `5-scripting`,
`6-interview-prep`, `7-companies`, `8-entrepreneurship`, `9-faith`, `10-personal-growth`).

**Reorg is URL-safe and verified:** all 282 moved docs kept their frozen URLs. Only
**2 published routes were deliberately retired** (user-approved):
`/docs/techniques/techniques` and `/docs/craftsmanship/craftsmanship` (obsolete
old-taxonomy index pages). Recorded for possible redirects at ship.

**Habits fan-out + prompts distribution (was T11) are ALREADY DONE** inside T5–T9.

## How to resume / verify (the invariant that protected every move)

The safety net is the **route-manifest diff**. Baseline = `.claude/plans/routes-before.txt`
(569 routes; regenerate any time with a clean `make build` of an earlier state if needed,
but it's committed). After any change:
```
cd bytesofpurpose-blog && rm -rf build && yarn clear >/dev/null && cd ..
make build   # writes to bytesofpurpose-blog/build
cd bytesofpurpose-blog && find build -name '*.html' | sort > /tmp/routes-now.txt
comm -23 /tmp/../../.claude/plans/routes-before.txt /tmp/routes-now.txt   # REMOVED routes — must be ONLY the 2 approved retirements
```
Gotcha: `make build` writes to `bytesofpurpose-blog/build` and `cd` does NOT persist
across Bash tool calls — use absolute paths. Drafts (`draft:true`) are excluded from
the prod build, so they never appear in the manifest.

## Remaining tasks (pending) — tackle in this order

### T10 — Consolidate vocabulary.mdx per topic  [blocked-by T9 ✓ now unblocked]
- Productivity vocabulary is parked at `3-productivity/vocabulary/` (terminology-cli,
  -development, -project-managementment[sic], acronyms, emojis). Development vocabulary
  at `2-development/vocabulary/` (terminology-blog, -portfolio).
- Consolidate each topic's scattered glossary docs into ONE `vocabulary.mdx` at the
  topic root (fixed position 1), per the plan. Companies has NO glossary yet → author one.
- **URL note:** merging glossary docs into one changes/【removes】 the individual term-doc
  URLs. Those are mostly `draft:true` (low risk) but CHECK each with the manifest diff;
  if a glossary doc is published, decide keep-vs-merge-with-redirect.

### T11 — Verify prompts/habits distribution  [mostly done in T9]
- Just verify: no orphan prompts, every habit in a defensible topic, each topic's
  `prompts/` folder sorts last and is labeled. (See updated task description.)

### T12 — Fix typo `terminology-project-managementment` → `-project-management`
- File now at `3-productivity/vocabulary/terminology-project-managementment.mdx`.
- It's a RENAME → its slug is frozen absolute; renaming the file is URL-safe, but if you
  also fix the slug VALUE you change its URL (it's a draft, so low risk). Fold into T10.

### T13 — Rebuild Welcome  [blocked-by T9 ✓]
- `docs/1-welcome/README.md`. Build: (1) topic index — one card per topic with a
  reader blurb (what's there + WHO benefits + when to read); (2) recurring-structure
  guide (README / vocabulary / prompts shared shape); (3) content-type guide
  (Docs/Blog/Designs/Changelog — draft, user refines). Each topic README already has a
  good blurb to crib from.

### T14 — Renumber prefixes + rewrite _category_.json labels + fix bucket-A links
- Numeric folder prefixes are already set per topic (1–10). Audit/clean all
  `_category_.json` labels (many still carry OLD labels from their source folders, e.g.
  moved technique dirs). URL-invisible.
- **Also (deferred from T3): fix the ~40 bucket-A broken `/docs/` body links** that point
  at doubled category routes (`/docs/techniques/techniques`, `.../blogging-techniques/
  blogging-techniques`, etc.). Many of those TARGETS were just retired/changed by the
  reorg, so re-derive against the CURRENT build manifest. List was `/tmp/truly-broken-
  links.txt` (regenerate via the audit approach in piped-wishing-clover.md if /tmp wiped).
- Several topic READMEs kept UGLY frozen slugs (e.g. scripting README still at
  `/techniques/scripting-techniques/scripting-techniques`, blogging at
  `/techniques/blogging-techniques/blogging-techniques`). Cleaning these = a slug-VALUE
  change = a URL change with no redirect. Decide per-doc; if changed, add to retirements.

### T15 — maintain-doc-indexes skill + validate-topic-index.js + hook  [blocked-by T13]
- Welcome topic-index ↔ real-root-folders drift checker + warn-only PostToolUse hook.
- **Likely shares implementation with T19 + T20 (decide here):** T15 = Welcome/index
  drift; **T20 = folder-structure/naming-convention linter**; T19 = slug/draft/404
  knowledge skill. Consider one `scripts/validate-docs-structure.js` with multiple checks
  + one hook, or split. Mirror `validate-links-hook.sh` / `validate-draft-hook.sh` style.

### T16 — Correct the false "slug decouples URL from path" claim
- Fix in BOTH the `review-reader-experience` skill IA-audit section AND the
  `docs-topic-taxonomy` memory (and the CLAUDE.md skills-map row added this session that
  repeated it). Replace with: relative slug ⇒ folder path is in the URL; absolute slug
  pins it; drafts excluded from prod build; `onBrokenLinks:'warn'` + no redirects ⇒
  silent 404 on slug-value change. (Independent — can do any time.)

### T17 — Ship  [blocked-by T14]
- Full prod build + manifest diff (only the 8 new landings added, only the 2 approved
  retirements removed) + `make test-regression` (a11y/SEO/dev-only-surface absence) +
  ONE batched visual sidebar pass via chrome-devtools across all 10 topics (depth ≤3,
  clean labels, topics render) + `validate-links` + flip `onBrokenLinks:'throw'` and
  confirm it passes → `publish-site`/`deploy-site` → `validate-deployment`.
- **At ship, decide redirects** for the 2 retired URLs (+ any slug-value changes from
  T14). No redirects plugin installed — would need `@docusaurus/plugin-client-redirects`
  or accept the 404s.

### T18 — Draft triage  [blocked-by T9 ✓]
- Inventory all `draft:true` docs (140 at session start, now in their topic homes);
  decide publish/keep/delete each. Pairs with the publish step.

### T19 — Evaluate a `manage-doc-slugs` skill  [independent]
- Capture the slug/URL/draft/404 nuances so they're not re-derived wrong. Fold into T15
  tooling or author standalone; cross-link from CLAUDE.md. (Full notes in the task.)

### T20 — Topic-folder structure/convention validator + hook  [independent]
- Lint the recurring topic-folder contract (README+absolute-slug, `_category_.json`
  present, kebab-case, no redundant `-techniques`/topic-echo folders, depth ≤3, no
  orphan categories, vocabulary-first/prompts-last, every doc has an absolute slug).
  Warn-only PostToolUse hook + `make validate-structure`. Likely co-implemented with T15.

## Carry-over (independent of the reorg, from the reader-experience review)
- Rewrite 4 writer-voice doc intros; category-name voice call; flatten any remaining
  deep paths. (Lower priority; not blocking ship.)

## Key artifacts
- `.claude/plans/piped-wishing-clover.md` — full plan + all execution findings (T1–T9).
- `.claude/plans/topic-migration-map.tsv` — every doc → topic mapping + decisions.
- `.claude/plans/routes-before.txt` — the 569-route baseline (URL-stability anchor).
- `.claude/plans/{build-migration-map,add-target-paths}.js` — regenerate the map.
- Commits this session: search `git log --oneline --grep='Phase [A-F]'`.
