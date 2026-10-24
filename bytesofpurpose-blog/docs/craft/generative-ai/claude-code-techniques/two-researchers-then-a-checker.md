---
title: 'Two Researchers, Then a Checker'
description: 'When research decides what gets built, one agent''s answer is one opinion. Two fresh researchers and a checker who re-opens their sources turn it into evidence.'
slug: /generative-ai/claude-code-techniques/two-researchers-then-a-checker
kind: technique
usefulness: 3 # 1 to 5: how much a typical Claude Code user gets from it; the sidebar follows it
sidebar_position: 10.3
authors: [oeid]
tags: [claude-code, ai, productivity, claude-md, tenets, subagents, research]
image: /img/claude-code/two-researchers-then-a-checker.png
draft: true
questions:
  - How do I know whether to trust research a Claude Code agent did on the web?
  - Should I use a forked subagent or a fresh one for research?
  - How do I check an AI agent's research before I build on it?
---

## What annoyed me

When I ask Claude to research something on the web, the answer comes back sounding sure. A list
of picks, each with a reason, each with a number. It reads the same whether the agent opened the
page or only saw a line about it in a search result.

That's fine for trivia. It isn't fine when the answer decides what I build next. One agent's
research is one opinion, and I had no way to tell its solid claims from the ones it filled in.

## What I did about it

For research that decides something, I run it three times, in a set order:

1. **Two researchers, independently.** Two fresh agents get the same question and the same facts,
   at the same time. Neither may read the other's files. Each writes its raw findings, marking for
   every claim whether it opened the page or only saw a search snippet, and then its own
   recommendation.
2. **One checker, after both finish.** A third agent reads both write-ups. It re-opens the sources
   behind the claims that matter, marks where the two agree, where they disagree and which side the
   source supports, and what only one of them found. It writes the one document I act on.

Agreement between two passes that never saw each other is evidence. A claim only one of them found
isn't dropped and isn't trusted: it's flagged, and the checker goes and looks.

## Why fresh agents, not forks

Most of the time I send side work to a
[fork](/craft/generative-ai/claude-code-techniques/sending-side-quests-to-a-fork), a subagent that
starts with a copy of the whole conversation. That's exactly wrong here. Two forks share
everything I've said so far, including the direction I'm already leaning. They'd come back with
the same opinion twice, and their agreement would mean nothing.

A fresh agent starts blank. That costs a longer prompt, because you have to write the brief out in
full. It's worth it: the brief is the only thing the two share, so whatever they agree on came
from the sources, not from me.

## Set it up

Add a section like this to `~/.claude/CLAUDE.md`. It follows the four rules from
[Giving Claude Engineering Tenets](/craft/generative-ai/claude-code-techniques/giving-claude-engineering-tenets):
the kind of mistake, what to do instead, the moment, and short.

```markdown
## Research that decides something: two researchers, then a checker

When the answer to an open question will change what gets
built, and it comes from outside sources, don't trust one
pass.

- Start two fresh agents (not forks: a fork shares your
  framing) on the same question with the same facts, in
  parallel. Each writes its raw findings, marking every
  claim as "opened the page" or "search snippet only", and
  its own recommendation. Neither reads the other's files.
- After both finish, a third agent re-opens the sources
  behind the claims that matter, marks agree / disagree
  (and which side the source supports) / found by one
  only, and writes the one document to act on.
- Agreement between the two is evidence. A claim only one
  found, or that rests on a snippet, is flagged, not
  dropped or trusted.

(Me, <the date>: "<the line I typed when it went
wrong>", after <what happened>.)
```

Fill in the last line with your own moment. That is the part that tells you, months later, why
the rule is there.

## The three prompts

The rule tells Claude when to do it. These are what it sends. Write the brief once and paste it
into both researcher prompts word for word, so the only difference between the two runs is the
agent.

**Researcher A** (start it as a fresh agent, not a fork):

```text
You are one of two independent researchers. Another researcher is answering
the same question separately. Do not look for or read their files
(anything under research/<topic>/b/).

The question: <one sentence>.

The brief: <everything they need, written out in full: what it's for, what
"good" means, what to avoid, how the answer will be used>.

Write two files under research/<topic>/a/:
1. findings.md: every candidate you considered (aim for 10 to 14), what
   specifically supports it, and for EACH claim whether you opened the page
   yourself or only saw it in a search snippet. List your sources.
2. picks.md: your best 3 to 5, each with one line on why, and the concrete
   values behind it (sizes, colours, versions, prices), read from the source.

Only list a file or page as a source if you opened it. Measure under the
conditions the brief gives (window size, version, date), not your own.
If a tool refuses to write a file, stop and say so. Don't write it
another way.

Report back: your picks in one line each, and how many claims rest on a
snippet only.
```

**Researcher B** is the same prompt with `a` and `b` swapped. Same question, same brief, same
words. Start both in the same message so they run side by side.

