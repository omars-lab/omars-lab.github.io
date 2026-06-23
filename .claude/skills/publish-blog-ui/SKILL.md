---
name: publish-blog-ui
description: Cut a release of the @omars-lab/blog-ui component package and publish it to GitHub Packages. Covers the exact release flow (bump version → tag blog-ui-vX.Y.Z → push → the publish-blog-ui.yml GitHub Actions workflow builds + npm-publishes), the tag pattern the workflow matches, semver guidance, how to verify the publish, and how a CONSUMER repo installs it (.npmrc scope + token + the style.css import). Use when releasing a new blog-ui version, setting up another repo to consume it, or debugging a failed publish. Pairs with upgrade-post + author-walkthrough (which document the components themselves).
---

# Publish / release @omars-lab/blog-ui

`@omars-lab/blog-ui` (source in `packages/blog-ui/`) is the reusable React component package
(Walkthrough, Mockup, DiagramWithFootnotes, Assumption) consumed by the blog and by other
repos. It publishes to **GitHub Packages** (npm registry `https://npm.pkg.github.com`), driven
by the `.github/workflows/publish-blog-ui.yml` workflow on a version tag.

## Release flow (the happy path)

1. **Simulate the publish locally first** — this is the dress rehearsal; it builds and shows
   the EXACT tarball that would ship to GitHub Packages, but uploads nothing:
   ```bash
   ( cd packages/blog-ui && yarn simulate-publish )   # = yarn build && npm publish --dry-run
   ```
   Read the `npm notice` block: confirm `dist/index.js` + `dist/index.css` + `dist/index.d.ts`
   are present, the version is what you expect, and **no `.map` files** are in the tarball
   (sourcemaps are off in `tsup.config.ts` — `sourcemap: false` — so consumers don't carry
   dead weight; if you see `.map` files, the build config regressed). Expect ~5 files, ~10 kB.
   A `repository.url was normalized` notice means `package.json` needs `git+https://…` (already
   set); a `No license field` warning refers to the repo-ROOT package.json, not this one — ignore.
2. **Bump the version** in `packages/blog-ui/package.json` (semver — see below). Commit it.
3. **Tag with the EXACT pattern the workflow matches: `blog-ui-v<version>`** and push:
   ```bash
   git tag blog-ui-v0.2.0
   git push origin blog-ui-v0.2.0
   ```
   The tag prefix MUST be `blog-ui-v` (the workflow's trigger is `tags: ['blog-ui-v*']`). A
   plain `v0.2.0` will NOT trigger it. The version in the tag should match `package.json`.
4. **The workflow** (`publish-blog-ui.yml`) checks out, `yarn install --frozen-lockfile`,
   `yarn build`, verifies `dist/` artifacts exist, then `npm publish`es to GitHub Packages using
   the repo's `GITHUB_TOKEN` (no manual creds). It runs from `packages/blog-ui`. (`npm publish`
   also runs `prepublishOnly` → `yarn build`, so the tarball can never ship a stale `dist`.)
5. **Verify:** the repo's **Packages** tab (github.com/omars-lab/omars-lab.github.io → Packages)
   shows the new version, or `npm view @omars-lab/blog-ui version --registry=https://npm.pkg.github.com`.

### Manual publish (if you can't / don't want to push a tag)

The workflow is the normal path, but you can publish from your machine:
```bash
cd packages/blog-ui
# auth: a PAT with write:packages, in ~/.npmrc or the env as NODE_AUTH_TOKEN
echo "//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}" >> ~/.npmrc   # if not already
yarn simulate-publish   # dress-rehearse first
npm publish             # prepublishOnly rebuilds; publishConfig points at GitHub Packages
```
Same result as the tag-triggered workflow; the version still can't be republished once taken.

## Semver

- **patch** (0.1.0 → 0.1.1): bug/style fix, no API change.
- **minor** (0.1.0 → 0.2.0): new component or new prop, backward-compatible.
- **major** (0.x → 1.0 / breaking): a removed/renamed prop or component, or a CSS class
  rename that breaks consumers' overrides. Note: the blog consumes via `file:../packages/blog-ui`
  (always the working tree), so a breaking change shows up in the blog's build immediately —
  fix both together.

## Consumer setup (another repo installs it)

GitHub Packages requires auth even for read. In the consuming repo:

1. **`.npmrc`** (scope the org to GitHub Packages):
   ```
   @omars-lab:registry=https://npm.pkg.github.com
   //npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
   ```
   (`GITHUB_TOKEN` = a PAT with `read:packages`, in the env; in CI use the Actions token.)
