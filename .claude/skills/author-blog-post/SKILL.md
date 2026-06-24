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
