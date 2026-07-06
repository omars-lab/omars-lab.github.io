#!/usr/bin/env node

/**
 * validate-design-clarity.js — the MECHANICAL clarity/leak guard for /designs posts.
 *
 * Companion to the refine-design-post skill. The skill owns every JUDGMENT call (real wordiness,
 * hedge nuance, question-set coverage, leak-vs-fair-generalization); this script owns ONLY the
 * greppable subset — the rules a word-level scan can flag without false-positiving on prose. That
 * split is deliberate: a noisy guard gets muted, so we keep it conservative and warn-tier.
 *
 * SOURCE OF TRUTH for the leak list: scripts/lib/design-leak-terms.json (employer/proprietary/
 * internal names that must not ship in a post whose whole value is the GENERALIZABLE pattern).
 *
 * Findings (all warn-tier — advisory, never blocks):
 *   - leak-term        a banned proprietary/internal term (design-leak-terms.json) appears in the body
 *   - trailing-ellipsis a paragraph/line ends in a "…"/"..." placeholder-thought
 *   - verbatim-dup     a non-trivial line is repeated verbatim within the post (the "stated 3x" tell)
 *   - thin-section     a `## H2` section whose body is under MIN_SECTION_WORDS words (likely a stub)
 *   - diagram-redraw   a ```mermaid fence immediately followed by an ascii/text fence redrawing it
 *
 * Only scans /designs content (the blog whose theme is generality). Code fences and frontmatter are
 * stripped before the prose checks so a JS spread (`...`), a duplicated code line, or a banned word
 * inside a snippet can't false-fire.
 *
 * Usage:
 *   node scripts/validate-design-clarity.js [paths…]   # scan (default: designs)
 *   node scripts/validate-design-clarity.js --json      # machine-readable findings
 *
 * Exit codes: 0 always (warn-tier). The hook surfaces the warnings; this never blocks.
 */

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const ROOT = path.join(__dirname, '..');
const DEFAULT_DIRS = ['designs'];

// Leak list is the single source of truth in lib/. Read defensively — a missing/broken file just
// means the leak-term check is a no-op (the other checks still run).
let LEAK = {terms: [], allow: []};
try {
  LEAK = JSON.parse(fs.readFileSync(path.join(__dirname, 'lib', 'design-leak-terms.json'), 'utf8'));
} catch {
  LEAK = {terms: [], allow: []};
}
const ALLOW = new Set((LEAK.allow || []).map((s) => s.toLowerCase()));
// Flatten every term + its aliases into {surface, canonical} pairs for whole-word matching.
const LEAK_SURFACES = [];
for (const t of LEAK.terms || []) {
  const canonical = t.name;
  for (const surface of [t.name, ...(t.aliases || [])]) {
    if (surface && typeof surface === 'string') LEAK_SURFACES.push({surface, canonical});
  }
}

const MIN_SECTION_WORDS = 12; // below this, an H2 section is likely a stub (conservative)
const MIN_DUP_WORDS = 6; // a repeated line must be this long to count (skip short scaffolding)

// Escape a string for safe use inside a RegExp.
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Strip fenced code blocks (```…```) and inline code (`…`) from a body so prose checks don't fire
// on code. Replace a fence with blank lines (preserve line numbers) and inline code with a space.
function stripCode(body) {
  const lines = body.split('\n');
  let inFence = false;
  const out = [];
  for (const line of lines) {
    if (/^\s*```/.test(line)) {
      inFence = !inFence;
      out.push(''); // blank keeps line numbering aligned
      continue;
    }
    out.push(inFence ? '' : line.replace(/`[^`]*`/g, ' '));
  }
  return out.join('\n');
}

const isContent = (n) => /\.mdx?$/.test(n) && !path.basename(n).startsWith('_');

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    if (entry.name.startsWith('_') || entry.name === 'node_modules') continue;
    const fp = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(fp, out);
    else if (isContent(entry.name)) out.push(fp);
  }
  return out;
}

