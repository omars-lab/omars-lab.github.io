#!/bin/bash
# PostToolUse hook for Edit|Write: WARN-tier (never blocks). When a blog/designs post is
# written/edited, check whether THIS FILE is a glossary-link CANDIDATE — i.e. it uses a
# defined glossary term whose first instance is not yet linked. If so, NUDGE to run the
# `audit-glossary-links` skill on this file.
#
# The regex validator's only job here is FILE-LEVEL triage: "does this file have any unlinked
# term-of-art candidate?" It deliberately does NOT decide genuine-vs-casual or apply links —
# that judgment is the skill's. So the hook surfaces the candidate file and points at the skill;
# it never blocks (linking is a per-occurrence judgment call) and it stays silent on files with
# no candidates.

input=$(cat)
file_path=$(printf '%s' "$input" | jq -r '.tool_input.file_path // empty')

# Only blog/designs content posts (the glossary-link convention is for posts). Docs define the
# terms; we don't auto-link inside the glossaries themselves.
case "$file_path" in
  *.md|*.mdx) ;;
  *) exit 0 ;;
esac
case "$file_path" in
  */bytesofpurpose-blog/blog/*|*/bytesofpurpose-blog/designs/*) ;;
  *) exit 0 ;;
esac
[ -f "$file_path" ] || exit 0

proj="${CLAUDE_PROJECT_DIR:-$(printf '%s' "$input" | jq -r '.cwd // empty')}"
script="$proj/bytesofpurpose-blog/scripts/validate-glossary-links.js"
[ -f "$script" ] || exit 0   # not set up → stay out of the way

# File-level triage: any candidate findings for THIS file? (--json → array; non-empty = candidate)
findings=$(node "$script" "$file_path" --json 2>/dev/null)
count=$(printf '%s' "$findings" | jq 'length' 2>/dev/null || echo 0)

if [ "${count:-0}" -gt 0 ]; then
  rel="${file_path##*/bytesofpurpose-blog/}"
  terms=$(printf '%s' "$findings" | jq -r '[.[].term] | unique | join(", ")' 2>/dev/null)
  {
    echo "📖 Glossary candidate: '$rel' uses defined term(s) whose first use isn't linked: $terms"
    echo "   These are CANDIDATES, not defects — a regex can't tell a term-of-art from casual"
    echo "   English. Run the \`audit-glossary-links\` skill on this file to judge which first-use"
    echo "   is genuine and link only that one (casual uses stay plain)."
    echo "   (advice only — not blocking.)"
  } >&2
fi

# WARN-tier: never block — linking is a judgment call the skill owns.
exit 0
