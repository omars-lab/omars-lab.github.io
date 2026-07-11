#!/usr/bin/env node

/**
 * validate-hook-tests.js — the META-GUARD: every validator hook must ship a `--selftest` that PROVES
 * it bites, and that selftest must PASS.
 *
 * A hook that can BLOCK (exit 2) or FLAG (stderr finding) is only trustworthy if we know it still
 * fires on bad input. Hooks rot silently — a refactor can turn a guard into a no-op and nothing
 * notices until a real leak ships. This guard enforces the hook-testing contract:
 *
 *   1. Every non-exempt hook in .claude/hooks/*.sh has a `--selftest` branch (grep-detected).
 *   2. Running `<hook> --selftest` exits 0 (its planted-bad case tripped it, its clean case passed).
 *
 * EXEMPT hooks (in EXEMPT below) are pure REMINDERS — they always exit 0 and never block/flag, so
 * there's no "bite" to prove. Keep that list tight: a hook that CAN block/flag is not a reminder.
 *
 * The selftest contract + helpers live in .claude/hooks/lib/selftest.sh. The `manage-... ` note:
 * adding a NEW hook means adding its `--selftest` in the same change — this guard makes that
 * non-optional.
 *
 * Usage:  node scripts/validate-hook-tests.js          (checks presence + runs each selftest)
 *         node scripts/validate-hook-tests.js --list    (just list hooks + their status)
 * Exit:   2 if any non-exempt hook lacks a --selftest OR its selftest fails; else 0.
 */

const fs = require('fs');
const path = require('path');
const {execFileSync} = require('child_process');

const REPO = path.join(__dirname, '..', '..'); // repo root (hooks live outside bytesofpurpose-blog/)
const HOOKS_DIR = path.join(REPO, '.claude', 'hooks');

// Pure reminders: always exit 0, never block or flag — nothing to prove. Keep TIGHT.
const EXEMPT = new Set([
  'changelog-archive-reminder.sh',
  'dev-server-restart-reminder.sh',
  'discover-journey-reminder.sh',
  'refine-capture-reminder.sh',
]);

function hookFiles() {
  return fs
    .readdirSync(HOOKS_DIR)
    .filter((f) => f.endsWith('.sh'))
    .sort();
}

function hasSelftest(file) {
  const txt = fs.readFileSync(path.join(HOOKS_DIR, file), 'utf8');
  // The convention marker: a `--selftest` branch near the top.
  return /--selftest/.test(txt);
}

function runSelftest(file) {
  // Returns {ok, out}. Exit 0 = pass. We pass CLAUDE_PROJECT_DIR so delegating hooks resolve paths.
  try {
    const out = execFileSync('bash', [path.join(HOOKS_DIR, file), '--selftest'], {
      env: {...process.env, CLAUDE_PROJECT_DIR: REPO},
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return {ok: true, out: out.trim()};
  } catch (e) {
    const out = `${e.stdout || ''}${e.stderr || ''}`.trim();
    return {ok: false, out};
  }
}

function main() {
  const listOnly = process.argv.includes('--list');
  const files = hookFiles();

  const missing = []; // non-exempt hook with no --selftest
  const failed = []; // --selftest present but it FAILED
  const passed = [];
  const exempt = [];

  for (const f of files) {
    if (EXEMPT.has(f)) {
      exempt.push(f);
      continue;
    }
    if (!hasSelftest(f)) {
      missing.push(f);
      continue;
    }
    if (listOnly) {
      passed.push(f); // presence only in list mode
      continue;
    }
    const {ok, out} = runSelftest(f);
    if (ok) passed.push(f);
    else failed.push({f, out});
  }

  if (listOnly) {
    console.log(`hooks: ${files.length} total — ${passed.length} with --selftest, ${missing.length} missing, ${exempt.length} exempt (reminders)`);
    if (missing.length) console.log(`  missing --selftest:\n   ${missing.join('\n   ')}`);
    if (exempt.length) console.log(`  exempt (reminders):\n   ${exempt.join('\n   ')}`);
    process.exit(0);
  }

  if (missing.length === 0 && failed.length === 0) {
    console.log(
      `✅ hook-tests: all ${passed.length} validator hook(s) ship a passing --selftest ` +
        `(${exempt.length} reminder(s) exempt).`,
    );
    process.exit(0);
  }

  if (missing.length) {
    console.error(`🪝 hook-tests: ${missing.length} hook(s) have NO --selftest (add one — see .claude/hooks/lib/selftest.sh):`);
    for (const f of missing) console.error(`   • ${f}`);
  }
  if (failed.length) {
    console.error(`\n🪝 hook-tests: ${failed.length} hook(s) whose --selftest FAILED:`);
    for (const {f, out} of failed) {
      console.error(`   • ${f}`);
      for (const line of out.split('\n')) console.error(`       ${line}`);
    }
  }
  console.error(
    `\nEvery validator hook must prove it bites. Add/fix the --selftest branch (a pure reminder that ` +
      `never blocks/flags can be added to EXEMPT in scripts/validate-hook-tests.js instead).`,
  );
  process.exit(2);
}

main();
