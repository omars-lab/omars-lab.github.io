---
title: 'Writing the Design Before Plan Mode'
description: 'Have Claude Code write a design doc first, settle its open questions, then plan from it in plan mode and push back on the plan before any code is written.'
slug: /generative-ai/claude-code-techniques/writing-the-design-before-plan-mode
kind: technique
usefulness: 4 # 1 to 5: how much a typical Claude Code user gets from it; the sidebar follows it
sidebar_position: 5.5
authors: [oeid]
tags: [claude-code, ai, productivity, planning, design-docs]
image: /img/claude-code/writing-the-design-before-plan-mode.png
draft: true
questions:
  - How do I use plan mode in Claude Code for a bigger feature?
  - Should I write a design doc before asking Claude Code for a plan?
  - How do I push back on a Claude Code plan before it starts editing?
---

## What annoyed me

Plan mode is good at the how. Give it a one-line ask and it comes back with files, steps and
tests. But on a bigger feature, the one line never said what I actually wanted, so the plan
decided for me. Where the data comes from, what's in scope, what to do when two things clash: each
of those choices sat inside step 4 of a long plan, and I approved it without noticing.

Then the plan got built, and the reasons behind it lived nowhere. Plan files get random names
(mine have been called things like "sunny swinging avalanche") and sit in a plans folder, not next
to the code.

## What I did about it

I split it into three steps, and nothing gets edited until the last one is done.

1. **Design first.** Have Claude write a design doc: the goal, what's out of scope, how it fits
   what already exists, the options it weighed, and the open questions. No file-by-file steps yet.
   Then have it ask me the open questions as choices, and write my answers into the doc.
2. **Then plan mode, from the doc.** Switch to plan mode and tell Claude to plan the
   implementation of that design. The design says what and why. The plan says how.
3. **Then iterate on the plan.** Read the plan, say no to the first one if it needs it, and ask
   Claude whether following it would really build the design. Approve only when it holds up. If
   the plan finds a mistake in the design, fix the design too.

The design doc lives in the repo, so the next session, the next plan and the person reviewing the
code all read the same thing.

## What plan mode does

