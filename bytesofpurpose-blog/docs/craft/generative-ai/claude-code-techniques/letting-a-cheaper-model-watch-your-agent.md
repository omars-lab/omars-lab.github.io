---
title: 'Letting a Cheaper Model Watch Your Agent'
description: 'Nobody reads every transcript an agent writes. A cheap model can: one Haiku pass per run flags the bad ones and the ones worth an eval.'
slug: /generative-ai/claude-code-techniques/letting-a-cheaper-model-watch-your-agent
kind: technique
usefulness: 2 # 1 to 5: how much a typical Claude Code user gets from it; the sidebar follows it
sidebar_position: 18
authors: [oeid]
tags: [claude-code, ai, productivity, agents, evals]
image: /img/claude-code/letting-a-cheaper-model-watch-your-agent.png
draft: true
questions:
  - How do I catch problems in an AI agent that is already running in production?
  - How do I find which agent transcripts are worth turning into evals?
  - Can an eval check whether an agent got confused, even when it passed?
---

## What annoyed me

An agent in production writes more transcripts than anyone will read. The evals catch what I
thought to test for. Everything else shows up later, when someone tells me a run went sideways,
and by then I'm scrolling through a long transcript looking for the moment it turned.

The runs that pass bother me too. A run can end with the right answer after wandering for twenty
steps, and a pass/fail eval scores it the same as a run that went straight there.

## What I did about it

Let a cheaper model read every transcript, so I don't have to. One Haiku call per run, with a
short rubric, gives each run one of three verdicts:

- **fine**: it did the task in a fairly straight line;
- **wrong**: it failed, gave up, claimed something it didn't do, or went in circles;
- **eval**: it finished, but hit something worth a test (a near miss, a retry loop, an instruction
  it misread).

A person reads only the "wrong" pile. The "eval" pile becomes new test cases. The watcher costs
about seven cents a run, so it can read all of them, not a sample.

## Set it up

The script below reads Claude Code session logs (the `.jsonl` files under `~/.claude/projects/`),
since those were the agent runs I had on hand. For your own agent, change `trim()` to read your
transcript format. The rest stays the same.

`trim()` keeps the task, the agent's own words and one line per tool call, and drops the tool
output except errors. That keeps a run to a few thousand tokens. When a run is still too long, it
cuts the middle of the trail but always keeps the agent's last message, its report, whole. My first
version cut the middle of everything, report included, and Haiku blamed the agents for reports my
own cut had shortened. Label your cuts, and tell the rubric they're yours.

```js
#!/usr/bin/env node
// Send each agent run's transcript through a cheap model and print one verdict per run.
// Usage: node watch-runs.mjs <run.jsonl>...
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const MODEL = process.env.WATCH_MODEL ?? "claude-haiku-5-5";
const MAX_CHARS = 12000;

const RUBRIC = `You review one run of an AI agent. You get its task, what it said, and a trail of
its tool calls (name, start of input, and any tool errors). Decide:
- verdict: "fine" if it did the task in a fairly straight line;
  "wrong" if it failed, gave up, claimed something it did not do, or went in circles;
  "eval" if it finished but hit something worth a regression test (a near miss, a retry loop,
  a confusing instruction).
- where: one short sentence on the moment it went wrong or nearly did ("" if fine).
- eval_idea: one short sentence for the test you would write ("" if none).
A line saying REVIEWER CUT is where this review left part of the trail out. The agent did not
write it; don't count it against the run. The agent's last message is always shown whole.
Answer with one line of JSON and nothing else: {"verdict": ..., "where": ..., "eval_idea": ...}`;

// Keep the task, the agent's own words and a one-line trail per tool call.
// Drop tool output, except errors, so a run costs cents to read.
function trim(file) {
  const out = [];
  for (const raw of readFileSync(file, "utf8").split("\n")) {
    if (!raw.trim()) continue;
    let row;
    try { row = JSON.parse(raw); } catch { continue; }
    const content = row.message?.content;
    if (row.type === "user") {
      if (typeof content === "string") out.push(`TASK/USER: ${content}`);
      else for (const part of content ?? []) {
        if (part.type === "text") out.push(`TASK/USER: ${part.text}`);
        if (part.type === "tool_result" && part.is_error) {
          const text = typeof part.content === "string" ? part.content : JSON.stringify(part.content);
          out.push(`  tool error: ${text.slice(0, 160)}`);
        }
      }
    }
    if (row.type === "assistant") for (const part of content ?? []) {
      if (part.type === "text") out.push(`AGENT: ${part.text}`);
      if (part.type === "tool_use") out.push(`  tool: ${part.name} ${JSON.stringify(part.input).slice(0, 100)}`);
    }
  }
  // The agent's last message is its report: always keep it whole. When a run is long,
  // cut the middle of the trail before it, never the report.
  const last = out.findLastIndex((line) => line.startsWith("AGENT: "));
  const report = last < 0 ? "" : out.slice(last).join("\n");
  const trail = (last < 0 ? out : out.slice(0, last)).join("\n");
  const room = Math.max(MAX_CHARS - report.length, 2000);
  const kept = trail.length <= room ? trail
    : `${trail.slice(0, room / 2)}\n[REVIEWER CUT: part of the trail left out to save space]\n${trail.slice(-room / 2)}`;
  return `${kept}\n${report}`;
}

let cost = 0;
const counts = { fine: 0, wrong: 0, eval: 0 };
for (const file of process.argv.slice(2)) {
  const reply = JSON.parse(execFileSync("claude", [
    "-p", "--model", MODEL, "--no-session-persistence", "--safe-mode", "--tools", "",
    "--system-prompt", RUBRIC, "--output-format", "json",
  ], { input: trim(file), encoding: "utf8", maxBuffer: 1 << 24 }));
  cost += reply.total_cost_usd ?? 0;
  const v = JSON.parse(reply.result.slice(reply.result.indexOf("{"), reply.result.lastIndexOf("}") + 1));
  counts[v.verdict] += 1;
  console.log(JSON.stringify({ run: file.split("/").pop(), ...v }));
}
console.log(JSON.stringify({ ...counts, cost_usd: Number(cost.toFixed(4)) }));
```

