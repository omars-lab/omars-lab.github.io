#!/usr/bin/env node

/**
 * validate-redirects.js — catch broken client-redirects BEFORE the full build does.
 *
 * Docusaurus only validates redirects at build time ("createRedirects to invalid paths",
 * "Duplicate routes"), which is slow and surfaces late. This walks the SAME redirects array
 * (read straight from docusaurus.config.js, not regex-parsed) and cross-checks each entry
 * against the set of REAL published URLs (every doc/blog/design/page permalink, honoring
 * `draft:`), so a bad redirect is caught in seconds.
 *
 * Findings:
 *   - to-missing      a redirect `to:` target that no published page/doc produces (the page
 *                     doesn't exist, or its slug differs). [ERROR — this fails the prod build]
 *   - to-draft        a redirect `to:` a DRAFT page (excluded from prod → invalid prod build).
 *                     [ERROR]
 *   - from-collision  a redirect `from:` that equals a real published URL (the redirect shadows
 *                     a real page; the page wins, the redirect is dead). [warn]
 *   - from-duplicate  the same `from:` appears in more than one redirect. [warn]
 *
 * The `to:` set is built from content; KNOWN dynamic targets that aren't files (tag pages,
 * the homepage, /404) are whitelisted so they don't false-positive.
 *
 * Usage:  node scripts/validate-redirects.js [--json]
 * Exit:   2 if any ERROR-tier finding (to-missing / to-draft); else 0 (warns don't block).
 */

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const ROOT = path.join(__dirname, '..');

// ── 1. The real published URL set ──────────────────────────────────────────
// Docs instances: <dir under docs/> → its routeBasePath. (Mirrors docusaurus.config.js.)
const DOCS_INSTANCES = [
  {dir: 'docs/craft', base: '/craft'},
  {dir: 'docs/journey', base: '/journey'},
  {dir: 'docs/legend', base: '/legend'},
];
const BLOG_INSTANCES = [
  {dir: 'blog', base: '/initiatives'},
  {dir: 'designs', base: '/designs'},
  {dir: 'thoughts', base: '/thoughts'}, // UNACTIONED idea posts (Thoughts & Ideas instance)
  {dir: 'mindset', base: '/mindset'}, // the Mindset instance (quotes/affirmations/reflections)
  {dir: 'questions', base: '/questions'}, // the Questions instance (question-sets)
];

function walk(absDir, out = []) {
  if (!fs.existsSync(absDir)) return out;
  for (const e of fs.readdirSync(absDir, {withFileTypes: true})) {
    if (e.name === 'node_modules') continue;
    const fp = path.join(absDir, e.name);
    if (e.isDirectory()) walk(fp, out);
    else if (/\.mdx?$/.test(e.name)) out.push(fp);
  }
  return out;
}

const norm = (u) => (u.length > 1 ? u.replace(/\/$/, '') : u); // strip trailing slash (except '/')

