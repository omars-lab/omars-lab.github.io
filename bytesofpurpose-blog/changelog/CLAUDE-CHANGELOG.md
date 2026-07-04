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

## [2026-07-03] The big IA reorg: two new roots, a reframed Journey, a Prompts hub, and a clean deploy
<!-- meta: type=feature category=development priority=high component=Site -->
Reorganized the whole site around where content truly belongs, then shipped it. Stood up two new durable Docusaurus roots: `/knowledge` (the mental models, flattened by theme) and `/habits` (every habit, grouped professional, personal, and spiritual), each with a pinned Welcome landing. Reframed `/journey` from "how I see myself" into "what drives me forward, the pieces of the puzzle I am motivated by," and moved entrepreneurship and productivity into it (faith stays). Folded self-reflection and personal-growth into their real homes as habits, moved my-contributions up and renamed it contributions-across-career, and turned prompts into a real Prompts hub with a new `prompt` kind, relocating the initiative-flavored prompts to `/initiatives`. Made NotePlan links first-class `<NotePlanButton>` components with a local-only validator, gave experiment cards a frontmatter-driven `<ExperimentOverview>` header, flipped the quote-set emoji to a speaker, and added the missing navbar hover tooltips for the new roots. Built the reusable machinery behind all of it: `reorganize-content`, `prune-content`, `manage-docs-instances`, `transform-noteplan-links`, and a `discover-my-journey` delta skill plus Stop-hook that surfaces patterns about the author from recent writing. Deployed the merged work across ten PRs to production, encrypted premium content clean, and verified every new URL and redirect renders live in the browser.

- PR A: /knowledge instance + mental-models move (flatten by theme)
- PR B: /habits instance + all habits move (professional/personal)
- PR C: manage-docs-instances skill + model-convention update
- Document instance card-art/sketch sourcing in manage-docs-instances skill
- Pin /knowledge landing as top Welcome in sidebar
- Move more productivity 'X Techniques' folders to /habits as habits
- Validate + transform NotePlan links into first-class buttons (+ transform-noteplan-links skill)
- Better CX for experiment/card overview header blocks
- Reconcile self-reflection + personal-growth remainder with /habits
- Reframe /journey as 'why I build / motivation' + move entrepreneurship + productivity in
- Add hover-over tooltips for new blog sources (knowledge, habits) + journey framing + update skill
- Merge self-reflection into the reflecting habit
- Build a 'discover-my-journey' skill + hook that surfaces insights about the author from their writing
- Move my-contributions up + rename; then move personal-growth to habits
- Turn prompts into a prompt hub (prompts + skills/commands + subagents) + move initiative-prompts to /initiatives
- Deploy the IA reorg to production + verify live

## [2026-07-02] The durable-hub system: kinds, unified area, and three hubs
<!-- meta: type=feature category=development priority=high component=Site -->
Turned the ad-hoc Projects hub from the first batch into a real, enforced SYSTEM. A "hub" is now a durable `/craft` index page (a new `kind: hub`) that catalogs the dated `/initiatives` logs of one activity, grouped by area, via a generated `<Catalog>` component. Established that `/craft` docs can carry a `kind:` (they could not surface an emoji before; the `draft-docs` plugin now derives a docs kind emoji the same way it does for blog posts). Introduced two new activity kinds (project, tinkering) plus a single unified `area:` field (backend, frontend, script, plugin) so the model scales to many hubs without a field per hub. Generalized the one-off ProjectsCatalog into a manifest-driven generator plus a generic `<Catalog kind="...">` component, and migrated the existing project posts onto it. Moved 34 more dated logs (project, tinkering, research) out of `/craft` into `/initiatives`, retired the emptied folders, and stood up Tinkering and Research hubs (research logs also flow onto the existing Research board by stage, so the hub is the by-area view and the board the by-progress view). Made the whole thing self-sustaining: a `make validate-hubs` gate plus a warn hook that catch a hub rendering no catalog or a post missing its area, a CLAUDE.md operating convention, and a `manage-hubs` skill that owns the registry and the add-a-hub checklist.

