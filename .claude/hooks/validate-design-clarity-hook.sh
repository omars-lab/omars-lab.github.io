#!/bin/bash
# PostToolUse hook for Edit|Write: WARN (never block) on the MECHANICAL clarity/leak tells in a
# /designs post. Surfaces every advisory from scripts/validate-design-clarity.js for the edited file:
#
#   - leak-term         a banned proprietary/internal term (scripts/lib/design-leak-terms.json)
#   - trailing-ellipsis a line ends in a "…"/"..." placeholder-thought
#   - verbatim-dup      a non-trivial line is repeated verbatim within the post
#   - thin-section      an H2 section is a near-empty stub
#   - diagram-redraw    a ```mermaid diagram immediately redrawn as ascii (same structure twice)
#
# These are the greppable subset only; the judgment calls (real wordiness, question-set coverage,
# leak-vs-fair-generalization) live in the refine-design-post skill. The validator exits 0 (warn-tier)
# so this hook never blocks the edit. Scoped to /designs content — the blog whose theme is generality.

input=$(cat)
file_path=$(printf '%s' "$input" | jq -r '.tool_input.file_path // empty')

# Only content markdown/MDX under the designs blog.
case "$file_path" in
  *.md|*.mdx) ;;
  *) exit 0 ;;
esac
case "$file_path" in
  */bytesofpurpose-blog/designs/*) ;;
  *) exit 0 ;;
esac
[ -f "$file_path" ] || exit 0

# Skip sidecar/partials (filenames starting with _) — they're not standalone posts (mockups etc.).
case "$(basename "$file_path")" in
  _*) exit 0 ;;
esac

proj="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null)}"
script="$proj/bytesofpurpose-blog/scripts/validate-design-clarity.js"
[ -f "$script" ] || exit 0

# Run the validator on just this file; surface its advisory output. It exits 0 (warn-tier),
# so this hook never blocks the edit.
out=$(node "$script" "$file_path" 2>&1)
case "$out" in
  *"[warn:clarity-"*)
    printf '%s\n' "$out" >&2
    ;;
esac

exit 0
