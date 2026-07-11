---
name: review-reader-experience
description: Audit the Bytes of Purpose site through a READER's eyes (not the writer's) — sidebar/navbar labels that are long or jargony, page layouts that confuse or present buttons readers ignore, writer-focused content voice, and the file/folder information architecture (over-deep nesting, orphan/overstuffed categories, mis-homed or buried docs, re-org proposals). Produces a prioritized report of issues + concrete fixes. Use when asked "is this reader-friendly?", to clean up menu labels, to review a page's UX/reading path, to de-jargon content, or to evaluate/restructure how docs are organized.
---

# Review reader experience

The site is authored by a builder, so it drifts toward **writer-focused** framing:
SEO-maximized titles, internal taxonomy words as menu labels, intros that narrate
the author's process, and UI affordances aimed at the author (debug menus, builder
nav) rather than the reader. This skill audits the site from the **reader's** point
of view and emits a **prioritized report** — it does not silently auto-edit.

Pairs with: `author-post` (content rules + MDX pitfalls, AND the topic-folder contract this skill
audits against — `homes/craft.md`), `reorganize-content` (the drift-free move loop for an IA fix),
`validate-links` (link hygiene), `publish-site` (draft triage). Apply fixes through those skills'
conventions.

## The reader's lens (the one rule)

For every label, region, and intro ask: **"Does this serve someone who has never
seen the site, or does it serve the person who built it?"** Writer-focused artifacts
optimize for completeness, SEO, and the author's mental taxonomy. Reader-focused
ones optimize for *scanning, orientation, and the next click*.

