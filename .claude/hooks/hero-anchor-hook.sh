#!/bin/bash
# PostToolUse hook for Edit|Write on a HOMEPAGE HERO file: WARN (never block) so the
# `maintain-homepage-hero` skill stays in lockstep with the code.
#
# The hero (the A/B chooser: scrolling strip = control, camera-flash Vestaboard gate = test) is
# documented by the maintain-homepage-hero skill, which names specific SYMBOLS (FLASH_*, ChooserFlash,
# .flashArch, SplitFlap's DECK, etc.) and the gotchas that bite (a retina compositing seam, a flash
# white-out, opaque flap leaves, a global arrow-key listener). When you edit a hero file, this hook:
#   1. reminds you the skill documents this surface (review it for what NOT to break), and
#   2. runs scripts/validate-hero-anchors.js — if a named symbol DRIFTED (renamed/deleted), the skill
#      is out of sync and should be updated in the same change.
# Advisory only: exits 0 so the edit is NEVER blocked (mirrors validate-docs-structure-hook.sh).

input=$(cat)
file_path=$(printf '%s' "$input" | jq -r '.tool_input.file_path // empty')
[ -n "$file_path" ] || exit 0

# Scope: the hero source files (the ones the skill anchors point at).
case "$file_path" in
  */bytesofpurpose-blog/src/pages/index.tsx) ;;
  */bytesofpurpose-blog/src/pages/index.module.css) ;;
  */bytesofpurpose-blog/src/components/SplitFlap/*) ;;
  */bytesofpurpose-blog/src/experiments.ts) ;;
  *) exit 0 ;;
esac

proj="${CLAUDE_PROJECT_DIR:-$(printf '%s' "$input" | jq -r '.cwd // empty')}"
script="$proj/bytesofpurpose-blog/scripts/validate-hero-anchors.js"

{
  echo "🪧 You edited a homepage-hero file. The 'maintain-homepage-hero' skill documents this surface"
  echo "   (the A/B variants, the code anchors, and the gotchas: the retina seam, the flash white-out,"
  echo "   opaque flap leaves, the global arrow-key listener). Review it for what NOT to break, and"
  echo "   run \`make test-visual\` to catch visual regressions."
  if [ -f "$script" ]; then
    out=$(cd "$proj/bytesofpurpose-blog" && node scripts/validate-hero-anchors.js 2>&1)
    if [ "$?" -eq 2 ]; then
      echo ""
      echo "   ⚠ ANCHOR DRIFT — a symbol the skill names changed; update the skill + validator together:"
      printf '%s\n' "$out" | grep -E 'DRIFTED|FILE MISSING'
    fi
  fi
} >&2

exit 0
