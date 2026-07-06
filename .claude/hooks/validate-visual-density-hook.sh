#!/bin/bash
# PostToolUse hook for Edit|Write: WARN (never block) when an H2 section is a wall of text
# with no visual. A picture is worth a thousand words: when a section runs long with no
# diagram / chart / image / table / code block, a visual usually carries the idea better
# than three more paragraphs. Advisory only: a genuinely prose section is fine; the point
# is to make a wall of text a DELIBERATE choice.
#
# Sibling of validate-post-outline-hook.sh / validate-questions-hook.sh (warn-tier). Pairs
# with scripts/validate-visual-density.js + the upgrade-post skill (the component catalog).

input=$(cat)
file_path=$(printf '%s' "$input" | jq -r '.tool_input.file_path // empty')

case "$file_path" in
  *.md|*.mdx) ;;
  *) exit 0 ;;
esac
case "$file_path" in
  */bytesofpurpose-blog/docs/*|*/bytesofpurpose-blog/blog/*|*/bytesofpurpose-blog/designs/*) ;;
  *) exit 0 ;;
esac
[ -f "$file_path" ] || exit 0

# Skip sidecar/partials (filenames starting with _).
case "$(basename "$file_path")" in
  _*) exit 0 ;;
esac

proj="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null)}"
script="$proj/bytesofpurpose-blog/scripts/validate-visual-density.js"
[ -f "$script" ] || exit 0

out=$(node "$script" "$file_path" 2>&1)
case "$out" in
  *"[WARN:wall-of-text]"*)
    printf '%s\n' "$out" >&2
    ;;
esac

exit 0
