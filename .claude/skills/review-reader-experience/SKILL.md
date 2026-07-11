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

Pairs with: `author-post` (content rules + MDX pitfalls), `validate-links`
(link hygiene), `publish-site` (draft triage). Apply fixes through those skills'
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

The sidebar is **autogenerated** from `docs/` folder structure (`sidebars.js` →
`{type:'autogenerated'}`). So menu text comes from, in priority order:
`sidebar_label` → `title` → filename. Category labels come from `_category_.json`.
Navbar labels live in `docusaurus.config.js` (`themeConfig.navbar.items`).

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
  **suggest** an emoji by looking it up in the topic→emoji map at
  `/definitions/emojis-for-activities` (`docs/productivity/terminology/emojis.mdx`) — a
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
This repo froze every doc to an **absolute** slug (the Phase-A URL-freeze; verify with
`grep -c '^slug: /'` vs `grep -c '^slug:'` — counts should match), so here *moving a
file to a new folder reshuffles the sidebar but does NOT change its URL.* Two things
STILL break a URL even with absolute slugs: (1) **editing a slug's VALUE**, and (2)
moving a doc whose slug is relative/path-derived. `onBrokenLinks` is `'warn'`, so a
changed slug value **silently 404s** — no build failure. **A redirects plugin IS now
installed** (`@docusaurus/plugin-client-redirects`, added 2026-06-02 by the
mental-models migration; pin it to the EXACT `@docusaurus/core` version, not `^`, or
the build throws a version-mismatch error). So when a slug VALUE must change, the fix
is: add a `{from: '/docs/<old>', to: '/docs/<new>'}` entry to the `redirects` array in
`docusaurus.config.js` (targets use the real served `/docs/…` path) AND repoint inbound
links. Flag both as required follow-ups whenever you propose a slug-value change.

**When you move a slug, grep `test/` too — not just `docs/ blog/ src/`.** e2e specs
hardcode doc slugs in `goto('/docs/…')`; a redirect keeps real users working but lands
the test on the redirect **stub** (no content) → spurious timeout that looks like a
broken component. `make validate-links` now catches this (`test-stale-slug` rule), but
include `test/` in your own sweep so you fix it up front.

#### Topic-folder contract + validator (`validate-docs-structure.js`)

The docs are a **two-tier topic-based IA** with a recurring folder contract. This skill
owns the contract; `bytesofpurpose-blog/scripts/validate-docs-structure.js` enforces it
(`make validate-structure`, plus a warn-only `Write|Edit` hook). The contract:

- The docs root is `welcome/` (the topic index, not a topic) + exactly two container
  topics: **`craft/`** (professional topics — how I see the world) and **`self/`**
  (personal topics — how I see myself). Each reader-facing TOPIC lives one level down,
  under `craft/<topic>/` or `self/<topic>/`. `craft/` and `self/` are themselves topic
  roots (each has a `README` with absolute slug `/craft` / `/self` + an emoji
  `_category_.json`), and each is surfaced as its own navbar item via `docSidebar`
  (`craftSidebar` / `selfSidebar` in `sidebars.js`), with `welcome/` listed first in both.
- **Folder NAMES carry no numeric ordering prefix** (no `2-development/`, `6-projects/`).
  Sidebar order comes from the `_category_.json` `"position"` field (folders) and
  `sidebar_position` frontmatter (docs) — never the name. *Why:* a name prefix couples
  *order* to *identity* — reordering a prefixed folder is a `git mv` that rewrites every
  descendant doc's path (churns history), whereas bumping a `position` is a one-line,
  history-clean edit. The `numeric-prefix` check warns on any prefixed folder name.
- **Every doc has an ABSOLUTE `slug:` (`slug: /…`)** — the URL-freeze guarantee. The
  validator treats a missing/relative slug as the only **ERROR** tier (exit 2; the
  hook surfaces it but never blocks). Everything below is **warn** tier (advisory).
- **Slugs are FOLDER-PATH MIRRORED**: a doc's absolute slug equals its folder path
  under `/craft|self/...` (a README maps to its folder, no doubling; e.g.
  `docs/craft/blogging/adding-content/README.mdx` → `/craft/blogging/adding-content`).
  When you move/reorg a doc, update its slug to match the new path and add a
  `{from,to}` client-redirect so the old URL still resolves —
  `scripts/migrate-ia.js` is the reference engine for a bulk move (computes the
  old→new map, rewrites slugs + cross-links, emits redirects).
