# PATTERN-TYPES — the reusable shapes worth extracting from an HLD (living)

> **What this is.** A catalog of the recurring PATTERN SHAPES that hide inside a concrete `/designs`
> post, and how to RECOGNIZE each one while disentangling (step 1 of `extract-general-pattern`). Naming
> patterns the same way across posts is what lets the skill get sharper with use.
>
> **Living file.** As the user approves or rejects candidate patterns, capture the reusable
> recognition rule back here (the same self-healing loop `refine-design-post` uses for its guides). A
> new shape the corpus reveals gets its own section; a sharpened "how to recognize" gets edited in
> place. Do not hand-curate silently — every rule should trace to a real disentangling.

## How to use this

When you read a source post, walk these shapes and ask, per section, "is one of these here?" Each
shape below gives: **where it lives** in the HLD skeleton, **the recognition tell**, **what the
general post keeps vs. drops**, and a **proposed `kind:`**. A single source post usually contains
several of these intertangled — that is the whole reason for the disentangle step.

## The shapes

### 1. Architecture-option tradeoff (a DECISION METHOD)

- **Where:** §6.2 Architecture Options → §6.3 Comparison Matrix → §6.4 Recommendation.
- **Tell:** two or more options weighed against the same axes, then one chosen. The reusable thing is
  the *method of choosing* (the axes, the comparison matrix, the recommendation logic), which is
  SEPARATE from the option that happened to win.
- **Keep:** the decision axes, the comparison-matrix structure, "when you'd pick each option", the
  build-vs-buy reasoning. **Drop:** the specific vendors/APIs and the specific winner as a foregone
  conclusion.
- **`kind:`** usually `system-design`.

### 2. Decision record (one D-entry = one pattern)

- **Where:** §6.5 Key Design Decisions (the D1, D2, … entries).
- **Tell:** a titled decision with a concern, options, and a rationale. In the two seed posts these
  are things like *site/traffic/contact discovery*, *scoring model*, *outreach-automation level*,
  *measurement rigor across traffic levels*, *autonomy & guardrails*, *outcome attribution*,
  *compliance posture*. Several of these are transferable patterns in their own right (e.g.
  "measurement rigor across traffic levels" is a general statistics-under-low-traffic pattern; "autonomy
  & guardrails model" is a general human-in-the-loop pattern).
- **Keep:** the concern the decision answers and the reusable rule of thumb. **Drop:** the
  business-specific instantiation (what exactly was scored, whose contacts).
- **`kind:`** matches the decision's nature (`backend-design` for a data/scan decision, `agent-design`
  for an autonomy/guardrails decision, etc.).

### 3. Pipeline / dataflow (input → transform → output)

- **Where:** §7.1 Components + §7.3 Data Flows (and often §10 sequence diagrams).
- **Tell:** a chain of stages where each stage transforms and passes on. The seed example is
  "crawl-then-enrich" (discover → size → find contacts → score → act). The reusable thing is the
  STAGE SHAPE and the contract between stages, not the specific enrichment sources.
- **Keep:** the stages, what each guarantees, where it can fail/retry, the mermaid flow. **Drop:** the
  concrete data sources and field names tied to the business.
- **`kind:`** usually `backend-design`.

### 4. Self-healing / closed-loop control

- **Where:** the "target state" (§6.1) + §10 lifecycle sequence + a North Star section, taken together.
- **Tell:** a loop that measures, decides, acts, and feeds the result back to improve the next cycle
  (the self-healing-storefront's experiment lifecycle: ideate → generate variant → run → attribute
  outcome → adopt/rollback). The reusable thing is the LOOP and its guardrails.
- **Keep:** the loop stages, the guardrails/rollback, the "how it improves each cycle". **Drop:** the
  domain being optimized (CRO, storefront conversion).
- **`kind:`** `system-design` or `agent-design` (if autonomy is central).

### 5. Use-case / persona model

- **Where:** §1.4 System Users & Personas, §8 Use Cases, §9 Customer Journey.
- **Tell:** a class of user with a repeatable job-to-be-done, rendered as a use-case diagram. The
  reusable thing is the ROLE SHAPE ("a two-person founding team split into a technical operator and a
  BD partner" generalizes to "a small team split by build-vs-sell"), not the named personas.
- **Keep:** the role archetypes and their use cases, the `<UseCaseDiagram>`. **Drop:** named personas,
  employer org structure.
- **`kind:`** `system-design`.

### 6. NFR strategy for a class of system

- **Where:** §11 Non-Functional Requirements (performance, security, scalability, compliance).
- **Tell:** how a whole CLASS of system meets a non-functional need — e.g. crawl-ethics + outreach-law
  compliance for any scraping+outreach system, or "statistical reality for mid-market stores" (how to
  get signal at low traffic). Reusable when the strategy transfers beyond the one product.
- **Keep:** the strategy and its constraints. **Drop:** the specific SLAs/thresholds/legal jurisdiction
  tied to one org (generalize numbers per `refine-design-post` axis 1).
- **`kind:`** `backend-design` or `system-design`.

### 7. Diagram / documentation convention

- **Where:** §10 Architecture Diagrams (and the post's frontmatter `diagrams:` block).
- **Tell:** a reusable way of PRESENTING a design, not a design itself — e.g. the confidence-tagged
  diagram provenance (`type` + `confidence` + `heading` per diagram), the HLD section skeleton itself,
  the animated-mermaid-flow convention. Reusable as a documentation pattern for other design docs.
- **Keep:** the convention and why it helps a reader. **Drop:** the specific diagrams' content.
- **`kind:`** `tooling-cli-design` or `frontend-design` (it's about presentation).

## Not every section is a pattern

Executive Summary, Purpose/Context, Scope, Current-State, Problem Statement, Risks, Revision Log, and
Appendices are usually the SPECIFIC INSTANCE, not a reusable pattern — they exist to ground THIS
system. Do not manufacture a "pattern" out of them. If a candidate has no lesson once the business is
removed, that is a signal it isn't a pattern (the same finding `refine-design-post` makes: cut it).

## Captured this session

<!-- Append what you learned each disentangling: a new shape, or a sharpened recognition tell.
     Format: "- YYYY-MM-DD (source post): <rule>". Nothing here yet — seed shapes above are from
     the ecommerce-scanner + self-healing-storefront posts. -->
