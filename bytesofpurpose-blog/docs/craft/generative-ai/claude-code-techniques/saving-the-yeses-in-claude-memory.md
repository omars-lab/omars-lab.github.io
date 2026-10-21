---
title: "Saving the Yeses in Claude's Memory"
description: 'Claude Code only wrote down what it got wrong, so the things it got right had to be found again. Now a yes from me is saved like a no, with the reason.'
slug: /generative-ai/claude-code-techniques/saving-the-yeses-in-claude-memory
kind: technique
usefulness: 4 # 1 to 5: how much a typical Claude Code user gets from it; the sidebar follows it
sidebar_position: 3
authors: [oeid]
tags: [claude-code, ai, productivity, memory]
image: /img/claude-code/saving-the-yeses-in-claude-memory.png
draft: true
questions:
  - How do I get Claude Code to remember what it got right, not just what it got wrong?
  - What should go in a Claude Code memory file?
  - How do I check what my Claude Code memory is made of?
---

## What annoyed me

Claude Code keeps a memory: short notes it writes to itself so the next session starts knowing
what the last one learned. Mine filled up with my complaints. Every time I said "no, not like
that", a note went in. When I said "yes, exactly", nothing did.

So the memory was a list of mistakes. The approaches that worked never got written down, and a few
sessions later Claude would drift away from them and I'd steer it back by hand. It learned what I
didn't want and kept forgetting what I did.

## What I did about it

I told Claude to treat a confirmation like a correction. When I say "yes, keep doing that", or
agree with a call it made, that's worth a note too, with the reason. Same format, same folder, same
weight.

The reason matters as much as the rule. A note that says "use the small model for sorting" is easy
to override the first time something looks different. A note that says why (it's guesswork that I
review anyway, and there are hundreds of items) tells the next session when the rule still applies.

## Set it up

Add a section like this to your `CLAUDE.md` (the file Claude Code reads at the start of every
session):

```markdown
## Memory

Save confirmations, not only corrections. "Yes, keep doing that" is feedback
worth a memory file as much as "no, do it this way". Without the confirmations,
memory is a list of mistakes, and the approaches that were right have to be
found again.

- Save it as type `feedback`, the same as a correction.
- Say what to keep doing, then **Why:** in one or two lines, then
  **How to apply:** when it comes up.
- A quiet yes counts too: when I accept an unusual call without pushback,
  that's a confirmation.
```

A note written from a yes looks like any other. This is the shape of one of mine, cut down:

```markdown
---
name: classification-default-small-model
description: Sorting and labelling passes run on the small model by default
type: feedback
---

Run sorting and labelling passes on the small model unless I ask otherwise.

**Why:** I asked for it ("haiku should be default"). These passes only
suggest; I review every result, so they don't need the bigger model, and
there are hundreds of items.

**How to apply:** start these passes on the small model. Only switch if I say so.
```

## What it looks like

<figure style={{maxWidth: '480px', margin: '0 auto 1.5rem'}}>
  <img src="/img/claude-code/saving-the-yeses-in-claude-memory.png" alt="A Claude Code session: I confirm a sorting rule and Claude says it is now recorded, not just its read of my corrections; four days later I say a pass should run on the small model by default and Claude saves that preference to memory" />
</figure>

Both moments are from August 2026, while Claude was sorting a few hundred of my old chats into
projects.

In the first, Claude had been guessing at a rule from the chats I kept moving. I typed one short
line that said the rule out loud. Its answer: that's what it had just written down, "so it's now
recorded, not just my read of your corrections." A guess built from my noes became a fact built
from a yes.

In the second, I said the sorting should run on the small model by default. Claude made the change
and then saved the preference to memory, with the reason. That's the note in the setup above.

## Check your own memory

You can see the balance in your own notes with one command. Claude Code keeps per-project memory
under `~/.claude/projects/<folder>/memory/`. This prints each feedback note with its reason:

```bash
for f in $(grep -l 'type: feedback' ~/.claude/projects/*/memory/*.md); do
  echo "$(basename "$f"): $(grep -m1 '\*\*Why' "$f")"
done
```

If a project keeps its memory inside the repo instead, point the `grep` at that folder.

Read down the list and sort each one: did it start from a "no" or a "yes"? When I ran it across
two of my projects, I had 11 feedback notes. Eight started from something Claude got wrong. Three
hold a yes: how I like technique write-ups phrased, how I retry a step the safety check blocked,
and the small-model default above. Three isn't many. Even with the rule written down, the noes come
easier, which is exactly why the rule has to be written down.

## Why it works

- **What works stays put.** A confirmed approach survives into the next session instead of being
  rediscovered.
- **Corrections alone overcorrect.** If all Claude knows is what you dislike, it moves away from
  that, sometimes past the thing you wanted.
- **The reason travels with it.** A note with a why can be applied with judgment, so it doesn't
  harden into a rule that fires in the wrong place.
- **It's cheap.** A yes is one line from you. The note costs Claude a few seconds.

## In my own words

- "personal dev is more dev fall back bucket" (August 2026)
- "finding saved pizza places is a claude google mcp technique confirmation" (August 2026)
- "haiku should be default" (August 2026)

## Related

- [Claude Code Techniques](/craft/generative-ai/claude-code-techniques): the other pages in this set.
- [Telling Claude When to Stop and Ask](/craft/generative-ai/claude-code-techniques/telling-claude-when-to-stop-and-ask):
  the decisions you make there are good candidates for a memory note.
- This page goes with a post in my "How I Used Claude Today" series on LinkedIn.
