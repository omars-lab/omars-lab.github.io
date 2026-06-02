# Plan: Dissolve the cross-cutting `/mental-models/*` slug namespace into per-topic `mental-models/` subdirs

## Context

**The problem.** 17 docs publish under `/mental-models/*` absolute slugs, but they physically
live in three different topic folders (`generative-ai/fundamentals`, `interview-prep` +
`interview-prep/data-structures-and-algorithms`, `companies/{roles,skills,culture}`). So
`mental-models` is an **orphan root URL namespace** with no folder, no landing page, and no
Welcome card — a reader at `/mental-models/understanding-heaps` has no parent to climb to,
and the folder tree (organized by topic) has silently diverged from the URL tree (organized
by a cross-cutting "understanding-X" concept).

**The decision (from the user).** Do NOT keep `mental-models` as a cross-cutting lens.
**Shift the docs and their slugs** so `mental-models` becomes a **subdir under the relevant
topic/subtopic** — a real folder + slug segment owned by its topic, not a root namespace.
Old URLs are live + linked, so **add redirects** for every moved slug (+ fix internal links).
"Keep a `mental-models/` subdir where it fits" (user's words).

**Intended outcome.** Each topic owns its mental-model content: `interview-prep/mental-models/…`,
`companies/mental-models/…`, `generative-ai/mental-models/…`. The `/mental-models/*` URLs keep
working via client redirects. The folder tree and URL tree re-converge. This also resolves two
parked questions: **`DFS vs BFS`** (a draft blog post) lands with the DS&A mental-model docs;
**`Docs vs Blogs`** (live blog post) is content-strategy, not a mental model — it moves to
`blogging/` (sibling of the new Blog Post Triggers doc) with its own redirect.

This is a structure change → per the CLAUDE.md operating convention, the validator + skill
contract must be updated in the SAME change.

---

## Target structure + slug map

`mental-models/` becomes a **subdir under each owning topic**; the new slug is **topic-first
and mirrors the folder** (the IA contract: slug pinned to a value, folder = authoring home).

### A. interview-prep — DS&A + process
New folders: `docs/interview-prep/mental-models/` (with `_category_.json`) and
`docs/interview-prep/mental-models/data-structures-and-algorithms/` (move the existing
`data-structures-and-algorithms/` under it).

| Doc (current path) | Old slug | New slug |
|---|---|---|
| interview-prep/data-structures-and-algorithms/understanding-trees.mdx | /mental-models/understanding-data-structs-and-algos/understanding-trees | /interview-prep/mental-models/data-structures-and-algorithms/understanding-trees |
| …/understanding-graphs.mdx | …/understanding-graphs | /interview-prep/mental-models/data-structures-and-algorithms/understanding-graphs |
| …/understanding-heaps.mdx | …/understanding-heaps | …/understanding-heaps |
| …/understanding-lists.mdx | …/understanding-lists | …/understanding-lists |
| …/understanding-dynamic-programming.mdx | …/understanding-dynamic-programming | …/understanding-dynamic-programming |
| interview-prep/understanding-the-interview-process.md | /mental-models/understanding-processes/understanding-the-interview-process | /interview-prep/mental-models/understanding-the-interview-process |

### B. companies — roles / skills / culture
New folder: `docs/companies/mental-models/` with sub-buckets `career-levels/`, `skills/`,
`cultural-values/` (keeps the existing slug sub-namespaces as folder names).

| Doc | Old slug | New slug |
|---|---|---|
| companies/roles/2025-10-02-staff-engineer-traits.md | /mental-models/understanding-career-levels/staff-engineer-traits | /companies/mental-models/career-levels/staff-engineer-traits |
| companies/roles/understanding-differences-in-skills.mdx | /mental-models/understanding-career-levels/understanding-sde-levels | /companies/mental-models/career-levels/understanding-sde-levels |
| companies/skills/understanding-desireable-leadership-skills.md | /mental-models/understanding-skills/leadership-principles-companies-look-for | /companies/mental-models/skills/leadership-principles-companies-look-for |
| companies/skills/understanding-desireable-tech-skills.md | /mental-models/understanding-skills/technical-skills-interview-evaluation | /companies/mental-models/skills/technical-skills-interview-evaluation |
| companies/skills/understanding-desireable-soft-skills.md | /mental-models/understanding-skills/soft-skills-interview-evaluation | /companies/mental-models/skills/soft-skills-interview-evaluation |
| companies/culture/2025-09-25-understanding-cultural-values.md | /mental-models/understanding-cultural-values/understanding-tech-company-culture | /companies/mental-models/cultural-values/understanding-tech-company-culture |
| companies/culture/2025-09-25-understanding-zapier-values.md | /mental-models/understanding-cultural-values/understanding-zapier-values | /companies/mental-models/cultural-values/understanding-zapier-values |

> **NOTE — file moves are optional.** Because slugs are absolute, the *slug* change is what
> matters; physically relocating files into the new `mental-models/` folders is the cleaner
> end state (folder ⇒ sidebar grouping, since the sidebar is autogenerated). Plan moves the
> files so the autogenerated sidebar reflects the new IA. Use `git mv` to keep history.

### C. generative-ai — fundamentals  ⚠️ ONE SUB-DECISION (see Open question)
| Doc | Old slug | New slug (recommended) |
|---|---|---|
| generative-ai/fundamentals/2025-07-30-understanding-the-fundamentals-of-genai.md | /mental-models/understanding-the-genai-domain/understanding-fundamentals-of-genai-systems | /generative-ai/mental-models/understanding-fundamentals-of-genai-systems |
| generative-ai/fundamentals/2025-06-15-ai-engineer-world-fair.md | /mental-models/understanding-the-genai-domain/ai-engineer-world-fair-2025 | /generative-ai/mental-models/ai-engineer-world-fair-2025 |
| generative-ai/fundamentals/2025-10-04-learning-about-genai.md | …/learning-about-genai | /generative-ai/mental-models/learning-about-genai |
| generative-ai/fundamentals/2025-11-10-ai-framework-landscape.md | …/ai-framework-landscape | /generative-ai/mental-models/ai-framework-landscape |

### D. The two parked blog posts
- **DFS vs BFS** (`blog/2025-03-07-DFS-vs-BFS.md`, `draft: true`) → move to
  `docs/interview-prep/mental-models/data-structures-and-algorithms/dfs-vs-bfs.mdx`, slug
  `/interview-prep/mental-models/data-structures-and-algorithms/dfs-vs-bfs`. Convert blog
  frontmatter → doc frontmatter (absolute slug, drop `image`). No redirect (was never live).
- **Docs vs Blogs** (`blog/2025-01-31-docs-vs-blogs.md`, **live**) → move to
  `docs/blogging/docs-vs-blog-posts.mdx`, slug `/techniques/blogging-techniques/docs-vs-blog-posts`.
  **Redirect** `/blog/docs-vs-blog-posts` → new slug. Update the 3 inbound links
  (welcome/README, adding-blog-posts.mdx, blog-post-triggers.mdx).

---

## Redirects (new infrastructure)

No redirect plugin exists. Install + wire **`@docusaurus/plugin-client-redirects`** (matches
the `@docusaurus/*@^3.9.1` stack already in use):
- `yarn add @docusaurus/plugin-client-redirects@^3.9.1` (also add to package.json deps).
- Register in `docusaurus.config.js` plugins array with a `redirects: [...]` array mapping
  every **old** path → **new** path. Two URL forms exist in the wild (`/mental-models/...` and
  `/docs/mental-models/...`); the docs route prefix is `/docs`, so the real served old URL is
  `/docs/mental-models/...` — redirect those. Include the `/blog/docs-vs-blog-posts` entry.
- 18 redirect entries total (17 mental-models docs + docs-vs-blogs).

## Internal link fixes (25 links)

Repoint every inbound `](/docs/mental-models/...)` link to its new `/docs/<new-slug>` target.
Heaviest clusters (from grep): `docs/companies/terminology.mdx` (6), `docs/interview-prep/preparing/README.md`
(6), `docs/interview-prep/understanding-what-companies-expect.md` (5), `generative-ai/fundamentals/2025-10-04-learning-about-genai.md`
(4), plus `designing-genai-systems.mdx`, `pre-meditating-responses-…mdx`, `blog-post-triggers.mdx`,
and `blog/2025-06-15-ai-engineer-world-fair-2025.md` (the back-link). Full list captured in
exploration notes.

## Structure validator + skill (lockstep)

- `scripts/validate-docs-structure.js`: no `mental-models` special-case today and the generic
  rules still pass post-move. Add a **warn-tier `legacy-namespace` guard**: flag any NEW doc
  whose slug starts `/mental-models/` (the namespace is retired; new docs must be topic-first).
  Add to the SEVERITY map + doc-comment rule list.
- Update `review-reader-experience` SKILL.md "Topic-folder contract" section: record that
  `mental-models/` is a per-topic subdir (not a root namespace) and that the retired
  `/mental-models/*` URLs are preserved via client redirects.

---

## Critical files

| File / group | Change |
|---|---|
| 17 doc files (paths in slug map) | `git mv` into new `mental-models/` subdirs + rewrite `slug:` frontmatter |
| new `_category_.json` ×~5 | `mental-models/` folders under interview-prep, companies (+ career-levels/skills/cultural-values), generative-ai |
| `blog/2025-03-07-DFS-vs-BFS.md`, `blog/2025-01-31-docs-vs-blogs.md` | move to docs, convert frontmatter |
| `docusaurus.config.js` | add plugin-client-redirects + 18 redirect entries |
| `package.json` | add `@docusaurus/plugin-client-redirects` |
| 25 inbound links (≈8 files) | repoint to new slugs |
| `scripts/validate-docs-structure.js` | add `legacy-namespace` warn rule |
| `.claude/skills/review-reader-experience/SKILL.md` | document the new convention |

## Reuse
- Sidebar is **autogenerated** (`sidebars.js` → `{type:'autogenerated'}`) — folder moves
  reflect automatically; NO manual sidebar edits.
- `git mv` preserves history; absolute-slug design means moving files never changes a URL on
  its own — only the explicit `slug:` edits do.

---

## Verification (end-to-end)

1. `make validate-structure` — 0 ERROR; new `legacy-namespace` rule fires only on a scratch
   `/mental-models/` slug (test then revert); no orphan/depth regressions from the new subdirs.
2. `make validate-links` — clean (all 25 repointed links resolve; no published→draft).
3. `make build` — succeeds; **broken-link count does not increase** vs the current baseline
   (8). Grep the build log for any `/mental-models` or `docs-vs-blog-posts` broken-link line → none.
4. **Redirects work:** `make serve` (:4173) or dev `:3000`, then `curl -sI` each old URL
   (`/docs/mental-models/understanding-trees`, `/blog/docs-vs-blog-posts`) → 200 after the
   client redirect resolves; spot-check 3-4 in the browser (chrome-devtools) that they land on
   the new page. New slugs return 200 directly.
5. Sidebar: load `:3000`, confirm the moved docs appear under their topic's new
   `mental-models/` group (autogenerated), and nothing is orphaned.
6. `make test-regression` — a11y/SEO gates hold; no dev-only surface leak.

## Open question (one sub-decision, will confirm before executing)
- **generative-ai placement:** new slug `/generative-ai/mental-models/...` (recommended,
  consistent with the others) vs. keeping these 4 in `fundamentals/` with a
  `/generative-ai/fundamentals/...` slug (they're foundational, not just mental-models). The
  table above assumes the former; flagging for confirmation.
