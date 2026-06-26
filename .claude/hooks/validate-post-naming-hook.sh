#!/bin/bash
# PostToolUse hook for Edit|Write: WARN (never block) when a /thoughts post's TITLE reads as a
# completed initiative ("My First X", "Building X") instead of the open QUESTION an unactioned
# thought should be ("Should I build X?").
#
# A title is a promise about what the post IS. An unactioned thought titled like a finished thing
# reads as something I already did. This catches that at edit time and suggests the question form.
# See the name-post skill for the full voice-per-kind contract. Warn-tier: exits 0, never blocks
# (naming is a judgment call). The full sweep is `make validate-naming`.

input=$(cat)
file_path=$(printf '%s' "$input" | jq -r '.tool_input.file_path // empty')

case "$file_path" in
  *.md|*.mdx) ;;
  *) exit 0 ;;
esac
# Scope: posts under the thoughts/ instance (the unactioned-thought collection). Skip partials.
case "$file_path" in
  */bytesofpurpose-blog/thoughts/*) ;;
  *) exit 0 ;;
esac
case "$file_path" in
  */_*) exit 0 ;;
esac
[ -f "$file_path" ] || exit 0

proj="${CLAUDE_PROJECT_DIR:-$(printf '%s' "$input" | jq -r '.cwd // empty')}"
script="$proj/bytesofpurpose-blog/scripts/validate-post-naming.js"
[ -f "$script" ] || exit 0

out=$(cd "$proj/bytesofpurpose-blog" && node scripts/validate-post-naming.js --file "$file_path" 2>&1)
if printf '%s' "$out" | grep -q '\[warn:'; then
  rel="${file_path##*/bytesofpurpose-blog/}"
  {
    echo "🏷  Post naming: this thought's title reads as a completed initiative — '$rel'"
    printf '%s\n' "$out" | grep -A1 '\[warn:'
    echo ""
    echo "   An unactioned thought should read as the QUESTION being weighed, not a finished thing."
    echo "   (advice only — not blocking. See the name-post skill; \`make validate-naming\` for all.)"
  } >&2
fi

# WARN-only: always succeed so the edit is never blocked.
exit 0
