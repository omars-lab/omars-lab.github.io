---
name: import-personalbook-role
description: Import a role from the private personalbook knowledge base into a consolidated, durable /journey/roles/<role>.md post on the blog — STRICTLY READ-ONLY on personalbook (never writes a marker, note, or edit back). Reads the role folder (Overview.md + skills/ + knowledge/ + habits/, and Activities.md as influence) and consolidates the publishable half into one role portrait: why the role matters, the skills I use, the KINDS of artifacts I produce, and the habits I keep. The private half (the intent triad obligations/desires/motivations, dated personal todos, family/finance/medical specifics, raw artifact bodies) is left behind by default. Anti-drift by design: a Step 0 reconcile re-reads personalbook's role-STRUCTURING skills (extract-role-skills, establish-role-habits, establish-role-learning, structure-role-purpose, extract-obligations-desires) so the importer's model of role anatomy never goes stale (cached in role-anatomy.json, keyed to personalbook HEAD). Fail-closed: the read-only guard blocks any personalbook write, and the role-privacy leak gate (make validate-role-privacy) blocks a post that carries private residue. TRIGGERS on "import a role", "make a /journey/roles post from personalbook", "consolidate The <Role> into a role post", "bring my roles onto the blog". Pairs with author-blog-post (frontmatter/MDX), name-post (title voice), upgrade-post (weave components), link-glossary-terms, review-reader-experience.
---

# Import a personalbook role → a durable `/journey/roles/` post

You keep a private, evolving knowledge base (**personalbook**) where you work out who you are as a
cast of **roles**. A role like *The Analyzer* is a rich folder: an `Overview.md`, a `skills/` tree, a
`knowledge/` tree, `habits/`, and `artifacts/`. This skill turns one such role into a **consolidated,
durable portrait** at `bytesofpurpose-blog/docs/journey/roles/<role-kebab>.md` — a page that answers,
every time: **why the role matters, the skills I use, the kinds of artifacts I produce, and the habits
I keep.**

## The two contracts (both fail-closed)

1. **READ-ONLY on personalbook.** This skill READS a role folder as influence and writes ONLY into the
   blog repo. It never writes a `blog:` marker, a provenance note, or any edit back into personalbook.
   This is the whole reason the skill exists here and not in personalbook (the old personalbook-side
   flow mutated your private files). The guard: `.claude/hooks/personalbook-read-only-hook.sh` BLOCKS
   (exit 2) any Write/Edit whose path contains `/personalbook/`. Do not try to route around it.

2. **NO private content in a role post.** A role folder mixes a publishable half with a deeply private
   half. The post carries only the publishable half. The guard: `scripts/validate-role-privacy.js`
   (`make validate-role-privacy`, plus the BLOCKING PostToolUse hook `validate-role-privacy-hook.sh`)
   scans the produced post and exits 2 on any private-leak signal. If it bites, you copied too much.

## The two repos

| Repo | Path | Role |
|------|------|------|
| **personalbook** (source) | `/Users/omareid/Workspace/git/personalbook` | Private. Read-only. Holds the role folders under `roles/`, `roles-*/`. |
| **bytesofpurpose-blog** (target) | `/Users/omareid/Workspace/git/projects/omars-lab.github.io/bytesofpurpose-blog` | Public Docusaurus blog. Role posts live in `docs/journey/roles/`. |

## Where the skill keeps its files

Under this skill's own dir, `.claude/skills/import-personalbook-role/`:

| File | Purpose |
|------|---------|
| `role-anatomy.json` | The reconciled model of how a role folder is STRUCTURED (Step 0). Keyed to personalbook HEAD. |
| `import-ledger.json` | One entry per imported role: source path, journey doc, spun-off posts, status, and the `excluded_files` privacy trail. |

## Step 0 — Reconcile role anatomy (anti-drift, do this first)

**A role's structure is owned by personalbook's role-STRUCTURING skills, not by this skill.** Those
skills (`extract-role-skills`, `establish-role-habits`, `establish-role-learning`,
`structure-role-purpose`, `extract-obligations-desires`) define what each subfolder IS and — crucially
— which files are the **private intent triad** to exclude. If they evolve (a role grows a new
subfolder, a new private file-kind), this skill must adapt or it will silently mishandle content.

