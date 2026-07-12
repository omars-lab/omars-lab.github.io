---
name: pressure-test-business-idea
description: Stress-test a business idea against four moves BEFORE building it, then capture it as a board-ready /thoughts idea post. Put any idea through wedge-first (find the single cheapest entry product that still tests the core bet), honest-numbers (never invent financials — name the two or three real numbers that decide it and mark them as blockers), accumulation-moat (ask what the customer builds up over time that makes leaving painful, and whether it is real on day one or a bet to earn), and a Phase-0 pull test (the cheapest experiment that proves people WANT it, run before building durable layers). Output is a decisive readout: the wedge, the blocking numbers, the moat honesty, the Phase-0 test, and a go/kill/park call. TRIGGERS when the user shares a business idea, a product concept, a "what if I built/sold X" braindump, a monetization plan, or asks "is this a good business idea?", "should I build this?", "how do I validate this?", "pressure-test this idea", "poke holes in this business". Hands the surviving idea to organize-post + author-post to write it up as a `kind: idea` /thoughts post that boards on the Ideas board (via groom-initiatives). Worked examples: the snap-on coaster business + the dump-and-organize todo agent (both /thoughts idea posts). Pairs with organize-post, author-post, mature-content, groom-initiatives.
---

# Pressure-test a business idea

Every business idea arrives sounding good. The job of this skill is to find out whether it *is* good
before real money and months get spent proving it is not. It puts an idea through **four moves, in
order**, that turn an exciting pitch into a plan you can act on or kill, then hands the survivor off
to be written up as a `/thoughts` idea post.

This is a JUDGMENT skill, not a transformer. You run the four moves as a short interview + analysis,
and produce a structured readout. It is deliberately honest: a named-but-thin moat is a finding, not a
failure, and an idea that fails a move just got cheaper to walk away from.

## When to reach for it

The user shares a business idea, a product concept, a "what if I built/sold X" braindump, a
monetization plan, or asks any of: "is this a good business idea?", "should I build this?", "how do I
validate this?", "pressure-test / poke holes in this idea." If they just want it *filed* (not
stress-tested), that is `organize-post`; if it is already validated and they want it *written up*,
that is `author-post`. This skill is the thinking in between.

## The four moves (run them in this order — the order is the point)

The moves are ordered on purpose. The wedge tells you WHAT to test. Honest-numbers tells you the BAR
it has to clear. The moat question tells you whether winning the wedge is WORTH anything. The Phase-0
test is HOW you find out, cheaply, before committing. Run them out of order and you build the family
before you know anyone wants the wedge.

### 1. Wedge-first — find the cheapest thing to validate

An idea usually contains a whole FAMILY of products. The instinct is to describe the family; the
discipline is to find the single cheapest, lowest-risk entry point that still tests the core bet, and
plan to launch only that.

- Ask: *what is the smallest, cheapest, lowest-risk thing I could ship that still tells me whether the
  whole idea works?*
- The wedge is NOT "phase one of the roadmap." It is the one thing whose success or failure tells you
  whether the rest is worth building. If the wedge fails, the family was never going to work, and you
  found out cheap.
- Tell of a good wedge: cheap to make, easy to try, universal, and it exercises the CORE mechanic (not
  a side feature).

> Coaster example: a single coaster is the wedge for a whole line of coffee accessories (cheap,
> giftable, universal, ships for almost nothing). Agent example: the MVP connector with just the core
> recording tools is the wedge for the graph, the blog, and the upsell engine.

### 2. Honest-numbers — never invent the financials

The fastest way to fool yourself is to fill the unit-economics section with plausible numbers. A
made-up margin makes ANY idea pencil out.

- The rule: where a real number is needed and you do not have it, do NOT guess. Name the number that
  has to be gotten, and mark it as the blocker.
- The output of this move is not a spreadsheet. It is a short list of the **two or three real numbers
  that decide the business**, plus an admission that the plan is provisional until they exist.
- Typical blocking numbers: landed/unit cost, cost-to-serve per active user, CAC vs LTV, repeat
  rate / churn.

> Coaster: the blocking number is landed cost per piece from a real manufacturing quote — pricing,
> margin, viability all wait on it. Agent: the cost to run the orchestration + hosting layer per
> active user, knowable only from a running MVP.

### 3. Accumulation-moat — what does the customer build up over time?

A product is easy to copy. What is hard to copy is whatever the CUSTOMER accumulates by using it,
because a competitor starting from zero cannot hand a new user that history.

- Ask: *what does a customer build up here that makes leaving painful, and is that moat real on day
  one or a bet I have to earn?*
- Be as honest here as in the numbers. A thin day-one moat is a finding. Distinguish the moat you get
  for FREE (real on day one) from the moats you must deliberately BUILD (network effects, data
  effects, a recipe/marketplace ecosystem).

