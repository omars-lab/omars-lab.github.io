#!/usr/bin/env node

/**
 * validate-post-naming.js — warn-tier check that a post's TITLE voice matches its NATURE.
 *
 * A title is a promise about what the post IS. The common failure is a voice mismatch: an
 * UNACTIONED thought (a /thoughts idea) titled like a finished accomplishment, so it reads as a
 * completed initiative. "My First NotePlan Plugin" reads as "the plugin I built" when the post is
 * really "should I build a NotePlan plugin?". The naming contract (see author-post/mechanics.md,
 * "Naming"; the audit-post-names skill runs this check):
 *   - /thoughts (idea-class kinds)  → an open QUESTION / speculative phrasing (it's being weighed)
 *   - /initiatives (acted-on)       → what I DID (a dated accomplishment)
 *   - /craft, /journey (durable)    → the lasting CONCEPT (a noun phrase / "Understanding X")
 *
 * This flags the high-signal case: a /thoughts post (idea/simulation/critique/... — the thought
 * kinds) whose title matches a "completed-initiative" pattern. Warn-tier only; naming is a judgment
 * call, so the check NEVER blocks — it reminds + suggests the question form.
 *
 * Usage:  node scripts/validate-post-naming.js [--json] [--file <path>]
 * Exit:   always 0 (advisory). The hook surfaces findings without blocking.
 */

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const ROOT = path.join(__dirname, '..');
const BLOG_KINDS = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'scripts', 'lib', 'blog-kinds.json'), 'utf8'),
).kinds;

// The kinds that represent an UNACTIONED THOUGHT (a /thoughts post), from the source of truth.
const THOUGHT_KINDS = new Set(Object.keys(BLOG_KINDS).filter((k) => BLOG_KINDS[k]?.thought));

// Content roots that hold the temporal posts (thoughts = unactioned; we only check thoughts here).
const THOUGHTS_DIR = path.join(ROOT, 'thoughts');

const args = process.argv.slice(2);
const JSON_OUT = args.includes('--json');
const fileArg = (() => {
  const i = args.indexOf('--file');
  return i >= 0 ? path.resolve(args[i + 1]) : null;
})();

const rel = (p) => path.relative(ROOT, p);

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, {withFileTypes: true})) {
    if (e.name.startsWith('_') || e.name.startsWith('.')) continue;
    const fp = path.join(dir, e.name);
    if (e.isDirectory()) walk(fp, out);
    else if (/\.mdx?$/.test(e.name)) out.push(fp);
  }
  return out;
}

// Strip a leading emoji so the patterns test the real words.
function titleWords(raw) {
  return (raw || '').replace(/^\s*\p{Extended_Pictographic}️?\s*/u, '').trim();
}

// "Reads as a completed initiative" patterns for an idea-class title. Each returns a suggested fix.
function completedInitiativeTell(title) {
  const t = titleWords(title);
  if (!t) return null;
  // "My First X" — reads as the thing I made, not the question of whether to.
  let m = t.match(/^my first\s+(.+)$/i);
  if (m) return {pattern: 'my-first', suggest: `Should I build my first ${m[1]}?`};
  // A bare doing-gerund with no question mark — reads as the log of doing it.
  m = t.match(/^(building|creating|making|writing|developing|porting)\s+(.+?)\.?$/i);
  if (m && !t.includes('?')) return {pattern: 'doing-gerund', suggest: `Should I ${m[1].replace(/ing$/i, '').toLowerCase()} ${m[2]}?`};
  return null;
}

function findings(files) {
  const out = [];
  for (const file of files) {
    let data;
    try {
      data = matter(fs.readFileSync(file, 'utf8')).data || {};
    } catch {
      continue;
    }
    if (data.draft === true && !fileArg) {
      // Drafts still get checked when explicitly --file'd (the author is working on it now), but a
      // corpus run focuses on what ships. Actually: naming applies to drafts too (it's a content
      // smell to fix before publishing), so check drafts as well — do NOT skip.
    }
    const kind = (data.kind || '').toString();
    // Every post UNDER thoughts/ is an unactioned thought BY ITS HOME, regardless of whether its
    // `kind:` is already a thought-kind (a mis-tagged idea, e.g. kind: reflection, is exactly the
    // kind of post that also has the wrong title voice). So the title-voice check applies to every
    // thoughts/ post; the kind only sharpens the message. (We're walking thoughts/ already, so all
    // files here qualify; the THOUGHT_KINDS set is used only to annotate.)
    const tell = completedInitiativeTell(data.title);
    if (tell) {
      const kindNote = THOUGHT_KINDS.has(kind)
        ? `kind: ${kind}`
        : `kind: ${kind || 'unset'} — and note an idea-class title under /thoughts usually wants kind: idea, not "${kind || 'unset'}"`;
      out.push({
        file: rel(file),
        id: 'thought-titled-as-done',
        detail: `title "${(data.title || '').toString()}" reads as a completed initiative, but this is an unactioned thought (${kindNote}). Phrase the question being weighed — e.g. "${tell.suggest}". (See audit-post-names / author-post.)`,
      });
    }
  }
  return out;
}

function run() {
  const files = fileArg ? [fileArg] : walk(THOUGHTS_DIR);
  const found = findings(files);

  if (JSON_OUT) {
    console.log(JSON.stringify({count: files.length, findings: found}, null, 2));
  } else if (!found.length) {
    console.log(`✅ post naming: ${files.length} thought post(s) checked — titles read in the right voice.`);
  } else {
    console.log(`🏷  post naming: ${found.length} title(s) read as a completed initiative but are unactioned thoughts\n`);
    for (const f of found) {
      console.log(`  ${f.file}  [warn:${f.id}]`);
      console.log(`      ↳ ${f.detail}`);
    }
    console.log('\n(advice only — naming is a judgment call. See audit-post-names / author-post.)');
  }
  process.exit(0); // advisory — never blocks.
}

run();
