const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

// Blog post-kind -> sidebar emoji, from the single source of truth (scripts/lib/blog-kinds.json,
// where each kind is {emoji, description, outline}). The sidebar label for a blog post is
// prefixed with its kind's emoji so the Posts list is scannable BY TYPE.
let BLOG_KIND_EMOJI = {};
try {
  const kinds = JSON.parse(
    fs.readFileSync(path.join(__dirname, '..', '..', 'scripts', 'lib', 'blog-kinds.json'), 'utf8'),
  ).kinds || {};
  for (const [k, v] of Object.entries(kinds)) BLOG_KIND_EMOJI[k] = v.emoji;
} catch {
  BLOG_KIND_EMOJI = {};
}

/**
 * Local Docusaurus plugin: collects the permalink of every DRAFT doc
 * (`draft: true` frontmatter) and of every PREMIUM doc (`premium: true`), and
 * exposes both as global data so the swizzled sidebar can badge those entries.
 *
 * Drafts are excluded from PRODUCTION builds entirely, so the draft map is only
 * meaningful on `yarn start` — the draft sidebar badge additionally gates on
 * localhost + non-prod, so nothing leaks to the deployed site. PREMIUM docs, by
 * contrast, DO ship to production (their body is encrypted at build time and
 * gated client-side), so the premium map + its lock badge are meaningful in
 * prod too. (V2 of the premium-content-gating design — mirrors the draft path.)
 *
 * Consumed via:
 *   useGlobalData()['draft-docs-plugin'].default.draftPermalinks    // string[] — draft doc pages
 *   useGlobalData()['draft-docs-plugin'].default.premiumPermalinks  // string[] — premium doc pages
 *   useGlobalData()['draft-docs-plugin'].default.blogSidebarLabels  // {permalink: shortLabel} — blog posts with sidebar_label
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

  // The two BLOG instances: Thoughts (source blog/, route /thoughts) and Designs
  // (source designs/, route /designs). Their sidebar items carry only a permalink
  // (no `draft` flag), so the swizzled BlogSidebar matches the permalink against
  // the blogDraftPermalinks set published here — the same pattern the docs sidebar
  // uses. (The blog POST header reads frontMatter.draft directly and needs none of
  // this; this set exists for the sidebar list, where frontmatter isn't available.)
  const blogInstances = [
    {dir: path.join(context.siteDir, 'blog'), base: '/thoughts'},
    {dir: path.join(context.siteDir, 'designs'), base: '/designs'},
  ];

  return {
    name: 'draft-docs-plugin',

    async loadContent() {
      const draftPermalinks = new Set();
      const premiumPermalinks = new Set();
      const blogDraftPermalinks = new Set();
      // permalink -> short sidebar label, for blog posts that set `sidebar_label:`.
      // The blog sidebar item carries only {title, permalink}, so the swizzle looks
      // the label up here (same indirection the draft set uses).
      const blogSidebarLabels = {};
      // Blog posts pinned ABOVE the year groups in the sidebar: `pinned: true`, or any
      // `kind: legend` (an index/keystone belongs at the top, not buried by its date).
      const blogPinnedPermalinks = new Set();

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
          if (data.premium === true) {
            premiumPermalinks.add(toPermalink(full, docsDir, data));
          }
        }
      };

      if (fs.existsSync(docsDir)) walk(docsDir);

      // Blog drafts: walk each blog instance for draft:true posts and derive the
      // /<route>/<slug> permalink (slug frontmatter wins; else the date-stripped
      // filename, mirroring Docusaurus' default blog slug derivation).
      for (const {dir, base} of blogInstances) {
        if (!fs.existsSync(dir)) continue;
        for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
          if (!entry.isFile() || !/\.mdx?$/.test(entry.name)) continue;
          // Skip partials/drafts-of-includes (leading underscore = not a route).
          if (entry.name.startsWith('_')) continue;
          let data;
          try {
            ({data} = matter(fs.readFileSync(path.join(dir, entry.name), 'utf8')));
          } catch {
            continue;
          }
          const permalink = toBlogPermalink(entry.name, data, base);
          if (data.draft === true) {
            blogDraftPermalinks.add(permalink);
          }
          // Pin to the top of the sidebar: explicit `pinned: true`, or any legend (an
          // index/keystone should sit above the year groups regardless of its date).
          if (data.pinned === true || data.kind === 'legend') {
            blogPinnedPermalinks.add(permalink);
          }
          // Compute the rendered sidebar label = <kind emoji> + <short label or title>.
          //   - the short text is `sidebar_label:` if set (trimmed), else the full title;
          //   - the emoji is auto-derived from `kind:` (authors never type it). If the
          //     short text already starts with the kind emoji (or any emoji), we don't
          //     double-prefix.
          // We only publish an override when it DIFFERS from the plain title (so posts
          // with neither a sidebar_label nor a kind fall through to the default title).
          const shortText =
            typeof data.sidebar_label === 'string' && data.sidebar_label.trim()
              ? data.sidebar_label.trim()
              : typeof data.title === 'string'
                ? data.title.trim()
                : '';
          const emoji = (data.kind && BLOG_KIND_EMOJI[data.kind]) || '';
          const rendered =
            emoji && !startsWithEmoji(shortText) ? `${emoji} ${shortText}` : shortText;
          if (rendered && rendered !== (data.title || '').trim()) {
            blogSidebarLabels[permalink] = rendered;
          }
        }
      }

      return {
        draftPermalinks: [...draftPermalinks],
        premiumPermalinks: [...premiumPermalinks],
        blogDraftPermalinks: [...blogDraftPermalinks],
        blogSidebarLabels,
        blogPinnedPermalinks: [...blogPinnedPermalinks],
      };
    },

    async contentLoaded({content, actions}) {
      actions.setGlobalData(content);
    },
  };
};

// Blog permalink: /<base>/<slug>. An explicit `slug:` frontmatter wins (it may be
// a bare slug or a leading-slash path); otherwise Docusaurus derives the slug from
// the filename, dropping a leading `YYYY-MM-DD-` date prefix and the extension.
function toBlogPermalink(filename, data, base) {
  if (data.slug) {
    const slug = String(data.slug);
    if (slug.startsWith('/')) return slug === '/' ? base : `${base}${slug}`;
    return `${base}/${slug}`;
  }
  const stem = filename
    .replace(/\.mdx?$/, '')
    .replace(/^\d{4}-\d{2}-\d{2}-/, '');
  return `${base}/${stem}`;
}

// True when a string already begins with an emoji (so we don't double-prefix a label
// that a human already emoji'd). Covers the common pictographic + symbol ranges and a
// leading variation selector / ZWJ sequence.
function startsWithEmoji(s) {
  if (!s) return false;
  return /^(\p{Extended_Pictographic}|\p{Emoji_Presentation})/u.test(s.trim());
}

// Strip a leading `NN-` (e.g. "4-development" -> "development") that Docusaurus
// uses for ordering but drops from the URL.
function stripPrefix(seg) {
  return seg.replace(/^\d+-/, '');
}

function toPermalink(fullPath, docsDir, data) {
  // Docs are TWO separate instances: docs/craft/* serves under routeBasePath /craft,
  // docs/journey/* under /journey (there is no /docs route). The first path segment under
  // docs/ IS the instance == its routeBasePath. A doc's permalink is
  //   /<instance> + <slug>           when slug is instance-relative (leading-slash), or
  //   /<instance>/<dir...>/<slug>    when slug renames just the last segment, or
  //   /<instance>/<dir...>           for an index file with no slug.
  // e.g. docs/journey/personal-growth/habits-reading.mdx (slug /personal-growth/habits-reading)
  //        -> /journey/personal-growth/habits-reading
  //      docs/craft/README.mdx (slug /)  -> /craft
  const rel = path.relative(docsDir, fullPath).replace(/\.mdx?$/, '');
  const segs = rel.split(path.sep).map(stripPrefix);

  const instance = segs[0]; // 'craft' | 'journey' — the routeBasePath
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
