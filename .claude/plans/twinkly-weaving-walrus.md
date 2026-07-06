# Plan: `refine-design-post` skill — audit for generality, minimalism, and clarity

## Context

**Why:** The design posts (`bytesofpurpose-blog/designs/`, 22 posts, `kind: *-design`) are the
first target for a repeatable content-quality pass. The author wants a skill they *invoke on a
post* that surfaces (1) over-wordiness, (2) places a diagram/table would beat prose, (3) concrete
trims — and, equally important, two things the initial exploration and the follow-up messages made
central:

- **Generality over specifics (trade-secret safety).** Some of these patterns were worked on with an
  employer. The guiding theme is *"information being general"*: generalizable patterns are fine to
  share; employer-specific detail, proprietary names, internal system names, and secret-sauce
  specifics are NOT. The skill must actively flag leak-risk and push each passage toward the
  reusable, generalizable pattern.
- **Minimalism + a per-section question-set.** The author is a minimalist who starts from *why this
  matters → its value → what it enables → who benefits → what they'd do with it*. There is a
  **set of questions each section should answer**. The skill must capture that question-set and use
  it as the structural rubric: a section is "wordy" when prose doesn't advance a core question, and
  "thin" when a required question goes unanswered.

**Outcome:** An invocable skill that produces a **prioritized findings report (await approval, no
edits until confirmed)** against these axes, PLUS a **living style guide inside the skill** that
grows from the author's feedback — so that when we later author a *new* design post, there is shared,
consistent guidance to write in the author's style. Bootstrapped from the real patterns already
visible in the existing design posts.

**Is it self-healing? Yes, by design — and the design makes forgetting impossible, not just
discouraged.** The skill gets better with every post because three things compound: (1) a MANDATORY
capture step ends each audit by writing any reusable lesson back into the guide files (the durable,
version-controlled accumulator), (2) a **Stop-hook reminder** — the repo's established fail-closed
nudge pattern (`changelog-archive-reminder.sh`, `discover-journey-reminder`) — fires after an audit
session and catches an un-captured lesson so the loop can't silently rot, and (3) a **reconcile mode**
periodically promotes rules that recurred across many audits into stronger, higher-priority rules and
resolves contradictions, so the guide gets SHARPER with volume, not merely longer. Post N is audited
against everything learned from posts 1..N-1.

**Decisions locked (from clarifying Qs + follow-ups):**
- **Question-set coverage is a first-class audit check.** Auditing a post for style *is* checking
  whether it answers the core per-section questions. The report must state, per section, which
  required questions are answered and which are missing — a missing answer is a finding, not just a
  side note.
- **Guidance lives in the skill's own files** (version-controlled, the house pattern) and
  `author-blog-post` / `author-post` cross-link to it. No memory file.
- **Report + await approval** is the default output; generalizations get captured only from what the
  author confirms.
- **Validation machinery IS in scope** (revised per follow-up: "ensure our plan enumerates all
  tasks including implementing validation hooks"). We ship the skill first, then add a warn-tier
  `validate-*.js` + PostToolUse hook + settings registration + Makefile target for the few
  MECHANICAL rules — following the repo's proven 4-layer pattern. Judgment-heavy axes (real
  wordiness, leak-risk nuance) stay with the skill; only greppable rules get the hook, so
  false-positives don't kill the guard.

## What we're building

A new top-level skill dir: `.claude/skills/refine-design-post/` containing:

1. **`SKILL.md`** — the invocable audit skill (the procedure + the report format).
2. **`STYLE-GUIDE.md`** — the *living* guidance list, seeded now from the real corpus patterns, grown
   from the author's feedback. This is the "shared guidance for writing in my style" artifact and the
   thing new-post authoring will read.
3. **`SECTION-QUESTIONS.md`** — the per-section question-set rubric (the minimalist "answer these
   questions per section" contract).

Splitting into three files follows the repo's own convention (`author-post` uses `homes/*.md`
subfiles) and keeps SKILL.md a lean router while the two rubric files grow independently.

## File 1 — `SKILL.md` (the audit procedure)

Frontmatter (repo house style — exactly two fields, `name` = dir name, dense `description` with
verb-first summary + em-dash specifics + `Use when …` triggers + `Pairs with …`):

