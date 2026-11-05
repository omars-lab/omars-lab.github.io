---
title: 'Tip: Keep Your Claude Code Session Logs'
description: 'Claude Code deletes each session log after 30 days. What a log holds, why it is worth keeping, and one setting plus a backup to keep it.'
slug: /generative-ai/claude-code-techniques/keep-your-claude-code-session-logs
kind: technique
usefulness: 4 # 1 to 5: how much a typical Claude Code user gets from it; the sidebar follows it
sidebar_position: 6.4
authors: [oeid]
tags: [claude-code, ai, productivity, analytics]
image: /img/claude-code/keep-your-claude-code-session-logs.png
draft: true
questions:
  - How long does Claude Code keep my session history?
  - What is inside a Claude Code session log?
  - How do I stop Claude Code from deleting old sessions?
---

## What I observed

Do you use Claude Code most days? If so, this page is for you.

Every session you run is saved as a file on your machine. Claude Code deletes that file **30 days
after it was last used**, and it does it quietly: no message, the session just stops showing up in
`/resume`.

I raised that limit early and copy the files to a backup. Today **250 of the 389 sessions on my
laptop are more than 30 days old**. On the default setting, all 250 would be gone, and so would the
history behind every number I've worked out about my own Claude Code use.

## The technique

**Keep your session logs: raise the age limit in `settings.json`, and copy the logs somewhere safe
on a schedule.** A log is the only full record of what you and Claude did in a session. Once it's
kept, you can go back to it, quote it and count things in it months later.

## What a session log holds

