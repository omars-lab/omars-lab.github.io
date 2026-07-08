#!/bin/bash
# PreToolUse hook for Edit|Write: BLOCK (exit 2) any write whose target path is inside a
# personalbook repo.
#
# WHY: personalbook is the user's PRIVATE knowledge base. The `import-personalbook-role`
# skill READS role folders from it (Overview.md + skills/knowledge/habits/artifacts) as
# influence for a `/journey/roles/` post it authors HERE, in the blog repo. The old
# personalbook-side flow (scan-blog-worthy) used to write markers BACK into those private
# files (`blog: yes`, `blog_slug:`, provenance notes) — exactly the coupling this skill
# was built to end. This guard makes that mutation IMPOSSIBLE by omission: a role import is
# read-only on personalbook, full stop, and any attempted write there fails closed.
#
# SCOPE: a path containing a "/personalbook/" segment (the repo dir name). This is
# intentionally broad — no legitimate blog-repo task writes into personalbook. If a future
# task genuinely needs to write there, it should be run from within the personalbook repo's
# own session (which does not load this hook), not from the blog repo.
#
# Fail-closed shape mirrors the repo's other blocking hooks (em-dash-voice, noteplan-no-drop).

input=$(cat)
file_path=$(printf '%s' "$input" | jq -r '.tool_input.file_path // empty')
[ -n "$file_path" ] || exit 0

case "$file_path" in
  */personalbook/*)
    {
      echo "🛑 BLOCKED — write into personalbook refused: $file_path"
      echo ""
      echo "personalbook is a PRIVATE, READ-ONLY source for the blog repo. The"
      echo "import-personalbook-role skill READS role folders as influence and writes ONLY into"
      echo "bytesofpurpose-blog/docs/journey/roles/ — it must never mutate a personalbook file"
      echo "(no markers, no provenance notes, no edits). If you meant to write a role POST, target"
      echo "docs/journey/roles/<role>.md instead. If you genuinely need to edit personalbook, do it"
      echo "from a session opened INSIDE the personalbook repo, not from here."
    } >&2
    exit 2
    ;;
esac

exit 0
