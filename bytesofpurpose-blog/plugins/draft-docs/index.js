const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

/**
 * Local Docusaurus plugin: collects the permalink of every DRAFT doc
 * (`draft: true` frontmatter) and exposes it as global data so the (dev-only)
 * swizzled sidebar can badge draft entries.
 *
 * Drafts are excluded from PRODUCTION builds entirely, so this map is only
 * meaningful on `yarn start` — the sidebar swizzle additionally gates on
 * localhost + non-prod, so nothing leaks to the deployed site.
 *
 * Consumed via:
 *   useGlobalData()['draft-docs-plugin'].default.draftPermalinks  // string[] — draft doc pages
 *
 * Only individual docs with `draft: true` are tracked — the swizzled sidebar
 * badges the LEAF link. (Category/folder badging was dropped: a fully-draft folder
 * often has no index page, so its sidebar entry has no href to match on, and a
 * folder with any published child still shows in prod — badging it would mislead.)
 *
 * Permalink derivation mirrors Docusaurus for this repo's docs plugin
 * (default routeBasePath 'docs'): explicit `slug:` wins (138/140 drafts have
 * one); else we derive from the path, stripping the conventional `NN-` ordering
 * prefixes. All permalinks are prefixed with the docs base ('/docs').
 */
const DOCS_BASE = '/docs';

module.exports = function draftDocsPlugin(context) {
  const docsDir = path.join(context.siteDir, 'docs');

  return {
    name: 'draft-docs-plugin',

    async loadContent() {
      if (!fs.existsSync(docsDir)) return {draftPermalinks: []};

      const draftPermalinks = new Set();

      const walk = (dir) => {
        for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
          const full = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            walk(full);
            continue;
          }
          if (!/\.mdx?$/.test(entry.name)) continue;

          let data;
          try {
            ({data} = matter(fs.readFileSync(full, 'utf8')));
          } catch {
            continue;
          }
          if (data.draft === true) {
            draftPermalinks.add(toPermalink(full, docsDir, data));
          }
        }
      };

      walk(docsDir);
      return {draftPermalinks: [...draftPermalinks]};
    },

    async contentLoaded({content, actions}) {
      actions.setGlobalData(content);
    },
  };
};

// Strip a leading `NN-` (e.g. "4-development" -> "development") that Docusaurus
// uses for ordering but drops from the URL.
function stripPrefix(seg) {
  return seg.replace(/^\d+-/, '');
}

function toPermalink(fullPath, docsDir, data) {
  // Docs are served under '/docs' (default routeBasePath). Build from the file's
  // DIRECTORY path (prefixes stripped); a `slug:` only renames the LAST segment,
  // it does not replace the whole path. So:
  //   2-definitions/README.md  (slug: definitions) -> /docs/definitions/definitions
  //   4-development/foo.md      (no slug)           -> /docs/development/foo
  const rel = path.relative(docsDir, fullPath).replace(/\.mdx?$/, '');
  const segs = rel.split(path.sep).map(stripPrefix);

  const fileSeg = segs.pop(); // the filename segment (or README/index)
  const isIndex = /^(readme|index)$/i.test(fileSeg);

  if (data.slug) {
    // A leading-slash slug is doc-root-absolute (under the docs base): it
    // replaces the whole trailing path. Otherwise it renames the last segment
    // (for index files, it's appended under the directory).
    const slug = String(data.slug);
    if (slug.startsWith('/')) return `${DOCS_BASE}${slug}`;
    const dirSegs = isIndex ? segs : segs; // dir segments (file already popped)
    return [DOCS_BASE, ...dirSegs, slug].join('/');
  }

  // No slug: index resolves to its directory; otherwise keep the filename.
  if (isIndex) return [DOCS_BASE, ...segs].join('/');
  return [DOCS_BASE, ...segs, fileSeg].join('/');
}
