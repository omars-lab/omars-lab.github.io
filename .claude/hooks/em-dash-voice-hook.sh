#!/bin/bash
# PostToolUse hook for Edit|Write: BLOCK when user-facing content gains an em-dash ("—").
#
# WHY: a literal em-dash in prose is a strong tell of AI-generated voice. On this blog,
# reader-facing copy should sound human, so an em-dash is treated as a flag to STOP and
# decide deliberately — not a thing that silently ships. The hook does NOT rewrite; it
# blocks (exit 2) and tells Claude to surface the occurrence(s) to the user via the
# AskUserQuestion tool and offer per-occurrence rephrasings (comma / colon / period-split /
# parentheses / keep). The human picks; Claude applies.
#
# SCOPE: user-facing content only —
#   - prose: bytesofpurpose-blog/{docs,blog,designs,changelog}/**.{md,mdx}
#   - markup: any *.html (rendered output / embedded pages — all user-facing)
#   - components: bytesofpurpose-blog/src/**.{tsx,jsx} — but ONLY when the em-dash is in a
#     USER-FACING STRING (JSX text or a quoted literal), not in a // comment or /* */ block.
# Code, config, CSS, skills, plans, and CLAUDE.md are intentionally NOT scoped: em-dashes
# there are not reader-facing.
#
# Detection is on the FILE'S CURRENT CONTENT (post-edit), so it catches an em-dash however
# it arrived. It reports the line numbers + snippets so Claude can target the ask.
#
# NOTE: only the em-dash U+2014 ("—") is flagged. The en-dash (–) and hyphen (-) are fine.

input=$(cat)
file_path=$(printf '%s' "$input" | jq -r '.tool_input.file_path // empty')
[ -n "$file_path" ] || exit 0
[ -f "$file_path" ] || exit 0

# --- Is this file in scope? -------------------------------------------------------------
in_scope=""
case "$file_path" in
  *.md|*.mdx)
    case "$file_path" in
      */bytesofpurpose-blog/docs/*|*/bytesofpurpose-blog/blog/*|\
*/bytesofpurpose-blog/designs/*|*/bytesofpurpose-blog/changelog/*)
        in_scope="prose" ;;
    esac ;;
  *.html)
    in_scope="html" ;;
  *.tsx|*.jsx)
    case "$file_path" in
      */bytesofpurpose-blog/src/*) in_scope="component" ;;
    esac ;;
esac
[ -n "$in_scope" ] || exit 0

# --- Find em-dashes in user-facing positions --------------------------------------------
# For prose + html: any em-dash counts. For components: exclude lines that are purely
# comments (// … or * … or /* …), since those aren't reader-facing. (A heuristic — a string
# literal AND a trailing comment on the same line still flags, which is the safe default.)
hits=$(awk -v mode="$in_scope" '
  index($0, "\xE2\x80\x94") > 0 {
    line=$0
    if (mode == "component") {
      t=line; sub(/^[[:space:]]+/, "", t)
      # skip lines that are entirely a line- or block-comment
      if (t ~ /^\/\// || t ~ /^\*/ || t ~ /^\/\*/) next
    }
    # trim leading whitespace for a compact snippet
    snip=line; sub(/^[[:space:]]+/, "", snip)
    if (length(snip) > 120) snip=substr(snip,1,117) "..."
    printf "  L%d: %s\n", NR, snip
  }
' "$file_path")

[ -n "$hits" ] || exit 0

rel="${file_path##*/}"
count=$(printf '%s\n' "$hits" | grep -c .)

{
  echo "BLOCKED — em-dash (\"—\") found in user-facing content: $rel ($count occurrence(s))."
  echo "An em-dash in reader-facing copy reads as AI voice. Do NOT just rewrite it silently."
  echo
  echo "Occurrence(s):"
  printf '%s\n' "$hits"
  echo
  echo "REQUIRED next step: use the AskUserQuestion tool to ask the user how to handle EACH"
  echo "occurrence, offering: replace with a comma · a colon · split into two sentences"
  echo "(period) · parentheses · keep as-is. Apply the user's choice, then continue."
  echo "(Only U+2014 \"—\" is flagged; en-dash and hyphen are fine.)"
} >&2

exit 2
