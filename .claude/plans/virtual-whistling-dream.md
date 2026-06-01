# Plan: Restructure the docs into a topic-based information architecture

## Goal
Reorganize `bytesofpurpose-blog/docs/` so the **root sidebar = TOPICS a reader
browses by**, replacing the author's filing buckets (Definitions, Mental Models,
Craftsmanship, Techniques, Skills, Habits). Every topic shares a **recurring inner
structure**. Welcome becomes the index. Whole tree moved at once (user's call),
then drafts triaged in place.

## Decisions locked with the user
- **Root = topics.** Mental Models dissolves into topics.
- **Faith/Spirituality** is its own topic (athan/quran/tasbeeh/prayer/hifz + spiritual habit).
- **Habits dissolve** — each habit doc distributes to its topic (habits-blogging→Development, habits-growing-spiritually→Faith, …).
- **Prompts are NOT a root topic** — *each topic carries its own subset of related prompts* (prompts become a recurring sub-section, like Vocabulary).
- **Sequencing: whole tree at once** (one big pass), then triage drafts in place.
- **Content-type guide**: draft the Docs/Blog/Designs/Changelog definitions; user refines wording.

## The recurring inner structure (every topic folder looks the same)
This is the backbone the Welcome page documents. Each topic MAY contain:
```
<topic>/
  README.mdx          # topic overview (what it is, what's inside)
  vocabulary.mdx      # the glossary/terms for this topic (consolidated)
  prompts/            # the subset of AI prompts related to this topic
  <content pages>     # the actual docs, optionally sub-grouped
```
Not every topic fills every slot, but the *shape* is consistent so a reader learns
it once. Vocabulary + Prompts are the two cross-cutting recurring sections.

## Target root topics (proposed — confirm completeness)
| Topic | Seeded from | Vocabulary | Notes |
|---|---|---|---|
| **🧩 Development** | development/*, technical techniques, coding-challenges, DSA | Blog Terms, Portfolio Terms | large |
| **🤖 Generative AI** | genai-domain, system-design, genai workflows/tools, rag, llm-* | (author later) | pulls from 4 roots |
| **⚡ Productivity** | processes, automation/org/analysis/tool-usage techniques | CLI/Dev/PM Terms | |
| **🏢 Companies** {Roles, Culture} | career-levels, skills, interviews / cultural-values | author Companies Terms | essays → needs vocab |
| **🖥️ Scripting** | scripting-techniques, productivity-scripts | — | |
| **🚀 Entrepreneurship** | habits-entrepreneurship, learning-business | — | thin, needs authoring |
| **🕌 Faith** | home-automation (athan/quran/tasbeeh), prayer/hifz apps, growing-spiritually | — | new, user-confirmed |
| **🌱 Personal Growth** | growing-personally, health, finances, reading, reflecting (personal habits) | — | catch-all for personal-life habits |

Open: is this list complete? (keep suggesting bottom-up.) Where do these land —
Prompts-catalog (per-topic prompts vs a master index), Research/learning-topics,
Roadmaps, Experiments, the existing Designs/Changelog surfaces?

## Execution phases

### Phase 0 — Sign-off (this plan)
Agree the target tree + topic list. Nothing moves before this.

### Phase 1 — Build the migration map (no moves yet)
Produce `topic-migration-map.tsv`: every current doc path → target topic path, with
its draft flag and explicit-slug confirmation. Auto-generated + hand-reviewed. This
is the single source of truth for the move AND the review artifact you sign off on.

### Phase 2 — Scaffold topic skeletons
Create new topic folders with numeric prefixes (set reader-priority order),
`_category_.json` (emoji + label), stub `README.mdx` per topic, and the
`vocabulary.mdx` + `prompts/` slots where content exists.

### Phase 3 — Move docs (whole tree, scripted)
`git mv` per the migration map, in topic batches within one pass. Every doc has an
explicit `slug`, so **URLs are preserved** — this reshuffles the sidebar only. After
each batch: rebuild, diff the route manifest against a pre-move baseline to PROVE no
URL changed (slug-safety verified, not assumed). Fix internal links that referenced
old folder paths (only those tied to a path, not a slug).

### Phase 4 — Consolidate vocabulary + distribute prompts
- Fold `2-definitions/terminology-*` into each topic's `vocabulary.mdx`
  (Productivity ← CLI/Dev/PM; Development ← Blog/Portfolio).
- Sort `10-prompts/*` entries into each topic's `prompts/` subset (per-topic prompts).
- Move `evals/` rubrics OUT to author-tooling (task #2).
- Fix typo `terminology-project-managementment` → `-project-management`.

### Phase 5 — Welcome rebuild
Rewrite `welcome/README.md`: (1) topic index, (2) recurring-structure guide (Vocabulary
+ Prompts + overview shape), (3) content-type guide — Docs (evergreen reference by
topic) vs Blog (dated posts) vs Designs vs Changelog (draft wording; you refine).

### Phase 6 — Verify + ship
Full prod build, route-manifest diff (zero unexpected URL changes), e2e regression
(`make test-regression`), reader-experience visual pass on the new sidebar, then
`publish-site`/`deploy-site`. Draft triage (#9) runs in place after the tree is clean.

## Safety model
- **URL-safe**: all ~250 docs set explicit `slug:` → moving files never changes URLs.
  Verified per-doc in the migration map; proven per-batch via route-manifest diff.
- **No redirects plugin** → only *changing a slug value* breaks a URL; this plan changes
  zero slug values. Any slug rename is called out explicitly and gets a manual redirect.
- **Mostly drafts**: ~170/250 are `draft:true` (development & habits especially), so most
  of this shapes the *future-published* structure; low live-reader risk now.
- Whole-tree pass = one large diff, reviewed via the migration map before execution.

## Tracking
Umbrella task #8 coordinates; sub-tasks #2,#9,#10–#15 cover the pieces. This plan adds:
Faith topic, Personal Growth topic, habit distribution, the per-topic-prompts principle,
the recurring-structure backbone, and the migration-map artifact. Tasks get updated
post-approval (new tasks: Faith topic, Personal Growth topic, habit distribution,
per-topic prompts, migration-map).

## Durable records
- Memory: `docs-topic-taxonomy` (preferences, survives sessions)
- Skill: `review-reader-experience` IA audit (applies these conventions in future audits)
- Detail: `.claude/plans/topic-taxonomy-proposal.md`