```yaml
---
name: refine-design-post
description: Audit a /designs post for GENERALITY (no employer/trade-secret specifics — keep only the reusable pattern), MINIMALISM (does each section answer its core question-set: why it matters, its value, what it enables, who benefits, what they'd do with it), CLARITY (over-wordiness, redundant restatements, hedges, throat-clearing), and VISUAL LEVERAGE (prose that should be a mermaid diagram or table). Produces a prioritized findings report with quoted excerpts + suggested trims/generalizations; makes NO edits until you approve each. As you give feedback, it captures generalizable style rules back into STYLE-GUIDE.md so new posts stay consistent. Use when "review/tighten/refine this design post", "is this too wordy / too specific", "am I leaking anything", "make this more general", "does this need a diagram". Pairs with author-blog-post + author-post (which read STYLE-GUIDE.md when writing new posts), review-reader-experience (whole-site IA audit), upgrade-post (add the diagram once flagged).
---
```

Body sections:
- **H1 + framing** — one-sentence problem statement + `Pairs with` line.
- **The four audit axes** (the heart), each a short subsection with what to look for + real corpus
  examples drawn from the exploration:
  - **1. Generality / leak-risk** — flag proprietary/internal system names, employer-specific
    numbers, one-off internal processes, "we did X at $COMPANY" specifics. For each: is this the
    *generalizable pattern* or the *specific instance*? Rewrite toward the pattern. (This axis is
    listed FIRST — it's the author's stated guiding theme.)
  - **2. Minimalism / question-set coverage** — run each section against `SECTION-QUESTIONS.md`; a
    section that doesn't answer its core questions is either thin (add) or padded (cut). Start-with-why.
    **This axis produces an explicit coverage verdict per section** — a small "answered ✓ / missing ✗"
    table over the required questions — because "does it match my style" *means* "does it answer the
    core questions." A missing required answer is a ranked finding of its own.
  - **3. Clarity / wordiness** — the concrete tells from the corpus survey: redundant restatement of
    the same invariant across Scope→bullets→table (e.g. `fleetplane.mdx` states its invariants 3×;
    one phrase appears verbatim twice), the "same thing as diagram AND as ASCII/prose" duplication,
    throat-clearing intros ("thus I made this post", "the part that matters more than the mechanism"),
    hedges ("a fair amount", "about half", trailing "…"), over-nested parentheticals / semicolon
    chains packing 4 ideas into one sentence.
  - **4. Visual leverage** — prose describing a *process/structure* that should be a mermaid flow or a
    2-col table (real candidates found: `lebanese-house-hero.mdx` A/B/C/D arms → table;
    "one progress model, two drivers" → mermaid; `premium-content-gating.mdx` "Why three" prose that
    duplicates its own table). Hands to `upgrade-post` for the actual diagram insertion.
- **The report format** — a prioritized, per-finding block: `axis · location (file:line) · quoted
  excerpt · why · suggested rewrite/trim/generalization`. Ordered most-impactful first. **No edits
  until the author approves each finding.**
- **Preserve the voice** — an explicit "do NOT flatten these" list (the *good* habits from the survey:
  question-hook openings, bold-key-term + CAPS-for-contrast texture in moderation, the "long sentence
  then short verdict" cadence, reflective "why it's built this way" closers, physical/tactile
  metaphors). The skill trims wordiness WITHOUT sanding off the author's style.
- **Capture the generalization (the self-healing loop) — MANDATORY, not optional.** The audit is not
  "done" until every accepted/rejected/reshaped finding has been triaged into exactly one of:
  *(a) new reusable rule* → append to `STYLE-GUIDE.md` (voice/wording) or `SECTION-QUESTIONS.md`
  (a structural question), or *(b) one-off, not generalizable* → explicitly skipped with a reason.
  The skill's procedure ends with a **"Captured this session"** block listing what was written back,
  so the loop is visible and can't silently no-op. This is what makes post N audited against
  everything learned from posts 1..N-1 — the guide files are the durable, version-controlled
  accumulator. One-in-one-place: a rule that's really a structural question goes in SECTION-QUESTIONS,
  a voice/wording rule goes in STYLE-GUIDE.
- **Reconcile mode (gets SHARPER with volume, not just longer).** A `refine-design-post reconcile`
  path that periodically dedups/merges the accumulated rules: a rule that recurred across N audits is
  promoted to a stronger, higher-priority rule; near-duplicates merge; contradictions surface for the
  author to resolve. Without this, the guide only grows; with it, repetition across many posts
  *strengthens* the signal. This is the mechanism that makes the skill better with time, not just
  bigger.
- **How to run it** — numbered procedure: read the post → run all four axes (axis 2 emits the
  per-section question-coverage verdict) → emit the ranked report → apply approved trims → capture
  generalizations into the guide files.
