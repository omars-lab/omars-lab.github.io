---
title: 'Tip: Ask Your Claude Code Sessions to Coordinate'
description: 'Claude Code sessions on one machine can message each other. Ask one to tell another what changed, and stop copying answers between terminals.'
slug: /generative-ai/claude-code-techniques/asking-your-sessions-to-coordinate
kind: technique
usefulness: 3 # 1 to 5: how much a typical Claude Code user gets from it; the sidebar follows it
sidebar_position: 6.4
authors: [oeid]
tags: [claude-code, ai, productivity, sessions]
image: /img/claude-code/asking-your-sessions-to-coordinate.png
draft: true
questions:
  - How do I get one Claude Code session to tell another what it needs to know?
  - Can Claude Code sessions message each other?
  - What do the ListAgents and SendMessage tools do in Claude Code?
---

## What I observed

Do you keep more than one Claude Code session open at a time? If so, this page is for you.

I usually have several sessions open in the same repo, each on its own piece of work. One updates
a script, another writes a page that uses it, a third cleans up the backlog. They often need
something from each other: "the column is renamed now", "that test is fixed, go ahead and merge",
"don't touch that file, I'm in the middle of it".

For a long time I was the messenger. I read the answer in one terminal, switched tabs, and pasted
it into the other. Then I found out the sessions can tell each other directly.

## The tip

Ask Claude to send the other session a message. In plain words, in your normal prompt:

- "Tell the session working on the docs that the setup script now takes a `--dry-run` flag."
- "Ask the session in my other terminal whether the migration finished."
- "Let `@api-worker` know the schema change is merged."

You don't call any tool yourself. Claude finds the other session and sends the text.

## Explained simply

Claude Code gives Claude two tools for this, described on the
[cross-session messaging](https://code.claude.com/docs/en/cross-session-messaging) page:

- **ListAgents** lists the sessions Claude can reach: your other sessions on this machine
  (background ones too), plus subagents and teammates. Each session answers to its name, the one
  you gave it with `--name` or `/rename`, or one Claude Code picked.
- **SendMessage** sends plain text to one of them.

The other session sees a short line like `› Message from @api-worker: …`. If it's busy, it reads
the message between tool calls. If it's idle, the message starts a new turn, as if you'd typed it.

You can name the target yourself: type `@` and the first letters of the session's name, and pick
it from the list. To see who Claude can reach, type `/list-agents` (or `/peers`).

It needs Claude Code v2.1.224 or later on macOS, Linux and WSL 2, and v2.1.234 or later on native
Windows. It's on by default.

## What it looks like

To see it work without showing any of my real sessions, I wrote a small script that starts two
fresh sessions named Jack and Jill in an empty folder. Jill is told a session named jack will
message her, and to reply with one question. Jack is told to find jill with ListAgents, say hi with
SendMessage, and answer her question.

<figure style={{maxWidth: '900px', margin: '0 auto 1.5rem'}}>
  <img src="/img/claude-code/asking-your-sessions-to-coordinate.gif" alt="Two terminal windows side by side, jack on the left and jill on the right. Jack lists the sessions, finds jill, and sends 'Hi Jill, I'm Jack, another Claude session on this machine, and it's nice to meet you!' It shows up in jill's window as a message from jack. Jill replies and asks what he's working on. Jack answers that this chat is his whole task. Each window ends with how many messages it sent and received, and 10 cents of usage." />
</figure>

Here is what happened in that run, second by second:

| Time | Session | What happened |
|---|---|---|
| 0.0 s | jill | Gets her prompt and says she's waiting for jack |
| 2.3 s | jack | Gets his prompt |
| 4.1 s | jack | ListAgents finds jill |
| 6.3 s | jack → jill | "Hi Jill, I'm Jack, another Claude session on this machine, and it's nice to meet you!" |
| 7.9 s | jill → jack | "Hi Jack, I'm Jill … What are you working on today?" |
| 9.6 s | jack → jill | "Today I'm just introducing myself to you and answering your question, so this chat is my whole task!" |
| 11.1 s | both | Done |

Jack sent two messages and got one back. Jill sent one and got two. The whole run took about 11
seconds and cost about 20 cents for both sessions together.

Two sessions saying hi isn't useful on its own. Swap the hello for "the config moved to
`settings/`" or "I'm done with `api.ts`, it's yours", and it saves you the tab switch and the paste.

## Words of caution

- **It's text only.** A message carries what Claude writes in it, never the conversation or any
  files. If the other session needs a file, say where it is.
- **It can't approve anything.** A message is marked as coming from another session, not from you.
  It can't answer a permission prompt, change settings or `CLAUDE.md`, or run a `/command`. The
  receiving session still asks you for the usual permissions.
- **It costs usage.** A delivered message counts like a prompt you typed, because the other
  session reads it and replies.
- **Same machine stays on your machine.** Between sessions on one machine, messages go over a
  local socket and never through Anthropic's servers. Reaching a session on another machine needs
  [Remote Control](https://code.claude.com/docs/en/remote-control) and goes through Anthropic. Set
  `isolatePeerMachines` to `true` if you want to approve each message before it leaves the machine.
- **Loops stop on their own.** Claude Code rate-limits repeated messages from the same sender and
  queues at most 50, so two sessions can't chat forever.

## Set it up

There's nothing to turn on. If you want more control, the
[`crossSessionInbound`](https://code.claude.com/docs/en/settings-reference#crosssessioninbound)
setting decides what a session does with incoming messages:

- `accept` delivers them;
- `hold` shows a notice for each and waits;
- `refuse` drops them.

With nothing set, a session that asks you for permissions accepts messages, unless the sender is a
session that skips permission prompts.

To turn it off completely, deny the two tools and refuse incoming messages in your settings:

```json
{
  "permissions": {
    "deny": ["SendMessage", "ListAgents"]
  },
  "crossSessionInbound": "refuse"
}
```

Denying `SendMessage` also stops Claude from messaging its own subagents and teammates, since the
same tool serves both.

## Why it works

- **The session that knows tells the session that needs it.** You stop being the copy-paste step
  between terminals.
- **The receiver gets it at the right moment.** A busy session reads the message between steps, so
  it can change course before it builds on something stale.
- **You stay in charge.** A message is just text from another session. It can't approve anything
  for you.

## Related

- [Cross-session messaging](https://code.claude.com/docs/en/cross-session-messaging): the Claude
  Code docs page this tip is built on.
- [Tools reference](https://code.claude.com/docs/en/tools-reference): what ListAgents and
  SendMessage do.
- [`crossSessionInbound` in the settings reference](https://code.claude.com/docs/en/settings-reference#crosssessioninbound).
- [Sending Side-Quests to a Fork](/craft/generative-ai/claude-code-techniques/sending-side-quests-to-a-fork):
  the other way to split work, when the helper should start from your conversation.
- [Claude Code Techniques](/craft/generative-ai/claude-code-techniques): the other pages in this set.
- This page goes with a post in my "How I Used Claude Today" series on LinkedIn.
