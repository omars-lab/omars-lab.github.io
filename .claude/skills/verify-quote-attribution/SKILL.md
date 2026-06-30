---
name: verify-quote-attribution
description: Verify who REALLY said a quote before you attribute it, using a trusted toolset (Quote Investigator, Wikiquote's Misattributed/Disputed sections, Snopes and fact-checkers, and primary-source search in the claimed original work). Many circulated "motivational" quotes are misattributed (Aristotle, Einstein, Gandhi, Lao Tzu, Buddha, Mark Twain are magnet names). Use BEFORE setting a `source=`/`cite=` on an `<EditorialQuote>`/`<PosterQuote>`, when a quote "feels" like a too-perfect attribution, or whenever find-quote-video flags an attribution mismatch. Output an honest source + cite (the real attributor, or "misattributed to X; traces to Y", or "origin uncertain"). Pairs with find-quote-video (which calls this), upgrade-post (the quote kit), and validate-links.
---

# Verify a quote's attribution

A surprising share of circulated quotes are **misattributed** — credited to a famous name to
borrow its gravitas. This site attributes quotes (`source=` / `cite=` on `<EditorialQuote>` and
`<PosterQuote>`), so a wrong attribution ships as a factual error in a /mindset post. This skill
is the method + the trusted toolset for getting it right before you paste it.

Two real catches from this repo: "We are what we repeatedly do. Excellence, then, is not an act,
but a habit" is **Will Durant summarizing Aristotle**, not Aristotle (Snopes). "Watch your
thoughts ... it becomes your destiny" traces to **Frank Outlaw (1977)**, NOT Lao Tzu (Quote
Investigator) — the Lao Tzu credit is a recent, unsupported invention.

## When to use

- BEFORE setting `source=` / `cite=` on a new quote in a `quote-set` / mindset post.
- When an attribution "feels" too perfect — a magnet name (Aristotle, Einstein, Gandhi, Lao Tzu,
  Buddha, Mark Twain, Marcus Aurelius, Confucius) on a punchy modern-sounding line.
- When `find-quote-video` flags that the speaker on a video does not match the claimed source.
- When re-checking an existing post's quotes for honesty.

## The trusted toolset (in order of strength)

1. **Quote Investigator** (`quoteinvestigator.com`) — the gold standard. Deep, sourced
   etymologies that trace a saying to its earliest documented use and name the real (or earliest
   traceable) author. When QI has an entry, it usually settles the question. (This is what caught
   the Frank Outlaw vs Lao Tzu error.)
2. **Wikiquote** (`wikiquote.org`) — citation-heavy and fast. Crucially, each author page has a
   **"Misattributed"** and often a **"Disputed"** section; check those, not just the main list.
   A quote sitting under "Misattributed to Einstein" is your answer.
3. **Snopes and reputable fact-checkers** (`snopes.com`, and similar) — best for the FAMOUS
   misattributions that have been formally fact-checked (the Aristotle/Einstein/Gandhi tier).
4. **Primary-source search** — the strongest proof when you can get it: search for the quote's
   exact words INSIDE the claimed original work (Google Books, the actual public-domain text,
   the speech transcript). Finding the real sentence in the real book confirms it; NOT finding
   it after a fair search is strong evidence of misattribution. Slower, so use it to confirm a
   suspicion or when 1 to 3 disagree.

Use `WebSearch` to reach these (e.g. `site:quoteinvestigator.com "<quote phrase>"`,
`<author> wikiquote misattributed`, `<quote> snopes`) and `WebFetch` to read the specific page.

## Method

1. **Form the claim.** Note the quote and the attribution you are tempted to use.
2. **Check QI first** (`site:quoteinvestigator.com "<a distinctive phrase from the quote>"`). If
   it has an entry, read who it credits and the earliest date.
3. **Cross-check Wikiquote** — find the claimed author's page, scan the **Misattributed /
   Disputed** sections for the line.
4. **Fact-checkers** for the famous cases (Snopes etc.).
5. **Primary source** if still unsure or to confirm: search the quote inside the claimed work.
6. **Decide the honest attribution** and write it. Match the truth to a `source=`/`cite=`:
   - Confirmed: `source="Will Durant" cite="The Story of Philosophy, 1926"`.
   - Real author, popularly misattributed: `source="Will Durant" cite="often attributed to
     Aristotle, whom Durant was summarizing"`.
   - Disputed / evolved / no solid origin: name the earliest traceable source and say so:
     `source="Frank Outlaw" cite="often misattributed to Lao Tzu; traces to a 1977 saying"`.
   - Genuinely unknown: `cite="origin uncertain"` — do NOT invent a famous name to fill the gap.

## Output

Return the honest `source=` / `cite=` to paste, plus a one-line basis and any caveat, e.g.:

```
source="Frank Outlaw" cite="often misattributed to Lao Tzu; traces to a 1977 Frank Outlaw saying"
```
> basis: Quote Investigator traces it to Frank Outlaw (1977); the Lao Tzu credit first appears on
> Goodreads in 2010 with no historical support. Wikiquote lists it under disputed.

Never fabricate certainty. "Origin uncertain" is a perfectly honest, shippable attribution; a
confidently wrong famous name is not.

## Honesty about limits

These sources are good but not infallible, and some quotes genuinely have no settleable origin.
When the trusted sources disagree or go quiet, say "origin uncertain / disputed" rather than
picking the most flattering option. The goal is an attribution that will not embarrass the post
if a reader checks it.

## Tools

- `WebSearch`, `WebFetch` (load via ToolSearch if deferred).

## Pairs with

- `find-quote-video` calls this when a video's speaker does not match the claimed source.
- `upgrade-post` (the quote kit) — attribute quotes honestly when authoring a `quote-set`.
- `validate-links` (URL hygiene for any source link you cite).
