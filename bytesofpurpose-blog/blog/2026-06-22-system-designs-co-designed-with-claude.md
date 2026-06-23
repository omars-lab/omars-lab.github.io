---
slug: system-designs-co-designed-with-claude
title: '🧩 Four System Designs I Co-Designed with Claude'
description: "A look at four architecture HLDs I worked through with Claude: autonomous build agents, an ecommerce site scanner, a self-healing storefront, and a markdown review studio. Each is now a readable design doc you can open."
authors: [oeid]
tags: [system-design, architecture, generative-ai, claude, designs]
date: 2026-06-22T10:00
draft: true
---

Lately I have been writing high-level designs (HLDs) the way I wish I always had: as a back-and-forth with Claude, where the document is the artifact and the conversation is how it gets sharp. Four of them are now public on the Designs blog, retold for a general reader. This post is the front door.

👉 Browse them all under **[Designs](/designs)**, or jump straight to one below.

<!-- truncate -->

## How these came to be

Each design started as a real problem and a blank document. Instead of writing alone, I drove the structure (purpose, scope, options, decisions, risks) and used Claude as a co-designer: proposing architectures, naming the trade-offs, drafting the diagrams, and pushing back when a decision was hand-wavy. The result is a consistent shape across all four: an executive summary, the context, the options compared, the decisions (with what is settled versus still open), and the risks. They read as design docs, not chat logs.

A quick note on status: these are marked **In Review**. They are real designs with genuine open questions, not polished post-mortems. That is the point. You are seeing the thinking, including the parts that are still undecided.

## The four designs

### 🤖 [Autonomous Build Agents](/designs/design-autonomous-build-agents)

A delivery org has already automated the *planning* phase of low-code SaaS delivery: documents in, sprint-ready work items out. But the *build* is still entirely manual. This design proposes four agents (Instance Readiness, Auto Developer, Auto Tester, Knowledge Transfer Writer) that pick up a work item and carry it through configuration and validation. The hard part is cross-instance execution: the agents run on the org's own build instance but must safely change a *client's* system. Three architectures are compared, from a reviewable "instance commit" artifact to a live supervised bridge.

### 🔎 [Ecommerce Site Scanner and Lead Generation Engine](/designs/design-ecommerce-site-scanner-and-lead-generation-engine)

A two-person founding team cannot hand-prospect enough qualified ecommerce leads. This design is an autonomous engine that discovers sites, scans their public pages for growth-marketing problems, estimates size, finds and verifies a contact, scores the lead with explainable reasons, and drafts a personalized outreach message for a human to send. Outreach stays draft-only, with a human on every send. It is also the front door to a bigger idea: the scanning intelligence that *finds* what is wrong is the same engine that will later *fix* it.

### 🩹 [Self-Healing Storefront](/designs/design-self-healing-storefront)

This is the *fix* half of that idea. It is an autonomous experimentation agent for ecommerce: it turns detected conversion problems plus a store's own analytics into a ranked backlog of A/B tests, generates on-brand variants, runs them safely on live traffic with statistics suited to the store's traffic level, ships the winners, and reports the dollar lift in plain language. Autonomy is gated by risk: low-risk copy and layout changes can ship automatically; pricing and checkout changes always need human approval.

### 📝 [Markdown Review Studio](/designs/design-markdown-review-studio)

The most meta of the four, and the one I most want to build. Reviewing long markdown documents (like these HLDs) with an AI assistant is lossy: feedback is unanchored prose in a chat window, and the link between a comment and the edit it produced is never recorded. Markdown Review Studio is a local-first web app to view a markdown file, leave visually anchored comments, and trigger Claude Code to act on them, with every round committed to git. It closes the loop between "here is my feedback" and "the doc is updated." Fittingly, it is the tool I would use to review the other three.

## Why publish designs at all

A finished system rarely shows you how its author thinks. A design in review does. I am publishing these because the reasoning (the options I did not pick, the assumptions I flagged, the decisions still open) is the part worth sharing. If one of them sparks a question or a better idea, that is exactly the kind of review these documents were built to invite.

Start with whichever problem is closest to yours, and read it like a colleague's notes.