- Should the flagged /craft project-log docs move to /initiatives, and which ones?
- Where should the durable Projects hub live under Software Development, and what should it link?
- Should backend and plugins project logs also move to /initiatives and the Projects hub?
- Should there be a Tinkering hub, and should the tinkering logs move to /initiatives?
- Should the research logs get a Research hub, given the existing Research board?
- Should there be a dedicated hub post kind, and can /craft docs carry a kind at all?
- Auto-link initiatives into their hub by frontmatter tag (confirmed the generated design)
- Document the durable hubs as a CLAUDE.md operating convention
- Do we need a manage-hubs skill that owns the hub registry and the powering kinds?
- Build the kind system, docs kind emoji, generic Catalog, and migrate the Projects hub
- Move 34 project, tinkering, and research logs and stand up the Tinkering and Research hubs
- Formalize the hubs with a validate-hubs gate, the convention, and the manage-hubs skill

## [2026-07-02] Reorganize project logs into initiatives, plus two tag-driven catalogs
<!-- meta: type=feature category=development priority=high component=Site -->
A durable-versus-temporal cleanup under Software Development, prompted by dated project logs sitting in `/craft` as if they were lasting knowledge. Moved 25 project logs (the frontend and scripting `projects/` folders plus a few automation, analytics, and Home Assistant logs) onto the `/initiatives` blog, pairing each published move with a redirect and correctly leaving drafts without one (a redirect to a draft target fails the build gate). Built the first durable Projects hub: a generated index that groups the moved logs by area and links to each. Consolidated the scattered bookmark and setup-machine command dumps into one task-grouped cheatsheet. Turned the flat Tools page into a tag-driven Repos of Interest catalog (each repo tagged tool, relevant, GenAI, testing) with a generator that fails closed on a bad URL or an em-dash in a blurb. Added a conditional dev-server restart reminder: a Stop hook that nudges only when a server is actually running and the session changed a route-shaping file, so it never cries wolf.

- Should the flagged /craft project-log docs move to /initiatives?
- Consolidate the bookmark and setup-machine command dumps into one sectioned post
- Should the Tools page become a tag-driven reference catalog of repos of interest?
- Add a conditional dev-server restart reminder Stop hook

## [2026-07-01] Homepage UX fixes + a browser-based deploy verifier
<!-- meta: type=feature category=development priority=high component=Site -->
A batch of homepage and navbar fixes surfaced by looking at the live site, each shipped with a test and a proper deploy verification. The navbar now stays on one line and folds its rightmost items into a "More" dropdown (priority+ overflow) instead of collapsing to the mobile hamburger; the mobile drawer lists items one per line (a stray inline-flex wrapper from the hover-summary swizzle was breaking it); the hamburger glyph is vertically centered. The house hero stopped popping in (its above-the-fold arches load eagerly) and stopped rendering an EMPTY centre door on production (a prod-only CSS equal-specificity race left both door and scene at opacity 0; fixed by scoping the "on" rule to two classes, across all four layer pairs). The selected navbar item now has a clear brand-green underline accent instead of faint text. Zero broken links across the whole build. Closed the loop with a new `verify-prod-deployment` skill: a browser check that WAITS for the CDN to serve the exact bundle you built (Pages/Cloudflare hold the old build 1 to 3 min), confirms the deployed change actually renders, and watches every page it loads for real console errors and failed requests (filtering the known-benign Cloudflare Access probe noise).

