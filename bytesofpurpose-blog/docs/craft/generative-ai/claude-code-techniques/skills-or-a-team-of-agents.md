---
title: 'Skills, or a Team of Agents? I Paid for Both'
description: 'The same work done by one agent loading skills and by a lead handing it to specialist subagents. The team cost 3.2 times as much, took 2.6 times as long, and the work came out about even.'
slug: /generative-ai/claude-code-techniques/skills-or-a-team-of-agents
kind: technique
usefulness: 4 # 1 to 5: how much a typical Claude Code user gets from it; the sidebar follows it
sidebar_position: 10.4
authors: [oeid]
tags: [claude-code, ai, productivity, subagents, skills, experiments]
image: /img/claude-code/skills-or-a-team-of-agents.png
draft: true
questions:
  - Should I set up a team of specialist agents in Claude Code?
  - Are Claude Code subagents more expensive than skills?
  - When is a specialist subagent worth it?
---

## The urge

If you use Claude Code and are thinking about setting up a team of agents for the first time, this
page is for you.

At some point in your AI adoption journey, you've probably had the idea to set up a team of
specialist agents: a coder, a tester, a reviewer, each with its own instructions. My tip: resist
the urge. Instead, build a set of Claude skills in your repo that don't overlap. Then, if you want
to parallelize the work, tell Claude to spawn subagents that use those skills.

A team of agents may build things for you with little guidance, but it comes at three costs:

- **Money.** Every subagent reads the repo again for itself.
- **Curiosity.** The work happens out of sight, so you get fewer chances to ask why it went this
  way and not that way.
- **Understanding.** When it's done, you have no idea how it got built.

The first cost I could measure, so I did.

## The experiment

I gave Claude Code the same know-how two ways:

1. **One agent with skills.** A coder, a tester and a reviewer text, installed as skills. One agent
   does the work and loads a text when it wants it.
2. **A lead with subagents.** The same three texts, installed as subagents. A lead hands the work
   out to them.

Everything else was the same: Opus 5.5 at medium effort for every agent, the same copy of my blog's
repo, and the same two tasks.

- **Task A** splits into parts: a comparison-table component, its styles, a docs page and tests.
- **Task B** goes step by step: parse a run log, then draw a timeline from it.

Each setup ran each task 3 times, 12 runs in all. Every run was checked by tests it never saw, and
by a reviewer that saw only the diff and didn't know which setup wrote it.

## What it cost

| | One agent + skills | Lead + subagents |
|---|--:|--:|
| Cost per run | $0.60 | $1.92 |
| Minutes per run | 2.5 | 6.5 |
| Output tokens per run | about 11k | about 46k |
| Lines of code added | 292 to 449 | 583 to 762 |
| Hidden tests passed | 6 of 6 runs | 5 of 6 runs |

The team cost 3.2 times as much and took 2.6 times as long. The cost gap held in all 6 pairs of
runs, on both tasks.

I expected the team to win back some time on task A, the one that splits into parts. It didn't.
The lead handed work to one helper at a time, every run: coder, tester, reviewer, coder again,
tester again. Nothing ran at once.

## Where the money went

Each subagent reads the repo again for itself. In the team runs, 54 to 72 percent of everything
read went to the subagents, not the lead. The team also thought about five times as much and wrote
about twice the code.

## Was the work better?

Scored one at a time, the two came out about even: 4.2 to 4.4 out of 5 for both. The reviewer said
the team's code read better and was tested more, and that it built things nobody asked for.

Side by side, it was split. On the table task, the reviewer ranked the team's three versions first.
On the timeline task, a skills version came first and a team version came last.

The one failed run is a judgment call. The team added screen-reader text, "Not available", next to
a dash in an empty cell, and the hidden test wanted the dash alone. I counted it as a fail, as I
said I would before the runs.

## Pros and cons

| | One agent + skills | Lead + specialist subagents |
|---|---|---|
| **Pros** | About a third of the price. Faster. Every step happens in the session you're watching, so you can stop it and ask why. | Needs less guidance from you. The reviewer found its code read better and was tested more. Each specialist keeps its own narrow tools. |
| **Cons** | One agent's context fills with everything it reads. | 3.2 times the cost and 2.6 times as long here. Wrote twice the code, some of it unasked for. Ran one helper at a time, so no speed-up. You see the lead's summary, not the work. |
| **Pick it when** | The job is a side job in the middle of your own work, and you want to follow along. | You'll run this exact job again and again, on batches, and its tools should stay narrow. |

## See it for yourself

Here is a much smaller run of the same idea: one job, add a `--shout` flag to a script and test it.
On the left, a lead sends it to a coder and a tester subagent. On the right, one agent loads two
skills and does it itself.

![Two Claude Code sessions side by side. Left: a lead sends the job to a coder and a tester subagent, $0.07 in 40 seconds. Right: one agent loads two skills and does it itself, $0.05 in 22 seconds.](/img/claude-code/skills-or-a-team-of-agents.png)

Both finished and both tests passed. Look at the lead's last line: "I didn't run the tests myself,
so that result comes from the tester's report." That's the understanding cost, in its own words.

## What I take from it

- For work like this, a single agent with skills does the job for about a third of the price.
- A team of subagents doesn't run in parallel unless you make it. Mine ran in a line.
- Three runs a side and one reviewer can't settle quality. The team's better tables are a lead for
  a bigger test, not a verdict.

What questions do you ask yourself when you're making a similar decision?
