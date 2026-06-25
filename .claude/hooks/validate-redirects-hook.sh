#!/bin/bash
# PostToolUse hook for Edit|Write on docusaurus.config.js: surface ERROR-tier redirect problems
# (a redirect whose `to:` target is missing or draft would FAIL the prod build). Catches the
# break in seconds instead of at the next slow build.
#
# Exit 2 marks the edit as failed + feeds stderr back so the model self-corrects (fix the target
# or drop the redirect). Warn-tier findings (dead/duplicate redirects) are left for the full
# `make validate-redirects`; the hook only blocks on the build-breaking ERROR tier.

input=$(cat)
file_path=$(printf '%s' "$input" | jq -r '.tool_input.file_path // empty')

# Only the Docusaurus config (where the redirects array lives).
case "$file_path" in
  */bytesofpurpose-blog/docusaurus.config.js) ;;
  *) exit 0 ;;
esac
[ -f "$file_path" ] || exit 0

proj="${CLAUDE_PROJECT_DIR:-$(printf '%s' "$input" | jq -r '.cwd // empty')}"
script="$proj/bytesofpurpose-blog/scripts/validate-redirects.js"
[ -f "$script" ] || exit 0

out=$(cd "$proj/bytesofpurpose-blog" && node scripts/validate-redirects.js 2>&1)
rc=$?

if [ "$rc" -eq 2 ]; then
  {
    echo "🔀 Redirect problem: a redirect target is MISSING or DRAFT (would fail the prod build)."
    printf '%s\n' "$out" | grep -A1 "error:redirect-"
    echo ""
    echo "Fix the target (a moved slug?) or drop the redirect. Full check:"
    echo "  ( cd $proj && make validate-redirects )"
  } >&2
  exit 2
fi

# Clean or warn-only: don't block.
exit 0
