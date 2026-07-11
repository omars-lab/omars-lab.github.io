#!/bin/bash
# PostToolUse hook for Edit|Write: WARN (never block) when the kind registry or the authoring
# guidance is edited and the two have drifted apart.
#
# blog-kinds.json is the single source of truth for the post-KIND taxonomy. The authoring skill
# (author-post: mechanics.md + kinds/*.md) documents how to author each kind. When a kind is
# added/renamed/retired in the JSON but the skill guidance isn't updated (or vice-versa), authors
# get pointed at a dead kind, or the skill re-grows a stale parallel table (the old author-blog-post
# shipped a 9-kind table while the JSON had 32). This hook runs scripts/validate-kinds-guidance.js
# the moment you touch either side, so drift is caught immediately. Warn-tier (exits 0, never blocks);
# the blocking gate is `make validate-kinds-guidance`. The onboarding lockstep is owned by the
# `manage-kinds` skill.
#
# Scope: blog-kinds.json itself, OR any author-post skill guidance file (mechanics.md / kinds/*.md).

# --- selftest: prove routing (in-scope triggers the validator; out-of-scope is ignored). ---
# This is a WARN-tier DELEGATING hook: its "bite" is the validator's (proven separately in
# validate-kinds-guidance.js with planted drift). The hook's own contract is ROUTING, so that's
# what the selftest asserts, without mutating repo files.
if [ "$1" = "--selftest" ]; then
  SELFTEST_HOOK="$0"; . "$(dirname "$0")/lib/selftest.sh"
  assert_ignored '{"tool_input":{"file_path":"/x/unrelated.txt"}}' 'an unrelated file is ignored'
  assert_passes  '{"tool_input":{"file_path":"'"$CLAUDE_PROJECT_DIR"'/bytesofpurpose-blog/scripts/lib/blog-kinds.json"}}' 'blog-kinds.json in-scope runs clean'
  selftest_report; exit $?
fi

input=$(cat)
file_path=$(printf '%s' "$input" | jq -r '.tool_input.file_path // empty')

case "$file_path" in
  */bytesofpurpose-blog/scripts/lib/blog-kinds.json) ;;
  */.claude/skills/author-post/mechanics.md) ;;
  */.claude/skills/author-post/kinds/*.md) ;;
  *) exit 0 ;;
esac

proj="${CLAUDE_PROJECT_DIR:-$(printf '%s' "$input" | jq -r '.cwd // empty')}"
script="$proj/bytesofpurpose-blog/scripts/validate-kinds-guidance.js"
[ -f "$script" ] || exit 0   # not this repo / not set up → stay out of the way

out=$(node "$script" 2>&1)
status=$?

if [ "$status" -ne 0 ]; then
  # Surface the drift as advice; never block (exit 0).
  printf '%s\n' "$out" >&2
  echo "" >&2
  echo "ℹ️  (advice only — not blocking. Reconcile via the manage-kinds skill; \`make validate-kinds-guidance\` is the blocking gate.)" >&2
fi

exit 0
