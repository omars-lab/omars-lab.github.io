---
name: extract-general-pattern
description: Turn ONE concrete /designs post (an imported HLD like the ecommerce-scanner or self-healing-storefront) into generalized, standalone /designs posts by DISENTANGLING the many reusable patterns intertangled inside it. The flow is DISENTANGLE (read the post, surface every distinct reusable pattern — a name, where it lives, the one-line reusable claim, a proposed kind + slug) → AGREE via the AskUserQuestion tool (you pick which candidates become posts; nothing is written before you choose) → author ONE generalized post per approved pattern, ONE AT A TIME with a checkpoint between each (de-specify the business, no source: provenance, draft: true, de-em-dash, MDX-clean) → hand each draft to refine-design-post for the GENERALITY/CLARITY audit. Each extracted post is STANDALONE (no backlink to the source). Use when the user says "extract the general pattern(s) from this design post", "pull the reusable patterns out of this", "generalize this design", "this post has many patterns intertangled — separate them", or "make a general version of this design". Deferred to a later version (say so, do not build): exporting to an external blog/repo, batch-producing every post without a checkpoint, a deterministic transformer. Pairs with refine-design-post (the audit it hands off to), import-co-design + import-marketplace-plugin (which CREATE the concrete /designs posts this reads), author-post (MDX pitfalls), manage-hubs (where a pattern MAY later be cataloged).
---

# Extract the general pattern(s) from a design post

Your `/designs` posts are concrete write-ups of specific systems (imported from work-repo HLDs by
`import-co-design`). Inside a single one of them, **many reusable patterns are intertangled**: a
build-vs-buy decision method, a crawl-then-enrich pipeline, a self-healing experiment loop, a
confidence-tagged diagram provenance convention. This skill pulls those threads apart and turns the
approved ones into **generalized, standalone `/designs` posts** — the reusable mechanism kept, the
specific business stripped out.

This is a **judgment-guided authoring skill**, not a deterministic transformer. There is no Node
script, hook, or Make target to run — you read, you disentangle, you get agreement, you author. It
leans on the repo's existing enforcement (the em-dash hook, `validate-seo`) and hands the finished
draft to `refine-design-post` for the generality/clarity audit rather than re-implementing it.

## Philosophy: the concrete post is the WITNESS; the general post is the LESSON

A concrete design post proves a pattern WORKED in one real place — it is the witness. The general
post is the **lesson** you can carry anywhere: the same mechanism with the one business removed. The
job is not to summarize the source and not to copy it. It is to answer, per pattern, *"what stays
true here once you delete the specific company, personas, and numbers?"* — and write only that.

Two consequences shape every step below:

- **One source post yields MANY general posts.** The patterns are separable, so the output is
  one standalone post PER approved pattern, not one summary of the whole source.
- **Standalone means standalone.** No `source:` provenance block, no "seen concretely in <post>"
  backlink, no employer trace. A reader of the general post should not be able to tell which company
  it came from. (This is the strongest form of `refine-design-post`'s axis-1 GENERALITY rule; you
  hand off to that skill precisely to prove the leak is gone.)

## The flow (do these in order)

### 1. DISENTANGLE — read the source, surface the candidate patterns

Read the target `/designs/*.mdx` in full. The reusable patterns hide in the same HLD sections every
time, so scan these first (headings may vary; match by intent):

- **§6.2 Architecture Options / §6.3 Comparison Matrix / §6.4 Recommendation** — a *decision method*
  (how you chose among options) is almost always a pattern, separate from the option you picked.
- **§6.5 Key Design Decisions** — each decision record (D1, D2, …) is often its own pattern.
- **§7.1 Components / §7.3 Data Flows** — a *pipeline / dataflow* shape (input → transform → output).
- **§8 Use Cases / §9 Customer Journey** — a *use-case model* for a class of user.
- **§10 Architecture Diagrams** — a reusable *diagram convention* (e.g. confidence-tagged provenance).
- **§11 NFRs** — an *NFR strategy* (how you met performance / compliance / scale for a class of system).

