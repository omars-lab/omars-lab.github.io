---
title: 'Running Every CI Check on Your Own Machine'
description: 'Each check in my repos has one make target. CI calls it, the commit hook calls it, and I can run it by hand, so a red build is one command away.'
slug: /generative-ai/claude-code-techniques/running-every-ci-check-on-your-own-machine
kind: technique
usefulness: 3 # 1 to 5: how much a typical Claude Code user gets from it; the sidebar follows it
sidebar_position: 14
authors: [oeid]
tags: [claude-code, ai, productivity, ci, automation]
image: /img/claude-code/running-every-ci-check-on-your-own-machine.png
draft: true
questions:
  - How do I run the same checks my CI runs on my own machine?
  - Why did a problem reach main when my pre-commit hook should have caught it?
---

## What annoyed me

A check that only runs in CI is slow to fix. You push, wait, open the log, guess at the cause and
push again. Claude Code has the same problem: it can't see the CI machine, so it guesses too.

A check that only runs on your machine has the opposite hole. A pull request merged on GitHub
never runs your local hook. I found that out when a merge put a row into my main branch that my
pre-commit check exists to keep out. The check was fine. It just never ran.

## What I did about it

Every check gets one `make` target, and that target is the only place the check's command lives.

- CI calls the target. It doesn't repeat the command.
- The pre-commit hook runs the same check.
- I, or Claude, can run it by hand and see the same failure CI saw.

Then a short table in `CLAUDE.md` lists each check, its local command and where it runs on its
own, with a note on what to do when it fails. When a build goes red, Claude reads the table, runs
the target and fixes what it sees, instead of guessing from a log.

## Set it up

In the `Makefile`, one target per check:

```makefile
lint: ## Same lint CI runs
	npx eslint .

test: ## Same tests CI runs
	npm test

node-check: ## Fail early on the wrong Node version, with the fix
	@node -e 'process.exit(+process.versions.node.split(".")[0] >= 20 ? 0 : 1)' || \
	  (echo "Needs Node 20 or newer. Run: nvm use" && exit 1)

check: node-check lint test ## Everything CI checks, in one command
```

In CI, call the targets, not the commands:

```yaml
# .github/workflows/check.yml
on:
  push:
    branches: [main]
  pull_request:
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: make check
```

In `.githooks/pre-commit` (turn it on with `git config core.hooksPath .githooks`):

```sh
#!/bin/sh
make -s check || exit 1
```

And in `CLAUDE.md`, so Claude knows the rule and where each check lives:

```markdown
## Local equivalents of every automated check

| Check | Run it yourself | Runs on its own in |
|---|---|---|
| Lint | `make lint` | pre-commit hook, CI |
| Tests | `make test` | pre-commit hook, CI |
| Node version | `make node-check` | every target that needs Node |

When a check fails in CI, run its target here first and fix what it shows. If it passes here and
fails in CI, the two have drifted: fix the drift, not the symptom. A new CI step gets its make
target in the same change.
```

The last two lines carry most of the weight. "Fix the drift" stops Claude from patching CI to go
green, and "same change" stops a new check from quietly becoming CI-only.

## What it looks like

<figure style={{maxWidth: '480px', margin: '0 auto 1.5rem'}}>
  <img src="/img/claude-code/running-every-ci-check-on-your-own-machine.png" alt="A Claude Code session: Claude asks how to handle a row that leaked into main through a merge, I pick the option that also adds a regression guard, Claude explains a GitHub-side merge never runs the local pre-commit hook, and four days later notes a Node version that was pinned only in CI" />
</figure>

I first asked for this in another project. The picture is from the repo where I draft these posts,
where the same gap showed up from both sides in one session.

First, a check that only ran locally. A pull request merged on GitHub brought in a data row that a
pre-commit check exists to block. Claude stopped, explained it, and asked how to handle it. I
picked the option that also adds a guard. Claude's reason is the whole point: a merge on GitHub
never runs the local hook, so a local-only guard can't catch it. CI now runs the same check.

Four days later, an audit of the repo turned up the other side: the Node version the scripts need
was pinned only in CI. On my machine, the wrong version failed with errors that looked unrelated.
The fix was the same move in reverse: a `node-check` target that refuses the old version and prints
the fix, with CI calling `make` too. Then the table above went into the repo's `CLAUDE.md`.

## Why it works

- **One command per check, so the two can't drift.** CI and your machine don't each keep a copy of
  the command. When the check changes, it changes in both places.
- **A red build becomes a local problem.** Claude can run the exact check, see the exact failure and
  fix it, without a push to find out.
- **It covers both holes.** Checks that only CI ran become runnable by hand, and checks that only
  your hook ran also run on merges that never touch your machine.

## Related

- [Testing a Hook in a Throwaway Session](/craft/generative-ai/claude-code-techniques/testing-a-hook-in-a-throwaway-session):
  another way to make sure a check really runs, instead of hoping it does.
- [Diffing Regenerated Data by Key](/craft/generative-ai/claude-code-techniques/diffing-regenerated-data-by-key):
  another check that lives in one command you can run by hand.
- [Claude Code Techniques](/craft/generative-ai/claude-code-techniques): the other pages in this set.
- This page goes with a post in my "How I Used Claude Today" series on LinkedIn.
