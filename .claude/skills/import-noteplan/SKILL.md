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
| `--append-migration <file> --records <json>` | Append (create if absent) the `## 🔗 Migrated to Blog` table with the given rows. Pure append; dedups by source URL / content (idempotent); self-guards non-destructive. Use `--dry-run` to preview. |
| `--rebuild-migration <file> --records <json>` | REPLACE the whole managed table from a fresh record list — use it to REPOINT rows when destinations change (a link now fans out to a different doc/section). Still non-destructive: only the block below the sentinel is rewritten; the body above it stays byte-exact. |
| `--verify <file> --baseline <pre-migration-copy>` | Assert the body above the marker is byte-identical to a pre-migration copy of the same file. Exit 0 safe / 1 destructive. |

A migration record is `{link, url, content, blogUrl, section, kind, date}`:
- **`url` + `link`** — a LINK migration: the source URL + its label. Rendered as `[link](url)` in the
  source cell.
- **`content`** (no `url`) — a NON-LINK migration (a tip, a note, a structured block): the moved TEXT
  itself, rendered as a **code span** in the source cell instead of a link. This is how prose/structure
  (e.g. the "what belongs in a CLAUDE.md" note) records WHAT was moved, not just that something was.
- **`blogUrl`** — the destination DOC.
- **`section`** (optional) — the destination doc's HEADING; the row deep-links to `blogUrl#anchor`
  (anchor derived from the heading, matching Docusaurus's slug), so the row points at the EXACT section
  the content became.

Dedup is by **source URL** (a link migrated once is never re-migrated, even to a new section) or by
**content key** for non-link rows (whitespace/case-insensitive). Records go via `--records '<json>'`
or `--records-file <path>`.

Run the bundled assertions any time you touch the transformer:
`node .claude/skills/import-noteplan/import-noteplan.test.js` (16 assertions, exits non-zero on failure).

## The migration URL: record the true FINAL blog URL, at draft time

Because the site's slugs are **absolute and deterministic** (every post carries a leading-slash
`slug:` that never changes — see the CLAUDE.md IA conventions), you know a post's final URL the moment
you decide its slug. So the table records the **real** `https://blog.bytesofpurpose.com/<abs-slug>` as
soon as the post is drafted — even before it's deployed. The URL is a fact, not a promise; the post
just carries `draft: true` until the user approves and runs the normal `publish-site` / `deploy-site`
flow. Never write a placeholder or a "TBD" URL into the NotePlan table.

The table records the destination as a **deep link to the exact section** (`…/reading-list#llm-architecture`),
not just the doc, via the record's `section` field. So a half-migrated file shows precisely what landed
where.

## Fan-out: one source file → MANY destination docs (by nature)

A single NotePlan file is rarely one thing. `References[GenAI]` held reference articles AND conference
talks AND creative tools AND a "what belongs in a CLAUDE.md" tip. **Do not force a whole file into one
doc.** Route each item to the doc that fits its NATURE, and record the true destination per row:

- **articles / papers / blog posts** → a **`reading-list`** doc (🔖).
- **talks / long videos** (YouTube, conference recordings) → a **"Good Watches"** `reading-list` doc —
  a reader picks a watch by mood + time, which is a different job from a reading list.
- **tools / apps / libraries** → a **tools** `reading-list` doc (or `docs/craft/productivity/tool-usage`).
- **tips / rules of thumb** (the CLAUDE.md note) → a **`tips`** doc (📌) at the right topic level (e.g.
  `docs/craft/software-development/tips.mdx`).

The migration table is the ledger that makes fan-out honest: every source item gets a row pointing at
its OWN destination doc + section, so nothing is silently lumped or lost. When you discover a file fans
out, propose the full destination map (which cluster → which doc) and confirm before drafting.

## Enrich, don't dump: quote cards + non-link content

Migrating is an UPGRADE, not a copy (same spirit as `import-co-design`). Two enrichments matter:

- **Quote-worthy blockquotes → cards.** When a source link carries a genuine editorial insight (a `>`
  blockquote with real commentary — "the takeaway most people miss is…"), render it as an
  **`<EditorialQuote>`** card inside a `<QuoteSet>` (globally registered, works in docs too): the pull
  line in the body, the insight as `reflection=`, the author as `source=`. Put the source LINK as a
  plain markdown line after the card — **`cite=` renders as plain text**, so a link inside it is NOT
  clickable (a real bug that bit; see Troubleshooting).
- **Non-link content → a content-cell row.** Some migrated items are not links at all (a tip, a
  structured note). Those become a `content` record (no `url`) — the table shows the moved text as a
  **code span** in the source cell, so the note still records exactly WHAT was taken.

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
2. **Classify each cluster + plan the FAN-OUT.** Walk `organize-post`'s decision tree (durable vs
   temporal → acted-on vs → which kind), and route each cluster to the doc that fits its NATURE (see
   "Fan-out" above): articles → a `reading-list`, talks → a Good Watches doc, tools → a tools doc,
   tips → a `tips` doc, ideas → `/thoughts`, quotes → `quote-set`. SPLIT a mixed file across docs —
   never force it into one.
3. **Propose the destination MAP and CONFIRM with the user.** Show, per link/section: its destination
   doc (title + absolute slug), its `kind:`, the section it lands in, and the final deep-link URL. Do
   NOT write anything — NotePlan or blog — until the user confirms the map. (The "propose → confirm per
   batch" contract.)
4. **Draft the post(s), enriching as you go.** Create each doc as `draft: true` with its absolute slug,
   via `author-blog-post`. Turn quote-worthy blockquotes into `<EditorialQuote>` cards (see "Enrich");
   thin idea clusters → `mature-content` first; a board-ready idea → `groom-initiatives`;
   `link-glossary-terms` + `validate-links` on the new post.
5. **Append (or rebuild) the migration table.** `--append-migration "<file>" --records-file <path>`
   with the real deep-link destinations (`blogUrl` + `section`) and any non-link `content` rows. Use
   `--rebuild-migration` instead when repointing rows whose destination changed (e.g. a link now fans
   out elsewhere). `--dry-run` first to eyeball it.
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
| A quote card's source link shows as literal `[text](url)` | `<EditorialQuote cite=…>` renders `cite` as PLAIN TEXT, not markdown. Put the source link as a plain markdown line AFTER the card, and use `cite` only for prose attribution ("via Ryan Holiday"). |
| Adding a new kind (reading-list / tips / …) fails `validate-post-outline` | Add the kind to `blog-kinds.json` (unique emoji — check for collisions), a matching CHECKS entry in `validate-post-outline.js` if it has a NEW outline id, AND a row in the `docs/handbook/README.mdx` legend table (the legend-drift check enforces it). |
| A migrated link needs to move to a different doc later | Rebuild, don't re-append: `--rebuild-migration` with the corrected records replaces the whole table (repointing the row) while keeping the body above the sentinel byte-exact. |

## Files

- `import-noteplan.js` — the transformer (source of truth for the mechanics).
- `import-noteplan.test.js` — bundled assertions (`node …test.js`).
- `../../hooks/noteplan-no-drop-hook.sh` — the PostToolUse guard (registered in `.claude/settings.json`).

## Pairs with

`organize-post` (the classifier / decision tree), `mature-content` (firm up a thin idea before it's a
post), `groom-initiatives` (board an idea as an `/initiatives` card), `author-blog-post`
(frontmatter + MDX), `name-post` (title voice), `link-glossary-terms` + `validate-links` (post
hygiene), `publish-site` / `deploy-site` (un-draft + ship, the user's call).
