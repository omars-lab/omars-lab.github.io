---
name: transform-noteplan-links
description: Turn a raw `noteplan://x-callback-url` link into a first-class <NotePlanButton>, and validate that every NotePlan link resolves to a REAL note in the local NotePlan store. Owns the NotePlan x-callback-url scheme (openNote by noteTitle / by filename, the #heading suffix, URL-encoding of emoji + spaces + the literal #), the <NotePlanButton> component API (note / heading / filename / label / url props → the built link + an on-brand "Open in NotePlan" button that is honest it opens the AUTHOR's local app), and the validate-noteplan-links.js gate + its hook (resolves each link's target to a file under ~/Library/Containers/co.noteplan.NotePlan3/… — a note whose first `#` heading matches, or a filename/path — and ERRORs on a missing note; LOCAL-ONLY, so off-machine/CI it checks syntax only and passes). Use when the user pastes a noteplan:// link, asks to "make my NotePlan links buttons / validate my noteplan links / turn this into a NotePlan button", or a NotePlan button's note got renamed/deleted. Pairs with modify-blog-ui-component / author-post (the MDX side), validate-links (the sibling link gate).
---

# Transform NotePlan links

The blog references notes in the author's **local NotePlan app** via `noteplan://x-callback-url`
links. This skill makes each one a first-class **`<NotePlanButton>`** and keeps them honest: a
validator confirms the referenced note actually EXISTS on disk, so a renamed/deleted backlog note
never leaves a dead button. The links only work on the author's machine (they launch NotePlan with
his data), and the button says so.

## The x-callback-url scheme (what the links mean)

Source: help.noteplan.co/article/49 (X-Callback-Url Scheme). The ones the blog uses:

- **`openNote?noteTitle=<title>`** — open a note by its TITLE (a note's title is its first `# `
  heading). Append **`#<heading>`** for a subheading: `noteTitle=Fleeting Notes#Second Brain`.
- **`openNote?filename=<folder/note.txt>`** — open a note by its RELATIVE path (including folders).
  Calendar notes are dated files (`20250215`), stored under `Calendar/` (the `.txt` in a link may be
  `.md` on disk).
- **`addText?noteTitle=<t>&text=<t>&mode=append`** — a different ACTION (appends text). This is an
  automation example, NOT a "go read my note" link — leave it as a `code span`, don't make it a button.

Titles, headings, and paths are **URL-encoded**: emoji (`%F0%9F%93%9D`), spaces (`%20`), and the
literal `#` (`%23`). The `<NotePlanButton>` builds + encodes the URL for you, so author with the
DECODED, human-readable title.

## The `<NotePlanButton>` component

`src/components/NotePlanButton` (registered in `src/theme/MDXComponents.tsx`, so usable in any
`.mdx` without an import). Props:

- **`note`** — the note's title (its first `# ` heading), decoded/human-readable:
  `note="⚙️ Automation Backlog"`.
- **`heading`** — a subheading within the note (appended as `#<heading>`, encoded).
- **`filename`** — OR identify by relative path: `filename="20250215.txt"` / `filename="Folder/Note.md"`.
- **`label`** — the visible text (defaults to the note title / filename). Use it for a natural phrase
  ("my blogging backlog").
- **`url`** — a full `noteplan://…` link used verbatim (escape hatch; skips the builder).

It renders an on-brand mint chip ("🗒️ OPEN IN NOTEPLAN / <title>") with a tooltip "Opens this note in
my local NotePlan app" — honest that it's the author's local store. Styling uses the design-system
tokens (mint pastel + `--tea-ink`, `--radius-md`, `--lift-subtle` on hover); see
`implement-with-design-system`.

**To convert a bare link:** decode its `noteTitle`/`filename`, then write the button:
```
raw:  noteplan://x-callback-url/openNote?noteTitle=%E2%9A%99%EF%B8%8F%20Automation%20Backlog%23%E2%9A%99%EF%B8%8F%20Automation%20Backlog
→     <NotePlanButton note="⚙️ Automation Backlog" heading="⚙️ Automation Backlog" />
```
(These backlog links repeat the title after `#` as a heading anchor — keep both.)

## The validator + hook (does the note EXIST?)

`scripts/validate-noteplan-links.js` (`make validate-noteplan-links`) + the warn-tier PostToolUse
hook `.claude/hooks/validate-noteplan-links-hook.sh` (fires on a `.md`/`.mdx` edit that contains a
noteplan reference). It:

1. Collects every `<NotePlanButton>` (and any leftover bare `noteplan://`) in `docs/`/`blog/`/`designs/`.
2. Builds an index of the local NotePlan store: for each note file under
   `~/Library/Containers/co.noteplan.NotePlan3/Data/Library/Application Support/co.noteplan.NotePlan3/Notes/`
   (skipping `@Archive`/`@Trash`/`@Templates`), maps its **first `# ` heading → file** and its
   **filename stem → file**. Calendar notes resolve under `Calendar/`.
3. Resolves each link: a `note` must match a first-heading title (or a `<title>.md/.txt` filename); a
   `filename` must exist under `Notes/` or `Calendar/` (stem + either extension). A missing note is
   ERROR (exit 2). A leftover bare `openNote` link (not wrapped in a button) is flagged.

**LOCAL-ONLY, fail-open off-machine.** The NotePlan store only exists on the author's Mac. If the dir
is absent (CI, another machine), the validator checks link SYNTAX only and passes (exit 0) — a
note-existence check off-machine is impossible, not a failure. So the hook never blocks in CI; run
`make validate-noteplan-links` locally to actually verify a note resolves. It's fast (one index pass,
~0.4s over ~950 notes).

## Gotchas

- **Author the DECODED title.** Write `note="⚙️ Automation Backlog"`, not the `%E2%9A…` encoding —
  the component encodes it. A hand-encoded value double-encodes.
- **Emoji with ZWJ** (e.g. `👨🏻‍🏫`) encode to a long `%F0…%E2%80%8D%F0…` sequence; still just paste
  the real emoji into `note`.
- **`addText`/non-openNote actions aren't note references** — they're automation examples. Keep them
  as a `code span`; the validator won't demand they resolve to a note.
- **The `.txt` vs `.md` mismatch:** a link may say `filename=20250215.txt` while the file on disk is
  `20250215.md`. The validator matches the STEM + either extension, so both resolve.
- **Renamed a backlog note?** The button breaks silently in the app but the validator catches it
  (on-machine): update the `note=` title to the new first-heading.

## Verify
- `make validate-noteplan-links` (on the author's machine) — every link resolves to a real note.
- `make build` — the `<NotePlanButton>` compiles + ships (it renders client-side; it's in the JS
  bundle, so a curl of the static HTML won't show it — check the built page in a browser).
- Eyeball a page with a button (a draft habit backlog on `:3000`): the mint "Open in NotePlan" chip
  with the note title + the local-app tooltip.

## Files this skill owns
`src/components/NotePlanButton/**` (+ its `MDXComponents.tsx` registration),
`scripts/validate-noteplan-links.js` + `.claude/hooks/validate-noteplan-links-hook.sh` +
`make validate-noteplan-links`, and the `noteplan://` links across `docs/`/`blog/`. Pairs with
`modify-blog-ui-component` (if the button graduates to the shared blog-ui package),
`author-post` (MDX authoring), `implement-with-design-system` (the on-brand chip),
`validate-links` (the sibling link gate).
