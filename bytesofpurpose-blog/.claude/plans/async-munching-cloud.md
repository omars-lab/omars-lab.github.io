# Plan — Ingress Attribution Layer (share controls in title + URL tagging)

## Context

**Why:** We want to know how our URLs leave the site and how they come back —
attribute return traffic to the channel that produced it (share / copy / bookmark).
The user's original idea was to intercept ⌘D/⌘C and inject `ingressMarker=…` into the
URL just before a bookmark/copy. **That specific interception is not feasible** (the
browser snapshots the address bar at the keypress; pages can't tag it, and the
"rewrite-then-revert" race is Chrome-only and pollutes the address bar). The feasible,
reliable version flips it: **tag the URL at the moments we control** (a share control we
render) and **read the tag on arrival**.

**Outcome:** A per-page share control in the article/post **title** offering four
channels (copy / email / LinkedIn / X), each minting a URL tagged with a short
`im=<marker>` param, plus an ingress reader in `posthog.js` that records the marker on
arrival and strips it. This answers: which pages get shared, to where, and whether
shared/bookmarked links come back.

Full rationale + feasibility tier-list already written to
`bytesofpurpose-blog/src/ingress-attribution-plan.md` (the living design doc). This file
is the implementation plan. **Status: planned, not yet approved to build.**

## Decisions (from the user)

- **Placement:** inline in the article/post **title** (next to the H1), not the footer.
- **Channels:** copy-link (`share_cp`), email (`share_em`), LinkedIn (`share_li`),
  X (`share_x`).
- ⌘D bookmark: **event-only** (`bookmark_intent`), no URL tagging.
- In-page generic copy: capture `egress_copy` event, do **not** mutate clipboard payload
  (would corrupt code blocks); only the copy-link *button* writes a tagged URL.

## Param / marker contract

- Param key: `im` (short, keeps shared URLs tidy). `im` = ingressMarker.
- Markers: `share_cp`, `share_em`, `share_li`, `share_x`, `direct_or_bookmark`.
- Stripped from the URL on arrival (decided as recommended default) so it never persists
  or compounds on re-share.

## Implementation

### 1. New component: `src/components/ShareButton/index.tsx`
A small inline control (icon row or single icon → 4-channel menu — see open question).
Mirrors the existing component idiom:
- `import posthog from 'posthog-js'` (direct import — matches SupportButton/VoteButton).
- `shareUrl(marker)` helper: `const u = new URL(window.location.href); u.searchParams.set('im', marker); return u.toString();`
- Per channel:
  - **copy** (`share_cp`): `navigator.clipboard.writeText(shareUrl('share_cp'))` with the
    `execCommand` fallback **reused from** `src/components/Graph/useGraphInteractions.ts`
    (copyAnchorLink, ~lines 171–204). Inline "Copied!" button feedback (no toast exists
    in the repo — flash the label/icon; do not add a toast lib).
  - **email** (`share_em`): open `mailto:?subject=<title>&body=<shareUrl>`.
  - **linkedin** (`share_li`): open `https://www.linkedin.com/sharing/share-offsite/?url=<encoded shareUrl>`.
  - **x** (`share_x`): open `https://twitter.com/intent/tweet?url=<encoded shareUrl>&text=<title>`.
  - On mobile, copy may defer to `navigator.share` with the `share_cp` URL.
- Each action fires `posthog.capture('egress_share', { channel, path, surface })` where
  `path = typeof window !== 'undefined' ? window.location.pathname : undefined`
  (SSR-safe pattern from `NavbarCoffee`).
- Optional sibling `src/components/ShareButton/styles.module.css` for the flex row.

### 2. Mount in the doc title — swizzle `@theme/DocItem/Content`
New file `src/theme/DocItem/Content/index.tsx`. Re-implement the tiny upstream component
(from `@docusaurus/theme-classic/.../DocItem/Content`), wrapping the synthetic `<Heading
as="h1">` in a flex row with `<ShareButton surface="doc-title" />`. Use the `useDoc()`
hook for metadata. **Preserve the exact `<Heading as="h1">` element** so the TOC/anchor
is unaffected.

### 3. Mount in the blog title — swizzle `@theme/BlogPostItem/Header/Title`
New file `src/theme/BlogPostItem/Header/Title/index.tsx`. Re-implement upstream Title,
wrapping `<TitleHeading>` in a flex row; render `<ShareButton surface="blog-title" />`
**only when `isBlogPostPage`** (so it shows on the post page, not in the blog list).
Use `useBlogPost()`; keep the `isBlogPostPage ? 'h1' : 'h2'` logic and `styles.title`.

### 4. Ingress reader + egress listeners — edit `src/posthog.js`
Inside the existing `if (posthogKey) { … }` block:
- **Ingress:** a `captureIngress()` that reads `im` from `new URL(location.href)`. If
  present → `posthog.capture('ingress', { marker, path, referrer: document.referrer || null })`
  then `history.replaceState(null, '', pathname + cleanedSearch + hash)` to strip `im`.
  Else if `!document.referrer` and `performance.getEntriesByType('navigation')[0]?.type === 'navigate'`
  → `posthog.capture('ingress', { marker: 'direct_or_bookmark', path })`.
  Call it on initial load (in `loaded`, after the first `$pageview`) and inside the
  existing `onRouteChange()` (which already fires on SPA nav — reuse it; do not add a
  second history patch).
