#!/bin/bash
# PostToolUse hook (matcher: Bash). After a `gh issue create`, append a row to ISSUES.md
# so the dedup index self-maintains and can't drift from forgetfulness.
#
# Non-blocking: always exits 0. It only ACTS when the command was a `gh issue create`
# AND the tool output contains the created issue URL (gh prints the URL on success).
#
# Tenet: "track DEFERRED findings as GitHub issues (deduped via ISSUES.md)" in CLAUDE.md.

input=$(cat)

cmd=$(printf '%s' "$input" | jq -r '.tool_input.command // empty')
case "$cmd" in
  *"gh issue create"*) ;;
  *) exit 0 ;;            # not an issue-create → stay out of the way
esac

proj="${CLAUDE_PROJECT_DIR:-$(printf '%s' "$input" | jq -r '.cwd // empty')}"
index="$proj/ISSUES.md"
[ -f "$index" ] || exit 0  # no index in this repo → nothing to maintain

# gh prints the new issue URL on stdout, e.g. https://github.com/<owner>/<repo>/issues/42
# The PostToolUse payload carries the tool output; field name varies, so scan a few.
out=$(printf '%s' "$input" | jq -r '
  (.tool_response.stdout // .tool_response.output // .tool_response // .tool_result // "")
  | if type=="string" then . else tostring end
' 2>/dev/null)

url=$(printf '%s' "$out" | grep -oE 'https://github\.com/[^ ]+/issues/[0-9]+' | head -1)
[ -n "$url" ] || exit 0    # couldn't find the URL (maybe a dry run / failure) → skip silently

num=$(printf '%s' "$url" | grep -oE '[0-9]+$')

# Already indexed? (idempotent — don't double-append if the hook re-fires.)
if grep -qE "^\| $num \|" "$index" 2>/dev/null; then
  exit 0
fi

# Append a row. Title/key/source are filled in by Claude when it edits ISSUES.md;
# the hook guarantees at least the number+URL are recorded so nothing is lost.
printf '| %s | open | _(set key)_ | [#%s](%s) | _(set source)_ | _(set path)_ |\n' \
  "$num" "$num" "$url" >> "$index"

# Surface a reminder so Claude fills in the human columns (key/title/source/screenshot).
{
  echo "🗂️  Recorded issue #$num in ISSUES.md ($url)."
  echo "    Fill in the finding-key, title, source skill, and Dropbox screenshot path"
  echo "    for that row so the dedup index is searchable."
} >&2

exit 0