- Reconcile stale links to the current IA so the production build reports zero broken links and anchors
- Eager-load the above-the-fold house-hero images so the arches do not pop in after paint
- Navbar priority+ overflow: stay single-line and fold the rightmost items into a "More" dropdown, keeping the mobile hamburger for phones
- Fix the mobile hamburger drawer to list items one per line (skip the desktop hover-popup wrapper on mobile)
- Vertically center the mobile hamburger toggle within its touch target
- Fix the empty studio-house centre door on production: a two-class specificity fix on the door/scene/peek/flash opacity layers
- Un-clip the navbar hover-summary popups (an overflow:hidden added for the fold was swallowing them) and add a regression test
- Give the active navbar item a clear brand-green underline accent (was only faint green text)
- Add Jest + Playwright coverage: the pure overflow-fit function, the navbar breakpoints, the mobile drawer stacking, the hover popup, and the hero eager-load
- Regenerate the visual-regression baselines for the navbar + hero changes
- Author the `verify-prod-deployment` skill: propagation wait, deployed-change confirmation, and per-page regression watch

## [2026-06-30] Reconcile the design system into the repo, then make adherence self-sustaining
<!-- meta: type=feature category=development priority=high component=Site -->
Took the "Bytes of Purpose Design System" (reverse-engineered from this repo on claude.ai/design) and reconciled it back INTO the repo, then built the machinery so the brand stays consistent without manual audits. Adopted the named token vocabulary in `custom.css` (spacing, radii, lifts, durations, easing, shadows, type scale, semantic aliases), aliasing rather than duplicating the existing Infima tokens, and migrated the high-value hardcoded call-sites to reference them. Ran five aspect audits (color discipline, type, motion, arch/elevation, voice) and fixed what they found: an off-brand typeface on the live vote button, a hero arch-shadow literal, mid-sentence emoji, card elevation and radii off the two-step system, and a hero accessibility defect where the auto-cycling variants kept advancing under prefers-reduced-motion. Then made it durable: an `implement-with-design-system` skill (the token catalog + discipline rules), a `validate-ds-tokens` guard (a warn hook + blocking gate that flags a hardcoded value with a canonical token), kind-signaling sidebar labels for the Designs blog, and a round-trip of the findings back to the design project.

- Add the design-system named-token layer to custom.css (aliased, not duplicated) and migrate the high-confidence call-sites
- Audit + fix color discipline, typography, motion, arch/elevation, and brand voice across the site
- Fix the P0 accessibility bug: hero variants must not auto-cycle under prefers-reduced-motion (add a reactive useReducedMotion hook + tests)
- Converge card elevation and radii on the brand two-step shadow + radius tokens
- Remove the off-brand Raleway/Nunito typefaces (the live VoteButton + the storybook-init scaffolding)
- Consistent chooser-card titles + surface the "Where faith meets craft" signature in the footer
- Author the `implement-with-design-system` skill (literal-to-token map, discipline rules, token catalog) + a REQUIRED Step 0 to pull the latest design system first
- Add the `validate-ds-tokens` guard: a warn-tier hook + blocking gate catching hardcoded values that have a token
- Kind-signaling sidebar labels for the Designs blog (frontend/backend/agent/tooling-cli design kinds)
- Push the reconciliation findings back to the claude.ai/design project

## [2026-06-26] The Components reference, the Handbook rename, and redirect-chain safety
<!-- meta: type=feature category=development priority=high component=Site -->
Turned the embed-component docs into a real Components reference and hardened the redirect tooling around it. The embed-* docs moved into a `kind: showcase` 🎛️ Components section, each showcase gained an auto-generated "Used in" list (a `usage_pattern` scans the corpus, so the list can never go stale), and Playwright proves each one renders. Then renamed the whole section from Legend to Handbook (the handbook for navigating the blog), moving every `/legend/*` URL to `/handbook/*` with the redirects, structure checks, and cross-links kept in lockstep. Two redirect build-breaks along the way (a raw `<Gif>` in a changelog summary, a stale redirect to a moved-away slug) became permanent guards: the validator now catches chains a to b to c and suggests collapsing to a to c. Finished by surfacing the Changelog from the Handbook sidebar and writing the `manage-changelog` skill.

