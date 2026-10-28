---
title: 'A Rubric That Learns From Every Review'
description: 'Turn a review you keep doing by taste into a skill with a rubric file beside it, and have every round of feedback written back into that file.'
slug: /generative-ai/claude-code-techniques/a-rubric-that-learns-from-every-review
kind: technique
usefulness: 3 # 1 to 5: how much a typical Claude Code user gets from it; the sidebar follows it
sidebar_position: 11.3
authors: [oeid]
tags: [claude-code, ai, productivity, skills, writing]
image: /img/claude-code/a-rubric-that-learns-from-every-review.png
draft: true
questions:
  - How do I get Claude Code to review my writing the way I would?
  - How do I stop giving Claude the same feedback on every draft?
  - Where should a skill keep the criteria it judges against?
---

## What annoyed me

When I asked Claude Code to review one of my design posts, it judged by its own idea of good
writing, plus whatever I'd typed in that chat. My notes were always the same kind: too wordy,
where's the diagram, who is this even for. But they lived in one chat, and the next post's review
started from zero.

Claude wasn't doing anything wrong. It just had nowhere to keep what I'd taught it.

## What I did about it

I turned the review into a skill, and gave the skill two files next to it that hold the judgment.
One lists the questions each section of a post has to answer. The other holds the voice rules, each
with a before and after. The skill reads both before it audits a post, and every finding points at
the line it breaks.

The part that makes it work is the last step. When I push back on an audit, or tell it something it
missed, the skill writes that lesson into the right file, tagged with the post that taught it. The
steps in my skill settled after the second post. The two files kept growing with every one.

## Set it up

Give the skill a folder like this:

```text
.claude/skills/review-post/
├── SKILL.md          # the steps: read the rubric, audit, report, capture
├── RUBRIC.md         # the questions each section must answer, with pass and fail examples
└── STYLE-GUIDE.md    # the voice rules, each with a before and after
```

Then put two steps in `SKILL.md`, one at the start and one at the end:

```markdown
## Before judging

Read RUBRIC.md and STYLE-GUIDE.md in this folder, whole. Judge only
against them. Quote the line a finding breaks, so every finding points
at a rule and not at taste.

## After the review

When I disagree with a finding, add one, or explain why something reads
wrong, write the lesson into the right file in the same session:

- "A section must answer X" goes in RUBRIC.md.
- A wording or voice rule goes in STYLE-GUIDE.md.
- Each new rule gets one line on why, and the name of the post that
  taught it, so it can be traced and questioned later.
- If the same rule shows up from a second post, merge the two and say
  so, rather than keeping near-copies.

Tell me which rules you added or changed before you finish.
```

Start the rubric small. Mine began with a handful of questions I already asked of every post. The
reviews filled in the rest.

## What it looks like

<figure style={{maxWidth: '480px', margin: '0 auto 1.5rem'}}>
  <img src="/img/claude-code/a-rubric-that-learns-from-every-review.png" alt="A Claude Code session: I ask for a skill that captures my feedback and adds it back to the skill so new posts share the guidance, then two days and three audited posts later I ask to apply it to another post, and Claude says each audit both improves the post and teaches the guides" />
</figure>

This is from the session where I built the review skill for the design posts on this blog, in July.
My first message asked for exactly this: as I give feedback, capture what generalizes and add it
back to the skill, so the next post starts from it.

On the second post I told it that a design post should open with who it's for and what they'll do
with it, before any of the system. That went into the rubric as a required first section. The
third post was missing it. The fourth was the most complete one I had, with personas and use cases
already written, and the audit still caught it: the people were there, just a hundred lines down,
where a reader meets the machine first.

By then the rubric's list of recurring problems opened with one that every audit had found in some
form: the post doesn't say who it's for. It now tells the next audit to check that first.

## Watch the rubric grow

The rubric files are tracked in git, so their history is the record of what each review taught.
This prints the size of a rubric file at every commit that touched it:

```bash
f=.claude/skills/review-post/RUBRIC.md
for c in $(git log --reverse --format=%h -- "$f"); do
  printf '%s  %s  %4s lines\n' "$c" "$(git log -1 --format=%ad --date=short "$c")" \
    "$(git show "$c:$f" | wc -l)"
done
```

For my design-post skill the two files went from 134 lines, when the skill was first written, to
292 three days and four audited posts later. One commit in that run made the style guide shorter:
a pass that merged rules different posts had taught separately. That is the file doing its job too.

## Why it works

- **The steps and the taste change at different speeds.** My audit steps stopped changing after
  the second post. The rules changed with every one. Keeping them apart means the rules can grow without the skill getting harder to
  read.
- **A finding points at a line, not a mood.** When the audit says "breaks: open with who it's for",
  I can agree, or I can fix the line. Either way the next review is better.
- **Post four gets everything I said about posts one to three.** I don't have to remember to say
  it again, and neither does Claude.
- **Each rule names where it came from.** When a rule stops making sense, I can find the post that
  taught it and decide if it still holds.

## In my own words

- "as I provide the skill feedback, we should capture potential generalizations … and add them back
  to the skill" (July 2026)
- "there is a set of questions I like to answer per section … our skill should be capturing the set
  of questions each section should answer" (July 2026)
- "can we now apply this to another post" (July 2026)

## Related

- [Saving the Yeses in Claude's Memory](/craft/generative-ai/claude-code-techniques/saving-the-yeses-in-claude-memory):
  the same idea for memory, keeping what worked and not only what went wrong.
- [Claude Code Techniques](/craft/generative-ai/claude-code-techniques): the other pages in this set.
- This page goes with a post in my "How I Used Claude Today" series on LinkedIn.
