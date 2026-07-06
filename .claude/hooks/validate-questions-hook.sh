#!/bin/bash
# PostToolUse hook for Edit|Write: WARN (never block) on a malformed `questions:` field.
#
# `questions:` is the optional list of reader questions a post answers, rendered by the
# <PostQuestions> box at the top of the post. The field is advisory, so this only nudges
# (never blocks) when it is present but ill-formed: a scalar instead of a list, an empty
# list, a blank item, or an item that does not read as a question (does not end in "?").
#
# Sibling of validate-post-outline-hook.sh (warn-tier). Pairs with
# scripts/validate-questions.js + src/components/PostQuestions + the author-blog-post skill.

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

# Fast skip: only run if the file actually declares a `questions:` field.
grep -qE '^questions\s*:' "$file_path" 2>/dev/null || exit 0

proj="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null)}"
script="$proj/bytesofpurpose-blog/scripts/validate-questions.js"
[ -f "$script" ] || exit 0

out=$(node "$script" "$file_path" 2>&1)
case "$out" in
  *"[WARN:questions-"*)
    printf '%s\n' "$out" >&2
    ;;
esac

exit 0
