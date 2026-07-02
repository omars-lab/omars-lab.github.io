# Plan: `import-noteplan` skill — migrate NotePlan Lists content into the blog (non-destructively)

## Context

Years of curated links, idea braindumps, quotes, and questions live in NotePlan under
`🏡 Personal/🏡📋 Lists` (32 files: ~500 markdown links + ~518 bare URLs). This content is trapped —
it never becomes blog posts. The user wants a **repeatable, idempotent pipeline** to bring it into the
Bytes of Purpose blog as real posts, with one hard constraint: **nothing is ever removed from the
NotePlan files.** Instead, migrating a link/section COPIES it out into a post and APPENDS a
"🔗 Migrated to Blog" table to the NotePlan file recording where it went (the blog URL). This mirrors the
repo's existing `import-co-design` / `import-reconstruction` skills (deterministic Node transformer +
SKILL.md + a worked proof) and the CLAUDE.md "move/split, don't delete" tenet, extended to an external
source. Outcome: a `import-noteplan` skill + transformer, proven end-to-end on one real file, that the
user drives file-by-file to graduate NotePlan content onto the blog.

## What I found (research grounding)

- **Target folder** (32 files) content clusters into shapes that map cleanly onto existing kinds
  (confirmed present in `bytesofpurpose-blog/scripts/lib/blog-kinds.json` — I MAP, don't invent):
  - **Reference link-lists** — `References[GenAI]` (83 links), `References[Software]` (71),
    `Playlist[🎥 Videos]` (62), `References[AWS]` (29), `Good Reads` (27), `Tools` (23), … Curated
    links with annotations → durable **`/craft`** reference docs or **`kind: reference`** posts.
  - **Idea braindumps** — `Ideas`, `Ideas[Software]`, `Ideas[Business]`. Each `# Idea:` / `# Blog:`
    heading is a distinct thought → **`/thoughts` `kind: idea`** (`board: ideas`), one post per idea.
    Several already carry `# Blog Post: …` / `#blogpost` — pre-marked candidates.
  - **Mindset** — `Quotes` → `kind: quote-set` 💬; `Questions` → `kind: question-set` ❓;
    `Insights` / `Tips` → `principle` 🪞 or durable `/craft`; `Playlist[💪🏻 Motivational]` → a
    quote/video post.
  - **Private / non-publishable** — `Shopping`, `Brag Sheet`, `Habits`, `Commands`, `iPhone`,
    `Activities*`, `References[Personal/Work Benefits/Services]`. **Denied by default.**
- **The auto-`description:` frontmatter line in these NotePlan files is junk** ("context: …") — the
  skill reads the BODY and ignores it.
- **Safety nets**: no file has a migration table yet (clean slate; the `## 🔗 Migrated to Blog` marker
  becomes the idempotency anchor, like `import-co-design`'s `source.id`). A NotePlan git backup exists
  at `$NOTEPLAN_GIT_DIR` as an extra recovery layer, but we still treat the notes as strictly append-only.
- **Emoji filenames** (`🏡📋 References[GenAI].md`) require absolute-path handling, no shell globbing.

## Decisions (confirmed with the user)

1. **The table records the true final blog URL.** Because the site's slugs are **absolute + deterministic**,
   the skill writes the real final URL (`https://blog.bytesofpurpose.com/<abs-slug>`) into the NotePlan
   table **as soon as the post is drafted** — even before deploy. The slug won't change, so the table
   never lies. The post stays `draft: true` until the user approves; publishing follows the normal
   `publish-site` / `deploy-site` flow.
2. **Propose → confirm per batch.** Per file, the skill: inventories → classifies each cluster via
   `organize-post`'s decision tree → proposes a destination MAP (link/section → post + kind + slug) →
   **shows it and waits for user confirmation** before writing anything to NotePlan or the blog.
3. **First deliverable = skill + transformer + one proof file.** Ship `SKILL.md` + the Node helper, and
   run it end-to-end on `References[Motivation]` (small: 2 links + a quote + a motivational video).

## Deliverables & critical files

### A. Skill dir — `.claude/skills/import-noteplan/`
- **`SKILL.md`** — models the format of `.claude/skills/import-co-design/SKILL.md`. Sections:
  - **Non-destructive contract** (headline): NotePlan files are append-only; migrating COPIES content
    out and APPENDS a provenance table — never cuts. Cross-links the CLAUDE.md move/split-don't-delete
    convention.
  - **Allow/deny list**: blog-eligible files (References-knowledge, Ideas*, Quotes, Questions, Insights,
    Tips, Playlists) vs private (Shopping, Brag Sheet, Habits, Commands, iPhone, Activities*,
    References[Personal/Services/Work Benefits]). **Deny is the default**; adding a file is explicit.
  - **The classify → map → confirm loop** — hands to `organize-post` (durable/temporal + kind call),
    `mature-content` (thin idea clusters), `groom-initiatives` (board an idea), `author-blog-post`
    (MDX/frontmatter), `link-glossary-terms` + `validate-links` (on the new post).
  - **The NotePlan migration-table format** (the append block, below).
  - **Idempotency** (skip links already in the table; update the row if a post's slug moved).
  - **Troubleshooting table** (per repo convention): bare-URL vs markdown-link, emoji-filename quoting,
    the junk auto-`description` line, the byte-identical verify failing on CRLF/trailing-newline drift.

### B. The Node transformer — `.claude/skills/import-noteplan/import-noteplan.js`
Deterministic, idempotent; does only the mechanical, SAFE parts (all judgment stays with the human/agent).
Never edits blog content itself. CLI:
- `--inventory <file>` → structured JSON of every link + bare URL, its enclosing section heading, its
  annotation, `[ ]`/`[x]` task-state, and whether it already appears in the migration table. This feeds
  the classify step. (Prove on `References[GenAI]`, the largest.)
- `--append-migration <file>` (records `{link, section, blogUrl, kind, date}`) → **append** (create if
  absent) the `## 🔗 Migrated to Blog` table. Pure append; asserts it never touches bytes above the
  marker; idempotent (dedup by link URL).
- `--verify <file>` → assert the pre-marker body is **byte-identical** to before the append. The
  fail-closed proof nothing was removed.
- Emoji-filename safe (absolute paths, no globbing).

### C. The NotePlan append block (written into the note; original lines stay put above it)
```markdown
## 🔗 Migrated to Blog
<!-- managed by import-noteplan; append-only; do not hand-edit above this line -->
| Link / Section | Migrated to (blog) | Kind | Date |
|---|---|---|---|
| [YOU OWE IT TO YOU 2026 — McConaughey](https://youtu.be/AJ1-WE1B2Ss) | https://blog.bytesofpurpose.com/mindset/... | quote-set | 2026-07-02 |
```

### D. Registration
- One row in the CLAUDE.md **Skills map (SDLC)** table so the skill is discoverable and owns this domain.

## Implementation steps (tracked as tasks)

1. **Scaffold** `.claude/skills/import-noteplan/` (SKILL.md + import-noteplan.js) + CLI shape.
2. **Build `--inventory`** (links + sections + task-state) and prove on `References[GenAI]`.
3. **Build `--append-migration` + `--verify`** with the byte-identical non-destructive guard.
4. **Write SKILL.md** — contract, allow/deny, classify→map→confirm loop, table format, idempotency,
   troubleshooting; cross-link the sibling skills and CLAUDE.md conventions.
5. **Worked proof on `References[Motivation]`**: inventory → propose map → (confirm) → draft post(s) as
   `draft: true` with deterministic absolute slug → `--append-migration` writes the table with the real
   final URL → `--verify` proves the original body byte-identical.
6. **Register** the skill row in CLAUDE.md.
7. **Verify + commit → PR** (feature branch, per the commit→PR→ask-to-merge convention). No deploy.

## Verification

- **Transformer**: run `node .claude/skills/import-noteplan/import-noteplan.js --inventory <file>` on
  `References[GenAI]` and confirm the link/section JSON is complete; run `--verify` after an
  `--append-migration` and confirm exit 0 (byte-identical body). Add a planted-mutation check: if the
  body above the marker changes, `--verify` exits non-zero.
- **New post**: `make validate-links` and `make validate-naming` pass on the drafted proof post;
  `make validate-seo` (file-scoped) clean.
- **Non-destructive proof**: show the NotePlan file's git diff (via `$NOTEPLAN_GIT_DIR` or a pre/post
  copy) is a pure append — zero deletions above the marker.
- **PR**: opened on a feature branch with the diff + verify evidence in the body; user merges. Posts stay
  `draft: true` (no deploy this pass).

## Explicitly NOT in this first pass

- The bulk 500+ link migration (follow-up batches driven BY this skill).
- Un-drafting / deploying the proof post (normal `publish-site` flow — user's call).
- Any private/denied files.
- Editing or removing ANY existing NotePlan content (the whole point; guarded by `--verify`).

## Open follow-ups (become tasks after this ships)

- A per-category batch plan (which Reference lists → which `/craft` topic).
- Whether each reference link-list becomes one `kind: reference` doc, or folds into an existing `/craft`
  topic README (an `organize-post` call per file).
