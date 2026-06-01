# Plan: Blog content review & modifications (ON HOLD — separate track)

## Context
Split out of `.claude/plans/compressed-greeting-quasar.md` ("meh → great") on 2026-06-01 at
the user's request: **content changes are on hold**, so all content authoring/editing/publishing
work lives here, separate from the structural/polish work (avatar, terminology rename, link
hygiene, build contract) that the main plan tracks. Resume this plan when the user lifts the hold.

**Hold scope = anything that creates, rewrites, publishes, or deletes reader-facing prose.**
Structural/mechanical work (renames, validators, link-label fixes, config) is NOT on hold and
continues in the main plan.

## Tracks (all HELD)

### Track P — Publish sprint (was P0 in the original plan) — **[hold]**
131 drafts; `draft-triage.tsv` marks ~90 `publish?`, ~30 `keep`, ~10 `delete?`. Target 131 → ~60.
- **T-P1** Read each `publish?` doc for real quality (not word count); publish genuinely-ready
  ones per topic; delete empty stubs; keep thin-but-intentional as drafts. Stop per topic.
  Decision (from this session): user chose **quality-gated per-topic batches** when resumed.
- **T-P2** Re-run the route manifest diff after each batch (publishing ADDS the draft's route —
  verify it's the intended one). Baseline: `.claude/plans/routes-before.txt`.

### Track D — Revive the Blog channel — **[hold]**
4 blog posts vs 159 docs; the dated-thinking channel is dormant. (1 of the 4 — DFS-vs-BFS —
is `draft:true`.)
- **T-D1** Decide DFS-vs-BFS: finish + un-draft, or leave drafted.
- **T-D2** Seed 3–5 short dated posts from work already done:
  - "Why I restructured my docs into topics" (Phases A–H is a ready-made narrative)
  - "Idea → execution: how I link product management to code"
  - "How I track where my links go" (the ingress-attribution story — ties to the analytics work)
  Cadence > length. Use the `author-blog-post` skill (frontmatter + MDX pitfalls: bare `<br>`,
  unescaped `{word}`). Author = `oeid`.

### Track E — Make the idea↔execution mapping real — **[hold]**
Phase G built the `idea-exec-link` convention + validator, but ZERO links authored.
- **T-E1** Identify 5–10 obvious PM-idea ↔ built-artifact pairs (PM `ideas/`/`roadmaps/`
  entries that became `software-development/*/projects/*` docs).
- **T-E2** Add `## Execution` link in each PM doc → the built artifact; `## Idea`/`## Origin`
  link back in the artifact. The `idea-exec-link` validator keeps them honest (links must resolve).
- **T-E3** `make validate-structure` → no new `idea-exec-link` warns.

### Track G1/G2 — First-impression content polish (was part of P3) — **[hold]**
- **T-G1** Homepage copy audit (`src/pages/index.tsx` + `HomepageFeatures`): does it sell the
  site in 5s — who/what/where-to-start? (Avatar is OUT of scope for homepage per user.)
- **T-G2** Topic-landing READMEs: make each a real "start here" (2–3 sentence orientation + the
  3 best docs), not an auto-list. High-traffic, hand-crafted.

### Content findings from the reader-experience audit (Track G3, run 2026-06-01) — **[hold]**
Full report: `.claude/plans/reader-experience-audit-2026-06-01.md`. Content items triaged here:
- **(P1) `software-development` landing is a bare Figma iframe.** `docs/software-development/
  README.mdx` has NO orientation text — just an embedded board. Largest topic, zero readable
  front door. **Add a "what's here" + audience intro above the iframe** + links into backend/
  frontend/scripting/plugins. (This is the audit's only high-bite reader gap.)
- **(P2) Writer-focused openers** to rewrite (lead with reader takeaway, not "Understanding…/I…"):
  `generative-ai/fundamentals/2025-07-30-understanding-the-fundamentals-of-genai.md`,
  `interview-prep/understanding-what-companies-expect.md`,
  `companies/culture/2025-09-25-understanding-cultural-values.md`,
  `companies/skills/my-problem-sovling-approach.mdx`.
- Most landings are already strong (Welcome + generative-ai/productivity have orientation + "For:"
  lines) — so this is light, not a sweep.

_Structural findings (sovling slug typo, navbar builder-word renames, one long sidebar_label,
orphan-category flattening, storybook depth) stayed in the main plan — they're not content._

## Guardrails (carried)
- Publishing a draft ADDS a route — manifest-diff each batch; verify intended only.
- All slugs ABSOLUTE/frozen; never reintroduce a relative slug.
- `make validate-structure` + `make validate-links` before any deploy.
- Stage only your own paths in commits.
