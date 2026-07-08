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
 * POLICY: flag the em-dash EVERYWHERE in scope (including inside code) — keep that scan
 * dead-simple. ALSO flag the "--" double-hyphen BYPASS (typing "--" to dodge the em-dash
 * rule is the same AI-voice anti-pattern wearing a disguise). The "--" matcher mirrors the
 * hook: it flags "--" only when it reads as a prose dash (" -- " spaced, or "word-- "
 * attached-before) and SKIPS legitimate "--": CLI flags (--port), "---" rules / frontmatter
 * delimiters, "<!-- -->" comments, fenced ``` code blocks, and a dash inside a markdown link's
 * [title] text (a quoted external title). (The em-dash check stays
 * code-inclusive; the "--" check is code-aware because "--" is common+legitimate in code.)
 * Only U+2014 ("—") and the "--" bypass are flagged; en-dash (–) and a lone hyphen (-) are fine.
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

// "--" bypass: does this (code-sanitized, non-rule) line use "--" as a prose dash?
// Mirrors em-dash-voice-hook.sh.
// Strip the DISPLAY TEXT of a markdown link/image (`[title]` / `![alt]`) from a line before
// dash scanning. The bracket text of a link is a LABEL — often the verbatim title of an
// external article — so a dash there is a faithful quote, not the author's AI-voice cadence.
// This blinds the scanner to bracket contents ONLY; a dash anywhere else on the line (prose,
// or the (url)) still flags. Example: `[Kafka is fast -- I'll use Postgres](https://…)` is
// exempt, but `foo -- bar [x](y)` still trips.
function stripLinkTitles(line) {
  return line.replace(/!?\[[^\]]*\]/g, '');
}

function hasDashBypass(line) {
  let s = stripLinkTitles(line);
  s = s.replace(/`[^`]*`/g, ''); // drop inline code spans
  s = s.replace(/<!--/g, '').replace(/-->/g, ''); // drop html comment markers
  const collapsed = s.replace(/\s/g, '');
  if (/^-+$/.test(collapsed)) return false; // a pure "---" rule / frontmatter delimiter
  // spaced sentence dash " -- " (both sides space, not "---"); never a CLI flag
  if (/[^-] -- [^-]/.test(s) || /^-- [^-]/.test(s) || /[^-] --$/.test(s)) return true;
  // attached-before "word-- " (CLI flags have a space BEFORE "--", so this excludes them)
  if (/[\w,.;:!?'")]-- +\w/.test(s)) return true;
  return false;
}

const findings = [];
for (const file of files) {
  let text;
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch {
    continue;
  }
  const lines = text.split('\n');
  let inFence = false;
  lines.forEach((line, i) => {
    // track fenced code blocks (for the "--" check only; em-dash stays code-inclusive)
    const trimmed = line.trimStart();
    const isFenceToggle = /^(```|~~~)/.test(trimmed);

    // Scan with markdown-link DISPLAY TEXT stripped: a dash inside `[title]` is a quoted
    // external title (a faithful reproduction), not the author's AI-voice cadence. A dash
    // anywhere else on the line still flags.
    const scanLine = stripLinkTitles(line);
    const emCount = scanLine.includes(EM_DASH) ? scanLine.split(EM_DASH).length - 1 : 0;
    // Em-dash HTML entities (&#8212; decimal, &#x2014; hex, &mdash; named) RENDER as an
    // em-dash, so they are the same AI-voice tell in disguise. Common inside mermaid labels
    // (the old bypass). Code-inclusive like the em-dash check.
    const entityCount = (scanLine.match(/&#8212;|&#[xX]0*2014;|&mdash;/g) || []).length;
    const dashBypass = !inFence && !isFenceToggle && hasDashBypass(line);

    if (isFenceToggle) inFence = !inFence;

    if (emCount === 0 && entityCount === 0 && !dashBypass) return;
    let snip = line.trim();
    if (snip.length > 120) snip = snip.slice(0, 117) + '...';
    const parts = [];
    if (emCount > 0) parts.push('em-dash');
    if (entityCount > 0) parts.push('em-dash entity');
    if (dashBypass) parts.push('"--"');
    const kind = parts.join(' + ');
    findings.push({
      file: path.relative(SITE_ROOT, file),
      line: i + 1,
      count: emCount + entityCount + (dashBypass ? 1 : 0),
      kind,
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
    console.log(`${f.file}:${f.line} [${f.kind}]: ${f.snippet}`);
  }
  if (total === 0) {
    console.log('✓ em-dash: no em-dashes (—) or "--" bypasses in public-facing content.');
  } else {
    console.error(`\n✗ em-dash: ${total} occurrence(s) across ${fileCount} file(s).`);
    console.error('An em-dash (—) or "--" bypass reads as AI voice. Rephrase: comma · colon · period-split · parentheses.');
  }
}

process.exit(total === 0 ? 0 : 1);
