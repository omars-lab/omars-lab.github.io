---
slug: ecommerce-site-scanner
title: "Ecommerce Site Scanner: A Lead Engine That Finds What's Wrong"
kind: design-story
sidebar_label: "Site Scanner"
description: "The story behind a design for an autonomous lead-generation engine that scans ecommerce sites for growth problems, verifies a contact, and drafts outreach for a human to send."
authors: [oeid]
tags: [system-design, architecture, generative-ai, claude, ecommerce, designs]
date: 2026-06-22T10:00
draft: false
---

This is one of four high-level designs I worked through with Claude as a co-designer: I drove the structure and the decisions, Claude proposed architectures and named the trade-offs. This post is the story; the full design doc is on the Designs blog.

👉 **[Read the design: Ecommerce Site Scanner and Lead Generation Engine](/designs/design-ecommerce-site-scanner-and-lead-generation-engine)**

<!-- truncate -->

## The problem

A two-person founding team cannot hand-prospect enough qualified ecommerce leads. The work is real but it does not scale with two pairs of hands.

## The design

This design is an autonomous engine that discovers sites, scans their public pages for growth-marketing problems, estimates size, finds and verifies a contact, scores the lead with explainable reasons, and drafts a personalized outreach message for a human to send. Outreach stays draft-only, with a human on every send.

It is also the front door to a bigger idea: the scanning intelligence that *finds* what is wrong is the same engine that will later *fix* it (see the [Self-Healing Storefront](/thoughts/self-healing-storefront)).

## Why it's worth reading

The design is **In Review**, so you are seeing the open questions too: how to verify a contact responsibly, how to keep scoring explainable, where the human stays in the loop. Read it like a colleague's notes.

👉 **[Open the full design doc](/designs/design-ecommerce-site-scanner-and-lead-generation-engine)**
