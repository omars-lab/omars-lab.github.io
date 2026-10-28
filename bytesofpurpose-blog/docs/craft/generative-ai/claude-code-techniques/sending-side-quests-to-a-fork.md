---
title: 'Sending Side-Quests to a Fork'
description: 'Hand side work to a forked Claude Code agent. It knows the whole conversation, and only a short result comes back: 273 KB of tool output in, 12 KB out.'
slug: /generative-ai/claude-code-techniques/sending-side-quests-to-a-fork
kind: technique
usefulness: 4 # 1 to 5: how much a typical Claude Code user gets from it; the sidebar follows it
sidebar_position: 4
authors: [oeid]
tags: [claude-code, ai, productivity, subagents, context]
image: /img/claude-code/sending-side-quests-to-a-fork.png
draft: true
questions:
  - When should Claude Code use a forked subagent instead of a fresh one?
  - How do I keep a long Claude Code session from filling up with tool output?
---

## What annoyed me

My long Claude Code sessions kept filling up with things I'd never look at again. A side job, like
building a small tool or scanning a batch of files, meant dozens of file reads and command outputs
piling into the conversation. The main work got slower, and older context got squeezed out.

A fresh subagent keeps that pile out, but it starts knowing nothing. I'd have to explain the
project, the decisions so far and the rules all over again, and it would still miss something.

## What I did about it

Send the side job to a **fork**. Claude Code's Agent tool can start a subagent that begins with a
copy of the whole conversation so far. It knows everything the main thread knows, does the work in
its own space, and hands back only a short report. All the file reads and command output stay in
the fork.

The rule is simple: if the main thread needs the answer but not the work behind it, fork it.
Research, a batch scan, a review, a small build. A fresh agent is for the rarer case where the
conversation should *not* come along, like a second opinion that shouldn't share your framing.

## Set it up

You can ask for it in the moment ("do this in a fork"), but a rule in `CLAUDE.md` (the file Claude
Code reads at the start of every session) means you don't have to remember. I keep mine in the
global one, `~/.claude/CLAUDE.md`, so it applies everywhere:

```markdown
## Delegation

Fork (Agent tool, subagent_type "fork") for a side-quest whose tool output will not
be needed again in the main thread: research, a batch scan, a review, a self-contained
build. The fork inherits this conversation, so don't re-explain the project; say what
to do and what to hand back.

Start a fresh agent only when the conversation should not be inherited, such as an
independent second opinion.

Never re-run a search you delegated. Wait for the fork's result.
```

Forks run in the background, so the main thread can keep going while one works.

To see what your forks kept out, this script reads one session's log and its fork logs, and prints
counts only. Save it as `forks.mjs` (it needs Node.js) and pass it a session file from
`~/.claude/projects/<project folder>/`:

```js
// forks.mjs: how much tool output each fork read, against how much it handed back
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'

const main = process.argv[2] // ~/.claude/projects/<project>/<session-id>.jsonl
const dir = path.join(main.replace(/\.jsonl$/, ''), 'subagents')
const parse = (l) => { try { return JSON.parse(l) } catch { return null } }
const text = (c) => typeof c === 'string' ? c : (c ?? []).map((p) => p.text ?? '').join('')
const kb = (n) => (n / 1024).toFixed(1) + ' KB'

// Each fork's result comes back to the main thread as a task notification.
const back = {}
for (const [note] of readFileSync(main, 'utf8').matchAll(/<task-notification>[\s\S]*?<\/task-notification>/g)) {
  const id = note.match(/<tool-use-id>([^<]+)</)?.[1]
  const result = note.match(/<result>([\s\S]*?)<\/result>/)?.[1]
  if (id && result) back[id] = Math.max(back[id] ?? 0, Buffer.byteLength(result))
}

for (const f of existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.meta.json')) : []) {
  const meta = parse(readFileSync(path.join(dir, f), 'utf8'))
  if (!meta?.isFork) continue
  let calls = 0, read = 0
  for (const line of readFileSync(path.join(dir, f.replace('.meta.json', '.jsonl')), 'utf8').split('\n')) {
    for (const p of parse(line)?.message?.content ?? []) {
      if (p.type === 'tool_use' && p.id !== meta.toolUseId) calls++
      if (p.type === 'tool_result' && p.tool_use_id !== meta.toolUseId) read += Buffer.byteLength(text(p.content))
    }
  }
  console.log(`${calls} tool calls, ${kb(read)} read, ${kb(back[meta.toolUseId] ?? 0)} returned: ${meta.description}`)
}
```

```bash
node forks.mjs ~/.claude/projects/<project folder>/<session-id>.jsonl
```

## What it looks like

<figure style={{maxWidth: '480px', margin: '0 auto 1.5rem'}}>
  <img src="/img/claude-code/sending-side-quests-to-a-fork.png" alt="A Claude Code session: Claude says two tasks are done and committed, and I ask for a local admin page for my short links, then add 'and do in sub agent'. Claude says the task is running in a background fork and offers to keep going on something else. Later it reports the app is built and committed." />
</figure>

I was in the middle of a long session about my LinkedIn posts and asked for a side project: a small
local page to see and manage my short links. Then I added "and do in sub agent".

Claude scoped the task and sent it to a fork. The fork already knew how my short links work, where
they're stored and how they get synced, because all of that was in the conversation. Claude
offered to keep going on other work while it ran.

When the fork finished, the main thread got a one-screen report: what was built, how to run it,
what was checked, and one open question for me.

The numbers from that session, from the script above. Six forks finished. Between them they made
155 tool calls and read 273 KB of tool output. They handed 12 KB back to the main thread, about 22
to 1. The short-links one alone made 32 tool calls and read 26 KB, and returned 2 KB.

## Why it works

- **The main thread keeps what it needs.** The result comes back; the 32 tool calls behind it
  don't. The conversation stays focused on the main work for longer.
- **No re-explaining.** A fork starts with everything you've already said, so the brief can be one
  line. A fresh agent would need the whole background written out.
- **You keep working.** The fork runs in the background, and you get a notice when it's done.

## In my own words

- "and do in sub agent" (August 2026), tacked onto a request for a side project, mid-session.

## Related

- [Claude Code Techniques](/craft/generative-ai/claude-code-techniques): the other pages in this set.
- [How I Use GenAI](/craft/generative-ai/my-genai-workflow/2025-09-30-how-i-use-genai): my wider
  workflow with AI tools.
- This page goes with a post in my "How I Used Claude Today" series on LinkedIn.
