#!/bin/bash
# PostToolUse hook for Edit|Write: WARN (never block) when a content .md/.mdx file
# has frontmatter but omits an explicit `draft:` field.
#
# Convention (see publish-site skill): every doc/post should declare `draft: true`
# or `draft: false`. A missing field silently defaults to PUBLISHED, which makes it
# easy to ship an unfinished stub by accident. This is a judgment call (some index
# pages are legitimately always-published), so the hook only advises — it exits 0
# and never blocks the edit. Pairs with validate-draft logic in the draft-aware
# sidebar + publish-site triage.

input=$(cat)
file_path=$(printf '%s' "$input" | jq -r '.tool_input.file_path // empty')

# Only content markdown/MDX under the blog's docs|blog dirs.
case "$file_path" in
  *.md|*.mdx) ;;
  *) exit 0 ;;
esac
case "$file_path" in
  */bytesofpurpose-blog/docs/*|*/bytesofpurpose-blog/blog/*) ;;
  *) exit 0 ;;
esac
[ -f "$file_path" ] || exit 0

# Must have YAML frontmatter (first line ---) to carry a draft field at all.
[ "$(head -1 "$file_path")" = "---" ] || exit 0

# Does the frontmatter block (between the first two ---) declare draft: ?
has_draft=$(awk '
  /^---[[:space:]]*$/ { c++; next }
  c==1 && /^draft:/   { print "yes"; exit }
  c>=2                { exit }
' "$file_path")

if [ "$has_draft" != "yes" ]; then
  rel="${file_path##*/bytesofpurpose-blog/}"
  {
    echo "📝 Draft convention: '$rel' has frontmatter but no explicit \`draft:\` field."
    echo "   It will default to PUBLISHED. Declare intent explicitly:"
    echo "     draft: true    # work in progress — excluded from the production build"
    echo "     draft: false   # ready to ship"
    echo "   (advice only — not blocking. See the publish-site skill.)"
  } >&2
fi

# WARN-only: always succeed so the edit is never blocked.
exit 0
