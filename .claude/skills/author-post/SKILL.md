---
name: author-post
description: THE authoring skill for writing/editing any post or doc on the Bytes of Purpose site (blog AND docs) — the frontmatter, MDX build-breakers, kind/sidebar-emoji system, title-voice naming, premium-marking, and per-home + per-kind checklists, all in one place. A three-layer structure: mechanics.md (the shared build/frontmatter/MDX/naming rules that hold everywhere) + homes/[name].md (per-home: design, craft, journey, initiatives, thoughts) + kinds/[name].md (per-kind deep checklists, e.g. idea). Use when the user says "write a post about X", "add an idea post", "start a new design/craft/initiative post", "how do I author this for /craft", "draft this up as a post", "fix this frontmatter", "why does my MDX build fail", or hands over finished content to turn into a post. Distinct from organize-post (which CLASSIFIES where content goes); this skill AUTHORS once the home is known, calling organize-post first when the home is unclear. Pairs with import-co-design (HLD→/designs), refine-design-post (audit a /designs post), audit-post-names (the title-voice audit), and the component/finishing skills as the post matures.
---

# Author a post (the single authoring skill)

THE skill for writing or editing any post/doc on this site. Authoring correctly means three
things, in three layers:

- **`mechanics.md`** — the shared build substrate that holds EVERYWHERE: where content lives, the
  `kind:` + sidebar-emoji system (source of truth `blog-kinds.json`), the **title-voice naming
  contract**, the MDX build-breakers, the `questions:` field, premium-marking, and validate-before-
  deploy. Read it once; the home/kind guides don't repeat it. (This is the former `author-blog-post`.)
- **`homes/[name].md`** — the per-HOME guide (design, craft, journey, initiatives, thoughts): the
  frontmatter shape, slug rule, `kind:` vocabulary, and outline contract **for that home**.
- **`kinds/[name].md`** — a per-KIND deep checklist for the kinds with real specifics beyond their
  home's shared shape (e.g. `kinds/idea.md`). Most kinds don't need one — they're covered by their
  home guide + `blog-kinds.json`.

This skill is also the **dispatcher**: decide the home, open its `homes/` guide, and drop into a
`kinds/` checklist if one exists. It cross-links the deep skills (hubs, boards, components,
experiments) rather than duplicating them.

## Step 0 — know the home (classify first if unsure)

