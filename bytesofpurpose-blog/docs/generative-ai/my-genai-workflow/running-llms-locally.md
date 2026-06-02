---
slug: /craftsmanship/workspace/running-llms-locally
title: Running LLMs Locally
description: 'The main platforms and steps for running large language models locally on your own machine, and the trade-offs of each.'
authors: [oeid]
tags: [llm, local, ollama, lmstudio]
date: 2025-09-01T10:00
draft: false
blog_trigger: poc
blog_post: running-llms-locally
blog_status: drafted
---

# Running LLMs Locally

How do I run an LLM locally? >2025-W36

## Main Platforms for Running LLMs Locally 

### Running LLMs with LM Studio

- [lmstudio.ai](https://lmstudio.ai/)
- [GitHub — ggml-org/llama.cpp](https://github.com/ggml-org/llama.cpp/discussions/2182#discussioncomment-7698315)


### Running LLMs with Ollama

- [ollama.com](https://ollama.com/)
- [GitHub — ollama/ollama](https://github.com/ollama/ollama/blob/main/docs/faq.md)
- on Mac mini: `OLLAMA_HOST=0.0.0.0:11434 ollama serve`
- on Mac: `OLLAMA_HOST=192.168.1.252:11434 ollama run gemma3`


## Using Tools with Locally Running LLMs

### Tool Support
- [llm.datasette.io — Usage](https://llm.datasette.io/en/stable/usage.html#tools)
- [ollama.com — Tool Support](https://ollama.com/blog/tool-support)
- [ollama.com — Streaming Tool](https://ollama.com/blog/streaming-tool)


## Invoking Localy Running LLM with Existing CLIs

### Codex Integration
- `codex exec --config model_provider=ollama --config model_providers.ollama.base_url=http://192.168.1.252:11423/v1 --config model=gemma3 hi`

### Claude Code Integration
* We can use claude code router to get the claude code CLI to use an LLM running locally instead of the default remote llm.
- [GitHub — musistudio/claude-code-router](https://github.com/musistudio/claude-code-router)
- [GitHub — musistudio/claude-code-router](https://github.com/musistudio/claude-code-router/issues/272)
- `npm install -g @musistudio/claude-code-router`
- `npm install -g @anthropic-ai/claude-code`


## Models and Tool Support

### Available Models
- [ollama.com — Qwen3](https://ollama.com/library/qwen3)
- Gemma3 doesn't support tools ...

## Hardware

## Clustering Mac Minis
- [GitHub — exo-explore/exo](https://github.com/exo-explore/exo)


### Apple Silicon (M1/M2/M3) Performance
- [reddit.com — M1m2m3 Increase Vram Allocation With Sudo Sysctl](https://www.reddit.com/r/LocalLLaMA/comments/186phti/m1m2m3_increase_vram_allocation_with_sudo_sysctl/)
- [YouTube — Watch](https://www.youtube.com/watch?v=wzPMdp9Qz6Q&ab_channel=AlexZiskind)
  - Has different models ... performance of m3
- * [ ] [reddit.com — Benchmark Quickanddirty Test Of 5 Models On A Mac](https://www.reddit.com/r/LocalLLaMA/comments/1kfi8xh/benchmark_quickanddirty_test_of_5_models_on_a_mac/)

## Documentation and Resources

### Official Documentation
- [GitHub — openai/codex](https://github.com/openai/codex/blob/main/docs/config.md)

### Community Discussions
- [reddit.com — Best Local Llm To Run Locally](https://www.reddit.com/r/LocalLLaMA/comments/1k44g1f/best_local_llm_to_run_locally/)
- [reddit.com — Please Help Choosing Best Machine For Running](https://www.reddit.com/r/LocalLLaMA/comments/1j7wnye/please_help_choosing_best_machine_for_running/)
- [reddit.com — Is Local Llm Really Worth It Or Not](https://www.reddit.com/r/LocalLLaMA/comments/1kfz7dk/is_local_llm_really_worth_it_or_not/)
- [reddit.com — Codexollama Airgapped](https://www.reddit.com/r/ollama/comments/1lucq0b/codexollama_airgapped/)

## Video Tutorials
- [YouTube — Watch](https://www.youtube.com/watch?v=Ju0ndy2kwlw&ab_channel=NetworkChuck)
- [YouTube — Watch](https://www.youtube.com/watch?v=e5iaYkSNrhY&ab_channel=JeremyMorgan)

### Network and Diagramming
- [ngrok.com](https://ngrok.com/)
- [plantuml.com](https://www.plantuml.com/plantuml/uml/SoWkIImgAStDuKhEIImkLWX8BIhEprEevb9Gq5N8IynDLR1I22ufoinB1uiafeC4ClDAk6gv75BpKe0Q0G00)
- [editor.plantuml.com](https://editor.plantuml.com/uml/SoWkIImgAStDuKhEIImkLWX8BIhEprEevb9Gq5N8IynDLR1I22ufoinB1uiafeC4ClDAk6gv75BpKe0Q0G00)
- [planttext.com](https://www.planttext.com/)
