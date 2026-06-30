# Plan: Poster-style quotes + per-quote video link + two new skills

## Context

The `/mindset` blog renders "quotes that moved me" through a small kit in the local
workspace package `@omars-lab/blog-ui`: one `<Quote>` (editorial pull-quote) inside a
`<QuoteSet>`, with `<Focus>` marking the powerful words. The user wants to *also* render
quotes in the **cascading-typographic-poster** style (the classic "Watch your thoughts →
words → actions → habits → character → destiny" chain: a small connector line above each
giant keyword, repeated down the page — the image they shared). They also want to **attach
a motivational video** to a quote, a **skill that finds and verifies the right video link**
for a quote, and a **skill that documents the component-modification workflow** for this
repo (so the blog-ui edit loop is repeatable).

Outcome: a richer quote family (`<EditorialQuote>` + new `<PosterQuote>`/`<Beat>`), an
optional `video` link on quotes, and two new skills.

## Decisions locked with the user

- **Quote family**: rename `<Quote>` → `<EditorialQuote>`; keep `<Quote>` as a thin
  back-compat alias (re-export) so the one existing post still works with no edit. Add a
  sibling `<PosterQuote>` rendering the cascade chain, composed of child
  `<Beat lead="Watch your" big="THOUGHTS"/>` rungs.
- **Video** = optional `video` prop on the quote components, rendered as a **plain external
  link** ("watch ▶", new tab, `rel="noopener noreferrer"`). No iframe / embed.
- **Skill 1** = find + **verify** a motivational video for a quote (verification is the core
  value).
- **Skill 2** = document the blog-ui component-modification / repo-setup workflow.
- `<PosterQuote>` is a **new renderer within the existing `quote-set` kind**, NOT a new blog
  kind (still "a quote that moved me" — same intent, same `/mindset` home).

## Architecture (verified against the files)

- Quote kit source: `packages/blog-ui/src/components/Quote/` (`index.tsx`, `Focus.tsx`,
  `styles.module.css`) and `packages/blog-ui/src/components/QuoteSet/`. Package barrel:
  `packages/blog-ui/src/index.ts`. Built with `tsup` → ESM + `.d.ts` + one bundled
  `dist/index.css` (CSS modules); react/react-dom external.
- The blog consumes the package via a **local `file:` link** (`"@omars-lab/blog-ui":
  "file:../packages/blog-ui"`), rebuilt+relinked by `make build-blog-ui` (a prerequisite of
  `make start`/`make build`/deploy). dist/ is gitignored and consumed BUILT. The package is
  *also* published to GitHub Packages, but **republishing is NOT required** for these
  changes — the relink is sufficient (publishing is only for other repos; owned by the
  existing `publish-blog-ui` skill).
- MDX registration (no per-post import): `bytesofpurpose-blog/src/theme/MDXComponents.tsx`
  imports from `@omars-lab/blog-ui` and adds to the default export map.
- Blog kinds source of truth: `bytesofpurpose-blog/scripts/lib/blog-kinds.json` — the
  `quote-set` kind has an `outline` with a `quote-cards` element.
- Outline validator: `bytesofpurpose-blog/scripts/validate-post-outline.js` line 106:
  `'quote-cards': (fm, body) => /<Quote[\s>]/.test(body)` — this will **not** match
  `<PosterQuote`/`<EditorialQuote` (the `[\s>]` requires whitespace-or-`>` right after
  `Quote`), so it must be widened.
- Only one content file uses the kit: `bytesofpurpose-blog/mindset/2026-06-25-quotes-that-moved-me.mdx`.
  With `<Quote>` kept as an alias, **it needs no edit**.
- No Storybook stories exist for the Quote kit (none in the package at all), so no Storybook
  lockstep — the visual+mobile pass is done on the live dev surface.

## Load-bearing coupling (do not get this wrong)

`Focus`'s highlight sweep is driven by the selector `.quote:hover .focus` in
`Quote/styles.module.css` (line 126). When renaming the **component** `Quote` →
`EditorialQuote`, **keep the CSS class named `.quote`** (the component's root className stays
`styles.quote`). Renaming the class breaks `<Focus>` silently — build stays green, the hover
effect just dies.

## Component API

