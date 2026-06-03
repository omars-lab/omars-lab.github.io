---
name: audit-desktop-experience
description: Audit the Bytes of Purpose site on desktop/wide viewports from the DESKTOP user's perspective (seated, mouse+keyboard, wide screen, reading deeply) — confirm content isn't lost in oceans of whitespace, lines aren't too long to read, hover/focus states work, and the layout uses the width well instead of a narrow column floating in a sea of grey. Drives the chrome-devtools MCP against the served prod build (:4173) with copy-paste probes + a mandatory visual pass, then emits a prioritized P0/P1/P2 report. Does NOT auto-edit. Use when asked "is this good on desktop / a big monitor?", after a layout/CSS change, or before a release.
---

# Audit desktop experience

Sibling of `audit-mobile-experience`. **Same visual rubric, different audience — so a
different skill, not a wider viewport.** The mobile user is on-the-go, one-handed, touch.
The **desktop user is a different person in a different mode**, and the layout has to serve
*that* person. "It renders on a big screen" is not the bar — the bar is whether a seated
reader with a mouse and a wide monitor can read and work comfortably.

Pairs with: `audit-mobile-experience` (the touch/small-screen sibling),
`review-reader-experience` (labels/voice/IA), `validate-deployment`. Report only — it finds
and prioritizes; it does not auto-edit.

## Audit from the DESKTOP USER's perspective (not the device's)

Before any probe, picture the actual person and **reason from what they can DO**, because a
desktop is a *context*, not just a big screen. The desktop user is:

- **Seated, focused, in a longer session** — reading a doc end-to-end, studying a design,
  comparing options, multitasking across tabs/windows. → The layout should **reward
  attention**: use the width to show structure (sidebar + content + on-this-page), not
  strand a phone-width column in the middle of a grey ocean.
- **Mouse + keyboard** — they **hover** to preview/reveal, click precisely (small targets
  are fine), select text, use keyboard shortcuts and tab-focus, right-click. → Hover and
  focus states must actually exist and be visible; interactive affordances can be subtler
  than mobile but must still be discoverable.
- **On a wide screen — but often a RESIZED/windowed browser, and sometimes ultrawide** —
  their eyes travel far across the screen. → **Line length matters** (text running the full
  1920px is exhausting to read — ideal measure is ~60–80 characters); and **whitespace
  matters the other way** from mobile (too *much* empty space / a tiny centered column on a
  big monitor wastes the screen and looks unfinished).
- **There to do work** — deliberate browsing, deep reading, cross-referencing. → Density can
  be higher than mobile, but hierarchy must still guide the eye; nothing important should
  rely on scrolling when it could be in view.

So for every surface ask: **"What did this person come to a desktop to DO, and does the
layout use the screen to help them — readable line length, content not drowning in
whitespace, hover/focus working, structure visible at a glance?"** — not merely "does it
render wide?"

The desktop failure modes are the **inverse of mobile's**: where mobile cramps and
overflows, desktop **over-stretches** (line length too wide) and **under-fills** (a narrow
column lost in whitespace). Plus the desktop-only surfaces: **hover/focus states** that a
touch device never exercises.

> The sibling **`audit-mobile-experience`** runs the same rubric from the *mobile* user's
> perspective (on-the-go, one-handed, touch, small screen). Different audience → run both.

## Audit vehicle — the PROD build on :4173, never dev

Same as the mobile skill: audit the **served production build**, not `yarn start` (build-only
transforms must be present). `docusaurus serve` defaults to :3000 (collides with a dev
server), so always pass `--port 4173`:

```bash
# Reuse the build/ a deploy left in place; else `make build` (or `make build-premium` if
# premium docs exist) first — `yarn serve` does NOT build.
( cd bytesofpurpose-blog && yarn serve --port 4173 --no-open )
```

Drive it with the **chrome-devtools MCP** (`resize_page` / `emulate` for the viewport,
`navigate_page`, `evaluate_script` for probes, `take_screenshot` for the visual pass,
`lighthouse_audit` desktop for a11y/SEO). Do **not** set `mobile`/`touch` in `emulate` —
this is a mouse+keyboard audit; you WANT hover to work.

## Device matrix (desktop widths)

| Width | Viewport | Why |
|---|---|---|
| Laptop | 1366×768 | the most common real laptop — the floor of "desktop" |
| Standard | 1440×900 | mainstream desktop / the design's likely target |
| Full HD | 1920×1080 | the line-length + whitespace stress point |
| Ultrawide | 2560×1080 | does the layout fill it or strand a narrow column in grey? |
| Windowed | ~1100×800 | a NON-maximized browser — many desktop users never full-screen |

