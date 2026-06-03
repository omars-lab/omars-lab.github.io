# Mobile-experience audit — first run (2026-06-03)

Inaugural run of the `audit-mobile-experience` skill against the served prod build
(`yarn serve --port 4173`, commit `eea29027`). Driven by chrome-devtools MCP: emulated
iPhone SE (375×667, mobile+touch), the 768px breakpoint edge, and a 1280px desktop
parity baseline; both probe numbers and screenshots captured. **Report only — no fixes
applied** (fixes are separate, per-item approved follow-ups).

## Headline

The site is **genuinely mobile-reflowed, not a shrunk desktop** on the things that
matter most: the homepage chooser (incl. the new "Browse My Thoughts" card) **stacks to
a clean single column** at 375px with properly-scaled arched images; no surface scrolls
the page sideways; Lighthouse **mobile a11y = 100, SEO = 100, best-practices = 96**. The
real gaps are **tap-target sizes below the 44px WCAG-2.2 floor** (systemic) and a cluster
of **sub-16px text** on the changelog. One genuinely-clipped component (the changelog
heatmap) turned out to be an intentional inner-scroller on closer look.

## Findings (prioritized)

### P0 — broken
*None.* No page-level horizontal scroll, no dead touch interaction, no
content-present-on-desktop-but-absent-on-mobile (the 5 navbar links missing at 375px —
Craft/Self/Blog/System Designs/Vote/Support — are folded into the hamburger drawer and
reachable, i.e. collapsed-not-hidden).

### P1 — degraded (real, worth fixing)
1. **Premium "Sign in with LinkedIn" CTA is 36px tall (<44px).** Surface: `/craft/
   premium-gating-demo` @ 375px. Evidence: probe → `{w:206, h:36, reachable:false}`.
   This is the premium **conversion** action, so it's the highest-value tap-target fix.
   Likely fix: bump the button min-height to 44px in `PremiumGate/styles.module.css`
   (it already has a `768px` query — extend it).
2. **Doc article footer overflows its container by ~16px on every doc page.** Surface:
   `/craft`, `/craft/software-development`, `/craft/premium-gating-demo` @ 375px.
   Evidence: `article` `scrollWidth 348` inside `clientWidth 332`; widest descendants are
   the Docusaurus `.row`/`.col` footer rows (`theme-doc-footer-tags`,
   `theme-doc-footer-edit`) rendering to `right:369` past the 375 content box. The page
   is saved from sideways scroll only because a parent clips it. Likely fix: the
   Bootstrap-style `.row` negative-gutter isn't contained on narrow docs — constrain the
   doc footer `.row` margins at mobile width.
3. **Changelog body text down to 10.4px.** Surface: `/changelog` @ 375px. Evidence:
   font probe → 48 elements <16px, including `span` "500 days thus far" at **10.4px** and
   card blurbs at 14px. Below comfortable-read; the 10.4px spans need a mobile bump.
   Owner: `src/components/Changelog/*` (it has ~30 `768px` queries — add font-size floors).

### P2 — polish
4. **Undersized tap targets site-wide (navbar + footer chrome).** 23–29 on content
   pages, up to 50–75 on docs/changelog. Recurring offenders: navbar toggle (30×30),
   theme switcher (32×32), the LinkedIn auth pill (33×28), footer links (height 32). Most
   are secondary chrome, so P2 — but they're the same root cause as P1#1 (32px-tall
   interactive chrome). A global min-height bump on navbar/footer actions clears most.
5. **Changelog heatmap renders at 872px inside a 273px box.** Surface: `/changelog` @
   375px. Evidence: `heatmapRowsContainer` `scrollWidth 872 / clientWidth 273`.
   **Downgraded from P1 after screenshot:** it's an *intentional horizontal inner-scroller*
   (scroll thumb visible, Q1–Q4 swipeable), not clipped content — acceptable on mobile,
   though a "swipe →" affordance would help discoverability.
6. **Changelog legend label truncates** ("Development (Components, Infras…") @ 375px —
   cosmetic; the legend card is readable.
7. **Homepage feature blurbs at 14.72–15.68px** @ 375px — marginally under 16px; minor.

## Probe coverage (evidence trail)

| Surface | Page overflow | Tap <44px | Font <16px | Notes |
|---|---|---|---|---|
| Homepage | none (375=375) | 23 | 6 | cards stack clean (screenshot); parity 23 desktop / 18 mobile = drawer fold |
| Docs (craft) | none | 50 | 0–1 | `.row` footer 16px bleed (P1#2) |
| Changelog | none | 75 | 48 | heatmap inner-scroller (P2#5); 10.4px text (P1#3); 768px edge clean |
| Blog | none | 29 | 0 | minor header 16px bleed |
| Premium demo | none | — | — | sign-in CTA 36px tall (P1#1) |

Lighthouse mobile (homepage): a11y **100**, SEO **100**, best-practices **96** (one
fail = `errors-in-console`, a console-error nit, out of mobile-layout scope).

## Recommended fix order (if pursued)
P1#1 (premium CTA height — conversion + quick) → P1#3 (changelog 10.4px text — readability)
→ P1#2 (doc footer `.row` bleed — affects every doc) → P2#4 (global chrome min-height,
clears most of the tap-target backlog at once).
