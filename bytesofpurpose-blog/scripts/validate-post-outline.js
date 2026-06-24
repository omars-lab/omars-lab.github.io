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
 *   kind: question-set   must have →
 *     - H2 sections           (themed clusters; the questions are grouped, not a flat list)
 *     - <Question> cards      (each question is a card, not a bare bullet)
 *     - a <SectionBanner>     (the per-section "why these matter" callout)
 *     - a description
 *   kind: framework      must have →
 *     - the framework laid out (numbered steps, an H2-per-stage, or a diagram/<DiagramWithFootnotes>)
 *     - a description
 *   kind: tutorial       must have →
 *     - steps or a runnable artifact (numbered steps, a code fence, a <Walkthrough>, or a <Gif>)
 *     - a description
 *   kind: reference / reflection / event-recap → a description (light contract; mostly prose)
 *   kind: legend         must have →
 *     - a legend/explainer of the conventions it indexes (a table, a <PowerLegend>, or links out)
 *     - a description
 *
 * The `kind:` value must be one of the blog kinds in scripts/lib/blog-kind-emoji.json
 * (that file drives the sidebar emoji). An UNKNOWN kind is itself a finding here.
 * Posts with no `kind:` are skipped by THIS file's outline checks; the missing-kind
 * nudge lives in validate-blog-kind.js. Add new kinds to OUTLINES below AND to the map.
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

// The canonical blog kinds (drives the sidebar emoji). A `kind:` not in this set is
// flagged as unknown by checkFile().
let KNOWN_KINDS = [];
try {
  KNOWN_KINDS = Object.keys(
    JSON.parse(fs.readFileSync(path.join(__dirname, 'lib', 'blog-kind-emoji.json'), 'utf8')).kinds,
  );
} catch {
  KNOWN_KINDS = [];
}

// Sidebar-label length budget. The kind emoji is added automatically, so these bound the
// TEXT only. ~3 words / ~32 chars keeps a Posts-sidebar entry to a single tidy line.
const MAX_LABEL_WORDS = 3;
const MAX_LABEL_CHARS = 32;

// Drop a leading emoji (+ trailing space) so the length check measures the words a human
// reads, not the auto-prepended kind glyph.
function stripLeadingEmoji(s) {
  return s.replace(/^(?:\p{Extended_Pictographic}|\p{Emoji_Presentation})[️‍]*\s*/u, '');
}

// Reusable checks.
const hasDescription = {
  id: 'description',
  label: 'a non-empty `description:` frontmatter (powers the social card + share text)',
  test: (fm) => typeof fm.description === 'string' && fm.description.trim().length > 0,
};
const hasH2 = (body) => /^##\s+\S/m.test(body);

// Per-kind required elements. Each check: {id, label, test(fm, body) -> boolean present}.
// Kinds must match scripts/lib/blog-kind-emoji.json (which drives the sidebar emoji).
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
    hasDescription,
  ],
  'question-set': [
    {
      id: 'sections',
      label: 'themed H2 sections (questions grouped by theme, not a flat list)',
      test: (fm, body) => hasH2(body),
    },
    {
      id: 'question-cards',
      label: 'one or more <Question> cards (each question is a card, not a bare bullet)',
      test: (fm, body) => /<Question[\s>]/.test(body),
    },
    {
      id: 'section-banner',
      label: 'a <SectionBanner> (the per-section "why these questions matter" callout)',
      test: (fm, body) => /<SectionBanner[\s>]/.test(body),
    },
    hasDescription,
  ],
  framework: [
    {
      id: 'framework-laid-out',
      label:
        'the framework laid out (numbered steps, an H2-per-stage, or a <DiagramWithFootnotes>/mermaid)',
      test: (fm, body) =>
        /^\s*\d+\.\s+\S/m.test(body) ||
        hasH2(body) ||
        /<DiagramWithFootnotes[\s>]/.test(body) ||
        /```mermaid/.test(body),
    },
    hasDescription,
  ],
  tutorial: [
    {
      id: 'steps-or-artifact',
      label:
        'steps or a runnable artifact (numbered steps, a code fence, a <Walkthrough>, or a <Gif>)',
      test: (fm, body) =>
        /^\s*\d+\.\s+\S/m.test(body) ||
        /```/.test(body) ||
        /<(Walkthrough|Gif)[\s>]/.test(body),
    },
    hasDescription,
  ],
  legend: [
    {
      id: 'legend-explainer',
      label:
        'an explainer of the conventions it indexes (a table, a <PowerLegend>, or a list of links out)',
      test: (fm, body) =>
        /<PowerLegend[\s/>]/.test(body) || /^\|.*\|/m.test(body) || /^\s*[-*]\s+\[/m.test(body),
    },
    hasDescription,
  ],
  reference: [hasDescription],
  reflection: [hasDescription],
  'event-recap': [hasDescription],
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
  const findings = [];
  // Only enforce the kind vocabulary for BLOG posts (docs use their own kind words).
  const isBlogPost = /\/(blog|designs)\//.test(file);

  // A blog post with NO `kind:` can't get a type-based sidebar emoji. Nudge to add one.
  if (!kind) {
    if (isBlogPost && KNOWN_KINDS.length) {
      findings.push({
        file: path.relative(ROOT, file),
        kind: '(none)',
        id: 'missing-kind',
        detail: `blog post has no \`kind:\`. Add one of: ${KNOWN_KINDS.join(', ')} (drives the sidebar emoji; see scripts/lib/blog-kind-emoji.json)`,
      });
    }
    return findings;
  }

  // An unknown kind (not in the emoji map) can't get an emoji and has no outline contract.
  if (isBlogPost && KNOWN_KINDS.length && !KNOWN_KINDS.includes(kind)) {
    findings.push({
      file: path.relative(ROOT, file),
      kind,
      id: 'unknown-kind',
      detail: `kind: "${kind}" is not a known blog kind. Use one of: ${KNOWN_KINDS.join(', ')} (see scripts/lib/blog-kind-emoji.json)`,
    });
  }

  // Sidebar label length: the entry shown in the Posts list should be SHORT (a long title
  // wraps to a messy multi-line block). The effective label is `sidebar_label:` if set,
  // else the title. Strip a leading emoji (the kind emoji is prepended automatically) and
  // warn when the remaining text is long. The FULL title stays on the page H1, so this
  // only asks for a short `sidebar_label:`, not for shortening the title itself.
  if (isBlogPost) {
    const fm = parsed.data;
    const usingLabel = typeof fm.sidebar_label === 'string' && fm.sidebar_label.trim();
    const labelText = stripLeadingEmoji(
      (usingLabel ? fm.sidebar_label : fm.title || '').toString().trim(),
    );
    const words = labelText.split(/\s+/).filter(Boolean).length;
    if (labelText && (words > MAX_LABEL_WORDS || labelText.length > MAX_LABEL_CHARS)) {
      findings.push({
        file: path.relative(ROOT, file),
        kind,
        id: 'long-sidebar-label',
        detail: usingLabel
          ? `sidebar_label "${labelText}" is long (${words} words / ${labelText.length} chars). Aim for <= ${MAX_LABEL_WORDS} words.`
          : `no \`sidebar_label:\` and the title is long (${words} words / ${labelText.length} chars) for the sidebar. Add a short \`sidebar_label:\` (<= ${MAX_LABEL_WORDS} words); the full title stays on the page.`,
      });
    }
  }

  if (!OUTLINES[kind]) return findings; // no outline contract for this kind
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

  // Resolve each target: a directory is walked for content files; a file is used as-is.
  // (Allows `validate-post-outline.js blog` as well as explicit file paths.)
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