`packages/blog-ui/src/components/Quote/PosterQuote.tsx` (new sibling of `Focus.tsx`, same
folder so it shares the folder's CSS module + theme tokens). `<Beat>` is a **separate
exported marker component** (child-composition, matching the house style `QuoteSet→Quote→Focus`;
a `beats={[…]}` array prop would be the unescaped-`{}` MDX footgun). `PosterQuote` reads its
children, filters to `Beat` elements via `React.Children.toArray(...).filter(c =>
React.isValidElement(c) && c.type === Beat)` (tolerating MDX whitespace text nodes — the same
child-introspection lesson `<Question>` already encodes), and owns the cascade render.

```
interface BeatProps  { lead?: string; big: string; className?: string }
interface PosterQuoteProps {
  children: ReactNode;   // <Beat/> rungs
  source?: string; cite?: string;   // attribution, same role/styling as EditorialQuote
  video?: string;        // optional motivational video — plain external link (below)
  reflection?: ReactNode;// optional "why it moved me" reveal, parity with EditorialQuote (stretch)
  className?: string; style?: CSSProperties;
}
```

Render: one `<figure className={styles.poster}>`; each Beat → `<div className={styles.beat}>`
with a small quiet `.beatLead` connector line + a giant bold `.beatBig` display word. A
CSS-only connector mark between rungs (`.beat:not(:last-child)::after` chevron/tick) reads as
"thoughts → words → actions". Attribution `<figcaption>` reuses EditorialQuote's
`.attribution/.source/.cite`. The giant word reuses `<Focus>`'s mint highlight-sweep recipe
(`background-image` linear-gradient in `var(--tea-mint, #adfff5)`, 0%→100%) but triggered on
`.poster:hover` with staggered `nth-of-type` delays, gated by `prefers-reduced-motion`
(static highlight when reduced) — exactly like Focus. Put the poster styles in the **same**
`Quote/styles.module.css` so the `var(--tea-mint)` / `var(--ifm-*)` tokens are shared and
light/dark work with zero new theme wiring.

Mobile (375px): `.beatBig` uses `font-size: clamp(2rem, 1.4rem + 6vw, 4rem)` + `overflow-wrap`
so a long keyword scales down and never overflows the page; `text-align: center` reads as a
poster. The "watch ▶" link is a ≥44px tap target.

**`video` prop** (on BOTH `EditorialQuoteProps` and `PosterQuoteProps`; the `QuoteProps` alias
inherits it). Rendered beneath the quote as a plain link, per repo convention
(`Evidence/index.tsx`):

```jsx
{video && (
  <a className={styles.videoLink} href={video} target="_blank" rel="noopener noreferrer"
     aria-label="Watch the related video (opens in a new tab)">
    <span aria-hidden="true">▶</span> watch
  </a>
)}
```

## Lockstep edits (the full drift surface — nothing ships partial)

| # | File | Edit |
|---|------|------|
| L1 | `packages/blog-ui/src/components/Quote/index.tsx` → `EditorialQuote.tsx` | `git mv`; rename component `Quote`→`EditorialQuote` + `QuoteProps`→`EditorialQuoteProps` (keep a `QuoteProps` type alias); **preserve `.quote` className**; add `video` prop + render |
| L2 | `packages/blog-ui/src/components/Quote/PosterQuote.tsx` | NEW — `PosterQuote` + `Beat` (co-located), child-composition, Focus-style sweep, CSS connector chain, reduced-motion, `video` prop |
| L3 | `packages/blog-ui/src/components/Quote/styles.module.css` | ADD `.poster`/`.beat`/`.beatLead`/`.beatBig` (+ sweep + connector + reduced-motion) and `.videoLink`; keep `.quote`/`.focus` intact |
| L4 | `packages/blog-ui/src/index.ts` | export `EditorialQuote`(+type), keep `Quote` + `QuoteProps` aliases pointing at `EditorialQuote`, export `PosterQuote`(+type), export `Beat`(+type) |
| L5 | `bytesofpurpose-blog/src/theme/MDXComponents.tsx` | import + register `EditorialQuote`, `PosterQuote`, `Beat`; keep `Quote` registered (alias) for the existing post; add house-style block comments |
| L6 | `bytesofpurpose-blog/scripts/validate-post-outline.js` (line 106) | widen to `/<(Quote\|EditorialQuote\|PosterQuote)[\s>]/` |
| L7 | `bytesofpurpose-blog/scripts/lib/blog-kinds.json` | refresh the `quote-cards` outline **label text** to mention the renderers (`<EditorialQuote>` pull-quotes or a `<PosterQuote>` cascade); **no new kind, no emoji change** |
| L8 | build step | `make build-blog-ui` rebuild + RELINK, with the stale-dist fail-safe (below). Skipping ships stale dist → new components silently don't render |
| L9 | `.claude/skills/upgrade-post/SKILL.md` | update the "Quote + QuoteSet" catalog entry to document EditorialQuote/PosterQuote/Beat/`video` (doc-drift, not hook-enforced) |
| L10 | `CLAUDE.md` skills map table | add ONE ROW per new skill |

**Explicitly NOT needed** (cleared): no new blog kind / no Start Here or Mindset legend edit
(D5); no URL-param registry entry (no `?param` read); no idea-tags gloss (not a board post);
no redirect (the package-internal `git mv` is not a public URL); no Storybook story; the
existing quotes post needs no edit (alias).

### The stale-dist fail-safe (Yarn 1 `file:` cache gotcha)

Yarn 1 copies `file:` deps at install and may report "Already up-to-date", leaving the blog's
`node_modules/@omars-lab/blog-ui/dist` STALE after a rebuild — the single biggest "looks done
but renders stale" trap. When an edit doesn't show up: force a clean relink (e.g.
`cp -r packages/blog-ui/dist/ bytesofpurpose-blog/node_modules/@omars-lab/blog-ui/dist/`),
clear `bytesofpurpose-blog/node_modules/.cache/webpack/`, and restart the dev server. Skill 2
captures this prominently.

