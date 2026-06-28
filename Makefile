# AGENTS: Guidelines for maintaining this Makefile
# ================================================
# 
# When adding new targets:
# 1. Follow the pattern: target-name: ## Description of what the target does
# 2. Use .PHONY declarations for all targets that don't create files
# 3. Keep targets focused on single responsibilities
# 4. Use composable targets (e.g., target1 target2) for complex workflows
# 5. Always include a description after ## for the help target
# 6. Test new targets with 'make help' to ensure they appear correctly
# 7. ALWAYS run 'make help' after making any changes to verify the Makefile works
#
# CRITICAL: Indentation Rules
# - Commands under targets MUST be indented with TABS, not spaces
# - Use 'make -n <target>' to test syntax before running
# - If targets don't work, check indentation with: sed -n 'X,Yp' Makefile | cat -e
# - Replace spaces with tabs: sed -i '' 's/^    /\t/' Makefile
#
# Target naming conventions:
# - Use kebab-case for target names
# - Prefix with action: commit-, push-, update-, etc.
# - Use descriptive names that indicate the target's purpose
#
# Submodule considerations:
# - Always use 'git add .' to stage submodule reference changes
# - Submodule updates require committing the reference change in parent repo
# - Use 'git submodule update --remote <submodule>' to update submodules

# All targets that don't create files should be declared as .PHONY
.PHONY: help install add init-site check typecheck audit clean start start-prod start-prod-port clear build serve version deploy fix-frontmatter fix-blog-posts upgrade update-prompts enable-submodule-status enable-recursive-push fix-submodule-detached-head commit-submodule-updates push-with-submodules commit push commit-push test-e2e test-e2e-headed test-e2e-ui test-e2e-debug open-e2e-report storybook build-storybook secret-scan install-hooks test-posthog generate-assets generate-blog-stub blog-pending rotate-premium-secret check-node-worker validate-dev-service-token validate-deployment

SHELL := /bin/bash
MAKEFILE_DIR := $(shell dirname $(realpath $(lastword $(MAKEFILE_LIST))))
SITENAME := bytesofpurpose-blog
SITEROOT := ${MAKEFILE_DIR}/${SITENAME}

install: ## Install dependencies for the Docusaurus site
	# https://docusaurus.io/docs/installation
	((npm list -g --depth=0 | sed -E 's/(├|└)── //g' | grep -q yarn) || which yarn) || npm install -g yarn
	( cd ${SITEROOT} && yarn install )
	
add: ## Add new packages to the Docusaurus site
	# ( cd ${SITEROOT} && yarn add @docusaurus/plugin-svgr )
	( cd ${SITEROOT} && yarn add react-gist )
	( cd ${SITEROOT} && yarn add yarn add -D @types/node )
	( cd ${SITEROOT} && yarn add react-force-graph-2d )
	( cd ${SITEROOT} && yarn add -D @storybook/addon-essentials @storybook/addon-interactions @storybook/addon-links )
	( cd ${SITEROOT} && yarn add -D @storybook/addon-essentials@^10.0.7 @storybook/addon-interactions@^10.0.7 )
	( cd ${SITEROOT} && yarn add -D "@storybook/addon-essentials@^10.0.7" "@storybook/addon-interactions@^10.0.7" )
	( cd ${SITEROOT} && yarn remove @storybook/addon-essentials @storybook/addon-interactions && yarn add -D @storybook/addon-essentials@10.0.7 @storybook/addon-interactions@10.0.7 )
	( cd ${SITEROOT} && yarn add -D @storybook/addon-essentials @storybook/addon-interactions )
	true

setup-storybook:
	( cd ${SITEROOT} && yarn create storybook )

storybook: ## Start Storybook development server (with optional type-check)
	# Type-check is optional - uncomment the next line if you want to type-check before starting
	# ( cd ${SITEROOT} && yarn typecheck )
	( cd ${SITEROOT} && yarn storybook )

build-storybook: ## Build Storybook for production
	( cd ${SITEROOT} && yarn build-storybook )

build-blog-ui: ## Rebuild the @omars-lab/blog-ui package so its dist/ is current before a site build
	@# The blog consumes the BUILT dist/ of the file:../packages/blog-ui dep (dist/ is gitignored,
	@# so a fresh clone or an un-rebuilt edit would ship STALE components). Rebuild it + reinstall
	@# the file: dep so the blog's node_modules copy is fresh. This is a prerequisite of `build`
	@# and `deploy` so the published site always has the current components (fail-closed: you can
	@# never deploy stale blog-ui by forgetting to rebuild it).
	( cd packages/blog-ui && yarn build )
	( cd ${SITEROOT} && yarn add @omars-lab/blog-ui@file:../packages/blog-ui )

init-site: ## Initialize a new Docusaurus site
	test -d ${SITEROOT} || npx @docusaurus/init@latest init ${SITENAME} classic --typescript

check: ## Check MDX files for issues
	( cd ${SITEROOT} && npx docusaurus-mdx-checker )

typecheck: ## Type-check the site with tsc (swizzled theme + components + pages)
	( cd ${SITEROOT} && yarn typecheck )

validate-links: ## Lint markdown/MDX source for bare/long/tracking/generic links
	( cd ${SITEROOT} && node scripts/validate-links.js $(DIRS) )

