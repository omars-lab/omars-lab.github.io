---
slug: idea-shell-completion-system
title: 'Should I Build a Self-Describing Shell-Completion System?'
sidebar_label: 'Shell completion?'
description: 'One generic completion mechanism every command opts into: run it with --options and it returns its own flags, generated from its own bash case statement.'
authors: [oeid]
tags: [ideas, scripting, automation, shell, tooling]
date: 2022-04-13
kind: idea
board: ideas
stage: backlog
priority: low
draft: false
---

One completion mechanism, shared by every command I write, instead of hand-maintaining a
completion script per tool.

<!-- truncate -->

**The idea.** A generic shell-completion convention: when a command runs with `--options` it
returns its own list of options. Every tool opts into the same mechanism, so the date helpers,
the AWS-profile switcher, and `sed-dates` all complete the same way (the AWS switcher is the
first thing to convert).

**The clever part.** Rather than declaring the option list twice (once in the `case` statement
that handles the flags, once in a completion file), parse the command's own bash `case`
statement and auto-generate the completion options from it. The command stays the single source
of truth; completion is derived, never drifts.

## Plan

- [ ] Define the `--options` convention: a command run with `--options` prints its flags, one per
      line, for the completer to consume.
- [ ] Write the generic completer that calls `<cmd> --options` and feeds the result to the shell.
- [ ] Parse a bash `case` statement and auto-generate the `--options` output from it, so the case
      block is the only place options are declared.
- [ ] Convert the AWS-profile switcher to use it (first adopter), then the date helpers and
      `sed-dates`.

## Success criteria

- A new command gets working tab-completion by adding nothing but its normal `case` block.
- The AWS switcher, the date helpers, and `sed-dates` all complete through the one mechanism.
