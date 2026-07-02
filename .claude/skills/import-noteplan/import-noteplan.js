#!/usr/bin/env node
/**
 * import-noteplan.js — the deterministic, idempotent transformer behind the
 * `import-noteplan` skill.
 *
 * It does ONLY the mechanical, safe parts of migrating NotePlan Lists content
 * onto the blog. All judgment (what a link IS, where it goes, its kind) stays
 * with the human/agent. This script never edits blog content.
 *
 * The one hard rule: NotePlan files are APPEND-ONLY. We copy content OUT and
 * append a "🔗 Migrated to Blog" provenance table; we never cut existing lines.
 * `--verify` proves the pre-marker body is byte-identical, fail-closed.
 *
 * Subcommands:
 *   --inventory <file>                  → JSON of links/sections/task-state (stdout)
 *   --append-migration <file> --records <json>  → append/extend the migration table
 *   --verify <file> --baseline <file>   → assert body above the marker is byte-identical
 *
 * Emoji filenames (🏡📋 References[GenAI].md) are handled via absolute paths;
 * never rely on shell globbing.
 */

'use strict';

const fs = require('fs');
const path = require('path');

// The managed, append-only migration block is delimited by an explicit SENTINEL
// comment on its own line. Everything strictly BEFORE the sentinel is the user's
// original NotePlan content and is preserved BYTE-FOR-BYTE. The sentinel + a
// fixed `\n\n` separator that precedes it both belong to the (managed) block, so
// the split is deterministic no matter how the original file ended (newline or
// not). `MARKER` is the human-readable heading shown just under the sentinel.
const SENTINEL = '<!-- import-noteplan:begin — managed, append-only; do not hand-edit below -->';
const MARKER = '## 🔗 Migrated to Blog';
const TABLE_HEADER = '| Link / Section | Migrated to (blog) | Kind | Date |';
const TABLE_DIVIDER = '|---|---|---|---|';

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function readFileUtf8(file) {
  return fs.readFileSync(file, 'utf8');
}

/**
 * Split a NotePlan file into { body, block } around the SENTINEL.
 *  - body:  the user's original content, preserved BYTE-FOR-BYTE. This is what
 *           `--verify` compares; it must equal the pre-migration file exactly
 *           (minus the appended block).
 *  - block: the fixed separator + sentinel + managed table onward, or null.
 * The split is byte-exact: body + (block ?? '') === original file content.
 *
 * We look for the separator+sentinel as a unit so the `\n\n` we inserted is
 * attributed to the block, not the body. Legacy blocks (created before the
 * sentinel model) fall back to splitting at the MARKER heading.
 */
function splitAtMarker(content) {
  const sentIdx = content.indexOf(SENTINEL);
  if (sentIdx !== -1) {
    // The block is always written as EXACTLY `\n\n` + SENTINEL + …. Strip only
    // those two separator newlines (not any further ones), so the body retains
    // whatever trailing newline the user's original content had. This makes the
    // body a byte-exact match of the pre-migration file.
    let bodyEnd = sentIdx;
    let stripped = 0;
    while (bodyEnd > 0 && content[bodyEnd - 1] === '\n' && stripped < 2) {
      bodyEnd--;
      stripped++;
    }
    return { body: content.slice(0, bodyEnd), block: content.slice(bodyEnd) };
  }
  // Legacy fallback (no sentinel): split at the MARKER heading, stripping the
  // one blank-line separator conventionally placed before it.
  const markIdx = content.indexOf(MARKER);
  if (markIdx === -1) return { body: content, block: null };
  let bodyEnd = markIdx;
  let stripped = 0;
  while (bodyEnd > 0 && content[bodyEnd - 1] === '\n' && stripped < 2) {
    bodyEnd--;
    stripped++;
  }
  return { body: content.slice(0, bodyEnd), block: content.slice(bodyEnd) };
}

/** Extract the destination URLs already recorded in a migration block (for idempotency). */
function migratedUrlsFromBlock(block) {
  if (!block) return new Set();
  const urls = new Set();
  for (const line of block.split('\n')) {
    // A data row: | <link> | <blogUrl> | <kind> | <date> |
    const cells = line.split('|').map((c) => c.trim());
    // cells[0] === '' (leading pipe); a real row has >= 5 cells and a URL in col 2.
    if (cells.length >= 5 && /^https?:\/\//.test(cells[2])) {
      urls.add(cells[2]);
    }
    // Also index the SOURCE link URL (inside the first cell) so re-runs dedup by source.
    const m = cells[1] && cells[1].match(/\((https?:\/\/[^)]+)\)/);
    if (m) urls.add(m[1]);
  }
  return urls;
}

// ---------------------------------------------------------------------------
// --inventory
// ---------------------------------------------------------------------------