validate-footnotes: ## Verify evidence-footnote permalinks resolve (pinned SHA + path + line range exist & are pushed)
	( cd ${SITEROOT} && node scripts/validate-footnotes.js $(DIRS) )

validate-glossary: ## Find posts whose first use of a defined glossary term isn't linked (warn-tier candidates; judge + link via the link-glossary-terms skill)
	( cd ${SITEROOT} && node scripts/validate-glossary-links.js $(DIRS) )

validate-redirects: ## Check the client-redirects array for invalid/draft/colliding/duplicate targets (catches build-breakers early)
	@# exit 2 == ERROR-tier (a redirect target that's missing or draft would fail the prod build).
	( cd ${SITEROOT} && node scripts/validate-redirects.js )

validate-em-dash: ## Scan ALL public-facing content (prose + components) for AI-voice em-dashes (—)
	@# Repo-wide complement to the edit-only .claude/hooks/em-dash-voice-hook.sh, which never
	@# sweeps the existing corpus. Exit 1 on any hit. Flags everything, code blocks included.
	( cd ${SITEROOT} && node scripts/validate-em-dash.js )

validate-structure: ## Lint the topic-based docs IA contract (absolute slugs, categories, depth, naming)
	@# exit 2 == ERROR-tier (fail the gate); exit 1 == warn-only (advisory, pass).
	@( cd ${SITEROOT} && node scripts/validate-docs-structure.js ); rc=$$?; \
		if [ $$rc -eq 2 ]; then echo "✗ structure: ERROR-tier violations — see above."; exit 1; fi; \
		exit 0

check-contrast: ## Fast WCAG-AA contrast gate on the theme's color vars (complements the axe e2e gate)
	@# Exit 2 if any critical fg/bg theme pair (body/links/buttons/tea-ink, light + dark) drops
	@# below AA — a contrast regression the slow axe gate would also fail. The warn-tier hook
	@# .claude/hooks/check-contrast-hook.sh runs this at edit time; this target is the blocking gate.
	( cd ${SITEROOT} && node scripts/check-contrast.js )

validate-naming: ## Check /thoughts post titles read as questions, not completed initiatives (advisory)
	@# Warn-tier: flags an unactioned-thought post titled like a finished thing ("My First X",
	@# "Building X") instead of the question it should be ("Should I build X?"). Always exits 0.
	@# The warn hook .claude/hooks/validate-post-naming-hook.sh runs it on a thoughts/ edit.
	( cd ${SITEROOT} && node scripts/validate-post-naming.js )

validate-seo: ## Lint SEO frontmatter across ALL content (description/title/keywords/image) — advisory
	@# Mode 1 (source): the cheap, corpus-wide frontmatter audit (the blog instances the docs
	@# validator skips + title/keywords/image). Always exits 0 — warn-tier advisory like the other
	@# content lints. The built-HTML audit is the separate `validate-seo-built` (run after a build).
	( cd ${SITEROOT} && node scripts/validate-seo.js )

validate-seo-built: ## Audit the BUILT HTML <head> SEO (og/canonical/sitemap) — run AFTER `make build`
	@# Mode 2 (--built): walks build/**/*.html and asserts the meta the site ACTUALLY shipped.
	@# Exit 2 (deploy-aborting) on an ERROR-tier defect (empty title/description/og:*/canonical, or
	@# an og:image that doesn't resolve in build/). Belongs in the deploy/CI path, not the edit hook.
	( cd ${SITEROOT} && node scripts/validate-seo.js --built )

verify-premium: ## BLOCKING premium hard-gate check: no `premium:true` body cleartext in build/ (HTML or JS)
	@# Run AFTER a build. Exit 2 (deploy-aborting) if any premium body leaked, or a sidecar
	@# is missing. Also wired into deploy-site step 3b + the .githooks/pre-push hook.
	( cd ${SITEROOT} && node scripts/verify-premium-encrypted.js )

