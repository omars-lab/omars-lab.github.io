#!/usr/bin/env node
/**
 * migrate-ia.js — one-shot Information-Architecture migration engine for the
 * Craft/Self two-tier reorg (see .claude/plans/vectorized-enchanting-kurzweil.md).
 *
 * The 10 topic folders move under docs/craft/ and docs/self/, and every doc's
 * absolute slug is rewritten to MIRROR its new folder path (slug == folder path).
 *
 * Because today's slugs are *themed* and decoupled from folders, the old→new map
 * must be computed per-file. This script is the single source of truth for that map
 * and drives all the mechanical edits, in reviewable phases:
 *
 *   --plan           Print the old→new slug map + collision report. READ-ONLY.
 *                    Works BOTH pre-move (folders still at docs root) and post-move
 *                    (folders already under craft/self) — it derives the new slug
 *                    from the topic→parent map regardless of current location.
 *   --apply-slugs    Rewrite each doc's `slug:` frontmatter value to its new slug.
 *   --apply-links    Rewrite ](/docs/<oldslug>...) cross-doc links using the map.
 *   --emit-redirects Print the redirects array (new preservation pairs, with the
 *                    map applied transitively so existing redirects can be re-pointed
 *                    by hand against this output). READ-ONLY.
 *
 * Phases are idempotent: re-running --apply-slugs when slugs already match is a no-op.
 *
 * Slug rules (folder-path mirrored):
 *   - welcome/ is EXCLUDED (stays /welcome/intro).
 *   - A non-README doc docs/<parent>/<topic>/<sub...>/<file>.md(x)
 *        → /<parent>/<topic>/<sub...>/<file>
 *   - A README docs/<parent>/<topic>/<sub...>/README.md(x)
 *        → /<parent>/<topic>/<sub...>          (the folder it indexes; NO doubling)
 *   - Topic landing README docs/<parent>/<topic>/README.md(x) → /<parent>/<topic>
 *   - craft/self own READMEs → /craft, /self
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const matter = require('gray-matter');

const ROOT = path.resolve(__dirname, '..');
const DOCS = path.join(ROOT, 'docs');

// Fixed topic → parent assignment.
const CRAFT = ['generative-ai', 'software-development', 'product-management',
  'productivity', 'blogging', 'interview-prep', 'companies', 'entrepreneurship'];
const SELF = ['faith', 'personal-growth'];
const PARENT_OF = {};
for (const t of CRAFT) PARENT_OF[t] = 'craft';
for (const t of SELF) PARENT_OF[t] = 'self';

function walk(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('_') || e.name.startsWith('.')) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(full));
    else if (/\.mdx?$/.test(e.name)) out.push(full);
  }
  return out;
}

/**
 * Given a file's path relative to docs/, return its NEW folder-mirrored slug,
 * or null if the file is excluded from remapping (welcome, craft/self own roots).
 * Handles BOTH layouts:
 *   pre-move:  <topic>/<rest>            (topic at docs root)
 *   post-move: <parent>/<topic>/<rest>   (already under craft/self)
 */
function newSlugForRel(relPath) {
  const parts = relPath.split(path.sep);
  const top = parts[0];

  let parentParts;
  if (PARENT_OF[top]) {
    // pre-move: <topic>/...  → prepend parent
    parentParts = [PARENT_OF[top], ...parts];
  } else if ((top === 'craft' || top === 'self') && PARENT_OF[parts[1]]) {
    // post-move: <parent>/<topic>/...  → already parented
    parentParts = parts;
  } else {
    // welcome/ and the craft/self OWN README (parts[1] is README, not a topic)
    // are excluded from remapping.
    return null;
  }

  // Drop the README filename so a README maps to its folder.
  const last = parentParts[parentParts.length - 1];
  if (/^README\.mdx?$/i.test(last)) {
    parentParts = parentParts.slice(0, -1);
  } else {
    // strip extension on leaf file
    parentParts[parentParts.length - 1] = last.replace(/\.mdx?$/i, '');
  }
  return '/' + parentParts.join('/');
}

