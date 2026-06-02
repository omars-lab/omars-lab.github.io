// Shared helper: enumerate premium docs (`premium: true` frontmatter) and derive
// each one's built permalink + on-disk HTML path. Used by BOTH the build-time
// encrypt step (scripts/encrypt-premium.js) and the blocking verify gate
// (scripts/verify-premium-encrypted.js) so the two can never disagree about which
// pages are premium or where their HTML lands.
//
// Permalink derivation mirrors plugins/draft-docs/index.js EXACTLY (instance-relative
// slugs; first path segment under docs/ = the instance routeBasePath /craft|/self).
// Keep the two in lockstep — see the premium-content-gating design.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const matter = require('gray-matter');

const SITE_ROOT = path.join(__dirname, '..', '..');
const DOCS_DIR = path.join(SITE_ROOT, 'docs');

// Sidecar payload id for a premium doc — MUST match plugins/rehype-premium-encrypt.js
// (sha1 of the source path relative to the site root, first 16 hex chars). Keep in lockstep.
function payloadIdFor(sourcePath) {
  const rel = path.relative(SITE_ROOT, sourcePath || 'unknown');
  return crypto.createHash('sha1').update(rel).digest('hex').slice(0, 16);
}

function stripPrefix(seg) {
  return seg.replace(/^\d+-/, '');
}

// IDENTICAL to plugins/draft-docs/index.js toPermalink — see that file's comment.
function toPermalink(fullPath, docsDir, data) {
  const rel = path.relative(docsDir, fullPath).replace(/\.mdx?$/, '');
  const segs = rel.split(path.sep).map(stripPrefix);
  const instance = segs[0];
  const base = `/${instance}`;
  const bodySegs = segs.slice(1);
  const fileSeg = bodySegs.pop();
  const isIndex = fileSeg === undefined || /^(readme|index)$/i.test(fileSeg);
  if (data.slug) {
    const slug = String(data.slug);
    if (slug.startsWith('/')) {
      return slug === '/' ? base : `${base}${slug}`;
    }
    return [base, ...bodySegs, slug].join('/');
  }
  if (isIndex) return [base, ...bodySegs].join('/') || base;
  return [base, ...bodySegs, fileSeg].join('/');
}

// Map a permalink (/craft/foo) to the built HTML file Docusaurus emits. With
// trailingSlash undefined (the default), a route /craft/foo is written as
// build/craft/foo/index.html (directory style) — but a top-level instance root
// like /craft is build/craft/index.html. We probe both shapes.
function htmlPathsFor(permalink, buildDir) {
  const clean = permalink.replace(/\/+$/, '');
  const rel = clean.replace(/^\/+/, '');
  return [
    path.join(buildDir, rel, 'index.html'),
    path.join(buildDir, `${rel}.html`),
  ];
}

// Pick distinctive body tokens to assert ABSENCE of in the build. Strips MDX/markdown
// punctuation, drops anything that appears in the teaser (the teaser ships in clear by
// design), and returns the longest unique tokens (long tokens are unlikely to collide with
// framework/boilerplate strings). Empty array → caller falls back to structural checks only.
function bodyFingerprints(content, teaser) {
  const teaserTokens = new Set(
    String(teaser)
      .toLowerCase()
      .split(/[^a-z0-9]+/i)
      .filter(Boolean),
  );
  const tokens = String(content)
    .split(/[^A-Za-z0-9]+/)
    .filter((t) => t.length >= 12 && !teaserTokens.has(t.toLowerCase()));
  // Unique, longest-first, cap at 5.
  return [...new Set(tokens)].sort((a, b) => b.length - a.length).slice(0, 5);
}

/**
 * Walk docs/, returning one entry per `premium: true` doc:
 *   { source, permalink, teaser, payloadId, fingerprints }.
 */
function collectPremiumDocs(docsDir = DOCS_DIR) {
  const out = [];
  if (!fs.existsSync(docsDir)) return out;
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, {withFileTypes: true})) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        walk(full);
        continue;
      }
      if (!/\.mdx?$/.test(e.name)) continue;
      let data;
      try {
        ({data} = matter(fs.readFileSync(full, 'utf8')));
      } catch {
        continue;
      }
      if (data.premium === true) {
        const teaser =
          (typeof data.premium_teaser === 'string' && data.premium_teaser.trim()) ||
          (typeof data.description === 'string' && data.description.trim()) ||
          '';
        const {content} = matter(fs.readFileSync(full, 'utf8'));
        out.push({
          source: full,
          permalink: toPermalink(full, docsDir, data),
          teaser,
          payloadId: payloadIdFor(full),
          // Distinctive body fingerprints: the longest "word-ish" tokens from the doc body
          // (excluding the teaser, which legitimately ships in clear). If any of these
          // appears in the built HTML/JS, the body leaked. Used by the V5 gate.
          fingerprints: bodyFingerprints(content, teaser),
        });
      }
    }
  };
  walk(docsDir);
  return out;
}

module.exports = {
  SITE_ROOT,
  DOCS_DIR,
  toPermalink,
  htmlPathsFor,
  payloadIdFor,
  collectPremiumDocs,
};
