#!/usr/bin/env node

/**
 * validate-docs-structure.js — lints the topic-based docs information architecture.
 *
 * The docs/ tree is a TOPIC-based IA with a recurring folder contract (see the
 * review-reader-experience skill, "Topic-folder contract" section, and CLAUDE.md):
 *
 *   docs/
 *     1-welcome/            ← the topic index (Welcome); not itself a topic
 *     <N>-<topic>/          ← one root folder per reader-facing TOPIC
 *       README.{md,mdx}     ← topic landing, ABSOLUTE slug, _category_.json
 *       _category_.json     ← label + position
 *       vocabulary/         ← (optional) sorts FIRST
 *       <sub-folder>/       ← each carries a _category_.json; kebab-case
 *       prompts/            ← (optional) sorts LAST
 *
 * Invariants this checks (severity in []):
 *   absolute-slug   [ERROR] every doc has frontmatter `slug:` and it is ABSOLUTE (`/…`).
 *                           This is the whole URL-freeze guarantee — a relative slug
 *                           silently re-couples the URL to the folder path, so moving
 *                           the file moves the URL. Hook-blocking tier.
 *   topic-readme    [warn]  each root topic folder has a README.{md,mdx} with an
 *                           absolute slug + a _category_.json (label + position).
 *   subfolder-cat   [warn]  every sub-folder that contains docs has a _category_.json.
 *   orphan-cat      [warn]  a _category_.json in a dir with no docs AND no
 *                           docs-bearing descendants (pure dead category).
 *   kebab-case      [warn]  doc/dir names are kebab-case, no spaces/uppercase
 *                           (`_`-prefixed names like _TEMPLATE/_category_ are exempt).
 *   framing-folder  [warn]  no framing-word / topic-echo sub-folder names
 *                           (`*-techniques`, `*-craftsmanship`, `definitions`).
 *   depth           [warn]  folder depth ≤ 3 under a topic root.
 *   vocab-first     [warn]  a `vocabulary/` category sorts first (low position).
 *   prompts-last    [warn]  a `prompts/` category sorts last (high position).
 *   welcome-drift   [warn]  the Welcome topic-index cards (`### [Label](slug)`) match
 *                           the actual root topic folders + their README slugs.
 *
 * Usage:
 *   node scripts/validate-docs-structure.js [paths…]   # scan (default: docs/)
 *   node scripts/validate-docs-structure.js --json      # machine-readable findings
 *   node scripts/validate-docs-structure.js --error-only # ERROR-tier only; exit 2 (hook)
 *
 * Exit codes: 0 clean · 1 problems found (scan) · 2 ERROR-tier found (--error-only).
 */

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const ROOT = path.join(__dirname, '..');
const DOCS = path.join(ROOT, 'docs');
const WELCOME = 'docs/1-welcome';

const SEVERITY = {
  'absolute-slug': 'error',
  'topic-readme': 'warn',
  'subfolder-cat': 'warn',
  'orphan-cat': 'warn',
  'kebab-case': 'warn',
  'framing-folder': 'warn',
  depth: 'warn',
  'vocab-first': 'warn',
  'prompts-last': 'warn',
  'welcome-drift': 'warn',
};

// Folder names that echo a format/framing word instead of a reader topic.
const FRAMING_RE = /-techniques$|-craftsmanship$|^definitions$/;
const KEBAB_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const isDoc = (n) => /\.mdx?$/.test(n);
const isReadme = (n) => /^README\.mdx?$/.test(n);

const findings = [];
const add = (kind, loc, detail) =>
  findings.push({ kind, severity: SEVERITY[kind], loc, detail });

// --- fs helpers ----------------------------------------------------------

