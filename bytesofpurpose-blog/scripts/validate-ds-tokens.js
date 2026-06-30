#!/usr/bin/env node

/**
 * validate-ds-tokens.js — keep the repo's CSS speaking the design-system's NAMED token vocabulary
 * instead of re-drifting into hardcoded literals.
 *
 * The design-system reconciliation (see the implement-with-design-system skill) gave the brand's
 * values NAMES (--lift-*, the shadow tokens, --radius-*, --duration-*, --brand-green,
 * the font families, --tea-ink). Audits then removed the hardcoded copies. Nothing stopped them from
 * creeping back — until this. It scans the repo's authored CSS for literal values that have a
 * canonical token and WARNS (the blocking gate is `make validate-ds-tokens`, exit 2), so a stray
 * `translateY(-4px)` or an off-brand font is caught at edit time.
 *
 * DESIGN BIAS: false positives are worse than misses here (a noisy guard gets ignored). So the RULES
 * below only flag literals whose token is UNAMBIGUOUS regardless of surrounding context:
 *   - the exact hover-lift transforms (--lift-card / --lift-subtle)
 *   - the exact quiet two-step shadow literals + the known ad-hoc changelog shadow (--ifm-global-shadow-*)
 *   - the arch drop-shadow (--shadow-arch)
 *   - the brand-green hexes used as a value (--brand-green / --ifm-color-primary)
 *   - a tea-party pastel used as a `color:` (a DISCIPLINE violation — pastels are fills only)
 *   - off-brand font families (anything that isn't Fraunces / Geist / Geist Mono / a generic fallback)
 * Context-dependent literals (a bare `8px` radius, a `0.2s` that might be a non-card transition, a
 * `1rem` that's usually font-size) are deliberately NOT flagged — those are handled by the skill +
 * human judgment, not a regex, to keep the signal clean.
 *
 * Usage:  node scripts/validate-ds-tokens.js [file1 file2 ...]   (no args = scan the whole CSS tree)
 * Exit:   2 if any rule matches (a re-drift); else 0.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const JSON_OUT = process.argv.includes('--json');

// Directories whose CSS is authored brand surface. We skip build output, deps, generated, and the
// token DEFINITION file itself (custom.css legitimately holds the literals as the source of truth).
const SCAN_DIRS = [
  path.join(ROOT, 'src'),
  path.join(ROOT, '..', 'packages', 'blog-ui', 'src'),
];
const SKIP_RE = /(node_modules|build|\.docusaurus|static\/storybook|dist)\//;
// custom.css DEFINES the tokens (and documents the values in comments) — never flag it.
const SKIP_FILES = new Set([path.join(ROOT, 'src', 'css', 'custom.css')]);

// ── The RULES manifest: the literal->token map. Each rule: a regex that matches the LITERAL in a
// value position, the token to suggest, and a human note. Kept conservative (see header). ──────────
const RULES = [
  {
    id: 'lift-card',
    // transform: ... translateY(-4px) ...  (the card hover lift)
    re: /transform\s*:[^;]*\btranslateY\(\s*-4px\s*\)/g,
    token: 'var(--lift-card)',
    note: 'card hover lift',
  },
  {
    id: 'lift-subtle',
    re: /transform\s*:[^;]*\btranslateY\(\s*-2px\s*\)/g,
    token: 'var(--lift-subtle)',
    note: 'list/article hover lift',
  },
  {
    id: 'shadow-lw',
    re: /box-shadow\s*:[^;]*0\s+1px\s+3px\s+rgba\(\s*20\s*,\s*32\s*,\s*26\s*,\s*0?\.08\s*\)/g,
    token: 'var(--ifm-global-shadow-lw)',
    note: 'the quiet resting shadow step',
  },
  {
    id: 'shadow-md',
    re: /box-shadow\s*:[^;]*0\s+6px\s+20px\s+rgba\(\s*20\s*,\s*32\s*,\s*26\s*,\s*0?\.1\s*\)/g,
    token: 'var(--ifm-global-shadow-md)',
    note: 'the medium hover shadow step',
  },
  {
    id: 'shadow-adhoc-changelog',
    // the known ad-hoc card shadow the audit converged: 0 4px 12px rgba(0,0,0,.1)
    re: /box-shadow\s*:[^;]*0\s+4px\s+12px\s+rgba\(\s*0\s*,\s*0\s*,\s*0\s*,\s*0?\.1\s*\)/g,
    token: 'var(--ifm-global-shadow-md)',
    note: 'an ad-hoc card shadow — use the brand medium step',
  },
  {
    id: 'shadow-arch',
    re: /drop-shadow\(\s*0\s+6px\s+16px\s+rgba\(\s*26\s*,\s*26\s*,\s*26\s*,\s*0?\.18\s*\)\s*\)/g,
    token: 'var(--shadow-arch)',
    note: 'the cathedral-arch illustration shadow',
  },
  {
    id: 'brand-green-hex',
    // the brand green hexes used anywhere as a value (not in a comment — comments are stripped first)
    re: /#448061\b|#3c7256\b/gi,
    token: 'var(--brand-green) or var(--ifm-color-primary)',
    note: 'brand green — use the token (--ifm-color-primary is the AA-safe text green)',
  },
  {
    id: 'pastel-as-text',
    // a tea pastel used as a `color:` (DISCIPLINE: pastels are accent FILLS only, never text).
    // The [^a-z-] guard avoids matching `background-color:` / `border-color:`; --tea-ink is allowed.
    re: /(?:^|[^a-z-])color\s*:\s*(?:var\(\s*--tea-(?:pink|mint|green)\s*\)|#ffc5d3|#adfff5|#d2ffc4)/gi,
    token: '--tea-ink (the only ink allowed on a pastel)',
    note: 'a pastel used as TEXT — pastels are accent fills only; ride --tea-ink on them instead',
  },
  {
    id: 'off-brand-font',
    // font-family / font shorthand naming a family that isn't a brand family or a known generic.
    // We match the declaration, then check it mentions none of the allowed families.
    re: /\bfont(?:-family)?\s*:\s*[^;]*\b(Raleway|Nunito|Roboto|Lato|Montserrat|Open Sans|Poppins|Inter|Helvetica Neue|Arial)\b[^;]*/gi,
    token: "var(--ifm-font-family-base) / -heading / -monospace (Geist / Fraunces / Geist Mono)",
    note: 'off-brand typeface — use a brand font token',
    // allow the family if the declaration ALSO references a brand token/family (e.g. fallback chains
    // inside the token definitions, which live in custom.css and are skipped anyway).
    allowIf: /var\(--(?:ifm-)?font|Fraunces|Geist/i,
  },
];

