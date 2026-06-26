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
 * SOURCE OF TRUTH: the kind taxonomy (emoji + description + the per-kind OUTLINE contract)
 * lives in scripts/lib/blog-kinds.json. This file READS it: the emoji/description/contract
 * TEXT come from the JSON; only the test LOGIC for each outline `id` lives here (in CHECKS).
 * So to add/change a kind you edit blog-kinds.json (and add a CHECKS entry if it introduces
 * a new outline id) — you do NOT hand-edit a rules list here.
 *
 * Findings (all warn-tier — advisory, never blocks):
 *   - missing-kind        a blog post with no `kind:` (kind drives the sidebar emoji + contract)
 *   - unknown-kind        a `kind:` not in blog-kinds.json
 *   - long-sidebar-label  the sidebar entry (sidebar_label || title) is > ~3 content words
 *   - outline-<id>        a post of a given kind is missing an element its contract requires
 *   - legend-drift        the "Start Here" reader legend disagrees with blog-kinds.json
 * The missing/unknown-kind findings print the FULL legend (emoji + description per kind)
 * inline, and an outline finding prints the kind's whole contract, so the author can fix it
 * (or realize the `kind:` is wrong) without leaving the terminal.
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

// The canonical blog-kind taxonomy is the SINGLE SOURCE OF TRUTH in lib/blog-kinds.json:
// each kind declares {emoji, description, outline:[{id,label}]}. We read it here so the
// emoji, the human-readable contract, AND the known-kind set all come from one place. The
// outline `id`s map to the test functions in CHECKS below (logic stays in code; the JSON
// holds what each check REQUIRES, which is what authors + the hook + the skills read).
let KINDS = {};
try {
  KINDS = JSON.parse(fs.readFileSync(path.join(__dirname, 'lib', 'blog-kinds.json'), 'utf8')).kinds || {};
} catch {
  KINDS = {};
}
const KNOWN_KINDS = Object.keys(KINDS);

