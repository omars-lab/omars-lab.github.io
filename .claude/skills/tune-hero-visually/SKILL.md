---
name: tune-hero-visually
description: The DRAG-TO-URL workflow for dialing in a homepage hero variant's look (and especially PINNING the arch MASK) without the slow edit→restart→shoot→"a little more left" loop. A dev-only DebugMenu panel (Hero Tuner) exposes the tunable hero properties as sliders/color-pickers/a variant switch; every change writes BOTH a live CSS var AND a `ht-` URL param, so the user drags the look they want, Copy-URLs it, and Claude reads the params and BAKES them into the CSS as the new defaults (the panel never ships). Includes the arch-mask auto-trace script + the 50% overlay proof. Use when tuning the studio/boutique hero variants or any masked arched opening; pairs with maintain-homepage-hero.
---

# Tune the hero visually (drag → URL → bake into CSS)

Dialing in a hero variant by editing CSS numbers blind is a slow loop: edit → restart → screenshot →
"a bit more left / bigger / different curve" → repeat. The worst offender is **pinning the arch MASK**
(the `mask-position`/`mask-size` that clips each scene to its arched opening). This skill flips the loop:
the USER drags the look in a dev panel, the URL captures the exact state, and Claude reads the params
and bakes them into the CSS. Nothing tuning-related ships to production.

## The pieces

| Piece | What it is |
|---|---|
| `src/lib/hero-tuning.ts` | The param **schema** (`HERO_PARAMS`: key, label, kind, the `--cssVar` it drives, default, bounds) + the URL⇄CSS-var helpers (`readHeroParamsFromUrl`, `writeHeroParamsToUrl`, `applyHeroValues`, `applyHeroParams`). The single source of truth for what's tunable. |
| `src/components/DebugMenu/sections/HeroTuner.tsx` | The **panel** (a pluggable DebugMenu section): variant-switch buttons, the controls rendered from the schema, a **Copy URL** button, Reset, a live param-string readout, and a **mask-overlay** toggle. |
| `src/pages/index.module.css` | The hero variants read every tunable as `var(--<x>, <baked default>)` so the panel can drive them live AND the baked default holds with no panel. |
| `src/pages/index.tsx` | Each tunable variant's gate has `data-hero-root` + a `ref`, and calls `applyHeroParams(ref)` on mount (so a shared `?ht-…` URL reproduces the look on localhost). |
| `scripts/trace-arch-mask.js` | A dev tool that auto-traces a **pixel-exact arch mask** (white-interior luminance PNG) + the arch geometry from one scene PNG. One trace fits all scenes (the art places the arch identically). Output is `*.traced.png` (gitignored). |

## The CSS-var contract (the thing that makes this safe)

**Every tunable hero property is written `var(--<name>, <current default>)`.** The fallback is the
source of truth for PRODUCTION; the panel/URL only ever SET the var on localhost. So:

- With no panel and no `ht-` params (i.e. a prod build, or any non-localhost visitor), the baked
  fallback renders — production is byte-identical to the committed defaults.
- `applyHeroParams()` and the whole DebugMenu are **localhost + non-prod gated** (the DebugMenu double
  gate: `process.env.NODE_ENV === 'production'` + `isLocalhost()`), so an outsider appending `?ht-…`
  to the live URL changes nothing.

When you add a new tunable, add it in BOTH places in lockstep: a `HERO_PARAMS` entry (with the same
`default` as the CSS fallback) AND the `var(--<cssVar>, <default>)` in the CSS.

## The workflow

1. **Run locally + pick the variant.** `make start`, open the variant you're tuning, e.g.
   `http://localhost:3000/?ab-homepage-hero-anim=variant_c` (studio) or `=variant_d` (boutique). Open
   the **🐞 Debug** menu (bottom-right) → **Hero Tuner**, or use its variant-switch buttons.
2. **Drag / pick / toggle to taste.** The hero updates LIVE and the URL fills with `ht-<key>=` params.
   For the arch mask: toggle **Show arch-mask overlay** (a bright tint of the current mask over the
   scene) and nudge **Arch X/Y/size/flip** until the overlay lines up with the drawn arch.
3. **Copy URL** and paste it back to Claude (or just paste the `ht-…` string from the readout).
4. **Claude bakes it in.** Read the `ht-` params, map each to its `--cssVar` via the schema, and write
   the values as the **new CSS-var fallbacks** in `index.module.css` (and/or new `HERO_PARAMS`
   defaults). Reload with NO params → the look persists (proves the bake). The URL is now disposable.
5. **Prove it.** Screenshot the variant at the baked defaults (no `ht-` params) and confirm it matches
   the tuned URL. `make test-visual` for the hero stays the contract going forward.

## Pinning the arch mask (the recurring pain, solved two ways)

The scenes are arch-shaped art; a layer clipped to the arch interior needs a mask that matches the
drawn arch exactly. Two complementary methods:

- **Auto-trace (gets you ~exact):** `node scripts/trace-arch-mask.js [scenePng] [outPng]` floods the
  transparent/bright SURROUND inward and marks everything it can't reach as the arch interior, emitting
  a **white-interior** luminance mask (the polarity `mask-mode: luminance` wants: white = visible) plus
  the arch center/size as `ht-` params to seed the panel. One trace fits all scenes (the arch is placed
  identically in every card PNG). NOTE the polarity: a white-interior mask REVEALS the interior; a
  black-interior mask (the older `arch-inner.png`) HIDES it. If a masked layer renders EMPTY, that
  polarity mismatch is the usual cause.
- **Drag-to-pin (human-in-the-loop):** the panel's Arch X/Y/size + the overlay toggle let the user line
  the mask up by eye; the URL captures it. Use this to fine-tune what the trace got close to.

## Guardrails

- **Dev-only, fail-safe.** The panel + param reading are localhost+dev gated; the CSS-var fallbacks are
  the prod source of truth. The existing e2e **dev-only-surfaces absence** test (DebugMenu must NOT be
  in the prod build) guards that nothing tuning-related ships. Don't move any of this outside the gate.
- **No retina seam.** A tuner-driven `filter`/`mix-blend` must stay inside the isolated arch box (the
  hard-won lesson from `maintain-homepage-hero` gotcha 3 / `[[mix-blend-hidpi-seam]]`); verify at DPR=2.
- **Lockstep.** Schema default == CSS-var fallback. The trace output (`*.traced.png`) is gitignored;
  the committed mask is the real `arch-inner.png` (swap it deliberately if a re-trace is better).
- Pairs with **`maintain-homepage-hero`** (the hero's variants, code anchors, and gotchas). This skill
  is the TUNING workflow; that one is the map of what each hero piece does.

## The story

The collaborative technique (slow loop → consistent-art insight → drag-to-URL panel → mask trace +
overlay proof → share-URL → bake-into-CSS) is written up as the `/designs` technique post
**"Building masks with Claude"** (`designs/<date>-building-masks-with-claude.mdx`, `kind: design-story`).
