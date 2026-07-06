#!/usr/bin/env node

/**
 * validate-mdx-imports.js — catch the "used a component but never imported it" bug in
 * .mdx posts/docs, statically, BEFORE it reaches a reader.
 *
 * Why this exists (the blind spot it closes): the production build EXCLUDES drafts, so a
 * broken draft that uses <FlowDiagram> without importing it (and without it being globally
 * registered) passes `docusaurus build`, every existing validator, and the em-dash/link
 * hooks — then fails only when someone finally renders that page. In MDX an unresolved
 * Capitalized tag renders as a literal (or throws at eval), so a forgotten import is a real
 * render break. This check finds it the moment the file is edited.
 *
 * A Capitalized JSX tag (<FlowDiagram>, <Tabs>) is OK if ANY of these hold:
 *   (a) it is GLOBALLY REGISTERED in src/theme/MDXComponents.tsx (no per-file import needed);
 *   (b) it is IMPORTED in this file (import X ... / import {X} ... , incl. `as X` aliases);
 *   (c) it is a known Docusaurus/MDX BUILT-IN or HTML element that needs no import.
 * Anything else is flagged:
 *   mdx-unresolved-tag   A Capitalized tag that is not registered, imported, or built-in. [ERROR]
 *
 * ERROR-tier: a missing import is a render break, not a matter of taste — so the hook blocks.
 * Lowercase tags (<div>) are ignored (intrinsic HTML). Code fences and inline-code spans are
 * stripped first so a <Tag> inside an example never false-positives. `Fragment` is whitelisted.
 *
 * Usage:
 *   node scripts/validate-mdx-imports.js [paths…]     # scan (default: blog docs changelog)
 *   node scripts/validate-mdx-imports.js --json        # machine-readable findings
 *   node scripts/validate-mdx-imports.js --error-only  # exit 2 if any ERROR (for the hook)
 *
 * Exit codes: 0 clean · 1 problems found (scan) · 2 ERROR-tier found (--error-only).
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..'); // bytesofpurpose-blog/
const DEFAULT_DIRS = ['blog', 'docs', 'changelog'];
const MDX_COMPONENTS = path.join(ROOT, 'src', 'theme', 'MDXComponents.tsx');

// Docusaurus / MDX / theme components that resolve without a per-file import, plus a few
// HTML-ish capitalized names MDX passes through. Kept deliberately small and explicit.
const BUILTINS = new Set([
  'Fragment',
  // Docusaurus theme components available globally via the MDX scope / @theme:
  'Tabs',
  'TabItem',
  'Admonition',
  'Details',
  'CodeBlock',
  'TOCInline',
  'Head',
  'Highlight',
  'Mermaid',
  'DocCardList',
  'DocCard',
  'BrowserWindow',
  // MDX intrinsic-ish
  'Fragment',
]);

/**
 * Load the set of component names registered in the default export of MDXComponents.tsx.
 * These are usable in any .mdx with NO import, so they are always resolved. Parsing the
 * literal object keys is enough (they are bare identifiers `Name,`).
 */
function loadGlobalRegistry() {
  const names = new Set();
  let src;
  try {
    src = fs.readFileSync(MDX_COMPONENTS, 'utf8');
  } catch {
    return names; // not this repo / not set up → registry empty, importers still checked
  }
  // Isolate the default-export object body.
  const start = src.indexOf('export default {');
  if (start === -1) return names;
  // Find the matching close of that object (first `};` after start is sufficient here).
  const body = src.slice(start, src.indexOf('\n};', start));
  // Bare `Name,` entries (skip spreads like ...MDXComponents and comments).
  for (const m of body.matchAll(/^\s*([A-Z][A-Za-z0-9]*)\s*,/gm)) names.add(m[1]);
  return names;
}

/** Strip fenced code blocks and inline-code spans so tags inside examples don't count. */
function stripCode(src) {
  const lines = src.split('\n');
  let inFence = false;
  const out = [];
  for (const line of lines) {
    const fence = /^\s*(```|~~~)/.test(line);
    if (fence) {
      inFence = !inFence;
      out.push(''); // drop the fence line itself
      continue;
    }
    if (inFence) {
      out.push('');
      continue;
    }
    // remove inline `code` spans (may contain <Tag>)
    out.push(line.replace(/`[^`]*`/g, ''));
  }
  return out.join('\n');
}

/** Remove the YAML frontmatter block so its `<`-ish text never counts. */
function stripFrontmatter(src) {
  if (!src.startsWith('---')) return src;
  const end = src.indexOf('\n---', 3);
  return end === -1 ? src : src.slice(end + 4);
}

/**
 * Collect names bound by an import statement in this file, including:
 *   import X from '...'            → X
 *   import {A, B as C} from '...'  → A, C
 *   import X, {A} from '...'       → X, A
 *   import * as NS from '...'      → NS   (namespace; used as <NS.Thing/>, base ok)
 */
