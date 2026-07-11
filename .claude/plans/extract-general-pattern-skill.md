# Plan: `extract-general-pattern` skill

## Goal

A new skill that reads one of your concrete `/designs` posts (e.g. the ecommerce-scanner or
self-healing-storefront HLDs) and turns the **reusable patterns intertangled inside it** into
**generalized, standalone `/designs` posts** — the specific business stripped out, only the
reusable mechanism left.

## Scope for v1 (explicitly narrowed per our Q&A)

- **IN:** source design post → **disentangle** its many intertangled patterns → **AskUserQuestion
  to agree** on which to extract → produce **one general `/designs` post per approved pattern**,
  **one at a time with a checkpoint between each** → hand each draft to `refine-design-post`.
- Extracted posts are **standalone** (no backlink to the source post).
- **LATER (out of scope, noted in SKILL.md "Not yet"):** actually exporting to another external
  blog/repo; batch-producing all posts without per-post checkpoints; a deterministic transformer.

## The flow the skill encodes

1. **Read the source post** (a `/designs/*.mdx`). Parse its section structure (the HLD skeleton:
   §6.2 Architecture Options, §6.5 Key Design Decisions, §7 Components/Data Model, §7.3 Data Flows,
   §8 Use Cases, §10 Diagrams, §11 NFRs). These sections are where reusable patterns hide.

2. **Disentangle → surface the patterns.** Produce a candidate list: each pattern gets
   - a **name** (the reusable mechanism, e.g. "crawl-then-enrich prospect pipeline",
     "build-vs-buy comparison-matrix decision", "self-healing experiment loop",
     "confidence-tagged diagram provenance"),
   - **where it lives** in the post (section refs),
   - a **one-line reusable claim** ("what stays true when you remove this specific business"),
   - a proposed **`kind:`** (`system-design` / `backend-design` / `frontend-design` /
     `agent-design` / `tooling-cli-design`) and a proposed **slug** `design-<pattern-kebab>`.

3. **Agree via AskUserQuestion.** Present the candidate patterns as options (multiSelect) so you
   pick which become posts. Nothing is written before you choose. (This is the "told to apply and
   agree on patterns via ask-question tool first" requirement.)

4. **Per approved pattern, one at a time (checkpoint between each):** apply the **single-post
   authoring guidance** (the core of SKILL.md) to generalize that one pattern into a new draft
   `/designs` post:
   - **De-specify:** remove personas/GTM/employer specifics, keep the abstract mechanism
     (reuses `refine-design-post`'s GENERALITY dimension + STYLE-GUIDE).
   - **Frontmatter:** `slug: design-<pattern>`, `kind:`, `draft: true`,
     `sidebar_position:` = current max+1 (currently 21 → next is 22), `authors: [oeid]`,
     a `description:` (~50–160ch), `tags:`. **No `source:` provenance block** (that's repo-work
     specific and the post is standalone).
   - **Body:** de-em-dash (the `em-dash-voice-hook.sh` **BLOCKS** `—` in `designs/*.mdx`);
     MDX-clean (`<br/>`, escape stray `<`, `{braces}`); mermaid with **no hardcoded fills** so
     the theme colors it; keep the pattern's own worked example generic (not the real business).
   - **Voice:** neutralize "I built this specific thing" into the reusable pattern voice.
   - Then **hand to `refine-design-post`** for the GENERALITY/CLARITY audit with your approval.
   - **Checkpoint:** confirm this post before starting the next approved pattern.

5. **Validate:** `make build` (or at least the em-dash + MDX + `validate-seo --file` checks) on
   each new post; note the draft stays `draft: true` until you publish.

## Files to create

```
.claude/skills/extract-general-pattern/
  SKILL.md          # the flow above: disentangle → AskUserQuestion agree → per-pattern single-post
                    #   authoring guidance → hand to refine-design-post; frontmatter/MDX/em-dash rules;
                    #   a "Not yet" section for the deferred external-export + batch modes.
  PATTERN-TYPES.md  # (living) a small catalog of the recurring pattern SHAPES worth extracting from
                    #   an HLD (architecture-option tradeoff, pipeline/dataflow, decision-record,
                    #   NFR strategy, use-case model, diagram-provenance) with how to recognize each.
                    #   Grows as you approve/reject candidates — the "sharpen with every post" pattern
                    #   refine-design-post uses.
```

No new Node transformer, hook, Make target, or generated asset in v1 — this is a **judgment-guided
authoring skill** (like `import-marketplace-plugin`), not a deterministic pipeline (like
`import-co-design`). It leans on existing enforcement (em-dash hook, validate-seo, refine-design-post).

## Registration touchpoints (keep the repo's conventions)

1. **`CLAUDE.md` Skills map table** — add a row for `extract-general-pattern` under the authoring
   cluster, cross-linking `refine-design-post`, `import-co-design`, `author-blog-post`, `manage-hubs`.
2. **Memory** — add one `reference`/`project` memory + a `MEMORY.md` index line pointing at the skill
   and its v1 scope (so a future session knows the external-export step is deferred).
3. No `settings.json` hook change (no new automated behavior).

## What I will NOT do in this plan

- Not write any extracted pattern post yet (the skill is the deliverable; running it on the two
  posts is a follow-up you trigger).
- Not build the external-blog export mechanism (deferred by your "move later").
- Not touch the two source posts.

## Verification

- Lint the new SKILL.md frontmatter (`name`/`description` present, description is a single rich line
  in house style).
- Dry-run the *reasoning* of step 1–3 against the ecommerce-scanner post in the plan discussion (show
  you the candidate patterns it would surface) so you can sanity-check the disentangling before we
  ever author a post — optional, on your say-so.
