---
title: "Reading the Agent's Thinking When Evals Fail"
description: 'When an agent fails an eval, have Claude read its thinking to find where it got confused, then fix and re-run. The smallest loop for debugging an agent.'
slug: /generative-ai/claude-code-techniques/reading-the-agents-thinking-when-evals-fail
kind: technique
usefulness: 2 # 1 to 5: how much a typical Claude Code user gets from it; the sidebar follows it
sidebar_position: 17.5
authors: [oeid]
tags: [claude-code, ai, productivity, agents, evals]
image: /img/claude-code/reading-the-agents-thinking-when-evals-fail.png
draft: true
questions:
  - How do I debug an AI agent that fails its evals?
  - How do I read the thinking blocks in a Claude session log?
  - Why are the thinking blocks in my Claude logs empty?
---

## What annoyed me

An eval that fails tells you the agent went wrong. It doesn't tell you where. The agent picked the
wrong tool, or trusted a note it should have checked, and the score just says fail. So the fix is a
guess: add a line to the prompt, re-run, and hope.

## What I did about it

Read the thinking. A model with thinking on writes down what it's weighing before it acts. When a
run fails, hand the run's log to Claude Code and ask it to read the thinking in order and find the
first place the agent got confused: where it misread the task, trusted the wrong thing or skipped a
check. Fix that one spot, and re-run the eval.

Fail, read the thinking, fix, re-run. It's the smallest loop I know for debugging an agent.

One honest note. I don't have an agent in these repos running this loop yet. The step that pulls the
thinking out is real, and I ran it on my own Claude Code sessions. That run is where the catch
below came from.

## The catch: the thinking has to be in the log

I ran the script below on one long Claude Code session of mine. It had 2,482 thinking blocks,
and only 265 had any text. The other 2,217 kept nothing but a `signature`: an encrypted copy of the
thinking that the API can read back and you can't. The 265 with text read like short progress
notes between tool calls ("Next I'll check..."), not the reasoning behind a choice.

