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
.PHONY: help install add init-site check audit clean start start-prod start-prod-port clear build serve version deploy fix-frontmatter fix-blog-posts upgrade update-prompts enable-submodule-status enable-recursive-push fix-submodule-detached-head commit-submodule-updates push-with-submodules commit push commit-push test-e2e test-e2e-headed test-e2e-ui test-e2e-debug open-e2e-report storybook build-storybook

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

deploy: ## Deploy the site to GitHub Pages
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

test-e2e: ## Run E2E tests with Playwright
	( cd ${SITEROOT} && yarn test:e2e )

test-e2e-headed: ## Run E2E tests in headed mode (see browser)
	( cd ${SITEROOT} && yarn test:e2e:headed )

test-e2e-ui: ## Run E2E tests with UI mode (interactive)
	( cd ${SITEROOT} && yarn test:e2e:ui )

test-e2e-debug: ## Run E2E tests in debug mode
	( cd ${SITEROOT} && yarn test:e2e:debug )

open-e2e-report: ## Open the E2E test HTML report in the default browser
	@if [ -f "${SITEROOT}/test-results/html-report/index.html" ]; then \
		open "${SITEROOT}/test-results/html-report/index.html"; \
		echo "E2E test report opened in browser"; \
	else \
		echo "E2E test report not found. Run 'yarn test:e2e' first."; \
		exit 1; \
	fi
