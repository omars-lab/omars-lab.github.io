---
name: discover-my-journey
description: A DELTA self-insight pass over the author's own writing — surface things about him he might not have noticed, by cross-triangulating what he RECENTLY wrote against the RELEVANT PAST writing. Not a full-corpus sweep: it reads the git delta since the last run (a stored watermark), extracts that delta's themes (tags/kind/vocabulary/named values), finds the past docs that share them, and surfaces four kinds of evidenced insight — a RECURRING theme/obsession, an EVOLUTION/shift in a view over time, a CONTRADICTION/tension (new vs old, stated value vs action), or a BLIND SPOT (a driver the pattern implies but he never named). Output is SURFACE-AND-DECIDE: a ranked list, each with the delta+past evidence and a proposed disposition (keep as a /mindset principle · capture as a /thoughts observation · discard); he chooses, and kept ones hand to organize-post → author-blog-post. It DISCOVERS, never auto-publishes. The companion to the reframed /journey ("what drives me forward" made visible). Use on "discover something about my journey / what does my writing reveal / find a pattern in what I wrote / what am I circling / show me a blind spot / a contradiction", or when the discover-journey Stop-hook nudges. Pairs with organize-post (classify a kept insight), author-blog-post (draft it), mature-content (firm it up), and the /journey + /mindset model.
---

# Discover my journey

The reframed `/journey` is **"what drives me forward"** — the inward awareness to catch my own
motivations. But the drivers hide across ~400 docs of my own writing. This skill surfaces them, not by
re-reading everything, but as a **DELTA pass**: it looks at what I *recently wrote* and
**cross-triangulates** it against the *relevant past writing* to reveal the pattern the new piece is
part of. A single new post, read against its echoes, becomes an insight about me.

**The one rule: it DISCOVERS, it never decides.** A claim about who I am is mine to adopt. The skill
surfaces candidates with evidence and proposes where each could go; I choose. Kept insights flow into
the site's own model (an observation that OCCURRED = a `/thoughts` post; one I ADOPT as a rule = a
`/mindset` `principle`).

## When to reach for it

"Discover something about my journey", "what does my writing reveal", "find a pattern in what I wrote",
"what am I circling / obsessing over", "show me a blind spot / a contradiction / how I've changed", or
when the `discover-journey` Stop-hook nudges after enough new self-revealing writing has accumulated.

## The delta pass (do these in order)

### 1. Read the watermark
The last completed pass stored a git ref in `.claude/skills/discover-my-journey/.last-run` (gitignored;
format `<sha> <iso-timestamp>`). If absent, default the base to ~30 days ago
(`git rev-list -1 --before="30 days ago" HEAD`). This is the same watermark the Stop-hook nudge reads.

### 2. Compute the delta
```
git diff --name-only <base> HEAD -- \
  bytesofpurpose-blog/{docs/journey,docs/habits,thoughts,mindset,questions,designs,blog}
```
Keep `.md`/`.mdx`, drop READMEs/indexes. This is the RECENT writing. Favor the self-revealing surfaces
(journey/habits/thoughts/mindset/questions + first-person initiatives); the technical craft docs leak
values too but are lower-signal for who-I-am. If the delta is empty, say so and stop.

### 3. Extract the delta's themes
Per changed doc, read the frontmatter + body and pull: its `tags`, `kind`, `title`, and a light pass
over the body for the **recurring vocabulary** and the **named values / people / entities** it invokes
(what it's *about* beneath the topic). These themes are the join keys.

### 4. Triangulate against the past
For each theme, find the RELEVANT PAST docs (NOT in the delta) that share it — same `tags`, same
topic/slug family, the same vocabulary, the same value/person named. The join is cheap: `grep` the
corpus for the theme's terms + read frontmatter `tags`; `blog-kinds.json` + slugs are the taxonomy.
Weight by overlap strength and recency. The insight is what the new + old say **together**.

### 5. Form the insights (four types, each EVIDENCED)
Across the delta↔past pairings, surface candidates of these kinds. Each MUST cite real evidence
(which docs, quoted lines, dates):
- **Recurring theme / obsession** — what I keep returning to across time. "You've written about X in
  N pieces across M years; the new one is the latest return." (Evidence: the N docs + dates.)
- **Evolution / shift** — how a view CHANGED. "Your stance on X moved from A (2023) to B (now)."
  (Evidence: the old statement vs the new one, both quoted, dated.)
- **Contradiction / tension** — new writing conflicts with old, or a stated value vs an action. Surface
  it as a **question**, not an accusation: "You wrote X here but Y there — a tension worth resolving?"
- **Blind spot / the unsaid** — a driver the pattern IMPLIES but I never named. "Across these you
  clearly value Z, but never say it outright." (Mark this as a HYPOTHESIS, the softest claim.)

### 6. Surface-and-decide (the output)
Present a RANKED list (strongest evidence first), each insight as:
```
[type] one-line claim
  Evidence: <doc> (date): "<quote>" ; <doc> (date): "<quote>" ; …
  → proposed: KEEP as /mindset principle · CAPTURE as /thoughts observation · DISCARD
  why: <one line>
```
Then let me choose per insight. For each KEEP: hand to **`organize-post`** (it decides `/mindset`
principle vs `/thoughts` observation) → **`author-blog-post`** to draft it `draft: true` with the
evidence woven in; **`mature-content`** if it needs firming up. DISCARD = drop it. When the pass is
DONE, advance the watermark: write `<current-HEAD-sha> <now-iso>` to the `.last-run` file.

## Honesty guardrails (non-negotiable)

- **Every insight cites real evidence** — actual docs + quoted lines + dates. No invented patterns, no
  "you probably feel…" without a source.
- **Distinguish text from inference.** "The text says X" is a fact; "this implies Z about you" is a
  HYPOTHESIS to confirm, not a finding. Label the blind-spot type as a hypothesis.
- **A contradiction is a question, not a verdict.** Surface tensions to explore, never to indict.
- **Three or fewer strong insights beat ten weak ones.** Rank by evidence; don't pad. If the delta is
  thin, say "nothing rises to an insight yet" rather than manufacture one.
- **Never auto-publish or auto-adopt.** The skill stops at surfacing + drafting-on-request. Adopting a
  principle about myself is my act, not the skill's.

## The Stop-hook nudge

`.claude/hooks/discover-journey-reminder.{sh,js}` (registered under `Stop` in `.claude/settings.json`)
fires at the end of a turn, compares HEAD to the watermark, and prints a one-line advisory when the
self-revealing delta crosses a threshold (≥3 changed docs) OR enough time has passed (≥14 days since
the last pass). It ALWAYS exits 0 (never blocks), and is git-gated so it can't nag about nothing. It
does NOT run the pass — it just invites one. Tune the thresholds (`DOC_THRESHOLD`/`DAYS_THRESHOLD`) in
the `.js` if it's too eager or too quiet.

## Files this skill owns
`.claude/skills/discover-my-journey/SKILL.md` (this), the watermark `.last-run` (gitignored), and
`.claude/hooks/discover-journey-reminder.{sh,js}` (the nudge). It READS the corpus (docs/blog/thoughts/
mindset/questions/designs) but writes nothing there directly — kept insights go through `organize-post`
+ `author-blog-post`. Pairs with those two, `mature-content`, and the `/journey` + `/mindset` model
(CLAUDE.md durable/temporal tenet: occurrence → curation).
