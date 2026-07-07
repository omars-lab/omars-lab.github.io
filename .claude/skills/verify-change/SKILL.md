---
name: verify-change
description: Decide HOW to verify a change to the Bytes of Purpose site and WHICH checks are runnable in your current environment. Two axes — (1) what did you change? (content/frontmatter, CSS, a component, redirects, the hero, a generator, a deploy) maps to the checks that matter; (2) where are you running? (a local Mac with everything installed, a constrained cloud container like Claude Code on the web, or CI) maps to what actually works. Catalogs the testing methods fastest-to-heaviest (grep-level, standalone validators, MDX-compile, generate-assets/typecheck, dev-server + Playwright render, prod build + e2e/visual, deploy verify) and the env-specific gotchas proven the hard way (the canvas native build fails in cloud containers, yarn workspaces are disabled so blog-ui's dist needs its own install, a stale webpack cache after a late dist build, draft posts only render on :3000). Use when asked "how do I test this?", "did this actually render?", "what should I run before committing?", or when a build/validator fails in a weird environment. Pairs with test/e2e/README.md (the Playwright deep-dive), serve-locally, modify-blog-ui-component (the build-blog-ui loop), validate-deployment + verify-prod-deployment (the deploy layer).
---

# Verify a change (which checks, in which environment)

Verification here answers two questions at once. **What did you change?** decides which checks
MATTER. **Where are you running?** decides which checks are RUNNABLE. This skill maps both, and
records the env-specific walls proven by actually driving the full path in a cloud container.

## The methods, fastest to heaviest

| Tier | Method | Command | Needs | Proves |
|---|---|---|---|---|
| T0 | **Grep-level** | `grep -c $'—' <file>`; the MDX-hazard scan (bare `<`/`{` in prose) | nothing | no em-dash / no obvious MDX-breaker |
| T1 | **Standalone validators** | `make validate-* / check-*` (or `node scripts/<v>.js`) | node + a tiny dep (`gray-matter`) | outline, seo, links, structure, naming, hubs, idea-tags, ds-tokens, contrast, em-dash |
| T2 | **MDX compile** | `make check` (`npx docusaurus-mdx-checker -c <dir>`) | site `node_modules` (NOT canvas, NOT a build) | every `.md/.mdx` COMPILES (frontmatter, JSX, imports, mermaid fences) |
| T3 | **Generators + types** | `npm run generate-assets`; `yarn typecheck` | site `node_modules` | generated JSON builds; TS type-checks |
| T4 | **Dev-server render** | `make start` (:3000) + Playwright screenshot | full install + built `blog-ui` dist + Chromium | mermaid draws to SVG, mockups/walkthroughs/client components RENDER (draft posts show here) |
| T5 | **Prod build + e2e** | `make build`; `make test-regression` (3 projects), `test-prod-checks`, `test-visual`; `yarn test` (jest unit) | full install + a working build | build-only transforms, a11y/SEO, PostHog, visual baselines, unit logic |
| T6 | **Deploy verify** | `make validate-deployment`; `node scripts/verify-prod-deployment.mjs` | the LIVE site | the deployed bundle serves + renders (CDN-propagated) |

**Rule of thumb:** run the CHEAPEST tier that can actually catch your change's failure mode. A
content edit is usually fully covered by T0+T1+T2. A new client component is only truly proven at
T4 (it can compile at T2 and still render blank). See the CLAUDE.md "visual + mobile pass"
convention: a new interactive component is not done until it has been LOOKED AT (T4).

## Axis 1 — what changed → which checks matter

| You changed… | Run |
|---|---|
| **Prose / frontmatter** (`docs`/`blog`/`designs`/`changelog` `.md`/`.mdx`) | T0 em-dash + MDX-hazard; T1 `validate-post-outline` (design/kind outline), `validate-seo`, `validate-links`, `validate-naming` (thoughts), `validate-idea-tags` (board post), `validate-hubs` (hub/area), `validate-structure` (docs IA); T2 `make check` |
| **A post with components / mermaid / mockups** | the above **+ T4** (only a browser proves mermaid/mockups/walkthroughs render) |
| **`docusaurus.config.js` redirects** | `validate-redirects` (needs the FULL install — it imports the config → prism themes); after a MOVE, repoint + collapse chains |
| **CSS (`src/css/custom.css`)** | `check-contrast`, `validate-ds-tokens`; if it touches the hero, `test-visual` |
| **A `@omars-lab/blog-ui` or `src/` component** | `make build-blog-ui` (rebuild dist + relink), `yarn typecheck`, `yarn test` (jest), T4 render, the mobile/desktop audit (`audit-mobile-experience`) |
| **The homepage hero** (`index.tsx`/`index.module.css`/`SplitFlap`) | `validate-hero-anchors`, `test-visual`; if you changed a SCROLL/GESTURE behavior, audit test realism (`audit-test-realism`) — a uniform `scrollTo` test can pass while a real inertial flick breaks (the pickets teleport class) |
| **A generator or generated data** | `npm run generate-assets`, then validate the consumer (the block-generated-edits hook forbids editing the output directly) |
| **A URL query param** | `validate-url-params` |
| **A hero card PNG / arch asset** | `validate-arch-assets` |
| **Anything, before deploy** | `make build` then `validate-seo-built` + `verify-premium`; after deploy, T6 |

## Axis 2 — where you're running → what's runnable

### Local Mac (the author's machine)
Everything works: `make start`/`serve`/`build`/`test-regression`/`test-visual`, the LOCAL-ONLY
validators (`validate-noteplan-links` resolves real notes; off-machine it is syntax-only), and
deploy. **Visual-regression baselines are DPR/OS-specific — only trust `test-visual` here.**

### Constrained cloud container (Claude Code on the web / this remote env)
Proven behaviour, do not relearn it the hard way:

- **No `node_modules` by default.** A full `yarn install` mostly succeeds but **exits non-zero on
  the `canvas` native module** (node-pre-gyp 404 for the prebuilt binary, then the gyp source
  build fails — no cairo/build toolchain). This does **not** block the JS site build; `canvas` is
  transitive/optional. Treat that one error as expected.
- **Yarn workspaces are DISABLED** here ("Workspaces can only be enabled in private projects"), so
  `packages/blog-ui`'s devDeps (tsup) are NOT installed from the site tree → `make build-blog-ui`
  fails at `tsup: not found`. Fix: `cd packages/blog-ui && yarn install` FIRST, then build. Its
  relink step re-trips `canvas`, but the **tsup `dist/` is already built** by then (index.js /
  index.css / index.d.ts), which is what the site imports.
- **Stale webpack cache** bites if `blog-ui/dist` is built AFTER the dev server first compiled: the
  server caches the `Module not found: @omars-lab/blog-ui` failure. Fix: `rm -rf node_modules/.cache
  .docusaurus` and restart. Then it compiles clean.
- **Chromium is pre-installed** at `/opt/pw-browsers/chromium-*/chrome-linux/chrome` (do NOT
  `playwright install`). Playwright's node entry is CommonJS: `import pkg from
  'playwright-core'; const { chromium } = pkg;`.
- **External network is proxied** — a rendered page logs `ERR_CONNECTION_RESET` / `403` for
  external fonts/analytics. Benign; not a page bug.
- **Fast lane WITHOUT a full install** (covers most content changes in seconds): T0 greps + T1
  validators + T2 MDX-compile. To run a validator without installing the whole tree, drop
  `gray-matter` into a scratch dir and point `NODE_PATH` at it:
  ```bash
  mkdir -p /tmp/vend && ( cd /tmp/vend && npm install gray-matter )
  cd bytesofpurpose-blog && NODE_PATH=/tmp/vend/node_modules node scripts/validate-post-outline.js <file>
  ```
  `make check` (MDX-compile of all files) works once the site `node_modules` exists and needs
  neither canvas nor a build.

### CI (GitHub Actions)
The `validate-*` gates + `yarn test` + (optionally) a headless build. Local-only validators pass
syntax-only. This is the enforcement layer; keep a change green here before asking to merge.

## The full-render recipe in a cloud container (copy-paste)

```bash
cd bytesofpurpose-blog && yarn install --network-timeout 600000          # canvas error is expected/ignorable
( cd ../packages/blog-ui && yarn install ) && make -C .. build-blog-ui   # dist builds; ignore the relink canvas error
rm -rf node_modules/.cache .docusaurus                                    # clear the stale-cache trap
npx docusaurus start --port 3000 --no-open                                # drafts render here; wait for "compiled successfully"
# then screenshot with Playwright (executablePath = /opt/pw-browsers/chromium-*/chrome-linux/chrome)
```
Assert on the page: an `<h1>`, `.mermaid svg` count > 0, the `<Mockup>` frame count, no
`Module not found`/error overlay. (Worked example: this session rendered `design-fleetplane` with
3 mermaid SVGs + 4 mockups + the walkthrough, error overlay 0.)

## Gotchas (proven)

| Symptom | Cause | Fix |
|---|---|---|
| `yarn install` exits 1 but node_modules is full | `canvas` native build failed (no toolchain) | Ignore unless you need canvas features; the JS build is fine. |
| `make build-blog-ui` → `tsup: not found` | workspaces disabled → package devDeps not installed | `cd packages/blog-ui && yarn install` first. |
| Dev server: `Module not found: @omars-lab/blog-ui` even after building dist | stale webpack/docusaurus cache from the pre-build compile | `rm -rf node_modules/.cache .docusaurus`, restart. |
| A draft post 404s in a prod build but renders on :3000 | drafts are dev-only | Verify drafts at T4 (`make start`), not `make build`/T5. |
| `import { chromium }` throws "Named export not found" | playwright-core is CommonJS | `import pkg from 'playwright-core'; const { chromium } = pkg;` |
| A backgrounded `nohup … &` dev server dies when the wrapper exits | the child is in the wrapper's process group | run the server AS the background command (no inner `&`), or `setsid`. |
| `validate-redirects` throws `Cannot find module 'prism-react-renderer'` | it imports `docusaurus.config.js` → prism | needs the full install; it is NOT a fast-lane validator. |

## Cross-links

`test/e2e/README.md` (the Playwright 3-project deep-dive — this skill routes TO it) · `serve-locally`
(run :3000 vs :4173) · `modify-blog-ui-component` (the build-blog-ui + stale-dist loop) ·
`deploy-site` (the build + secret-scan + SEO-built gates) · `validate-deployment` +
`verify-prod-deployment` (T6, the live layer) · `audit-mobile-experience` / `audit-desktop-experience`
(the visual pass a new component owes) · the individual validator owners named in CLAUDE.md.

## Learnings log (newest first)

- 2026-07-04 — Created after empirically driving the whole verification path in a cloud container to
  prove the Fleetplane post renders. Findings that motivated the skill: (a) ~9 validators run with
  only `gray-matter` via `NODE_PATH`; `validate-redirects` alone needs the full install. (b) `make
  check` (docusaurus-mdx-checker) compiled all 260 MDX files with no build and no canvas — the best
  cheap "does it compile" gate. (c) A full render is reachable in-container but only after: yarn
  install (canvas error ignored), `packages/blog-ui` own install + tsup dist build, and a cache
  clear; then Playwright (pre-installed Chromium) confirmed 3 mermaid SVGs + 4 mockups + the
  walkthrough with zero error overlay.
