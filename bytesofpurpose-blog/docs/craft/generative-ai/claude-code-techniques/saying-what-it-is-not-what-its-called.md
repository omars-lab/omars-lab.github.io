---
title: "Saying What It Is, Not What It's Called"
description: "Claude Code wrote its questions in the code's names, and I can't answer what I can't follow. One tenet: say what a thing is, not what it's called."
slug: /generative-ai/claude-code-techniques/saying-what-it-is-not-what-its-called
kind: technique
usefulness: 4 # 1 to 5: how much a typical Claude Code user gets from it; the sidebar follows it
sidebar_position: 2.8
authors: [oeid]
tags: [claude-code, ai, productivity, claude-md, tenets, writing]
image: /img/claude-code/saying-what-it-is-not-what-its-called.png
draft: true
questions:
  - How do I stop Claude Code from using jargon?
  - Why are Claude Code's explanations so hard to follow?
  - How do I get Claude Code to write commit messages and questions I can act on later?
---

## What annoyed me

Claude reads the code before it writes to me, so it picks up the code's names for things. A
column name, a function name, a nickname we gave a page two sessions ago. To Claude those names
are plain, because it has just read them. To me, coming back to the terminal after an hour, they
are a puzzle I have to solve before I can answer.

The worst case was a question about sharing a report with someone. It was written so tightly in
Claude's own names for things that I had to ask what it meant before I could pick an answer. The
question was a good one. I just couldn't read it.

## What I did about it

I wrote a tenet, a standing rule in my global `CLAUDE.md`: everything a person reads is written in
plain everyday words. That means chat replies, the questions Claude asks and their options, commit
messages, pull request descriptions and task lists. Say what the thing is, not what it's called.
Write it so someone who missed the last three sessions could act on it, because some days that
someone is me.

Where the rule sits turned out to matter as much as what it says. I'd written the same idea once
before, inside a section about my wiki. Claude read it as a rule for the wiki, and kept writing
everything else in shorthand. Moving it to the top of the file, under its own heading, is what made
it read as a rule for everything.

## Set it up

Add this near the top of `~/.claude/CLAUDE.md`, the file Claude Code reads at the start of every
session in every project. Keep it out of any section about one kind of work, or it will be read as
a rule for that work only.

```markdown
## Speak plainly

Everything I read is written in plain everyday words:
chat replies, questions and their options, commit
messages, PR descriptions, task lists. Write it so
someone who missed the last three sessions could act
on it.

- Say what the thing is, not its internal name: "the
  check that turns the publish button red", not "the
  gate". An id or a file path can sit next to the
  explanation, never in place of it.
- One idea per sentence, the point first.
- Options read like choices: each says in plain words
  what happens if I pick it.
- When a term can't be avoided, explain it in a few
  words the first time.

(Me, <the date>: "<what you typed the day you couldn't
follow what Claude was asking>".)
```

It follows the four rules from the [tenets page](/craft/generative-ai/claude-code-techniques/giving-claude-engineering-tenets):
it names the kind of writing, not one reply; it says what to write instead; it keeps the moment it
came from; and it is short.

The "missed the last three sessions" line is the test I use myself. Before I send Claude's words
on, I ask whether they would make sense to me next month.

## What it looks like

<figure style={{maxWidth: '480px', margin: '0 auto 1.5rem'}}>
  <img src="/img/claude-code/saying-what-it-is-not-what-its-called.png" alt="A Claude Code session in August: Claude says the publishing check fires for nothing because no content row has a project id, which makes what unfiled content means the load-bearing question. I ask twice what it means and why it matters. 33 seconds later Claude says unfiled means a chat not tagged to any claude.ai Project, all 208 of my chats are unfiled, so the red button can never appear" />
</figure>

This is from August, before I had the rule. Claude had written up six decisions for me about a
publishing check it had just built, one that turns the publish button red when a post comes from a
chat that isn't cleared to share. It opened with the most important thing it had found. But it said
it in the names from the code: a column called `project_id`, a return value called `clear`, "the
load-bearing pair". Its reply had 11 names in code font in 221 words.

I asked what it meant, and six seconds later I asked again. Thirty-three seconds after that, Claude
tried again. It started with what the word meant: "unfiled" is a chat that isn't tagged to
any Project. All 208 of my chats were unfiled. So the red button could never appear, for anything.

That was the same fact as in the first reply. In plain words it landed: the check I'd just built
did nothing yet. Nineteen seconds later I was answering the next question, how those 208 chats get
filed.

Since the rule went in, I've seen Claude catch it itself. Drafting the picture for another post in this
series, it stopped and said the card had words a LinkedIn reader couldn't follow, like "contaminated"
and "the string proves contact, not location". It went back to the session to find plainer lines
before I'd said a word.

## Why it works

- **You can only decide what you can read.** A question in internal names leaves you two choices:
  ask what it means, which costs a round trip, or guess.
- **Claude can't feel the gap.** It has just read the code, so the code's names seem plain to it.
  The rule names the gap it can't see.
- **The point comes first.** One idea per sentence, the point first, means the fact that matters
  is the first thing you read, not the last.
- **It sits where it reads as global.** A rule inside a section about one kind of work is read as a
  rule for that work. At the top, it covers every reply.

## In my own words

From the August session, two months before I wrote the rule down (spelling fixed):

- "… unclear ... why is this question important" (August 2026)
- "what does it mean ... why are you asking it" (August 2026)

## Related

- [Giving Claude Engineering Tenets](/craft/generative-ai/claude-code-techniques/giving-claude-engineering-tenets):
  the introduction to the tenets. This is one of them.
- [Telling Claude When to Stop and Ask](/craft/generative-ai/claude-code-techniques/telling-claude-when-to-stop-and-ask):
  that page says what a question should hold, like each option's pros and cons. This one says what
  words they go in, so each option reads like a choice.
- [Telling Claude When Not to Ask](/craft/generative-ai/claude-code-techniques/telling-claude-when-not-to-ask):
  fewer questions, and the ones that are left are worth reading, which only helps if you can read
  them.
- [Claude Code Techniques](/craft/generative-ai/claude-code-techniques): the other pages in this set.
- This page goes with a post in my "How I Used Claude Today" series on LinkedIn.
