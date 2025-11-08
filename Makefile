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
.PHONY: help install add init-site check audit clean start clear build serve version deploy fix-frontmatter fix-blog-posts upgrade update-prompts enable-submodule-status enable-recursive-push fix-submodule-detached-head commit-submodule-updates push-with-submodules commit push commit-push

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
	true

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

start: ## Start the development server
	# Starts the development server, includes drafts and monitors and auto deploys updates
	( cd ${SITEROOT} && yarn start )

clear: ## Clear Docusaurus cache
	# Starts the development server, includes drafts and monitors and auto deploys updates
	( cd ${SITEROOT} && yarn clear )

build: ## Build the site for production
	# Bundles your website into static files for production.
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
