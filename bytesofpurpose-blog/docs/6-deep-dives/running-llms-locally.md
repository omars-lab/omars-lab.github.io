---
slug: running-llms-locally
title: Running LLMs Locally
description: How do I run an LLM locally?
authors: [oeid]
tags: [llm, local, ollama, lmstudio]
draft: true
---

# Running LLMs Locally

How do I run an LLM locally? >2025-W36

## Main Platforms for Running LLMs Locally 

### Running LLMs with LM Studio

- https://lmstudio.ai/
- https://github.com/ggml-org/llama.cpp/discussions/2182#discussioncomment-7698315


### Running LLMs with Ollama

- https://ollama.com/
- https://github.com/ollama/ollama/blob/main/docs/faq.md
- on Mac mini: `OLLAMA_HOST=0.0.0.0:11434 ollama serve`
- on Mac: `OLLAMA_HOST=192.168.1.252:11434 ollama run gemma3`


## Using Tools with Locally Running LLMs

### Tool Support
- https://llm.datasette.io/en/stable/usage.html#tools
- https://ollama.com/blog/tool-support
- https://ollama.com/blog/streaming-tool


## Invoking Localy Running LLM with Existing CLIs

### Codex Integration
- `codex exec --config model_provider=ollama --config model_providers.ollama.base_url=http://192.168.1.252:11423/v1 --config model=gemma3 hi`

### Claude Code Integration
* We can use claude code router to get the claude code CLI to use an LLM running locally instead of the default remote llm.
- https://github.com/musistudio/claude-code-router
- https://github.com/musistudio/claude-code-router/issues/272
- `npm install -g @musistudio/claude-code-router`
- `npm install -g @anthropic-ai/claude-code`


## Models and Tool Support

### Available Models
- https://ollama.com/library/qwen3
- Gemma3 doesn't support tools ...

## Hardware

## Clustering Mac Minis
- https://github.com/exo-explore/exo


### Apple Silicon (M1/M2/M3) Performance
- https://www.reddit.com/r/LocalLLaMA/comments/186phti/m1m2m3_increase_vram_allocation_with_sudo_sysctl/
- https://www.youtube.com/watch?v=wzPMdp9Qz6Q&ab_channel=AlexZiskind
  - Has different models ... performance of m3
- * [ ] https://www.reddit.com/r/LocalLLaMA/comments/1kfi8xh/benchmark_quickanddirty_test_of_5_models_on_a_mac/

## Documentation and Resources

### Official Documentation
- https://github.com/openai/codex/blob/main/docs/config.md

### Community Discussions
- https://www.reddit.com/r/LocalLLaMA/comments/1k44g1f/best_local_llm_to_run_locally/
- https://www.reddit.com/r/LocalLLaMA/comments/1j7wnye/please_help_choosing_best_machine_for_running/
- https://www.reddit.com/r/LocalLLaMA/comments/1kfz7dk/is_local_llm_really_worth_it_or_not/
- https://www.reddit.com/r/ollama/comments/1lucq0b/codexollama_airgapped/

## Video Tutorials
- https://www.youtube.com/watch?v=Ju0ndy2kwlw&ab_channel=NetworkChuck
- https://www.youtube.com/watch?v=e5iaYkSNrhY&ab_channel=JeremyMorgan

### Network and Diagramming
- https://ngrok.com/
- https://www.plantuml.com/plantuml/uml/SoWkIImgAStDuKhEIImkLWX8BIhEprEevb9Gq5N8IynDLR1I22ufoinB1uiafeC4ClDAk6gv75BpKe0Q0G00
- https://editor.plantuml.com/uml/SoWkIImgAStDuKhEIImkLWX8BIhEprEevb9Gq5N8IynDLR1I22ufoinB1uiafeC4ClDAk6gv75BpKe0Q0G00
- https://www.planttext.com/
