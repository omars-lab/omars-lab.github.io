#!/bin/bash
# PostToolUse hook for Edit|Write: WARN (never block) when a .claude/hooks/*.sh file is edited but
# the hook-testing contract is broken (a validator hook with no --selftest, or a failing selftest).
#
# WHY: a hook that can BLOCK or FLAG is only trustworthy if it still bites. When you add or edit a
# hook, this nudges you to add/keep its --selftest (see .claude/hooks/lib/selftest.sh). Warn-tier
# (exits 0, never blocks); the blocking gate is `make validate-hook-tests`. Meta-guard: this is the
# hook that keeps the OTHER hooks tested.
#
# Scope: a .claude/hooks/*.sh edit (the lib/selftest.sh helper + this file included — editing the
# harness should re-run the check too).

# --- selftest: prove routing (an unrelated file is ignored). ---
# NOTE: this hook DELEGATES to validate-hook-tests.js, which runs EVERY hook's --selftest — including
# this one. So the selftest must NOT feed itself an in-scope payload (that would recurse infinitely).
# It asserts only the out-of-scope routing here; the delegated run is exercised by `make test-hooks`
# on a NON-selftest invocation.
if [ "$1" = "--selftest" ]; then
  SELFTEST_HOOK="$0"; . "$(dirname "$0")/lib/selftest.sh"
  assert_ignored '{"tool_input":{"file_path":"/x/unrelated.txt"}}' 'an unrelated file is ignored'
  selftest_report; exit $?
fi

input=$(cat)
file_path=$(printf '%s' "$input" | jq -r '.tool_input.file_path // empty')

case "$file_path" in
  */.claude/hooks/*.sh) ;;
  *) exit 0 ;;
esac

proj="${CLAUDE_PROJECT_DIR:-$(printf '%s' "$input" | jq -r '.cwd // empty')}"
script="$proj/bytesofpurpose-blog/scripts/validate-hook-tests.js"
[ -f "$script" ] || exit 0   # not this repo / not set up → stay out of the way

out=$(node "$script" 2>&1)
if [ $? -ne 0 ]; then
  {
    echo "🪝 hook-tests: a validator hook is missing a passing --selftest"
    printf '%s\n' "$out" | grep -E '•|--selftest|FAILED' | head -12
    echo ""
    echo "   Add a --selftest branch (see .claude/hooks/lib/selftest.sh) that proves the hook bites."
    echo "   (advice only — not blocking. Run \`make validate-hook-tests\` for the gate.)"
  } >&2
fi

exit 0
