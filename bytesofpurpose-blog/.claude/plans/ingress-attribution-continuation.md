# Loop-structured continuation — ingress-attribution + descriptions tooling

Verified state as of 2026-06-01, branch `feat/ingress-attribution`.

## How to run this as a loop

Invoke with `/loop` (self-paced) pointed at this file, or paste the **LOOP PROTOCOL**
section into an autonomous run. Each tick does exactly one unit of work, verifies it,
records it, and stops — re-running is safe because every tick re-reads state first.

### LOOP PROTOCOL (one unit of work per tick)

1. **Re-derive state (idempotent — never trust the previous tick's memory).**
   - `git branch --show-current` must be `feat/ingress-attribution` (if not, stop and ask).
   - Read the **Work queue** below; the queue item's "done-when" check is the source of
     truth for whether it's already complete. Run that check before doing anything — if it
     already passes, mark the item done and move to the next.
2. **Pick the lowest-numbered queue item whose done-when check fails.** That's this tick's
   unit of work. If all pass → go to **Termination**.
3. **Do the work** described in that item (and only that item).
4. **Verification gate — required before claiming progress.** Run the item's stated
   verification (build + the named e2e, or the validator). If it fails, fix within this
   tick or, if blocked, record the blocker in the queue item and stop. Never mark an item
   done on an unverified change.
5. **Record progress** in this file: tick the item's checkbox and append a one-line
   `// done <date>: <evidence>` note. This is the durable state the next tick reads.
6. **Defer-to-user gate (hard stop, do NOT do autonomously):** committing, pushing,
   opening a PR, deleting files, or anything outward-facing. When a queue item's only
   remaining step is one of these, mark it **blocked-on-user**, post a one-line summary,
   and stop the loop for that item. Reversible local work (edits, tests, builds) proceeds
   without asking.
7. **Stop this tick.** One unit of work per tick keeps each change verifiable and the loop
   re-entrant.

### Termination

Stop the loop when every Work-queue item is checked or blocked-on-user. Emit one line:
what got done, what's blocked-on-user (commit/PR), nothing else.

### Guardrails (apply every tick)

- **Tenet:** never assume a technical claim — prove it with a runnable test + console
  evidence before stating it (memory: `always-prove-and-test`). Prefer ground-truth
  proofs (real headed Chrome, on-disk state, curl to the real endpoint).
- **Isolate the feature** from the unrelated pre-existing docs reorg in the working tree
  (see "Uncommitted files"). Never fold the reorg into feature commits.
- **Keyed/test-mode builds** for any e2e (see "Verification status" for the exact command +
  the background-build-cwd trap).
- Build from the blog dir and confirm `build/docs/welcome/intro.html` exists before serving.

---

## Reference state (read-only background)

You're continuing work on **`omars-lab.github.io`** (Docusaurus 3 blog/docs →
`https://blog.bytesofpurpose.com`). The active branch is **`feat/ingress-attribution`**.
A large, proven feature is **built and green but UNCOMMITTED** in the working tree.

**Tenet established by the user — honor it:** *Never assume a technical claim; prove it
with a runnable test + console evidence before stating it.* (Saved in memory as
`always-prove-and-test`.) The user repeatedly pushed back on reasoned-but-unproven
claims. Prefer ground-truth proofs (real headed Chrome, on-disk state, curl to the real
endpoint) over page-level proxies.

### What's been built (ingress-attribution layer)

Design doc (source of truth): `bytesofpurpose-blog/src/ingress-attribution-plan.md`.
Idea: tag a URL as it leaves the site, read the tag on arrival, attribute return traffic.

- **ShareButton** (`src/components/ShareButton/`) mounted in **doc + blog titles** via
  swizzles `src/theme/DocItem/Content/index.tsx` + `src/theme/BlogPostItem/Header/Title/index.tsx`.
  Channels: copy (`share_cp`) / email (`share_em`) / LinkedIn (`share_li`,
  `shareArticle?mini=true`) / X (`share_x`). Each mints `?im=<marker>`.
- **Friendly share message** (email body + X text):
  `Hey, check out this post I came across: "<title>". Here's what it covers: <summary>.`
  Title/summary come from **frontmatter** (`title` + `description`) threaded through the
  swizzles into ShareButton props; falls back to cleaned `document.title` + `og:description`.
  LinkedIn can't take prefill text (proven) — it renders from OG tags.
- **iOS-style slide-in Toast** (`src/components/Toast/`, mounted in `src/theme/Root.tsx`),
  top-right; replaced the old inline "Copied!".
- **Ingress reader** in `src/posthog.js`: reads `?im=` on arrival, fires `ingress`
  event, strips the param. Plus `bookmark_intent` (⌘D, event-only) and `egress_copy`.