For each candidate pattern, capture four things (this is what you'll present for agreement):

1. **Name** — the reusable mechanism, not the product. "Crawl-then-enrich prospect pipeline", not
   "the ecommerce lead-gen engine".
2. **Where it lives** — the section(s) in the source it's drawn from.
3. **The one-line reusable claim** — what stays true once the specific business is removed.
4. **Proposed `kind:` + slug** — one of the `*-design` kinds (`system-design` / `backend-design` /
   `frontend-design` / `agent-design` / `tooling-cli-design`; source of truth
   `bytesofpurpose-blog/scripts/lib/blog-kinds.json`) and a slug `design-<pattern-kebab>`.

`PATTERN-TYPES.md` (next to this file) is the catalog of the recurring pattern SHAPES and how to
recognize each — read it before disentangling so you name patterns the same way across posts. It is a
living file: as the user approves or rejects candidates, capture the reusable recognition rule back
into it (the same self-healing loop `refine-design-post` uses for its guides).

### 2. AGREE — get sign-off on the patterns via the AskUserQuestion tool (before writing anything)

**Nothing is written to disk until the user picks.** Present the candidates through the
**AskUserQuestion tool** (multiSelect): one option per candidate pattern, the label being the pattern
name and the description being its one-line reusable claim + where it lives. The user selects which
become posts. This gate is the whole point of the skill's first half — you disentangle, they decide.

If the user names a specific pattern up front ("just pull out the self-healing loop"), you can skip
the enumeration and confirm that single pattern instead — but still confirm before authoring.

### 3. AUTHOR — one generalized post per approved pattern, ONE AT A TIME

Produce the approved posts **one at a time, with a checkpoint between each** (do NOT batch them). The
guidance below is written for making ONE post; apply it per approved pattern, then confirm that post
with the user before starting the next. Each post is a normal `/designs` post, so it obeys
`author-post`; the pattern-specific rules are:

**De-specify (the core move).** Remove personas, go-to-market, employer names, internal codenames,
real scale numbers, and one-off internal process. Keep the abstract mechanism. This is
`refine-design-post`'s axis-1 GENERALITY rewrite applied at AUTHORING time: "at $EMPLOYER we ran 40k
RPS through the Foobar service" becomes "a high-throughput service under sustained load". If a passage
has no lesson once the specifics are gone, it does not belong in the general post.

**Frontmatter (match the other design posts, with two deliberate differences):**
- `slug: design-<pattern-kebab>`
- `kind:` — the chosen `*-design` kind
- `sidebar_position:` — current designs max + 1 (check with
  `grep -h '^sidebar_position:' bytesofpurpose-blog/designs/*.mdx | grep -oE '[0-9]+' | sort -n | tail -1`)
- `draft: true` (always; it stays draft until the user publishes)
- `authors: [oeid]`, `tags:` (general tags, not the business), and a `description:` (~50 to 160 chars,
  powers the social card + share text; `validate-seo` checks it)
- **NO `source:` provenance block** and **NO backlink** — this is what makes it standalone. (The
  concrete posts carry `source:` because they're imports; a general pattern has no single source to
  cite.)

**Body rules that keep the build green (non-negotiable):**
- **De-em-dash.** `.claude/hooks/em-dash-voice-hook.sh` **BLOCKS** any `—` (U+2014) — and any `--`
  used as a sentence dash — anywhere in `designs/*.mdx`, including inside mermaid and frontmatter,
  with no code-fence exemption. Write with commas / colons / period-splits from the start.
- **MDX-clean.** Use `<br/>` not `<br>`; escape a stray `<` before a space/digit (`< 50ms` →
  `&lt; 50ms`); escape or fence `{braces}` that aren't real JSX. See `author-post`.
- **Mermaid with NO hardcoded fills** so the theme colors it light and dark. Escape a label dash to
  the `&#8212;` entity if you truly need one (the hook greps source bytes and never sees the entity).
- **Keep the worked example generic.** A pattern post benefits from ONE concrete illustration, but
  invent a neutral one (a generic "orders service", a generic "content platform"), never the real
  business the source came from.

**Voice.** Neutralize "I built this specific thing" into the reusable pattern voice ("this pattern
applies when…", "the mechanism is…"). Preserve the author's texture per `refine-design-post`'s
"preserve the voice" list (question-hook openings, bold-key-term, the long-then-short cadence).

### 4. HAND OFF to refine-design-post, then checkpoint

After drafting each general post, **hand it to `refine-design-post`** for the full audit — most
importantly axis 1 (GENERALITY / leak-risk), which is the proof that the de-specify worked. Walk its
findings with the user, apply the approved trims, and let its capture step record any new rule. THEN
**checkpoint**: confirm this post is done before starting the next approved pattern.

### 5. VALIDATE

Each new draft must build clean. Run `make build` (or at minimum the em-dash hook fires on write, and
`make validate-seo` `--file`-scoped covers the frontmatter). The post stays `draft: true` until the
user runs `publish-site`.

## Not yet (deferred — say so, do not build)

These were explicitly moved to a later version. If the user asks for them, name them as the next step,
do not silently build them:

- **Export to another blog / repo.** v1 keeps every general post in THIS `/designs` blog. The
  external-export mechanism (portable, component-free markdown to a staging dir) is a later version.
- **Batch mode.** v1 authors one post at a time with a checkpoint between each; a "generate all
  approved posts at once" mode is deferred.
- **A deterministic transformer.** v1 is judgment-guided (like `import-marketplace-plugin`), not a
  Node pipeline (like `import-co-design`). A transformer only makes sense once the shape is proven by
  hand on several posts.
- **Cataloging on a hub.** A general pattern MAY later belong on the `/craft` Patterns 🧱 / Techniques
  🔩 hub (see `manage-hubs`). v1 does not auto-file it there; that is a deliberate separate decision.

## Pointers

- `refine-design-post` (+ its `STYLE-GUIDE.md` / `SECTION-QUESTIONS.md`) — the audit this hands off
  to; its axis-1 GENERALITY rule is the same de-specify move applied at review time.
- `import-co-design` / `import-marketplace-plugin` — how the concrete `/designs` posts this reads were
  created; the house shape for a judgment-guided `/designs` authoring skill.
- `author-post` — MDX pitfalls + the blog `kind:` / `sidebar_label` system.
- `bytesofpurpose-blog/scripts/lib/blog-kinds.json` — the `*-design` kinds + their emoji.
- `manage-hubs` — the durable Patterns/Techniques hub a general pattern may later be cataloged on.