// One-line legend of every kind (emoji + name + description), shown inline when the hook
// flags a missing/unknown kind so the author can pick the right one without leaving the
// terminal.
function kindLegend() {
  return KNOWN_KINDS.map((k) => `    ${KINDS[k].emoji}  ${k} — ${KINDS[k].description}`).join('\n');
}
// The outline expectations for a given kind, as readable lines (from the JSON labels).
function outlineExpectations(kind) {
  const o = (KINDS[kind] && KINDS[kind].outline) || [];
  return o.map((c) => `      - ${c.label}`).join('\n');
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

// Particles (articles, conjunctions, short prepositions, the copula) don't count toward the
// sidebar-label word budget: "The Song of Life" reads as 2 words, not 4. We count the
// CONTENT words only.
const PARTICLES = new Set([
  'a', 'an', 'the', 'and', 'or', 'nor', 'but', 'is', 'are', 'be', 'to', 'of', 'in', 'on',
  'at', 'by', 'for', 'with', 'as', 'my', 'your', 'i', 'you',
]);
function contentWordCount(text) {
  return text
    .split(/\s+/)
    .filter(Boolean)
    .filter((w) => !PARTICLES.has(w.toLowerCase().replace(/[^a-z']/gi, ''))).length;
}

const hasH2 = (body) => /^##\s+\S/m.test(body);

// CHECKS: the TEST LOGIC for each outline element, keyed by the `id` declared in
// blog-kinds.json. The JSON owns WHAT each kind requires (the legend authors + the hook
// read); this registry owns HOW to detect it (functions can't live in JSON). When you add
// an outline `id` to a kind in blog-kinds.json, add its matching test here.
const CHECKS = {
  description: (fm) => typeof fm.description === 'string' && fm.description.trim().length > 0,
  // question-set
  sections: (fm, body) => hasH2(body),
  'question-cards': (fm, body) => /<Question[\s>]/.test(body),
  'section-banner': (fm, body) => /<SectionBanner[\s>]/.test(body),
  // quote-set
  'quote-cards': (fm, body) => /<Quote[\s>]/.test(body),
  // research: the questions to investigate (a list, a checklist, or H2/H3 question sections)
  'research-questions': (fm, body) =>
    /^\s*[-*]\s+\S/m.test(body) || /^\s*[-*]\s+\[[ xX]\]/m.test(body) || hasH2(body) || /\?/.test(body),
  // showcase: a demonstration of the technique — a component tag, a code fence, an embed/iframe,
  // an image, OR (for a landing/index showcase) links out to the showcases it groups.
  demonstrates: (fm, body) =>
    /<[A-Za-z]\w+[\s/>]/.test(body) || /```/.test(body) || /<iframe[\s>]/i.test(body) ||
    /!\[[^\]]*\]\(/.test(body) || /^\s*[-*]\s+\[/m.test(body),
  // framework
  'framework-laid-out': (fm, body) =>
    /^\s*\d+\.\s+\S/m.test(body) ||
    hasH2(body) ||
    /<DiagramWithFootnotes[\s>]/.test(body) ||
    /```mermaid/.test(body),
  // tutorial
  'steps-or-artifact': (fm, body) =>
    /^\s*\d+\.\s+\S/m.test(body) || /```/.test(body) || /<(Walkthrough|Gif)[\s>]/.test(body),
  // system-design
  mockup: (fm, body) => Boolean(fm.mockups) || /<Mockup[\s>]/.test(body),
  decisions: (fm, body) =>
    /^#{1,4}\s+.*\b(key decisions?|decisions?|trade[-\s]?offs?)\b/im.test(body),
  // design-story
  'links-to-design': (fm, body) =>
    /\]\(\/designs\/[^)\s]+\)/.test(body) || /\/designs\b/.test(body),
  // legend
  'legend-explainer': (fm, body) =>
    /<PowerLegend[\s/>]/.test(body) || /^\|.*\|/m.test(body) || /^\s*[-*]\s+\[/m.test(body),
  // learning-plan
  'goal-outcome': (fm, body) =>
    /^#{1,4}\s+.*\b(goals?|outcomes?|what you('|’)ll learn|objectives?|why)\b/im.test(body) ||
    /\*\*(goals?|outcomes?|objectives?)\b/im.test(body),
  curriculum: (fm, body) =>
    /^\s*\d+\.\s+\S/m.test(body) || // numbered curriculum
    /^#{1,4}\s+.*\b(module|milestones?|week\s*\d|stage|phase|step|curriculum|syllabus)\b/im.test(body) ||
    /^\s*[-*]\s+\[[ xX]\]\s+\S/m.test(body), // a task checklist of milestones
  resources: (fm, body) =>
    /^#{1,4}\s+.*\b(resources?|reading|references?|materials?|further reading)\b/im.test(body) ||
    /<References[\s/>]/.test(body),
  checkpoint: (fm, body) =>
    /^#{1,4}\s+.*\b(checkpoint|prerequisites?|pre-?reqs?|you('|’)re done when|done when|assessment|self-?check|how you('|’)ll know)\b/im.test(body) ||
    /\*\*(prerequisites?|checkpoint)\b/im.test(body),
  // experiment-plan
  hypothesis: (fm, body) =>
    /^#{1,4}\s+.*\b(hypothes[ie]s|prediction|we believe)\b/im.test(body) ||
    /\*\*(hypothesis|prediction)\b/im.test(body),
  'experiment-design': (fm, body) =>
    /^#{1,4}\s+.*\b(design|setup|method(ology)?|how we('|’)ll run it|how it runs|variants?|conditions?|metrics?)\b/im.test(body) ||
    /\*\*(design|setup|method)\b/im.test(body),
  // experiment-result
  outcome: (fm, body) =>
    /^#{1,4}\s+.*\b(outcomes?|results?|findings?|what happened)\b/im.test(body) ||
    /\*\*(outcomes?|results?|findings?)\b/im.test(body),
  // simulation (a /thoughts kind): a scenario it branches from + the branches/steps it walks
  scenario: (fm, body) =>
    /^#{1,4}\s+.*\b(scenario|situation|setup|starting (point|condition)|if\b)/im.test(body) ||
    /\*\*(scenario|situation|if)\b/im.test(body) ||
    /\bif\b.+\bthen\b/i.test(body),
  branches: (fm, body) =>
    /\bif\b.+\bthen\b/i.test(body) || // if/then chains
    /^\s*\d+\.\s+\S/m.test(body) || // numbered steps
    /\b(what if|then maybe|otherwise|else)\b/i.test(body),
  // prediction (a /thoughts kind): a falsifiable claim + the reasoning / when it resolves
  claim: (fm, body) =>
    /^#{1,4}\s+.*\b(prediction|i (predict|bet|expect)|will\b)/im.test(body) ||
    /\*\*(prediction|i predict|i bet)\b/im.test(body),
  rationale: (fm, body) =>
    /^#{1,4}\s+.*\b(rationale|reasoning|why|because|resolves?|when (i('|’)ll know|this resolves))\b/im.test(body) ||
    /\b(because|i (think|believe)|i('|’)ll know|resolves? (when|by))\b/i.test(body),
  // critique (a /thoughts kind): the subject under evaluation + the assessment
  subject: (fm, body) =>
    /^#{1,4}\s+.*\b(subject|what i('|’)m (critiquing|analyzing)|the (problem|critique|analysis))\b/im.test(body) ||
    hasH2(body), // any structured framing names the subject
  assessment: (fm, body) =>
    /^#{1,4}\s+.*\b(assessment|critique|analysis|what('|’)s wrong|what i('|’)d change|how it works|what('|’)s really going on)\b/im.test(body) ||
    /\*\*(assessment|critique|analysis)\b/im.test(body),
  // principle (a /thoughts kind): the observation noticed + the rule it implies
  observation: (fm, body) =>
    /^#{1,4}\s+.*\b(observation|i noticed|i('|’)ve noticed|the pattern)\b/im.test(body) ||
    /\b(i noticed|i('|’)ve noticed|i keep seeing|tends to)\b/i.test(body),
  principle: (fm, body) =>
    /^#{1,4}\s+.*\b(principle|the rule|so i now|takeaway|what i (do|live by))\b/im.test(body) ||
    /\*\*(principle|the rule)\b/im.test(body) ||
    /\bso i now\b/i.test(body),
};

// OUTLINES is built FROM the JSON: for each kind, its outline specs (id + label) paired
// with the test from CHECKS. The contract text lives in blog-kinds.json (one source of
// truth); only the test logic lives here.
const OUTLINES = Object.fromEntries(
  KNOWN_KINDS.map((kind) => [
    kind,
    (KINDS[kind].outline || [])
      .filter((spec) => CHECKS[spec.id]) // skip specs with no matching test (warn below)
      .map((spec) => ({id: spec.id, label: spec.label, test: CHECKS[spec.id]})),
  ]),
);

// Surface any outline id declared in the JSON that has no test in CHECKS (a lockstep slip).
for (const kind of KNOWN_KINDS) {
  for (const spec of KINDS[kind].outline || []) {
    if (!CHECKS[spec.id]) {
      console.error(
        `⚠️  blog-kinds.json: kind "${kind}" outline id "${spec.id}" has no test in validate-post-outline.js CHECKS (skipped).`,
      );
    }
  }
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

  // A blog post with NO `kind:` can't get a type-based sidebar emoji. Show the full legend
  // (emoji + description per kind) so the author can pick the right one inline.
  if (!kind) {
    if (isBlogPost && KNOWN_KINDS.length) {
      findings.push({
        file: path.relative(ROOT, file),
        kind: '(none)',
        id: 'missing-kind',
        detail:
          'blog post has no `kind:` (it drives the sidebar emoji + the outline contract). Pick one:\n' +
          kindLegend() +
          '\n  (source of truth: scripts/lib/blog-kinds.json)',
      });
    }
    return findings;
  }

  // An unknown kind (not in the taxonomy) can't get an emoji and has no outline contract.
  if (isBlogPost && KNOWN_KINDS.length && !KNOWN_KINDS.includes(kind)) {
    findings.push({
      file: path.relative(ROOT, file),
      kind,
      id: 'unknown-kind',
      detail:
        `kind: "${kind}" is not a known blog kind. Pick one:\n` +
        kindLegend() +
        '\n  (source of truth: scripts/lib/blog-kinds.json)',
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
    const words = contentWordCount(labelText); // particles (the/of/and/is…) don't count
    if (labelText && (words > MAX_LABEL_WORDS || labelText.length > MAX_LABEL_CHARS)) {
      findings.push({
        file: path.relative(ROOT, file),
        kind,
        id: 'long-sidebar-label',
        detail: usingLabel
          ? `sidebar_label "${labelText}" is long (${words} content words / ${labelText.length} chars). Aim for <= ${MAX_LABEL_WORDS} content words.`
          : `no \`sidebar_label:\` and the title is long (${words} content words / ${labelText.length} chars) for the sidebar. Add a short \`sidebar_label:\` (<= ${MAX_LABEL_WORDS} content words); the full title stays on the page.`,
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
        detail:
          `kind: ${kind} post is missing ${check.label}\n` +
          `       (a ${KINDS[kind].emoji} ${kind} post should have:\n${outlineExpectations(kind)}\n` +
          `        ...or the kind may be wrong for this post. source: scripts/lib/blog-kinds.json)`,
      });
    }
  }
  return findings;
}

// Drift check: the READER legend (the standalone Legend page's kind->emoji table) must list
// the same emoji as the MACHINE legend (blog-kinds.json). They drift when a kind is added to
// one and not the other (e.g. design-story added to the JSON but not the page). We match on the
// EMOJI column (stable; the page uses display names like "System design", not kebab keys).
// (The Legend moved from a blog post → a standalone page → its OWN docs instance; the
// kind→emoji table now lives in the instance README. This path follows it.)
const LEGEND_POST = path.join(ROOT, 'docs', 'legend', 'README.mdx');
function checkLegendDrift() {
  if (!fs.existsSync(LEGEND_POST)) return [];
  let body;
  try {
    body = fs.readFileSync(LEGEND_POST, 'utf8');
  } catch {
    return [];
  }
  // Emoji present in the JSON taxonomy (skip the 'legend' row's own self-reference? no, the
  // post documents every kind including legend).
  const jsonEmoji = new Set(KNOWN_KINDS.map((k) => KINDS[k].emoji));
  // Pull the first cell of every markdown table row that looks like an emoji.
  const postEmoji = new Set();
  for (const line of body.split('\n')) {
    const m = line.match(/^\|\s*([^\s|][^|]*?)\s*\|/);
    if (!m) continue;
    const cell = m[1].trim();
    if (/^(?:\p{Extended_Pictographic}|\p{Emoji_Presentation})/u.test(cell)) postEmoji.add(cell);
  }
  if (!postEmoji.size) return []; // no recognizable legend table; don't false-alarm
  const findings = [];
  const rel = path.relative(ROOT, LEGEND_POST);
  for (const k of KNOWN_KINDS) {
    if (!postEmoji.has(KINDS[k].emoji)) {
      findings.push({
        file: rel,
        kind: k,
        id: 'legend-drift',
        detail: `the "Start Here" legend table is missing kind "${k}" (${KINDS[k].emoji}). Add a row so the reader legend matches blog-kinds.json.`,
      });
    }
  }
  for (const e of postEmoji) {
    if (!jsonEmoji.has(e)) {
      findings.push({
        file: rel,
        kind: '(?)',
        id: 'legend-drift',
        detail: `the "Start Here" legend table has an emoji (${e}) that is not in blog-kinds.json. Remove the stale row or add the kind to blog-kinds.json.`,
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

  // Legend drift is a one-shot, corpus-level check. Run it when we're scanning the blog
  // broadly OR when the edited file IS the legend post (so editing either side nudges).
  const touchesLegend =
    !targets.length ||
    files.some((f) => path.resolve(f) === LEGEND_POST) ||
    files.some((f) => /[\\/]blog[\\/]/.test(f));
  if (touchesLegend) findings.push(...checkLegendDrift());

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
  console.error(
    '\n(advice only, not blocking.) Each finding deserves a TASK, not a reflex fix: first' +
      '\nINVESTIGATE (is the POST missing structure, or is the `kind:` wrong for what it is?),' +
      '\nthen decide the IDEAL fix (enrich the post, OR reclassify the kind), then apply it.' +
      '\nA legend that is really an essay, or a system-design that is really a framework, is' +
      '\nfixed by correcting `kind:` (see scripts/lib/blog-kinds.json), not by forcing' +
      '\nmissing elements onto it. See the author-blog-post + upgrade-post skills.'
  );
  process.exit(0); // warn-tier: never block
}

main();
