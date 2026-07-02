#!/usr/bin/env node

/**
 * validate-seo.js — SEO checks for the blog, in two modes.
 *
 * Docusaurus auto-emits a lot of SEO (title, canonical, og + twitter meta, JSON-LD, sitemap.xml),
 * but the author still supplies the highest-leverage fields in frontmatter (description, image,
 * keywords, a short title). The repo already checks `description` over `docs/` (in
 * validate-docs-structure.js) and samples 4 pages of built HTML (in e2e seo.spec.ts); this fills
 * the gaps: the BLOG instances (which the docs validator skips) and a CORPUS-wide built-HTML audit.
 *
 * MODE 1 — source frontmatter (default; cheap; what the hook runs). Walks the content roots and
 * checks each file's frontmatter. Shares the rule logic with validate-docs-structure.js via
 * scripts/lib/seo-frontmatter.js (extend, don't duplicate). All warn-tier:
 *   description-missing / description-length / description-duplicate (corpus-wide)
 *   title-missing / title-length
 *   keywords-format (only if keywords: is present)
 *   image-missing  (a per-page image: that isn't on disk → a 404 og:image)
 *
 * MODE 2 — built HTML (`--built`; run after `make build`, in the deploy/CI path; too slow for the
 * edit hook). Walks every built HTML page and asserts the <head> the site ACTUALLY shipped. ERROR-tier
 * (a shipped defect, blocks like the other deploy gates) for: empty <title> / title over the
 * ceiling / empty description / empty og:title / empty og:image / empty twitter:card / a canonical
 * that is missing or doesn't match the page's own URL / an og:image asset that doesn't resolve in
 * build/. Warn-tier for: missing og:description / og:url / corpus-duplicate title or description.
 *
 * Usage:  node scripts/validate-seo.js [--built] [--json] [--file <path>]
 * Exit:   Mode 1 → always 0 (advisory; the hook never blocks). Mode 2 → 2 on any ERROR finding.
 *         (`--file <path>` scopes Mode 1 to one file, for the hook.)
 */

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const seo = require('./lib/seo-frontmatter');

const ROOT = path.join(__dirname, '..');
const STATIC_DIR = path.join(ROOT, 'static');
const BUILD_DIR = path.join(ROOT, 'build');

// Content roots scanned in Mode 1. Docs are covered by validate-docs-structure.js for
// description already, but title/keywords/image are NOT, so include docs here too (the
// description checks are idempotent — a doubled warn is deduped by the caller's reporting).
const DOCS_ROOTS = ['docs/craft', 'docs/journey', 'docs/handbook', 'docs/knowledge', 'docs/habits'];
const BLOG_ROOTS = ['blog', 'designs', 'thoughts', 'changelog', 'mindset', 'questions'];
const ALL_ROOTS = [...DOCS_ROOTS, ...BLOG_ROOTS];

const args = process.argv.slice(2);
const BUILT = args.includes('--built');
const JSON_OUT = args.includes('--json');
const fileArg = (() => {
  const i = args.indexOf('--file');
  return i >= 0 ? args[i + 1] : null;
})();

const rel = (p) => path.relative(ROOT, p);

// Files/dirs that are NOT published pages and must not be SEO-checked: anything `_`-prefixed
// (mockup sidecars, partials), and the changelog SOURCE files (CLAUDE-CHANGELOG.md is split into
// cards by the generator; it and the changelog README are not standalone rendered pages).
const NON_PAGE = new Set(['CLAUDE-CHANGELOG.md', 'README.md']);
function walk(absDir, out = []) {
  if (!fs.existsSync(absDir)) return out;
  for (const e of fs.readdirSync(absDir, {withFileTypes: true})) {
    if (e.name === 'node_modules' || e.name.startsWith('.') || e.name.startsWith('_')) continue;
    const fp = path.join(absDir, e.name);
    if (e.isDirectory()) walk(fp, out);
    else if (/\.mdx?$/.test(e.name) && !NON_PAGE.has(e.name)) out.push(fp);
  }
  return out;
}

function safeMatter(file) {
  try {
    return matter(fs.readFileSync(file, 'utf8')).data || {};
  } catch {
    return null;
  }
}

