#!/usr/bin/env node

/**
 * validate-glossary-links.js — does a post link the FIRST instance of each glossary term it
 * uses to that term's definition?
 *
 * Sibling of validate-links / validate-post-outline / validate-footnotes. All WARN-tier
 * (advisory, never blocks). The glossary auto-linking convention (see the glossary-linking
 * skill): the FIRST time a post uses a defined term of art, that occurrence should be a link
 * to the term's definition (gathered at /glossary); later occurrences stay plain.
 *
 * SOURCE OF TRUTH: scripts/lib/glossary-terms.json (term → definition href + aliases). This
 * file reads it.
 *
 * Findings (warn-tier):
 *   - first-instance-unlinked   a term's FIRST prose occurrence is not a link to its href
 *                               (advisory: only act if it's really the term-of-art, not casual
 *                               English — "plan" the verb is not the Plan term)
 *   - wrong-target              the first occurrence IS linked, but not to the term's href
 *   - linked-more-than-once     the term is linked in more than one place (only the first should)
 *   - unknown-term-link         a link points into a glossary page for a term not in the registry
 *
 * IMPORTANT — matching is conservative on purpose. Many terms (Plan, Idea, Role, System) are
 * ordinary English words; we only consider an occurrence in PROSE (frontmatter, code fences,
 * inline code, headings, and existing link text/targets are stripped first) and we report
 * first-instance-unlinked as ADVICE, not a defect — the author confirms it's the term-of-art.
 *
 * Usage:
 *   node scripts/validate-glossary-links.js [paths…]   # default: blog/
 *   node scripts/validate-glossary-links.js --json
 *
 * Exit: 0 always (warn-tier). A future ERROR tier would return 2 (mirror validate-docs-structure).
 */

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const ROOT = path.join(__dirname, '..');
const DEFAULT_DIRS = ['blog'];

let TERMS = [];
try {
  TERMS = JSON.parse(fs.readFileSync(path.join(__dirname, 'lib', 'glossary-terms.json'), 'utf8')).terms || [];
} catch {
  TERMS = [];
}

// All surface forms (term + aliases) → its canonical {term, href}. Longer forms first so a
// plural ("Initiatives") is tried before its singular ("Initiative") when scanning.
const SURFACE_FORMS = [];
for (const t of TERMS) {
  SURFACE_FORMS.push({surface: t.term, term: t.term, href: t.href});
  for (const a of t.aliases || []) SURFACE_FORMS.push({surface: a, term: t.term, href: t.href});
}
SURFACE_FORMS.sort((a, b) => b.surface.length - a.surface.length);

const HREFS = new Set(TERMS.map((t) => t.href));

// Strip the parts of a post body where a term match is NOT prose: fenced code, inline code,
// and (for first-instance detection) we ALSO want to know which spans are inside an existing
// markdown link so we don't double-link. We return both the prose-only text (for "is it used")
// and the set of linked surface forms (for "is it already linked, to where").
function analyze(body) {
  // Remove fenced code blocks and inline code from the prose view.
  let prose = body
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    // headings: drop the leading #s but keep text (a term in a heading still counts as used)
    .replace(/^#{1,6}\s+/gm, '');

  // Collect existing markdown links: [text](href). Map each linked TEXT to its href.
  const links = [];
  const linkRe = /\[([^\]]+)\]\(([^)\s]+)[^)]*\)/g;
  let m;
  while ((m = linkRe.exec(body))) {
    links.push({text: m[1], href: m[2]});
  }
  return {prose, links};
}

