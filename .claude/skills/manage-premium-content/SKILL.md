---
name: manage-premium-content
description: The editorial POLICY for premium/gated content on the Bytes of Purpose blog — what should be premium vs free vs draft, how to choose the sneak-peek/teaser, the tiering decision checklist, and how premium composes with draft. The "should this be premium?" source of truth. Use when deciding whether a doc/section should be gated, or setting the teaser. For the how-to-mark mechanics see author-blog-post; for enforcement see the V1/V5 validators.
---

# Manage premium content (the editorial policy)

This skill owns **whether** content should be gated — the judgement, not the mechanics.

- **How to MARK a doc premium** (frontmatter, `<Premium>`, build) → `author-blog-post`.
- **How premium is ENFORCED** (compile-time encryption, the blocking deploy gate) →
  `validate-docs-structure.js` V1 + `scripts/verify-premium-encrypted.js` V5; architecture
  in the `premium-content-gating` design doc + the `premium-gating-architecture` memory.
- **The reader-facing surfaces** (`PremiumGate`, `Premium`, `SignInModal`) are themed to
  the blog brand — keep new premium UX aligned with `review-reader-experience`.

## The three states: free vs premium vs draft

| State | Who sees the body | When to use |
|---|---|---|
| **Free** (default) | everyone | the default. Most content should be free — premium is the exception, not the rule. |
| **Premium** (`premium: true`) | signed-in (LinkedIn) readers only; encrypted in the public bundle | finished, high-effort, original work you'd gate as a lead magnet. |
| **Draft** (`draft: true`) | nobody in prod (excluded from the build) | unfinished / not-yet-public. **Mutually exclusive with premium** — a draft is never built, so it'd never be encrypted. |

A doc is **either** draft (not ready) **or** published; if published it's **either** free
or premium. Never both `draft` and `premium`.

## Should this be premium? — the checklist

Mark a doc premium only if it clears MOST of these. When in doubt, ship it free — a gated
mediocre post costs more goodwill than it earns.

- [ ] **Original & high-effort** — a deep-dive, a hard-won lesson, a complete system, not a
      link roundup or a quick note.
- [ ] **Lead-magnet intent** — gating it meaningfully nudges sign-in (you'd trade the email
      for the read). If nobody would sign in for it, gating just hides it.
- [ ] **Evergreen** — still valuable in 6–12 months. Time-sensitive posts lose their
      gate's value fast.
- [ ] **Stands alone** — not a prerequisite for free content (don't gate something a free
      post depends on; that breaks the free reader's path).
- [ ] **Honest about the caveat** — the repo is PUBLIC, so the *source* MDX is readable on
      GitHub even though the *deployed* body is encrypted. Premium gates the deployed site,
      not the source. Only gate content where that's an acceptable trade (it usually is —
      few readers go spelunking in the repo, and the design doc winks at this openly).

## Choosing the teaser (the sneak-peek)

The teaser is the only part of a premium doc that ships in clear — it's the hook. It also
populates the gate's gold **disclaimer pane** (the locked-state info box rendered by
`PremiumGate`), so it must read as reader-facing copy.

- Set **`premium_teaser`** in frontmatter (1–2 sentences). If absent, the gate falls back
  to `description`, so a real `description` is the minimum.
- Make it a genuine hook: the question the piece answers or the payoff. Write it like the
  first line of the post, because that's what it is.
- **Reader-facing only — never expose the mechanics.** Don't mention encryption, "the
  published bundle", build-time anything, StatiCrypt, the Worker, or how the gate works.
  The reader only needs to know it's **premium content that unlocks when they sign in with
  LinkedIn**. Mechanics belong in the design doc, not on the page. (Same rule for the doc's
  `description` and the `PremiumGate` fallback string — keep all three jargon-free.)
- Keep it honest — it should accurately preview the gated body, not oversell it.

  Good: *"This is premium content — sign in with LinkedIn to read the rest."* · a real
  one-line hook for the piece.
  Bad: *"Everything below is encrypted in the published bundle and decrypts once you sign
  in."* (leaks implementation; reads like a system note, not an invitation).

## Soft `<Premium>` vs hard whole-doc gate (policy view)

- **Whole-doc `premium: true`** = the body must not be readable in the public bundle
  (cryptographic withholding). Use for the real lead-magnet content.
- **Inline `<Premium>`** = a *nudge*. The wrapped children still ship in the bundle (just
  blurred), so it's for teasing/upselling within a free doc — NEVER for content that must
  actually be withheld. If it must be hidden, make the whole doc premium.

## When you change the policy, update the checks

Per the repo convention, premium is a STRUCTURE decision. If you change what counts as
premium (new frontmatter field, new rule), update `validate-docs-structure.js` (V1 premium
rules) + `verify-premium-encrypted.js` (V5) **in the same change**, and reflect it in
`author-blog-post` (mechanics) and the `premium-gating-architecture` memory. Keep policy
(here) and enforcement (the validators) in lockstep.
