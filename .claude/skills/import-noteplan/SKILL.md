---
name: import-noteplan
description: Migrate content out of NotePlan's `🏡 Personal/🏡📋 Lists` folder onto the Bytes of Purpose blog — WITHOUT ever removing anything from the NotePlan files. Migrating a link/section COPIES it into a real blog post and APPENDS a "🔗 Migrated to Blog" provenance table to the NotePlan file recording the destination URL; it never cuts existing lines. Runs a deterministic, idempotent Node transformer (`import-noteplan.js`: --inventory / --append-migration / --verify / --snapshot / --audit) whose non-destructive contract is proven byte-for-byte and guarded fail-closed by the `noteplan-no-drop-hook.sh` PostToolUse hook. Tracks one task PER FILE being migrated. Classifies each cluster via the site content model (hands to organize-post), drafts posts (author-blog-post), and records the true final blog URL as soon as the post is drafted (slugs are absolute + deterministic). TRIGGERS on "migrate/import from NotePlan", "bring my NotePlan lists/ideas/quotes onto the blog", "move these notes into posts". Pairs with organize-post (classify), mature-content (firm up thin ideas), groom-initiatives (board an idea), author-blog-post (MDX/frontmatter), link-glossary-terms + validate-links (on the new post).
---

# Import NotePlan Lists content onto the blog (non-destructively)

You keep years of curated links, idea braindumps, quotes, and questions in NotePlan under
`🏡 Personal/🏡📋 Lists`. This skill graduates that content onto the blog as real posts — with
one hard, non-negotiable rule.

## The headline rule: NotePlan files are APPEND-ONLY

**Migrating COPIES content out and APPENDS a provenance table. It never removes a single line the
user wrote.** The original note keeps every link, every annotation, every checkbox. Below the user's
content we append a `## 🔗 Migrated to Blog` table that records, for each migrated link/section,
WHERE it went on the blog. This is the same "move/split, don't delete" tenet the repo applies to its
own files (see the CLAUDE.md operating conventions), extended to an external source that happens to
live outside the repo.

This is enforced three ways (fail-closed, belt-and-suspenders):

1. **The transformer refuses to write a destructive change.** `import-noteplan.js` computes the new
   file content as `original-bytes + appended-block`, and `assertNonDestructive()` throws BEFORE any
   write unless the original body is preserved **byte-for-byte** (the original file is always an exact
   PREFIX of the migrated file).
2. **A per-file `--verify`** compares the post-migration file against a pre-migration copy and asserts
   the body above the marker is byte-identical (exit 1 if not).
3. **A corpus-level `--snapshot`/`--audit` no-drop guard**, run automatically by the
   `noteplan-no-drop-hook.sh` PostToolUse hook: it tallies every link + content line of every Lists
   file into a session baseline, and BLOCKS (exit 2) any later edit that drops something the baseline
   had — whether the edit came from this tool, from the Edit tool, or by hand.

If any of the three trips, STOP and restore what was removed. A migration that loses content is a bug,
not a migration.

## The transformer — `import-noteplan.js`

Deterministic, idempotent, and it does ONLY the mechanical, safe parts. All judgment (what a link IS,
where it belongs, its kind) stays with you. It never edits blog content.

| Subcommand | What it does |
|---|---|
| `--inventory <file>` | Parse a NotePlan file → JSON of every link (markdown + bare URL), its enclosing section-path (`A › B › C`), its annotation, `[ ]`/`[x]` task-state, line number, and whether it's already in the migration table. This feeds the classify step. |
| `--snapshot <folder> --out <manifest.json>` | Tally every link + non-blank content line of every `.md` in the folder (above the marker) into a baseline manifest. Run ONCE at the start of a migration session. |
| `--audit <folder> --baseline <manifest.json>` | Re-tally and assert nothing in the baseline is missing now (content may only grow). Exit 2 + a per-item report if any link/line was dropped. |
| `--append-migration <file> --records <json>` | Append (create if absent) the `## 🔗 Migrated to Blog` table with the given rows. Pure append; dedups by source URL AND blog URL (idempotent); self-guards non-destructive. Use `--dry-run` to preview. |
| `--verify <file> --baseline <pre-migration-copy>` | Assert the body above the marker is byte-identical to a pre-migration copy of the same file. Exit 0 safe / 1 destructive. |