- Move the embed-component docs into a `kind: showcase` 🎛️ Components reference (Phase 1)
- Auto-generate a "Used in" list per showcase: `usage_pattern` frontmatter, a corpus-scanning generator, the `<UsedIn>` component, and a `maintain-showcase` skill (Phase 2)
- Prove each Components showcase renders + functions with Playwright (mermaid svg, `<Card>` demo, inline TOC, the "Used in" block), and repoint two stale graph specs (Phase 3)
- Rename the Legend docs instance to Handbook: `/legend/*` to `/handbook/*`, internal id kept as 'legend' the way Journey kept 'self'
- Detect redirect chains (a to b to c) in validate-redirects and suggest collapsing to a to c, aware of the createRedirects wildcards
- Surface the Changelog from the Handbook sidebar (a link out to the rich `/changelog` page, not a duplicate)
- Write the `manage-changelog` skill: the batch format, the regenerate step, the archive loop, and the MDX-safe + de-em-dashed summary rules

## [2026-06-26] The temporal content model: Thoughts / Mindset / Questions + four boards
<!-- meta: type=feature category=development priority=high component=Site -->
Reframed the temporal half of the site around one distinction the user drew out. A THOUGHT is an idea that *occurred* to me; it graduates three ways: act on it → an Initiative, deliberately keep it to shape how I think → Mindset, distill it → Craft. Then built it out into four standalone blog instances (Thoughts / Mindset / Questions / Initiatives) plus four durable kanban boards (Ideas / Experiments / Research, each in /craft indexing temporal posts). Along the way: a Mindset quote-set kit with a hover Focus-word highlight, an `organize-post` classifier and a `name-post` skill (title voice must match a post's nature), an SEO validator and a fast a11y-contrast guard, and a sweep that retitled the "my first" ideas as questions, folded POCs into the Experiments board, retired a stale /craft pipeline doc, and gave each first-time idea its own classified board card.

- Add the `<Focus>` word-highlight that sweeps in on quote hover (reduced-motion safe)
- Retitle the "my first X" thought ideas as the questions they are (the name-post rule's first use)
- Each hello-world idea is its own Ideas-board card with a "first-time" classification badge (Hello Worlds = a class, not a card)
- Research board: research thoughts get the board/blog split + the stale research doc fixed
- Fold POCs into Initiatives + the Experiments board (acted-on validation work)
- Retire the stale /craft initiatives doc (contradicted the model) → redirect to the Legend
- Move affirmations into the Mindset section; stand up the Mindset blog instance + the Thoughts-vs-Mindset reframe
- New /questions collection: the 26 question-sets get their own home (not all questions are mindset-shaping)
- New `name-post` skill + validate-post-naming scan/hook (a thought reads as a question, not a finished thing)
- New `organize-post` classifier skill; SEO validator (source + built-HTML); fast WCAG-AA contrast guard
- Encode the model in lockstep: the Legend guide, CLAUDE.md tenet, navbar hover summaries, the About pages (taught by example), blog-kinds.json, and the structure checks

## [2026-06-23] CI-built Pages deploy + a GIF component, with the writeups
<!-- meta: type=feature category=development priority=medium component=Site -->
Moved the production deploy from a local `make deploy` to a CI-built GitHub Pages workflow, and added a reusable `<Gif>` media component. Both are documented in their own writeups.

- Switch the gh-pages deploy to a CI-built GitHub Pages workflow (build in Actions, not locally)
- Add a reusable `<Gif>` component for recorded/synthesized clips (lazy, reduced-motion poster, play/pause)
- Write up both the CI-deploy migration and the GIF component

## [2026-06-25] Thoughts collection + taxonomy, the quote-set Mindset, and a masculine re-theme
<!-- meta: type=feature category=development priority=high component=Site -->
Split the temporal half of the site by whether an idea was acted on (`/initiatives` = acted-on, the new `/thoughts` = unactioned), then gave Thoughts a 7-kind taxonomy with drift-proof badges, an `organize-post` classifier skill, and the 26 question sets as its first real content. Separately rebuilt `/mindset` into a real "quotes that moved me" experience with an editorial pull-quote kit, and re-themed the whole blog on a masculine, dark-grounded tea-party palette. Every move paired with redirects; no files deleted.

- Re-theme the blog on the tea-party palette (green primary, pastel accents), leaned masculine + AA-contrast-verified
- New `/thoughts` (Thoughts) blog instance for UNACTIONED ideas + the durable Ideas board on `/craft`
- Move "What I Ask Myself" into the Legend instance + name the collection "Thoughts" (navbar + homepage card)
- Define the Thoughts taxonomy (7 kinds: idea/question/simulation/prediction/critique/principle/design) in blog-kinds.json + a `<ThoughtKind>`/`<ThoughtKindLegend>` badge kit + a `/thoughts` landing, all in lockstep
- Move the 26 question-set posts `/initiatives` → `/thoughts` (questions are a kind of thought)
- New `organize-post` skill: classify a post → decide its home (durable/temporal, acted-on/unactioned) + kind, splitting mixed posts
- Rebuild `/mindset` into the quotes-that-moved-me experience: a `<Quote>`/`<QuoteSet>` editorial pull-quote kit (received/savored, distinct from question cards) + `kind: quote-set` 💬 + a seed post
- Document the quote kit in the upgrade-post skill; add a `build-blog-ui` Make target so the site can never ship stale components (fail-closed)

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
- Legend hub at `/legend`: the durable-vs-temporal explainer + the post-kind emoji table + where the glossaries live
- Single Glossary home at `/glossary` with an A-to-Z term index (index-hub; topic glossaries stay near their topics)
- New Craft Leadership topic + move how-i-ask-others-questions into it (durable people skill)
- Journey: rename Personal Growth → Personal Habits (label-only) + new Self Reflection topic + the `ask-myself` tag across 27 question-set posts
- Board-aware groom-initiatives skill + rework the 5 experiment-lifecycle skills onto the post+board model
- Semantic glossary-linking: a regex hook triages candidate files, a `link-glossary-terms` skill makes the term-of-art-vs-casual call and links only genuine first uses

## [2026-06-23] CI-built Pages deploy + a GIF component, with the writeups
<!-- meta: type=feature category=development priority=high component=Site -->
Gave the getting-started guide a CI-built GitHub Pages deploy (build from source, no committed output to drift), wired so it installs the published @omars-lab/blog-ui from GitHub Packages using the default Actions token, validated with actionlint and proven live end to end (two real .npmrc-token bugs surfaced only by running it). Wrote it up as a paired /designs design doc + /thoughts post with validated source links. Then brought getting-started's GIF approach into the blog as BOTH a `<Gif>` presentation component (accessible: reduced-motion poster, play/pause, terminal frame) and a parameterized terminal-session GIF generator, shipped as blog-ui v0.3.0.

- How does the Actions Pages deploy authenticate to GitHub Packages to install @omars-lab/blog-ui (the default Actions token reads a same-owner public package; no PAT)
- Switch getting-started Pages from legacy serve-from-branch to Actions-based deploy (upload-pages-artifact@v4 + deploy-pages@v4; Pages source flipped to GitHub Actions; build output no longer committed)
- Keep a manual `make deploy` Makefile target as the fallback deploy path (one target = gh workflow run, after `make validate-config`)
- Add `make validate-config` (actionlint) + `make deploy` dry-run to verify the workflow before it runs (validated clean + proven to catch errors)
- Write a design doc capturing the Actions-based Pages deploy approach (a /designs post, with source links)
- Turn the deploy-approach design doc into a blog post with source links (the /thoughts companion, tied to the package arc)
- Add a `<Gif>` presentation component to @omars-lab/blog-ui (framed, captioned, lazy, reduced-motion poster + play/pause toggle, terminal frame)
- Port the synthesized-terminal-GIF generator into the blog as reusable tooling (parameterized Pillow + gifsicle, JSON-spec driven; author-terminal-gif skill)
- Should gitleaks run in CI (not just local pre-commit) for getting-started + blog repos (yes; added server-side gitleaks CI to both, fail-closed)
- Released @omars-lab/blog-ui v0.3.0 (the `<Gif>` component), live in GitHub Packages alongside 0.1.0 + 0.2.0

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
