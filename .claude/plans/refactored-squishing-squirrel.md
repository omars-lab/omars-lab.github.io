# Frontend Design Refresh — bytesofpurpose blog → executive editorial identity

## Context

The blog at `https://blog.bytesofpurpose.com/` (Docusaurus 3, source in `bytesofpurpose-blog/`)
currently wears a **generic "AI-slop" skin**: Inter for everything (body + headings), a
blue→indigo→purple gradient hero, blue `#2563eb` primary, `0.6rem` radius. Confirmed live
via DevTools: `h1` font is Inter 700; hero gradient is `linear-gradient(135deg,#2563eb,#4f46e5,#7c3aed)`.

The owner's **portfolio** (`https://www.bytesofpurpose.com/`) already has a refined, executive
**editorial identity** we want the blog to feel like a sibling of. Measured live from the portfolio:

| Token | Portfolio value |
|---|---|
| Display font | **Fraunces** (serif; weights 400/600/700/900 + italic 400/600), headline 88px/600 |
| Body / UI font | **Geist Sans** (400/500/600) |
| Background | warm cream **`#ECE7DF`** (`rgb(236,231,223)`) |
| Ink (primary text) | near-black **`#1A1A1A`**; secondary warm gray **`#4A4742`** (`rgb(74,71,66)`) |
| Accent | burnt coral / terracotta **`#E4572E`** (`rgb(228,87,46)`) |
| Eyebrow labels | uppercase Geist 600, e.g. "ENGINEERING & AI LEADERSHIP" in coral |
| Motifs | thin horizontal rules, generous whitespace, offset-coral-border framed headshot, a rotating accent word ("I **build/design** smart software products…") |

**Decision (confirmed with user):** Match the portfolio closely — Fraunces headings + Geist
body, cream surfaces, burnt-coral accent replacing blue, coral underlined links. Do NOT change
the blog's identity/content/IA — typography + color + spacing tweaks only, "befitting a blog by
an executive," no tacky colors. Hero treatment to be decided during build. Full surface scope:
global tokens + hero, doc/blog reading pages, navbar/footer, landing sub-pages.

**Intended outcome:** the blog reads as the portfolio's sibling — calm, editorial, executive —
while keeping all existing structure, dark mode, and the gold premium-gating palette intact.

## Constraints / things not to break

- **Dark mode** must keep WCAG AA. Cream is light-mode only; dark mode gets a warm-ink surface,
  and coral must be lifted for AA on dark (the file already follows this "lift primary in dark"
  pattern — `html[data-theme='dark']` block at `custom.css:58`).
- **Premium gold palette** (`--premium-gold*`, `custom.css:39-53`) stays as-is. Coral `#E4572E`
  and gold `#9a7b1f`/`#d4af37` are distinct hues — no clash — but verify the gated surfaces still
  read well on cream.
- **Syntax-highlight token overrides** (`custom.css:181-268`) were hand-tuned for AA; leave them.
- Keep all existing **accessibility affordances**: 44px mobile touch floor (`custom.css:416+`),
  underlined markdown links (`custom.css:148+`), doc-footer overflow fix (`custom.css:410`).
- Fonts load via `headTags` in `docusaurus.config.js` — add Fraunces + Geist there, drop Inter.

## Approach (recommended)

Re-skin through the **centralized token layer** — the system is already fully parameterized via
CSS custom properties, so most of the site re-skins from `custom.css` alone. Then targeted tweaks
to the hero module and a few component surfaces.

### 1. Fonts — `bytesofpurpose-blog/docusaurus.config.js` (`headTags`, ~line 69-89)
- Replace the Inter `<link>` with **Fraunces** (`opsz,wght` axes + italic) and **Geist Sans**.
  Google Fonts URL, e.g.:
  `family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;0,9..144,700;1,9..144,400;1,9..144,600&family=Geist:wght@400;500;600&display=swap`
- Keep the two `preconnect` links. Update the explanatory comment.

