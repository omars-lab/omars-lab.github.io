---
title: 'Telling Claude When Not to Ask'
description: 'Claude Code kept asking me things it could have just done. One tenet in my global CLAUDE.md: only a choice that is hard to undo earns a question.'
slug: /generative-ai/claude-code-techniques/telling-claude-when-not-to-ask
kind: technique
usefulness: 5 # 1 to 5: how much a typical Claude Code user gets from it; the sidebar follows it
sidebar_position: 1.2
authors: [oeid]
tags: [claude-code, ai, productivity, claude-md, tenets, decision-making]
image: /img/claude-code/telling-claude-when-not-to-ask.png
draft: true
questions:
  - How do I stop Claude Code from asking me so many questions?
  - Which decisions should Claude Code ask me about, and which should it just make?
  - How do I get Claude Code to work on its own without losing control of the big calls?
---

## What annoyed me

Once I had Claude asking its questions properly, it asked too many of them. Every question came
with clear options and the one it recommended first. That part worked. But a lot of the questions
didn't need me at all.

Claude asked whether to commit its own work. It asked whether a file was tracked in git, which it
could have checked itself. It asked what to do next. Each question stopped the work until I came
back to the terminal, and often I just clicked the option Claude had already recommended. In one
long session in August, Claude asked me 52 questions. I picked its own recommendation 20 times.

## What I did about it

I wrote it down as a tenet, a standing rule in my global `CLAUDE.md`. Only a **one-way door** earns
a question: a choice that is expensive or impossible to undo. A push to a public repo. A merge
into a branch other people use. A big spend. A change of scope.

Everything else is a two-way door, and for a two-way door Claude doesn't ask. It makes the
reasonable call, says what it assumed, does the work, and shows me something I can review: a diff,
a picture, a draft. If it guessed wrong, I correct the result. That is faster than answering a
question about it beforehand, and I'm correcting something real instead of a description of it.

## Set it up

Add this to `~/.claude/CLAUDE.md`, the file Claude Code reads at the start of every session in
every project:

```markdown
## Only a one-way door earns a question

Ask me only when a choice is expensive or impossible to
undo: a change of scope, anything that touches shared or
published state (a push, a merge, a public page), a big
spend, or a call that sets direction. Everything else is
a two-way door.

- For a two-way door, make the reasonable call, say what
  you assumed, do the work, and show me something I can
  review: a diff, a render, a draft.
- Don't ask "what's next?" or "shall I commit?". Take
  the obvious next step and say which one you took.
- Don't ask me a fact you can check yourself.
- Keep a list of what you assumed, so my review is honest.

(Me, <the date>: "<what you typed the day it asked one
question too many>".)
```

It follows the four rules from the [tenets page](/craft/generative-ai/claude-code-techniques/giving-claude-engineering-tenets):
it names the kind of question, not one case; it says what to do instead of asking; it keeps the
moment it came from; and it is short.

If you also use the rule from [Telling Claude When to Stop and Ask](/craft/generative-ai/claude-code-techniques/telling-claude-when-to-stop-and-ask),
the two fit together. That one says how to ask. This one says when not to.

To see how often Claude asks you, count the questions in a session's log against the work it did.
Each tool call (a command, a file read, an edit) is one entry:

```bash
jq -s '[.[] | select(.type=="assistant") | .message.content[]?
        | select(.type=="tool_use")]
  | {tool_calls: length,
     questions: ([.[] | select(.name=="AskUserQuestion")
                  | (.input.questions | length)] | add)}' \
  ~/.claude/projects/<folder>/<session-id>.jsonl
```

The log format isn't documented, so check the command still works after you update Claude Code.

## What it looks like

<figure style={{maxWidth: '480px', margin: '0 auto 1.5rem'}}>
  <img src="/img/claude-code/telling-claude-when-not-to-ask.png" alt="A Claude Code session in August: Claude asks whether to commit a feature build before it starts the next step, and half an hour later I tell it to commit across both repos as needed. Two months later, with the rule in my CLAUDE.md, the question Claude asks is whether to sync a public GitHub repo that is 145 commits behind" />
</figure>

The top half is August, before the rule. Claude stopped to ask whether to commit its own work
before starting the next step. Committing is about as easy to undo as anything in git. I picked
the recommended answer. Half an hour later I typed "commit across both repos as needed", a
go-ahead it could have assumed from the start.

The bottom half is October, with the rule in place. The question is about pushing 145 commits to a
public GitHub repo, where anyone can read them. That is a one-way door, and it is the kind of
question I want.

I ran the count above on both sessions:

| | August | October |
|---|---|---|
| Tool calls | 3,627 | 6,315 |
| Questions | 52 | 28 |
| One question every | 70 tool calls | 225 tool calls |
| Questions about committing or what to do next | 3 | 0 |

In October Claude ran `git commit` 158 times and didn't ask me about one of them. Ten of the 28
questions were about something public or shared: syncing a public repo, merging into a main branch,
quoting my sessions on this blog, a change to every page on the site. The rest were taste and
direction, like which of three looks a page should have or how many posts to draft next, where
I'm the only one who can answer.

It isn't a clean experiment. The two sessions did different work, and I added other rules in
between. But the questions that disappeared are the ones this rule names.

## Why it works

- **A question costs more than it looks.** Each one stops the work until you come back. A wrong
  guess on a two-way door costs one correction, and you make it on the real result.
- **You review something real.** A diff or a draft shows you what the choice means. A question
  about it asks you to picture it.
- **The questions that are left matter.** When Claude only asks about pushes, merges, spend and
  direction, every question is worth reading, so you read them.
- **The assumptions are written down.** "I assumed X" next to the result tells you exactly where
  to look if X was wrong.

## In my own words

I was saying it before I wrote the rule down:

- "commit across both repos as needed" (August 2026)

And I still say it, but now as a short go-ahead rather than a correction:

- "apply it as needed" (October 2026)
- "reply to it as needed" (October 2026)
- "iterate on posts as needed" (October 2026)

## Related

- [Giving Claude Engineering Tenets](/craft/generative-ai/claude-code-techniques/giving-claude-engineering-tenets):
  the introduction to the tenets. This is one of them.
- [Telling Claude When to Stop and Ask](/craft/generative-ai/claude-code-techniques/telling-claude-when-to-stop-and-ask):
  how to ask when a question is worth asking. This page is the other half.
- [Seeing the Options Before You Decide](/craft/generative-ai/claude-code-techniques/seeing-the-options-before-you-decide):
  for the questions that are left, show the choices side by side.
- [Claude Code Techniques](/craft/generative-ai/claude-code-techniques): the other pages in this set.
- This page goes with a post in my "How I Used Claude Today" series on LinkedIn.