# Source dir of public co-design HLDs (override: make import-co-designs CODESIGN_SRC=…).
CODESIGN_SRC ?= ${HOME}/Workspace/work-git/docs/architecture/co-designs/public
import-co-designs: ## Import public co-design HLDs into the Designs blog + prove the transforms (see /import-co-design skill)
	@# Repeatable, idempotent pipeline. Re-run any time a source HLD changes: it UPDATEs the
	@# matching Designs post in place (matched by frontmatter source.id), never duplicates.
	@# IMPORT_DATE stamps the provenance block; pass it so the run is deterministic.
	IMPORT_DATE=$$(date +%Y-%m-%d) node .claude/skills/import-co-design/import-co-design.js --all "${CODESIGN_SRC}"
	@# Prove the transforms (unit) — fast, no server needed.
	( cd ${SITEROOT} && npx jest test/unit/import-co-design.test.ts )
	@# Belt-and-suspenders: zero raw em-dashes shipped (the blocking hook scans source bytes).
	@if grep -rl $$'\xe2\x80\x94' ${SITEROOT}/designs/*.mdx >/dev/null 2>&1; then \
		echo "✗ em-dash leak in designs/*.mdx — see above"; \
		grep -rln $$'\xe2\x80\x94' ${SITEROOT}/designs/*.mdx; exit 1; \
	else echo "✓ no raw em-dash in imported designs posts"; fi
	@echo "Imported. To verify rendering, undraft + clean-build + e2e:"
	@echo "  (cd ${SITEROOT} && yarn docusaurus clear && yarn playwright test --project=dev co-design-imports)"

build-premium: build-storybook ## Cache-busted ENCRYPTED production build (premium docs encrypted) + V5 gate
	@# THE production build path when any doc is `premium: true`. Clears node_modules/.cache
	@# + .docusaurus FIRST — webpack/Docusaurus can otherwise serve a premium doc's STALE
	@# compiled output so rehype-premium-encrypt.js never re-runs → no sidecar → a naive
	@# build looks done while it would ship PLAINTEXT (the cache gotcha). Requires
	@# STATICRYPT_PASSPHRASE exported (gitignored .env; MUST equal the Worker's
	@# PREMIUM_PASSPHRASE). Then runs V5 (verify-premium) as a blocking gate. deploy-site
	@# uses this instead of a bare `yarn build` whenever premium content exists.
	@[ -n "$$STATICRYPT_PASSPHRASE" ] || { echo "❌ STATICRYPT_PASSPHRASE empty — premium would ship in clear; aborting"; exit 1; }
	( cd ${SITEROOT} && rm -rf node_modules/.cache .docusaurus && yarn build )
	( cd ${SITEROOT} && node scripts/verify-premium-encrypted.js ) \
		|| { echo "❌ premium content not safely gated — aborting"; exit 2; }

validate-deployment: ## Post-deploy smoke checks on the LIVE site (reachable/public, PostHog, premium gate safe)
	@# Wraps the validate-deployment skill's check.sh: retries through GitHub Pages /
	@# Cloudflare propagation, asserts the right commit shipped, PostHog key in the bundle,
	@# social card + JSON-LD resolve, AND the premium hard-gate is live + leak-free (body
	@# ciphertext, passphrase absent from live JS, /api/unlock-key gated). Run after `make deploy`.
	bash .claude/skills/validate-deployment/check.sh "$(or $(URL),https://blog.bytesofpurpose.com)"

validate-dev-service-token: ## Verify the CF Access service token unlocks the Worker (dev /api/* auth)
	@# Proves the dev-only service token (CF_ACCESS_CLIENT_ID/SECRET in .env) is admitted by
	@# the /api/* Access app's Service Auth policy and that the Worker vends the key. This is
	@# the headless equivalent of the browser LinkedIn unlock — no browser needed. If it 302s,
	@# the Service Auth policy isn't live on the app yet (add it / wait for propagation).
	@CID=$$(grep -E '^CF_ACCESS_CLIENT_ID=' .env | head -1 | cut -d= -f2- | sed 's/[[:space:]]*#.*//' | tr -d ' "'\'''); \
	CSEC=$$(grep -E '^CF_ACCESS_CLIENT_SECRET=' .env | head -1 | cut -d= -f2- | sed 's/[[:space:]]*#.*//' | tr -d ' "'\'''); \
	if [ -z "$$CID" ] || [ -z "$$CSEC" ] || [ "$${CID#<PASTE}" != "$$CID" ]; then \
		echo "❌ CF_ACCESS_CLIENT_ID/SECRET not set in .env (or still a placeholder)."; exit 1; fi; \
	echo "🔑 Testing service token $${CID%%.*}… against the Worker"; \
	KEY=$$(curl -s -H "CF-Access-Client-Id: $$CID" -H "CF-Access-Client-Secret: $$CSEC" https://blog.bytesofpurpose.com/api/unlock-key); \
	if printf '%s' "$$KEY" | grep -q '"passphrase"'; then \
		echo "✅ /api/unlock-key vended a passphrase — service token admitted. Dev can decrypt headlessly."; \
		echo "   (Note: /api/me correctly 401s for a service token — it has no email; the dev path uses /api/unlock-key.)"; \
	else \
		echo "❌ /api/unlock-key did not return a passphrase. Response: $$KEY"; \
		echo "   → If 302/401: add a Service Auth policy (Include: Service Token) to the 'Access Gate (blog /api/*)' app, or wait for propagation."; \
		exit 2; \
	fi

check-node-worker: ## Fail-closed: abort unless the running node satisfies workers/access-gate/.nvmrc
	@# wrangler 4.94+ HARD-REFUSES to run on node < 22 (it exits before doing anything),
	@# so any Worker deploy on the wrong node dies with a cryptic mid-command error. This
	@# guard reads workers/access-gate/.nvmrc and aborts FIRST with a clear nvm hint, so
	@# `rotate-premium-secret` can't half-rotate on an unsupported node. Prereq of the
	@# Worker-deploy paths; run it standalone to check your shell before deploying.
	@REQ=$$(tr -dc '0-9' < workers/access-gate/.nvmrc); \
	CUR=$$(node -p 'process.versions.node.split(".")[0]' 2>/dev/null || echo 0); \
	if [ "$$CUR" -lt "$$REQ" ]; then \
		echo "🔴 ABORT: Worker tooling (wrangler) needs node >= $$REQ but this shell is on node $$CUR."; \
		echo "   Fix: nvm install $$REQ && nvm use $$REQ   (or 'cd workers/access-gate && nvm use')"; \
		exit 2; \
	fi; \
	echo "✅ node $$CUR satisfies the Worker's node >= $$REQ requirement."

rotate-premium-secret: check-node-worker ## Rotate the premium passphrase in BOTH .env and the Worker (then re-encrypt+deploy)
	@# Rotation MUST keep two copies equal: STATICRYPT_PASSPHRASE in .env (encrypts at
	@# build time) and the access-gate Worker's PREMIUM_PASSPHRASE (vended to readers).
	@# This target generates one new value, writes it to .env, pushes it to the Worker,
	@# and redeploys the Worker so it picks the new secret up. ⚠️ AFTER this, already-
	@# published premium content was encrypted with the OLD passphrase and will no longer
	@# decrypt — you MUST re-encrypt + redeploy the SITE (`make build-premium && make
	@# deploy`) or premium readers get garbage. This target reminds you; it does not do
	@# the site deploy for you (that's deploy-site's job).
	@# Per-var extraction of the token (NOT `source .env` — shell-special chars).
	@TOKEN=$$(grep -E '^CF_API_TOKEN=' .env | head -1 | cut -d= -f2- | sed 's/[[:space:]]*#.*//' | tr -d ' "'\'''); \
	if [ -z "$$TOKEN" ]; then echo "❌ CF_API_TOKEN not found in .env — aborting."; exit 1; fi; \
	NEW=$$(LC_ALL=C tr -dc 'A-Za-z0-9' < /dev/urandom | head -c 44); \
	[ $${#NEW} -eq 44 ] || { echo "❌ passphrase generation failed"; exit 1; }; \
	echo "🔑 Generated new 44-char passphrase. Writing to .env…"; \
	python3 -c 'import sys,pathlib; p=pathlib.Path(".env"); L=p.read_text().splitlines(); \
out=[("STATICRYPT_PASSPHRASE="+sys.argv[1]) if l.startswith("STATICRYPT_PASSPHRASE=") else l for l in L]; \
assert any(l.startswith("STATICRYPT_PASSPHRASE=") for l in out), "no STATICRYPT_PASSPHRASE line in .env"; \
p.write_text("\n".join(out)+"\n")' "$$NEW"; \
	echo "🚀 Pushing PREMIUM_PASSPHRASE to the Worker + redeploying…"; \
	( cd workers/access-gate && printf '%s' "$$NEW" | CLOUDFLARE_API_TOKEN=$$TOKEN npx wrangler secret put PREMIUM_PASSPHRASE && CLOUDFLARE_API_TOKEN=$$TOKEN npx wrangler deploy ) \
		|| { echo "❌ Worker secret/deploy failed — .env now holds the NEW value but the Worker may still vend the OLD one. Re-run to resync."; exit 2; }; \
	echo "✅ Rotated. .env + Worker now share the new passphrase."; \
	echo "⚠️  NEXT: re-encrypt + redeploy the SITE so published premium content matches:"; \
	echo "       make build-premium && make deploy   (or run the deploy-site skill)"

test-link-hook: ## Integration tests for the validate-links PostToolUse hook + --fix
	bash ${SITEROOT}/test/integration/validate-links-hook.test.sh

generate-blog-stub: ## Scaffold a companion /blog/ post for a post-worthy doc (DOC=docs/path/to/doc.md)
	@# The doc must carry `blog_trigger:` frontmatter (see docs/blogging/blog-post-triggers.mdx).
	@# Read-only on the source doc; refuses to overwrite an existing post.
	@test -n "$(DOC)" || { echo "Usage: make generate-blog-stub DOC=docs/path/to/doc.md"; exit 1; }
	( cd ${SITEROOT} && node scripts/generate-blog-post.js "$(DOC)" )

blog-pending: ## List docs that are post-worthy (carry blog_trigger) and still owe a post
	( cd ${SITEROOT} && node scripts/generate-blog-post.js --all-pending )

audit: ## Run security audit on dependencies
	# ( cd ${SITEROOT} && npx docusaurus-audit )
	( cd ${SITEROOT} && npm audit )

clean: ## Clean build artifacts and dependencies
	( cd ${SITEROOT} && yarn clear )
	( cd ${SITEROOT} && rm -rf node_modules yarn.lock package-lock.json )

PORT ?= 3000
start: build-blog-ui build-storybook ## Start the development server (use PORT=8080 to specify a custom port)
	# Starts the development server, includes drafts and monitors and auto deploys updates
	# Builds Storybook first so it's available at /storybook/
	# Rebuilds @omars-lab/blog-ui first (its dist/ is gitignored + consumed built) so the dev
	# server always renders the CURRENT components, never a stale dist from a fresh clone or an
	# un-rebuilt edit — see `make build-blog-ui`.
	# Dynamic data assets are auto-generated via the npm 'prestart' hook
	# (npm run generate-assets) before starting — see `make generate-assets`.
	@# Dev/prod parity for premium: export STATICRYPT_PASSPHRASE from the gitignored .env so
	@# the rehype-premium-encrypt plugin ENCRYPTS premium bodies in dev too — the gate looks
	@# identical to prod locally. NOT hardcoded; per-var extraction (NOT `source .env` —
	@# shell-special chars). Empty if .env lacks it → dev silently renders premium plaintext
	@# (authoring fallback), so we warn. The unlock key comes from the REAL Worker via the
	@# dev /api/* proxy (#26), so a domain sign-in is needed to decrypt locally.
	@# Also export the CF Access SERVICE TOKEN (dev-only) so plugins/dev-api-proxy can
	@# authenticate /api/* to the real Worker headlessly (no browser login) — the documented
	@# CF localhost-dev path. Absent → proxy still forwards but can't unlock (premium stays
	@# gated in dev); the plugin warns.
	@SP=$$(grep -E '^STATICRYPT_PASSPHRASE=' .env | head -1 | cut -d= -f2- | sed 's/[[:space:]]*#.*//' | tr -d ' "'\'''); \
	CID=$$(grep -E '^CF_ACCESS_CLIENT_ID=' .env | head -1 | cut -d= -f2- | sed 's/[[:space:]]*#.*//' | tr -d ' "'\'''); \
	CSEC=$$(grep -E '^CF_ACCESS_CLIENT_SECRET=' .env | head -1 | cut -d= -f2- | sed 's/[[:space:]]*#.*//' | tr -d ' "'\'''); \
	if [ -z "$$SP" ]; then echo "⚠️  STATICRYPT_PASSPHRASE not in .env — premium will render in CLEAR in dev (no gate)."; fi; \
	( cd ${SITEROOT} && STATICRYPT_PASSPHRASE=$$SP CF_ACCESS_CLIENT_ID=$$CID CF_ACCESS_CLIENT_SECRET=$$CSEC yarn start --port ${PORT} )

PORT ?= 3000
start-prod: build-blog-ui ## Start the development server with NODE_ENV=production
	# Starts the development server in production mode, includes drafts and monitors and auto deploys updates
	# Rebuilds @omars-lab/blog-ui first (gitignored dist/, consumed built) so it isn't stale.
	( cd ${SITEROOT} && NODE_ENV=production yarn start --port ${PORT} )

clear: ## Clear Docusaurus cache
	# Starts the development server, includes drafts and monitors and auto deploys updates
	( cd ${SITEROOT} && yarn clear )

generate-assets: ## Regenerate ALL dynamic data assets from frontmatter (changelog/ideas/logo/kanban)
	# Single source of truth for build-time generation. Writes the gitignored
	# generated-from-frontmatter assets (src/components/*/{changelog,ideas,kanban}-data.json,
	# designs/_binary-pyramid-variants.js). Runs automatically via the npm prestart/prebuild
	# hooks before `yarn start`/`yarn build`; this target is for regenerating on demand.
	# NEVER hand-edit the outputs — edit the generator or the frontmatter source.
	( cd ${SITEROOT} && yarn generate-assets )

build: build-blog-ui build-storybook ## Build the site for production
	# Bundles your website into static files for production.
	# Dynamic data assets are auto-generated via the npm 'prebuild' hook
	# (npm run generate-assets) before building — see `make generate-assets`.
	( cd ${SITEROOT} && yarn build )

serve: build ## Serve the built site locally
	# Serves the built website locally.
	( cd ${SITEROOT} && yarn serve )

version: ## Show Docusaurus version
	( cd ${SITEROOT} && npx docusaurus --version )

secret-scan: ## Scan the full repo history + working tree for leaked secrets
	# Mirrors the gitleaks pattern used across the other repos.
	@command -v gitleaks >/dev/null 2>&1 || { echo "Install gitleaks: brew install gitleaks"; exit 1; }
	gitleaks detect --source . --config .gitleaks.toml --redact --verbose

install-hooks: ## Enable the local pre-commit secret-scan hook
	git config core.hooksPath .githooks
	@echo "✓ pre-commit secret scanning enabled (core.hooksPath=.githooks)"

deploy: secret-scan build-blog-ui build-storybook ## Deploy the site to GitHub Pages (runs a secret scan first)
	# Publishes the website to GitHub pages.
	@# `static/storybook/` is a GENERATED artifact (gitignored, not tracked) that
	@# Docusaurus copies verbatim from static/ — `yarn deploy` does NOT regenerate it.
	@# So `build-storybook` is a prerequisite here: a fresh clone must regenerate the
	@# /storybook/ assets (the footer links to /storybook/) before the deploy copies
	@# static/, or the live page would ship with no bundles.
	@# `docusaurus deploy` REBUILDS (it ignores a prebuilt build/ + SKIP_BUILD), so the
	@# build-time env MUST be exported here or the rebuild ships premium in CLEAR (no
	@# STATICRYPT_PASSPHRASE) and loses analytics (no POSTHOG_KEY). Per-var extraction
	@# (NOT `source .env` — shell-special chars). Then re-run V5 on the deployed build/ as
	@# a blocking safety net before the push is trusted. If a premium doc exists and the
	@# passphrase is empty, ABORT — never ship cleartext premium.
	@SP=$$(grep -E '^STATICRYPT_PASSPHRASE=' .env | head -1 | cut -d= -f2- | sed 's/[[:space:]]*#.*//' | tr -d ' "'\'''); \
	PK=$$(grep -E '^POSTHOG_KEY=' .env | head -1 | cut -d= -f2- | sed 's/[[:space:]]*#.*//' | tr -d ' "'\'''); \
	PH=$$(grep -E '^POSTHOG_HOST=' .env | head -1 | cut -d= -f2- | sed 's/[[:space:]]*#.*//' | tr -d ' "'\'''); \
	PREMIUM_COUNT=$$(cd ${SITEROOT} && node scripts/lib/premium-docs.js --count 2>/dev/null || echo 0); \
	if [ "$$PREMIUM_COUNT" != "0" ] && [ -z "$$SP" ]; then \
		echo "🔴 ABORT: premium docs exist but STATICRYPT_PASSPHRASE is empty — deploying would ship premium in CLEAR."; \
		echo "   Set STATICRYPT_PASSPHRASE in .env (== the Worker's PREMIUM_PASSPHRASE) and retry. Fail-closed by default."; \
		exit 1; \
	fi; \
	if [ -z "$$PK" ]; then echo "⚠️  POSTHOG_KEY empty — analytics will be missing in this deploy."; fi; \
	( cd ${SITEROOT} && STATICRYPT_PASSPHRASE=$$SP POSTHOG_KEY=$$PK POSTHOG_HOST=$$PH \
		USE_SSH=true GIT_USER=omar_eid21@yahoo.com DEPLOYMENT_BRANCH=gh-pages yarn deploy ) \
	&& ( cd ${SITEROOT} && STATICRYPT_PASSPHRASE=$$SP node scripts/verify-premium-encrypted.js ) \
		|| { echo "🔴 post-deploy V5 found a premium leak in the shipped build — investigate immediately."; exit 2; }

fix-frontmatter: ## Fix frontmatter issues using AI
	gemini --approval-mode auto_edit --allowed-tools Edit,WriteFile -p "Follow the instructions in @./bytesofpurpose-blog/prompts/fix-frontmatter.md"

fix-blog-posts: ## Fix frontmatter for recently modified blog posts and placeholder content
	gemini --approval-mode auto_edit --allowed-tools Edit,WriteFile -p "Follow the instructions in @./prompts/bootstrap/blog-posts.md"

upgrade: ## Upgrade Docusaurus packages to latest versions
	( cd ${SITEROOT} && yarn upgrade \
		@docusaurus/core@latest \
		@docusaurus/plugin-svgr@latest \
		@docusaurus/preset-classic@latest \
		@docusaurus/theme-live-codeblock@latest \
		@docusaurus/theme-mermaid@latest \
		@docusaurus/module-type-aliases@latest \
		@docusaurus/tsconfig@latest \
		@docusaurus/types@latest \
	)

# Submodule and Git Management Targets

help: ## Show this help message
	@echo "Available targets:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

update-prompts: ## Pull latest changes from the prompts submodule
	@echo "Updating prompts submodule..."
	git submodule update --remote prompts
	@echo "Prompts submodule updated successfully!"

enable-submodule-status: ## Enable submodule status in git status output
	@if [ "$$(git config --get status.submodulesummary)" != "1" ]; then \
		echo "Enabling submodule status in git status..."; \
		git config status.submodulesummary 1; \
		echo "Submodule status enabled! Run 'git status' to see submodule details."; \
	else \
		echo "Submodule status is already enabled."; \
	fi

enable-recursive-push: ## Enable recursive submodule pushes
	@if [ "$$(git config --get push.recurseSubmodules)" != "on-demand" ]; then \
		echo "Enabling recursive submodule pushes..."; \
		git config --global push.recurseSubmodules on-demand; \
		echo "Recursive submodule pushes enabled!"; \
	else \
		echo "Recursive submodule pushes are already enabled."; \
	fi

fix-submodule-detached-head: ## Fix detached HEAD in prompts submodule
	@echo "Fixing detached HEAD in prompts submodule..."
	cd prompts && git checkout -b main origin/main 2>/dev/null || git checkout main
	@echo "Submodule HEAD fixed!"

commit-submodule-updates: ## Commit submodule reference changes
	@echo "Committing submodule reference changes..."
	git add prompts
	@if [ -n "$$(git status --porcelain)" ]; then \
		git commit -m "Update prompts submodule"; \
		echo "Submodule updates committed successfully!"; \
	else \
		echo "No submodule changes to commit."; \
	fi

push-with-submodules: ## Push commits and submodules recursively
	@echo "Pushing commits and submodules..."
	git push --recurse-submodules=on-demand
	@echo "Push completed successfully!"

commit: ## Stage and commit changes (interactive message)
	@echo "Staging all changes..."
	git add .
	@if [ -n "$$(git status --porcelain)" ]; then \
		echo "Enter commit message:"; \
		read -r commit_msg; \
		git commit -m "$$commit_msg"; \
		echo "Changes committed successfully!"; \
	else \
		echo "No changes to commit."; \
	fi

push: ## Push committed changes to remote
	@echo "Pushing to remote..."
	git push
	@echo "Changes pushed successfully!"

commit-push: commit push ## Commit and push changes (interactive message)

# Testing Targets

test-e2e: ## Run the dev-server E2E project (docs/graph specs) against `yarn start`
	# The "dev" Playwright project auto-starts the Docusaurus dev server (:3000).
	# PostHog/A-B specs live in a separate project — use `make test-posthog`.
	#
	# IMPORTANT: clear .docusaurus first. A prior `yarn build` (e.g. test-prod-checks)
	# writes PRODUCTION content artifacts there — and production EXCLUDES draft docs.
	# A dev server that reuses that stale cache serves a draft-less sidebar, which makes
	# draft-sidebar.spec.ts (and anything depending on drafts) fail spuriously. Clearing
	# guarantees the dev server regenerates the dev manifest (drafts kept in dev).
	( cd ${SITEROOT} && yarn docusaurus clear && yarn playwright test --project=dev )

validate-hero-anchors: ## Check the maintain-homepage-hero skill is in lockstep with the code (named symbols still exist)
	( cd ${SITEROOT} && node scripts/validate-hero-anchors.js )

validate-url-params: ## Check every query param read in src/ is registered in the URL-param registry (src/lib/url-params.ts)
	( cd ${SITEROOT} && node scripts/validate-url-params.js )

test-visual: ## Visual-regression: screenshot the hero (both A/B variants) across DPR 1+2, viewports, light+dark vs committed baselines
	# Catches retina-only / animation-frame artifacts (a compositing seam, a flash white-out, overflow)
	# that the functional DPR=1 specs are blind to. Compares against committed baselines.
	# Baselines are Chromium-rendered and OS-tagged (-darwin / -linux): if they're missing for this OS,
	# or after an INTENTIONAL visual change, regenerate with `make test-visual-update`.
	( cd ${SITEROOT} && yarn playwright test --project=visual )

test-visual-update: ## (Re)generate the visual-regression baselines (after an intentional hero/visual change)
	( cd ${SITEROOT} && yarn playwright test --project=visual --update-snapshots )

test-premium-e2e: ## Build (encrypted) + serve :4173, run the premium hard-gate e2e (V3 + round-trip), tear down
	# Premium gating MUST be verified against an ENCRYPTED production build: the encrypt
	# happens at MDX-compile only when STATICRYPT_PASSPHRASE is set, and the spec stubs
	# /api/unlock-key with that same value. Also runs V5 (verify-premium-encrypted) as a
	# pre-flight so a leak fails fast before the browser even starts.
	@( cd ${SITEROOT} && rm -rf node_modules/.cache .docusaurus build static/premium && \
		STATICRYPT_PASSPHRASE=e2e-premium-passphrase yarn build >/tmp/premium-e2e-build.log 2>&1 ) \
		|| { echo "build failed (see /tmp/premium-e2e-build.log)"; exit 1; }; \
	( cd ${SITEROOT} && node scripts/verify-premium-encrypted.js ) || { echo "✗ V5 premium gate failed"; exit 1; }; \
	lsof -ti:4173 | xargs kill -9 2>/dev/null || true; \
	( cd ${SITEROOT} && yarn serve --port 4173 --no-open >/tmp/premium-e2e-serve.log 2>&1 & ); \
	sleep 6; \
	( cd ${SITEROOT} && CI=1 E2E_PROD_BASE_URL=http://localhost:4173 npx playwright test --project=premium --reporter=list ); \
	rc=$$?; lsof -ti:4173 | xargs kill -9 2>/dev/null || true; exit $$rc

test-prod-checks: ## Build + serve on :4173, run the "prod" project (a11y + SEO), tear down
	# A11y + SEO scans MUST run against a real production build: build-only
	# transforms (e.g. the task-list aria-label rehype plugin) don't run in the
	# dev server. Builds once, serves :4173, runs the prod project, then stops it.
	@PK=$$(grep -E '^POSTHOG_KEY=' .env 2>/dev/null | head -1 | cut -d= -f2- | sed 's/[[:space:]]*#.*//' | tr -d ' "'\'''); \
	PH=$$(grep -E '^POSTHOG_HOST=' .env 2>/dev/null | head -1 | cut -d= -f2- | sed 's/[[:space:]]*#.*//' | tr -d ' "'\'''); \
	( cd ${SITEROOT} && POSTHOG_KEY=$$PK POSTHOG_HOST=$$PH yarn build >/tmp/prod-checks-build.log 2>&1 ) || { echo "build failed (see /tmp/prod-checks-build.log)"; exit 1; }; \
	lsof -ti:4173 | xargs kill -9 2>/dev/null || true; \
	( cd ${SITEROOT} && yarn serve --port 4173 --no-open >/tmp/prod-checks-serve.log 2>&1 & ); \
	sleep 6; \
	( cd ${SITEROOT} && CI=1 E2E_PROD_BASE_URL=http://localhost:4173 npx playwright test --project=prod --reporter=list ); \
	rc=$$?; \
	lsof -ti:4173 | xargs kill -9 2>/dev/null || true; \
	exit $$rc

test-a11y: ## Run the axe-core accessibility scan (a11y spec only, prod build, light + dark)
	@PK=$$(grep -E '^POSTHOG_KEY=' .env 2>/dev/null | head -1 | cut -d= -f2- | sed 's/[[:space:]]*#.*//' | tr -d ' "'\'''); \
	PH=$$(grep -E '^POSTHOG_HOST=' .env 2>/dev/null | head -1 | cut -d= -f2- | sed 's/[[:space:]]*#.*//' | tr -d ' "'\'''); \
	( cd ${SITEROOT} && POSTHOG_KEY=$$PK POSTHOG_HOST=$$PH yarn build >/tmp/a11y-build.log 2>&1 ) || { echo "build failed (see /tmp/a11y-build.log)"; exit 1; }; \
	lsof -ti:4173 | xargs kill -9 2>/dev/null || true; \
	( cd ${SITEROOT} && yarn serve --port 4173 --no-open >/tmp/a11y-serve.log 2>&1 & ); \
	sleep 6; \
	( cd ${SITEROOT} && CI=1 E2E_PROD_BASE_URL=http://localhost:4173 npx playwright test --project=prod accessibility --reporter=list ); \
	rc=$$?; lsof -ti:4173 | xargs kill -9 2>/dev/null || true; exit $$rc

test-seo: ## Run on-page SEO checks (prod build: title, description, canonical, OG, link text)
	@PK=$$(grep -E '^POSTHOG_KEY=' .env 2>/dev/null | head -1 | cut -d= -f2- | sed 's/[[:space:]]*#.*//' | tr -d ' "'\'''); \
	PH=$$(grep -E '^POSTHOG_HOST=' .env 2>/dev/null | head -1 | cut -d= -f2- | sed 's/[[:space:]]*#.*//' | tr -d ' "'\'''); \
	( cd ${SITEROOT} && POSTHOG_KEY=$$PK POSTHOG_HOST=$$PH yarn build >/tmp/seo-build.log 2>&1 ) || { echo "build failed (see /tmp/seo-build.log)"; exit 1; }; \
	lsof -ti:4173 | xargs kill -9 2>/dev/null || true; \
	( cd ${SITEROOT} && yarn serve --port 4173 --no-open >/tmp/seo-serve.log 2>&1 & ); \
	sleep 6; \
	( cd ${SITEROOT} && CI=1 E2E_PROD_BASE_URL=http://localhost:4173 npx playwright test --project=prod seo --reporter=list ); \
	rc=$$?; lsof -ti:4173 | xargs kill -9 2>/dev/null || true; exit $$rc

test-regression: ## Full regression: dev (graph) + prod (a11y/SEO) + PostHog/A-B projects
	# Runs all three E2E projects. dev boots :3000; prod + posthog build/serve :4173.
	# Run from the repo root; requires POSTHOG_KEY/HOST in .env.
	$(MAKE) test-e2e
	$(MAKE) test-prod-checks
	$(MAKE) test-posthog

test-e2e-headed: ## Run E2E tests in headed mode (see browser)
	( cd ${SITEROOT} && yarn test:e2e:headed )

test-e2e-ui: ## Run E2E tests with UI mode (interactive)
	( cd ${SITEROOT} && yarn test:e2e:ui )

test-e2e-debug: ## Run E2E tests in debug mode
	( cd ${SITEROOT} && yarn test:e2e:debug )

test-posthog: ## Validate PostHog events end-to-end against a production build
	# Builds with POSTHOG_TEST_MODE=1 (opts out of PostHog's bot filter so Playwright
	# events reach ingestion), serves the build, runs the posthog-events spec, then
	# tears down the server. Requires POSTHOG_KEY/HOST in .env.
	@# Robust per-var extraction (NOT `source .env` — some values contain shell-special
	@# chars that break sourcing and silently blank out later vars like POSTHOG_KEY).
	@PK=$$(grep -E '^POSTHOG_KEY=' .env | head -1 | cut -d= -f2- | sed 's/[[:space:]]*#.*//' | tr -d ' "'\'''); \
	PH=$$(grep -E '^POSTHOG_HOST=' .env | head -1 | cut -d= -f2- | sed 's/[[:space:]]*#.*//' | tr -d ' "'\'''); \
	if [ -z "$$PK" ]; then echo "POSTHOG_KEY not found in .env — aborting."; exit 1; fi; \
	echo "Building with POSTHOG_TEST_MODE=1 (key $${PK%$${PK#????}}…)…"; \
	( cd ${SITEROOT} && POSTHOG_KEY=$$PK POSTHOG_HOST=$$PH POSTHOG_TEST_MODE=1 yarn build >/tmp/posthog-build.log 2>&1 ) || { echo "build failed (see /tmp/posthog-build.log)"; exit 1; }; \
	lsof -ti:4173 | xargs kill -9 2>/dev/null || true; \
	( cd ${SITEROOT} && yarn serve --port 4173 --no-open >/tmp/posthog-serve.log 2>&1 & ); \
	sleep 6; \
	( cd ${SITEROOT} && CI=1 PH_BASE_URL=http://localhost:4173 npx playwright test --project=posthog-prod --reporter=list ); \
	rc=$$?; \
	lsof -ti:4173 | xargs kill -9 2>/dev/null || true; \
	exit $$rc

open-e2e-report: ## Open the E2E test HTML report in the default browser
	@if [ -f "${SITEROOT}/test-results/html-report/index.html" ]; then \
		open "${SITEROOT}/test-results/html-report/index.html"; \
		echo "E2E test report opened in browser"; \
	else \
		echo "E2E test report not found. Run 'yarn test:e2e' first."; \
		exit 1; \
	fi
