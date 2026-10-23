---
title: 'Handoff Prompts That Carry Only the What'
description: 'Start a fresh Claude Code session with a few lines that say what to do, and let your skills and plan say how, so the two never drift apart.'
slug: /generative-ai/claude-code-techniques/handoff-prompts-that-carry-only-the-what
kind: technique
usefulness: 4 # 1 to 5: how much a typical Claude Code user gets from it; the sidebar follows it
sidebar_position: 7
authors: [oeid]
tags: [claude-code, ai, productivity, skills, prompts]
image: /img/claude-code/handoff-prompts-that-carry-only-the-what.png
draft: true
questions:
  - What should I paste into a fresh Claude Code session to continue my work?
  - How do I keep a handoff prompt or a /loop prompt short?
  - Why does a long handoff prompt make the next session worse?
---

## What annoyed me

When a session got long, I'd move the work to a fresh one, and then stall on what to tell it.
Too little, and it would ask about things I'd already settled. Everything, and the prompt filled
up with how we test, how we commit, and rules I'd picked up along the way.

Most of those rules were already written down, in a skill or in my `CLAUDE.md`. Writing them into
the prompt again made two copies of each: one I'd keep fixing, and one in the prompt that wouldn't
get those fixes.

## What I did about it

I split the two. The handoff prompt says only what this task is: the goal, where to look, what
done means. Anything that would still be true on the next ten tasks lives in a skill or
`CLAUDE.md`, and the prompt points at it instead of saying it again.

I don't write that prompt by hand either. At the end of a session I ask Claude for it, through a
skill whose one rule is to point at existing skills and plan sections, never restate them. If a
rule has nowhere to live yet, writing it down becomes part of the task.

## Set it up

Make a skill that writes the handoff prompt. Mine is called `compact-prompt`, and the core of it
fits in a few lines:

```markdown
---
name: compact-prompt
description: Write a minimal handoff prompt for a fresh session that carries only the
  what (goal, scope, acceptance) and points at the skills and docs that hold the how.
  Use when asked for "a prompt for a new session", "a compact prompt" or "a handoff".
---

Skills and docs carry the how. The prompt carries only the what.

1. List this repo's skills and CLAUDE.md sections first, so every pointer names
   something that exists.
2. Write: the task in one line, the skills to load, the files to read and why,
   what's out of scope, and how to check it's done (a command beats an adjective).
3. Never include process rules, recaps or lessons that already live somewhere.
   Replace each one with a pointer to where it lives.
4. If a rule has no home yet, add "write it into <skill or doc>" to the task.
5. Self-check: would the new session have to ask "what about X" for anything a
   skill covers? Then a pointer is missing. Over about 60 lines? Something is
   being repeated.
```

A prompt it writes looks like this:

```text
Task: Add a --since <date> filter to the export command.

Invoke:
/dev-workflow

Read:
- docs/plan.md section "Export filters": the agreed behavior

Out of scope:
- An --until flag

Success criteria:
- make test passes
- export --since 2026-01-01 on the sample data returns only the later rows
```

Then, when you're ready to move on, ask: "write me a compact prompt for a fresh session." Paste
what it gives you into the new one.

## What it looks like

<figure style={{maxWidth: '480px', margin: '0 auto 1.5rem'}}>
  <img src="/img/claude-code/handoff-prompts-that-carry-only-the-what.png" alt="A Claude Code session: I ask for my taste in techniques to become a skill that a loop can drive, Claude gives a one-sentence /loop prompt that names the job and the skill, and later, when I ask about continuing, Claude admits its count of sessions read lived only in the chat" />
</figure>

This is from August, when I wanted a loop to read my old Claude Code sessions and pick out
techniques worth sharing. Before writing any loop prompt, Claude turned my taste into a skill:
86 lines with the questions a real technique has to pass, how to score a candidate, and what
the skill must never do, like make the final pick for me. It tried the skill
on two candidates to prove it worked. Only then did it give me the loop prompt: one sentence, 34
words, naming the job and the skill. Nothing in it says how to judge a technique. The skill does
that. The first pass found nine and flagged one near-miss.

The second half of the picture is the lesson I didn't expect. When I asked how we'd carry on,
Claude said there was no plan to resume from: its count of which sessions it had read lived only
in that chat. A fresh session couldn't have picked it up, however good the prompt. So we moved
the count into a file the skill reads and marks, which made it part of the how. From then on
each batch picked up where the last one stopped. A week after the first pass, all 92 sessions
were read and 23 candidates were logged. What the scan taught went into the skill, not into a
prompt: with its rubric file it ended at 244 lines, nearly three times where it started.

## Why it works

- **Each rule has one home.** When I fix a rule in the skill, every future handoff gets the fix.
  There's no second copy in an old prompt to drift.
- **A short prompt is one I can check.** I can read five lines and see whether it's the right
  task. I can't do that with sixty lines of half-remembered rules.
- **The fresh session starts clean.** It doesn't inherit the old session's dead ends, just the
  goal and where to look.
- **A missing pointer shows you what to write down.** If the new session has to ask about
  something, that's a skill or a file that doesn't exist yet, not something to add to the
  prompt.
- **State goes in files too.** A count, a list of what's done, a "where I stopped": if it lives
  only in the chat, no prompt can hand it over.

## In my own words

- "i want to capture my personal taste as what makes a meaningful technique and what doesn't as
  its own skill … and I want the loop to drive this" (August 2026)
- "do we have a plan to continue scanning transcripts and consolidating techniques?" (August 2026)

## Related

- [Sending Side-Quests to a Fork](/craft/generative-ai/claude-code-techniques/sending-side-quests-to-a-fork):
  the other way to hand work off, when the new worker should keep the conversation.
- [Citing the Session, Not a Memory](/craft/generative-ai/claude-code-techniques/citing-the-session-not-a-memory):
  the same idea for facts, keeping them in a file you can check rather than in the chat.
- [Claude Code Techniques](/craft/generative-ai/claude-code-techniques): the other pages in this set.
- This page goes with a post in my "How I Used Claude Today" series on LinkedIn.
