---
name: feature-docs
description: Author or reconcile a feature "why-doc" — a features/<id>.md that records WHY a feature exists and pins it to the exact code that implements it via GitHub-permalink anchors, with content-hash drift detection that auto-heals code moves and warns on real drift. Use when documenting the rationale behind a non-obvious design decision, when `make features-check` reports DRIFT, or when adding/reconciling a why-doc. Pairs with the diagram components + the governance validators the seed docs describe.
---

# Feature why-docs

A **why-doc** (`features/<id>.md` at the repo root) records **why** a feature exists and links
the **exact code** that implements it. It is the durable rationale behind a design decision,
pinned to the code so it cannot silently drift out of sync. NOT API docs, NOT a changelog.

Full spec + the drift model: `features/README.md`. This skill is the guided flow.

## When to reach for it

- You made a non-obvious design decision and want the WHY to survive (a fail-closed gate, a
  layout heuristic, a security boundary, a workaround with a reason).
- `make features-check` (or the PostToolUse hook) reports **DRIFT** on an existing doc.

Do NOT write a why-doc for self-explanatory code, or restate what a validator's header already
says. A why-doc earns its place by capturing rationale that is NOT obvious from the code.

## Authoring a new why-doc

1. **Pick a stable `<id>`** (kebab-case). Create `features/<id>.md` with three sections:
   - `## Why` the durable prose: the problem, the decision, the tradeoff. This is the part a
     human re-reads. Write it so it still makes sense after the code moves.
   - `## Code` one or more anchors, each a **bare** GitHub permalink + a short label:
     ```
     - https://github.com/omars-lab/omars-lab.github.io/blob/<sha>/<path>#L<start>-L<end> - label
     ```
     Get `<sha>` from `git rev-parse HEAD`; get the `<path>` (repo-relative) and the line range
     from the real code. Pick a range that is the MEANINGFUL block, not the whole file.
   - `## Notes` (optional) anything else.
2. **Seed the cache:** `make features-seed`. This writes the block's content hash into
   `features/.anchors.json` (committed).
3. **Verify:** `make features-check` should report the anchor as `ok`.

The `features/` dir is exempt from the link-hygiene gate (bare permalinks are the intended
format here, parsed by the feature-docs engine), so the bare URLs will not trip validate-links.

## Reconciling DRIFT (the only path allowed to re-bless changed content)

When the check reports `DRIFT` on `features/<id>.md#...`, the code behind a rationale changed
IN PLACE (a move would have auto-healed silently). This is a signal to review intent:

1. **Read the `## Why`.** Does the rationale still hold given the code change?
   - **Yes, still true:** the why is fine, the code just evolved. Re-pin: update the anchor's
     line range if needed, then `make features-seed` to write the new hash. (Seeding is the
     ONLY way to re-bless changed content, and it is deliberate.)
   - **No, the why is now wrong/stale:** rewrite the `## Why` to match reality FIRST, then
     re-pin as above. Never re-seed a stale why just to silence the check.
2. **Confirm:** `make features-check` reports `ok`.

The invariant the tooling enforces: a hook may only re-key **unchanged** content (a move); it
**never** auto-blesses changed content. That is your job, via this reconcile flow.

## The mechanics (so you can reason about a surprising result)

- Drift is **content-hash based**, normalized (trailing whitespace + blank-line runs ignored),
  so formatting-only edits do not trip it.
- On a hash miss, the engine scans the repo for the same block hash (+ 3 lines of context to
  disambiguate identical blocks). One unambiguous hit elsewhere = a **move** (auto-healed). No
  hit = real **drift**. Two identical blocks with no distinguishing context = reported, not
  guessed.
- `make features-check` exits non-zero on any unreviewed drift/missing/uncached, so it can gate
  a pre-commit or the deploy pre-flight.

## Pairs with

`features/README.md` (the spec), and the seed docs describe real features: the diagram
legibility gate (`diagram-legibility-gate.md`) and the used-but-not-imported MDX check
(`mdx-imports-check.md`).
