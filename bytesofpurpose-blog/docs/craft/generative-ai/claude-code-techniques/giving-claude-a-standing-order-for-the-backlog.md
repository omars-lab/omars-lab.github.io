---
title: 'Giving Claude a Standing Order for the Backlog'
description: 'Give Claude a standing order for working through a backlog, so "continue" means the most value for the effort first, with no "which one next?".'
slug: /generative-ai/claude-code-techniques/giving-claude-a-standing-order-for-the-backlog
kind: technique
usefulness: 4 # 1 to 5: how much a typical Claude Code user gets from it; the sidebar follows it
sidebar_position: 4.6
authors: [oeid]
tags: [claude-code, ai, productivity, claude-md, tenets, prioritization]
image: /img/claude-code/giving-claude-a-standing-order-for-the-backlog.png
draft: true
questions:
  - How do I get Claude Code to pick the next task by itself?
  - What should Claude do when I just type "continue"?
  - How do I stop Claude from closing easy tasks while the important one waits?
---

## What annoyed me

"Continue" is one of the words I type most at Claude Code. One piece of work is done, there's a list of
open tasks, and I want the next useful thing to happen. Without a rule, Claude fills that word with
whatever order is easiest to see. Sometimes it asks me which one. Sometimes it takes the top of the
list.

In August I typed "continue in priority order". My tasks had no priority on them, so Claude used
the one order it could see: the task numbers. Task #55 was next because I'd thought of it before
#56. A task number says when an idea came up, not what it's worth.

There's an opposite failure too. When Claude does choose, it tends to choose what closes fast.
Ten small fixes feel like progress. Meanwhile the one piece of work the goal actually needs sits
untouched, because it's slower.

## What I did about it

I made it a tenet in my global `CLAUDE.md`: a standing order for the backlog. When I say
"continue" and haven't given an order, Claude takes the work by value for the effort and risk,
highest first. A quick win that finishes something half built comes before a big, risky new
thing. Claude says the ranking in one line, does the top item, ships it, and moves to the next. It
stops only at a real fork: a choice that's hard to undo, a change of scope, or money.

The second half is the guard against the opposite failure. Closing many cheap items isn't progress
while the work the goal needs waits. Before it picks, Claude looks at everything that's open, not
only the top of the list.

## Set it up

Add a section like this to `~/.claude/CLAUDE.md`. It follows the four rules from
[Giving Claude Engineering Tenets](/craft/generative-ai/claude-code-techniques/giving-claude-engineering-tenets):
the kind of mistake, what to do instead, the moment, and short.

```markdown
## "Continue" means highest value first

When I say "continue" and haven't given an order, take
the backlog by value for the effort and risk, highest
first.

- A quick win that finishes a half-built feature beats
  a big, risky new one, even if the new one is worth
  more in total.
- A small change that's easy to undo beats a rewrite
  that isn't.
- Say the ranking in one line, do the top item, ship
  it, and take the next. Don't ask which one.
- Stop only at a real fork: a choice that's hard to
  undo, a change of scope, or spend.

Closing many cheap items is not progress while the
work the goal needs waits. Look at everything that's
open before you pick. When the same small item keeps
coming back, fix where it comes from once.

(Me, <the date>: "<the line I typed when it went
wrong>", after <what happened>.)
```

Fill in the last line with your own moment. Mine is from September, in another project, the day
I asked Claude to keep going in order of value for the effort.

The one-line ranking is the part I'd keep if I could keep only one. A line like "finishing the
half-built export before starting the new importer, because the export is one fix from done" takes
two seconds to read, and if I disagree, one reply changes the order before any work is wasted.

## What it looks like

<figure style={{maxWidth: '480px', margin: '0 auto 1.5rem'}}>
  <img src="/img/claude-code/giving-claude-a-standing-order-for-the-backlog.png" alt="A Claude Code session: I type continue in priority order and Claude says priority order is task number order, so task 55 is next; eight weeks later, with the rule in my CLAUDE.md, I type continue and Claude says every approved technique now has a post, so it will check the backlog for the most valuable work it can do without my calls" />
</figure>

The top half is August, before the rule. Claude read "priority" as the task numbers and then
stopped to ask me three questions about #55 before building anything.

The bottom half is October, with the rule in place. Claude had just said the next batch of posts
was waiting on me, and I typed "continue" anyway. It didn't ask what I meant. It checked what was
open: every approved idea already had a post, and the search through my older sessions was done (78
of 79 read). So it picked the most valuable work it could do without me, the work that would
refill the list: a
helper agent to look through the last seven weeks of sessions for new ideas. About 80 seconds
after I typed "continue", the helper was running, and Claude's next message said what it had
started and why.

Half an hour later the helper came back with nine proposals. I approved all nine. They are the
tenet posts this page is one of.

I can't yet show you a session where the second half, the guard against cheap work, turned Claude
away from a pile of easy fixes. What I can say is that the bottom half above is the opposite of a
pile of easy fixes: with nothing approved left to write, Claude went for the slow work that kept
the series going.

## Why it works

- **"Continue" gets a meaning.** Without a rule, Claude fills the word with the order that's
  easiest to see: task numbers, the top of a file. With one, it fills it with yours.
- **The ranking is said out loud.** One line of "this before that, because" lets you fix the order
  in one reply, before the work is done, instead of finding out after.
- **It knows where to stop.** The list of forks is short and specific, so the rest of the time it
  keeps going instead of checking in.
- **The guard keeps the ranking honest.** Ranking by effort alone drifts to the cheapest items.
  The second half makes Claude weigh what the goal needs, not only what closes fast.

## In my own words

- "continue in priority order" (August 2026)
- "continue" (October 2026)

## Related

- [Giving Claude Engineering Tenets](/craft/generative-ai/claude-code-techniques/giving-claude-engineering-tenets):
  the introduction to this set of tenet pages, and the four rules this one follows.
- [Telling Claude When Not to Ask](/craft/generative-ai/claude-code-techniques/telling-claude-when-not-to-ask):
  that tenet says which questions to skip, "what's next?" among them; this one says how Claude
  picks the answer itself.
- [Writing a Loop Prompt That Knows When to Stop](/craft/generative-ai/claude-code-techniques/writing-a-loop-prompt-that-knows-when-to-stop):
  a loop prompt sets the test and the stopping point for one repeated job you start on purpose;
  this tenet is the standing default for every bare "continue", in every repo.
- [Claude Code Techniques](/craft/generative-ai/claude-code-techniques): the other pages in this set.
- This page goes with a post in my "How I Used Claude Today" series on LinkedIn.
