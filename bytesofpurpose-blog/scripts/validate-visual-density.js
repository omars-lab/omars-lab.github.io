#!/usr/bin/env node

/**
 * validate-visual-density.js — nudge toward interleaving visuals: a picture is worth a
 * thousand words.
 *
 * When an H2 section runs long with no diagram, chart, image, table, or even a code block,
 * a visual almost always carries the idea better than three more paragraphs. This WARNS
 * (never blocks) when a section exceeds a prose-word threshold with no visual, naming the
 * section so the author knows where to reach for the component catalog (the upgrade-post
 * skill). Advisory by design: a genuinely prose section (a reflection, a short note) is
 * fine. The point is to make a wall of text a DELIBERATE choice, not an accident.
 *
 *   wall-of-text   An H2 section > WORD_THRESHOLD prose words with no visual.   [WARN]
 *
 * Prose-word count excludes fenced code, component/HTML lines, table rows, and imports, so
 * it reflects only the prose a reader wades through. A fenced code block, a markdown table,
 * or any of our visual components counts as a legitimate visual break.
 *
 * Usage:
 *   node scripts/validate-visual-density.js [paths…]     # scan (default: blog docs)
 *   node scripts/validate-visual-density.js --json        # machine-readable
 *   node scripts/validate-visual-density.js --error-only  # exit 2 if any finding (strict gate)
 *
 * Exit codes: 0 clean · 1 findings (scan) · 2 findings (--error-only). Advisory: the HOOK
 * runs it in default (warn) mode and never blocks; `make validate-visual-density` is the
 * deliberate sweep.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DEFAULT_DIRS = ['blog', 'docs'];
const WORD_THRESHOLD = 280;

// What counts as a "visual" inside a section: one of our visual components, media, a
// markdown table, or an embedded HTML widget/chart. Kept broad so a section that carries
// ANY visual is never flagged. (A fenced code block is handled separately below.)
const VISUAL_RE = new RegExp(
  [
    // our reusable visual components
    '<FlowDiagram',
    '<UseCaseDiagram',
    '<ComparisonMatrix',
    '<Accordion',
    '<DiagramWithFootnotes',
    '<Mockup',
    '<Walkthrough',
    '<Gif',
    '<SlideDeck',
    '<Timeline',
    '<Carousel',
    '<CategoryCarousel',
    '<SvgVariantGrid',
    '<Graph',
    '<KanbanBoard',
    '<Catalog',
    '<OptionGrid',
    '<Evidence',
    // generic media / embedded widgets
    '<figure',
    '<img',
    '<svg',
    '<video',
    '<iframe',
    '<table',
    '<canvas',
    // a mermaid code fence is a visual (handled below via the fence check too, but a
    // ```mermaid line also matches here for clarity)
    '```mermaid',
  ].join('|'),
);
// A markdown table row anywhere in the section also counts as a visual.
const TABLE_ROW_RE = /^\s*\|.*\|/m;

function stripFrontmatter(text) {
  const m = text.match(/^---\n[\s\S]*?\n---\n?([\s\S]*)$/);
  return m ? m[1] : text;
}

/** Words outside fenced code and component/HTML/table/import lines — the prose a reader
 *  actually wades through. */
function proseWordCount(sectionBody) {
  const out = [];
  let inFence = false;
  for (const line of sectionBody.split('\n')) {
    if (line.trimStart().startsWith('```')) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const s = line.trimStart();
    if (s.startsWith('<') || s.startsWith('|') || s.startsWith('import ')) continue;
    out.push(line);
  }
  const words = out.join(' ').match(/[A-Za-z0-9']+/g);
  return words ? words.length : 0;
}

function scanFile(file) {
  const raw = fs.readFileSync(file, 'utf8');
  const findings = [];
  const rel = path.relative(ROOT, file);
  const body = stripFrontmatter(raw);

  // Split into H2 sections. The preamble before the first H2 (the post's lead) is
  // deliberately NOT checked: a lead paragraph is expected to be prose, not a wall of
  // text mid-article, so flagging it is noise. The nudge targets BODY sections.
  const parts = body.split(/^## (.+)$/m);
  const sections = [];
  for (let i = 1; i < parts.length; i += 2) {
    sections.push([parts[i].trim(), parts[i + 1] || '']);
  }

  for (const [head, sec] of sections) {
    // Skip machine-metadata blocks (managed by tooling, not reader prose).
    if (/AI METADATA/i.test(head) || /DO NOT (REMOVE|MODIFY|EDIT)/i.test(head)) continue;
    const hasVisual = VISUAL_RE.test(sec) || TABLE_ROW_RE.test(sec) || sec.includes('```');
    const words = proseWordCount(sec);
    if (words > WORD_THRESHOLD && !hasVisual) {
      // line of the heading in the raw file (best-effort)
      const idx = head === '(intro)' ? 0 : raw.indexOf(`## ${head}`);
      const line = idx <= 0 ? 1 : raw.slice(0, idx).split('\n').length;
      findings.push({
        file: rel,
        line,
        severity: 'warn',
        kind: 'wall-of-text',
        detail: `section "${head}" is ${words} words with no visual.`,
        suggest:
          `A picture is worth a thousand words: interleave a diagram, chart, table, or ` +
          `image (see the upgrade-post skill + the FlowDiagram / UseCaseDiagram / ` +
          `ComparisonMatrix / Accordion catalog), or split the section.`,
      });
    }
  }
  return {findings};
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

  const all = files.flatMap((f) => scanFile(f).findings);

  if (json) {
    console.log(JSON.stringify(all, null, 2));
    process.exit(all.length ? (errorOnly ? 2 : 1) : 0);
  }
  if (!all.length) {
    if (!errorOnly)
      console.log(`✅ visual density: scanned ${files.length} files, no wall-of-text sections.`);
    process.exit(0);
  }
  console.log(
    `🔎 visual density: ${all.length} wall-of-text section(s) in ${files.length} files (advisory)\n`,
  );
  for (const p of all) {
    console.log(`  ${p.file}:${p.line}  [${p.severity.toUpperCase()}:${p.kind}] ${p.detail}`);
    console.log(`      ↳ ${p.suggest}`);
  }
  process.exit(errorOnly ? 2 : 1);
}

main();