function listDir(dir) {
  try {
    return fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
}
const rel = (p) => path.relative(ROOT, p);

/** docs directly in dir (md/mdx, excluding nothing — README counts as a doc). */
function docsIn(dir) {
  return listDir(dir).filter((e) => e.isFile() && isDoc(e.name));
}
/** any doc in dir or any descendant. */
function hasDocsDeep(dir) {
  const entries = listDir(dir);
  if (entries.some((e) => e.isFile() && isDoc(e.name))) return true;
  return entries.some((e) => e.isDirectory() && hasDocsDeep(path.join(dir, e.name)));
}
const hasCategory = (dir) => fs.existsSync(path.join(dir, '_category_.json'));

function readCategory(dir) {
  try {
    return JSON.parse(fs.readFileSync(path.join(dir, '_category_.json'), 'utf8'));
  } catch {
    return null;
  }
}

// --- per-doc check: absolute slug ---------------------------------------

function checkDoc(file) {
  let data;
  try {
    data = matter(fs.readFileSync(file, 'utf8')).data;
  } catch {
    return; // unparseable frontmatter — leave to MDX build
  }
  if (!('slug' in data) || data.slug === undefined || data.slug === null || data.slug === '') {
    add('absolute-slug', rel(file), 'doc has no frontmatter `slug:` — add an absolute slug (`slug: /…`)');
    return;
  }
  if (typeof data.slug !== 'string' || !data.slug.startsWith('/')) {
    add('absolute-slug', rel(file),
      `slug "${data.slug}" is relative — make it absolute (\`slug: /…\`) so the URL is pinned to a value, not the folder path`);
  }
}

// --- recurse the tree, applying structural checks ------------------------

/** Walk every dir under docs/, collecting structural findings. depthFromTopic:
 *  -1 above topics, 0 at a topic root, 1+ inside. */
function walkDir(dir, depthFromTopic, topicName) {
  const entries = listDir(dir);

  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isFile()) {
      if (!isDoc(e.name)) continue; // only lint markdown/MDX docs (ignore .DS_Store, assets, etc.)
      checkDoc(full);
      // kebab-case on doc filenames (drop extension; exempt _-prefixed + README)
      const base = e.name.replace(/\.mdx?$/, '');
      if (!base.startsWith('_') && !isReadme(e.name) && !KEBAB_RE.test(base)) {
        add('kebab-case', rel(full), `filename "${e.name}" is not kebab-case`);
      }
      continue;
    }
    if (!e.isDirectory()) continue;

    const childDepth = depthFromTopic + 1;

    // kebab-case on directory names (skip the numbered topic roots at depth 0)
    if (depthFromTopic >= 0 && !e.name.startsWith('_')) {
      // strip an optional numeric ordering prefix (e.g. 6-projects) before testing
      const nameNoPrefix = e.name.replace(/^\d+-/, '');
      if (!KEBAB_RE.test(nameNoPrefix)) {
        add('kebab-case', rel(full), `folder "${e.name}" is not kebab-case`);
      }
      // framing-word / topic-echo folder names
      if (FRAMING_RE.test(nameNoPrefix)) {
        add('framing-folder', rel(full),
          `folder "${e.name}" is a framing-word/topic-echo name — prefer a reader-facing topic noun`);
      }
    }

    // depth ≤ 3 under a topic root (topic root = depth 0; flag a folder at depth 4+)
    if (childDepth >= 4) {
      add('depth', rel(full), `folder is ${childDepth} levels under topic "${topicName}" (contract: ≤3)`);
    }

    // sub-folder category presence + orphan check
    if (childDepth >= 1) {
      const directDocs = docsIn(full).length;
      if (directDocs > 0 && !hasCategory(full)) {
        add('subfolder-cat', rel(full), 'sub-folder contains docs but has no _category_.json');
      }
      if (hasCategory(full) && !hasDocsDeep(full)) {
        add('orphan-cat', rel(full), '_category_.json in a folder with no docs and no docs-bearing descendants (orphan)');
      }
      // vocabulary-first / prompts-last position conventions
      if (hasCategory(full)) {
        const base = e.name.replace(/^\d+-/, '');
        const cat = readCategory(full);
        const pos = cat && typeof cat.position === 'number' ? cat.position : null;
        if (base === 'vocabulary' && pos !== null && pos > 2) {
          add('vocab-first', rel(full), `vocabulary/ has position ${pos} — convention sorts it FIRST (low position)`);
        }
        if (base === 'prompts' && pos !== null && pos < 5) {
          add('prompts-last', rel(full), `prompts/ has position ${pos} — convention sorts it LAST (high position)`);
        }
      }
    }

    // When descending from above-topics (depth -1) the child IS the topic root.
    const childTopic = depthFromTopic === -1 ? e.name : topicName;
    walkDir(full, childDepth, childTopic);
  }
}

// --- topic-root checks + Welcome drift -----------------------------------

function topicFolders() {
  return listDir(DOCS)
    .filter((e) => e.isDirectory() && /^\d+-/.test(e.name) && e.name !== '1-welcome')
    .map((e) => e.name)
    .sort();
}

