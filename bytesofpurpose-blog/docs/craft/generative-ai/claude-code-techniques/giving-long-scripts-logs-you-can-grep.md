---
title: 'Giving Long Scripts Logs You Can Grep'
description: 'Have a long-running script log one greppable line per event, with a line before and after each call that can hang, so a stall is one grep, not a guess.'
slug: /generative-ai/claude-code-techniques/giving-long-scripts-logs-you-can-grep
kind: technique
usefulness: 3 # 1 to 5: how much a typical Claude Code user gets from it; the sidebar follows it
sidebar_position: 8.6
authors: [oeid]
tags: [claude-code, ai, productivity, claude-md, tenets, logging]
image: /img/claude-code/giving-long-scripts-logs-you-can-grep.png
draft: true
questions:
  - How do I tell whether a long-running script Claude started is stuck?
  - What should a script log so Claude Code can monitor it?
  - How do I stop Claude Code from guessing a run is dead?
---

## What annoyed me

Claude is good at starting a long job and checking back on it: a batch over a few hundred files,
a capture that runs for an hour, a watcher that waits for something to happen. The hard case is
silence. A quiet script might be working, might be stuck on one call, or might be finished, and
from the outside those look the same.

So Claude guessed. It looked at when files were last changed and at the process list, and drew a
conclusion. On one side project it decided from file times that a run had died and stopped it.
The run had still been moving.

## What I did about it

I made it a tenet in my global `CLAUDE.md`: a script that's left running and watched writes a log,
not silence. Every line has the same shape, so Claude can grep it:

- a UTC timestamp, the process id, and `ev=<event>` with `key=value` pairs after it;
- one line just before any call that can hang, and one just after, so a stall sits between two
  lines you can find;
- a timeout on anything that can block, which logs `ev=<something>_timeout` and moves on.

Then "is it stuck?" stops being a guess. `grep ev= run.log | tail -1` shows the last thing the
script did, and if that's a "before" line with no "after", you know which call it's stuck in.

On that same side project, once every step was logged, one grep for a single kind of event found
the same failure again and again, dozens of times in a row. That pointed straight at the real bug, which no amount of
reading file times would have shown.

## Set it up

Add a section like this to `~/.claude/CLAUDE.md`. It follows the four rules from
[Giving Claude Engineering Tenets](/craft/generative-ai/claude-code-techniques/giving-claude-engineering-tenets):
the kind of mistake, what to do instead, the moment, and short.

```markdown
## Logs you can grep for long-running scripts

A script left running and watched writes a log, not
silence. Every line: a UTC timestamp, the pid, and
`ev=<event> key=value` (free text goes in msg="...").

- Start with a line that says what the run is working on.
- Write one line before any call that can hang and one
  after, so a stall is bracketed.
- Put a timeout on anything that can block; log
  `ev=<name>_timeout` and recover.
- Check on the run by grepping the log, never by guessing
  from file times or the process list.

(Me, <the date>: "<the line I typed when it went
wrong>", after <what happened>.)
```

Fill in the last line with your own moment.

A small helper to start from, in Python, so every line comes out the same shape:

```python
import os, subprocess, time

LOG = open("run.log", "a", buffering=1)  # line-buffered, so each line lands at once

def log(ev, **fields):
    stamp = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    parts = [f'{k}="{v}"' if " " in str(v) else f"{k}={v}" for k, v in fields.items()]
    LOG.write(" ".join([stamp, f"pid={os.getpid()}", f"ev={ev}", *parts]) + "\n")

log("start", dir=os.getcwd(), files=len(os.listdir("pages")))
for name in sorted(os.listdir("pages")):
    log("page_begin", file=name)          # the line before the call that can hang
    try:
        subprocess.run(["your-tool", f"pages/{name}"], check=True, timeout=60)
        log("page_done", file=name)       # the line after
    except subprocess.TimeoutExpired:
        log("page_timeout", file=name, msg="gave up after 60 seconds")
    except subprocess.CalledProcessError as e:
        log("page_failed", file=name, code=e.returncode)
log("stop", reason="finished")
```

Two greps cover most check-ins:

```bash
grep ev= run.log | tail -1          # what it did last
grep -c ev=page_timeout run.log     # how often one thing went wrong
```

If Claude watches the script's output for new lines, keep the heartbeat lines in the log file and
off the output. Otherwise every heartbeat wakes Claude up for nothing.

## What it looks like

<figure style={{maxWidth: '480px', margin: '0 auto 1.5rem'}}>
  <img src="/img/claude-code/giving-long-scripts-logs-you-can-grep.png" alt="A Claude Code session: I ask whether we are monitoring comments, and 13 seconds later Claude says two new comments came in on the gallery page that it hadn't seen" />
</figure>

This one is from October, and it shows why "is it alive?" isn't enough.

I leave comments on pages Claude builds, and a watcher script tells Claude when a new one comes
in. That day I left two comments, heard nothing, and asked the question in the picture.
Claude checked the process list, and a watcher was running. That answer looked like "yes". The
watcher's own log, which nobody read, had a heartbeat every minute, each one saying nothing was
waiting:

```
16:43:25Z pid=26350 ev=heartbeat threads=10 open=1 waiting=0
```

All true, for what it was watching. The first line of that same log said what that was:

```
16:03:25Z pid=26350 ev=start repo=~/other-project threads=10 open=3 waiting=0
```

A different project entirely, left running from other work that day. A second watcher was on the
main copy of this repo. The page I was commenting on came from a third copy, and nothing was
watching it. Claude listed the open comments in each copy, found mine, and started a watcher on
the right one. Its first line said so straight away:

```
16:44:21Z pid=44766 ev=start repo=~/site-gallery threads=3 open=3 waiting=2
```

The two comments it had missed. (I've shortened the folder names.)

The cost was small, about a minute, because I asked. The lesson is the bullet this moment adds to the tenet:
a heartbeat tells you the script is alive, and the start line tells you what it's alive *for*. The
process list matched on the script's name, which every watcher shares. `grep ev=start` across the
logs would have shown the wrong folders without anyone asking.

## Why it works

- **A stall has an address.** With a line before and after each risky call, the last line in the
  log names the call it's stuck in.
- **Claude reads instead of guessing.** A grep is a fact. File times and process lists are clues
  that point both ways.
- **Patterns show up.** When every line has the same shape, counting one kind of event is one
  command, and the same failure dozens of times in a row is hard to miss.
- **A timeout turns a hang into a line.** One blocked call can't freeze the whole run for an hour;
  it logs, and the run moves on.

## In my own words

- "[are] we monitoring [comments]?" (October 2026)

## Related

- [Giving Claude Engineering Tenets](/craft/generative-ai/claude-code-techniques/giving-claude-engineering-tenets):
  the introduction to this set of tenet pages, and the four rules this one follows.
- [Commenting on Your Own Pages](/craft/generative-ai/claude-code-techniques/commenting-on-your-own-pages):
  the comment watcher in the picture, and how it tells Claude about a new comment.
- [Writing a Loop Prompt That Knows When to Stop](/craft/generative-ai/claude-code-techniques/writing-a-loop-prompt-that-knows-when-to-stop):
  another long-running job, where the progress lives in a file instead of the chat.
- [Claude Code Techniques](/craft/generative-ai/claude-code-techniques): the other pages in this set.
- This page goes with a post in my "How I Used Claude Today" series on LinkedIn.
