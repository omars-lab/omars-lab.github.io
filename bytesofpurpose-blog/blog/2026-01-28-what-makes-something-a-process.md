---
slug: what-makes-something-a-process
title: "What Makes Something a Process"
description: "A small framework for thinking about personal and software processes — what a process actually is, the elements every one shares, and how it differs from a workflow or a technique."
authors: [oeid]
tags: [software-engineering, best-practices]
date: 2026-01-28
draft: true
---

I kept using the word "process" for very different things — a checklist, a habit, a
build pipeline — until I sat down and tried to define it precisely. It turned out to
be a useful exercise: once you can say what makes something *a process* (as opposed
to a one-off task or a vague intention), you can tell when you actually have one,
when you're missing one, and when two of them are quietly fighting each other.

This is the small framework I landed on.

<!-- truncate -->

## What a process is

A process is **the context in which you use your tools**. A tool is a hammer; a
process is "framing a wall." More precisely, a process **orchestrates multiple
activities to accomplish an end goal** — and that goal can be either the creation of
an artifact or the fulfillment of an inner state. Processes generally exist to help
you make or repeat a **big decision** without re-deriving it from scratch every time.

## The elements every process shares

When I write a process down, these are the slots I fill in. If I can't fill them, I
don't really have a process yet.

- **Purpose** — what goal does it accomplish?
- **Trigger** — when does the process apply? When do you *enter* it?
- **Inputs** — what goes into it?
- **Outputs** — what comes out?
- **Major questions** — what primary concerns does it address?
- **Activities** — what steps are involved?
- **Metrics** — how do you know it's meeting its purpose?

## The attributes that distinguish a process

A real process, as opposed to a task or an intention, has four properties. It must:

1. **Accomplish a certain goal**
2. **Be repetitive** — you run it more than once
3. **Be measurable** — you can tell whether it's working
4. **Be acted on continuously** — it's a living thing, not a one-time event

That second and fourth point are what separate a *process* from a *project*. A
project ends; a process recurs.

## Process vs. workflow vs. technique

These three get used interchangeably, but the distinctions are useful:

- A **technique** is the most tangible and specific — a single concrete way of doing
  one thing.
- A **process** is higher level: it orchestrates several activities (which may each
  use techniques) toward a goal.
- A **workflow** is the orchestration mechanism — the order, triggers, and handoffs
  by which a process's activities actually run.

So a process is *what* you're trying to accomplish and the activities involved; a
workflow is *how* those activities are wired together; a technique is a specific move
inside one of them.

## Where processes fight: conflict at the handoffs

The most useful insight I got from this was about where processes *break*. Conflicts
don't usually happen inside an activity — they happen at the **handoffs between
them**:

- If the **inputs and outputs aren't clear** at a boundary, you get conflict.
- If the two sides have **different expectations** at the boundary, you get conflict.

This is exactly **impedance mismatch** in code — the friction when one function hands
data to another that expected a different shape. Designing a process well is largely
about making its internal handoffs explicit: each activity's outputs should be
precisely what the next activity expects as input. When you find a process that keeps
producing friction, look at the seams, not the steps.

## How to know you're done

A process also needs a **definition of done** — when do you know you've completed a
run, and how do you determine completeness? Without it, a process either never ends
or ends arbitrarily. Pair that with the *breadth vs. depth* question when you're
designing one: **breadth** asks whether you've covered all the different activities;
**depth** asks whether you've covered all the possibilities within each. A good
process is honest about which of the two it's optimizing for.
