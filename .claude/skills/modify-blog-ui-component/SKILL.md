---
name: modify-blog-ui-component
description: How the @omars-lab/blog-ui workspace package works and how to add or modify a reusable MDX component end to end. Covers where source lives (packages/blog-ui/src/components/), the file: link model, the tsup ESM+dts+bundled-CSS build, the `make build-blog-ui` rebuild+RELINK loop and the Yarn-1 file: stale-dist cache gotcha (the #1 "my edit did not show up" trap), registering the component in MDXComponents.tsx, the CSS-module + theme-token conventions, the no-em-dash + visual+mobile-pass rules, and when to publish vs just relink. Use when creating or changing a blog-ui component, debugging "my component edit is not rendering", or onboarding to the package. Pairs with publish-blog-ui (release), upgrade-post (the component catalog), serve-locally (run it), and maintain-showcase (the reader-facing reference docs).
---

# Modify a @omars-lab/blog-ui component

The blog's reusable MDX components (Walkthrough, Mockup, DiagramWithFootnotes, Question, the
Quote kit, ...) do NOT live in `bytesofpurpose-blog/src/components/`. They live in a separate
**local workspace package** `@omars-lab/blog-ui` at `packages/blog-ui/`, which the blog
consumes via a `file:` link. This skill is the end-to-end loop for changing one safely.

## The architecture (know this first)

| Piece | Path | Role |
|-------|------|------|
| **Component source** | `packages/blog-ui/src/components/<Name>/index.tsx` (+ `styles.module.css`) | The real source you edit. |
| **Barrel** | `packages/blog-ui/src/index.ts` | Exports each component + its prop types. Add new ones here. |
| **Build config** | `packages/blog-ui/tsup.config.ts` | `tsup` → one ESM entry, `.d.ts`, one bundled `dist/index.css`. react/react-dom external; react-icons `noExternal` (bundled); `sourcemap:false`. |
| **Built output** | `packages/blog-ui/dist/` | Gitignored. Consumed BUILT. NEVER hand-edit. |
| **The `file:` dep** | blog `package.json`: `"@omars-lab/blog-ui": "file:../packages/blog-ui"` | The blog imports the BUILT dist of this. |
| **MDX registration** | `bytesofpurpose-blog/src/theme/MDXComponents.tsx` | Makes a component usable in posts with NO per-post import. |
| **Rebuild + relink** | `make build-blog-ui` (root Makefile) | `yarn build` the package, then re-`yarn add` the `file:` dep so the blog's node_modules copy is fresh. A prerequisite of `make start`/`make build`/`deploy`. |

## The loop (do these in order)

1. **Edit the source** under `packages/blog-ui/src/components/<Name>/`. For a NEW component,
   create the folder + `index.tsx` + `styles.module.css`.

2. **Export it from the barrel** `packages/blog-ui/src/index.ts` (the component AND its prop
   types). Keep a section comment in the house style.

3. **Register it for MDX** in `bytesofpurpose-blog/src/theme/MDXComponents.tsx`: import it from
   `@omars-lab/blog-ui`, add it to the default export map, and add a block comment describing
   it (that file documents every component). The one-time `import '@omars-lab/blog-ui/style.css'`
   is already there, so new component CSS ships automatically once it is in the bundle.

4. **Build the package alone first** to catch type errors fast:
   `(cd packages/blog-ui && yarn build)`. Confirm `dist/index.{js,css,d.ts}` emit and your new
   exports appear in `dist/index.d.ts`.

5. **Rebuild + relink + run**: `make build-blog-ui` then `make start` (:3000, drafts visible).

## THE GOTCHA: stale dist after a rebuild (read this when "my edit did not show up")

Yarn 1 copies a `file:` dependency at install time and often reports **"Already up-to-date"**,
leaving the blog's `node_modules/@omars-lab/blog-ui/dist` STALE even though you just rebuilt the
package. The dev server then serves the OLD component. This is the single most common
"looks-done-but-renders-stale" trap with this package.

