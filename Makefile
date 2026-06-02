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
.PHONY: help install add init-site check typecheck audit clean start start-prod start-prod-port clear build serve version deploy fix-frontmatter fix-blog-posts upgrade update-prompts enable-submodule-status enable-recursive-push fix-submodule-detached-head commit-submodule-updates push-with-submodules commit push commit-push test-e2e test-e2e-headed test-e2e-ui test-e2e-debug open-e2e-report storybook build-storybook secret-scan install-hooks test-posthog generate-blog-stub blog-pending

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

init-site: ## Initialize a new Docusaurus site
	test -d ${SITEROOT} || npx @docusaurus/init@latest init ${SITENAME} classic --typescript

check: ## Check MDX files for issues
	( cd ${SITEROOT} && npx docusaurus-mdx-checker )

typecheck: ## Type-check the site with tsc (swizzled theme + components + pages)
	( cd ${SITEROOT} && yarn typecheck )

validate-links: ## Lint markdown/MDX source for bare/long/tracking/generic links
	( cd ${SITEROOT} && node scripts/validate-links.js $(DIRS) )

validate-structure: ## Lint the topic-based docs IA contract (absolute slugs, categories, depth, naming)
	@# exit 2 == ERROR-tier (fail the gate); exit 1 == warn-only (advisory, pass).
	@( cd ${SITEROOT} && node scripts/validate-docs-structure.js ); rc=$$?; \
		if [ $$rc -eq 2 ]; then echo "✗ structure: ERROR-tier violations — see above."; exit 1; fi; \
		exit 0

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
start: build-storybook ## Start the development server (use PORT=8080 to specify a custom port)
	# Starts the development server, includes drafts and monitors and auto deploys updates
	# Builds Storybook first so it's available at /storybook/
	# Changelog data is auto-generated via npm 'prestart' hook before starting
	( cd ${SITEROOT} && yarn start --port ${PORT} )

PORT ?= 3000
start-prod: ## Start the development server with NODE_ENV=production
	# Starts the development server in production mode, includes drafts and monitors and auto deploys updates
	( cd ${SITEROOT} && NODE_ENV=production yarn start --port ${PORT} )

clear: ## Clear Docusaurus cache
	# Starts the development server, includes drafts and monitors and auto deploys updates
	( cd ${SITEROOT} && yarn clear )

build: build-storybook ## Build the site for production
	# Bundles your website into static files for production.
	# Changelog data is auto-generated via npm 'prebuild' hook before building
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

deploy: secret-scan ## Deploy the site to GitHub Pages (runs a secret scan first)
	# Publishes the website to GitHub pages.
	( cd ${SITEROOT} && USE_SSH=true GIT_USER=omar_eid21@yahoo.com DEPLOYMENT_BRANCH=gh-pages yarn deploy )

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
	( cd ${SITEROOT} && yarn playwright test --project=dev )

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
