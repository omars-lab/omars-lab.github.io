---
name: audit-post-names
description: AUDIT post titles against the title-voice contract — flag a title whose voice does not match the post's nature (an unactioned thought titled like a finished thing, "My First X" / "Building X", when it is really a question being weighed). This skill is the AUDITOR; the naming CONTRACT it checks against lives in the author-post skill (mechanics.md, "Naming"). TRIGGERS when reviewing a title/sidebar label, when a title "reads as done" but the work isn't, when scanning sidebar labels site-wide, or right after organize-post classifies a piece. Runs `validate-post-naming.js` (`make validate-naming`) + the warn hook. To WRITE a good title (the contract, the voice-per-nature table, the fix), use author-post. Pairs with author-post (the contract + authoring), organize-post (decides the kind/home the voice follows from), and review-reader-experience (the site-wide voice audit).
---

# Audit post names (does the title's voice match the post's nature?)

This skill AUDITS. It answers one question: **does a post's title read in the voice its nature
demands?** An unactioned thought must read as an **open QUESTION**; an acted-on initiative as **what
I DID**; a durable doc as the **lasting CONCEPT**. The classic failure it catches is an idea titled
like a finished thing ("My First NotePlan Plugin") when it is really a question being weighed
("Should I build a NotePlan plugin?").

> **The CONTRACT lives in `author-post`.** The voice-per-nature table, the tells, and the fix are in
> **`author-post/mechanics.md` → "Naming"** (writing a good title is a creation-time concern, so the
> rule lives with the authoring skill). This skill points there for the fix and runs the check. To
> WRITE or REWRITE a title, open `author-post`; to AUDIT existing titles, stay here.

## Run the audit

```bash
make validate-naming          # scans /thoughts posts for the completed-initiative pattern
```

`scripts/validate-post-naming.js` + the warn-tier PostToolUse hook
`.claude/hooks/validate-post-naming-hook.sh` encode the high-signal cases: a `/thoughts` post (an
idea-class kind) whose title matches a "completed-initiative" pattern ("My First …", a doing-gerund
with no "?", a bare-artifact noun) is flagged with the suggested question form.

**Warn-tier only** — it never blocks; naming is a judgment call and the check is a reminder.

## Triage a finding

1. **Confirm the nature.** Is the flagged post really an unactioned thought? If unsure, run
   `organize-post` — the kind/home determines the required voice. (A post correctly acted-on and
   titled as what-I-DID is a false positive; a mis-classified kind is the real fix.)
2. **Rewrite in the right voice.** Follow `author-post/mechanics.md` → "Naming": phrase the decision
   as a question ("Should I build X?"), keep the `sidebar_label` even shorter (the question's gist).
3. **Check the `kind:` too.** A retitle often reveals a wrong `kind:` (an idea mislabeled
   `reflection`) — fix it in the same pass (`blog-kinds.json` + `groom-initiatives`).
4. **Keep the slug.** Retitle freely (title/`sidebar_label` are not the URL); only change `slug:` if
   the URL genuinely should change, and then pair it with a `{from,to}` redirect.

## Extending the audit

When you add a new voice rule, encode it in **both** `validate-post-naming.js` AND the "Naming"
section of `author-post/mechanics.md` in lockstep (the contract and the check must not drift).

## Relationship to the other skills

- **`author-post`** owns the naming CONTRACT (mechanics.md → "Naming") + all the authoring mechanics.
  This skill is the audit half that references it.
- **`organize-post`** decides the KIND + HOME; the required voice follows from that, so classify
  first when a finding's nature is unclear.
- **`review-reader-experience`** audits reader-facing labels/voice site-wide; a title that "reads as
  done" is one of its findings, pointed here + to `author-post` for the fix.
