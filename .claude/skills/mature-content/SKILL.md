---
name: mature-content
description: Mature rough content (a raw idea, a half-formed draft, a thin doc, a loose framework, OR an existing blog post that needs cleaning up / hardening) into organized, decision-ready content by INTERVIEWING the user — ask targeted questions to surface the motivation, the value, the scope, the concrete to-do list, and the success criteria, then restructure it. Encodes the draft→ready maturity gates so you always know what a piece still needs to advance. TRIGGERS when the user asks to "clean up", "harden", "tighten", "firm up", "flesh out", "make this real", "think this through", or "mature" a post/idea/draft/doc — or to take something from draft to ready. Idea-maturing is the primary case: it outputs a board-ready idea (kind/stage/priority) that feeds groom-initiatives. Pairs with groom-initiatives (advances a matured idea across the board), author-blog-post (MDX/frontmatter), and upgrade-post (weaving in reusable components).
---

# Mature content (interview-driven draft → ready)

Rough content fails not because it is wrong but because it is **under-specified**: the
motivation is in the author's head, the value is assumed, the to-do list is vague, "done" is
undefined. This skill matures a rough piece by **asking the user the questions that surface
what is missing**, then restructuring it into something decision-ready. You are an interviewer
first and an editor second: do not invent the answers, draw them out.

> Classify BEFORE you mature. If you do not yet know WHERE a piece belongs or what KIND it is
> (durable vs temporal, acted-on vs unactioned, idea vs question vs principle…), run
> **`organize-post`** first — it decides the home + kind (and splits a mixed piece). This skill
> then firms up whatever organize-post placed.

The most common case is a **raw idea** → a board-ready idea doc, but the same gates apply to a
half-formed post, a thin doc, or a loose framework.

## The maturity model — the draft → ready gates

Content advances through gates. Each gate has an EXIT CRITERION; you cannot mark a piece "ready"
until every gate before it is satisfied. Know which gate the content is stuck at, and ask only
the questions that unstick it.

| Stage | The piece has… | Exit criterion (what it takes to advance) |
|---|---|---|
| **0. Captured** | a title and a sentence, however rough | it exists in writing at all |
| **1. Motivated** | the WHY: the problem/itch, who it's for, why now | a reader could state the motivation in one sentence without you |
| **2. Justified** | the VALUE: the pros, the payoff, the cost of NOT doing it | the upside is concrete (not "it'd be nice"); the trade-off is named |
| **3. Scoped** | a clear boundary: what's in, what's explicitly OUT, the smallest first version | someone could tell whether a given task belongs |
| **4. Planned** | a properly-organized to-do list: grouped, ordered, each item a real step | the list is buildable top-to-bottom with no "and then magic" gaps |
| **5. Measurable** | success criteria: how you'll know it worked, when to stop | "done" is a checkable condition, not a vibe |
| **6. Ready** | all of the above, plus the home + frontmatter for where it will live | it can be acted on / published / put on a board without more questions |

A piece is only as mature as its **lowest unmet gate**. A gorgeous to-do list (gate 4) with no
clear motivation (gate 1) is still stuck at gate 1.

## The interview — questions that fill each gate

Read the rough content first, infer which gates are already met, then ask ONLY about the gaps.
Ask a few sharp questions at a time, not a wall; use the user's answers to ask the next ones.

- **Motivation (gate 1):** What itch does this scratch? What's broken or annoying today without
  it? Who is it for — you, readers, a future you? Why now and not later?
- **Value (gate 2):** What's the concrete payoff if it works? What does it unlock or save? What
  happens if you DON'T do it — does anything actually break, or is it just nice-to-have? What's
  the cost/effort, roughly, and is the trade worth it?
- **Scope (gate 3):** What's the smallest version that would still be worth it? What are you
  deliberately NOT doing in v1? Where does this stop?
- **Plan (gate 4):** What are the actual steps, in order? Which are unknowns/spikes vs known
  work? What has to be true before step 1 (prerequisites/dependencies)?
- **Success (gate 5):** How will you know it worked? What's the signal? When is it "done enough"
  to stop, and when would you abandon it?
- **Home (gate 6):** Where does this live (durable Craft doc, temporal Initiatives post, a board
  card)? What's its priority relative to your other open work?

If the user doesn't know an answer, that's a finding: note it as an OPEN QUESTION in the output
rather than papering over it. An honest "unknown: needs a spike" is more mature than a guess.

## Never lose a task — reorganize, don't discard

Maturing a raw capture must PRESERVE every genuine open item; it reorganizes them, it does not
silently drop them. The only things you remove are **verifiably noise**: items explicitly marked
done (`@done`, `[x]`), dead local-only links (`vscode://`, broken file paths), and fragments that
clearly went nowhere. Everything else is a real to-do and survives — grouped, ordered, and
sharpened, but never deleted. If you are UNSURE whether a captured line is still wanted, KEEP it
(park it under "Captured backlog" or "Open questions") rather than cut it; ask the user before
dropping anything ambiguous. The point of maturing is to organize the pile, not to shrink it by
losing things. Before/after, the count of genuine open tasks should only go UP (as vague ones
split into concrete steps), never silently down.

**Capture to-dos AS markdown tasks.** An open item is a `- [ ]` markdown task (a checkbox), not a
prose bullet — preserve and emit them that way so the backlog stays checkable and its open/done
state is real. A `- [x]` is a completed item (usually pruned as noise unless it's worth keeping as
done-history). Don't flatten `- [ ]` captures into plain `-` bullets; that strips their task-ness.
This same rule is why the "enumerate the tasks up front" step uses TaskCreate AND why the worked
to-do list in the matured output stays in checkbox form.

