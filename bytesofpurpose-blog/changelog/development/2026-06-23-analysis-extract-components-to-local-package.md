---
title: 'Analysis: Extracting Reusable Components into a Local Package'
description: 'What it would take to split reusable blog components into a built-before-the-site local package with tests, and how that fits gh-pages. Decision: stay co-located for now.'
status: 'analysis'
inception_date: '2026-06-23'
execution_date: 'deferred'
type: 'documentation'
component: 'shared-ui'
priority: 'low'
---

# Analysis: Extracting Reusable Components into a Local Package

**Question:** what would it take to split the reusable blog components (SvgVariantGrid,
Evidence, BinaryPyramid, DiagramWithFootnotes, Vote, ShareButton, ...) into a separate
local folder/package, with its own tests, that gets installed/built BEFORE the Docusaurus
static site builds, and how would that fit GitHub Pages?

**Decision (now): stay co-located.** This memo records the analysis so the trigger to
revisit is explicit, not forgotten.

{/* truncate */}

## Where we are today (the baseline)

- **33 components** under `src/components/`, each a self-contained dir (`index.tsx` +
  `styles.module.css`), imported by full path `@site/src/components/X`. There is **no
  barrel, no published package, no formal "UI lib"**. The convention is "one folder per
  component, import by path." Shared *non-visual* logic lives in `src/lib/`
  (`binary-pyramid-logo.js`, `auth`, `premium-crypto`).
- **Storybook already exists** (`@storybook/react-webpack5` v8, ~9 `*.stories.tsx`). So
  components already have a partial isolation/preview story, but **no unit tests** on them
  (component tests today are end-to-end via Playwright in `test/e2e/`).
- **There is already a "build a thing before the static build" precedent**, twice over:
  1. `prebuild`/`prestart` run `generate-changelog && generate-ideas &&
     generate-logo-variants`, code generators that emit data modules the site imports.
  2. `make build` and `make deploy` both depend on **`build-storybook`**: a *separate
     build* (`storybook build --output-dir static/storybook`) whose output is a gitignored
     artifact that Docusaurus copies verbatim from `static/`. The deploy recipe documents
     that a fresh clone must regenerate `/storybook/` before the static copy, or the live
     footer link ships with no bundles.

The second precedent matters: **the pipeline already knows how to build an upstream
artifact before the Docusaurus build and ship it through gh-pages.** A component package
would slot into the same shape.

## What extraction would actually require

### 1. Package layout
A local, **unpublished** workspace package, e.g. `packages/blog-ui/`:
- `package.json` with `name: "@bop/blog-ui"`, `main`/`module`/`types` → `dist/`.
- Build with **tsup** (or vite-lib): ESM + d.ts, externalizing `react`/`react-dom` and any
  Docusaurus `@theme`/`@docusaurus/*` imports (several components import these, and they must
  stay peer/externals, not be bundled).
- Consumed by the site via **npm/yarn workspaces** (turn the existing root `package.json`
  into a workspace root listing `bytesofpurpose-blog` + `packages/*`) or a `file:` dep.
- The site keeps importing via an alias so MDX/posts don't churn:
  `@site/src/components/X` → re-export from `@bop/blog-ui`, OR add a webpack alias
  `@blog-ui` and migrate imports gradually.

