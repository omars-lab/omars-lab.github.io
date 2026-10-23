---
title: "A Skill That Can't Approve Its Own Work"
description: 'Claude Code offered to sort my chats into share and keep private on its own. Now the skill can only suggest, and the code stops it approving anything.'
slug: /generative-ai/claude-code-techniques/a-skill-that-cannot-approve-its-own-work
kind: technique
usefulness: 3 # 1 to 5: how much a typical Claude Code user gets from it; the sidebar follows it
sidebar_position: 8
authors: [oeid]
tags: [claude-code, ai, productivity, safety]
image: /img/claude-code/a-skill-that-cannot-approve-its-own-work.png
draft: true
questions:
  - How do I stop a Claude Code skill from approving its own suggestions?
  - How do I keep a guess from Claude apart from a decision I made?
  - How do I let an agent do the sorting while I keep the final say?
---

## What annoyed me

I asked Claude Code to build a skill that walks through hundreds of my old Claude chats and sorts
them: fine to post about, or keep private. Before it started, it asked how much it should do on its
own. One of the options it offered was to tag everything unattended and only check with me before a
post went out. Its own note on that option said the quiet part: "a misclassification lands in the
file unseen."

That was the thing that bugged me. Not that Claude might guess wrong. Guessing is the job. What
bugged me was that a wrong guess and a decision I made would look exactly the same in the file. A
week later, I'd see "shareable: yes" next to a chat and have no idea whether I said that or Claude
did.

And telling it "never approve your own work" in the skill's instructions doesn't fix it. That's a
polite request. A model following instructions most of the time is not the same as a model that
can't do the wrong thing.

## What I did about it

I split the record into two kinds of field. Some fields hold a **suggestion**: shareable or not, and
a note on why. One field holds the **stamp**: the date I looked at it and agreed. The skill can
write suggestions. It cannot write the stamp, and that's enforced in the code that saves its work,
not in its instructions.

So the skill does the reading and the sorting, then hands its suggestions to a small script. The
script checks every field against a short allow list. If the skill tries to set the stamp, the
script throws out the whole suggestion and says why. If I've already stamped a row, the script
leaves it alone, so a re-run can never overwrite something I decided. A suggestion with no stamp
shows up in a review screen, and the stamp only gets written when I click.

## Set it up

The rule in the skill's instructions says what it's for:

```markdown
## What this skill may write

This skill proposes. It never decides.

- It may fill in `shareable` (yes / no) and `notes` (one line on why).
- It never writes `reviewed_at`. That column means "a person looked at this
  and agreed", and only the review screen sets it.
- It hands its proposals to `apply-proposals` as JSON. It never edits the
  file directly.
- A row that already has `reviewed_at` is decided. Leave it alone.
```

The script it hands off to is what makes the rule stick. The heart of it is a few lines:

```js
const PROPOSABLE = ['shareable', 'notes']   // what a skill may suggest
const STAMP = 'reviewed_at'                 // only a person sets this

function applyProposal(row, proposal) {
  const { id, ...fields } = proposal
  for (const field of Object.keys(fields)) {
    if (!PROPOSABLE.includes(field)) {
      // Refuse the whole proposal, not just the one field.
      throw new Error(`${field} is not proposable (allowed: ${PROPOSABLE.join(', ')})`)
    }
  }
  if (row[STAMP]) return row                // a person already decided: hands off
  return { ...row, ...fields }
}
```

Two details matter:

- **Allow, don't block.** The script lists what the skill *may* write, not what it may not. A new
  column added next month is off limits to the skill until someone adds it to the list on purpose.
- **Reject the whole thing.** If one field in a proposal is off limits, none of it is applied. A
  half-applied proposal is harder to spot than a refused one.

The same shape works anywhere an agent should recommend but not approve: a bot that suggests
refunds, a script that drafts replies, a skill that flags files for deletion. Give it a column for
its guess, keep the approval column out of its reach, and check in code.

## What it looks like

<figure style={{maxWidth: '480px', margin: '0 auto 1.5rem'}}>
  <img src="/img/claude-code/a-skill-that-cannot-approve-its-own-work.png" alt="A Claude Code session: Claude asks how much the sorting skill should do before I see it, with three options, I answer that it should propose and I review, and Claude agrees the skill proposes and a review screen is where I decide" />
</figure>

This is the moment from August 2026 when the rule was set. Claude asked how much the sorting skill
should do before I saw its work, with three options: propose and wait for me, tag things on its own
and only stop before a post, or only ever print a report.

I didn't pick one. I typed my own answer: propose, write the results to a file, and let me review
them in a screen. Claude's reply was one line: "Clear. The skill proposes and writes TSVs; the UI is
the review surface." (A TSV is a plain spreadsheet file, one row per line.) The allow list in the
script is that one line turned into code.

## Watch it refuse

The check is easy to test, and worth testing, because a rule you haven't seen fire is a rule you're
hoping works. Write a proposal that tries to approve itself:

```json
[{ "id": "my-blog", "shareable": "yes", "reviewed_at": "2026-10-21" }]
```

Run it through the script with a dry run, so nothing is written. Mine says (with the row's name
swapped for `my-blog`):

```text
would apply 0 proposal(s)
  skipped my-blog: reviewed_at is not proposable (allowed: project_id, shareable, notes)
```

Zero applied. The same proposal without `reviewed_at` goes through as a suggestion and waits for me.
When I ran the real sorting pass over my projects, every suggestion it made landed that way: filled
in, unstamped, waiting for a click.

## Why it works

- **A guess and a decision look different on disk.** "Shareable, no stamp" means Claude thinks so.
  "Shareable, stamped" means I said so. Nobody has to remember which was which.
- **The skill can be wrong safely.** Since nothing it writes counts as approved, I can let it run
  over hundreds of items without watching each one.
- **It doesn't depend on the model behaving.** The instructions explain the rule; the code enforces
  it. If the instructions get skipped, the script still says no.
- **Re-runs are safe.** A second pass fills in blanks and never touches a row I already decided.

## In my own words

The rule came out of a few short messages before it was ever code:

- "propose, create relevant csvs, reviewed in ui" (August 2026)
- "the choice to publish should be mine whether buttons in ui or ask question in skill" (August 2026)
- "we should have a different button - queue for publishgin vs a red publish as exception" (August 2026)

## Related

- [Claude Code Techniques](/craft/generative-ai/claude-code-techniques): the other pages in this set.
- [Telling Claude When to Stop and Ask](/craft/generative-ai/claude-code-techniques/telling-claude-when-to-stop-and-ask):
  the question tool is how the decision in the picture got made.
- This page goes with a post in my "How I Used Claude Today" series on LinkedIn.
