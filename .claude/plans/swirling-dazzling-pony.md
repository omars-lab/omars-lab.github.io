# Plan: `extract-general-pattern` skill

## Context

You have concrete design posts in `/designs` (e.g.
`bytesofpurpose-blog/designs/2026-06-21-ecommerce-site-scanner-and-lead-generation-engine.mdx`
and `2026-06-22-self-healing-storefront.mdx`) that were imported from work-repo HLDs. Each of
these is a specific-business write-up, but **many reusable patterns are intertangled inside a
single post** (a build-vs-buy decision method, a crawl-then-enrich pipeline, a self-healing
experiment loop, confidence-tagged diagram provenance, and so on).

You want to eventually **export** the reusable, generalized versions of those patterns to another
blog. We agreed to **start narrow**: v1 is a skill that turns a concrete design post into
**generalized, standalone `/designs` posts** (one per pattern) in *this same* blog. The
external-blog export and any deterministic transformer come **later**.

This is a **judgment-guided authoring skill** (like `import-marketplace-plugin` /
`refine-design-post`), NOT a deterministic Node pipeline (like `import-co-design`). It adds no
hook, Make target, or generated asset — it leans on existing enforcement.

## Requirements locked via Q&A

- **Disentangle first**, then **agree on patterns via `AskUserQuestion` before writing anything**.
- **One generalized `/designs` post per approved pattern.**
- Produce them **one at a time, with a checkpoint between each** (single-post authoring guidance
  applied per pattern).
- Each extracted post is **standalone** (no backlink to the source post).
- Skill **drafts** the general post, then **hands to `refine-design-post`** for the
  GENERALITY/CLARITY audit (reuse, don't duplicate, that machinery).

## The flow the SKILL.md encodes

1. **Read the source `/designs/*.mdx`.** Parse its HLD section skeleton (§6.2 Architecture Options,
   §6.5 Key Design Decisions, §7 Components/Data Model, §7.3 Data Flows, §8 Use Cases, §10 Diagrams,
   §11 NFRs) — these sections are where reusable patterns hide.

2. **Disentangle → surface candidate patterns.** For each: a **name** (the reusable mechanism), the
   **section(s)** it lives in, a **one-line reusable claim** ("what stays true once the specific
   business is removed"), a proposed **`kind:`** (`system-design`/`backend-design`/`frontend-design`/
   `agent-design`/`tooling-cli-design`, source of truth `scripts/lib/blog-kinds.json`), and a
   proposed **slug** `design-<pattern-kebab>`.

3. **Agree via `AskUserQuestion`** (multiSelect): you pick which candidates become posts. Nothing is
   written before you choose. (This is the "agree on patterns via ask-question tool first" rule.)

4. **Per approved pattern, one at a time (checkpoint between each)** apply the **single-post authoring
   guidance**:
   - **De-specify** (reuse `refine-design-post` GENERALITY + `STYLE-GUIDE.md`): remove personas /
     GTM / employer specifics; keep the abstract mechanism.
   - **Frontmatter:** `slug: design-<pattern>`, `kind:`, `draft: true`, `authors: [oeid]`,
     `sidebar_position:` = current designs max + 1 (currently 21 → next 22), a `description:`
     (~50–160ch for SEO/share), `tags:`. **No `source:` provenance block** (standalone).
   - **Body:** de-em-dash (the `.claude/hooks/em-dash-voice-hook.sh` **BLOCKS** any `—` in
     `designs/*.mdx`, incl. mermaid/frontmatter); MDX-clean (`<br/>`, escape stray `<`, `{braces}`);
     mermaid with **no hardcoded fills** (theme colors it); keep the worked example generic.
   - **Voice:** neutralize "I built this specific thing" into reusable pattern voice.
   - Then **hand to `refine-design-post`** for the audit with your approval.
   - **Checkpoint** before starting the next approved pattern.

5. **Validate** each new post: `make build` (or at minimum the em-dash + MDX + `make validate-seo`
   `--file`-scoped checks). Post stays `draft: true` until you publish.

## Files to create

```
.claude/skills/extract-general-pattern/
  SKILL.md          # the flow above + frontmatter/MDX/em-dash rules; a "Not yet" section listing
                    #   the deferred external-blog export + batch-all mode.
  PATTERN-TYPES.md  # (living) catalog of recurring pattern SHAPES worth extracting from an HLD
                    #   (architecture-option tradeoff, pipeline/dataflow, decision-record, NFR
                    #   strategy, use-case model, diagram-provenance) + how to recognize each.
                    #   Grows as you approve/reject candidates (the refine-design-post capture pattern).
```

## Registration touchpoints (repo conventions)

1. **`CLAUDE.md` Skills map table** — add a row for `extract-general-pattern` in the authoring
   cluster, cross-linking `refine-design-post`, `import-co-design`, `author-blog-post`, `manage-hubs`.
2. **Memory** — add one memory file + a `MEMORY.md` index line recording the skill and that the
   external-export step is deferred (so a future session knows v1 scope).
3. No `settings.json` / hook change (no new automated behavior).

## Reused existing assets (do not reinvent)

- `.claude/skills/refine-design-post/` — its **GENERALITY** dimension + `STYLE-GUIDE.md` +
  `SECTION-QUESTIONS.md` are the abstraction/voice authority; the new skill routes to it.
- `bytesofpurpose-blog/scripts/lib/blog-kinds.json` — the `*-design` kinds + emoji.
- `.claude/hooks/em-dash-voice-hook.sh`, `make validate-seo` — existing enforcement the drafts pass.
- `import-marketplace-plugin` SKILL.md — the house shape for a judgment-guided `/designs` authoring skill.

## Explicitly deferred (SKILL.md "Not yet")

- Exporting to an external blog/repo (the "move later").
- Batch-producing every approved post without per-post checkpoints.
- A deterministic Node transformer.
- The source posts are not modified; no extracted post is authored as part of building the skill.

## Verification

- New `SKILL.md` frontmatter has `name` + a single rich `description` line in house style.
- Sanity-run steps 1–3 **in discussion** against the ecommerce-scanner post (show you the candidate
  patterns the skill would surface) so you can validate the disentangling before any post is authored —
  optional, on your say-so.
- When you later run the skill for real, each produced draft must `make build` clean and pass the
  em-dash hook + `validate-seo`.