Each session is one file at `~/.claude/projects/<project>/<session-id>.jsonl`, where `<project>` is
your working folder's path with every character that isn't a letter or a digit turned into `-`
([where transcripts are stored](https://code.claude.com/docs/en/sessions#where-transcripts-are-stored)).
It is plain text, one JSON object per line. Per the
[docs on the `.claude` folder](https://code.claude.com/docs/en/claude-directory#application-data),
it holds:

- **Your messages and Claude's replies**, each with a timestamp.
- **Every tool call and its result**: the command Claude ran and what it printed, the file it read
  and what was in it, the edit it made.
- **What Claude Code sent the model** along with your messages: the system prompt, the tool
  definitions, the request settings and the `CLAUDE.md` files it loaded.
- **The summary written when a long session is compacted.** When the conversation gets too long,
  Claude Code replaces it with a summary in Claude's working memory. The log keeps the summary, and
  a resumed session opens at a "Conversation compacted" row
  ([what a resumed session restores](https://code.claude.com/docs/en/sessions#what-a-resumed-session-restores)).

Next to the file, a folder with the same name holds the logs of any subagents the session started
and any tool output too large to keep inline. They are deleted along with the session.

### A made-up sample

Here is what a short session looks like, written by hand for this page. It is trimmed: a real log
has many more fields on each line, and the exact shape is internal to Claude Code and changes
between versions, so treat this as a sketch, not a format to parse. The project, the person and the
session are all invented.

```json
{"type":"user","timestamp":"2026-03-02T09:14:05Z","sessionId":"sample-0001","cwd":"/Users/you/code/tiny-dates","message":{"role":"user","content":"The leap year test fails. Can you find out why?"}}
{"type":"assistant","timestamp":"2026-03-02T09:14:09Z","message":{"role":"assistant","content":[{"type":"text","text":"I'll run that test first."},{"type":"tool_use","id":"tool_1","name":"Bash","input":{"command":"npm test -- leap"}}],"usage":{"input_tokens":8,"output_tokens":41,"cache_read_input_tokens":18250}}}
{"type":"user","timestamp":"2026-03-02T09:14:15Z","message":{"role":"user","content":[{"type":"tool_result","tool_use_id":"tool_1","content":"FAIL leap.test.js: isLeap(1900) expected false, got true"}]}}
{"type":"assistant","timestamp":"2026-03-02T09:14:31Z","message":{"role":"assistant","content":[{"type":"text","text":"isLeap checks year % 4 only. Years divisible by 100 are not leap years unless they are divisible by 400. I'll fix that."},{"type":"tool_use","id":"tool_2","name":"Edit","input":{"file_path":"src/leap.js","old_string":"return year % 4 === 0","new_string":"return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)"}}]}}
{"type":"user","timestamp":"2026-03-02T09:16:02Z","message":{"role":"user","content":"Good. Add a rule to CLAUDE.md: always test 1900 and 2000 when touching date code."}}
{"type":"system","subtype":"compact_boundary","timestamp":"2026-03-02T11:40:00Z","content":"Conversation compacted"}
{"type":"user","isCompactSummary":true,"timestamp":"2026-03-02T11:40:00Z","message":{"role":"user","content":"Summary so far: fixed isLeap for century years, added a CLAUDE.md rule to test 1900 and 2000, now working on month lengths."}}
```

Read top to bottom, that is the whole story of the session: what you asked, what Claude ran, what
the test printed, the fix, the moment you made it a rule, and the summary Claude carried on with
after the conversation was compacted.

## Why keep them

- **Re-read what was decided.** A month later, "why does this check exist?" has an answer in the
  log: the failing test, the reasoning, the exact words you used.
- **Cite the moment a rule was written.** When a line in your `CLAUDE.md` is questioned, you can
  point at the session and the line where it came from, instead of a memory of it. The
  [Citing the Session, Not a Memory](/craft/generative-ai/claude-code-techniques/citing-the-session-not-a-memory)
  page builds on this.
- **Measure your own usage.** Each reply records its tokens, so the logs can tell you how long you
  pause between turns, what each session cost and which tools ran. My
  [prompt cache tip](/craft/generative-ai/claude-code-techniques/picking-the-prompt-cache-time-limit)
  came from counting exactly that, across every session I'd kept.

## Set it up

### 1. Raise the age limit

Add `cleanupPeriodDays` to `~/.claude/settings.json`. The default is **30 days**, the lowest value
is 1, and `0` is rejected. The docs suggest a large number such as `3650` (about ten years) for long
retention ([`cleanupPeriodDays`](https://code.claude.com/docs/en/settings-reference#cleanupperioddays)):

```json title="~/.claude/settings.json"
{
  "cleanupPeriodDays": 3650
}
```

Claude Code runs the cleanup in the background after a session starts, so set this before your
oldest session crosses the line. Sessions you started or last continued in Claude Desktop or Cowork
follow their own rule: they are kept at any age unless you set
[`desktopSessionCleanupPeriodDays`](https://code.claude.com/docs/en/settings-reference#desktopsessioncleanupperioddays).

### 2. Copy the logs somewhere safe

The setting protects you from the cleanup, not from a lost laptop. Copy the folder to a backup
drive or another machine on a schedule:

```bash
rsync -a ~/.claude/projects/ /Volumes/Backup/claude-projects/
```

Leave out `--delete`. Without it, a file that disappears from `~/.claude/projects` stays in the
backup, which is the point. To run it every hour, add a line with `crontab -e`:

```text
0 * * * * rsync -a ~/.claude/projects/ /Volumes/Backup/claude-projects/
```

If you'd rather copy each session the moment it ends, a `SessionEnd`
[hook](https://code.claude.com/docs/en/hooks) receives the session's `transcript_path` and can copy
that one file.

### 3. Keep the backup private

The logs are **not encrypted**. Anything a tool read or printed is in them: if Claude read a `.env`
file, its values are in the log
([plaintext storage](https://code.claude.com/docs/en/claude-directory#plaintext-storage)). Back them
up to a drive or a machine only you can reach, never to a public repo or a shared folder.

## What it looks like

![The settings.json line that keeps Claude Code session logs for ten years](/img/claude-code/keep-your-claude-code-session-logs.png)

One line in `settings.json`. Everything else on this page depends on the files still being there.

## Reading an old session back

You don't need to parse the file to use it. `claude --resume` opens an old session as long as its
file is still there, and you can ask a stored session a question without opening it
([access conversations from scripts](https://code.claude.com/docs/en/sessions#access-conversations-from-scripts)):

```bash
claude -p --resume <session-id> "what did we decide about the leap year check?"
```

For a readable copy, run `/export` inside the session.

## Why it works

- **The cleanup is silent.** Nothing tells you a session is gone until you go looking for it.
- **One setting changes the default for every project.** It goes in your user settings once.
- **A backup that never deletes** keeps a session even after the machine it ran on is gone.

## Related

- [Citing the Session, Not a Memory](/craft/generative-ai/claude-code-techniques/citing-the-session-not-a-memory):
  point at the exact line of a past session behind a claim.
- [Tip: Ask Claude to Optimize Your Cache TTL](/craft/generative-ai/claude-code-techniques/picking-the-prompt-cache-time-limit):
  one thing you can measure once your logs are kept.
- Docs I read for this page:
  [Explore the .claude directory](https://code.claude.com/docs/en/claude-directory),
  [Manage sessions](https://code.claude.com/docs/en/sessions),
  [All settings](https://code.claude.com/docs/en/settings-reference),
  [Data usage](https://code.claude.com/docs/en/data-usage),
  [Hooks reference](https://code.claude.com/docs/en/hooks).
- This page goes with my Claude Code tips on LinkedIn.