## The two skills

### Skill 1 — `find-quote-video` (`.claude/skills/find-quote-video/SKILL.md`)

Given a quote (+ optional speaker), find a genuine motivational video/talk that speaks to it
and **verify** the link, then output the ready-to-paste `video="…"` value.

Procedure: (1) extract the theme + likely speaker; (2) `WebSearch` for a real talk (prefer a
primary source — the speaker's own talk, TED/official channel), capture 2–3 candidates;
(3) **verify each** by `WebFetch`-ing the watch page — confirm HTTP 200, the title/channel
match the intended content, the video is public (not "unavailable"/"private"/age-gated),
prefer a canonical `youtube.com/watch?v=` / `youtu.be/` URL with no tracking params, and
sanity-check that the speaker matches the quote's claimed attribution (flag mismatches rather
than overclaim); (4) **state the honest limit plainly**: the agent cannot watch/listen, so it
cannot certify the spoken content matches the quote verbatim — it verifies the link resolves,
is public, title/channel match, and the talk is topically on-theme, and hands the final
"does it move me" gut-check to the human; (5) output the verified URL + a one-line note
("verified: 200, title matches, public") + any attribution caveat.

Tools: `WebSearch`, `WebFetch`. Pairs with `upgrade-post`, `validate-links`, and Skill 2.

### Skill 2 — `modify-blog-ui-component` (`.claude/skills/modify-blog-ui-component/SKILL.md`)