If the request already names the home ("write a **design** post", "a new **/craft** technique",
"log this **initiative**"), skip to the routing table. If it is ambiguous ("write up my notes on
X", "turn this braindump into a post"), **do not guess** — run the **`organize-post`** skill
first (the classifier: durable vs temporal, acted-on vs unactioned, which `kind:`), or ask the
user with `AskUserQuestion`. `organize-post` decides WHERE and WHAT KIND; this skill takes that
answer and AUTHORS it. If the content is thin/rough, mature it with **`mature-content`** before
authoring.

## Routing table — pick the home, read its guide

| The post is… | Home / route | Read this guide | Deep skill it hands to |
|---|---|---|---|
| A **design / architecture** doc (HLD, system, service, UI, agent, or CLI design) | `/designs` blog | **`homes/design.md`** | `import-co-design` (from an HLD) · `author-walkthrough` |
| A **durable "how I do the work"** learning (framework, pattern, technique, guide, hub, showcase) | `/craft` docs | **`homes/craft.md`** | `manage-hubs` · `maintain-showcase` · `reorganize-content` |
| A **durable "why I build"** reflection (faith, growth, entrepreneurship, productivity) | `/journey` docs | **`homes/journey.md`** | (shares craft mechanics) `manage-docs-instances` |
| A **temporal thing I DID** (project log, tinkering, research, prompt, experiment) | `/initiatives` blog | **`homes/initiatives.md`** | `groom-initiatives` · `design-experiment` · `manage-hubs` |
| A **temporal thought** — an idea/question that OCCURRED to me, or a curated quote/principle | `/thoughts`, `/mindset`, `/questions` blogs | **`homes/thoughts.md`** | `groom-initiatives` (board an idea) · `upgrade-post` (quote/question kits) |
| A **durable mental model** (`/knowledge`) or **habitual practice** (`/habits`) | `/knowledge`, `/habits` docs | **`homes/craft.md`** (same docs shape) | `manage-docs-instances` |
| The **Changelog**, a **Handbook** legend page, or a **whole new docs instance** | `/changelog`, `/handbook`, new root | (no subfile) | `manage-changelog` · `manage-docs-instances` |

> The site's placement model (durable vs temporal; acted-on vs unactioned; the thought kinds)
> is owned by the CLAUDE.md tenet "durable (`/craft` + `/journey`) vs temporal (`/initiatives`)"
> and the `organize-post` skill. This skill assumes the home is settled and gets the post WRITTEN.

## Universal rules (apply to EVERY home — the subfiles only add the home-specific parts)

These hold no matter which guide you open. The subfile will not repeat them; the full mechanics
are in **`mechanics.md`**.

1. **No em-dash voice.** A literal `—` (U+2014) in reader-facing content (`docs`/`blog`/`designs`/
   `changelog`) is BLOCKED by the em-dash hook, and a `--` sentence-dash bypass is blocked too.
   Write with commas, colons, periods, or `·`. In mermaid labels, use the `&#8212;` entity (it
   renders as a dash and the hook never sees it). See `review-reader-experience` ("the em-dash tell").
2. **MDX-safety** (`.mdx`, and `.md` that uses components). A bare `<` before a space/digit parses
   as JSX — write "under 100ms", not `< 100ms`, or escape to `&lt;`. A bare `{word}` parses as a JS
   expression — put it in backticks/a code fence. Bare autolinks `<https://x>` become real markdown
   links. Full list: **`mechanics.md`** ("MDX pitfalls").
3. **`authors: [oeid]`** on everything.
4. **`description:` is required and load-bearing** — 50 to 160 chars, non-empty, unique. It powers
   `og:description` (SEO/social) AND the ShareButton message. See `manage-frontmatter-descriptions`.
5. **Slugs are absolute (leading slash) and, in docs, INSTANCE-RELATIVE** (a `/craft` doc's slug is
   relative to the craft root: `slug: /software-development/x` → `/craft/software-development/x`).
   Editing a slug value 404s the old URL, so **a move pairs with a `{from,to}` client-redirect**
   (validated by `validate-redirects`).
6. **Name it for its nature** — a thought reads as an open QUESTION, an initiative as what I DID, a
   durable doc as the lasting CONCEPT. The full title-voice contract is in **`mechanics.md`**
   ("Naming"); the audit is **`audit-post-names`** (`make validate-naming`).
7. **Link the first genuine glossary term** (`link-glossary-terms`) and **lint links**
   (`validate-links`) before finishing.
8. **Validate before commit.** Run the gates the subfile names (outline / seo / structure /
   redirects / links), plus a real render check for anything client-rendered (mermaid, mockups,
   walkthroughs are draft-only + browser-rendered — prove them on the dev server, per `serve-locally`).

## After authoring

Draft posts stay `draft: true` until deliberately published — `publish-site` triages readiness,
un-drafts, and deploys. Track the work as a task (CLAUDE.md convention), and if it was a
reorg/move, follow `reorganize-content`.

## Files

- `mechanics.md` — the shared build substrate (read once): where content lives, the kind/sidebar-emoji system (→ `blog-kinds.json`), the title-voice **Naming** contract, MDX build-breakers, the `questions:` field, premium-marking, validate-before-deploy. (The former `author-blog-post` skill.)
- `homes/design.md` — authoring a `/designs` post (the *-design kinds, the mockup sidecar, the import-vs-hand-author fork).
- `homes/craft.md` — authoring a `/craft` (or `/knowledge`/`/habits`) doc (the topic-folder contract, docs kinds).
- `homes/journey.md` — authoring a `/journey` doc (shares craft mechanics; different nature + areas).
- `homes/initiatives.md` — authoring an `/initiatives` blog post (the board/hub frontmatter).
- `homes/thoughts.md` — authoring a `/thoughts`, `/mindset`, or `/questions` post (the thought/mindset/question kinds + title voice).
- `kinds/idea.md` — the deep checklist for a `kind: idea` post (the Ideas board, title voice, tag glosses). Add a `kinds/<name>.md` ONLY for a kind with real specifics beyond its home's shared shape.

## Learnings log (newest first)

- 2026-07-11 — Merged `author-blog-post` INTO this skill. The two were the same skill split by
  history: `author-blog-post` held the mechanics (MDX/frontmatter/kinds/premium) that ~38 files
  referenced; this one held the router + per-home guides but no mechanics and few inbound refs. The
  mechanics moved to `mechanics.md`, the title-voice contract moved here from `name-post` (now the
  thin `audit-post-names` auditor), and a per-KIND layer (`kinds/idea.md`) was added — the original
  ask being a dedicated "add an idea post" checklist. `author-blog-post` is retired; its ~38
  references repoint here.
- 2026-07-04 — Created. Motivated by hand-authoring the Fleetplane `/designs` post from a pasted
  implementation plan (not an `import-co-design` HLD): the conventions were spread across
  `import-co-design` + `author-blog-post` + `author-walkthrough` + reading example posts, with no
  single "author a post for THIS home" entry. This router consolidates the per-home authoring
  checklist and cross-links the deep skills, without duplicating them.
