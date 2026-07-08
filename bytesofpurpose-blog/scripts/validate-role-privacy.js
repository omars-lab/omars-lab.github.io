#!/usr/bin/env node

/**
 * validate-role-privacy.js — the fail-closed LEAK GATE for imported role posts.
 *
 * A `/journey/roles/<role>.md` doc is authored by the `import-personalbook-role` skill, which
 * READS a private personalbook role folder as influence. A role folder mixes transferable,
 * publishable material (the role's Core Philosophy, skill essences, habit cadences, declarative
 * knowledge) with deeply PRIVATE application (the intent triad — obligations / desires /
 * motivations — plus dated personal todos, family/finance/medical specifics, and raw artifact
 * bodies full of private URLs). The role POST must carry ONLY the publishable half.
 *
 * This validator scans every doc under docs/journey/roles/ (or a single --file) for private-leak
 * SIGNALS and EXITS 2 on a hit, so private residue can never ship into a role post by omission.
 * It is deliberately CONSERVATIVE about false positives (a guard that cries wolf gets disabled),
 * so it flags only high-confidence tells:
 *
 *   1. Intent-triad phrasing lifted from obligations/desires/motivations artifacts:
 *      first-person self-obligation ("I need to …", "I #need"), raw desire/initiative markers.
 *   2. Named private people — the family names the personalbook privacy model calls out (Yara).
 *   3. Note-keeping artifacts that only appear in raw personal application files:
 *      `@done(...)`, `#THOUGHT`/`#usedShortcut`-style capture tags, `>YYYY-MM-DD` date annotations,
 *      and personal Google-Docs/Sheets URLs (a fingerprint of a copied artifact body).
 *   4. Finance/medical/immigration specifics (salary/visa/diagnosis lines).
 *
 * A rhetorical prompt ("what do you want out of life?") is fine — it's the FIRST-PERSON private
 * fact that leaks. The signals below are tuned to that distinction.
 *
 * Usage:
 *   node scripts/validate-role-privacy.js               # scan all docs/journey/roles/*
 *   node scripts/validate-role-privacy.js --file <path> # scan one file (used by the hook)
 * Exit: 2 if any leak signal is found; else 0.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const ROLES_DIR = path.join(ROOT, 'docs', 'journey', 'roles');

// ── Leak signal manifest. Each rule: a label + a matcher run per non-fenced content line. ────────
// Keep matchers HIGH-CONFIDENCE: they must almost never fire on legitimate publishable prose.
const RULES = [
  {
    id: 'intent-triad',
    why: 'first-person self-obligation/desire lifted from the PRIVATE obligations/desires/motivations artifacts, never a role post',
    // The real artifact leak is a BULLET whose text is a bare first-person intent
    // ("- I need to create scripts...", "- I want to start..."), or a #need/#initiative capture tag.
    // We deliberately require the LIST-ITEM context (a bullet, optional checkbox) so ordinary
    // narrative prose ("when I want to run my own life...") does NOT trip the guard — a guard that
    // cries wolf on legitimate framing gets disabled. The tags are the other unambiguous fingerprint.
    test: (line) =>
      /^\s*[-*+]\s+(\[[ xX]\]\s+)?I\s+(need|have|want)\s+to\s+\S/i.test(line) ||
      /#need\b|#initiative\b/i.test(line),
  },
  {
    id: 'family-name',
    why: 'a named private family member (the personalbook privacy model calls these out by name)',
    test: (line) => /\bYara\b/.test(line),
  },
  {
    id: 'note-keeping-artifact',
    why: 'a raw note-keeping artifact only present in copied personal application files (not reader-facing)',
    test: (line) =>
      /@done\s*\(/i.test(line) ||
      /#THOUGHT\b|#usedShortcut\b|#Personal\b/.test(line) ||
      /(^|\s)>\d{4}-\d{2}-\d{2}\b/.test(line), // ">2017-10-20" style date annotation
  },
  {
    id: 'personal-doc-url',
    why: 'a personal Google Docs/Sheets URL — the fingerprint of a pasted artifact body',
    test: (line) => /docs\.google\.com\/(spreadsheets|document)\//i.test(line),
  },
  {
    id: 'finance-medical-immigration',
    why: 'a finance/medical/immigration specific (private per the personalbook exclusion list)',
    test: (line) =>
      /\bmy\s+salary\b/i.test(line) ||
      /\bmy\s+visa\b|\bgreen\s*card\b|\bimmigration\b/i.test(line) ||
      /\bdiagnos(is|ed)\b|\bappointment\b.*\b(doctor|clinic|hospital)\b/i.test(line),
  },
];

function stripFrontmatter(text) {
  // Return body lines only (frontmatter carries provenance keys we never render, and is not a leak
  // surface for the POST — the post's frontmatter is authored, not copied).
  if (text.startsWith('---')) {
    const end = text.indexOf('\n---', 3);
    if (end !== -1) {
      const after = text.indexOf('\n', end + 1);
      return text.slice(after + 1);
    }
  }
  return text;
}

function scanFile(absPath) {
  const rel = path.relative(ROOT, absPath);
  const body = stripFrontmatter(fs.readFileSync(absPath, 'utf8'));
  const lines = body.split('\n');
  const findings = [];
  let inFence = false;
  lines.forEach((line, i) => {
    const t = line.trimStart();
    if (/^(```|~~~)/.test(t)) {
      inFence = !inFence;
      return;
    }
    if (inFence) return; // code blocks are not private-prose leaks
    for (const rule of RULES) {
      if (rule.test(line)) {
        findings.push({
          file: rel,
          line: i + 1,
          rule: rule.id,
          why: rule.why,
          snippet: line.trim().slice(0, 120),
        });
      }
    }
  });
  return findings;
}

function main() {
  const args = process.argv.slice(2);
  const fileIdx = args.indexOf('--file');
  let targets = [];
  if (fileIdx !== -1 && args[fileIdx + 1]) {
    const p = path.resolve(args[fileIdx + 1]);
    // Only guard files that live under docs/journey/roles/.
    if (!p.startsWith(ROLES_DIR + path.sep)) {
      process.exit(0);
    }
    if (fs.existsSync(p)) targets = [p];
  } else {
    if (!fs.existsSync(ROLES_DIR)) process.exit(0);
    targets = fs
      .readdirSync(ROLES_DIR)
      .filter((f) => /\.mdx?$/.test(f) && f.toLowerCase() !== 'readme.mdx' && f.toLowerCase() !== 'readme.md')
      .map((f) => path.join(ROLES_DIR, f));
  }

  const findings = targets.flatMap(scanFile);
  if (findings.length === 0) {
    console.log(`✅ role-privacy: ${targets.length} role doc(s) scanned, no private-leak signals.`);
    process.exit(0);
  }

  console.error('🛑 role-privacy LEAK — a role post carries content that belongs ONLY in the private');
  console.error('   personalbook role folder. A /journey/roles/ post must describe the KINDS of');
  console.error('   artifacts/skills/habits, never copy private application (the intent triad, dated');
  console.error('   personal todos, family/finance/medical specifics).\n');
  for (const f of findings) {
    console.error(`   ${f.file}:${f.line}  [${f.rule}]`);
    console.error(`     ${f.snippet}`);
    console.error(`     → ${f.why}`);
  }
  console.error('\n   Fix: remove or generalize the flagged line(s), then re-run. The importer should');
  console.error('   summarize from Overview.md / SKILL.md descriptions / HABIT.md cadences, not artifact bodies.');
  process.exit(2);
}

main();
