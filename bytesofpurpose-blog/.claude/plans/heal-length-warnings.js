#!/usr/bin/env node
/**
 * LQ1 — Heal the description-length warnings (50–160 chars) across the docs corpus.
 *
 * Idempotent exact-line replace: each entry maps a doc path to the FULL new
 * `description:` frontmatter line. We replace the first existing `description:` line
 * only. Re-running is safe (the new line is already there → no-op).
 *
 * EXCLUDED (handled elsewhere — do NOT add here):
 *   - docs/companies/skills/my-problem-solving-approach.mdx        (Track C, live)
 *   - docs/personal-growth/my-contributions.mdx                    (Track C, live)
 *   - docs/.../problem-solving-techniques/{README,look-ahead}.mdx  (LQ2 / Step C)
 *   - docs/blogging/documentation-techniques/diagramming-with-plantuml.mdx (LQ2 / Step C)
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..'); // bytesofpurpose-blog/

// path -> new description VALUE (we render the full line, single-quoted, escaping ').
const DESCRIPTIONS = {
  // ── blogging ───────────────────────────────────────────────────────────────
  'docs/blogging/embed-structural-components/adding-frontmatter.mdx':
    'How front matter shapes a Docusaurus post — the fields that drive previews, metadata, and how a page is rendered and shared.',
  'docs/blogging/embed-structural-components/details.mdx':
    'How to build a collapsible details/disclosure component in Docusaurus to tuck away supporting content without cluttering the page.',
  'docs/blogging/embed-structural-components/footer.mdx':
    'How to build a reusable footer component in Docusaurus so every post ends with consistent, branded closing content.',
  'docs/blogging/embed-structural-components/header.mdx':
    'How to build a reusable header component in Docusaurus so every post opens with consistent, branded framing.',
  'docs/blogging/prompts/docusaurus-maintenance-system.md':
    'An AI prompt system that systematically fixes frontmatter and broken links across a Docusaurus site for clean, organized builds.',
  'docs/blogging/prompts/role-refactoring-system.md':
    'An AI prompt system that refactors personal role definitions, separating generic frameworks from actionable personal items.',

  // ── companies ────────────────────────────────────────────────────────────────
  'docs/companies/culture/2025-09-25-understanding-cultural-values.md':
    'How company size and structure shape cultural values across tech — from remote teams like Zapier to giants like Meta and Amazon.',
  'docs/companies/skills/dealing-with-challenges.md':
    'Frameworks for addressing and communicating about technical and professional challenges — useful for interviews and growth.',

  // ── generative-ai ────────────────────────────────────────────────────────────
  'docs/generative-ai/README.mdx':
    'Learning and building with generative AI — GenAI fundamentals, designing and shipping GenAI systems, and how I work with LLMs daily.',
  'docs/generative-ai/building-systems/example-genai-system-customer-support.mdx':
    'Building a production customer-support agent that handles 10,000+ concurrent users with enterprise security and monitoring.',
  'docs/generative-ai/building-systems/example-genai-system-financial-services.mdx':
    'Building a production AI financial-advisory system for 50,000+ clients with real-time market data and regulatory compliance.',
  'docs/generative-ai/building-systems/example-poc-to-prod-execution-plan.mdx':
    'A 12-week plan to take a local GenAI prototype to production at 10,000+ concurrent users, with security and monitoring.',
  'docs/generative-ai/fundamentals/2025-11-10-ai-framework-landscape.md':
    'An interactive tour of AI frameworks, tools, and platforms — comparing features and use cases to help you choose the right one.',
  'docs/generative-ai/my-genai-workflow/running-llms-locally.md':
    'The main platforms and steps for running large language models locally on your own machine, and the trade-offs of each.',

  // ── interview-prep ───────────────────────────────────────────────────────────
  'docs/interview-prep/README.mdx':
    'The getting-hired journey: data structures, algorithms, coding patterns, system design, behavioral prep, and what companies expect.',
  'docs/interview-prep/coding-challenges/solutions/README.mdx':
    'Worked solutions to common coding-interview challenges, with the patterns and reasoning behind each approach.',
  'docs/interview-prep/data-structures-and-algorithms/understanding-dynamic-programming.mdx':
    'DP fundamentals, problem types (1D, 2D, knapsack, interval, tree), optimization techniques, and strategies with LeetCode examples.',
  'docs/interview-prep/data-structures-and-algorithms/understanding-graphs.mdx':
    'Graph types, modeling, and core algorithms (topological sort, MST, shortest paths) with problem-solving strategies and examples.',
  'docs/interview-prep/data-structures-and-algorithms/understanding-heaps.mdx':
    'Heap types, operations, and problem patterns (top-k, sliding window, median finding) with practical LeetCode examples.',
  'docs/interview-prep/data-structures-and-algorithms/understanding-lists.mdx':
    'List types, representations, and sorting algorithms (bubble, insertion, selection, merge, quick) with practical examples.',
  'docs/interview-prep/data-structures-and-algorithms/understanding-trees.mdx':
    'Tree types, traversal algorithms, and problem patterns (path finding, validation, construction) with practical examples.',
  'docs/interview-prep/prompts/star-story-author.md':
    'An AI prompt system for drafting and refining STAR-format behavioral interview stories from your real experiences.',

  // ── personal-growth ──────────────────────────────────────────────────────────
  'docs/personal-growth/README.mdx':
    'The habits behind growing as a person and a professional — building habits, reflecting, reading, mentorship, health, and finances.',
  'docs/personal-growth/habits-mentorship.mdx':
    'A systematic approach to finding mentors, preparing for the relationship, and maximizing learning through structured feedback.',
  'docs/personal-growth/habits-reflecting.mdx':
    'A practice of continuous self-reflection — life-journey mapping, failure analysis, accountability, and reflecting on vision and purpose.',
  'docs/personal-growth/prompts/personal-life-content-organizer.md':
    'An AI prompt system that organizes personal content across many directories and routes tasks to the right life areas.',

  // ── product-management ───────────────────────────────────────────────────────
  'docs/product-management/README.md':
    'The idea-to-ship lifecycle — ideas, research, proofs-of-concept, experiments, projects, and roadmaps. What to build and why.',
  'docs/product-management/experiments/_TEMPLATE.md':
    'Template for an experiment doc that captures both the design and the living timeline — copy it per experiment and fill it in.',
  'docs/product-management/ideas/README.md':
    'A running collection of product and project ideas I have had — the raw front of the idea-to-ship lifecycle.',

  // ── productivity ─────────────────────────────────────────────────────────────
  'docs/productivity/README.mdx':
    'How I organize work — processes, organizing/discovering/analyzing/automating techniques, dashboards, apps, and the vocabulary.',
  'docs/productivity/automating/leveraging-shortcuts.mdx':
    'Techniques for designing and chaining shortcuts to automate repetitive tasks and speed up everyday workflows.',
  'docs/productivity/discovering/discovering-content.mdx':
    'Techniques for discovering high-quality educational content — finding conferences, speakers, and university course material online.',
  'docs/productivity/habits-automating.mdx':
    'A systematic approach to spotting and implementing automation across home, software tools, and productivity workflows.',
  'docs/productivity/habits-prioritizing.mdx':
    'The practice of prioritization — workstreams, priority classes, tech projects, learning, and how to shift priorities well.',
  'docs/productivity/processes/process-interview.mdx':
    'The technical interview process from both candidate and company sides — preparation, execution, and decision-making.',
  'docs/productivity/terminology/terminology-development.mdx':
    'Core development terminology — initiatives, priorities, goals, and project management — that I use across my personal work.',

  // ── software-development ─────────────────────────────────────────────────────
  'docs/software-development/README.mdx':
    'My development process from ideation to roadmap — experiments, projects, and strategic planning across software work.',
  'docs/software-development/backend-development/techniques/managing-secrets.mdx':
    'Techniques for managing secrets safely — syncing credentials, avoiding leaks, and wiring them into local and CI workflows.',
  'docs/software-development/frontend-development/techniques/development-process.mdx':
    'A deep dive into the frontend build flow — what happens when Storybook meets TypeScript and Babel, from code to browser.',
  'docs/software-development/plugins/projects/develop-a-quip-plugin.md':
    'A development initiative for building Quip Live Apps — examples, the React/Quip model, and lessons from threading data through.',
  'docs/software-development/plugins/tinkering/my-first-vscode-plugin.mdx':
    'How to build your first VSCode plugin — defining its behavior, what the extension API can do, and wiring it to a shortcut.',
  'docs/software-development/prompts/sql-query-analyzer.md':
    'An AI prompt system that analyzes complex SQL queries, generates docs and diagrams, and produces clean, readable code.',
  'docs/software-development/scripting/projects/parsing-json.md':
    'Powerful jq commands for parsing and transforming JSON — the mechanics I reach for most when processing data on the CLI.',
  'docs/software-development/scripting/projects/terminal-links.md':
    'How to embed clickable hyperlinks in terminal output using ANSI escape sequences, with cross-shell examples.',
  'docs/software-development/workspace/bookmarks/README.mdx':
    'A curated collection of useful developer bookmarks — tools, references, and resources I return to often.',
  'docs/software-development/workspace/bookmarks/setup-machine.mdx':
    'The commands and steps I run to set up a new development machine — from Homebrew to taps and core tooling.',
  'docs/software-development/workspace/setup/README.md':
    'How I set up and consolidate my development workspace — the environment, configuration, and tooling that backs my work.',
  'docs/software-development/workspace/tips/README.md':
    'A collection of development tips for working more efficiently — habits and small techniques that compound over time.',
  'docs/software-development/workspace/tools/README.md':
    'A curated collection of development tools I rely on — including GenAI tools — and what each one is good for.',

  // ── welcome ──────────────────────────────────────────────────────────────────
  'docs/welcome/README.md':
    'A topic-organized knowledge base for engineers: generative AI, software development, product management, productivity, and more.',
};

function esc(v) {
  return v.replace(/'/g, "''"); // YAML single-quote escaping
}

let changed = 0;
let already = 0;
const errors = [];

for (const [rel, value] of Object.entries(DESCRIPTIONS)) {
  const file = path.join(ROOT, rel);
  if (!fs.existsSync(file)) {
    errors.push(`MISSING FILE: ${rel}`);
    continue;
  }
  const len = value.length;
  if (len < 50 || len > 160) {
    errors.push(`OUT OF RANGE (${len}): ${rel}`);
  }
  const src = fs.readFileSync(file, 'utf8');
  const newLine = `description: '${esc(value)}'`;
  const lines = src.split('\n');
  let idx = lines.findIndex((l) => /^description:/.test(l));
  if (idx === -1) {
    errors.push(`NO description: LINE: ${rel}`);
    continue;
  }
  if (lines[idx] === newLine) {
    already++;
    continue;
  }
  lines[idx] = newLine;
  fs.writeFileSync(file, lines.join('\n'));
  changed++;
}

console.log(`changed=${changed} already=${already} total=${Object.keys(DESCRIPTIONS).length}`);
if (errors.length) {
  console.log('\nERRORS:');
  errors.forEach((e) => console.log('  ' + e));
  process.exit(1);
}
