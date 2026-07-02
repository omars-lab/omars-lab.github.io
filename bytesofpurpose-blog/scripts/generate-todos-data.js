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
 * OUTPUT (gitignored): src/components/Todos/todos-data.json — aggregated PER POST (not a flat
 * task list, which is noise: raw markdown-link lines + in-post notes). One row per post:
 *   { generatedAtNote, totals:{open,done,total,scheduled,tracked,posts},
 *     posts:[ {title, permalink, open, done, scheduled, total, latestDue} ] }
 * The tasks themselves live in the post (rendered by <TaskList>); /todos is the rollup. Dates
 * are strings; "age" is computed in the UI against the day it loads (the generator stays
 * deterministic and does NOT bake in "days past due").
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
  {dir: 'docs/knowledge', base: '/knowledge'},
  {dir: 'docs/habits', base: '/habits'},
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
  // Aggregate PER POST, not per task: the page shows one row per post with its task counts,
  // and the tasks themselves live in the post (rendered by <TaskList>). A flat list of every
  // task is noise (raw markdown-link lines, in-post "look into" notes); the rollup is signal.
  const posts = []; // one entry per post that has tracked tasks
  let total = 0; // every markdown checkbox across the corpus (for the headline total)
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

      // Per-post tally.
      let pOpen = 0;
      let pDone = 0;
      let pScheduled = 0;
      let pTracked = 0; // tasks in this post that count toward the listing (tracked)
      let latestDue = null; // newest due date among this post's open scheduled tasks

      for (const line of body.split('\n')) {
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
        const datestamps = parsed.tags.filter((t) => t.kind === 'datestamp');
        const hasBreadcrumb = !!(due || doneTag || recur || datestamps.length);

        // Only genuinely-tracked tasks count toward a post's rollup (everything is in `total`).
        if (!(hasBreadcrumb || inTrackedArea || inTaskList)) continue;
        pTracked += 1;
        if (parsed.done) pDone += 1;
        else pOpen += 1;
        if (due && !parsed.done) {
          pScheduled += 1;
          if (!latestDue || due.value > latestDue) latestDue = due.value;
        }
      }

      if (pTracked > 0) {
        posts.push({
          title: src.title,
          permalink: src.permalink,
          open: pOpen,
          done: pDone,
          scheduled: pScheduled,
          total: pTracked,
          latestDue,
        });
      }
    }
  }

  // Most actionable first: posts with open tasks before fully-done ones; then by open count,
  // then by a scheduled date (soonest-captured surfaces), then alphabetically.
  posts.sort((a, b) => {
    const aActive = a.open > 0 ? 0 : 1;
    const bActive = b.open > 0 ? 0 : 1;
    if (aActive !== bActive) return aActive - bActive;
    if (b.open !== a.open) return b.open - a.open;
    if ((b.latestDue || '') !== (a.latestDue || '')) return (b.latestDue || '').localeCompare(a.latestDue || '');
    return a.title.localeCompare(b.title);
  });

  const scheduled = posts.reduce((n, p) => n + p.scheduled, 0);
  const tracked = posts.reduce((n, p) => n + p.total, 0);
  return {
    generatedAtNote:
      'Generated by scripts/generate-todos-data.js (npm run generate-assets). Do not hand-edit.',
    totals: {open: openCount, done: doneCount, total, scheduled, tracked, posts: posts.length},
    posts,
  };
}

const data = build();
const outDir = path.dirname(outputFile);
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, {recursive: true});
fs.writeFileSync(outputFile, JSON.stringify(data, null, 2), 'utf8');
console.log(
  `Generated todos data: ${data.totals.posts} posts with tracked tasks ` +
    `(${data.totals.tracked} tracked of ${data.totals.total} total, ${data.totals.scheduled} ` +
    `scheduled) -> ${path.relative(ROOT, outputFile)}`,
);
