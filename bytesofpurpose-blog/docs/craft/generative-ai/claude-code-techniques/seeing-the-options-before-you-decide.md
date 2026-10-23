---
title: 'Seeing the Options Before You Decide'
description: 'Claude Code laid out design choices as long paragraphs. Now it draws them as a page first, and drawing them catches the number that changes the decision.'
slug: /generative-ai/claude-code-techniques/seeing-the-options-before-you-decide
kind: technique
usefulness: 4 # 1 to 5: how much a typical Claude Code user gets from it; the sidebar follows it
sidebar_position: 6
authors: [oeid]
tags: [claude-code, ai, productivity, decision-making]
image: /img/claude-code/seeing-the-options-before-you-decide.png
draft: true
questions:
  - How do I make a design decision with Claude Code without reading a wall of text?
  - How do I get Claude to check its assumptions before I pick an option?
---

## What annoyed me

When a build reached a real choice, Claude Code wrote the options out as paragraphs. Option A does
this, option B does that, here is what I'd pick. Six choices in, I'd be scrolling up and down a long
reply, trying to hold them all in my head.

The worse part was what the paragraphs hid. Each option leaned on numbers nobody had checked: how
many rows a change would touch, how often a case came up. In prose, a guess reads just like a fact,
and it's easy to pick an option that rests on one.

## What I did about it

Before I decide anything, I ask Claude to draw the choices as a page: one card per decision, the
problem it solves, the options side by side, what each one costs, and which one it recommends. I
look at that page, not the chat.

Building the page turned out to matter more than reading it. To fill in "what this costs," Claude
has to put a real number in the box, so it goes and measures. That measuring is where the wrong
guesses turn up, before I've chosen anything. Then I take the decisions one at a time, and each
answer gets written down where the work is tracked.

## Set it up

Add a section like this to your `CLAUDE.md` (the file Claude Code reads at the start of every
session, either in your home folder for all projects or at the root of one project):

```markdown
## Decide from a rendered comparison

When a choice has real consequences (a design, a layout, a change of scope,
anything hard to undo), don't lay the options out as paragraphs.

- First draw them as a page I can look at (an HTML file or an artifact): one
  card per decision, what problem it solves, the options side by side, and for
  each one what it gets me, what it costs, and what it commits me to.
- Every number on that page is measured, not guessed. If filling in a box
  needs a count, go and count it. If a measurement changes which decisions
  matter, say so at the top.
- Then ask me one decision at a time with the AskUserQuestion tool, the
  recommended option first.
- Write each answer and its reason into the plan or decision doc, and update
  the page as decisions land, so it always shows where things stand.
```

## What it looks like

<figure style={{maxWidth: '480px', margin: '0 auto 1.5rem'}}>
  <img src="/img/claude-code/seeing-the-options-before-you-decide.png" alt="A Claude Code session: I ask Claude to present the options visually, and it replies that it has built a page with six decisions, and that while writing it found the feature it was deciding about currently does nothing, because none of 208 rows had the tag it checks" />
</figure>

This is from a real session in August. I had just built a check that stops a post from being
published when the project it came from is private. Six questions were still open about how that
check should behave, so I typed one line: present options visually in artifact.

Claude built the page: six decisions, each with two or three options, a recommendation, and what
each one costs. While filling it in, it counted the rows the check would look at: one per Claude
chat a post could be drafted from. None of the 208 had a project tag. So the check I had just
built never fired for anything, and every post went through the ordinary button as if it weren't
there.

That one count reordered the page. Two of the six decisions became the ones that mattered: what an
untagged chat should mean, and how 208 chats get tagged. The other four could wait. I'd have spent
my time on the wrong four if I'd been reading options in chat.

The page also showed me which questions were badly put. One card asked "What should unfiled
content mean?" and I couldn't tell why it mattered, so I said so, and Claude rewrote it in plain
words. That time I typed my answers in the chat. Claude wrote the answered ones into the
plan file and replaced their cards on the page, so the page always showed what was still open. My
rule now sends each decision through the question tool instead, so the answers are easy to pull
back out of the session later.

## Why it works

- **You compare, not remember.** Options side by side on one page are easier to weigh than the
  same options spread through a long reply.
- **A box with a number in it forces a measurement.** Prose can say "a few rows." A table cell
  that says "rows affected" needs a count, and counting is where the wrong guess shows up.
- **The page shows which decisions matter.** One measured number can make two decisions urgent
  and four of them wait. That reordering is the real value, and it happens before you choose.
- **The record outlives the chat.** Each decision lands in the plan with its reason, so the next
  session starts from it instead of asking again.

## In my own words

- "present options visually in artifact" (August 2026)
- "also are we updating artifact as we rework and make decisions" (August 2026)

## Related

- [Telling Claude When to Stop and Ask](/craft/generative-ai/claude-code-techniques/telling-claude-when-to-stop-and-ask):
  the question tool these decisions go through.
- [Claude Code Techniques](/craft/generative-ai/claude-code-techniques): the other pages in this set.
- This page goes with a post in my "How I Used Claude Today" series on LinkedIn.
