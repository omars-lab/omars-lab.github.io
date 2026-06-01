#!/bin/bash
# PostToolUse hook for Edit|Write: WARN (never block) on docs-structure violations.
#
# The docs/ tree follows a topic-based IA contract (see the review-reader-experience
# skill's "Topic-folder contract" section + CLAUDE.md). The single highest-stakes rule
# is the URL-freeze guarantee: every doc must carry an ABSOLUTE `slug:` (`slug: /…`).
# A relative/missing slug silently re-couples the URL to the folder path, so a later
# move changes the URL with no build error (onBrokenLinks:'warn', no redirects plugin).
#
# This hook runs scripts/validate-docs-structure.js --error-only scoped to the changed
# file and surfaces any ERROR-tier finding (currently: absolute-slug). It is advisory:
# it exits 0 so the edit is NEVER blocked (mirrors validate-draft-hook.sh). The full
# warn-tier contract is checked by `make validate-structure`.

input=$(cat)
file_path=$(printf '%s' "$input" | jq -r '.tool_input.file_path // empty')

# Only content markdown/MDX under the blog's docs dir (the only place the contract applies).
case "$file_path" in
  *.md|*.mdx) ;;
  *) exit 0 ;;
esac
case "$file_path" in
  */bytesofpurpose-blog/docs/*) ;;
  *) exit 0 ;;
esac
[ -f "$file_path" ] || exit 0

# Locate the validator relative to the project dir (cwd from the hook payload).
proj="${CLAUDE_PROJECT_DIR:-$(printf '%s' "$input" | jq -r '.cwd // empty')}"
script="$proj/bytesofpurpose-blog/scripts/validate-docs-structure.js"
[ -f "$script" ] || exit 0   # not this repo / not set up → stay out of the way

# ERROR-tier only, scoped to the one changed file. Exit 2 from the script == findings.
out=$(node "$script" "$file_path" --error-only 2>&1)
rc=$?

if [ "$rc" -eq 2 ]; then
  rel="${file_path##*/bytesofpurpose-blog/}"
  {
    echo "🏗  Docs structure: ERROR-tier issue in '$rel'"
    echo "$out"
    echo ""
    echo "   The whole IA relies on every doc carrying an ABSOLUTE slug (\`slug: /…\`):"
    echo "   a relative/missing slug re-couples the URL to the folder path, so a later"
    echo "   move silently 404s (onBrokenLinks:'warn', no redirects plugin)."
    echo "   (advice only — not blocking. Run \`make validate-structure\` for the full contract.)"
  } >&2
fi

# Numeric-prefix advisory: flag if the changed doc lives under a folder whose NAME
# carries a numeric ordering prefix (e.g. docs/software-development/6-projects/…).
# WHY surface it here: folder renames happen via `git mv` (no Write/Edit hook fires),
# so a doc edit is the natural moment to nudge. The rule — order via _category_.json
# "position", never the folder name — keeps reordering history-clean (a 1-line position
# bump vs a path-rewriting rename). Advisory only; never blocks.
rel_docs="${file_path#*/bytesofpurpose-blog/docs/}"
if printf '%s' "$rel_docs" | grep -qE '(^|/)[0-9]+-[^/]+/'; then
  prefixed=$(printf '%s' "$rel_docs" | grep -oE '(^|/)[0-9]+-[^/]+/' | tr -d '/' | sort -u | paste -sd', ' -)
  {
    echo "🔢 Docs structure: numeric-prefixed folder(s) in this path: $prefixed"
    echo "   Convention: folder names carry NO numeric prefix — order via the"
    echo "   _category_.json \"position\" field instead. (A name prefix couples order to"
    echo "   identity: reordering then means a history-churning git mv, vs a 1-line"
    echo "   position bump.) Rename the folder (slugs are absolute, so URLs are safe) and"
    echo "   set positions. (advice only — not blocking.)"
  } >&2
fi

# WARN-only: always succeed so the edit is never blocked.
exit 0
