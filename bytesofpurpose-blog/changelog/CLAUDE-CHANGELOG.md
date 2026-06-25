<!--
  Claude task archive: append-only log of completed Claude Code tasks.

  CONVENTION (see root CLAUDE.md): when 10+ tasks are completed, append a new
  batch here, then delete those tasks from the task list. This file is the
  durable record so the live task list stays short.

  FORMAT: one "## " batch per archive event; the changelog generator
  (scripts/generate-changelog-data.js) splits on these headings and renders one
  changelog card per batch. Keep the structure:

  ## [YYYY-MM-DD] Short batch title
  <!-- meta: type=feature category=development priority=medium component=Claude -->
  One-sentence summary of the batch (becomes the card description).

  - Completed task subject
  - Completed task subject
  ...

  Defaults if meta omitted: type=chore, category=development, priority=medium,
  component=Claude. Date drives the card's execution/inception date.
-->

## [2026-06-25] Durable vs temporal reframe: Initiatives, boards, kinds, Legend, glossary
<!-- meta: type=feature category=development priority=high component=Site -->
Reorganized the whole site around one idea: durable knowledge (`/craft` + `/journey`) vs temporal initiatives (`/initiatives`, renamed from `/thoughts`). Renamed the blog with two-hop legacy redirects; added experiment post-kinds and moved the experiment to `/initiatives` as a board card; built an interactive KanbanBoard (generated from frontmatter) with an Experimentation board; stood up a Legend hub explaining the model, a single Glossary home, and a Craft Leadership + Journey Self-Reflection topic; made the skills board-aware; and built a semantic glossary-linking system. Along the way, hardened the build into a fail-closed generated-asset pipeline and audited the new components on mobile.

- Rename the blog `/thoughts` → `/initiatives` (config, plugins, components, content, e2e; two-hop `/blog`+`/thoughts` legacy redirects)
- Fail-closed generated-asset pipeline: gitignore generated data + one `generate-assets` target + a PreToolUse edit-guard hook + CLAUDE.md convention
- Add blog post-kinds learning-plan 📚 / experiment-plan 📝 / experiment-result 📊 (JSON + outline validator + legend table, in lockstep)
- Move the experiment out of `/craft` into `/initiatives` as an `experiment-plan` post (kinds applied, old URL 301s)
- Build the interactive KanbanBoard component + generator + the Experimentation board post (board-parameterized, card→modal→post, e2e green)
- Visual + mobile audit of the KanbanBoard: found + fixed an off-screen-column bug on phones (auto-scroll to the first populated column) + a standing visual/mobile convention
- A `/designs` post showcasing the blog build system (folders, generate-assets, frontmatter→data→component, the fail-closed hygiene)
- Legend hub at `/initiatives/legend`: the durable-vs-temporal explainer + the post-kind emoji table + where the glossaries live
- Single Glossary home at `/glossary` with an A-to-Z term index (index-hub; topic glossaries stay near their topics)
- New Craft Leadership topic + move how-i-ask-others-questions into it (durable people skill)
- Journey: rename Personal Growth → Personal Habits (label-only) + new Self Reflection topic + the `ask-myself` tag across 27 question-set posts
- Board-aware groom-initiatives skill + rework the 5 experiment-lifecycle skills onto the post+board model
- Semantic glossary-linking: a regex hook triages candidate files, a `link-glossary-terms` skill makes the term-of-art-vs-casual call and links only genuine first uses

## [2026-06-23] @omars-lab/blog-ui: a publishable component package, proven cross-repo
<!-- meta: type=feature category=development priority=high component=Site -->
Extracted the four reusable design-post components (Walkthrough, Mockup, DiagramWithFootnotes, Assumption) into a publishable `@omars-lab/blog-ui` ESM React package, built the release pipeline to GitHub Packages, and proved it consumable from another repo by converting getting-started-with-claude-agents into a Vite app that installs and renders it. Then exercised the pipeline a second time: extended the Walkthrough with multi-custom-scene support, used it so the self-healing-storefront design opens on a live store-scan with an issue warning, and shipped it as v0.2.0. Closed the loop on security by adding server-side gitleaks CI to both repos.