function readSlug(file) {
  try {
    return matter(fs.readFileSync(file, 'utf8')).data.slug || null;
  } catch {
    return null;
  }
}

/** Build the migration map from the current tree. */
function buildMap() {
  const files = walk(DOCS);
  const byFile = []; // {file, rel, oldSlug, newSlug}
  for (const file of files) {
    const rel = path.relative(DOCS, file);
    const newSlug = newSlugForRel(rel);
    if (newSlug === null) continue; // excluded
    const oldSlug = readSlug(file);
    byFile.push({ file, rel, oldSlug, newSlug });
  }
  return byFile;
}

function cmd_plan() {
  const map = buildMap();
  // Collision check: two files → same new slug.
  const seen = new Map();
  const collisions = [];
  for (const e of map) {
    if (seen.has(e.newSlug)) collisions.push([seen.get(e.newSlug), e.rel, e.newSlug]);
    else seen.set(e.newSlug, e.rel);
  }
  let changed = 0;
  for (const e of map) {
    const flag = e.oldSlug === e.newSlug ? '   ' : ' * ';
    if (e.oldSlug !== e.newSlug) changed++;
    console.log(`${flag}${e.oldSlug || '(none)'}  ->  ${e.newSlug}   [${e.rel}]`);
  }
  console.log(`\n${map.length} docs mapped, ${changed} slug(s) change, ${collisions.length} collision(s).`);
  if (collisions.length) {
    console.error('\nCOLLISIONS (two files → same new slug) — ABORT before applying:');
    for (const [a, b, s] of collisions) console.error(`  ${s}\n    ${a}\n    ${b}`);
    process.exit(2);
  }
}

function cmd_applySlugs() {
  const map = buildMap();
  let n = 0;
  for (const e of map) {
    if (e.oldSlug === e.newSlug) continue;
    const raw = fs.readFileSync(e.file, 'utf8');
    // Line-level replace of ONLY the slug value inside the frontmatter fence.
    const fence = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!fence) { console.warn(`SKIP (no frontmatter): ${e.rel}`); continue; }
    const block = fence[0];
    let newBlock;
    if (/^slug:\s*.*$/m.test(block)) {
      newBlock = block.replace(/^slug:\s*.*$/m, `slug: ${e.newSlug}`);
    } else {
      // insert slug as first frontmatter key
      newBlock = block.replace(/^---\r?\n/, `---\nslug: ${e.newSlug}\n`);
    }
    fs.writeFileSync(e.file, raw.replace(block, newBlock));
    n++;
  }
  console.log(`Rewrote slug on ${n} file(s).`);
}

/**
 * Build the old→new slug lookup from git renames. The OLD slug is read from the
 * pre-migration blob at HEAD (the only place it survives once frontmatter is
 * rewritten); the NEW slug is read from the current on-disk file. This makes the
 * link rewrite correct even after --apply-slugs has already run.
 * Returns { lookup: Map<oldSlug,newSlug>, draftNew: Set<newSlug> } — draftNew holds
 * the NEW slugs of docs that are draft:true (excluded from the prod build, so a
 * redirect must NOT point at them, or the build fails route validation).
 */
function lookupFromGit() {
  const repoRoot = execSync('git rev-parse --show-toplevel', { cwd: ROOT }).toString().trim();
  const status = execSync('git status --short --renames -- bytesofpurpose-blog/docs', {
    cwd: repoRoot, maxBuffer: 64 * 1024 * 1024,
  }).toString();
  const lookup = new Map();
  const draftNew = new Set();
  for (const line of status.split('\n')) {
    const m = line.match(/^R.\s+(\S.*?)\s+->\s+(\S.*)$/);
    if (!m) continue;
    const [, oldRel, newRel] = m;
    if (!/\.mdx?$/.test(newRel)) continue;
    let oldSlug = null, newSlug = null, newDraft = false;
    try { oldSlug = matter(execSync(`git show HEAD:"${oldRel}"`, { cwd: repoRoot, maxBuffer: 16 * 1024 * 1024 }).toString()).data.slug || null; } catch {}
    try {
      const d = matter(fs.readFileSync(path.join(repoRoot, newRel), 'utf8')).data;
      newSlug = d.slug || null;
      newDraft = d.draft === true;
    } catch {}
    if (oldSlug && newSlug && oldSlug !== newSlug) {
      lookup.set(oldSlug, newSlug);
      if (newDraft) draftNew.add(newSlug);
    }
  }
  return { lookup, draftNew };
}

