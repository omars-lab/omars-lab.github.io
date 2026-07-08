---
name: refine-design-post
description: Audit a /designs post for GENERALITY (no employer/trade-secret specifics — keep only the reusable pattern), MINIMALISM (does each section answer its core question-set), CLARITY (over-wordiness, redundant restatements, hedges, throat-clearing), VISUAL LEVERAGE (prose that should be a mermaid diagram or table), and the READER'S FIRST READ (is there a relatable story, am I being bombarded with information, what are the core concerns + which section is each in, do the existing visuals actually guide me — produces a concern map). Produces a prioritized findings report with quoted excerpts + suggested trims/generalizations; makes NO edits until you approve each. As you give feedback, it captures the generalizable rule back into STYLE-GUIDE.md / SECTION-QUESTIONS.md so the skill sharpens with every post. Use when "review/tighten/refine this design post", "is this too wordy / too specific", "am I leaking anything", "make this more general", "does this need a diagram", "does this answer my core questions", "can a reader follow this / relate to it", "am I bombarding the reader", "what are the core concerns and where". Pairs with author-blog-post + author-post (which read the guide files when writing new posts), review-reader-experience (whole-site IA).
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

## The five audit axes

Run all five on the post. Axes 1 to 4 are EDITOR lenses (is it general? does it answer the
questions? is it wordy? should it be a diagram?). Axis 5 is the READER lens: read the post cold, as
someone arriving for the first time, and ask whether you can actually follow it. Do axis 1
(generality) first because it is the author's stated guiding theme; a leak is the one finding that
must not ship regardless of prose quality. Do axis 5 LAST, after you understand the post well enough
to judge how a newcomer would experience it.

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

**Name vs purpose — does the title describe what the tech actually DOES?** A separate accuracy check
(same axis because both are "does the post misrepresent itself"): read the title and the system name,
then read what the design actually builds, and ask *do they match?* A name that OVERCLAIMS or
mislabels is a ranked finding — it sets a false expectation the body then contradicts. The motivating
case: a system named "**A Control Plane for a Claude Code Fleet**" implies an ADMIN control plane (you
push commands, you administer the fleet), but the design actually builds a **reporting / observability
mechanism** (it consolidates usage metrics across sessions; it does not administer anything). The fix
is a name that matches the built purpose (e.g. a "fleet reporting / observability" framing), and the
control-plane ambition moves to an optional North Star section (see `SECTION-QUESTIONS.md`) as a
possible FUTURE direction, not a description of what exists. Distinct from `name-post` (title VOICE —
does an idea read as a question, an initiative as done): this is title ACCURACY — does the name tell
the truth about the purpose. Propose the corrected name; the author decides.

### 2. Minimalism / question-set coverage — does each section answer its core questions?

The author is a minimalist who leads with *users and use cases → why this matters → its value → what
it enables → who benefits → what they'd do with it*. Auditing for "my style" **means** checking a
section answers its core questions. Run every section against `SECTION-QUESTIONS.md` and emit an
explicit **coverage verdict** — a small table per section over its required questions:

| Section | Required question | Answered? |
|---|---|---|
| Users & use cases (FIRST) | Who are we building for? | ✓ |
| Users & use cases (FIRST) | How will they use it (use cases)? | ✗ missing |
| Users & use cases (FIRST) | Use-case diagram present? | ✗ missing |
| Opener | Why does this matter? | ✓ |

**The one hard structural rule: a design post MUST open with users & use cases before Scope/CX.** The
first section answers who / what problem / what we build / how they use it / how it improves their
life, and carries a **use-case visual** (default `<UseCaseDiagram>`). A post that opens on the system
(a Scope note or Executive Summary first, with no users/use-cases section ahead of it) is a ranked
**ordering finding**, and a missing use-case visual in that section is its own finding.

A **missing** required answer is a ranked finding of its own (the section is thin — add the answer).
A section that answers its questions **and then keeps going** is padded (the surplus is a clarity
finding for axis 3). Start-with-users: if a section explains mechanism or CX before it establishes who
the post is for and how they use it, flag the ordering.

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
- The **users + use cases** opening → a **`<UseCaseDiagram>`** (required, per axis 2).
- **Multiple future directions** in a North Star / vision section → a **"fork in the road"** diagram:
  a `flowchart` where the current foundation fans out to N divergent future-direction nodes, so the
  reader sees the options DIVERGE rather than reading them as a list. Two or more directions warrant
  the fork; one does not. See the "fork in the road" recipe in `author-mermaid`.
