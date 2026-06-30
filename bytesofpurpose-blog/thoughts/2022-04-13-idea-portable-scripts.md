---
slug: idea-portable-scripts
title: 'Should I Make My Scripts Portable Across Machines?'
sidebar_label: 'Portable scripts?'
description: 'Package my reusable scripts so a brew install brings them to any machine, and keep work tasks backed up on a schedule so nothing local-only is ever lost.'
authors: [oeid]
tags: [ideas, scripting, automation, backup, tooling]
date: 2022-04-13
kind: idea
board: ideas
stage: backlog
priority: low
draft: false
---

My useful helpers live on one machine. Every new laptop means re-collecting them by hand, and
anything local-only is one disk failure from gone. I want my tooling and my tasks to travel with
me.

<!-- truncate -->

**The idea.** Two halves of the same "don't lose my stuff" problem:

- **Portable scripts.** `brew install` my own scripts so the reusable helpers travel with me
  across machines, and move my reusable work scripts over into that package.
- **Backed-up tasks.** A scheduled job that makes sure my work tasks are constantly backed up, so
  the task state is never trapped on a single machine.

## Plan

- [ ] Package my reusable scripts as a Homebrew formula (tap or local) so `brew install` sets up a
      new machine.
- [ ] Move the reusable work scripts into that package.
- [ ] Add a scheduled job that continuously backs up my work tasks.

## Success criteria

- A fresh machine gets my full toolset with one `brew install`.
- My work tasks are recoverable from a backup taken without me thinking about it.
