---
slug: idea-slack-to-markdown
title: 'Should I Build a Slack-Thread to Clean-Markdown Exporter?'
sidebar_label: 'Slack to Markdown?'
description: 'A script that copies a Slack thread out as clean Markdown, so a useful discussion can land in my notes as readable prose instead of a wall of pasted chat.'
authors: [oeid]
tags: [ideas, scripting, automation, notes, slack]
date: 2022-04-13
kind: idea
board: ideas
stage: backlog
priority: low
draft: true
---

Good discussions happen in Slack threads, and I want to keep them in my notes. Pasting a thread
raw is unreadable; cleaning it up by hand is tedious enough that I usually do not bother.

<!-- truncate -->

**The idea.** A script to copy a Slack thread out as clean Markdown: author, message, and
structure preserved, but rendered as readable prose I can drop straight into a note.

## Plan

- [ ] Pull a thread's messages (API or export) given its link.
- [ ] Render them as clean Markdown (attribution + ordering, noise stripped).
- [ ] Put the result on the clipboard for a one-step paste into my notes.

## Success criteria

- Copying a thread gives me note-ready Markdown with no manual cleanup.
