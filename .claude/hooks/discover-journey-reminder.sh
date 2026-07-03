#!/bin/bash
# Stop hook: nudge to run a discover-my-journey DELTA pass once enough new self-revealing
# writing has accumulated since the last pass (git watermark). Delegates to the Node impl;
# always exits 0 (advisory, never blocks Stop). See the discover-my-journey skill.
node "$CLAUDE_PROJECT_DIR/.claude/hooks/discover-journey-reminder.js"
exit 0
