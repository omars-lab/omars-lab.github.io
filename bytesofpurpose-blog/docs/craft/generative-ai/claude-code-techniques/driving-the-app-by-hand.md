---
title: 'Driving the App by Hand'
description: 'When a step has no command, let Claude click through the app itself, with a screenshot before and after every click, so it never presses blind.'
slug: /generative-ai/claude-code-techniques/driving-the-app-by-hand
kind: technique
usefulness: 3 # 1 to 5: how much a typical Claude Code user gets from it; the sidebar follows it
sidebar_position: 13.7
authors: [oeid]
tags: [claude-code, ai, productivity, claude-md, tenets, computer-use]
image: /img/claude-code/driving-the-app-by-hand.png
draft: true
questions:
  - How do I get Claude Code past a step that has no command, like a first-run dialog?
  - How do I stop Claude Code from clicking blind when it drives an app?
  - What goes wrong when Claude Code clicks by screen position on a Mac?
---

## What annoyed me

Most of what I ask Claude to do has a command behind it. A few steps don't. An app asks "do you
trust this folder?" the first time it opens. A file picker wants a click. An app's own menu is the
only way to switch what it has open. Claude would stop there and hand the step back to me, or try
to script around it and get it wrong.

Letting Claude click through the app itself fixed the first problem and made a new one. A click
sent to a spot on the screen lands wherever that spot is now. The button may have moved. A pop-up
may be sitting on top of it. The app may have opened something other than what we meant. A click
sent blind reports success either way.

## What I did about it

I made it a tenet in my global `CLAUDE.md`: when a step has no scripted path, Claude drives the
app by hand, and it takes a screenshot before and after every click. It looks first to find the
target, clicks, then looks again to see what actually happened. It never presses blind.

The tenet also keeps a list of the traps we hit, with an example for each, so the next session
doesn't hit them again. The moment behind it was a native app I can't show here. In one session
the screenshots caught five things in a row: an error saying the folder wasn't found, the app's
settings living in a different place than expected, the app holding on to old settings until it
was quit and reopened, a button the system didn't see as a button, and a permission prompt that
popped up over the target. Then the run against the real folder caught a bug that the test
folder had hidden.

## Set it up

Add a section like this to `~/.claude/CLAUDE.md`. It follows the four rules from
[Giving Claude Engineering Tenets](/craft/generative-ai/claude-code-techniques/giving-claude-engineering-tenets):
the kind of mistake, what to do instead, the moment, and short.

```markdown
## Drive the app by hand when there's no command

When a step has no scripted path (a first-run dialog,
a file picker, an app's own menu), drive the app
yourself. Never click blind.

- Bring the app to the front, then act.
- Take a screenshot before AND after every click: find
  the target, click, check what actually happened.
- Write down each trap you hit, with an example:
  - a high-resolution screen counts positions twice
    over, so convert before you click;
  - some buttons aren't seen by the system as
    buttons, so click them by position;
  - a permission prompt can pop up over your target;
  - an app may keep its old settings until you quit
    and reopen it.

(Me, <the date>: "<the line I typed when it went
wrong>", after <what happened>.)
```

Fill in the last line with your own moment. Mine is from the app above, and it's the line that
tells me why the rule is there.

On a Mac, Claude can bring an app forward and press keys with `osascript` (the built-in tool for
scripting apps), click a spot with a small tool like `cliclick`, and take the screenshot with
`screencapture`. In a browser, Claude Code's browser tools click and take screenshots for you.
The habit is the same either way.

## What it looks like

<figure style={{maxWidth: '480px', margin: '0 auto 1.5rem'}}>
  <img src="/img/claude-code/driving-the-app-by-hand.png" alt="A Claude Code session: I ask for a count of the chats assigned to each project and a warning before ignoring a project that still has some; seven minutes later Claude says one project is selected with 2 chats assigned and clicking Ignore should bring up the warning; then it says the warning shows that 1 of these still holds 2 chats, and it will cancel without changing anything" />
</figure>

This is from August 2026, in a browser rather than a native app, because it's a session I can
show. I keep a page that sorts my Claude chats into projects. I asked for a count of the chats in
each project, and a warning before I ignore a project that still has some.

Claude built it, then clicked through it the way I would, with a screenshot after each step. It
fixed the layout until every column fit on the screen. Then it picked a
project with 2 chats, checked the screenshot to make sure that project was really selected, and
only then clicked Ignore. The next screenshot showed the warning, "1 of these still hold 2
chat/artifacts". So it cancelled instead of going through with it. Every click had a look
before it and a look after, and the one press that would have changed something never happened.

## How it differs from looking at the page

[Looking at the Page Before Reading the CSS](/craft/generative-ai/claude-code-techniques/looking-at-the-page-before-reading-the-css)
and [Looking at the Source, Not the Score](/craft/generative-ai/claude-code-techniques/looking-at-the-source-not-the-score)
both say look once, before you reason. This one says look around every action, because the action
itself can land somewhere you didn't mean. The two screenshots bracket each click the same way
[a log line before and after a call that can hang](/craft/generative-ai/claude-code-techniques/giving-long-scripts-logs-you-can-grep)
brackets that call: when something goes wrong, you know exactly which step did it.

## Why it works

- **A click can't tell you where it landed.** The click "works" whether it hit the button, the
  pop-up on top of it, or empty space. Only a look afterwards can tell.
- **The look before is what makes the click safe.** It's where a moved button or a prompt in the
  way shows up, before anything is pressed.
- **The traps are the same every time.** Screen scaling, buttons that aren't real buttons,
  permission prompts and cached settings come back in every app. Writing them down once saves the
  next session the afternoon.

## In my own words

- "we should show how many artifacts … are currently assigned to project / possible warning if
  ignoring project with assigned artifacts" (August 2026, spelling fixed)

## Related

- [Giving Claude Engineering Tenets](/craft/generative-ai/claude-code-techniques/giving-claude-engineering-tenets):
  the introduction to this set of tenet pages, and the four rules this one follows.
- [Looking at the Page Before Reading the CSS](/craft/generative-ai/claude-code-techniques/looking-at-the-page-before-reading-the-css):
  look at the page once before reasoning about a UI bug.
- [Looking at the Source, Not the Score](/craft/generative-ai/claude-code-techniques/looking-at-the-source-not-the-score):
  the same habit for data, where the number is what lies.
- [Giving Long Scripts Logs You Can Grep](/craft/generative-ai/claude-code-techniques/giving-long-scripts-logs-you-can-grep):
  a line before and after each risky call, the way a screenshot pair brackets each click.
- [Claude Code Techniques](/craft/generative-ai/claude-code-techniques): the other pages in this set.
- This page goes with a post in my "How I Used Claude Today" series on LinkedIn.
