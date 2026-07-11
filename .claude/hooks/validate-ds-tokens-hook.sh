#!/bin/bash
# PostToolUse hook for Edit|Write: WARN (never block) when a CSS edit hardcodes a value that has a
# canonical design-system token (a re-drift).
#
# The DS reconciliation gave the brand's values NAMES (--lift-*, the shadow tokens, --radius-*,
# --brand-green, the font families, --tea-ink); nothing stopped the literals creeping back. This hook
# runs scripts/validate-ds-tokens.js on a CSS edit and surfaces any hardcoded value with a token, so
# the moment you type `translateY(-4px)` or a brand-green hex you're nudged to the token. Warn-tier
# (exits 0, never blocks); the blocking gate is `make validate-ds-tokens`.
#
# Scope: .css/.scss under bytesofpurpose-blog/src/ and packages/blog-ui/src/. The validator is scoped
# to the EDITED file (fast + focused) so the warning is about what you just touched.

if [ "$1" = "--selftest" ]; then
  SELFTEST_HOOK="$0"; . "$(dirname "$0")/lib/selftest.sh"
  assert_ignored '{"tool_input":{"file_path":"/x/unrelated.txt"}}' 'an out-of-scope file is ignored'
  selftest_report; exit $?
fi

input=$(cat)
file_path=$(printf '%s' "$input" | jq -r '.tool_input.file_path // empty')

case "$file_path" in
  */bytesofpurpose-blog/src/*.css|*/bytesofpurpose-blog/src/*.scss|*/packages/blog-ui/src/*.css|*/packages/blog-ui/src/*.scss) ;;
  *) exit 0 ;;
esac
[ -f "$file_path" ] || exit 0

proj="${CLAUDE_PROJECT_DIR:-$(printf '%s' "$input" | jq -r '.cwd // empty')}"
script="$proj/bytesofpurpose-blog/scripts/validate-ds-tokens.js"
[ -f "$script" ] || exit 0   # not this repo / not set up → stay out of the way

out=$(cd "$proj/bytesofpurpose-blog" && node scripts/validate-ds-tokens.js "$file_path" 2>&1)
if printf '%s' "$out" | grep -q 'should reference a token'; then
  {
    echo "🎨 ds-tokens: this CSS hardcodes a value that has a design-system token:"
    printf '%s\n' "$out" | grep -E '•|→ use'
    echo ""
    echo "   Reach for the token (values match, so the swap is non-breaking)."
    echo "   See the implement-with-design-system skill. (advice only — not blocking."
    echo "   Run \`make validate-ds-tokens\` for the gate.)"
  } >&2
fi

# WARN-only: always succeed so the edit is never blocked.
exit 0
