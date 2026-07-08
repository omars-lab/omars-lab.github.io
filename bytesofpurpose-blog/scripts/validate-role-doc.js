#!/usr/bin/env node

/**
 * validate-role-doc.js — warn-tier structure check for imported role posts.
 *
 * A `/journey/roles/<role>.md` doc (authored by import-personalbook-role) consolidates a
 * personalbook role into a durable, reader-facing page. To read as a ROLE post — and to stay a
 * consistent set — each one should carry the same spine: why the role matters, the skills used in
 * it, the artifacts it produces, and the habits it keeps. This validator flags a role doc that is
 * missing that spine (or its frontmatter health), so the set doesn't drift into ad-hoc pages.
 *
 * Warn-tier: it reports findings and exits 0 (never blocks an edit). The blocking gate is
 * `make validate-roles` (which runs this AND the fail-closed leak gate validate-role-privacy).
 *
 * Checks (per role doc, excluding the README landing):
 *   - REQUIRED sections (an H2 heading matching each): a "why this role matters" section, Skills,
 *     Artifacts, Habits. (Matched loosely on keyword so wording can vary.)
 *   - Absolute, instance-relative slug: `slug: /roles/<kebab>` (journey is a docs instance; a
 *     relative/missing slug silently re-couples the URL to the folder path).
 *   - A non-empty `description:` in the ~50–160ch band (feeds og:description + the share message).
 *
 * Usage:
 *   node scripts/validate-role-doc.js               # scan all docs/journey/roles/*
 *   node scripts/validate-role-doc.js --file <path> # scan one (used by the hook)
 * Exit: always 0 (warn-tier). Prints findings to stderr.
 */

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const ROOT = path.join(__dirname, '..');
const ROLES_DIR = path.join(ROOT, 'docs', 'journey', 'roles');

// Required sections — each entry: a label + a keyword regex tested against the doc's H2 headings.
const REQUIRED_SECTIONS = [
  { label: 'why this role matters', re: /\b(why|matters|philosophy|purpose)\b/i },
  { label: 'Skills', re: /\bskills?\b/i },
  { label: 'Artifacts', re: /\bartifacts?\b/i },
  { label: 'Habits', re: /\bhabits?\b/i },
];

function scanFile(absPath) {
  const rel = path.relative(ROOT, absPath);
  const raw = fs.readFileSync(absPath, 'utf8');
  const { data, content } = matter(raw);
  const findings = [];

  // Slug: absolute + under /roles/.
  const slug = data.slug;
  if (!slug || typeof slug !== 'string' || !slug.startsWith('/')) {
    findings.push(`${rel}: slug must be absolute (\`slug: /roles/<kebab>\`), got ${JSON.stringify(slug)}`);
  } else if (!/^\/roles\/[a-z0-9-]+$/.test(slug)) {
    findings.push(`${rel}: slug should be \`/roles/<kebab>\`, got \`${slug}\``);
  }

  // Description health (mirrors the SEO/structure thresholds).
  const desc = (data.description || '').trim();
  if (!desc) {
    findings.push(`${rel}: missing \`description:\` (feeds og:description + the share message)`);
  } else if (desc.length < 50 || desc.length > 160) {
    findings.push(`${rel}: description is ${desc.length} chars (aim ~50–160)`);
  }

  // Required H2 sections.
  const h2s = (content.match(/^##\s+.+$/gm) || []).map((h) => h.replace(/^##\s+/, ''));
  for (const sec of REQUIRED_SECTIONS) {
    if (!h2s.some((h) => sec.re.test(h))) {
      findings.push(`${rel}: missing a "${sec.label}" section (an \`##\` heading)`);
    }
  }
  return findings;
}

function main() {
  const args = process.argv.slice(2);
  const fileIdx = args.indexOf('--file');
  let targets = [];
  if (fileIdx !== -1 && args[fileIdx + 1]) {
    const p = path.resolve(args[fileIdx + 1]);
    if (!p.startsWith(ROLES_DIR + path.sep)) process.exit(0);
    const base = path.basename(p).toLowerCase();
    if (base === 'readme.mdx' || base === 'readme.md') process.exit(0);
    if (fs.existsSync(p)) targets = [p];
  } else {
    if (!fs.existsSync(ROLES_DIR)) process.exit(0);
    targets = fs
      .readdirSync(ROLES_DIR)
      .filter((f) => /\.mdx?$/.test(f) && !/^readme\.mdx?$/i.test(f))
      .map((f) => path.join(ROLES_DIR, f));
  }

  const findings = targets.flatMap(scanFile);
  if (findings.length === 0) {
    console.log(`✅ role-doc: ${targets.length} role doc(s) scanned, structure OK.`);
    process.exit(0);
  }
  console.error('⚠️  role-doc structure findings (warn-tier; the blocking gate is `make validate-roles`):');
  for (const f of findings) console.error(`   • ${f}`);
  process.exit(0);
}

main();
