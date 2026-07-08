# SECTION-QUESTIONS — the per-section question-set rubric

> **What this is.** A minimalist's structural contract: the set of questions each section of a design
> post should answer. `refine-design-post` runs each section against this list and emits a coverage
> verdict (answered ✓ / missing ✗). A missing required answer is a finding.
>
> **Living file.** New question-sets get added here as the author refines what each section type must
> answer (the `refine-design-post` capture step writes structural rules HERE; voice/wording rules go
> in `STYLE-GUIDE.md`). `author-blog-post` / `author-post` read this when drafting a NEW design post,
> so a post is born answering the right questions.
>
> **The spine (applies everywhere).** The author starts from **users and use cases → why it matters →
> its value → what it enables → who benefits → what they'd do with it**, then mechanism. A design post
> opens on the PEOPLE and what they will DO, not on the system. If a section reaches for mechanism or
> CX before establishing who it is for and how they will use it, that ordering is itself a finding.

Each section lists **required** questions (a missing answer = finding) and **optional** ones (nice to
have, not gated). Not every post has every section; match by intent, not by heading text.

## Users & use cases (the FIRST section — before Scope, before any CX/mechanism)

**REQUIRED, and it must come first.** Every design post opens by establishing the people and what they
will do, before the Scope note and before any architecture or CX. A post that opens on the system
(a Scope note or Executive Summary first) is a ranked ordering finding: the reader should meet the
users and the use cases before the machine. The five questions this section must answer:

Required:
- **Who are we building for?** Name the users / personas (roles, not "an org").
- **What problem do they have?** The concrete pain, in their terms.
- **What will we build to fix it?** The system, in one plain sentence (not its internals).
- **How will they use it?** The core use cases: what each user actually does with it.
- **How will it make their life better?** The outcome / value each user gets.

**Required visual: a use-case diagram.** These questions are answered with a picture, not only prose.
The default is the repo's `<UseCaseDiagram>` component (actors outside a system boundary, use cases as
ovals, each with a click-to-focus `detail`) — it maps one-to-one onto who (actors) + how-they-use-it
(use cases). A persona table or a small journey diagram can also satisfy the visual, but a use-case
diagram is the canonical fit. Propose it here; hand the actual insertion to `upgrade-post`. A missing
visual in this section is a finding.

> **The opener's `<UseCaseDiagram>` should be the CANONICAL use-case view, not a stripped teaser.**
> If the post has a fuller use-case diagram buried deep (a mermaid "§10.2 Use Case Diagram" with more
> actors + the system's own internal use cases), EXPAND the opener to be that full view and remove the
> buried one (point it up), rather than leaving a simple opener + a rich duplicate. The `<UseCaseDiagram>`
> component's build-time crossing-free gate keeps even a 5-actor / 9-use-case version legible (split
> actors by side: the primary human `internal` left; consumers/`external` + `system` right) — verify
> the expanded spec passes the gate before shipping it. — [self-healing-storefront.mdx]

> Auditor note: this section subsumes and precedes the "Opener / hook" below. The opener's
> why/value/who questions are still required, but they now live DOWNSTREAM of users-and-use-cases —
> the post answers "who and what they do" first, then "why it matters" as the hook.

## Opener / hook (the first paragraphs, before `<!-- truncate -->`)

Required:
- **Why does this matter?** (the stake, in one or two sentences)
- **What does it enable / what is the value?**
- **Who benefits, and what would they do with it?**

