#!/usr/bin/env node

/**
 * validate-em-dash.js — repo-wide AI-voice em-dash scanner for Bytes of Purpose.
 *
 * WHY: a literal em-dash (U+2014 "—") in reader-facing copy is a strong tell of
 * AI-generated voice. The PostToolUse `Edit|Write` hook (.claude/hooks/em-dash-voice-hook.sh)
 * only catches em-dashes in files CLAUDE edits — it never scans the existing corpus.
 * Anything that arrived before the hook, via a human edit, a bulk script, or git,
 * was never checked. This script is the standing repo-wide guard the hook lacked:
 * it sweeps ALL in-scope public-facing content and reports every occurrence.
 *
 * SCOPE (mirrors the hook):
 *   - prose:      bytesofpurpose-blog/{docs,blog,designs,changelog}/**.{md,mdx}
 *   - components: bytesofpurpose-blog/src/**.{tsx,jsx}
 *
 * POLICY: flag EVERYTHING — every em-dash in scope, including those inside fenced
 * code blocks / inline-code spans (a deliberate decision: keep the scan dead-simple
 * and let a human keep any genuinely-literal one rather than silently exempt code).
 * Only U+2014 ("—") is flagged; en-dash (–) and hyphen (-) are fine.
 *
 * Usage:
 *   node scripts/validate-em-dash.js                 # scan (default scope) — file:line:snippet
 *   node scripts/validate-em-dash.js --json          # machine-readable findings
 *   node scripts/validate-em-dash.js [paths…]        # restrict to given paths
 *
 * Exit codes: 0 clean · 1 one or more em-dashes found.
 */

const fs = require('fs');
const path = require('path');

const EM_DASH = '—';

// Default scope, relative to the site root (this script lives in <siteroot>/scripts).
const SITE_ROOT = path.resolve(__dirname, '..');
const DEFAULT_DIRS = ['docs', 'blog', 'designs', 'changelog', 'src'];

const args = process.argv.slice(2);
const asJson = args.includes('--json');
const pathArgs = args.filter((a) => !a.startsWith('--'));
const roots = pathArgs.length ? pathArgs : DEFAULT_DIRS.map((d) => path.join(SITE_ROOT, d));

function inScope(file) {
  const ext = path.extname(file);
  if (ext === '.md' || ext === '.mdx') {
    return /\/(docs|blog|designs|changelog)\//.test(file);
  }
  if (ext === '.tsx' || ext === '.jsx') {
    return /\/src\//.test(file);
  }
  return false;
}

function walk(target, acc) {
  let stat;
  try {
    stat = fs.statSync(target);
  } catch {
    return;
  }
  if (stat.isDirectory()) {
    if (/\/(node_modules|build|\.docusaurus|\.git)\//.test(target + '/')) return;
    for (const entry of fs.readdirSync(target)) {
      if (entry === 'node_modules' || entry === 'build' || entry === '.docusaurus' || entry === '.git') continue;
      walk(path.join(target, entry), acc);
    }
  } else if (stat.isFile() && inScope(target)) {
    acc.push(target);
  }
}

const files = [];
for (const r of roots) walk(path.resolve(r), files);
files.sort();

const findings = [];
for (const file of files) {
  let text;
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch {
    continue;
  }
  if (!text.includes(EM_DASH)) continue;
  const lines = text.split('\n');
  lines.forEach((line, i) => {
    if (!line.includes(EM_DASH)) return;
    const count = line.split(EM_DASH).length - 1;
    let snip = line.trim();
    if (snip.length > 120) snip = snip.slice(0, 117) + '...';
    findings.push({
      file: path.relative(SITE_ROOT, file),
      line: i + 1,
      count,
      snippet: snip,
    });
  });
}

const total = findings.reduce((n, f) => n + f.count, 0);
const fileCount = new Set(findings.map((f) => f.file)).size;

if (asJson) {
  console.log(JSON.stringify({ total, files: fileCount, findings }, null, 2));
} else {
  for (const f of findings) {
    console.log(`${f.file}:${f.line}: ${f.snippet}`);
  }
  if (total === 0) {
    console.log('✓ em-dash: no em-dashes (—) in public-facing content.');
  } else {
    console.error(`\n✗ em-dash: ${total} occurrence(s) across ${fileCount} file(s).`);
    console.error('An em-dash (—) in reader-facing copy reads as AI voice. Rephrase: comma · colon · period-split · parentheses.');
  }
}

process.exit(total === 0 ? 0 : 1);
