#!/usr/bin/env node

/**
 * validate-url-params.js — keep the URL-parameter REGISTRY (src/lib/url-params.ts) in lockstep with
 * the code that actually reads query params.
 *
 * URL params used to sprawl across files with no shared list. The registry is now the single source
 * of truth (every param: owner, purpose, prod-vs-localhost scope, allowed values). This validator
 * greps src/ for param READS and FAILS if it finds a query key (or `x-` prefix) that the registry
 * doesn't declare — so a new param can't quietly creep in undocumented. The fix when it fails is to
 * add the param to URL_PARAMS in src/lib/url-params.ts (the same change that introduced the read).
 *
 * What it scans for (the common read shapes):
 *   - searchParams.get('key') / params.get('key') / .get("key")
 *   - new URLSearchParams(...).get('key')
 *   - q.get('key'), p.get('key') (any identifier .get('literal'))
 *   - startsWith('prefix-')  (the prefix-style params: ab-, ht-)
 *
 * Usage:  node scripts/validate-url-params.js
 * Exit:   2 if any read references an UNREGISTERED key/prefix; else 0.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const REGISTRY_REL = 'src/lib/url-params.ts';

// ── 1. Read the registered keys + prefixes straight out of the registry source (no TS import). ────
// We parse the URL_PARAMS literal for `key: '...'` and `prefix: true` pairs. This is deliberately
// simple (string scan) so the validator has zero build deps.
function readRegistry() {
  const txt = fs.readFileSync(path.join(ROOT, REGISTRY_REL), 'utf8');
  const exact = new Set();
  const prefixes = new Set();
  // split into entries on `{ ... }` blocks that contain a `key:`
  const entryRe = /key:\s*['"]([^'"]+)['"]([^}]*?)(?:prefix:\s*(true))?[^}]*?}/gs;
  // simpler: walk each `key: '...'`, then look ahead a little for a `prefix: true` before the next key
  const keyRe = /key:\s*['"]([^'"]+)['"]/g;
  let m;
  const keysWithPos = [];
  while ((m = keyRe.exec(txt))) keysWithPos.push({key: m[1], idx: m.index});
  for (let i = 0; i < keysWithPos.length; i++) {
    const {key, idx} = keysWithPos[i];
    const end = i + 1 < keysWithPos.length ? keysWithPos[i + 1].idx : txt.length;
    const slice = txt.slice(idx, end);
    if (/prefix:\s*true/.test(slice)) prefixes.add(key);
    else exact.add(key);
  }
  void entryRe;
  return {exact, prefixes};
}

function isRegistered(key, reg) {
  if (reg.exact.has(key)) return true;
  for (const p of reg.prefixes) if (key === p || key.startsWith(p)) return true;
  return false;
}

// ── 2. Walk src/ for source files and extract the param keys each one reads. ──────────────────────
const SKIP_DIRS = new Set(['node_modules', '.docusaurus', 'build']);
const CODE_EXT = new Set(['.ts', '.tsx', '.js', '.jsx']);

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (CODE_EXT.has(path.extname(full))) out.push(full);
  }
  return out;
}

// keys we should NOT flag: these are NOT url params (header reads, posthog internals, etc.)
const IGNORE_KEYS = new Set([
  'content-type', // an HTTP header read (r.headers.get('content-type')), not a url param
  'http', // startsWith('http') link checks
  'https',
  'mailto',
  '/',
  '#',
]);

// .get('literal') for any identifier (searchParams/params/q/p/url.searchParams/headers — we filter
// out header reads heuristically by ignoring known header names in IGNORE_KEYS).
const GET_RE = /\.get\(\s*['"]([a-zA-Z0-9_-]+)['"]\s*\)/g;
const STARTSWITH_RE = /\.startsWith\(\s*['"]([a-zA-Z0-9_-]+-)['"]\s*\)/g;

function extractKeys(txt) {
  const found = new Set();
  let m;
  while ((m = GET_RE.exec(txt))) found.add(m[1]);
  while ((m = STARTSWITH_RE.exec(txt))) found.add(m[1]);
  return found;
}

// ── 3. Cross-check + report. ──────────────────────────────────────────────────────────────────────
function main() {
  const reg = readRegistry();
  if (reg.exact.size + reg.prefixes.size === 0) {
    console.error(`✗ url-params: could not parse any entries from ${REGISTRY_REL} — is it intact?`);
    process.exit(2);
  }

  const files = walk(SRC);
  const offenders = []; // {file, key}
  for (const f of files) {
    if (f.endsWith('url-params.ts')) continue; // the registry itself
    const txt = fs.readFileSync(f, 'utf8');
    for (const key of extractKeys(txt)) {
      if (IGNORE_KEYS.has(key)) continue;
      if (!isRegistered(key, reg)) {
        offenders.push({file: path.relative(ROOT, f), key});
      }
    }
  }

  if (offenders.length === 0) {
    const n = reg.exact.size + reg.prefixes.size;
    console.log(
      `✅ url-params: every query param read in src/ is registered (${n} entries in ${REGISTRY_REL}).`,
    );
    process.exit(0);
  }

  console.error(
    `🪧 url-params: ${offenders.length} UNREGISTERED query param read(s) — add them to ${REGISTRY_REL}:`,
  );
  for (const o of offenders) {
    console.error(`   • '${o.key}'  read in ${o.file}`);
  }
  console.error(
    `\nIf one of these is NOT a url param (e.g. an HTTP header), add it to IGNORE_KEYS in this script.`,
  );
  process.exit(2);
}

main();