2. **Install + use:**
   ```bash
   yarn add @omars-lab/blog-ui
   ```
   ```jsx
   import {Walkthrough, Mockup} from '@omars-lab/blog-ui';
   import '@omars-lab/blog-ui/style.css'; // once, app-level
   ```
   `react`/`react-dom` are peerDeps (the consumer provides them, >=18).

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Pushed a tag, workflow didn't run | tag didn't match `blog-ui-v*` (e.g. `v0.2.0`) | re-tag as `blog-ui-v0.2.0`; delete the wrong tag. |
| Publish fails 403 / permission | the job lacks `packages: write`, or version already published | the workflow sets `permissions: packages: write`; bump the version (can't republish the same one). |
| Consumer `yarn add` 401/404 | missing/old `.npmrc` scope or token lacks `read:packages` | add the `.npmrc` above; use a PAT with `read:packages`. |
| Styles missing in the consumer | forgot the css import | `import '@omars-lab/blog-ui/style.css'` once at app level. |
| Built `dist/` got committed | it's a build artifact | it's gitignored (`packages/*/dist/`); the workflow rebuilds it. |

## Files

- `packages/blog-ui/package.json` — name/version/exports/publishConfig (GitHub Packages).
- `packages/blog-ui/tsup.config.ts` — the ESM + d.ts + bundled-CSS build.
- `.github/workflows/publish-blog-ui.yml` — the publish-on-tag workflow.
- `packages/blog-ui/README.md` — consumer install/usage.

## Learnings log (newest first)

- 2026-06-23 — **Third publish: `@omars-lab/blog-ui@0.3.0` is LIVE** (the `<Gif>` component, a
  backward-compatible minor). Same merge-first flow, no surprises now that the pipeline is
  proven: merge the bump PR → tag `blog-ui-v0.3.0` from master → workflow green → versions API
  shows 0.1.0 / 0.2.0 / 0.3.0. The cadence is reliable; new components ship as minors.
- 2026-06-23 — Created with the package. Tag pattern is `blog-ui-v*` (not plain `v*`, since the
  monorepo may host other packages later). Blog consumes via `file:` so local changes are live;
  publishing is only for OTHER repos. GitHub Packages needs auth even to read.
- 2026-06-23 — **First publish: `@omars-lab/blog-ui@0.1.0` is LIVE** in GitHub Packages.
  Lesson on ordering: a tag-triggered workflow only fires reliably when the workflow YAML is on
  the **default branch** — so MERGE the PR that adds `publish-blog-ui.yml` to `master` FIRST,
  then tag from master. (Tagging the feature branch may not trigger anything.) Sequence that
  worked: squash-merge → `git checkout master && git pull --ff-only` → `git tag -a blog-ui-v0.1.0`
  → `git push origin blog-ui-v0.1.0` → workflow ran all green → confirm with
  `gh api /users/omars-lab/packages/npm/blog-ui/versions` (omars-lab is a USER, not an org, so
  the `/users/…` endpoint, not `/orgs/…`). Runner annotated a harmless Node-20-deprecation notice.
- 2026-06-23 — Added `yarn simulate-publish` (= build + `npm publish --dry-run`) as the
  repeatable rehearsal target, and `prepublishOnly` (rebuild-before-publish guard). Turned
  `sourcemap` OFF in tsup — the first dry-run tarball shipped 65 kB of `.map` files for no
  consumer benefit; now ~10 kB / 5 files. The `file:` dep is cached by integrity hash, so after
  rebuilding the package the blog DOESN'T pick up the new `dist` from a plain `yarn install`
  ("Already up-to-date") — force it with `rm -rf node_modules/{.yarn-integrity,@omars-lab} &&
  yarn install --check-files`. Verified the prod blog build is green against the cleaned package.
- 2026-06-23 — **Second publish: `@omars-lab/blog-ui@0.2.0` is LIVE** (Walkthrough
  `customScenes[]` + scene `index`, a backward-compatible minor). The merge-first flow worked
  cleanly again: merge the version-bump PR to master → tag `blog-ui-v0.2.0` from master →
  workflow green → the versions API shows 0.1.0 + 0.2.0. Consumer caret gotcha: `^0.1.0` does
  NOT allow 0.2.0 (caret on a `0.x` version pins the MINOR: `>=0.1.0 <0.2.0`), so a consumer on
  `^0.1.0` stays on 0.1.0 until you bump its range to `^0.2.0` and reinstall. The blog (consumes
  via `file:`) is always on the working tree, so no bump; getting-started-with-claude-agents
  stays on `^0.1.0` deliberately (it doesn't use `customScenes`, so 0.1.0 is fine — bump only
  when it needs the new API).
