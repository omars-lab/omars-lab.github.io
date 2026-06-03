---
name: audit-mobile-experience
description: Audit the Bytes of Purpose site on real mobile viewports — confirm it's a TRUE mobile experience (tap targets, thumb reach, content parity, no horizontal overflow, working touch, mobile perf/a11y), not a compressed desktop layout. Drives the chrome-devtools MCP against the served prod build (:4173) with copy-paste probes, then emits a prioritized P0/P1/P2 report of findings + concrete fixes. Does NOT auto-edit. Use when asked "is this good on mobile?", after a hero/layout/CSS change, or before a release.
---

# Audit mobile experience

The site is authored on a desktop, so its layouts drift toward **responsive-but-not-mobile**:
they reflow enough to render on a phone, but they were designed and eyeballed at desktop
width. "Responsive" only proves the page *fits* — it does not prove a phone user can read,
reach, and tap it one-handed. This skill audits the site on **real mobile viewports** and
emits a **prioritized report** — it does not silently auto-edit (same contract as
`review-reader-experience`).

Pairs with: `review-reader-experience` (the reader's-lens audit — labels/voice/IA),
`validate-deployment` (post-deploy live checks). Apply any fixes through the owning
surface's conventions; this skill only finds and prioritizes.

## The one question (responsive ≠ mobile-good)

For every surface ask: **"Is this a layout built FOR a phone, or a desktop layout that
happens to fit?"** A desktop-shrunk layout passes "it renders" and still fails the user:
text too small to read without zoom, CTAs above the thumb's reach, a stray element pushing
a horizontal scrollbar, a tap target the size of a desktop mouse hit-box. The two
highest-signal tells — the things the eye glides past but a probe catches every time — are
**horizontal overflow** and **sub-44px tap targets**. The sneakiest is the **parity trap**:
content or affordances silently `display:none`'d on mobile, so the phone user gets a quietly
worse product than the desktop user (hidden nav items get ~3× less interaction).

## Audit vehicle — the PROD build on :4173, never dev

Audit the **served production build**, not `yarn start`. Build-only transforms (the rehype
plugins, draft exclusion, premium encryption) don't run on the dev server, so a dev-server
audit measures a page that will never ship. Serve the real build **on :4173** (the port the
a11y/SEO e2e suite uses — `docusaurus serve` defaults to :3000, which collides with a running
dev server, so always pass `--port 4173`):

```bash
# Reuse the build/ dir a deploy already produced (make deploy / make build-premium leave it
# in place). If there is no build/, run `make build` (or `make build-premium` if premium docs
# exist) first — `yarn serve` does NOT build.
( cd bytesofpurpose-blog && yarn serve --port 4173 --no-open )
```

⚠️ **Not `make serve`.** That target runs `docusaurus serve` with no port → defaults to
**:3000**, which fails with "Something is already running on port 3000" whenever a dev server
is up, and even when it works serves on the wrong port. Always serve explicitly on :4173.

Drive the audit with the **chrome-devtools MCP** tools (already available in-session, loaded
on demand via ToolSearch — no new harness or dependency):

| Tool | Use |
|---|---|
| `mcp__chrome-devtools__resize_page` / `emulate` | set the device viewport, DPR, and **`hasTouch`** (without `hasTouch`, touch handlers no-op and you mis-audit interactions) |
| `mcp__chrome-devtools__navigate_page` | load each surface URL on :4173 |
| `mcp__chrome-devtools__evaluate_script` | run the **mechanical probes** below (the part the eye misses) |
| `mcp__chrome-devtools__take_screenshot` | desktop-vs-mobile side-by-side parity diffs; attach as P0/P1 evidence |
| `mcp__chrome-devtools__lighthouse_audit` | mobile perf (LCP/CLS) + a11y, with mobile CPU/network throttling on |

## Device matrix

Audit each surface at, at minimum:

| Device | Viewport | Why |
|---|---|---|
| iPhone SE (2nd/3rd gen) | 375×667 | smallest common modern iPhone — the squeeze test |
| iPhone 15 Pro | 393×852 | mainstream iOS / Safari |
| Pixel 8 | 412×915 | mainstream Android / Chrome |
| CSS edge: 360px | 360×740 | below the site's narrowest real query — stress the reflow |
| CSS edge: 768px | 768×1024 | the Changelog breakpoint boundary (tablet/portrait) |

Run **both light and dark** (the site themes both; contrast bugs hide in one mode only).

## The mechanical probes (copy-paste, repeatable)

Per the repo tenet *never assert, prove with a runnable check + evidence*: every finding
must carry a number from one of these probes (or a screenshot). Run via
`mcp__chrome-devtools__evaluate_script` at each viewport.

**1. Horizontal-overflow probe** — the page should never scroll sideways; only intentional
inner scrollers (code blocks, wide tables) may.

```js
() => {
  const de = document.documentElement;
  const pageOverflows = de.scrollWidth > de.clientWidth;
  const offenders = [...document.querySelectorAll('*')]
    .filter(el => el.scrollWidth > el.clientWidth + 1 && getComputedStyle(el).overflowX !== 'auto' && getComputedStyle(el).overflowX !== 'scroll')
    .map(el => ({ tag: el.tagName, cls: el.className?.toString().slice(0,40), sw: el.scrollWidth, cw: el.clientWidth }))
    .slice(0, 20);
  return { innerWidth: window.innerWidth, pageScrollWidth: de.scrollWidth, pageOverflows, offenders };
}
```

**2. Tap-target probe** — interactive elements should render ≥44×44px and sit ≥8px apart.

```js
() => {
  const sel = 'a, button, [role=button], input:not([type=hidden]), select, summary, [onclick]';
  const small = [...document.querySelectorAll(sel)]
    .map(el => { const r = el.getBoundingClientRect(); return { el, r }; })
    .filter(({ r }) => r.width > 0 && r.height > 0 && (r.width < 44 || r.height < 44))
    .map(({ el, r }) => ({ tag: el.tagName, text: (el.innerText||el.getAttribute('aria-label')||'').trim().slice(0,30), w: Math.round(r.width), h: Math.round(r.height) }));
  return { undersizedCount: small.length, samples: small.slice(0, 25) };
}
```

**3. Content-parity probe** — diff the visible affordances desktop-vs-mobile; run at BOTH
widths and compare the returned sets. Anything present on desktop but missing/hidden on
mobile is a parity finding to justify or fix.

```js
() => {
  const visible = el => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width>0 && r.height>0 && s.display!=='none' && s.visibility!=='hidden'; };
  const links = [...document.querySelectorAll('a[href]')].filter(visible).map(a => (a.innerText||a.getAttribute('aria-label')||a.getAttribute('href')||'').trim().slice(0,40)).filter(Boolean);
  const headings = [...document.querySelectorAll('h1,h2,h3')].filter(visible).map(h => h.innerText.trim().slice(0,50));
  return { viewport: window.innerWidth, linkCount: links.length, links: [...new Set(links)], headings };
}
```

**4. Font-size probe** — body text below 16px triggers iOS auto-zoom-to-read (a desktop-shrink
tell).

```js
() => {
  const tooSmall = [...document.querySelectorAll('p, li, td, span, a')]
    .filter(el => el.innerText && el.innerText.trim().length > 20)
    .map(el => ({ el, px: parseFloat(getComputedStyle(el).fontSize) }))
    .filter(({ px }) => px < 16)
    .map(({ el, px }) => ({ tag: el.tagName, px, text: el.innerText.trim().slice(0,40) }));
  return { count: tooSmall.length, samples: tooSmall.slice(0, 15) };
}
```

Beyond the probes, eyeball two things they can't catch: **thumb reach** (is the primary CTA
in the bottom ~⅔ of the viewport, or buried top-corner?) and **reflow quality** (did
multi-column content *stack*, or just *squish* — arched images squeezed, two cards crammed
side-by-side at 360px?).