function topicReadmeSlug(topic) {
  for (const r of ['README.md', 'README.mdx']) {
    const f = path.join(DOCS, topic, r);
    if (fs.existsSync(f)) {
      try {
        return matter(fs.readFileSync(f, 'utf8')).data.slug || null;
      } catch {
        return null;
      }
    }
  }
  return undefined; // no README at all
}

function checkTopicRoots() {
  for (const topic of topicFolders()) {
    const dir = path.join(DOCS, topic);
    const slug = topicReadmeSlug(topic);
    if (slug === undefined) {
      add('topic-readme', rel(dir), 'topic folder has no README.{md,mdx} landing page');
    } else if (!slug || typeof slug !== 'string' || !slug.startsWith('/')) {
      add('topic-readme', rel(dir), `topic README slug "${slug}" is missing or not absolute`);
    }
    if (!hasCategory(dir)) {
      add('topic-readme', rel(dir), 'topic folder has no _category_.json (label + position)');
    }
  }
}

/** Welcome cards: `### …[Label](/docs/<slug>)`. Drift vs topic README slugs. */
function checkWelcomeDrift() {
  const welcomeDir = path.join(ROOT, WELCOME);
  let readme;
  for (const r of ['README.md', 'README.mdx']) {
    if (fs.existsSync(path.join(welcomeDir, r))) { readme = path.join(welcomeDir, r); break; }
  }
  if (!readme) {
    add('welcome-drift', WELCOME, 'no Welcome README to compare topic cards against');
    return;
  }
  const src = fs.readFileSync(readme, 'utf8');
  const cardSlugs = new Set();
  const re = /^###\s+.*\]\((\/docs\/[^)\s]+)\)/gm;
  let m;
  while ((m = re.exec(src)) !== null) {
    cardSlugs.add(m[1].replace(/^\/docs/, '')); // → /generative-ai etc.
  }
  const topicSlugs = new Set();
  for (const topic of topicFolders()) {
    const s = topicReadmeSlug(topic);
    if (typeof s === 'string') topicSlugs.add(s);
  }
  for (const s of topicSlugs) {
    if (!cardSlugs.has(s)) {
      add('welcome-drift', `${WELCOME}/README`, `topic slug ${s} has no matching card in the Welcome index`);
    }
  }
  for (const s of cardSlugs) {
    if (!topicSlugs.has(s)) {
      add('welcome-drift', `${WELCOME}/README`, `Welcome card links /docs${s} but no topic README owns that slug`);
    }
  }
}

// --- main ----------------------------------------------------------------

function main() {
  const args = process.argv.slice(2);
  const json = args.includes('--json');
  const errorOnly = args.includes('--error-only');
  const targets = args.filter((a) => !a.startsWith('--'));

  if (targets.length) {
    // Scoped run (hook): only per-doc slug checks on the given files (fast, no tree walk).
    for (const t of targets) {
      const abs = path.isAbsolute(t) ? t : path.join(process.cwd(), t);
      if (fs.existsSync(abs) && fs.statSync(abs).isFile() && isDoc(abs)) checkDoc(abs);
    }
  } else {
    // Full run.
    walkDir(DOCS, -1, null);
    checkTopicRoots();
    checkWelcomeDrift();
  }

  let out = findings;
  if (errorOnly) out = out.filter((f) => f.severity === 'error');

  if (json) {
    console.log(JSON.stringify(out, null, 2));
    process.exit(out.length ? (errorOnly ? 2 : 1) : 0);
  }

  if (!out.length) {
    if (!errorOnly) console.log('✅ docs structure: no problems found.');
    process.exit(0);
  }

  const errs = out.filter((f) => f.severity === 'error').length;
  console.log(`🏗  docs structure: ${out.length} problem(s) (${errs} error, ${out.length - errs} warn)\n`);
  const byKind = {};
  for (const f of out) {
    byKind[f.kind] = (byKind[f.kind] || 0) + 1;
    const tag = f.severity === 'error' ? 'ERROR' : 'warn';
    console.log(`  ${f.loc}  [${tag}:${f.kind}] ${f.detail}`);
  }
  console.log('\nSummary: ' + Object.entries(byKind).map(([k, n]) => `${k}=${n}`).join('  '));
  process.exit(errorOnly ? 2 : 1);
}

main();
