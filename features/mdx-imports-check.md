# Used-but-not-imported MDX check

## Why

MDX lets a post use a component as a JSX tag. If that tag is neither imported in the file
nor globally registered, MDX renders it as a literal (or throws at eval): a broken page. The
trap is that our production build **excludes drafts**, so a broken draft using `<FlowDiagram>`
without importing it sails past `docusaurus build`, every content validator, and the em-dash
and link hooks. It only breaks when someone finally opens that page, which for a draft may be
long after the mistake was made.

`validate-mdx-imports.js` closes that specific blind spot. For every `.md`/`.mdx` it extracts
each Capitalized JSX tag and confirms it resolves one of four ways: it is globally registered
in `MDXComponents.tsx` (the validator loads that file's default export as the allowlist), it
is imported in the file, it is defined locally, or it is a known Docusaurus/MDX built-in.
Anything else is an ERROR, and the check blocks (it is a real render break, not a matter of
taste). Code fences and inline-code spans are stripped first, so an example `<Tag>` never
false-positives.

The subtlety that makes this ours rather than a copy of the original: most of our components
are auto-injected via `MDXComponents.tsx` and need NO import, so a naive "every tag must be
imported" rule would flag almost every post. The allowlist-from-the-registry is what lets the
check be strict without being wrong.

## Code

- https://github.com/omars-lab/omars-lab.github.io/blob/b4ca9f734f4c018b728776ef25c857ba109a96ee/bytesofpurpose-blog/scripts/validate-mdx-imports.js#L173-L180 - the four-way resolution: a tag is OK if registered, imported, locally defined, or a built-in

## Notes

The check is validated to have ZERO false positives across the whole corpus (the calibration
bar: the corpus already builds, so a correct validator flags nothing), and to bite on a
planted violation. It runs both as a blocking `make validate-mdx-imports` gate and as a
PostToolUse hook. It pairs with the diagram components, whose whole value is that authors
reach for them by tag: this makes forgetting the wiring a caught error instead of a silent one.