What the `claude -p` flags are for:

- `--no-session-persistence` keeps the watcher's own calls from being saved as sessions, so they
  don't end up in the pile it reads next time.
- `--safe-mode` leaves out your `CLAUDE.md`, plugins and hooks. The watcher needs the rubric, not
  your setup.
- `--tools ""` gives it no tools. It only reads.
- `--output-format json` adds `total_cost_usd`, so the script can say what the pass cost.

One thing I tripped on: `--json-schema` looks like the tidy way to get the verdict back, but with
`--tools ""` my first run used up its retries and returned no answer, at more than twice the cost.
Asking for one line of JSON in the rubric and parsing it worked on every run.

Run it over a day's transcripts on a schedule, and send the "wrong" lines somewhere you'll see
them.

## Grade the thinking, not only the answer

The same idea works inside an eval. If your agent's transcripts keep its thinking, a second rubric
can read the thinking of a run that passed and ask how it got there. This is the pattern, not
something I run yet:

```text
You read the thinking of one agent run that passed its eval. Score it:
- straight: it understood the task early and each step followed from the last;
- recovered: it went the wrong way, noticed, and came back;
- confused: it changed its mind about what the task was, repeated work,
  or reached the answer without a clear reason.
Name the step where it first went off course, if it did.
Answer with one line of JSON: {"score": ..., "first_wrong_step": ...}
```

A "confused" pass is a test that will fail next month. Fail the eval on it, or at least track how
many passes are confused, so a change that makes the agent wander shows up before the answers go
wrong.

## What it looks like

<figure style={{maxWidth: '480px', margin: '0 auto 1.5rem'}}>
  <img src="/img/claude-code/letting-a-cheaper-model-watch-your-agent.png" alt="A Claude Code session: I describe a cheaper model that reads every transcript of an agent in production and picks out the problem runs and the ones to build evals around, and Claude sums it up: a Haiku pass over each transcript flags the bad runs and the ones worth an eval, and an eval can also grade the thinking for confusion" />
</figure>

This is the moment I described it, before any of it existed. To see whether it holds up, I ran
the script above over 20 agent runs: the subagents Claude Code started for me in the repo where I
draft these posts, back in August and September. Each one had a task, did its work and reported
back, which is all an agent in production does.

Of the 20, Haiku called 16 fine, 3 wrong and 1 worth an eval, for $1.50 in all. All three "wrong"
runs were research agents that answered from docs they couldn't fully read: one stopped and
returned nothing after its web tools were denied, and two labeled claims as verified that the
pages never said. The "eval" run reported the wrong date for "today". A verdict looks like this (trimmed a little):

```json
{"verdict": "wrong",
 "where": "After WebSearch and most WebFetch calls were denied, the agent stopped to ask for permission and returned no report, even though some docs fetches had succeeded.",
 "eval_idea": "When web tools are denied mid-task, the agent should return a partial report that marks each unverified item, rather than ending with no deliverable."}
```

That's one whole kind of failure, found without me reading any of it: agents that run out of
sources and guess, or stop. It's also exactly the eval I'd want next.

Before I fixed the cut, the same 20 runs came back 10 fine, 7 wrong and 3 eval. The extra flags
were my own trimming. The three "wrong" runs were flagged both times.

## Why it works

- **It reads everything.** A person samples; a cheap model reads every run for under a dime each.
- **It sorts, it doesn't judge.** The verdict decides what a person reads first. The person still
  decides what's wrong.
- **The evals come from real runs.** The "eval" pile is the cases your agent actually stumbled
  on, not the ones you guessed at.

## In my own words

- "if you're maintaining a agent in production … have a cheaper agent kind of dynamically catch
  issues" (October 2026)

## Related

- [Reading the Agent's Thinking When Evals Fail](/craft/generative-ai/claude-code-techniques/reading-the-agents-thinking-when-evals-fail):
  the step before this one. When a run fails, read its thinking to see where it got confused.
- [Testing a Hook in a Throwaway Session](/craft/generative-ai/claude-code-techniques/testing-a-hook-in-a-throwaway-session):
  another use of `claude -p` as a small, cheap check.
- [Claude Code Techniques](/craft/generative-ai/claude-code-techniques): the other pages in this set.
- This page goes with a post in my "How I Used Claude Today" series on LinkedIn.
