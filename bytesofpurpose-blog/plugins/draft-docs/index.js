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
 * prefixes. Permalinks are prefixed with the doc's INSTANCE base ('/craft' or
 * '/self') — the first path segment under docs/, which is that instance's routeBasePath.
 */
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
  // Docs are TWO separate instances: docs/craft/* serves under routeBasePath /craft,
  // docs/self/* under /self (there is no /docs route). The first path segment under
  // docs/ IS the instance == its routeBasePath. A doc's permalink is
  //   /<instance> + <slug>           when slug is instance-relative (leading-slash), or
  //   /<instance>/<dir...>/<slug>    when slug renames just the last segment, or
  //   /<instance>/<dir...>           for an index file with no slug.
  // e.g. docs/self/personal-growth/habits-reading.mdx (slug /personal-growth/habits-reading)
  //        -> /self/personal-growth/habits-reading
  //      docs/craft/README.mdx (slug /)  -> /craft
  const rel = path.relative(docsDir, fullPath).replace(/\.mdx?$/, '');
  const segs = rel.split(path.sep).map(stripPrefix);

  const instance = segs[0]; // 'craft' | 'self' — the routeBasePath
  const base = `/${instance}`;
  const bodySegs = segs.slice(1); // path within the instance

  const fileSeg = bodySegs.pop(); // filename segment (or README/index); may be undefined
  const isIndex = fileSeg === undefined || /^(readme|index)$/i.test(fileSeg);

  if (data.slug) {
    // Instance-relative leading-slash slug replaces the whole within-instance path.
    const slug = String(data.slug);
    if (slug.startsWith('/')) {
      return slug === '/' ? base : `${base}${slug}`;
    }
    return [base, ...bodySegs, slug].join('/');
  }

  if (isIndex) return [base, ...bodySegs].join('/') || base;
  return [base, ...bodySegs, fileSeg].join('/');
}
