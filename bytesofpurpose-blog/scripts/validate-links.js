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
 *   link-to-deprecated  A page links to a `deprecated: true` page. The target    [WARN]
 *                    still resolves (deprecated pages ship), so it's not broken —
 *                    but linking readers into deprecated content is a smell.
 *   test-stale-slug  A test/e2e file (`goto('/docs/…')`, README) references a     [WARN]
 *                    /docs/<slug> that resolves to no doc — an IA move changed it.
 *                    A redirect keeps users working but lands the test on the
 *                    redirect STUB → spurious timeout. Catch it here, not in CI.
 *   broken-anchor    A link to a section (`/craft/…#id`, or `#id` on the same    [ERROR]
 *                    page) whose page EXISTS but has no heading or element with
 *                    that id. Source-level version of onBrokenAnchors. When the
 *                    run is scoped to files (the hook), links from the rest of the
 *                    corpus INTO those files are checked too, so renaming a
 *                    heading that other pages link to is caught on the edit.
 *
 * The internal-link checks are cross-file: they build a whole-corpus route index
 * (each docs instance's folder → its routeBasePath, plus the legacy /docs prefix)
 * and resolve every internal link against it. broken-internal / link-to-draft are
 * warn-tier by decision — advisory, never blocking, since a draft may intentionally
 * forward-link to a not-yet-published page. broken-anchor is error-tier: the page
 * is there, so a missing section is a checkable fact, not a judgment call. Opt a
 * line out with a `validate-links-ignore` comment on it or the line above.
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
 * Exit codes: 0 clean · 1 WARN-tier only (advisory) · 2 any ERROR-tier finding.
 * Same contract as validate-docs-structure.js, so `make validate-links` can pass on
 * warnings and fail only on errors (--error-only also exits 2, for the hook).
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
  'link-to-deprecated': 'warn', // a link points at a deprecated: true page (still live; a smell)
  // e2e specs hardcode doc slugs in goto()/baseURL refs. When an IA move changes a
  // slug, a redirect keeps real users working but lands the test on the redirect
  // STUB (no canvas/content) → spurious timeout. Catch the stale slug here, at
  // `make validate-links` time, instead of in a multi-minute regression run.
  'test-stale-slug': 'warn', // a test/ file references a /docs/<slug> that no longer exists
  'broken-anchor': 'error',  // a #fragment on an existing page that names no heading/id there
};

