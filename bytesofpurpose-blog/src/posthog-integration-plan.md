# PostHog Integration Plan — bytesofpurpose-blog

Living record of the analytics instrumentation and the decisions behind it.
Source of truth for what we capture and why. Last updated 2026-05-31.

## Setup

- **SDK:** `posthog-js` (browser), loaded via the Docusaurus client module
  `src/posthog.js`. Initialised only in the browser and only when `POSTHOG_KEY`
  is set, so builds without a key are inert.
- **Config injection:** `docusaurus.config.js` → `customFields.posthogKey` /
  `posthogHost` from `process.env.POSTHOG_KEY` / `POSTHOG_HOST` at build time.
- **Cloud:** PostHog Cloud (US). Host `https://us.i.posthog.com`.
- **Keys:** the project key (`phc_…`) is public/write-only — safe to ship in the
  client bundle. The personal API key (for reading stats) lives only in the
  gitignored repo-root `.env` and is used by the `manage-cloudflare-access` skill's
  `posthog_stats.py`.

## What we capture & why

### Automatic layer (this plan added — the wizard skipped it)

| Capability | How | Why |
|---|---|---|
| **Pageviews** | manual `$pageview` on load + every SPA route change | "Which of the 291 pages get read." Manual because Docusaurus is a SPA. |
| **Pageleave / read time** | `capture_pageleave: true` | Time-on-page & bounce — the key content metric for a blog. |
| **Autocapture (all clicks/links)** | `autocapture: true` | Footer links, navbar, edit-page, social icons, buttons — no per-element code. **Directly answers "track footer link clicks."** |
| **Outbound link clicks** | included in autocapture (clicks on external `<a>`) | "What did readers go do next" — external project/social links. |
| **Scroll depth** | custom 25/50/75/100% milestones, reset per route | Did readers reach the bottom of long posts/docs. |
| **Exception autocapture** | `autocaptureExceptions: true` | Catch client-side JS errors in the wild. |

**Privacy decision:** standard autocapture (records element text/attributes). The
site is a public blog with no user accounts or sensitive forms, so masking was not
needed. Revisit (`mask_all_text`) if any authenticated/PII surface is ever added.

### Bespoke events (added by the PostHog setup wizard)