- Each topic folder has a `README.{md,mdx}` landing (absolute slug) + a
  `_category_.json` (label + position).
- **Every `_category_.json` `label` LEADS with an emoji** so the sidebar scans visually.
  The validator warns via **emoji-prefix-category**; the hook nudges on a `_category_.json`
  save without one. Reuse the emoji a sibling of the same kind uses (🔬/🔨/🛠️/🔧/💬/📖/🧠/💻
  …) — the topic→emoji map at `/definitions/emojis-for-activities`
  (`docs/productivity/terminology/emojis.mdx`) is the source of truth. Doc leaf labels lead
  with an emoji too where natural (rolled up as **emoji-prefix-doc**, `--emoji` to expand); a
  doc with NO `title`/`sidebar_label` falls back to its filename — **sidebar-label-missing**.
- Every sub-folder that contains docs has a `_category_.json`; none should sit in a
  folder with no docs and no docs-bearing descendants (orphan category).
- Names are **kebab-case** (no spaces/uppercase; `_`-prefixed like `_TEMPLATE` exempt).
- No framing-word / topic-echo folder names (`*-techniques`, `*-craftsmanship`,
  `definitions`) — use a reader-facing topic noun. (Several `-techniques` folders
  survive from the pre-reorg tree with frozen slugs; the validator warns on them.)
- Folder depth ≤ 5 under a topic root (the `craft/`/`self/` container tier adds one
  level above the former topics, so a domain sub-topic with its own
  `projects/<project>` legitimately reaches 5, e.g.
  `craft/software-development/frontend-development/techniques/<doc>`).
- A `terminology/` category sorts **first**; a `prompts/` category sorts **last**.
- The Welcome topic-index cards (`### [Label](/docs/<slug>)`) must each point at a real
  README slug, and the two roots (`/craft`, `/self`) must each be covered by at least one
  card (a card on the root or any sub-topic under it). The **welcome-drift** check
  (formerly T15) enforces this against every README slug in the tree.
- Every doc carries a healthy `description:` frontmatter — present, ~50–160 chars, and
  distinct from other docs. It feeds both `og:description` (SEO/social preview) and the
  ShareButton "Here's what it covers:" share message. The validator warns via
  **description-missing / description-length / description-duplicate**. Deeper drafting/
  refresh + a share-message preview live in the `manage-frontmatter-descriptions` skill.

**Large topics may split into DOMAIN sub-topics** (Phase G). `Software Development`
(`2-development/`) is organized by build domain — `backend-development/`,
`frontend-development/`, `scripting/`, `plugins/` — each repeating the recurring shape
(`research/ projects/ techniques/ tinkering/`); `terminology/` + `prompts/` stay at the
topic root. The idea→ship LIFECYCLE is a SEPARATE topic, `Product Management`
(`5-product-management/`, slug `/product-management`): `ideas/ research/ pocs/
experiments/ initiatives/ projects/
roadmaps/`. Rule of thumb: *what to build & why* → Product Management; *what I built &
how* → Software Development.

**`mental-models/` is a PER-TOPIC subdir, not a root namespace** (warn-validated by the
`legacy-namespace` check). A topic's "how to think about X" content lives in a
`mental-models/` subdir *under that topic* with a topic-first slug —
`interview-prep/mental-models/…`, `companies/mental-models/{career-levels,skills,cultural-values}/…`,
`generative-ai/mental-models/…`. It is NOT a cross-cutting `/mental-models/*` root URL
namespace: that earlier shape was an orphan URL tree (a folder organized by topic, a URL
tree organized by a "understanding-X" lens) with no landing page to climb to. The
`/mental-models/*` URLs were dissolved into the per-topic subdirs and the old URLs are
preserved via `@docusaurus/plugin-client-redirects` (the redirect list lives in
`docusaurus.config.js`; keep it in lockstep with any future slug move). The
`legacy-namespace` rule warns if any NEW doc reintroduces a `/mental-models/*` slug.

**Idea↔execution mapping convention** (warn-validated by the `idea-exec-link` check): a
Product Management idea/initiative doc links to its built artifact(s) under an
`## Execution` section (absolute `/development/…` links); the Software Development
artifact links back under an `## Idea` (or `## Origin`) section (absolute
`/product-management/…`). The validator warns if any such link doesn't resolve to an
existing slug; it never blocks, and back-links are backfilled incrementally.

