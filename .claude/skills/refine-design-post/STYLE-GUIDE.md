# STYLE-GUIDE — how a design post should read (living)

> **What this is.** The accumulated voice + wording rules for the author's `/designs` posts. Each rule
> has a one-line rationale and, where useful, a before → after. `refine-design-post` audits against
> these; `author-blog-post` / `author-post` read them when drafting a NEW post so it starts on-voice.
>
> **Living file.** The `refine-design-post` capture step APPENDS to this file as the author gives
> feedback (voice/wording rules land here; "a section must answer X" structural rules go in
> `SECTION-QUESTIONS.md`). Reconcile mode merges near-duplicates and promotes recurring rules. Do not
> hand-curate silently — every rule should trace to a real audit or the author's stated intent.

## Guiding themes

- **Minimalism — get to the core value.** Lead with *why it matters, its value, what it enables, who
  benefits, what they'd do with it*, then mechanism. Cut anything that doesn't advance a core
  question (see `SECTION-QUESTIONS.md`). Less, but load-bearing.
- **Generality over specifics.** Prefer the reusable PATTERN to the private instance. Strip
  employer/proprietary/internal names, real internal numbers, and one-off internal process. Keep the
  lesson, drop the instance. This is the guiding theme of the whole `/designs` blog: the value is in
  what a reader can lift, not in what only made sense inside one org.

## Rules to APPLY (trim toward these)

- **State a thing once.** Kill the Scope-note → bullets → table → "restated" repetition of the same
  invariant. State it once, reference it after. *(Real: `fleetplane.mdx` states its invariants 3×.)*
- **Never render the same structure twice.** A mermaid diagram AND an ASCII/prose redraw of the same
  thing is one too many. Keep the diagram; cut the redraw.
- **No throat-clearing intros.** "thus I made this post", "Here is the part that matters more than the
  mechanism." → just state the point.
- **Don't announce importance — show it.** "importantly", "the part that matters" → delete; let the
  content carry weight.
- **Cut hedges.** "a fair amount", "about half", "sort of", trailing "…". → commit to the claim or
  cut it. *(before: "a fair amount of it is generated" → after: "most of it is generated".)*
- **One idea per sentence.** Break semicolon-chains and nested parentheticals that pack 3–4 ideas into
  one breath. A dense sentence followed by a short verdict is the goal, not a dense sentence alone.
- **Prefer a table/diagram for parallel structure.** Parallel arms/options/mappings, or an
  input→transform→output flow, read faster as a table or a mermaid flow than as paragraphs. (Propose
  it; `upgrade-post` inserts it.)
- **No em-dash in the rendered body.** Repo-wide reader-voice rule — a literal `—` reads as AI voice
  and the `em-dash-voice-hook.sh` BLOCKS it. Use a period, a colon, or a parenthesis. (This rule is
  about the POST body, not this guide file.)

## Habits to KEEP (do NOT flatten these when trimming)

- **Question-hook openings** — "How do you put truly-locked content on a static site?"
- **Bold key-term + CAPS-for-contrast**, in moderation. Bold = "this is the key term"; CAPS =
  "notice this contrast". Don't strip them as noise; they are the prose's texture.
- **Long-sentence-then-short-verdict cadence** — "[dense 40-word sentence]. [5-word verdict.]" The
  short punch after a dense sentence is a feature.
- **Reflective "why it's built this way" closers.**
- **Physical / tactile metaphors** for abstract systems — planes, spines, portals, doors, "a picture
  in text".

## Captured from audits

_(Appended by the `refine-design-post` capture step. Format: `- **Rule.** rationale — [post that
taught it]`. Empty until the first audit adds to it.)_
