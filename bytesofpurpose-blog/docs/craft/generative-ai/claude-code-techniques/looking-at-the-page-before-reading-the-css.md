---
title: 'Looking at the Page Before Reading the CSS'
description: 'When a page looks wrong, have Claude Code open it and look before it reads the stylesheet. The rule, the browser setup, and the bug that taught me.'
slug: /generative-ai/claude-code-techniques/looking-at-the-page-before-reading-the-css
kind: technique
usefulness: 4 # 1 to 5: how much a typical Claude Code user gets from it; the sidebar follows it
sidebar_position: 5
authors: [oeid]
tags: [claude-code, ai, productivity, css, debugging]
image: /img/claude-code/looking-at-the-page-before-reading-the-css.png
draft: true
questions:
  - Why does Claude Code keep failing to fix a layout bug in my web app?
  - How do I get Claude Code to check what a page really looks like?
---

## What annoyed me

A table in one of my web apps had text spilling out of one column into the next. I sent Claude
Code a screenshot. Then another, "still see rendering issue". Then a third, "also still seeing
tight text".

Each time, Claude read the stylesheet, worked out a theory, and changed a rule. One theory was that
a width limit on a table cell gets ignored. Another was to switch the table to fixed column widths.
It even fetched the CSS from the dev server to prove the fix was being served. None of the three
fixes worked, and I was the one checking each of them.

## What I did about it

I made it a rule: for a UI bug, **look at the real page first, then read the code**. Open it in a
browser, take a screenshot, scroll it (sideways too), and check which style actually won. Reading
CSS tells you what the author meant. Only the browser tells you what happened.

When Claude finally opened the page itself, it found the cause in about a minute. Its very first
fix had been right in spirit: turn wrapping back on for that column. But a more specific rule
elsewhere, `.table-scroll td { white-space: nowrap }`, beat it, so the fix never applied. No amount
of re-reading would have shown that as fast as one look did.

## Set it up

Add a section like this to your `CLAUDE.md` (the file Claude Code reads at the start of every
session):

```markdown
## UI bugs

Look at the actual render before reasoning from source. Open the page in the
browser, take a screenshot, scroll it (including sideways), and check the
computed style of the element that looks wrong. A look settles in seconds what
reading CSS and component code only guesses at. After a fix, look again before
saying it is done.
```

Then give Claude a browser it can drive. Two options:

- **Claude in Chrome**, the browser extension, which lets Claude Code open tabs, take screenshots
  and scroll in your own Chrome.
- **A browser MCP server**, such as Playwright's:

```bash
claude mcp add playwright -- npx @playwright/mcp@latest
```

When the bug is "my style isn't applying", the fastest check is the computed style. Claude can run
this in the page through its browser tool:

```js
// Which value did the browser actually use?
const el = document.querySelector('.your-column-class');
getComputedStyle(el).whiteSpace; // "nowrap" here means another rule won
```

If the value isn't the one your rule sets, some other rule is winning, and that rule is the bug.

## What it looks like

<figure style={{maxWidth: '480px', margin: '0 auto 1.5rem'}}>
  <img src="/img/claude-code/looking-at-the-page-before-reading-the-css.png" alt="A Claude Code session: Claude says it found the rule that keeps table text from wrapping, and I say I am still seeing tight text; Claude says its CSS fix is being served and blames how tables size cells; the next evening Claude opens the page itself and finds a more specific nowrap rule beating its fix" />
</figure>

The top half is the old way. I report the bug again, and Claude answers with a new theory about
how browsers size table columns. The bottom half is the next evening, after Claude opened the page
in a browser and scrolled to the broken row. It named the real cause straight away: two rules
fighting, and the wrong one winning.

## The next morning

The same rule struck again the next day, on a different table. Claude added a new column to it,
and this time it looked before calling the work done.

It opened the page, scrolled down, then scrolled right, and found the columns there but pushed off
screen by one cell that wouldn't wrap. The same `nowrap` rule was
winning again. One fix, a reload to check, and "all columns fit within the viewport". About four
minutes from the first look to the check, and I didn't send a single screenshot.

The first bug took three failed fixes over about a day. The second took one.

## Why it works

- **The browser is the only thing that knows which rule won.** CSS is full of rules that override
  each other. Reading them, you have to work out the winner in your head. The browser has already
  done it.
- **It catches bugs that hide off screen.** A column pushed past the right edge looks the same as a
  missing column until someone scrolls.
- **The check is part of the fix.** When Claude looks again after the change, "done" means it saw
  it working, not that the code looks right.

## In my own words

- "still see rendering issue, let's fix" (August 2026)
- "also still seeing tight text" (August 2026)

## Related

- [Claude Code Techniques](/craft/generative-ai/claude-code-techniques): the other pages in this set.
- [Telling Claude When to Stop and Ask](/craft/generative-ai/claude-code-techniques/telling-claude-when-to-stop-and-ask):
  another rule that lives in `CLAUDE.md`.
- [Reading the Docs Before Debugging a Skill](/craft/generative-ai/claude-code-techniques/reading-the-docs-before-debugging-a-skill):
  the same idea for skills. Check how it really works before guessing.
- This page goes with a post in my "How I Used Claude Today" series on LinkedIn.
