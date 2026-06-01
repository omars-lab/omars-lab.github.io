#!/bin/bash
# PostToolUse hook for Edit|Write: block on ERROR-tier link problems in .md/.mdx.
#
# ERROR tier = bare-url, url-as-text (see scripts/validate-links.js / validate-links skill).
# WARN tier  = long-url, generic-text → printed as advice, never blocks.
#
# Exit 2 marks the edit as failed and feeds stderr back to Claude so it can
# self-correct (e.g. by running `make validate-links` / the --fix mode).

input=$(cat)
file_path=$(printf '%s' "$input" | jq -r '.tool_input.file_path // empty')

# Only care about markdown/MDX content files.
case "$file_path" in
  *.md|*.mdx) ;;
  *) exit 0 ;;
esac
[ -f "$file_path" ] || exit 0

# Locate the validator relative to the project dir (cwd from the hook payload).
proj="${CLAUDE_PROJECT_DIR:-$(printf '%s' "$input" | jq -r '.cwd // empty')}"
script="$proj/bytesofpurpose-blog/scripts/validate-links.js"
[ -f "$script" ] || exit 0   # not this repo / not set up → stay out of the way

# ERROR-tier only. Exit 2 from the script == ERROR-tier findings present.
out=$(node "$script" "$file_path" --error-only 2>&1)
rc=$?

if [ "$rc" -eq 2 ]; then
  {
    echo "🔗 Link hygiene: ERROR-tier link problems in $file_path"
    echo "$out"
    echo ""
    echo "Fix bare/url-as-text links before continuing. To auto-convert:"
    echo "  ( cd $proj/bytesofpurpose-blog && node scripts/validate-links.js --fix \"$file_path\" )"
    echo "(see the validate-links skill for the labeling tiers)"
  } >&2
  exit 2
fi

# WARN-tier findings are surfaced by the full `make validate-links`; the hook
# stays quiet on them so it never blocks on judgment calls.
exit 0
