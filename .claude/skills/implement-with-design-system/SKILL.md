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
