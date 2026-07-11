#!/bin/bash
# PostToolUse hook for Edit|Write: on a .md/.mdx edit, verify its noteplan:// links resolve.
#
# A NotePlan link (rendered by <NotePlanButton>) opens a note in the author's local NotePlan
# app. This checks the referenced note actually EXISTS on disk, so a renamed/deleted backlog
# note doesn't leave a dead button. LOCAL-ONLY: if the NotePlan store isn't on this machine
# (CI, another machine), the validator checks syntax only and passes — so the hook never
# blocks off-machine. On-machine, a link to a missing note is ERROR-tier (exit 2).
#
# See scripts/validate-noteplan-links.js + the transform-noteplan-links skill.

if [ "$1" = "--selftest" ]; then
  SELFTEST_HOOK="$0"; . "$(dirname "$0")/lib/selftest.sh"
  assert_ignored '{"tool_input":{"file_path":"/x/unrelated.txt"}}' 'an out-of-scope file is ignored'
  selftest_report; exit $?
fi

input=$(cat)
file_path=$(printf '%s' "$input" | jq -r '.tool_input.file_path // empty')

# Only the reader-facing CONTENT (docs/blog/designs). NOT skill/plan/CLAUDE docs, which may
# discuss the link scheme in prose/examples (those are not real note references).
case "$file_path" in
  */bytesofpurpose-blog/docs/*.md|*/bytesofpurpose-blog/docs/*.mdx|\
  */bytesofpurpose-blog/blog/*.md|*/bytesofpurpose-blog/blog/*.mdx|\
  */bytesofpurpose-blog/designs/*.md|*/bytesofpurpose-blog/designs/*.mdx) ;;
  *) exit 0 ;;
esac
[ -f "$file_path" ] || exit 0

# Only bother if the file actually has a noteplan reference.
grep -q "noteplan://\|<NotePlanButton" "$file_path" 2>/dev/null || exit 0

proj="${CLAUDE_PROJECT_DIR:-$(printf '%s' "$input" | jq -r '.cwd // empty')}"
script="$proj/bytesofpurpose-blog/scripts/validate-noteplan-links.js"
[ -f "$script" ] || exit 0   # not this repo / not set up → stay out of the way

out=$(node "$script" --file "$file_path" 2>&1)
rc=$?

if [ "$rc" -eq 2 ]; then
  {
    echo "🗒️  NotePlan links: a link in $file_path does not resolve to a real note"
    echo "$out"
    echo ""
    echo "Fix the note title/filename (or the note moved). To recheck:"
    echo "  ( cd $proj && make validate-noteplan-links )"
    echo "(see the transform-noteplan-links skill for the <NotePlanButton> API + the x-callback-url scheme)"
  } >&2
  exit 2
fi

exit 0
