---
title: 'Options Like an Executive Summary'
description: 'When Claude Code asks me to choose, it now leads with its pick, then lays out each option with its pros, cons and what it commits me to.'
slug: /generative-ai/claude-code-techniques/options-like-an-executive-summary
kind: technique
usefulness: 4 # 1 to 5: how much a typical Claude Code user gets from it; the sidebar follows it
sidebar_position: 5
authors: [oeid]
tags: [claude-code, ai, productivity, decision-making]
image: /img/claude-code/options-like-an-executive-summary.png
draft: true
questions:
  - How do I get Claude to lay out choices I can decide in a minute?
  - What should each option say when Claude asks me to choose?
---

## What annoyed me

Once Claude Code asked me its questions through the question tool, I got more of them, and many
were hard to answer. An option was often just a label, like "Retag them" or "Leave them", with a
cost tacked on. To pick, I had to work out for myself what each one would break, what it would
save, and what I'd have to do next. Or I'd scroll back up through a long reply to find out.

## The technique

Tell Claude to write its options like an executive summary. It leads with the one it recommends.
Then every option, side by side, says what it gets you, what it costs or risks, and what it
commits you to next. You decide from what each choice leads to, not from its name. Most questions
take a minute, and the ones that don't are the ones worth talking over.

## Set it up

This builds on [Telling Claude When to Stop and Ask](/craft/generative-ai/claude-code-techniques/telling-claude-when-to-stop-and-ask),
which sends every question through the question tool. Add a section like this to your `CLAUDE.md`
next to it:

```markdown
## How to lay out options

When you ask me to choose, write it like an executive summary:

- Lead with the option you recommend, first in the list, marked "(Recommended)",
  and say in one line why.
- Give 2 to 4 options. For each one, say:
  - Pros: what it gets me.
  - Cons: what it costs or risks.
  - Implications: what it commits me to or rules out next, and who it affects.
- Never just a label and a cost. I am choosing between consequences, so lay
  them side by side: a small table, or each option's preview, not a wall of prose.
- Use plain words. If one of your own terms can't be avoided, explain it the
  first time.
```

## What it looks like

<figure style={{maxWidth: '480px', margin: '0 auto 1.5rem'}}>
  <img src="/img/claude-code/options-like-an-executive-summary.png" alt="Above, the rule in CLAUDE.md being typed in vim: every option carries its pros, its cons, and its implications. Below, Claude asks whether to change the tag on 41 old short links, with three options, each naming its pros and cons, and the recommended one first" />
</figure>

The top window is the rule in my `CLAUDE.md`. The bottom one is from a real session this month,
while I was cleaning up the short links I use in my posts. New links had started getting a short
tag made from the post's title, and 41 older links still used the old style. Claude asked whether
to change those too.

Each option names its pros and its cons, so the question answers itself. "Retag all 41" comes
first and is marked as Claude's pick. Its notes say what it gets me (one style everywhere), what
it costs (one link may already be live, and re-syncing it is my job) and why that's safe (no visits
have been counted yet). The other two options trade the same things the other way. I picked the
first one. The notes are trimmed for the picture, and each option also had a preview that the
picture doesn't show.

## Did it stick?

I counted every question Claude asked me through the question tool, in four of my repos, before
and after the day the rule went in (September 21, 2026). A question counts when every option's
note names both a pro and a con.

| | Questions | Pros and cons on every option |
|---|---|---|
| Before the rule | 276 | 0 |
| After the rule | 35 | 31 |

Some things to know before you read too much into it:

- The "after" side is small, and most of it is one long session.
- What I picked hardly changed. About six in ten times I took Claude's recommended option, before
  and after. What changed is how fast I could see why.
- I answered in my own words a bit more often after (from about one in eight questions to about one
  in five). With the trade-offs spelled out, it's easier to spot when none of them is quite right.

## Why it works

- **The pick comes first.** If you trust it, you're done in a second. If you don't, you know what
  you're arguing with.
- **You choose between outcomes, not names.** A label like "Leave them" hides what it costs. A
  line saying "two styles side by side for as long as the old posts run" doesn't.
- **Claude has done the thinking already.** It knows the files, the state and the risks. Asking it
  to write the trade-offs down puts that work where you can see it.

## In my own words

- "tell [Claude] to present options in an exec summary oriented fashion" (October 2026)

## Related

- [Telling Claude When to Stop and Ask](/craft/generative-ai/claude-code-techniques/telling-claude-when-to-stop-and-ask):
  when Claude should ask, and why every question goes through the question tool.
- [Claude Code Techniques](/craft/generative-ai/claude-code-techniques): the other pages in this set.
- This page goes with a post in my "How I Used Claude Today" series on LinkedIn.