function collectImports(src) {
  const names = new Set();
  const importRe = /^\s*import\s+([^;]+?)\s+from\s+['"][^'"]+['"]/gm;
  for (const m of src.matchAll(importRe)) {
    const clause = m[1];
    // namespace import
    for (const ns of clause.matchAll(/\*\s+as\s+([A-Za-z_$][\w$]*)/g)) names.add(ns[1]);
    // default import (leading bareword before a comma or brace)
    const def = clause.match(/^\s*([A-Za-z_$][\w$]*)\s*(?:,|$)/);
    if (def && !/[{*]/.test(def[1])) names.add(def[1]);
    // named imports { A, B as C }
    const braces = clause.match(/\{([^}]*)\}/);
    if (braces) {
      for (const part of braces[1].split(',')) {
        const seg = part.trim();
        if (!seg) continue;
        const asMatch = seg.match(/\bas\s+([A-Za-z_$][\w$]*)/);
        names.add(asMatch ? asMatch[1] : seg.split(/\s+/)[0]);
      }
    }
  }
  return names;
}

/** Also treat locally const-bound Capitalized identifiers as resolved (e.g.
 *  `const MyDiagram = () => (...)` or `export const Foo = ...` defined in-page). */
function collectLocalDefs(src) {
  const names = new Set();
  for (const m of src.matchAll(/(?:^|\n)\s*(?:export\s+)?(?:const|let|var|function|class)\s+([A-Z][A-Za-z0-9]*)/g)) {
    names.add(m[1]);
  }
  return names;
}

function scanFile(file, registry) {
  const raw = fs.readFileSync(file, 'utf8');
  const problems = [];
  // .md (non-MDX) does not evaluate JSX the same way; only .mdx uses components. But .md in
  // this repo is still compiled by the MDX loader (docusaurus uses MDX for both), so a bare
  // <Tag> in .md would also break. Check both, but skip if no capitalized tag appears.
  const noFm = stripFrontmatter(raw);
  const imported = collectImports(noFm);
  const localDefs = collectLocalDefs(noFm);
  const body = stripCode(noFm);

  // Track line numbers: rebuild a line index from the ORIGINAL (post-frontmatter) so we can
  // report where a bad tag appears. We re-scan the stripped body but map by searching raw.
  const seen = new Map(); // name → first line reported (dedupe per file)
  const tagRe = /<([A-Z][A-Za-z0-9]*)\b/g;
  let m;
  while ((m = tagRe.exec(body)) !== null) {
    const name = m[1];
    if (seen.has(name)) continue;
    if (
      registry.has(name) ||
      imported.has(name) ||
      localDefs.has(name) ||
      BUILTINS.has(name)
    ) {
      continue;
    }
    // Namespaced use like <NS.Thing> — the base NS may be imported; the regex only grabs the
    // first segment, so this is already handled by `imported`. A dotted tag won't reach here.
    // Find the line number of the first occurrence in the raw file.
    const idx = raw.indexOf(`<${name}`);
    const lineNo = idx === -1 ? 0 : raw.slice(0, idx).split('\n').length;
    seen.set(name, lineNo);
    problems.push({
      file: path.relative(ROOT, file),
      line: lineNo,
      severity: 'error',
      kind: 'mdx-unresolved-tag',
      detail: `<${name}> is used but not imported, globally registered, or a known built-in.`,
      suggest:
        `Add an import for ${name}, register it in src/theme/MDXComponents.tsx if it should ` +
        `be global, or fix the tag name. (If ${name} is example text, wrap it in a code fence.)`,
    });
  }
  return {problems};
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

  const registry = loadGlobalRegistry();
  let all = files.flatMap((f) => scanFile(f, registry).problems);
  if (errorOnly) all = all.filter((p) => p.severity === 'error');

  if (json) {
    console.log(JSON.stringify(all, null, 2));
    process.exit(all.length ? (errorOnly ? 2 : 1) : 0);
  }
  if (!all.length) {
    if (!errorOnly)
      console.log(
        `✅ mdx imports: scanned ${files.length} files, every component tag resolves ` +
          `(${registry.size} globally registered).`,
      );
    process.exit(0);
  }
  const errs = all.filter((p) => p.severity === 'error').length;
  console.log(
    `🔎 mdx imports: ${all.length} unresolved tag(s) in ${files.length} files (${errs} error)\n`,
  );
  for (const p of all) {
    console.log(`  ${p.file}:${p.line}  [${p.severity.toUpperCase()}:${p.kind}] ${p.detail}`);
    console.log(`      ↳ ${p.suggest}`);
  }
  process.exit(errorOnly ? 2 : 1);
}

main();
