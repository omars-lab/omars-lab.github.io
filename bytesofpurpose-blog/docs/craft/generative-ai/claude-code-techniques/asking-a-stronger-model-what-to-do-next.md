---
title: 'Asking a Stronger Model What to Do Next'
description: 'Claude Code can consult a stronger advisor model. A small Stop hook makes it ask, at the end of real work, what matters most next.'
slug: /generative-ai/claude-code-techniques/asking-a-stronger-model-what-to-do-next
kind: technique
usefulness: 3 # 1 to 5: how much a typical Claude Code user gets from it; the sidebar follows it
sidebar_position: 7
authors: [oeid]
tags: [claude-code, ai, productivity, hooks]
image: /img/claude-code/asking-a-stronger-model-what-to-do-next.png
draft: true
questions:
  - How do I get Claude Code to suggest what to do next when it finishes?
  - What is the advisor model in Claude Code, and how do I set it?
  - How do I make Claude ask the advisor at the end of a task?
---

## What annoyed me

Claude would finish a long stretch of work, write a tidy summary and stop. Every "so what now?"
was mine to answer. Usually the next step was obvious to anyone who had followed the whole
session, and Claude had. It just didn't say.

I also noticed it calling things done a little early: a test that never touched the change, a
list of open items left in a doc nobody would read again.

## What I did about it

Claude Code has an advisor setting: a stronger model that Claude can consult before it commits
to an approach, when it's stuck, or before it calls a task done. I set mine to Fable. Then I
added a small Stop hook. When Claude is about to hand back after a real stretch of work, the hook
stops it once and tells it to ask the advisor one question: what is the next most important thing
for our customers and users?

**The technique:** give Claude a stronger advisor, and have it ask that advisor what to do next
at the end of real work, instead of just stopping.

## Set it up

Two pieces: one setting, one hook.

**The advisor.** In `~/.claude/settings.json`:

```json
{
  "advisorModel": "fable",
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "~/.claude/hooks/next.py"
          }
        ]
      }
    ]
  }
}
```

`advisorModel` takes `fable`, `opus`, `sonnet` or a full model id. The advisor has to be at least
as strong as the model you work with. Fable needs Fable access on your account; if you don't have
it, `opus` works the same way. You can also run `/advisor` and pick one, or `/advisor off` to turn
it off. The [advisor docs](https://code.claude.com/docs/en/advisor) have the details.

**The hook.** Save this as `~/.claude/hooks/next.py`, then make it runnable with
`chmod +x ~/.claude/hooks/next.py`:

```python
#!/usr/bin/env python3
"""Stop hook: after a real stretch of work, ask the advisor what to do next."""
import json, os, sys, tempfile

MIN_TOOL_CALLS = 40  # work since the last ask before it asks again

ASK = (
    "A stretch of work just finished. Before you hand back, call the advisor "
    "and ask it: what is the next most important thing to do for our customers "
    "and users? End your closing message with a short 'Next' section: the one "
    "pick, why it matters to them, and whether it is already on the backlog. "
    "Name it; do not start it."
)

hook = json.load(sys.stdin)
if hook.get("stop_hook_active"):
    sys.exit(0)  # Claude is already answering this hook's ask

with open(hook["transcript_path"]) as f:
    calls = sum(line.count('"type":"tool_use"') for line in f)

marker = os.path.join(tempfile.gettempdir(), "ask-advisor-" + hook["session_id"])
last = int(open(marker).read()) if os.path.exists(marker) else 0
if calls - last < MIN_TOOL_CALLS:
    sys.exit(0)  # too little work since the last ask

with open(marker, "w") as f:
    f.write(str(calls))
print(json.dumps({"decision": "block", "reason": ASK}))
```

The Stop hook runs every time Claude finishes a reply, so the script decides when it counts:

- **Only after real work.** It counts the tool calls in the session's log and asks only when 40
  or more have run since the last ask. A quick question and answer never sets it off.
- **Only once per stop.** When Claude is already answering the hook, `stop_hook_active` is true
  and the script stays quiet, so it can't loop.
- **Name it, don't start it.** The next step comes back as a suggestion at the end of the reply.
  You decide whether to take it.

Change "our customers and users" to whoever your work is for. The word that does the work is
*most*: one pick, not a list.

## What it looks like

<figure style={{maxWidth: '480px', margin: '0 auto 1.5rem'}}>
  <img src="/img/claude-code/asking-a-stronger-model-what-to-do-next.png" alt="A vim window showing settings.json, with the advisor model set to fable and a Stop hook that runs next.py." />
</figure>

I set the advisor on October 8. Between then and October 26, across 15 of my personal sessions,
Claude asked it 1,538 times. Almost all of those came from Claude on its own, in the middle of
work, and most of them inside subagents.

With the hook on, a long stretch of work ends with a short "Next" section: one pick, why it
matters, and whether it's already on the backlog. The call on whether to take it stays mine.

The calls Claude makes on its own catch things too. From one of my sessions, in Claude's words
right after a call:

- "The advisor pointed out a gap: the tests start the server on their own port, so they never ran
  my change."
- "The advisor caught one gap: the five open items are only in the design doc, not in the
  backlog, where the next session will actually look."
- "A gap the advisor flagged: the hub would show a normal publish button for a technique post."

Each of those would have been a "done" that wasn't.

## Why it works

- **A second reader who saw everything.** The advisor gets the whole conversation, every tool
  call and result. It isn't guessing from a summary.
- **The end of work is when the context is richest.** Claude knows the most about the project
  right before it stops. Asking then turns that into one useful next step instead of letting it
  drop.
- **One pick forces a choice.** "The next most important thing" can't come back as a list of
  ten. Naming who it's for keeps it on real outcomes, not tidying.

## Where it gets in the way

- **It costs.** Each call sends the whole conversation to the stronger model. On a subscription
  it counts toward your plan limits, and Fable calls bill to usage credits. `/usage` shows it.
- **Turn it off for experiments.** When I compare how Claude does with and without a change, the
  advisor is a second model quietly helping, and it skews the result. Set
  `CLAUDE_CODE_DISABLE_ADVISOR_TOOL=1` for those runs.
- **You can't read the advice later.** It shows live as "Advising" in the session, and Ctrl+O
  shows the text, but the session log keeps it encrypted. What you can read afterwards is what
  Claude did next.

## In my own words

- "add a post explaining how we have fable setup to advise us on what we do next" (October 2026),
  asking for this page.
- "fable can skew experiment results as advisor" (October 2026, typos fixed), when I turned it off
  for a set of experiments.

## Related

- [Claude Code Techniques](/craft/generative-ai/claude-code-techniques): the other pages in this set.
- [Telling Claude When to Stop and Ask](/craft/generative-ai/claude-code-techniques/telling-claude-when-to-stop-and-ask):
  the other half of a hand-back, when the decision is yours to make.
- This page goes with a post in my "How I Used Claude Today" series on LinkedIn.
