---
name: organize-post
description: Classify an arbitrary post, draft, or note against the site's content model and decide WHERE it belongs and what KIND it is — the up-front "what is this and where does it go?" step. Reads the content, asks "durable or temporal?", then "acted on or not?", then which thought KIND(s) it contains (idea/question/simulation/prediction/critique/principle/design), and recommends the home (/craft, /journey, /initiatives, or /thoughts), the `kind:` frontmatter, and a SPLIT plan when the post mixes kinds. TRIGGERS when the user asks "where should this go?", "what kind of post is this?", "how should I organize/file this?", "is this durable or temporal?", "should I split this?", or drops a raw note/braindump to be placed. Hands off to mature-content (to firm up an under-specified piece) and groom-initiatives (to board it). Pairs with author-post (frontmatter/MDX) and review-reader-experience (IA audit).
---

# Organize post (classify content → decide its home + kind)

A piece of writing is hard to place when it is doing several things at once: a "note" that is
really one idea, two questions, and a half-formed principle. This skill is the **classifier** that
runs BEFORE maturing or boarding: it reads the content, decides what it IS against the site's
content model, and recommends where it goes — splitting it when it is genuinely several things.

You are sorting, not rewriting. The output is a placement decision (+ a split plan), not a
finished post. Once placed, `mature-content` firms up an under-specified piece and
`groom-initiatives` boards it.

## The decision tree (ask these in order)

The whole site hangs on two questions, then a kind. Walk them top-down:

### 1. Durable or temporal? — *does this stay true over time, or is it a dated thing I did/thought?*

- **DURABLE** → a distilled learning, framework, strategy, terminology, the way I see the world or
  myself. Return-to knowledge. Home: **`/craft`** (how I see the world: the professional topics) or
  **`/journey`** (how I see myself: faith, personal growth). A durable piece is a DOC in one of
  those instances, slotted into the right topic folder (see `author-post`, `homes/craft.md`, for the
  topic-folder contract).
- **TEMPORAL** → a dated, specific thing. Go to question 2.

> Tell: durable reads as "here is how X works / the rule I follow"; temporal reads as "on this
> date I did/thought X". A durable claim that is really one person's dated experiment is temporal
> EVIDENCE that should link UP to the durable lesson, not masquerade as the lesson.

### 2. (If temporal) Which graduation? — *what am I doing with this thought?*

A temporal piece starts as a **Thought** (an idea that OCCURRED to me), and a thought graduates
three ways depending on what I do with it:

- **Acted on it** → a dated thing I did: an experiment, a project log, a post about work done.
  Home: **`/initiatives`**. An experiment is `kind: experiment-plan/result` (a card on the
  Experimentation board — see `groom-initiatives`).
- **Deliberately KEEP it to shape how I think** → a curated input. Home: **`/mindset`**. The line
  vs a plain Thought is **occurrence vs. curation**: a question that just *occurred* to me is a
  Thought; the set I *chose to ask myself to shape who I am* is Mindset. Mindset kinds (`mindset:
  true` in `blog-kinds.json`): `question-set` ❓, `quote-set` 💬, `principle` 🪞.
- **Not acted on, not (yet) curated** → it stays a **Thought**. Home: **`/thoughts`**. Thought
  kinds (`thought: true`): `idea` 💡, `simulation` 🔮, `prediction` 🎯, `critique` 🔍,
  `design-story` 📐. Go to question 3 to pick the kind.

