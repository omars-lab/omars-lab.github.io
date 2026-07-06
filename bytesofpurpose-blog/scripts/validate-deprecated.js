#!/usr/bin/env node

/**
 * validate-deprecated.js — every deprecated post/doc should say WHY.
 *
 * A `deprecated: true` post/doc stays live (it ships to prod for URL stability) but
 * shows a dev-only "Dep" badge + a red banner. The banner's whole value is the
 * REASON, so a deprecation with no `deprecated_reason` is an unfinished deprecation:
 * the banner renders a bare "⚠️ Deprecated" with nothing actionable. This walks the
 * content corpus and nudges when that reason is missing.
 *
 * Findings (all WARN — never block; deprecation is a judgment call and a missing
 * reason is a nudge, not a build-breaker):
 *   - missing-reason   `deprecated: true` but no non-empty `deprecated_reason`.
 *   - dangling-for     `deprecated_for` points at a URL that no published page
 *                      produces (a replacement link that 404s). Best-effort.
 *
 * Mirrors the draft/redirect validators' shape (walk + gray-matter + the same
 * DOCS/BLOG instance lists). Kept in lockstep with validate-redirects.js's instance
 * lists — if you add a docs/blog instance, add it in both.
 *
 * Usage:  node scripts/validate-deprecated.js [--json]
 * Exit:   0 always (warn-tier). Reserve exit 2 for a future hard rule.
 */

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const ROOT = path.join(__dirname, '..');

// Kept in lockstep with validate-redirects.js. Docs instances: <dir under docs/> → routeBasePath.
const DOCS_INSTANCES = [
  {dir: 'docs/craft', base: '/craft'},
  {dir: 'docs/journey', base: '/journey'},
  {dir: 'docs/handbook', base: '/handbook'},
  {dir: 'docs/knowledge', base: '/knowledge'},
  {dir: 'docs/habits', base: '/habits'},
];
const BLOG_INSTANCES = [
  {dir: 'blog', base: '/initiatives'},
  {dir: 'designs', base: '/designs'},
  {dir: 'thoughts', base: '/thoughts'},
  {dir: 'mindset', base: '/mindset'},
  {dir: 'questions', base: '/questions'},
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

function safeMatter(fp) {
  try {
    return matter(fs.readFileSync(fp, 'utf8'));
  } catch {
    return {data: null};
  }
}

const norm = (u) => (u && u.length > 1 ? u.replace(/\/$/, '') : u);

// Best-effort published-URL set, so a deprecated_for replacement link can be sanity-checked.
// Mirrors the docs/blog permalink derivation in validate-redirects.js (absolute slug wins).
function collectPublished() {
  const published = new Set();
  for (const {dir, base} of DOCS_INSTANCES) {
    for (const fp of walk(path.join(ROOT, dir))) {
      const {data} = safeMatter(fp);
      if (!data) continue;
      let url;
      if (typeof data.slug === 'string' && data.slug.startsWith('/')) {
        url = data.slug === '/' ? base : base + data.slug;
      } else {
        const rel = path.relative(path.join(ROOT, dir), fp).replace(/\.mdx?$/, '');
        const segs = rel.split(path.sep).filter((s) => !/^README$|^index$/i.test(s));
        const last = typeof data.slug === 'string' ? data.slug.replace(/^\//, '') : segs.pop();
        url = [base, ...segs, last].filter(Boolean).join('/');
        if (/README|index/i.test(path.basename(fp)) && segs.length === 0 && !data.slug) url = base;
      }
      if (data.draft !== true) published.add(norm(url));
    }
  }
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
      if (data.draft !== true) published.add(norm(`${base}/${slug}`));
    }
  }
  return published;
}

function collectDeprecated() {
  const out = [];
  const roots = [
    ...DOCS_INSTANCES.map((i) => i.dir),
    ...BLOG_INSTANCES.map((i) => i.dir),
  ];
  for (const dir of roots) {
    for (const fp of walk(path.join(ROOT, dir))) {
      if (path.basename(fp).startsWith('_')) continue;
      const {data} = safeMatter(fp);
      if (!data || data.deprecated !== true) continue;
      out.push({
        file: path.relative(ROOT, fp),
        reason:
          typeof data.deprecated_reason === 'string'
            ? data.deprecated_reason.trim()
            : '',
        replacement:
          typeof data.deprecated_for === 'string' ? data.deprecated_for.trim() : '',
      });
    }
  }
  return out;
}

function main() {
  const json = process.argv.includes('--json');
  const deprecated = collectDeprecated();
  const published = collectPublished();
  const findings = [];

  for (const d of deprecated) {
    if (!d.reason) {
      findings.push({
        id: 'missing-reason',
        file: d.file,
        detail:
          'deprecated: true but no `deprecated_reason:` — the red banner would show a bare "⚠️ Deprecated" with nothing actionable. Add a one-line reason.',
      });
    }
    if (
      d.replacement &&
      d.replacement.startsWith('/') &&
      !published.has(norm(d.replacement))
    ) {
      findings.push({
        id: 'dangling-for',
        file: d.file,
        detail: `deprecated_for: ${d.replacement} does not resolve to a published page (a replacement link that 404s). Fix the URL or drop it.`,
      });
    }
  }

  if (json) {
    console.log(
      JSON.stringify({counts: {deprecated: deprecated.length}, findings}, null, 2),
    );
    process.exit(0);
  }

  if (!findings.length) {
    console.log(
      `✅ deprecated: ${deprecated.length} deprecated page(s) checked — all have a reason.`,
    );
    process.exit(0);
  }

  console.warn(
    `⚠️  deprecated: ${findings.length} advisory finding(s) across ${deprecated.length} deprecated page(s).`,
  );
  for (const f of findings) {
    console.warn(`\n  [warn:deprecated-${f.id}]  ${f.file}`);
    console.warn(`      ↳ ${f.detail}`);
  }
  console.warn('\n(advice only — not blocking. Run `make validate-deprecated`.)');
  // Warn-tier: never block.
  process.exit(0);
}

main();
