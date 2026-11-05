#!/usr/bin/env bash
# Deploy the blog so a paid page can never go out unlocked.
#
# Order matters, and it is the whole point of this script:
#   1. clear the build caches (a stale cache skips the step that locks paid pages),
#   2. build once, with the passphrase,
#   3. check that build: no paid page's text in it, every lock file present,
#   4. only then push THAT build, with `docusaurus deploy --skip-build`.
# Before 2026-11-05 `make deploy` let `docusaurus deploy` build and push in one go and
# checked afterwards, so a stale cache shipped the paid test page unlocked once.
#
# Usage: deploy.sh [--dry-run]     --dry-run stops after step 3 and pushes nothing.
# Called by `make deploy`, after the secret scan and the storybook build.
set -euo pipefail

DRY_RUN=0
[ "${1:-}" = "--dry-run" ] && DRY_RUN=1

ROOT=$(git rev-parse --show-toplevel)
SITE="$ROOT/bytesofpurpose-blog"

# .env is gitignored, so a git worktree has none. Use this checkout's, else the main checkout's.
ENV_FILE="$ROOT/.env"
if [ ! -f "$ENV_FILE" ]; then
  MAIN=$(dirname "$(git rev-parse --path-format=absolute --git-common-dir)")
  ENV_FILE="$MAIN/.env"
fi
if [ -f "$ENV_FILE" ]; then echo "Reading build values from $ENV_FILE"; else echo "⚠️  no .env found"; fi

# Read one value from .env without sourcing it (some values break `source`). Never printed.
xenv() {
  [ -f "$ENV_FILE" ] || return 0
  grep -E "^$1=" "$ENV_FILE" | head -1 | cut -d= -f2- | sed 's/[[:space:]]*#.*//' | tr -d ' "'\'''
}
SP=$(xenv STATICRYPT_PASSPHRASE)
PK=$(xenv POSTHOG_KEY)
PH=$(xenv POSTHOG_HOST)
unset POSTHOG_TEST_MODE

# How many paid pages exist. If the count itself fails, stop: an error must never read as 0.
PAID=$(cd "$SITE" && node scripts/lib/premium-docs.js --count) \
  || { echo "🔴 could not count paid pages; nothing was built or pushed."; exit 1; }
if [ "$PAID" != "0" ] && [ -z "$SP" ]; then
  echo "🔴 $PAID paid page(s) but no STATICRYPT_PASSPHRASE in .env; they would ship unlocked. Nothing was pushed."
  exit 1
fi
[ -n "$PK" ] || echo "⚠️  POSTHOG_KEY empty: this build will have no analytics."

# 1. Clear the caches a production build reads. Only the production webpack caches:
#    node_modules may be shared with running dev servers, which use the development ones.
rm -rf "$SITE/.docusaurus" "$SITE/build"
rm -rf "$SITE"/node_modules/.cache/webpack/*-production-*

# 2. Build once.
( cd "$SITE" && STATICRYPT_PASSPHRASE="$SP" POSTHOG_KEY="$PK" POSTHOG_HOST="$PH" yarn build ) \
  || { echo "🔴 build failed; nothing was pushed."; exit 2; }

# 3. Check the build that is about to go out.
( cd "$SITE" && STATICRYPT_PASSPHRASE="$SP" node scripts/verify-premium-encrypted.js ) \
  || { echo "🔴 a paid page is not locked in this build; nothing was pushed."; exit 2; }
echo "✅ paid pages locked in build/ ($PAID paid page(s))."

if [ "$DRY_RUN" = 1 ]; then
  echo "Dry run: stopped before pushing."
  exit 0
fi

# 4. Push exactly the build that was checked. --skip-build stops docusaurus from building again.
#    The push commits in a fresh clone of gh-pages, which runs the global gitleaks pre-commit
#    hook; GITLEAKS_CONFIG points it at this repo's settings (same allowlist, still fail-closed).
( cd "$SITE" && GITLEAKS_CONFIG="$ROOT/.gitleaks.toml" \
    USE_SSH=true GIT_USER=omar_eid21@yahoo.com DEPLOYMENT_BRANCH=gh-pages \
    yarn deploy --skip-build ) \
  || { echo "🔴 push to gh-pages failed (see above)."; exit 2; }
