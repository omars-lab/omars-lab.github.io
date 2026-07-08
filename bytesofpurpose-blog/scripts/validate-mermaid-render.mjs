#!/usr/bin/env node
// validate-mermaid-render.mjs — the HEAVY, less-frequent mermaid legibility check.
//
// The cheap sibling (validate-mermaid-complexity.js) scores a fence by TEXT metrics on every
// edit. This one does what text can't: it HEADLESS-RENDERS each mermaid diagram with the real
// mermaid engine (via Playwright's bundled Chromium) and inspects the ACTUAL layout —
//
//   render-fail     the diagram fails to render (a mermaid syntax error the draft-only,
//                   client-rendered page would hide until the post is published).   [WARN]
//   node-overlap    two node bounding-boxes overlap (they collide / sit on top of
//                   each other) — a real "unreadable" the source text can't reveal. [WARN]
//   oversize        the rendered SVG is far wider or taller than a readable page
//                   column (it will shrink to an illegible thumbnail or scroll off). [WARN]
//
// Because a Chromium launch costs ~1-3s, this is NOT a per-edit hook. It is meant to run:
//   - on session completion, git-gated to the diagrams TOUCHED this session (the Stop hook), or
//   - deliberately, `make validate-mermaid-render` (optionally over given files).
// Warn-tier: exit 0 clean · 1 findings. Never blocks.
//
// Usage:
//   node scripts/validate-mermaid-render.mjs [files…]        # render the mermaid in these files
//   node scripts/validate-mermaid-render.mjs --changed        # only files changed vs HEAD (git)
//   node scripts/validate-mermaid-render.mjs --json           # machine-readable

