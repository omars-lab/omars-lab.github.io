# Issue index

Dedup index for tracked GitHub issues (mostly **deferred audit/review findings** — see the
"track DEFERRED findings as GitHub issues" tenet in `CLAUDE.md`). **Check this before filing
a new issue** so we don't create duplicates; if a matching open issue exists, comment on it
instead of opening another.

This file is **self-maintained**: the PostToolUse hook `.claude/hooks/gh-issue-index-hook.sh`
appends a row after every `gh issue create`. GitHub is the source of truth — if you close or
dedup an issue outside the normal flow, update its status here in the same step.

| # | Status | Finding-key | Title | Source | Screenshot |
|---|---|---|---|---|---|
<!-- gh-issue-index: new rows appended below this line by the hook -->
