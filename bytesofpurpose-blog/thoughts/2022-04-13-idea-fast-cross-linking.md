---
slug: idea-fast-cross-linking
title: 'Should I Make Cross-Linking Between My Notes Faster?'
sidebar_label: 'Cross-linking?'
description: 'Lower the friction of linking notes together: variable-driven glue links wired into iA Writer, a copy-all-locations helper feeding pbcopy, and auto-inserted VS Code headers in NotePlan files.'
authors: [oeid]
tags: [ideas, scripting, automation, notes, knowledge-base]
date: 2022-04-13
kind: idea
board: ideas
stage: backlog
priority: low
draft: true
---

The thing that stops me cross-linking notes is friction: hunting for the right path, copying it,
pasting it in the right shape. A few small helpers would make linking nearly free.

<!-- truncate -->

**The idea.** Three small tools that all reduce link friction:

- **Smarter glue links.** Add variables to glue links, and integrate glue with iA Writer so the
  links resolve where I actually write.
- **Copy all locations.** A helper that adds every location to the `pbcopy` script at once, so
  fast cross-linking is one keystroke instead of one-path-at-a-time.
- **Auto headers.** A script to auto-add a VS Code header to a NotePlan calendar file, so jumping
  between the two editors keeps its context.

## Plan

- [ ] Add variable support to glue links and wire glue into iA Writer.
- [ ] Build the "copy all locations" helper that feeds every location into the `pbcopy` script.
- [ ] Script the VS Code header auto-insert for NotePlan calendar files.

## Success criteria

- Linking to another note is one action, not a path hunt.
- Locations are copyable in bulk for fast cross-referencing.
