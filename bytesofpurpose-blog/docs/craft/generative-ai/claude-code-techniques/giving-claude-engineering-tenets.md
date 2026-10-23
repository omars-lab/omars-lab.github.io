---
title: 'Giving Claude Engineering Tenets'
description: 'Fixing the same kind of Claude mistake one at a time never ends. A short list of tenets in the global CLAUDE.md fixes the whole kind, in every repo.'
slug: /generative-ai/claude-code-techniques/giving-claude-engineering-tenets
kind: technique
usefulness: 5 # 1 to 5: how much a typical Claude Code user gets from it; the sidebar follows it
sidebar_position: 1.5
authors: [oeid]
tags: [claude-code, ai, productivity, claude-md, tenets]
image: /img/claude-code/giving-claude-engineering-tenets.png
draft: true
questions:
  - How do I stop Claude Code from making the same kind of mistake again?
  - What should go in my global CLAUDE.md?
  - How do I make every Claude Code session work the way I do?
---

## What annoyed me

Claude being wrong once doesn't bother me much. I catch it, I fix it, we move on. What wore me down
was Claude getting the same *kind* of thing wrong, again and again, in different repos. A number
in a doc that was right when it was written and stale a week later. A question asked in the middle
of a long reply, where I'd miss it. A check skipped because the gate was "flaky".

Each time I fixed the one case. Each time the next case showed up somewhere else, because the fix
lived in one file of one repo and Claude had forgotten it by the next session.

## What I did about it

I started writing **tenets**: short standing rules in my global `CLAUDE.md`, the one file Claude
Code loads at the start of every session in every repo. A tenet doesn't fix one mistake. It names
the whole kind of mistake and says what to do instead.

Each tenet carries one more thing: the moment that produced it. The day, and the line I typed
when it went wrong. That note is what keeps the list honest. When a rule looks odd six weeks later,
the note says why it's there, and when the reason is gone, the rule can go too.

My list has 19 tenets now. Nine of them carry the moment that produced them. The other ten I
still have to go back and fill in, and they are the ones I find hardest to judge.

## Set it up

Your global `CLAUDE.md` lives at `~/.claude/CLAUDE.md`. Claude Code reads it in every project, on
top of the project's own `CLAUDE.md`. Add a section per tenet, in this shape:

```markdown
## Derive numbers, don't type them

A count, a total or a size in a doc comes from a script,
never from typing it. A typed number is right on the day
and wrong a week later, and nothing notices.

- When a doc needs a number, put the command that
  produces it next to it.
- When you find a typed number, replace it with the
  derived one in the same change.

(Me, <the date>: "<the line I typed when it went
wrong>", after <what happened>.)
```

Four rules for writing them:

1. **Name the kind, not the case.** "Derive numbers" covers every stale count. "Fix the count in
   the README" covers one.
2. **Say what to do instead.** A rule that only says "don't" leaves Claude guessing.
3. **Keep the moment.** The date and your own words, in brackets at the end. That is the line
   you'll be glad of when you wonder why the rule exists.
4. **Keep it short.** A tenet Claude has to read three times to follow is a tenet it won't
   follow. If the rule needs a script or a checklist, put that in a file and point at it.

When a tenet keeps getting broken anyway, it's a sign the rule wants to be a check (a hook, a
validator) rather than a sentence.

## What it looks like

<figure style={{maxWidth: '480px', margin: '0 auto 1.5rem'}}>
  <img src="/img/claude-code/giving-claude-engineering-tenets.png" alt="A Claude Code session: I say I care less about Claude being wrong once and more about mechanisms that fix a whole class of mistakes, like giving Claude an engineering tenet, and Claude finds a session where stale numbers in docs kept coming back because each fix patched one instance, not the category" />
</figure>

This is from the session where I said out loud what I'd been doing for weeks. I asked Claude to
look for the times I'd fixed a whole class of mistakes, not one. It came back with the stale
numbers: a count typed by hand once, then drifting as the set under it changed, and a couple of
narrow checks that each caught one version of it. Patches for the instances, not the category.
The tenet was the fix for the category.

## Why it works

- **It's loaded before you type.** The global `CLAUDE.md` is read at the start of every session,
  so a rule written once is in force in every repo, including the one you create tomorrow.
- **It's about kinds, not cases.** One rule covers the case you saw and the ten you haven't yet.
- **The moment keeps it honest.** A rule with its reason attached can be questioned and retired.
  A rule without one just piles up.

## The tenets, one post at a time

This page is the introduction. Each tenet on my list gets its own page and post, with the setup
and the session behind it. The first ones coming up:

- Tell Claude when not to ask: only a one-way door is worth a question.
- For research that decides what gets built, two independent researchers and then a checker.
- Commit a checkpoint before Claude tries something new.
- Give a long-running script logs you can grep, with a line before and after every call that
  can hang.
- When a problem forces a change of approach, write the pivot down in the repo.
- A standing order for working through a backlog, so "continue" means highest value first.
- Spot-check what OCR mangles with your own eyes.
- When there's no scripted path, drive the app by hand, with a screenshot before and after every
  click.
- Everything a person reads is written in plain words.

## In my own words

- "a mechanism i proposed doesnt solve 1 mistake but a whole class of mistakes (things like giving
  claude a paritcular neginering tenant, etc)" (August 2026)
- "give Claude engineering tenants … that would be the introductory repost and then each tenant
  would be a follow on post" (October 2026)

## Related

- [Claude Code Techniques](/craft/generative-ai/claude-code-techniques): the other pages in this set.
- [Telling Claude When to Stop and Ask](/craft/generative-ai/claude-code-techniques/telling-claude-when-to-stop-and-ask):
  one of the tenets on my list, with its own page already, and the one I'd start with.
- [Saving the Yeses in Claude's Memory](/craft/generative-ai/claude-code-techniques/saving-the-yeses-in-claude-memory):
  memory holds what you confirmed in one repo; a tenet holds what holds everywhere.
- This page goes with a post in my "How I Used Claude Today" series on LinkedIn.
