---
slug: getting-started-with-claude-agents
title: '🤖 A Hands-On Way to Learn What a Claude Agent Actually Is'
description: "I built a small, readable example you can open and poke at to answer one question: what is an agent, and what is a skill? It's a working stock-research agent that doubles as a teaching tool."
authors: [oeid]
tags: [ai, generative-ai, agents, claude, getting-started]
date: 2026-06-19T10:00
---

The fastest way to understand Claude agents isn't to read a framework's docs. It's to open a small, working agent and read it the way you'd read a colleague's playbook. So I built one to play with, and put it online for anyone curious.

👉 **[Getting Started with Claude Agents](https://blog.bytesofpurpose.com/getting-started-with-claude-agents/)**: open it, poke around, and the question *"what is an agent? what is a skill?"* should answer itself.

<!-- truncate -->

## What you're looking at

It's two things at once:

- A **working agent**, a stock research associate that surveys the market each morning, shortlists a few names worth a closer look, pulls the filings and numbers, builds a spreadsheet with sourced math, and stress-tests its own thesis before signing off.
- A **teaching example**, where the folders are named so that opening them explains the ideas. You don't need to know Python, JSON, or any SDK to read it. You read it like a research analyst's notes.

## The one idea worth keeping

If you take away nothing else, take this:

> **An agent is a *who*.** It's a role, like "senior research associate," that decides what to do next.
> **A skill is a *how*.** It's a specific recipe, like "spread the financials," that the agent follows.

The agent file describes the role and the workflow. Each skill file describes one recipe and nothing else, and the skills don't know about each other. They just do their one job well. The agent reads its own definition and picks which skill to invoke. That separation is the whole trick: each skill can be read alone, copied into another project, or rewritten, and the agent picks it up automatically. No DSL, no central registry, just markdown a domain expert can read and edit.

## Why I think it clicks

Every skill maps to a discipline you'd recognize from a real desk: a morning idea sweep, a source-of-truth data fetch, the qualitative read, the model, the validation pass before sign-off. If you've ever trained a junior person, you've effectively taught them each of these as a separate skill. Seeing it laid out that way is what made agents stop feeling abstract for me.

There's even a built-in `explain-agent` step that walks the project and draws you an interactive diagram of how the whole thing fits together, which is handy for onboarding someone else.

## Go play

You'll need [Claude Code](https://claude.com/download). After that it's double-click-to-run: one command sets things up, another opens it in Claude, and you ask it *"what's worth looking at today?"* It stops to confirm with you at the expensive steps, so nothing runs away from you.

It's a teaching example, not a production trading system. It triages and explains, and it doesn't give investment advice. But as a way to *get* what agents and skills are, opening it beats any explanation I could write here.

**[Try the intro agent →](https://blog.bytesofpurpose.com/getting-started-with-claude-agents/)**

If it helps something click, [buy me a coffee ☕](https://buymeacoffee.com/omareid).