### 2. Tests (the main *gain*)
- **vitest + @testing-library/react** for unit/interaction tests, co-located in the package
  (`SvgVariantGrid.test.tsx`, `Evidence.test.tsx`, ...). This is what we *can't* easily do
  today: the only component coverage now is whole-page Playwright. Pure components
  (SvgVariantGrid renders raw SVG; Evidence's dev-vs-prod permalink branching) are ideal
  unit targets, e.g. assert Evidence renders a link in dev and prose-only for a private
  repo in prod, without standing up the whole site.
- **a11y** via `jest-axe`/`axe-core` at the component level.
- Migrate the existing Storybook stories into the package (they already document many
  components). Storybook can live in the package and serve as the visual test surface.

### 3. Build ordering (prebuild the package, then build the site)
Mirror the existing generator/storybook pattern:
- Root `prebuild`: `yarn workspace @bop/blog-ui build` **before** `docusaurus build`.
- Locally, workspaces symlink the package, so `dist/` must exist before `start`/`build`,
  add it to `prestart`/`prebuild` exactly like `generate-logo-variants`.
- **Swizzle/alias caveat:** components that import `@theme/*` or use Docusaurus context
  (e.g. `useColorMode`, `@docusaurus/Link`) only resolve inside the Docusaurus webpack
  context. Either keep those as externals (resolved by the host build) or leave the
  most-Docusaurus-coupled components in `src/components/` and extract only the
  **presentation-pure** ones first (SvgVariantGrid, Evidence, BinaryPyramid,
  DiagramWithFootnotes are good candidates; AuthNavbarItem, PremiumGate, DebugMenu are not).

### 4. gh-pages / CI fit
- The gh-pages deploy builds from source via the root `Makefile` (`make deploy` →
  `secret-scan build-storybook build`). Add the package build into that chain (a new
  `build-blog-ui` prerequisite, or fold it into `prebuild`) so the deploy pipeline builds
  `dist/` **before** the static build, the same as `build-storybook` does today.
- The package is **LOCAL** (not published to npm): no registry, no auth, no token. The only
  requirement is that the **workspace resolves on a clean checkout** (a `yarn install` at
  the root links it). CI already does `yarn install`; it just needs the build step ordered
  in.
- **Secret scanning is unaffected**: `make deploy` still runs `secret-scan` and the V5 leak
  gate on the *final* build output; an upstream package build doesn't change what gets
  scanned. (Keep the package's own deps out of any secret path; it's pure presentation.)

## Trade-offs

**Gains**
- Real **component-level tests + a11y** (today there are none; only e2e). This is the single
  biggest reason to do it.
- **Reuse/versioning**: the package could be consumed by a second site or Storybook deploy.
- Cleaner boundary between "the site" and "the design system."

**Costs**
- **Build complexity**: one more build to order, cache, and debug; a `dist/` that can go
  stale locally if a watcher isn't wired.
- **Swizzle/`@theme` friction**: the Docusaurus-coupled components fight extraction; a
  partial extraction leaves components split across two homes (some `@bop/blog-ui`, some
  `src/components/`), which is its own confusion.
- **Slower first build** (package build + site build) and heavier `node_modules` linking.
- For a **single-site, single-author** project, the reuse/versioning gains are largely
  theoretical right now: the cost is paid today, the benefit is hypothetical.

## Recommendation

**Stay co-located for now** (the standing decision). The convention (one folder per
component, `@site` import) is sufficient for a single site, and the highest-value piece,
**component-level tests**, can be captured *without* extraction by adding **vitest +
@testing-library** that import directly from `src/components/`. That delivers ~80% of the
benefit (testability) for ~10% of the cost (no package, no build reorder, no swizzle fight).

**Revisit the full extraction when any of these triggers fire:**
- a **second consumer** appears (a second site, or a standalone Storybook/design-system
  deploy that needs the components as a dependency);
- `src/components/` testing-via-vitest proves valuable enough that isolation/versioning is
  worth formalizing;
- the component count or churn makes the "design system vs site" boundary worth enforcing.

### If/when we pull the trigger: migration sketch
1. Add vitest + RTL to `bytesofpurpose-blog` first; test components in place. (Low-risk,
   high-value; do this regardless of extraction.)
2. Make the root `package.json` a workspace root; scaffold `packages/blog-ui` (tsup, react
   as peer/external, `@docusaurus/*` + `@theme/*` external).
3. Move **presentation-pure** components first (SvgVariantGrid, Evidence,
   DiagramWithFootnotes, BinaryPyramid). Re-export from `src/components/X` so posts/MDX
   imports don't change.
4. Wire `prebuild`/`prestart` + the `make deploy` chain to build `@bop/blog-ui` before the
   site (mirroring `build-storybook`).
5. Move the Storybook stories into the package; keep Playwright e2e as the integration net.
6. Leave Docusaurus-coupled components (`@theme`/context users) in `src/components/` unless
   a clean externalization is proven.
