---
slug: idea-smarter-date-helpers
title: 'Should I Build Smarter Date-Tag Helpers?'
sidebar_label: 'Date helpers?'
description: 'Upgrade the date-tag tooling: a non-recursive "today" substituter, a "next workday" mode, a "next weekend" tag, and a cron that auto-stamps new ideas with their capture date.'
authors: [oeid]
tags: [ideas, scripting, automation, dates, tooling]
date: 2022-07-08
kind: idea
board: ideas
stage: backlog
priority: low
draft: true
---

My auto-expanding date tags (`>2022-01-12` and friends) work, but the substituter is naive. A
few targeted upgrades would make the system trustworthy enough to lean on.

<!-- truncate -->

**The idea.** Make the date-tag helpers smarter:

- a non-recursive "today" substituter (the current one re-expands things it already touched);
- a "next workday" mode (skip weekends when expanding);
- a "next weekend" date tag;
- a cron job on the date expander that auto-tags new ideas with their capture date, so every
  captured thought carries the date I first had it without me typing it.

That last one is what would make a backlog like this self-dating: the earliest date on an idea
becomes real data instead of something I reconstruct later.

## Plan

- [ ] Rewrite the "today" substituter to be idempotent (non-recursive): expanding an already
      expanded line is a no-op.
- [ ] Add a "next workday" expansion mode (Mon-Fri aware).
- [ ] Add a "next weekend" date tag.
- [ ] Add a cron job that stamps newly captured ideas with their capture date automatically.

## Success criteria

- Re-running the expander never double-expands a line.
- New captures get a capture-date tag with no manual step.
