---
slug: idea-alias-finder
title: 'Should I Build an Alias Finder for My Commands?'
sidebar_label: 'Alias finder?'
description: 'A tool that scans all my commands and proposes sensible two-letter acronym aliases, so the helpers I reach for most get short names without me inventing them.'
authors: [oeid]
tags: [ideas, scripting, automation, shell, tooling]
date: 2022-04-13
kind: idea
board: ideas
stage: backlog
priority: low
draft: false
---

I have more commands than I have short names for. Inventing aliases by hand is haphazard, so the
ones I use most still have long names. Let a tool propose them.

<!-- truncate -->

**The idea.** An alias finder that scans all my commands and proposes common two-letter acronym
aliases. It does the boring part (deriving candidate short names and spotting collisions); I just
accept or reject.

## Plan

- [ ] Enumerate all my defined commands/functions.
- [ ] Generate candidate two-letter acronym aliases for each.
- [ ] Flag collisions and propose a non-conflicting set for me to approve.

## Success criteria

- I get a proposed alias list I can adopt wholesale, with no two aliases clashing.
