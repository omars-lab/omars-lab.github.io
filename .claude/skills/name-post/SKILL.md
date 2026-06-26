---
name: name-post
description: Name a post so its TITLE matches its NATURE — a thought reads as an open question ("Should I build X?"), an acted-on initiative reads as what I DID, a durable Craft/Journey doc reads as the lasting CONCEPT. Catches the common tell where an unactioned idea is titled like a finished accomplishment ("My First X", "Building X") so it reads as a completed initiative when it is really a question being weighed. TRIGGERS when titling/retitling a post, when a title "reads as done" but the work isn't, when reviewing sidebar labels, or right after organize-post classifies a piece (classify → then name). Pairs with organize-post (decides the kind/home that drives the voice), author-blog-post (the title/sidebar_label mechanics), and review-reader-experience (the voice audit). The validate-post-naming check + its warn hook flag mismatches.
---

# Name a post (title voice matches its nature)

A title is a promise about what the post IS. The most common failure is a **voice mismatch**: an
unactioned idea titled like a finished thing. "My First NotePlan Plugin" reads as a completed
initiative (something I built), but if I have not built it, the post is really a **question I am
weighing** — and the title should say so: "Should I build a NotePlan plugin?".

The rule is simple and follows from the post's **kind + home** (run `organize-post` first if you do
not know those): **name the post in the voice of what it actually is.**

## The voice-per-nature contract

| The post is… | Home | Title voice | Examples |
|---|---|---|---|
| An **unactioned thought** (idea / question / simulation / prediction / critique / principle / design) | `/thoughts` | an **open QUESTION** or a clearly speculative phrasing — it is being weighed, not done | "Should I build a NotePlan plugin?" · "What if I tracked which scripts I use?" · "Is a menu-bar app worth it?" |
| An **acted-on initiative** (experiment / poc / project log / reflection) | `/initiatives` | **what I DID** — past/active accomplishment, a dated record | "Tracking which of my scripts I actually use" · "Support CTA: link vs button" · "Evolution of a repo" |
| A **durable Craft/Journey** doc (framework / mental model / terminology / reference) | `/craft`, `/journey` | the **lasting CONCEPT** — a noun phrase, "Understanding X", "A Framework for X" | "Understanding Dynamic Programming" · "A Framework for Prioritizing" · "Desirable Leadership Skills" |
| A **design write-up** | `/designs` | the SYSTEM being designed (noun phrase) | "The Build System Behind This Blog" |

The headline mistake to catch: **a `/thoughts` idea titled as a completed initiative.** Tells:

- Starts with **"My First …"** ("My First iOS App") — reads as "the app I built", not "should I build an app?".
- A bare **gerund of doing** ("Building a NotePlan Plugin", "Creating X") with no question — reads as the log of doing it.
- States the artifact as a **fact** ("A NotePlan Plugin", "The Menu-Bar App") rather than the decision.

The fix is to phrase the **decision being weighed**: prefer a question ("Should I build X?", "Is X
worth building?", "What would it take to build X?") or an explicitly speculative frame ("An idea: X").

## How to run it

1. **Know the kind + home.** If unsure, run `organize-post` — the kind/home determines the voice.
2. **Read the current title against the contract.** Does the voice match the nature? A `/thoughts`
   post whose title reads as a finished thing is the flag.
3. **Rewrite in the right voice.** For a thought, phrase the question/decision. Keep it short; the
   `sidebar_label` should be even shorter (the question's gist, e.g. "NotePlan plugin?").
4. **If the SLUG would change, do NOT change it casually.** The title/`sidebar_label` can change
   freely (they are not the URL). Only change the `slug:` if the URL genuinely should change — and
   if you do, pair it with a `{from,to}` redirect (the move/split-don't-delete + redirect rules).
   Usually: retitle, keep the slug.
5. **Match the kind too.** A retitle often reveals the `kind:` is wrong (an "idea" mislabeled
   `reflection`). Fix the kind in the same pass (see `blog-kinds.json` + `groom-initiatives`).

## What the check enforces

`scripts/validate-post-naming.js` (`make validate-naming`) + the warn-tier PostToolUse hook
`.claude/hooks/validate-post-naming-hook.sh` encode the high-signal cases: a `/thoughts` post (an
idea-class kind) whose title matches a "completed-initiative" pattern ("My First …", a doing-gerund
with no "?", a bare-artifact noun) is flagged with the suggested question form. Warn-tier only — it
never blocks; naming is a judgment call, the check is a reminder. When you add a new voice rule,
encode it in the validator + this skill in lockstep.

## Relationship to the other skills

- **`organize-post`** decides the KIND + HOME (durable/temporal, acted/unactioned, which kind). The
  voice follows from that, so classify first, then name.
- **`author-blog-post`** owns the `title:` / `sidebar_label:` / `kind:` frontmatter mechanics and the
  emoji system. This skill owns the VOICE of the title; that skill owns the FORM.
- **`review-reader-experience`** audits reader-facing labels/voice site-wide; a title that "reads as
  done" is one of its findings, pointed here for the fix.
