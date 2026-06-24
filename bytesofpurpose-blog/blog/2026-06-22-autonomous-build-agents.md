---
slug: autonomous-build-agents
title: "Autonomous Build Agents: Designing the Build Half of Low-Code Delivery"
kind: design-story
sidebar_label: "Build Agents"
description: "The story behind a design for autonomous build agents: how a delivery org could carry a work item through configuration and validation on a client's system, safely."
authors: [oeid]
tags: [system-design, architecture, generative-ai, claude, agents, designs]
date: 2026-06-22T10:00
draft: false
---

I co-designed this one with Claude the way I wish I always wrote high-level designs: I drove the structure (purpose, scope, options, decisions, risks) and used Claude as a co-designer, proposing architectures, naming the trade-offs, and pushing back when a decision was hand-wavy. This is the story behind it. The full design doc is on the Designs blog.

👉 **[Read the design: Autonomous Build Agents](/designs/design-autonomous-build-agents)**

<!-- truncate -->

## The problem

A delivery org has already automated the *planning* phase of low-code SaaS delivery: documents in, sprint-ready work items out. But the *build* is still entirely manual. Someone picks up each work item and configures it by hand.

## The design

This design proposes four agents (Instance Readiness, Auto Developer, Auto Tester, Knowledge Transfer Writer) that pick up a work item and carry it through configuration and validation. The hard part is cross-instance execution: the agents run on the org's own build instance but must safely change a *client's* system. Three architectures are compared, from a reviewable "instance commit" artifact to a live supervised bridge.

## Why it's worth reading

The design is marked **In Review**: it has genuine open questions, not the tidy certainty of a post-mortem. The cross-instance safety question in particular is the kind of decision where the options matter more than the answer. Read it like a colleague's notes, and if a better idea occurs to you, that is exactly the kind of review the document was built to invite.

👉 **[Open the full design doc](/designs/design-autonomous-build-agents)**