- Publish reusable blog-UI components as a GitHub Packages artifact for cross-repo use (the package: tsup ESM + d.ts + bundled CSS, file: dep in the blog, publish-on-tag workflow)
- Author a skill for releasing/publishing @omars-lab/blog-ui (publish-blog-ui: tag convention blog-ui-v*, semver, simulate-publish, consumer .npmrc setup, merge-first ordering)
- Update skills + tests for the @omars-lab/blog-ui package migration (upgrade-post / author-walkthrough / import-co-design repointed to the package; e2e selectors verified)
- Can a real Vite bundler resolve + bundle @omars-lab/blog-ui (ESM + its CSS) from GitHub Packages (yes: vite build clean, the package CSS-modules land in the bundle, rendered + screenshotted)
- How should the Vite app render the blog-ui components as a meaningful demo (full guide port, with a stock-analyzer Walkthrough woven into the Getting-started section)
- How does the Vite build deploy to gh-pages without breaking the existing guide deploy (base './', Makefile build copies Vite output to main/root where Pages serves; static-serve proven)
- Prove the package: getting-started-with-claude-agents consumes @omars-lab/blog-ui + builds gh-pages with it (the cross-repo proof, end to end)
- How should the Walkthrough component support multiple custom scenes (backward-compatible customScenes[] + scene index, single-customScene sidecars unaffected)
- Storefront walkthrough: open on a store-scanning scene with a highlighted section + issue warning (acme-shop.com/checkout scan, dashboard, BI projection, proven via Playwright)
- Release blog-ui v0.2.0 with multi-custom-scene support + propagate to consumers (tagged, published, verified live alongside 0.1.0; 0.x caret gotcha documented)
- Add gitleaks server-side secret scan (CI) to both repos (fail-closed beyond the local pre-commit guard; full-history scans clean)

## [2026-06-03] Emoji-prefixed sidebar section labels (convention + enforcement)
<!-- meta: type=feature category=development priority=medium component=Docs -->
Formalized the unwritten "every sidebar section leads with an emoji" convention into a documented, enforced contract, and backfilled the ~18 category labels that had drifted. The validator now warns on emoji-less `_category_.json` labels (and rolls leaf-doc misses into one count), the docs-structure hook nudges on save, and `emojis.mdx` carries the topic→emoji map as the source of truth. Also trimmed two over-long page descriptions to the SEO/share window.

- Validator: emoji-prefix-category (per-finding) + emoji-prefix-doc (aggregate, --emoji expands) + sidebar-label-missing guard
- Hook: emoji advisory on a _category_.json / doc save without a leading emoji (warn-only)
- emojis.mdx: "Sidebar Topic Emojis" section + topic→emoji map (slug /definitions/emojis-for-activities)
- review-reader-experience SKILL: emoji consistency as a first-class audit item (map-driven suggestion)
- Backfilled leading emojis on ~18 drifted category labels (📈 Career Levels, 🛠️ Skills, 🤝 Cultural Values, 📖 Terminology, 💬 Prompts, …)
- Trimmed 2 over-160-char descriptions (my-problem-solving-approach, my-contributions) + resolved em-dash voice flags

## [2026-06-02] Premium go-live: dev/prod parity, secure deploy, server-side internal flag
<!-- meta: type=feature category=development priority=high component=Site -->
Took the premium hard-gate from code-complete to LIVE: provisioned the Cloudflare infra (token scopes, Worker deploy, passphrase), gave `yarn start` true dev/prod parity (dev encrypts + a service-token-authed `/api/*` proxy, after proving cookie-forwarding impossible), made `make deploy` fail-closed (aborts on missing passphrase, re-runs the V5 leak gate, which now also asserts the passphrase never ships), and moved the internal-tester roster server-side so author emails no longer leak in the public bundle. Added a `manage-infrastructure` skill, a secure-by-default tenet, and post-deploy live verification.

- #19/#20/#21: Cloudflare infra: scope CF_API_TOKEN, set STATICRYPT_PASSPHRASE, deploy the access-gate Worker
- #25: Dev encrypts premium (key from .env via `make start`)
- #26: Dev `/api/*` proxy to the real Worker + revert the localhost toast
- #27: Verify dev==prod parity (headless service-token unlock proven)
- #23: Deploy premium live (encrypted build → gh-pages → validate), secure-by-default fail-closed deploy + V5 passphrase-absence gate
- #11: Move the internal-tester allowlist into the Worker; `/api/me` vends `isInternal` (email no longer in the public bundle)
- Fix pre-existing premium-crypto.ts Uint8Array/ArrayBuffer typecheck errors
- New `manage-infrastructure` skill (Worker provisioning runbook + confirm-token-scopes.sh) + `make rotate-premium-secret` / `validate-dev-service-token` / `validate-deployment`

## [2026-06-02] LinkedIn-gated premium content + internal-analytics filtering
<!-- meta: type=feature category=development priority=high component=Site -->
Shipped an end-to-end premium-content hard gate for the static site: premium docs are encrypted at MDX-compile time and the decryption key is vended only to LinkedIn-signed-in readers by a Cloudflare Worker behind Access (so plaintext is in neither the HTML nor the JS bundle, proven by a blocking deploy gate and e2e). Also added layered internal-analytics filtering, a navbar auth control, themed reader-facing surfaces, four skill updates, and a published System Design (with an honest white-on-white wink that the source is public).

