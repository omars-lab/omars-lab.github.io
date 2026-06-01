# Reader-experience audit — full site (post-restructure) — 2026-06-01

Run read-only (content changes are on hold). **Nothing was applied — every item is Proposed.**
Findings are split: **[struct]** → structural/polish plan (`compressed-greeting-quasar.md`);
**[content]** → content plan (`blog-content-review.md`). Run via the `review-reader-experience`
skill across all 5 audits (labels/nav, layout, voice, IA, report).

## Headline: the restructure landed well
- **URL-freeze intact.** All 290 docs have absolute slugs (the 8-line `grep` gap was `slug:`
  inside tutorial *code blocks*, not real frontmatter). Re-orgs remain URL-safe.
- **Root topics are clean.** 11 reader-facing topic nouns + emoji, position-ordered, no numeric
  name prefixes. No welcome-drift, no orphan-category, no missing-README, no depth ERRORs from
  the validator — only the 2 known framing-folder warns.
- **Landings are mostly hand-crafted**, not auto-lists: Welcome has browse-by-topic cards with
  "For:" audience lines; generative-ai/productivity/etc. have "What's here" + audience framing.
- **Sidebar labels are healthy** — only 1 published doc exceeds the 32-char truncation threshold.

So this audit is short and mostly P1/P2 polish — the bones are good.

---

### P0
*(none — no author-only surfaces, broken nav, or main-path truncation found in the published set;
the dev-only-surfaces absence is covered by the e2e suite.)*

### P1
- **[content] `software-development` topic landing is a bare Figma iframe.** `docs/software-
  development/README.mdx` is *just* an embedded Figma board — no orientation text, no "what's
  here", no audience line, no links into its backend/frontend/scripting/plugins sub-domains.
  It's the largest topic (55 drafts) and its front door has zero readable text. The Welcome
  *card* for it is good, but the landing itself orients no one. → **Add orientation copy above
  the iframe** (content plan: T-G2). URL-safe.
- **[struct] Filename + slug typo: "sovling".** `docs/companies/skills/my-problem-sovling-
  approach.mdx`, slug `/skills/refining-soft-skills/my-problem-sovling-approach`. The typo is
  baked into the live URL. **Renaming the file is URL-safe (absolute slug), but fixing the SLUG
  VALUE 404s the old URL silently** (no redirects plugin, `onBrokenLinks:'warn'`). Options: (a)
  fix the filename only, keep the typo'd slug (URL stays, internal tidiness only); (b) fix both
  and accept the 404 / add a manual redirect. → Surface for the user's call.

### P2
- **[struct/brand] Navbar has builder words.** `Learn` (good, already reader-facing) / `Blog` /
  **`Designs`** / **`Components`** / **`Changelog`**. "Components" (→ Storybook) and "Designs"
  are builder words; "Changelog" could be "What's New". *Propose only* (brand voice is the
  author's call). Navbar lives in `docusaurus.config.js` `themeConfig.navbar.items`.
- **[content] Writer-focused openers** in ~4 published docs (lead with "Understanding…/I…"
  instead of the reader's takeaway): `generative-ai/fundamentals/2025-07-30-understanding-the-
  fundamentals-of-genai.md`, `interview-prep/understanding-what-companies-expect.md`,
  `companies/culture/2025-09-25-understanding-cultural-values.md`,
  `companies/skills/my-problem-sovling-approach.mdx`. → content plan (voice pass).
- **[struct] One published long sidebar title.** `interview-prep/understanding-what-companies-
  expect.md` (35 chars, no `sidebar_label`). Marginal; add a short `sidebar_label` if/when source
  edits resume. (Normally the skill auto-applies this, but it's held with the content freeze.)
- **[struct] Orphan (1-doc) categories — mostly DRAFT-backed, low live impact.** Several
  `_category_.json` folders hold a single doc, but most lone docs are DRAFTS (e.g.
  `scripting/research/learning-bash`, `frontend-development/tinkering/tinker-geometric-design`),
  so they don't appear in the published sidebar yet. Two are published README-only shells
  (`workspace/tips`, `workspace/tools`) and `frontend-development/techniques/storybook-typescript-
  babel` (depth-5, published). → Revisit alongside the publish sprint (when drafts land, decide
  promote-up vs keep); not worth churning now. URL-safe to flatten (absolute slugs).
- **[struct] Depth-5 paths are sanctioned/scaffolding.** `blogging/prompts/evals/{all,specific}-
  posts/*` (prompt scaffolding) and `frontend-development/techniques/storybook-typescript-babel/`
  sit 5 deep. The validator doesn't flag them (prompts/evals are tooling, not reader docs). Low
  priority; only `storybook-typescript-babel` is a reader doc worth maybe collapsing one level.

### Applied vs. proposed
- **Applied: nothing** (content/source edits are on hold; this run is report-only).
- **Proposed — structural (→ `compressed-greeting-quasar.md` follow-up):** the "sovling" slug
  typo decision; navbar builder-word renames; the 1 long sidebar_label; orphan-category
  flattening (defer to publish sprint); storybook depth.
- **Proposed — content (→ `blog-content-review.md`):** software-development landing orientation
  copy (P1); writer-focused opener rewrites (P2).

## Net
The IA, slugs, labels, and most landings are in good shape — the restructure did its job. The
only reader-facing gap with real bite is the **software-development landing (bare iframe)**;
everything else is light polish. Recommend: handle the **sovling slug decision** + **navbar
rename proposal** as small structural follow-ups (not content), and route the landing copy +
voice into the content plan when the hold lifts.
