SHELL := /bin/bash
MAKEFILE_DIR := $(shell dirname $(realpath $(lastword $(MAKEFILE_LIST))))
SITENAME := bytesofpurpose-blog
SITEROOT := ${MAKEFILE_DIR}/${SITENAME}

install:
	# https://docusaurus.io/docs/installation
	(npm list -g --depth=0 | sed -E 's/(├|└)── //g' | grep -q yarn) || npm install -g yarn

init-site:
	test -d ${SITEROOT} || npx @docusaurus/init@latest init ${SITENAME} classic --typescript

start:
	# Starts the development server.
	( cd ${SITEROOT} && yarn start )

build:
	# Bundles your website into static files for production.
	( cd ${SITEROOT} && yarn build )

serve: build
	# Serves the built website locally.
	( cd ${SITEROOT} && yarn serve )

deploy:
	# Publishes the website to GitHub pages.
	( cd ${SITEROOT} && USE_SSH=true GIT_USER=omar_eid21@yahoo.com DEPLOYMENT_BRANCH=gh-pages yarn deploy )