// Legacy prefix: an internal link `/docs/<X>` maps to a doc whose absolute slug is `/<X>`.
const DOCS_ROUTE_PREFIX = '/docs';
// The live docs instances (docusaurus.config.js `plugin-content-docs` entries):
// content folder → routeBasePath. A doc in `dir` is served at `route` + its slug.
// The blog instances (/initiatives, /thoughts, /mindset, …) route by date, not slug,
// so they stay unresolved, as before.
const DOCS_INSTANCES = [
  { dir: 'docs/craft', route: '/craft' },
  { dir: 'docs/journey', route: '/journey' },
  { dir: 'docs/handbook', route: '/handbook' },
  { dir: 'docs/knowledge', route: '/knowledge' },
  { dir: 'docs/habits', route: '/habits' },
];
const INTERNAL_PREFIXES = [DOCS_ROUTE_PREFIX, ...DOCS_INSTANCES.map((i) => i.route)];
const isInternalRoute = (url) =>
  !/\/tags(\/|$|#)/.test(url) && // tag index pages are generated, not docs
  INTERNAL_PREFIXES.some((p) => url === p || url.startsWith(p + '/') || url.startsWith(p + '#'));

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

function walk(dir, acc = [], ext = /\.mdx?$/) {
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
      walk(full, acc, ext);
    } else if (ext.test(e.name)) {
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
 * Maps a normalized route ("/<slug-without-leading-slash>") → { rel, draft, deprecated }.
 * Only docs carry author-controlled absolute slugs we link to via /docs/…, so
 * we index the docs/ tree (the only space these /docs/ links can target).
 * Returns { byRoute, hasAnyDoc }.
 */
function buildSlugIndex(docsDir) {
  const byRoute = new Map();
  const files = walk(docsDir);
  const entryFor = (f, fm) => ({
    rel: path.relative(ROOT, f),
    file: f,
    draft: (fmField(fm, 'draft') || '').toLowerCase() === 'true',
    deprecated: (fmField(fm, 'deprecated') || '').toLowerCase() === 'true',
  });
  for (const f of files) {
    const fm = readFrontmatter(f);
    const slug = fmField(fm, 'slug');
    if (!slug || !slug.startsWith('/')) continue; // only absolute-slug docs are addressable
    // Route the doc is served at, minus the /docs prefix, normalized (no trailing slash).
    const route = (DOCS_ROUTE_PREFIX + slug).replace(/\/+$/, '');
    byRoute.set(route, entryFor(f, fm));
  }
  // The live routes: each instance's routeBasePath + the doc's slug (absolute), or
  // its folder path + relative slug / id / file name (Docusaurus's default).
  for (const inst of DOCS_INSTANCES) {
    const instDir = path.join(ROOT, inst.dir);
    for (const f of walk(instDir)) {
      const fm = readFrontmatter(f);
      const slug = fmField(fm, 'slug');
      const dirRoute = path.relative(instDir, path.dirname(f)).split(path.sep).filter(Boolean)
        .map((s) => s.replace(/^\d+[-_.]/, '')).join('/');
      const base = path.basename(f).replace(/\.mdx?$/, '');
      let route;
      if (slug && slug.startsWith('/')) route = inst.route + slug;
      else if (slug) route = `${inst.route}/${dirRoute}/${slug}`;
      else if (/^(readme|index)$/i.test(base)) route = `${inst.route}/${dirRoute}`;
      else route = `${inst.route}/${dirRoute}/${fmField(fm, 'id') || base.replace(/^\d+[-_.]/, '')}`;
      route = route.replace(/\/+/g, '/').replace(/\/+$/, '') || '/';
      byRoute.set(route, entryFor(f, fm));
    }
  }
  return { byRoute, hasAnyDoc: files.length > 0 };
}

/**
 * The anchor ids a page offers: every heading (explicit `{#id}`, else the heading
 * text slugged the way Docusaurus does, with -1/-2 for repeats) plus any literal
 * `id="…"` / `name="…"` attribute. Cached per file.
 */
const anchorCache = new Map();
function anchorsOf(file) {
  if (anchorCache.has(file)) return anchorCache.get(file);
  const GithubSlugger = require('github-slugger');
  const slugger = new GithubSlugger();
  const ids = new Set();
  const state = { inFence: false, inComment: null };
  let inFrontmatter = false;
  fs.readFileSync(file, 'utf8').split('\n').forEach((raw, i) => {
    if (i === 0 && raw.trim() === '---') { inFrontmatter = true; return; }
    if (inFrontmatter) { if (raw.trim() === '---') inFrontmatter = false; return; }
    const wasFenced = state.inFence || /^\s*```/.test(raw);
    maskCode(raw, state);
    if (wasFenced) return;
    const h = raw.match(/^\s{0,3}#{1,6}\s+(.*?)\s*#*\s*$/);
    if (h) {
      const explicit = h[1].match(/\{#([^}\s]+)\}\s*$/);
      if (explicit) ids.add(explicit[1]);
      else {
        const text = h[1]
          .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1') // [text](url) → text
          .replace(/<[^>]+>/g, '')                   // inline tags
          .replace(/[`*_~]/g, '');                   // code / emphasis marks
        ids.add(slugger.slug(text));
      }
    }
    for (const m of raw.matchAll(/\b(?:id|name)=["']([^"']+)["']/g)) ids.add(m[1]);
  });
  anchorCache.set(file, ids);
  return ids;
}

/** A `validate-links-ignore` comment on this line or the one above opts it out. */
const lineIgnored = (lines, i) =>
  /validate-links-ignore/.test(lines[i] || '') || /validate-links-ignore/.test(lines[i - 1] || '');

/** The broken-anchor finding for `url` (a #fragment link), or null if it resolves. */
function anchorProblem(url, targetFile, rel, lineNo) {
  const hash = url.indexOf('#');
  if (hash === -1) return null;
  let frag = url.slice(hash + 1);
  try { frag = decodeURIComponent(frag); } catch { /* keep raw */ }
  if (!frag || anchorsOf(targetFile).has(frag)) return null;
  const target = path.relative(ROOT, targetFile);
  return {
    file: rel, line: lineNo, kind: 'broken-anchor', severity: SEVERITY['broken-anchor'],
    target, detail: `link → #${frag} names no heading or id on ${target}`,
    suggest: `point at a heading that exists there, or give the target heading an explicit id: "## Title {#${frag}}"`,
  };
}

/**
 * Validate /docs/<slug> references hardcoded in e2e tests + the test README against
 * the corpus slug index. Playwright specs `goto('/docs/…')` at literal slugs; an IA
 * move that changes a slug leaves the test pointing at a redirect stub (no real page
 * content) → spurious timeout in regression. We resolve each referenced route the same
 * way the markdown check does, tolerating a trailing `${hash}`/template tail and a
 * trailing slash. Scans test/e2e/*.spec.ts + test/e2e/*.md (README) only.
 */