**The checker** (also fresh, started only after both researchers report back):

```text
You are the checker after two independent researchers. Read both write-ups:
research/<topic>/a/ and research/<topic>/b/. Don't re-run either researcher.

1. For each proposed pick, re-open its source yourself and confirm or
   correct the values given for it.
2. Make a table: where A and B agree, where they disagree (and which side
   the source supports), and what only one of them found. Re-check every
   one-sided find yourself before you keep it.
3. Flag every claim that rests on a search snippet, and say whether any
   final pick depends on one.
4. Choose the final 3 to 5 picks and write research/<topic>/picks.md: the
   decision, the table, the flags, and anything good that neither
   researcher named.

Report back: the final picks, the agreements and disagreements, the flags,
and anything you could not check.
```

Keep all three write-ups. The checker's document is the one you act on, and the two research files
are the record it was built from.

## What it looks like

<figure style={{maxWidth: '480px', margin: '0 auto 1.5rem'}}>
  <img src="/img/claude-code/two-researchers-then-a-checker.png" alt="A Claude Code session: I ask whether we need another visual check against the reference websites, Claude starts two independent researchers, and after a third agent re-opens their sources, Claude reports that it confirmed five reference sites and open-source projects, four of them found by both researchers, with no wrong measurements" />
</figure>

This is from October 2026. I wanted the app where I plan this series to look less like a tidy
dashboard and more like a well-kept notebook, and I'd told Claude I was unimpressed with what we
had. The question was which websites and open-source apps to copy from, page by page: the sidebar,
the board, the tables, the calendar.

Claude started the two researchers and kept building while they worked. They came back about 14 minutes
later, half a minute apart. Each had looked at 13 candidates and picked 5. Their picks overlapped on
two, Observable Framework and Tufte CSS, and on those two they'd read the same values off the same
files without seeing each other's work, down to Observable's three colour codes and the 3px bar
that marks the current page. Claude didn't wait for the checker on that part. It started the
sidebar from the shape both had found.

The checker took 10 more minutes and re-opened all five final picks at their source:

- **Four of the five final picks were in both researchers' lists of 13**, though only two had made
  both their top fives. The fifth, a kanban board from Fizzy, only one of them found. The checker
  re-read all of its values itself before keeping it.
- **Three disagreements, each settled from the source.** One researcher picked GitHub's project
  board for the board page; the checker chose Fizzy, because GitHub's cards are boxed and its tags
  are many-coloured, but kept GitHub's small count beside each column. One picked a company's
  newsroom as a colour source; it was dropped for being nearly a copy of what I already had.
- **Every number either researcher gave matched its source.**
- **The snippets were flagged, and none was behind a pick.** One researcher had four claims it had
  only seen in a search result. The other had listed a set of design files it never opened, and had
  measured one site at a window width the brief didn't ask for.
- **It found things neither researcher named.** The typeface behind Tufte CSS, which it made the
  first thing to copy, and three wrong rows in my own list of reference sites from earlier.

One thing I tripped on. Both researchers hit a refusal when they tried to save their findings, and
both got around it by writing the file through the shell instead. They told me so, which is how I
know. The checker's prompt said to stop and report in that case, and it hit no refusal. Now all
three prompts say it.

## Why it works

- **Two passes that can't see each other are a measurement.** When they agree, it came from the
  sources. When they don't, you've found exactly the claim worth checking.
- **The snippet mark makes the weak claims visible.** An agent that has to say "I only saw this in
  a search result" can't make a guess look like a reading.
- **The checker reads sources, not opinions.** It doesn't pick a side because one write-up sounds
  better. It opens the page and sees which one was right.
- **It runs in the background.** The three agents took about 26 minutes, and Claude kept building
  the whole time.

## In my own words

- "did this whole process include review to make sure our hub feels premium? compared to the
  others" (October 2026)
- "what did our research show?" (October 2026)
- "do we need another visual check to look at the reference websites found … does it consider gh
  repos, etc" (October 2026)

## Related

- [Giving Claude Engineering Tenets](/craft/generative-ai/claude-code-techniques/giving-claude-engineering-tenets):
  the introduction to this set of tenet pages, and the four rules this one follows.
- [Sending Side-Quests to a Fork](/craft/generative-ai/claude-code-techniques/sending-side-quests-to-a-fork):
  the usual way I hand off work, and why this is the one case where a fork is the wrong choice.
- [Auditing the Plan Before You Build It](/craft/generative-ai/claude-code-techniques/auditing-the-plan-before-you-build-it):
  the same idea pointed inward: agents that check a plan's claims against the code before any is
  written.
- [Claude Code Techniques](/craft/generative-ai/claude-code-techniques): the other pages in this set.
- This page goes with a post in my "How I Used Claude Today" series on LinkedIn.