**Corollary — fewer, simpler, more impactful words win.** Especially for the things a
reader scans first (CTAs, card titles, nav labels, hero copy, section intros): cut to
the shortest phrasing that still lands. A two-line CTA title that wraps, a body
paragraph where a 4-word line would do, "Observe what I discovered about myself" where
"Discover My Journey" says it — these are writer-voice tells. Prefer punchy parallel
phrasing (e.g. paired CTAs that mirror each other: "Discover My Craft" / "Discover My
Journey" — separating *what I impact* from *who I am*). When you trim, keep the one
distinct idea per element; don't merge two cards' meanings into vague mush. If a label
or CTA spans more than a short line, that's a flag — propose the tighter version.

### The em-dash tell (enforced by a hook)

A literal **em-dash (`—`)** in reader-facing copy is a strong AI-voice signal — human
blog writing rarely reaches for it. So on this site, an em-dash in **user-facing content**
is treated as a flag to STOP and rephrase deliberately, never to ship silently. This is
enforced, not just advised: the **`em-dash-voice-hook.sh`** PostToolUse `Write|Edit` hook
(registered in `.claude/settings.json`) **blocks** (exit 2) when an em-dash appears in:

- prose `*.md`/`*.mdx` under `bytesofpurpose-blog/{docs,blog,designs,changelog}/`,
- any `*.html` (all user-facing),
- user-facing **strings** in `bytesofpurpose-blog/src/**.{tsx,jsx}` (JSX text / quoted
  literals — NOT `//` or `/* */` comments).

Code, config, CSS, skills, plans, and `CLAUDE.md` are out of scope (em-dashes there aren't
reader-facing — this skill file uses them freely). Only U+2014 `—` is flagged; the en-dash
(`–`) and hyphen (`-`) are fine. When the hook fires, the required response is to **ask the
user** (AskUserQuestion) how to handle each occurrence — replace with a comma · a colon ·
split into two sentences · parentheses · keep as-is — then apply their choice. Don't
auto-rewrite; the human decides whether each dash stays.

**The `--` bypass is the SAME anti-pattern (also blocked).** Swapping a forbidden `—` for
`--` (double hyphen) does not fix the AI-voice tell — it dodges the hook while still reading
as the same em-dash cadence (and now as a typo). So the hook **also blocks `--` used as a
sentence/clause dash** in the same scoped files, with the same AskUserQuestion flow. The
matcher is deliberately narrow to avoid false positives: it flags `--` only when it reads as
prose punctuation (` -- ` spaced, or `word-- ` attached-before), and it **skips** legitimate
`--`: CLI flags (`--port`), markdown/YAML `---` rules and frontmatter delimiters, HTML
`<!-- -->` comments, and anything inside a fenced ```` ``` ```` code block. If you genuinely
need a literal `--` in prose (e.g. showing `git checkout -- file`), wrap it in inline code
(backticks) or a code fence and the hook leaves it alone. **Never "fix" an em-dash by typing
`--`** — that just trades one flagged form for another; pick real punctuation instead.

**Repo-wide scanner (the standing gate the hook lacks).** The hook only fires on files
Claude *edits* — it never sweeps the existing corpus, so em-dashes that predate the hook (or
arrive via a human edit / bulk script / git) go uncaught. `make validate-em-dash`
(`scripts/validate-em-dash.js`) scans **all** in-scope content (prose `*.md`/`*.mdx` under
`{docs,blog,designs,changelog}/` + `src/**.{tsx,jsx}`) and exits 1 on any hit. Run it after
any voice work and before a publish to prove the corpus is clean. It flags **everything**
including em-dashes inside code blocks (a deliberate choice — keep the scan simple, let a
human keep any genuinely-literal one).

> **Gotcha — the hook scans the WHOLE file, not just your diff.** Editing *any* line of a
> file that already contains em-dashes (e.g. fixing a broken link, adding an MDX comment)
> re-triggers the block on the pre-existing dashes. So a single unrelated edit can surface
> several em-dashes you didn't write. That's expected: handle them via AskUserQuestion the
> same way (note in your question that they're pre-existing), then re-apply your original
> edit. **Plan ahead:** before editing an em-dash-heavy reader-facing file, expect to clear
> its dashes in the same pass.

> **Self-healing — record the user's choices here so we stop re-asking.** This skill is the
> single source of truth for the em-dash rule, so when the user gives guidance on how to
> rephrase (or any new rule about the hook), **write it into this section in the same change**
> — both the *preference* and a short *example*. Over time this table should let us apply the
> user's default rephrasing without a prompt for the common cases (still ask when genuinely
> ambiguous). Append new rows as you learn them.

**Worked examples (the user's observed rephrasing preferences):**

| Original (em-dash) | Chosen fix | Pattern |
|---|---|---|
| `**living timeline** — hypothesis, why we placed it…` | colon: `**living timeline**: hypothesis…` | dash introducing a list/elaboration → **colon** |
| `Executes the decision — keep control…, or ship… — and finalizes` | parens: `Executes the decision (keep control…, or ship…) and finalizes` | dash *pair* wrapping an aside → **parentheses** |
| `A live demo of premium content — the rest unlocks when you sign in.` | period: `A live demo of premium content. The rest unlocks when you sign in.` | dash joining two independent clauses → **period (two sentences)** |
| `This is premium content — sign in with LinkedIn to read the rest.` | period: `This is premium content. Sign in with LinkedIn to read the rest.` | (same — CTA teaser) |
| `the gate is broken — this paragraph contains the sentinel…` | period: `the gate is broken. This paragraph contains the sentinel…` | (same — body prose) |

Heuristic distilled from the above: a single dash before an *elaboration/list* → colon; a
*pair* of dashes around an aside → parentheses; a dash joining two *complete* clauses →
period (two sentences). When in doubt, still ask — but lead with the heuristic's choice.

**More patterns (from the 2026-06 corpus sweep — ~1100 em-dashes across 189 files):**

| Original (em-dash) | Chosen fix | Pattern |
|---|---|---|
| `- **🕌 Faith** — the practices…` | colon: `- **🕌 Faith**: the practices…` | **bold/italic label** leading a list item → **colon** |
| `[Docusaurus — Search](url)` | colon: `[Docusaurus: Search](url)` | **link label** `[Source — Page]` → **colon** (`Source: Page`) |
| `\| … take \| — \| one post… \|` | hyphen: `\| … take \| - \| one post… \|` | **standalone `\| — \|` table cell** (means "n/a"/empty) → **`-`**, NOT a comma |
| (em-dash inside a ``` fence / CLI sample) | hyphen: `-` | **code block / inline-code / mermaid label** → plain hyphen (a comma can break a command) |
| `distinct_id: ${id ?? '—'}` | `'n/a'` | em-dash used as a **null/placeholder display value** → `n/a` |

**Bulk-remediation mechanics (when clearing a large backlog, user-directed):**
- The hook re-fires on **every** edit to a still-dirty file and echoes the *full* remaining
  list each time — editing 50 dashes one at a time floods context 50×. Instead clear a whole
  file in **one** operation (a single multi-edit batch, or a `perl`/`sed` pass) so the hook
  evaluates once and the file lands at zero.
- The Edit tool needs a prior **Read** of each file; a multi-file `sed`/`perl` pass avoids
  that. A context-aware pass that's worked well: track ``` fences (hyphen inside code,
  rephrase outside), colon after a `[link label]`/`**bold label**`, comma for mid-sentence
  asides, then **review the diff** for spots a colon/period reads better and hand-fix.
- **Always re-scan after a bulk pass**: `make validate-em-dash` for zero dashes, and
  `grep -rn '|, |'` for the table-cell artifact above. Then `make build` (clean, cache
  cleared) — rapid hot-reload of 100+ files can leave a STALE `.docusaurus` tags JSON that
  shows a spurious `Cannot parse JSON … "tag"` dev error; a from-scratch build proves the
  source is fine. `rm -rf .docusaurus node_modules/.cache` clears it.

## Five audits

Run the audits relevant to the request. Default to all five for a broad "make it
reader-focused" ask; run one when scoped (e.g. "fix the menu labels"). Audits 1–3
look at *what exists*; audit 4 (information architecture) questions *the structure
itself* — it's the deepest reader concern, because labels are cosmetic but structure
decides whether anything is findable at all.

### 1. Labels & navigation

Each docs instance's sidebar is **autogenerated** from its `docs/<instance>/` folder structure (its
own `sidebars-<instance>.js` → `{type:'autogenerated'}`). So menu text comes from, in priority
order: `sidebar_label` → `title` → filename. Category labels come from `_category_.json`. Navbar
labels live in `docusaurus.config.js` (`themeConfig.navbar.items` — one `docSidebar` item per
instance).

Flag and fix:
- **Long sidebar entries.** A `title` over ~32 chars (especially SEO titles like
  *"Understanding X: A Complete Mental Model for…"*) renders as a wrapped, truncated
  mess in the sidebar. **Fix: add a short `sidebar_label`** — keep the long `title`
  for the page H1 / browser tab / SEO. Never shorten the `title` just for the menu;
  that sacrifices SEO. (This is the canonical fix — title stays, label is added.)
  - Find offenders:
    ```bash
    cd bytesofpurpose-blog/docs
    for f in $(find . -name "*.md" -o -name "*.mdx" | sort); do
      fm=$(awk '/^---$/{c++;next} c==1{print} c==2{exit}' "$f")
      t=$(echo "$fm" | grep -iE '^title:' | head -1 | sed "s/^title:[[:space:]]*//; s/^[\"']//; s/[\"']$//")
      l=$(echo "$fm" | grep -iE '^sidebar_label:')
      [ -n "$t" ] && [ -z "$l" ] && [ ${#t} -gt 32 ] && printf '%s\n   %s\n' "$f" "$t"
    done
    ```
  - Apply a label (idempotent — skips files that already have one):
    ```bash
    perl -0pi -e "s/^(title:.*\n)/\$1sidebar_label: 'SHORT LABEL'\n/m" path/to/doc.mdx
    ```
  - **Same rule applies to BLOG posts now.** The Posts sidebar (`/initiatives`) is no longer
    docs-only: every blog post carries a `kind:` and a short `sidebar_label:` (≤ 3 content
    words), and the kind-derived emoji is prepended automatically — see `author-post`
    ("Blog post `kind:` + the sidebar"). A long blog `title:` wraps/truncates in the Posts
    sidebar exactly like a docs title, and the fix is identical: add a short `sidebar_label`,
    keep the full `title` for the H1/SEO. (Mechanism differs: the blog plugin doesn't read
    `sidebar_label` natively — the `draft-docs` plugin + `BlogSidebar` swizzle do, and the
    warn-tier check is `validate-post-outline.js`'s `long-sidebar-label`, not the docs
    structure validator.) So when auditing labels, sweep `blog/` too, not just `docs/`.
- **Repetitive sibling labels.** Five entries all starting *"Understanding … "* read
  as noise — the shared prefix is already implied by the category. Strip the prefix
  in `sidebar_label` ("Dynamic Programming", "Graphs", "Heaps", …).
- **Jargon category names.** `_category_.json` labels that name the author's taxonomy
  ("Craftsmanship", "Techniques") rather than reader benefit. Keep an emoji prefix
  (it aids scanning) but prefer a word the reader would search for. Propose, don't
  force — taxonomy is the author's voice; surface it as a recommendation.
- **Emoji prefix on section labels.** Every `_category_.json` `label` should LEAD with an
  emoji so the sidebar scans visually (this is a hard convention — the validator emits
  `emoji-prefix-category`; `make validate-structure` lists offenders). When one is missing,
  **suggest** an emoji by looking it up in the topic→emoji map
  (`scripts/lib/emoji-map.js` / `emoji-map.json`, which the validator itself reads via
  `resolveFolderEmoji`; the `suggest-emoji` skill owns it) — a
  deterministic lookup, *not* free model-classification: reuse the emoji a sibling of the same
  *kind* already uses (🔬 Research, 🔨 Projects, 🛠️ Techniques/Tools/Skills, 🔧 Tinkering,
  💬 Prompts, 📖 Terminology, 🧠 Mental Models, 💻 Code/Scripting/Workspace) so siblings stay
  consistent. List the offenders + apply a fix:
    ```bash
    # list category labels missing a leading emoji
    cd bytesofpurpose-blog && node scripts/validate-docs-structure.js 2>&1 | grep emoji-prefix-category
    # prepend an emoji to one label (JSON-safe; structure untouched). Pick EMOJI from the map.
    node -e 'const f=process.argv[1],e=process.argv[2],j=require(require("path").resolve(f));j.label=e+" "+j.label;require("fs").writeFileSync(f,JSON.stringify(j,null,2)+"\n")' docs/<topic>/<sub>/_category_.json '📖'
    ```
  Doc leaf labels (`sidebar_label`/`title`) ideally lead with an emoji too, but most don't
  today — the validator rolls those into one `emoji-prefix-doc` count (`--emoji` to expand);
  don't mass-flag them. Also watch for **`sidebar-label-missing`**: a doc with neither `title`
  nor `sidebar_label` shows its raw FILENAME in the sidebar — always fix that (add a `title:`).
- **Builder words in the navbar.** "Docs", "Components", "Changelog" are builder
  words. Reader-facing: "Learn", and consider "What's New" for Changelog. The navbar
  is brand-voice — **propose options, let the user pick** (don't unilaterally edit).

### 2. Page layout / UX (rendered)

Review a *rendered* page, not just source — confusion lives in the layout. Start dev
(`make dev`, serves :3000) or use a built preview, then open the page in a browser
(Chrome tools via ToolSearch, or chrome-devtools MCP). Check:
- **Reading path.** Is there one obvious place the eye starts and one obvious next
  action? Or do multiple columns / callouts / badges compete at the top?
- **Dead or ignored regions.** Buttons/links in zones readers skip (right rail,
  far-bottom), or affordances that look clickable but aren't. A region every reader
  ignores is either mis-placed or should be removed.
- **Author-only surfaces leaking to readers.** Debug menus, draft badges, internal
  nav must be dev-only. The e2e suite has a *dev-only-surfaces absence* test
  (`test/e2e/`); if you spot one in a prod build, that's a P0 — cross-ref that test.
- **CTA placement.** The support / "Buy me a coffee" CTA and any conversion element:
  is it where a reader is ready to act, or interrupting orientation?
- **Mobile width.** Long labels and multi-column layouts degrade first on narrow
  screens — check a phone viewport.

### 3. Content voice

Scan intros, headings, and summaries for **writer-focused phrasing** and propose
reader-focused rewrites:
- "In this post I will…" / "I wanted to write about…" → lead with the reader's
  takeaway or question.
- Internal jargon / project codenames with no gloss → name the benefit first.
- Headings that label the author's structure ("Background", "Misc") → headings that
  promise reader value ("Why this breaks", "The 3 cases you'll hit").
- A title that's an SEO keyword pile → fine for `title`/SEO, but the **on-page intro**
  should restate it in human terms.

Content edits follow `author-post` rules (frontmatter, MDX `<br/>` / `{}`
pitfalls). Don't introduce build-breakers while rewriting.

### 4. Information architecture (file/folder structure)

Audits 1–3 polish what exists; this one questions whether the **structure** serves a
reader who's never seen the site. The `docs/` folder tree IS the sidebar tree
(autogenerated), and folder *numeric prefixes* set section order. So folder
organization is a reader-facing decision, not just a filing system.

**Crucial repo fact — re-org here is SAFE on URLs, but ONLY because every slug is
absolute.** A slug does NOT inherently decouple the URL from the folder path — it
depends on the slug's *form*. A **relative** slug (`slug: foo`, or no slug) leaves the
folder path baked into the URL, so moving the folder MOVES the URL. An **absolute**
slug (`slug: /foo/bar`, leading `/`) pins the URL regardless of where the file lives.
This repo froze every doc to an **absolute** slug (the URL-freeze; verify with
`grep -c '^slug: /'` vs `grep -c '^slug:'` — counts should match), so here *moving a
file to a new folder reshuffles the sidebar but does NOT change its URL.* Two things
STILL break a URL even with absolute slugs: (1) **editing a slug's VALUE**, and (2)
moving a doc whose slug is relative/path-derived. `onBrokenLinks` is `'warn'`, so a
changed slug value **silently 404s** — no build failure. **The client-redirects plugin
is installed** (`@docusaurus/plugin-client-redirects`; pin it to the EXACT
`@docusaurus/core` version, not `^`, or the build throws a version-mismatch error). So
when a slug VALUE must change, the fix is: add a `{from, to}` entry to the `redirects`
array in `docusaurus.config.js` (targets use the real served path — `/craft/…`,
`/journey/…`, `/knowledge/…`, `/habits/…`, `/handbook/…`, NOT a `/docs/…` prefix) AND
repoint inbound links. Flag both as required follow-ups whenever you propose a
slug-value change. (The move mechanics — repoint + collapse redirect chains — are owned
by `reorganize-content`; `validate-redirects` gates the targets.)

**When you move a slug, grep `test/` too — not just `docs/ blog/ src/`.** e2e specs
hardcode doc slugs in `goto('/craft/…')`; a redirect keeps real users working but lands
the test on the redirect **stub** (no content) → spurious timeout that looks like a
broken component. `make validate-links` now catches this (`test-stale-slug` rule), but
include `test/` in your own sweep so you fix it up front.

#### The topic-folder contract (audit against it)

The docs are **five separate `plugin-content-docs` instances** (`craft`/`journey`/`knowledge`/
`habits`/`handbook`), each a topic-based IA with the same recurring folder contract. **The contract
itself — the folder shape, instance-relative slugs, `_category_.json` label+position+emoji,
kebab/no-numeric-prefix, depth ≤5, terminology-first/prompts-last, the description rules, the
idea↔execution + blog↔doc-trigger conventions, and the legacy-namespace rule — is the SOURCE OF
TRUTH in `author-post` (`homes/craft.md`, "The topic-folder contract").** It is enforced by
`bytesofpurpose-blog/scripts/validate-docs-structure.js` (`make validate-structure` + a warn-only
`Write|Edit` hook; the only ERROR tier is a missing/relative slug, everything else warns).

This skill AUDITS against that contract — it flags where the live tree VIOLATES it (below) — but does
not define it. When you find a violation, fix it per the contract in `author-post` +
`reorganize-content` (for moves). If a structure DECISION changes the contract, update
`author-post/homes/craft.md` + `validate-docs-structure.js` in lockstep (the CLAUDE.md tenet).

Survey the tree, then flag:
- **Over-deep nesting.** Paths 5+ levels deep (e.g.
  `…/tool-composition-techniques/storybook-typescript-babel/…`). A reader rarely
  drills past 4 levels (domain sub-topic → bucket → project is the deepest sanctioned
  shape). Propose flattening or collapsing a level.
- **Orphan categories (1 doc).** A `_category_.json` folder containing a single doc
  adds a click for no grouping value. Propose promoting the lone doc up a level or merging
  siblings. (The `docs-per-category` survey command below lists offenders — count 1.)
- **Overstuffed categories.** A category with many flat children that a reader must
  scan linearly → propose sub-grouping. (Inverse of the orphan problem.)
- **Mis-homed docs.** A doc whose topic fits a different section better (e.g. is DSA a
  "mental model" or a "skill"?). Propose the move — surface the trade-off, the
  author's taxonomy is their call.
- **Ordering vs. reader priority.** Numeric prefixes set order; check the *first*
  things a reader sees are what they most want, not what was written first. Propose
  prefix renumbering (cheap, no URL impact).
- **Discoverability.** Could a reader guess where a page lives, or is it buried?
  Cross-check against the navbar entry points (`Learn`, `Blog`, …).

**Author's taxonomy conventions (preferences — apply these, don't re-litigate them):**
- **Topics are reader-facing nouns, not framing words.** Within an instance, a topic folder
  should name a broad subject area a reader browses by — a topic NOUN — not a format or the
  author's filing system. Prefer *Software Development*, *Product Management*, *Companies*,
  *Leadership* over framing words like "Definitions", "Craftsmanship", "Techniques". When you find
  a folder that names a *format* rather than a topic, flag it and propose a topic name (the
  `framing-folder` check warns on `*-techniques`/`*-craftsmanship`/`definitions`).
- **The five instances already carve the top level by intent** — `craft` (how I do the work),
  `journey` (why I build), `knowledge` (mental models), `habits` (practices), `handbook` (the
  reader's guide). So a "root topic" question is usually really a *which-instance* question
  (owned by `organize-post` + the CLAUDE.md durable-vs-temporal tenet); a *whole-instance* change
  is `manage-docs-instances`.
- **Consolidate scattered glossaries by topic.** The site accumulates per-domain terminology docs;
  rather than many sibling glossary pages, group each under the topic it serves (a `terminology/`
  category, which sorts first). When you see a new `terminology-*`/glossary doc, propose which
  topic thread it joins. (The durable taxonomy intent lives in the `docs-topic-taxonomy` memory —
  treat it as an evolving set.) The single reader-facing glossary of terms-of-art is `/glossary`
  (`audit-glossary-links`'s registry).

Survey commands:
```bash
cd bytesofpurpose-blog/docs
# deepest nesting
find . -name '*.md' -o -name '*.mdx' | awk -F/ '{print NF-1" "$0}' | sort -rn | head
# docs-per-category (orphans = 1, overstuffed = high)
find . -name _category_.json | while read c; do d=$(dirname "$c"); \
  n=$(find "$d" -maxdepth 1 \( -name '*.md' -o -name '*.mdx' \) | wc -l); \
  printf '%3s  %s\n' "$n" "${d#./}"; done | sort -n
# confirm the slug is ABSOLUTE before proposing a move (relative slug ⇒ path is in the URL)
grep '^slug:' <file>   # safe to move only if it shows `slug: /…` (leading slash)
```

**Structure changes are ALWAYS proposed, never auto-applied** — even though a move is
URL-safe *while the slug stays absolute and unchanged*, it still reshuffles the
reader's sidebar and reflects the author's taxonomy. Put every re-org in the report's
*Proposed* bucket with: the move, why a reader benefits, URL-safety note (absolute slug
unchanged ⇒ URL unchanged), and any redirect caveat (a slug-VALUE change 404s silently).

### 5. Prioritized report (the deliverable)

End every run with a ranked report. Don't bury fixes in prose. Severity:
- **P0** — breaks the reader (author-only surface shipped, broken nav, unreadable
  truncation on the main path).
- **P1** — friction (long/repetitive labels, confusing layout, jargon in nav,
  over-deep nesting / buried pages a reader can't find).
- **P2** — polish (voice tweaks, category renames, CTA tuning, orphan-category
  merges, prefix reordering).

Report format:

```
## Reader-experience audit — <scope> — <date>

### P0
- [layout] DebugMenu visible in prod build on /foo → gate behind dev. (test: e2e absence)

### P1
- [labels] 5 DSA docs show full SEO titles in sidebar → add sidebar_label (list files + proposed). 
- [nav] a navbar item names a builder word rather than a reader benefit → propose the reader-facing term (propose only — brand voice).
- [IA] docs sit 5 levels deep under a domain sub-topic → propose flattening one level (URL-safe: absolute slugs unchanged).

### P2
- [voice] a doc intro opens "In this post I will…" → lead with reader takeaway.
- [labels] a `_category_.json` names a format ("Craftsmanship") → consider a topic noun (propose only).
- [IA] several single-doc categories under one topic → promote the lone docs up a level.

### Applied vs. proposed
Applied: <auto-fixes made (sidebar_label additions)>.
Proposed (need your call): <navbar/category renames, voice rewrites, ALL re-org moves>.
```

Auto-apply only the safe, reversible, unambiguous fixes (adding `sidebar_label`
without touching `title`). Everything that touches brand voice or taxonomy
(navbar text, category names, intro rewrites, **and all file/folder re-org moves**)
goes in **Proposed** for the user to approve.

### Screenshots live in Dropbox, NOT the repo

Visual-review / design-review screenshots (the exploratory shots you capture while reviewing
layout, footer, home, etc.) go to
`~/Library/CloudStorage/Dropbox/Data/bytesofpurpose-design-review/<YYYY-MM-DD>/` — **never**
commit them to the repo. PNGs are large and never compress out of git history, so a clean
working tree must not carry a `.claude/design-review/` (or similar) screenshot dir. (Screenshots
that back a *filed GitHub issue* go to the separate audit dir
`~/Library/CloudStorage/Dropbox/bytesofpurpose-audits/<YYYY-MM-DD>/` — see the
`audit-mobile-experience` / `audit-desktop-experience` skills.)

## After fixing

- Rebuild to confirm nothing broke: `make dev` (sidebar/label changes are picked up
  live) or a full build before deploy. Frontmatter typos in YAML fail the build.
- Re-check the sidebar visually — wrapped/truncated text is the symptom you're
  hunting, and only the render confirms it's gone.
- Ship via `deploy-site` / `publish-site`; verify with `validate-deployment`.

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `sidebar_label` change not reflected | dev server cached / wrong field | confirm it's under the doc's own frontmatter (not category), restart `make dev` |
| Category label unchanged | edited frontmatter, not `_category_.json` | category labels live in `_category_.json`, not the docs |
| Build fails after label edit | YAML quoting (apostrophe/colon in label) | wrap the value in single quotes; escape inner `'` |
| Navbar label change not live | editing wrong items array | navbar is `themeConfig.navbar.items` in `docusaurus.config.js` |
| Moved a doc, URL 404s now | slug was relative/path-derived (so path was in the URL), or you edited the slug value | give the doc an ABSOLUTE `slug: /…` (or restore the old value); an absolute slug pins the URL regardless of folder. No redirects plugin + `onBrokenLinks:'warn'` → a changed slug value 404s silently and needs a manual redirect |
| Re-org didn't reorder sidebar | numeric prefix unchanged | sidebar order = folder/file numeric prefixes; rename the prefix, not just the label |