Run **both light and dark**. The ultrawide and 1920 widths are where the desktop-specific
findings (line length, wasted whitespace) actually appear — don't skip them.

## The mechanical probes (copy-paste, repeatable)

Run via `mcp__chrome-devtools__evaluate_script` at each width. Per the repo tenet *never
assert, prove with a runnable check + evidence*.

**1. Line-length (measure) probe** — body text whose *container* is wide enough to hold
more than ~80 characters per line is tiring to read, **regardless of how long the text is**
(a short intro line in a 750px column still reads at ~94ch). Flag on **box width vs
font-size**, not text length. (Confirmed real catch: doc `<p>` 749px wide at 16px font ≈
**94ch** at the mainstream 1440px viewport — over the ~80ch ceiling, worse at 1920/ultrawide.)

```js
() => {
  const wide = [];
  for (const el of document.querySelectorAll('article p, article li, .markdown p, .markdown li, main p')) {
    if (el.childElementCount > 0 && !(el.innerText||'').trim()) continue;
    const px = parseFloat(getComputedStyle(el).fontSize);
    const approxCharsPerLine = el.clientWidth / (px * 0.5);   // ~0.5em average char advance
    if (approxCharsPerLine > 80) wide.push({ approxCharsPerLine: Math.round(approxCharsPerLine), boxPx: Math.round(el.clientWidth), fontPx: px, text: (el.innerText||'').trim().slice(0,45) });
  }
  // de-dupe by box width (a column shares one width across many <p>)
  const seen = new Set();
  return { count: wide.length, samples: wide.filter(w => { if(seen.has(w.boxPx))return false; seen.add(w.boxPx); return true; }).slice(0, 10) };
}
```

**2. Wasted-whitespace probe** — on a wide screen, is the main content a narrow column in a
sea of empty space? Flags when the primary content column uses a small fraction of the
viewport with large empty side gutters.

```js
() => {
  const main = document.querySelector('main') || document.querySelector('article') || document.body;
  const r = main.getBoundingClientRect();
  const vw = window.innerWidth;
  // widest meaningful content block inside main
  const blocks = [...main.querySelectorAll('div,article,section')]
    .map(el => el.getBoundingClientRect().width).filter(w => w > 0);
  const widestContent = Math.max(0, ...blocks);
  const usedFraction = widestContent / vw;
  const sideGutter = Math.round((vw - widestContent) / 2);
  return { viewport: vw, mainWidth: Math.round(r.width), widestContentPx: Math.round(widestContent), usedFraction: +usedFraction.toFixed(2), sideGutterPx: sideGutter, flag: usedFraction < 0.55 && vw >= 1440 };
}
```

**3. Hover/focus-state probe** — desktop users hover and tab; flag interactive elements that
look identical on hover and on focus (no affordance the mouse/keyboard user expects).

```js
() => {
  const noHover = [];
  for (const el of document.querySelectorAll('a, button, [role=button]')) {
    const r = el.getBoundingClientRect();
    if (r.width === 0) continue;
    const base = getComputedStyle(el);
    // crude: does any CSS rule define :hover for this element's selectors?
    el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    const hov = getComputedStyle(el);
    const changed = base.backgroundColor !== hov.backgroundColor || base.color !== hov.color || base.textDecorationLine !== hov.textDecorationLine || base.boxShadow !== hov.boxShadow;
    el.dispatchEvent(new MouseEvent('mouseout', { bubbles: true }));
    if (!changed) noHover.push({ tag: el.tagName, text: (el.innerText||'').trim().slice(0,30) });
  }
  return { noHoverCount: noHover.length, note: 'crude — computed style may not reflect :hover; confirm by screenshot/hover', samples: noHover.slice(0, 15) };
}
```

**4. Horizontal-overflow probe** — even on desktop a stray wide element can push a
scrollbar. Same probe as the mobile skill.

```js
() => {
  const de = document.documentElement;
  const offenders = [...document.querySelectorAll('*')]
    .filter(el => el.scrollWidth > el.clientWidth + 1 && !['auto','scroll'].includes(getComputedStyle(el).overflowX))
    .map(el => ({ tag: el.tagName, cls: el.className?.toString().slice(0,40), sw: el.scrollWidth, cw: el.clientWidth })).slice(0, 15);
  return { innerWidth: window.innerWidth, pageScrollWidth: de.scrollWidth, pageOverflows: de.scrollWidth > de.clientWidth, offenders };
}
```

## The visual-analysis pass (MANDATORY — the probes only see numbers)

Identical discipline to the mobile skill: **a run is NOT complete without it.** For **every
surface, at the 1440px and 1920px widths minimum** (and ultrawide where whitespace is
suspect):

