#!/bin/bash
# PostToolUse hook (matcher: Bash). After a `gh issue create`, append a row to ISSUES.md
# so the dedup index self-maintains and can't drift from forgetfulness.
#
# Non-blocking: always exits 0. It only ACTS when the command was a `gh issue create`
# AND the tool output contains the created issue URL (gh prints the URL on success).
#
# Tenet: "track DEFERRED findings as GitHub issues (deduped via ISSUES.md)" in CLAUDE.md.

if [ "$1" = "--selftest" ]; then
  SELFTEST_HOOK="$0"; . "$(dirname "$0")/lib/selftest.sh"
  # Bash-matcher hook: its scope key is the COMMAND, not a file path. A non-issue-create command
  # must be ignored (exit 0, no output).
  assert_passes '{"tool_input":{"command":"ls -la"}}' 'a non-gh-issue command is ignored'
  selftest_report; exit $?
fi

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

# A single Bash call may create MORE THAN ONE issue (chained `gh issue create`), so
# capture EVERY issue URL in the output, not just the first.
urls=$(printf '%s' "$out" | grep -oE 'https://github\.com/[^ ]+/issues/[0-9]+' | sort -u)
[ -n "$urls" ] || exit 0    # no URL (dry run / failure) → skip silently

recorded=""
while IFS= read -r url; do
  [ -n "$url" ] || continue
  num=$(printf '%s' "$url" | grep -oE '[0-9]+$')
  # Already indexed? (idempotent — don't double-append if the hook re-fires.)
  grep -qE "^\| $num \|" "$index" 2>/dev/null && continue
  printf '| %s | open | _(set key)_ | [#%s](%s) | _(set source)_ | _(set path)_ |\n' \
    "$num" "$num" "$url" >> "$index"
  recorded="$recorded #$num"
done <<EOF
$urls
EOF

[ -n "$recorded" ] || exit 0
{
  echo "🗂️  Recorded issue(s)$recorded in ISSUES.md."
  echo "    Fill in the finding-key, title, source skill, and Dropbox screenshot path"
  echo "    for each row so the dedup index is searchable."
} >&2

exit 0