import {readFileSync, existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');

// Legibility thresholds for the RENDERED svg (px). Only HEIGHT and EXTREME width are flagged:
// a `flowchart LR` is naturally wide and the site wraps diagrams in overflow-x:auto, so a wide-
// but-normal-height diagram scrolls fine — width alone is NOT a problem. A very TALL diagram
// overflows vertically (tiny text once scaled to fit), and an absurdly wide one won't scroll
// comfortably either. These are set past the legible corpus (most render < 1000px tall).
const MAX_H = 1600; // taller than this = vertical overflow / illegible when scaled
const MAX_W = 3000; // only an EXTREME width (well past normal horizontal scroll) is flagged
const OVERLAP_TOLERANCE = 4; // px of bbox intersection to ignore (touching borders are fine)

const args = process.argv.slice(2);
const asJson = args.includes('--json');
const changedOnly = args.includes('--changed');
let files = args.filter((a) => !a.startsWith('--'));

// --changed: the design/blog content files that differ from HEAD (tracked changes AND new
// untracked files — a brand-new diagram post is exactly when you want the check) that contain
// a mermaid fence.
if (changedOnly) {
  const repoRoot = ROOT.replace(/\/bytesofpurpose-blog$/, '');
  const gitLines = (cmdArgs) => {
    try {
      return execFileSync('git', cmdArgs, {cwd: repoRoot, encoding: 'utf8'})
        .split('\n')
        .filter(Boolean);
    } catch {
      return [];
    }
  };
  const list = [
    ...gitLines(['diff', '--name-only', 'HEAD', '--', 'bytesofpurpose-blog']),
    // untracked (new) files, which `git diff HEAD` does not list:
    ...gitLines(['ls-files', '--others', '--exclude-standard', '--', 'bytesofpurpose-blog']),
  ];
  files = [...new Set(list)]
    .filter((f) => /\.mdx?$/.test(f) && /\/(designs|blog|docs)\//.test(f))
    .map((f) => path.resolve(repoRoot, f))
    .filter((f) => existsSync(f) && !path.basename(f).startsWith('_'));
}

// Pull every ```mermaid … ``` fence from a file, with its 1-based opening line.
function mermaidFences(file) {
  const lines = readFileSync(file, 'utf8').split('\n');
  const out = [];
  let i = 0;
  while (i < lines.length) {
    if (/^\s*```mermaid\s*$/.test(lines[i])) {
      const startLine = i + 1;
      const body = [];
      i++;
      while (i < lines.length && !/^\s*```\s*$/.test(lines[i])) {
        body.push(lines[i]);
        i++;
      }
      out.push({startLine, code: body.join('\n')});
    }
    i++;
  }
  return out;
}

// Render + inspect all fences from all files in ONE browser session.
async function run() {
  const specs = [];
  for (const f of files) {
    if (!existsSync(f)) continue;
    for (const fence of mermaidFences(f)) {
      // Only score graph/flowchart: they lay out as a node graph and can overlap/oversize.
      // Sequence/ER/class/state/timeline/mindmap/etc. self-lay-out (and are more fragile to
      // parse out of context), so skip them here — same scope as the cheap text sibling.
      const first =
        fence.code
          .split('\n')
          .map((l) => l.trim())
          .find((l) => l && !l.startsWith('%%')) || '';
      if (!/^(graph|flowchart)\b/.test(first)) continue;
      // Strip the repo's %% animate: flow %% directive + entity dashes so mermaid parses it raw.
      const code = fence.code
        .replace(/^\s*%%.*$/gm, '')
        .replace(/&#8212;|&#x2014;|&mdash;/g, '-');
      specs.push({file: path.relative(ROOT, f), line: fence.startLine, code});
    }
  }
  if (!specs.length) {
    if (asJson) console.log(JSON.stringify({total: 0, findings: []}, null, 2));
    else console.log('✅ mermaid render: no mermaid diagrams in the given files.');
    process.exit(0);
  }

  let chromium;
  try {
    ({chromium} = await import('playwright'));
  } catch {
    console.error(
      '⚠️  mermaid render: Playwright not available; skipping (this is the heavy render check, ' +
        'not the per-edit heuristic). Install browsers with `npx playwright install chromium`.',
    );
    process.exit(0); // absence of the renderer is not a failure of the content
  }

  const findings = [];
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.setViewportSize({width: 1440, height: 1600});
    // Load mermaid from the installed package into the page context.
    const mermaidPath = path.resolve(ROOT, 'node_modules/mermaid/dist/mermaid.min.js');
    await page.setContent('<!doctype html><html><body><div id="host"></div></body></html>');
    await page.addScriptTag({path: mermaidPath});
    await page.evaluate(() => window.mermaid.initialize({startOnLoad: false}));

    for (const spec of specs) {
      const result = await page.evaluate(async (code) => {
        try {
          const {svg} = await window.mermaid.render('m' + Math.floor(performance.now()), code);
          const host = document.getElementById('host');
          host.innerHTML = svg;
          const svgEl = host.querySelector('svg');
          const vb = svgEl.viewBox && svgEl.viewBox.baseVal;
          const w = vb && vb.width ? vb.width : svgEl.getBoundingClientRect().width;
          const h = vb && vb.height ? vb.height : svgEl.getBoundingClientRect().height;
          // Node bounding boxes: mermaid marks nodes with class "node" (flowchart) / "nodes".
          const nodes = [...host.querySelectorAll('.node')].map((n) => {
            const b = n.getBoundingClientRect();
            return {x: b.x, y: b.y, w: b.width, h: b.height};
          });
          return {ok: true, w, h, nodes};
        } catch (e) {
          return {ok: false, error: String(e && e.message ? e.message : e)};
        }
      }, spec.code);

      if (!result.ok) {
        findings.push({...spec, id: 'render-fail', detail: `does not render: ${result.error}`});
        continue;
      }
      const reasons = [];
      if (result.h > MAX_H) {
        reasons.push(
          `renders ${Math.round(result.w)}×${Math.round(result.h)}px — ${Math.round(result.h)}px ` +
            `tall (> ${MAX_H}) overflows vertically and shrinks to illegible text`,
        );
      } else if (result.w > MAX_W) {
        reasons.push(
          `renders ${Math.round(result.w)}px wide (> ${MAX_W}) — too wide to scroll comfortably`,
        );
      }
      // Overlap: any two node bboxes intersecting by more than the tolerance.
      const ns = result.nodes || [];
      let overlaps = 0;
      for (let a = 0; a < ns.length; a++) {
        for (let b = a + 1; b < ns.length; b++) {
          const ix = Math.min(ns[a].x + ns[a].w, ns[b].x + ns[b].w) - Math.max(ns[a].x, ns[b].x);
          const iy = Math.min(ns[a].y + ns[a].h, ns[b].y + ns[b].h) - Math.max(ns[a].y, ns[b].y);
          if (ix > OVERLAP_TOLERANCE && iy > OVERLAP_TOLERANCE) overlaps++;
        }
      }
      if (overlaps) reasons.push(`${overlaps} pair(s) of nodes overlap (collide)`);

      if (reasons.length) {
        findings.push({
          ...spec,
          id: reasons.some((r) => r.includes('overlap')) ? 'node-overlap' : 'oversize',
          detail: reasons.join('; '),
        });
      }
    }
  } finally {
    await browser.close();
  }

  if (asJson) {
    console.log(JSON.stringify({total: findings.length, findings}, null, 2));
    process.exit(0);
  }
  if (!findings.length) {
    console.log(`✅ mermaid render: ${specs.length} diagram(s) render clean and legible.`);
    process.exit(0);
  }
  console.error(
    `🖼️  mermaid render: ${findings.length} legibility issue(s) across ${
      new Set(findings.map((f) => f.file)).size
    } file(s) (warn)`,
  );
  for (const f of findings) {
    console.error(`\n  ${f.file}:${f.line}  [warn:mermaid-render-${f.id}]`);
    console.error(`      ↳ ${f.detail}`);
  }
  console.error(
    '\n(advice only, not blocking.) This RENDERED each diagram to catch what the source-text' +
      '\ncheck cannot. A render-fail is a syntax error the draft-only page would hide until' +
      '\npublish; overlap/oversize is a real legibility problem. Fix: correct the syntax, split' +
      '\nthe diagram, or switch to <FlowDiagram> (gates its own layout). See author-mermaid.',
  );
  process.exit(1);
}

run().catch((e) => {
  // A crash in the heavy renderer must not block anything — degrade to a warning.
  console.error(`⚠️  mermaid render: check errored (non-blocking): ${e && e.message ? e.message : e}`);
  process.exit(0);
});
