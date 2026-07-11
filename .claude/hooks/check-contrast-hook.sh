#!/bin/bash
# PostToolUse hook for Edit|Write on the theme CSS: WARN (never block) on a WCAG-AA contrast
# regression in the theme's color variables.
#
# The e2e axe gate (test/e2e/accessibility.spec.ts) catches color-contrast failures, but only on a
# full prod build + Playwright run (minutes). This is the FAST complement: when src/css/custom.css
# is edited, it resolves the theme's critical fg/bg variable PAIRS (body/links/buttons/tea-ink on
# their surfaces, light + dark) and computes the WCAG contrast ratio for each, surfacing any pair
# that dropped below AA right at edit time — milliseconds, before the slow axe gate.
#
# Advisory only: it exits 0 so the edit is NEVER blocked (mirrors the other content hooks). The
# blocking enforcement is `make check-contrast` (exit 2 on a failure) — run it before a deploy.

# Scope: the theme's custom.css (the file that defines the palette vars the checker reads).
if [ "$1" = "--selftest" ]; then
  SELFTEST_HOOK="$0"; . "$(dirname "$0")/lib/selftest.sh"
  assert_ignored '{"tool_input":{"file_path":"/x/unrelated.txt"}}' 'a non-CSS file is ignored'
  selftest_report; exit $?
fi

input=$(cat)
file_path=$(printf '%s' "$input" | jq -r '.tool_input.file_path // empty')

case "$file_path" in
  */bytesofpurpose-blog/src/css/custom.css) ;;
  *) exit 0 ;;
esac
[ -f "$file_path" ] || exit 0

proj="${CLAUDE_PROJECT_DIR:-$(printf '%s' "$input" | jq -r '.cwd // empty')}"
script="$proj/bytesofpurpose-blog/scripts/check-contrast.js"
[ -f "$script" ] || exit 0   # not this repo / not set up → stay out of the way

out=$(node "$script" "$file_path" 2>&1)
rc=$?
if [ "$rc" -eq 2 ]; then
  {
    echo "🎨 A11y contrast: a theme color pair dropped below WCAG AA"
    echo "$out"
    echo ""
    echo "   This is the fast complement to the axe e2e gate (which would also fail this)."
    echo "   Adjust the colors so each pair meets AA (4.5:1 text / 3.0:1 large+UI)."
    echo "   (advice only — not blocking. Run \`make check-contrast\` for the gate.)"
  } >&2
fi

# WARN-only: always succeed so the edit is never blocked.
exit 0