- **Bookmark intent:** `keydown` listener → on ⌘D/Ctrl+D, `posthog.capture('bookmark_intent', { path })`.
  **No `preventDefault`, no URL mutation.**
- **Generic copy:** `copy` listener → `posthog.capture('egress_copy', { path, hasSelection })`.
  Payload untouched.

> Note: `posthog.js` already wraps `history.pushState/replaceState` for route detection.
> The ingress strip calls `replaceState`, which will re-enter `onRouteChange`; guard so
> stripping `im` doesn't double-fire a `$pageview` (the existing `last`-href compare
> mostly handles this since pathname is unchanged — verify, and compare on pathname if
> needed).

### 5. Docs to update (same change)
- `src/ingress-attribution-plan.md` → flip status design → shipped; finalize event tables.
- `src/posthog-integration-plan.md` → add `egress_share` / `egress_copy` /
  `bookmark_intent` / `ingress` to the bespoke-events table.

## Files

| File | Action |
|---|---|
| `src/components/ShareButton/index.tsx` (+ `styles.module.css`) | new — the control + 4 channels |
| `src/theme/DocItem/Content/index.tsx` | new swizzle — mount at doc H1 |
| `src/theme/BlogPostItem/Header/Title/index.tsx` | new swizzle — mount at blog H1 |
| `src/posthog.js` | edit — ingress reader + bookmark_intent + egress_copy |
| `src/ingress-attribution-plan.md` | edit — status + final schema |
| `src/posthog-integration-plan.md` | edit — event table |
| `test/e2e/ingress-attribution.spec.ts` | **new** — full e2e (see below) |

**Reuse, don't reinvent:** clipboard+fallback from `Graph/useGraphInteractions.ts`;
posthog idiom from `SupportButton`/`NavbarCoffee`; swizzle style from existing
`src/theme/*` overrides. No toast library.

## Structure-check obligation (per CLAUDE.md)
This adds analytics surfaces, not doc-structure rules, so the doc structure validators
are unaffected. Do update the two living analytics docs (above) in the same change so
they don't drift.

## Verification

1. **Build (PostHog needs key + test mode for e2e):**
   `cd bytesofpurpose-blog && POSTHOG_TEST_MODE=1 yarn build && yarn serve` (or
   `make test-posthog`). Build-time transforms require the prod build, not `yarn start`.
2. **Manual smoke (Network → filter `us.i.posthog.com`):**
   - Share control visible inline next to a doc H1 and a blog-post H1; absent in blog list.
   - Click copy → clipboard holds `…?im=share_cp`, "Copied!" feedback, `egress_share` POST.
   - Email/LinkedIn/X open correct intent URLs with `im=share_em|li|x`; each POSTs `egress_share`.
   - Visit `…/somepage?im=share_cp` → `ingress` POST with `marker=share_cp`; URL bar
     shows `im` **stripped** afterward; no duplicate `$pageview`.
   - ⌘D on a page → `bookmark_intent` POST; native bookmark dialog still works (not blocked).
3. **e2e — new `test/e2e/ingress-attribution.spec.ts`** (full scope, decided). Today the
   suite has **zero** coverage of key interception / URL tagging (only `posthog-events.spec.ts`
   covers generic `$pageview`/autocapture/scroll). Build a dedicated spec on the existing
   3-project model + `POSTHOG_TEST_MODE=1` (beats PostHog's bot/UA filter; reuse the
   `INGEST`/`ASSETS` request matchers from `posthog-events.spec.ts`):

   | Test | Assertion | Confidence |
   |---|---|---|
   | Share control renders in doc H1 + blog-post H1, absent in blog list | DOM presence/absence | solid |
   | Click copy channel | `egress_share` POST w/ `channel:'share_cp'` | solid |
   | Email / LinkedIn / X channels | each POSTs `egress_share` w/ right `channel` | solid |
   | Land on `?im=share_cp` | `ingress` POST `marker:'share_cp'` **and** `location.search` has `im` stripped, no dup `$pageview` | solid |
   | `page.keyboard.press('Meta+KeyD')` / `Control+KeyD` | `bookmark_intent` POST fires | **edge — asserts event only, NOT that the native bookmark dialog opened (Playwright can't see browser chrome)** |
   | Copy-link writes tagged URL to clipboard | grant `clipboard-read` in context, read it back = `…?im=share_cp` | **edge — needs permission grant; fiddly** |
   | In-page generic copy | `egress_copy` POST, clipboard payload unchanged | **edge — synthetic `copy` event, not a true OS ⌘C** |

   Caveats above are documented in the spec header so the partial assertions aren't mistaken
   for full OS-level coverage. Then `make test-regression` for a11y/SEO + dev-surface-absence
   gates.
4. **Readback (lagged):** `manage-cloudflare-access/posthog_stats.py daily --days 1`.

## Open questions (carried; not blockers to approve the plan)
1. Strip `im` on arrival (planned default) vs. keep it visible.
2. Set `im` as a session super-property (attribute all session events) vs. landing
   `ingress` only.
3. Title affordance: always-visible icon row vs. single icon → menu of 4.
