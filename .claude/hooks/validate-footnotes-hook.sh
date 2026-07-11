#!/bin/bash
# PostToolUse hook for Edit|Write: block on broken evidence-footnote permalinks in .md/.mdx.
#
# Evidence footnotes ([^id]: <Evidence repo=... sha=... path=... lines=... note=.../>)
# carry SOURCE EVIDENCE via pinned GitHub permalinks. A footnote whose permalink doesn't
# resolve (typo'd/unpushed SHA, moved/untracked path, out-of-range lines) is a broken
# public link + a misleading citation — so every finding is ERROR-tier and blocks.
#
# Exit 2 marks the edit as failed and feeds stderr back to Claude so it can self-correct
# (re-pin to a real pushed SHA, fix the path/lines, or push the cited commit first).
#
# Sibling of validate-links-hook.sh / em-dash-voice-hook.sh.

if [ "$1" = "--selftest" ]; then
  SELFTEST_HOOK="$0"; . "$(dirname "$0")/lib/selftest.sh"
  assert_ignored '{"tool_input":{"file_path":"/x/unrelated.txt"}}' 'an out-of-scope file is ignored'
  selftest_report; exit $?
fi

input=$(cat)
file_path=$(printf '%s' "$input" | jq -r '.tool_input.file_path // empty')

# Only markdown/MDX content files.
case "$file_path" in
  *.md|*.mdx) ;;
  *) exit 0 ;;
esac
[ -f "$file_path" ] || exit 0

proj="${CLAUDE_PROJECT_DIR:-$(printf '%s' "$input" | jq -r '.cwd // empty')}"
script="$proj/bytesofpurpose-blog/scripts/validate-footnotes.js"
[ -f "$script" ] || exit 0   # not this repo / not set up → stay out of the way

# Fast skip: only pay the git-walk cost if the file actually has an <Evidence> footnote.
grep -q '<Evidence' "$file_path" 2>/dev/null || exit 0

out=$(node "$script" "$file_path" --error-only 2>&1)
rc=$?

if [ "$rc" -eq 2 ]; then
  {
    echo "🔎 Footnote evidence: broken permalink(s) in $file_path"
    echo "$out"
    echo ""
    echo "A footnote permalink that doesn't resolve is a broken public link. Fix it before continuing:"
    echo "  • re-pin to a real commit SHA that is PUSHED to origin"
    echo "  • correct the path / line range to what exists at that SHA"
    echo "  • if the cited commit isn't pushed yet, push it first"
    echo "Run the full check:  ( cd $proj/bytesofpurpose-blog && node scripts/validate-footnotes.js $file_path )"
  } >&2
  exit 2
fi

exit 0
