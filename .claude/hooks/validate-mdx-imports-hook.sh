#!/bin/bash
# PostToolUse hook for Edit|Write: block on a Capitalized JSX tag in a .md/.mdx that is
# used but never imported (and not globally registered / not a built-in).
#
# Why block: the production build EXCLUDES drafts, so a broken draft using <FlowDiagram>
# without importing it passes `docusaurus build` and every other gate, then fails only when
# someone renders that page. In MDX an unresolved Capitalized tag is a render break, so this
# is ERROR-tier and blocks (exit 2 feeds stderr back to Claude to self-correct).
#
# Sibling of validate-footnotes-hook.sh / em-dash-voice-hook.sh.

input=$(cat)
file_path=$(printf '%s' "$input" | jq -r '.tool_input.file_path // empty')

# Only markdown/MDX content files.
case "$file_path" in
  *.md|*.mdx) ;;
  *) exit 0 ;;
esac
[ -f "$file_path" ] || exit 0

proj="${CLAUDE_PROJECT_DIR:-$(printf '%s' "$input" | jq -r '.cwd // empty')}"
script="$proj/bytesofpurpose-blog/scripts/validate-mdx-imports.js"
[ -f "$script" ] || exit 0   # not this repo / not set up → stay out of the way

# Fast skip: only pay the scan cost if the file actually has a Capitalized JSX tag.
grep -qE '<[A-Z][A-Za-z0-9]*' "$file_path" 2>/dev/null || exit 0

out=$(node "$script" "$file_path" --error-only 2>&1)
rc=$?

if [ "$rc" -eq 2 ]; then
  {
    echo "🔎 MDX imports: unresolved component tag(s) in $file_path"
    echo "$out"
    echo ""
    echo "An unresolved Capitalized tag is a render break (drafts are excluded from the build,"
    echo "so this would ship silently). Fix before continuing:"
    echo "  • add an import for the component, or"
    echo "  • register it in bytesofpurpose-blog/src/theme/MDXComponents.tsx if it should be global, or"
    echo "  • if it is example text, wrap it in a code fence (\`\`\`), or"
    echo "  • fix the tag name."
    echo "Run the full check:  ( cd $proj/bytesofpurpose-blog && node scripts/validate-mdx-imports.js $file_path )"
  } >&2
  exit 2
fi

exit 0
