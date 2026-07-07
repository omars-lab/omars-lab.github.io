---
name: refine-design-post
description: Audit a /designs post for GENERALITY (no employer/trade-secret specifics — keep only the reusable pattern), MINIMALISM (does each section answer its core question-set), CLARITY (over-wordiness, redundant restatements, hedges, throat-clearing), and VISUAL LEVERAGE (prose that should be a mermaid diagram or table). Produces a prioritized findings report with quoted excerpts + suggested trims/generalizations; makes NO edits until you approve each. As you give feedback, it captures the generalizable rule back into STYLE-GUIDE.md / SECTION-QUESTIONS.md so the skill sharpens with every post. Use when "review/tighten/refine this design post", "is this too wordy / too specific", "am I leaking anything", "make this more general", "does this need a diagram", "does this answer my core questions". Pairs with author-blog-post + author-post (which read the guide files when writing new posts).
---

# Refine a design post (generality · minimalism · clarity)

Audit one `/designs` post through the author's own lens and hand back a prioritized findings
report — never silent edits. The goal is not "fewer words" for its own sake; it is a post that
**answers its core questions, stays general enough to share, and reads in the author's voice**.
The two rubric files next to this one are the memory: `SECTION-QUESTIONS.md` (what each section
must answer) and `STYLE-GUIDE.md` (voice + wording rules). Both GROW from your feedback, so post N
is audited against everything learned from posts 1..N-1.

Pairs with `author-blog-post` / `author-post` (they read the guide files when writing a NEW post),
`review-reader-experience` (whole-site IA), `upgrade-post` (the actual diagram insertion), and the
mechanical guard `scripts/validate-design-clarity.js` (see the bottom section).

## The four audit axes

Run all four on the post, in this order. Axis 1 (generality) is first because it is the author's
stated guiding theme; a leak is the one finding that must not ship regardless of prose quality.

### 1. Generality / leak-risk — is this the pattern, or the private instance?

Some of these designs were worked on with an employer. **Generalizable patterns are fine to share;
employer-specific detail is not.** For each passage, ask: *is this the reusable PATTERN, or a
SPECIFIC internal instance?* Flag and propose a generalized rewrite for:

