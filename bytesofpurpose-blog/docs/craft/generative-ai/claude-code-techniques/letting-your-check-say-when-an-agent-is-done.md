---
title: 'Letting Your Own Check Say When an Agent Is Done'
description: 'A loop of Claude Code agents where a command you wrote, not an agent, decides when the work is done: a critic, a builder, a hook, three reviewers and you.'
slug: /generative-ai/claude-code-techniques/letting-your-check-say-when-an-agent-is-done
kind: technique
usefulness: 4 # 1 to 5: how much a typical Claude Code user gets from it; the sidebar follows it
sidebar_position: 12.8
authors: [oeid]
tags: [claude-code, ai, productivity, loops, hooks]
image: /img/claude-code/letting-your-check-say-when-an-agent-is-done.png
questions:
  - How do I make a Claude Code agent keep working until my tests pass?
  - What is the difference between /goal and a hook that runs my check?
  - How do I stop a coding agent from editing the tests to make them pass?
---

## What annoyed me

When I hand an agent a task, the agent is the one who says it's done. It says "all tests pass", and
most of the time that's true. Sometimes it ran half of them. Sometimes it changed a test so it would
pass. I'd find out when I read the diff, which is the slow part I was trying to hand off.

I wanted the opposite: a command I wrote decides when the work is done, and the agent can't argue
with it or edit it.

## What I did about it

I built a small loop of agents, as a Claude Code plugin with one skill, `/development-loop`. One
issue goes in. A pull request comes out, for me to read. Nothing merges on its own.

<figure style={{maxWidth: '900px', margin: '0 auto 1.5rem'}}>
  <img src="/img/claude-code/letting-your-check-say-when-an-agent-is-done.png" alt="The development loop. An issue goes to a critic, which writes goal.md. A builder works in its own copy of the repo. Each time the builder stops, a hook runs my check and answers met, not yet, or stuck. Met goes to three reviewers, security, spec and simplicity, whose findings go back to the builder once. Then I read the pull request, and only I merge. An optimizer writes one piece of guidance, at the lowest rung of a ladder that would have caught the miss: a tip, a goal rule, a tenet, a skill step, or the check itself. The next run reads it." />
</figure>

1. **A critic turns the issue into a goal.** It writes `goal.md`: what done looks like, the files the
   builder must leave alone, and the shortcuts an agent could take to pass the check without doing
   the work. It runs my check first. If the check already passes, it stops the run.