- **The mechanical guard** — a short section pointing at the companion `validate-design-clarity.js`
  + hook (built in Phase B below): what it catches automatically vs. what stays a judgment call for
  the skill.

## File 2 — `STYLE-GUIDE.md` (living voice/wording rules, seeded now)

A running list, each rule as `**Rule.** rationale + a before/after or a real corpus example`. Seeded
from the survey so it's useful on day one:
- Lead with *why it matters / value / what it enables / who benefits* before mechanism (minimalist).
- Prefer the generalizable pattern; strip employer/internal specifics (the guiding theme).
- State a thing once — kill Scope→bullets→table→restated repetition; never render the same structure
  as both a diagram and ASCII/prose.
- No throat-clearing intros; no "the part that matters" importance-announcements — just state it.
- Cut hedges ("a fair amount", "about half", trailing "…").
- One idea per sentence; break semicolon-chains and nested parentheticals.
- KEEP: question-hook openings, bold-key-term + CAPS-for-contrast (moderation), long-sentence→short-
  verdict cadence, reflective closers, tactile metaphors.
- No em-dash in the rendered post body (repo-wide reader-voice rule; the em-dash hook blocks it).

A header comment states the contract: *this file is appended to as the author gives feedback; it is
the shared guidance `author-blog-post`/`author-post` read when writing a NEW design post.*

## File 3 — `SECTION-QUESTIONS.md` (the per-section question-set rubric)

The minimalist structural contract — the "set of questions each section should answer." Seed with the
author's stated openers and a first-pass per-section-type mapping, e.g.:
- **Post opener / hook:** Why does this matter? What does it enable? Who benefits and what would they
  do with it?
- **Problem / motivation:** What's the pain? Who has it? Why now?
- **Architecture / design:** What are the parts and how do they compose? Which decision is expensive to
  get wrong (lock it), which is cheap to change?
- **Decisions:** What did you choose, over what alternative, and *why*?
- **Closer:** What's the reusable takeaway someone could lift into their own project?

