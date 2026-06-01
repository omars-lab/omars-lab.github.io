#!/usr/bin/env node

/**
 * validate-links.js — static link hygiene check + fixer for Bytes of Purpose content.
 *
 * Scans the markdown/MDX SOURCE (docs/, blog/, changelog/) — before any build —
 * and reports (or fixes) link problems that render as ugly or low-quality links:
 *
 *   bare-url     A naked http(s):// URL inline instead of a [text](url) link.   [ERROR]
 *   url-as-text  A [text](url) whose visible TEXT is itself a raw URL.          [ERROR]
 *   long-url     A link URL >120 chars and/or carrying tracking params          [WARN]
 *                (Google sca_esv/ei/ved/gs_lp, utm_*, …).
 *   generic-text Non-descriptive link text ("click here", "here", "read more"). [WARN]
 *                Mirrors the Lighthouse link-text rule the SEO e2e spec checks.
 *   broken-internal  A /docs/… link that resolves to no published doc slug.     [WARN]
 *                    Source-level, fast version of Docusaurus onBrokenLinks.
 *   link-to-draft    A PUBLISHED page links to a `draft: true` page (which is    [WARN]
 *                    excluded from the prod build → a build-time broken link).
 *                    A draft→draft link is allowed (they ship together later).
 *
 * The two internal-link checks are cross-file: they build a whole-corpus slug
 * index (absolute `slug:` + `draft:` per doc) and resolve every /docs/ link
 * against it. Both are warn-tier by decision — advisory, never blocking, since a
 * draft may intentionally forward-link to a not-yet-published page.
 *
 * SOURCE-level complement to: Docusaurus `onBrokenLinks` (broken internal links,
 * build time) and test/e2e/seo.spec.ts (generic link text on the rendered page).
 *
 * Usage:
 *   node scripts/validate-links.js [paths…]        # scan (default: docs blog changelog)
 *   node scripts/validate-links.js --json          # machine-readable findings
 *   node scripts/validate-links.js --error-only    # only ERROR-tier; exit 2 if any (hook)
 *   node scripts/validate-links.js --fix [paths…]  # rewrite bare URLs → [label](url)
 *   node scripts/validate-links.js --fix --titles  # …labeling via fetched <title> (network)
 *
 * Exit codes: 0 clean · 1 problems found (scan) · 2 ERROR-tier found (--error-only, for hooks).
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DEFAULT_DIRS = ['docs', 'blog', 'changelog'];

// --- severity tiers ------------------------------------------------------
const SEVERITY = {
  'bare-url': 'error',
  'url-as-text': 'error',
  'long-url': 'warn',
  'generic-text': 'warn',
  // Internal-link integrity (cross-file; needs the whole-corpus slug index).
  // Both warn-tier by decision: advisory, never blocks a commit — a draft may
  // intentionally forward-link to a page not yet published.
  'broken-internal': 'warn', // /docs/... link resolves to no published page
  'link-to-draft': 'warn',   // a PUBLISHED page links to a draft: true page
};

// The docs plugin has no routeBasePath override → docs are served under /docs.
// So an internal link `/docs/<X>` maps to a doc whose absolute slug is `/<X>`.
const DOCS_ROUTE_PREFIX = '/docs';

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
// Tier 1: known hosts → friendly display names.
const KNOWN_HOSTS = {
  'github.com': 'GitHub',
  'gist.github.com': 'GitHub Gist',
  'stackoverflow.com': 'Stack Overflow',
  'developer.chrome.com': 'Chrome Docs',
  'developer.mozilla.org': 'MDN',
  'docs.aws.amazon.com': 'AWS Docs',
  'aws.amazon.com': 'AWS',
  'docusaurus.io': 'Docusaurus',
  'posthog.com': 'PostHog',
  'www.youtube.com': 'YouTube',
  'youtube.com': 'YouTube',
  'youtu.be': 'YouTube',
  'medium.com': 'Medium',
  'www.npmjs.com': 'npm',
  'reactjs.org': 'React',
  'react.dev': 'React',
};

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

/** Read the YAML frontmatter block (between the first two `---`) as raw lines. */
function readFrontmatter(file) {
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  if (lines[0]?.trim() !== '---') return null;
  const out = [];
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '---') return out;
    out.push(lines[i]);
  }
  return null; // unterminated frontmatter → treat as none
}

