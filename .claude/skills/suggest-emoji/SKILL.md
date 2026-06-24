---
name: suggest-emoji
description: Pick and record a leading sidebar emoji for a docs folder, then stamp it onto the folder's leaf docs (and _category_.json). Use when the docs-structure hook or validate-docs-structure.js flags a NON-STANDARD folder ("run /suggest-emoji <folder>"), when backfilling emoji-prefix-doc warnings, or when a new docs folder needs a sidebar emoji that isn't covered by the kind-map. Resolves standard folders automatically (kind/root); for non-standard ones it proposes options via AskUserQuestion and learns the choice into emoji-map.json so siblings stay consistent.
---

# Suggest emoji (sidebar-emoji convention)

Every sidebar entry on this site leads with **one emoji** so the sidebar scans
visually (the convention + prose map live at `/definitions/emojis-for-activities`;
the design rationale is `designs/2026-06-03-sidebar-emoji-system.mdx`). This skill is
the **interactive half** of the self-maintaining emoji system: it decides the emoji for
a folder and applies it. The deterministic half (file mutation) is
`bytesofpurpose-blog/scripts/apply-folder-emoji.js`; the source of truth is
`bytesofpurpose-blog/scripts/lib/emoji-map.json`.

> **This skill is DOCS-only. Blog posts use a SEPARATE emoji system — don't conflate them.**
> A docs sidebar emoji is chosen per FOLDER by content/kind and stamped onto the leaf docs
> (this skill, `emoji-map.json`). A **blog** post's Posts-sidebar emoji is instead
> auto-derived from its frontmatter **`kind:`** (question-set/framework/reflection/… → emoji),
> mapped in `bytesofpurpose-blog/scripts/lib/blog-kind-emoji.json`, and prepended by the
> `draft-docs` plugin — authors never type it and this skill never touches `blog/`. To add or
> change a blog emoji, set `kind:` (see `author-blog-post`, "Blog post `kind:` + the
> sidebar"), not this script.

## When this runs

- The `validate-docs-structure-hook.sh` PostToolUse advisory or
  `make validate-structure` says a folder is **NON-STANDARD — run `/suggest-emoji <folder>`**.
- You're backfilling `emoji-prefix-doc` warnings.
- A new docs folder needs a sidebar emoji.

`<folder>` is a path relative to `docs/`, instance included
(e.g. `craft/blogging/embed-diagrams`).

## The decision: standard vs non-standard folder

Resolution is config-driven (`scripts/lib/emoji-map.js`). Check first:

```
cd bytesofpurpose-blog
node -e 'const{resolveFolderEmoji}=require("./scripts/lib/emoji-map.js");console.log(resolveFolderEmoji(process.argv[1])||"(non-standard)")' <folder>
```

- **Standard** (kind-map / learned override / topic root resolves) → an emoji prints.
  No question needed: apply it directly (do NOT pass `--learn` — it's already known).
- **Non-standard** (`(non-standard)`) → there's no convention yet. **Ask the user**
  with AskUserQuestion (see below), then apply WITH `--learn` so the folder becomes
  known for next time.

The kind-map (siblings share one emoji): 🔬 research · 🔨 projects · 🛠️ techniques/tools/skills ·
🔧 tinkering · 💬 prompts · 📖 terminology · 🧠 mental-models · 🧪 evals · 🚀 initiatives ·
🤖 automation · ⚙️ automations · 📱 apps.

## Workflow

### 1. Resolve the folder
Run the resolver (above). If standard, skip to step 3 (no `--learn`).

### 2. Non-standard → propose with AskUserQuestion
Read the folder's docs to understand the content, then call **AskUserQuestion** with a
single question ("Which emoji should the `<folder>` sidebar section lead with?") and
**2–4 candidate emojis** chosen to FIT the folder's content and stay distinct from
sibling folders under the same topic. Put your recommendation first, labelled
"(Recommended)". Example candidates for a diagramming folder: 📊 · 🗺️ · 📈. Let the
user's free-text "Other" override stand.

A folder gets **one default emoji**. If the user wants a specific leaf doc to differ
(a clearly-distinct topic — e.g. a Docker doc → 🐳 inside an otherwise 🛠️ folder),
collect those as per-doc overrides (offer this only if it naturally comes up; don't
over-ask).

### 3. Apply (preview first)
Always dry-run, show the user the file list, then apply for real:

```
cd bytesofpurpose-blog
# preview
node scripts/apply-folder-emoji.js <folder> <emoji> [--learn] --dry-run \
  [--override <docPathRelToDocs>=<emoji> ...]
# apply
node scripts/apply-folder-emoji.js <folder> <emoji> [--learn] \
  [--override <docPathRelToDocs>=<emoji> ...]
```

- `--learn` ONLY for non-standard folders (persists `<folder> -> <emoji>` into
  `emoji-map.json` `folders`). Standard folders are already resolved — omit it.
- The script stamps the emoji onto BOTH `title:` and `sidebar_label:` (per the repo
  decision), includes the folder's `_category_.json`, is **idempotent** (skips labels
  that already lead with an emoji), and is **non-recursive** (each subfolder is its own
  folder with its own emoji — run the skill per folder).

### 4. Verify
```
node scripts/validate-docs-structure.js --emoji 2>&1 | grep '<folder>' || echo "folder clean ✓"
node scripts/validate-docs-structure.js --error-only >/dev/null; echo "error-only exit=$?"  # must be 0
```

## Gotchas

- **MDX frontmatter safety.** The apply script edits only the YAML frontmatter block and
  preserves quoting, so it won't introduce the repo's MDX build-breakers (bare `<br>`,
  unescaped `{word}`). It never touches the doc body.
- **The em-dash hook** blocks edits leaving a literal `—` in user-facing content. Emoji
  stamping doesn't add em-dashes, but if a label you're editing already contains one,
  resolve it per that hook's prompt.
- **Keep the three in lockstep** (the repo tenet): if you add a recurring KIND (not just
  one folder), add it to `emoji-map.json` `kinds`, mention it in the prose doc
  `docs/craft/productivity/terminology/emojis.mdx`, and note it in the design doc. A
  one-off folder only needs the `folders` entry (`--learn` handles that).
- **Don't commit** unless asked. When you do, commit only the docs you stamped +
  `emoji-map.json` (if learned) — not unrelated working-tree changes.
