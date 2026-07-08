#!/usr/bin/env node

/**
 * validate-mermaid-complexity.js — nudge a mermaid flow diagram that is too dense to read.
 *
 * The `<UseCaseDiagram>` / `<FlowDiagram>` components enforce a build-time legibility gate
 * (they compute their own layout, so they can throw on too-many-crossings / a lopsided fan).
 * A hand-authored ```mermaid ``` fence has NO such gate: a 40-node flowchart or a node
 * fanning out to eight others renders as spaghetti and nothing catches it. Mermaid lays out
 * in the browser, so a TRUE crossing check would need a headless render (slow, not
 * hook-friendly). Instead this uses cheap TEXT metrics that correlate with "unreadable":
 *
 *   mermaid-dense   a graph/flowchart fence exceeds a node / edge / fan-out threshold.  [WARN]
 *
 * Only `graph` / `flowchart` diagrams are scored (the ones that tangle). Sequence, ER,
 * class, state, gitGraph, timeline, mindmap, kanban, quadrant, architecture etc. lay
 * themselves out and are skipped. Thresholds are deliberately set ABOVE the common,
 * legible 12-16 node diagrams, so this flags only the genuine outliers and won't cry wolf.
 *
 * The nudge, when it fires: split the diagram, collapse a subgraph into one node, or reach
 * for `<FlowDiagram>` (which gates its own layout). See the author-mermaid + upgrade-post
 * skills.
 *
 * Usage:
 *   node scripts/validate-mermaid-complexity.js [paths…]   # scan (default: blog designs docs)
 *   node scripts/validate-mermaid-complexity.js --json      # machine-readable findings
 *   node scripts/validate-mermaid-complexity.js --error-only # exit 2 if any finding (strict gate)
 *
 * Exit codes: 0 clean · 1 findings (scan) · 2 findings (--error-only). Advisory: the HOOK
 * runs it in default (warn) mode and never blocks; `make validate-mermaid-complexity` sweeps.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DEFAULT_DIRS = ['blog', 'designs', 'docs'];

// Thresholds — set above the common legible range (the corpus's typical dense-but-fine
// diagram is ~12-16 nodes / ~14 edges / fan ~4). A finding fires when ANY is exceeded.
const MAX_NODES = 20; // more distinct nodes than this is a lot to trace at a glance
const MAX_EDGES = 24; // more connections than this reads as a web
const MAX_FANOUT = 7; // one node with this many outgoing edges is a hub that tangles

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

// The mermaid diagram kinds that lay out as a node graph and can tangle. Everything else
// (sequence/er/class/state/gitGraph/timeline/mindmap/kanban/quadrant/architecture/C4…)
// has its own layout and is not scored here.
const FLOW_KINDS = /^(graph|flowchart)\b/;

// Edge operators in flowchart syntax (solid, dotted, thick, with-or-without a label).
const EDGE_RE = /--+>|--+|-\.-+>|-\.-+|==+>|==+/g;
// A node reference is a token immediately followed by a shape bracket: A[, B(, C{, D([, etc.
const NODE_DECL_RE = /\b([A-Za-z][\w]*)\s*[[({]/g;
// The source node of an edge (a bare id or a shaped node) at the start of an edge expr.
const EDGE_SRC_RE = /(?:^|\n)\s*([A-Za-z][\w]*)\b[^\n]*?(?:--+>|--+|-\.-+>|-\.-+|==+>|==+)/g;

/** Score one mermaid body: {kind, nodes, edges, maxFanout, hub}. */
function scoreMermaid(body) {
  const lines = body.split('\n');
  const first = lines.map((l) => l.trim()).find((l) => l && !l.startsWith('%%')) || '';
  const kind = first.split(/\s+/)[0] || '?';
  if (!FLOW_KINDS.test(first)) return {kind, skip: true};

  // Distinct node ids (declared with a shape). Undecorated ids that only appear on edges
  // are also nodes, but counting declared shapes is a stable, conservative proxy.
  const nodes = new Set();
  let m;
  NODE_DECL_RE.lastIndex = 0;
  while ((m = NODE_DECL_RE.exec(body))) nodes.add(m[1]);

  const edges = (body.match(EDGE_RE) || []).length;

  // Max fan-out: the most outgoing edges from any single source node.
  const fan = {};
  EDGE_SRC_RE.lastIndex = 0;
  while ((m = EDGE_SRC_RE.exec(body))) fan[m[1]] = (fan[m[1]] || 0) + 1;
  let maxFanout = 0;
  let hub = '';
  for (const [id, c] of Object.entries(fan)) {
    if (c > maxFanout) {
      maxFanout = c;
      hub = id;
    }
  }
  return {kind, nodes: nodes.size, edges, maxFanout, hub, skip: false};
}

function checkFile(file) {
  const raw = fs.readFileSync(file, 'utf8');
  const findings = [];
  const rel = path.relative(ROOT, file);
  // Walk every ```mermaid … ``` fence, tracking the line it opens on for reporting.
  const lines = raw.split('\n');
  let i = 0;
  while (i < lines.length) {
    if (/^\s*```mermaid\s*$/.test(lines[i])) {
      const startLine = i + 1;
      const bodyLines = [];
      i++;
      while (i < lines.length && !/^\s*```\s*$/.test(lines[i])) {
        bodyLines.push(lines[i]);
        i++;
      }
      const s = scoreMermaid(bodyLines.join('\n'));
      if (!s.skip) {
        const reasons = [];
        if (s.nodes > MAX_NODES) reasons.push(`${s.nodes} nodes (> ${MAX_NODES})`);
        if (s.edges > MAX_EDGES) reasons.push(`${s.edges} edges (> ${MAX_EDGES})`);
        if (s.maxFanout >= MAX_FANOUT)
          reasons.push(`node "${s.hub}" fans out to ${s.maxFanout} (>= ${MAX_FANOUT})`);
        if (reasons.length) {
          findings.push({
            file: rel,
            line: startLine,
            kind: s.kind,
            nodes: s.nodes,
            edges: s.edges,
            maxFanout: s.maxFanout,
            detail: reasons.join('; '),
          });
        }
      }
    }
    i++;
  }
  return findings;
}

function main() {
  const args = process.argv.slice(2);
  const json = args.includes('--json');
  const errorOnly = args.includes('--error-only');
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
    console.log(JSON.stringify({total: findings.length, findings}, null, 2));
    process.exit(0);
  }

  if (!findings.length) {
    console.log('✅ mermaid complexity: no over-dense flow diagrams found.');
    process.exit(0);
  }

  console.error(
    `🕸️  mermaid complexity: ${findings.length} dense flow diagram(s) in ${
      new Set(findings.map((f) => f.file)).size
    } file(s) (warn)`,
  );
  for (const f of findings) {
    console.error(`\n  ${f.file}:${f.line}  [warn:mermaid-dense]`);
    console.error(`      ↳ ${f.kind} is dense: ${f.detail}`);
  }
  console.error(
    '\n(advice only, not blocking.) A dense hand-authored mermaid has no legibility gate' +
      '\n(unlike <FlowDiagram>/<UseCaseDiagram>, which gate their own layout). Consider:' +
      '\nsplit it into two diagrams, collapse a subgraph into one node, or reach for' +
      '\n<FlowDiagram> (a nodes/edges spec that fails the build on a tangled layout).' +
      '\nSee the author-mermaid + upgrade-post skills.',
  );
  process.exit(errorOnly ? 2 : 1);
}

main();
