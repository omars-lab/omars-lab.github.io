# Authoring mechanics (shared across every home)

The build-and-frontmatter mechanics that hold for EVERY post/doc, regardless of home. The
`homes/*.md` and `kinds/*.md` guides add the home/kind-specific parts; this file is the shared
substrate they all reference. (Formerly the `author-blog-post` skill.)

## Where content lives (`bytesofpurpose-blog/`)

- `blog/` — the `/initiatives` blog (`YYYY-MM-DD-slug.md`); the public feed of dated work.
- `thoughts/`, `mindset/`, `questions/` — the three temporal-thought blog instances.
- `designs/` — the `/designs` blog (`YYYY-MM-DD-slug.mdx`; always `.mdx`).
- `changelog/` — the Changelog blog instance (see `manage-changelog`).
- `docs/craft/`, `docs/journey/`, `docs/knowledge/`, `docs/habits/`, `docs/handbook/` — the FIVE
  docs instances (each its own `plugin-content-docs`; see the CLAUDE.md structure tenet +
  `manage-docs-instances`). Sidebar order comes from `_category_.json` `position`, NOT numeric
  folder prefixes.
- `src/pages/` — standalone React pages (e.g. `welcome.mdx`).

> **A post that uses JSX components must be `.mdx`, not `.md`.** Docusaurus only evaluates JSX in
> `.mdx`. A `question-set` (`<Question>`/`<SectionBanner>`), a `quote-set` (`<QuoteSet>`), any post
> embedding a component — rename `…-slug.md` → `…-slug.mdx` first, or the JSX is ignored/errors.

## The `kind:` + sidebar-emoji system

Every blog post declares a **`kind:`** — the TYPE of document it is, not its topic. The kind drives
the **sidebar emoji** (auto-derived, never hand-typed) and the **outline contract** (the structural
elements that kind should contain).

> **SOURCE OF TRUTH: `bytesofpurpose-blog/scripts/lib/blog-kinds.json`.** Each kind declares
> `{emoji, description, outline}` (plus collection flags: `thought`/`mindset`/`question`/`docKind`).
> The validator, the `draft-docs` plugin, the hook, and the "Start Here" legend all derive from it.
> **Do NOT maintain a parallel copy** — `cat` that file (or read the inline legend the hook prints
> on a missing/unknown-kind finding) for the authoritative, current list. There are ~32 kinds; the
> per-home guides (`homes/*.md`) list the subset relevant to their home.

**Frontmatter:**
```yaml
---
title: "What Does GTM Mean? (And Is It the Same as an Experiment Dial-Up Plan?)"  # full: H1 + SEO + tab
kind: reference                # drives the sidebar emoji + outline checks
sidebar_label: "What Is GTM?"  # SHORT (<= 3 CONTENT words) sidebar entry; NO emoji (kind adds it)
---
```

- **The emoji is auto-derived from `kind:` — do NOT put an emoji in `title:` or `sidebar_label:`.**
  The `draft-docs` plugin prepends the kind emoji to the rendered sidebar label
  (`<emoji> + (sidebar_label || title)`); the swizzled `BlogSidebar` (Desktop + Mobile) renders it,
  full title on hover.