> Coaster: the collection of snap-together pieces a customer owns (makes the next accessory relevant).
> Agent: the accumulated knowledge graph + organized corpus living in one place (real-ish day one),
> plus cross-linked public blogs + a filing-recipe marketplace (bets to build). For the agent you must
> admit "an agent that files notes is easy to clone" and that the stronger moats are things to build.

### 4. Phase-0 pull test — prove demand before building anything durable

Design the cheapest possible experiment that proves people WANT the thing, and run it before building
the durable layers.

- Usually: a landing page + a demo + a real ask (join the list, pre-order, sign up), with a
  **threshold set in advance**.
- The point is to separate "this is possible" from "people want this." Possible is cheap; wanted is
  the whole question. If the pull is not there, no amount of building fixes it.
- Define the threshold BEFORE running it, so the result is a verdict, not a rationalization.

> Both example ideas end on the same next step: get the one blocking cost number, and run a Phase-0
> pull test, before tooling up or building the graph.

## How to run it

1. **Read the idea whole.** Note the core bet (the one thing that has to be true for this to be a
   business) and the family of products hiding inside it.
2. **Walk the four moves in order**, asking the user sharp questions where you cannot infer the answer
   (what is the cheapest wedge? what number do you not have? what accumulates? what is the cheapest
   proof of demand?). Do not invent financials — name the blockers.
3. **Be decisive and honest.** Name a thin moat as thin. Name the single biggest risk. The value is
   making the idea LEGIBLE: a short list of what must be true, the numbers that decide it, and the
   cheap experiment that would kill it.
4. **Produce the readout** (shape below).
5. **Make the go/kill/park call**, then hand off: a surviving idea → `organize-post` (confirm it is an
   unactioned `kind: idea`) → `author-post` (`homes/thoughts.md` + `kinds/idea.md`) to write it up as
   a `/thoughts` post that boards on the Ideas board (`board: ideas`, via `groom-initiatives`). A raw
   idea that needs firming first → `mature-content`.

> **The written-up post's SECTIONS are codified.** When the idea becomes a `/thoughts` post, its
> recommended body structure lives in `blog-kinds.json` (`kinds.idea.sections`, profile
> `business-plan`): 13 sections, each with the QUESTION it answers and one-line guidance. Follow that
> structure so the post is complete and consistent with its siblings; `validate-post-outline.js` warns
> (`missing-section`, warn-tier) if a business-plan-shaped post skips one. The four pressure-test moves
> map onto those sections: the WEDGE → the product + go-to-market; the NUMBERS → unit economics +
> pricing sketch; the MOAT → market/competition + open questions and risks; the PHASE-0 TEST → success
> criteria + next step.

## The output shape

```
PRESSURE TEST: <idea name>
CORE BET: <the one thing that must be true>

1. WEDGE: <the single cheapest thing to launch that still tests the core bet>
2. BLOCKING NUMBERS: <the 2-3 real numbers that decide it — each marked "to get">
3. MOAT: <what the customer accumulates> — <REAL day one | BET to build>; biggest risk: <...>
4. PHASE-0 TEST: <the cheapest experiment + the threshold set in advance>

CALL: GO (worth the next dollar) | KILL (fails move N because …) | PARK (blocked on <number/test>)
NEXT: <get number X> + <run Phase-0 test> ; then hand to organize-post → author-post
```

Keep the call decisive. An idea that survives all four moves is not *proven*, but it is worth the next
dollar. One that fails any of them just got a lot cheaper to walk away from.

## Worked examples (in this repo)

Two ideas were put through this method in one sitting — products that could not be less alike, but the
four moves are visible in both, which is the whole reason this is a skill and not a one-off:

- **Snap-on Islamic-art coasters** (`bytesofpurpose-blog/thoughts/2026-07-11-idea-islamic-art-coasters.md`)
  — a physical-product wedge (the coaster), a manufacturing-cost blocker, an accessory-collection moat.
- **Dump-and-organize todo agent** (`bytesofpurpose-blog/thoughts/2026-07-11-idea-todo-agent.md`) — a
  software-connector wedge (the MVP), a run-cost blocker, a platform-dependency risk, a corpus+graph
  moat (with portability-by-design as the hedge).

## Cross-links

- **`organize-post`** — confirm the survivor is an unactioned `kind: idea` (vs already an initiative).
- **`author-post`** (`homes/thoughts.md`, `kinds/idea.md`) — write the idea up; title must read as an
  OPEN QUESTION ("Should I build X?"), no em-dashes, board frontmatter.
- **`groom-initiatives`** — the Ideas-board contract (`board: ideas`, `stage`, `priority`); advancing
  the card when the idea graduates to an `/initiatives` project.
- **`mature-content`** — firm up a raw idea (motivation/value/scope/to-dos) before authoring.