**Diagnose:** check the value actually in the linked dist, e.g.
`grep "<your new class or string>" bytesofpurpose-blog/node_modules/@omars-lab/blog-ui/dist/index.css`.
If the new value is in `packages/blog-ui/dist/` but NOT in `bytesofpurpose-blog/node_modules/.../dist/`,
the relink did not copy. If it IS in both but the browser still shows old, the dev server's
webpack cache is stale.

**Fix (fail-safe):**
```bash
make build-blog-ui                                   # rebuild + attempt relink
# if the linked dist is still stale, force the copy:
cp -r packages/blog-ui/dist/. bytesofpurpose-blog/node_modules/@omars-lab/blog-ui/dist/
# then clear the dev server's webpack cache and restart it:
rm -rf bytesofpurpose-blog/node_modules/.cache/webpack
# (kill the running `docusaurus start` and `yarn start --port 3000` again)
```
A long-running dev server also will not pick up the relinked dist on its own (see
`serve-locally`): RESTART it after a `make build-blog-ui`.

## Conventions (match these)

- **CSS modules + theme tokens.** Style with `styles.module.css` next to the component. Use the
  theme variables (`var(--ifm-heading-color)`, `var(--ifm-color-primary)`,
  `var(--ifm-color-emphasis-*)`, `var(--tea-mint, #adfff5)`, ...) so light AND dark themes work
  with zero extra wiring. Avoid hardcoded hex (a documented fallback inside `var(--x, #hex)` is
  fine). If you add a readable fg/bg surface, add its pair to the contrast guard
  (`scripts/check-contrast.js`).
- **No literal em-dashes** in any reader-facing string a component renders. The em-dash hook is
  BLOCKING. (An escaped CSS codepoint like `content: '\2014'` is fine; a literal `—` in JSX
  text is not.)
- **Reduced motion.** Gate any animation behind `@media (prefers-reduced-motion: reduce)` and
  show the static end-state.
- **Visual + mobile pass is non-optional** for any new/changed VISUAL component (CLAUDE.md
  convention): look at it on the live surface at a 375px mobile viewport AND a desktop width:
  tap targets >=44px, no horizontal page overflow, body text >=16px, content reflows (stacks/
  scrolls, not squished), the content is visible without hunting. Fix cheap findings in the same
  change; file deferred ones as GitHub issues (ISSUES.md dedup).
- **MDX child-introspection.** If a component reads its children (e.g. a parent that lays out
  child marker elements like `<PosterQuote>`/`<Beat>` or `<Question>`/`nodeToText`), filter with
  `React.Children.toArray(children).filter(c => React.isValidElement(c) && c.type === Child)` and
  TOLERATE whitespace text nodes (MDX inserts them around blank-line-separated children).
- **Avoid the JSDoc-JSX trap.** A raw JSX-looking comment inside a `/** ... */` doc block can
  break the tsup parse; keep example JSX in the doc text plain (no stray unbalanced braces).

## Publish vs relink (when do I need to release?)

The blog consumes blog-ui via `file:`, so **local edits are LIVE in the blog after a
`make build-blog-ui` relink** — you do NOT need to publish for the blog to see them. Publishing
(version bump + a `blog-ui-v*` tag + the GitHub Actions workflow) is ONLY for OTHER repos that
consume the package from GitHub Packages. That flow is owned by **`publish-blog-ui`** (link to
it; do not duplicate the release steps here). A backward-compatible change (new component, new
optional prop) is a minor bump when you do choose to release.

## Verify

- `(cd packages/blog-ui && yarn build)` clean; new exports in `dist/index.d.ts`.
- `make typecheck` resolves `MDXComponents.tsx` against the new dist `.d.ts` (note: the site has
  a few PRE-EXISTING tsc errors unrelated to blog-ui; confirm your change adds none by diffing
  against master).
- `make start`, look at the component at 375px + desktop, both themes.

## Pairs with

- `publish-blog-ui` (release the package), `upgrade-post` (the per-component catalog readers
  use), `serve-locally` (run the blog + the stale-route gotcha), `maintain-showcase` (the
  reader-facing `/handbook/components/*` reference docs).
