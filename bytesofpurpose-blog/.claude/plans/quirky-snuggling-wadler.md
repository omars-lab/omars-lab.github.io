# Plan: `discover-my-journey` — a DELTA self-insight skill + a Stop-hook nudge

## Context

The reframed `/journey` is "what drives me forward" — the inward awareness to catch my own
motivations. But the drivers hide in plain sight across ~400 docs of my own writing: a value I keep
circling, a view that has shifted, a tension between what I say and what I do, a motivation showing in
the work but never named. `discover-my-journey` is the tool that surfaces those — not by re-reading
everything each time, but as a **DELTA pass**: it looks at what I *recently wrote* and
**cross-triangulates** it against the *relevant past writing* to reveal the pattern the new piece is
part of. It is the natural companion to the journey reframe: "what drives me forward" made visible
from the writing itself.

The output honors the site's own model (an observation that OCCURRED = a `/thoughts` post; one I ADOPT
as a rule = a `/mindset` `principle`): the skill SURFACES candidate insights with evidence and I decide
where each goes.

## Decisions (confirmed with user)

- **Delta = git changes since last run.** A stored watermark (a git ref/SHA) bounds each pass to
  genuinely new/changed docs, so it's incremental and cheap, and pairs with the Stop-hook nudge.
- **Triangulation = semantic + tag/theme/vocabulary/value overlap.** For the delta's themes (its
  `tags`, `kind`, key phrases, named values/entities), pull the past docs that share them; the insight
  is what the new + old say *together*.
- **Four insight types**, each with delta+past EVIDENCE: (1) **recurring themes/obsessions** (what I
  keep returning to), (2) **evolution/shifts** (how a view changed over time), (3)
  **contradictions/tensions** (new writing vs old; stated value vs action), (4) **blind spots/the
  unsaid** (a driver the pattern implies but I never named).
- **Output = surface-and-decide.** A ranked list of candidate insights; per insight the skill proposes
  KEEP as a `/mindset` principle · CAPTURE as a `/thoughts` observation · DISCARD. I choose; it hands
  the kept ones to `organize-post` → `author-blog-post` to draft. No auto-publish.
- **Skill + a Stop-hook nudge** (non-blocking, exit 0, like `changelog-archive-reminder`): after I add
  content, occasionally nudge "want a discovery pass on what you wrote lately?" — never blocks.

## How it works (the delta pass)

1. **Read the watermark.** A small state file (e.g. `.claude/skills/discover-my-journey/.last-run`,
   gitignored) holds the git ref of the last pass. First run defaults to a recent window (e.g.
   `HEAD~N` or a date).
