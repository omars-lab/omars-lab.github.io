#!/bin/bash
# PostToolUse hook for Edit|Write: WARN (never block) when a deprecated post/doc is
# missing its `deprecated_reason` (or its `deprecated_for` replacement link 404s).
#
# A `deprecated: true` page stays live but shows a dev-only "Dep" badge + a red
# banner. The banner's value is the REASON, so a deprecation with no
# `deprecated_reason` renders a bare "⚠️ Deprecated" with nothing actionable. This
# runs scripts/validate-deprecated.js after you edit a content file that mentions
# `deprecated`, nudging you to fill in the reason. Warn-tier (exits 0, never blocks);
# the gate is `make validate-deprecated`.
#
# Scope: a .md/.mdx under bytesofpurpose-blog/{docs,blog,designs,thoughts,mindset,questions}/
# that actually contains `deprecated` (fast skip otherwise). The validator scans the
# whole corpus; the edited file just triggers it.

input=$(cat)
file_path=$(printf '%s' "$input" | jq -r '.tool_input.file_path // empty')

case "$file_path" in
  *.md|*.mdx) ;;
  *) exit 0 ;;
esac
case "$file_path" in
  */bytesofpurpose-blog/docs/*) ;;
  */bytesofpurpose-blog/blog/*) ;;
  */bytesofpurpose-blog/designs/*) ;;
  */bytesofpurpose-blog/thoughts/*) ;;
  */bytesofpurpose-blog/mindset/*) ;;
  */bytesofpurpose-blog/questions/*) ;;
  *) exit 0 ;;
esac
[ -f "$file_path" ] || exit 0

# Fast skip: only bother if the file mentions deprecation at all.
grep -qE '^deprecated\s*:' "$file_path" 2>/dev/null || exit 0

proj="${CLAUDE_PROJECT_DIR:-$(printf '%s' "$input" | jq -r '.cwd // empty')}"
script="$proj/bytesofpurpose-blog/scripts/validate-deprecated.js"
[ -f "$script" ] || exit 0   # not this repo / not set up → stay out of the way

out=$(cd "$proj/bytesofpurpose-blog" && node scripts/validate-deprecated.js 2>&1)
if printf '%s' "$out" | grep -qE 'deprecated-(missing-reason|dangling-for)'; then
  {
    echo "⚠️  deprecated: a deprecated page is missing its reason (or has a dangling replacement)"
    printf '%s\n' "$out" | grep -E 'deprecated-(missing-reason|dangling-for)|↳'
    echo ""
    echo "   Add \`deprecated_reason: '...'\` (and a valid \`deprecated_for: /url\`) to the frontmatter."
    echo "   (advice only — not blocking. Run \`make validate-deprecated\` for the gate.)"
  } >&2
fi

# WARN-only: always succeed so the edit is never blocked.
exit 0
