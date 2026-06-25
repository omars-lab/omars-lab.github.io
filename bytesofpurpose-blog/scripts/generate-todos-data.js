#!/usr/bin/env node

/**
 * generate-todos-data.js — build the consolidated todos dataset that drives the /todos
 * experience, from every markdown task across the content.
 *
 * Mirrors the other generators (kanban/ideas/changelog): scans content, parses with the SHARED
 * task-tag parser (scripts/lib/task-tags.js — the same logic <TaskList> uses), and emits a JSON
 * the /todos page renders. Wired into `npm run generate-assets` (prebuild/prestart); output is
 * gitignored + in the block-generated-edits hook (NEVER hand-edit — edit the task in its post).
 *
 * FOCUSED, not a dump. There are ~2000 markdown checkboxes across the docs, most of them
 * concept-page checklists ("✅ Have blueprints") that are NOT tracked work. We include a task
 * only when it is genuinely a TODO worth surfacing:
 *   - it carries a scheduling breadcrumb (>due / @done / ~Nx~ / #date), OR
 *   - it lives in a tracked-work area (product-management ideas/initiatives/projects/roadmaps),
 *     OR
 *   - it is inside a <TaskList> block (the author opted it in).
 * Everything else (generic doc checklists) is counted but NOT listed, so the page stays signal.
 *
 * OUTPUT (gitignored): src/components/Todos/todos-data.json
 *   { generatedAtNote, totals:{open,done,total,scheduled,tracked}, items:[ {text, done, source:
 *     {title,permalink}, due, doneDate, recurrence, datestamps[], hashtags[]} ] }
 * (Dates are passed through as strings; "age/overdue" is computed in the UI against the day it
 * loads — the generator must stay deterministic, so it does NOT compute "days past due" itself.)
 */

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const {parseTaskText} = require('./lib/task-tags');

const ROOT = path.join(__dirname, '..');
const outputFile = path.join(ROOT, 'src', 'components', 'Todos', 'todos-data.json');

// Content roots to scan, with the route base each maps to (for permalinks).
const SCAN = [
  {dir: 'blog', base: '/initiatives'},
  {dir: 'designs', base: '/designs'},
  {dir: 'docs/craft', base: '/craft'},
  {dir: 'docs/journey', base: '/journey'},
];

// A task in one of these path fragments is tracked work even without a tag.
const TRACKED_AREAS = [
  'product-management/ideas',
  'product-management/initiatives',
  'product-management/projects',
  'product-management/roadmaps',
];

const TASK_RE = /^\s*[-*]\s+\[([ xX])\]\s+(.*)$/;

function walk(dir, out = []) {
  const abs = path.join(ROOT, dir);
  if (!fs.existsSync(abs)) return out;
  for (const entry of fs.readdirSync(abs, {withFileTypes: true})) {
    if (entry.name.startsWith('_') || entry.name === 'node_modules') continue;
    const rel = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(rel, out);
    else if (/\.mdx?$/.test(entry.name)) out.push(rel);
  }
  return out;
}

// The permalink + display title for a file (slug frontmatter wins; else de-dated filename).
function sourceOf(relPath, base, fm) {
  const fileSlug = path
    .basename(relPath)
    .replace(/\.(md|mdx)$/, '')
    .replace(/^\d{4}-\d{2}-\d{2}-/, '');
  const slug = (fm.slug || fileSlug).toString().replace(/^\//, '');
  // A docs slug is already absolute-instance-relative; a blog slug is the post slug.
  const permalink = fm.slug && fm.slug.toString().startsWith('/')
    ? `${base}${fm.slug}`
    : `${base}/${slug}`;
  const title = (fm.title || fileSlug).toString().replace(/^['"]|['"]$/g, '').replace(/^[^\w(]+\s*/, '').trim()
    || fileSlug;
  return {title, permalink};
}

function build() {
  const items = [];
  let total = 0;
  let openCount = 0;
  let doneCount = 0;

  for (const {dir, base} of SCAN) {
    for (const rel of walk(dir)) {
      const raw = fs.readFileSync(path.join(ROOT, rel), 'utf8');
      let fm;
      let body;
      try {
        const parsed = matter(raw);
        fm = parsed.data || {};
        body = parsed.content;
      } catch {
        continue;
      }
      if (fm.draft === true) continue; // drafts aren't public; don't aggregate them
      const src = sourceOf(rel, base, fm);
      const inTrackedArea = TRACKED_AREAS.some((a) => rel.includes(a));
      const inTaskList = /<TaskList[\s>]/.test(body);

      const lines = body.split('\n');
      for (const line of lines) {
        const m = line.match(TASK_RE);
        if (!m) continue;
        total += 1;
        const checked = m[1].toLowerCase() === 'x';
        const parsed = parseTaskText(m[2], checked);
        if (parsed.done) doneCount += 1;
        else openCount += 1;

        const due = parsed.tags.find((t) => t.kind === 'due');
        const doneTag = parsed.tags.find((t) => t.kind === 'done');
        const recur = parsed.tags.find((t) => t.kind === 'recurrence');
        const datestamps = parsed.tags.filter((t) => t.kind === 'datestamp').map((t) => t.value);
        const hashtags = parsed.tags.filter((t) => t.kind === 'hashtag').map((t) => t.value);

        const hasBreadcrumb = !!(due || doneTag || recur || datestamps.length);
        // Include only genuinely-tracked todos in the LISTING (everything is COUNTED above).
        if (!(hasBreadcrumb || inTrackedArea || inTaskList)) continue;

        items.push({
          text: parsed.text,
          done: parsed.done,
          source: src,
          due: due ? due.value : null,
          doneDate: doneTag ? doneTag.value : null,
          recurrence: recur ? recur.value : null,
          datestamps,
          hashtags,
        });
      }
    }
  }

  // Newest scheduled first; undated after; done last.
  items.sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    return (b.due || '').localeCompare(a.due || '');
  });

  const scheduled = items.filter((i) => i.due && !i.done).length;
  return {
    generatedAtNote:
      'Generated by scripts/generate-todos-data.js (npm run generate-assets). Do not hand-edit.',
    totals: {open: openCount, done: doneCount, total, scheduled, tracked: items.length},
    items,
  };
}

const data = build();
const outDir = path.dirname(outputFile);
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, {recursive: true});
fs.writeFileSync(outputFile, JSON.stringify(data, null, 2), 'utf8');
console.log(
  `Generated todos data: ${data.totals.tracked} tracked of ${data.totals.total} total ` +
    `(${data.totals.open} open, ${data.totals.scheduled} scheduled) -> ${path.relative(ROOT, outputFile)}`,
);