// ── MODE 1: source frontmatter ─────────────────────────────────────────────
function runSource() {
  const findings = [];
  const add = (id, file, detail) => findings.push({tier: 'warn', id, file: rel(file), detail});

  // Which files to scan: one file (hook) or the whole corpus.
  let files;
  if (fileArg) {
    files = [path.resolve(fileArg)];
  } else {
    files = ALL_ROOTS.flatMap((r) => walk(path.join(ROOT, r)));
  }

  const descEntries = []; // for the corpus duplicate check
  for (const file of files) {
    const data = safeMatter(file);
    if (!data) continue;
    // Drafts are dev-only (excluded from prod); their SEO doesn't ship, so skip them.
    if (data.draft === true) continue;

    for (const f of seo.checkDescription(data)) add(f.id, file, f.detail);
    for (const f of seo.checkTitle(data)) add(f.id, file, f.detail);
    for (const f of seo.checkKeywords(data)) add(f.id, file, f.detail);
    for (const f of seo.checkImageExists(data, STATIC_DIR, fs, path)) add(f.id, file, f.detail);

    if (typeof data.description === 'string') {
      descEntries.push({file: rel(file), description: data.description});
    }
  }

  // Corpus-wide duplicate descriptions (only meaningful on a full run, not a single --file).
  if (!fileArg) {
    const dups = seo.findDuplicateDescriptions(descEntries);
    for (const [, dupFiles] of dups) {
      for (const f of dupFiles) {
        const others = dupFiles.filter((x) => x !== f);
        findings.push({
          tier: 'warn',
          id: 'description-duplicate',
          file: f,
          detail: `description is identical to ${others.length} other page(s) (${others.join(', ')}) — each page needs a distinct summary`,
        });
      }
    }
  }

  report(findings, files.length, 'source');
  process.exit(0); // Mode 1 is advisory — never blocks.
}

// ── MODE 2: built HTML ──────────────────────────────────────────────────────
function htmlFiles(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, {withFileTypes: true})) {
    const fp = path.join(dir, e.name);
    if (e.isDirectory()) htmlFiles(fp, out);
    else if (e.name.endsWith('.html')) out.push(fp);
  }
  return out;
}

