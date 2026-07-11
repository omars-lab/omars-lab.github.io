# STYLE-GUIDE — how a design post should read (living)

> **What this is.** The accumulated voice + wording rules for the author's `/designs` posts. Each rule
> has a one-line rationale and, where useful, a before → after. `refine-design-post` audits against
> these; `author-post` reads them when drafting a NEW post so it starts on-voice.
>
> **Living file.** The `refine-design-post` capture step APPENDS to this file as the author gives
> feedback (voice/wording rules land here; "a section must answer X" structural rules go in
> `SECTION-QUESTIONS.md`). Reconcile mode merges near-duplicates and promotes recurring rules. Do not
> hand-curate silently — every rule should trace to a real audit or the author's stated intent.

## Guiding themes

- **Lead with users and use cases — before Scope, before CX, before the system.** A design post opens
  on the PEOPLE and what they will DO: who are we building for, what problem do they have, what will we
  build to fix it, how will they use it, how does it make their life better. Only then the mechanism.
  This opening carries a **use-case diagram** (the repo's `<UseCaseDiagram>`), not just prose. Opening
  on a Scope note or an Executive Summary (the system first) is the ordering mistake this rule exists
  to catch. See the "Users & use cases" section in `SECTION-QUESTIONS.md`.
- **Minimalism — get to the core value.** After users/use-cases, lead with *why it matters, its value,
  what it enables, who benefits, what they'd do with it*, then mechanism. Cut anything that doesn't
  advance a core question (see `SECTION-QUESTIONS.md`). Less, but load-bearing.
- **Generality over specifics.** Prefer the reusable PATTERN to the private instance. Strip
  employer/proprietary/internal names, real internal numbers, and one-off internal process. Keep the
  lesson, drop the instance. This is the guiding theme of the whole `/designs` blog: the value is in
  what a reader can lift, not in what only made sense inside one org.

## Rules to APPLY (trim toward these)

- **Name the tech for what it DOES, not what it aspires to.** The title + system name must match the
  built purpose. A name that overclaims sets a false expectation the body contradicts. *(Real:
  "A Control Plane for a Claude Code Fleet" implies an admin control plane, but the design builds a
  reporting/observability tool — the control-plane idea belongs in an optional North Star section as a
  future direction, not the name.)* Accuracy-to-purpose; distinct from `audit-post-names` (title voice).
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
- **Tab a long mockups / "what it looks like" stack.** When the CX section stacks several
  self-contained mockups vertically, wrap them in `<Tabs>`/`<TabItem>` (one tab per surface) so the
  reader picks a screen instead of scrolling past all of them. A big vertical mock stack is the visual
  analogue of a wall of text. *(Real: fleetplane's 4 browser mocks + a walkthrough, 176-line sidecar.)*
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

- **A vivid metaphor is a "thing" too — state it once.** The "State a thing once" rule isn't only
  for invariants and decisions; it covers a coined metaphor/framing. If an early section lands a
  memorable line ("the skills carry the judgment, the CLI carries the muscle"), a later section must
  not re-coin it near-verbatim. Reference it or let the diagram carry it; don't restate the whole
  frame. — [local-guide-skill.mdx: "muscle/judgment" stated in §"Plugins are roles" then re-opened
  §"Why a plugin and not just a script"]
- **A "closing verdict" must add a beat, not re-narrate.** When a section ends on the
  long-sentence-then-short-verdict cadence, the verdict should be the PUNCH, not a recap of a number
  or claim already shown above it. "That is the thesis working: the detector surfaced 27 permits"
  re-states a count already in the diagram AND lightly announces-importance ("that is the thesis
  working"). Cut to the bare verdict — "None were on a map yet. All were on the public record." The
  fewer words carry more. — [local-guide-skill.mdx]
- **Open on a relatable "you" in a moment, not "an org" in the abstract.** The first paragraph puts
  the READER in the situation, not a generic third party ("You rolled X out and three things are
  quietly breaking", not "An org that adopted X faces gaps"). Pairs with the question-hook opener
  (KEEP list). This is one face of the **#1 recurring audit gap (under-serving WHO)** — the structural
  side (the required users/use-cases opening) lives in `SECTION-QUESTIONS.md`. — [fleetplane.mdx]
- **The generality axis targets internal NAMES/NUMBERS/CODES, not proper nouns.** _(Reconciled from
  three audits.)_ Keep a coined system name, an illustrative order-of-magnitude figure, and the post's
  own public domain/repo (a post can be openly about its own system). STRIP an employer/internal name,
  any incidental internal NUMBER with no reader value (a project ID, an org counter, a real SLA), and
  an internal ARTIFACT CODE (a design-doc ID like "CO-DESIGN-0002", a ticket key) — a reader doesn't
  know what the code means, and the thing usually already has a real name. Generalize the INSTANCE,
  keep the name. (Author's calls: "Fleetplane" + "roughly 50 to 150 USD/month" stayed; "PostHog
  project 448205" → "PostHog"; "CO-DESIGN-0002" ×21 → "the Site Scanner", its real name, keeping the
  one link to the sister post.) — [fleetplane.mdx, premium-content-gating.mdx, self-healing-storefront.mdx]
- **An FAQ that re-explains an earlier section is redundancy, not an FAQ.** When a Q&A answer restates
  a full section almost verbatim, cut it to a one-line VERDICT plus a link up to the section. The
  detail belongs in one home; the FAQ points to it. (Real: the "Does this work on localhost?" FAQ
  fully restated the Dev/prod parity section → trimmed to "Yes, identical except auth; see Dev/prod
  parity".) A specific instance of the top-level "State a thing once" rule. — [premium-content-gating.mdx]
