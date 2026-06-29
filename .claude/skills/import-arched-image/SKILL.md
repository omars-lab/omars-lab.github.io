---
name: import-arched-image
description: Prepare a RAW arched image (a zellij window, a carved door, a scene illustration) so it ABIDES BY the canonical arch and drops into the homepage hero like a card. The repeatable asset-prep workflow: detect the raw arch, scale/shift it onto the canonical arch (arch-inner.png), CLIP to that arch (transparent outside), and write a NEW file (never crop in place). Wraps scripts/fit-to-arch.js + scripts/trace-arch-mask.js. Use when adding/replacing any hero card PNG, a door, a window, or a scene that must sit in the arched opening. Triggers on "crop/clean this arched image", "make it abide by the arch", "import a door/window/scene PNG".
---

# Import an arched image (fit it to the canonical arch)

The homepage hero shows scenes/doors/windows through an **arched opening**. For an image to drop into
that opening cleanly, its arched content must line up with the **canonical arch** that every hero PNG
shares, and everything OUTSIDE the arch must be transparent. A raw illustration (a beige-surround
zellij window, a carved door, a scene) almost never arrives that way. This skill is the repeatable
prep: take a raw arched image → output a card-ready PNG that abides by the canonical arch.

Owning context: the hero is `src/pages/index.tsx` + `index.module.css`; the maintain-homepage-hero
skill catalogs the hero; this skill owns the IMAGE prep that feeds it. Pairs with `tune-hero-visually`
(pinning the mask) and the (planned) `validate-arch-assets.js` guard.

## The canonical arch contract (the thing every card must obey)

- **1024×1024** canvas. The arched opening is defined by **`static/img/cards/arch-inner.png`** (the
  interior filled BLACK) and framed by **`arch.png`** (the gold frame line). Both are 1024².
- The arch **bbox** (the dark interior of arch-inner.png) sits at roughly **x 162..868, y 79..939** —
  a tall arched window centred horizontally. Every card PNG places its arch at that SAME bbox, which
  is what lets ONE mask + one set of arch params fit all of them.
- **Outside the arch must be TRANSPARENT.** Content inside is kept; the raw's surround is clipped away.
- **Zero fringe.** A non-canonical PNG (arch a few px off, or a light fringe just outside the interior)
  is the root cause of the recurring "faint white line at the arch edge" bug. The fix is always:
  re-fit to canonical so the interior fills 162..868/79..939 with NO leftover fringe.

## ⚠️ The mask-polarity lesson (memorize this — it caused empty arches + white lines)

There are TWO arch masks and they do OPPOSITE things under `mask-mode: luminance`:

- **`arch-inner.png`** — interior **BLACK**. Under luminance masking, black = transparent, so this
  HIDES the interior. It is the canonical GEOMETRY reference (the bbox), and the clip source for
  fit-to-arch, but do NOT use it as the CSS `mask-image` for a layer you want to SHOW.
- **`arch-mask-white.png`** — interior **WHITE**. White = opaque, so this REVEALS the interior. This
  is the one the CSS masks (`.studioDoorScene`, `.studioFlash`, the boutique/studio peeks) use to show
  a scene/flash clipped to the arch.

Empty arches and edge white-lines almost always trace back to masking with the wrong polarity. When a
masked layer renders nothing → you used the black-interior mask. When it shows a hard edge → fringe in
the source PNG (re-fit) or the wrong mask.

## The workflow

### 1. Get the raw image, keep it raw

Drop the raw into a scratch dir (e.g. `~/Desktop/blog-assets/raw-window.png`). **Never crop in place** —
the tool always writes a NEW file. The repo convention: a `raw-` prefix (or `-raw` suffix) on the input;
the tool strips it to derive the output name.

### 2. Fit it to the canonical arch

```bash
node bytesofpurpose-blog/scripts/fit-to-arch.js <rawImage> [outImage] [--mask <archInner.png>] [--proof]
# e.g.
node bytesofpurpose-blog/scripts/fit-to-arch.js ~/Desktop/blog-assets/raw-window.png \
     bytesofpurpose-blog/static/img/cards/window.png --proof
```

What it does (all in a headless-browser CANVAS via Playwright — zero new deps): detects the raw's
arched content, scales + shifts it to align with the canonical arch interior (`arch-inner.png`, default
`static/img/cards/arch-inner.png`), and CLIPS to that arch — inside kept, outside transparent. Writes
the NEW file (out path, or derived by stripping the `raw-` prefix).

