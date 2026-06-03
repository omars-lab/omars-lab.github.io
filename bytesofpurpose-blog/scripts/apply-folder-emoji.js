#!/usr/bin/env node
// apply-folder-emoji.js — record a folder's sidebar emoji and stamp it onto the folder's
// docs. The deterministic half of the /suggest-emoji skill: the skill chooses the emoji
// interactively (AskUserQuestion), this script does the file mutations so they're exact,
// idempotent, and testable.
//
// Usage:
//   node scripts/apply-folder-emoji.js <relDir> <emoji> [--learn] [--dry-run]
//        [--override <docPathRelToDocs>=<emoji> ...]
//
//   <relDir>      folder path relative to docs/, instance included
//                 (e.g. craft/blogging/embed-diagrams)
//   <emoji>       the folder-default emoji (one leading emoji)
//   --learn       also persist relDir->emoji into scripts/lib/emoji-map.json `folders`
//                 (do this for NON-STANDARD folders so they become known; skip for folders
//                 already resolved by a kind/root — stamping the docs is enough there)
//   --override D=E apply emoji E to leaf doc D instead of the folder default (repeatable)
//   --dry-run     print what would change, write nothing
//
// What it stamps, per doc directly in <relDir> (non-recursive — subfolders are their own
// folders with their own emoji):
//   - prepends the emoji to BOTH `title:` and `sidebar_label:` when present
//   - if a doc has a `title:` but no `sidebar_label:`, only the title is stamped
//   - never double-prepends (idempotent: skips a label that already leads with an emoji)
//   - also stamps the folder's own `_category_.json` label if present and emoji-less
//
// It does NOT touch a doc whose label already leads with an emoji, and never edits a doc
// body (frontmatter only). MDX-safe: operates on the YAML frontmatter block only.

const fs = require('fs');
const path = require('path');
const { loadMap, MAP_PATH } = require('./lib/emoji-map.js');

const ROOT = path.join(__dirname, '..');
const DOCS = path.join(ROOT, 'docs');

// --- arg parse ----------------------------------------------------------
const argv = process.argv.slice(2);
const flags = { learn: false, dryRun: false, overrides: {} };
const positional = [];
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === '--learn') flags.learn = true;
  else if (a === '--dry-run') flags.dryRun = true;
  else if (a === '--override') {
    const pair = argv[++i] || '';
    const eq = pair.indexOf('=');
    if (eq === -1) { console.error(`bad --override (want DOC=EMOJI): ${pair}`); process.exit(1); }
    flags.overrides[pair.slice(0, eq).replace(/^docs\//, '')] = pair.slice(eq + 1);
  } else positional.push(a);
}
const relDir = (positional[0] || '').replace(/\\/g, '/').replace(/^\/+|\/+$/g, '').replace(/^docs\//, '');
const folderEmoji = positional[1] || '';
if (!relDir || !folderEmoji) {
  console.error('usage: apply-folder-emoji.js <relDir> <emoji> [--learn] [--dry-run] [--override DOC=EMOJI ...]');
  process.exit(1);
}

// Reuse the validator's emoji test so "already has an emoji" is judged identically.
function startsWithEmoji(str) {
  if (!str) return false;
  let s = String(str).trim();
  if (!s) return false;
  let cp = s.codePointAt(0);
  if (cp === 0xfe0e || cp === 0xfe0f) { s = s.slice(cp > 0xffff ? 2 : 1); cp = s.codePointAt(0); if (cp === undefined) return false; }
  return cp >= 0x1f000 || (cp >= 0x2190 && cp <= 0x2bff) || (cp >= 0x2600 && cp <= 0x27bf) || cp === 0x2b50 || cp === 0x2728;
}

const isDoc = (n) => /\.mdx?$/.test(n);
const changes = [];

// Prepend `emoji ` to a single quoted/bare YAML scalar value, preserving its quoting.
// Returns the new line, or null if the value already leads with an emoji / no match.
function stampFrontmatterField(block, field, emoji) {
  const re = new RegExp(`^(${field}:\\s*)(['"]?)(.*?)(\\2)\\s*$`, 'm');
  const m = block.match(re);
  if (!m) return null;
  const value = m[3];
  if (startsWithEmoji(value)) return null;       // idempotent
  const quote = m[2] || "'";                       // default to single-quote when bare
  const replaced = `${m[1]}${quote}${emoji} ${value}${quote}`;
  return block.replace(re, replaced);
}

function processDoc(file, emoji) {
  const raw = fs.readFileSync(file, 'utf8');
  if (!raw.startsWith('---')) return;
  const end = raw.indexOf('\n---', 3);
  if (end === -1) return;
  const fmEnd = end + 4;
  let block = raw.slice(0, fmEnd);
  const rest = raw.slice(fmEnd);

  const hasSidebar = /^sidebar_label:/m.test(block);
  const hasTitle = /^title:/m.test(block);
  let next = block;
  let touched = false;
  // Stamp BOTH title and sidebar_label (per the decision). The validator reads
  // sidebar_label||title, so sidebar_label is what clears the warning; title keeps the
  // sidebar + SEO consistent.
  if (hasSidebar) { const r = stampFrontmatterField(next, 'sidebar_label', emoji); if (r) { next = r; touched = true; } }
  if (hasTitle)   { const r = stampFrontmatterField(next, 'title', emoji);        if (r) { next = r; touched = true; } }

  if (touched) {
    changes.push({ file: path.relative(ROOT, file), emoji });
    if (!flags.dryRun) fs.writeFileSync(file, next + rest);
  }
}

function processCategory(dir, emoji) {
  const cp = path.join(dir, '_category_.json');
  if (!fs.existsSync(cp)) return;
  let cat;
  try { cat = JSON.parse(fs.readFileSync(cp, 'utf8')); } catch { return; }
  if (typeof cat.label !== 'string' || startsWithEmoji(cat.label)) return;
  cat.label = `${emoji} ${cat.label}`;
  changes.push({ file: path.relative(ROOT, cp), emoji });
  if (!flags.dryRun) fs.writeFileSync(cp, JSON.stringify(cat, null, 2) + '\n');
}

// --- run ---------------------------------------------------------------
const absDir = path.join(DOCS, relDir);
if (!fs.existsSync(absDir)) { console.error(`no such folder: docs/${relDir}`); process.exit(1); }

processCategory(absDir, folderEmoji);
for (const e of fs.readdirSync(absDir)) {
  if (!isDoc(e)) continue;
  const docRel = path.posix.join(relDir, e);
  const emoji = flags.overrides[docRel] || folderEmoji;
  processDoc(path.join(absDir, e), emoji);
}

// Persist the folder->emoji learning so the folder becomes "standard" next time.
if (flags.learn) {
  const map = loadMap();
  map.folders[relDir] = folderEmoji;
  // keep folders sorted for clean diffs
  const sorted = Object.fromEntries(Object.entries(map.folders).sort(([a], [b]) => a.localeCompare(b)));
  map.folders = sorted;
  if (!flags.dryRun) fs.writeFileSync(MAP_PATH, JSON.stringify(map, null, 2) + '\n');
  changes.push({ file: 'scripts/lib/emoji-map.json', emoji: `learned ${relDir} -> ${folderEmoji}` });
}

const verb = flags.dryRun ? 'would change' : 'changed';
console.log(`${verb} ${changes.length} file(s) for docs/${relDir} (default ${folderEmoji}${flags.learn ? ', learned' : ''}):`);
for (const c of changes) console.log(`  ${c.emoji}  ${c.file}`);