- **Draggable bookmarklet** (`src/components/BookmarkletButton/`, an MDX component placed
  on `docs/welcome/README.md`): drag installs; click → drag-instructions modal. When
  clicked from the bar it beacons `bookmarklet_used` to PostHog (`/i/v0/e/`, proven 200)
  and redirects with `?im=bookmarklet`.

### Proven (runnable tests, not assumed)

- **Bookmark tagging is impossible for the general audience** — proved 4 ways in
  `test/e2e/bookmark-rewrite-proof.spec.ts` + `bookmarklet-proof.spec.ts` (env-gated,
  `PROVE_BOOKMARK=1` / `PROVE_BOOKMARKLET=1`, project `bookmark-proof`): ⌘D-rewrite
  pollutes the address bar + native bookmark is untriggerable/unobservable from page JS;
  `window.external.AddFavorite`/`window.sidebar.addPanel` removed; bookmarklet works but
  is opt-in (page can't auto-install). Keep these specs as documentation.
- **LinkedIn empty composer is NOT our bug** — our pages emit full OG tags (verified in
  built HTML); LinkedIn just no longer prefills composer text.

### Gotchas (already handled — don't reintroduce)

- React 18 blocks `javascript:` hrefs in JSX → BookmarkletButton sets href via a ref.
- `src/posthog.js`: `captureIngress` is defined BEFORE `posthog.init()` (TDZ — `loaded`
  runs synchronously); route-change compares `pathname` not `href` (so the `im`-strip
  doesn't double-fire `$pageview`).
- e2e spies on `posthog.capture` (don't sniff the compressed wire); waits for
  `__spyInstalled` before acting; landing `ingress` asserted via the deterministic
  param-strip side effect.
- Docs are served under `/docs` (e.g. `/docs/welcome/intro`); blog at `/blog/<slug>`.

### Verification status

- **`test/e2e/ingress-attribution.spec.ts`: 13/13 GREEN** (project `posthog-prod`).
- Full `make test-regression`: 24 pass; the only 3 failures are `draft-sidebar` —
  **proven pre-existing on clean master** (verified via a clean worktree), unrelated.
- Build + e2e must run keyed + test-mode. Pattern used:
  ```
  PHKEY=$(grep -E '^POSTHOG_KEY=' .env | cut -d= -f2- | sed 's/[[:space:]]*#.*//' | tr -d ' "'\''')
  cd bytesofpurpose-blog && POSTHOG_KEY="$PHKEY" POSTHOG_TEST_MODE=1 yarn build
  (yarn serve --port 4173 --no-open &)   # NB: serve in foreground-cd'd dir; bg builds may write to wrong cwd
  PH_BASE_URL=http://localhost:4173 npx playwright test --project=posthog-prod ingress-attribution
  ```
  Watch out: background `yarn build` can write `build/` to the wrong dir — build from the
  blog dir and confirm `build/docs/welcome/intro.html` exists before serving.

### Uncommitted files (the feature)

Modified: `playwright.config.ts`, `src/posthog.js`, `src/posthog-integration-plan.md`,
`src/theme/MDXComponents.tsx`, `src/theme/Root.tsx`, `docs/welcome/README.md` (added
`<BookmarkletButton/>`).
New (untracked): `src/components/{ShareButton,Toast,BookmarkletButton}/`,
`src/theme/DocItem/Content/`, `src/theme/BlogPostItem/Header/Title/`,
`src/ingress-attribution-plan.md`, `test/e2e/{ingress-attribution,bookmark-rewrite-proof,bookmarklet-proof}.spec.ts`.
NOTE: the working tree also contains a LARGE pre-existing docs reorg (`4-blogging/`→
`blogging/` renames etc.) that is **NOT mine** — don't fold it into the feature commit;
isolate the ingress files when committing.

## Work queue (the loop consumes this top-down)

Each item: `[ ]` checkbox · **done-when** (the idempotent check the loop runs first) ·
**work** · **verify** (the gate) · **defer?** (whether it hard-stops on the user).
Append `// done <date>: <evidence>` when an item is verified complete.

- [x] **Q1 — Commit the ingress feature.**
  // done 2026-06-01: user explicitly authorized committing in logical groups (overriding
  // the defer gate) and asked to include other-session work in its own groups. Committed
  // 3 isolated groups: 3098e945 feat(ingress-attribution) — 18 files, reorg cleanly
  // excluded (verified via git show --name-only); 03817c2a refactor(docs) vocabulary→
  // terminology rename + Q2 description validator checks; 7dc31eab docs(plans) scratch
  // artifacts. Proof gate first: make test-posthog → 19/19 green (14 ingress). gitleaks
  // ran on each commit (no leaks). Working tree clean. PR is still a separate user call.
  - **done-when:** `git log --oneline -5` shows an ingress-attribution commit on
    `feat/ingress-attribution` AND `git status --porcelain` shows the ingress files no
    longer untracked/modified.
  - **work:** stage ONLY the ingress files (see "Uncommitted files"), NOT the docs-reorg.
    Write the commit; then the PR is a separate user call.
  - **verify:** `git show --stat HEAD` contains the ingress files and none of the
    `4-blogging/`→`blogging/` reorg renames.
  - **defer?:** YES — committing/pushing/PR is the defer-to-user gate. Prepare the staged
    set + draft message, then **blocked-on-user**. Do not commit autonomously.

- [x] **Q2 — Extend the structure validator with `description` checks.**
  // done 2026-06-01: added description-missing/length(~50–160)/duplicate rules to
  // validate-docs-structure.js (per-doc presence+length in checkDoc → also covers the
  // hook path; corpus-wide checkDuplicateDescriptions in the full run). Scratch-tested
  // all 3 rules fire+clear correctly; full run flags 54 length + 14 duplicate (warn-only).
  // Contract updated in lockstep: validator header rule-list, CLAUDE.md structure note,
  // review-reader-experience SKILL.md. Validator exits 1 (warns), no JS errors.
  - **done-when:** `node bytesofpurpose-blog/scripts/validate-docs-structure.js` (or
    `make validate-structure`) emits at least one `description-*` rule, and
    `grep -n "description" bytesofpurpose-blog/scripts/validate-docs-structure.js` shows the
    new checks.
  - **work:** add to `validate-docs-structure.js` (+ hook
    `.claude/hooks/validate-docs-structure-hook.sh`): presence (warn), length bounds for
    share+SEO (~50–160 chars, warn), duplicate descriptions across pages (warn). Follow the
    existing rule-tier pattern (absolute-slug=error, rest=warn). Per the CLAUDE.md operating
    convention, update the owning skill contract (`review-reader-experience` SKILL.md) + the
    CLAUDE.md structure-check note **in the same change**. (Coverage today: description
    exists on 4/4 blog + 290/290 docs — checks are quality/length/dupes, not gap-filling.)
  - **verify:** run the validator on the repo; confirm it flags a deliberately-too-long or
    duplicated description in a scratch test and is clean otherwise. Reversible — no defer.
  - **defer?:** no.

- [x] **Q3 — Build the `manage-frontmatter-descriptions` skill.**
  // done 2026-06-01: created .claude/skills/manage-frontmatter-descriptions/SKILL.md
  // (audit→preview→heal workflows, 50–160 contract synced to the validator) + a runnable
  // share-message previewer scripts/preview-share-message.js that mirrors ShareButton's
  // composeMessage/shareUrl/intent-URL logic. PROVEN: ran the preview on 3 real pages —
  // output matches ShareButton wording exactly; length verdicts agree with the validator
  // (welcome 201ch flagged over-160; the two terminology pages 116/131ch pass). Validator
  // emits 55 length + 15 duplicate + 0 missing — a real heal work-list. Frontmatter shape
  // matches sibling skills; loader picks it up next session.
  - **done-when:** `.claude/skills/manage-frontmatter-descriptions/SKILL.md` exists and is
    listed by the skills loader.
  - **work:** judgment work a validator can't do — (a) draft/refresh a description from page
    content (good share + SEO summary), (b) **share-message preview**: show the exact
    email/X/LinkedIn text a page produces (reuse `ShareButton`'s `composeMessage` logic) so
    descriptions can be tuned for how they read when shared, (c) batch-heal flagged pages.
    Calls the Q2 validator for the audit. Reuse `author-blog-post` conventions. Optionally a
    PostToolUse warn-hook for new docs missing a description.
  - **verify:** run the skill against 2–3 real pages; confirm the preview matches actual
    ShareButton output and any refreshed description passes the Q2 validator. No defer.
  - **defer?:** no.

## Backlog (NOT loop work — surface to the user, don't auto-act)

The loop must NOT pull these without the user explicitly queueing them; list them in the
termination summary if reached.

- **Pre-existing `draft-sidebar` failures on master** (3 tests) — proven not ours, red on
  master. Flag for separate fix if wanted.
  // re-confirmed 2026-06-01: full `make test-regression` on the branch = 24 passed / 3
  // failed / 1 skipped; the 3 failures are EXACTLY draft-sidebar (dev project). Proof the
  // branch isn't the cause: `git diff --name-only master..HEAD` matches nothing draft/
  // sidebar-related (only draft-triage.tsv, a plan file); spec + source are unchanged from
  // master. prod-checks (a11y/SEO) + posthog-prod (19/19) green. Branch = zero regressions,
  // PR-ready.
- **`im` as a session super-property** — attribute all session events to the acquisition
  channel vs. only the landing `ingress` (currently landing-only). Design decision.
- **Bookmarklet reach** — opt-in; whether to surface beyond the welcome page (footer? a
  /subscribe page?) is a placement decision.
- **X tweet length** — long descriptions could exceed X's limit; consider truncating the
  summary clause for `share_x` only.