// Strip /* ... */ comments and `// ...` so documented values in comments don't trip the rules.
function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
}

function lineOf(text, idx) {
  return text.slice(0, idx).split('\n').length;
}

function walk(dir, out) {
  let entries;
  try {
    entries = fs.readdirSync(dir, {withFileTypes: true});
  } catch {
    return out;
  }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (SKIP_RE.test(full + '/')) continue;
    if (e.isDirectory()) walk(full, out);
    else if (/\.(css|scss)$/.test(e.name)) out.push(full);
  }
  return out;
}

function filesToScan() {
  if (args.length) return args.map((a) => path.resolve(a)).filter((f) => /\.(css|scss)$/.test(f));
  const out = [];
  for (const d of SCAN_DIRS) walk(d, out);
  return out;
}

function scanFile(file) {
  let raw;
  try {
    raw = fs.readFileSync(file, 'utf8');
  } catch {
    return [];
  }
  if (SKIP_FILES.has(path.resolve(file))) return [];
  const css = stripComments(raw);
  const findings = [];
  for (const rule of RULES) {
    rule.re.lastIndex = 0;
    let m;
    while ((m = rule.re.exec(css))) {
      const hit = m[0];
      if (rule.allowIf && rule.allowIf.test(hit)) continue;
      findings.push({
        file: path.relative(ROOT, file),
        line: lineOf(css, m.index),
        rule: rule.id,
        token: rule.token,
        note: rule.note,
        snippet: hit.trim().slice(0, 80),
      });
    }
  }
  return findings;
}

function main() {
  const files = filesToScan();
  const all = [];
  for (const f of files) all.push(...scanFile(f));

  if (JSON_OUT) {
    console.log(JSON.stringify({findings: all, scanned: files.length}, null, 2));
    process.exit(all.length ? 2 : 0);
  }

  if (!all.length) {
    console.log(`✅ ds-tokens: no hardcoded values with a canonical token (${files.length} files).`);
    process.exit(0);
  }

  console.log(`⚠️  ds-tokens: ${all.length} hardcoded value(s) that should reference a token:\n`);
  for (const f of all) {
    console.log(`  • ${f.file}:${f.line}  [${f.rule}] ${f.note}`);
    console.log(`      ${f.snippet}`);
    console.log(`      → use ${f.token}\n`);
  }
  console.log('  Reach for the token (see the implement-with-design-system skill). Values match, so');
  console.log('  the swap is non-breaking. custom.css is the single source of truth.');
  process.exit(2);
}

main();