## Per-surface checklist (the four scopes)

For each surface: load on :4173, run all four probes at the device matrix, screenshot
desktop vs 375px, note thumb-reach + reflow.

- **Homepage / chooser** — `bytesofpurpose-blog/src/pages/index.tsx`,
  `src/pages/index.module.css`. The 3-card hero is the freshest risk: the chooser is
  `max-width: 1040px` with cards `flex: 1 1 300px`. Do the three cards drop to a clean
  1-column stack at 375px, or wrap to an awkward 2+1? Are the arched card images scaled
  (not squished)? Note: the only homepage `@media` (`966px`) **only shrinks font sizes** —
  it does not re-layout — so the card reflow is pure flex-wrap; stress it at the 360px edge.
- **Docs reading (craft / self)** — long-form docs. Sidebar collapses to a drawer that opens
  AND closes; **code blocks scroll inside themselves** (the overflow probe should flag the
  `<pre>`, NOT the page); wide tables scroll in their own container; in-doc anchor / "on this
  page" nav reachable; body text ≥16px (font probe).
- **Changelog timeline** — `src/components/Changelog/*` carries ~30 `768px` media queries
  (the most custom mobile CSS on the site = the highest custom-layout risk). Check: timeline
  reflow, the filters bar (`ChangelogFilters`), date overlay, legend / legend-sidebar
  collapse, and the `769–1200px` mid-band query. Run the matrix's 768px edge specifically.
