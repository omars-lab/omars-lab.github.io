---
title: 'Telling Claude When to Stop and Ask'
description: 'Claude Code kept asking me what to do in the middle of long replies. Now every question goes through its question tool, and a one-line script pulls every decision back out of the session log.'
slug: /generative-ai/claude-code-techniques/telling-claude-when-to-stop-and-ask
kind: technique
authors: [oeid]
tags: [claude-code, ai, productivity, decision-making]
image: /img/claude-code/telling-claude-when-to-stop-and-ask.png
draft: true
questions:
  - How do I get Claude Code to ask me before it makes a call I care about?
  - How do I stop my decisions from getting lost in a long chat?
  - How do I list every decision I made in a Claude Code session?
---

## What annoyed me

Claude Code kept asking me what to do in the middle of its replies, and never the right amount.
Some days it asked about everything, down to things it could have just picked. Other days it made
important decisions without consulting me.

It didn't ask the same way each time, either. Claude Code has a tool made for questions: it stops,
shows you a few options, and waits for you to click one. Sometimes Claude used it. Other times the
question was buried in prose. I'd be deep in a task, and a long paragraph would end with "Do you
want me to push these, or hold them for now?" I'd type a quick reply and move on. A week later I
couldn't find what I had decided, or why. The question was somewhere in a long chat, mixed in with
everything else.

## What I did about it

I told Claude, up front, **when** to stop and ask me and **how** to ask. Any time it needs me, it
asks with the question tool, never with a question at the end of a paragraph. That covers a real
choice, something that's unclear, and a guess it is about to make on my behalf. A good question has
a few options, the one it recommends first, and what each one leads to. The question tool stops
being a fallback for when Claude is stuck. It becomes the way my decisions get made and written
down.

## Set it up

Add a section like this to your `CLAUDE.md` (the file Claude Code reads at the start of every
session, either in your home folder for all projects or at the root of one project):

```markdown
## When to stop and ask

Use the AskUserQuestion tool at a judgment call, not to ask permission to keep going.
A judgment call is one where different answers lead to different work: a change of
scope, a choice between approaches, anything that touches shared or published
state, or approving a decision.

- Every question for me goes through the tool: a judgment call, something that's
  unclear, or an assumption you're about to make for me. Never end a reply with a
  question in plain text.
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

## Get every decision back

This is the part I didn't expect. Claude Code keeps each session as a `.jsonl` file under
`~/.claude/projects/<folder>/`, one line per event. When you answer a question from the tool, the
log stores it as a structured record: each question next to the answer you picked. A question asked
in plain text leaves no such record. It is just more prose.

So once every question goes through the tool, one command lists every decision in a session:

```bash
jq -r 'select(.toolUseResult.answers?)
  | .timestamp[:10] as $day
  | .toolUseResult.answers | to_entries[]
  | "\($day)  \(.key)\n            → \(.value | if type == "array" then join(", ") else . end)\n"' \
  ~/.claude/projects/*/<session-id>.jsonl
```

Swap `<session-id>.jsonl` for `*.jsonl` to list every decision from every session. The output reads
like this (shortened):

```text
2026-08-12  Two setup files are ready. Commit them and push to the public repo?
            → Commit both and push (Recommended)
```

I ran it on the session from August where I cleaned up my setup scripts. It gave back 33 decisions,
each one a question and the answer I picked, without reading through the chat. Three more times I
chose to talk a question over instead of answering it, and those show up as plain chat, not as
decisions.

The field names here (`toolUseResult`, `answers`) are how Claude Code writes its log today. It isn't
a documented format, so check the command still works after you update.

## Why it works

- **The decision is yours, and it shows.** A question with options makes the choice visible. A
  paragraph that ends "I'll go ahead and push" doesn't.
- **The options do the thinking for you.** Laying out what each choice gets you and costs you is
  the work you would do in your head anyway. Claude has the context to do it faster.
- **The answers are easy to find later.** Each one is a short, structured record in the session
  log, not a sentence somewhere in a long reply, so one command gets them all back.
- **It cuts the noise too.** The same rule that says when to ask also says when not to. Small,
  reversible calls just get made, and you review the result.

## In my own words

I didn't start with a rule. I started by saying it, over and over, until it was worth writing down:

- "use ask question tool to capture my decsiions" (August 2026)
- "use ask question tool if input needed from me" (August 2026)
- "... to use the ask question tool to understand my taste" (August 2026)

## Related

- [Claude Code Techniques](/craft/generative-ai/claude-code-techniques): the other pages in this set.
- [How I Use GenAI](/craft/generative-ai/my-genai-workflow/2025-09-30-how-i-use-genai): my wider
  workflow with AI tools.
- This page goes with a post in my "How I Used Claude Today" series on LinkedIn.
