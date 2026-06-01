---
name: validate-links
description: Lint markdown/MDX source for link hygiene — bare inline URLs, overly long or tracking-laden URLs (e.g. Google search cruft), raw-URL-as-link-text, and non-descriptive anchor text. Use before deploy or when cleaning up links in posts/docs. Source-level complement to Docusaurus onBrokenLinks (build-time) and the SEO e2e link-text check (rendered page).
---

# Validate links in Bytes of Purpose content

Static link-hygiene check over the markdown/MDX **source** (`docs/`, `blog/`,
`changelog/`) so ugly or low-quality links never ship. Pairs with
`author-blog-post` (authoring guardrails) and `deploy-site` (ship).

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

It skips: YAML frontmatter, fenced/inline code (so example URLs aren't flagged),
and relative/internal links (those are `onBrokenLinks`' job — see below).

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