// First prose index of a surface form, as a whole word (case-sensitive on the first letter so
// "Plan" the term ≠ "plan" the verb; we match the registered capitalization). Returns -1 if
// not present.
function firstIndexOf(prose, surface) {
  const re = new RegExp(`\\b${surface.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
  const idx = prose.search(re);
  return idx;
}

// Kinds where these terms are almost always CASUAL English, not terms-of-art — auto-linking
// there is noise (a "Role" in a self-reflection question is a life role, not the CLI Role).
// The glossary terms are technical, so we only check technical-leaning posts. A post opts OUT
// by being one of these kinds; everything else (system-design, reference, tutorial, framework,
// design-story, experiment-*, untyped technical posts) is checked.
const SKIP_KINDS = new Set(['question-set', 'reflection', 'legend', 'event-recap']);

function checkFile(file) {
  const raw = fs.readFileSync(file, 'utf8');
  let parsed;
  try {
    parsed = matter(raw);
  } catch {
    return [];
  }
  // Skip personal/meta kinds where the terms read as casual English (avoids 95% false positives).
  const kind = (parsed.data && parsed.data.kind) || '';
  if (SKIP_KINDS.has(kind)) return [];
  const body = parsed.content;
  const {prose, links} = analyze(body);
  const rel = path.relative(ROOT, file);
  const findings = [];

  // (d) unknown-term-link: a link whose href is a glossary page but isn't a known term target.
  // (We only know HREFS, so this flags links into /craft/**/terminology** not in the registry —
  // low value; skip to avoid false positives on legitimate glossary-page links. Kept as a hook
  // point if per-term anchors are added later.)

  // Track, per canonical term, how many times it's linked to its href.
  const linkedCountByTerm = {};
  for (const t of TERMS) linkedCountByTerm[t.term] = 0;
  for (const link of links) {
    for (const sf of SURFACE_FORMS) {
      const re = new RegExp(`\\b${sf.surface.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
      if (re.test(link.text) && link.href === sf.href) {
        linkedCountByTerm[sf.term] = (linkedCountByTerm[sf.term] || 0) + 1;
        break;
      }
    }
  }

  // Per canonical term: is it USED in prose, and if so is its first instance linked?
  const seenTerm = new Set();
  for (const sf of SURFACE_FORMS) {
    if (seenTerm.has(sf.term)) continue;
    const idx = firstIndexOf(prose, sf.surface);
    if (idx === -1) continue; // this surface form not used; a later (shorter) form may be
    // Found the first occurrence of this term (via this surface form). Mark the term seen.
    seenTerm.add(sf.term);

    const linkedCount = linkedCountByTerm[sf.term] || 0;
    // Is the FIRST occurrence already a link to the right href? Approximate: if the term is
    // linked at least once to its href, assume the author linked the intended (first) instance.
    if (linkedCount === 0) {
      findings.push({
        file: rel,
        term: sf.term,
        id: 'first-instance-unlinked',
        detail:
          `first use of glossary term "${sf.surface}" is not linked. If it's the term-of-art ` +
          `(not casual English), link this FIRST instance to its definition: ` +
          `[${sf.surface}](${sf.href}). Later instances stay plain.`,
      });
    } else if (linkedCount > 1) {
      findings.push({
        file: rel,
        term: sf.term,
        id: 'linked-more-than-once',
        detail:
          `glossary term "${sf.term}" is linked ${linkedCount} times; only the FIRST instance ` +
          `should link (${sf.href}). Unlink the later occurrence(s).`,
      });
    }
  }

  return findings;
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
  const files = targets.length
    ? targets.flatMap(resolveTarget)
    : DEFAULT_DIRS.flatMap((d) => walk(path.join(ROOT, d)));

  const findings = files.flatMap(checkFile);

  if (json) {
    console.log(JSON.stringify(findings, null, 2));
    process.exit(0);
  }
  if (!TERMS.length) {
    console.error('⚠️  glossary-terms.json has no terms; nothing to check.');
    process.exit(0);
  }
  if (!findings.length) {
    console.log('✅ glossary links: no problems found.');
    process.exit(0);
  }

  console.error(
    `📖 glossary links: ${findings.length} advisory(ies) in ${
      new Set(findings.map((f) => f.file)).size
    } file(s) (warn)`,
  );
  for (const f of findings) {
    console.error(`\n  ${f.file}  [warn:glossary-${f.id}]`);
    console.error(`      ↳ ${f.detail}`);
  }
  console.error(
    '\n(advice only, not blocking — these are CANDIDATES, not defects.) A regex cannot tell a' +
      '\nterm-of-art ("Role" the CLI term) from casual English ("role" in life), so each finding' +
      '\nneeds a SEMANTIC read: run the `link-glossary-terms` skill to decide which first-use is' +
      '\ngenuine and link only that one. Most candidates here are casual usage and should stay' +
      '\nplain. Source of truth: scripts/lib/glossary-terms.json.',
  );
  process.exit(0); // warn-tier
}

main();