From the [permission modes docs](https://code.claude.com/docs/en/permission-modes#analyze-before-you-edit-with-plan-mode):

- **Turn it on** by pressing `Shift+Tab` until the status bar shows `⏸ plan mode on`, by starting
  a prompt with `/plan`, or by starting the session with `claude --permission-mode plan`.
- **In plan mode** Claude reads files and runs commands to explore, then writes a plan. It doesn't
  edit your code until you approve.
- **When the plan is ready**, Claude shows it and you pick: approve and let it work (in auto mode,
  or accepting edits), approve and review each edit yourself, or **No, keep planning** and say what
  to change. `Ctrl+G` opens the plan in your text editor so you can change it by hand.
- **Plans are saved** in `~/.claude/plans/`, or in the folder you set with `plansDirectory`. In my
  August sessions they landed in the repo's own `.claude/plans/` folder, so look there too.

One more thing I've seen in my own sessions: typing "enter plan mode and put together a plan" in an
ordinary prompt works too. Claude switches itself into plan mode and comes back with a plan to
approve.

## Set it up

### A design doc skeleton

Ask for these sections. They are the ones that kept my plans honest:

```markdown
# <Feature> design

## Goal
What this is for, in two or three sentences. Who uses it and when.

## Out of scope
What this deliberately does not do, so the plan doesn't drift into it.

## How it fits what exists
The data, files and screens it reads from or changes, and the patterns
already in the repo it should follow.

## The design
How it works, in plain words. A small diagram if it helps.

## Options weighed
Each real alternative, and why this one won.

## Decisions
Each open question, the answer, who made it and when.

## Open questions
Anything still undecided. The plan doesn't start while this has items in it.

## Build order
Rough stages, each one shippable on its own. No file-by-file steps here;
that's the plan's job.
```

### The prompts, in order

1. Write the design:

   ```text
   Write a design doc for <feature> at docs/<feature>-design.md, using these
   sections: <paste the skeleton>. Look at the code first, so "how it fits what
   exists" is true. No file-by-file steps yet.
   ```

2. Settle the open questions:

   ```text
   Give me a short summary of the design, then ask me each open question with
   the ask question tool (AskUserQuestion). Write each answer into the
   Decisions section.
   ```

3. Press `Shift+Tab` until plan mode is on, then:

   ```text
   Plan the implementation of docs/<feature>-design.md, starting with the first
   stage of the build order. The design is the source of truth: each step should
   say which part of the design it builds. Where the design is wrong or silent,
   say so instead of guessing.
   ```

4. When the plan comes back, pick **No, keep planning** and ask:

   ```text
   Audit the plan and find the gaps. Will following this plan result in a solid
   implementation of the design? Check its claims against the real data and the
   tests, not just the code.
   ```

5. Approve when it holds up. If the audit found a mistake in the design itself, have Claude fix
   the design doc before it starts on the code.

If you want this to be the default, a few lines in your `CLAUDE.md` do it:

```markdown
## Bigger features: design, then plan

For anything bigger than a small fix, write a design doc in docs/ first and
ask me its open questions before planning. Plan from the design, and say in
the plan which part of the design each step builds. When a plan turns up a
mistake in the design, fix the design doc too.
```

## What it looks like

<figure style={{maxWidth: '480px', margin: '0 auto 1.5rem'}}>
  <img src="/img/claude-code/writing-the-design-before-plan-mode.png" alt="A Claude Code session: I ask whether blog posts can go on my calendar and have a subagent create a design, then ask for a summary with questions to get decisions. Claude says all three decisions are in the design doc and it is ready for plan mode. After a plan I said no to, I ask it to audit the plan and whether following it would build the design, and Claude finds the plan would silently drop 12 posts off the calendar and that the design doc itself is wrong on that point." />
</figure>

This is from a real session in August. I keep a small dashboard for planning my LinkedIn posts,
and I wanted my blog posts on its calendar too, so I could see when a new one was worth a post.

**The design.** I had a subagent write the design doc. Then I asked for a summary with the open
questions as choices, and answered three: read the posts from my own copy of the blog only, keep
both kinds of blog post in one list, and make the "is this post still fresh" window a setting
instead of a fixed number. Claude wrote the answers into the doc and said it was ready for plan
mode.

**The first plan** covered stage one, the script that lists every blog post. I approved it as it
was.

**The second plan** covered the calendar. It came back at about 12,000 characters, and I said no
to it. I asked Claude to audit it: would following it really build the design?

The audit tested the plan against the real list of 137 posts, and found three things:

- **12 published posts would have vanished.** The plan treated a post as published only when its
  `draft` field said `false`. But 13 posts had no `draft` field at all, which on my blog means
  published, and 12 of them had real dates. The calendar would have shown 38 posts instead of 50,
  and nothing would have said so.
- **The design doc had the same mistake.** The plan had copied it faithfully from one line of the
  design. So the fix went into both.
- **"The tests still pass" proved nothing.** The page tests would have quietly read the live
  server instead of test data, and the test that clicks through the tabs had a fixed list that
  would never click the new one.

The revised plan, about 16,000 characters, fixed the rule, added a test with a post that has no
`draft` field (a test with only `draft: false` posts would pass against the broken code), and
made the check expect 50 posts on the calendar, since 38 means the bug is still there. I approved
it, and the design doc got its one-line fix during the build.

It doesn't always take a round. In a repo that builds slide decks, the design and one decision
came first, then I typed "then enter plan mode and put together an implemtnation plan", and I
approved the first plan it showed me. The design had already done the arguing.

## Why it works

- **The what gets settled before the how.** A design doc has room for the goal and the options.
  A plan is a list of steps, and a choice tucked inside a step is easy to approve without
  noticing.
- **The decisions come to me as questions.** Asking for the open questions as choices pulls them
  out of the doc and in front of me, one at a time.
- **The plan has something to be checked against.** "Is this a good plan?" is vague. "Will this
  plan build this design?" has an answer, and that question is what found the 12 missing posts.
- **Pushing back is cheap in plan mode.** Nothing has been edited yet, so saying no costs one more
  round of planning, not undoing a build.
- **The doc outlives the session.** The plan file has a random name in a plans folder. The design
  doc sits in the repo, with its decisions, for the next plan and the next person.

## In my own words

- "or spawn sub agent and have it create design" (August 2026)
- "present exec summary with questions to get decisions using ask question tool" (August 2026)
- "audit plan, determien gaps, see if it needs to be imporved" (August 2026)
- "… genreate a design.md, then tell [Claude] to enter plan mode and plan it … then iterate"
  (October 2026)

## Related

- [Auditing the Plan Before You Build It](/craft/generative-ai/claude-code-techniques/auditing-the-plan-before-you-build-it):
  a bigger version of step 3, with read-only agents checking each claim in the plan.
- [Telling Claude When to Stop and Ask](/craft/generative-ai/claude-code-techniques/telling-claude-when-to-stop-and-ask):
  how the open questions come back as clear choices.
- [Seeing the Options Before You Decide](/craft/generative-ai/claude-code-techniques/seeing-the-options-before-you-decide):
  for a design decision that's easier to make when you can see it.
- [Claude Code Techniques](/craft/generative-ai/claude-code-techniques): the other pages in this set.
- This page goes with a post in my "How I Used Claude Today" series on LinkedIn.
