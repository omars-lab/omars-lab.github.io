---
name: find-quote-video
description: Given a quote (and optional speaker), find a genuine motivational video or talk that speaks to it and VERIFY the link resolves to the right, public content, then output the ready-to-paste `video=` prop value for an `<EditorialQuote>`/`<PosterQuote>`. Verification is the core value: confirm the URL loads (200), the video is public (not removed/private/age-gated), the title and channel match the intended talk, the URL is canonical with no tracking params, and the attribution is honest. Use when adding a video to a quote in a quote-set / mindset post, or when asked to find or verify a motivational video for a line. Pairs with upgrade-post (the `video` prop), validate-links (URL hygiene), and modify-blog-ui-component.
---

# Find + verify a video for a quote

The quote kit (`@omars-lab/blog-ui`) lets a quote carry an optional `video` prop: a quiet
"watch" external link to a motivational video or talk that talks through the quote. This skill
finds the RIGHT video for a given quote and **verifies** it before you paste it in. Finding a
plausible link is easy; verifying it resolves to real, public, on-topic content is the work
this skill exists to do.

## When to use

- "Find a motivational video for this quote." / "Attach a talk that speaks to this line."
- After authoring a `quote-set` post (a `<PosterQuote>` cascade or `<EditorialQuote>` set),
  to enrich one or more quotes with a `video=`.
- When a `video=` already on a quote needs re-verifying (a video can go private or get removed).

## The honest verification bar (read this first)

You **cannot watch or listen to the video.** So you cannot certify that the spoken content
matches the quote word for word, or that the talk is "good." Do not claim you can. What you CAN
verify, and what this skill holds you to:

- The link **resolves** (HTTP 200, not a 404 / error page).
- The video is **public** (not "Video unavailable", not "Private video", not age-gated behind
  a sign-in wall, not region-blocked where checkable).
- The **title and channel** match the intended talk (not a lookalike reupload, not a reaction
  video, not a 10-hour-loop remix).
- The talk is **topically about the quote's theme** (judged from the title, channel, and any
  description text the page exposes).
- The **URL is canonical and clean** (no tracking params; see hygiene below).
- The **attribution is honest** (the speaker on the video is who you imply it is).

The final "does this actually move me / is it the right tone" call belongs to the human. Say
so in your output. Never fabricate certainty about content you have not heard.

## Procedure

1. **Read the quote and its claimed source.** Pull out (a) the THEME (what the line is about:
   habit and mastery, obstacle and resistance, thoughts shaping destiny) and (b) the likely
   SPEAKER or origin, if any. Note if the attribution is disputed (many circulated quotes are).

2. **Search for a real talk** (`WebSearch`). Prefer a PRIMARY source in this order:
   - the speaker's own talk / channel,
   - an official upload (TED, a university, a verified channel),
   - a reputable, clearly-labeled channel.
   Avoid faceless "motivation remix" channels, reuploads, and AI-voice compilations. Capture
   2 to 3 candidate URLs.

3. **Verify each candidate** (`WebFetch` the watch page). For each, confirm against the bar
   above: the page returns content (not an error), the `<title>` / `og:title` and channel match
   what you intended, and there is no removal/unavailable signal in the fetched HTML
   ("This video isn't available anymore", "Private video", "Sign in to confirm your age"). Read
   the description text the page exposes to confirm the topic. Discard any candidate that fails.

4. **Clean the URL.** Output a canonical form: `https://www.youtube.com/watch?v=VIDEO_ID` (or
   `https://youtu.be/VIDEO_ID`). Strip tracking and session params (`&t=`, `&list=`, `&ab_channel=`,
   `utm_*`, `si=`). A clean URL is also what keeps `validate-links` happy.

5. **Sanity-check attribution.** Does the speaker on the verified video match the quote's claimed
   source? If the quote is "attributed to Aristotle (actually Will Durant)" and the video is a
   third person reflecting on it, say so plainly. Flag mismatches; never imply the video IS the
   original speaker when it is not. **If the claimed attribution itself looks shaky** (a magnet
   name like Aristotle / Einstein / Gandhi / Lao Tzu on a punchy line), hand off to the
   **`verify-quote-attribution`** skill, which owns the trusted toolset (Quote Investigator,
   Wikiquote's Misattributed/Disputed sections, Snopes, primary-source search) for settling who
   really said it before you commit a `source=`/`cite=`.

6. **Output** the result as a ready-to-paste prop plus an honest note:
   ```
   video="https://www.youtube.com/watch?v=VIDEO_ID"
   ```
   followed by one line: what you verified ("resolves 200, public, title and channel match
   '<talk title>' on '<channel>', topic matches the quote's theme") and any caveat
   ("attribution: the video is X reflecting on the line, not the original speaker"; "could not
   confirm region availability"). If NO candidate passes verification, say that, and do not
   paste an unverified link.

## Where the value lands

Paste the verified value onto the quote in the post:

```mdx
<EditorialQuote source="Will Durant" video="https://www.youtube.com/watch?v=VIDEO_ID">
We are what we <Focus>repeatedly do</Focus>.
</EditorialQuote>

<PosterQuote source="Lao Tzu" video="https://www.youtube.com/watch?v=VIDEO_ID">
  <Beat lead="Watch your" big="THOUGHTS" />
  ...
</PosterQuote>
```

The `video` prop renders a quiet "watch" external link (new tab, `rel="noopener noreferrer"`)
beneath the quote. It is a LINK, not an embed; nothing about the page layout depends on the
video loading.

## Tools

- `WebSearch` (find candidates), `WebFetch` (verify the watch page). Load both via ToolSearch
  if deferred.

## Pairs with

- `verify-quote-attribution` owns the "who really said this" toolset; call it when the claimed
  source looks shaky (a magnet name on a punchy line).
- `upgrade-post` documents the `video` prop in the component catalog.
- `validate-links` enforces URL hygiene (run it on the changed post; a clean canonical URL
  passes).
- `modify-blog-ui-component` if the `video` rendering itself needs changing.
