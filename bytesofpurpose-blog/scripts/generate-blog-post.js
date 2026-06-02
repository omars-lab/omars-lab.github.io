#!/usr/bin/env node

/**
 * generate-blog-post.js — scaffold a companion /blog/ post for a "post-worthy" doc.
 *
 * The doc↔post "ingress" loop is documented in docs/blogging/blog-post-triggers.mdx:
 * a doc that carries a `blog_trigger:` frontmatter key deserves a point-in-time blog
 * post that summarizes it and links back to it (the doc stays the durable reference,
 * the post is the discovery surface). This script turns that doc into a post STUB.
 *
 * What it does, given a doc path:
 *   1. Reads the doc's frontmatter (slug, title, authors, tags, date, blog_*).
 *   2. Derives a post filename `blog/YYYY-MM-DD-<post-slug>.md` (date from the doc's
 *      `date:`, post-slug from the doc's `blog_post:` or the doc slug's last segment).
 *   3. Writes a stub: blog frontmatter + a narrative ingress + `<!-- truncate -->` +
 *      a `## Takeaways` placeholder + a "Read the full notes →" back-link to the doc.
 *
 * It is deliberately conservative:
 *   - READ-ONLY on the source doc. It prints the one-line `blog_post:` / `blog_status:`
 *     edit for you to apply by hand (keeps the source reviewable; mirrors how
 *     generate-changelog-data.js never mutates its sources).
 *   - REFUSES to overwrite an existing post (idempotent; safe to re-run).
 *   - Only acts on docs that carry a `blog_trigger:` (otherwise it's not post-worthy).
 *
 * Usage:
 *   node scripts/generate-blog-post.js <doc-path>     # scaffold one post
 *   node scripts/generate-blog-post.js --all-pending  # LIST docs owed a post (no writes)
 *
 * Exit codes: 0 ok · 1 usage / nothing-to-do / refusal.
 */

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const ROOT = path.join(__dirname, '..');
const DOCS = path.join(ROOT, 'docs');
const BLOG = path.join(ROOT, 'blog');

const isDoc = (n) => /\.mdx?$/.test(n);

function listDir(dir) {
  try { return fs.readdirSync(dir, { withFileTypes: true }); } catch { return []; }
}

/** YYYY-MM-DD from a frontmatter `date:` (string or Date), else null. */
function dateStamp(date) {
  if (!date) return null;
  const s = String(date);
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
}

/** Last path segment of an absolute doc slug (the natural post slug). */
function slugTail(docSlug) {
  return String(docSlug).replace(/\/$/, '').split('/').filter(Boolean).pop();
}

/** Render the authors/tags arrays back to inline-array YAML (e.g. `[oeid]`). */
function inlineArray(v) {
  if (Array.isArray(v)) return `[${v.join(', ')}]`;
  return v != null ? String(v) : '';
}

/** The post stub body — mirrors the existing hybrid posts (ingress + truncate + back-link).
 *  The back-link uses the `/docs` route prefix: docs are served under /docs/<slug>, so an
 *  absolute slug alone (e.g. /mental-models/…) is a broken link. */
function stubBody(doc) {
  const cleanTitle = String(doc.title || '').replace(/^[^\p{L}\p{N}]+/u, '').trim();
  const docHref = `/docs${doc.slug}`;
  return `${doc.ingress}

<!-- truncate -->

# ${cleanTitle}

> **Read the full notes → [${cleanTitle}](${docHref})**

## Takeaways

- _Summarize the highlights here — the durable detail lives in the linked doc._

`;
}

/** Build the post file content (frontmatter + body). image left as a TODO (posts use it). */
function buildPost(doc) {
  const fm = [
    '---',
    `slug: ${doc.postSlug}`,
    `title: ${JSON.stringify(doc.title)}`,
    `description: ${JSON.stringify(doc.description || `A short post pointing to the full notes: ${doc.title}.`)}`,
    `authors: ${inlineArray(doc.authors) || '[oeid]'}`,
    `tags: ${inlineArray(doc.tags) || '[]'}`,
    `date: ${doc.date}`,
    '# image: /img/REPLACE-ME.jpg  # add a social/card image before publishing',
    'draft: true',
    '---',
    '',
  ].join('\n');
  return fm + stubBody(doc);
}

