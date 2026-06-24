---
name: author-blog-post
description: Author or edit blog posts and docs for the Bytes of Purpose Docusaurus site — correct frontmatter, MDX pitfalls that break the build (bare <br>, unescaped braces), where content lives, and how to validate before deploy. Use when writing/editing a post or doc, fixing frontmatter, or diagnosing an MDX build failure.
---

# Author content for Bytes of Purpose

Guardrails for writing/editing content in the Docusaurus site so it builds and
deploys cleanly. Pairs with `deploy-site` (ship) and `validate-deployment` (verify).

## Where content lives (`bytesofpurpose-blog/`)

- `blog/` — blog posts (`YYYY-MM-DD-slug.md`). Only 4 here; this is the public feed.
- `docs/` — the bulk of content (287+ pages), numbered sections `1-welcome/` …
  `9-definitions/`. Sidebar order comes from the numeric prefixes.
- `changelog/` — changelog entries (its own blog plugin instance).
- `src/pages/` — standalone React pages (e.g. `changelog.tsx`).

> **Question-set posts must be `.mdx`, not `.md`.** Any post tagged `question-set`
> (the "What I Ask Myself: …" series) uses `<SectionBanner>` and `<Question>` JSX
> components. Docusaurus only evaluates JSX in `.mdx` files — a `.md` file ignores
> JSX silently or errors. Rename `YYYY-MM-DD-slug.md` → `YYYY-MM-DD-slug.mdx`
> before adding these components.

## Blog post `kind:` + the sidebar (emoji by TYPE, short labels)

Every blog post declares a **`kind:`** — what TYPE of document it is, not its topic. The
kind drives two things: the **sidebar emoji** (auto-derived, never typed by hand) and the
**outline contract** (what structural elements that kind of post should have). The kinds and
their emoji are the single source of truth in
**`bytesofpurpose-blog/scripts/lib/blog-kind-emoji.json`**:

| `kind:` | emoji | what it is |
|---|---|---|
| `question-set` | ❓ | a set of introspective questions ("What I Ask Myself" / "Questions for") |
| `framework` | 🧩 | a reusable model ("A Framework for", "The Anatomy of", a maturity model) |
| `reflection` | 💭 | a personal essay / takeaways ("Notes From", "What X Taught Me", affirmations) |
| `system-design` | 🏗️ | a full build/architecture write-up that paints the whole picture (UX mockup + key decisions) |
| `design-story` | 📐 | the STORY/motivation behind a design; a narrative front-door that **links to the formal HLD in `/designs`** (NOT the HLD itself) |
| `tutorial` | 🧪 | a hands-on, learn-by-doing walkthrough (steps / code / `<Walkthrough>` / `<Gif>`) |
| `reference` | 📖 | a concept explainer or taxonomy ("A Taxonomy of", "What Does X Mean") |
| `event-recap` | 🎙️ | a conference / event recap |
| `legend` | 🧭 | a series index / keystone that explains a set of posts + their conventions |

**Frontmatter:**
```yaml
---
title: "What Does GTM Mean? (And Is It the Same as an Experiment Dial-Up Plan?)"  # full title: H1 + SEO + tab
kind: reference                # drives the sidebar emoji + outline checks
sidebar_label: "What Is GTM?"  # SHORT (<= 3 CONTENT words) sidebar entry; NO emoji (kind adds it)
---
```

- **The emoji is auto-derived from `kind:` — do NOT put an emoji in `title:` or
  `sidebar_label:`.** The `draft-docs` plugin prepends the kind emoji to the rendered
  sidebar label (`<emoji> + (sidebar_label || title)`); the swizzled `BlogSidebar`
  (Desktop + Mobile) renders it, full title on hover.
