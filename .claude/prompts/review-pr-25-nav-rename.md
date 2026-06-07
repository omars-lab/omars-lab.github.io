# Review prompt — PR #25 (nav rename + route migration)

Paste the block below into a **clean Claude Code session** (run from the repo root,
`/Users/omareid/Workspace/git/projects/omars-lab.github.io`). It is self-contained:
it tells the reviewer what changed, what to scrutinize, how to prove it, and how to
finish (fix issues, then merge with the user's go-ahead).

---

You are reviewing **PR #25** on `omars-lab/omars-lab.github.io` (branch
`feat/nav-rename-routes`, base `master`) with **fresh eyes**. This is a large,
**SEO-sensitive route migration**, so be skeptical and verify claims yourself rather
than trusting the PR body.

## What the PR does
- Navbar relabel: **Self→Journey**, **Blog→Thoughts**, **System Designs→Designs**, and a
  new **Mindset** nav item (after Thoughts).
- Real route renames: `docs/self/` → `docs/journey/` (`git mv`), `routeBasePath`
  `self→journey`; preset blog `routeBasePath` `'/'→'thoughts'` (so `/blog/*`→`/thoughts/*`).
- Theming: 🪞 mirror → 🛣️ road emoji wherever Journey appears.
- Redirects: a `createRedirects(existingPath)` in `docusaurus.config.js` emits
  `/self/*→/journey/*` and `/blog/*→/thoughts/*`; existing static redirect **targets**
  that pointed at `/self/*` were repointed to `/journey/*`.
- Lockstep: draft-docs plugin comment, the `welcome-drift` structure validator,
  `CLAUDE.md` instance docs, plus inbound `/self` and `/blog` links in docs + e2e specs.

## Read these first
- `gh pr view 25 --json title,body,additions,deletions,files` and `gh pr diff 25`
- `bytesofpurpose-blog/docusaurus.config.js` — the `self` docs instance (now path
  `docs/journey`, route `journey`), the preset `blog.routeBasePath: 'thoughts'`, and the
  client-redirects block (static array + the `createRedirects` function at the end).
- `bytesofpurpose-blog/plugins/draft-docs/index.js` — it derives a doc's permalink from
  the **folder name** (`segs[0]`), so the folder rename and route must stay in lockstep.

## What to scrutinize (likely failure modes)
1. **Redirect coverage / correctness.** Does EVERY old URL 301 to the right new URL?
   - `createRedirects` direction: it returns the OLD path(s) for a given new `existingPath`.
     Confirm `/journey/x` yields a redirect from `/self/x`, and `/thoughts/x` from `/blog/x`.
   - Any **static** redirect whose `to:` still points at a now-dead `/self/*` or `/blog/*`?
     (That fails the build with "redirections to invalid paths".) Grep for `to: "/self`
     and `to: "/blog`.
   - The existing `{from:"/blog/docs-vs-blog-posts", to:"/craft/..."}` must NOT collide
     with the new `/blog/*→/thoughts/*` wildcard. Confirm no double-redirect or conflict.
2. **Broken links.** Any remaining internal link to `/self/…` or `/blog/…` (that isn't an
   external `*.com/blog/…` URL or a literal `blog/` *folder* reference in prompt docs)?
   The build is the source of truth — a real broken internal link should surface there.
3. **Folder/route lockstep.** Folder is `docs/journey/`, `path: 'docs/journey'`,
   `routeBasePath: 'journey'`, plugin `id` still `'self'`. Confirm draft permalinks resolve
   under `/journey` (not `/self`).
4. **Theming completeness.** Any stray 🪞 left where Journey is meant (homepage card,
   craft cross-link, journey README title/H1, `_category_.json` label, sidebar)? Any
   user-facing "Self" copy that should read "Journey" (e.g. headings)? (Tags like
   `[self, overview]` and the word "myself" are fine.)
5. **Validators in lockstep.** `welcome-drift` checks the homepage links to `/craft` AND
   `/journey` now. `CLAUDE.md` describes `docs/journey` + `/journey`. Anything else still
   asserting `/self`?
6. **em-dash rule.** New reader-facing content (the roadmap item, journey README) must have
   no literal `—`.

## Prove it (don't assert)
Build the real prod bundle and exercise the routes — this is the repo tenet
(never assert; prove with a runnable check + evidence):

```bash
# 1) Build (premium doc exists → encrypted build + V5 gate). Extract env per-var,
#    NEVER `source .env` (it blanks vars after a shell-special line).
xenv() { grep -E "^$1=" .env | head -1 | cut -d= -f2- | sed 's/[[:space:]]*#.*//' | tr -d ' "'\'''; }
export STATICRYPT_PASSPHRASE="$(xenv STATICRYPT_PASSPHRASE)" POSTHOG_KEY="$(xenv POSTHOG_KEY)" POSTHOG_HOST="$(xenv POSTHOG_HOST)"
make build-premium 2>&1 | grep -iE "broken|invalid|error|success|verify-premium"
#    → expect NO "broken link"/"invalid paths" from the migration (a pre-existing
#      premium-gating-demo#the-gated-body anchor warning is OK), and the V5 line to pass.

# 2) Serve and check routes (docusaurus serve defaults to :3000 → pass --port 4173).
( cd bytesofpurpose-blog && yarn serve --port 4173 --no-open ) &
until curl -s -o /dev/null http://localhost:4173/journey; do sleep 1; done
for p in /journey /journey/personal-growth /thoughts /thoughts/evolution-of-a-repo /mindset /designs; do
  echo "$p -> $(curl -s -o /dev/null -w '%{http_code}' http://localhost:4173$p)"   # expect 200
done
for p in /self /self/personal-growth /blog /blog/evolution-of-a-repo; do
  echo "$p -> $(curl -s -o /dev/null -w '%{http_code}' http://localhost:4173$p/)"  # expect 301
done

# 3) Validators
( cd bytesofpurpose-blog && node scripts/validate-em-dash.js )
( cd bytesofpurpose-blog && node scripts/validate-docs-structure.js )
( cd bytesofpurpose-blog && node scripts/validate-links.js | tail -5 )
```

Optionally screenshot the navbar at :4173 to confirm the order reads
**Craft · Journey · Thoughts · Mindset · Designs · Vote · Support** and the 🛣️ emoji shows.

Kill the :4173 server when done (`lsof -ti:4173 | xargs kill`).

## Finish
- If you find issues, **fix them on `feat/nav-rename-routes`** (commit with a clear message,
  re-run the proof above), and note what you changed.
- If clean (or once fixed), **summarize the review** (what you verified + evidence) and
  **ask the user to confirm the merge**. On their go-ahead:
  `gh pr merge 25 --squash --delete-branch`, then sync master
  (`git checkout master && git pull --ff-only`).
- Do NOT self-merge without the user's explicit OK (repo convention: merging is the
  user's call).
- After merging, remind the user the change is on master but **not deployed** — the live
  site still serves the old URLs until a deploy. Offer to deploy.