So, at the start of a run, **reconcile**:

1. Read `role-anatomy.json`. Get personalbook HEAD: `git -C <personalbook> rev-parse HEAD`.
2. If HEAD equals `reconciled_at_personalbook_commit` → use the cache as-is. Do not re-read.
3. If HEAD differs, check whether the structuring skills changed:
   `git -C <personalbook> diff --name-only <cached> HEAD -- .claude/skills/extract-role-skills .claude/skills/establish-role-habits .claude/skills/establish-role-learning .claude/skills/structure-role-purpose .claude/skills/extract-obligations-desires`
   - **Empty** → just bump `reconciled_at_personalbook_commit` to HEAD; keep the model.
   - **Non-empty** → re-read those skills' `SKILL.md` descriptions (they say what each subfolder means
     + which files are private), then update `role-anatomy.json` (subfolders, publishable flags, the
     `private_always` list, any new private signal). If a new private file-kind appears, ALSO add its
     signal to `scripts/validate-role-privacy.js` in the same change (the leak gate is the backstop).

`role-anatomy.json` is the source of truth the rest of the run reads to decide what to include vs
exclude.

## What a role folder holds (the current anatomy)

Read `role-anatomy.json` for the authoritative, reconciled version. In short:

| Source | Publishable? | Use it for |
|--------|-------------|-----------|
| `Overview.md` | ✅ | Why the role matters (Core Philosophy), what it does (Key Focus Areas), Role evolution, and the Skills/Habits index-table LABELS + essences. |
| `skills/<x>/SKILL.md` | ✅ | The "Skills I use" section: summarize each skill's `name` + `description` essence (transferable process). |
| `knowledge/<x>.md` | ✅ (scan per-file) | The "What I know" section: name the concepts/distinctions, summarize where transferable. |
| `habits/<x>/HABIT.md` | ✅ | The "Habits I keep" section: name + `frequency` cadence + what it does (from `description`/Purpose). |
| `artifacts/<x>.md` | ❌ **bodies never** | Describe the KINDS of artifacts (from the Overview Artifacts-table labels + skill names). **Never copy an artifact body.** |
| `artifacts/{obligations,desires,motivations}.md` | ❌ **hard-private** | The intent triad. Never surfaced, even summarized. |
| learning cluster (`learning-plans.md`, `reading-list.md`, ...) | ⚠️ themes only | Optional "learning next" note; treat bodies as private (named mentors/resources leak). |
| `Activities.md`, `Responsibilities.md` | as influence | Enrich "what the role does"; can seed a spun-off `/initiatives` framework post. Not copied wholesale. |

**Every `artifacts/*.md` carries `blog: no` and contains personal application (dated todos, private
URLs, family/possession specifics).** That is why the rule is: describe the *kind* of artifact, from
the safe scaffolding, not the file contents.

## The role-doc shape (the output)

`docs/journey/roles/<role-kebab>.md`, frontmatter per `author-blog-post` conventions:

```yaml
---
slug: /roles/<role-kebab>            # absolute, instance-relative (journey is a docs instance)
title: 'The <Role>'
sidebar_label: '<emoji> The <Role>'
description: '<~50-160 chars: what this role is>'
authors: [oeid]
tags: [self, roles, <topic tags>]
date: <YYYY-MM-DDThh:mm>             # the role's authorship date (e.g. Overview.md authored_date)
draft: true                          # always start as draft
---
```

Body sections (the required spine, enforced warn-tier by `validate-role-doc.js`):