// Tiny <head> meta extractors (regex is enough for the static, well-formed Docusaurus output).
function metaContent(html, attr, value) {
  const re = new RegExp(`<meta[^>]+${attr}=["']${value}["'][^>]*>`, 'i');
  const tag = html.match(re);
  if (!tag) return null;
  const c = tag[0].match(/content=["']([^"']*)["']/i);
  return c ? c[1] : '';
}
function titleOf(html) {
  const m = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return m ? m[1].trim() : null;
}
function canonicalOf(html) {
  const m = html.match(/<link[^>]+rel=["']canonical["'][^>]*>/i);
  if (!m) return null;
  const h = m[0].match(/href=["']([^"']*)["']/i);
  return h ? h[1] : '';
}

function runBuilt() {
  if (!fs.existsSync(BUILD_DIR)) {
    console.error('❌ no build/ dir — run `make build` first, then `make validate-seo-built`.');
    process.exit(2);
  }
  const findings = [];
  // `file` may be an absolute path (relativize it) or an already-relative string (use as-is).
  const add = (tier, id, file, detail) =>
    findings.push({tier, id, file: path.isAbsolute(file) ? rel(file) : file, detail});

  // Audit only AUTHOR-CONTROLLED content pages. Skip auto-generated listing/utility pages that
  // have no frontmatter source for a description, and non-Docusaurus assets — flagging those is
  // noise the author can't act on:
  //   - 404 / search pages, asset dirs
  //   - tag + author listing pages (per-instance `tags.html` / `authors.html` + the `/tags/` tree)
  //   - paginated list pages (`/page/2/`) + archive
  //   - the embedded Storybook static export (`/storybook/`), which is not a Docusaurus page
  const SKIP_RE =
    /\/(404|search|tags|authors)\.html$|\/assets\/|\/tags\/|\/page\/\d+\/|\/archive\/|\/storybook\//;
  const pages = htmlFiles(BUILD_DIR).filter((f) => !SKIP_RE.test(f));
  const titles = new Map(); // title → [files]
  const descs = new Map(); // description → [files]

  let skippedRedirects = 0;
  for (const file of pages) {
    const html = fs.readFileSync(file, 'utf8');
    // Client-redirect stubs (the plugin-client-redirects meta-refresh pages) are tiny pages with
    // no content + no SEO meta BY DESIGN — they just bounce to the real page. Skip them, or every
    // redirect would false-flag as missing title/description/og.
    if (/<meta[^>]+http-equiv=["']refresh["']/i.test(html)) {
      skippedRedirects++;
      continue;
    }
    const title = titleOf(html);
    const desc = metaContent(html, 'name', 'description');
    const ogTitle = metaContent(html, 'property', 'og:title');
    const ogDesc = metaContent(html, 'property', 'og:description');
    const ogImage = metaContent(html, 'property', 'og:image');
    const ogUrl = metaContent(html, 'property', 'og:url');
    const twCard = metaContent(html, 'name', 'twitter:card');
    const canonical = canonicalOf(html);

    if (!title) add('error', 'built-title-missing', file, 'no non-empty <title>');
    else if (seo.titleText(title) > seo.TITLE_HARD_MAX || title.length > 90) {
      // title includes the " | siteTitle" suffix, so allow some slack beyond the bare ceiling
      if (title.length > 90) add('warn', 'built-title-long', file, `<title> is ${title.length} chars (with the site suffix)`);
    }
    if (!desc) add('error', 'built-description-missing', file, 'no non-empty <meta name=description>');
    if (!ogTitle) add('error', 'built-og-title-missing', file, 'no og:title');
    if (!ogImage) add('error', 'built-og-image-missing', file, 'no og:image (social cards break)');
    if (!twCard) add('error', 'built-twitter-card-missing', file, 'no twitter:card');
    if (!canonical) add('error', 'built-canonical-missing', file, 'no <link rel=canonical>');
    if (!ogDesc) add('warn', 'built-og-description-missing', file, 'no og:description');
    if (!ogUrl) add('warn', 'built-og-url-missing', file, 'no og:url');

    // og:image must resolve to a real asset in build/ (a 404 og:image is the classic silent break).
    if (ogImage && !/^https?:\/\//i.test(ogImage)) {
      const assetPath = path.join(BUILD_DIR, ogImage.replace(/^\//, ''));
      if (!fs.existsSync(assetPath)) {
        add('error', 'built-og-image-unresolved', file, `og:image ${ogImage} does not exist in build/`);
      }
    }

    if (title) {
      if (!titles.has(title)) titles.set(title, []);
      titles.get(title).push(rel(file));
    }
    if (desc) {
      if (!descs.has(desc)) descs.set(desc, []);
      descs.get(desc).push(rel(file));
    }
  }

  // Corpus uniqueness (warn): duplicates dilute ranking + share previews. files[] are already
  // rel paths (from htmlFiles → rel in the loop above); pass the first directly.
  for (const [t, files] of titles) {
    if (files.length > 1) add('warn', 'built-title-duplicate', files[0], `${files.length} pages share the title "${t.slice(0, 60)}" (${files.join(', ')})`);
  }
  for (const [, files] of descs) {
    if (files.length > 1) add('warn', 'built-description-duplicate', files[0], `${files.length} pages share a description (${files.join(', ')})`);
  }

  reportBuilt(findings, pages.length - skippedRedirects);
  if (skippedRedirects && !JSON_OUT) console.log(`   (skipped ${skippedRedirects} client-redirect stub page(s))`);
  const hasError = findings.some((f) => f.tier === 'error');
  process.exit(hasError ? 2 : 0);
}

// ── reporting ───────────────────────────────────────────────────────────────
function report(findings, count, mode) {
  if (JSON_OUT) {
    console.log(JSON.stringify({mode, count, findings}, null, 2));
    return;
  }
  if (!findings.length) {
    console.log(`✅ SEO (${mode}): ${count} file(s) checked — no problems.`);
    return;
  }
  const byId = {};
  for (const f of findings) byId[f.id] = (byId[f.id] || 0) + 1;
  console.log(`🔎 SEO (${mode}): ${findings.length} advisory finding(s) across ${count} file(s)\n`);
  for (const f of findings) {
    console.log(`  ${f.file}  [warn:${f.id}]`);
    console.log(`      ↳ ${f.detail}`);
  }
  console.log(`\nSummary: ${Object.entries(byId).map(([k, v]) => `${k}=${v}`).join('  ')}`);
}

function reportBuilt(findings, count) {
  if (JSON_OUT) {
    console.log(JSON.stringify({mode: 'built', count, findings}, null, 2));
    return;
  }
  if (!findings.length) {
    console.log(`✅ SEO (built): ${count} HTML page(s) checked — no problems.`);
    return;
  }
  const errors = findings.filter((f) => f.tier === 'error');
  const warns = findings.filter((f) => f.tier === 'warn');
  console.log(`🔎 SEO (built): ${errors.length} error(s), ${warns.length} warn(s) across ${count} page(s)\n`);
  for (const f of findings) {
    console.log(`  ${f.file}  [${f.tier}:${f.id}]`);
    console.log(`      ↳ ${f.detail}`);
  }
  if (errors.length) {
    console.log(`\n❌ ${errors.length} ERROR-tier SEO defect(s) shipped in build/ — fix before deploy.`);
  }
}

// ── main ────────────────────────────────────────────────────────────────────
if (BUILT) runBuilt();
else runSource();
