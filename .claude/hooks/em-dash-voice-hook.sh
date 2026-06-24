#!/bin/bash
# PostToolUse hook for Edit|Write: BLOCK when user-facing content gains an em-dash ("—")
# OR a "--" double-hyphen used as a sentence dash (the em-dash-hook BYPASS anti-pattern).
#
# WHY: a literal em-dash in prose is a strong tell of AI-generated voice. On this blog,
# reader-facing copy should sound human, so an em-dash is treated as a flag to STOP and
# decide deliberately — not a thing that silently ships. The hook does NOT rewrite; it
# blocks (exit 2) and tells Claude to surface the occurrence(s) to the user via the
# AskUserQuestion tool and offer per-occurrence rephrasings (comma / colon / period-split /
# parentheses / keep). The human picks; Claude applies.
#
# ANTI-PATTERN ALSO CAUGHT: typing "--" (double hyphen) as a stand-in for an em-dash to
# DODGE this hook. That is a workaround, not a fix — it reads as a typo and still carries
# the same AI-dash cadence. So a "--" used as a clause/sentence dash is flagged the same
# way. (Legitimate "--" is NOT flagged: CLI flags like --port, YAML/markdown "---" rules,
# HTML "<!-- -->" comments, and anything inside a fenced ``` code block.)
#
# SCOPE: user-facing content only —
#   - prose: bytesofpurpose-blog/{docs,blog,designs,changelog}/**.{md,mdx}
#   - markup: any *.html (rendered output / embedded pages — all user-facing)
#   - components: bytesofpurpose-blog/src/**.{tsx,jsx} — but ONLY when the dash is in a
#     USER-FACING STRING (JSX text or a quoted literal), not in a // comment or /* */ block.
# Code, config, CSS, skills, plans, and CLAUDE.md are intentionally NOT scoped: dashes
# there are not reader-facing.
#
# Detection is on the FILE'S CURRENT CONTENT (post-edit), so it catches a dash however
# it arrived. It reports the line numbers + snippets so Claude can target the ask.
#
# NOTE: the em-dash U+2014 ("—") and the "--" bypass are flagged. The en-dash (–) and a
# lone hyphen (-) are fine.

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

# --- Find em-dashes AND "--" bypasses in user-facing positions --------------------------
# For prose + html: any em-dash counts. For components: exclude lines that are purely
# comments (// … or * … or /* …), since those aren't reader-facing. (A heuristic — a string
# literal AND a trailing comment on the same line still flags, which is the safe default.)
#
# The "--" bypass: flagged when used as a prose dash. To avoid false positives we
#   - track fenced ``` code blocks and skip lines inside them,
#   - skip a markdown/YAML horizontal rule or frontmatter delimiter (a line of only dashes),
#   - strip inline `code` spans and <!-- html comments --> before scanning,
#   - require the "--" to look like a sentence dash: " -- " (spaced), or attached to a word
#     on one side with a space on the other ("word-- " or " --word"), NOT a CLI flag
#     ("--port" has no leading space-or-start boundary that we treat as prose, and we
#     explicitly skip "--" immediately followed by a letter when preceded by a non-space).
hits=$(awk -v mode="$in_scope" '
  BEGIN { infence=0 }
  {
    line=$0
    raw=$0

    # toggle fenced code blocks (``` or ~~~ at line start, allowing indentation)
    t=line; sub(/^[[:space:]]+/, "", t)
    if (t ~ /^(```|~~~)/) { infence = !infence; next }
    if (infence) next

    flagged=0; reason=""

    # 1) em-dash U+2014
    if (index(line, "\xE2\x80\x94") > 0) { flagged=1; reason="em-dash" }

    # 2) "--" bypass — scan a SANITIZED copy of the line
    s=line
    # drop inline code spans `...`
    gsub(/`[^`]*`/, "", s)
    # drop html comments <!-- ... -->
    gsub(/<!--/, "", s); gsub(/-->/, "", s)
    # a line that is only dashes/space (--- rule, frontmatter, table sep) is not prose
    tt=s; gsub(/[[:space:]]/, "", tt)
    is_rule = (tt ~ /^-+$/)
    if (!is_rule) {
      # spaced sentence dash:  " -- " (both sides space). NOT "---". This is the dominant
      # bypass form and never matches a CLI flag (flags are "--word", no space after "--").
      if (s ~ /[^-] -- [^-]/ || s ~ /^-- [^-]/ || s ~ /[^-] --$/) {
        flagged=1; reason=(reason=="" ? "\"--\" bypass" : reason " + \"--\"")
      }
      # punctuation-attached-before dash: "word-- " / "word--," (attached to the PRECEDING
      # token, space/punct after). Catches "Quarterly-- objectives". A CLI flag has a space
      # BEFORE "--", so requiring an alnum/punct immediately before excludes flags.
      else if (s ~ /[[:alnum:],.;:!?\x27\x22)]-- +[[:alnum:]]/) {
        flagged=1; reason=(reason=="" ? "\"--\" bypass" : reason " + \"--\"")
      }
    }

    if (!flagged) next

    if (mode == "component") {
      c=line; sub(/^[[:space:]]+/, "", c)
      if (c ~ /^\/\// || c ~ /^\*/ || c ~ /^\/\*/) next
    }

    snip=raw; sub(/^[[:space:]]+/, "", snip)
    if (length(snip) > 120) snip=substr(snip,1,117) "..."
    printf "  L%d [%s]: %s\n", NR, reason, snip
  }
' "$file_path")

[ -n "$hits" ] || exit 0

rel="${file_path##*/}"
count=$(printf '%s\n' "$hits" | grep -c .)

{
  echo "BLOCKED — em-dash (\"—\") or \"--\" bypass found in user-facing content: $rel ($count occurrence(s))."
  echo "An em-dash reads as AI voice; \"--\" is the same anti-pattern wearing a disguise (it dodges"
  echo "this hook but reads as a typo). Do NOT just swap one for the other and do NOT rewrite silently."
  echo
  echo "Occurrence(s) (tag shows what was found):"
  printf '%s\n' "$hits"
  echo
  echo "REQUIRED next step: use the AskUserQuestion tool to ask the user how to handle EACH"
  echo "occurrence, offering: replace with a comma · a colon · split into two sentences"
  echo "(period) · parentheses · keep as-is. Apply the user's choice, then continue."
  echo "(Flagged: U+2014 \"—\" and \"--\" used as a sentence dash. A lone hyphen, en-dash,"
  echo " CLI flags like --port, \"---\" rules, <!-- comments -->, and fenced code are NOT flagged.)"
} >&2

exit 2
