#!/bin/bash
# Stop hook: remind to RESTART the local `make start` dev server when this session changed
# the route table (added/moved/deleted a doc, redirect, slug, or component registration)
# AND a server is running on :3000 — else silent. A stale route table serves false 200s
# (the serve-locally gotcha). Delegates to the Node impl; always exits 0 (advisory).
node "$CLAUDE_PROJECT_DIR/.claude/hooks/dev-server-restart-reminder.js"
exit 0