- `--mask <png>` — override the canonical arch-inner.png (rarely needed).
- `--proof` — also writes `<out>.proof.png` overlaying `arch.png`'s gold frame on the result, so you
  can eyeball alignment. **Always proof-check** a new asset (prove-don't-assert): the interior should
  fill the frame with no gap and no spill.
- Default behaviour is a DIRECT clip to the canonical arch (the raws are usually already
  canonical-aligned). There's an `--align` opt-in for scaling when a raw is off-size; reach for it only
  if the proof shows misalignment.

### 3. (If you also need a fresh MASK) trace it from a scene

The arch MASK (`arch-mask-white.png` / `arch-inner.png`) is already canonical and rarely changes. If
you ever need to re-derive it from a scene PNG:

```bash
node bytesofpurpose-blog/scripts/trace-arch-mask.js [scenePng] [outMaskPng] [--erode N]
# default: static/img/cards/craft.png → static/img/cards/arch-inner.traced.png
```

It flood-fills from the corners to trace the arched interior, prints the detected geometry (as %) + a
ready-to-paste `ht-` query string, and writes the mask. `--erode N` trims a light fringe. Then
OVERLAY-PROOF it: load the variant with the printed `ht-` params and toggle the Hero Tuner's
**mask-overlay** (see `tune-hero-visually`) to eyeball the mask vs the drawn arch. `*.traced.png` is
gitignored (a working artifact); only promote it to `arch-inner.png`/`arch-mask-white.png` when proven.

### 4. Drop it into the hero + verify

- Put the fitted PNG in `static/img/cards/` and reference it from the hero (`CHOOSER_CARDS[].img`, or
  the door/window `<img src>` in `StudioFacade`).
- Restart the dev server (new static asset) and shoot the hero; confirm the new image sits in the arch
  with NO white line at the edge. If a fringe appears, **re-fit** (it's a canonical-arch violation, not
  a CSS bug) — and INSPECT THE IMAGE itself (the real catch is in the pixels: a non-canonical bbox or a
  fringe px count > 0), don't just tweak CSS.

## Source-vs-gitignored (the bikar carve-out)

Most generated assets are gitignored + rebuilt at build. Hero card PNGs are different: they are
**committed SOURCE** (the fit-to-arch output is the deliverable, not regenerable at build time without
the raw + the tool). The raw inputs live OUTSIDE the repo (scratch dir); the fitted PNGs are committed.
`*.proof.png` / `*.traced.png` are working artifacts (gitignored).

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Faint WHITE LINE at the arch edge | the PNG isn't canonical (arch bbox off, or fringe px just outside the interior) | re-fit with `fit-to-arch.js`; inspect the pixels (bbox should be ~162..868/79..939, fringe 0) |
| Masked layer renders NOTHING (empty arch) | masked with `arch-inner.png` (black interior HIDES under luminance) | use `arch-mask-white.png` (white interior REVEALS) for any layer you want to SHOW |
| `page.evaluate: Event` / data-URL too large | passing a huge data-URL into the canvas | the tool uses file:// URLs; run it on a file path, not an inline data-URL |
| `SecurityError: tainted canvas` reading pixels | canvas tainted by a file:// image | the tool launches Chromium with `--allow-file-access-from-files --disable-web-security`; don't strip those flags |
| Interior-detection leaks through light tiles | the raw's tiles are bright, so a content-detect over-includes | use the DEFAULT direct clip (the raws are canonical-aligned); only `--align` when the proof shows misalignment |

## Why this exists

The hero recurringly broke on non-canonical assets (a re-imported `initiatives.png` shipped with a
1020-px fringe and a 0,0..873,1023 bbox → the white-line bug). This workflow + the canonical contract
make a clean import deterministic. **The guard is in place**: `scripts/validate-arch-assets.js`
(`make validate-arch-assets`) measures every card PNG against the canonical arch and ERRORS (exit 2) on
a fringe or wrong dims — proven to bite on a planted full-opaque PNG. The warn-tier PostToolUse hook
`.claude/hooks/validate-arch-assets-hook.sh` (registered in `.claude/settings.json`) runs it after a
write to any `static/img/cards/*.png` and surfaces violations without blocking. So a fringe can't ship
silently; `--proof` is still the eyeball check while iterating.