| Event | Trigger | File |
|---|---|---|
| `blog post voted` | vote/reaction click | `src/components/VoteButton/index.tsx` |
| `support button clicked` | PayPal donation form submit | `src/components/SupportButton/index.tsx` |
| `graph node clicked` | click a node in an interactive graph | `src/components/Graph/useGraphInteractions.ts` |
| `graph link copied` | copy an anchor link to a node/edge | `src/components/Graph/useGraphInteractions.ts` |
| `graph expanded all` / `graph collapsed all` | expand/collapse all nodes | `src/components/Graph/GraphRenderer.tsx` |
| `changelog filter changed` | change a changelog filter | `src/components/Changelog/Filters/ChangelogFilters.tsx` |
| `changelog viewed` | land on the changelog page | `src/pages/changelog.tsx` |
| `egress_share` | click a share channel (copy/email/LinkedIn/X) in the title | `src/components/ShareButton/index.tsx` |
| `egress_copy` | any in-page copy (payload untouched) | `src/posthog.js` |
| `bookmark_intent` | ⌘D/Ctrl+D pressed (event only; can't tag the bookmark) | `src/posthog.js` |
| `ingress` | arrival with `?im=<marker>` (then stripped), or untagged direct deep arrival (`direct_or_bookmark`) | `src/posthog.js` |
| `bookmarklet_used` | the saved bookmarklet is clicked (beaconed straight to PostHog, survives the redirect) | `src/components/BookmarkletButton/index.tsx` (embedded `javascript:`) |
| `bookmarklet_help_opened` / `bookmarklet_dragged` | user opens the drag-instructions modal / drags the bookmarklet | `src/components/BookmarkletButton/index.tsx` |
| `premium_interest` | reader asks for a premium doc to be made free — a demand signal for un-gating (props: `path`, plus `what` from the modal or `source: 'gate_card'` from the page gate's "Ask me to make this free" card). Distinct from the LinkedIn sign-in CTA, which is an unlock, not a vote. | `src/components/SignInModal/index.tsx`, `src/components/PremiumGate/index.tsx` |
| `premium_signin_click` | reader clicks "Sign in with LinkedIn" on a premium page gate's unlock CTA card — intent to unlock (props: `path`). Fires just before the Access/LinkedIn redirect. | `src/components/PremiumGate/index.tsx` |

**Ingress-attribution layer:** the `egress_*` / `bookmark_intent` / `ingress` events
form a "how a URL left and came back" loop. The ShareButton (mounted in the doc/blog H1
via swizzled `@theme/DocItem/Content` + `@theme/BlogPostItem/Header/Title`) tags outgoing
URLs with `?im=<share_cp|share_em|share_li|share_x>`; `posthog.js` reads + strips `im` on
arrival. Full design + feasibility notes: `./ingress-attribution-plan.md`.

## Decision log

- **2026-05-31 — Evaluated the wizard output.** It covered pageviews (all pages,
  via the client module) and bespoke component events well, but **missed the passive
  layer**: no pageleave/read-time, no autocapture (so footer/navbar/social clicks
  were untracked), no outbound-link or scroll tracking.
- **2026-05-31 — Decision:** add all four missing layers (autocapture, pageleave,
  outbound, scroll depth) with **standard** (unmasked) autocapture. Implemented in
  `src/posthog.js`. Reasoning above.
- Kept the wizard's bespoke events as-is (no conflict; init is single-path).

## Experiments (A/B tests)

| Flag key | Variants | Component | Conversion | Status |
|---|---|---|---|---|
| `support-button-copy` | control "Buy me a coffee ☕" / test "Support the dev 💜" | `src/components/SupportButton/index.tsx` (rendered on docs footer page) | `support button clicked` | wiring done; create experiment in PostHog + run |

Workflow + per-experiment task template: `.claude/skills/run-ab-test`. Spec:
`test/e2e/support-ab-test.spec.ts`.

## Open / future ideas

- **Person identification & profiles (roadmap).** Today every visitor is an
  anonymous per-browser `distinct_id`. Maturing to person-level analysis
  (`person_profiles` mode, `posthog.identify()` at the first identifying action,
  `setPersonProperties`, aliasing) is tracked in the
  [blog roadmap](docs/4-development/7-roadmaps/1-blog-roadmap.mdx) under
  *Analytics & Tracking → PostHog: person identification & profiles*. Ref:
  [PostHog: capturing person profiles](https://posthog.com/docs/data/persons#capturing-person-profiles). Privacy gate:
  repo is public + site behind Cloudflare Access bypass; never ship PII; keep
  `POSTHOG_TEST_MODE` out of production.
- Dashboards & insights created by the wizard live in PostHog (Blog Analytics
  dashboard `1650838`). Consider adding a "content performance" insight: pageviews
  + avg scroll depth + avg time per `$pathname`.
- Consider a search-event capture if/when site search is added.
- Reading the stats programmatically: `posthog_stats.py` (HogQL) in the
  `manage-cloudflare-access` skill — `stats` / `pages` / `daily`.

## Verify after build

**Automated (recommended):**

```bash
make test-posthog   # builds with POSTHOG_TEST_MODE=1, serves, runs the Playwright
                    # spec asserting real POSTs to us.i.posthog.com, tears down.
```

Why a test mode? PostHog's bot/UA filter silently drops events from automated
browsers (Playwright), so a normal build can't be validated by e2e —
`capture()` just returns undefined. `POSTHOG_TEST_MODE=1` sets
`opt_out_useragent_filter: true` so test events are ingested. **Production builds
never set it**, so the bot filter stays on for real traffic. See
`posthog-issues.md` ISSUE-002.

**Manual smoke:**

```bash
cd bytesofpurpose-blog && yarn build && yarn serve
# devtools → Network → filter "us.i.posthog.com" (NOT us-assets, that's just the
# bundle) → confirm POSTs for $pageview on load, $autocapture on a footer click,
# scroll depth on scroll, $pageleave on navigation away.
```

**Server-side readback:** `manage-cloudflare-access/posthog_stats.py daily --days 1`
(subject to ingestion lag).
