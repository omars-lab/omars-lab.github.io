---
slug: idea-bookmark-portability
title: 'Should I Make My Browser Bookmarks Portable?'
sidebar_label: 'Bookmark export?'
description: 'Export browser bookmarks from one browser via the command line and import them into another, so switching browsers does not mean leaving my bookmarks behind.'
authors: [oeid]
tags: [ideas, scripting, automation, browser, tooling]
date: 2022-04-18
kind: idea
board: ideas
stage: backlog
priority: low
draft: false
---

Switching browsers always strands my bookmarks. The export/import is doable through the UI, but
it is manual and lossy. I want it scriptable.

<!-- truncate -->

**The idea.** A command-line path to export browser bookmarks from one browser and import them
into another, so moving between browsers (or keeping two in sync) is a script, not an afternoon
of clicking.

## Plan

- [ ] Read/export bookmarks from the source browser's store via the command line.
- [ ] Transform to the destination browser's import format.
- [ ] Import into the destination browser.

## Success criteria

- A single command moves my bookmarks from one browser to another with nothing lost.
