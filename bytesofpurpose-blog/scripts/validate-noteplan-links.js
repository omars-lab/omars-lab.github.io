#!/usr/bin/env node

/**
 * validate-noteplan-links.js — verify every NotePlan link in the corpus resolves to a REAL
 * note in the local NotePlan data store.
 *
 * The blog uses `noteplan://x-callback-url/openNote?...` links (rendered by <NotePlanButton>)
 * that open a note in MY local NotePlan app. This validator parses each link's target and
 * checks a matching note actually EXISTS on disk, so a renamed/deleted backlog note doesn't
 * leave a dead button.
 *
 * The x-callback-url scheme (help.noteplan.co/article/49):
 *   openNote?noteTitle=<title>          — a note identified by its TITLE (its first `# ` heading)
 *   openNote?noteTitle=<title>#<heading> — + a subheading (we validate the NOTE exists; the
 *                                          heading is best-effort — see below)
 *   openNote?filename=<folder/note.txt> — a note by its relative path under Notes/ or Calendar/
 * Titles/headings/paths are URL-encoded (emoji, spaces, the literal `#`).
 *
 * RESOLUTION (mirrors how NotePlan finds a note):
 *   - noteTitle  → a note file whose FIRST `# ` heading equals the title, OR a file named
 *                  `<title>.(md|txt)` anywhere under Notes/.
 *   - filename   → the path exists under Notes/ or Calendar/ (calendar notes are dated files;
 *                  the scheme's `.txt` may be `.md` on disk, so we match the stem + either ext).
 *
 * LOCAL-ONLY: the NotePlan store only exists on my machine. If the dir is absent (CI, another
 * machine), this SKIPS with exit 0 (a note-existence check off-machine is impossible, not a
 * failure). Run locally to actually validate. The link SYNTAX is always checked (even off-machine).
 *
 * Usage:  node scripts/validate-noteplan-links.js  [--file <path>]
 * Exit:   2 if a link is malformed OR (on-machine) resolves to no note; else 0.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const ROOT = path.join(__dirname, '..');
const CONTENT_DIRS = ['docs', 'blog', 'designs'].map((d) => path.join(ROOT, d));

// The NotePlan data store (only present on the author's machine).
const NP_ROOT = path.join(
  os.homedir(),
  'Library/Containers/co.noteplan.NotePlan3/Data/Library/Application Support/co.noteplan.NotePlan3',
);
const NP_NOTES = path.join(NP_ROOT, 'Notes');
const NP_CALENDAR = path.join(NP_ROOT, 'Calendar');

// ── collect the links ────────────────────────────────────────────────────────────────────
function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, {withFileTypes: true})) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, out);
    else if (/\.mdx?$/.test(e.name)) out.push(full);
  }
  return out;
}

// Strip fenced code blocks (```…```) and inline code (`…`) so a documented EXAMPLE of the
// scheme/component isn't treated as a real link. (A NotePlan link that is meant to work is
// authored as live MDX, not inside code.)
function stripCode(text) {
  return text.replace(/```[\s\S]*?```/g, '').replace(/`[^`]*`/g, '');
}

// Find every noteplan:// link: a <NotePlanButton .../> tag OR a bare noteplan:// URL (outside code).
function linksIn(file) {
  const text = stripCode(fs.readFileSync(file, 'utf8'));
  const found = [];
  // <NotePlanButton note="…" heading="…" /> or filename="…" or url="…"
  const re = /<NotePlanButton\b([^>]*?)\/?>/g;
  let m;
  while ((m = re.exec(text))) {
    const attrs = m[1];
    const get = (k) => {
      const a = attrs.match(new RegExp(`${k}="([^"]*)"`));
      return a ? a[1] : undefined;
    };
    found.push({
      file,
      raw: m[0],
      note: get('note'),
      heading: get('heading'),
      filename: get('filename'),
      url: get('url'),
    });
  }
  // Bare/`code` noteplan:// urls that are NOT inside a NotePlanButton (a leftover to flag).
  const bare = /(?<!["'=])noteplan:\/\/[^\s`)"'<>]+/g;
  while ((m = bare.exec(text))) {
    // skip if it's the url= of a button we already captured
    if (found.some((f) => f.url && m[0].includes(f.url))) continue;
    found.push({file, raw: m[0], bareUrl: m[0]});
  }
  return found;
}

// ── the NotePlan note index (title → file), built once, on-machine only ────────────────────
function buildIndex() {
  const byTitle = new Map(); // first-heading title -> file
  const byStem = new Map(); // filename stem -> file
  const walkNotes = (dir) => {
    if (!fs.existsSync(dir)) return;
    for (const e of fs.readdirSync(dir, {withFileTypes: true})) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (e.name.startsWith('@')) continue; // @Archive/@Trash/@Templates
        walkNotes(full);
      } else if (/\.(md|txt)$/.test(e.name)) {
        const stem = e.name.replace(/\.(md|txt)$/, '');
        if (!byStem.has(stem)) byStem.set(stem, full);
        try {
          const first = (fs.readFileSync(full, 'utf8').split('\n')[0] || '').trim();
          const h = first.match(/^#\s+(.*)$/);
          if (h && !byTitle.has(h[1].trim())) byTitle.set(h[1].trim(), full);
        } catch {
          /* unreadable — skip */
        }
      }
    }
  };
  walkNotes(NP_NOTES);
  return {byTitle, byStem};
}

