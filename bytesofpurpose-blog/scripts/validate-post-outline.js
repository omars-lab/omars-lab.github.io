#!/usr/bin/env node

/**
 * validate-post-outline.js — does a post of a given KIND have its required elements?
 *
 * Sibling of validate-docs-structure.js (which checks the FOLDER/IA contract) and
 * validate-links/footnotes. This one checks a post's CONTENT OUTLINE: a post that declares
 * `kind: <x>` in frontmatter must contain the structural elements that make that kind of
 * post complete. It encodes the editorial expectation that, e.g., a SYSTEM-DESIGN post is
 * the "polished upgrade" — it should paint the whole picture, not just dump prose.
 *
 * Current rules (warn-tier — advisory, never blocks):
 *   kind: system-design  must have →
 *     - a UX mockup           (<Mockup …> in the body OR a `mockups:` frontmatter link)
 *     - a Decisions section   (a heading matching Decisions / Key Decisions / Trade-offs / Trade offs)
 *     - a description         (non-empty `description:` frontmatter)
 *
 * Posts with no `kind:` are skipped (no rule applies). Add new kinds to OUTLINES below.
 *
 * Usage:
 *   node scripts/validate-post-outline.js [paths…]   # scan (default: blog + designs + docs)
 *   node scripts/validate-post-outline.js --json      # machine-readable findings
 *
 * Exit codes: 0 always (warn-tier). The hook surfaces the warnings; this never blocks.
 * (If a future rule is promoted to ERROR tier, return 2 on it — mirror validate-docs-structure.)
 */

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const ROOT = path.join(__dirname, '..');
const DEFAULT_DIRS = ['blog', 'designs', 'docs'];

// Per-kind required elements. Each check: {id, label, test(fm, body) -> boolean present}.
const OUTLINES = {
  'system-design': [
    {
      id: 'mockup',
      label: 'a UX mockup (a <Mockup> in the body, or a `mockups:` frontmatter sidecar link)',
      test: (fm, body) => Boolean(fm.mockups) || /<Mockup[\s>]/.test(body),
    },
    {
      id: 'decisions',
      label: 'a Decisions section (a heading like "Key Decisions" / "Decisions" / "Trade-offs")',
      test: (fm, body) =>
        /^#{1,4}\s+.*\b(key decisions?|decisions?|trade[-\s]?offs?)\b/im.test(body),
    },
    {
      id: 'description',
      label: 'a non-empty `description:` frontmatter (powers the social card + share text)',
      test: (fm) => typeof fm.description === 'string' && fm.description.trim().length > 0,
    },
  ],
};

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

function checkFile(file) {
  const raw = fs.readFileSync(file, 'utf8');
  let parsed;
  try {
    parsed = matter(raw);
  } catch {
    return []; // unparseable frontmatter — other validators handle that
  }
  const kind = parsed.data && parsed.data.kind;
  if (!kind || !OUTLINES[kind]) return []; // no rule for this kind
  const findings = [];
  for (const check of OUTLINES[kind]) {
    if (!check.test(parsed.data, parsed.content)) {
      findings.push({
        file: path.relative(ROOT, file),
        kind,
        id: check.id,
        detail: `kind: ${kind} post is missing ${check.label}`,
      });
    }
  }
  return findings;
}

function main() {
  const args = process.argv.slice(2);
  const json = args.includes('--json');
  const targets = args.filter((a) => !a.startsWith('--'));

  const files = targets.length
    ? targets.map((t) => path.resolve(t))
    : DEFAULT_DIRS.flatMap((d) => walk(path.join(ROOT, d)));

  const findings = files.flatMap(checkFile);

  if (json) {
    console.log(JSON.stringify(findings, null, 2));
    process.exit(0);
  }

  if (!findings.length) {
    console.log('✅ post outline: no problems found.');
    process.exit(0);
  }

  console.error(
    `📐 post outline: ${findings.length} advisory(ies) in ${
      new Set(findings.map((f) => f.file)).size
    } file(s) (warn)`
  );
  for (const f of findings) {
    console.error(`\n  ${f.file}  [warn:outline-${f.id}]`);
    console.error(`      ↳ ${f.detail}`);
  }
  console.error('\n(advice only — not blocking. See the upgrade-post + import-co-design skills.)');
  process.exit(0); // warn-tier: never block
}

main();
