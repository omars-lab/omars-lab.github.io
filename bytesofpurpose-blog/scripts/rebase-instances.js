#!/usr/bin/env node
/**
 * rebase-instances.js — rebase slugs + links for the split into two separate docs
 * INSTANCES (craft @ routeBasePath /craft, self @ /self). See the two-instances plan.
 *
 * Under a docs instance, a doc's permalink = routeBasePath + its slug. So slugs must be
 * RELATIVE to the instance root — the leading /craft or /self prefix is supplied by
 * routeBasePath and must be STRIPPED from the frontmatter slug (else it doubles:
 * /craft/craft/...). The instance ROOT README maps to slug '/' (→ permalink /craft).
 *
 *   docs/craft/generative-ai/README   slug /craft/generative-ai → /generative-ai
 *   docs/craft/README                  slug /craft              → /
 *   docs/self/faith/README             slug /self/faith         → /faith
 *
 * Cross-doc links also drop the /docs prefix: /docs/craft/X → /craft/X, /docs/self/X →
 * /self/X (the instance routes are NOT under /docs anymore).
 *
 *   --apply   rewrite slugs + links in docs/craft, docs/self, changelog/, blog/, src/
 *   --redirects  print {from:/docs/craft|self/..., to:/craft|self/...} preservation pairs
 */
const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const ROOT = path.resolve(__dirname, '..');
const DOCS = path.join(ROOT, 'docs');

function walk(dir, exts = /\.mdx?$/) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.')) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(full, exts));
    else if (exts.test(e.name)) out.push(full);
  }
  return out;
}

/** old absolute slug (/craft/... or /self/...) → new instance-relative slug. */
function rebaseSlug(oldSlug) {
  for (const root of ['/craft', '/self']) {
    if (oldSlug === root) return '/';
    if (oldSlug.startsWith(root + '/')) return oldSlug.slice(root.length); // keep leading '/'
  }
  return null; // not an instance slug
}

/** Map of OLD permalink (/docs/craft/..) → NEW permalink (/craft/..) for redirects + links. */
function buildPermalinkMap() {
  const map = new Map();
  for (const root of ['craft', 'self']) {
    for (const f of walk(path.join(DOCS, root))) {
      let slug;
      try { slug = matter(fs.readFileSync(f, 'utf8')).data.slug; } catch { continue; }
      if (typeof slug !== 'string') continue;
      const rebased = rebaseSlug(slug);
      if (rebased === null) continue;
      // OLD permalink was /docs + slug (e.g. /docs/craft/generative-ai).
      // NEW permalink is routeBasePath(/craft|self) + rebased (e.g. /craft/generative-ai).
      const oldPermalink = '/docs' + slug;
      const newPermalink = '/' + root + (rebased === '/' ? '' : rebased);
      map.set(oldPermalink, newPermalink);
    }
  }
  return map;
}

function cmd_apply() {
  // 1. Rewrite slugs in docs/craft + docs/self.
  let slugN = 0;
  for (const root of ['craft', 'self']) {
    for (const f of walk(path.join(DOCS, root))) {
      const raw = fs.readFileSync(f, 'utf8');
      const fence = raw.match(/^---\r?\n[\s\S]*?\r?\n---/);
      if (!fence) continue;
      const block = fence[0];
      const sm = block.match(/^slug:\s*(.+)$/m);
      if (!sm) continue;
      const oldSlug = sm[1].trim().replace(/^['"]|['"]$/g, '');
      const rebased = rebaseSlug(oldSlug);
      if (rebased === null || rebased === oldSlug) continue;
      const newBlock = block.replace(/^slug:\s*.*$/m, `slug: ${rebased}`);
      fs.writeFileSync(f, raw.replace(block, newBlock));
      slugN++;
    }
  }
  // 2. Rewrite cross-doc links everywhere: /docs/craft/X → /craft/X, /docs/self/X → /self/X.
  //    (Plain prefix swap on a segment boundary; the /docs root is gone for these.)
  const roots = [DOCS, path.join(ROOT, 'changelog'), path.join(ROOT, 'blog'),
    path.join(ROOT, 'src')].filter((d) => fs.existsSync(d));
  const exts = /\.(mdx?|tsx?|jsx?)$/;
  let linkN = 0, files = 0;
  for (const r of roots) {
    for (const f of walk(r, exts)) {
      let raw = fs.readFileSync(f, 'utf8');
      const before = raw;
      // /docs/craft and /docs/self → /craft, /self (only on a segment boundary).
      raw = raw.replace(/\/docs\/(craft|self)(?=[/"')\s#?]|$)/g, '/$1');
      if (raw !== before) { fs.writeFileSync(f, raw); linkN += 1; files++; }
    }
  }
  console.log(`Rebased ${slugN} slug(s); rewrote /docs/craft|self links in ${files} file(s).`);
}

function cmd_redirects() {
  const map = buildPermalinkMap();
  const pairs = [...map.entries()]
    .filter(([from, to]) => from !== to)
    .map(([from, to]) => ({ from, to }))
    .sort((a, b) => a.from.localeCompare(b.from));
  console.log(JSON.stringify(pairs, null, 2));
  console.log(`// ${pairs.length} instance-rebase redirect(s).`);
}

const arg = process.argv[2];
if (arg === '--apply') cmd_apply();
else if (arg === '--redirects') cmd_redirects();
else { console.error('usage: node scripts/rebase-instances.js [--apply|--redirects]'); process.exit(1); }
