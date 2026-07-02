#!/bin/bash
# PostToolUse hook for Edit|Write on a NotePlan "Lists" file: enforce the
# non-destructive contract of the import-noteplan skill — MIGRATING content must
# only ADD a "🔗 Migrated to Blog" table; it must never drop a link or a content
# line the user wrote.
#
# It re-runs the corpus no-drop audit (import-noteplan.js --audit) against a
# session BASELINE snapshot. If any link/line present in the baseline is now
# missing, the edit is a destructive change → exit 2 (marks the edit failed and
# feeds stderr back so the model restores what it dropped).
#
# The baseline is created once per session by the skill (or on first edit here if
# absent). Location: $NOTEPLAN_BASELINE, else the session scratchpad, else a repo
# tmp path. If no baseline exists yet, the hook creates one from the CURRENT state
# and passes (it can only guard drops that happen AFTER the first snapshot).

input=$(cat)
file_path=$(printf '%s' "$input" | jq -r '.tool_input.file_path // empty')

# Only NotePlan "Lists" files (the folder the import-noteplan skill operates on).
case "$file_path" in
  *"/co.noteplan.NotePlan3/"*"/🏡📋 Lists/"*.md) ;;
  *) exit 0 ;;
esac

proj="${CLAUDE_PROJECT_DIR:-$(printf '%s' "$input" | jq -r '.cwd // empty')}"
script="$proj/.claude/skills/import-noteplan/import-noteplan.js"
[ -f "$script" ] || exit 0

# The folder being guarded = the "🏡📋 Lists" dir of the edited file.
lists_dir="${file_path%/*}"

# Where the session baseline snapshot lives.
baseline="${NOTEPLAN_BASELINE:-}"
if [ -z "$baseline" ]; then
  base_dir="${CLAUDE_SCRATCHPAD_DIR:-${TMPDIR:-/tmp}}"
  baseline="$base_dir/noteplan-lists-baseline.json"
fi

# First edit of the session with no baseline: snapshot now and allow (nothing to
# compare against yet — we can only catch drops relative to a prior state).
if [ ! -f "$baseline" ]; then
  node "$script" --snapshot "$lists_dir" --out "$baseline" >/dev/null 2>&1
  exit 0
fi

out=$(node "$script" --audit "$lists_dir" --baseline "$baseline" 2>&1)
rc=$?

if [ "$rc" -eq 2 ]; then
  {
    echo "🛑 NotePlan content DROPPED — the import-noteplan skill's non-destructive contract was"
    echo "   violated. Migrating must only APPEND a '🔗 Migrated to Blog' table; it must never remove"
    echo "   a link or line the user wrote. Restore the removed content, then re-run the migration so"
    echo "   it only adds a table row."
    echo ""
    printf '%s\n' "$out" | grep -E '^\s*\[' | head -20
    echo ""
    echo "Full audit:  node .claude/skills/import-noteplan/import-noteplan.js --audit \"$lists_dir\" --baseline \"$baseline\""
  } >&2
  exit 2
fi

exit 0