A migration record is `{link, url, blogUrl, kind, date}` (`url` = the source link, omit for a
whole-section row; `blogUrl` = the destination). Records go via `--records '<json-array>'` or
`--records-file <path>`.

Run the bundled assertions any time you touch the transformer:
`node .claude/skills/import-noteplan/import-noteplan.test.js` (8 assertions, exits non-zero on failure).

## The migration URL: record the true FINAL blog URL, at draft time

Because the site's slugs are **absolute and deterministic** (every post carries a leading-slash
`slug:` that never changes — see the CLAUDE.md IA conventions), you know a post's final URL the moment
you decide its slug. So the table records the **real** `https://blog.bytesofpurpose.com/<abs-slug>` as
soon as the post is drafted — even before it's deployed. The URL is a fact, not a promise; the post
just carries `draft: true` until the user approves and runs the normal `publish-site` / `deploy-site`
flow. Never write a placeholder or a "TBD" URL into the NotePlan table.

## Allow / deny — which Lists files are blog-eligible

**Deny is the default.** A file is migrated only if it's on the allow list; adding one is an explicit
decision (and if you add a new eligible file, note it here).

**Blog-eligible** (public, return-to knowledge or shareable thoughts):
- `References[GenAI / Software / AWS / Tools / Good Reads / Business / Career / Leadership / Entertainment]`,
  `References` (root) — curated link-lists → durable `/craft` reference docs or `kind: reference` posts.
- `Ideas`, `Ideas[Software]`, `Ideas[Business]` — each `# Idea:` / `# Blog:` heading is a distinct
  thought → a `/thoughts` `kind: idea` post (often `board: ideas`).
- `Quotes` → `kind: quote-set`; `Questions` → `kind: question-set`; `Insights` / `Tips` →
  `kind: principle` (or distill up to durable `/craft`); `Playlist[🎥 Videos / 🎼 Audio / 💪🏻 Motivational]`
  → quote/video posts.
- `Snippets`, `Commands` — reusable how-to → `kind: reference` or a `/craft` techniques doc (judgment).

**Denied by default** (private, personal, not blog material):
`Shopping`, `Brag Sheet`, `Habits`, `iPhone`, `Activities`, `Activities[Austin]`, `Reflections[Growth]`,
`References[Personal / Work Benefits / Services]`. Do NOT migrate these unless the user explicitly asks
and confirms the specific content is shareable.

> Note: the `description:` frontmatter line in these NotePlan files is an auto-generated junk summary
> ("context: …"). Ignore it — read the BODY.

## The loop: snapshot → per-file task → classify → propose map → confirm → draft → append → verify

Migrate one file at a time. **Track one task per file** (the user asked for this explicitly): before
touching a file, `TaskCreate` a task like *"Migrate NotePlan `References[GenAI]` → blog"* and mark it
`in_progress`; complete it only after that file's posts are drafted, its table is appended, and
`--verify` passes. The task list should read as the set of files in flight.

0. **Snapshot the corpus once.** `--snapshot "<Lists dir>" --out <session-baseline.json>` and set
   `NOTEPLAN_BASELINE` to that path so the no-drop hook audits against it. (If you skip this, the hook
   self-baselines on the first edit — but an explicit snapshot is the honest starting line.)
1. **Inventory the file.** `--inventory "<file>"` → the link/section JSON.
2. **Classify each cluster.** Walk `organize-post`'s decision tree (durable vs temporal → acted-on vs
   not → which kind). A section of curated links is usually durable `/craft`/`reference`; an
   `# Idea:` heading is a `/thoughts` idea; a quote block is `quote-set`; a question block is
   `question-set`. SPLIT a mixed file into one post per coherent kind — never force.
3. **Propose the destination MAP and CONFIRM with the user.** Show, per link/section: its destination
   post (title + absolute slug), its `kind:`, and the final blog URL. Do NOT write anything —
   NotePlan or blog — until the user confirms the map. (This is the "propose → confirm per batch"
   contract.)