Marked as a living rubric — new question-sets get added here as the author refines what each section
type must answer. (This is the file most directly answering the author's "capture the set of questions
each section should answer" ask.)

## Cross-linking (small edits to existing skills)

So new-post authoring inherits the guidance:
- `author-blog-post/SKILL.md` and `author-post/SKILL.md` — add a one-line `Pairs with
  refine-design-post` pointer noting that when writing a NEW design post, read
  `refine-design-post/STYLE-GUIDE.md` + `SECTION-QUESTIONS.md` for the author's voice + section
  question-sets. (Reciprocal to the `Pairs with` in the new skill's description.)

## Validation machinery (Phase B) — the mechanical guard

Per the follow-up ("enumerate all tasks including implementing validation hooks"), we DO ship a
warn-tier guard, following the repo's proven 4-layer pattern (`validate-post-outline.js` is the model:
dual file-or-dir arg, `[warn:...]` stderr markers, `exit 0` always). It covers ONLY the mechanical,
low-false-positive rules; every judgment-heavy check stays in the skill.

**In scope for the validator (mechanical, greppable):**
- Trailing "…"/`...` placeholder-thought endings.
- A verbatim-duplicated line/sentence within one post (the "stated 3× / appears twice" tell).
- A banned-term list of employer/proprietary/internal names (a `scripts/lib/design-leak-terms.json`
  source-of-truth list the author seeds + grows) — the ONE genuinely mechanical leak check.
- Optional heuristic nudges (warn-only): a `## H2` section whose body is under N words (thin section)
  and the "mermaid block immediately followed by an ASCII/code fence redrawing it" duplication.

Explicitly OUT of scope for the validator (skill-only judgment): real wordiness, hedge detection,
question-set *coverage* (semantic), whether a passage is a leak vs. a fair generalization.

Four layers (all light, cloned from existing siblings):
- `bytesofpurpose-blog/scripts/validate-design-clarity.js` — warn-tier, scoped to `designs/`, dual
  file/dir arg. Reads `scripts/lib/design-leak-terms.json`.
- `.claude/hooks/validate-design-clarity-hook.sh` — clone of `validate-post-outline-hook.sh`; guards
  on `*.mdx`/`*.md` under `*/designs/*`, greps the `[warn:...]` marker, `exit 0` (never blocks).
- One object appended to the `PostToolUse` → `hooks` array in `.claude/settings.json`.
- `make validate-design-clarity` target (2 lines) + name added to `.PHONY` in the root `Makefile`.

**The self-healing nudge (fail-closed):**
- `.claude/hooks/refine-capture-reminder.sh` — a `Stop` hook cloned from
  `changelog-archive-reminder.sh`: after a session in which `refine-design-post` ran, it reminds
  (non-blocking, exit 0) to confirm the session's lessons were captured into `STYLE-GUIDE.md` /
  `SECTION-QUESTIONS.md`. Registered in `.claude/settings.json` under `Stop`. This is what turns the
  "MANDATORY capture" from a hope into a guarded loop — the reason the skill actually improves over
  time instead of decaying.

## Task enumeration (execution order)

**Phase A — the skill (ship first, delivers value alone):**
1. Create `.claude/skills/refine-design-post/SKILL.md` (frontmatter + four axes + report format +
   preserve-voice + feedback loop + how-to-run + mechanical-guard pointer).
2. Create `.claude/skills/refine-design-post/SECTION-QUESTIONS.md` (per-section question-set rubric,
   seeded).
3. Create `.claude/skills/refine-design-post/STYLE-GUIDE.md` (living voice/wording rules, seeded from
   the corpus survey).
4. Cross-link: add the `Pairs with refine-design-post` pointer to `author-blog-post/SKILL.md` and
   `author-post/SKILL.md` (read the guide files when writing a NEW design post).
5. Dry-run the skill on `designs/2026-07-04-fleetplane.mdx`; confirm it catches the known
   redundancy + visual-duplication + a question-coverage gap + a leak-risk flag, ranked, no edits,
   and ends with a "Captured this session" block (the mandatory feedback-loop step).

**Phase B — the mechanical guard:**
6. Create `scripts/lib/design-leak-terms.json` (seed banned-term list; author confirms entries).
7. Create `bytesofpurpose-blog/scripts/validate-design-clarity.js` (warn-tier, model on
   `validate-post-outline.js`).
8. Create `.claude/hooks/validate-design-clarity-hook.sh` (clone `validate-post-outline-hook.sh`).
9. Register the hook object in `.claude/settings.json` `PostToolUse` array.
10. Add `validate-design-clarity` target to the root `Makefile` + `.PHONY` line.
11. Create `.claude/hooks/refine-capture-reminder.sh` (Stop hook, cloned from
    `changelog-archive-reminder.sh`) and register it under `Stop` in `.claude/settings.json` — the
    fail-closed nudge that keeps the self-healing loop honest.
12. Prove the guards: run `make validate-design-clarity` over `designs/` (expect real warnings on
    `fleetplane.mdx`), plant a banned term in a scratch copy to confirm the PostToolUse hook warns on
    edit, and confirm the Stop reminder fires after an audit session.

Tracked as tasks via TaskCreate at execution time (one per numbered item), per the repo's
"track our work as tasks" convention. Commit → PR → ask-to-merge per the repo workflow; Phase A and
Phase B can be one PR (skill + its guard) since B has no value without A.

## Verification

This is content/prose tooling, not runtime code, so verification is behavioral:
1. **Structural check** — confirm the three files exist under `.claude/skills/refine-design-post/`,
   frontmatter has exactly `name` (== dir) + `description`, and the skill appears in the skills list.
2. **Dry-run the audit** — invoke the skill on one real post that the survey already flagged
   (`designs/2026-07-04-fleetplane.mdx` — has the 3× repeated invariants + verbatim-twice phrase +
   mermaid-AND-ASCII duplication). Confirm the report catches those *known* findings (redundancy,
   visual duplication) AND at least one generality/leak-risk flag AND a per-section
   question-coverage verdict (with at least one "missing ✗"), in ranked order, with no edits made.
3. **Feedback-loop check** — give one piece of mock feedback ("always prefer 'system' over the
   internal name") and confirm the skill appends a corresponding rule to `STYLE-GUIDE.md`.
4. **Cross-link check** — confirm `author-blog-post`/`author-post` now point at the guide files.
5. **Mechanical guard (Phase B)** — `make validate-design-clarity` over `designs/` exits 0 and prints
   real `[warn:...]` findings on `fleetplane.mdx` (trailing-"…", verbatim-dup). Plant a term from
   `design-leak-terms.json` into a scratch `.mdx` under `designs/`, Edit it, and confirm the
   PostToolUse hook surfaces a leak-term warning to stderr without blocking (exit 0).

Skill files aren't part of the site build; the only `make` step is the new `validate-design-clarity`
target from Phase B.
