#!/usr/bin/env node

/**
 * validate-footnotes.js — evidence-footnote integrity check for Bytes of Purpose posts.
 *
 * Sibling of validate-links.js. Where that one lints inline links, this one validates
 * the GFM footnotes that carry SOURCE EVIDENCE via the <Evidence> component:
 *
 *     [^ari]: <Evidence repo="sacred-patterns" sha="746bed6"
 *        path="docs/retrospectives/2026-06-06-image-to-dsl-retrospective.md"
 *        lines="64-66" note="…" />
 *
 * Each <Evidence> resolves to a GitHub permalink (pinned commit SHA + line range) in
 * one of the sibling source repos. A footnote is only worth anything if that permalink
 * is REAL — so this validator proves, OFFLINE (via local git), that:
 *
 *   footnote-orphan     A [^id] is referenced in the body but never defined.        [ERROR]
 *   footnote-unused     A [^id]: is defined but never referenced in the body.       [ERROR]
 *   footnote-dup        A [^id]: is defined more than once.                         [ERROR]
 *   evidence-attr       An <Evidence> is missing a required attr (repo/sha/path/    [ERROR]
 *                       note) or lines is malformed (not "N" or "N-M", N<=M).
 *   evidence-repo       <Evidence repo="X"> where X is not in evidence-repos.json.  [ERROR]
 *   evidence-sha        The sha is not a commit in the local sibling repo, OR it is [ERROR]
 *                       not reachable from the repo's remote tracking branch
 *                       (→ the permalink would 404 on GitHub: unpushed/typo'd SHA).
 *   evidence-path       The path does not exist in the repo tree AT that sha        [ERROR]
 *                       (untracked or moved file → dead permalink).
 *   evidence-lines      The line range exceeds the file's length at that sha.       [ERROR]
 *
 * Everything is ERROR-tier: a footnote that points at a non-resolving permalink is a
 * broken public link + (for private repos) a misleading citation, so the hook blocks on it.
 *
 * Note on PRIVACY: this validator does NOT care whether a repo is public or private —
 * that only governs whether the <Evidence> component RENDERS a clickable link in prod
 * (public) vs prose-only (private). Either way the underlying permalink must be REAL,
 * so we validate the SHA/path/lines for every repo regardless of visibility.
 *
 * Usage:
 *   node scripts/validate-footnotes.js [paths…]      # scan (default: blog docs changelog)
 *   node scripts/validate-footnotes.js --json        # machine-readable findings
 *   node scripts/validate-footnotes.js --error-only  # exit 2 if any ERROR (for the hook)
 *
 * Exit codes: 0 clean · 1 problems found (scan) · 2 ERROR-tier found (--error-only).
 */

const fs = require('fs');
const path = require('path');
const {execFileSync} = require('child_process');

const ROOT = path.join(__dirname, '..');               // bytesofpurpose-blog/
const REPO_ROOT = path.join(ROOT, '..');               // the omars-lab.github.io checkout root
const DEFAULT_DIRS = ['blog', 'docs', 'changelog'];

const MANIFEST_PATH = path.join(ROOT, 'src', 'data', 'evidence-repos.json');

// --- repo manifest -------------------------------------------------------
function loadManifest() {
  try {
    const j = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
    return j.repos || {};
  } catch (e) {
    console.error(`validate-footnotes: cannot read ${MANIFEST_PATH}: ${e.message}`);
    process.exit(3);
  }
}
const REPOS = loadManifest();

// Resolve a repo's absolute local path from the manifest's localPath (relative to ROOT).
function repoLocalDir(meta) {
  return path.resolve(ROOT, meta.localPath);
}

