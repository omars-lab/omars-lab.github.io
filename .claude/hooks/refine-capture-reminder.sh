#!/bin/bash
# Stop hook: if refine-design-post ran this session, nudge to CAPTURE what was learned back into
# the skill's living guide files — otherwise the self-healing loop silently rots (see the
# refine-design-post skill, "Capture the generalization — MANDATORY"). Advisory; always exits 0.
#
# It reads the session transcript (path provided on stdin by the Stop hook payload) and only fires
# when the skill was actually invoked/referenced, so it stays quiet on unrelated sessions.

input=$(cat)
transcript=$(printf '%s' "$input" | jq -r '.transcript_path // empty')

# No transcript → can't tell; stay silent.
[ -n "$transcript" ] && [ -f "$transcript" ] || exit 0

# Did this session use the refine-design-post skill? (skill invocation or its guide files)
if ! grep -qE 'refine-design-post|STYLE-GUIDE\.md|SECTION-QUESTIONS\.md' "$transcript" 2>/dev/null; then
  exit 0
fi

# Did we already capture this session? If the transcript shows an edit/write to a guide file
# AFTER a refine mention, assume the loop closed and stay quiet to avoid nagging.
if grep -qE '"(file_path|content)":[^}]*(STYLE-GUIDE\.md|SECTION-QUESTIONS\.md)' "$transcript" 2>/dev/null; then
  exit 0
fi

cat >&2 <<'EOF'
🪞 refine-design-post reminder: before you stop, close the self-healing loop.
   For each finding the author acted on, triage it into exactly one:
     (a) reusable rule → append to .claude/skills/refine-design-post/STYLE-GUIDE.md
         (voice/wording) or SECTION-QUESTIONS.md (a "section must answer X" rule), or
     (b) one-off, not generalizable → skip it with a one-line reason.
   Then print the "Captured this session" block. (If nothing was generalizable, say so.)
   This is advisory — it will not block. See the refine-design-post skill.
EOF
exit 0
