---
name: publish-site
description: Publish the Bytes of Purpose blog — first triage which draft:true posts/docs have meaningful, finished content ready to come out of draft (vs stubs), let the user choose, flip draft:false on the approved ones, then run the deploy-site flow (secret-scan → build → gh-pages → verify). Use when the user wants to publish, ship drafts, or "put posts live".
---

# Publish the site (with draft-readiness triage)

Wraps the **deploy** with an editorial step: surface drafts that are actually ready,
publish the ones the user approves, then deploy. Pairs with `deploy-site` (the mechanical
deploy), `author-post` (frontmatter/MDX), `validate-deployment` (post-deploy checks).

## Draft convention (single source of truth: the `draft:` field)

- **Every doc/post declares `draft:` explicitly** — `draft: true` (work in progress,
  excluded from the production build) or `draft: false` (ready to ship). A **missing**
  `draft:` field silently defaults to PUBLISHED, which is how unfinished stubs leak out.
- `draft: true` is the **single source of truth** — don't duplicate it into a second
  field (e.g. `sidebar_custom_props.draft`); tooling reads `draft:` directly.
- **Tooling that relies on this convention:**
  - `draft_readiness.py` (below) triages `draft: true` files into ready/review/stub.
  - The dev-only **draft-aware sidebar** badges draft docs on localhost
    (`plugins/draft-docs` + the `DocSidebarItem` swizzle; design:
    `designs/design-draft-aware-sidebar`).
  - A **warn-only Claude hook** (`.claude/hooks/validate-draft-hook.sh`, wired in
    `.claude/settings.json` as a `Write|Edit` PostToolUse) flags any blog `.md`/`.mdx`
    whose frontmatter omits `draft:`. It advises only — never blocks — since some index
    pages are legitimately always-published.

## ▶️ FIRST STEP — create the tracking tasks

```tasks
- [ ] Scan drafts for readiness (draft_readiness.py); present ready/review/stub buckets.
- [ ] User selects which drafts to publish (don't auto-publish — it's an editorial call).
- [ ] Flip draft:false on approved files; spot-check each renders (no MDX breakers).
- [ ] Deploy via deploy-site flow (secret-scan → prod build → gh-pages).
- [ ] Verify live (validate-deployment): 200/public, PostHog beacon, new pages reachable.
```

## Step 1 — Triage drafts (suggest what's ready)

```bash
python3 .claude/skills/publish-site/draft_readiness.py            # blog + docs
python3 .claude/skills/publish-site/draft_readiness.py --area blog
python3 .claude/skills/publish-site/draft_readiness.py --json     # for programmatic use
```

It scores each `draft: true` file on content signals — word count, `##` section count,
`<!-- truncate -->` excerpt marker, frontmatter completeness — and **penalizes** stub
markers (TODO/FIXME/WIP/placeholder/lorem) and tiny files. Output buckets:

- **✅ ready** (score ≥ 6) — substantial + structured; good un-draft candidates.
- **🟡 review** (3–5) — close; skim for polish/TODOs before publishing.
- **⬜ stub** (< 3) — thin/index/placeholder; skip.

It **flips nothing** — it's triage. Present the ready list (and notable review items) to
the user and let *them* choose. Readiness ≠ intent: a finished post may be deliberately
unpublished. Never auto-publish.

## Step 2 — Publish the approved drafts

For each file the user approves, set `draft: false` (or remove the `draft:` line) in the
frontmatter. Then spot-check it builds — drafts often harbor the MDX build-breakers from
`author-post` (bare `<br>` → `<br/>`, unescaped `{word}` → backticks) because they
were never built before. A quick `( cd bytesofpurpose-blog && yarn build )` catches these
before deploy.

> Blog vs docs: in a production build Docusaurus excludes `draft: true` from routes &
> sitemap (verified — a draft doc 404s live). So un-drafting is what makes a page public.

> **⚠️ Publish the whole link CLUSTER, not one post in isolation.** If a post you publish
> links to ANOTHER draft (e.g. a `/initiatives` design-story post links its `/designs` HLD, or
> any post links a sibling that's still `draft: true`), the link 404s in production because
> the target is excluded from the prod build. The **prod build is what catches this**: a
> bare `yarn build` (or `make build-premium`) prints `Broken link on source page path = …
> -> linking to /<target>`. So after un-drafting, ALWAYS run a full prod build and grep for
> `Broken link`; if a published post points at a draft, **un-draft the linked target too**
> (publish the cluster together) — or, if the target isn't ready, soften/remove the link.
> This bit the 2026-06 design-showcase publish: the 4 design-story posts shipped pointing at
> draft HLDs; the fix was to publish the 5 linked `/designs` docs in the same pass. (Broken
> ANCHORS, `-> linking to #section`, are warn-tier by site policy — `onBrokenAnchors: 'warn'`
> in `docusaurus.config.js` — so they don't fail the build, but they're worth fixing in
> freshly-published content: match the link's `#anchor` to the target heading's real
> github-slugger id, e.g. a `### 13.3 Open Questions` heading is `#133-open-questions`,
> and a heading with a dropped `&`/emoji between spaces yields a double hyphen `--`.)

## Step 3 — Deploy

Hand off to the **deploy-site** skill (or inline):
```bash
unset POSTHOG_TEST_MODE                      # NEVER ship test mode (disables bot filter)
extract() { grep -E "^$1=" .env | head -1 | cut -d= -f2- | sed 's/[[:space:]]*#.*//' | tr -d ' "'\'''; }
export POSTHOG_KEY=$(extract POSTHOG_KEY); export POSTHOG_HOST=$(extract POSTHOG_HOST)
make deploy                                   # secret-scan → yarn deploy → gh-pages (force-push, normal)
```
`make deploy` force-pushes `gh-pages` — that's expected (it's a generated branch). The
secret-scan gate runs first; a leak aborts the deploy.

## Step 4 — Verify live

Use `validate-deployment`, or inline confirm the newly-published pages are reachable:
```bash
curl -sS -I https://blog.bytesofpurpose.com | grep -iE '^HTTP|www-authenticate'   # 200, no Access
curl -s -o /dev/null -w "%{http_code}\n" https://blog.bytesofpurpose.com/<new-page-slug>
```
PostHog beacon lives in the JS bundle (not inline HTML) — check
`/assets/js/main.*.js` for `phc_`, not the page source.

## Troubleshooting
| Symptom | Cause | Fix |
|---|---|---|
| Un-drafted page still 404s live | Deploy didn't run / propagation lag | Re-run `make deploy`; GH Pages takes 1–2 min. |
| Build fails right after un-drafting | Draft had MDX breakers never built before | Fix per `author-post` (`<br/>`, backtick `{braces}`); rebuild. |
| `Broken link … -> linking to /<x>` after un-drafting | A published post links a still-`draft:true` target (excluded from prod) | Publish the whole cluster: un-draft the linked target too (or soften the link). |
| `Module not found: @generated/…craft-tags-*.json` during the deploy build | Stale `.docusaurus` route cache | `rm -rf bytesofpurpose-blog/{.docusaurus,node_modules/.cache,build}` then rebuild (see `deploy-site`). |
| `make deploy` aborts on secret-scan | A real or historical leak | See `manage-repo-security` / the leaked-creds memory; don't bypass. |
| Scorer lists a finished post as "review" | Short but complete (e.g. a tight how-to) | Score is a hint, not a gate — publish if you judge it ready. |
