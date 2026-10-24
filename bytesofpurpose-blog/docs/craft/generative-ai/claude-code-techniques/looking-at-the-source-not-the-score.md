---
title: 'Looking at the Source, Not the Score'
description: 'When Claude pulls text or facts out of files, a match rate can pass on exactly the failures that matter. A tenet that makes it open the real source and look.'
slug: /generative-ai/claude-code-techniques/looking-at-the-source-not-the-score
kind: technique
usefulness: 3 # 1 to 5: how much a typical Claude Code user gets from it; the sidebar follows it
sidebar_position: 9.8
authors: [oeid]
tags: [claude-code, ai, productivity, claude-md, tenets, data]
image: /img/claude-code/looking-at-the-source-not-the-score.png
draft: true
questions:
  - How do I check that OCR or extraction output is actually right?
  - Why can't I trust a match rate or confidence score from an extraction pipeline?
  - How do I get Claude Code to spot-check its own data pipeline?
---

## What annoyed me

When Claude runs a pipeline that pulls text out of scanned pages, it reports back in numbers. A
match rate, a confidence score, a coverage count, "all passed". The numbers were high, and Claude
was happy to judge the work by them.

The numbers can't see the failures that matter most. OCR swaps one accent mark for a similar one,
at high confidence. Text loses its spaces where italics start or stop. A page that is mostly a
picture comes back almost empty. A long section is missing a whole page and still counts as
covered, because the count is per section, not per page. Every one of those passes. Each one is
obvious the moment you put the page next to the text.

## What I did about it

I made it a tenet in my global `CLAUDE.md`: when a pipeline reads text or facts out of images or
documents, Claude opens a sample of the real source and compares it with what came out, by eye.
The sample always includes the hardest cases, not only the clean ones. A score is fine for
spotting a trend. It is not a check.

The tenet came from an OCR job I can't show here. Within a few minutes of looking at real pages,
Claude found three failures the scores had passed. The picture below is the same failure in a
different pipeline, one I can show.

## Set it up

Add a section like this to `~/.claude/CLAUDE.md`. It follows the four rules from
[Giving Claude Engineering Tenets](/craft/generative-ai/claude-code-techniques/giving-claude-engineering-tenets):
the kind of mistake, what to do instead, the moment, and short.

```markdown
## Spot-check the source, not the score

When a pipeline pulls text or facts out of images or
documents (OCR, scraping, extraction), open a sample of
the real source and compare it with what came out, by eye.

- Always include the hardest cases: pages dense with
  accents or symbols, image pages, column breaks, rows
  that look different from the rest.
- A match rate, a confidence score or "all passed"
  can't see these failures. Only looking can.
- Write down what you saw, so the next run knows what
  the noise looks like and where it lands.

(Me, <the date>: "<the line I typed when it went
wrong>", after <what happened>.)
```

Fill in the last line with your own moment. Mine is from the OCR job above, and it's the line
that tells me why the rule is there.

## What it looks like

<figure style={{maxWidth: '480px', margin: '0 auto 1.5rem'}}>
  <img src="/img/claude-code/looking-at-the-source-not-the-score.png" alt="A Claude Code session: I ask what the strategy is to tell two machines apart and say I'm still not convinced; Claude says the machine names differ cleanly and it will test that before leaning on it; four minutes later it says the machine name proves contact, not location" />
</figure>

This is from August 2026. I keep a list of my Claude Code sessions, and each row says which of my
two machines ran it: the laptop or the studio. For 43 sessions, both machines had a copy, so the
list couldn't tell. Claude made a case from where the folders lived. I wasn't convinced.

Claude then found the machine names written inside the session files, and they differed cleanly.
It looked decisive: count how often each machine's name shows up. Then Claude caught it, four
minutes later. The session we were in ran on the laptop, yet it was full of the studio's name,
because Claude had been running commands on the studio from it the whole time. The name proved the
two machines had talked, not where a session ran. Claude swapped in better clues and tried those
on sessions whose answer was already known before using them. They held everywhere except, again,
the session we were in, which came up as both.

So Claude opened the files themselves:

- **One field had been rewritten.** Two copies of the same session were identical except for the
  folder each said it ran in. The studio's copy of one big session said a studio folder 5,790 times, while the
  commands inside the same file still named the laptop's folder 7,519 times. 37 of the 43 were
  copies like that.
- **The tally lied too.** The counting command printed two zeros instead of one for files with no
  match, and the totals were off until Claude noticed and counted again.
- **One direct test settled it.** A session's file is created the moment the session starts. In 35
  of the 43, the laptop's copy was created in the same second as the first message. The studio's
  copy showed up 68 minutes to 59 days later.

Every count along the way looked sure. Opening the files is what showed which ones were wrong.

## How it differs from looking at the page

[Looking at the Page Before Reading the CSS](/craft/generative-ai/claude-code-techniques/looking-at-the-page-before-reading-the-css)
is the same idea for UI bugs: the stylesheet says one thing, the browser shows another, so look at
the browser. Here there is no page to look at. What lies is the number: a match rate, a count, a
score that went green. The fix is the same move, aimed at the data: put the source next to the
output and look.

## Why it works

- **Scores average, failures don't.** One empty page in a long chapter barely moves a coverage number. It
  is still a missing page.
- **The hardest cases are where it breaks.** A sample of clean pages passes for the same reason the
  score does. Picking the odd ones on purpose is the point.
- **Looking is quick.** A few minutes of reading real pages beats a pipeline that runs for an hour
  on a bug nobody saw.

## In my own words

- "what's the strategy to distinguish ... still not convinced" (August 2026, spelling fixed)

## Related

- [Giving Claude Engineering Tenets](/craft/generative-ai/claude-code-techniques/giving-claude-engineering-tenets):
  the introduction to this set of tenet pages, and the four rules this one follows.
- [Looking at the Page Before Reading the CSS](/craft/generative-ai/claude-code-techniques/looking-at-the-page-before-reading-the-css):
  the same habit for UI bugs, where the page is what lies.
- [Claude Code Techniques](/craft/generative-ai/claude-code-techniques): the other pages in this set.
- This page goes with a post in my "How I Used Claude Today" series on LinkedIn.
