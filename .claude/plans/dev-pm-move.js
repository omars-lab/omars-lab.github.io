#!/usr/bin/env node
/**
 * Phase G mover: split docs/2-development + docs/5-scripting into
 * docs/product-management (lifecycle) + reshaped docs/2-development (Software
 * Development domains) + 2 habit docs → docs/10-personal-growth.
 *
 * URL-SAFE: every doc keeps its frontmatter `slug:` verbatim. We only `git mv`
 * files (folder path + sidebar change), never touch slugs. The route manifest diff
 * is the proof.
 *
 * Usage: node dev-pm-move.js [--apply]   (default: dry-run, prints the plan)
 */
const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const REPO = path.resolve(__dirname, '..', '..');
const DOCS = path.join(REPO, 'bytesofpurpose-blog', 'docs');
const APPLY = process.argv.includes('--apply');

const walk = (d, a = []) => {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const f = path.join(d, e.name);
    if (e.isDirectory()) walk(f, a);
    else if (/\.mdx?$/.test(e.name)) a.push(f);
  }
  return a;
};
const rel = (f) => path.relative(DOCS, f);

// ---- explicit decisions (Omar-confirmed) --------------------------------
const HABITS = new Set(['habits-developing.mdx', 'habits-tinkering.mdx']);
const IDEA = new Set([
  'my-first-intellij-plugin.mdx', 'my-first-ios-app.md', 'my-first-mac-menubar-app.md',
  'my-first-noteplan-plugin.mdx', 'my-first-react-app.mdx', 'tinker-browser-automation.md',
  'unorganized-software-development-ideas.md', 'unorganized-tool-script-development-ideas.md',
]);
const BUILT_DOMAIN = {
  'my-first-chrome-plugin.mdx': 'plugins', 'my-first-vscode-plugin.mdx': 'plugins',
  'my-first-brew-plugin.mdx': 'plugins',
  'tinker-applescript.md': 'scripting', 'tinker-linux.md': 'scripting', 'tinker-mac-automation.md': 'scripting',
  'tinker-graphql.md': 'backend-development', 'tinker-type-projections.md': 'backend-development',
  'tinker-timeouts.md': 'backend-development', 'tinker-geometric-design.md': 'frontend-development',
};
// Explicit landing/README re-homing (preserve content + frozen slug to a sensible new landing).
// Key = source rel path under docs/. Value = new rel path (null = leave in place).
const LANDINGS = {
  '2-development/README.mdx': null, // Software Development root landing — stays, just relabel
  '2-development/vocabulary/README.mdx': null,
  '2-development/6-projects/README.md': 'product-management/projects/README.md',
  '2-development/6-projects/experiments/README.md': 'product-management/experiments/README.md',
  '2-development/1-ideas/README.md': 'product-management/ideas/README.md',
  '2-development/5-initiatives/README.md': 'product-management/initiatives/README.md',
  '2-development/4-pocs/README.md': 'product-management/pocs/README.md',
  '2-development/7-roadmaps/README.md': 'product-management/roadmaps/README.md',
  '2-development/2-research/README.md': 'product-management/research/README.md',
  '2-development/3-tinkering/README.md': 'product-management/tinkering/README.md',
  '2-development/3-tinkering/my-firsts/README.mdx': 'product-management/ideas/hello-worlds-README.mdx',
  '2-development/2-research/learning-topics/frontend-topics/README.md': '2-development/frontend-development/research/README.md',
  '2-development/techniques/development-techniques/README.md': '2-development/backend-development/techniques/README.md',
  '2-development/techniques/security-techniques/README.md': '2-development/backend-development/techniques/security-README.md',
  '2-development/techniques/development-techniques/tool-composition-techniques/README.mdx': '2-development/frontend-development/techniques/tool-composition-README.mdx',
  '2-development/techniques/development-techniques/tool-composition-techniques/storybook-typescript-babel/README.mdx': '2-development/frontend-development/techniques/storybook-typescript-babel/README.mdx',
  '2-development/workspace/setup/README.md': '2-development/workspace/setup/README.md',  // stays (slug /craftsmanship/... frozen)
  '2-development/workspace/tips/README.md': '2-development/workspace/tips/README.md',
  '2-development/workspace/tools/README.md': '2-development/workspace/tools/README.md',
  '2-development/workspace/bookmarks/README.mdx': '2-development/workspace/bookmarks/README.mdx',
  '5-scripting/README.mdx': '2-development/scripting/README.mdx',
};