(A thought can also graduate UP to durable `/craft` when it distills into a lasting lesson — that
is question 1's DURABLE branch.)

> Tell: "I built/ran/shipped X" is acted-on (/initiatives). "I could build X / I keep asking X /
> what if X" is unactioned (/thoughts). The moment work begins on a /thoughts post it GRADUATES to
> /initiatives (move the file + add a redirect — see groom-initiatives).

### 3. (If a /thoughts post) Which KIND of thought is it?

A thought has a kind, set by `kind:` frontmatter. The source of truth is
`bytesofpurpose-blog/scripts/lib/blog-kinds.json` (the kinds flagged `thought: true`); the reader
legend is the `/thoughts/about-my-thoughts` landing (it renders `<ThoughtKindLegend/>`). Pick the
MOST SPECIFIC kind:

| `kind:` | Emoji | The thought is… | Tell |
|---|---|---|---|
| `idea` | 💡 | something I might build or do | "I could build / I want to make X" |
| `question-set` | ❓ | a set of questions I ask myself | a list of questions grouped by theme; uses `<Question>` cards |
| `simulation` | 🔮 | a hypothetical walk-through | "if X then Y then Z; what if 1, 2, 3" |
| `prediction` | 🎯 | a falsifiable bet about the future | "I think X will happen" (one called outcome) |
| `critique` | 🔍 | an evaluation of something that exists | "what's wrong with X" / "how X actually works" |
| `principle` | 🪞 | an observation becoming a rule | "I noticed X, so I now Y" (feeds durable /craft) |
| `design-story` | 📐 | how something would be structured | a design narrative pointing at a /designs HLD |

Two adjacent calls worth getting right:
- **Simulation vs. prediction.** A simulation EXPLORES branches (no commitment); a prediction
  COMMITS to one outcome so it can be scored. "If the market does X I might do Y or Z" is a
  simulation; "the market will do X" is a prediction. A *pre-meditated action* ("if I'm ever in X,
  I will do Y") is a simulation resolved into a fixed response — file it `simulation`.
- **Principle vs. durable /craft.** An unrefined "I noticed X, maybe Y" is a `principle` thought
  (/thoughts); once it holds up and generalizes into a framework, it GRADUATES UP into a durable
  `/craft` doc. If it already reads as settled return-to knowledge, it is /craft (question 1), not a
  /thoughts principle.

## When a post mixes kinds — SPLIT, don't force

A raw note often contains several things: an idea, two questions, and a prediction. Do NOT cram it
under one kind. **Split it** into one post per coherent kind (the move/split-don't-delete rule —
reorganize, never discard). The split plan names, for each piece: its extracted content, its home,
its `kind:`, and a slug. Keep the original's useful specifics (links, examples) with the piece they
belong to; drop only true noise.

A piece that is durable AND temporal is usually really TWO things: the durable lesson (→ /craft)
and the dated evidence that informed it (→ /initiatives or /thoughts), with the temporal one
linking UP to the durable one. Split along that seam.

## How to run it

1. **Read the whole piece.** Note every distinct thing it is doing (an idea here, a question there,
   a claim at the end).
2. **Walk the decision tree** for the piece as a whole, then for each distinct part if it is mixed.
3. **Decide the home + kind** for each resulting piece (durable doc / initiatives post / thoughts
   post-of-kind-X), using `blog-kinds.json` as the kind source of truth.
4. **If anything is unclear** (is this acted-on yet? is this principle settled enough for /craft?),
   ASK the user one or two sharp questions rather than guessing — the placement must be right.
5. **Output a placement decision**: for each piece, its home, its `kind:` (+ `board: ideas`/`stage`
   if it is an idea), a slug, and a one-line why. If the post is mixed, lead with the SPLIT PLAN.
6. **Name it in the right voice.** Once the kind/home is decided, the TITLE must match the nature
   (a `/thoughts` thought reads as a QUESTION, an `/initiatives` post as what was DONE, a `/craft`
   doc as the lasting CONCEPT) → run `audit-post-names`. A just-classified idea is exactly where the
   "titled like a finished thing" smell hides.
7. **Hand off.** An under-specified piece → `mature-content` (the interview that firms it up). A
   board-ready idea/experiment → `groom-initiatives` (to card it). The MDX/frontmatter mechanics →
   `author-post`. **A re-home or SPLIT of an existing doc → `reorganize-content`** (the
   execution recipe: `git mv` + slug rewrite + REPOINT/collapse redirect chains + fold-not-delete +
   validate). This skill decides the target; that one moves it without breaking a URL.

## The output shape

```
PLACEMENT: <title or note name>

<if mixed:> SPLIT PLAN — this is N things:
  1. <extracted content> → <home>, kind: <kind>, slug: <slug> — <why>
  2. ...

<if single:> → <home>, kind: <kind> — <why>

OPEN QUESTIONS (if any): <the 1-2 things you must confirm before placing>
NEXT: hand to <mature-content | groom-initiatives | author-post>; <redirect note if a move>
```

Keep the call decisive: name the home and the kind, don't survey every option. When you genuinely
cannot tell durable-vs-temporal or acted-vs-unactioned from the content, that ambiguity IS the one
question to ask the user — everything downstream depends on it.