**Don't strip the date / scheduling breadcrumbs.** Raw captures carry meaningful tags: `>YYYY-MM-DD`
(a scheduled/due date), `@done(YYYY-MM-DD)` (when it was finished), `#YYYY-MM-DD` (a date stamp),
`~Nx~` (recurrence/effort). These ARE signal — keep them on the item (e.g. as inline code), do not
delete them as "noise." They feed the date-origin rule below and the `<TaskList>` rendering.

**Date a matured piece to its TRUE ORIGIN, not today.** When an idea/post is matured out of an old
capture, its `date` (and the `YYYY-MM-DD-` filename prefix for a blog post) should reflect when the
idea actually ORIGINATED, traced from the todo's own implied dates — NOT today's date and NOT the
git commit date. **Pick the OLDEST** concrete date among the item's breadcrumbs (and its
surrounding capture cluster if the item itself has none). This mirrors the repo convention of
re-dating imported posts to their true, breadcrumb-traced origin. If there is genuinely no date
evidence, say so and ask the user rather than defaulting to today.

## Show the user — stay on the same page

Maturing is collaborative, not a silent rewrite. SHOW the user the content as you work so you
agree on what's there and what it should become:
- Open the file(s) in their editor (`code <path>`) at the start, so they can see the rough
  source while you interview them.
- After restructuring, show the proposed result (open the new/edited file, or paste the diff)
  and confirm it captures their intent BEFORE moving on — especially that no real task was lost.
Treat it like pair-editing: the user should always be able to see what you're about to change.

## The output — restructured, decision-ready

Rewrite the rough content into a clean structure that captures what the interview surfaced.
A general maturity-ready shape:

```
# <Title>

**Motivation.** <the why, in the user's own framing>
**Value.** <the concrete payoff + the cost of not doing it; the trade-off>
**Scope.** <what's in v1, what's explicitly out>

## Plan
- [ ] <ordered, grouped, real steps as markdown tasks — prerequisites first>
- [ ] ...

## Success criteria
- <checkable "done" condition(s); when to stop / when to abandon>

## Open questions
- <anything the user couldn't answer yet — honest unknowns, not guesses>
```

Keep the user's voice; you are organizing their thinking, not replacing it. Preserve any useful
specifics from the rough capture (links, examples) and drop the noise (stale @done markers, dead
local-path links, fragments that went nowhere).

## The idea application (→ board-ready, hands to groom-initiatives)

When the content is an **idea** I have NOT acted on yet, "ready" (gate 6) means it can become a
card on the **Ideas board** (`/craft/product-management/ideas`). An unactioned idea is published
as a **`/thoughts`** (Thoughts & Ideas) blog post, NOT an `/initiatives` post — `/initiatives` is
for ideas already ACTED ON. The output is an idea post (in `thoughts/`) with the board frontmatter:

```yaml
kind: <a blog kind, e.g. reflection>
board: ideas          # opts the post onto the Ideas board
stage: backlog        # the first column; advances via groom-initiatives
priority: <core|high|medium|low>
title, description, ...
```

Then hand off to **`groom-initiatives`**, which owns ADVANCING the card across the board (a
`stage` edit) and the `/thoughts` → `/initiatives` graduation when work begins, and to
**`author-blog-post`** for the MDX/frontmatter mechanics. This skill FORMS the idea;
groom-initiatives MOVES it; the durable learning is distilled back into `/craft` when it concludes.

## Hardening / cleaning up an existing post (a first-class case)

"Clean up this post" / "harden it" is the same model pointed at something already written. The
gates still apply: a published post can be mature in form but immature in substance (assumed
motivation, hand-wavy claims, no clear takeaway). Run the SAME interview to find which gate it
fails, then tighten: sharpen the motivation up front, make vague claims concrete (or cut them),
fix the structure/flow, add what's missing, and remove the noise. For a post specifically, also
honor the repo conventions (no literal em-dashes in reader-facing prose, MDX build-breakers, the
`kind`/`sidebar_label` system — see `author-blog-post`; weaving in components — see `upgrade-post`).

## Track the work as tasks — ENUMERATE up front

When you start a maturing or clean-up run, **enumerate the tasks you will create and create them**
(TaskCreate), one per gap/gate to close and per clean-up action — BEFORE editing. This makes the
process visible and reviewable instead of a silent rewrite. Frame each task around the gate or
fix it closes. For example, cleaning up a post might enumerate:

```tasks
- [ ] Sharpen the motivation: state the why in the first paragraph (gate 1)
- [ ] Make the central claim concrete or cut it — it's currently assumed (gate 2)
- [ ] Tighten structure: the middle three sections wander; reorder around the argument
- [ ] Define the takeaway: what should the reader DO/believe after reading (gate 5)
- [ ] Repo hygiene: de-em-dash reader-facing prose, fix any MDX build-breakers
```

Mark each `in_progress` when you pick it up and `completed` when done, so the clean-up's progress
is the task list. Trivial single-fix touch-ups don't need the ceremony; a real clean-up does.

## How to run it

1. Read the rough content. Identify the lowest unmet gate.
2. **Enumerate + create the tasks** you'll work (one per gap/fix), so the process is tracked.
3. Interview the user from the lowest gate up — sharp questions, a few at a time, follow answers.
4. Restructure into the decision-ready shape above; record honest open questions.
5. For an idea, add the board frontmatter and hand off to `groom-initiatives`.
6. State which gate the piece reached and what (if anything) still blocks "ready".
