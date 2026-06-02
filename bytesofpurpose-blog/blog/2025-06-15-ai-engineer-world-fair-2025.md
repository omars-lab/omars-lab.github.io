---
slug: ai-engineer-world-fair-2025
title: "🌍 AI Engineer World Fair 2025"
description: "My experience attending the AI Engineer World Fair in June 2025 - key insights, tools, and trends shaping the future of AI engineering."
authors: [oeid]
tags: [ai-engineering, conference, genai, tools, trends, networking]
date: 2025-06-15T10:00
# image: /img/REPLACE-ME.jpg  # add a social/card image before publishing
draft: true
---
I attended the AI Engineer World Fair in June 2025. Here are the key insights and trends I discovered.

<!-- truncate -->

# AI Engineer World Fair 2025

> **Read the full notes → [AI Engineer World Fair 2025](/docs/mental-models/understanding-the-genai-domain/ai-engineer-world-fair-2025)**

A few themes stood out across the talks and hallway conversations:

## Takeaways

- **MCP is becoming the connective tissue.** The Model Context Protocol gives agents a
  consistent interface to external tools — and the interesting parts are the less-obvious
  capabilities (elicitation, dynamic tool discovery, stateful interactions), not just the
  tool calls.
- **Browser-acting agents got real.** Tools like Nova Act break web tasks into smaller,
  reliable steps and can run sessions in parallel — closing the gap between "chat" and
  "actually does the thing."
- **Workflows vs. agents is the architecture decision.** Composable, explicitly-ordered
  pipelines (workflows) and memory-bearing, turn-based agents (with supervisors that call
  other agents as tools) are different tools for different jobs — picking wrong is where
  projects stall.
- **Graph-shaped memory is the hallucination story.** GraphRAG approaches keep causal
  links between concepts in memory, which the talks framed as a path to fewer
  hallucinations and better hypothesis generation.

The full set of notes — frameworks, agent-memory patterns, and the mind map — lives in the
linked doc above.

