# Plan: a "deprecated" post mechanism, parallel to "draft"

## Context

Some posts/docs should stay live but be clearly marked as **deprecated** — kept for
history/URL-stability, but a reader landing on one (e.g.
`/handbook/components/diagrams/diagrams-mindnode`) should see it's outdated. Today the
repo has a **draft** mechanism (`draft: true` frontmatter → a dev-only "D" pill in the
sidebar + beside the post title, and native Docusaurus exclusion from prod). There is
**no** "deprecated" concept and **no** real top-of-page banner anywhere — the draft
signal is only a small badge.

This adds a `deprecated: true` frontmatter flag that mirrors `draft:` as closely as
possible: the **same "D"-style sidebar/title pill (rendered red, "Dep") gated dev-only
like the draft badge**, PLUS a **red top-of-page banner** stating the deprecation reason
(and an optional replacement link). Deprecated posts, unlike drafts, are **NOT excluded
from the build** — they still ship — but per the decisions below the *visual signals*
(badge + banner) are **dev/localhost-only**, exactly like the draft badge, so nothing
leaks to real readers yet. It gets its own validator + hook, and the redirect gate learns
about it.

Decisions locked with the user:
- **Visibility:** dev-only, gated on `isLocalhost()` + non-prod (mirrors the draft badge, NOT the prod-visible premium LockBadge).
- **Banner scope:** BOTH docs and blog posts.
- **Frontmatter:** flat fields — `deprecated: true` + `deprecated_reason: '...'` (+ optional `deprecated_for: /new/url`).
- **Validation:** warn-only hook (nudge when `deprecated: true` lacks a reason) + extend the redirect/link guards so a redirect/link **to** a deprecated page is flagged.

The design mirror is exact: everywhere the code does `data.draft === true` /
`frontMatter.draft === true` / a `draftPermalinks` set / a `DraftBadge`, we add a
`deprecated` sibling right next to it.

---

## The five layers (each mirrors an existing draft touchpoint)

### 1. Plugin: publish the deprecated permalink set + reasons
**File:** `bytesofpurpose-blog/plugins/draft-docs/index.js`

- Add `const deprecatedPermalinks = new Set();` and `const deprecatedInfo = {};` alongside `draftPermalinks`/`blogDraftPermalinks` (the docs `deprecatedInfo` is keyed permalink → `{reason, replacement}` so the banner can read it via global data; the badge only needs the set).
- In the docs `walk()` (next to `if (data.draft === true)` at ~line 105) add:
  ```js
  if (data.deprecated === true) {
    const p = toPermalink(full, docsDir, data);
    deprecatedPermalinks.add(p);
    deprecatedInfo[p] = {reason: data.deprecated_reason || '', replacement: data.deprecated_for || ''};
  }
  ```
- In the blog-instance loop (next to `if (data.draft === true)` at ~line 145) add the same for `blogDeprecatedPermalinks`/`blogDeprecatedInfo` using `permalink` (already computed via `toBlogPermalink`).
- Add all four to the returned global-data object (~line 182): `deprecatedPermalinks`, `blogDeprecatedPermalinks`, `deprecatedInfo`, `blogDeprecatedInfo`.
- Update the header docblock to mention the deprecated sets (note: unlike drafts, deprecated posts are NOT excluded from prod; the badge is dev-gated by choice).

> The banner on the **doc page** and **blog post page** actually reads frontmatter
> directly (`useDoc()` / `useBlogPost()`), so `deprecatedInfo`/`blogDeprecatedInfo` are a
> convenience only — the sidebar set is the part that genuinely needs the plugin (sidebar
> items have no frontmatter). Keep the reason on the frontmatter as the source of truth;
> the banner reads it locally.

### 2. Badge module (new), mirroring `draftBadge.tsx`
**New files:**
- `bytesofpurpose-blog/src/theme/DocSidebarItem/deprecatedBadge.tsx`
- `bytesofpurpose-blog/src/theme/DocSidebarItem/deprecatedBadge.module.css`

