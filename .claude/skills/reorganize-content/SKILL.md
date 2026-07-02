---
name: reorganize-content
description: The EXECUTION recipe for MOVING or SPLITTING existing /craft or /journey docs into a new home — the mechanical half that runs AFTER organize-post decides WHERE content belongs. Owns the drift-free move loop: git mv → rewrite the (instance-relative) slug → fix internal links → REPOINT + COLLAPSE existing redirect chains → add the {from,to} redirect(s) for the old public URLs → fold-not-delete when merging → regenerate assets → validate (redirects/hubs/structure/build). Encodes the gotchas that bite every time (the redirect-CHAIN trap, the /craft instance-prefix, slug collisions, empty-shell cleanup, generated files that self-heal). Use when the user says "move X to Y", "merge X into Y", "split this doc", "this belongs under Z", "move it up/down a level", or when a re-home leaves a 404 / a redirect chain. Pairs with organize-post (which CLASSIFIES — where should this go?), name-post (retitle after a kind change), review-reader-experience (which AUDITS the IA and flags mis-homed docs), and manage-hubs (moving a doc onto/between hubs).
---

# Reorganize content (execute a move / split / merge)

`organize-post` decides **where** a doc should live (durable vs temporal, which kind, a split plan).
This skill **executes** that decision without breaking a URL, losing a line, or leaving a redirect
chain. It is the mechanical loop we run every time a doc moves — and the loop has a handful of
gotchas that bite on *every* move if you skip them.

**The governing tenet (from CLAUDE.md): move/split, don't delete.** `git mv` to relocate; fold one
doc into another by MOVING its content across (never dropping it); split a big doc into several. The
before/after must never silently LOSE anything. **Removing a file is a SMELL** — only valid when its
every line went somewhere you can name (a true fold or a stub whose content all moved).

## When to reach for this

The user says any of: "move X to Y", "merge/fold X into Y", "split this into a pattern + a
technique", "this belongs under Z", "move it up/down a level", "these aren't <topic>-specific". Or a
re-home you already did now 404s / trips the redirect gate. If the user hasn't decided the target yet
("where should this go?"), run **`organize-post`** FIRST — this skill assumes the destination is known.

## The move loop (do these in order, every time)

### 1. `git mv` the file(s) to the new path
Use `git mv` so history + rename detection are preserved (the diff shows `R`, proving the body is
unchanged). Move a whole folder when the whole topic moves; move a single file when one doc moves.
NEVER hand-copy + delete (loses history, and a stray body edit hides in the noise).

### 2. Rewrite the `slug:` — it is INSTANCE-RELATIVE
A doc's `slug:` is relative to its instance root but is written absolute-with-leading-slash
(`/software-development/techniques/tool-composition` publishes at `/craft/software-development/…`).
Rewrite it to the NEW path. Keep it absolute (a relative slug bakes the old path into the URL and
404s silently). If the move also changes what the doc IS (e.g. `patterns` → `techniques`), update
`kind:` too (`pattern` → `technique`) and re-tag; then consider `name-post` for the title voice.

### 3. Fix internal links (in the moved doc AND to it)
- **In the moved doc:** rewrite any absolute in-repo link that pointed at the old location, and any
  `./sibling` RELATIVE link that no longer resolves. **Relative links resolve against the doc's SLUG,
  not its file path** — a README whose slug has no trailing "directory" segment (e.g.
  `/…/storybook-typescript-babel`) resolves `./setup-overview` as a *sibling* (`/…/setup-overview`),
  NOT a child. Use ABSOLUTE `/craft/…` links in a landing README that links to its own sub-pages.
- **To it from elsewhere:** `grep -rn "<old-slug>" docs/ src/` for other docs/components that link
  in. GENERATED files (`component-usage.json`, the hub `*-data.json`) self-heal on `generate-assets`
  — don't hand-edit them.