- A **long vertical stack of CX mockups** ("what it looks like") → wrap in **`<Tabs>`/`<TabItem>`**,
  one tab per self-contained surface, so the reader PICKS a surface instead of scrolling past every
  one. A mockups sidecar with N (~3+) stacked `<Mockup>`/`<Walkthrough>` blocks is a wall of visuals
  (the visual analogue of axis-5 bombardment). One or two mocks can stay stacked; a big stack tabs.

Note the candidate and hand the actual insertion to `upgrade-post` / `author-mermaid` (which own the
mermaid/table/component snippets). Do not add the diagram in this skill; propose it.

### 5. Reader's first read — can a newcomer actually follow this?

Read the post as someone arriving COLD, not as an editor checking rules. Where axes 2 to 4 ask "does
this obey the contract?", this asks "would a real reader make it through and understand?" Answer these
five questions, and let the answers drive the **concern map** (the deliverable below):

- **Is there a story I can relate to?** Does the post give the reader a relatable entry point (a
  scenario, a "you" they can be, a problem they've felt) before it dives into mechanism? If there is
  no narrative to hang the design on, that is a finding: propose one (name the reader and the moment
  they'd reach for this). Labeled as JUDGMENT, never fabricate a false story.
- **Am I being bombarded with information?** This is macro cognitive load, distinct from axis 3's
  per-sentence wordiness. A section can have tight sentences and still be a wall: too many concepts
  introduced at once, a table with too many columns, a paragraph that is all mechanism and no
  breather. Flag sections that overload, and say what to split, stage, or move later.
- **What are the core concerns?** Extract, in the reader's words, the handful of things this post is
  really about (e.g. "keeping secrets on-device", "cost control", "who sees whose data"). Name them.
- **Which section is each concern discussed in?** Map each concern to the section(s) that cover it. A
  concern discussed in five scattered places, or one with no clear home, is a finding.
- **Are there good visuals to guide understanding?** Audit the visuals that EXIST (not the missing
  ones from axis 4): does each diagram/table actually help a newcomer, or is it decoration / too dense
  to read / unlabeled? A core concern with no supporting visual is a candidate for axis 4.

**The concern map** (the axis-5 deliverable): one row per core concern the reader extracts.

| Concern (reader's words) | Section(s) | Visually supported? | Overloaded? |
|---|---|---|---|
| Keeping secrets on-device | §Exec Summary, §Phase 2 | ✓ sanitize-flow diagram | no |
| Who sees whose data | §Phase 4 only | ✗ none | yes (dense RBAC prose) |

Read it as the reader's real table of contents: a concern with no home, no visual, or crammed into an
overloaded section is where the post loses them.

## The report format

Emit findings ranked most-impactful first (a leak outranks a wordy sentence). One block per finding:

```
[N] AXIS · file:line · SEVERITY
   > "<quoted excerpt>"
   Why: <one line>
   Suggested: <the trim / generalization / diagram-candidate>
```

Then two tables: the per-section **coverage table** (axis 2) and the **concern map** (axis 5). The
report ends with the axis-5 reader verdict in plain words: is there a relatable story, is any section
bombarding the reader, and which concern is least well served. **Make NO edits.** The author approves,
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
3. Run axes 1 to 4 (editor lenses). Axis 2 produces the per-section coverage verdict.
4. Run axis 5 LAST (the reader's cold first read): answer the five reader questions and build the
   concern map.
5. Emit the ranked report + the coverage table + the concern map + the plain-words reader verdict.
   Make no edits.
6. Walk the findings with the author; apply only the approved trims/generalizations.
7. **Capture**: triage each acted-on finding into STYLE-GUIDE / SECTION-QUESTIONS or skip-with-reason;
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

The **"am I being bombarded" (axis 5) mechanical signal** is the repo's existing
`scripts/validate-visual-density.js` (`make validate-visual-density`) — it flags a `## H2` section
over ~280 prose words with no visual (a "wall-of-text"). It now scans `designs/` too, so a design
post's overloaded sections surface there; this skill doesn't duplicate that check. The concern map
and the story/relatability/visuals-actually-guide judgments stay in THIS skill.

Everything else — real wordiness, hedge nuance, question-set coverage, leak-vs-fair-generalization,
the reader's first-read judgments — is a judgment call and stays in THIS skill. The guards warn,
never block (exit 0), so they can't interrupt a mid-draft. When you notice a proprietary term worth
banning, add it to the root `.env` `DESIGN_LEAK_TERMS=` list (format `Name|alias1|alias2, OtherName`),
not to git.