const MD_LINK_RE = /\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/g;
// A bare URL not immediately preceded by ']( ' (i.e. not the target of a md link).
const BARE_URL_RE = /(?<!\]\()(?<!["'(])\bhttps?:\/\/[^\s)>\]]+/g;

/** Heading level + text, or null. Handles #, ##, ###… */
function parseHeading(line) {
  const m = line.match(/^(#{1,6})\s+(.*)$/);
  if (!m) return null;
  return { level: m[1].length, text: m[2].trim() };
}

/** Task checkbox state on a line: 'open' | 'done' | null. */
function taskState(line) {
  if (/\[x\]/i.test(line)) return 'done';
  if (/\[\s\]/.test(line)) return 'open';
  return null;
}

function inventory(file) {
  const content = readFileUtf8(file);
  const { body, block } = splitAtMarker(content);
  const alreadyMigrated = migratedUrlsFromBlock(block);

  const lines = body.split('\n');
  const sectionStack = []; // [{level, text}]
  const links = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const heading = parseHeading(line);
    if (heading) {
      // Pop deeper-or-equal headings, push this one.
      while (
        sectionStack.length &&
        sectionStack[sectionStack.length - 1].level >= heading.level
      ) {
        sectionStack.pop();
      }
      sectionStack.push(heading);
      continue;
    }

    const section = sectionStack.map((h) => h.text).join(' › ') || '(top)';
    const state = taskState(line);

    // Markdown links first; remember their URLs so bare-URL pass can skip them.
    const mdUrls = new Set();
    let m;
    MD_LINK_RE.lastIndex = 0;
    while ((m = MD_LINK_RE.exec(line)) !== null) {
      mdUrls.add(m[2]);
      links.push({
        kind: 'markdown',
        text: m[1].trim(),
        url: m[2],
        section,
        taskState: state,
        line: i + 1,
        raw: line.trim(),
        alreadyMigrated: alreadyMigrated.has(m[2]),
      });
    }

    // Bare URLs on the same line that were NOT part of a markdown link.
    BARE_URL_RE.lastIndex = 0;
    while ((m = BARE_URL_RE.exec(line)) !== null) {
      const url = m[0].replace(/[.,;]+$/, ''); // trim trailing punctuation
      if (mdUrls.has(url)) continue;
      links.push({
        kind: 'bare',
        text: '',
        url,
        section,
        taskState: state,
        line: i + 1,
        raw: line.trim(),
        alreadyMigrated: alreadyMigrated.has(url),
      });
    }
  }

  return {
    file: path.basename(file),
    path: file,
    hasMigrationTable: block !== null,
    totalLinks: links.length,
    alreadyMigratedCount: links.filter((l) => l.alreadyMigrated).length,
    links,
  };
}

// ---------------------------------------------------------------------------
// --append-migration
// ---------------------------------------------------------------------------

/** Escape a cell value so it can't break the markdown table. */
function cell(value) {
  return String(value == null ? '' : value).replace(/\|/g, '\\|').replace(/\n/g, ' ').trim();
}

/**
 * Render a single table row. A record is { link, url, blogUrl, kind, date }.
 *  - link/url describe the SOURCE (either a label + url, or just a section name).
 *  - blogUrl is the destination on the blog.
 */
function renderRow(rec) {
  const label =
    rec.url && rec.link
      ? `[${cell(rec.link)}](${rec.url})`
      : rec.url
        ? `<${rec.url}>`
        : cell(rec.link || rec.section || '(section)');
  return `| ${label} | ${cell(rec.blogUrl)} | ${cell(rec.kind)} | ${cell(rec.date)} |`;
}

function appendMigration(file, records) {
  const original = readFileUtf8(file);
  const { body, block } = splitAtMarker(original);

  // Idempotency: skip records whose source url OR blogUrl is already recorded.
  const existing = migratedUrlsFromBlock(block);
  const fresh = records.filter((r) => {
    if (r.url && existing.has(r.url)) return false;
    if (r.blogUrl && existing.has(r.blogUrl)) return false;
    return true;
  });

  if (fresh.length === 0) {
    return { changed: false, added: 0, content: original };
  }

  if (block === null) {
    // Create the block. The body is preserved byte-exact; the block owns its
    // leading `\n\n` separator so verify sees the body unchanged.
    const newBlock =
      '\n\n' +
      SENTINEL +
      '\n' +
      MARKER +
      '\n\n' +
      TABLE_HEADER +
      '\n' +
      TABLE_DIVIDER +
      '\n' +
      fresh.map(renderRow).join('\n') +
      '\n';
    return { changed: true, added: fresh.length, content: body + newBlock };
  }

  // Extend the existing block: append rows after the last table row.
  const trimmed = block.replace(/\s+$/, '');
  const newBlock = trimmed + '\n' + fresh.map(renderRow).join('\n') + '\n';
  return { changed: true, added: fresh.length, content: body + newBlock };
}

/**
 * Fail-closed self-guard: the new file content MUST contain the entire original
 * body byte-for-byte (as a prefix). If a computed append ever failed to preserve
 * the original, this throws BEFORE anything is written. Belt-and-suspenders on
 * top of the split logic.
 */
function assertNonDestructive(originalContent, newContent) {
  const originalBody = splitAtMarker(originalContent).body;
  const newBody = splitAtMarker(newContent).body;
  if (newBody !== originalBody) {
    throw new Error(
      'REFUSING TO WRITE: computed content would alter the original NotePlan body. ' +
        'This is a bug in the transformer; no file was changed.'
    );
  }
}

// ---------------------------------------------------------------------------
// --verify (the fail-closed non-destructive guard)
// ---------------------------------------------------------------------------

/**
 * Assert that the body ABOVE the marker in `file` is byte-identical to the body
 * above the marker in `baseline` (the pre-migration snapshot). If baseline has
 * no marker, its entire content is the body. Exit 0 = safe, non-zero = a
 * destructive change happened above the line.
 */
function verify(file, baselineFile) {
  const current = splitAtMarker(readFileUtf8(file)).body;
  const baseline = splitAtMarker(readFileUtf8(baselineFile)).body;

  if (current === baseline) {
    return { ok: true, message: 'Body above the migration marker is byte-identical.' };
  }

  // Produce a minimal diff hint (first differing line).
  const a = baseline.split('\n');
  const b = current.split('\n');
  let firstDiff = -1;
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if (a[i] !== b[i]) {
      firstDiff = i + 1;
      break;
    }
  }
  return {
    ok: false,
    message: `DESTRUCTIVE CHANGE: body above the marker differs (first at line ${firstDiff}).`,
    baselineLine: firstDiff > 0 ? a[firstDiff - 1] : null,
    currentLine: firstDiff > 0 ? b[firstDiff - 1] : null,
  };
}

// ---------------------------------------------------------------------------
// --snapshot / --audit  (corpus-level "nothing dropped" guard)
// ---------------------------------------------------------------------------
//
// Per-file, per-folder safety net BEYOND --verify. It tallies, for every file in
// a NotePlan folder, the multiset of link URLs and the multiset of non-blank
// content lines that live ABOVE the migration marker (the user's original
// content). --snapshot writes this manifest to a tmpdir; --audit re-tallies and
// asserts that NOTHING in the baseline manifest is missing from the current
// files. Content may only GROW (the migration table is below the marker and is
// excluded). A single dropped link or line → exit 2.

function listMarkdownFiles(dir) {
  return fs
    .readdirSync(dir)
    .filter((n) => n.endsWith('.md') && !n.startsWith('.'))
    .map((n) => path.join(dir, n))
    .sort();
}

/** Tally the user's original content (above the marker) of one file. */
function tallyFile(file) {
  const body = splitAtMarker(readFileUtf8(file)).body;
  const urls = [];
  let m;
  MD_LINK_RE.lastIndex = 0;
  while ((m = MD_LINK_RE.exec(body)) !== null) urls.push(m[2]);
  BARE_URL_RE.lastIndex = 0;
  while ((m = BARE_URL_RE.exec(body)) !== null) {
    const u = m[0].replace(/[.,;]+$/, '');
    urls.push(u);
  }
  const lines = body
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  return { urls, lines };
}

function snapshot(dir) {
  const files = {};
  for (const f of listMarkdownFiles(dir)) {
    files[path.basename(f)] = tallyFile(f);
  }
  return { dir, fileCount: Object.keys(files).length, files };
}

/** Return a Map<value, count> multiset from an array. */
function multiset(arr) {
  const m = new Map();
  for (const v of arr) m.set(v, (m.get(v) || 0) + 1);
  return m;
}

/**
 * Compare a baseline manifest against the current state of the folder. Report
 * every URL or content line whose count DROPPED (present in baseline, missing or
 * fewer now). Growth is fine and ignored.
 */
function audit(dir, baselineManifest) {
  const current = snapshot(dir);
  const drops = [];

  for (const [fname, base] of Object.entries(baselineManifest.files)) {
    const cur = current.files[fname];
    if (!cur) {
      drops.push({ file: fname, type: 'file', detail: 'FILE MISSING entirely' });
      continue;
    }
    for (const [kind, key] of [
      ['url', 'urls'],
      ['line', 'lines'],
    ]) {
      const baseCounts = multiset(base[key]);
      const curCounts = multiset(cur[key]);
      for (const [val, n] of baseCounts) {
        const now = curCounts.get(val) || 0;
        if (now < n) {
          drops.push({ file: fname, type: kind, was: n, now, detail: val.slice(0, 120) });
        }
      }
    }
  }
  return { ok: drops.length === 0, drops, fileCount: current.fileCount };
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function getFlag(argv, name) {
  const i = argv.indexOf(name);
  return i !== -1 && i + 1 < argv.length ? argv[i + 1] : null;
}

function main() {
  const argv = process.argv.slice(2);

  const invFile = getFlag(argv, '--inventory');
  if (invFile) {
    const abs = path.resolve(invFile);
    process.stdout.write(JSON.stringify(inventory(abs), null, 2) + '\n');
    return;
  }

  const appendFile = getFlag(argv, '--append-migration');
  if (appendFile) {
    const abs = path.resolve(appendFile);
    const recordsArg = getFlag(argv, '--records');
    const recordsFile = getFlag(argv, '--records-file');
    let records;
    if (recordsFile) {
      records = JSON.parse(readFileUtf8(path.resolve(recordsFile)));
    } else if (recordsArg) {
      records = JSON.parse(recordsArg);
    } else {
      console.error('--append-migration requires --records <json> or --records-file <path>');
      process.exit(2);
    }
    if (!Array.isArray(records)) records = [records];
    const result = appendMigration(abs, records);
    const dryRun = argv.includes('--dry-run');
    if (dryRun) {
      process.stdout.write(result.content);
      console.error(
        `\n[dry-run] would ${result.changed ? `add ${result.added} row(s)` : 'make NO change'}.`
      );
      return;
    }
    if (result.changed) {
      // Fail-closed: never write unless the original body is preserved byte-exact.
      assertNonDestructive(readFileUtf8(abs), result.content);
      fs.writeFileSync(abs, result.content);
      console.error(`Appended ${result.added} migration row(s) to ${path.basename(abs)}.`);
    } else {
      console.error('No new rows to append (all records already migrated).');
    }
    return;
  }

  const snapDir = getFlag(argv, '--snapshot');
  if (snapDir) {
    const abs = path.resolve(snapDir);
    const out = getFlag(argv, '--out');
    const manifest = snapshot(abs);
    const json = JSON.stringify(manifest, null, 2);
    if (out) {
      fs.writeFileSync(path.resolve(out), json);
      console.error(
        `Snapshotted ${manifest.fileCount} file(s) from ${abs} → ${out}`
      );
    } else {
      process.stdout.write(json + '\n');
    }
    return;
  }

  const auditDir = getFlag(argv, '--audit');
  if (auditDir) {
    const abs = path.resolve(auditDir);
    const baselinePath = getFlag(argv, '--baseline');
    if (!baselinePath) {
      console.error('--audit requires --baseline <snapshot.json>');
      process.exit(2);
    }
    const baseline = JSON.parse(readFileUtf8(path.resolve(baselinePath)));
    const result = audit(abs, baseline);
    if (result.ok) {
      console.error(
        `✓ No content dropped: every link + line from the baseline (${result.fileCount} files) is still present.`
      );
      process.exit(0);
    }
    console.error(`✗ CONTENT DROPPED — ${result.drops.length} item(s) present in baseline are now missing:`);
    for (const d of result.drops.slice(0, 40)) {
      console.error(`  [${d.file}] ${d.type} (was ${d.was ?? '?'}, now ${d.now ?? 0}): ${d.detail}`);
    }
    if (result.drops.length > 40) console.error(`  … and ${result.drops.length - 40} more`);
    process.exit(2);
  }

  const verifyFile = getFlag(argv, '--verify');
  if (verifyFile) {
    const baseline = getFlag(argv, '--baseline');
    if (!baseline) {
      console.error('--verify requires --baseline <pre-migration-snapshot>');
      process.exit(2);
    }
    const result = verify(path.resolve(verifyFile), path.resolve(baseline));
    if (result.ok) {
      console.error('✓ ' + result.message);
      process.exit(0);
    } else {
      console.error('✗ ' + result.message);
      if (result.baselineLine !== null) {
        console.error('  baseline: ' + JSON.stringify(result.baselineLine));
        console.error('  current : ' + JSON.stringify(result.currentLine));
      }
      process.exit(1);
    }
  }

  console.error(
    [
      'usage:',
      '  node import-noteplan.js --inventory <file>',
      '  node import-noteplan.js --append-migration <file> --records <json> [--dry-run]',
      '  node import-noteplan.js --append-migration <file> --records-file <path> [--dry-run]',
      '  node import-noteplan.js --verify <file> --baseline <pre-migration-copy>',
      '  node import-noteplan.js --snapshot <folder> --out <manifest.json>',
      '  node import-noteplan.js --audit <folder> --baseline <manifest.json>',
    ].join('\n')
  );
  process.exit(2);
}

if (require.main === module) main();

module.exports = {
  inventory,
  appendMigration,
  verify,
  splitAtMarker,
  assertNonDestructive,
  snapshot,
  audit,
  tallyFile,
  MARKER,
  SENTINEL,
};
