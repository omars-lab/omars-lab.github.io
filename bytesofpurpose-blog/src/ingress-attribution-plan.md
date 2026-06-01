# Ingress Attribution Plan — bytesofpurpose-blog

Design for tracking **how a URL left our site and how it came back** — an "ingress
attribution" layer on top of the existing PostHog integration
(`./posthog-integration-plan.md`). Status: **implemented** (share controls in
doc/blog titles + ingress reader in `posthog.js` + e2e). Last updated 2026-06-01.

**Implementation map:** ShareButton → `src/components/ShareButton/` · doc-title mount →
`src/theme/DocItem/Content/index.tsx` · blog-title mount →
`src/theme/BlogPostItem/Header/Title/index.tsx` · ingress reader + bookmark/copy
listeners → `src/posthog.js` · iOS-style toast → `src/components/Toast/` (mounted in
`src/theme/Root.tsx`) · draggable bookmarklet → `src/components/BookmarkletButton/`
(MDX component, placed on `docs/welcome/README.md`) · e2e →
`test/e2e/ingress-attribution.spec.ts` (`posthog-prod`) + proof harnesses
`test/e2e/{bookmark-rewrite,bookmarklet}-proof.spec.ts` (`bookmark-proof`, env-gated).

## The idea in one line

Tag the URL at the moment it *leaves* the site (share / copy / bookmark-intent), then
read the tag when a visitor *arrives*, so we can attribute return traffic to the egress
channel that produced it.

```
        EGRESS (tag the URL)                 INGRESS (read the tag)
  ┌───────────────────────────┐        ┌──────────────────────────────┐
  │ share button → ?im=share  │        │ landing page reads ?im=…      │
  │ in-page copy → ?im=clip   │  ───▶  │ → capture `ingress` event     │
  │ bookmark ⌘D  → (event only)│        │ → strip param from URL (clean)│
  └───────────────────────────┘        └──────────────────────────────┘
```

`im` = `ingressMarker` (short param to keep shared URLs tidy).

## Feasibility tier list (what's real vs. wishful)

| Mechanism | Tag outgoing URL? | Capture event? | Notes |
|---|---|---|---|
| **Share button** (per page) | ✅ reliable | ✅ | We own the click → we mint `?im=share`. No races. **Primary mechanism.** |
| **In-page copy** (`copy` event on body/link components) | ✅ reliable | ✅ | We rewrite clipboard payload to append `?im=clipboard`. Works for text selections & our link buttons. |
| **Address-bar copy** (⌘L ⌘C, address-bar copy icon) | ❌ impossible | ❌ | Outside the page sandbox — no event, no clipboard access. **Known dead zone.** |
| **Bookmark intent** (⌘D / ⌘D) | ❌ impossible | ✅ | Browser snapshots address bar at keypress; page can't tag it (see integration-plan / decision log). Log `bookmark_intent` event only. |
| **Bookmarklet** (`javascript:` saved bookmark) | ✅ on click | ✅ | Opt-in only — page **cannot auto-install** (user drags/creates). When clicked it runs JS → can beacon + redirect with `?im=bookmarklet`. Power-user layer, not general-audience. |
| **JS-bookmark button** (`external.AddFavorite` / `sidebar.addPanel`) | ❌ removed | ❌ | Probed live: `AddFavorite` absent (dummy/no-op since IE10), `sidebar` undefined (removed Firefox 102). No cross-browser JS-bookmark API exists. |
| **Return detection (no tag)** | n/a | ✅ | Direct nav + empty `document.referrer` on a deep page ≈ bookmark/typed/returning visitor. Backstop for the untaggable cases. |

**Honest ceiling:** we can reliably tag **share** and **in-page copy**. We **cannot** tag
address-bar copies or native bookmarks — for those we fall back to (a) an explicit egress
affordance the user clicks, and (b) no-referrer return detection. Do not ship a ⌘D/⌘C
URL-rewrite race; it's Chrome-only, unspecified, and pollutes the user's address bar.

**Proven (2026-06-01, `test/e2e/*-proof.spec.ts`, real headed Chrome + on-disk bookmark
store):**
- **⌘D rewrite trick is unshippable** — `replaceState`-on-⌘D pollutes the address bar
  (asserted), and page automation can neither trigger nor read the native bookmark
  (`a bookmark was written at all? false`). The bookmark action is browser chrome,
  unreachable from page JS.
- **No JS-bookmark API exists** — `window.external.AddFavorite` / `window.sidebar.addPanel`
  probed absent in current Chrome.
- **Bookmarklet IS viable but opt-in** — `javascript:` body executes (LINK1), fires a
  beacon with the tag (LINK2), and its redirect lands `?im=bookmarklet` that the ingress
  reader strips (LINK3); address-bar `javascript:` navigation is blocked (LINK4), so only
  a *saved* bookmarklet works and the page can't auto-install it.

## Egress mechanisms (tagging the URL as it leaves)

