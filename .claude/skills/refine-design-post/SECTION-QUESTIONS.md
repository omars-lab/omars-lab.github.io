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
> **The spine (applies everywhere).** The author starts from **why it matters → its value → what it
> enables → who benefits → what they'd do with it**, then mechanism. If a section reaches for
> mechanism before establishing why the reader should care, that ordering is itself a finding.

Each section lists **required** questions (a missing answer = finding) and **optional** ones (nice to
have, not gated). Not every post has every section; match by intent, not by heading text.

## Opener / hook (the first paragraphs, before `<!-- truncate -->`)

Required:
- **Why does this matter?** (the stake, in one or two sentences)
- **What does it enable / what is the value?**
- **Who benefits, and what would they do with it?**

Optional:
- A question-hook framing (the author's signature opening).
- One sentence of what makes this hard or non-obvious.

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

## Notes for the auditor

- **Thin vs. padded.** A section missing a required answer is THIN (add the answer). A section that
  answers its questions and then keeps elaborating is PADDED (the surplus is a clarity finding — see
  `STYLE-GUIDE.md`).
- **Coverage is about the ANSWER, not the heading.** A post can answer "who benefits?" in the opener
  without a "Who benefits" heading. Credit the answer wherever it lives.
- **Generality interacts with coverage.** If the only answer to a required question is an
  employer-specific instance, the fix is a GENERAL answer, not the private one (see the generality
  axis in `SKILL.md`).