- **`sidebar_label:`** is a SHORT entry for the Posts sidebar (the full `title:` stays the H1 / SEO
  title / tab). Aim for **≤ 3 content words** (particles like the/of/and/is don't count). For a
  series, drop the repeated prefix (e.g. `sidebar_label: "Finding Purpose"`). The blog plugin does
  NOT read `sidebar_label` natively; our `draft-docs` plugin + `BlogSidebar` swizzle do.
- **`pinned: true`** lifts a post ABOVE the year groups into a top **"Guides"** section (dated posts
  sit under **"Posts"** below). Any **`kind: legend`** pins automatically. The post keeps its real
  date; only sidebar PLACEMENT changes.

> **Where the sidebar behaviors live (when you need to change one).** Not Docusaurus defaults — a
> swizzle + plugin pair: **`plugins/draft-docs/index.js`** publishes maps via global data
> (`blogSidebarLabels`, `blogPinnedPermalinks`, `blogDraftPermalinks`, `blogPostTags`);
> **`src/theme/BlogSidebar/{Desktop,Mobile}/index.tsx`** (+ `blogSidebarLabel.ts`) consume them —
> the short label, the Guides/Posts split, and the per-tag sidebar scoping + cancelable facet chip
> on a `/initiatives/tags/<tag>` page. Add a per-post behavior by publishing a map in the plugin and
> reading it in the swizzle. The `kind → emoji` comes from `blog-kinds.json`.

**Outline validation (warn-tier, `validate-post-outline.js` + its `Write|Edit` hook)** — all rules
read from `blog-kinds.json`; the hook prints the FULL legend + the kind's contract inline so you can
fix it (or realize the kind is wrong) without leaving the terminal:
- `missing-kind` — a blog post with no `kind:`.
- `unknown-kind` — a `kind:` not in `blog-kinds.json`.
- `long-sidebar-label` — the entry exceeds ~3 content words / ~32 chars. Add a short `sidebar_label:`.
- per-kind **outline** — the elements that kind requires (e.g. `question-set` needs H2 +
  `<Question>` + `<SectionBanner>`; `design-story` needs a link to `/designs`). Exact list per kind
  is in the JSON's `outline`.
- `legend-drift` — the "Start Here" reader legend disagrees with `blog-kinds.json`.

> **Investigate before you "fix" an outline advisory.** When the hook flags a missing element, FIRST
> ask: is the POST missing structure, or is the `kind:` WRONG for what the post actually is? A
> "legend" that is really an essay, or a "system-design" that is really a narrative `design-story`,
> is fixed by **correcting `kind:`**, not by forcing a mockup/Decisions heading onto it. Most
> backfill advisories were mis-classifications, not gaps.

**Adding / changing a kind — owned by the `manage-kinds` skill.** The full lockstep (edit
`blog-kinds.json` → add a `CHECKS` test if a new outline `id` → add a row to the "Start Here" reader
legend at `docs/handbook/README.mdx`, enforced by `legend-drift` → update the collection legend if
`thought`/`mindset`/`question`-flagged → add an `author-post/kinds/<name>.md` checklist only if the
kind has real specifics) lives in **`manage-kinds`**. Guarded by `make validate-kinds-guidance`
(the guidance side) + `make validate-post-outline` (the data + legend side). Mirrors the docs emoji
system (`scripts/lib/emoji-map.json` + `suggest-emoji`, docs-only).

## Naming — the title-voice contract (name it for its nature)

A title is a promise about what the post IS. The most common failure is a **voice mismatch**: an
unactioned idea titled like a finished thing. "My First NotePlan Plugin" reads as a completed
initiative, but if it hasn't been built the post is really a **question being weighed** — the title
should say so: "Should I build a NotePlan plugin?". The rule follows from the post's **kind + home**
(classify with `organize-post` if unsure): **name it in the voice of what it actually is.**

| The post is… | Home | Title voice | Examples |
|---|---|---|---|
| An **unactioned thought** (idea / question / simulation / prediction / critique / principle / design-story) | `/thoughts` etc. | an **open QUESTION** or clearly speculative — it's being weighed, not done | "Should I build a NotePlan plugin?" · "What if I tracked which scripts I use?" |
| An **acted-on initiative** (project / tinkering / research / prompt / experiment) | `/initiatives` | **what I DID** — a past/active accomplishment, a dated record | "Tracking which of my scripts I actually use" · "Support CTA: link vs button" |
| A **durable Craft/Journey** doc (framework / mental model / technique / reference) | `/craft`, `/journey` | the **lasting CONCEPT** — a noun phrase, "Understanding X", "A Framework for X" | "Understanding Dynamic Programming" · "A Framework for Prioritizing" |
| A **design write-up** | `/designs` | the SYSTEM being designed (noun phrase) | "The Build System Behind This Blog" |

The headline mistake: **a `/thoughts` idea titled as a completed initiative.** Tells:
- Starts with **"My First …"** ("My First iOS App") — reads as "the app I built".
- A bare **gerund of doing** ("Building a NotePlan Plugin") with no question — the log of doing it.
- States the artifact as a **fact** ("A NotePlan Plugin", "The Menu-Bar App") not the decision.

The fix is to phrase the **decision being weighed**: a question ("Should I build X?", "Is X worth
building?", "What would it take to build X?") or an explicitly speculative frame ("An idea: X").
A retitle often reveals the `kind:` is wrong (an "idea" mislabeled `reflection`) — fix it in the
same pass. The **`sidebar_label`** should be even shorter (the question's gist, e.g. "NotePlan
plugin?"). Change the `title`/`sidebar_label` freely (not the URL); only change the `slug:` if the
URL genuinely should change, and then pair it with a `{from,to}` redirect.

> **The audit that enforces this: `audit-post-names`** (`validate-post-naming.js` + its warn hook,
> `make validate-naming`). It flags a `/thoughts` post whose title matches a "completed-initiative"
> pattern and suggests the question form. Warn-tier — naming is a judgment call, the check is a
> reminder. When you add a new voice rule, encode it in the validator + THIS section in lockstep.

## MDX pitfalls that FAIL the build (learned the hard way)

Docusaurus 3 parses `.md`/`.mdx` as MDX. These break the build during static generation (often a
cryptic SSR stack) — catch them before deploy:

1. **Bare `<br>` → use `<br/>`.** MDX requires self-closing void tags. A bare `<br>` in a table cell
   fails with *"Expected a closing tag for `<br>`"*.
2. **Unescaped `{word}` is treated as a JS expression.** Plain text like `{category}` outside
   backticks throws *"ReferenceError: category is not defined"*. Wrap in backticks (`` `{category}` ``)
   or escape `\{category\}`. Inside inline code spans braces are already safe.
3. **A bare `<` before a space/digit parses as JSX.** Write "under 100ms", not `< 100ms`, or escape
   to `&lt;`. Raw `<` / `>` / unclosed JSX are the same class of failure — prefer fenced code blocks
   for anything HTML/JSX-like that should render literally. Bare autolinks `<https://x>` become real
   markdown links.
4. **Duplicate routes** — two files resolving to the same path emit a build warning and
   non-deterministic routing; rename one.
5. **No em-dash voice.** A literal `—` (U+2014) in reader-facing content
   (`docs`/`blog`/`designs`/`changelog`) is BLOCKED by the em-dash hook, and a `--` sentence-dash
   bypass is blocked too. Use commas, colons, periods, or `·`. In mermaid labels use the `&#8212;`
   entity. See `review-reader-experience` ("the em-dash tell").

## Frontmatter helpers

AI-assisted fixers wired into the Makefile:
```bash
make fix-frontmatter   # fix frontmatter issues across the site (AI)
make fix-blog-posts    # fix frontmatter for recently modified posts + placeholders
```
Blog posts support a truncation marker for list previews — add `<!-- truncate -->` after the intro
so paginated lists show a short preview (a warning nags otherwise).

### `questions:` — the reader questions a post answers (optional)

A post MAY declare the reader questions it answers. They render as a "Questions this post answers"
box at the top (the `<PostQuestions>` box, mounted automatically by the swizzled blog/doc item — no
import, no placement). This is the reader-facing mirror of the repo convention "frame each task
around the MAIN QUESTION it answers": the questions usually come straight from the request.

```yaml
questions:
  - What is the loop behind every habit?
  - Why does willpower behave like a muscle rather than a fixed trait?
```

Rules (warn-validated, `validate-questions.js` + `make validate-questions`): OPTIONAL, but when
present must be a YAML list, non-empty, each item a real question ending in `?` (not a topic label).
Absent → the box simply does not render.

## Premium content (how to MARK it — the mechanics)

> For *whether* a doc should be premium (the editorial policy), see **`manage-premium-content`**.
> This is only the how-to-mark.

**Hard gate — whole doc (`premium: true`):** encrypted at MDX-compile by
`plugins/rehype-premium-encrypt.js`; the plaintext ships in NEITHER the HTML nor the JS bundle.
Anonymous readers see a teaser + lock; signed-in (LinkedIn via Cloudflare Access) readers get the
passphrase from the Worker and decrypt in-browser.

```yaml
---
title: My deep-dive
premium: true
premium_teaser: "One or two sentences shown in clear above the lock."   # optional
description: "…"        # falls back to this for the teaser if premium_teaser is absent
---
```

Rules (warn-validated by `validate-docs-structure.js`): `premium` boolean, `premium_teaser` string;
**`premium: true` is mutually exclusive with `draft: true`** (a premium draft would never get
encrypted and would 404); give it a teaser so the gate has something to show in clear.

**Soft gate — an inline block (`<Premium>`):** wraps a region inside an otherwise-free doc.
Signed-in → rendered; anonymous → blurred sneak-peek + lock pill. **The children ARE in the bundle**
(just blurred) — a nudge, NOT cryptographic withholding. For must-hide content, make the whole doc
`premium: true`.

```mdx
import Premium from '@site/src/components/Premium';

<Premium>
This paragraph is blurred until the reader signs in.
</Premium>
```

**Verify premium before deploy:** premium docs require a cache-busted encrypted build + the blocking
V5 gate — use `make build-premium` (NOT a bare `yarn build`); see `deploy-site`'s cache gotcha.

## Glossary linking — the first-genuine-use contract

The site has a single [Glossary](/glossary): ~19 defined terms of art (System, Service, Library,
Package, Initiative, Project, Role, Skill, Workflow, …), each with a definition page under `/craft`.
The convention: **the first time a post uses one of these as the TERM OF ART, that occurrence links
to its definition; later uses, and all casual-English uses, stay plain.**

The hard part is not finding the word, it's deciding whether *this* use is the term-of-art — a
judgment a regex cannot make ("Role" is the CLI Role concept in one post and a person's role in life
in another). So the mechanical check finds **candidates**; you make the **call** while authoring.

**The registry.** `bytesofpurpose-blog/scripts/lib/glossary-terms.json` is the source of truth: each
`term` → its definition `href` (+ `aliases`, e.g. the plural). Kept in lockstep with the `/glossary`
home (`src/pages/glossary.mdx`). Adding/moving a term edits BOTH in the same change; if a definition
page moves, update its `href` + pair a `{from,to}` redirect.

**The rule (precise).** For each registered term in a post:
1. **Find the first occurrence** in the PROSE (ignore frontmatter, code fences, inline code, and
   text that is already a link).
2. **Judge it.** Is this occurrence the TERM OF ART as the glossary defines it (would a reader
   benefit from the definition here), or ordinary English that shares the word? Read the sentence.
   - Genuine (link it): "the scanner is one **Service** that calls another"; "an **Initiative** is a
     goal-bearing effort".
   - Casual (leave plain): "what **role** do you play in your family?"; "public **libraries** keep
     reading cheap".
3. **Link only the FIRST genuine occurrence** to the term's `href`
   (`[Service](/craft/software-development/terminology/terminology-portfolio)`). Keep the visible
   text exactly as written (capitalization/plural). Do NOT link later occurrences or casual uses.
4. **Skip personal/meta posts.** In `question-set`, `reflection`, `legend`, `event-recap` posts
   these words are almost always casual (the check already skips those kinds); link only an
   unmistakable term-of-art.

**Idempotent by construction:** step 3 only links an occurrence that is *not already a link*, and
only the first genuine one, so a second pass finds it linked and does nothing.

> **The audit that surfaces candidates: `audit-glossary-links`** (`validate-glossary-links.js` +
> its warn hook, `make validate-glossary`). It does file-level triage — which posts have an unlinked
> first-use candidate — and points here for the per-occurrence call. A casual use you correctly left
> plain stays a candidate; that's advice, not a defect. Note in your summary which you judged casual
> so the next run isn't re-litigated.

## Validate before deploy

```bash
make check                                 # MDX lint
( cd bytesofpurpose-blog && yarn build )   # full build — the real gate
make start                                 # local preview at :3000
```

A clean `yarn build` ending in `[SUCCESS] Generated static files` is the signal it's safe to
`deploy-site`. Also run the gates the home/kind guide names (outline / seo / structure / redirects /
links / naming), and a real render check for anything client-rendered (mermaid, mockups,
walkthroughs are draft-only + browser-rendered — prove them on the dev server, per `serve-locally`).

## Analytics note

New interactive components can emit PostHog events (`posthog.capture('event name', {...})`). Keep
the catalog in `bytesofpurpose-blog/src/posthog-integration-plan.md` up to date when you add one.
