#!/bin/bash
# PostToolUse hook for Edit|Write: WARN (never block) when a hand-authored mermaid flow
# diagram is too dense to read (a 40-node flowchart, a node fanning out to eight others).
# A ```mermaid ``` fence has no legibility gate (unlike <FlowDiagram>/<UseCaseDiagram>,
# which gate their own layout), so this nudges the author to split it, collapse a subgraph,
# or reach for <FlowDiagram>. Cheap TEXT metrics (node/edge/fan-out), not a render.
#
# Sibling of validate-visual-density-hook.sh (warn-tier). Pairs with
# scripts/validate-mermaid-complexity.js + the author-mermaid / upgrade-post skills.

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

# Fast pre-check: no mermaid fence → nothing to score, skip spawning node.
grep -q '```mermaid' "$file_path" 2>/dev/null || exit 0

proj="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null)}"
script="$proj/bytesofpurpose-blog/scripts/validate-mermaid-complexity.js"
[ -f "$script" ] || exit 0

out=$(node "$script" "$file_path" 2>&1)
case "$out" in
  *"[warn:mermaid-dense]"*)
    printf '%s\n' "$out" >&2
    ;;
esac

exit 0
