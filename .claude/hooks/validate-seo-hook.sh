#!/bin/bash
# PostToolUse hook for Edit|Write: WARN (never block) on SEO frontmatter issues.
#
# A page's `description:` feeds BOTH <meta name=description> + og:description (SEO + the social
# card) AND the ShareButton message, so it is the highest-leverage SEO field. `title:` becomes
# the <title>; `image:` overrides the global og:image (and a dangling one ships a 404 card);
# `keywords:` is the only field that emits <meta keywords>. Docusaurus auto-emits a lot, but
# these author-supplied fields are what it can't infer well.
#
# This runs scripts/validate-seo.js --file <path> scoped to the changed file and surfaces any
# finding as advice. It is warn-tier: it exits 0 so the edit is NEVER blocked (mirrors
# validate-docs-structure-hook.sh). The full corpus audit is `make validate-seo`; the built-HTML
# audit is `make validate-seo-built` (run after a build, in the deploy path).
#
# Scope: content markdown/MDX under the blog's content roots (docs + the blog instances). Unlike
# the docs-structure hook (docs/ only), SEO applies to EVERY published page, so the blog instances
# (blog/designs/thoughts/changelog) — which the docs validator skips — are included here.

input=$(cat)
file_path=$(printf '%s' "$input" | jq -r '.tool_input.file_path // empty')

case "$file_path" in
  *.md|*.mdx) ;;
  *) exit 0 ;;
esac
# Only published content roots; skip `_`-prefixed partials/mockups (not pages).
case "$file_path" in
  */bytesofpurpose-blog/docs/*|*/bytesofpurpose-blog/blog/*|*/bytesofpurpose-blog/designs/*|*/bytesofpurpose-blog/thoughts/*|*/bytesofpurpose-blog/changelog/*) ;;
  *) exit 0 ;;
esac
case "$file_path" in
  */_*) exit 0 ;;   # _mockups/, _partials, etc. — not published pages
esac
[ -f "$file_path" ] || exit 0

proj="${CLAUDE_PROJECT_DIR:-$(printf '%s' "$input" | jq -r '.cwd // empty')}"
script="$proj/bytesofpurpose-blog/scripts/validate-seo.js"
[ -f "$script" ] || exit 0   # not this repo / not set up → stay out of the way

out=$(cd "$proj/bytesofpurpose-blog" && node scripts/validate-seo.js --file "$file_path" 2>&1)
# The validator prints "no problems" when clean; only surface real findings.
if printf '%s' "$out" | grep -q '\[warn:'; then
  rel="${file_path##*/bytesofpurpose-blog/}"
  {
    echo "🔎 SEO: frontmatter advisory in '$rel'"
    printf '%s\n' "$out" | grep -A1 '\[warn:'
    echo ""
    echo "   description feeds SEO meta + og:description + the share message; title is the <title>."
    echo "   (advice only — not blocking. Run \`make validate-seo\` for the whole corpus.)"
  } >&2
fi

# WARN-only: always succeed so the edit is never blocked.
exit 0
