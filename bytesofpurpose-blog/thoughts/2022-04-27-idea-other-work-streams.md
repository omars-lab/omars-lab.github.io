---
slug: idea-other-work-streams
title: 'Should I Auto-Surface My Other Work Streams?'
sidebar_label: 'Work streams?'
description: 'Auto-generate an "other work streams" file from every note carrying a "today" tag, so the threads I am actively working stay visible in one place instead of scattered across notes.'
authors: [oeid]
tags: [ideas, scripting, automation, notes, productivity]
date: 2022-04-27
kind: idea
board: ideas
stage: backlog
priority: low
draft: true
---

My active work is scattered across whatever notes I happened to be in. I want a single view of
"what I am currently working on" that builds itself from the notes I have already tagged.

<!-- truncate -->

**The idea.** An "other work streams" file, auto-generated from notes carrying a "today" tag.
Anything I have flagged as today's work, anywhere in the book, gets pulled into one file so the
threads I am actively running are visible together instead of buried in their home notes.

This rides on the same "today"-tag mover the date-tag system already uses; it is a second
consumer of that signal.

## Plan

- [ ] Scan the notes for the "today" tag.
- [ ] Aggregate the tagged items into a generated "other work streams" file.
- [ ] Regenerate it on the same trigger the today-mover runs on (on note open, not blind cron).

## Success criteria

- One file always reflects every currently-tagged work stream, with no manual upkeep.
