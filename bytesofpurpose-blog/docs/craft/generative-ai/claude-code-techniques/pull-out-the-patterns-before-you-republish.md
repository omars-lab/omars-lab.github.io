---
title: 'Pull Out the Patterns Before You Republish'
description: 'Claude Code planned to turn one design write-up into one general post. Now it first pulls apart the separate patterns inside, and each one gets its own post.'
slug: /generative-ai/claude-code-techniques/pull-out-the-patterns-before-you-republish
kind: technique
authors: [oeid]
tags: [claude-code, ai, productivity, writing]
image: /img/claude-code/pull-out-the-patterns-before-you-republish.png
draft: true
questions:
  - How do I reuse a write-up about one project without leaking that project's details?
  - How do I get Claude Code to find the reusable ideas in a long document?
  - Why should one detailed post become several general ones?
---

## What annoyed me

I have a set of detailed design write-ups on this blog, each about one real system. I wanted to
publish general versions somewhere else: the reusable idea, without the specific business, its
customers or its numbers. So I asked Claude Code to build a skill for it, and mentioned in passing
that one post might break into many general patterns.

Claude's first plan was one post in, one post out. Take the whole write-up, strip the specifics,
write one general version. Splitting it into several patterns was filed under "later".

That's the copy-and-adapt habit with better manners. A long design write-up isn't one idea. It has a
way of choosing between options, a data pipeline, a couple of hard decisions, a diagram style, all
tangled together. Squash that into one general post and you get a vague summary of everything,
useful for nothing in particular.

## What I did about it

I said it plainly: there may be many patterns tangled together in there. Claude took that and
rebuilt the plan around one step that has to happen first: **pull the patterns apart before
generalizing anything.**

The skill now works in three steps:

1. **Disentangle.** Read the write-up and list every separate reusable pattern in it: a name for
   the mechanism (not the product), where it sits in the post, and one line on what stays true once
   the specific business is gone.
2. **Agree.** Show me the list as a question with options, one per pattern, and let me pick which
   ones become posts. Nothing is written before I choose.
3. **One post per pattern, one at a time.** Each picked pattern becomes its own general post, with
   the business stripped out and a made-up example in its place. Then a check before the next one.

## Set it up

You don't need a big system for this. A skill file with the three steps does most of the work:

```markdown
---
name: extract-general-pattern
description: Turn one detailed write-up into several general, standalone posts
  by first separating the reusable patterns inside it. Use when I say "make a
  general version of this" or "pull the patterns out of this".
---

## Steps

1. Read the write-up in full. List every distinct reusable pattern in it.
   For each: a name for the mechanism (not the product), the section it comes
   from, and one line on what stays true without this business.
2. Ask me with AskUserQuestion (multi-select), one option per pattern. Write
   nothing until I pick.
3. For each pattern I picked, one at a time:
   - Write a standalone post about the pattern alone.
   - Remove names, customers, real numbers, internal code names and process.
   - Use one invented example ("an orders service"), never the real one.
   - No link back to the original post.
   - Stop and check with me before starting the next one.
```

It gets better with a list of the shapes patterns tend to take, so the skill names them the same way
every time. Mine sits in a file next to the skill and the skill reads it before step 1:

```markdown
## Shapes to look for

- A way of choosing between options (the method, not the choice you made)
- A single decision record: the concern, the options, the rule of thumb
- A pipeline: stages, what each one guarantees, where it can fail
- A loop that measures, acts and improves on the next round
- A model of who uses the system and what they come to do
- A plan for speed, scale or compliance for a whole kind of system
- A convention for diagrams or docs
```

## What it looks like

<figure style={{maxWidth: '480px', margin: '0 auto 1.5rem'}}>
  <img src="/img/claude-code/pull-out-the-patterns-before-you-republish.png" alt="A Claude Code session: I ask for a skill that writes a general version of my posts before I export them, and twelve minutes later I say there may be many patterns tangled together; Claude agrees the skill has to disentangle the patterns first and only then generalize" />
</figure>

This is the conversation from July 2026 where the skill took shape. My first message asked for a
general version of each post, with a hint in brackets: maybe one post gets broken into many general
patterns. Claude's plan only kept the first half.

Twelve minutes later I typed one line, typos and all. Claude's reply is the part I'd want any
collaborator to say: a single post has many patterns in it, so the skill can't assume one post in,
one post out. It has to disentangle first, and only then generalize.

## What it found

The list of shapes above didn't come from a textbook. It came from reading just two of my design
write-ups closely while building the skill. Those two posts held **seven different kinds of reusable
pattern** between them. A one-in, one-out version would have given me two general posts. Pulling the
patterns apart first turned the same two write-ups into a checklist the skill now walks for every
post. The general posts themselves are still to come; the list is what I have so far.

To see what's in one of your own write-ups, give Claude the steps above and stop it after step 2. The
list of candidates is the useful part, even if you never write the posts.

## Why it works

- **A general post needs one idea.** A pattern post that tries to cover a whole system turns into a
  summary. One mechanism per post is something a reader can actually reuse.
- **Separating first makes the stripping easier.** Once a pattern stands on its own, it's obvious
  which details belong to it and which belonged to the business it came from.
- **You stay in charge of what goes out.** The agree step means nothing is written about a pattern
  you didn't choose to share.
- **It keeps the original private.** No backlink and an invented example mean a reader can't trace
  the general post to the project it came from.

## In my own words

- "maybe one post gets broken into many general patterns" (July 2026)
- "can we start with a design post for general pattern and move later" (July 2026)
- "there may be many patterns intertangled" (July 2026)

## Related

- [Claude Code Techniques](/craft/generative-ai/claude-code-techniques): the other pages in this set.
- [Telling Claude When to Stop and Ask](/craft/generative-ai/claude-code-techniques/telling-claude-when-to-stop-and-ask):
  the agree step is a question with options, asked the way that page describes.
- This page goes with a post in my "How I Used Claude Today" series on LinkedIn.