// --- git helpers (offline; operate on the local sibling clone) ------------
const gitCache = {};
function git(repoDir, args) {
  try {
    return execFileSync('git', ['-C', repoDir, ...args], {encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore']}).trim();
  } catch (e) {
    return null;
  }
}

// Is `sha` a real commit object in this repo?
function shaExists(repoDir, sha) {
  const key = `${repoDir}\0type\0${sha}`;
  if (key in gitCache) return gitCache[key];
  const out = git(repoDir, ['cat-file', '-t', sha]);
  return (gitCache[key] = out === 'commit');
}

// Is `sha` reachable from ANY remote-tracking branch (origin/*)? If not, the GitHub
// permalink can't resolve — the commit isn't pushed.
function shaPushed(repoDir, sha) {
  const key = `${repoDir}\0pushed\0${sha}`;
  if (key in gitCache) return gitCache[key];
  const out = git(repoDir, ['branch', '-r', '--contains', sha]);
  return (gitCache[key] = !!out && out.length > 0);
}

// The file's contents at `sha:path`, or null if the path doesn't exist at that sha.
function fileAtSha(repoDir, sha, p) {
  return git(repoDir, ['show', `${sha}:${p}`]);
}

// --- parsing -------------------------------------------------------------
// A footnote definition line:  [^id]: …
const DEF_RE = /^\[\^([A-Za-z0-9_-]+)\]:/;
// A footnote reference in the body:  …[^id]
const REF_RE = /\[\^([A-Za-z0-9_-]+)\]/g;
// An <Evidence …/> tag (single self-closing).
const EVIDENCE_RE = /<Evidence\b([^>]*?)\/?>/g;

function parseAttrs(raw) {
  const attrs = {};
  const re = /(\w+)\s*=\s*"([^"]*)"/g;
  let m;
  while ((m = re.exec(raw)) !== null) attrs[m[1]] = m[2];
  return attrs;
}

function parseLines(lines) {
  if (lines === undefined || lines === '') return {ok: true, range: null}; // optional
  const m = String(lines).trim().match(/^(\d+)(?:-(\d+))?$/);
  if (!m) return {ok: false};
  const start = parseInt(m[1], 10);
  const end = m[2] ? parseInt(m[2], 10) : start;
  if (start < 1 || end < start) return {ok: false};
  return {ok: true, range: {start, end}};
}