Copy `draftBadge.tsx` exactly, renaming: `useDeprecatedPermalinks`/`useBlogDeprecatedPermalinks`, exported `useIsDeprecated(href)` + `useIsBlogDeprecated(permalink)` (same `NODE_ENV==='production'` → false and `isLocalhost()` gating as draft), and `DeprecatedBadge()` rendering a red pill:
```tsx
<span className={styles.deprecatedBadge} title="Deprecated" aria-label="deprecated">Dep</span>
```
CSS copies `draftBadge.module.css` with a **red** palette instead of amber (e.g. light `color:#991b1b; background:#fecaca; border-color:#ef4444;` + a dark-mode block). This is authored CSS → the `validate-ds-tokens` hook will run; use plain hexes (badges aren't in its literal→token map, so it stays quiet — verify).

### 3. On-page red banner (new component) + wired into both content swizzles
**New files:**
- `bytesofpurpose-blog/src/components/DeprecatedBanner/index.tsx`
- `bytesofpurpose-blog/src/components/DeprecatedBanner/styles.module.css`

Component (models `PostQuestions`): takes `{deprecated?, reason?, replacement?}`, returns `null` when not deprecated **or** not dev/localhost (import `isLocalhost` from `@site/src/experiments`, guard `process.env.NODE_ENV==='production'`), else renders a red callout:
```tsx
<aside className={styles.banner} role="note" aria-label="Deprecated">
  <p className={styles.title}>⚠️ Deprecated</p>
  {reason && <p className={styles.reason}>{reason}</p>}
  {replacement && <p><a href={replacement}>See the current version →</a></p>}
</aside>
```
CSS models `PostQuestions/styles.module.css` but red: `border-left: 3px solid` a red token, a light-red wash background, `--tea-ink`-style dark ink; add a `data-theme='dark'` variant. Reuse design-system spacing/radius tokens (`--space-*`, `--radius-md`) so contrast passes.

Wire it in:
- **Docs** — `src/theme/DocItem/Content/index.tsx`: read `frontMatter.deprecated/deprecated_reason/deprecated_for` from `useDoc()` (already destructures `frontMatter`), render `<DeprecatedBanner .../>` at the very top of the returned markdown `<div>` (above the share row).
- **Blog** — `src/theme/BlogPostItem/Content/index.tsx`: read the same from `useBlogPost().frontMatter`, render the banner above `<PostQuestions>` and only when `isBlogPostPage` (so list cards don't show it).

### 4. Badge render sites (append next to every existing draft badge)
Same three files that render `DraftBadge`, add the deprecated sibling:
- `src/theme/DocSidebarItem/Link/index.tsx`: `const isDeprecated = useIsDeprecated(href);` + `{isDeprecated && <DeprecatedBadge/>}` after `{isDraft && <DraftBadge/>}`.
- `src/theme/BlogSidebar/Desktop/index.tsx` and `.../Mobile/index.tsx`: `useIsBlogDeprecated(item.permalink)` + `{isDeprecated && <DeprecatedBadge/>}` next to the draft badge.
- `src/theme/BlogPostItem/Header/Title/index.tsx`: add `useIsDeprecatedPost(frontMatter)` (mirrors `useIsDraftPost`, reads `frontMatter.deprecated`, same dev gate) and render `<DeprecatedBadge/>` beside the title next to the draft badge.

### 5. Validator + hook + Makefile + settings.json (mirrors validate-draft + validate-redirects)

**New validator:** `bytesofpurpose-blog/scripts/validate-deprecated.js`
- `#!/usr/bin/env node`, `require('fs'|'path'|'gray-matter')`, `ROOT = path.join(__dirname,'..')`, `Usage:`/`Exit:` docblock.
- Scan the canonical content roots (reuse the `walk()` + `safeMatter()` shape from `validate-hubs.js`/`validate-redirects.js`): the five `docs/*` instances + blog instances `blog, designs, thoughts, mindset, questions`.
- **WARN** (exit 0, but print a grep-able marker) when a file has `deprecated: true` but no non-empty `deprecated_reason`. Optional warn: `deprecated_for` points at a URL that doesn't resolve to a published page.
- Exit 0 always (warn-tier); reserve exit 2 for a future hard rule if wanted.

**New hook:** `.claude/hooks/validate-deprecated-hook.sh` (copy `validate-idea-tags-hook.sh` warn idiom; `chmod +x`)
- Scope gate `case "$file_path"` to `*.md|*.mdx` under any `bytesofpurpose-blog/docs/*` or blog dir; resolve `proj`; run `node scripts/validate-deprecated.js`; grep output for the missing-reason marker; print to stderr; `exit 0`.

**Makefile:** add near the other `validate-*` targets:
```makefile
validate-deprecated: ## Check every deprecated:true post/doc has a deprecated_reason (warn-only)
	( cd ${SITEROOT} && node scripts/validate-deprecated.js )
```
(optionally add to `.PHONY`).

**settings.json:** append one object to the `Write|Edit` PostToolUse `hooks` array:
```json
{ "type": "command", "command": "\"$CLAUDE_PROJECT_DIR/.claude/hooks/validate-deprecated-hook.sh\"", "timeout": 20 }
```

**Redirect + link guards (extend existing):**
- `bytesofpurpose-blog/scripts/validate-redirects.js`: it already splits `published`/`draft` sets via `data.draft === true ? draft : published`. Add a `deprecated` set (a page can be both published-and-deprecated, so add its URL to `deprecated` **in addition** — don't move it out of `published`). Add a **warn-tier** `to-deprecated` finding: a redirect `to:` a deprecated page still resolves (it ships), so warn, don't error — "redirect points at a DEPRECATED page; consider pointing at its replacement." (Do NOT make it exit-2 — deprecated pages are live, so it's not a build-breaker.)
- `bytesofpurpose-blog/scripts/validate-links.js`: it records `{rel, draft}` per route and warns on `link-to-draft`. Add a `deprecated` flag to the slug index and a warn-tier `link-to-deprecated` finding (a published page linking to a deprecated one). Mirror the existing `link-to-draft` code path.

---

## Files touched (summary)

New (4): `deprecatedBadge.tsx` + `.module.css`, `DeprecatedBanner/index.tsx` + `styles.module.css`, `scripts/validate-deprecated.js`, `.claude/hooks/validate-deprecated-hook.sh`.
Edited (~9): `plugins/draft-docs/index.js`; `DocSidebarItem/Link/index.tsx`; `BlogSidebar/{Desktop,Mobile}/index.tsx`; `BlogPostItem/Header/Title/index.tsx`; `DocItem/Content/index.tsx`; `BlogPostItem/Content/index.tsx`; `scripts/validate-redirects.js`; `scripts/validate-links.js`; root `Makefile`; `.claude/settings.json`.

Reused utilities (don't reinvent): `isLocalhost()` (`@site/src/experiments`), `useDoc()`/`useBlogPost()` for frontmatter, `useAllPluginInstancesData('draft-docs-plugin')` for the sets, the `walk()`/`safeMatter()` validator helpers, `gray-matter` for frontmatter parse. The whole thing is a rename-clone of the draft path — no new architecture.

---

## Verification (end-to-end, prove it — don't assert it)

1. **Pick a live test target.** The example `docs/handbook/components/diagrams/diagrams-mindnode.mdx` is currently `draft: true` (so it's excluded from prod and won't show a banner in a built site). For a real deprecated-but-live proof, flip a **published** doc to add `deprecated: true` + `deprecated_reason: 'MindNode embeds superseded by the new diagram kit.'` + `deprecated_for: /handbook/components/...` temporarily (revert after), OR set the mindnode doc `draft: false, deprecated: true` for the dev test.
2. **Dev server** (`make start`, :3000 — restart if the route table is stale): navigate to the deprecated page. Confirm (a) the **red "Dep" pill** in the left sidebar next to that doc, and (b) the **red banner** with the reason at the top of the page. For a blog post target, confirm the pill on the sidebar list card + beside the title, and the banner on the full post page (not on list cards).
3. **Dev-only gate:** `make build && make serve` (prod build, :4173) — confirm the pill and banner do **NOT** appear (dev-only, like drafts). This proves the `isLocalhost()`/`NODE_ENV` gate.
4. **Validator:** `make validate-deprecated` on a `deprecated: true` file with no `deprecated_reason` → prints the warn marker; with a reason → clean. Trigger the hook by editing such a file and confirm the stderr nudge (warn, non-blocking).
5. **Redirect/link guards:** add a temporary redirect `to:` the deprecated page → `make validate-redirects` emits the warn `to-deprecated` (not an error/exit-2). A published page linking to the deprecated one → `make validate-links` emits `link-to-deprecated`. Revert temporaries.
6. **Visual + mobile pass** (per repo convention for a new interactive component): view the banner at 375px + desktop, light + dark — no horizontal overflow, ≥16px text, banner readable, contrast AA (`make check-contrast` still passes since the banner reuses tokens; verify the red hexes if any land in the contrast PAIRS).
7. Revert any temporary frontmatter/redirect/link test edits so the tree is clean.
