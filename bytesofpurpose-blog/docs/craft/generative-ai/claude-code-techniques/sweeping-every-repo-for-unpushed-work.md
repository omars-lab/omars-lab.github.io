---
title: 'Sweeping Every Repo for Unpushed Work'
description: 'A Claude Code skill that finds every repo with work not on GitHub, writes each commit message from the diff, and scans for secrets before it pushes.'
slug: /generative-ai/claude-code-techniques/sweeping-every-repo-for-unpushed-work
kind: technique
usefulness: 3 # 1 to 5: how much a typical Claude Code user gets from it; the sidebar follows it
sidebar_position: 8
authors: [oeid]
tags: [claude-code, ai, productivity, git, skills]
draft: true
questions:
  - How do I find every git repo on my machine that has uncommitted or unpushed work?
  - Can Claude Code write my commit messages and push my changes without leaking a secret?
---

## What annoyed me

I keep a lot of small repos on my laptop: scripts, tools, side projects, this blog. Claude Code
works in most of them. At the end of a week I couldn't say which ones had changes that never got
committed, or commits that never got pushed.

Finding out meant opening each folder and running `git status`. So mostly I didn't, and the work
sat there until I needed it on another machine and it wasn't on GitHub.

## What I did about it

I asked Claude to build one skill (a set of saved instructions it follows on request) that does the
whole round in one go:

1. **Survey.** Find every repo under my code folder and sort them: clean, only needs a push, has
   uncommitted changes, or needs a decision from me (a branch that split from GitHub's copy, say).
2. **Push what needs no judgment.** Commits that are done but not pushed go out, after a secret scan.
3. **Read each dirty repo.** Claude reads the actual diff, decides what belongs in a commit and what
   doesn't (build output, `.env` files), splits unrelated changes, and writes a message in that
   repo's own style.
4. **Ask once.** It shows me one table, repo by repo, and commits nothing until I agree.
5. **Scan, commit, push.** Each commit is scanned for secrets with
   [gitleaks](https://github.com/gitleaks/gitleaks) before it's made, and again before it leaves the
   machine.

The split matters. Finding repos and pushing is mechanical, so a script does it. Deciding what a
change is and what to call it needs judgment, so Claude does that part, and I approve it.

## Set it up

Two parts: a small script that does the survey, and a skill that tells Claude what to do with it.
You need [gitleaks](https://github.com/gitleaks/gitleaks) installed (`brew install gitleaks` on a
Mac).

The survey script. Save it as `repo-survey.sh` somewhere on your `PATH` and make it executable. It
only reads; it never fetches, commits or pushes:

```bash
#!/bin/bash
# repo-survey.sh: list git repos under a folder that have uncommitted or unpushed work.
# Prints one line per repo: path, dirty (0/1), commits ahead of upstream, upstream name.
root="${1:-$HOME/code}"
find "$root" -maxdepth 3 -name .git -type d -not -path '*/node_modules/*' | while read -r g; do
  repo="${g%/.git}"
  git -C "$repo" remote -v | grep -q 'github\.com' || continue   # only repos that live on GitHub
  dirty=0
  [ -n "$(git -C "$repo" status --porcelain | head -1)" ] && dirty=1
  upstream=$(git -C "$repo" rev-parse --abbrev-ref '@{u}' 2>/dev/null || echo none)
  ahead=0
  [ "$upstream" != none ] && ahead=$(git -C "$repo" rev-list --count '@{u}..HEAD' 2>/dev/null || echo 0)
  if [ "$dirty" = 1 ] || [ "$ahead" -gt 0 ] || [ "$upstream" = none ]; then
    printf '%s\t%s\t%s\t%s\n' "$repo" "$dirty" "$ahead" "$upstream"
  fi
done
```

The skill. Save it as `~/.claude/skills/sync-github/SKILL.md` so it works from any folder:

```markdown
---
name: sync-github
description: Find every repo with uncommitted or unpushed work, write commit messages from
  the diffs, scan for secrets, and push to GitHub. Use when asked to commit and push pending
  work, or to check what has not made it to GitHub.
---

# Sync local work to GitHub

## 1. Survey
Run `repo-survey.sh ~/code`. Sort the repos into: only needs a push (ahead > 0, not dirty),
dirty (needs commits), and needs a decision (no upstream, or behind and ahead at once).
Report the groups before touching anything.

## 2. Push what needs no judgment
For each repo that only needs a push, scan what is about to leave:
    gitleaks git --log-opts="@{u}..HEAD" --redact <repo>
If it passes, `git -C <repo> push`. If it finds something, stop and tell me.

## 3. Read each dirty repo
    git -C <repo> status --short
    git -C <repo> diff
    git -C <repo> ls-files --others --exclude-standard
    git -C <repo> log --oneline -5
Decide, in order: does each new file belong in git at all (build output and .env files
do not, they get a .gitignore line); is this one change or several; is any of it
unfinished. Leaving a repo dirty is a fine answer. Match the repo's existing message style.

## 4. Propose, then get one approval
Show one table: repo, files to stage, proposed message, what you left out and why.
Commit nothing until I agree.

## 5. Commit and push
    git -C <repo> add <named paths>
    gitleaks git --staged --redact <repo>
    git -C <repo> commit -m "..."
    git -C <repo> push
Then report what was pushed, what was left dirty and why, and what still needs me.

## Never
- `git add -A` or `git add .`; stage named paths only.
- `--no-verify`, `--force`, or skipping the gitleaks step.
- Resolve a branch that has split from GitHub's copy; show it to me instead.
- Commit dozens of repos in one pass. Propose a handful, and ask before going wider.
```

Then ask Claude "sync my repos to GitHub" or run `/sync-github`.

## What it looks like

{/* Picture goes here once the session it is drawn from is cleared for the blog. */}

A run starts with the survey. On my laptop today the script above listed 44 repos with work that
wasn't on GitHub yet, almost all of it uncommitted changes and a few commits not pushed, plus one
branch that had never been pushed at all. That's the list I used to keep in my head and kept
getting wrong.

From there Claude takes the push-only repos first, since they need nothing from me. Then it reads
the dirty ones and comes back with one table. Most rows are a staged file list and a one-line
message. Some say "left uncommitted: half-done, has debug prints", and that's the skill working,
not failing.

## Why it works

- **You stop remembering.** The question "which repo did I leave dirty?" becomes a command, not a
  memory test.
- **The judgment is where it belongs.** A script can find and push repos safely. Only something
  that reads the diff can name a commit or spot a file that shouldn't be in git. One approval
  covers the batch, so it's still quick.
- **Secrets get two chances to be caught.** Many repos never have a pre-commit hook set up. The skill
  runs the scan itself, before the commit and before the push.

## Related

- [Claude Code Techniques](/craft/generative-ai/claude-code-techniques): the other pages in this set.
- [How I Use GenAI](/craft/generative-ai/my-genai-workflow/2025-09-30-how-i-use-genai): my wider
  workflow with AI tools.
- This page goes with a post in my "How I Used Claude Today" series on LinkedIn.
