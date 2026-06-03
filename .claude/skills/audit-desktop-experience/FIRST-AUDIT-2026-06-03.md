# Desktop-experience audit — first run (2026-06-03)

Inaugural run of `audit-desktop-experience` against the served prod build
(`yarn serve --port 4173`, master commit `e7a1ed23`). Driven by chrome-devtools MCP at
desktop widths (1440, 1920, 2560 ultrawide), no mobile/touch emulation (mouse+keyboard
audit — hover wanted). Probes + mandatory visual pass; both light/dark spot-checked.
**Report only — no fixes applied.**

Audited from the **desktop user's perspective**: seated, mouse+keyboard, wide screen,
reading deeply. The desktop failure modes are the **inverse of mobile's** — where mobile
cramps and overflows, desktop **over-stretches** (line length) and **under-fills**
(content stranded in whitespace).

## Headline

The homepage is a **desktop win** — the hero gradient fills the width and the 3-card
chooser sits balanced and centered; it uses the screen well. The **docs reading surface is
the real gap**: body text runs too wide to read comfortably (~94 characters per line at the
mainstream 1440px, worse above), and on wide/ultrawide monitors the reading column is
stranded far left with a large empty expanse to the right while the footer goes full-bleed —
an inconsistency that reads as unfinished. No P0s.

## Findings (prioritized)

### P0 — broken
*None.* No horizontal page scroll at any desktop width; no primary action without an
affordance.

### P1 — degraded (real, worth fixing)
1. **Doc body line length ~94ch at 1440px (worse at 1920/ultrawide).** Surface: docs
   (`/craft/generative-ai`, `/craft/software-development`, every doc) at 1440+. Evidence:
   line-length probe → intro `<p>` **749px wide at 16px font ≈ 94 chars/line**; list items
   ~90ch; the ~80ch comfortable-reading ceiling is exceeded on the site's core reading
   surface. Fix: cap the doc markdown column measure (`max-width` ~70–75ch / ~700px) on
   `.markdown` / the doc content column so lines wrap for readability.
2. **Reading column stranded left in whitespace on wide/ultrawide.** Surface: docs at 1920
   & 2560. Evidence: at 2560px the doc article column ends at **1950px** while content/
   footer extend to 2469px — ~600px of dead space to the right of the reading column; the
   "What's here" TOC floats alone top-right with ~900px of empty white below it. The dark
   footer goes full-bleed, so the body's left-stranding looks like a bug by contrast. Fix:
   either center the doc content container at large widths, or balance the layout (wider
   content max-width + persistent TOC gutter) so the page doesn't look half-empty.

### P2 — polish
3. **Ultrawide whitespace inconsistency (content vs footer).** Surface: 2560px. The footer
   uses the full width but the main content uses ~half — visually inconsistent. Folds into
   #2's fix; on its own it's cosmetic. Evidence: footer full-bleed vs content rightmost
   1950px in a 2560px viewport.

## What's healthy (proven, for credibility)
- **Homepage @ 1920px:** hero fills width, 3 chooser cards balanced/centered within the
  `1040px` max-width, "Explore the site" cards evenly distributed. Screenshot-confirmed. A
  genuinely desktop-designed surface.
- **Chooser-card hover works:** `index.module.css` has `.chooserCard:hover` →
  `translateY(-4px)` + image `scale(1.03)`. The hover probe's 26 "no hover" hits were
  **false positives** of the crude synthetic-event method (the skill flags this caveat) —
  confirmed against CSS source, cards are fine.
- **No horizontal overflow** at any desktop width on any surface.

## Probe coverage (evidence trail)

| Surface | Width | Line length | Whitespace | Hover | Notes |
|---|---|---|---|---|---|
| Homepage | 1920 | n/a (hero) | fills width ✓ | cards lift ✓ (CSS) | desktop win (screenshot) |
| Docs (craft) | 1440 | **94ch** (P1#1) | — | — | over-wide measure |
| Docs (craft) | 2560 | worse | **600px right dead space** (P1#2) | — | column stranded left |
| — | — | — | footer full-bleed vs content half | — | inconsistency (P2#3) |

Lighthouse desktop not re-scored (mobile run already showed a11y/SEO 100; desktop a11y is
equivalent — the desktop-specific findings are layout/measure, not a11y).

## Method calibration (lessons baked back into the skill)
- **Line-length probe was initially too lax** — it skipped short-but-wide paragraphs
  (required `text.length > 80`) and used a `>85` threshold, returning 0 on a page that
  visibly reads at 94ch. Fixed in the skill to flag on **box-width vs font-size regardless
  of text length** (`clientWidth / (0.5·fontSize) > 80`), now correctly catching the 94ch
  intro. The screenshot caught what the first probe version missed — exactly why the visual
  pass is mandatory.
- **Hover probe is crude** (synthetic `mouseover` ≠ CSS `:hover`); confirm via screenshot
  or CSS source, as the skill's troubleshooting row states.

## Recommended fix order (if pursued)
P1#1 (cap doc column measure — the core reading fix, also shrinks the line length) → P1#2
(center/balance the doc layout at wide widths — often the SAME `max-width` change resolves
both) → P2#3 (folds in). One well-placed `max-width` + centering on the doc content column
likely clears #1–#3 together.
