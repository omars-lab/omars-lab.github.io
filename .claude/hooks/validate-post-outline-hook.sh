#!/bin/bash
# PostToolUse hook for Edit|Write: WARN (never block) on blog/doc post-shape issues.
# Surfaces every advisory from scripts/validate-post-outline.js for the edited file:
#
#   - missing-kind        a BLOG post has no `kind:` (kind drives the sidebar emoji)
#   - unknown-kind        `kind:` isn't one of the blog kinds in scripts/lib/blog-kind-emoji.json
#   - long-sidebar-label  the sidebar entry (sidebar_label || title) is long; add a short
#                         `sidebar_label:` (the full title stays on the page H1)
#   - outline-<x>         a post of a given `kind:` is missing that kind's required elements
#                         (e.g. system-design needs a mockup + Decisions; question-set needs
#                         H2 sections + <Question> cards + a <SectionBanner>)
#
# All are judgment calls (a stub mid-draft is fine), so the validator exits 0 and this hook
# never blocks. For DOCS it only runs when a `kind:` is present; for BLOG/designs it always
# runs (so a missing kind is caught). Pairs with scripts/validate-post-outline.js + the
# author-blog-post / upgrade-post skills.

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

# Fast pre-check: for DOCS, only run the validator if the file declares a `kind:`
# (docs have no missing-kind rule — avoid spawning node needlessly). For BLOG/designs
# posts we run REGARDLESS, because a MISSING `kind:` is itself a finding there (kind
# drives the sidebar emoji), and the validator emits a missing-kind nudge.
case "$file_path" in
  */bytesofpurpose-blog/blog/*|*/bytesofpurpose-blog/designs/*)
    : ;; # always run for blog/designs
  *)
    has_kind=$(awk '
      /^---[[:space:]]*$/ { c++; next }
      c==1 && /^kind:/    { print "yes"; exit }
      c>=2                { exit }
    ' "$file_path")
    [ "$has_kind" = "yes" ] || exit 0
    ;;
esac

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
