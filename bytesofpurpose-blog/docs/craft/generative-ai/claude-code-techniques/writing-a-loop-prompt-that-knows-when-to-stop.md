---
title: 'Writing a Loop Prompt That Knows When to Stop'
description: 'Before you run /loop, write the prompt it repeats: the test for what counts, what one round does, which file holds the progress, and when to hand back.'
slug: /generative-ai/claude-code-techniques/writing-a-loop-prompt-that-knows-when-to-stop
kind: technique
usefulness: 3 # 1 to 5: how much a typical Claude Code user gets from it; the sidebar follows it
sidebar_position: 12.7
authors: [oeid]
tags: [claude-code, ai, productivity, loops]
image: /img/claude-code/writing-a-loop-prompt-that-knows-when-to-stop.png
draft: true
questions:
  - How do I write a good prompt for /loop in Claude Code?
  - How does a /loop with no interval decide when to run again and when to stop?
  - How do I keep a long Claude Code loop from losing its place?
---

## What annoyed me

I wanted Claude to work through a pile of old sessions and pull out ten techniques worth writing
about. That's a loop: take a few, judge them, write down the good ones, repeat. But a loop repeats
whatever prompt you give it. A vague prompt gets you a vague pass, run over and over, and a loop
that never knows when it's done.

## What I did about it

Get the prompt ready before the loop starts. Four things go in it:

1. **The test for what counts.** Write it down where Claude can read it, and try it on a couple of
   cases first. Mine was a short rubric for what makes a technique worth a post.
2. **What one round does.** How many items, from where, and where each result goes.
3. **Which file holds the progress.** Not the conversation. A file Claude marks as it goes, so the
   next round, or the next session, knows what's left.
4. **When to stop and hand back.** The list is empty, or a batch is ready for you, or something
   needs your call.

The first two I got right. The third I missed, and it showed up a day later.

## Set it up

### 1. Try the rubric on two cases

Before my loop ran, Claude tried the rubric on two candidates from a first round we'd done by
hand. One failed: it was a script's write behavior, not something a person does differently. One
passed: sending a side quest to a fork. Two cases took a minute, and they showed the rubric could
tell a technique from plumbing before I trusted it to run without me.

### 2. Write the prompt

A template:

```text
/loop take the next <N> unread items from <the progress file>.
Judge each one against <the test, in a file Claude can read>.
Add the ones that pass to <the results file> as "proposed".
List the near misses there too, instead of dropping them.
Mark every item read in <the progress file>,
even when it found nothing.
Stop when <a batch is ready for me | nothing is left unread>.
Never <the one call that stays mine>.
```

Two lines in there come from mistakes:

- **"Mark every item read, even when it found nothing."** Without it, the only record of what was
  checked is Claude's memory of the conversation.
- **"Add them as proposed."** My loop wrote its picks under a heading called "Confirmed". That
  read like I had said yes, and I hadn't. Name the label so a pick from the loop never looks like
  your decision.

### 3. Pick how it runs

These come from the
[Claude Code docs](https://code.claude.com/docs/en/scheduled-tasks#run-a-prompt-repeatedly-with-%2Floop),
not from memory:

- **`/loop 10m <prompt>`** runs on a fixed schedule. Ask Claude to cancel it when you're done;
  `Esc` doesn't stop this kind. It ends on its own after seven days.
- **`/loop <prompt>`** with no interval lets Claude pick the wait after each round, anywhere from
  one minute to one hour, and print why. It can also end the loop itself when the work is done.
  `Esc` stops it while it waits.
- **A self-paced loop isn't brought back** when you resume the session later. You run `/loop`
  again, which is one more reason the progress has to live in a file.

If the work has an end state you can check, like "every test passes", look at
[`/goal`](https://code.claude.com/docs/en/goal) too. It keeps going turn after turn until a
separate model agrees the condition holds.

## What it looks like

<figure style={{maxWidth: '480px', margin: '0 auto 1.5rem'}}>
  <img src="/img/claude-code/writing-a-loop-prompt-that-knows-when-to-stop.png" alt="A Claude Code session: Claude test-runs my taste rubric on two candidates before trusting it to run unattended, then I start a loop that reviews the next batch of transcripts, scores each candidate against my taste rubric, logs confirmed ones toward 10, and flags near misses. Claude stops the loop after one pass, not because it is out of work, 82 of 92 sessions still unread, but because the rubric leaves the final cut to me. Later, Claude admits the 82 of 92 figure lived only in the conversation's memory and was not written anywhere in the repo." />
</figure>

That's the loop I ran, in the repo behind the app where I plan this series. Claude drafted the prompt from what I
had asked for, and I ran it. One honest note: it looped once. The first round found 9 candidates
and 1 near miss, then Claude stopped the loop itself. It wasn't out of work. The rubric said the
final cut was mine, and piling up more picks before I'd looked wasn't useful. I corrected two of
the nine, and one turned out to be a bug that reading the docs would have fixed, not a technique.

The stop was right. The gap came the next day, when I asked how we'd carry on. Claude had said
82 of 92 sessions were still unread, but that count lived only in the conversation. Nothing on
disk said which sessions it had read. So we added a scan log: a file with one row per session it
has read, and a command that hands out the next unread batch. Rebuilt from what it could actually
point to, the honest count was 4 of 92 read, not 10.

The later rounds read from that log. When the pile was done, I had approved 20 techniques, against
a goal of 10.

Here's the prompt I'd write now:

```text
/loop take the next 5 unread sessions from the scan log,
score each candidate move against my taste rubric,
add the ones that pass to the candidates file as "proposed",
list near misses there instead of dropping them,
and mark every session read in the scan log,
even when it found nothing.
Stop when 10 candidates are waiting for my review
or nothing is left unread.
Never mark a candidate approved.
```

## Why it works

- **The test is settled before the loop runs.** Each round applies a rule you already checked,
  instead of inventing one as it goes.
- **Progress survives the session.** A file says what's left, so a compacted conversation, a new
  session or a resumed one picks up in the right place.
- **It stops at your call, not at the end of the pile.** The loop does the reading; the choices
  come back to you in batches you can actually review.

## In my own words

- "see if we need a loop to work backwards from this and iterate until we reach 10 really
  meaningful techniques" (August 2026)
- "I want the loop to drive this as we review transcripts and discover new mechanisms" (August
  2026)
- "do we have a plan to continue scanning transcripts and consolidating techniques?" (August 2026)

## Related

- [Telling Claude When to Stop and Ask](/craft/generative-ai/claude-code-techniques/telling-claude-when-to-stop-and-ask):
  the same idea outside a loop. Name the moments that come back to you.
- [A Skill That Can't Approve Its Own Work](/craft/generative-ai/claude-code-techniques/a-skill-that-cannot-approve-its-own-work):
  why the loop writes "proposed" and never "approved".
- [Citing the Session, Not a Memory](/craft/generative-ai/claude-code-techniques/citing-the-session-not-a-memory):
  the same lesson about memory, for the evidence behind each pick.
- [Claude Code Techniques](/craft/generative-ai/claude-code-techniques): the other pages in this set.
- This page goes with a post in my "How I Used Claude Today" series on LinkedIn.