2. **Compute the delta.** `git diff --name-only <watermark> HEAD -- bytesofpurpose-blog/{docs,blog,thoughts,mindset,questions,designs}`
   → the added/changed content docs since last run. Filter to `.md`/`.mdx`. (Scope favors the
   self-revealing surfaces but the delta is whatever changed; the technical craft docs still leak
   values, so they're not excluded, just lower-weighted.)
3. **Extract the delta's themes.** Per changed doc: its `tags`, `kind`, title, and a light key-phrase /
   named-value pass over the body (the recurring vocabulary + people/values it names).
4. **Triangulate against the past.** For each theme, find the relevant PAST docs (not in the delta)
   that share `tags`/topic/vocabulary/named-value, weighted by recency and overlap strength. This is
   read-only corpus analysis the skill performs (no new index needed — it greps + reads frontmatter;
   the existing `tags`, `blog-kinds.json`, and slugs are the join keys).
5. **Form insights.** Across the delta↔past pairings, surface the four insight types, each as: a
   one-line claim + the EVIDENCE (which docs, quoted lines/dates) + a proposed disposition
   (principle/thought/discard) + a why.
6. **I decide.** For each kept insight, hand to `organize-post` (classify: is it a durable `principle`
   for `/mindset`, or a raw `/thoughts` observation?) then `author-blog-post` to draft it `draft: true`.
   Discarded ones are just dropped. The watermark advances to `HEAD` at the end of a completed pass.

## The Stop-hook nudge

`.claude/hooks/discover-journey-reminder.sh` (+ a `.js` impl, mirroring `changelog-archive-reminder`):
- Fires on `Stop`. Checks whether the delta since the watermark crosses a threshold (e.g. ≥3 changed
  self-revealing docs, or ≥N days since the last pass). If so, prints a one-line advisory: "You've
  written 4 new pieces since your last discovery pass — want me to look for a pattern? (`discover-my-journey`)".
- ALWAYS exits 0 (advisory, never blocks Stop). Counts from git, so it can't nag about nothing.
- Registered in `.claude/settings.json` under the existing `Stop` matcher block (alongside
  `changelog-archive-reminder`).

## The skill itself

`.claude/skills/discover-my-journey/SKILL.md` — owns:
- **When to reach for it:** "discover something about my journey / what does my writing reveal / find a
  pattern in what I wrote / what am I circling / show me a blind spot", or the Stop-hook nudge.
- **The delta recipe** (steps 1–6 above), the four insight types + how to evidence each, the
  surface-and-decide output shape, and the watermark mechanics.
- **The occurrence→curation handoff:** a kept insight = `organize-post` decides `/mindset` principle vs
  `/thoughts` observation, then `author-blog-post` drafts it. The skill DISCOVERS; it never
  auto-publishes (a claim about myself is mine to adopt).
- **Honesty guardrails:** every insight cites real evidence (docs + lines); no invented patterns;
  distinguish "the text says X" from "this implies X about you" (the latter is a hypothesis to confirm,
  not a fact). A contradiction is surfaced as a question, not an accusation.
- Registered in the CLAUDE.md skills map; pairs with `organize-post`, `author-blog-post`,
  `mature-content` (firm up a kept observation), and the `/journey` + `/mindset` model.

## Sequencing note (concurrent session)

A concurrent session has uncommitted changes to `docs/craft/interview-prep/*`, `docs/knowledge/interviewing/*`,
`docusaurus.config.js`, and `.claude/skills/import-noteplan/*`. This skill touches NONE of those (it's
`.claude/skills/discover-my-journey/` + `.claude/hooks/discover-journey-reminder.*` + `.claude/settings.json`
+ the CLAUDE.md skills-map row + a gitignore line). I will branch off master and `git add` ONLY my files
(never `-A`), so the concurrent work is never swept in.

## Critical files (all new/mine)
- `.claude/skills/discover-my-journey/SKILL.md` (new)
- `.claude/hooks/discover-journey-reminder.sh` + `.js` (new)
- `.claude/settings.json` (add the Stop hook to the existing Stop block)
- `.gitignore` (the watermark state file)
- `CLAUDE.md` (skills-map row)

## Verification
1. The Stop hook: simulate a Stop payload → exits 0; with a stale watermark + ≥threshold delta it
   prints the nudge, with nothing new it stays silent. `node .claude/hooks/discover-journey-reminder.js`.
2. `settings.json` stays valid JSON; the hook is wired under `Stop`.
3. A dry delta pass: point the skill at a recent ref, confirm it computes the changed docs, finds
   plausibly-relevant past docs by shared tags, and surfaces at least one evidenced insight of each
   type on the real corpus (a manual read of the output, since the "insight" is a judgment).
4. The watermark advances only after a completed pass (re-running finds an empty delta).

## Open items to confirm in-flight
1. **Watermark default (first run):** `HEAD~20`, or a date (e.g. last 30 days), or "since the journey
   reframe merged". I propose a date window; you confirm.
2. **Nudge threshold:** ≥3 changed self-revealing docs OR ≥14 days since last pass — tune to taste.
3. **Whether the hook is ON by default** or opt-in (it's advisory + git-gated, so low-noise; I propose
   ON, matching the changelog reminder).