function cmd_applyLinks() {
  const { lookup } = lookupFromGit();
  // Longest-old-slug-first so /development/foo wins over /development.
  const olds = [...lookup.keys()].sort((a, b) => b.length - a.length);

  // Rewrite cross-doc links wherever they appear: docs/, changelog/, AND blog/
  // (changelog + blog entries reference doc slugs too). All are markdown trees
  // under the site root.
  const roots = [DOCS, path.join(ROOT, 'changelog'), path.join(ROOT, 'blog')]
    .filter((d) => fs.existsSync(d));
  const files = roots.flatMap((d) => walk(d));
  let edits = 0, filesTouched = 0;
  for (const file of files) {
    let raw = fs.readFileSync(file, 'utf8');
    let before = raw;
    // Match markdown links to /docs/<path>[#anchor][?query]). The path class
    // excludes ) # ?; the optional suffix captures a #anchor or ?query that must
    // NOT contain ) (so a match can never span into the NEXT link on another line).
    raw = raw.replace(/\]\(\/docs(\/[A-Za-z0-9/_-]+)((?:[#?][^)\s]*)?)\)/g, (m, p, rest = '') => {
      // p is the slug part after /docs ; rest is '' or '#...' / '?...'.
      // Find the longest old-slug that p starts with on a segment boundary.
      for (const old of olds) {
        if (p === old || p.startsWith(old + '/')) {
          const tail = p.slice(old.length); // remaining path segments, if any
          edits++;
          return `](/docs${lookup.get(old)}${tail}${rest})`;
        }
      }
      return m;
    });
    if (raw !== before) { fs.writeFileSync(file, raw); filesTouched++; }
  }
  console.log(`Rewrote ${edits} link(s) across ${filesTouched} file(s).`);
}

// Legacy redirects that predate this migration. Their `to:` points at OLD themed
// slugs; we re-resolve each through the migration map so they land on the final
// /docs/craft|self/... URL (collapsing what would otherwise be a 2-hop chain the
// client-redirects plugin won't follow). `from:` values are unchanged.
const LEGACY_REDIRECTS = [
  ['/docs/mental-models/understanding-data-structs-and-algos/understanding-trees', '/docs/interview-prep/mental-models/data-structures-and-algorithms/understanding-trees'],
  ['/docs/mental-models/understanding-data-structs-and-algos/understanding-graphs', '/docs/interview-prep/mental-models/data-structures-and-algorithms/understanding-graphs'],
  ['/docs/mental-models/understanding-data-structs-and-algos/understanding-heaps', '/docs/interview-prep/mental-models/data-structures-and-algorithms/understanding-heaps'],
  ['/docs/mental-models/understanding-data-structs-and-algos/understanding-lists', '/docs/interview-prep/mental-models/data-structures-and-algorithms/understanding-lists'],
  ['/docs/mental-models/understanding-data-structs-and-algos/understanding-dynamic-programming', '/docs/interview-prep/mental-models/data-structures-and-algorithms/understanding-dynamic-programming'],
  ['/docs/mental-models/understanding-processes/understanding-the-interview-process', '/docs/interview-prep/mental-models/understanding-the-interview-process'],
  ['/docs/mental-models/understanding-career-levels/staff-engineer-traits', '/docs/companies/mental-models/career-levels/staff-engineer-traits'],
  ['/docs/mental-models/understanding-career-levels/understanding-sde-levels', '/docs/companies/mental-models/career-levels/understanding-sde-levels'],
  ['/docs/mental-models/understanding-skills/leadership-principles-companies-look-for', '/docs/companies/mental-models/skills/leadership-principles-companies-look-for'],
  ['/docs/mental-models/understanding-skills/technical-skills-interview-evaluation', '/docs/companies/mental-models/skills/technical-skills-interview-evaluation'],
  ['/docs/mental-models/understanding-skills/soft-skills-interview-evaluation', '/docs/companies/mental-models/skills/soft-skills-interview-evaluation'],
  ['/docs/mental-models/understanding-cultural-values/understanding-tech-company-culture', '/docs/companies/mental-models/cultural-values/understanding-tech-company-culture'],
  ['/docs/mental-models/understanding-cultural-values/understanding-zapier-values', '/docs/companies/mental-models/cultural-values/understanding-zapier-values'],
  ['/docs/mental-models/understanding-the-genai-domain/understanding-fundamentals-of-genai-systems', '/docs/generative-ai/mental-models/understanding-fundamentals-of-genai-systems'],
  ['/docs/mental-models/understanding-the-genai-domain/ai-engineer-world-fair-2025', '/docs/generative-ai/mental-models/ai-engineer-world-fair-2025'],
  ['/docs/mental-models/understanding-the-genai-domain/learning-about-genai', '/docs/generative-ai/mental-models/learning-about-genai'],
  ['/docs/mental-models/understanding-the-genai-domain/ai-framework-landscape', '/docs/generative-ai/mental-models/ai-framework-landscape'],
  ['/blog/docs-vs-blog-posts', '/docs/techniques/blogging-techniques/docs-vs-blog-posts'],
];

function cmd_emitRedirects() {
  const { lookup, draftNew } = lookupFromGit(); // slugs WITHOUT /docs prefix
  const pairs = [];
  let skippedDraft = 0;
  for (const [oldSlug, newSlug] of lookup) {
    // A draft target doesn't exist in the prod build → a redirect to it fails route
    // validation. The old URL was never live either (drafts are prod-excluded), so
    // there's nothing to preserve. Skip it.
    if (draftNew.has(newSlug)) { skippedDraft++; continue; }
    pairs.push({ from: '/docs' + oldSlug, to: '/docs' + newSlug });
  }
  pairs.sort((a, b) => a.from.localeCompare(b.from));

  // Resolve each legacy `to:` (a /docs-prefixed old themed URL) through the map.
  const resolve = (docsUrl) => {
    if (!docsUrl.startsWith('/docs/')) return docsUrl; // e.g. nothing to do
    const slug = docsUrl.slice('/docs'.length); // keep leading slash
    return lookup.has(slug) ? '/docs' + lookup.get(slug) : docsUrl;
  };
  const isDraftTarget = (docsUrl) => draftNew.has(docsUrl.replace(/^\/docs/, ''));
  const legacy = LEGACY_REDIRECTS
    .map(([from, to]) => {
      const resolved = resolve(to);
      return { from, to: resolved, _unresolved: resolved === to && to.startsWith('/docs/') };
    })
    .filter(({ to }) => { // drop legacy redirects whose target is a draft (prod-absent)
      if (isDraftTarget(to)) { skippedDraft++; return false; }
      return true;
    });

  console.log('// ===== PRESERVATION REDIRECTS (new) =====');
  console.log(JSON.stringify(pairs, null, 2));
  console.log(`// ${pairs.length} preservation redirect(s).\n`);
  console.log('// ===== LEGACY REDIRECTS (to: re-resolved through the map) =====');
  console.log(JSON.stringify(legacy.map(({ from, to }) => ({ from, to })), null, 2));
  console.log(`// ${legacy.length} legacy redirect(s); ${skippedDraft} skipped (draft target, prod-absent).`);
  const unresolved = legacy.filter(l => l._unresolved);
  if (unresolved.length) {
    console.error('\n// WARNING — legacy `to:` not found in map (verify by hand):');
    for (const u of unresolved) console.error('//   ' + u.from + ' -> ' + u.to);
  }
}

const arg = process.argv[2];
switch (arg) {
  case '--plan': cmd_plan(); break;
  case '--apply-slugs': cmd_applySlugs(); break;
  case '--apply-links': cmd_applyLinks(); break;
  case '--emit-redirects': cmd_emitRedirects(); break;
  default:
    console.error('usage: node scripts/migrate-ia.js [--plan|--apply-slugs|--apply-links|--emit-redirects]');
    process.exit(1);
}