function checkTestSlugs(slugIndex) {
  const problems = [];
  if (!slugIndex || !slugIndex.byRoute.size) return problems;
  const testDir = path.join(ROOT, 'test', 'e2e');
  if (!fs.existsSync(testDir)) return problems;
  const files = walk(testDir, [], /\.(spec\.ts|md|mdx)$/);
  // Only flag /docs/<path> inside a QUOTE or BACKTICK — i.e. an actual navigated URL
  // (goto('/docs/…'), `/docs/…${hash}`), not prose like "home/blog/docs/post". The
  // opening quote/backtick is captured so we don't match bare slashes in sentences.
  const re = /['"`](\/docs\/[A-Za-z0-9/_-]+)/g;
  for (const f of files) {
    const lines = fs.readFileSync(f, 'utf8').split('\n');
    lines.forEach((line, i) => {
      // Escape hatch: a test that DELIBERATELY navigates to a missing/draft route
      // (e.g. asserting a 404) opts out with a `validate-links-ignore` comment on the
      // line or the line above.
      if (/validate-links-ignore/.test(line) || /validate-links-ignore/.test(lines[i - 1] || '')) return;
      let m;
      while ((m = re.exec(line)) !== null) {
        const route = m[1].replace(/\/+$/, '');
        if (slugIndex.byRoute.has(route)) continue;       // resolves to a real doc ✓
        problems.push({
          file: path.relative(ROOT, f), line: i + 1, kind: 'test-stale-slug',
          severity: SEVERITY['test-stale-slug'],
          detail: `test references ${m[1]} which resolves to no published doc slug — an IA move likely changed it`,
          suggest: 'point the test at the new slug (a redirect keeps users working but lands the test on the stub → timeout)',
        });
      }
    });
  }
  return problems;
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
      // Targets we resolve: site-internal docs links (/craft/…, /journey/…, the
      // legacy /docs/…) and same-page #anchors. We ignore external (http),
      // protocol-relative (//), and other route bases (e.g. /initiatives).
      if (slugIndex && url.startsWith('#') && !lineIgnored(lines, i)) {
        const p = anchorProblem(url, file, rel, lineNo);
        if (p) problems.push(p);
      }
      if (slugIndex && isInternalRoute(url)) {
        // Normalize: drop #fragment, ?query, trailing slash.
        const route = url.replace(/[?#].*$/, '').replace(/\/+$/, '');
        const hit = slugIndex.byRoute.get(route);
        if (hit && !lineIgnored(lines, i)) {
          const p = anchorProblem(url, hit.file, rel, lineNo);
          if (p) problems.push(p);
        }
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
        } else if (hit.deprecated) {
          // The target resolves (deprecated pages ship), so it's not broken — but a link
          // INTO deprecated content is a smell. Flagged for any live target (not draft:
          // a draft→deprecated link isn't shipped yet, but the draft branch already caught
          // draft targets, so reaching here means the target is a live deprecated page).
          problems.push({
            file: rel, line: lineNo, kind: 'link-to-deprecated', severity: SEVERITY['link-to-deprecated'],
            detail: `link points at a deprecated page (${hit.rel} has deprecated: true)`,
            suggest: 'point at the replacement (deprecated_for) instead, or drop the link',
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

    // A markdown REFERENCE-LINK DEFINITION (`[label]: https://… "optional title"`) is a
    // legitimate way to carry a URL — it's not a bare inline URL. Skip the bare-url scan
    // for such lines (the `[label][...]`/`[label]` use sites elsewhere render as links).
    if (/^\s{0,3}\[[^\]]+\]:\s*<?https?:\/\/\S+>?(\s+("[^"]*"|'[^']*'|\([^)]*\)))?\s*$/.test(raw)) {
      return;
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
  // Stale-slug guard over the e2e tests (only on a full default scan — skip when the
  // caller passed explicit target paths, so a scoped/hook run stays scoped).
  if (!targets.length) all = all.concat(checkTestSlugs(slugIndex));
  // Scoped run (the hook): also check links from the rest of the corpus INTO the
  // scanned files, so renaming a heading other pages link to fails on that edit.
  if (targets.length && slugIndex) {
    const scanned = new Set(files.map((f) => path.relative(ROOT, f)));
    const routesIn = [...slugIndex.byRoute].filter(([, e]) => scanned.has(e.rel)).map(([r]) => r + '#');
    for (const f of DEFAULT_DIRS.flatMap((d) => walk(path.join(ROOT, d)))) {
      if (scanned.has(path.relative(ROOT, f))) continue;
      const text = fs.readFileSync(f, 'utf8');
      if (!routesIn.some((r) => text.includes(r))) continue; // cheap pre-filter
      all = all.concat(scanFile(f, slugIndex).problems
        .filter((p) => p.kind === 'broken-anchor' && scanned.has(p.target)));
    }
  }
  if (errorOnly) all = all.filter((p) => p.severity === 'error');

  // 2 when any ERROR-tier finding is present, 1 when only WARN-tier, 0 clean.
  const exitCode = !all.length ? 0 : all.some((p) => p.severity === 'error') ? 2 : 1;

  if (json) {
    console.log(JSON.stringify(all, null, 2));
    process.exit(exitCode);
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
  // ERROR-tier → 2 (fails the gate / blocks the hook); WARN-only → 1 (advisory).
  process.exit(exitCode);
}

// A crash must not look like "warn-only" (exit 1): Node exits 1 on an unhandled
// rejection, so catch it and exit 3, which `make validate-links` treats as a failure.
main().catch((e) => { console.error(e); process.exit(3); });
