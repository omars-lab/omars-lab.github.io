#!/usr/bin/env node
/**
 * Stop hook: nudge to run a `discover-my-journey` DELTA pass once enough NEW self-revealing
 * writing has accumulated since the last pass.
 *
 * Why a Stop hook: "have I written enough lately to be worth a discovery pass?" is a function
 * of git history + a watermark, not of a file edit, so a PostToolUse(Write|Edit) hook can't
 * judge it. Stop fires at the end of a turn; here we compare HEAD against the stored watermark.
 *
 * How we count: the delta = content docs (docs/blog/thoughts/mindset/questions/designs) added or
 * changed in git between the watermark ref and HEAD, restricted to the SELF-REVEALING surfaces
 * (journey/mindset/thoughts/questions/habits + first-person initiatives). We nudge when the delta
 * crosses a threshold OR enough time has passed since the last pass.
 *
 * Output contract: a NON-BLOCKING advisory. Print to stderr, exit 0 (never block a Stop). Git-gated,
 * so it can't nag when nothing new has been written. Owned by the discover-my-journey skill.
 */
const fs = require('fs');
const path = require('path');
const {execSync} = require('child_process');

// Thresholds (tune in the skill): nudge at >= this many changed self-revealing docs, OR after this
// many days since the last recorded pass.
const DOC_THRESHOLD = 3;
const DAYS_THRESHOLD = 14;

// The self-revealing content surfaces (relative to bytesofpurpose-blog/). The delta favors these;
// technical craft docs leak values too but aren't what nudges a discovery pass.
const SELF_SURFACES = [
  'docs/journey/',
  'docs/habits/',
  'thoughts/',
  'mindset/',
  'questions/',
  'blog/', // first-person initiatives; the skill weights these, the nudge just counts them
];

function readStdin() {
  try {
    return fs.readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

function git(cmd, cwd) {
  return execSync(`git ${cmd}`, {cwd, encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore']}).trim();
}

function main() {
  let input;
  try {
    input = JSON.parse(readStdin() || '{}');
  } catch {
    process.exit(0);
  }
  if (input.stop_hook_active) process.exit(0); // avoid loops

  const proj = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();
  const blog = path.join(proj, 'bytesofpurpose-blog');
  // Only in this repo, and only when it's a git repo.
  if (!fs.existsSync(blog)) process.exit(0);
  try {
    git('rev-parse --is-inside-work-tree', proj);
  } catch {
    process.exit(0);
  }

  // The watermark (a git ref) of the last completed discovery pass. Absent => default to a window.
  const stateFile = path.join(proj, '.claude/skills/discover-my-journey/.last-run');
  let watermark = '';
  let lastRunMs = 0;
  if (fs.existsSync(stateFile)) {
    const raw = fs.readFileSync(stateFile, 'utf8').trim();
    // format: "<sha> <iso-timestamp>" (timestamp optional)
    [watermark] = raw.split(/\s+/);
    const ts = raw.split(/\s+/)[1];
    if (ts) lastRunMs = Date.parse(ts) || 0;
  }
  // First run (no watermark): default to ~30 days ago, so the very first nudge is meaningful.
  let base = watermark;
  if (!base) {
    try {
      base = git('rev-list -1 --before="30 days ago" HEAD', proj);
    } catch {
      base = '';
    }
  }
  if (!base) process.exit(0); // can't compute a delta; stay silent

  // Compute the delta: changed content docs in the self-revealing surfaces since `base`.
  let changed = [];
  try {
    const out = git(
      `diff --name-only ${base} HEAD -- ${SELF_SURFACES.map((s) => `bytesofpurpose-blog/${s}`).join(' ')}`,
      proj,
    );
    changed = out
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => /\.mdx?$/.test(l) && !/\/README\./i.test(l));
  } catch {
    process.exit(0);
  }
  const n = changed.length;

  const daysSince = lastRunMs ? (Date.now() - lastRunMs) / 86400000 : Infinity;
  const overDocs = n >= DOC_THRESHOLD;
  const overTime = lastRunMs && daysSince >= DAYS_THRESHOLD && n > 0;
  if (!overDocs && !overTime) process.exit(0); // nothing worth a pass

  const reason = overDocs
    ? `${n} new self-revealing pieces since your last discovery pass`
    : `it's been ${Math.round(daysSince)} days and you've written ${n} piece(s)`;

  process.stderr.write(
    `\n🧭 discover-my-journey: ${reason}. Want me to cross-triangulate them with your past writing ` +
      `and surface a pattern (a recurring theme, a shift, a tension, or a blind spot)? ` +
      `Run the \`discover-my-journey\` skill.\n`,
  );
  process.exit(0);
}

main();
