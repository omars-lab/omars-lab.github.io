---
name: validate-links
description: Lint markdown/MDX source for link hygiene — bare inline URLs, overly long or tracking-laden URLs (e.g. Google search cruft), raw-URL-as-link-text, non-descriptive anchor text, plus internal-link integrity (broken /docs links + published-page→draft-page links). Use before deploy or when cleaning up links in posts/docs. Source-level complement to Docusaurus onBrokenLinks (build-time) and the SEO e2e link-text check (rendered page).
---

# Validate links in Bytes of Purpose content

Static link-hygiene check over the markdown/MDX **source** (`docs/`, `blog/`,
`changelog/`) so ugly or low-quality links never ship. Pairs with
`author-post` (authoring guardrails) and `deploy-site` (ship).

## When to use

- Before deploying, after editing posts/docs that contain links.
- When cleaning up a page full of pasted URLs (the motivating case: a giant
  Google search URL with `sca_esv`/`ei`/`ved`/`gs_lp` tracking params).
- As a recurring hygiene sweep over `docs/` (where the backlog lives).

## How to run

```bash
make validate-links                       # scan docs/ blog/ changelog/
make validate-links DIRS=docs/2-definitions   # scan a subtree
# or directly:
( cd bytesofpurpose-blog && node scripts/validate-links.js [paths…] [--json] )
```