2. **A builder does the work** in its own copy of the repo, and commits.
3. **A hook runs my check every time the builder stops.** It answers one of three things: met (go
   on), not yet (keep going, here's what failed), or stuck (stop, keep the branch).
4. **Three reviewers read the commits once**: security, spec and simplicity. The spec reviewer only
   gets the goal, never the builder's notes, so it judges the work and not the story about it. All
   their findings go back to the builder in one message, and the check runs again.
5. **I read the pull request.** Only a person merges.
6. **An optimizer writes one piece of guidance** for the next run. More on that below.

## Why not just use /goal

[`/goal`](https://code.claude.com/docs/en/goal) is close to what I wanted, and I took its three
answers straight from it. After each turn, a small model reads your condition and says met, not yet,
or impossible. It's great for one session working toward one end state.

Two things didn't fit:

- **It judges by reading, not by running.** The model looks at the conversation. It doesn't run your
  tests. "The tests pass" is still a claim.
- **It works in the main session.** My builder is a helper agent, and I wanted the check on that
  agent, not on the session running the loop.

If you only need one session to keep going until something is true, use `/goal`. This loop is for
when the check must be a command, you want reviewers, and you want what went wrong to carry over to
the next run.

## The hook that runs the check

Claude Code lets a plugin run a command when a helper agent stops (the
[`SubagentStop` hook](https://code.claude.com/docs/en/hooks)). If the command answers "block" with
a reason, that reason goes back to the agent as its next instruction. That's the whole trick.

The check itself lives in a `devloop.json` that I commit:

```json
{
  "check": "make verify",
  "protect": ["test/", "Makefile", "package.json"],
  "max_rounds": 6
}
```

The hook reads it from the commit the run started on, not from disk. The builder has a shell, so a
copy on disk is one it could change. `devloop.json` itself is always protected, and the critic can
add files to the list but never take any off. Then, in order:

```python
# 1. Did the builder touch a protected file? Compare with the starting commit.
changed = git(wt, "diff", "--no-renames", "--name-only", base).splitlines()
touched = [p for p in changed if matches(p, protected)]
if touched:
    return not_yet("You changed files you may not change: " + ", ".join(touched))

# 2. Run my check in the builder's copy.
proc = subprocess.run(cfg["check"], shell=True, cwd=wt, capture_output=True, text=True)
if proc.returncode != 0:
    return not_yet(f"`{cfg['check']}` exited {proc.returncode}. Last lines: ...")

# 3. Passing but not committed doesn't count.
if git(wt, "status", "--porcelain").strip():
    return not_yet("The check passes, but there are uncommitted changes.")
return met()
```

Moving a protected file away counts as changing it (that's the `--no-renames`). Once the round cap
is used up, the hook lets the builder stop and logs "cap". The skill then runs the same check once
more itself, whatever the builder said. Only a passing check counts. If the hook can't run at all,
it lets the agent stop rather than trap it, and the run isn't marked done.

One thing I measured instead of trusting: the docs say the "block" answer stops working after a
default number of blocks in a row. In my test it kept working past that. So the loop counts its
own rounds and doesn't lean on the limit.

## Guidance is a ladder, not one lessons file

The usual version of this loop ends with a lessons file the next run reads. I found one file wasn't
enough, because lessons come in sizes. So the optimizer picks a rung:

| Rung | Where it lands | Who says yes |
|---|---|---|
| tip | `.devloop/lessons.md` | me |
| goal rule | the critic's instructions | me, in the pull request |
| tenet | the repo's `CLAUDE.md` | me, in the pull request |
| skill step | a step in a skill or agent file | me, in the pull request |
| check | `devloop.json` | only me; the loop never writes it |

It picks the lowest rung that would have caught the miss, and says why the one below wasn't enough.
A tip that's already there and gets missed again moves up a rung. That's the same move as my
[tenets](/craft/generative-ai/claude-code-techniques/giving-claude-engineering-tenets): fix a
mistake one case at a time and it's a tip; the rule that covers the whole kind of mistake is a
tenet.

I watched it climb once. A run started with a tip in `lessons.md`: pass the `--max` value straight
through, with no checking of its own. The critic read it and put it in the goal. The builder added
the checking anyway. So the optimizer proposed a goal rule instead, spelling out what "passes it
through" allows, and pointed at the tip that had been ignored.

## What it looks like

I ran it five times on a small sample project that ships with the plugin (a `slugify` function with
fiddly rules), and then on one real task from my own backlog.

| Run | Minutes | Cost | "Not yet" rounds | Findings (security / spec / simplicity) | Guidance |
|---|---|---|---|---|---|
| Sample 1 | 2.2 | $0.67 | couldn't commit | not reached | not reached |
| Sample 2 | 4.6 | $1.43 | 0 | 0 / 3 / 4 | goal rule |
| Sample 3 | 4.6 | $1.40 | 0 | 0 / 2 / 4 | tip |
| Sample 4 | 3.8 | $1.31 | 0 | 0 / 1 / 3 | goal rule, climbed |
| Sample 5 | 3.9 | $1.43 | 1 | 0 / 3 / 4 | tip |
| Real, try 1 | about 1 | $0.69 | stopped by the critic | not reached | not reached |
| Real, try 2 | 6.1 | $2.38 | 0 | 1 / 3 / 4 | tip |

Sample 1 stopped without finishing, because the builder couldn't commit (more below). Sample 4
started with sample 3's tip already in place. Sample 5 was seeded: I told the builder to stop early
once, so the "not yet" path would show up in a real run. The hook ran the check, sent back the failing output, and the builder
finished 12 seconds later.

The real task was swapping my hub's own copy of a picture checker for the one in a shared plugin.
The two tries are the best part.

**Try 1 never started a build.** My check was the old picture tests, and they already passed before
any change. The critic ran it, saw it pass, and stopped the run: a builder that did nothing would
have been let through. It named the test that was missing. That cost 69 cents and saved a build
that would have proved nothing.

**Try 2 caught a bug in my own test.** I wrote the missing test and ran it again. It went all the
way round and opened a pull request. But one of my test cases could never pass with the simple
version of the change. The builder isn't allowed to edit my tests, so it wrote a marked workaround
and said, in the pull request, that the real fix was mine. It was. I changed the test, and the
workaround went away.

## What broke on the way

- **The builder couldn't commit** (sample 1). Its instructions said to start with `cd <path>`, so
  every command was `cd <path> && git ...`, which matched none of the allowed commands. Now every
  agent runs one plain command at a time (`git -C <path> ...`).
- **Reviewers couldn't save their findings** (sample 2). Claude Code refused a helper agent writing
  a report file. Now reviewers return their findings as text, and the skill saves them.
- **Nobody ran the reviewers' edge cases after the fix.** The tests are protected and the check only
  runs them. That's by design, so those cases go in the pull request, for me.

## Why it works

- **Done is a command, not an opinion.** The agent can say anything it likes. The check decides.
- **The check is mine and the agent can't touch it.** Protected files, read from the starting
  commit. When the check itself is weak, the loop says so instead of quietly working around it.
- **Reviewers see the work once, and the spec reviewer sees only the goal.** One round of findings
  keeps it from turning into an argument.
- **What it learns has a size.** A tip, a rule, a tenet, a skill step or a change to the check, each
  landing where I'll see it.

## Try it

The plugin is `loop-manager`, in a small public repo,
[omars-lab/claude-code-plugins](https://github.com/omars-lab/claude-code-plugins). Install it from
your terminal:

```sh
claude plugin marketplace add omars-lab/claude-code-plugins
claude plugin install loop-manager@omars-lab
```

Inside Claude Code, `/plugin marketplace add omars-lab/claude-code-plugins` and
`/plugin install loop-manager@omars-lab` do the same.

To watch one run on the sample before pointing it at your own code, copy the sample out of the
repo and give it a first commit. It needs git, make and Node 18 or newer, and nothing to install:

```sh
git clone https://github.com/omars-lab/claude-code-plugins
cp -R claude-code-plugins/plugins/loop-manager/skills/development-loop/sample devloop-sample
cd devloop-sample
mv gitignore .gitignore
git init -q && git add . && git commit -qm "sample start"
# fails 8 of its 10 tests: the issue isn't fixed yet
make verify
claude
```

Then, in Claude Code:

```text
/loop-manager:development-loop the issue in ISSUE.md
```

The loop works in its own copy next to the sample, at `devloop-sample-devloop`, and commits to a
`devloop/<run>` branch that the sample can see too. The sample's `devloop.json` says `"pr": false`, so it prints the branch at
the end instead of opening a pull request. The goal, the log and the reviewers' findings are in
`.devloop/<run>/`. To see the result, switch the sample to that branch and run the check yourself:

```sh
git switch devloop/<run>
make verify     # all 10 pass
```

In your own repo, commit a `devloop.json` with your check and the files to protect, add `.devloop/`
to `.gitignore`, and run:

```text
/loop-manager:development-loop <the issue, in a sentence or two>
```

or, to work through `.devloop/queue.md` one item at a time:

```text
/loop /loop-manager:development-loop
```

## Related

- [Writing a Loop Prompt That Knows When to Stop](/craft/generative-ai/claude-code-techniques/writing-a-loop-prompt-that-knows-when-to-stop):
  the plain `/loop` version, with no hook.
- [Giving Claude Engineering Tenets](/craft/generative-ai/claude-code-techniques/giving-claude-engineering-tenets):
  where the ladder's tenet rung comes from.
- [A Skill That Can't Approve Its Own Work](/craft/generative-ai/claude-code-techniques/a-skill-that-cannot-approve-its-own-work):
  why only a person merges.
- [Fixing the Check That Missed It](/craft/generative-ai/claude-code-techniques/fixing-the-check-that-missed-it):
  the check rung, by hand.
- [Claude Code Techniques](/craft/generative-ai/claude-code-techniques): the other pages in this set.
- This page goes with a post in my "How I Used Claude Today" series on LinkedIn.
