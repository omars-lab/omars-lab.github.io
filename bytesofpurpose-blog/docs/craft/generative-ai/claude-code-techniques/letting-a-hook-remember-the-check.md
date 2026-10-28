---
title: 'Letting a Hook Remember the Check'
description: 'I kept forgetting a check at the end of a session. Now a Stop hook reads the session and reminds me only when it needed the check and never ran it.'
slug: /generative-ai/claude-code-techniques/letting-a-hook-remember-the-check
kind: technique
usefulness: 3 # 1 to 5: how much a typical Claude Code user gets from it; the sidebar follows it
sidebar_position: 15
authors: [oeid]
tags: [claude-code, ai, productivity, hooks, automation]
image: /img/claude-code/letting-a-hook-remember-the-check.png
draft: true
questions:
  - How do I get Claude Code to remind me to run a check before I finish?
  - How do I write a Claude Code Stop hook that only speaks when it matters?
  - How do I stop forgetting the last step of a task?
---

## What annoyed me

Some checks only matter after certain work. In the repo where I draft these posts, two of them kept
slipping. If a session touched the files that list my Claude sessions, I had to run a privacy check
before pushing. If a session used my usage numbers, I had to re-index first, or the numbers were
stale.

Neither check is hard. The hard part is remembering it at the end, when the work feels done and
I'm already thinking about the next thing. A line in `CLAUDE.md` didn't fix it. Claude reads that
at the start, and the end of a long session is a long way from the start.

## What I did about it

I stopped trying to remember and gave the job to a **Stop hook**. Claude Code runs a Stop hook
each time Claude finishes a reply. Mine reads the session's log and asks two questions:

1. **Did this session do the risky thing?** A pattern for the work that needs the check, like
   touching the stats file.
2. **Did it already run the check?** A second pattern for the command that does the check.

It speaks only when the first answer is yes and the second is no. Every other time it stays quiet,
so the reminder still means something when it shows up.

The second reminder was the real test. Near the end of one session, Claude offered to run the
index for me. I didn't want it run then, but I wanted to be told when it was due. The answer was
one more section in the config the hook already reads, with its own two patterns and message. No
new hook code.

## Set it up

Save this as `.claude/hooks/remind-at-stop.py` in your project. Each entry in `REMINDERS` is one
check you keep forgetting:

```python
#!/usr/bin/env python3
"""Stop hook: remind me about a check this session needed but never ran."""
import json
import re
import sys
from pathlib import Path

REMINDERS = [
    {
        # The session read, edited or ran something that touches the numbers ...
        "signal": r'"(?:file_path|command)":"[^"]*(?:usage-report|stats\.json)',
        # ... and never actually ran the command that refreshes them.
        "done": r'"command":"[^"]*make index',
        "message": "This session used the usage numbers but never re-indexed. "
                   "Run `make index` before you trust or share them.",
    },
]

payload = json.load(sys.stdin)
if payload.get("stop_hook_active"):
    sys.exit(0)  # Claude is already acting on a reminder this turn; don't ask again
try:
    transcript = Path(payload.get("transcript_path", "")).expanduser().read_text(errors="ignore")
except OSError:
    sys.exit(0)  # no transcript, nothing to say

due = [r["message"] for r in REMINDERS
       if re.search(r["signal"], transcript) and not re.search(r["done"], transcript)]
if due:
    print(json.dumps({"systemMessage": "\n".join(due)}))
```

Then register it in `.claude/settings.json`:

```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          { "type": "command", "command": "python3 \"$CLAUDE_PROJECT_DIR\"/.claude/hooks/remind-at-stop.py" }
        ]
      }
    ]
  }
}
```

Swap in your own patterns and message. To add a second reminder later, add a second entry to
`REMINDERS`. That's the whole point: the next forgotten check costs a few lines, not a new hook.

