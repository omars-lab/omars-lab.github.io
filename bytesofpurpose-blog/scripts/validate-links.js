#!/usr/bin/env node

/**
 * validate-links.js — static link hygiene check for the Bytes of Purpose content.
 *
 * Scans the markdown/MDX SOURCE (docs/, blog/, changelog/) — before any build —
 * and reports link problems that render as ugly or low-quality links in posts:
 *
 *   1. bare-url        A naked http(s):// URL sitting inline instead of a
 *                      [text](url) link. These render as a giant clickable string.
 *   2. long-url        A link whose URL is very long and/or carries tracking
 *                      params (Google `sca_esv`/`ei`/`ved`/`gs_lp`, utm_*, etc.).
 *                      Suggests the minimal form + a descriptive label.
 *   3. url-as-text     A [text](url) whose visible TEXT is itself a raw URL.
 *   4. generic-text    Non-descriptive link text ("click here", "here", "link",
 *                      "read more") — mirrors the Lighthouse link-text rule the
 *                      SEO e2e spec checks on the rendered page (test/e2e/seo.spec.ts).
 *
 * This is the SOURCE-level complement to two existing checks:
 *   - Docusaurus `onBrokenLinks` catches broken internal links at build time.
 *   - test/e2e/seo.spec.ts catches generic link text on the RENDERED page.
 * Here we catch the problems in the raw markdown so they never ship.
 *
 * Usage:
 *   node scripts/validate-links.js            # scan default content dirs
 *   node scripts/validate-links.js docs/2-definitions   # scan a subtree
 *   node scripts/validate-links.js --json     # machine-readable output
 *
 * Exit code: 0 if clean, 1 if any problems were found (CI-friendly).
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DEFAULT_DIRS = ['docs', 'blog', 'changelog'];

// --- tuning knobs --------------------------------------------------------
const LONG_URL_THRESHOLD = 120; // chars; above this a URL is "too long" to inline raw
const TRACKING_PARAMS = [
  // generic marketing
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
  'gclid', 'fbclid', 'mc_cid', 'mc_eid', 'igshid', 'ref_src',
  // google search cruft (the case that motivated this script)
  'sca_esv', 'ei', 'ved', 'uact', 'oq', 'gs_lp', 'sclient', 'sxsrf',
  'client', 'channel', 'num', 'source', 'biw', 'bih',
];
const GENERIC_LINK_TEXT = new Set([
  'read more', 'click here', 'here', 'link', 'this', 'this link',
  'more', 'see here', 'learn more', 'click', 'go',
]);

// --- helpers -------------------------------------------------------------

function walk(dir, acc = []) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return acc;
  }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
      walk(full, acc);
    } else if (/\.mdx?$/.test(e.name)) {
      acc.push(full);
    }
  }
  return acc;
}

/** Strip fenced (```) and inline (`...`) code so we don't flag URLs in examples. */
function maskCode(line, state) {
  if (/^\s*```/.test(line)) {
    state.inFence = !state.inFence;
    return ''; // the fence line itself carries nothing to check
  }
  if (state.inFence) return '';
  // blank out inline code spans
  return line.replace(/`[^`]*`/g, (m) => ' '.repeat(m.length));
}

function trackingParamsIn(url) {
  const q = url.indexOf('?');
  if (q === -1) return [];
  const query = url.slice(q + 1);
  const found = [];
  for (const param of TRACKING_PARAMS) {
    const re = new RegExp(`(^|[?&])${param}=`, 'i');
    if (re.test('?' + query)) found.push(param);
  }
  return found;
}

/** Suggest a cleaned URL: keep path + the first "meaningful" query param, drop the rest. */
function suggestCleanUrl(url) {
  try {
    const u = new URL(url);
    // Keep only well-known "content" params, drop everything else.
    const keep = ['q', 'v', 'p', 'id'];
    const kept = [];
    for (const k of keep) {
      if (u.searchParams.has(k)) kept.push(`${k}=${u.searchParams.get(k)}`);
    }
    const base = `${u.origin}${u.pathname}`;
    return kept.length ? `${base}?${kept.join('&')}` : base;
  } catch {
    return url.split('?')[0];
  }
}

const isHttp = (s) => /^https?:\/\//i.test(s);

// --- the scan ------------------------------------------------------------

const MD_LINK = /\[([^\]]*)\]\(\s*(<)?([^)\s]+?)>?(?:\s+"[^"]*")?\s*\)/g;
const BARE_URL = /(?<![\(<\["'=])\bhttps?:\/\/[^\s<>)\]]+/g;

function scanFile(file) {
  const rel = path.relative(ROOT, file);
  const problems = [];
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  const state = { inFence: false };
  let inFrontmatter = false;

  lines.forEach((raw, i) => {
    const lineNo = i + 1;

    // skip YAML frontmatter block
    if (i === 0 && raw.trim() === '---') { inFrontmatter = true; return; }
    if (inFrontmatter) { if (raw.trim() === '---') inFrontmatter = false; return; }

    const line = maskCode(raw, state);
    if (!line.trim()) return;

    // 1) markdown links — inspect text + url
    MD_LINK.lastIndex = 0;
    let m;
    const linkSpans = [];
    while ((m = MD_LINK.exec(line)) !== null) {
      const [, text, , url] = m;
      linkSpans.push([m.index, m.index + m[0].length]);
      if (!isHttp(url) && !url.startsWith('//')) continue; // relative/internal → onBrokenLinks handles it

      const trackers = trackingParamsIn(url);
      if (url.length > LONG_URL_THRESHOLD || trackers.length) {
        problems.push({
          file: rel, line: lineNo, kind: 'long-url',
          detail: trackers.length
            ? `link URL carries tracking params (${trackers.join(', ')})`
            : `link URL is ${url.length} chars long`,
          suggest: `use a short URL + descriptive text, e.g. [${text || 'descriptive label'}](${suggestCleanUrl(url)})`,
        });
      }
      if (isHttp(text.trim())) {
        problems.push({
          file: rel, line: lineNo, kind: 'url-as-text',
          detail: 'link text is a raw URL',
          suggest: 'replace the visible text with a human-readable label',
        });
      }
      const norm = text.trim().toLowerCase().replace(/\s*[→›»>]+\s*$/, '');
      if (GENERIC_LINK_TEXT.has(norm)) {
        problems.push({
          file: rel, line: lineNo, kind: 'generic-text',
          detail: `non-descriptive link text "${text.trim()}"`,
          suggest: 'use text that describes the destination (Lighthouse link-text rule)',
        });
      }
    }

    // 2) bare URLs — anything not already inside a markdown link span
    BARE_URL.lastIndex = 0;
    while ((m = BARE_URL.exec(line)) !== null) {
      const idx = m.index;
      const insideLink = linkSpans.some(([s, e]) => idx >= s && idx < e);
      if (insideLink) continue;
      const url = m[0];
      const trackers = trackingParamsIn(url);
      problems.push({
        file: rel, line: lineNo, kind: 'bare-url',
        detail: trackers.length
          ? `bare URL with tracking params (${trackers.join(', ')})`
          : 'bare URL rendered inline',
        suggest: `wrap as a link: [descriptive label](${suggestCleanUrl(url)})`,
      });
    }
  });

  return problems;
}

// --- main ----------------------------------------------------------------

function main() {
  const args = process.argv.slice(2);
  const json = args.includes('--json');
  const targets = args.filter((a) => !a.startsWith('--'));
  const dirs = (targets.length ? targets : DEFAULT_DIRS).map((d) =>
    path.isAbsolute(d) ? d : path.join(ROOT, d)
  );

  const files = dirs.flatMap((d) =>
    fs.existsSync(d) && fs.statSync(d).isDirectory() ? walk(d) : (fs.existsSync(d) ? [d] : [])
  );

  const all = files.flatMap(scanFile);

  if (json) {
    console.log(JSON.stringify(all, null, 2));
    process.exit(all.length ? 1 : 0);
  }

  if (!all.length) {
    console.log(`✅ link hygiene: scanned ${files.length} files, no problems found.`);
    process.exit(0);
  }

  const byKind = all.reduce((acc, p) => ((acc[p.kind] = (acc[p.kind] || 0) + 1), acc), {});
  console.log(`🔗 link hygiene: ${all.length} problem(s) in ${files.length} files scanned\n`);
  for (const p of all) {
    console.log(`  ${p.file}:${p.line}  [${p.kind}] ${p.detail}`);
    console.log(`      ↳ ${p.suggest}`);
  }
  console.log('\nSummary: ' + Object.entries(byKind).map(([k, n]) => `${k}=${n}`).join('  '));
  process.exit(1);
}

main();
