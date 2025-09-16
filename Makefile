SHELL := /bin/bash
MAKEFILE_DIR := $(shell dirname $(realpath $(lastword $(MAKEFILE_LIST))))
SITENAME := bytesofpurpose-blog
SITEROOT := ${MAKEFILE_DIR}/${SITENAME}

install:
	# https://docusaurus.io/docs/installation
	((npm list -g --depth=0 | sed -E 's/(├|└)── //g' | grep -q yarn) || which yarn) || npm install -g yarn
	( cd ${SITEROOT} && yarn install )
	
add:
	# ( cd ${SITEROOT} && yarn add @docusaurus/plugin-svgr )
	( cd ${SITEROOT} && yarn add react-gist )
	true

init-site:
	test -d ${SITEROOT} || npx @docusaurus/init@latest init ${SITENAME} classic --typescript

check:
	( cd ${SITEROOT} && npx docusaurus-mdx-checker )

audit:
	# ( cd ${SITEROOT} && npx docusaurus-audit )
	( cd ${SITEROOT} && npm audit )

clean:
	( cd ${SITEROOT} && yarn clear )
	( cd ${SITEROOT} && rm -rf node_modules yarn.lock package-lock.json )

start:
	# Starts the development server, includes drafts and monitors and auto deploys updates
	( cd ${SITEROOT} && yarn start )

clear:
	# Starts the development server, includes drafts and monitors and auto deploys updates
	( cd ${SITEROOT} && yarn clear )

build:
	# Bundles your website into static files for production.
	( cd ${SITEROOT} && yarn build )

serve: build
	# Serves the built website locally.
	( cd ${SITEROOT} && yarn serve )

version:
	( cd ${SITEROOT} && npx docusaurus --version )

deploy:
	# Publishes the website to GitHub pages.
	( cd ${SITEROOT} && USE_SSH=true GIT_USER=omar_eid21@yahoo.com DEPLOYMENT_BRANCH=gh-pages yarn deploy )

fix-frontmatter:
	gemini --approval-mode auto_edit --allowed-tools Edit,WriteFile -p "Follow the instructions in @./bytesofpurpose-blog/prompts/fix-frontmatter.md"

upgrade:
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