/** Read + normalize a source doc's frontmatter into the shape the stub needs. */
function readDoc(docPath) {
  const raw = fs.readFileSync(docPath, 'utf8');
  const { data } = matter(raw);
  const stamp = dateStamp(data.date);
  const postSlug = (typeof data.blog_post === 'string' && data.blog_post.trim())
    ? data.blog_post.trim().replace(/^\/+/, '')
    : slugTail(data.slug || '');
  // First non-empty body line makes a reasonable default ingress.
  const firstLine = matter(raw).content.split('\n').map((l) => l.trim()).find((l) => l && !l.startsWith('<!--'));
  return {
    slug: data.slug,
    title: data.title,
    description: data.description,
    authors: data.authors,
    tags: data.tags,
    date: data.date,
    stamp,
    postSlug,
    trigger: data.blog_trigger,
    blogPost: data.blog_post,
    ingress: firstLine || `Notes from ${data.title}.`,
  };
}

/** Walk docs/ collecting every doc that carries a `blog_trigger:`. */
function pendingDocs() {
  const out = [];
  (function rec(dir) {
    for (const e of listDir(dir)) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) { rec(full); continue; }
      if (!isDoc(e.name)) continue;
      try {
        const { data } = matter(fs.readFileSync(full, 'utf8'));
        if ('blog_trigger' in data && data.blog_trigger) {
          out.push({ path: full, trigger: data.blog_trigger, blogPost: data.blog_post || null, status: data.blog_status || null });
        }
      } catch { /* skip */ }
    }
  })(DOCS);
  return out;
}

function listPending() {
  const docs = pendingDocs();
  if (!docs.length) {
    console.log('No post-worthy docs found (none carry a `blog_trigger:`).');
    return 0;
  }
  console.log(`Post-worthy docs (${docs.length}):\n`);
  for (const d of docs) {
    const owed = !d.blogPost || d.status === 'planned';
    const mark = owed ? 'OWED ' : 'done ';
    console.log(`  [${mark}] ${path.relative(ROOT, d.path)}  (trigger: ${d.trigger}, status: ${d.status || '—'}, post: ${d.blogPost || '—'})`);
  }
  console.log('\nGenerate a stub with: make generate-blog-stub DOC=<path-above>');
  return 0;
}

function scaffold(docPathArg) {
  const docPath = path.isAbsolute(docPathArg) ? docPathArg : path.join(process.cwd(), docPathArg);
  if (!fs.existsSync(docPath) || !isDoc(docPath)) {
    console.error(`✗ not a doc file: ${docPathArg}`);
    return 1;
  }
  const doc = readDoc(docPath);
  if (!doc.trigger) {
    console.error(`✗ ${path.relative(ROOT, docPath)} has no \`blog_trigger:\` — only post-worthy docs get a companion post. Add one (see docs/blogging/blog-post-triggers.mdx).`);
    return 1;
  }
  if (!doc.slug || !String(doc.slug).startsWith('/')) {
    console.error(`✗ ${path.relative(ROOT, docPath)} has no absolute \`slug:\` — can't build a back-link.`);
    return 1;
  }
  if (!doc.stamp) {
    console.error(`✗ ${path.relative(ROOT, docPath)} has no usable \`date:\` (need YYYY-MM-DD…) — add one so the post filename can be dated.`);
    return 1;
  }
  const postFile = path.join(BLOG, `${doc.stamp}-${doc.postSlug}.md`);
  if (fs.existsSync(postFile)) {
    console.error(`✗ refusing to overwrite existing post: ${path.relative(ROOT, postFile)}`);
    return 1;
  }
  fs.writeFileSync(postFile, buildPost(doc));
  console.log(`✓ wrote ${path.relative(ROOT, postFile)}  (slug: ${doc.postSlug})`);
  console.log('\nNext — wire the back-reference in the source doc frontmatter:');
  console.log(`    blog_post: ${doc.postSlug}`);
  console.log(`    blog_status: drafted`);
  console.log('\nThen flesh out the ## Takeaways, set a real image:, and flip draft: false when ready.');
  return 0;
}

function main() {
  const args = process.argv.slice(2);
  if (args.includes('--all-pending')) return process.exit(listPending());
  const target = args.find((a) => !a.startsWith('--'));
  if (!target) {
    console.error('Usage: node scripts/generate-blog-post.js <doc-path> | --all-pending');
    return process.exit(1);
  }
  return process.exit(scaffold(target));
}

main();
