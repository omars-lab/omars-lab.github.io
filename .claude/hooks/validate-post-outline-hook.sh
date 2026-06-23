#!/bin/bash
# PostToolUse hook for Edit|Write: WARN (never block) when a post that declares a
# `kind:` is missing the structural elements that kind of post should have.
#
# Convention (see the import-co-design + upgrade-post skills): a post's `kind:` frontmatter
# (e.g. `kind: system-design`) implies a required OUTLINE — a system-design post should
# paint the whole picture, so it must carry a UX mockup, a Decisions section, and a
# description. This advises when one is missing; it's a judgment call (a stub mid-draft is
# fine), so it exits 0 and never blocks. Pairs with scripts/validate-post-outline.js.

input=$(cat)
file_path=$(printf '%s' "$input" | jq -r '.tool_input.file_path // empty')

# Only content markdown/MDX under the blog's content dirs.
case "$file_path" in
  *.md|*.mdx) ;;
  *) exit 0 ;;
esac
case "$file_path" in
  */bytesofpurpose-blog/docs/*|*/bytesofpurpose-blog/blog/*|*/bytesofpurpose-blog/designs/*) ;;
  *) exit 0 ;;
esac
[ -f "$file_path" ] || exit 0

# Skip sidecar/partials (filenames starting with _) — they're not standalone posts.
case "$(basename "$file_path")" in
  _*) exit 0 ;;
esac

# Fast pre-check: only run the validator if the file declares a `kind:` in frontmatter
# (otherwise no outline rule applies — avoid spawning node needlessly).
has_kind=$(awk '
  /^---[[:space:]]*$/ { c++; next }
  c==1 && /^kind:/    { print "yes"; exit }
  c>=2                { exit }
' "$file_path")
[ "$has_kind" = "yes" ] || exit 0

proj="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null)}"
script="$proj/bytesofpurpose-blog/scripts/validate-post-outline.js"
[ -f "$script" ] || exit 0

# Run the validator on just this file; surface its advisory output. It exits 0 (warn-tier),
# so this hook never blocks the edit.
out=$(node "$script" "$file_path" 2>&1)
case "$out" in
  *"[warn:outline-"*)
    printf '%s\n' "$out" >&2
    ;;
esac

exit 0