Exit code is `1` when problems are found (CI-friendly). `--json` emits a
machine-readable array; the `--json` count is authoritative (plain output prints
two lines per problem, so don't count its lines).

## What it flags

| Kind | Meaning | Fix |
|---|---|---|
| `bare-url` | a naked `http(s)://` URL inline, not in `[text](url)` | wrap in a descriptive markdown link |
| `long-url` | link URL > 120 chars or carrying tracking params | shorten the URL + give it descriptive text |
| `url-as-text` | `[text](url)` where the visible **text** is a raw URL | replace text with a human-readable label |
| `generic-text` | non-descriptive text ("click here", "here", "read more", …) | describe the destination (Lighthouse link-text rule) |
| `broken-internal` | a `/docs/…` link that resolves to **no published doc slug** | fix the path, or point at an existing absolute slug |
| `link-to-draft` | a **published** page links to a `draft: true` page (excluded from the prod build → a build-time broken link) | un-draft the target first, or remove/defer the link |
| `test-stale-slug` | a `test/e2e/` file (`goto('/docs/…')`, or the README) references a `/docs/<slug>` that resolves to no doc | point the test at the new slug — a redirect keeps users working but lands the test on the redirect **stub** (no content) → spurious timeout |

It skips: YAML frontmatter, fenced/inline code (so example URLs aren't flagged),
**commented-out content** (HTML `<!-- … -->` and JSX/MDX brace-star comments,
incl. multi-line — a commented link ships as nothing, so it's intentionally
deferred and must not trip any check), and external/relative non-`/docs` links
beyond the two integrity checks below. (Masking lives in `maskCode` +
`maskComments`; both the scan and `--fix` paths apply them.)

### Internal-link integrity (the `broken-internal` / `link-to-draft` checks)

These two are **cross-file**: the script builds a whole-corpus **slug index**
(every doc's absolute `slug:` + its `draft:` flag) and resolves each `/docs/…`
link against it. The docs plugin has no `routeBasePath` override, so a doc with
`slug: /X` is served at `/docs/X` — that's the mapping used to resolve links.

- **`broken-internal`** is a fast, source-level version of Docusaurus
  `onBrokenLinks`: it flags a `/docs/…` link with no matching published slug
  *at authoring time* (in the Write/Edit hook), not only at build time.
- **`link-to-draft`** encodes a deliberate policy: a **draft→draft** link is
  *allowed* (both pages ship together later), but a **published→draft** link is
  flagged — because drafts are excluded from the prod build, so the live page
  would ship a broken link. The check reads the **source** page's `draft:` flag
  to decide, and only fires when the source is published.

Both are **warn-tier** (advisory, never block a commit) — a draft may
intentionally forward-link to a not-yet-published page. (Policy decided
2026-06-01; surfaced by the LQ2 folder-split, where a published README carried a
link to a `draft: true` page.) Per the repo's "structure decisions must update
the structure checks" convention, this skill + `scripts/validate-links.js` are
kept in lockstep — change one, change the other.

### Test-slug integrity (the `test-stale-slug` check)

e2e specs **hardcode doc slugs** in `goto('/docs/…')` / `baseURL` refs. When an IA
move changes a slug, the redirect plugin keeps *real users* working — but a test
that navigates to the **old** slug lands on the redirect **stub** (a meta-refresh
page with no canvas/content), so it times out waiting for an element. The failure
looks like a flaky/broken component, miles from the real cause. (Surfaced 2026-06-02
by the mental-models namespace migration: `graph-selection-state.spec.ts` hardcoded
`/docs/mental-models/.../ai-framework-landscape`; the move turned that into a
redirect → 6 specs timed out on `canvas`.)

The check scans `test/e2e/*.spec.ts` + the test README, extracts each `/docs/<slug>`
appearing **inside a quote or backtick** (so prose like "home/blog/docs/post" isn't
matched), and resolves it against the same slug index. It runs **only on a full
default scan** (not when you pass explicit paths), so the Write/Edit hook stays
scoped. **Lesson it encodes: when you move a slug, grep `test/` too — not just
`docs/ blog/ src/`.**

**Escape hatch:** a test that *deliberately* navigates to a missing/draft route
(e.g. asserting a 404) opts out with a `validate-links-ignore` comment on the line
or the line above. Use it only for intentional dead-route assertions — a genuine
stale slug should be **fixed**, not ignored.

## The URL-cleanup recipe (for `bare-url` / `long-url`)

A search/tracking URL is `https://host/path?q=<terms>` followed by junk.
**Everything after the first meaningful param is droppable.**

1. Keep the path + the one "content" param: `q=` (search), `v=` (YouTube),
   `p=` (Yahoo), `id=`. Drop `utm_*`, `gclid`, `fbclid`, and Google's
   `sca_esv`/`ei`/`ved`/`uact`/`oq`/`gs_lp`/`sclient`/`sxsrf`/`client`/`channel`/`num`.
2. Label the link with the search phrase or page title (decode `+` → space).

The script prints a `suggest:` line with a cleaned URL to copy. Example:

```md
<!-- before: a 600-char pasted Google URL -->
* [Google: "does one plan priorities or manage them"](https://www.google.com/search?q=does+one+plan+priorities+or+manage+them)
```

> Note: a long URL with a `#:~:text=` text-fragment anchor (a deep highlight
> link) trips `long-url` legitimately — that's a real link, not tracking. Judge
> case-by-case; the check is advisory for `long-url`, not a hard error to scrub.

## How this relates to the other checks

- **`onBrokenLinks` (Docusaurus build)** — catches *broken internal/relative*
  links at build time. This script deliberately ignores relative links to avoid
  overlap; it only inspects external `http(s)` links + link text.
- **`test/e2e/seo.spec.ts` (`make test-seo`)** — catches generic link text on the
  *rendered* page (Lighthouse `link-text` rule). This script catches the same
  problem in the *source*, earlier, plus bare/long URLs the SEO spec can't see.

## Current baseline (as of this skill's creation)

`blog/` (the public posts) is clean. The backlog (~200+ bare URLs) is in
`docs/4-development/`. Treat `docs/` and `blog/` as the high-value targets;
`changelog/` reference-link sections are often intentional citations.

## Fixing in bulk (`--fix`)

`--fix` rewrites bare URLs (and `[url](url)` link text, and MDX-unsafe `<url>`
autolinks) into `[label](url)` using **tiered labeling**:

- **Tier 0** *(opt-in `--titles`)* — fetch the page `<title>` (5s timeout;
  dead/404 links fall through). Network, non-deterministic; off by default.
- **Tier 1** — known host → friendly name + last path segment
  (`github.com/ClearURLs/Addon` → `[GitHub — ClearURLs/Addon]`). Extend
  `KNOWN_HOSTS` in the script.
- **Tier 2** — generic `host — Last-Segment` (`mdxjs.com/docs/getting-started`
  → `[mdxjs.com — Getting Started]`).
- **Tier 3** — host only (when no readable segment). Always a real
  `[host](url)` link — never a bare `<url>` autolink, which **breaks the
  Docusaurus MDX build** (`<https://…>` is parsed as a JSX tag).

```bash
( cd bytesofpurpose-blog && node scripts/validate-links.js --fix docs/4-development )
( cd bytesofpurpose-blog && node scripts/validate-links.js --fix --titles path/to/post.md )
```

The fix preserves the original URL (params and all); only the `suggest:` output
in scan mode proposes a cleaned URL. Always re-run `make check` after a bulk fix.

## Claude Code hook (auto-guard on edit)

A PostToolUse hook blocks new ERROR-tier links the moment a `.md`/`.mdx` file is
edited or written:

- **Hook script:** `.claude/hooks/validate-links-hook.sh`
- **Registered in:** `.claude/settings.json` → `hooks.PostToolUse` (matcher `Write|Edit`)
- **Behavior:** runs `validate-links <file> --error-only`; **exit 2** (blocks +
  feeds stderr to Claude with the `--fix` command) when an ERROR-tier finding is
  present; silent otherwise. WARN-tier never blocks — catch those with the full
  `make validate-links`.
- **Tests:** `bytesofpurpose-blog/test/integration/validate-links-hook.test.sh`
  (run via `make test-link-hook`).

## Tuning

Knobs live at the top of `scripts/validate-links.js`:
`LONG_URL_THRESHOLD`, `TRACKING_PARAMS`, `GENERIC_LINK_TEXT`. Add a new tracking
param or generic phrase there when you hit one in the wild.