// ---- content-doc classification (non-README) ----------------------------
const domain = (r) => {
  const p = r.toLowerCase();
  if (/plugin|tampermonkey|chrome-plugin|intellij|vscode-plugin|brew-plugin|noteplan-plugin/.test(p)) return 'plugins';
  if (r.startsWith('5-scripting/')) return 'scripting';
  if (/applescript|tinker-linux|tinker-mac|mac-automation|learning-bash|parsing-html|parsing-json|terminal|automate-(scripts|notifications|text|backups|email|tagging)|develop-shortcuts/.test(p)) return 'scripting';
  if (/frontend|react|web-design|eslint|webpack|storybook|website|timeline-app|lametric|graphs?\/|concept-graph|link-explorer|note-explore|notebooks|sites\/|apps\//.test(p)) return 'frontend-development';
  if (/backend|learning-(aws|docker|graphql|http|java|oauth|python|spring)|url-shortner|google-places|markdown-catter|task-management|automation-hub|secret|password|xcallback|validation-scripts|quip|mind-map|vim-plugin/.test(p)) return 'backend-development';
  return 'backend-development';
};
const bucket = (r) => {
  const p = r.toLowerCase();
  if (/learning|research/.test(p)) return 'research';
  if (/technique|storybook|secret|password|ci-cd/.test(p)) return 'techniques';
  if (/tinker|my-first/.test(p)) return 'tinkering';
  return 'projects';
};
const isPMlifecycle = (r) => {
  const p = r.toLowerCase();
  return /(^|\/)(1-ideas|4-pocs|5-initiatives|7-roadmaps)(\/|$)/.test(p)
    || /6-projects\/experiments\//.test(p)
    || (/2-research\/learning-topics\/learning-software/.test(p));
};
const pmStage = (r) => {
  if (/1-ideas/.test(r)) return 'ideas';
  if (/2-research/.test(r)) return 'research';
  if (/4-pocs/.test(r)) return 'pocs';
  if (/experiments/.test(r)) return 'experiments';
  if (/5-initiatives/.test(r)) return 'initiatives';
  if (/7-roadmaps/.test(r)) return 'roadmaps';
  return 'misc';
};

function targetFor(r) {
  const base = path.basename(r);
  if (LANDINGS.hasOwnProperty(r)) return LANDINGS[r];           // explicit landing
  if (/README\.mdx?$/.test(base)) return r;                      // any other README: leave in place (safe default)
  if (/_TEMPLATE/.test(base)) return r;                          // template stays with experiments
  if (HABITS.has(base)) return `10-personal-growth/${base}`;
  if (IDEA.has(base)) return `product-management/ideas/${base}`;
  if (BUILT_DOMAIN[base]) return `2-development/${BUILT_DOMAIN[base]}/tinkering/${base}`;
  if (isPMlifecycle(r)) return `product-management/${pmStage(r)}/${base}`;
  return `2-development/${domain(r)}/${bucket(r)}/${base}`;
}

// ---- build move list ----------------------------------------------------
const moves = [];
for (const root of ['2-development', '5-scripting']) {
  for (const f of walk(path.join(DOCS, root))) {
    const r = rel(f);
    if (/_category_\.json$/.test(r)) continue;
    const t = targetFor(r);
    if (t && t !== r) moves.push({ from: r, to: t });
  }
}
// collision guard
const seen = {};
let collide = false;
for (const m of moves) {
  if (seen[m.to]) { console.error(`COLLISION: ${m.from} and ${seen[m.to]} both → ${m.to}`); collide = true; }
  seen[m.to] = m.from;
}
if (collide) { console.error('\nAborting: target collisions. Fix LANDINGS/classification.'); process.exit(1); }

console.log(`${moves.length} moves planned (${APPLY ? 'APPLYING' : 'dry-run'}):\n`);
for (const m of moves) console.log(`  ${m.from}\n    → ${m.to}`);

if (APPLY) {
  for (const m of moves) {
    const fromAbs = path.join(DOCS, m.from);
    const toAbs = path.join(DOCS, m.to);
    fs.mkdirSync(path.dirname(toAbs), { recursive: true });
    cp.execSync(`git mv "${fromAbs}" "${toAbs}"`, { cwd: REPO });
  }
  console.log(`\n✅ applied ${moves.length} git mv operations.`);
}