### 2. Global tokens — `bytesofpurpose-blog/src/css/custom.css` (`:root`, lines 10-54)
- `--ifm-font-family-base` → Geist Sans stack (fallback system-ui…).
- Add `--ifm-heading-font-family` → Fraunces serif stack (Infima supports this var; if a heading
  rule doesn't pick it up, add an explicit `h1,h2,h3,h4 { font-family: var(--ifm-heading-font-family) }`).
- Recolor primary from blue → **burnt coral**: `--ifm-color-primary: #E4572E` and regenerate the
  6 dark/light steps (use Infima's standard ±shade math; darker `#c8431c…`, lighter `#ea6f4d…`).
- `--ifm-color-primary-contrast-background` → coral tint `rgba(228,87,46,0.08)`.
- Add **surface tokens** for the cream paper feel (light): set Infima
  `--ifm-background-color: #ECE7DF`, `--ifm-background-surface-color`, and a warmer
  `--ifm-card-background-color` (e.g. `#FBF8F2` so cards lift off the cream). Text:
  `--ifm-font-color-base: #1A1A1A`, emphasis/secondary mapped toward `#4A4742`.
- Heading weight: Fraunces reads best around **600** (portfolio uses 600), so set
  `--ifm-heading-font-weight: 600` and consider easing `letter-spacing` on `h1,h2,h3`
  (`custom.css:87-91`) since serifs don't want the −0.02em tightening Inter did → relax to
  `-0.01em` or `normal`.
- Optionally soften radius from `0.6rem` toward the portfolio's crisper feel (keep ~`0.5rem` or
  go to `0.375rem`; decide visually).

### 3. Dark-mode tokens — `custom.css` `html[data-theme='dark']` (lines 58-84)
- Lift coral for AA on dark: `--ifm-color-primary: #F2734D` (or similar ≥4.5:1 on the dark bg);
  regenerate steps.
- Warm the dark surfaces slightly (Docusaurus default near-black is fine; nudge card bg to a
  warm `#1e1b19` so it's a sibling of cream, not a cold gray). Keep AA.
- Re-tune `--ifm-color-primary-contrast-background` to a coral tint on dark.

### 4. Hero — `bytesofpurpose-blog/src/pages/index.module.css` (`.heroBanner` etc., lines 6-126)
Decide treatment during build (user deferred). Recommended **editorial, gradient removed**:
- Replace the blue→purple gradient with a calm **cream band** (light) / warm-ink band (dark);
  hero text switches from white to ink/coral accordingly (currently hard-coded `color:#fff` at
  line 11 and on cards — these need to become theme-aware, not assume a dark gradient behind them).
- `.heroTitle` → Fraunces, weight 600, relax letter-spacing; consider an **eyebrow label**
  (uppercase Geist 600 coral, like the portfolio) above the title, and optionally a rotating
  accent word echoing the portfolio's headline motif (CSS/JS, optional — keep tasteful).
- `.chooserCard` currently styled for a translucent-on-gradient look (`rgba(255,255,255,0.12)`
  bg, white text, lines 54-75). Restyle for a light surface: cream/white card, ink text, coral
  hover accent, thin border, subtle lift. The arched illustrations (lines 81-99) stay — they're
  a nice identity motif — but re-check their drop-shadow on the lighter background.
- Keep the responsive rules (lines 114-126); just update sizes for the serif.

### 5. Navbar & footer
- **Navbar:** the brand title + 7 items (Craft/Journey/Thoughts/Mindset/Designs/Vote/Support).
  No structural change. Apply the new tokens (active item → coral, Fraunces for the brand
  wordmark optional). Verify the auth pill + color-mode toggle ordering rules
  (`custom.css:333-356`) and the `.navbar-coffee` button (lines 96-145) still look right in coral
  — the dark-mode white-on-primary AA fix at `custom.css:120` must be re-checked against the new
  coral primary.
- **Footer:** always-dark (`style:'dark'` in config). Warm it slightly and let link hover use
  coral. Mostly inherits from tokens; minor overrides if needed.

### 6. Landing sub-pages — page CSS modules
Re-skin to the new tokens. Most already use `var(--ifm-*)` so they inherit, but check for
**hardcoded blues** and the gradient/white-on-color assumptions in:
- `src/pages/mindset.module.css`, `src/pages/vote.module.css`, `src/pages/support.module.css`,
  `src/pages/changelog.module.css`.
- Components with hardcoded color: `HomepageFeatures/`, `LatestPosts/` (tag pills use the primary
  contrast bg — will follow coral automatically), and the LinkedIn blue `#0a66c2` in
  `AuthNavbarItem`/`PremiumGate` (that's brand LinkedIn blue — **leave it**, it's intentional).
- The changelog heatmap greens (`#216e39`/`#39d353`) are GitHub-style semantic colors — leave or
  optionally re-tune; not required for the executive look.

### Representative files to modify
- `bytesofpurpose-blog/docusaurus.config.js` — font headTags
- `bytesofpurpose-blog/src/css/custom.css` — all tokens (light + dark), heading font rule
- `bytesofpurpose-blog/src/pages/index.module.css` — hero + chooser cards
- `bytesofpurpose-blog/src/pages/{mindset,vote,support,changelog}.module.css` — sub-page polish
- (audit-only) `src/components/HomepageFeatures/*`, `src/components/LatestPosts/*` for stray hex

## Verification

1. **Local dev build** from repo root: `make start` (or the project's dev target) → open
   `http://localhost:3000`. Confirm fonts load (Network shows Fraunces + Geist, not Inter) and
   `getComputedStyle(document.querySelector('h1')).fontFamily` reports Fraunces.
2. **Visual pass with chrome-devtools MCP** (the method used to build this plan), at desktop
   (1440×900) and emulated mobile (`390x844x3,mobile,touch`), light AND dark, on: `/` (hero),
   `/thoughts` (blog list) + an individual post, `/craft` (doc + sidebar/TOC), `/mindset`,
   `/vote`, `/support`, `/changelog`. Screenshot each to `.claude/design-review/shots/` and
   compare against the saved `portfolio-*.png` references for sibling-feel.
3. **Contrast/AA**: run `make test-regression` (axe a11y gates in the e2e suite) — must stay green;
   spot-check coral-on-cream, coral-on-dark, gold premium surfaces on cream, footer links.
4. **No-overflow / touch**: re-confirm the mobile 44px touch floor and no horizontal overflow
   (the audit-mobile fixes the tokens must not regress).
5. **Premium gating intact**: load a premium-gated doc; confirm gold lock surfaces still read
   correctly on the cream background and the gate CTAs are unaffected.

## Out of scope (this pass)
- Content / copy / IA changes, nav restructure, new pages.
- The portfolio site itself (inspiration source only).
- LinkedIn-brand-blue auth elements (intentional brand color — keep).
