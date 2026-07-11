#!/bin/bash
# PostToolUse hook for Edit|Write: BLOCK (exit 2) when a role post under docs/journey/roles/
# gains a private-leak signal.
#
# A /journey/roles/<role>.md doc is authored from a PRIVATE personalbook role folder. The post
# must carry only the publishable half — never the intent triad (obligations/desires/motivations),
# dated personal todos, family/finance/medical specifics, or copied artifact bodies. This is the
# secure-by-default gate: a role post that leaks private residue must FAIL, not silently ship.
#
# It runs scripts/validate-role-privacy.js --file <path>; that script exits 2 on a leak. Mirrors the
# blocking em-dash-voice-hook.sh shape (surface the hit + require a deliberate fix). The full gate is
# `make validate-role-privacy`.
#
# Scope: a .md/.mdx under bytesofpurpose-blog/docs/journey/roles/ (the README landing is exempted by
# the validator itself).

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
script="$proj/bytesofpurpose-blog/scripts/validate-role-privacy.js"
[ -f "$script" ] || exit 0   # not this repo / not set up → stay out of the way

out=$(cd "$proj/bytesofpurpose-blog" && node scripts/validate-role-privacy.js --file "$file_path" 2>&1)
rc=$?
if [ "$rc" -eq 2 ]; then
  {
    echo "$out"
    echo ""
    echo "BLOCKED: the role post above carries private personalbook content. Remove or generalize the"
    echo "flagged line(s) — summarize the KIND of artifact/skill/habit from Overview.md / SKILL.md"
    echo "descriptions / HABIT.md cadences, never the private application. Then re-save."
  } >&2
  exit 2
fi
exit 0