- A short hook + `<!-- truncate -->`.
- **`## Why this role matters`** — from Core Philosophy (the reason-for-being + the role's scope).
- **`## What the role does`** — Key Focus Areas / essence.
- **`## Skills I use in this role`** — a table of the skills (name + essence). Link out to any
  spun-off framework post here.
- **`## Artifacts I produce`** — the KINDS of artifacts (bulleted), from safe scaffolding.
- **`## Habits I keep`** — name + cadence + what each does.
- **`## What I know in this role`** — the concepts/distinctions (optional but common).
- **`## Role evolution`** — aliases/history from `Overview.md` (optional).

**Content rules:** no em-dash (`—`) or `--` sentence-dash (the `em-dash-voice-hook.sh` BLOCKS it);
`description` in the ~50-160 band; escape stray `{braces}` / bare `<br>` (MDX). Follow
`author-blog-post` for the rest.

## Procedure

Track the import as a task (one per role). Then:

1. **Step 0 reconcile** (above) — refresh `role-anatomy.json` if needed.
2. **Read the role folder** (read-only): `Overview.md`, each `skills/*/SKILL.md` (name + description +
   metadata.scope), each `habits/*/HABIT.md` (name/description/frequency/Purpose), each
   `knowledge/*.md` (scan for the concept + any leak), and `Activities.md` for influence. Do NOT read
   artifact bodies into the post; you only need the Overview's Artifacts-table LABELS to name the
   kinds.
3. **Pick the title + slug** — `The <Role>` / `/roles/<role-kebab>`. If the role name needs a voice
   check, use `name-post`.
4. **Derive the date** — the role's authorship date (e.g. `Overview.md`'s `authored_date`, or the
   oldest plausible authorship you can see). Not today, unless nothing else is available.
5. **Author the doc** into `docs/journey/roles/<role-kebab>.md`, summarizing from the SAFE sources
   only, per the shape above. Draft `true`.
6. **Run the gates**: `make validate-roles` (the fail-closed leak gate + the structure check),
   then the doc is also covered by the em-dash / structure / SEO hooks on save. If the leak gate
   bites, generalize the flagged line and re-run — do not weaken the guard to pass (only tighten it
   if it is a genuine FALSE POSITIVE on legitimate narrative, and prove the real leak is still caught).
7. **Update `import-ledger.json`** — add/update the role entry: `journey_doc`, `slug`, `status:
   drafted`, `spun_off_posts`, `excluded_files` (the privacy trail), `reconciled_at_personalbook_commit`.
8. **Confirm personalbook is unmutated**: `git -C <personalbook> status` shows no changes.
9. **Enrich (optional)** — hand to `upgrade-post` to weave components, `link-glossary-terms` for the
   first genuine term use. Then publish (drop `draft:`) as a separate, deliberate step.

## The reader landing

The roles topic has a landing at `docs/journey/roles/README.mdx` (`slug: /roles`, pinned as
`👋 Welcome`, `sidebar_position: 0`). It explains the roles model and indexes the role docs. The
journey sidebar is **autogenerated**, so a new role doc appears automatically — no sidebar edit. When
you add the first role of a new kind or want the landing to point at it, update the README's
"Browse the roles" pointer.

## A spun-off framework post is fine (and encouraged)

A role can BOTH have a role doc AND spin off a focused `/initiatives` post. *The Analyzer* did: the
narrow self-quantification loop became `a-framework-for-quantifying-yourself` (a real `framework`
post), and the role doc is the durable index that links to it. When a role's material contains a
self-contained, transferable framework, consider spinning it off (via `organize-post` /
`author-blog-post`) and linking it from the role doc's Skills section. Do not force everything into
the role doc.

## Worked example: The Analyzer

`docs/journey/roles/the-analyzer.md` is the reference import. It consolidates the role's 5 skills
(tracking / measuring / analyzing / reporting / determining-value), the 2 habits (weekly reports,
monthly metric review), the knowledge distinctions (measuring-vs-tracking, value, reporting), and the
Core Philosophy, describes the artifact KINDS (metric catalogs, trackers, dashboards, value
assessments) without touching an artifact body, and links to the spun-off framework post. Its
`import-ledger.json` entry lists the excluded private files. It passes `make validate-roles`.

## Verification

- `make validate-roles` passes (leak gate + structure).
- `git -C <personalbook> status` is clean after a run (read-only proven).
- `make start`, visit `/journey/roles` and `/journey/roles/<role>` — renders, appears under 🎭 Roles.
- The leak gate BITES on a planted private line (prove it), then passes once removed.

## Pairs with

`author-blog-post` (frontmatter/MDX), `name-post` (title voice), `upgrade-post` (components),
`link-glossary-terms`, `review-reader-experience` (IA). Personalbook's role-structuring skills
(`extract-role-skills` et al.) are the PREREQUISITE that shapes a role folder; this skill only reads
their output.
