---
name: serve-locally
description: Run the Bytes of Purpose blog locally for development/preview — the dev server (`make start`, :3000, drafts visible), prod-parity preview (`make serve`, the built site, drafts excluded), and the #1 gotcha (a long-running dev server has a STALE route table, so newly added/moved/merged routes 404 until you restart). Use when asked to "deploy/run/serve/preview the blog locally", run the dev server, or when a local page 404s after an edit/merge.
---

# Serve the Bytes of Purpose blog locally

"Deploy the blog locally" = run it on your machine, NOT ship to production. For
production deploy (gh-pages) see `deploy-site`; for post-deploy live checks see
`validate-deployment`.

## The three local modes

| Command | What it runs | Port | Drafts? | Use it to… |
|---|---|---|---|---|
| `make start` | Dev server (`docusaurus start`, HMR) | 3000 | **Visible** (dev-only) | Author/preview content, incl. `draft: true` pages |
| `make start-prod` | Dev server, `NODE_ENV=production` | 3000 | Visible | Catch prod-mode-only dev issues |
| `make serve` | Serves the **built** static site (`build` first) | 3000 | **Excluded** | Verify the REAL prod build (drafts/transforms as shipped) |

- Override the port: `make start PORT=8080`.
- `make start` builds Storybook first (so `/storybook/` works) and runs the `prestart`
  hook (regenerates changelog/ideas/logo data) — so the first boot takes a minute or two.
- **`make start` ALSO rebuilds `@omars-lab/blog-ui` first** (the `build-blog-ui` prereq). The blog
  consumes the package's BUILT `dist/`, which is gitignored — so a fresh clone, or editing a
  blog-ui component (`<Quote>`, `<Question>`, `<Walkthrough>`, …) without rebuilding, would render a
  STALE component with no warning. `start` / `start-prod` / `build` / `deploy` all depend on
  `build-blog-ui` so this can't happen by omission (fail-closed). If you change a blog-ui component
  mid-session (the dev server is already up), run `make build-blog-ui` and the HMR picks up the new
  `dist/`; you don't need a full restart for that (a restart is only for the stale-route-table
  gotcha below).
- **Drafts render ONLY on the dev server** (`make start` / `make start-prod`), with a
  "DRAFT PAGE" banner and a `D` sidebar badge. They are excluded from `make build`/
  `make serve` and from production. So if you're previewing a `draft: true` page, you MUST
  use `make start` — `make serve` (or curl-ing the prod build) will 404 it correctly.

## 🔴 Gotcha #1 — stale route table → phantom 404 (this is why the skill exists)

A **long-running dev server has an in-memory route table from when it booted.** When you
add a new doc, change a `slug:`, move a file, or pull/merge a branch that did any of
those, the running server **does not pick up the new route** — the page renders as a
404 / "Page Not Found" even though the file exists and `.docusaurus/routes.js` lists it.

**Fix: restart the dev server.** Kill it and re-run `make start`:

```bash
pkill -f "docusaurus start --port 3000"   # or kill the specific PID
make start                                 # fresh route table; new/moved routes resolve
```

After restart, the dev server compiles a route **on first request** (lazy), so the very
first hit to a page can take a few seconds before content appears — that's normal, not a
failure.

## 🔴 Gotcha #2 — `curl` gives a FALSE 200 / can't see content; verify in the BROWSER

The Docusaurus **dev server always returns HTTP 200** with a generic SPA shell
(`<title>Bytes of Purpose</title>`), then renders the real page **client-side via JS**.
So:

- `curl -o /dev/null -w "%{http_code}"` returns **200 even for a missing/stale route** —
  it is NOT a validity check on the dev server.
- `curl ... | grep "<your heading>"` returns **nothing even for a working page**, because
  the body is JS-rendered, not in the raw HTML.

To confirm a dev page actually renders, **open it in the browser** (or use the
`claude-in-chrome` tools to screenshot it). The real signals are the tab title becoming
`<Page Title> | Bytes of Purpose` and the content being on screen. The prod build
(`make serve`) DOES server-render content into the HTML, so curl/grep works there — but
that build has no drafts.

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| New/moved/merged page 404s locally, but the `.mdx` exists | Stale dev-server route table (Gotcha #1) | Restart `make start` |
| `draft: true` page 404s | You're on `make serve`/prod build (drafts excluded) | Use `make start` to preview drafts |
| `curl` says 200 but browser shows 404 | Dev server returns SPA shell at 200 (Gotcha #2) | Trust the browser, not curl |
| First hit to a page hangs a few seconds | Dev compiles the route lazily on first request | Wait; it caches after |
| Weird stale render after a big change | Webpack/`.docusaurus` cache | `make clear`, then `make start` |
| Storybook missing at `/storybook/` | Started without the Storybook prebuild | `make start` (it builds Storybook first) |

## Related

- `deploy-site` — ship to production (gh-pages); the REAL deploy.
- `validate-deployment` — verify the LIVE site after a prod deploy.
- `author-post` — MDX pitfalls; `make check` (MDX lint) and `yarn build` as the
  pre-deploy gate.
