#!/usr/bin/env node

/**
 * validate-questions.js — lint the optional `questions:` frontmatter field.
 *
 * A post MAY declare `questions:` — the reader questions it sets out to answer (the
 * reader-facing mirror of the repo convention "frame each task around the MAIN QUESTION").
 * The <PostQuestions> box renders them at the top of the post. The field is OPTIONAL by
 * design (so the existing corpus needn't be retrofitted at once), but WHEN PRESENT it must
 * be well-formed, or the box reads wrong:
 *
 *   questions-empty       `questions:` is present but empty (an empty box, or a signal    [WARN]
 *                         the author meant to fill it).
 *   questions-not-list    `questions:` is a scalar, not a list.                           [WARN]
 *   questions-blank-item  a list item is blank.                                           [WARN]
 *   questions-not-a-q     a list item does not end in "?" (a topic label, not a question).[WARN]
 *
 * All WARN-tier: the field is advisory, so this nudges (never blocks). The blocking gate is
 * `make validate-questions` for a deliberate full-corpus sweep.
 *
 * Usage:
 *   node scripts/validate-questions.js [paths…]      # scan (default: blog docs)
 *   node scripts/validate-questions.js --json         # machine-readable
 *   node scripts/validate-questions.js --error-only   # exit 2 if any finding (for a strict gate)
 *
 * Exit codes: 0 clean · 1 findings (scan) · 2 findings (--error-only).
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DEFAULT_DIRS = ['blog', 'docs'];

/** Extract the raw YAML frontmatter block (between the leading --- fences). */
function frontmatterBlock(src) {
  if (!src.startsWith('---')) return null;
  const end = src.indexOf('\n---', 3);
  if (end === -1) return null;
  return src.slice(3, end);
}

/**
 * Parse the `questions:` value out of a frontmatter block without a YAML dep.
 * Supports the two YAML list forms:
 *   inline:   questions: [a?, b?]
 *   block:    questions:\n  - a?\n  - b?
 * Returns {present, items} where items is the array of raw string values, or null if the
 * value is a scalar (present but not a list).
 */
function parseQuestions(fm) {
  const lines = fm.split('\n');
  const startIdx = lines.findIndex((l) => /^questions\s*:/.test(l));
  if (startIdx === -1) return {present: false, items: []};

  const header = lines[startIdx];
  const afterColon = header.replace(/^questions\s*:/, '').trim();

  // inline list form
  if (afterColon.startsWith('[')) {
    const inner = afterColon.replace(/^\[/, '').replace(/\]\s*$/, '');
    if (inner.trim() === '') return {present: true, items: []};
    const items = inner
      .split(',')
      .map((s) => s.trim().replace(/^['"]|['"]$/g, ''));
    return {present: true, items};
  }

  // a non-empty scalar on the same line → present but not a list
  if (afterColon !== '' && !afterColon.startsWith('#')) {
    return {present: true, items: null};
  }

  // block list form: collect following `  - item` lines
  const items = [];
  for (let i = startIdx + 1; i < lines.length; i++) {
    const l = lines[i];
    if (/^\s*-\s+/.test(l)) {
      items.push(l.replace(/^\s*-\s+/, '').trim().replace(/^['"]|['"]$/g, ''));
    } else if (/^\S/.test(l)) {
      break; // next top-level key
    } else if (l.trim() === '') {
      continue;
    } else {
      break;
    }
  }
  return {present: true, items};
}

function scanFile(file) {
  const raw = fs.readFileSync(file, 'utf8');
  const findings = [];
  const fm = frontmatterBlock(raw);
  if (!fm) return {findings};
  const {present, items} = parseQuestions(fm);
  if (!present) return {findings};

  const rel = path.relative(ROOT, file);
  const line = raw.slice(0, raw.indexOf('questions:')).split('\n').length;
  const add = (kind, detail, suggest) =>
    findings.push({file: rel, line, severity: 'warn', kind, detail, suggest});

  if (items === null) {
    add(
      'questions-not-list',
      '`questions:` is a scalar, not a list.',
      'Make it a YAML list: `questions:` then `  - ...?` items (or `[a?, b?]`).',
    );
    return {findings};
  }
  if (items.length === 0) {
    add(
      'questions-empty',
      '`questions:` is present but empty.',
      'Add the reader questions this post answers, or remove the field.',
    );
    return {findings};
  }
  items.forEach((q) => {
    if (!q) {
      add('questions-blank-item', 'a `questions:` item is blank.', 'Remove the blank item or fill it in.');
    } else if (!q.endsWith('?')) {
      add(
        'questions-not-a-q',
        `a \`questions:\` item does not end in "?": "${q}".`,
        'Phrase it as a question (the box reads as "Questions this post answers").',
      );
    }
  });
  return {findings};
}

function walk(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, {withFileTypes: true})) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(full));
    else if (/\.mdx?$/.test(e.name)) out.push(full);
  }
  return out;
}

function main() {
  const args = process.argv.slice(2);
  const json = args.includes('--json');
  const errorOnly = args.includes('--error-only');
  const targets = args.filter((a) => !a.startsWith('--'));
  const dirs = (targets.length ? targets : DEFAULT_DIRS).map((d) =>
    path.isAbsolute(d) ? d : path.join(ROOT, d),
  );
  const files = dirs.flatMap((d) =>
    fs.existsSync(d) && fs.statSync(d).isDirectory() ? walk(d) : fs.existsSync(d) ? [d] : [],
  );

  const all = files.flatMap((f) => scanFile(f).findings);

  if (json) {
    console.log(JSON.stringify(all, null, 2));
    process.exit(all.length ? (errorOnly ? 2 : 1) : 0);
  }
  if (!all.length) {
    if (!errorOnly)
      console.log(`✅ questions: scanned ${files.length} files, every \`questions:\` field is well-formed.`);
    process.exit(0);
  }
  console.log(`🔎 questions: ${all.length} finding(s) in ${files.length} files (advisory)\n`);
  for (const p of all) {
    console.log(`  ${p.file}:${p.line}  [${p.severity.toUpperCase()}:${p.kind}] ${p.detail}`);
    console.log(`      ↳ ${p.suggest}`);
  }
  process.exit(errorOnly ? 2 : 1);
}

main();