- Phase A: DebugMenu Links section
- Phase B: Layered internal-analytics filtering (?internal=1 + tester list)
- Phase C: Cloudflare Worker + Access auth infra (/api/me, /api/unlock-key)
- Decrypt-crux prototype (StatiCrypt codec, fixed passphrase, no prompt UI)
- Phase D: PostHog identify() + internal-email filter wired to auth
- Phase E: Navbar auth control (Sign in ⇆ avatar) + shared AuthProvider
- Phase F core: encrypted hard gate (rehype compile-time encrypt + V5 blocking gate)
- M1: premium-gating-architecture memory
- S2: PostHog internal-user filtering docs ($host + is_internal)
- SignInModal "track interest" button → premium_interest PostHog event
- Localhost sign-in graceful-degrade (toast instead of dead redirect)
- Cache-bust premium encryption in deploy (make build-premium + cache gotcha docs)
- Theme the premium gate + SignInModal to the blog brand
- Playwright-verify the themed premium surfaces render (brand styling assertions)
- S4: author-blog-post: how to mark content premium (hard vs soft gate)
- S5: new manage-premium-content skill (editorial policy)
- Easter egg + honest caveat in the System Design (premium is free via public repo)
- Phase G: finalize + reconcile the premium-content-gating design doc

## [2026-06-01] Blog modernization + regression / a11y / SEO harness
<!-- meta: type=feature category=development priority=high component=Site -->
Modernized the site's front door (tokens, fonts, hero, cards, latest-posts strip), fixed all Lighthouse a11y/SEO bugs to 100, and stood up an always-on regression harness (Playwright projects + axe a11y + SEO gates), then burned down the resulting test/a11y debt.

- Fix the two Lighthouse a11y bugs (image-alt + heading-order)
- Add design-token layer + Inter font to custom.css
- Redesign homepage hero + feature cards
- Add Latest posts strip to homepage
- Polish blog index + navbar (CSS-only)
- Verify: build, Lighthouse re-run, e2e, deploy
- Set up regression testing for the site (3-project Playwright model)
- Set up proper accessibility scans (axe-core WCAG 2 A/AA, light + dark)
- Set up SEO scan / enhancement (on-page checks + Lighthouse)
- Fix 3 flaky graph-selection-state E2E cases (deep-link edge selection)
- Burn down baselined a11y debt (code-token contrast, task-list labels, prose link underlines)
- SEO enhancements: homepage WebSite/Organization JSON-LD + per-page validity test

## [2026-05-31] A/B experiment lifecycle + analytics enablement
<!-- meta: type=feature category=development priority=high component=Experiments -->
Built the end-to-end A/B experimentation system (PostHog), launched the first experiment, purged rotated secrets from git history, and shipped the site.

- A/B test: define support-button-copy experiment
- Create PostHog experiment support-button-copy (REST API: create/validate/launch)
- Validate A/B variants via Playwright (+ per-variant screenshots)
- A/B: add flag injection point in SupportButton
- Design experiment timeline folder structure (published lab notebook)
- Add experiment entry template + timeline index
- Backfill support-button-copy experiment entry
- Wire timeline convention into run-ab-test skill
- Create design-experiment skill (pre-experiment design doc)
- Create analyze-experiment skill (data + recommendation)
- Create conclude-experiment skill (execute rollout)
- Create decide-experiment skill (decision gates + readout)
- Create publish-site skill (draft-readiness triage + deploy)
- Rewrite git history to purge rotated credentials (filter-repo) + force-push

## [2026-06-02] Two-tier Craft/Self docs IA
<!-- meta: type=feature category=development priority=high component=Site -->
Split the docs into two top-level halves: Craft (outrospective: the professional topics, shared) and Self (introspective: the inward journey), each its own navbar item with an isolated sidebar, folder-path-mirrored slugs, preserved URLs via redirects, and distinct section welcomes; plus the migration engine, validators, e2e coverage, and a changelog-archive reminder hook.

- Move 10 topic folders under docs/craft/ and docs/self/ (git mv)
- Rewrite 297 doc slugs to folder-path-mirrored + 232 cross-doc links
- Preserve old URLs via 187 client redirects (draft targets omitted)
- Add craft/ + self/ topic-root scaffolding + two-tier sidebars + navbar
- Isolate Craft/Self sidebars (each shows only its own half)
- Rewrite section welcomes with distinct outrospective/introspective framing
- Turn Welcome into a two-CTA chooser into both halves
- Author scripts/migrate-ia.js migration engine (plan/slugs/links/redirects)
- Update validate-docs-structure (depth ≤5, welcome-drift) + CLAUDE.md + skill
- Repoint hardcoded slugs in e2e specs; fix stale draft-sidebar fixture
- Add test/e2e/craft-self-split.spec.ts validating the split
- Fix dev-e2e stale .docusaurus cache trap (clear before test-e2e)
- Add changelog-archive Stop hook + "track work as tasks" convention