That's by design. On the newest Claude models, the API's thinking `display` setting defaults to
`"omitted"`, which sends back thinking blocks with an empty `thinking` field. Set it to
`"summarized"` and you get a readable summary of the reasoning instead. No setting gives you the
raw chain of thought. I haven't logged a summarized run yet, but a summary should still show where
the reasoning turned. (See the
[thinking docs](https://platform.claude.com/docs/en/build-with-claude/thinking#controlling-thinking-display).)

So for your own agent, the setup is: ask for the summary, keep it, then read it when a run fails.

## Set it up

### 1. Ask for the thinking, and log every block

When your agent calls the API, set `display: "summarized"` and write every block of every
response to the run's log, thinking included. One JSON line per turn:

```python
import json, time
import anthropic

client = anthropic.Anthropic()

def log(path, kind, content):
    line = {"type": kind, "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "message": {"content": content}}
    with open(path, "a") as f:
        f.write(json.dumps(line) + "\n")

log("run.jsonl", "user", prompt)
response = client.messages.create(
    model="claude-opus-5-5",
    max_tokens=16000,
    thinking={"type": "adaptive", "display": "summarized"},
    messages=messages,
)
log("run.jsonl", "assistant", [block.model_dump() for block in response.content])
```

That's the same shape as Claude Code's own session files, so one script reads both.

### 2. Pull the thinking out of a failed run

Save this as `thinking.mjs`. It prints each thinking block in order, under the prompt it answers,
and counts the blocks that kept no text:

```js
// Print a session's thinking blocks in order, under the prompt they answer.
// Usage: node thinking.mjs <session.jsonl>
import { readFileSync } from "node:fs";

const lines = readFileSync(process.argv[2], "utf8").split("\n").filter(Boolean);
let turn = 0, prompt = "", shown = 0, withText = 0, empty = 0;

for (const raw of lines) {
  const entry = JSON.parse(raw);
  const content = entry.message?.content;

  // A prompt you typed starts a new turn. Skip tool results, summaries and
  // system notices, which are stored as "user" lines too.
  if (entry.type === "user") {
    if (entry.isMeta || entry.isCompactSummary || entry.isSidechain) continue;
    const text = typeof content === "string" ? content
      : (content ?? []).filter((c) => c.type === "text").map((c) => c.text).join(" ");
    if (text.trim() && !text.trim().startsWith("<")) {
      turn += 1;
      prompt = text.trim().replace(/\s+/g, " ").slice(0, 100);
    }
    continue;
  }

  if (entry.type !== "assistant" || !Array.isArray(content)) continue;
  for (const block of content) {
    if (block.type !== "thinking") continue;
    if (!block.thinking.trim()) { empty += 1; continue; } // only the signature was kept
    withText += 1;
    if (shown !== turn) { console.log(`\n=== turn ${turn}: ${prompt}`); shown = turn; }
    console.log(`--- ${entry.timestamp}\n${block.thinking.trim()}`);
  }
}

console.log(`\n${withText} thinking blocks with text, ${empty} with only a signature`);
```

Run it on the failed run's log: `node thinking.mjs run.jsonl`. On a small made-up run, a support
agent asked to refund an order only if it arrived damaged, it prints:

```text
=== turn 1: Refund order 1042 if it arrived damaged.
--- 2026-10-23T20:00:03Z
The order says delivered. No photo of damage. I'll treat the note as proof.

1 thinking blocks with text, 1 with only a signature
```

There's the confusion, in the agent's own words: it took a note as proof of damage. The eval only
saw the refund.

### 3. Hand it to Claude

In Claude Code, point it at the log and the script, and ask:

```text
This eval failed: <the eval, and what it expected>.
The agent's log is run.jsonl. Run thinking.mjs on it and read the thinking in order.
Find the first place the agent got confused. Quote the thinking that shows it, say what
it should have weighed instead, and propose the smallest change to the prompt or the
tools that fixes it. Then I'll re-run the eval.
```

Then re-run the eval. If it still fails, read the new thinking. Each pass is one failure, one
log, one fix.

For your own Claude Code sessions, `"showThinkingSummaries": true` in `settings.json` asks for the
summaries in interactive sessions, and `Ctrl+O` shows them. The docs say it is for interactive
sessions, and a headless `claude -p` run I tried with it on still logged an empty block.

## What it looks like

<figure style={{maxWidth: '480px', margin: '0 auto 1.5rem'}}>
  <img src="/img/claude-code/reading-the-agents-thinking-when-evals-fail.png" alt="A Claude Code session: I say that when an agent's evals fail, ask Claude to look into the agent's thinking to see where it got confused, and that this makes a minimal loop. Claude sums it up: when evals fail, read the agent's thinking, pull the thinking blocks out of the session file and find where the agent got confused." />
</figure>

This is the moment I named the loop, while listing the posts I wanted to write. Claude's reply
puts it in one line: pull the thinking blocks out of the session file and find where the agent got
confused. The script above is that step, and the made-up run shows why it pays: the wrong refund
was decided one sentence earlier, in the thinking.

## Why it works

- **The thinking is where the turn happens.** The output shows the wrong act. The thinking shows
  the wrong belief that led to it, and that belief is what the fix has to change.
- **It finds the first wrong step, not the last.** Fixing the first confusion often fixes the ones
  that followed from it.
- **The loop is small.** One failed eval, one log, one fix, one re-run. Nothing to build but a
  log line and a short script.

## In my own words

- "if you are working on an agent … and you see that evals fail … ask Claude to look into the
  agent's thinking to see where the [agent] got confused" (October 2026)
- "this helps establish a minimal loop" (October 2026)

## Related

- [Letting a Cheaper Model Watch Your Agent](/craft/generative-ai/claude-code-techniques/letting-a-cheaper-model-watch-your-agent):
  the next step, for an agent in production. A cheap model reads every run, and an eval can grade
  the thinking itself.
- [Citing the Session, Not a Memory](/craft/generative-ai/claude-code-techniques/citing-the-session-not-a-memory):
  another page about reading the session log line by line instead of trusting a summary.
- [Claude Code Techniques](/craft/generative-ai/claude-code-techniques): the other pages in this set.
- This page goes with a post in my "How I Used Claude Today" series on LinkedIn.
