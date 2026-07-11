# Authoring a `/designs` post

**Home:** the Designs blog instance (`bytesofpurpose-blog/designs/`, route `/designs`).
**File:** `designs/YYYY-MM-DD-<kebab>.mdx` (always `.mdx` — designs use components + mermaid).

## First fork: import or hand-author?

- **From a work-repo HLD** (`~/Workspace/work-git/docs/architecture/co-designs/public/CO-DESIGN-*-hld.md`)
  → do NOT hand-write. Use the **`import-co-design`** skill: its Node transformer de-em-dashes,
  fixes MDX, classifies diagrams, and is idempotent (re-run on source edits). Stop here.
- **From a pasted plan, a spec, or from scratch** → hand-author with this guide.

## Pick the `kind:` by structural nature

The `kind:` drives the sidebar emoji and the outline contract (`validate-post-outline.js`). Choose
by what the design STRUCTURALLY is, not by topic:

| kind | emoji | Use when the design is… | Outline it must contain |
|---|---|---|---|
| `system-design` | 🏗️ | a whole-picture HLD (paints the entire idea) | an architecture view + a Decisions heading |
| `backend-design` | ⚙️ | services / pipelines / data / infra / deploy | an architecture view + a Decisions heading |
| `frontend-design` | 🎨 | a UI / client experience | a UI/structure view + a Decisions heading |
| `agent-design` | 🤖 | an autonomous/LLM agent (its loop, tools, guardrails) | the agent's loop/capabilities + a Decisions heading |
| `tooling-cli-design` | 🛠️ | a CLI/tool (its input→output transform / recipe) | the transform/recipe + a Decisions heading |
| `design-story` | 📐 | a NARRATIVE about a design (thought-flagged) | narrates the WHY, links to the HLD |

"Architecture view" is satisfied by a ` ```mermaid ` fence, a `<DiagramWithFootnotes>`, or a
heading like Architecture/Components/Data flow/Pipeline/System. "Decisions" is satisfied by a
heading matching `Key Decisions` / `Decisions` / `Trade-offs`.

## Frontmatter template

```yaml
---
slug: design-<kebab>                    # design posts are prefixed design-
sidebar_label: <Short Label>            # a few words; the sidebar entry
sidebar_position: <next free integer>   # grep '^sidebar_position:' designs/*.mdx | sort -n | tail -1, then +1
title: '<Title: reads as the concept/system>'
description: >-                          # 50 to 160 chars, no em-dash; feeds og + share
  <one or two sentences>
authors:
  - oeid
tags:
  - system-design
  - architecture
  - <2-3 more>
kind: backend-design                    # per the table above
draft: true                             # designs land as drafts; publish-site un-drafts
mockups: ./_mockups/<kebab>.mdx         # only if you add a mockup sidecar (below)
---
```

## Body shape (mirror the other agentic designs)

**Open with USERS & USE CASES, before the Scope note.** The first section establishes the people and
what they will do — who are we building for, what problem do they have, what will we build to fix it,
how will they use it, how does it make their life better — and carries a **use-case diagram**
(`<UseCaseDiagram>`: actors outside a system boundary, use-case ovals; see `author-mermaid` for the
component + a mermaid fallback). Only after that comes the `:::note[Scope]` admonition, then
`<!-- truncate -->`, then the body. This ordering is a REQUIRED rule enforced by `refine-design-post`
(SECTION-QUESTIONS.md "Users & use cases"); a post that opens on the system is an ordering finding.

A proven arc after the users/use-cases opening (see `designs/2026-07-04-fleetplane.mdx`):
Scope → Executive Summary (problem / solution / value; lead with a relatable "you") → an animated
architecture diagram → components / data model → a **Key Decisions** section → closing → an OPTIONAL
**North Star / vision** section (where the foundation could go NEXT, framed as one direction among
others, NOT the committed goal — the honest home for an ambition the name must not overclaim). When
the North Star names more than one direction, show them diverge with a **"fork in the road"** diagram
(a `flowchart` fanning the current foundation out to N future paths; see `author-mermaid`).
Rich-component catalog: `upgrade-post`.

- **Animate the first mermaid block**: wrap it in `<div className="mermaid-animated flow-dot">` …
  `</div>` and add `%% animate: flow` as the first line inside the fence. Dashes march; flow
  diagrams get a traveling dot. Do NOT hardcode `classDef`/`style fill:` — the theme colors it in
  light + dark. Mermaid labels that need a dash use `&#8212;`.
- An **ER diagram** (` ```mermaid erDiagram `) is the clean way to render a star schema / data model.

## Mockups + walkthroughs (the "what it looks like" upgrade)

Design posts paint the screens with the **`_mockups/<kebab>.mdx` sidecar** — a default-exported
`Mockups()` component of framed `<Mockup>` blocks and optional `<Walkthrough>` animations. This
keeps the post body clean and is the pattern every agentic design uses. For a HAND-AUTHORED post
you wire it yourself (no importer):

1. Author `designs/_mockups/<kebab>.mdx` (`import {Mockup, Walkthrough} from '@omars-lab/blog-ui'`).
2. Add `mockups: ./_mockups/<kebab>.mdx` to the post frontmatter.
3. After `<!-- truncate -->`, hand-add `import Mockups from './_mockups/<kebab>.mdx';` then `<Mockups />`.

Deep skill for the component APIs, step types, and the Claude-terminal scene: **`author-walkthrough`**.
Worked hand-authored example: `designs/_mockups/fleetplane.mdx`.

## Write it in the author's voice (read the guide files)

Before drafting, read the two living rubric files in the **`refine-design-post`** skill so the post
is born on-voice and answering the right questions:

- **`.claude/skills/refine-design-post/SECTION-QUESTIONS.md`** — the set of questions each section
  must answer (lead with *why it matters → value → what it enables → who benefits → what they'd do
  with it*, then mechanism). Draft each section to answer its required questions.
- **`.claude/skills/refine-design-post/STYLE-GUIDE.md`** — the voice + wording rules (state a thing
  once, cut hedges, one idea per sentence, keep the question-hook opening and the reflective closer)
  and the **generality** rule: prefer the reusable pattern, strip employer/proprietary specifics.

After drafting, run **`refine-design-post`** on the post to audit + tighten it.

## Validate before commit

- `make validate-outline` (or `node scripts/validate-post-outline.js <file>`) — the kind's outline.
- `make validate-design-clarity` — the mechanical clarity/leak guard (trailing "…", verbatim dupes,
  banned proprietary terms). Warn-tier.
- `make validate-seo` — description/title length; `make validate-links`.
- No em-dash: `grep -c $'—' <file> <sidecar>` must be 0.
- **Render check** (mermaid + mockups + walkthroughs are client-rendered and draft-only): serve the
  dev server and view/Playwright the page — see `serve-locally` + `author-walkthrough`'s verify block.

## Cross-links

`refine-design-post` (voice + section-questions + generality — read its guide files BEFORE drafting,
audit with it AFTER) · `import-co-design` (HLD path) · `author-walkthrough` + `upgrade-post`
(components) · `implement-with-design-system` (on-brand CSS) · `author-post` (MDX pitfalls) ·
`author-mermaid` (diagram syntax) · `publish-site` (go live).
