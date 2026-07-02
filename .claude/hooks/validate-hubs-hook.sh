#!/bin/bash
# PostToolUse hook for Edit|Write: WARN (never block) when a hub doc or an /initiatives post is
# edited and the hub contract is broken.
#
# A "hub" is a /craft index page (kind: hub) that catalogs /initiatives posts of one activity kind
# grouped by area, via a generated <Catalog> (registry: the HUBS manifest in
# scripts/generate-hubs-data.js). A hub-kind post (project/tinkering/research) with no/invalid
# `area:` silently vanishes from its hub; a kind:hub doc that renders no <Catalog> ships an empty
# page. This hook runs scripts/validate-hubs.js after you edit a /craft doc or a blog/ post, so the
# moment you break the contract you're nudged. Warn-tier (exits 0, never blocks); the blocking gate
# is `make validate-hubs`.
#
# Scope: a .md/.mdx under bytesofpurpose-blog/docs/craft/ (where hub docs live) OR under
# bytesofpurpose-blog/blog/ (where hub-kind posts live). The validator scans all of them (fast);
# the edited file just triggers it.

input=$(cat)
file_path=$(printf '%s' "$input" | jq -r '.tool_input.file_path // empty')

case "$file_path" in
  */bytesofpurpose-blog/docs/craft/*.md|*/bytesofpurpose-blog/docs/craft/*.mdx) ;;
  */bytesofpurpose-blog/blog/*.md|*/bytesofpurpose-blog/blog/*.mdx) ;;
  *) exit 0 ;;
esac
[ -f "$file_path" ] || exit 0

proj="${CLAUDE_PROJECT_DIR:-$(printf '%s' "$input" | jq -r '.cwd // empty')}"
script="$proj/bytesofpurpose-blog/scripts/validate-hubs.js"
[ -f "$script" ] || exit 0   # not this repo / not set up → stay out of the way

out=$(cd "$proj/bytesofpurpose-blog" && node scripts/validate-hubs.js 2>&1)
if printf '%s' "$out" | grep -q 'would ship a broken hub'; then
  {
    echo "🗂️  hubs: a hub contract is broken"
    printf '%s\n' "$out" | grep -E '•|broken hub'
    echo ""
    echo "   Fix the area / <Catalog> / kind (see the manage-hubs skill)."
    echo "   (advice only — not blocking. Run \`make validate-hubs\` for the gate.)"
  } >&2
fi

# WARN-only: always succeed so the edit is never blocked.
exit 0