// ── resolve one link against the index ─────────────────────────────────────────────────────
function resolve(link, index) {
  // A leftover BARE url is a lint finding regardless of machine (should be a <NotePlanButton>).
  if (link.bareUrl) {
    // an addText/other-action example wrapped in backticks is fine; a bare openNote link is not.
    if (/\/openNote\?/.test(link.bareUrl)) {
      return {ok: false, why: 'bare openNote link — wrap it in a <NotePlanButton> (or backticks if it is an example)'};
    }
    return {ok: true, why: 'non-openNote noteplan:// example (not a note reference)'};
  }
  if (link.url) return {ok: true, why: 'explicit url= (author-supplied; syntax only)'};

  const {note, filename} = link;
  if (!note && !filename) return {ok: false, why: 'NotePlanButton has neither `note` nor `filename`'};

  if (!index) return {ok: true, why: 'off-machine — syntax OK, note-existence not checkable'};

  if (filename) {
    const stem = filename.replace(/\.(md|txt)$/, '');
    // check Notes/ (by stem or exact relative path) and Calendar/ (dated stem)
    const inNotes = index.byStem.has(path.basename(stem));
    const inCal =
      fs.existsSync(path.join(NP_CALENDAR, `${stem}.md`)) ||
      fs.existsSync(path.join(NP_CALENDAR, `${stem}.txt`));
    const relInNotes =
      fs.existsSync(path.join(NP_NOTES, `${stem}.md`)) ||
      fs.existsSync(path.join(NP_NOTES, `${stem}.txt`));
    if (inNotes || inCal || relInNotes) return {ok: true};
    return {ok: false, why: `no note file for filename="${filename}" under Notes/ or Calendar/`};
  }

  // by title: a first-heading match OR a file named "<title>.(md|txt)"
  if (index.byTitle.has(note) || index.byStem.has(note)) return {ok: true};
  return {ok: false, why: `no note titled "${note}" (no matching first-heading or filename)`};
}

// ── main ────────────────────────────────────────────────────────────────────────────────
function main() {
  const fileArg = process.argv.indexOf('--file');
  const files =
    fileArg > -1 ? [path.resolve(process.argv[fileArg + 1])] : CONTENT_DIRS.flatMap((d) => walk(d));

  const onMachine = fs.existsSync(NP_NOTES);
  const index = onMachine ? buildIndex() : null;

  const links = files.flatMap((f) => (fs.existsSync(f) ? linksIn(f) : []));
  const errors = [];
  for (const link of links) {
    const r = resolve(link, index);
    if (!r.ok) errors.push(`${path.relative(ROOT, link.file)}: ${r.why}\n    ${link.raw.slice(0, 100)}`);
  }

  if (!onMachine) {
    console.log(
      `ℹ️  noteplan-links: NotePlan store not on this machine — checked ${links.length} link(s) for SYNTAX only (note-existence needs the local store).`,
    );
  }
  if (errors.length) {
    console.error(`🗒️  noteplan-links: ${errors.length} problem(s):\n`);
    for (const e of errors) console.error('  ' + e + '\n');
    process.exit(2);
  }
  console.log(
    `✅ noteplan-links: ${links.length} link(s) OK${onMachine ? ' (resolved to real notes)' : ''}.`,
  );
}

main();
