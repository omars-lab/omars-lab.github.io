#!/usr/bin/env node

/**
 * validate-hero-anchors.js — keep the `maintain-homepage-hero` skill in lockstep with the code.
 *
 * The skill (.claude/skills/maintain-homepage-hero/SKILL.md) documents the homepage hero by naming
 * specific SYMBOLS (constants, components, CSS classes) and what each owns. If one of those symbols
 * is renamed or deleted, the skill silently rots. This validator declares the same anchors and checks
 * each still exists in its file, so a drift is caught instead of discovered later.
 *
 * Anchors are SYMBOL NAMES, not line numbers (which drift on every edit). For each anchor we check a
 * stable textual pattern is present in the file.
 *
 * Usage:  node scripts/validate-hero-anchors.js
 * Exit:   2 if any anchor is missing (the skill needs updating); else 0.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const TSX = 'src/pages/index.tsx';
const CSS = 'src/pages/index.module.css';
const SF_TSX = 'src/components/SplitFlap/index.tsx';
const SF_CSS = 'src/components/SplitFlap/styles.module.css';
const EXP = 'src/experiments.ts';

// Each anchor: the file it lives in + a regex/string that must be present (the symbol's definition or
// a stable marker). Keep these in sync with the skill's "Code anchors" table.
const ANCHORS = [
  {file: EXP, needle: /['"]homepage-hero-anim['"]/, what: "experiments.ts: the 'homepage-hero-anim' flag key"},
  {file: TSX, needle: /function HeroChooser\b/, what: 'index.tsx: HeroChooser (variant resolution)'},
  {file: TSX, needle: /function ChooserStrip\b/, what: 'index.tsx: ChooserStrip (control marquee)'},
  {file: TSX, needle: /function ChooserFlash\b/, what: 'index.tsx: ChooserFlash (the flash gate)'},
  {file: TSX, needle: /const CHOOSER_CARDS\b/, what: 'index.tsx: CHOOSER_CARDS (the destinations)'},
  {file: TSX, needle: /const step = useCallback/, what: 'index.tsx: step() (one scene change)'},
  {file: TSX, needle: /const FLASH_INTERVAL_MS\b/, what: 'index.tsx: FLASH_INTERVAL_MS'},
  {file: TSX, needle: /const FLASH_HOLD_MS\b/, what: 'index.tsx: FLASH_HOLD_MS'},
  {file: TSX, needle: /const FLASH_SETTLE_MS\b/, what: 'index.tsx: FLASH_SETTLE_MS (board roll time)'},
  {file: TSX, needle: /const FLASH_BOARD_COLS\b/, what: 'index.tsx: FLASH_BOARD_COLS'},
  {file: TSX, needle: /const FLASH_BOARD_ROWS\b/, what: 'index.tsx: FLASH_BOARD_ROWS'},
  {file: TSX, needle: /addEventListener\(['"]keydown['"]/, what: 'index.tsx: global keydown listener (arrow-key nav)'},
  {file: TSX, needle: /['"]hero card clicked['"]/, what: "index.tsx: the 'hero card clicked' conversion event"},
  {file: CSS, needle: /\.flashArch\b/, what: 'index.module.css: .flashArch (the flash light)'},
  {file: CSS, needle: /\.flashArchWrap\b/, what: 'index.module.css: .flashArchWrap (the arch mask)'},
  {file: CSS, needle: /arch-inner\.png/, what: 'index.module.css: the arch-inner.png luminance mask'},
  {file: CSS, needle: /--portal-w\b/, what: 'index.module.css: --portal-w (the shared width axis)'},
  {file: CSS, needle: /\.flashBoard\b/, what: 'index.module.css: .flashBoard (the Vestaboard housing)'},
  {file: SF_TSX, needle: /const DECK\b/, what: 'SplitFlap/index.tsx: DECK (the flap charset)'},
  {file: SF_TSX, needle: /export default function SplitFlap\b/, what: 'SplitFlap/index.tsx: the SplitFlap component'},
  {file: SF_CSS, needle: /\.foldDown\b/, what: 'SplitFlap/styles.module.css: .foldDown (the flap fold)'},
];

const SKILL = path.join(
  ROOT,
  '..',
  '.claude',
  'skills',
  'maintain-homepage-hero',
  'SKILL.md',
);

function main() {
  const cache = new Map();
  const read = (rel) => {
    if (!cache.has(rel)) {
      const p = path.join(ROOT, rel);
      cache.set(rel, fs.existsSync(p) ? fs.readFileSync(p, 'utf-8') : null);
    }
    return cache.get(rel);
  };

  const missing = [];
  for (const a of ANCHORS) {
    const src = read(a.file);
    if (src === null) {
      missing.push(`  FILE MISSING: ${a.file} (anchor: ${a.what})`);
      continue;
    }
    const re = a.needle instanceof RegExp ? a.needle : new RegExp(a.needle);
    if (!re.test(src)) missing.push(`  DRIFTED: ${a.what}  [not found in ${a.file}]`);
  }

  if (!missing.length) {
    console.log(
      `✅ hero anchors: all ${ANCHORS.length} symbols the maintain-homepage-hero skill names still exist.`,
    );
    process.exit(0);
  }

  console.error(
    `🪧 hero anchors: ${missing.length} of ${ANCHORS.length} drifted — the maintain-homepage-hero skill is out of sync with the code.`,
  );
  console.error(missing.join('\n'));
  console.error(
    `\nUpdate the skill (${path.relative(ROOT, SKILL)}) AND this validator's ANCHORS list in the same change.`,
  );
  process.exit(2);
}

main();
