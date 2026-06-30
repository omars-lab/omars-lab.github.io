---
slug: idea-track-script-usage
title: 'Should I Track Which of My Scripts I Actually Use?'
kind: idea
sidebar_label: 'Script usage?'
description: 'A board-ready idea: instrument my shell functions to log how often each is used, so I can confidently retire the dead ones, and turn the instrumentation into a reusable technique.'
authors: [oeid]
tags: [ideas, scripting, automation, self-quantifying]
date: 2022-05-07
draft: false
board: ideas
stage: backlog
priority: low
---

A captured idea, matured into something I could actually act on. It started as one line in a
backlog ("track script usage: list every function, record how often each is used, retire the
unused ones"). Here is the firmed-up version.

<!-- truncate -->

**Motivation.** Three things at once: years of shell functions have piled up and I cannot tell
which are dead weight; when I refactor or document my tooling I have no signal for which scripts
earn their place; and I am genuinely curious which tools I actually reach for (it fits the
broader "quantify yourself" thread).

**Value.** Two concrete payoffs. First, usage data lets me delete unused functions without fear,
shrinking the toolset and making it maintainable. Second, the instrumentation itself (wrapping
shell functions to log usage) is a reusable, blog-worthy technique. If I do not do it, nothing
breaks, but the cruft keeps growing and the toolset stays murky. The cost is modest: a logging
wrapper plus a tally script.

**Scope.** v1 is just my own interactive shell functions on one machine, logging a timestamp and
function name to a local file, with a script that tallies counts. Explicitly OUT of v1: syncing
across machines, tracking external binaries (only my functions), and any dashboard or
visualization.

## Plan

- [ ] Spike: list every shell function I define (`declare -F` / parse the dotfiles).
- [ ] Decide the logging mechanism: wrap functions so each invocation appends `timestamp,name`
      to a usage log (a `DEBUG` trap or generated wrappers). Pick one in the spike.
- [ ] Implement the wrapper/instrumentation for the function set.
- [ ] Write a tally script: usage counts per function over a window, sorted, with never-used
      functions called out.
- [ ] Run it for a few weeks of real usage, then review the never-used list and retire the
      dead ones.
- [ ] If the wrapper pattern is clean, write it up as a durable scripting technique in `/craft`.

## Success criteria

- I can produce a sorted "how often each function was used in the last N weeks" report on demand.
- After a review window, I retire at least the clearly-never-used functions with confidence.
- Done enough when the report exists and I have done one retirement pass; abandon if the logging
  overhead is annoying in daily use or the data does not change any decision.

## Open questions

- Trap-based logging vs generated wrappers: which is less intrusive in an interactive shell?
  (Needs the spike.)
- Is per-invocation logging cheap enough to leave on permanently, or only during a measurement
  window?
