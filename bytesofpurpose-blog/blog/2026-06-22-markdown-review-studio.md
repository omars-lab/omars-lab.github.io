---
slug: markdown-review-studio
title: "Markdown Review Studio: Closing the Loop Between Feedback and Edit"
kind: design-story
sidebar_label: "Review Studio"
description: "The story behind a design for a local-first app to review markdown with visually anchored comments and trigger Claude Code to act on them, with every round committed to git."
authors: [oeid]
tags: [system-design, architecture, generative-ai, claude, tooling, designs]
date: 2026-06-22T10:00
draft: false
---

The most meta of four designs I co-designed with Claude, and the one I most want to build. I drove the structure and decisions; Claude proposed architectures and named the trade-offs. This is the story; the full design doc is on the Designs blog.

👉 **[Read the design: Markdown Review Studio](/designs/design-markdown-review-studio)**

<!-- truncate -->

## The problem

Reviewing long markdown documents (like these very design docs) with an AI assistant is lossy: feedback is unanchored prose in a chat window, and the link between a comment and the edit it produced is never recorded. You lose the trail from "here is my feedback" to "the doc changed because of it."

## The design

Markdown Review Studio is a local-first web app to view a markdown file, leave visually anchored comments, and trigger Claude Code to act on them, with every round committed to git. It closes the loop between "here is my feedback" and "the doc is updated."

Fittingly, it is the tool I would use to review the other three designs in this set.

## Why it's worth reading

The design is **In Review**. The open questions are about the anchoring (how a comment stays attached to the right span as the doc changes) and the git-per-round model. Read it like a colleague's notes, and if you would build it differently, that is the kind of review the doc invites.

👉 **[Open the full design doc](/designs/design-markdown-review-studio)**
