---
title: 'Citing the Session, Not a Memory'
description: 'Claude Code keeps every session as a log you can search. I make it cite the exact line behind a claim, and a small check refuses a citation that is not there.'
slug: /generative-ai/claude-code-techniques/citing-the-session-not-a-memory
kind: technique
usefulness: 3 # 1 to 5: how much a typical Claude Code user gets from it; the sidebar follows it
sidebar_position: 12
authors: [oeid]
tags: [claude-code, ai, productivity, provenance]
image: /img/claude-code/citing-the-session-not-a-memory.png
draft: true
questions:
  - How do I find where a number or decision in my Claude Code work came from?
  - How do I make Claude cite its sources from past sessions?
---

## What annoyed me

I keep a running list of things I've learned about working with Claude Code, and Claude helps
write it from my past sessions. Each entry said where it came from: a session, and a sentence
saying roughly what happened there.

Then I had a question about one of them, and couldn't answer it. The entry pointed at a session but
not at a moment in it. The sentence was Claude's paraphrase, not what anyone actually said. When I
asked to see one entry up close, it turned out Claude had searched for its source and found
nothing. It had been written from memory, and nothing had checked it.

## What I did about it

I stopped accepting "it came from that session." Claude Code saves every session as a log file, one
line per message, so any claim from a session can point at the exact line it came from, plus a
search anyone can rerun to find it again.

So I asked Claude to go back through the logs and pin every entry to its line. Where it couldn't
find one, it had to say so, not make one up. Then I asked why nothing had caught the missing
citation in the first place, and we turned the rule into a small tool. It refuses to save a
citation unless the quoted words are really at that line, and it can recheck every saved citation
on demand.

## Set it up

Claude Code keeps each session as a `.jsonl` file under `~/.claude/projects/<folder>/`, one line
per event. The line number in that file is a stable address for a moment in the session. A
citation is the file, the line, and a few words that should be on it.

Add a section like this to your `CLAUDE.md` (the file Claude Code reads at the start of every
session, either in your home folder for all projects or at the root of one project):

```markdown
## Cite past sessions by line

When a plan, a doc or a note says something came from a past session (a
number, a decision, a quote), cite it as: session file, line number, and a
short phrase that appears on that line. Never cite a session by name alone,
and never paraphrase as if quoting.

- Before writing the citation, open the session file and confirm the phrase
  is on that line.
- If you can't find the line, write it down as a gap ("no anchor found,
  searched for X"). Never guess a line number.
- When someone asks where a claim came from, go to the session file first,
  before re-deriving it or trusting it.
```

And a check that refuses a citation whose words aren't on its line:

```bash
#!/bin/sh
# check-citation.sh <session.jsonl> <line> "<phrase>"
# Exits 1 if the phrase is not on that line of the session log.
sed -n "${2}p" "$1" | grep -qiF "$3" \
  && echo "ok: line $2 has \"$3\"" \
  || { echo "not found: line $2 does not contain \"$3\""; exit 1; }
```

Run it before saving a citation, and over every saved citation now and then. Mine grew into a
small command with `add` (refuses to save unless the check passes), `verify` (rechecks them all)
and `show` (prints the quoted line fresh from the log, so the quote is never copied and left to
drift).

## What it looks like

<figure style={{maxWidth: '480px', margin: '0 auto 1.5rem'}}>
  <img src="/img/claude-code/citing-the-session-not-a-memory.png" alt="A Claude Code session: I ask whether we are logging the exact transcripts and line numbers behind each observation, Claude replies that it replaced paraphrases with verified line numbers and flagged two entries it could not anchor, and later it fixes one of its own citations that pointed at the wrong line" />
</figure>

This is from a real session in August. I asked whether each entry on the list pointed at the exact
lines it was built on, with a search I could rerun if I had more questions.

Claude went back through the logs and replaced each paraphrase with a line number, a timestamp and
a search phrase. Two entries had no clean match. It flagged those as gaps instead of inventing a
line. When I asked why nothing had caught this earlier, the honest answer was that nothing was
checking. So we built the check. All 15 citations then passed it.

The part I like most came next. Every citation passed, and Claude still found a wrong one: one
entry pointed at the very same line as another entry's quote. The words were really on that line,
so the check passed, but they were evidence for something else. Claude marked that entry as a gap
rather than leave a quote that didn't support it.

## Why it works

- **A line number is an address.** "Somewhere in that session" can't be checked. A file, a line
  and the words on it can, by anyone, in a second.
- **A gap is better than a guess.** Saying "no anchor found" keeps the list honest, and tells you
  exactly which entries to go back and support.
- **The tool makes the rule stick.** A rule in a doc relies on someone remembering it. A command
  that refuses to save a bad citation doesn't.
- **Reading the quote still matters.** A check can prove the words are on the line. Only reading
  them tells you they support the claim.

## In my own words

- "are we logging exactly the transcripts that we built the observation on?" (August 2026)
- "how did we get this without citation ... did guards not catch this?" (August 2026)
- "should [we] be using a CLI instead that does validation?" (August 2026)

## Related

- [Telling Claude When to Stop and Ask](/craft/generative-ai/claude-code-techniques/telling-claude-when-to-stop-and-ask):
  another page that reads Claude Code's session logs.
- [Claude Code Techniques](/craft/generative-ai/claude-code-techniques): the other pages in this set.
- This page goes with a post in my "How I Used Claude Today" series on LinkedIn.
