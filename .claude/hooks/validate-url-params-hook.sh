#!/bin/bash
# PostToolUse hook for Edit|Write: WARN (never block) when a src/ code edit reads a URL query param
# that is NOT registered in the URL-param registry (src/lib/url-params.ts).
#
# URL params used to sprawl across files with no shared list. The registry is the single source of
# truth (every param: owner, purpose, prod-vs-localhost scope, allowed values). This hook runs
# scripts/validate-url-params.js after a code edit and surfaces any unregistered param read, so the
# moment you add a `searchParams.get('new-thing')` without registering it, you're nudged to add the
# entry. Warn-tier (exits 0, never blocks); the blocking gate is `make validate-url-params`.
#
# Scope: .ts/.tsx/.js/.jsx under bytesofpurpose-blog/src/ (where params are read). The validator scans
# the WHOLE src/ tree (it's fast), so the edited file just triggers the check.

input=$(cat)
file_path=$(printf '%s' "$input" | jq -r '.tool_input.file_path // empty')

case "$file_path" in
  */bytesofpurpose-blog/src/*.ts|*/bytesofpurpose-blog/src/*.tsx|*/bytesofpurpose-blog/src/*.js|*/bytesofpurpose-blog/src/*.jsx) ;;
  *) exit 0 ;;
esac
[ -f "$file_path" ] || exit 0

proj="${CLAUDE_PROJECT_DIR:-$(printf '%s' "$input" | jq -r '.cwd // empty')}"
script="$proj/bytesofpurpose-blog/scripts/validate-url-params.js"
[ -f "$script" ] || exit 0   # not this repo / not set up → stay out of the way

out=$(cd "$proj/bytesofpurpose-blog" && node scripts/validate-url-params.js 2>&1)
if printf '%s' "$out" | grep -q 'UNREGISTERED'; then
  {
    echo "🔗 url-params: an UNREGISTERED query param is read in src/"
    printf '%s\n' "$out" | grep -E '•|UNREGISTERED'
    echo ""
    echo "   Add it to src/lib/url-params.ts (key, owner, purpose, scope, example)."
    echo "   A 'localhost'-scope param MUST be gated by isLocalhost() at its read site."
    echo "   (advice only — not blocking. Run \`make validate-url-params\` for the gate.)"
  } >&2
fi

# WARN-only: always succeed so the edit is never blocked.
exit 0