1. **Capture a FULL-PAGE screenshot** (`take_screenshot`, `fullPage: true`).
2. **Look at the image** (Read it back) and score it against the rubric below — like a
   designer reviewing a comp.
3. **Hover the key interactive elements** and screenshot the hover state (the probe is
   crude; the eye confirms).

### Visual rubric — what to look for (desktop lens)

| Dimension | The tell (a finding) |
|---|---|
| **Line length** | Body text running the full width of a wide screen (>~80ch) — tiring to read; needs a `max-width` measure |
| **Wasted whitespace** | A narrow content column stranded in a huge grey/empty expanse on a wide/ultrawide monitor; the layout doesn't use the screen |
| **Hover/focus** | Links/buttons with no visible hover or keyboard-focus state; a card that should lift/underline on hover but doesn't |
| **Density / hierarchy** | Too sparse (acres of padding so you scroll for nothing) OR a flat hierarchy where the primary action doesn't dominate |
| **Balance & alignment** | Lopsided columns; content not aligned to a grid; an image dwarfing text; sidebar/content/TOC proportions off |
| **Edge spacing** | Content kissing the window edge in a windowed browser, or absurd gutters |
| **Reading path** | Does the eye land on the right thing and flow naturally L→R, top→bottom across the wide canvas? |

Each visual finding → the same P0/P1/P2 report with the **screenshot as evidence** and a
**concrete fix** (e.g. "doc body runs ~110ch at 1920px → cap `.markdown` `max-width` ~70ch";
"homepage hero content is a 700px column centered in 1920px with 600px grey gutters each
side → widen the content container or add visual interest to the margins"). Most desktop
aesthetic findings are **P2**; a broken hover on a primary action, unreadable line length on
the main reading surface, or a layout that looks unfinished on a standard monitor is **P1**.

## Per-surface checklist (the four scopes)

For each surface: serve on :4173, run the probes at the device matrix, **then the mandatory
visual pass**. Both numbers AND visual review required.

- **Homepage / chooser** — does the 3-card hero use the width well at 1920/ultrawide, or
  float small and centered? Are the cards balanced? Hover state on the cards?
- **Docs reading (craft / self)** — the core desktop surface. **Line length** of the doc
  body at 1440/1920 (the #1 desktop finding to expect); sidebar + content + on-this-page
  proportions; hover on sidebar links / pager cards; code-block width.
- **Changelog timeline** — the heatmap/timeline was built wide; on desktop it should shine.
  Check it uses the width, hover on heatmap cells, legend/filters layout, the `769–1200px`
  mid-band and full-desktop layout.
- **Interactive (graph / premium / blog)** — graph uses the canvas; hover/click affordances
  on nodes; premium gate proportion (not a tiny box in a huge page); blog list density and
  hover.

## Output — a prioritized report (report only, do NOT auto-edit)

Severity-bucketed; each finding = **surface · width · symptom · probe-evidence /
screenshot · concrete fix**.

- **P0 — broken**: horizontal page scroll; a primary action with no working hover/focus AND
  no other affordance; content unreadable at a standard desktop width.
- **P1 — degraded**: doc body line length far over measure on the main reading surface;
  layout looks unfinished (narrow column lost in whitespace) at 1440–1920; missing
  hover/focus on a primary action.
- **P2 — polish**: minor over-wide lines, slightly sparse sections, subtle hover gaps,
  ultrawide-only whitespace.

If a surface is clean, say so **and paste the probe output** that proves it.

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Hover probe reports "no hover" everywhere | Computed style doesn't always reflect `:hover` pseudo-class via synthetic events | Treat the probe as a hint; **confirm hover by screenshotting the hovered state** |
| `make serve` fails "already running on port 3000" | `docusaurus serve` defaults to :3000 | Serve explicitly: `( cd bytesofpurpose-blog && yarn serve --port 4173 --no-open )` |
| Line-length probe over/under-counts | The 0.5em-per-char heuristic is approximate | Use it to *surface* candidates; confirm the real measure on the screenshot |
| No findings at 1440 but obvious at 1920/ultrawide | The design targets ~1440 and doesn't cap width above it | That IS the finding — run the wide widths; don't audit only at 1440 |

## Self-healing — keep this skill current

When you find a new desktop failure mode, a better probe, or the user states a desktop-UX
preference (a target max-width / measure, a width to always include, a hover convention),
**write it into this file in the same change**. This skill is the single source of truth for
the site's desktop bar. The shared visual rubric lives in both this skill and
`audit-mobile-experience`; if the rubric core changes, update both.