// --- per-file scan -------------------------------------------------------
function scanFile(file) {
  const problems = [];
  const text = fs.readFileSync(file, 'utf8');
  const lines = text.split('\n');
  const rel = path.relative(REPO_ROOT, file);

  const add = (lineNo, kind, severity, detail, suggest) =>
    problems.push({file: rel, line: lineNo, kind, severity, detail, suggest});

  // 1) Footnote reference/definition integrity.
  const defs = {};           // id → [lineNo,…]
  const refs = {};           // id → count (references NOT on a definition line)
  lines.forEach((ln, i) => {
    const lineNo = i + 1;
    const defM = ln.match(DEF_RE);
    const defId = defM ? defM[1] : null;
    if (defId) (defs[defId] = defs[defId] || []).push(lineNo);
    // Count references, but skip the [^id] that opens a definition line.
    let m;
    REF_RE.lastIndex = 0;
    while ((m = REF_RE.exec(ln)) !== null) {
      if (defId && m.index === 0) continue; // the definition's own [^id]:
      refs[m[1]] = (refs[m[1]] || 0) + 1;
    }
  });

  for (const [id, count] of Object.entries(refs)) {
    if (!defs[id]) add(0, 'footnote-orphan', 'error',
      `[^${id}] is referenced ${count}× but never defined`,
      `Add a "[^${id}]: …" definition, or fix the reference typo.`);
  }
  for (const [id, at] of Object.entries(defs)) {
    if (at.length > 1) add(at[1], 'footnote-dup', 'error',
      `[^${id}] is defined ${at.length}× (lines ${at.join(', ')})`,
      `Keep a single definition per footnote id.`);
    if (!refs[id]) add(at[0], 'footnote-unused', 'error',
      `[^${id}] is defined but never referenced in the body`,
      `Reference it with [^${id}] at the claim it supports, or remove the definition.`);
  }

  // 2) <Evidence> validation.
  lines.forEach((ln, i) => {
    const lineNo = i + 1;
    let m;
    EVIDENCE_RE.lastIndex = 0;
    while ((m = EVIDENCE_RE.exec(ln)) !== null) {
      const attrs = parseAttrs(m[1]);
      const {repo, sha, path: p, note, lines: lineSpec} = attrs;

      // Required attrs.
      const missing = ['repo', 'sha', 'path', 'note'].filter((k) => !attrs[k]);
      if (missing.length) {
        add(lineNo, 'evidence-attr', 'error',
          `<Evidence> missing required attr(s): ${missing.join(', ')}`,
          `Every <Evidence> needs repo, sha, path, note (lines optional).`);
        continue;
      }
      const lr = parseLines(lineSpec);
      if (!lr.ok) {
        add(lineNo, 'evidence-attr', 'error',
          `<Evidence lines="${lineSpec}"> is malformed`,
          `Use lines="N" or lines="N-M" with N<=M.`);
        continue;
      }

      // Repo known?
      const meta = REPOS[repo];
      if (!meta) {
        add(lineNo, 'evidence-repo', 'error',
          `<Evidence repo="${repo}"> is not in evidence-repos.json`,
          `Add ${repo} to src/data/evidence-repos.json (owner/name/public/localPath).`);
        continue;
      }
      const repoDir = repoLocalDir(meta);
      if (!fs.existsSync(path.join(repoDir, '.git'))) {
        add(lineNo, 'evidence-repo', 'error',
          `local clone for "${repo}" not found at ${path.relative(REPO_ROOT, repoDir)}`,
          `Fix localPath in evidence-repos.json, or clone the sibling repo there.`);
        continue;
      }

      // SHA real + pushed.
      if (!shaExists(repoDir, sha)) {
        add(lineNo, 'evidence-sha', 'error',
          `sha "${sha}" is not a commit in ${repo}`,
          `Pin to a real commit SHA (git -C ${path.relative(REPO_ROOT, repoDir)} rev-parse HEAD).`);
        continue;
      }
      if (!shaPushed(repoDir, sha)) {
        add(lineNo, 'evidence-sha', 'error',
          `sha "${sha}" in ${repo} is not reachable from any origin/* branch (unpushed → permalink 404s)`,
          `Push the commit, then pin to a SHA that exists on the remote.`);
        continue;
      }

      // Path exists at SHA.
      const content = fileAtSha(repoDir, sha, p);
      if (content === null) {
        add(lineNo, 'evidence-path', 'error',
          `path "${p}" does not exist in ${repo} at ${sha}`,
          `Check the path (and that the file is committed at that SHA).`);
        continue;
      }

      // Line range within bounds.
      if (lr.range) {
        const nLines = content.split('\n').length;
        if (lr.range.end > nLines) {
          add(lineNo, 'evidence-lines', 'error',
            `lines="${lineSpec}" exceeds ${p} length (${nLines} lines) at ${sha}`,
            `Narrow the range to within the file at that SHA.`);
        }
      }
    }
  });

  return {problems};
}

// --- fs walk -------------------------------------------------------------
function walk(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, {withFileTypes: true})) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(full));
    else if (/\.mdx?$/.test(e.name)) out.push(full);
  }
  return out;
}

// --- main ----------------------------------------------------------------
function main() {
  const args = process.argv.slice(2);
  const json = args.includes('--json');
  const errorOnly = args.includes('--error-only');
  const targets = args.filter((a) => !a.startsWith('--'));
  const dirs = (targets.length ? targets : DEFAULT_DIRS).map((d) =>
    path.isAbsolute(d) ? d : path.join(ROOT, d)
  );
  const files = dirs.flatMap((d) =>
    fs.existsSync(d) && fs.statSync(d).isDirectory() ? walk(d) : (fs.existsSync(d) ? [d] : [])
  );

  let all = files.flatMap((f) => scanFile(f).problems);
  if (errorOnly) all = all.filter((p) => p.severity === 'error');

  if (json) {
    console.log(JSON.stringify(all, null, 2));
    process.exit(all.length ? (errorOnly ? 2 : 1) : 0);
  }
  if (!all.length) {
    if (!errorOnly) console.log(`✅ footnote evidence: scanned ${files.length} files, all permalinks resolve.`);
    process.exit(0);
  }
  const errs = all.filter((p) => p.severity === 'error').length;
  console.log(`🔎 footnote evidence: ${all.length} problem(s) in ${files.length} files (${errs} error)\n`);
  for (const p of all) {
    console.log(`  ${p.file}:${p.line}  [${p.severity.toUpperCase()}:${p.kind}] ${p.detail}`);
    console.log(`      ↳ ${p.suggest}`);
  }
  process.exit(errorOnly ? 2 : 1);
}

main();