### 4. Redirects — the part that bites (repoint + collapse, then add)
Every published move needs a redirect so the old URL doesn't 404. But a naive "add `{from:old,
to:new}`" is NOT enough — the move usually turns OTHER redirects into **chains**:

- **REPOINT existing targets.** Any existing redirect whose `to:` pointed at the OLD URL now points
  at a redirect stub. Docusaurus does NOT follow chains (`a→b→c` lands on b's stub = a 404), so you
  must repoint every such `to:` DIRECTLY to the new URL. `grep -n 'to: "<old-url>"'
  docusaurus.config.js` finds them; there are often several layers (an old `/docs/*` redirect AND an
  even-older `/docs/techniques/*` or `/docs/craftsmanship/*` one both aimed at the old slug).
- **ADD the {from,to} for the old PUBLIC URLs.** For a doc that was live on prod, add
  `{from: <old /craft URL>, to: <new /craft URL>}` (and the `/docs/<old>` variant if one existed) so
  bookmarks survive.
- **The gate catches you.** The PostToolUse hook `.claude/hooks/validate-redirects-hook.sh` runs on
  any `docusaurus.config.js` edit and BLOCKS (exit 2) on a `redirect-to-chain` /
  `redirect-to-missing`. When it fires, it names the exact chain and the collapse target — do what it
  says (point the `from:` straight at the chain's END). It knows the `createRedirects` wildcard
  rewrites, so it catches chains through the programmatic `/blog/*`→`/initiatives/*` etc. too.
- Blocking a hook-check does NOT un-write the file edit that triggered it — the Edit already landed;
  just fix the newly-surfaced stale redirect and re-save.

### 5. Fold, don't delete (when MERGING two docs)
Merging X into Y = MOVE X's content into Y, then remove X's now-empty file + `_category_.json`, then
redirect X's URL → Y. **Prove the fold:** `grep` a distinctive phrase from X inside Y before you
delete X. Un-draft the merge target if it was `draft: true` and should now publish (`draft: false`).

### 6. Clean up empty shells — but only TRUE empties
After moving everything out of a topic folder, if it's left with ONLY a `_category_.json` (no docs,
no landing README) it renders as an empty sidebar section — remove it (`git rm` the `_category_.json`
+ `rmdir`). But if the folder still holds OTHER docs, LEAVE it. Check with
`find <folder> -type f` before removing.

### 7. Regenerate + validate + build
```
( cd bytesofpurpose-blog && npm run generate-assets )   # hub/usage JSON self-heal to the new URLs
make validate-redirects   # 0 chains/stubs — the move's whole risk
make validate-hubs        # if the move touched a hub-kind doc
make validate-structure   # absolute-slug + description health on the moved files
make validate-links       # (warn-tier) no new broken links from the move
make build                # the FINAL word: "Broken links" list must be empty
```
`make build` is the backstop the validators can't fully replace: it catches a relative-link that
resolves wrong (gotcha in step 3) which the redirect/structure checks don't see. New pages emit as
`build/<slug>.html` (NOT `<slug>/index.html`); old URLs become redirect stubs (an HTML file with
`http-equiv="refresh"`).

## Splitting one doc into several kinds

When `organize-post` says a doc is really N things (e.g. an idea + a technique + a principle):
1. Create the N new docs at their right homes (each its own `kind:` + absolute `slug:` + frontmatter).
2. MOVE each section's content across (don't retype — cut/paste so nothing drifts).
3. The original either becomes ONE of the N (keep it, reshape it) or is fully split (then it's a stub
   whose every line moved — remove it + redirect its URL to the most-central of the N).
4. Redirect + validate as above. Retitle each via `name-post` (a split usually changes each piece's
   nature, so its title voice must change too).

## Gotchas (each cost real time this session)

- **The redirect CHAIN is the #1 trap.** Moving a doc silently breaks every OTHER redirect that
  aimed at its old slug. Always `grep 'to: "<old>"'` and repoint BEFORE assuming you're done; the
  hook will otherwise block you one chain at a time.
- **The `/craft` instance prefix.** A craft doc's `slug:` is instance-relative; the published URL and
  every redirect `to:`/link must carry the `/craft` prefix. A redirect `to: "/software-development/…"`
  (missing `/craft`) is a `redirect-to-missing`.
- **Relative `./links` resolve against the SLUG, not the file.** See step 3 — use absolute links in a
  landing README.
- **Slug COLLISION on a move-up.** Moving `workspace/tips` → `tips` collides if a `tips.mdx` already
  owns `/software-development/tips`. Resolve BEFORE moving: fold into the existing page, or rename one.
- **Don't hand-edit generated files.** `component-usage.json` + hub `*-data.json` reference the moved
  URLs but are GENERATED (gitignored, hook-blocked); they self-heal on `generate-assets`.
- **Empty-shell vs still-populated.** Only remove a `_category_.json`-only folder; a folder with
  other docs stays.
- **`draft: true` targets can't be redirect targets.** The gate rejects a redirect `to:` a draft (it
  404s in prod). If you fold into a draft, un-draft it in the same change, or don't redirect yet.

## Verify the move end-to-end
- `make validate-redirects` clean (the move's core risk).
- `make build` with an EMPTY "Broken links" list.
- Spot-check: the new `build/<new-slug>.html` exists; the old `build/<old-slug>/index.html` (or
  `.html`) is a redirect stub (`grep http-equiv=refresh`).
- Then the standing workflow: commit to a branch → PR (with the redirect count + build evidence) →
  ask the user to merge.

## Files / gates this skill leans on (owned elsewhere)
`docusaurus.config.js` redirects + `scripts/validate-redirects.js` + `.claude/hooks/validate-redirects-hook.sh`
(the redirect gate — owned by the structure convention in CLAUDE.md); `scripts/validate-docs-structure.js`
(absolute-slug + the topic-folder contract — owned by `review-reader-experience`); `generate-hubs-data.js`
+ `manage-hubs` (when the move touches a hub). This skill is the RECIPE that ties them together for a move.