**Blog↔doc trigger convention** (warn-validated; owned by
`docs/blogging/blog-post-triggers.mdx`, which is the source of truth for the taxonomy): a
doc that marks a *moment worth announcing* carries an optional `blog_*` frontmatter block —
`blog_trigger:` (one of the controlled vocab `conference | book | solution | poc |
milestone | opinion`), `blog_post:` (slug of the companion `/blog/` post), `blog_status:`
(`planned | drafted | published`). The doc stays the durable reference; the post is the
point-in-time announcement that links back to it. Scaffold the post with
`make generate-blog-stub DOC=…` (read-only on the source doc; refuses to overwrite);
`make blog-pending` lists post-worthy docs that still owe a post. The validator warns via
three rules: **blog-trigger-vocab** (value outside the controlled set), **blog-post-exists**
(`blog_post:` resolves to no `/blog/` post), **blog-post-orphan** (a `/blog/` post links a
`/docs/<slug>` whose doc lacks the matching `blog_post:` back-reference). Keep the
controlled vocab in `validate-docs-structure.js` (`BLOG_TRIGGERS`) in lockstep with the
taxonomy table in the triggers doc.

**Operating convention (also in CLAUDE.md):** any decision that changes this structure
or its conventions (add/rename/retire a topic, change the recurring shape, add a naming
rule, change slug/draft policy) MUST update this validator + this section in the same
change, so the docs and the checks never drift.

Survey the tree, then flag:
- **Over-deep nesting.** Paths 5+ levels deep (e.g.
  `…/tool-composition-techniques/storybook-typescript-babel/…`). A reader rarely
  drills past 4 levels (domain sub-topic → bucket → project is the deepest sanctioned
  shape). Propose flattening or collapsing a level.
- **Orphan categories (1 doc).** A `_category_.json` folder containing a single doc
  adds a click for no grouping value. Many exist (`10-prompts/*` has several 1-doc
  subcategories; `5-craftsmanship/3-workflows`, `…/6-tips`, etc.). Propose promoting
  the lone doc up a level or merging siblings.
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
- **Root-level categories ARE topics.** The top level of the sidebar should be broad
  subject areas a reader browses by — topics promoted to root, not nested under
  format-named buckets. Prefer topic nouns (*Productivity*, *Development*,
  *Companies*, *Scripting*, *Entrepreneurship*, *Personal Habits*) over framing words
  like "Definitions", "Craftsmanship", "Techniques". When you find a root category
  that names a *format* or *the author's filing system* rather than a topic, flag it
  and propose a topic name. Known root topics (evolving — `8-habits/` already = Personal
  Habits, `6-techniques/7-scripting-techniques/` already = Scripting).
- **Consolidate scattered glossaries into a few "Vocabulary" threads, by topic.** The
  site accumulates per-domain terminology docs (`terminology-cli`, `-development`,
  `-project-management`, `-blog`, `-portfolio`, …). Rather than 5+ sibling glossary
  pages, group them under the topic they serve. Established threads:
  - **Productivity** ← CLI Terms (roles/skills/activities/workflows), Development
    Terms (goals/initiatives/projects/ideas/priorities), PM Terms
    (planning/managing/organizing/distilling/plan).
  - **Development** ← Blog Terms (function/mechanic/technique/strategy), Portfolio
    Terms (system/service/application/library/package).
  - **Companies** ← sub-grouped into **Roles** (career levels, SDE skills) and
    **Culture** (company values by size, e.g. cultural-values, zapier-values). Note:
    Companies content currently lives as *essays* under `3-mental-models/` — a
    consolidated Companies vocabulary may need authoring, not just moving.
  - **Scripting** — already exists as `6-techniques/7-scripting-techniques/`.
  - **Entrepreneurship** (starting your own company) — seeds exist:
    `8-habits/habits-entrepreneurship.mdx`, `4-development/2-research/learning-topics/learning-business.md`.
  When you see a new `terminology-*`/glossary doc, propose which thread it joins.
  (This topic list is the author's evolving intent — treat it as a growing set, not
  a closed one; the durable copy lives in the `docs-topic-taxonomy` memory.)

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
- [nav] "Docs" is a builder word → propose "Learn".
- [IA] storybook-typescript-babel docs sit 5 levels deep → propose flattening one level (URL-safe: absolute slugs unchanged).

### P2
- [voice] /bar intro opens "In this post I will…" → lead with reader takeaway.
- [labels] Category "Craftsmanship" → consider "Building Well" (propose only).
- [IA] 6 single-doc categories under 10-prompts/* → promote the lone docs up a level.

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
