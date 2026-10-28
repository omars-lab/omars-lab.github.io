---
title: 'Fixing the Check That Missed It'
description: 'When Claude Code output has a flaw, fix the hook or validator that let it through first, then the output, then rerun the check on everything.'
slug: /generative-ai/claude-code-techniques/fixing-the-check-that-missed-it
kind: technique
usefulness: 3 # 1 to 5: how much a typical Claude Code user gets from it; the sidebar follows it
sidebar_position: 11.6
authors: [oeid]
tags: [claude-code, ai, productivity, hooks, quality]
image: /img/claude-code/fixing-the-check-that-missed-it.png
draft: true
questions:
  - What should I do when Claude Code's output has a mistake my checks should have caught?
  - How do I stop the same mistake coming back in generated files?
  - How do I know a Claude Code hook actually catches what it should?
---

## What annoyed me

I have a hook that stops Claude Code from writing an em dash into anything a reader sees. I
don't want my posts reading like a chatbot wrote them. Then one morning I saw an em dash in a
diagram on a post Claude had just reworked.

The quick fix was obvious: swap it for a colon and move on. But the hook had already said that
post was clean. If it missed this one, it would miss the next one too, and I'd be the one
catching them by eye.

## What I did about it

The one question that mattered was: did our hook not catch this? What came out of that morning is
the order I now hold Claude to:

1. Find out why the check missed it.
2. Fix the check, and prove it now catches the case.
3. Fix whatever told Claude to write it that way.
4. Rerun the fixed check over everything, not just this file.
5. Then fix the output.

The flaw is a symptom. The thing to fix is the hook, script or skill that let it through. A fixed
file stays fixed until the next one. A fixed check covers every file after it.

## Set it up

Put the rule where Claude reads it every session, in `CLAUDE.md`:

```markdown
## When I point out a flaw in something you made

Before fixing the file, find the check that should have caught it (a hook,
a validator, a test) and say why it didn't. If there's no such check, say
whether there should be.

1. Fix the check first. Prove it with a sample that must fail and one that
   must pass, and show me both results.
2. If a skill or doc told you to do it this way, fix that too.
3. Run the fixed check over the whole repo, not just this file, and tell me
   what else it finds before fixing those.
4. Then fix the file I pointed at.
```

For step 1, keep a few sample files next to the check and run them every time the check
changes. A check that has stopped catching anything looks exactly like one that's passing:

```bash
# Each sample file says in its name whether the check must block it.
for f in .claude/hooks/samples/*; do
  if ./check-em-dash.sh "$f" >/dev/null; then got=pass; else got=block; fi
  case "$f" in *must-block*) want=block ;; *) want=pass ;; esac
  [ "$got" = "$want" ] || echo "WRONG: $f ($got, wanted $want)"
done
```

## What it looks like

<figure style={{maxWidth: '480px', margin: '0 auto 1.5rem'}}>
  <img src="/img/claude-code/fixing-the-check-that-missed-it.png" alt="A Claude Code session: I ask why the hook didn't catch an em dash in a diagram; Claude fixes the post, then the hook, and the fixed check finds 38 more hidden in 7 files; five hours later the same hook blocks Claude's own file" />
</figure>

This is from July, on this blog. The dash in my diagram wasn't a dash in the source. It was
written as an HTML code (an ampersand, a hash and the number 8212), which a browser draws as an em dash. My hook searched for
the dash character itself, so it never saw it. And it skipped everything inside diagram blocks,
since those usually hold code.

Claude fixed the post first and called the hook "the more important fix". It taught the hook the
codes and the diagram blocks, then tried it on sample files before trusting it. The first run
passed everything, including samples that had to be blocked. Claude's first thought was that its
edit had broken the hook. It hadn't: the samples sat in a folder the hook doesn't look at. Twice
more a run came back wrong, and both times the hook was fine: the shell command writing the
samples had mangled them. Once the samples were written a cleaner way, all six came out right.
Each wrong run let through a sample that should have been blocked. That is what showed something
was off, whether in the hook or in the test.

It also found where the habit came from. A skill of mine for writing diagrams recommended the
HTML code as a way around the hook. That advice came out the same hour.

Then the fixed check went over the whole blog. It found 38 more of those codes across 7 files,
all of which had looked clean, and every one was fixed that morning. A second pass the same
morning cleared 84 plain em dashes that had built up in 12 files of older posts. Five hours
later, the hook blocked a file Claude itself was writing.

## Watch the check learn

A check that gets fixed every time it misses something carries its own history. This lists what
it learned and when:

```bash
git log --reverse --format='%ad  %s' --date=short -- .claude/hooks/em-dash-voice-hook.sh
```

Mine reads like a list of the ways around it, each closed once I'd seen it: the plain dash in
June, a double hyphen used in its place later that month, the HTML code in July, and a fix
for a false alarm on a dash inside a link's title the same day.

## Why it works

- **A file fix happens once. A check fix keeps working.** Fixing the hook protects every post I
  write after this one, not just the one I happened to look at.
- **One flaw I see usually stands for many I don't.** The one em dash I saw stood for 38 I hadn't
  seen.
- **The cause is often advice.** Here a skill was teaching the workaround. Fixing the output alone
  would have left the skill teaching it again tomorrow.
- **Proving the check catches it keeps the fix honest.** A sample that must fail is the only way
  to tell a working check from a silent one.

## In my own words

- "did our hook not catch this?" (July 2026)

## Related

- [A Rubric That Learns From Every Review](/craft/generative-ai/claude-code-techniques/a-rubric-that-learns-from-every-review):
  the same idea for judgment calls, where a check can't be a script and the rule goes into a rubric instead.
- [Looking at the Page Before Reading the CSS](/craft/generative-ai/claude-code-techniques/looking-at-the-page-before-reading-the-css):
  how I spot flaws like this one in the first place.
- [Claude Code Techniques](/craft/generative-ai/claude-code-techniques): the other pages in this set.
- This page goes with a post in my "How I Used Claude Today" series on LinkedIn.
