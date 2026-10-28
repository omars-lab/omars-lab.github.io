---
title: 'Writing the Pivot Down in the Repo'
description: 'When a problem forces Claude to change approach, have it write up what was tried and why it changed in a file in the repo, so nobody tries the dead end again.'
slug: /generative-ai/claude-code-techniques/writing-the-pivot-down-in-the-repo
kind: technique
usefulness: 3 # 1 to 5: how much a typical Claude Code user gets from it; the sidebar follows it
sidebar_position: 7.7
authors: [oeid]
tags: [claude-code, ai, productivity, claude-md, tenets, documentation]
image: /img/claude-code/writing-the-pivot-down-in-the-repo.png
draft: true
questions:
  - How do I keep a record of why Claude Code changed approach?
  - Where should Claude write down a dead end so the next session doesn't try it again?
  - What's the difference between Claude's memory and a note in the repo?
---

## What annoyed me

Some of the most useful things Claude finds out are dead ends. The first fix didn't work. The
signal everyone trusted turned out to be wrong. The obvious approach broke for a reason that took
an hour to find. Then Claude changes approach, the code ends up looking a little odd, and the
reason for the odd shape lives only in that one conversation.

A week later, a new session looks at the code, sees the odd shape, and has a good idea: why not do
it the obvious way? That's the dead end, being tried again. Claude's memory doesn't help much
here. It lives on one machine, for one person. A reviewer reading the pull request never sees it,
and nor does my other laptop.

## What I did about it

I made it a tenet in my global `CLAUDE.md`. When a problem forces a change of approach, Claude
writes it up as a file in the repo, in `docs/issues/`, one file per issue:

- what the problem looked like;
- what was tried;
- what the evidence showed;
- why the approach changed;
- what replaced it.

It started small. In September, Claude and I hit a problem I wanted on record, and I typed one
line asking for it to be written up in `docs/issues/`. The repo had no such folder. Claude made
it, wrote a short index saying what belongs there, wrote the first issue file and committed both,
in under a minute. The next day, in a different project, I turned that into a standing rule.

## Set it up

Add a section like this to `~/.claude/CLAUDE.md`. It follows the four rules from
[Giving Claude Engineering Tenets](/craft/generative-ai/claude-code-techniques/giving-claude-engineering-tenets):
the kind of mistake, what to do instead, the moment, and short.

```markdown
## Document the pivots

When a problem forces a change of approach (a signal
turns out unreliable, an assumption breaks, a design has
to be reworked), write it up in `docs/issues/<slug>.md`
in the repo, not only in memory.

- Say what was tried, what the evidence showed, why the
  approach changed and what replaced it.
- One file per issue, so a future session or a reviewer
  can find it and never re-explore the dead end.
- Memory is for recall across sessions; the issue file
  ships with the code.

(Me, <the date>: "<the line I typed when it went
wrong>", after <what happened>.)
```

Fill in the last line with your own moment.

The issue file itself can be short. This is the shape I use:

```markdown
# <What went wrong, in a few words>

<Date>. Status: <open / fixed in <commit>>.

## What happened
The symptom, as you first saw it.

## What was tried
Each approach, and what it did.

## What the evidence showed
The measurement or the log line that settled it.

## Why the approach changed
The one sentence a future reader needs most.

## What replaced it
The fix, with the commit or the file it lives in.
```

The heading that earns its place most often is "What was tried". It's the one a new session can't
work out by reading the code, because the code only shows what survived.

## What it looks like

<figure style={{maxWidth: '480px', margin: '0 auto 1.5rem'}}>
  <img src="/img/claude-code/writing-the-pivot-down-in-the-repo.png" alt="A Claude Code session: Claude says my approvals are recorded and an evidence gap is closed, and I ask it to track an incident as an issue in docs/issues, Claude says there is no docs/issues folder yet so it will create one with a short index and the incident file, and seven weeks later, on a different fix, Claude says it is writing that fix up in docs/issues while the tests run, as the repo rules ask" />
</figure>

The top half is September: my one line, and Claude making the folder for it. The bottom half is
seven weeks later, and it's the part I care about. Nobody asked. Claude was waiting on a test run,
and it used the time to write up the change it had just made, because the rule told it to.

That write-up is a good example of why the "What was tried" heading matters. A check that makes
sure a quote really sits on the line of a session it cites failed on two quotes I knew were real.
The session had moved between two of my machines partway through, and the check was reading the
copy that stopped at line 1,788 of 5,300. The first idea, refreshing that copy, changed nothing,
and the file says so. The fix was to read the longest copy of a session. The file also notes the
thing worth remembering: the record says where a session was first seen, not where it ended.

There are five of these files across two of my repos now. The others cover a port number that
broke in a second checkout of the same repo, and two problems with a tool that loads encrypted
settings, one where a newer version quietly changed where it kept its key. Each lists the fixes
that were tried and dropped, next to the one that stayed.

I can't yet show you a session that read one of these and turned away from a dead end. What I can
say is that each file now holds the one fact a new session would most likely get wrong.

## Why it works

- **It ships with the code.** The file is in the same commit as the change, so a reviewer sees it,
  every machine has it, and anyone who clones the repo can read it.
- **It's written while the evidence is fresh.** The log line, the count, the failed first try:
  all still on screen when Claude writes it.
- **It answers the question the code raises.** When a new session asks "why not the obvious way?",
  the answer is a file away, not in a conversation that has already gone.

## In my own words

- "track incident as an issue in issues doc in docs/issues/...md" (September 2026)

## Related

- [Giving Claude Engineering Tenets](/craft/generative-ai/claude-code-techniques/giving-claude-engineering-tenets):
  the introduction to this set of tenet pages, and the four rules this one follows.
- [Writing a Continuation Prompt Before You Start Fresh](/craft/generative-ai/claude-code-techniques/writing-a-continuation-prompt-before-you-start-fresh):
  a continuation prompt says where the work stands for the next session and is done once that
  session starts; a pivot record says why the code looks the way it does, and stays for as long as
  the code does.
- [Saving the Yeses in Claude's Memory](/craft/generative-ai/claude-code-techniques/saving-the-yeses-in-claude-memory):
  memory is for what you want Claude to recall on your machine; a pivot record is for anyone who
  reads the repo, reviewers included.
- [Claude Code Techniques](/craft/generative-ai/claude-code-techniques): the other pages in this set.
- This page goes with a post in my "How I Used Claude Today" series on LinkedIn.
