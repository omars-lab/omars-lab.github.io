---
slug: self-healing-storefront
title: "Self-Healing Storefront: An Agent That Runs Its Own A/B Tests"
kind: design-story
sidebar_label: "Self-Healing Store"
description: "The story behind a design for an autonomous experimentation agent: it turns detected conversion problems into a ranked backlog of A/B tests, ships the winners, and reports the dollar lift."
authors: [oeid]
tags: [system-design, architecture, generative-ai, claude, ecommerce, experimentation, designs]
date: 2026-06-22T10:00
draft: false
---

One of four designs I co-designed with Claude (I drove the structure and decisions; Claude proposed architectures and named the trade-offs). This is the story behind it; the full design doc lives on the Designs blog.

👉 **[Read the design: Self-Healing Storefront](/designs/design-self-healing-storefront)**

<!-- truncate -->

## The problem

The [Ecommerce Site Scanner](/thoughts/ecommerce-site-scanner) *finds* what is wrong with a store. This is the *fix* half: once you know the conversion problems, who actually runs the experiments to fix them, safely, on live traffic?

## The design

This is an autonomous experimentation agent for ecommerce. It turns detected conversion problems plus a store's own analytics into a ranked backlog of A/B tests, generates on-brand variants, runs them safely on live traffic with statistics suited to the store's traffic level, ships the winners, and reports the dollar lift in plain language.

Autonomy is gated by risk: low-risk copy and layout changes can ship automatically; pricing and checkout changes always need human approval.

## Why it's worth reading

The design is **In Review**. The interesting open questions are about trust: how much autonomy is safe at each risk tier, and how to do honest statistics on a store that does not have Amazon-scale traffic. Read it like a colleague's notes.

👉 **[Open the full design doc](/designs/design-self-healing-storefront)**
