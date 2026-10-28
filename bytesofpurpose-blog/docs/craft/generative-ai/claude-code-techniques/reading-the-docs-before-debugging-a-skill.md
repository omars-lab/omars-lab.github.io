---
title: 'Reading the Docs Before Debugging a Skill'
description: 'When a Claude Code skill will not fire, read its description first. It is the line Claude matches your request against. Plus a check that catches thin ones.'
slug: /generative-ai/claude-code-techniques/reading-the-docs-before-debugging-a-skill
kind: technique
usefulness: 3 # 1 to 5: how much a typical Claude Code user gets from it; the sidebar follows it
sidebar_position: 9
authors: [oeid]
tags: [claude-code, ai, productivity, skills, debugging]
image: /img/claude-code/reading-the-docs-before-debugging-a-skill.png
draft: true
questions:
  - Why doesn't my Claude Code skill run when I ask for the thing it does?
  - How does Claude Code decide which skill to load?
---

## What annoyed me

One of my Claude Code skills kept not firing. I'd ask for exactly the thing it was written to do,
and it wouldn't load. It was a bug we had, and reading the docs would have fixed it.

Later, Claude was listing the lessons it had pulled from my sessions. It wrote this one up
as a new convention, "treat a skill's description field as the dispatch prompt", and flagged a
gap: there was no doc on writing a good description yet, as if one needed writing. But Claude
Code's own docs already say it, plainly.

## What I did about it

I made it a rule: when a skill doesn't fire, **read how Claude Code picks skills before you debug
anything**. The answer is short. Claude Code puts every skill's `description` into the context, and
that line is what Claude matches your request against. The body of the skill only loads after
that match. So a skill that never fires almost always has a description that is missing, vague, or
written like a doc comment ("Helper for Makefiles") instead of saying when to use it.

The docs put it in one sentence: the description says "what the skill does and when to use it.
Claude uses this to decide when to apply the skill." And when there is no description at all,
Claude Code "uses the first non-empty line of the markdown content", which is usually just the
skill's title. The same page has a "Skill not triggering" checklist, and warns that with a lot of
skills installed, Claude Code may drop the descriptions of the ones you use least to save room.

## Set it up

Add a section like this to your `CLAUDE.md` (the file Claude Code reads at the start of every
session):

```markdown
## Skills

A skill that does not fire when it should: read its frontmatter `description`
first. That line is what Claude reads to decide whether to load the skill; an
empty or vague one means it never triggers on its own. Fix the description
before touching the body. Check the Claude Code skills docs before debugging
by trial and error.
```

A good description says what the skill does, then when to use it, in the words someone would
actually type:

```markdown
---
name: makefile-setup
description: Creates or enhances a project Makefile with well-structured targets
  (help, install, test, build, lint, clean). Use when someone asks for a Makefile,
  wants make targets added, or says "give me a make help".
---
```

Then make a missing description fail loudly instead of quietly. This script lists every skill whose
description is missing or under 40 characters, and exits non-zero so it can run in a pre-commit
hook or CI:

```bash
#!/usr/bin/env bash
# Fail when a skill's description is missing or too short for Claude to match a request.
# Usage: check-skill-descriptions.sh [folder]   (default: .claude/skills)
status=0
while IFS= read -r f; do
  desc=$(awk 'NR==1 && !/^---[[:space:]]*$/ {exit}
              /^---[[:space:]]*$/ {c++; if (c==2) exit; next}
              c==1 && /^description:/ {sub(/^description:[[:space:]]*/, ""); print; exit}' "$f")
  desc=${desc#\"}; desc=${desc%\"}; desc=${desc#\'}; desc=${desc%\'}
  if [ ${#desc} -lt 40 ]; then
    echo "weak or missing description: $f"
    status=1
  fi
done < <(find "${1:-.claude/skills}" -name SKILL.md)
exit $status
```

It reads one-line descriptions. If you write yours as a YAML block (`description: >`), use a YAML
parser instead. Forty characters is a floor, not a target: it catches the empty ones and the bare
titles.

## What it looks like

<figure style={{maxWidth: '480px', margin: '0 auto 1.5rem'}}>
  <img src="/img/claude-code/reading-the-docs-before-debugging-a-skill.png" alt="A Claude Code session: Claude lists treating a skill's description as the dispatch prompt as a lesson and flags a missing doc on writing descriptions; I reply that this was a bug we had, fixable by reading the docs; Claude rewrites the lesson as a real skill-dispatch bug" />
</figure>

This is from the session where Claude was collecting techniques from my own work. Its list had the
lesson as number 4, and a note that nobody had written a doc on good descriptions yet. I pushed
back in one line: this was a bug we had, and the docs already covered it. Claude rewrote the entry
as what it was, a bug you fix by reading the existing docs, and dropped the plan to write a new
guide.

## What the check found

I ran the check over my own plugin collection as it stood before I fixed it. It flagged **15 of 141
skills**. None of the 15 had a description at all. With nothing else to go on, Claude Code was using
each one's first line, a bare title like `# Makefile Setup` or `# Knowledge Query`. Two or three
words is not much to match a request against.

Each of the 15 got a description that says what it does and when to use it, and the collection's
own validator now fails on a missing or short one. After the fix this check flagged none of 147,
and it still flags none today.

## Why it works

- **It starts where the behaviour is defined.** How Claude Code picks a skill is documented. Reading
  that first turns a mystery into a one-line fix.
- **The description is the only part Claude sees up front.** A brilliant skill body can't help if
  the one line in front of it doesn't match what you asked.
- **The check turns a silent failure into a loud one.** A skill that never fires gives no error.
  A script that fails on an empty description does.

## In my own words

- "this is a bug we had, not documentation ... could have easily been resolved reading docs"
  (August 2026)

## Related

- [Claude Code skills docs](https://code.claude.com/docs/en/skills): how skills load, and a
  "Skill not triggering" checklist.
- [Claude Code Techniques](/craft/generative-ai/claude-code-techniques): the other pages in this set.
- [Telling Claude When to Stop and Ask](/craft/generative-ai/claude-code-techniques/telling-claude-when-to-stop-and-ask):
  another rule that lives in `CLAUDE.md`.
- This page goes with a post in my "How I Used Claude Today" series on LinkedIn.
