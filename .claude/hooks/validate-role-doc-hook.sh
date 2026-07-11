#!/bin/bash
# PostToolUse hook for Edit|Write: WARN (never block) when a role post under docs/journey/roles/
# is missing its required spine (why-it-matters / Skills / Artifacts / Habits) or has an
# unhealthy slug/description.
#
# The role posts should read as a consistent SET; this nudges you when one drifts. Warn-tier
# (exits 0). The blocking gate is `make validate-roles` (structure + the fail-closed leak gate).
#
# Scope: a .md/.mdx under bytesofpurpose-blog/docs/journey/roles/ (README exempted by the validator).

if [ "$1" = "--selftest" ]; then
  SELFTEST_HOOK="$0"; . "$(dirname "$0")/lib/selftest.sh"
  assert_ignored '{"tool_input":{"file_path":"/x/unrelated.txt"}}' 'an out-of-scope file is ignored'
  selftest_report; exit $?
fi

input=$(cat)
file_path=$(printf '%s' "$input" | jq -r '.tool_input.file_path // empty')

case "$file_path" in
  */bytesofpurpose-blog/docs/journey/roles/*.md|*/bytesofpurpose-blog/docs/journey/roles/*.mdx) ;;
  *) exit 0 ;;
esac
[ -f "$file_path" ] || exit 0

proj="${CLAUDE_PROJECT_DIR:-$(printf '%s' "$input" | jq -r '.cwd // empty')}"
script="$proj/bytesofpurpose-blog/scripts/validate-role-doc.js"
[ -f "$script" ] || exit 0

out=$(cd "$proj/bytesofpurpose-blog" && node scripts/validate-role-doc.js --file "$file_path" 2>&1)
if printf '%s' "$out" | grep -q '•'; then
  {
    printf '%s\n' "$out"
    echo ""
    echo "   (advice only — not blocking. Run \`make validate-roles\` for the gate.)"
  } >&2
fi
exit 0
