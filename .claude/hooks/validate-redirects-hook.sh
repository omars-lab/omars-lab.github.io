#!/bin/bash
# PostToolUse hook for Edit|Write on docusaurus.config.js: surface ERROR-tier redirect problems
# (a redirect whose `to:` target is missing, draft, OR itself redirected again — a chain a→b→c
# Docusaurus won't follow — would FAIL the prod build). Catches the break in seconds instead of
# at the next slow build.
#
# Exit 2 marks the edit as failed + feeds stderr back so the model self-corrects (fix the target
# or drop the redirect). Warn-tier findings (dead/duplicate redirects) are left for the full
# `make validate-redirects`; the hook only blocks on the build-breaking ERROR tier.

if [ "$1" = "--selftest" ]; then
  SELFTEST_HOOK="$0"; . "$(dirname "$0")/lib/selftest.sh"
  assert_ignored '{"tool_input":{"file_path":"/x/unrelated.txt"}}' 'an out-of-scope file is ignored'
  selftest_report; exit $?
fi

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
    echo "🔀 Redirect problem (would fail the prod build): a redirect target is MISSING, DRAFT, or"
    echo "   itself redirected again (a chain a→b→c — Docusaurus does not follow chains)."
    printf '%s\n' "$out" | grep -A1 "error:redirect-"
    echo ""
    echo "Fix the target (a moved slug? collapse the chain to a→c?) or drop the redirect. Full check:"
    echo "  ( cd $proj && make validate-redirects )"
  } >&2
  exit 2
fi

# Clean or warn-only: don't block.
exit 0
