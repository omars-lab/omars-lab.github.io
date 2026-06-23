# @omars-lab/blog-ui

Reusable React components for design/blog posts, extracted from
[bytesofpurpose blog](https://blog.bytesofpurpose.com):

- **`Walkthrough`** — a scripted, animated UX demo over live HTML: an animated cursor that
  drag-selects text, types a comment, clicks a control, and crossfades to a Claude Code
  terminal scene (or any custom scene), with a step timeline. 
- **`Mockup`** — a framed, theme-aware wrapper (browser / window / phone chrome) that turns
  live HTML into a UI mockup.
- **`DiagramWithFootnotes`** — a diagram + a generated numbered legend (①②③) tied to notes.
- **`Assumption`** — an amber inline highlight for "[Assumption: …]" markers to flag for review.

## Install

GitHub Packages requires auth. Add an `.npmrc` to the consuming repo:

```
@omars-lab:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

(`GITHUB_TOKEN` = a personal access token with `read:packages`.) Then:

```bash
yarn add @omars-lab/blog-ui
```

`react` and `react-dom` (>=18) are peer dependencies.

## Use

```jsx
import {Mockup, Walkthrough} from '@omars-lab/blog-ui';
import '@omars-lab/blog-ui/style.css'; // once, at app level

<Mockup chrome="browser" title="Review Studio" url="review.studio/doc/hld">
  <div>…live HTML…</div>
</Mockup>
```

See the component prop types (shipped `.d.ts`) for the full API. The blog's
`upgrade-post` and `author-walkthrough` skills document usage patterns.

## Develop / release

```bash
yarn install
yarn build          # → dist/ (ESM + index.css + index.d.ts)
```

Release: bump `version`, tag `blog-ui-v<version>`, push — the
`.github/workflows/publish-blog-ui.yml` workflow publishes to GitHub Packages. See the
`publish-blog-ui` skill for the full flow.
