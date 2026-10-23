---
title: 'Auditing the Plan Before You Build It'
description: 'Claude Code writes plans that sound right. Before any code, I send read-only agents to check every claim in the plan, and the plan changes shape.'
slug: /generative-ai/claude-code-techniques/auditing-the-plan-before-you-build-it
kind: technique
usefulness: 3 # 1 to 5: how much a typical Claude Code user gets from it; the sidebar follows it
sidebar_position: 11
authors: [oeid]
tags: [claude-code, ai, productivity, planning, subagents]
image: /img/claude-code/auditing-the-plan-before-you-build-it.png
draft: true
questions:
  - How do I check a Claude Code plan before it starts writing code?
  - How do I use subagents to review a plan without them editing it?
---

## What annoyed me

Claude Code writes plans that sound right. They name files, quote line numbers, give counts and cite
prices, all in the same confident voice. Some of it was checked. Some of it was remembered, and
memory goes stale.

I'd find out which was which halfway through the build, when a step leaned on something that wasn't
true. By then the plan was half done, and fixing it meant undoing work.

## What I did about it

Once a plan is drafted, and before any code, I ask for an audit. Claude sends a few agents out in
the background, each with one job: check every claim the plan makes about the code against the
repo, check the outside facts against their sources, and look for what others have already built.

The agents only read and report. None of them touches the plan. The main session reads their
reports, checks the ones that matter, and rewrites the plan once, with a link next to each fact it
looked up. Nothing edits the plan file at the same time, and I get one rewrite instead of three.

## Set it up

Add a section like this to your `CLAUDE.md` (the file Claude Code reads at the start of every
session, either in your home folder for all projects or at the root of one project):

```markdown
## Audit the plan before building

When a plan is drafted and before any code is written, run an audit pass:

- Start two or three background agents, read-only, each with one job:
  1. Check every claim the plan makes about this repo (file names, line
     numbers, what a function does, counts) against the code.
  2. Check every outside fact (prices, API behavior, tool docs) against its
     source, and return the link.
  3. Look for existing tools or prior art the plan should reuse.
- The agents report back. They never edit the plan.
- Read the reports yourself. Re-check any finding the plan depends on before
  writing it in. If an agent couldn't do its job (no web access, wrong
  folder), do that part yourself rather than skip it.
- Rewrite the plan once, with sources next to the facts, and tell me what
  changed and why before you start building.
```

## What it looks like

<figure style={{maxWidth: '480px', margin: '0 auto 1.5rem'}}>
  <img src="/img/claude-code/auditing-the-plan-before-you-build-it.png" alt="A Claude Code session: I ask Claude to re-audit the plan and back it up with web research, it says it will, and after three agents report back it says the audit found a real problem: the price table is wrong for every model I use, and fixing it is now step 1" />
</figure>

This is from a real session in August. Claude had drafted a plan for a page that tracks how I use
Claude Code: what it costs, how many skills I've written, how much it does without asking. Before
building it, I typed: re-audit plan, websearch to back it up, add links and represent.

Claude sent out three agents. One checked the plan's claims about the code. One checked how Claude
Code stores its data. One looked for tools that already do this. That last one came back saying
it wasn't allowed to search the web, so Claude fetched the pages itself.

The plan changed shape, not just its footnotes:

- **The price table was wrong.** It had a retired rate for one model I use and no rate at all for
  another, so that one was priced as a cheaper model. The totals happened to land close, because
  one error cancelled the other, but the numbers per model were nowhere near. Since the cost is stored when the data is built, fixing it meant rebuilding the data.
  That became step 1, ahead of everything else.
- **A test assumption was wrong.** The plan said the test setup fails when a request isn't faked.
  The code check found it doesn't: it quietly reads the real data instead.
- **Some counts in the plan were off**, and Claude corrected them in the same reply.

None of this would have shown up until the build hit it.

## Why it works

- **Each agent has one question.** "Is this claim about the code true?" is easier to answer well
  than "is this plan good?"
- **Read-only keeps it clean.** The agents can't fight over the plan file, and one session owns the
  rewrite, so the result reads as one plan.
- **The main session still checks.** The biggest finding here came after an agent came back
  empty-handed and Claude did that part itself. An audit you don't read is just more text.
- **It's cheaper now than later.** A wrong fact in a plan costs one edit. The same fact found
  halfway through the build costs the work built on it.

## In my own words

- "re-audit plan, websearch to back it up, add links and represent" (August 2026)

## Related

- [Sending Side-Quests to a Fork](/craft/generative-ai/claude-code-techniques/sending-side-quests-to-a-fork):
  the other way I hand work to an agent.
- [Claude Code Techniques](/craft/generative-ai/claude-code-techniques): the other pages in this set.
- This page goes with a post in my "How I Used Claude Today" series on LinkedIn.