How the `@omars-lab/blog-ui` workspace package works and how to add/modify a component end to
end: (1) WHERE source lives (`packages/blog-ui/src/components/<Name>/` + the barrel
`index.ts`); (2) REGISTER for MDX in `MDXComponents.tsx`; (3) the `tsup` BUILD model (ESM +
dts + bundled `dist/index.css`; react/react-dom external; react-icons `noExternal`;
`sourcemap:false`); (4) the `make build-blog-ui` RELINK loop **and the stale-dist fail-safe**
(the section that saves the most time); (5) CONVENTIONS — CSS modules + theme tokens
(`var(--ifm-*)`/`var(--tea-mint)`) for free light/dark, no hardcoded fills, no literal
em-dashes in rendered strings (the em-dash hook is BLOCKING), reduced-motion gating, the
mandatory 375px + desktop visual pass for any new visual component; (6) PUBLISH vs RELINK —
local edits are live after relink; publishing (other repos) is owned by `publish-blog-ui`
(link, don't duplicate); (7) gotchas: the MDX child-introspection filtering (Question/Beat),
the "JSX comment inside a JSDoc block breaks tsup" trap. Links to (does not duplicate)
`publish-blog-ui`, `upgrade-post`, `serve-locally`, `maintain-showcase`.

Both skills also get a row in the CLAUDE.md skills map (L10).

## Risks / gotchas

- **Em-dash hook is BLOCKING** on reader-facing content. Poster `<Beat>` text, the `video`
  link text, the `blog-kinds.json` label edit, and the SKILL.md files must use no literal `—`
  (U+2014). (The existing `.source::before { content: '\2014\00a0' }` is an *escaped* CSS
  codepoint, not literal reader content — fine, and PosterQuote's attribution reuses it.)
- **Generated-assets hook**: never hand-edit `packages/blog-ui/dist/**` or
  `bytesofpurpose-blog/build*/**`; edit `src/`, then `make build-blog-ui`.
- **Visual + mobile pass is non-optional** for `<PosterQuote>` (new visual component): 375px
  AND desktop, audit-mobile rubric — tap targets ≥44px, no horizontal overflow from a giant
  keyword, ≥16px body text, the cascade visible without hunting, dark mode correct. Deferred
  findings → GitHub issues via ISSUES.md.
- **`<UsedIn>` side-effect**: the `videos-youtube` showcase's `usage_pattern` includes
  `youtu.be/` and `youtube.com/watch`, so a quote's `video=` YouTube link will auto-list under
  that showcase's "used in". Harmless/arguably correct — note it, don't mistake it for drift.

## Verification plan

1. **Package build alone**: `(cd packages/blog-ui && yarn build)` — no tsup error;
   `dist/index.{js,css,d.ts}` emitted; new exports (`EditorialQuote`, `PosterQuote`, `Beat`,
   `Quote` alias) present in `dist/index.d.ts`.
2. **Relink + run**: `make build-blog-ui` then `make start` (:3000, drafts visible). If the
   components don't render, apply the stale-dist fail-safe and restart.
3. **Demo content**: add a `<PosterQuote>` with 3–4 `<Beat>` rungs + a verified `video=` to
   `mindset/2026-06-25-quotes-that-moved-me.mdx` (small), and a `video=` to one existing
   `<Quote>` to exercise the prop on both. Confirm the existing `<Quote>`/`<Focus>` blocks
   still render unchanged (alias intact).
4. **Visual + mobile pass** (mandatory): chrome-devtools / claude-in-chrome at 375px AND a
   desktop width on the quotes post — cascade reads as a poster, mint sweep on hover,
   reduced-motion static, no horizontal overflow, "watch" link ≥44px + new tab, dark mode
   correct. Screenshot both.
5. **Validators**: `node bytesofpurpose-blog/scripts/validate-post-outline.js
   bytesofpurpose-blog/mindset` (proves the widened `quote-cards` check passes for both
   `<Quote>` and a `<PosterQuote>`-only section); `make validate-links` on the changed post
   (the `video=` URL must pass hygiene — no tracking params); `make typecheck` (proves
   MDXComponents.tsx resolves against the new dist `.d.ts`); `make validate-naming` for safety.
6. **Skills**: dry-run Skill 1 on the demo quote (WebSearch+WebFetch → verified URL + honest
   caveat); read Skill 2 against the real paths; confirm both appear in the CLAUDE.md skills map.
7. **Optional clean prod build** (rehype/draft transforms only run there): `make build` then
   `make serve` — confirm the components render in the built site, not just dev.

## Ordered implementation phases

- **Phase 0 — Tasks**: create one task per deliverable (Quote→EditorialQuote+alias;
  PosterQuote+Beat; video prop; lockstep edits; Skill 1; Skill 2; verification/mobile pass).
- **Phase 1 — Package source**: L1 (git mv + rename + video prop, preserve `.quote`) → L2
  (PosterQuote+Beat) → L3 (styles) → L4 (barrel).
- **Phase 2 — Blog wiring + validators**: L5 (MDXComponents) → L6 (widen regex) → L7
  (blog-kinds label).
- **Phase 3 — Build + verify**: L8 `make build-blog-ui` (+ fail-safe) → `make start` →
  demo content (V3) → visual+mobile pass (V4) → validators + typecheck (V5).
- **Phase 4 — Docs + skills**: L9 (upgrade-post catalog) → Skill 1 → Skill 2 → L10 (two
  skills-map rows) → dry-run skills (V6) → optional clean prod build (V7).
- **Phase 5 — Wrap**: changelog batch (de-em-dashed, MDX-safe) per `manage-changelog` if
  archiving tasks; commit/PR only if the user asks (branch first — never commit to master).

## Critical files

- `packages/blog-ui/src/components/Quote/index.tsx` (→ git mv to `EditorialQuote.tsx`) + new `PosterQuote.tsx` + `styles.module.css`
- `packages/blog-ui/src/index.ts`
- `bytesofpurpose-blog/src/theme/MDXComponents.tsx`
- `bytesofpurpose-blog/scripts/validate-post-outline.js`
- `bytesofpurpose-blog/scripts/lib/blog-kinds.json`
- `.claude/skills/find-quote-video/SKILL.md` + `.claude/skills/modify-blog-ui-component/SKILL.md` (new) + `.claude/skills/upgrade-post/SKILL.md` + `CLAUDE.md` (skills map)