- **Proprietary / internal names** — an employer name, a codename, an internal service/system/team
  name, an internal tool or repo. (The mechanical guard checks a seed list in
  `scripts/lib/design-leak-terms.json`; you catch the ones a word list can't.)
- **Specific internal numbers** — real scale figures, SLAs, headcount, costs, thresholds that only
  make sense inside one org. Generalize ("thousands of requests", "a large fleet") or drop.
- **One-off internal process** — "the way $TEAM does X" that isn't a transferable pattern.
- **Verbatim internal artifacts** — pasted internal diagrams, config, endpoints, ticket IDs.

The rewrite keeps the LESSON and strips the INSTANCE: "at $EMPLOYER we ran 40k RPS through the
Foobar service" → "a high-throughput service under sustained load". If a passage has no
generalizable lesson once the specifics are gone, that is itself a finding (cut it).

### 2. Minimalism / question-set coverage — does each section answer its core questions?

The author is a minimalist who leads with *why this matters → its value → what it enables → who
benefits → what they'd do with it*. Auditing for "my style" **means** checking a section answers
its core questions. Run every section against `SECTION-QUESTIONS.md` and emit an explicit
**coverage verdict** — a small table per section over its required questions:

| Section | Required question | Answered? |
|---|---|---|
| Opener | Why does this matter? | ✓ |
| Opener | Who benefits + what would they do with it? | ✗ missing |

A **missing** required answer is a ranked finding of its own (the section is thin — add the answer).
A section that answers its questions **and then keeps going** is padded (the surplus is a clarity
finding for axis 3). Start-with-why: if a section explains mechanism before it establishes why the
reader should care, flag the ordering.

### 3. Clarity / wordiness — the concrete tells

Trim these, always quoting the exact text and proposing the tighter version:

- **Redundant restatement.** The same invariant/decision stated across a Scope note, then bullets,
  then a table, then a "restated" section. State it once; reference it after. (A real case:
  `fleetplane.mdx` states its invariants three times and repeats one sentence verbatim.)
- **Same structure rendered twice.** A mermaid diagram AND an ASCII/prose redraw of the same thing.
  Keep one (usually the mermaid). Never both.
- **Throat-clearing intros.** "thus I made this post", "Here is the part that matters more than the
  mechanism." Cut the wind-up; state the point.
- **Announcing importance** instead of showing it. "the part that matters" / "importantly" — delete
  and let the content carry the weight.
- **Hedges.** "a fair amount", "about half", "sort of", trailing "…" placeholder-thoughts. Commit to
  the claim or cut it.
- **Overloaded sentences.** Semicolon-chains and nested parentheticals packing 3–4 ideas into one
  breath. Split into one-idea-per-sentence.

### 4. Visual leverage — should this prose be a diagram or table?

Flag prose that describes a **process or structure** that a reader would grasp faster as a picture:

- A set of parallel arms/options/mappings → a **2-column table** (real: the A/B/C/D experiment arms
  in `lebanese-house-hero.mdx`).
- A flow / pipeline / "input → transform → output" told in paragraphs → a **mermaid flow** (real:
  the "one progress model, two drivers" section).
- Prose that just re-explains a table already on the page → cut the prose, keep the table (real: the
  "Why three" paragraph in `premium-content-gating.mdx`).

Note the candidate and hand the actual insertion to `upgrade-post` (owns the mermaid/table/component
snippets). Do not add the diagram in this skill; propose it.

## The report format

Emit findings ranked most-impactful first (a leak outranks a wordy sentence). One block per finding:

```
[N] AXIS · file:line · SEVERITY
   > "<quoted excerpt>"
   Why: <one line>
   Suggested: <the trim / generalization / diagram-candidate>
```

Then the per-section **coverage table** from axis 2. **Make NO edits.** The author approves,
rejects, or reshapes each finding; only then do you apply the approved trims.

## Preserve the voice — do NOT flatten these

Trimming wordiness must not sand off the author's style. KEEP:

- **Question-hook openings** ("How do you put truly-locked content on a static site?").
- **Bold key-term + CAPS-for-contrast** texture, in moderation (bold = "this is the key term",
  CAPS = "notice this contrast").
- The **long-sentence-then-short-verdict cadence** ("[dense 40-word sentence]. [5-word verdict.]").
- **Reflective "why it's built this way" closers.**
- **Physical / tactile metaphors** for abstract systems (planes, spines, portals, doors).

If a proposed trim would kill one of these, don't propose it — that is voice, not wordiness.

## Capture the generalization — MANDATORY, the self-healing loop

The audit is **not done** until every finding the author acted on has been triaged into exactly one:

- **(a) reusable rule** → append it. A voice/wording rule goes in `STYLE-GUIDE.md`; a structural
  "this section must answer X" rule goes in `SECTION-QUESTIONS.md`. One rule, one home.
- **(b) one-off, not generalizable** → skip it, and say why in one line.

End the session with a **"Captured this session"** block listing exactly what was written back (or
"nothing generalizable this session"). This is the mechanism that makes the skill improve; skipping
it lets the guide rot. The `Stop` hook `refine-capture-reminder.sh` nudges if you forget.

**Reconcile mode** (`refine-design-post reconcile`): periodically re-read the two guide files, merge
near-duplicate rules, promote a rule that recurred across several audits to a stronger/higher-priority
rule, and surface contradictions for the author to resolve. This keeps the guides SHARPER with
volume, not merely longer.

## How to run it

1. Read the target post in full. Note its `kind:` (backend/frontend/agent/tooling-cli-design).
2. Read `SECTION-QUESTIONS.md` and `STYLE-GUIDE.md` — the current accumulated contract.
3. Run all four axes. Axis 2 produces the per-section coverage verdict.
4. Emit the ranked report + coverage table. Make no edits.
5. Walk the findings with the author; apply only the approved trims/generalizations.
6. **Capture**: triage each acted-on finding into STYLE-GUIDE / SECTION-QUESTIONS or skip-with-reason;
   print the "Captured this session" block.

## The mechanical guard (companion, warn-tier)

`scripts/validate-design-clarity.js` (`make validate-design-clarity`) + the PostToolUse hook
`.claude/hooks/validate-design-clarity-hook.sh` catch ONLY the greppable subset automatically, so
they don't false-positive on prose judgment:

- trailing "…"/`...` placeholder endings
- a line/sentence duplicated verbatim within one post
- a banned term from the **gitignored** `.env` key `DESIGN_LEAK_TERMS` (the real employer/proprietary
  names live there, NOT in git; `scripts/lib/design-leak-terms.json` holds only the non-sensitive
  `allow` false-match list). If `DESIGN_LEAK_TERMS` is unset the leak check simply no-ops.
- (heuristic nudges) a very thin `## H2` section; a mermaid fence immediately redrawn as ASCII

Everything else — real wordiness, hedge nuance, question-set coverage, leak-vs-fair-generalization —
is a judgment call and stays in THIS skill. The guard warns, never blocks (exit 0), so it can't
interrupt a mid-draft. When you notice a proprietary term worth banning, add it to the root `.env`
`DESIGN_LEAK_TERMS=` list (format `Name|alias1|alias2, OtherName`), not to git.
