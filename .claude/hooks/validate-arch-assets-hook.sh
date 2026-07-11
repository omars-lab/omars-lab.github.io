#!/bin/bash
# PostToolUse hook for Edit|Write: WARN (never block) when a hero CARD PNG is added/changed and it
# violates the canonical arch (fringe outside the arch → the faint white-line edge bug).
#
# The homepage hero shows scenes through an arched opening; a card PNG must be 1024x1024 with NO opaque
# content outside the canonical arch interior, or a faint white line appears at the arch edge (a real
# bug a re-imported initiatives.png once shipped). This hook runs scripts/validate-arch-assets.js after
# a write under static/img/cards/ and surfaces any violation. Warn-tier (exits 0, never blocks — a PNG
# write is the deliverable); the blocking gate is `make validate-arch-assets`. Fix: re-fit the raw with
# scripts/fit-to-arch.js (see the import-arched-image skill).
#
# Scope: *.png under bytesofpurpose-blog/static/img/cards/ (skip the mask/frame helpers + artifacts).

if [ "$1" = "--selftest" ]; then
  SELFTEST_HOOK="$0"; . "$(dirname "$0")/lib/selftest.sh"
  assert_ignored '{"tool_input":{"file_path":"/x/unrelated.txt"}}' 'an out-of-scope file is ignored'
  selftest_report; exit $?
fi

input=$(cat)
file_path=$(printf '%s' "$input" | jq -r '.tool_input.file_path // empty')

case "$file_path" in
  */bytesofpurpose-blog/static/img/cards/*.png) ;;
  *) exit 0 ;;
esac
# skip the non-scene helpers + working artifacts
case "$file_path" in
  */arch-inner.png|*/arch-mask-white.png|*/arch.png|*.proof.png|*.traced.png) exit 0 ;;
esac
[ -f "$file_path" ] || exit 0

proj="${CLAUDE_PROJECT_DIR:-$(printf '%s' "$input" | jq -r '.cwd // empty')}"
script="$proj/bytesofpurpose-blog/scripts/validate-arch-assets.js"
[ -f "$script" ] || exit 0   # not this repo / not set up → stay out of the way

out=$(cd "$proj/bytesofpurpose-blog" && node scripts/validate-arch-assets.js 2>&1)
if printf '%s' "$out" | grep -qE 'violate the canonical arch|\[fringe\]|\[dims\]'; then
  {
    echo "🏛️  arch-assets: a hero card PNG violates the canonical arch"
    printf '%s\n' "$out" | grep -E '✗|\[fringe\]|\[dims\]'
    echo ""
    echo "   A fringe outside the arch causes the faint white-line edge. Re-fit the raw:"
    echo "   node bytesofpurpose-blog/scripts/fit-to-arch.js <raw> <out> --proof  (see import-arched-image skill)"
    echo "   (advice only — not blocking. Run \`make validate-arch-assets\` for the gate.)"
  } >&2
fi

# WARN-only: always succeed so the edit is never blocked.
exit 0