### 1. Share control (primary) — in the page title
**Placement (decided):** a small share affordance rendered **inline in the article /
post title** — i.e. next to the H1 of each doc and blog post — *not* in the footer.
Inject via swizzled `@theme/DocItem/Content` (doc H1) and `@theme/BlogPostItem/Header/Title`
(blog H1), or by decorating the rendered `<h1>` in those components. (SupportButton's
footer injection is the wiring *pattern* to mirror, but the mount point is the title,
not the footer.)

**Channels (decided):** four destinations, each minting its own tagged URL + marker:

| Control | Marker | Outgoing URL / intent |
|---|---|---|
| Copy link | `share_cp` | `…/page?im=share_cp` → clipboard |
| Email | `share_em` | `mailto:?subject=<title>&body=<message>\n\n<…?im=share_em>` |
| LinkedIn | `share_li` | `https://www.linkedin.com/shareArticle?mini=true&url=<…?im=share_li>` |
| X / Twitter | `share_x` | `https://twitter.com/intent/tweet?url=<…?im=share_x>&text=<message>` |

**Friendly message (email body + X text):** `composeMessage(title, description)` →
*"Hey, check out this post I came across: "&lt;title&gt;". Here's what it covers:
&lt;summary&gt;."* — "Here's what it covers:" reads cleanly even for verb-first/SEO-style
descriptions; the summary line is included only when the page has a description.
Title + description come from frontmatter via the swizzle mount points (`useDoc()` /
`useBlogPost()` → passed as `title`/`description` props), falling back to the cleaned
`document.title` and `og:description` meta. LinkedIn can't take prefill text (see note
below), so it relies on OG tags; email and X get the message.

> **LinkedIn composer opens blank — that's expected, not a bug.** LinkedIn removed
> `text`/`summary` prefill params; the share dialog shows no composer text. The rich
> link preview is rendered from the target page's **Open Graph tags** (this site emits
> `og:title`/`og:description`/`og:image`/`og:url` — verified in the built HTML), attached
> when the post is composed/submitted. Use the documented `shareArticle?mini=true&url=`
> endpoint. `?im=share_li` survives because it's part of the shared URL.

```ts
function shareUrl(marker) {
  const url = new URL(window.location.href);
  url.searchParams.set('im', marker);
  return url.toString();
}

// Copy-link control
async function onCopyLink() {
  await navigator.clipboard.writeText(shareUrl('share_cp'));
  posthog.capture('egress_share', { channel: 'share_cp', path: location.pathname });
  // toast: "Link copied"
}
// Email / LinkedIn / X open their intent URLs in a new tab and capture
// egress_share with channel 'share_em' | 'share_li' | 'share_x'.
```

On mobile, the copy-link control may defer to the native Web Share sheet
(`navigator.share`) using the `share_cp` URL, still capturing `egress_share`.

### 2. In-page copy interception (secondary)
A single global `copy` listener (in `src/posthog.js`). When the user copies a
**selection that contains a link to our own page**, or copies from one of our link
components, append the marker to the clipboard text:

```ts
document.addEventListener('copy', (e) => {
  const sel = document.getSelection()?.toString() ?? '';
  posthog.capture('egress_copy', { path: location.pathname, hasSelection: !!sel });
  // Only rewrite when it's safe & sensible (e.g. a "copy link" button sets a flag);
  // do NOT silently mutate arbitrary text copies — surprising & can corrupt code blocks.
});
```

**Decision:** do *not* blanket-rewrite every copy (would corrupt code snippets, quotes,
etc.). Rewrite the clipboard **only** for explicit "copy link" affordances; for generic
copies, capture the *event* (`egress_copy`) without touching the payload.

### 3. Bookmark intent (event only)
```ts
document.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'd') {
    posthog.capture('bookmark_intent', { path: location.pathname });
    // NO preventDefault, NO URL rewrite — see integration-plan decision log.
  }
});
```

## Ingress mechanism (reading the tag on arrival)

In `src/posthog.js`, on first pageview and every SPA route change, read `im`:

```ts
function captureIngress() {
  const url = new URL(window.location.href);
  const im = url.searchParams.get('im');
  if (im) {
    posthog.capture('ingress', { marker: im, path: url.pathname, referrer: document.referrer || null });
    // Clean the URL so the marker doesn't persist / get re-shared.
    url.searchParams.delete('im');
    window.history.replaceState(null, '', url.pathname + url.search + url.hash);
  } else if (!document.referrer && performance.getEntriesByType('navigation')[0]?.type === 'navigate') {
    // Untagged direct arrival on a deep page ≈ bookmark / typed / returning.
    posthog.capture('ingress', { marker: 'direct_or_bookmark', path: url.pathname });
  }
}
```

Set `im` as a **PostHog person/super-property** on first sight so subsequent events in
the session carry the acquisition channel, if we want attribution beyond the landing hit.

## Event schema

| Event | Props (as implemented) | Fires when |
|---|---|---|
| `egress_share` | `channel`, `surface`, `path` | user clicks a share control (`surface` = `doc-title` / `blog-title`) |
| `egress_copy` | `path`, `hasSelection` | user copies anything in-page (payload untouched) |
| `bookmark_intent` | `path` | ⌘D/Ctrl+D detected |
| `ingress` | `marker`, `path`, `referrer` | arrival with `?im=…`, or untagged direct deep arrival |