**Pick who the reminder is for.** The sample prints `systemMessage`, which the
[hooks docs](https://code.claude.com/docs/en/hooks) describe as a warning shown to you. Claude
doesn't act on it, which is right when you've said "don't run it, just tell me". When you'd rather
Claude just runs the check, print this instead:

```json
{ "hookSpecificOutput": { "hookEventName": "Stop", "additionalContext": "Run make index before finishing." } }
```

Claude Code then keeps the session going so Claude can act on it. Once the check has run, the
second pattern matches and the hook goes quiet. If Claude can't run it, the sample's
`stop_hook_active` line stops the hook from asking again in the same turn, which the docs advise
for any Stop hook that keeps the session going. Plain text on stderr is the
one to avoid: the docs say Claude never sees it from a hook that exits normally, and they don't
promise you will.

To check the hook fires before you rely on it, run it in a throwaway session first. I wrote that
up in [Testing a Hook in a Throwaway Session](/craft/generative-ai/claude-code-techniques/testing-a-hook-in-a-throwaway-session).

## What it looks like

<figure style={{maxWidth: '480px', margin: '0 auto 1.5rem'}}>
  <img src="/img/claude-code/letting-a-hook-remember-the-check.png" alt="A Claude Code session: Claude offers to run the index, I answer don't index but add a hook that reminds us it is time to index, and Claude adds a reminder that fires when a session used the usage numbers and stays quiet once it re-indexed" />
</figure>

This is from the session where I added the second reminder. Claude offered to run the re-index
and commit the result. I said no, but asked for a reminder instead. Claude added one section to the
config the Stop hook already reads: fire when a session used the usage numbers, stay quiet once it
re-indexed. It also said up front that the reminder is advisory and never blocks.

## Match the command, not the name

The session log a Stop hook reads holds more than what Claude did. It has the output of every
command, the hook's own reminder once it has shown, and on recent versions of Claude Code the text
of your `CLAUDE.md` too. A pattern that looks for a bare word matches all of it.

Both of my reminders fell into this. In one session the check's script name showed up in a
`git status` listing, so the hook counted the check as done, though it never ran. Worse, my
`CLAUDE.md` names both checks. Once Claude Code started saving that text in the log, every session
looked as if it had already run them, and neither reminder could fire. Tying the patterns to the
commands fixed it, and a throwaway session showed the reminder again.

So tie both patterns to what a tool was asked to do. Claude Code logs a shell command as
`"command":"..."` and a file Claude read or edited as `"file_path":"..."`, which is why the
sample's patterns start that way. The format isn't documented, so check your patterns against a
real session log after you update Claude Code.

## Limits

- **It reads what the session did, not the state of your disk.** It can't tell that 30 new
  sessions piled up since the last index. It only knows whether this session used the numbers
  without refreshing them. If you need the disk checked, that's a different hook, run when a
  session starts.
- **It repeats until the check runs.** A Stop hook runs after every reply, so once the risky
  work happens, the reminder shows after each reply until the check runs. The docs also warn that
  the session log can trail the last few messages, so a check run as the very last step may earn
  one reminder too many.
- **Patterns drift.** Rename the command and the reminder fires forever, or never. Keep the
  patterns next to the thing they watch, and test them when that thing changes.
- **It nudges, it doesn't guard.** A reminder you can ignore isn't a gate. For a check that must
  pass every time, run it in the commit hook and in CI. That's the setup in
  [Running Every CI Check on Your Own Machine](/craft/generative-ai/claude-code-techniques/running-every-ci-check-on-your-own-machine).

## Why it works

- **It asks at the moment you forget.** The end of a session is exactly when the check slips, and
  that's when a Stop hook runs.
- **It stays quiet when it should.** Two patterns, not one, mean no reminder after the check ran
  and none in a session that never did the risky work. A hook that nags every time gets tuned out.
- **The next reminder is cheap.** One more entry with two patterns and a message. Once that's
  easy, writing down every check you keep forgetting stops feeling like overhead.

## In my own words

The second reminder started as one line at the end of a long session:

- "no don't index, but do add a hook that reminds us that it is time to index" (September 2026)

## Related

- [Claude Code Techniques](/craft/generative-ai/claude-code-techniques): the other pages in this set.
- [Running Every CI Check on Your Own Machine](/craft/generative-ai/claude-code-techniques/running-every-ci-check-on-your-own-machine):
  the checks this hook reminds me to run.
- [Testing a Hook in a Throwaway Session](/craft/generative-ai/claude-code-techniques/testing-a-hook-in-a-throwaway-session):
  how I check a hook fires before I trust it.
- This page goes with a post in my "How I Used Claude Today" series on LinkedIn.
