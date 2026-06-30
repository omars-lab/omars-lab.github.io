---
name: implement-with-design-system
description: How to build on-brand production UI in THIS repo per the Bytes of Purpose design system — the named token vocabulary and WHEN to use each (spacing/radius/lift/duration/ease/shadow/type/tracking + semantic aliases), and the hard DISCIPLINE rules (pastels are accent fills only / never text with --tea-ink the only ink on them; premium-gold only on premium surfaces; Fraunces headings + Geist body + Geist Mono code; cards = surface + hairline + gentle radius with shadow earned on HOVER not at rest; ALL motion respects prefers-reduced-motion via the useReducedMotion() pattern; the editorial eyebrow is 0.18em only, badges/pills keep their own micro-tracking; the cathedral-arch silhouette; no em-dash voice). Also the "repo reality vs DS intent" gotchas (the hairline ships as Infima #ebedf0, not the DS's #dde2df). Use BEFORE writing or changing any CSS/component so it is on-brand by construction; the values live in src/css/custom.css and are enforced by `make validate-ds-tokens` + check-contrast. Pairs with modify-blog-ui-component, maintain-homepage-hero, review-reader-experience, and the claude.ai/design "Bytes of Purpose Design System" project (which is for throwaway mocks, NOT this production repo).
---

# Implement per the Bytes of Purpose design system

Use this BEFORE you write or change CSS / a component, so the result is on-brand **by
construction** instead of needing an audit afterward. The brand's raw values + the named
token layer live in **`bytesofpurpose-blog/src/css/custom.css`** (the `:root` block + the
`html[data-theme='dark']` overrides). This skill says **which token to reach for** and the
**discipline rules** that an audit would otherwise catch.

> There is ALSO a "Bytes of Purpose Design System" project on claude.ai/design. That one is
> for generating **throwaway mocks / prototypes**. THIS skill is for **production code in this
> repo**. They share a brand; they are not the same artifact. (The design project even carries
> a "Reconciliation notes" section flagging where IT diverges from what this repo ships.)

## Reach for a token, not a literal

When you'd type a raw value, use the named token instead. The values already match, so this
is non-breaking; it keeps everything on one source of truth (and `make validate-ds-tokens`
will flag the literal).

| You're about to type | Use instead | Notes |
|---|---|---|
| `translateY(-4px)` (hover lift, card) | `var(--lift-card)` | the hero/feature/card hover lift |
| `translateY(-2px)` (hover lift, list/article) | `var(--lift-subtle)` | the lighter list/article lift |
| `0 1px 3px rgba(20,32,26,.08)` (quiet rest) | `var(--ifm-global-shadow-lw)` / `var(--shadow-sm)` | the faint resting step |
| `0 6px 20px rgba(20,32,26,.1)` (hover) | `var(--ifm-global-shadow-md)` / `var(--shadow-md)` | the medium hover step |
| any other ad-hoc card `box-shadow` | one of the two steps above | the system is TWO steps, not many |
| `drop-shadow(0 6px 16px rgba(26,26,26,.18))` | `var(--shadow-arch)` | the arch illustration shadow |
| `14px` radius (hero / chooser card) | `var(--radius-lg)` | the big card corner |
| `8px` / `0.5rem` radius (a CARD) | `var(--radius-md)` | only on genuine cards; not toggles/containers/pills |
| `0.4rem` radius | `var(--radius-sm)` | small controls / buttons |
| `0.2s` / `0.18s` / `0.12s` transition | `var(--duration-slow / -base / -fast)` | + `var(--ease-standard)` (=`ease`) |
| `0.25rem … 5rem` LAYOUT spacing | `var(--space-1 … --space-9)` | spacing only — NOT font-size (many `*rem` are type) |
| `#448061` / `#3c7256` (brand green) | `var(--brand-green)` / `var(--ifm-color-primary)` | `--ifm-color-primary` is the AA-safe TEXT green |
| `#dde2df` hairline | `var(--ifm-color-emphasis-200)` | see the gotcha below — the repo ships `#ebedf0` today |
| heading font | `var(--ifm-heading-font-family)` / `var(--font-serif-display)` | Fraunces |
| body / UI font | `var(--ifm-font-family-base)` / `var(--font-sans-body)` | Geist |
| code font | `var(--ifm-font-family-monospace)` / `var(--font-mono)` | Geist Mono |
| eyebrow tracking (editorial only) | `var(--tracking-eyebrow)` (`0.18em`) | see eyebrow rule below |

The full type scale (`--text-display … --text-eyebrow`), weights (`--weight-*`), tracking
(`--tracking-*`), and line-heights (`--leading-*`) are all defined too — prefer them over raw
`rem`/number literals when the value is a scale step.

## Token reference (the full catalog)

Every token, by category, with its value + purpose — the complete inventory the table above draws
from. Source of truth: `bytesofpurpose-blog/src/css/custom.css` (`:root` + the
`html[data-theme='dark']` overrides). **Keep this in lockstep with that file** (the
`validate-ds-tokens` guard checks usage, not this doc). Dark-mode values are noted where they differ.

### Color — brand
| Token | Light | Purpose / dark |
|---|---|---|
| `--ifm-color-primary` | `#3c7256` | the AA-safe green for TEXT/links. Dark: `#6fbf95` |
| `--brand-green` | `#448061` | the hero "deep green" for large/decorative FILLS (not text) |
| `--ifm-color-primary-dark/-darker/-darkest` | shades | hover/active steps (Infima shade math) |
| `--ifm-color-primary-light/-lighter/-lightest` | shades | lighter steps (e.g. card hover border) |
| `--ifm-color-primary-contrast-background` / `--accent-tint` | `rgba(68,128,97,.1)` | faint green wash behind icons/callouts |

### Color — tea-party pastels (ACCENT FILLS ONLY — never text; see discipline rule 1)
| Token | Value | Purpose |
|---|---|---|
| `--tea-pink` | `#ffc5d3` | pastel fill (chips/pills/the hero rule) |
| `--tea-mint` | `#adfff5` | pastel fill (tag pills, `::selection`) |
| `--tea-green` | `#d2ffc4` | pastel fill |
| `--tea-ink` | `#2f5d47` | the ONLY text/ink allowed on a pastel fill. Dark: `#14241c` |

### Color — surfaces & ink
| Token | Light | Purpose / dark |
|---|---|---|
| `--ifm-background-color` / `--surface-page` | `#eef1ef` | the cool off-white "paper" page. Dark: `#1c1f1e` |
| `--ifm-card-background-color` / `--surface-card` | `#f4f6f5` | raised card surface. Dark: `#242827` |
| `--ifm-font-color-base` / `--text-body` | `#1a1d1b` | body ink. Dark: `#e7ebe9` |
| `--ifm-heading-color` / `--text-heading` | `#14201a` | heading ink. Dark: `#f4f6f5` |
| `--ifm-color-content-secondary` / `--text-secondary` | `#46504b` | secondary ink. Dark: `#a7b0ab` |
| `--ifm-color-emphasis-200` | Infima `#ebedf0` (see gotcha) | the hairline border color |
| `--bop-divider` | `rgba(26,26,26,.1)` | a divider line. Dark: `rgba(255,255,255,.12)` |

### Color — premium gold (premium/locked surfaces ONLY — see discipline rule 3)
`--premium-gold` `#9a7b1f` (AA text) · `--premium-gold-bright` `#d4af37` (sheen/icons) ·
`--premium-gold-strong`, `--premium-gold-sheen-1/-2`, `--premium-gold-border`, `--premium-gold-wash`
(a faint gradient). All lifted in dark mode for AA.

### Spacing — soft 4px base (LAYOUT spacing only; NOT font-size)
`--space-1` .25rem · `--space-2` .5rem · `--space-3` .75rem · `--space-4` 1rem · `--space-5` 1.5rem ·
`--space-6` 2rem · `--space-7` 2.5rem · `--space-8` 3.5rem · `--space-9` 5rem

### Radii
`--radius-sm` .4rem (small controls/buttons) · `--radius-md` .5rem (=8px, default card corner) ·
`--radius-lg` 14px (hero/chooser card) · `--radius-pill` 3em (pills/tags) · `--radius-full` 9999px
(circles). Also `--ifm-global-radius` (.5rem) / `--ifm-button-border-radius` (.4rem).

### Type — families & scale
- Families: `--ifm-heading-font-family` / `--font-serif-display` = **Fraunces**;
  `--ifm-font-family-base` / `--font-sans-body` = **Geist**; `--ifm-font-family-monospace` /
  `--font-mono` = **Geist Mono**.
- Heading scale (Fraunces): `--text-display` 4rem · `--text-h1` 2.75rem · `--text-h2` 2rem ·
  `--text-h3` 1.5rem · `--text-h4` 1.3rem · `--text-h5` 1.1rem · `--text-h6` 1rem.
- Body/UI scale (Geist): `--text-lead` 1.5rem (italic-serif subtitle) · `--text-body-lg` 1.125rem ·
  `--text-body-md` 1rem · `--text-body-sm` .95rem · `--text-caption` .85rem · `--text-eyebrow` .8rem.
- Weights: `--weight-regular` 400 · `--weight-medium` 500 · `--weight-semibold` 600 · `--weight-bold` 700.
- Tracking: `--tracking-tight` -.01em (large display) · `--tracking-heading` -.005em (headings) ·
  `--tracking-normal` 0 · `--tracking-eyebrow` .18em (the editorial eyebrow ONLY — rule 7).
- Line-height: `--leading-display` 1.05 · `--leading-heading` 1.25 · `--leading-body` 1.7 ·
  `--leading-tight` 1.45.

### Borders
`--border-hairline` `1px solid var(--ifm-color-emphasis-200)` (the standard card/divider hairline) ·
`--border-accent` `2px solid var(--ifm-color-primary)` (e.g. the green table header rule).

### Elevation (quiet two-step; shadow on HOVER not rest — rule 5)
`--ifm-global-shadow-lw` / `--shadow-sm` = `0 1px 3px rgba(20,32,26,.08)` (faint resting step) ·
`--ifm-global-shadow-md` / `--shadow-md` = `0 6px 20px rgba(20,32,26,.1)` (medium hover step;
heavier in dark) · `--shadow-arch` = `drop-shadow(0 6px 16px rgba(26,26,26,.18))` (arch illustration).

### Motion (short & eased; always reduced-motion-guarded — rule 6)
`--ease-standard` `ease` · `--ease-out` `cubic-bezier(0.2,0.7,0.3,1)` · `--duration-fast` .12s ·
`--duration-base` .18s · `--duration-slow` .2s · `--lift-card` `translateY(-4px)` (card hover lift) ·
`--lift-subtle` `translateY(-2px)` (list/article hover lift).

## The DISCIPLINE rules (what an audit checks — get them right up front)

1. **Pastels are ACCENT FILLS ONLY, never text.** `--tea-pink / --tea-mint / --tea-green`
   are backgrounds for chips/pills/tag-fills/the one hero rule. The ONLY text color allowed
   to ride on a pastel fill is **`--tea-ink`** (a deep green, AA on all three). Never set a
   `color:` to a pastel.
2. **Brand green via token.** Green TEXT/links use `--ifm-color-primary` (the AA-safe
   `#3c7256`); `--brand-green`/`#448061` is for large/decorative fills only. No raw green hex.
3. **Premium-gold only on premium/locked surfaces.** The `--premium-gold*` family is for the
   premium gate, lock badges, premium sidebar links, and the insider-tip callout — nowhere
   else.
4. **Type is fixed:** Fraunces headings, Geist body/UI, Geist Mono code. No other font
   stacks. (No Raleway, no Nunito Sans — both were removed for being off-brand.)
5. **Cards = surface fill + a 1px hairline + a gentle radius, and shadow is earned on HOVER,
   not at rest.** A resting card carries at most the quiet `--ifm-global-shadow-lw`; it gains
   `--ifm-global-shadow-md` + a `var(--lift-*)` on `:hover`. Best-in-class examples to copy:
   `HomepageFeatures .featureCard`, `LatestPosts .postCard`, `PremiumGate .card`
   (rest `lw` → hover `md`). (Media frames — Mockup/Gif/Walkthrough — intentionally
   rest-elevate; modals/toasts/popovers are floating UI and legitimately carry heavy resting
   shadow. Those are NOT card violations.)
6. **ALL motion respects `prefers-reduced-motion` — no exceptions.** There is NO global
   reduced-motion reset, so EACH animation must self-guard:
   - CSS: add `@media (prefers-reduced-motion: reduce) { .x { animation: none } }` in the
     component's own module (see `BookmarkletButton`, `EspressoIcon`, the hero skeleton), or
     the inverted form `@media (prefers-reduced-motion: no-preference)` (DebugMenu).
   - JS: gate the timer/rAF on the preference. The repo's reactive hook is
     **`useReducedMotion()`** in `src/pages/index.tsx` (mirrors `useIsMobile`); the
     auto-cycling heroes early-return from their `setInterval`/`requestAnimationFrame` when it
     is true, pinning the scene. The one-shot read is `prefersReducedMotion()`. Never start
     looping/auto-advancing motion without one of these.
7. **The eyebrow is 0.18em — but ONLY the editorial eyebrow.** `--tracking-eyebrow` (`0.18em`)
   is for the hero/section editorial eyebrow label (`.heroEyebrow`). Badges, pills, tags, and
   chips have their OWN deliberate micro-tracking (0.5px / 0.03–0.05em) — do NOT normalize
   those to 0.18em (it looks broken on a small chip).
8. **Arch illustrations use the cathedral-arch silhouette:** `border-radius: 110px 110px 14px
   14px` + an outlined edge + `var(--shadow-arch)`. Source art clipped to the canonical arch;
   see the `import-arched-image` skill.
9. **No em-dash voice.** A literal `—` in reader-facing content reads as AI voice and the
   `em-dash-voice-hook.sh` BLOCKS it. Use a period, comma, parens, or the brand middot `·`.
   (The middot is also the brand's connective separator in eyebrows/metadata/footers.)
10. **Emoji are sparing:** one leading glyph per nav/chooser card or section header — never
    mid-sentence, never decorative clutter.

## Gotchas (repo reality vs. the design system's stated intent)

- **The hairline color.** The DS *intends* `#dde2df` (`--bop-border`), but the repo has NOT
  overridden Infima's `--ifm-color-emphasis-200`, so hairlines actually render **`#ebedf0`**.
  Use `var(--ifm-color-emphasis-200)` for borders; don't hardcode either hex. Adopting
  `#dde2df` site-wide is a deliberate pending decision (it shifts every bordered surface).
- **Shadow tokens are aliases.** `--shadow-sm/-md` == `--ifm-global-shadow-lw/-md`. Change the
  Infima values, not a parallel set.
- **The DS `core/*` components are prototypes**, not this repo's production components. For
  real reusable components see `modify-blog-ui-component` (the `@omars-lab/blog-ui` package)
  and `bytesofpurpose-blog/src/components/*`.
- **Generated assets / hero file are guarded.** Don't hand-edit generated outputs (a PreToolUse
  hook blocks it), and read `maintain-homepage-hero` before touching `src/pages/index.tsx` /
  `index.module.css` / `SplitFlap` (anchor-guarded, A/B-tested).

## Verify

- `make validate-ds-tokens` — flags hardcoded values that have a canonical token (the
  enforcement counterpart to this skill; a warn-tier PostToolUse hook runs it on CSS edits).
- `make check-contrast` — fast WCAG-AA gate over the theme color pairs (add a pair to its
  manifest when you introduce a new readable fg/bg surface).
- For motion: test with `prefers-reduced-motion: reduce` (Playwright `reducedMotion: 'reduce'`
  / chrome-devtools emulate) and confirm looping/auto motion stops. The homepage hero has e2e
  coverage in `test/e2e/homepage.spec.ts` ("reduced-motion does not auto-advance").
- Do the new-component visual + mobile pass (375px + desktop) per the repo convention.

## Related skills

`modify-blog-ui-component` (reusable components) · `maintain-homepage-hero` /
`tune-hero-visually` (the hero) · `import-arched-image` (arch art) · `upgrade-post` (the MDX
component catalog) · `review-reader-experience` + `audit-mobile-experience` /
`audit-desktop-experience` (the audits this skill front-runs) · `manage-changelog` (the
changelog surface).
