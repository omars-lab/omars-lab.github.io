---
title: 'What Not to Hand to Claude'
description: 'Hand Claude Code the searching, reading and drafting, but keep your curiosity and your calls, so the decisions that set direction still come back to you.'
slug: /generative-ai/claude-code-techniques/what-not-to-hand-to-claude
kind: technique
usefulness: 3 # 1 to 5: how much a typical Claude Code user gets from it; the sidebar follows it
sidebar_position: 6.5
authors: [oeid]
tags: [claude-code, ai, productivity, agents]
image: /img/claude-code/what-not-to-hand-to-claude.png
draft: true
questions:
  - What should I not hand off to Claude Code?
  - Should I let a fleet of agents run on their own?
  - How do I stay in charge when Claude does most of the work?
---

## What annoyed me

Claude Code will happily take whatever I hand it. The searching, the reading, the first draft. And,
if I let it, the questions too: what to look at next, which result is odd, what we're really trying
to find out.

That last part is the one I watch. A fleet of agents that runs on its own sounds great on paper. In
that setup, though, I can't stay as curious about the work. It comes back finished, and the parts
that would have made me stop and ask "wait, why?" went past without me.

## What I did about it

I split the work in two. Claude gets the work. I keep the curiosity and the calls.

- **I start each agent myself.** I run several Claude Code sessions and side agents at once, but
  each one starts because I asked for it, with a job I can name.
- **Each one reports back to me.** An agent hands back a short report, not a chain of actions on
  another agent's output. I read it before anything builds on it.
- **Calls that set direction come back as questions.** Claude asks me with its question tool, with
  a recommendation, and I'm free to go another way.

It isn't one rule in my `CLAUDE.md`. It's the shape of a few of them: the [stop-and-ask
rule](/craft/generative-ai/claude-code-techniques/telling-claude-when-to-stop-and-ask), the [side
agents that report back](/craft/generative-ai/claude-code-techniques/sending-side-quests-to-a-fork),
and the way I run sessions.

## Set it up

If you want it written down, here is a block to start from. Put it in `~/.claude/CLAUDE.md` so it
holds in every repo, and change it to fit:

```markdown
## What stays with me

You do the work: search, read, draft, run the checks.
I keep the questions and the calls.

- When you finish a piece of research, tell me what
  surprised you and what you would look at next.
  Don't just close it out.
- A call that sets direction comes back to me as a
  question, with your recommendation. Smaller calls
  you make, and say what you assumed.
- An agent you start reports back to this session.
  No agent acts on another agent's output before I
  have seen the report.
```

The first bullet is the one that keeps me curious. A report that ends with "here's what surprised
me" gives me something to pull on. A report that ends with "done" doesn't.

## What it looks like

<figure style={{maxWidth: '480px', margin: '0 auto 1.5rem'}}>
  <img src="/img/claude-code/what-not-to-hand-to-claude.png" alt="A Claude Code session: I say to be careful not to offload your curiosity or your agency to Claude, which is why I run my agents myself. Earlier in the same session, Claude asks whether technique posts should be their own series and recommends that, and I answer in my own words: fold them into the series I already have" />
</figure>

The top is me saying it out loud. The bottom is what it looks like in practice. Claude asked whether
these technique posts should be their own LinkedIn series, and recommended that they should. I went
another way, in my own words: one series, with two kinds of post.

That session ran for a week, with many agents doing the reading and drafting. 28 decisions came
back to me as questions. I took Claude's recommendation 15 times. The other 13 I chose another
option, answered in my own words, or asked to talk it over first. That's the part I don't want to
hand off.

## Why it works

- **Curiosity needs a moment to happen in.** Reading a report before the next step is that moment.
  An agent chain with no stop in it removes it.
- **A recommendation isn't a decision.** Claude's pick is often right. Nearly half the time, I still
  wanted something else, and I'd never have known if the call hadn't come back to me.
- **You stay able to explain the work.** Because I started every agent and read every report, I can
  say why the work looks the way it does.

## In my own words

- "be careful not to offload your curiosity your agency" (October 2026)
- "I prefer managing a fleet of agents myself over just letting a fleet of autonomous agents just do
  stuff" (October 2026)

## Related

- [Telling Claude When to Stop and Ask](/craft/generative-ai/claude-code-techniques/telling-claude-when-to-stop-and-ask):
  how the calls come back to you as clear choices.
- [Sending Side-Quests to a Fork](/craft/generative-ai/claude-code-techniques/sending-side-quests-to-a-fork):
  side agents that hand back a short report.
- [Giving Claude Engineering Tenets](/craft/generative-ai/claude-code-techniques/giving-claude-engineering-tenets):
  standing rules in your global `CLAUDE.md`.
- This page goes with a post in my "How I Used Claude Today" series on LinkedIn.
