---
title: 'Telling Claude When to Stop and Ask'
description: 'Tell Claude Code when to stop and ask you, and how to ask, so your decisions come back as clear choices instead of getting lost in long replies.'
slug: /generative-ai/claude-code/telling-claude-when-to-stop-and-ask
kind: technique
authors: [oeid]
tags: [claude-code, ai, productivity, decision-making]
image: /img/claude-code/telling-claude-when-to-stop-and-ask.png
draft: true
questions:
  - How do I get Claude Code to ask me before it makes a call I care about?
  - How do I stop my decisions from getting lost in a long chat?
---

Claude Code has a tool for asking you a question: it stops, shows you a few options, and waits for
you to pick one. Left alone, it mostly reaches for that tool when it is stuck. The rest of the
time, the choices that mattered were buried in a long reply, or already made for me. A week later I
couldn't find what I had decided, or why.

## The technique

Tell Claude, up front, **when** to stop and ask you and **how** to ask. Name the moments that are
yours to decide. Say what a good question looks like: a few options, the one it recommends first,
and what each one leads to. The ask-question tool stops being a fallback for when Claude is stuck.
It becomes the way your decisions get made and written down.

## Set it up

Add a section like this to your `CLAUDE.md` (the file Claude Code reads at the start of every
session, either in your home folder for all projects or at the root of one project):

```markdown
## When to stop and ask

Use the AskUserQuestion tool at a judgment call, not to ask permission to keep going.
A judgment call is one where different answers lead to different work: a change of
scope, a choice between approaches, anything that touches shared or published
state, or approving a decision.

- Give 2 to 4 options, with the one you recommend first, marked "(Recommended)".
- For each option, say what it gets me, what it costs or risks, and what it commits
  me to next.
- Never ask "shall I continue?" or anything a careful colleague would just decide.
  For cheap choices that are easy to undo, pick one, say what you assumed, and show
  me the result.
- Once I answer, write the decision and its reason down where the work is tracked,
  so the next session doesn't ask again.
```

If you write your own skills (the step-by-step instructions Claude Code loads for a task), name the
exact moments in the skill itself:

```markdown
## Steps

1. Read the folder and list what would change.
2. Before deleting or overwriting anything, ask with AskUserQuestion:
   "Which of these should I remove?", one option per group of files,
   the safest one first.
3. Make only the changes that were picked.
```

## What it looks like

<figure style={{maxWidth: '480px', margin: '0 auto 1.5rem'}}>
  <img src="/img/claude-code/telling-claude-when-to-stop-and-ask.png" alt="A Claude Code session: I ask Claude to use the ask-question tool to capture my decisions, and later in the same session it asks whether to commit two files and push them to a public repo, with four options" />
</figure>

This is from a real session where I was cleaning up my setup scripts. Early on I typed one line:
use the ask-question tool to capture my decisions. Later, two files were ready to go to a public
repo, and Claude stopped and asked instead of pushing them.

The question has four options, from "commit both and push" to "hold both". The recommended one
comes first, and each one says what it means. "Commit both, don't push yet" spells out the middle
ground: the files land on my machine so I can review them before anything reaches the public repo.
I picked one in a second, and the choice stayed in the session as a clear answer to a clear
question.

## Why it works

- **The decision is yours, and it shows.** A question with options makes the choice visible. A
  paragraph that ends "I'll go ahead and push" doesn't.
- **The options do the thinking for you.** Laying out what each choice gets you and costs you is
  the work you would do in your head anyway. Claude has the context to do it faster.
- **The answers are easy to find later.** Each one is a short, structured record of what was
  decided and why, not a sentence somewhere in a long reply.
- **It cuts the noise too.** The same rule that says when to ask also says when not to. Small,
  reversible calls just get made, and you review the result.

## In my own words

I didn't start with a rule. I started by saying it, over and over, until it was worth writing down:

- "use ask question tool to capture my decsiions" (August 2026)
- "use ask question tool if input needed from me" (August 2026)
- "... to use the ask question tool to understand my taste" (August 2026)

## Related

- [Claude Code Techniques](/craft/generative-ai/claude-code): the other pages in this set.
- [How I Use GenAI](/craft/generative-ai/my-genai-workflow/2025-09-30-how-i-use-genai): my wider
  workflow with AI tools.
- This page goes with a post in my "How I Used Claude Today" series on LinkedIn.