// Build the published-URL set + the draft-URL set.
function collectUrls() {
  const published = new Set();
  const draft = new Set();

  // Docs: an absolute (leading-slash) slug is INSTANCE-RELATIVE → base + slug. Otherwise the
  // permalink is base + <dir path> (+ slug rename of the last segment). We resolve the common
  // cases: explicit absolute slug (the repo's convention) and a path-derived fallback.
  for (const {dir, base} of DOCS_INSTANCES) {
    for (const fp of walk(path.join(ROOT, dir))) {
      const {data} = safeMatter(fp);
      if (!data) continue;
      let url;
      if (typeof data.slug === 'string' && data.slug.startsWith('/')) {
        url = data.slug === '/' ? base : base + data.slug;
      } else {
        // path-derived: docs/<instance>/<a>/<b>/file(.md) → base/<a>/<b>/<slug|file>
        const rel = path.relative(path.join(ROOT, dir), fp).replace(/\.mdx?$/, '');
        const segs = rel.split(path.sep).filter((s) => !/^README$|^index$/i.test(s));
        const last = typeof data.slug === 'string' ? data.slug.replace(/^\//, '') : segs.pop();
        url = [base, ...segs, last].filter(Boolean).join('/');
        if (/README|index/i.test(path.basename(fp)) && segs.length === 0 && !data.slug) url = base;
      }
      (data.draft === true ? draft : published).add(norm(url));
    }
  }

  // Blog/designs: permalink = base + (slug || de-dated filename).
  for (const {dir, base} of BLOG_INSTANCES) {
    for (const fp of walk(path.join(ROOT, dir))) {
      if (path.basename(fp).startsWith('_')) continue;
      const {data} = safeMatter(fp);
      if (!data) continue;
      const fileSlug = path
        .basename(fp)
        .replace(/\.mdx?$/, '')
        .replace(/^\d{4}-\d{2}-\d{2}-/, '');
      const slug = (data.slug || fileSlug).toString().replace(/^\//, '');
      (data.draft === true ? draft : published).add(norm(`${base}/${slug}`));
    }
  }

  // src/pages/*.{mdx,tsx,js} → top-level routes (/welcome, /mindset, /support, …).
  const pagesDir = path.join(ROOT, 'src', 'pages');
  if (fs.existsSync(pagesDir)) {
    for (const e of walkPages(pagesDir)) published.add(norm(e));
  }

  return {published, draft};
}

function walkPages(absDir, base = '', out = []) {
  for (const e of fs.readdirSync(absDir, {withFileTypes: true})) {
    if (e.name.startsWith('_') || e.name.includes('.test.')) continue;
    const fp = path.join(absDir, e.name);
    if (e.isDirectory()) {
      walkPages(fp, `${base}/${e.name}`, out);
    } else if (/\.(mdx?|tsx?|jsx?)$/.test(e.name)) {
      const name = e.name.replace(/\.(mdx?|tsx?|jsx?)$/, '');
      // index → the dir route; otherwise /<name>. Honor an explicit `slug:` in mdx pages.
      let route;
      if (/\.mdx?$/.test(e.name)) {
        const {data} = safeMatter(fp);
        if (data && typeof data.slug === 'string') route = data.slug;
      }
      if (!route) route = name === 'index' ? base || '/' : `${base}/${name}`;
      out.push(route);
    }
  }
  return out;
}

function safeMatter(fp) {
  try {
    return matter(fs.readFileSync(fp, 'utf8'));
  } catch {
    return {data: null};
  }
}

// Targets that are real at runtime but not produced by a content file. Don't flag these.
function isWhitelisted(to, published) {
  if (to === '/' || to === '/404' || to === '/404.html') return true;
  // Tag pages (/<instance>/tags/...) + the docs tag indexes are generated, not files.
  if (/\/tags(\/|$)/.test(to)) return true;
  // The changelog instance generates per-entry pages from changelog/.
  if (to === '/changelog' || to.startsWith('/changelog/')) return true;
  return published.has(norm(to));
}

// ── 2. Read the real redirects from the config ─────────────────────────────
function loadRedirects() {
  const cfg = require(path.join(ROOT, 'docusaurus.config.js'));
  const plugins = cfg.plugins || [];
  const cr = plugins.find(
    (p) => Array.isArray(p) && typeof p[0] === 'string' && p[0].includes('client-redirects'),
  );
  return cr && Array.isArray(cr[1].redirects) ? cr[1].redirects : [];
}

// ── 3. Validate ────────────────────────────────────────────────────────────
function main() {
  const json = process.argv.includes('--json');
  const {published, draft} = collectUrls();
  const redirects = loadRedirects();
  const findings = [];

  const froms = new Map(); // from → count (for duplicate detection)
  // NOTE: Docusaurus's client-redirects plugin does NOT chain redirects — a `to:` must point at a
  // REAL published page. A `to:` that lands on another redirect's `from:` resolves to a 404 at
  // build time ("createRedirects to invalid paths"), NOT transitively to that redirect's target.
  // So the `to:` set is validated against published pages ONLY; do not treat a `from:` as a valid
  // target (that false-negative once shipped a build-breaking redirect to a moved-away slug).

  for (const {from, to} of redirects) {
    const nFrom = norm(from);
    const nTo = norm(to);
    froms.set(nFrom, (froms.get(nFrom) || 0) + 1);

    // to-missing / to-draft: the target must be a published page (or a whitelisted dynamic route).
    if (!isWhitelisted(nTo, published)) {
      if (draft.has(nTo)) {
        findings.push({tier: 'error', id: 'to-draft', from, to, detail: `redirect target ${to} is a DRAFT page (excluded from the prod build → invalid). Publish it or drop the redirect.`});
      } else {
        findings.push({tier: 'error', id: 'to-missing', from, to, detail: `redirect target ${to} does not match any published page/doc/blog/design/page URL. Fix the target (a moved slug?) or drop the redirect.`});
      }
    }

    // from-collision: the `from` shadows a real published page (the page wins; redirect is dead).
    if (published.has(nFrom)) {
      findings.push({tier: 'warn', id: 'from-collision', from, to, detail: `redirect FROM ${from} is also a real published page; the page wins and this redirect never fires.`});
    }
  }

  for (const [from, n] of froms) {
    if (n > 1) findings.push({tier: 'warn', id: 'from-duplicate', from, to: '', detail: `redirect FROM ${from} appears ${n} times; only one fires.`});
  }

  if (json) {
    console.log(JSON.stringify({counts: {redirects: redirects.length, published: published.size, draft: draft.size}, findings}, null, 2));
    process.exit(0);
  }

  const errors = findings.filter((f) => f.tier === 'error');
  const warns = findings.filter((f) => f.tier === 'warn');

  if (!findings.length) {
    console.log(`✅ redirects: ${redirects.length} checked against ${published.size} published URLs — no problems.`);
    process.exit(0);
  }

  console.error(`🔀 redirects: ${errors.length} error(s), ${warns.length} warning(s) across ${redirects.length} redirects.`);
  for (const f of [...errors, ...warns]) {
    console.error(`\n  [${f.tier}:redirect-${f.id}]  ${f.from}${f.to ? ` → ${f.to}` : ''}`);
    console.error(`      ↳ ${f.detail}`);
  }
  console.error('\n(ERROR-tier = would fail the prod build; warn = dead/duplicate redirect. Source of truth: the redirects array in docusaurus.config.js.)');
  process.exit(errors.length ? 2 : 0);
}

main();
