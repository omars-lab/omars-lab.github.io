#!/usr/bin/env node
/**
 * Stop hook: remind to archive completed tasks into the blog changelog once the
 * completed-task count crosses the threshold — AND to DELETE them after the move.
 *
 * Why a Stop hook: the "archive at 10+ completed" convention (CLAUDE.md) is triggered
 * by task-list size, not by a file edit, so a PostToolUse(Write|Edit) hook can't see
 * it. Stop fires at the end of a turn and receives the transcript path, from which we
 * can reconstruct the live task state.
 *
 * How we count: TaskCreate/TaskUpdate tool calls are recorded in the transcript JSONL.
 * We reduce them to the LATEST status per taskId (a later TaskUpdate wins), then count
 * `completed`. Deleted tasks drop out. This mirrors what the live task list shows.
 *
 * Output contract: a non-blocking advisory. We print the reminder to stderr and exit 0
 * (never block a Stop). The threshold matches CLAUDE.md (10+).
 */
const fs = require('fs');

const THRESHOLD = 10;

function readStdin() {
  try { return fs.readFileSync(0, 'utf8'); } catch { return ''; }
}

function main() {
  let input;
  try { input = JSON.parse(readStdin() || '{}'); } catch { process.exit(0); }

  // Avoid infinite loops: if this Stop was already triggered by a prior hook stop, bail.
  if (input.stop_hook_active) process.exit(0);

  const transcript = input.transcript_path;
  if (!transcript || !fs.existsSync(transcript)) process.exit(0);

  // Reduce TaskUpdate calls → latest status per taskId. TaskCreate seeds 'pending'
  // (TaskCreate has no status field; tasks are created pending).
  const status = new Map();
  let raw;
  try { raw = fs.readFileSync(transcript, 'utf8'); } catch { process.exit(0); }
  for (const line of raw.split('\n')) {
    if (!line) continue;
    let o;
    try { o = JSON.parse(line); } catch { continue; }
    const content = o && o.message && o.message.content;
    if (!Array.isArray(content)) continue;
    for (const c of content) {
      if (c.type !== 'tool_use' || !c.input) continue;
      if (c.name === 'TaskCreate') {
        // taskId isn't in the create input; we can't key it, so skip seeding here —
        // a task only matters to this reminder once it has been moved to 'completed',
        // which always happens via TaskUpdate (which carries taskId + status).
        continue;
      }
      if (c.name === 'TaskUpdate' && c.input.taskId && c.input.status) {
        status.set(String(c.input.taskId), c.input.status);
      }
    }
  }

  let completed = 0;
  for (const s of status.values()) if (s === 'completed') completed++;

  if (completed < THRESHOLD) process.exit(0);

  const msg = [
    '',
    `📓 Changelog reminder: ${completed} tasks are marked completed (threshold ${THRESHOLD}).`,
    'Per the CLAUDE.md "archive completed tasks to the changelog" convention:',
    '  1. Append a dated batch to bytesofpurpose-blog/changelog/CLAUDE-CHANGELOG.md',
    '     (## YYYY-MM-DD — Title, a <!-- meta: ... --> line, one-line summary, the',
    '     completed task subjects as bullets).',
    '  2. Run: node bytesofpurpose-blog/scripts/generate-changelog-data.js',
    '  3. THEN DELETE those completed tasks (TaskUpdate → status: deleted) so the live',
    '     list stays short. The move is only half-done until they are deleted.',
    'Leave pending/in_progress tasks untouched.',
    '',
  ].join('\n');

  // Surface as a non-blocking reason via JSON (Stop hooks read structured output);
  // also print to stderr for visibility. Exit 0 — never block.
  process.stderr.write(msg + '\n');
  process.stdout.write(JSON.stringify({ systemMessage: msg }) + '\n');
  process.exit(0);
}

main();
