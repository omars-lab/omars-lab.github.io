#!/bin/bash
# PostToolUse hook for Edit|Write: WARN (never block) when a board post or the tag-gloss registry is
# edited and a board (ideas/experiments) tag is missing its tooltip gloss.
#
# Every tag chip on the Ideas/Experimentation board has a hover/focus/tap tooltip that explains the
# tag (KanbanBoard + src/lib/idea-tags.ts). A board-post tag with no entry in IDEA_TAG_GLOSS falls
# back to a generic bubble that teaches the reader nothing. This hook runs scripts/validate-idea-tags.js
# after you edit a board post (thoughts/ or blog/) or the registry itself, so the moment you add a new
# theme tag without a gloss, you're nudged to define it. Warn-tier (exits 0, never blocks); the
# blocking gate is `make validate-idea-tags`.
#
# Scope: a .md/.mdx under bytesofpurpose-blog/{thoughts,blog}/ (where board posts live) OR the registry
# src/lib/idea-tags.ts. The validator scans all board posts (it's fast); the edited file just triggers it.

if [ "$1" = "--selftest" ]; then
  SELFTEST_HOOK="$0"; . "$(dirname "$0")/lib/selftest.sh"
  assert_ignored '{"tool_input":{"file_path":"/x/unrelated.txt"}}' 'an out-of-scope file is ignored'
  selftest_report; exit $?
fi

input=$(cat)
file_path=$(printf '%s' "$input" | jq -r '.tool_input.file_path // empty')

case "$file_path" in
  */bytesofpurpose-blog/thoughts/*.md|*/bytesofpurpose-blog/thoughts/*.mdx) ;;
  */bytesofpurpose-blog/blog/*.md|*/bytesofpurpose-blog/blog/*.mdx) ;;
  */bytesofpurpose-blog/src/lib/idea-tags.ts) ;;
  *) exit 0 ;;
esac
[ -f "$file_path" ] || exit 0

proj="${CLAUDE_PROJECT_DIR:-$(printf '%s' "$input" | jq -r '.cwd // empty')}"
script="$proj/bytesofpurpose-blog/scripts/validate-idea-tags.js"
[ -f "$script" ] || exit 0   # not this repo / not set up → stay out of the way

out=$(cd "$proj/bytesofpurpose-blog" && node scripts/validate-idea-tags.js 2>&1)
if printf '%s' "$out" | grep -q 'with NO gloss'; then
  {
    echo "🏷️  idea-tags: a board tag has NO tooltip gloss"
    printf '%s\n' "$out" | grep -E '•|with NO gloss'
    echo ""
    echo "   Add a one-line definition to IDEA_TAG_GLOSS in src/lib/idea-tags.ts."
    echo "   (advice only — not blocking. Run \`make validate-idea-tags\` for the gate.)"
  } >&2
fi

# WARN-only: always succeed so the edit is never blocked.
exit 0
