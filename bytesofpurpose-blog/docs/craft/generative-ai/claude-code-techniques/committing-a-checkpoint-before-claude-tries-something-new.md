---
title: 'Committing a Checkpoint Before Claude Tries Something New'
description: 'Before a rewrite or a risky refactor, have Claude commit the working state first, so a failed experiment costs one reset instead of a rebuild.'
slug: /generative-ai/claude-code-techniques/committing-a-checkpoint-before-claude-tries-something-new
kind: technique
usefulness: 4 # 1 to 5: how much a typical Claude Code user gets from it; the sidebar follows it
sidebar_position: 4.4
authors: [oeid]
tags: [claude-code, ai, productivity, claude-md, tenets, git]
image: /img/claude-code/committing-a-checkpoint-before-claude-tries-something-new.png
draft: true
questions:
  - Should I commit before letting Claude Code rewrite something?
  - Does Claude Code's rewind replace git commits?
  - How do I get Claude Code to commit a checkpoint on its own?
---

## What annoyed me

Claude Code is happy to start a rewrite on top of work that isn't committed. It works, so it's
tempting to try the better version right away. When the better version goes wrong halfway, there's
no clean point to go back to. The working state is mixed in with the half-finished new one, and
getting it back means re-deriving it.

I've had the habit for years when I'm the one typing. My portfolio repo has a commit from 2021
called "Checkpointing before applying grid layout". With Claude doing the typing, the habit slipped,
because nobody was in the habit of asking for it.

## What I did about it

I made it a tenet in my global `CLAUDE.md`, so Claude takes the checkpoint itself:

- before a rewrite, a risky refactor, or swapping a working approach for a different one, commit
  the current good state;
- if the folder isn't a git repo yet, run `git init` first and make that the first checkpoint;
- keep generated files and anything sensitive gitignored, so the checkpoint never commits them.

The rule came from a side project that wasn't in git yet. A big rework was about to start, and I
asked Claude to commit first and said this should be a standing rule. Claude ran `git init`,
gitignored the generated output, and committed the working state before touching anything. The
rework landed in the next two commits.

## Set it up

Add a section like this to `~/.claude/CLAUDE.md`. It follows the four rules from
[Giving Claude Engineering Tenets](/craft/generative-ai/claude-code-techniques/giving-claude-engineering-tenets):
the kind of mistake, what to do instead, the moment, and short.

```markdown
## Checkpoint before trying new things

Before a change that could lose work (a rewrite, a risky
refactor, swapping a working approach for a new one),
commit the current good state first, so there is a clean
point to return to.

- If the folder is not a git repo yet, `git init` and make
  that the first checkpoint.
- Keep generated or sensitive files gitignored, so a
  checkpoint never commits them.
- A checkpoint is cheap; re-deriving lost work is not.

(Me, <the date>: "<the line I typed when it went
wrong>", after <what happened>.)
```

Fill in the last line with your own moment. That is the part that tells you, months later, why
the rule is there.

## Doesn't rewind already do this?

Partly. Claude Code saves a checkpoint of the files it edits before each prompt you send. Press
`Esc` twice (with the prompt empty) or run `/rewind`, pick a prompt, and it can put the code, the
conversation, or both back to that point. That's great for "undo the last few turns".

The [checkpointing docs](https://code.claude.com/docs/en/checkpointing) are clear about what it
doesn't cover:

- **Files only a shell command changed.** Once Claude has edited a file with its own editing tools,
  rewind also undoes later shell changes to that file. A file that only shell commands touched
  isn't tracked at all.
- **Most subagent edits.** A subagent's edits to files Claude hadn't already edited stay put.
- **Changes from outside the session.** Your own edits and edits from other sessions running at
  the same time are normally not captured.
- **Time.** It keeps the 100 most recent checkpoints in a session, and the file snapshots are
  cleaned up about 30 days after the session last saved one, by default.

The docs end on the point this page is about: checkpoints are for quick recovery inside a session,
and they say to keep using git for permanent history. A commit doesn't care which tool made the
change, which session you're in, or how long ago it was.

## What it looks like

<figure style={{maxWidth: '480px', margin: '0 auto 1.5rem'}}>
  <img src="/img/claude-code/committing-a-checkpoint-before-claude-tries-something-new.png" alt="A Claude Code session: I ask whether we lost our changes and whether they are committed, Claude answers that both commits are fully intact in git, and 29 seconds later says it created a branch pointing at both commits, so they are safe" />
</figure>

This is from July 2026, a couple of months before I wrote the tenet down, and it's the clearest
case I have of why it matters.

Claude had fixed the centering of the board on my blog's homepage and committed it as two commits:
the fix (3 files) and the notes on how it works (1 file). Then the branch they were on got
shuffled. It was renamed, reset back to the main branch, and other work took over the checkout.
Later that day I asked the question in the picture.

Because the work was committed, git still had it. Claude found the two commits in git's record of
where each branch has pointed (the reflog), checked they held the whole fix, and put them on a new
branch. It told me they were safe 83 seconds after I asked. Then it rebased that branch onto the
main branch and checked every other branch for anything left behind. Nothing was.

Uncommitted edits have no such record. Git's history only tracks commits, so uncommitted work has
nothing to find it in.

## Why it works

- **A failed experiment costs one command.** With a checkpoint, going back is `git reset` or a new
  branch, not an afternoon of rebuilding.
- **Claude is told before it starts.** The rule is in the file every session loads, so the
  reminder is there at the start of every session, not only on the days I remember to ask.
- **It covers what rewind can't.** Shell commands, other sessions, and last month all show up in
  git.

## In my own words

- "Checkpointing before applying grid layout" (a commit of mine, February 2021)
- "lets commit our changes, then do the skill" (July 2026)
- "did we [lose] our changes? are they committed?" (July 2026)
- "we took over a branch ... lets make sure it didn't [lose] any changes ..." (July 2026)

## Related

- [Giving Claude Engineering Tenets](/craft/generative-ai/claude-code-techniques/giving-claude-engineering-tenets):
  the introduction to this set of tenet pages, and the four rules this one follows.
- [Sweeping Every Repo for Unpushed Work](/craft/generative-ai/claude-code-techniques/sweeping-every-repo-for-unpushed-work):
  the next step after a checkpoint, so committed work also leaves the laptop.
- [Claude Code Techniques](/craft/generative-ai/claude-code-techniques): the other pages in this set.
- This page goes with a post in my "How I Used Claude Today" series on LinkedIn.
