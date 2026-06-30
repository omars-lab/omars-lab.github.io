---
slug: idea-stale-notes-detector
title: 'Should I Build a Stale-Notes & Bad-Link Detector?'
sidebar_label: 'Notes health check?'
description: 'A regular health check over my personal book: surface stale areas by recent-edit count and catch broken links before they rot, on a multi-directory find prune.'
authors: [oeid]
tags: [ideas, scripting, automation, notes, knowledge-base]
date: 2022-04-13
kind: idea
board: ideas
stage: backlog
priority: low
draft: false
---

My personal book grows faster than I curate it. I want it to tell me where it is rotting
instead of finding out by stumbling on a dead link or a section I forgot existed.

<!-- truncate -->

**The idea.** A regular health check over the notes, two signals:

- **Stale areas.** Run `tree` over the personal book on a schedule and surface recent-edit
  counts per area, so the parts I have not touched in a while stand out (highlight them
  accordingly).
- **Broken links.** A bad-link detector that runs regularly and fixes (or flags) broken links
  across the notes before they accumulate.

**The shared dependency.** Both need to walk the book while skipping the noise directories, so
the first real task is getting the `find` mechanic working: passing multiple directories to
`find`'s prune option. That prune is the engine both the staleness scan and the link checker
ride on.

## Plan

- [ ] Get `find`'s multi-directory prune working (pass several dirs to prune in one invocation).
- [ ] Staleness scan: `tree` + per-area recent-edit counts on a schedule, highlighting stale areas.
- [ ] Bad-link detector: scan for broken links across the notes, run regularly.

## Success criteria

- I get a periodic report of which areas of the book are going stale.
- Broken links are caught by the checker, not by me tripping over them.
