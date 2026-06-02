#!/bin/bash
# Stop hook: remind to archive 10+ completed tasks into the blog changelog AND to
# DELETE them after the move (see CLAUDE.md "archive completed tasks to the changelog").
# Delegates to the Node implementation; always exits 0 (advisory, never blocks Stop).
node "$CLAUDE_PROJECT_DIR/.claude/hooks/changelog-archive-reminder.js"
exit 0
