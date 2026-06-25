---
slug: experimentation
title: 'The Experimentation Board'
kind: legend
sidebar_label: 'Experiments board'
description: 'A live board of my experiments, each a card that moves from plan to running to result. Click a card to open it and read the full write-up.'
authors: [oeid]
tags: [experiments, ab-testing, projects]
date: 2026-06-25
draft: false
---

This is the live index of my experiments. Each card is one experiment post, and it moves
across the board as the work moves: from a **plan** (the hypothesis and design), through
**running** (collecting data), to a **result** (the outcome and the decision). The card's
position is its `stage`, read straight from the post's frontmatter, so the board can never
drift from the posts it indexes.

<!-- truncate -->

Click any card to open it, then follow the link to read the full write-up.

<KanbanBoard board="experiments" />

## How the board works

The board is generated, not hand-maintained. Every experiment is a post on the Initiatives
blog with a `kind` that flips from **experiment plan** 📝 to **experiment result** 📊 once the
outcome lands. The board reads each post's `stage` and `priority` and slots it into the right
column. To move a card, I change one line of frontmatter on the post; the board re-derives on
the next build.

| Column | What it means |
|---|---|
| Proposed | An experiment I want to run, not yet designed. |
| Designed | Hypothesis and design are written, not yet live. |
| Running | Live and collecting data. |
| Analyzing | Data is in; I am working out what it says. |
| Concluded | Decision made and recorded; a result post. |

The durable framework behind these (how I think about experiments, the lifecycle, the
methods) lives on the Craft side, under
[Product Management → Experiments](/craft/product-management/experiments). This board is the
temporal half: the specific experiments I have actually run.