- **`sidebar_label:`** is a SHORT entry for the Posts sidebar (the full `title:` stays the
  H1 / SEO title / browser tab). Aim for **≤ 3 content words** (particles like the/of/and/is
  don't count). For the "What I Ask Myself" series, drop the repeated prefix
  (e.g. `sidebar_label: "Finding Purpose"`). Required mechanism: the blog plugin does NOT
  read `sidebar_label` natively; our `draft-docs` plugin + `BlogSidebar` swizzle do.

**Validation (warn-tier, via `validate-post-outline.js` + its `Write|Edit` hook):**
- `missing-kind` — a blog post with no `kind:`.
- `unknown-kind` — a `kind:` not in `blog-kind-emoji.json`.
- `long-sidebar-label` — the sidebar entry exceeds ~3 content words / ~32 chars (add a short
  `sidebar_label:`).
- per-kind **outline**: e.g. `question-set` needs H2 + `<Question>` + `<SectionBanner>`;
  `framework` needs the framework laid out; `tutorial` needs steps/an artifact;
  `design-story` needs a link to `/designs`; `system-design` needs a `<Mockup>` + Decisions;
  `legend` needs an explainer (a table / `<PowerLegend>` / links).

> **Investigate before you "fix" an outline advisory.** When the hook flags a missing
> element, FIRST ask: is the POST missing structure, or is the `kind:` WRONG for what the
> post actually is? A "legend" that is really an essay, or a "system-design" that is really
> a narrative `design-story`, is fixed by **correcting `kind:`**, not by forcing a mockup or
> a Decisions heading onto it. Track each finding as a task (investigate → decide the ideal
> fix → apply). Most of the initial backfill advisories were mis-classifications, not gaps.

**Reader-facing legend.** The "🧭 Start Here" post (`blog/2026-06-24-a-guide-to-these-posts.mdx`,
`/thoughts/a-guide-to-these-posts`) holds the kind→emoji legend table for readers. When you
add or change a kind, update **all three in lockstep**: `blog-kind-emoji.json`, the validator's
`OUTLINES`, and that legend post (plus this skill). Mirrors the docs emoji system
(`scripts/lib/emoji-map.json` + `suggest-emoji`).

## MDX pitfalls that FAIL the build (learned the hard way)

Docusaurus 3 parses `.md`/`.mdx` as MDX. These break the build during static
generation (often with a cryptic SSR stack), so catch them before deploy:

1. **Bare `<br>` → use `<br/>`.** MDX requires self-closing void tags. A single
   `<br>` in a table cell fails with *"Expected a closing tag for `<br>`"*.
2. **Unescaped `{word}` is treated as a JS expression.** Plain text like
   `{category}` outside backticks throws *"ReferenceError: category is not
   defined"*. Wrap in backticks (`` `{category}` ``) or escape: `\{category\}`.
   Inside inline code spans (backticks) braces are already safe.
3. **Raw `<` / `>` / unclosed JSX** — same class of failure. Prefer fenced code
   blocks for anything HTML/JSX-like that should render literally.
4. **Duplicate routes** — two files resolving to the same path emit a build
   warning and non-deterministic routing; rename one.

## Frontmatter

There are AI-assisted fixers wired into the Makefile:

```bash
make fix-frontmatter   # fix frontmatter issues across the site (AI)
make fix-blog-posts    # fix frontmatter for recently modified posts + placeholders
```

Blog posts support a truncation marker for list previews — add `<!-- truncate -->`
after the intro so paginated lists show a short preview (a warning nags otherwise).

## Premium content (how to MARK it — the mechanics)

> For *whether* a doc should be premium (the editorial policy — depth/originality
> thresholds, lead-magnet intent, teaser selection), see the
> **`manage-premium-content`** skill. This section is only the how-to-mark.

Two gates, depending on whether the content must be **cryptographically withheld** or
just **visually teased**:

**Hard gate — whole doc (`premium: true`):** the content is encrypted at MDX-compile by
`plugins/rehype-premium-encrypt.js`; the plaintext ships in NEITHER the HTML nor the JS
bundle. Anonymous readers see a teaser + lock; signed-in (LinkedIn via Cloudflare Access)
readers get the passphrase from the Worker and decrypt in-browser. Use for content that
must not be readable in the public bundle.

```yaml
---
title: My deep-dive
premium: true
premium_teaser: "One or two sentences shown in clear above the lock."   # optional
description: "…"        # falls back to this for the teaser if premium_teaser is absent
---
```

Rules (warn-validated by `validate-docs-structure.js`):
- `premium` must be a boolean; `premium_teaser` a string.
- **`premium: true` is mutually exclusive with `draft: true`** — drafts are excluded from
  the prod build, so a premium draft would never get encrypted (and would 404).
- Give it a teaser (`premium_teaser` or a real `description`) — the gate needs something to
  show in clear.

**Soft gate — an inline block (`<Premium>`):** wraps a region inside an otherwise-free doc.
Signed-in → rendered; anonymous → blurred sneak-peek + lock pill, click → sign-in modal.
**The children ARE in the bundle** (just blurred) — this is a nudge, NOT cryptographic
withholding. For must-hide content, make the whole doc `premium: true`.

```mdx
import Premium from '@site/src/components/Premium';

<Premium>
This paragraph is blurred until the reader signs in.
</Premium>
```

**Verify premium before deploy:** premium docs require a cache-busted encrypted build +
the blocking V5 gate — use `make build-premium` (NOT a bare `yarn build`); see the
`deploy-site` skill's cache gotcha.

## Validate before deploy

```bash
make check                          # MDX lint
( cd bytesofpurpose-blog && yarn build )   # full build — the real gate
make start                          # local preview at :3000
```

A clean `yarn build` ending in `[SUCCESS] Generated static files` is the signal
it's safe to `deploy-site`.

## Analytics note

New interactive components can emit PostHog events
(`posthog.capture('event name', {...})`). Keep the catalog in
`bytesofpurpose-blog/src/posthog-integration-plan.md` up to date when you add one.
