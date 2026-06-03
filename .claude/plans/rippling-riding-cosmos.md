# Plan: `audit-mobile-experience` skill — confirm mobile is up to par, not just shrunk desktop

## Context

The "Browse My Thoughts" card (PR #12) just shipped to prod, widening the homepage
chooser to three cards. That raised the open question: **is the mobile experience
genuinely good, or is it just a compressed desktop layout?** Today the site has no
mobile verification at all — every Playwright project uses `Desktop Firefox`
(`bytesofpurpose-blog/playwright.config.ts:70,79,85,103`), and the homepage's only
breakpoint (`index.module.css:111`, `max-width: 966px`) just shrinks font sizes. The
custom Changelog component carries ~30 `768px` media queries (highest custom-layout
risk), while docs/graph/premium surfaces are largely untested on touch viewports.

The user wants this captured as a **reusable skill** (not a one-off report), then run
once now to produce the first prioritized fix list. Depth chosen: **one-time deep
audit** procedure (manual + emulated), **no permanent CI test project**. Scope: **all
four surfaces** — homepage/chooser, docs reading, changelog timeline, interactive
(graph/premium/blog).

This mirrors the existing `review-reader-experience` skill: an **audit-and-report**
skill that emits a prioritized findings list and does **not** silently auto-edit.

## What "up to par, not shrunk desktop" means (audit dimensions)

Research-backed criteria the skill checks (sources in References):
1. **Tap targets** — interactive elements ≥44×44px (incl. padding), ≥8px apart.
2. **Thumb reach** — primary CTAs reachable one-handed (bottom ~⅔ of viewport); not
   buried top-corner.
3. **Content parity** — mobile shows the *same* content/affordances as desktop, not a
   stripped or hidden subset (hidden nav items get ~3× less interaction).
4. **No horizontal scroll / overflow** — `scrollWidth <= clientWidth` at 360–414px;
   code blocks, tables, wide images wrap or scroll *intentionally*, not the page.
5. **Reflow, not shrink** — multi-column → stacked; text stays ≥16px (no zoom-to-read);
   images re-crop/scale rather than squish.
6. **Touch interactions work** — graph pan/zoom, premium gate, blog filters respond to
   touch (`hasTouch`), no hover-only affordances.
7. **Mobile performance** — Lighthouse mobile (throttled CPU/network) LCP/CLS sane.
8. **Mobile a11y** — axe passes at mobile viewport (focus order, contrast, labels).

## Deliverable 1 — the skill: `.claude/skills/audit-mobile-experience/SKILL.md`

Single-file skill (matches `review-reader-experience`'s shape). Frontmatter `name` +
`description` ("Audit the Bytes of Purpose site on real mobile viewports — confirm it's
a true mobile experience, not a compressed desktop layout … emits a prioritized report;
does not auto-edit. Use when asked 'is this good on mobile?', after a layout/hero/CSS
change, or before a release."). Body sections:

- **Why this skill exists** — the "responsive ≠ mobile-good" trap; the two real tells
  (horizontal overflow + sub-44px tap targets) and the parity trap (hidden content).
- **Audit vehicle (prod build, not dev).** Build-only transforms must be present, so
  audit the **served prod build on :4173**, never `yarn start`:
  `make serve` (or reuse the `build/` dir already produced by the deploy). Drive it with
  the **chrome-devtools MCP** tools (already available, deferred): `resize_page` /
  `emulate` to set device viewport + `hasTouch`, `take_screenshot` for side-by-side
  desktop-vs-mobile parity diffs, `lighthouse_audit` for mobile perf/a11y, and
  `evaluate_script` for the programmatic overflow + tap-target probes below.
- **Device matrix** — small iPhone SE (375×667), iPhone 15 Pro (393×852),
  Pixel 8 (412×915), plus the 360px and 768px CSS breakpoint edges. Both light + dark.
- **The mechanical probes (copy-paste, repeatable)** — the parts a human eye misses:
  - *Horizontal-overflow probe* (`evaluate_script`): flag any element with
    `scrollWidth > clientWidth` / page `documentElement.scrollWidth > innerWidth`.
  - *Tap-target probe*: enumerate `a, button, [role=button], input` and report any with
    rendered box `< 44px` in either dimension, or `< 8px` gap to a neighbor.
  - *Content-parity probe*: diff the set of visible links/headings/CTAs at desktop vs
    mobile width — anything present on desktop but `display:none`/removed on mobile is a
    parity finding to justify or fix.
  - *Font-size probe*: flag body text computed `< 16px` (triggers iOS zoom-to-read).
- **Per-surface checklist** (the four chosen scopes), each with its specific risk:
  - **Homepage / chooser** (`src/pages/index.tsx`, `index.module.css`): do the 3 cards
    stack to 1-col cleanly at 375px? arched images not squished? CTA reachable? The new
    `max-width: 1040px` + `flex 1 1 300px` is the thing to stress at the 360px edge.
  - **Docs reading** (craft/self): sidebar drawer opens/closes; code blocks scroll
    inside themselves (page doesn't); tables; in-doc anchor nav.
  - **Changelog timeline** (`src/components/Changelog/*`): the ~30 `768px` queries —
    timeline reflow, filters, date overlay, legend sidebar collapse.
  - **Interactive** (`graph-*`, `PremiumGate`, blog list): graph pan/zoom by touch;
    premium gate + sign-in modal usable; blog filter chips tappable.
- **Output format** — a **prioritized report** (P0 broken / P1 degraded / P2 polish),
  each finding = surface · viewport · symptom · probe-evidence (numbers/screenshot) ·
  concrete fix. Explicitly: **report only, do not auto-edit** (same contract as
  `review-reader-experience`).
- **Troubleshooting table** — seed with: "audited dev :3000 → build-only transforms
  missing, re-run on :4173"; "emulate without `hasTouch` → touch handlers no-op, set it";
  "Lighthouse mobile throttling makes LCP look broken → that's the point, compare to
  budget not to desktop".

## Deliverable 2 — register the skill (lockstep, per CLAUDE.md convention)

- Add a row to the **Skills map** table in `CLAUDE.md` (the "Reader-experience audit"
  neighborhood): `Mobile-experience audit | audit-mobile-experience | confirm the site
  is a true mobile experience (tap targets, thumb reach, content parity, overflow,
  touch, mobile perf/a11y) not a shrunk desktop → prioritized report`.
- No validator/hook changes needed — this is an advisory audit skill, not a structure
  rule (so the "structure decisions update the checks" tenet doesn't apply here).

## Deliverable 3 — run it once now → first prioritized fix list

Execute the skill's procedure against the current prod build to produce the inaugural
report. Likely early findings to expect (to verify, not assume): the 3-card hero at the
360px edge, the `966px`-only homepage breakpoint being font-only, and the Changelog
`768px` cluster. Present the report; **fixes are a separate follow-up** the user
approves per-item (the skill does not auto-edit).

## Critical files

- **New:** `.claude/skills/audit-mobile-experience/SKILL.md` (the skill).
- **New:** `.claude/plans/rippling-riding-cosmos.md` (this plan).
- **Edit:** `CLAUDE.md` — one new row in the Skills-map table.
- **Read/reference (not edited):** `bytesofpurpose-blog/playwright.config.ts`,
  `src/pages/index.module.css`, `src/components/Changelog/*`,
  `test/e2e/accessibility.spec.ts` (axe pattern to reuse conceptually),
  `.claude/skills/review-reader-experience/SKILL.md` (shape to mirror), `Makefile`
  (`serve`, `build-premium` targets).

## Reuse (don't reinvent)

- **chrome-devtools MCP** for emulation/screenshot/lighthouse (already available) — no
  new test harness or dependency.
- **`make serve`** to serve the prod build on :4173 (reuse the `build/` from the deploy).
- **axe-core** approach already proven in `accessibility.spec.ts` — the skill references
  it for the mobile-viewport a11y pass conceptually (Lighthouse a11y covers it without
  new code).
- **`review-reader-experience` SKILL.md** as the structural/voice template.

## Verification (that the skill itself works)

1. Skill file lints as valid Markdown with `name`+`description` frontmatter; appears in
   the available-skills list after creation.
2. Dry-run the procedure: `make serve`, then via chrome-devtools MCP `emulate` iPhone SE
   + run the overflow and tap-target probes on `/` — confirm they return concrete
   numbers (proves the probes are copy-pasteable and actually execute), per the
   repo tenet "never assert; prove with a runnable check + evidence".
3. The run produces a non-empty prioritized report with at least one
   probe-evidenced finding (or an explicit "clean" with the probe output backing it).
4. `CLAUDE.md` Skills-map row renders; no other skill/validator references broken.

## Out of scope (chosen explicitly)

- No permanent Playwright mobile project / `make test-regression` wiring (user chose
  one-time audit, not a CI net).
- No real-device cloud lab (BrowserStack/LambdaTest).
- No fixes applied in this change — the skill reports; fixes are separate, per-item
  approved follow-ups.

## References (mobile-QA best practices, June 2026)

- [Heurilens — Mobile UX Audit Checklist](https://heurilens.com/blog/core-ux/mobile-ux-audit-checklist-critical-issues) (tap targets, thumb zone, content parity)
- [Siteimprove — The Touch Target Problem](https://www.siteimprove.com/blog/motor-impairments-and-mobile-ui-the-touch-target-problem/) (44–48px, motor accessibility)
- [Playwright Emulation docs](https://playwright.dev/docs/emulation) (device descriptors, `hasTouch`)
- [TestDino — Playwright Mobile Testing](https://testdino.com/blog/playwright-mobile-testing) (emulator vs real device — what emulation misses)
