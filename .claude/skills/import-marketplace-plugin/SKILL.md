---
name: import-marketplace-plugin
description: Turn a Claude Code plugin (or skill) you feature in your marketplace into a build-clean /designs post — a first-person skill-design write-up. Covers the framing (a plugin is a ROLE, its skills are ABILITIES/verbs; skills carry judgment, the CLI carries muscle), the frontmatter (kind: tooling-cli-design, sidebar_position = current max + 1, draft: true), the source-repo pointer via <RepoPointer repo path commit> with the fail-closed 404-gate (draft until the repo path resolves 200), the body rules (de-em-dash — the em-dash hook BLOCKS designs/*.mdx; mermaid with NO hardcoded fills so the theme colors it; a REAL worked example from live runs), then hands to refine-design-post + a full build. Use when the user says "make a blog post out of this plugin/skill", "feature my marketplace plugin as a design post", "write up this skill I built", or "import <plugin> into /designs". Pairs with author-blog-post (MDX pitfalls), refine-design-post (voice + coverage audit), upgrade-post (richer components), publish-site (un-draft + deploy), and the [[repo-pointer-component]] convention.
---

# Import a marketplace plugin/skill as a Designs post

You build Claude Code **plugins and skills** and feature them in your marketplace
(`github.com/omars-lab/claude-plugin-marketplace`, path `plugins/<name>/`). This skill turns
one of them into a **Designs-blog post** (`/designs/design-<name>`): a first-person
skill-design write-up that explains what the plugin does, how it is built, and the design
principle it demonstrates — pretty, general enough to share, and in your voice.

It is the plugin/skill member of the `import-*` family. Unlike `import-co-design` and
`import-reconstruction` (deterministic Node transformers over a fixed artifact), a plugin
write-up needs **authoring judgment** — the roles/verbs framing, which worked example to
show, what to leave as an honest limit. So this skill is a **judgment-guided checklist**, not
a transformer. You author; the checklist keeps you on-voice and build-clean.

Worked reference: `designs/2026-07-06-local-guide-skill.mdx` (the `local-guide` plugin) — the
first post built this way. Read it as the shape to match.

## Philosophy: the SKILL.md is the terse source; the post is the UPGRADE

A plugin's `SKILL.md` (and any `BLOG.md` draft next to it) is written to INSTRUCT Claude —
terse, mechanism-first, for an audience that already has the context. The design post is the
**upgrade**: it should paint the WHOLE picture for a general reader — why this matters, who it
helps, how it is built, and the reusable lesson. Adapt the source UP; never paste it down.

## The framing that carries these posts

Every plugin write-up leans on one durable idea worth stating clearly:

- **A plugin is a ROLE (a noun/identity); its skills are ABILITIES (verbs).** The plugin is
  the character; the skills are its moves. Name the role, then table the verb-first skills.
- **Skills carry the JUDGMENT; the CLI/tool carries the MUSCLE.** A skill knows *which* portal /
  dataset / column / prompt and *how to read* the result; the tool just does the mechanical
  work. This is why a plain-English question resolves to the right calls.
- **State that framing ONCE** (see [[refine-design-post]] STYLE-GUIDE: a coined metaphor is a
  "thing" to state once — do not re-coin "muscle/judgment" in a later section).

If the plugin is a single skill (not yet a multi-skill plugin), say so honestly — frame it as
one skill over its tool, and note the plugin form if that is where it is headed. Do NOT invent
a plugin architecture the code does not have; if the prompt's framing and the on-disk source
disagree, surface it (the post must not describe code that is not committed — see the draft
gate below).

## The checklist

### 1. Read the source + classify
- Read the plugin's `plugins/<name>/` (each `SKILL.md`, the shared script/CLI, any `references/`
  or `portals.md`) OR the skill's `SKILL.md` + `BLOG.md`. Note the verbs (the skills), the one
  shared tool, and the design principle it demonstrates.
- `kind:` is **`tooling-cli-design`** (🛠️) — it already exists; do not invent a kind. (A CLI /
  generator / dev-tool concern: inputs → transform → output.)

### 2. Frontmatter (match the other design posts)
```yaml
---
slug: design-<name>
sidebar_position: <current max in designs/ + 1>
title: '<Role>: <what it does>'
sidebar_label: <Short Label>
description: >-
  <~50–160 chars — powers the social card + share text. What it does + the payoff.>
authors:
  - oeid
tags:
  - system-design
  - claude-code
  - <domain tags: open-data, plugins, ...>
kind: tooling-cli-design
draft: true            # ← stays true until the repo path resolves 200 (step 6)
---
```
- Find the next `sidebar_position`: `grep -h '^sidebar_position:' designs/*.mdx | sort -n | tail -1`.

### 3. The source-repo pointer — `<RepoPointer>` (the 404-gate)
Put the pointer near the top, right after `<!-- truncate -->`:
```mdx
<RepoPointer
  repo="omars-lab/claude-plugin-marketplace"
  path="plugins/<name>"
  blurb="<one line: the role + its verb-first skills over one tool>"
/>
```
- `<RepoPointer>` is **globally registered** (no import needed). See [[repo-pointer-component]].
- **FAIL-CLOSED 404-gate:** verify the path before publishing —
  `curl -s -o /dev/null -w '%{http_code}' https://github.com/omars-lab/claude-plugin-marketplace/tree/main/plugins/<name>`.
  If it is **404** (plugin not pushed yet), keep `draft: true` and leave it. Only un-draft after
  it resolves **200**. Optionally pin `commit="<sha>"` for an immutable `/tree/<sha>/<path>` link
  once the plugin is pushed at a known SHA.

### 4. The body (adapt the source into blog voice)
Structure that has worked (match the worked reference):
1. **Opener** (before `<!-- truncate -->`): why it matters → what it enables → **who benefits +
   what they'd do with it** (name concrete people, not "users" — the recurring opener miss; see
   [[refine-design-post]] SECTION-QUESTIONS). Then one line on what you built.
2. **The core idea** (the domain insight — e.g. a signal chain, a transform).
3. **Plugins are roles; skills are verbs** — the framing section + a verb-first skills table.
4. **Architecture** — a mermaid diagram: plugin → skills → tool → upstreams.
5. **The tool/CLI** — a subcommand table + the one non-obvious code snippet.
6. **A real worked example, end to end** — a sequence diagram + a results table from an
   **actual live run** (real IDs/numbers that are PUBLIC record are fine verbatim). This is the
   thesis proving itself; do not fabricate it.
7. **Why a plugin/skill and not just a script** — the judgment-vs-muscle payoff + the guardrail
   the code cannot carry (e.g. verify-don't-assert).
8. **Honest limits** (a `:::note`) — what is battle-tested vs. structurally-ready, what is a
   pointer vs. automated, scope boundaries. Honesty is the voice.
9. **Try it** (a `:::tip`) — runnable commands + "install it and ask Claude Code: …".

### 5. Body RULES that keep the build green (non-negotiable)
- **NO em-dash in the rendered body.** The `em-dash-voice-hook.sh` **BLOCKS** a literal `—` in
  `designs/*.mdx`. Use a period, colon, or parenthesis. (Watch mermaid node labels too — a `—`
  inside a code fence is not hook-blocked but still reads as AI voice; fix it.)
- **Mermaid: NO hardcoded node colors.** No `classDef`/`style ... fill:#hex`. Hardcoded fills
  break dark mode. Leave coloring to the theme; wrap flowcharts in
  `<div className="mermaid-animated flow-dot">` + a `%% animate: flow` first line for the on-brand
  animated look. (A BLOG.md draft imported from elsewhere often has hardcoded fills + a colored
  legend — strip them; move any legend into text.)
- **MDX build-breakers:** bare `<br>` → `<br/>`; unescaped `{word}` → escape or code-fence. See
  `author-blog-post`.
- **DS tokens, not literals**, in any CSS you add (rare here — the post reuses existing comps).

### 6. Hand off, then verify
- Run **`refine-design-post <path>`** on the finished post (generality/coverage/clarity/visual).
  Apply the findings; it captures new voice rules back into its guides.
- **Prove the build:** `make build` from the repo root (drafts are still compiled during a prod
  build, so a broken MDX or an unregistered component FAILS the build even though the draft page
  is excluded from output). Confirm `BUILD-EXIT: 0` / `[SUCCESS] Generated static files`.
- Fast content gates on the file: `make validate-design-clarity`, `validate-em-dash`,
  `validate-mdx-imports`, `validate-ds-tokens`, `validate-seo`, `validate-links`.

### 7. Track the un-draft (if 404-gated)
If the repo path 404s, the post ships `draft: true`. Create a TASK to un-draft once the plugin
is pushed (push + reconcile code → verify path 200 → optionally pin `commit=<sha>` → flip
`draft: false` → rebuild/deploy/verify-prod). Do NOT un-draft while the pointer 404s.

## The "post leads the code" trap

These write-ups are often authored while the plugin is still being finished, so the post can
**describe an architecture that is not committed anywhere yet** (the `local-guide` post described
a 4-skill plugin while the on-disk source was a single skill). That is fine as a DRAFT, but it is
a conscious "the writeup leads the code" state — the `draft: true` + 404-gate is what keeps it
from going live before the code is real. Flag it to the author every time it happens.

## Pointers
- **Voice + coverage audit:** `refine-design-post` (its `STYLE-GUIDE.md` + `SECTION-QUESTIONS.md`
  are the accumulated contract; `author-blog-post` reads them too).
- **The repo pointer:** [[repo-pointer-component]] (the `<RepoPointer>` component + its fail-closed
  publish rule).
- **Richer components:** `upgrade-post` (mermaid/tables/admonitions/Carousel catalog).
- **Publish:** `publish-site` (un-draft + deploy), `verify-prod-deployment` (browser render check).
- **Sibling importers:** `import-co-design`, `import-reconstruction`, `import-noteplan`.