Optional:
- A question-hook framing (the author's signature opening).
- One sentence of what makes this hard or non-obvious.
- **A relatable "you" entry point** — put the reader in the moment (the problem they've felt), not
  an abstract third party. [added from fleetplane.mdx audit]

> **Exec-Summary / long opener: carry a visual.** If the opening summary runs long (the repo's
> wall-of-text guard flags a section over ~280 words with no visual), it is the reader's FIRST
> content block and the worst place to bombard them. A single diagram of the core structure earns
> its place here more than three more paragraphs. [fleetplane's 372-word Exec Summary → add the
> two-plane diagram]

## Problem / motivation

Required:
- **What is the pain?** (the concrete failure or gap)
- **Who has it?**

Optional:
- **Why now?** (what changed that makes this worth solving)
- The cost of NOT solving it.

## Architecture / design

Required:
- **What are the parts, and how do they compose?**
- **Which decision is expensive to get wrong (lock it early) vs. cheap to change later?**

Optional:
- The one invariant everything else depends on.
- Where the pattern generalizes vs. where it's specific to this build.

## Decisions / trade-offs

Required:
- **What did you choose?**
- **Over what alternative, and WHY?** (a decision with no rejected alternative is just a description)

Optional:
- What you'd revisit if a constraint changed.

## Closer / reflection

Required:
- **What is the reusable takeaway someone could lift into their own project?**

Optional:
- Why it's built this way (the reflective coda the author favors).
- What carried over from a prior build.

## North Star / vision (OPTIONAL, closing)

An optional closing section that names where the foundation built here **could** go next. It keeps
the built thing HONEST (the design does X) while capturing the AMBITION (X is the foundation for Y, Z).

Required *if the section is present*:
- **What does the foundation enable next?** One or more possible future directions.
- **Framed as possibilities, not the plan.** These are directions the work COULD take, explicitly ONE
  among OTHERS — not a committed goal, not a description of what exists. (Motivating case: a fleet
  *reporting* tool is the foundation that could later grow into an admin *control plane* — but it
  could equally go other ways: a benchmarking service, a cost-optimization advisor, a compliance
  export.) This is also the honest home for an ambition the NAME must not overclaim (see the
  name-vs-purpose check in `SKILL.md`).

**Visual when there are multiple directions: a "fork in the road".** When the vision names more than
one possible path, show that the options DIVERGE with a branching diagram — a `flowchart` where the
current foundation node fans out to N future-direction nodes (see `author-mermaid` for the "fork in
the road" recipe). One direction needs no fork; two or more do. Propose it; `author-mermaid` /
`upgrade-post` own the insertion.

## Recurring failure modes (from audits)

> **🥇 THE #1 recurring gap across every audit so far: the post under-serves WHO.** _(Reconciled
> across 4 audits — local-guide-skill, fleetplane, premium-content-gating, self-healing-storefront —
> where the same root gap surfaced in four forms.)_ Design posts reliably open on the SYSTEM or the
> PROBLEM and skip the people: they never name concrete beneficiaries, never put the reader in a
> moment, lack the required "Users & use cases" opening + `<UseCaseDiagram>`, OR bury the user content
> mid-document where the reader meets it too late. **On any audit, check this FIRST.** The fix is
> almost always the same: add (or DISTILL UP) the users/use-cases opening (see that section above) and
> name a concrete person, not an abstract "users". The instances below are the evidence.

- **Open on a relatable "you" in a moment, not "an org" in the abstract.** Even with a strong hook,
  the first paragraph often addresses a generic third party ("An engineering org that has adopted X…")
  instead of putting the reader in the situation ("You rolled X out and three things are quietly
  breaking"). Same facts, but now there is a someone and a moment. — [fleetplane.mdx]
- **The silent "who" drop in the opener.** The most common opener miss: it answers *why this
  matters* and *what it enables* strongly, then never names *who benefits + what they'd do with it*.
  The beneficiary is often implied ("nobody wants to learn Socrata's dialect") but never stated as a
  person the reader can picture. Fix = one clause naming concrete beneficiaries and their payoff (a
  resident, a would-be tenant, a reporter), not an abstract "users". This also closes the
  Problem/motivation "who has it?" row — they are the same gap. — [local-guide-skill.mdx]
- **Even a mature, diagram-rich post usually lacks the users & use-cases opening.** The strongest
  posts (great hook, honest trade-offs, threat-model tables) still tend to open on the Problem or the
  system, skipping the required "who + use cases + a `<UseCaseDiagram>`" section. Auditing a GOOD post
  is mostly: add that opening, break the one wall-of-text, and confirm the KEEP list. Don't manufacture
  findings on a strong post; the new structural rules are usually the real gaps. — [premium-content-gating.mdx]
- **The user content can EXIST but be BURIED — the fix is distill-up, not add-new.** A very thorough
  post may have a rich personas table, a use-cases section, and a customer journey, but placed deep in
  the document (a "§1.4 System Users" a hundred lines in, a "§8 Use Cases" near the end) so the reader
  meets the system before the people, and there's still no `<UseCaseDiagram>` in the opener. This is
  the #1 gap in disguise: the WHO is answered, just not in the opening position. Fix = a compact
  "Who it's for and what they do" opener with a `<UseCaseDiagram>` that DISTILLS the existing buried
  content up. **CRITICAL: distill-up must REMOVE or merge the redundant source, not just add the
  opener on top.** If the opener's use-case diagram now covers the same 3 actors + their wants that a
  buried persona-mermaid showed, that buried mermaid is now duplication ("state a thing once") — delete
  it and point up to the opener; keep only the parts that add MORE than the opener (e.g. a personas
  table that also lists the system actors). A distill-up that leaves both is a self-inflicted "same
  thing twice" finding. — [self-healing-storefront.mdx]

## Notes for the auditor

- **Thin vs. padded.** A section missing a required answer is THIN (add the answer). A section that
  answers its questions and then keeps elaborating is PADDED (the surplus is a clarity finding — see
  `STYLE-GUIDE.md`).
- **Coverage is about the ANSWER, not the heading.** A post can answer "who benefits?" in the opener
  without a "Who benefits" heading. Credit the answer wherever it lives.
- **Generality interacts with coverage.** If the only answer to a required question is an
  employer-specific instance, the fix is a GENERAL answer, not the private one (see the generality
  axis in `SKILL.md`).
- **A top reader concern deserves ONE visual home.** When the axis-5 concern map shows a core concern
  discussed in several scattered sections with no supporting visual, that concern is where the post
  loses an anxious reader. Consolidate it into a single visual (a small table / matrix) placed where
  the reader first worries about it, and reference it from the scattered mentions rather than
  re-explaining. [fleetplane's "who-sees-whose-data" was in 4 sections → one access-matrix table at
  the top of Phase 4]
