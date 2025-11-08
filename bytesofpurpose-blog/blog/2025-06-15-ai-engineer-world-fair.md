---
slug: ai-engineer-world-fair-2025
title: "🌍 AI Engineer World Fair 2025"
description: "My experience attending the AI Engineer World Fair in June 2025 - key insights, tools, and trends shaping the future of AI engineering."
authors: [oeid]
tags: [ai-engineering, conference, genai, tools, trends, networking]
date: '2025-06-15T10:00'
draft: false
---

I attended the AI Engineer World Fair in June 2025. Here are the key insights and trends I discovered.

<!-- truncate -->

# AI Engineer World Fair 2025

## Mind Map
<iframe style={{border: "1px solid rgba(0, 0, 0, 0.1)"}} width="100%" height="450" src="https://embed.figma.com/board/bILyZdHUSVhPoh62aiG95s/AI-Engineer-World-s-Fair-2025?embed-host=share" allowfullscreen></iframe>

## Key Technologies and Frameworks

### Model Context Protocol (MCP)
**What it is**: An open standard protocol that provides a consistent interface between AI models and external tools

**Key benefits**:
- Standardized communication between agents and tool servers
- Easy extension of agent capabilities with new tools
- Interoperability between different AI models and tool ecosystems
- Composition of multiple tools into complex workflows

**Hidden capabilities**:
- Elicitation - allows server to request completion from client
- Dynamic discovery - expand tool set based on scope of conversation
- Rich stateful interactions

**Implementation examples**:
- Obsidian MCP server for document management
- Neo4j MCP server for graph databases
- Bookmark manager MCP
- Noteplan integration potential

### Nova Act
**What it is**: A research preview of an SDK and model for building agents that can reliably take actions in web browsers

**Key capabilities**:
- Navigate websites and execute complex web workflows
- Break down tasks into smaller, reliable steps
- Extract specific information from web pages
- Run multiple browser sessions in parallel
- Capture screenshots for debugging and documentation

**Use cases**: Web traversal and testing, food research, automation of web-based tasks

### Strands Agents
**What it is**: A simple yet powerful SDK for building and running AI agents

**Key features**:
- Lightweight & flexible agent loop
- Model agnostic - supports various providers
- Advanced capabilities like multi-agent systems
- Built-in MCP support

### GraphRAG
**What it is**: An approach to knowledge retrieval that maintains causal links in memory systems

**Benefits**:
- Claims to solve hallucinations
- Improves hypothesis generation
- Maintains relationships between concepts

**Implementation tools**:
- Neo4j for graph database
- Congee for building custom graphs
- Graphiti/Zep's open source graph framework

## AI Agent Development

### Agent Types and Approaches
- **Computer use agents**: Agents that generate actions on screen
- **Agentic reasoning**: Ability to evaluate results and update plans
- **Workflows vs. Agents**:
  - Workflows: Composable pipelines with explicitly ordered steps
  - Agents: Maintain memory and are turn-based with tools
  - Agent supervisors: Agents that call other agents as tools

### Agent Memory Systems
**Importance**: Enables agents to maintain context and learn from past interactions

**Approaches**:
- Vector databases (like Pinecone)
- Graph-based memory (Neo4j)
- Semantic fact generation

**Challenges**:
- Semantic similarity is not business relevance
- No one-size-fits-all memory solution

### Agent Evaluation (Evals)
**Challenges**:
- Models are designed to be creative, not to judge
- Limited standard/generic evaluation metrics
- Guardrails fail for taste and opinion

**Approaches**:
- Using LLMs to test LLMs ("vibe testing")
- Ranking and scoring responses
- Domain-specific evaluation metrics

**Tools**: WithPi.ai platform for building scoring systems

## Coding with AI

### Vibe Coding
**What it is**: Using AI agents for coding assistance and generation

**Tools mentioned**:
- Windsurf and Cursor IDEs
- Claude Code
- Qodo (formerly Codium)

**Best practices**:
- Start small with clear definition of done
- Be prepared to throw code away
- Always review AI-generated code
- Write specs and documentation
- Maintain a strict style guide
- Run linters and tests

### AI Coding Workflows
- **Planning**: Using AI to create development plans
- **Writing**: Code generation with best practices built in
- **Testing**: Automated test generation and coverage improvement
- **Reviewing**: AI-assisted code review
- **Debugging**: Faster issue identification and resolution

### Measuring AI Coding Quality
**Metrics**:
- PCW (Percentage of Code Written)
- Defect count
- Time to understand new code
- Time to write unit tests
- Debugging speed

## Emerging AI Technologies

### Thinking in AI Models
**Concept**: Adding a loop to allow models to iteratively perform test-time compute

**Benefits**:
- Less compute for simple requests
- More compute for harder requests
- Dynamic allocation of thinking resources

**Implementation**:
- Trained with reinforcement learning
- Configurable thinking budgets
- Deep thinking for complex problems

### AI Memory and Reasoning
**Concepts**:
- Brains as prediction machines
- Hallucinations as controlled predictions
- Reasoning requiring causal links

**Approaches**:
- Traditional RAG - pulling info and enriching prompt
- Agentic RAG - having tools for getting info
- Deep Research - planning steps for retrieval

### AI Tools People Are Using
**IDEs**: Cursor, Windsurf, Claude Code
**Models**: Claude 4 for large projects, SWE-1 for small tasks, Gemini-2.5-pro as backup
**Other tools**:
- v0 for rapid demo/template building
- Replit for building test apps on mobile
- AssemblyAI for speech-to-text
- ElevenLabs for text-to-speech
- Phi3:mini & deepseek via Ollama for offline development
- Granola for organization

## Notable Companies and Projects

- **OpenRouter**: LLM marketplace with single API access to multiple models
- **Featherless.ai**: Personalized AGI focused on reliability
- **Upside**: Forensic attribution and intelligence for revenue
- **OpenAudio**: Instructurable voice model with expressive capabilities
- **Krea.ai**: AI image generation platform
- **Qodo**: End-to-end AI across SDLC
- **Factory**: Agent-driven development platform
- **Dagger**: Platform for efficient agent environments

## Action Items and Resources

### Tools to Explore
- Amazon Q CLI and developer tools
- Nova Act for web automation
- Strands Agents for agent building
- GraphRAG for knowledge management
- MCP servers for various applications

### Learning Resources
- https://modelcontextprotocol.io/introduction
- https://github.com/aws/nova-act
- https://strandsagents.com/latest/
- https://github.com/neo4j-product-examples/genai-workshop
- https://github.com/aws-samples/sample-agents-with-nova-act-and-mcp

### Potential Projects
- Building a personal MCP server
- Setting up a Neo4j GraphRAG system
- Creating an agent for web traversal using Nova Act
- Extending Noteplan with MCP integration

---

*The AI Engineer World Fair confirmed that AI engineering is rapidly maturing from experimental territory to a standard engineering discipline. The tools are getting better, the practices are becoming standardized, and the industry is moving toward production-ready AI systems.*

*The future belongs to engineers who can effectively build, deploy, and maintain AI systems at scale.*

<details>
<summary>📝 References</summary>

**Grounded in**:
- AI Engineer World Fair 2025 conference notes (`/Users/omareid/Library/Containers/co.noteplan.NotePlan3/Data/Library/Application Support/co.noteplan.NotePlan3/Notes/🏢 Amazon/🏢📝 Notes/🏢 Ai.Engineer Conference/`)
- Session recordings and presentation materials
- Networking contacts and industry insights
- Personal experience and key takeaways

</details>
