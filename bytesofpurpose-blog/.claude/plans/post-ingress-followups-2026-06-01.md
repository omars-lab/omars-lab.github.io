# Post-ingress follow-ups — continuation plan (2026-06-01)

Self-contained handoff for a fresh session. PR #2 (ingress-attribution + support page +
docs IA cleanup + typecheck/link fixes + gtag-guard) is **merged to `master` and deployed
live**. This file captures what's left: one real inconsistency to fix, a backlog of design
decisions, and a few monitoring items. Nothing here is blocking — the site is shipped and
healthy.

## Starting state (verify these first — they should still hold)

- Branch `master`, clean tree, no open PRs. Site live at
  [blog.bytesofpurpose.com](https://blog.bytesofpurpose.com) (homepage 200, no Cloudflare
  Access block; PostHog beacon `phc_…` in the live bundle with test-mode OFF;
  `adblock_detected` present in the bundle).
- `make typecheck` → **0 errors** (kept green; `make typecheck` target added this session).
- `cd bytesofpurpose-blog && node scripts/validate-links.js` → only **`long-url=34`**
  (broken-internal=0, link-to-draft=0 — both cleared this session).
- This session's commits on master (newest first):
  - `9b213a54` Merge PR #2
  - `19f4508c` feat(vote): key ideas by slug + persist votes in localStorage
  - `95abd737` fix(analytics): guard window.gtag + detect ad-block, report to PostHog
  - `82edf3db` feat(support): A/B coffee CTA presentation (link vs button) + ignore build-support/
  - `9bbeaca5` fix(links): clear broken-internal + link-to-draft (comment-aware validator)
  - `d33660ea` fix(types): make yarn typecheck green (React 19 JSX + @theme + real bugs)
  - `ce04f4f7` docs(readme): sync structure to topic IA + badges + MIT LICENSE
  - `3aa6a8b3` fix(support): gate Shopify card; note dead navbar-coffee type

---

## Work queue (do these; ordered by priority)

### W1 — Fix the stale experiment doc (the one real inconsistency) — NO defer

**Problem:** This session the `support-button-copy` experiment was pivoted from a **copy**
test to a **presentation** test, and that shipped — but the lab-notebook doc still describes
the old copy hypothesis. Shipped truth vs. doc disagree:

- **Shipped** (`bytesofpurpose-blog/src/experiments.ts`): both variants have the SAME copy
  (`"Buy me a $5 coffee ☕"`); the experiment now tests PRESENTATION on the **/support page**
  coffee CTA — `control` = plain text **link**, `test` = styled **button** (see
  `src/components/Support/CoffeeButton.tsx`, which reads `variant === 'test'`). PayPal amount
  is now **$5** (was $1). Flag key unchanged (`support-button-copy`) so the funnel stays
  continuous.
- **Stale doc** (`bytesofpurpose-blog/docs/product-management/experiments/2026-05-31-support-button-copy.md`):
  - frontmatter `title: 'Support button copy'` + `description:` still say
    `"Support the dev 💜" vs "Buy me a coffee ☕"`.
  - `> **Status:** running` line, the §1 Hypothesis, §2 Why, and the §3 Variants table all
    describe the copy test ("Buy me a coffee ☕" vs "Support the dev 💜").
  - §3 Placement says **docs footer** / `src/components/SupportButton` — but it now lives on
    the **/support page** via `src/components/Support/CoffeeButton`.

**done-when:** the doc's hypothesis/variants/placement/metric match `experiments.ts` +
`CoffeeButton.tsx`, and the frontmatter title/description describe the presentation test.

**work:** Use the `design-experiment` / experiment-lifecycle conventions. Rewrite:
  - frontmatter `title` (e.g. "Support CTA: link vs button") + `description`.
  - §1 Hypothesis → presentation (a styled button draws more clicks than a plain link).
  - §3 Variants table → control = text link, test = styled button; both same copy "$5 coffee".
  - §3 Placement → `/support` page, `src/components/Support/CoffeeButton`.
  - Add a dated note in the doc that the experiment was **re-scoped on 2026-06-01** from
    copy→presentation (same flag key), so any pre-2026-06-01 exposures/conversions in PostHog
    belong to the OLD copy test and must be excluded from the presentation analysis.
  - Reconcile the `## Idea`/`## Execution` mapping convention if present (warn-validated).

**verify:** `make validate-structure` stays clean (warn-tier OK); doc reads consistently with
the shipped code. Reversible, no user defer.

**note:** the doc is `draft: true` — it won't ship live until un-drafted (separate call).

---

## Backlog (design decisions — surface to user, do NOT auto-act)

These need a human decision before any work. List them; don't pull without the user queueing.

- **B1 — `im` as a session super-property.** Today the ingress `im` marker is attributed only
  to the LANDING `ingress` event (landing-only). Option: register it as a PostHog
  super-property so ALL session events carry the acquisition channel. Design decision (changes
  attribution semantics). Reference: `src/posthog.js` (captureIngress) + the
  ingress-attribution-design memory.
- **B2 — Bookmarklet reach.** The bookmarklet affordance currently lives on the welcome page
  only. Whether to surface it more broadly (footer? a `/subscribe` page?) is a placement call.
- **B3 — Pre-existing `onBrokenLinks: 'warn'` set (~6 in the build).** Non-fatal build
  warnings, predate this work (e.g. `/docs/blogging`→blog-components, experiments self-link,
  `/blog/my-contributions#…` anchors, a `4-embed-external-components/tips` rel-link). Two now
  surface as `/blogging` from changelog links repointed this session — the live `/blogging`
  page returns 200, so those aren't reader-facing 404s. Clean up if/when desired.
- **B4 — `long-url=34` link-hygiene warnings.** Pre-existing warn-tier; a separate hygiene
  sweep (`make validate-links`, `--fix` for bare URLs; long-urls need manual labeling).

---

## Monitoring (confirm over the next day — not code work)

- **M1 — `adblock_detected` in PostHog.** Shipped this session (super-property + per-session
  `adblock_state` event + person property). Local probe proved the detection flips correctly,
  but the report only fires once `window.posthog` initializes — confirm in PostHog that live
  events actually carry the `adblock_detected` property.
- **M2 — `support button clicked` funnel discontinuity.** The conversion event NAME stayed the
  same across the copy→presentation re-scope, so the historical funnel is continuous but its
  MEANING changed on 2026-06-01. Any analysis must split on that date (see W1's dated note).

---

## Guardrails (apply to any work here)

- Prove, don't assert: run the relevant gate (`make typecheck`, `validate-links`,
  `validate-structure`, `make test-regression`, or a Playwright probe) and show evidence before
  claiming done. (Repo tenet — see the always-prove-and-test memory.)
- Commit/push/PR/deploy are user-gated — prepare and ask, don't auto-act.
- Structure/validator decisions must update the checks + owning skill in the SAME change
  (CLAUDE.md operating convention).
- Deploy needs `POSTHOG_KEY` at BUILD time and must NEVER ship `POSTHOG_TEST_MODE` (disables
  the bot filter). `make deploy` secret-scans first; extract `.env` vars per-var (don't
  `source .env` — special chars break it).
