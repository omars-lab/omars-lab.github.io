---
title: 'Diffing Regenerated Data by Key'
description: 'git said 185 lines changed after Claude Code re-ran a script. Matched by id, only 21 rows had. A short script now checks every regenerated data file.'
slug: /generative-ai/claude-code-techniques/diffing-regenerated-data-by-key
kind: technique
usefulness: 2 # 1 to 5: how much a typical Claude Code user gets from it; the sidebar follows it
sidebar_position: 17
authors: [oeid]
tags: [claude-code, ai, productivity, data, git]
image: /img/claude-code/diffing-regenerated-data-by-key.png
draft: true
questions:
  - Why does git diff show every row changed after I re-run a script that writes a data file?
  - How do I review what really changed in a CSV or TSV file that a script rewrites?
---

## What annoyed me

A lot of my projects keep their data in plain tab-separated files that a script rewrites from
scratch: a list of my Claude chats, a list of sessions, a list of posts. Claude Code re-runs those
scripts all the time. Then it, or I, checks the change with `git diff`.

One day Claude fixed a bug in one of those scripts, the one that lists my Claude chats. Seven links
were wrong. It re-ran the script, and `git diff` said 185 lines had been removed and 185 added, in a
file of 208 rows. Almost every row looked touched. There is no way to review that by reading it,
so the honest options are to trust it or to skip it.

Nothing was wrong with the data. Two columns had swapped places in the header, so every line's text
changed even where no value did.

## What I did about it

Diff the data, not the text. Read both versions of the file, match the rows on their id, and compare
each row field by field. Lines moving, columns swapping places and rows being re-sorted all drop out.
What's left is the list of real changes: rows added, rows removed, and for each changed row, which
field went from what to what.

Claude did this the first time with a throwaway script in the middle of the bug fix. It came back
with 21 real changes: the 7 fixed links, and 14 filing choices I had made in my own app that day.
Later it turned that throwaway into a small script, and I made it the rule for every file a script
writes.

## Set it up

Two parts: a short script, and a line in your `CLAUDE.md` (the file Claude Code reads at the start of
every session) so Claude reaches for it instead of `git diff`.

The script, for tab-separated files with a header row. Save it as `keydiff.mjs` (it needs Node.js):

```js
// keydiff.mjs: compare two versions of a TSV file row by row, matched on a key column
import { readFileSync } from 'node:fs'

const [beforeFile, afterFile, key = 'id'] = process.argv.slice(2)

function load(file) {
  const [header, ...lines] = readFileSync(file, 'utf8').trimEnd().split('\n')
  const columns = header.split('\t')
  const rows = new Map()
  for (const line of lines) {
    const cells = line.split('\t')
    const row = Object.fromEntries(columns.map((c, i) => [c, cells[i] ?? '']))
    rows.set(row[key], row)
  }
  return rows
}

const before = load(beforeFile)
const after = load(afterFile)
const added = [...after.keys()].filter((k) => !before.has(k))
const removed = [...before.keys()].filter((k) => !after.has(k))
const changed = []
for (const [k, row] of after) {
  const old = before.get(k)
  if (!old) continue
  const fields = Object.keys({ ...old, ...row }).filter((f) => (old[f] ?? '') !== (row[f] ?? ''))
  if (fields.length) changed.push(`${k}: ` + fields.map((f) => `${f} "${old[f] ?? ''}" -> "${row[f] ?? ''}"`).join(', '))
}

console.log(`${before.size} rows before, ${after.size} after`)
console.log(`${added.length} added, ${removed.length} removed, ${changed.length} changed`)
for (const line of changed) console.log('  ' + line)
```

Compare the file on disk with the last committed version:

```bash
git show HEAD:data/chats.tsv > /tmp/chats-before.tsv
node keydiff.mjs /tmp/chats-before.tsv data/chats.tsv id
```

For CSV, swap the `split('\t')` calls for a real CSV parser, since CSV cells can hold commas and
quotes. If you'd rather not keep a file, ask Claude for the same thing in Python with `csv.DictReader`;
it's about as long.

Then the rule, in your `CLAUDE.md`:

```markdown
## Reviewing generated data files

Files under data/ are written by scripts. Never review a change to them with
git diff: a re-run can reorder rows or columns and make every line look changed.
Compare by key instead:

    git show HEAD:<file> > /tmp/before.tsv
    node keydiff.mjs /tmp/before.tsv <file> id

Report the counts (added, removed, changed) and each changed field. If a change
was meant to touch N rows and the diff shows more, stop and explain the extra
rows before committing.
```

If the script is part of a project, give it a short command (a `make` target or an npm script) and
put that command in the rule, so the call is the same every time.

## What it looks like

<figure style={{maxWidth: '480px', margin: '0 auto 1.5rem'}}>
  <img src="/img/claude-code/diffing-regenerated-data-by-key.png" alt="A Claude Code session: I ask why some links to my Claude design files are broken. Claude fixes the script and confirms only those 7 rows changed plus my own filing choices. Later it reports 21 real changes from the new script, matching its earlier manual check." />
</figure>

I'd noticed some links in my list of Claude chats went to "not found" pages. Claude found the cause:
the script built every design chat's link the wrong way. It fixed the script and re-ran it.

The second line is the moment that matters. `git diff` had just shown 185 lines out and 185 in.
Instead of passing that on, Claude read both versions by id and told me exactly what had changed:
those 7 links, plus my own filing choices from the same day, and nothing else. No row was added or
dropped.

The last line is from later the same session, after the throwaway check became a script. Its first
run on the same change gave the same 21.

The output on that change, with the row details left out:

```text
208 rows before, 208 after
0 added, 0 removed, 21 changed
```

## Why it works

- **It answers the question you're asking.** After a re-run you want to know which records changed.
  A line diff answers a different question: which lines of text changed.
- **The count is a check.** If a fix should touch 7 rows and the diff says 21, you look at the other
  14 before you commit. Here they were my own changes, and good to commit. Another day they won't be.
- **It makes Claude's "only those rows changed" checkable.** Claude can say it in a reply, but now
  there's a command that proves it, and the rule makes Claude run it.

## Related

- [Claude Code Techniques](/craft/generative-ai/claude-code-techniques): the other pages in this set.
- [How I Use GenAI](/craft/generative-ai/my-genai-workflow/2025-09-30-how-i-use-genai): my wider
  workflow with AI tools.
- This page goes with a post in my "How I Used Claude Today" series on LinkedIn.
