---
title: 'Writing a Continuation Prompt Before You Start Fresh'
description: 'Before a long Claude Code session ends, have Claude write a continuation prompt into a file, so a clean new session starts from it instead of from a summary.'
slug: /generative-ai/claude-code-techniques/writing-a-continuation-prompt-before-you-start-fresh
kind: technique
usefulness: 4 # 1 to 5: how much a typical Claude Code user gets from it; the sidebar follows it
sidebar_position: 4.5
authors: [oeid]
tags: [claude-code, ai, productivity, context, sessions]
image: /img/claude-code/writing-a-continuation-prompt-before-you-start-fresh.png
draft: true
questions:
  - How do I pick up a long Claude Code session in a new one without losing where I was?
  - What should a continuation prompt for Claude Code include?
  - Should I resume a long Claude Code session or start a fresh one?
---

## What annoyed me

My long Claude Code sessions don't end cleanly. The context fills up, or I switch machines, or the
work simply runs past one sitting. Each way of carrying on had a catch:

- **Keep going in the same session.** When the context fills, Claude Code clears old tool output
  and then summarizes the conversation. The docs say your requests are kept but "detailed
  instructions from early in the conversation may be lost". The tool decides what survives.
- **Resume it.** `claude --continue` and `claude --resume` reopen the same conversation, history
  and all. That's the long, crowded session I wanted to get out of.
- **Start a new one and type "continue".** A new session starts with an empty context window. It
  has no idea what "continue" means, so I'd spend the start of every session explaining where we were.

## What I did about it

Before the session ends, commit, then ask Claude to write a **continuation prompt** into a file in
the repo. The file has to stand on its own: a clean new session that reads only that file should
know what we're doing, how far we got, and what to do next.

It covers six things:

1. **The end goal, and how we'll know it's met.** Not only the next task. Without the goal, the
   next session can finish the list and still miss the point.
2. **What's done.** One line each, with the proof.
3. **What's left, in order.** Each item marked when it's my call, so the new session asks instead
   of deciding.
4. **What to read first.** The plan, the design doc, the files that matter.
5. **Proof commands.** The checks that show the current state is good.
6. **Branch and commit.** Where the work sits, and whether it's pushed.

Then I start a clean session and point it at the file.

## Set it up

At the end of a long session, ask for it in plain words:

```text
Commit what we have. Then write a continuation prompt to
.claude/prompts/continue-<topic>.md. Make it self-contained: a new,
clean session will read only this file. Start with the end goal and
how we'll know it's met. Then what's done, what's left in order (mark
the ones that are my call), what to read first, the commands that
prove the current state, and the branch and commit. Commit the file.
```

This is the shape I ask for. Copy it and fill it in:

```markdown
# Continue: <topic>

Last updated <date>. <One line: where things stand.>

## Goal
<What finished looks like.> We'll know it's met when <a check anyone can run>.

## Read first
- <the plan or design doc>
- <the two or three files that matter>

## Done
- <item>: <how we know, e.g. the command that passes>

## Left, in order
1. <next step>
2. <step> (my call: <the question>)
3. <step>

## Proof commands
- `<command>`: <what green means>

## Where the work is
Branch `<branch>` at `<commit>`, <pushed or not pushed>.

## Start here
<The first thing the new session should do.>
```

To pick it up, start a new session with the file as the first prompt:

```bash
claude "Read .claude/prompts/continue-<topic>.md and do what Start here says."
```

Or, inside a session that's done with its old work, run `/clear` (it starts a new conversation
with empty context) and paste the prompt, the part in quotes.

If you'd rather stay in the session, `/compact` takes focus instructions (for example
`/compact focus on the API changes`), and a "Compact Instructions" section in `CLAUDE.md`
steers what it keeps. That helps, but the result is still a summary inside the old session, not a
file in git.

## What it looks like

<figure style={{maxWidth: '480px', margin: '0 auto 1.5rem'}}>
  <img src="/img/claude-code/writing-a-continuation-prompt-before-you-start-fresh.png" alt="A Claude Code session: Claude says it will add a technique once it finishes pushing four posts, and I say another technique is to do a continuation prompt. Earlier, closing out a long session, Claude notices the five open items are only in the design doc, not in the backlog where the next session will look, and adds them there." />
</figure>

The picture pairs two moments from one long session, a week apart. The second is the habit in
small: before stopping, Claude checked that the open work sat where the next session would
actually look.

Here is a real one, from this blog's own repo. I'd been building a gate for premium pages, and the
session was done for the day. This is the file from that session, trimmed and retyped (I cut the setup
details):

```markdown
# CONTINUE: premium gating. Live. Only the optional tail and a push remain.

Last updated 2026-06-02 (evening). The gate is deployed and verified live.
Read the architecture memory and the infrastructure skill for how it works.

## Where we are: done and live
- Setup: done, all verified.
- Dev matches prod: dev unlocks headlessly; its check passes.
- Deploy: live; the deployment check is all green.
5 commits on the feature branch, not pushed.

## What's left (your calls)
- Optional: un-draft the design page, then redeploy.
- Push the branch, and open a PR if wanted.
- Archive the finished tasks to the changelog.
- Optional hardening, deferred.

## Proof commands (all currently green)
- make validate-deployment
- make validate-dev-service-token
- make build-premium
- npm test in workers/access-gate (8 of 8)

## Current branch / commit
feat/premium-content-gating @ 5ba51a40 (not pushed).
```

The full file is 47 lines. Four things left, every one marked as my call, four commands that prove
the state, and the exact commit. A new session reading only that knows not to push or publish on
its own, and can check in a minute that nothing broke overnight.

It has no "start here" line, which is fine for this one: everything left was mine to decide. When
the next session has real work to do, the first step goes in.

When the next session's work is a run of rounds rather than one job, the same file can carry a
work queue where each item has its own "done when" check, ticked off with evidence as it goes.
That's a loop prompt, which has [its own page](/craft/generative-ai/claude-code-techniques/writing-a-loop-prompt-that-knows-when-to-stop).

## Why it works

- **You choose what survives.** A summary written when the context runs out keeps what the tool
  thinks matters. The continuation prompt keeps what you and Claude agreed matters, while the whole
  session is still in view.
- **It's a file in git.** It survives a closed terminal, a new branch and a different machine. A
  conversation doesn't travel with the repo; a committed file does.
- **The new session starts clean.** It gets a fresh context window with one short, accurate page in
  it, not the tail of a crowded one.
- **The goal comes first.** Stating what finished looks like, and how to check it, keeps the next
  session from mistaking "the list is empty" for "the work is done".
- **Your calls stay yours.** Marking which items need you means the new session asks instead of
  quietly deciding.

## In my own words

- "another technique is to do a continuation prompt" (October 2026), adding it to my list of
  techniques mid-session.

## Related

- [Writing a Loop Prompt That Knows When to Stop](/craft/generative-ai/claude-code-techniques/writing-a-loop-prompt-that-knows-when-to-stop):
  the same idea for work that runs in rounds.
- [Saving the Yeses in Claude's Memory](/craft/generative-ai/claude-code-techniques/saving-the-yeses-in-claude-memory):
  the other way I carry things from one session to the next.
- [Sending Side-Quests to a Fork](/craft/generative-ai/claude-code-techniques/sending-side-quests-to-a-fork):
  keeping a session lean so it lasts longer before you need a fresh one.
- [Claude Code Techniques](/craft/generative-ai/claude-code-techniques): the other pages in this set.
- This page goes with a post in my "How I Used Claude Today" series on LinkedIn.