// Line number (1-based) of the first occurrence of `needle` in `raw`, for friendly reporting.
function lineOf(raw, needle) {
  const idx = raw.indexOf(needle);
  if (idx < 0) return null;
  return raw.slice(0, idx).split('\n').length;
}

function checkFile(file) {
  const rel = path.relative(ROOT, file);
  const raw = fs.readFileSync(file, 'utf8');
  let parsed;
  try {
    parsed = matter(raw);
  } catch {
    return []; // unparseable frontmatter — other validators handle that
  }
  const body = parsed.content;
  const prose = stripCode(body); // fences/inline-code removed for the prose checks
  const findings = [];
  const add = (id, detail, line) => findings.push({file: rel, id, detail, line: line || null});

  // 1. leak-term — a banned proprietary/internal name in the (prose-only) body.
  for (const {surface, canonical} of LEAK_SURFACES) {
    if (ALLOW.has(surface.toLowerCase())) continue;
    const re = new RegExp(`(?<![\\w-])${escapeRe(surface)}(?![\\w-])`, 'i');
    const m = prose.match(re);
    if (m && !ALLOW.has(m[0].toLowerCase())) {
      add(
        'leak-term',
        `possible leak: "${m[0]}" (proprietary/internal term "${canonical}" from design-leak-terms.json). ` +
          `The /designs blog ships GENERALIZABLE patterns — replace the specific instance with the reusable pattern, or remove it.`,
        lineOf(body, m[0]),
      );
    }
  }

  // 2. trailing-ellipsis — a line/paragraph that ends in a placeholder "…"/"..." thought.
  const proseLines = prose.split('\n');
  proseLines.forEach((ln, i) => {
    const t = ln.trim();
    if (/(?:…|\.\.\.)$/.test(t) && t.replace(/(?:…|\.\.\.)$/, '').trim().length > 0) {
      add(
        'trailing-ellipsis',
        `line ends in a placeholder "…" ("${t.slice(-48)}"). Commit to the thought or cut it.`,
        i + 1,
      );
    }
  });

  // 3. verbatim-dup — a non-trivial prose line repeated verbatim within the post.
  const seen = new Map();
  proseLines.forEach((ln, i) => {
    const t = ln.trim();
    if (!t || t.startsWith('#') || t.startsWith('|') || t.startsWith('>')) return; // skip headings/tables/quotes
    if (t.split(/\s+/).length < MIN_DUP_WORDS) return; // skip short scaffolding lines
    if (seen.has(t)) {
      add(
        'verbatim-dup',
        `this line is repeated verbatim (first at line ${seen.get(t)}): "${t.slice(0, 64)}${t.length > 64 ? '…' : ''}". ` +
          `State a thing once, then reference it.`,
        i + 1,
      );
    } else {
      seen.set(t, i + 1);
    }
  });

  // 4. thin-section — a `## H2` whose body (until the next H2/H1) is under MIN_SECTION_WORDS words.
  const rawLines = body.split('\n');
  let curHeading = null;
  let curStart = 0;
  let curWords = 0;
  let inFence = false;
  const flush = (endLine) => {
    if (curHeading && curWords < MIN_SECTION_WORDS) {
      add(
        'thin-section',
        `H2 section "${curHeading}" has only ~${curWords} words of body — likely a stub. ` +
          `Answer the section's core questions (see the refine-design-post SECTION-QUESTIONS rubric) or fold it up.`,
        curStart,
      );
    }
  };
  rawLines.forEach((ln, i) => {
    if (/^\s*```/.test(ln)) inFence = !inFence;
    if (!inFence && /^##\s+\S/.test(ln)) {
      flush(i);
      curHeading = ln.replace(/^##\s+/, '').trim();
      curStart = i + 1;
      curWords = 0;
    } else if (!inFence && /^#\s+\S/.test(ln)) {
      // an H1 closes the current H2 section but starts no new one
      flush(i);
      curHeading = null;
    } else if (curHeading && !inFence) {
      const t = ln.trim();
      if (t && !t.startsWith('#')) curWords += t.split(/\s+/).filter(Boolean).length;
    }
  });
  flush(rawLines.length);

  // 5. diagram-redraw — a ```mermaid fence closely followed by a text/ascii fence that redraws it.
  // Heuristic: a closing of a mermaid fence, then within a few lines an opening ``` (no lang or
  // `text`/`txt`/`ascii`) whose body has box-drawing/ascii-art characters.
  const dr = detectDiagramRedraw(body);
  if (dr) add('diagram-redraw', dr.detail, dr.line);

  return findings;
}

// Detect a mermaid fence immediately (within 4 non-blank lines) followed by a plain/text/ascii
// fence containing ascii-art (box-drawing chars or 3+ runs of pipes/plus/dash). Returns the first.
function detectDiagramRedraw(body) {
  const lines = body.split('\n');
  const fences = [];
  let open = null;
  lines.forEach((ln, i) => {
    const m = ln.match(/^\s*```(\w*)/);
    if (!m) return;
    if (open === null) open = {lang: (m[1] || '').toLowerCase(), start: i};
    else {
      fences.push({...open, end: i});
      open = null;
    }
  });
  for (let k = 0; k < fences.length - 1; k++) {
    if (fences[k].lang !== 'mermaid') continue;
    const next = fences[k + 1];
    const gap = lines
      .slice(fences[k].end + 1, next.start)
      .filter((l) => l.trim()).length;
    if (gap > 4) continue; // not "immediately" after
    const isTextish = ['', 'text', 'txt', 'ascii', 'plain'].includes(next.lang);
    if (!isTextish) continue;
    const inner = lines.slice(next.start + 1, next.end).join('\n');
    const asciiArt =
      /[┌┐└┘├┤┬┴┼─│╭╮╰╯]/.test(inner) || // box-drawing
      (inner.match(/[|+][-|+ ]{2,}[|+]/g) || []).length >= 2; // ascii boxes
    if (asciiArt) {
      return {
        line: next.start + 1,
        detail:
          `a text/ascii diagram appears right after a \`\`\`mermaid diagram — the same structure rendered twice. ` +
          `Keep the mermaid; cut the ascii redraw.`,
      };
    }
  }
  return null;
}

function main() {
  const args = process.argv.slice(2);
  const json = args.includes('--json');
  const targets = args.filter((a) => !a.startsWith('--'));

  const resolveTarget = (t) => {
    const abs = path.resolve(t);
    try {
      return fs.statSync(abs).isDirectory() ? walk(abs) : [abs];
    } catch {
      return [];
    }
  };
  // Only scan /designs content: a target file/dir outside designs/ is ignored (this guard is
  // design-blog-specific). The hook already scopes to designs, but scope here too for `make`.
  const inDesigns = (f) => /(^|[\\/])designs[\\/]/.test(path.relative(ROOT, path.resolve(f)));
  const files = (
    targets.length
      ? targets.flatMap(resolveTarget)
      : DEFAULT_DIRS.flatMap((d) => walk(path.join(ROOT, d)))
  ).filter(inDesigns);

  const findings = files.flatMap(checkFile);

  if (json) {
    console.log(JSON.stringify(findings, null, 2));
    process.exit(0);
  }

  if (!findings.length) {
    console.log('✅ design clarity: no problems found.');
    process.exit(0);
  }

  console.error(
    `✂️  design clarity: ${findings.length} advisory(ies) in ${
      new Set(findings.map((f) => f.file)).size
    } file(s) (warn)`,
  );
  for (const f of findings) {
    const loc = f.line ? `:${f.line}` : '';
    console.error(`\n  ${f.file}${loc}  [warn:clarity-${f.id}]`);
    console.error(`      ↳ ${f.detail}`);
  }
  console.error(
    '\n(advice only, not blocking.) These are the MECHANICAL tells; the judgment calls (real' +
      '\nwordiness, question-set coverage, leak-vs-fair-generalization) live in the refine-design-post' +
      '\nskill. Run it on the post to audit + tighten, and add a newly-noticed proprietary term to' +
      '\nscripts/lib/design-leak-terms.json.',
  );
  process.exit(0); // warn-tier: never block
}

main();