Marker vocabulary: `share_cp`, `share_em`, `share_li`, `share_x` (the four share
controls), `bookmarklet` (the draggable bookmarklet's redirect), `clipboard` (in-page
copy-link rewrite), `direct_or_bookmark` (untagged direct arrival). Keep this list in
sync with the egress affordances.

## What you can answer with this

- "Which pages get **shared**, and to where" → `egress_share` by `path` + `channel`.
- "Do shared links **come back**" → funnel `egress_share` → `ingress(marker=share*)`.
- "How much return traffic is **bookmark/direct**" → `ingress(marker=direct_or_bookmark)`.
- "Do people **try to bookmark** certain pages" → `bookmark_intent` by `path` (intent
  signal even though we can't confirm the bookmark).

## Privacy / hygiene

- `im` is a non-PII channel tag; safe in URLs and PostHog. Still **stripped on arrival**
  so it never persists in the user's address bar or gets re-shared compounding.
- No clipboard mutation of arbitrary copied text (only explicit copy-link buttons).
- Reuses existing PostHog init; nothing new ships when `POSTHOG_KEY` is unset.

## Decisions & open questions

**Decided (2026-06-01):**
- **Placement:** inline in the article/post **title** (next to the H1), not the footer.
- **Channels:** copy-link (`share_cp`), email (`share_em`), LinkedIn (`share_li`),
  X (`share_x`).
- **Strip `im` on arrival:** yes (default) — `posthog.js` deletes it via `replaceState`.
- **Built (2026-06-01):** full e2e incl. edge tests (bookmark_intent, clipboard,
  egress_copy) with documented caveats.

**Decided (2026-06-01, cont.):**
- **`im` as a session super-property → NO.** Keep it landing-only: `?im` tags only the
  `ingress` event, not every session event. Rationale: cleaner data, no per-event payload
  bloat, and the `egress_share` → `ingress` funnel already answers "do shared links come
  back". (If richer cohort attribution is ever wanted, register `ingress_channel` in
  `captureIngress` — but not by default.)

**Still open:**
1. Strip `im` on arrival (recommended) vs. keep it visible in the URL?
2. Title affordance presentation: always-visible icon row vs. a single share icon that
   opens a small menu of the four channels?

## Implementation gotchas (learned while building — 2026-06-01)

- **TDZ: define `captureIngress` BEFORE `posthog.init()`.** `init()` invokes its
  `loaded` callback **synchronously** during the init call. `loaded` calls
  `captureIngress()`, so a `const captureIngress = …` declared *after* `init()` is still
  in the temporal dead zone → `ReferenceError` (silently swallowed): the landing `ingress`
  never fires and the `im` param is never stripped. Symptom: URL keeps `?im=…`.
- **Route-change detection compares PATHNAME, not full href.** The `im`-strip calls
  `replaceState` (query-only change); if `onRouteChange` compared `href` it would treat
  the strip as a new route and double-fire `$pageview`. Comparing `pathname` avoids that
  (and means a query-only marker change does not itself fire a pageview).
- **Docs are served under `/docs` prefix** (e.g. `/docs/welcome/intro`), blog posts at
  `/blog/<slug>` — relevant for e2e URLs.
- **e2e: spy on `posthog.capture`, don't sniff the wire.** PostHog batches events to
  `/i/v0/e/` with a compressed body, so substring-matching `request.postData()` is
  unreliable. The spec installs an init-script that wraps `window.posthog.capture`
  (same singleton the module imports) into `window.__captured`, and waits for the wrap
  (`__spyInstalled`) before acting. The landing-time `ingress` fires inside `loaded`
  (before any spy can wrap) — so that test asserts the **deterministic side effect**
  (param stripped) instead of racing the capture.
- **React blocks `javascript:` hrefs.** Passing a `javascript:` URL to `<a href={…}>`
  in JSX makes React 18+ replace it with `javascript:throw new Error('React has blocked
  a javascript: URL…')`. A bookmarklet href MUST therefore be assigned **imperatively
  via a ref** (`el.setAttribute('href', …)` in an effect), which is not sanitized. The
  bookmarklet beacons `bookmarklet_used` to PostHog's `/i/v0/e/` (direct POST proven to
  return `{"status":"Ok"}`; project key is public/write-only so embedding is safe) and
  redirects to the site with `?im=bookmarklet`.

## Build / verify (as built)

- Source: `src/posthog.js` (ingress reader + keydown/copy listeners) + new
  `src/components/ShareButton/` mounted via swizzled `@theme/DocItem/Content` and
  `@theme/BlogPostItem/Header/Title` (title placement, not footer).
- e2e: `test/e2e/ingress-attribution.spec.ts` in the `posthog-prod` project. Build +
  serve + run via `make test-posthog` (needs `POSTHOG_TEST_MODE=1` so the bot/UA filter
  is off). All 10 tests green; full `make test-regression` for a11y/SEO/dev-surface gates.
