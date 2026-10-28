---
title: 'Testing a Hook in a Throwaway Session'
description: 'Claude Code said it could not check my new hooks until a fresh session. Four one-line throwaway sessions checked them in under five minutes.'
slug: /generative-ai/claude-code-techniques/testing-a-hook-in-a-throwaway-session
kind: technique
usefulness: 3 # 1 to 5: how much a typical Claude Code user gets from it; the sidebar follows it
sidebar_position: 12
authors: [oeid]
tags: [claude-code, ai, productivity, hooks, testing]
image: /img/claude-code/testing-a-hook-in-a-throwaway-session.png
draft: true
questions:
  - How do I check that a Claude Code hook actually fires?
  - Can I test a hook without waiting for it to fire in my normal work?
---

## What annoyed me

Claude Code finished adding two hooks for me and said the tests passed. Then it added: "Two
verifications I can't complete." The hooks only load in a new session, so the real check would
have to wait.

That's how hooks usually go. You add one, you start working, and some time later you look at
whether it did anything. A hook (a command Claude Code runs on its own when something happens,
like a prompt being sent or a reply ending) fails quietly. If it never runs, nothing tells you.

These two hooks were meant to log every time Claude Code needed my permission for something. I
planned to post a number from those logs. A hook that quietly did the wrong thing would have put a
wrong number in a post.

## What I did about it

I asked: can't you start a non-interactive session with `-p` to check?

`claude -p "<prompt>"` runs one prompt in a brand-new session and exits. A new session loads the
current settings, hooks included. So the test is a throwaway session whose whole instruction is one
harmless action, the kind that should set the hook off. Then you look at what the hook wrote and
what the throwaway session's log recorded. One probe, one action, one answer.

## Set it up

First, make the hook leave a trace you can count. A hook that only prints something leaves no sign
when it has nothing to say. Have it append a line to a log file:

```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [{ "type": "command", "command": "echo \"$(date -u +%FT%TZ) stop\" >> ~/.claude/hook-probe.log" }]
      }
    ]
  }
}
```

Then, from the folder where the hook is installed, count the log, run a probe, and count again:

```bash
before=$(wc -l < ~/.claude/hook-probe.log 2>/dev/null || echo 0)
claude -p "Run exactly this bash command and nothing else: echo probe" --model haiku
echo "lines: $before -> $(wc -l < ~/.claude/hook-probe.log)"
```

If the count went up, the hook fired. If it didn't, you know now, not next week.

The probe's own log is the second check. Claude Code keeps each session as a `.jsonl` file under
`~/.claude/projects/<folder>/`, where the folder is the project's path with `/` turned into `-`. A
hook that printed something shows up there as a `hook_success` line:

```bash
probe=$(ls -t ~/.claude/projects/<folder>/*.jsonl | head -1)
jq -r 'select(.attachment.type? == "hook_success") | .attachment.hookEvent' "$probe" | sort | uniq -c
```

To have Claude do this for you, add a line to your `CLAUDE.md`:

```markdown
After adding or changing a hook, prove it fires before calling it done: run a
throwaway `claude -p` session whose only instruction is one harmless action that
should trigger it, then check what the hook wrote and what the probe's log
recorded. One probe per thing you want to know. Don't wait for it to fire in real work.
```

## What it looks like

<figure style={{maxWidth: '480px', margin: '0 auto 1.5rem'}}>
  <img src="/img/claude-code/testing-a-hook-in-a-throwaway-session.png" alt="A Claude Code session: Claude says it can't complete the hook check until a fresh session, I ask whether it can start a non-interactive session with -p to test, and after one probe Claude reports that no permission hook fired, which contradicts the plan" />
</figure>

This is the real session. Claude had planned the hooks from the docs, and the plan said the
permission hook fired for every permission decision, even ones that were allowed without asking
me. The number I wanted to post was the gap between the two logs: how much Claude does without
asking.

Claude ran four probes, each a one-line instruction in its own session:

| Probe | What happened | Permission hook |
|---|---|---|
| Run `echo`, with Bash allowed up front | ran | did not fire |
| Run `echo`, with nothing allowed up front | ran | did not fire |
| Write a file outside the project | refused, "I need your permission" | did not fire |
| Fetch a web page | refused, "I need your permission" | did not fire |

The first probe already contradicted the plan. A call that was allowed without asking fired no
permission hook at all. The other three showed why: a session started with `-p` never asks, so it
never reaches the step these hooks listen for. Meanwhile, two other hooks fired in every one of
the four probes, a prompt hook and an end-of-reply hook. Their lines are in each probe's log.

Claude's answer came back under five minutes after I asked. The four probes started within about a
minute and a half of each other. Each probe was one short session, 17 to 24 lines of log, and the four
together cost about eight cents at list price.

What the probes caught mattered more than the hooks themselves. The ratio I meant to post would
have measured nothing. Claude marked that idea unusable, fixed the notes that repeated the wrong
claim, and added a read-only check that warns when the two logs count the same thing.

## What a probe can't test

A `-p` session never stops to ask you anything. So a hook that runs when Claude Code asks for
permission, or when it shows you a notice, can't be set off by a probe. The probe still helps
there: it tells you, in a minute, that this hook needs a real interactive session to test. For a
hook on a prompt being sent or a reply ending, both of which fired in every probe, it's the fastest
check there is. For any other event, one probe tells you which kind you have.

This was measured on the Claude Code of August 2026. Which hooks fire under `-p` can change between
versions, so run a probe again after you update.

## Why it works

- **One instruction, one answer.** A probe that does one thing can only fail one way. A busy real
  session hides which action set the hook off.
- **It's cheap enough to run four.** Each probe costs cents and a few seconds, so you can vary one
  thing at a time: allowed or not, a command or a file write.
- **It tests the hook where it lives.** Unit tests feed a hook a hand-built input. A probe runs the
  real Claude Code with your real settings, so it also catches a hook that isn't registered, isn't
  executable, or listens for the wrong event.
- **It checks the plan, not only the code.** Here the hooks were fine. The assumption behind them
  was wrong, and the probe found that before a wrong number went into a post.

## In my own words

- "can't you start a non interactive claude session with -p to check / test?" (August 2026)

## Related

- [Auditing the Plan Before You Build It](/craft/generative-ai/claude-code-techniques/auditing-the-plan-before-you-build-it):
  checking a plan's claims before building on them.
- [Looking at the Page Before Reading the CSS](/craft/generative-ai/claude-code-techniques/looking-at-the-page-before-reading-the-css):
  the same idea for a layout bug. Look at the real thing first.
- [Claude Code Techniques](/craft/generative-ai/claude-code-techniques): the other pages in this set.
- This page goes with a post in my "How I Used Claude Today" series on LinkedIn.