/** Pull a scalar frontmatter field's value (single line), stripping quotes. */
function fmField(fmLines, key) {
  if (!fmLines) return undefined;
  const re = new RegExp(`^${key}:\\s*(.+?)\\s*$`);
  for (const l of fmLines) {
    const m = l.match(re);
    if (m) return m[1].replace(/^['"]|['"]$/g, '').trim();
  }
  return undefined;
}

/**
 * Build the corpus slug index used by the internal-link checks.
 * Maps a normalized route ("/<slug-without-leading-slash>") → { rel, draft }.
 * Only docs carry author-controlled absolute slugs we link to via /docs/…, so
 * we index the docs/ tree (the only space these /docs/ links can target).
 * Returns { byRoute, hasAnyDoc }.
 */
function buildSlugIndex(docsDir) {
  const byRoute = new Map();
  const files = walk(docsDir);
  for (const f of files) {
    const fm = readFrontmatter(f);
    const slug = fmField(fm, 'slug');
    if (!slug || !slug.startsWith('/')) continue; // only absolute-slug docs are addressable
    const draftRaw = (fmField(fm, 'draft') || '').toLowerCase();
    const draft = draftRaw === 'true';
    // Route the doc is served at, minus the /docs prefix, normalized (no trailing slash).
    const route = (DOCS_ROUTE_PREFIX + slug).replace(/\/+$/, '');
    byRoute.set(route, { rel: path.relative(ROOT, f), draft });
  }
  return { byRoute, hasAnyDoc: files.length > 0 };
}

/** Strip fenced (```) and inline (`...`) code so we don't flag URLs in examples. */
function maskCode(line, state) {
  if (/^\s*```/.test(line)) {
    state.inFence = !state.inFence;
    return ''; // the fence line itself carries nothing to check
  }
  if (state.inFence) return '';
  return line.replace(/`[^`]*`/g, (m) => ' '.repeat(m.length));
}

/**
 * Blank out commented-out content so links inside comments aren't flagged.
 * Handles HTML comments (<!-- ... -->) and JSX/MDX brace-slash-star comments,
 * including multi-line spans (tracked via state.inComment). A commented link is an
 * intentionally-deferred link (e.g. a README item pointing at a not-yet-published
 * draft) — it ships as nothing, so it must not trip broken-internal/link-to-draft.
 * Mirrors maskCode's "replace with spaces, preserve column positions" approach.
 */
function maskComments(line, state) {
  let out = '';
  let i = 0;
  while (i < line.length) {
    if (state.inComment) {
      // Look for whichever closer matches the opener we're inside.
      const closer = state.inComment === 'html' ? '-->' : '*/';
      const end = line.indexOf(closer, i);
      if (end === -1) {
        out += ' '.repeat(line.length - i);
        i = line.length;
      } else {
        out += ' '.repeat(end - i + closer.length);
        i = end + closer.length;
        state.inComment = null;
      }
    } else if (line.startsWith('<!--', i)) {
      state.inComment = 'html';
      out += '    ';
      i += 4;
    } else if (line.startsWith('{/*', i)) {
      state.inComment = 'jsx';
      out += '   ';
      i += 3;
    } else {
      out += line[i];
      i += 1;
    }
  }
  return out;
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

/** Keep path + the first "content" query param, drop tracking/cruft. */
function suggestCleanUrl(url) {
  try {
    const u = new URL(url);
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

const titleCase = (s) =>
  s.replace(/[-_]+/g, ' ').trim().replace(/\b\w/g, (c) => c.toUpperCase());

/**
 * Tiered label derivation (offline). Tier 0 (fetched <title>) is handled
 * separately in --titles mode and passed in via `fetchedTitle`.
 *   Tier 1: known host friendly name + last meaningful path segment
 *   Tier 2: generic host + last segment
 *   Tier 3: null → caller falls back to an angle-bracket autolink
 */
function deriveLabel(url, fetchedTitle) {
  if (fetchedTitle && fetchedTitle.trim()) return fetchedTitle.trim();
  let u;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^www\./, '');
  const segments = u.pathname.split('/').filter(Boolean);
  let last = segments.length ? segments[segments.length - 1] : '';
  last = last.replace(/\.(html?|php|aspx?)$/i, ''); // drop file extensions
  const friendly = KNOWN_HOSTS[u.hostname] || KNOWN_HOSTS[host];

  if (friendly) {
    // Tier 1. For github repos prefer "owner/repo" if present.
    if ((host === 'github.com') && segments.length >= 2) {
      return `${friendly} — ${segments[0]}/${segments[1]}`;
    }
    return last ? `${friendly} — ${titleCase(last)}` : friendly;
  }
  if (last && last.length <= 60) {
    // Tier 2: host + readable last segment.
    return `${host} — ${titleCase(last)}`;
  }
  // Tier 3: no good segment (or one too long to read) → just the host.
  // Always returns a string so we never emit a bare <url> autolink (MDX-unsafe).
  return host;
}

/** Build the replacement markdown for a bare URL. Always a [label](url) link. */
function linkFor(url, fetchedTitle) {
  const label = deriveLabel(url, fetchedTitle) || url;
  // Preserve the original URL (don't strip params on a fix — only `suggest` cleans).
  return `[${label}](${url})`;
}

// --- the scan ------------------------------------------------------------

const MD_LINK = /\[([^\]]*)\]\(\s*(<)?([^)\s]+?)>?(?:\s+"[^"]*")?\s*\)/g;
const BARE_URL = /(?<![\(<\["'=])\bhttps?:\/\/[^\s<>)\]]+/g;

/**
 * Returns { problems, bareUrls } where bareUrls lists every bare-url occurrence.
 * When `slugIndex` is provided, also runs the internal-link integrity checks
 * (broken-internal + link-to-draft). `slugIndex` is the result of buildSlugIndex.
 */
function scanFile(file, slugIndex) {
  const rel = path.relative(ROOT, file);
  const problems = [];
  const bareUrls = [];
  // Is the SOURCE page itself a draft? A draft linking to a draft is fine
  // (both ship together later); we only flag a PUBLISHED page → draft link.
  const srcDraft = slugIndex
    ? ((fmField(readFrontmatter(file), 'draft') || '').toLowerCase() === 'true')
    : false;
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  const state = { inFence: false, inComment: null };
  let inFrontmatter = false;

  lines.forEach((raw, i) => {
    const lineNo = i + 1;
    if (i === 0 && raw.trim() === '---') { inFrontmatter = true; return; }
    if (inFrontmatter) { if (raw.trim() === '---') inFrontmatter = false; return; }

    const line = maskComments(maskCode(raw, state), state);
    if (!line.trim()) return;

    MD_LINK.lastIndex = 0;
    let m;
    const linkSpans = [];
    while ((m = MD_LINK.exec(line)) !== null) {
      const [, text, , url] = m;
      linkSpans.push([m.index, m.index + m[0].length]);

      // --- internal-link integrity (only when we have a slug index) --------
      // Targets we resolve: site-internal /docs/… links. We ignore external
      // (http), protocol-relative (//), anchors (#…), and non-/docs internals
      // (e.g. /blog, /changelog) which other route bases own.
      if (slugIndex && url.startsWith(DOCS_ROUTE_PREFIX)) {
        // Normalize: drop #fragment, ?query, trailing slash.
        const route = url.replace(/[?#].*$/, '').replace(/\/+$/, '');
        const hit = slugIndex.byRoute.get(route);
        if (!hit) {
          problems.push({
            file: rel, line: lineNo, kind: 'broken-internal', severity: SEVERITY['broken-internal'],
            detail: `internal link → ${route} resolves to no published doc slug`,
            suggest: 'fix the path, or point at an existing absolute slug (source-level check of onBrokenLinks)',
          });
        } else if (hit.draft && !srcDraft) {
          problems.push({
            file: rel, line: lineNo, kind: 'link-to-draft', severity: SEVERITY['link-to-draft'],
            detail: `published page links to a draft page (${hit.rel} has draft: true)`,
            suggest: 'un-draft the target before linking from a live page, or remove/defer the link',
          });
        }
      }

      if (!isHttp(url) && !url.startsWith('//')) continue;

      const trackers = trackingParamsIn(url);
      if (url.length > LONG_URL_THRESHOLD || trackers.length) {
        problems.push({
          file: rel, line: lineNo, kind: 'long-url', severity: SEVERITY['long-url'],
          detail: trackers.length
            ? `link URL carries tracking params (${trackers.join(', ')})`
            : `link URL is ${url.length} chars long`,
          suggest: `use a short URL + descriptive text, e.g. [${text || 'descriptive label'}](${suggestCleanUrl(url)})`,
        });
      }
      if (isHttp(text.trim())) {
        problems.push({
          file: rel, line: lineNo, kind: 'url-as-text', severity: SEVERITY['url-as-text'],
          detail: 'link text is a raw URL',
          suggest: 'replace the visible text with a human-readable label',
        });
      }
      const norm = text.trim().toLowerCase().replace(/\s*[→›»>]+\s*$/, '');
      if (GENERIC_LINK_TEXT.has(norm)) {
        problems.push({
          file: rel, line: lineNo, kind: 'generic-text', severity: SEVERITY['generic-text'],
          detail: `non-descriptive link text "${text.trim()}"`,
          suggest: 'use text that describes the destination (Lighthouse link-text rule)',
        });
      }
    }

    BARE_URL.lastIndex = 0;
    while ((m = BARE_URL.exec(line)) !== null) {
      const idx = m.index;
      if (linkSpans.some(([s, e]) => idx >= s && idx < e)) continue;
      const url = m[0];
      const trackers = trackingParamsIn(url);
      problems.push({
        file: rel, line: lineNo, kind: 'bare-url', severity: SEVERITY['bare-url'],
        detail: trackers.length
          ? `bare URL with tracking params (${trackers.join(', ')})`
          : 'bare URL rendered inline',
        suggest: `wrap as a link: [descriptive label](${suggestCleanUrl(url)})`,
      });
      bareUrls.push({ url, lineNo });
    }
  });

  return { problems, bareUrls };
}

// --- title fetching (Tier 0, opt-in) -------------------------------------

async function fetchTitle(url) {
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, { signal: controller.signal, redirect: 'follow' });
    clearTimeout(t);
    if (!res.ok) return null;
    const html = await res.text();
    const m = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    return m ? m[1].replace(/\s+/g, ' ').trim() : null;
  } catch {
    return null;
  }
}

// --- fix mode ------------------------------------------------------------

/**
 * Rewrite bare URLs → [label](url) AND fix [url](url) link text → [label](url).
 * Returns count fixed.
 */
async function fixFile(file, { titles }) {
  const { bareUrls } = scanFile(file);

  // Collect every http(s) URL we might re-label so titles are fetched once:
  // bare URLs, [url](url) link text, and <url> autolinks.
  const labelUrls = new Set(bareUrls.map((b) => b.url));
  {
    const probe = fs.readFileSync(file, 'utf8');
    let pm;
    MD_LINK.lastIndex = 0;
    while ((pm = MD_LINK.exec(probe)) !== null) {
      const text = pm[1].trim(), url = pm[3];
      if (isHttp(url) && isHttp(text)) labelUrls.add(url);
    }
    for (const am of probe.matchAll(/<(https?:\/\/[^>\s]+)>/g)) labelUrls.add(am[1]);
  }
  if (!labelUrls.size) return 0;

  // Optionally fetch titles up front (dedup by URL).
  const titleByUrl = {};
  if (titles) {
    await Promise.all([...labelUrls].map(async (u) => { titleByUrl[u] = await fetchTitle(u); }));
  }

  // Operate per line so we only touch the exact bare-URL spans.
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  const state = { inFence: false, inComment: null };
  let inFrontmatter = false;
  let fixed = 0;

  const out = lines.map((raw, i) => {
    if (i === 0 && raw.trim() === '---') { inFrontmatter = true; return raw; }
    if (inFrontmatter) { if (raw.trim() === '---') inFrontmatter = false; return raw; }
    const masked = maskComments(maskCode(raw, state), state);
    if (!masked.trim()) return raw;

    // Find markdown-link spans on this line so we never touch a URL already in a link.
    const linkSpans = [];
    MD_LINK.lastIndex = 0;
    let lm;
    while ((lm = MD_LINK.exec(masked)) !== null) linkSpans.push([lm.index, lm.index + lm[0].length]);

    // Replace bare URLs right-to-left to keep indices valid.
    BARE_URL.lastIndex = 0;
    const hits = [];
    let bm;
    while ((bm = BARE_URL.exec(masked)) !== null) {
      if (linkSpans.some(([s, e]) => bm.index >= s && bm.index < e)) continue;
      hits.push({ start: bm.index, end: bm.index + bm[0].length, url: bm[0] });
    }
    let line = raw;
    for (let h = hits.length - 1; h >= 0; h--) {
      const { start, end, url } = hits[h];
      line = line.slice(0, start) + linkFor(url, titleByUrl[url]) + line.slice(end);
      fixed++;
    }

    // Second pass: relabel [url](url) where the visible text is a raw URL.
    line = line.replace(MD_LINK, (whole, text, _lt, url) => {
      if (isHttp(url) && isHttp(text.trim())) {
        const label = deriveLabel(url, titleByUrl[url]);
        if (label) { fixed++; return `[${label}](${url})`; }
      }
      return whole;
    });

    // Third pass: convert MDX-unsafe <url> autolinks to [label](url).
    line = line.replace(/<(https?:\/\/[^>\s]+)>/g, (_whole, url) => {
      fixed++;
      return linkFor(url, titleByUrl[url]);
    });
    return line;
  });

  if (fixed) fs.writeFileSync(file, out.join('\n'));
  return fixed;
}

// --- main ----------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2);
  const json = args.includes('--json');
  const errorOnly = args.includes('--error-only');
  const fix = args.includes('--fix');
  const titles = args.includes('--titles');
  const targets = args.filter((a) => !a.startsWith('--'));
  const dirs = (targets.length ? targets : DEFAULT_DIRS).map((d) =>
    path.isAbsolute(d) ? d : path.join(ROOT, d)
  );

  const files = dirs.flatMap((d) =>
    fs.existsSync(d) && fs.statSync(d).isDirectory() ? walk(d) : (fs.existsSync(d) ? [d] : [])
  );

  // --- fix mode ---
  if (fix) {
    let total = 0, touched = 0;
    for (const f of files) {
      const n = await fixFile(f, { titles });
      if (n) { total += n; touched++; console.log(`  fixed ${n} bare URL(s) in ${path.relative(ROOT, f)}`); }
    }
    console.log(total
      ? `\n🔧 fixed ${total} bare URL(s) across ${touched} file(s)${titles ? ' (titles fetched)' : ''}.`
      : '✅ nothing to fix — no bare URLs found.');
    process.exit(0);
  }

  // --- scan mode ---
  // Build the corpus slug index once (from the full docs/ tree, regardless of
  // which paths were passed) so internal-link resolution sees every doc.
  const docsDir = path.join(ROOT, 'docs');
  const slugIndex = fs.existsSync(docsDir) ? buildSlugIndex(docsDir) : null;
  let all = files.flatMap((f) => scanFile(f, slugIndex).problems);
  if (errorOnly) all = all.filter((p) => p.severity === 'error');

  if (json) {
    console.log(JSON.stringify(all, null, 2));
    process.exit(all.length ? (errorOnly ? 2 : 1) : 0);
  }

  if (!all.length) {
    if (!errorOnly) console.log(`✅ link hygiene: scanned ${files.length} files, no problems found.`);
    process.exit(0);
  }

  const byKind = all.reduce((acc, p) => ((acc[p.kind] = (acc[p.kind] || 0) + 1), acc), {});
  const errs = all.filter((p) => p.severity === 'error').length;
  console.log(`🔗 link hygiene: ${all.length} problem(s) in ${files.length} files (${errs} error, ${all.length - errs} warn)\n`);
  for (const p of all) {
    const tag = p.severity === 'error' ? 'ERROR' : 'warn';
    console.log(`  ${p.file}:${p.line}  [${tag}:${p.kind}] ${p.detail}`);
    console.log(`      ↳ ${p.suggest}`);
  }
  console.log('\nSummary: ' + Object.entries(byKind).map(([k, n]) => `${k}=${n}`).join('  '));
  // --error-only exits 2 (hook-block signal); plain scan exits 1.
  process.exit(errorOnly ? 2 : 1);
}

main();