4. **Draft the post(s).** Create the blog post(s) as `draft: true` with the confirmed absolute slug,
   via `author-blog-post` (frontmatter + MDX pitfalls). Thin idea clusters → `mature-content` first;
   a board-ready idea → `groom-initiatives`; link a defined term once → `link-glossary-terms`; then
   `validate-links` on the new post.
5. **Append the migration table.** `--append-migration "<file>" --records '<rows>'` with the real
   final blog URLs. (`--dry-run` first if you want to eyeball the table.)
6. **Verify non-destructive.** Copy the pre-migration file aside first (or use the git backup at
   `$NOTEPLAN_GIT_DIR`), then `--verify "<file>" --baseline <copy>` → must exit 0. Also re-run
   `--audit` against the session baseline → exit 0.
7. **Complete the file's task**, and move to the next file (new task).

## The append block (what lands in the NotePlan file)

The original content stays exactly where it was; this is appended below it:

```markdown
<!-- import-noteplan:begin — managed, append-only; do not hand-edit below -->
## 🔗 Migrated to Blog

| Link / Section | Migrated to (blog) | Kind | Date |
|---|---|---|---|
| [YOU OWE IT TO YOU 2026 - McConaughey](https://youtu.be/AJ1-WE1B2Ss) | https://blog.bytesofpurpose.com/mindset/... | quote-set | 2026-07-02 |
```

The `<!-- import-noteplan:begin … -->` sentinel is the boundary the transformer uses to tell "user's
original content" (above) from "managed table" (below) byte-exactly. Never hand-edit below it; re-run
`--append-migration` to add rows.

## Idempotency

Re-running a migration is safe. `--append-migration` dedups by both the source link URL and the blog
URL, so a link already in the table is skipped (adds 0 rows). `--inventory` flags each link's
`alreadyMigrated`. If a post's slug legitimately MOVES later, update the table row by hand below the
sentinel (or extend the transformer with a `--repoint` step) and pair the move with a `{from,to}`
redirect on the blog per the CLAUDE.md redirect convention.

## Troubleshooting

| Symptom | Cause → Fix |
|---|---|
| `noteplan-no-drop-hook.sh` blocks with "content DROPPED" | An edit removed a link/line above the marker. Restore the exact removed text; migration only APPENDS. Re-run the edit so it adds only a table row. |
| `--verify` fails "DESTRUCTIVE CHANGE … first at line N" | The body above the marker changed. Diff the file against the pre-migration copy / `$NOTEPLAN_GIT_DIR` backup and restore line N. |
| `assertNonDestructive` throws "REFUSING TO WRITE" | A transformer bug computed a body-altering append; nothing was written. Do NOT force it — fix the transformer (this should be impossible via the normal path). |
| Emoji filename errors in the shell | Always pass the ABSOLUTE path in quotes (`"$LISTS/🏡📋 References[GenAI].md"`); never rely on globbing over emoji names. |
| The `description:` frontmatter is gibberish | It's NotePlan's auto-summary. Ignore it; read the body. Do not copy it into the blog post's `description`. |
| `--inventory` misses a link | It's likely a NotePlan `noteplan://` / `vscode://` / `x-callback` link, not an `http(s)` URL. Those are app-local and usually NOT migrated (they don't resolve for a reader); if one should be, record it as a section row (no `url`). |
| Audit reports a "line" drop that's just reflow | The guard tallies trimmed non-blank lines; genuinely re-wrapping a line changes it. If the content is truly preserved (just reformatted), re-snapshot the baseline deliberately — but confirm nothing was actually lost first. |

## Files

- `import-noteplan.js` — the transformer (source of truth for the mechanics).
- `import-noteplan.test.js` — bundled assertions (`node …test.js`).
- `../../hooks/noteplan-no-drop-hook.sh` — the PostToolUse guard (registered in `.claude/settings.json`).

## Pairs with

`organize-post` (the classifier / decision tree), `mature-content` (firm up a thin idea before it's a
post), `groom-initiatives` (board an idea as an `/initiatives` card), `author-blog-post`
(frontmatter + MDX), `name-post` (title voice), `link-glossary-terms` + `validate-links` (post
hygiene), `publish-site` / `deploy-site` (un-draft + ship, the user's call).