- **Interactive (graph / premium / blog)** — graph renderer pans/zooms by **touch** (set
  `hasTouch`); `PremiumGate` + sign-in flow usable on a phone (modal not clipped, LinkedIn
  CTA tappable — `PremiumGate/styles.module.css` has a `768px` query to verify); blog list
  + filter chips are ≥44px tappable.

## Output — a prioritized report (report only, do NOT auto-edit)

Emit a findings report, severity-bucketed. Each finding: **surface · viewport · symptom ·
probe-evidence (the number / screenshot) · concrete fix**.

- **P0 — broken**: horizontal page scroll; a primary CTA unreachable or untappable; content
  present on desktop but missing on mobile (parity break); touch interaction dead.
- **P1 — degraded**: sub-44px tap targets on real actions; body text <16px; cramped reflow
  (squish not stack); contrast fail in one theme; poor thumb reach for a key action.
- **P2 — polish**: tight spacing, minor near-44px targets, mobile LCP/CLS over budget but
  usable, cosmetic crop.

If a surface is clean, say so **and paste the probe output** that proves it (a clean claim
without evidence violates the prove-don't-assert tenet). Fixes are a **separate, per-item
approved follow-up** — this skill does not edit.

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Build-only transforms missing; page differs from prod | Audited the dev server (`yarn start`, :3000) | Re-run on the served prod build (`yarn serve --port 4173`) |
| `make serve` fails "Something is already running on port 3000" | `make serve` → `docusaurus serve` defaults to :3000, collides with the dev server | Serve explicitly: `( cd bytesofpurpose-blog && yarn serve --port 4173 --no-open )` |
| Overflow probe flags an off-canvas drawer (`navbar-sidebar`, `sw` ≫ `cw`) | Mobile nav drawer is wider than viewport but hidden via `transform`, not `overflow` | Not a finding — it's off-screen; only act on it if the page (`documentElement`) actually overflows |
| Touch handlers (graph pan/zoom, swipes) do nothing | `emulate` set a small viewport but not touch | Set **`hasTouch: true`** in the emulate call before probing interactions |
| Lighthouse mobile LCP/score looks alarmingly bad vs desktop | Mobile preset throttles CPU + network on purpose | Compare to a **mobile budget**, not to the desktop number — that gap is the point |
| Overflow probe flags a `<pre>` / table | That element is an *intentional* inner scroller | Not a finding — the probe excludes `overflow-x: auto/scroll`; only flag when the **page** (`documentElement`) overflows |
| Parity probe shows fewer links on mobile | Could be legit (nav folded into a drawer) OR a real hidden-content bug | Open the drawer/menu first, re-probe; a finding only if it's *unreachable*, not merely collapsed |
| Findings differ run-to-run on the homepage | Fonts/images not yet loaded when probe ran | `wait_for` network-idle (or a known selector) before running the probes |

## Self-healing — keep this skill current

When you discover a new mobile failure mode, a better probe, or the user states a
mobile-UX preference (a target tap size, a device to always include, an acceptable
breakpoint behavior), **write it into this file in the same change** — add a probe, a
checklist line, or a troubleshooting row. This skill is the single source of truth for the
site's mobile bar; don't let what you learned live only in a PR comment.
