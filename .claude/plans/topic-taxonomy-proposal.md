# Docs Topic-Taxonomy Restructure — bottom-up proposal

Status: DRAFT for Omar's review. Derived bottom-up from the full ~250-doc inventory
(2026-06-01). Nothing moved yet. Durable preferences also in the `docs-topic-taxonomy`
memory + `review-reader-experience` skill IA audit.

## The principle
Root-level sidebar categories = **TOPICS** a reader browses by (not the author's
filing buckets: "Definitions", "Craftsmanship", "Techniques", "Skills", "Mental
Models"). Mental Models folds INTO topics. Welcome becomes a topic index.

## Confirmed topics (from Omar)
Productivity · Development · Companies {Roles, Culture} · Scripting · Entrepreneurship
· Personal Habits · Generative AI

## Bottom-up clusters observed in the inventory (proposed topic homes)

### 🤖 Generative AI  (currently scattered across 3 roots)
- mental-models/6-understanding-the-genai-domain/* (fundamentals, learning guide,
  framework landscape, AI Engineer World Fair)
- skills/solving-system-design/* (designing GenAI systems, agentic capabilities,
  example systems, POC→prod, prod-readiness)
- craftsmanship/3-workflows/how-i-use-genai, craftsmanship/4-tools/personal-mcp-setup
- development/3-tinkering/tinkering-with-rag, development/5-initiatives/llm-* 
- craftsmanship/1-workspace/running-llms-locally
→ Strong, clearly-its-own topic. Pulls from 4 current roots.

### 🧩 Development  (technical/software concepts + building)
- development/* (projects, pocs, tinkering, research/learning-topics, roadmaps)
- techniques/* the technical ones (blogging components, diagrams, code embeds,
  ci-cd, dev-techniques, security, documentation)
- skills/solving-coding-challenges/*, mental-models/data-structs-and-algos/*
- Vocabulary thread ← Blog Terms, Portfolio Terms

### ⚡ Productivity  (organizing work/effort)
- craftsmanship/2-processes/* (execution, ideation, interviewing)
- techniques/2-automation, /6-organization, /9-tool-usage, /1-analysis
- development/6-projects/frontend-projects/productivity/*
- Vocabulary thread ← CLI Terms, Development Terms, PM Terms

### 🏢 Companies  → sub-groups Roles + Culture
- Roles ← mental-models/4-understanding-career-levels/* (staff-engineer traits, SDE
  skill differences), mental-models/5-understanding-skills/* (leadership/soft/tech
  skills), skills/preparing-for-interviews/*, mental-models/3/interview-process
- Culture ← mental-models/2-understanding-cultural-values/* (company culture, Zapier)
- NOTE: exists as essays — a consolidated Companies *vocabulary* needs AUTHORING.

### 🖥️ Scripting
- techniques/7-scripting-techniques/* (terminal shortcuts, parsing, calendar, links)
- development/7-roadmaps/2-productivity-scripts/*

### 🚀 Entrepreneurship
- habits/habits-entrepreneurship, development/2-research/learning-topics/learning-business
- (thin — likely needs authoring)

### 🎯 Personal Habits
- habits/* (26 docs — but many are professional/dev habits, not "personal";
  may split: personal vs professional habits, or distribute habits to their topic)

## Open decisions for Omar
1. **Is the topic list complete?** (still emerging — keep suggesting bottom-up)
2. **Prompts (10-prompts/)** — keep as its own thing (it's a tool catalog mirroring
   the external prompts repo) or fold under a topic? evals/ = author QA tooling (task #2).
3. **Habits** — keep as one "Personal Habits" topic, or split personal vs professional,
   or distribute each habit to its topic?
4. **Techniques** is huge (77 docs) and splits across Development/Productivity/Scripting/
   GenAI — confirm the per-subfolder routing above.
5. **Welcome page** should index the topics AND explain content types (see below).

## Welcome page = topic index + content-type guide
Per Omar, Welcome should:
- Index the topics (links to each root topic)
- Explain the RECURRING STRUCTURE between topics (each topic has e.g. Vocabulary /
  overview / sub-pages — document the shared shape)
- Explain **what goes in Docs vs Blog vs Designs vs Changelog** (content-type split):
  - Docs = evergreen reference/learning organized by topic
  - Blog = dated posts/thoughts
  - Designs = design posts
  - Changelog = site change history
  (confirm the exact definitions with Omar)

## Draft reality (shapes sequencing)
Published/total per current root: welcome 1/1, prompts 18/20, definitions 1/8,
mental-models 16/17, development 13/98, craftsmanship 8/13, techniques 63/77,
skills 27/29, habits 2/26. → development & habits are mostly drafts; restructuring
them mostly shapes FUTURE-published structure. Pairs with draft triage (task #9).

## Safety
URL-safe (all docs have explicit slugs). No redirects plugin → changing a slug VALUE
needs a manual redirect. Propose-then-apply, in reviewable batches.
