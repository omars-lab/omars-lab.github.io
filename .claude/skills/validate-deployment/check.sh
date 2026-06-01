#!/usr/bin/env bash
# Post-deploy smoke checks for the Bytes of Purpose blog.
#
# Why this is more than "curl -I": GitHub Pages + Cloudflare serve the OLD build
# from cached edges for 1-2 min after a deploy, returning HTTP 200 the whole time.
# So "200 + the word posthog appears" is a FALSE success signal — it passes on a
# stale edge. These checks assert build-specific markers and RETRY through the
# propagation window before declaring failure.
set -uo pipefail

URL="${1:-https://blog.bytesofpurpose.com}"
# Optional 2nd arg: the commit SHA you expect to be live (defaults to local HEAD).
EXPECT_SHA="${2:-$(git rev-parse --short HEAD 2>/dev/null || true)}"
fail=0

# Retry helper: run a check up to ~120s (24 x 5s) before giving up, to ride out
# GitHub Pages / Cloudflare propagation lag. Usage: retry <cmd...>
retry() {
  local i
  for i in $(seq 1 24); do
    if "$@" >/dev/null 2>&1; then return 0; fi
    sleep 5
  done
  return 1
}

echo "🔎 Validating $URL"
[ -n "$EXPECT_SHA" ] && echo "   expecting deploy based on commit: $EXPECT_SHA"
echo

# 1. Reachable & public ------------------------------------------------------
headers="$(curl -sS -I --max-time 20 "$URL" 2>&1)"
status="$(printf '%s' "$headers" | grep -m1 -oE 'HTTP/[0-9.]+ [0-9]+' | grep -oE '[0-9]+$')"
if [ "$status" = "200" ]; then
  echo "✅ Reachable: HTTP 200"
else
  echo "❌ Unexpected status: ${status:-no response}"
  fail=1
fi

if printf '%s' "$headers" | grep -qi 'www-authenticate: *Cloudflare-Access'; then
  echo "❌ Cloudflare Access is ON — site is NOT public (login required)."
  echo "   Fix: manage-cloudflare-access → make-public blog"
  fail=1
else
  echo "✅ Public: no Cloudflare Access challenge."
fi

html="$(curl -sS --max-time 20 "$URL" 2>/dev/null)"

# 2. PostHog wired -----------------------------------------------------------
# NOTE: PostHog is loaded from a JS chunk (assets/js/main.*.js), NOT inline in
# index.html — so grepping the HTML for "posthog" returns 0 even on a GOOD build
# (this bit the old check). Check the actual bundle: find the main chunk and
# confirm the phc_ project key is in it.
main_js="$(printf '%s' "$html" | grep -oE '/assets/js/main\.[a-z0-9]+\.js' | head -1)"
if [ -n "$main_js" ] && curl -sS --max-time 20 "$URL$main_js" 2>/dev/null | grep -q 'phc_'; then
  echo "✅ PostHog: project key present in $main_js (analytics built in)."
else
  echo "⚠️  PostHog: phc_ key NOT found in the main JS bundle. Likely POSTHOG_KEY"
  echo "    was empty at BUILD time (the .env 'source' trap — see deploy-site)."
  fail=1
fi

# 3. og:image / twitter:image resolve AND are reachable ----------------------
# A 404 social card = blank link preview. Assert the HTML points at an image and
# that the image actually serves 200 (retry — new asset paths lag the most).
ogimg="$(printf '%s' "$html" | grep -oE 'og:image" content="[^"]*"' | head -1 | sed -E 's/.*content="([^"]*)".*/\1/')"
if [ -n "$ogimg" ]; then
  echo "ℹ️  og:image → $ogimg"
  if retry bash -c "[ \"\$(curl -s -o /dev/null -w '%{http_code}' '$ogimg')\" = 200 ]"; then
    echo "✅ og:image is reachable (HTTP 200)."
  else
    echo "❌ og:image 404/unreachable after ~120s — social previews will be blank."
    fail=1
  fi
else
  echo "⚠️  No og:image meta tag found."
fi

# 4. Structured data present & parses ----------------------------------------
# Homepage carries WebSite/Organization JSON-LD; a build regression silently
# drops it. Extract the first ld+json block (python handles the multiline/escaped
# content a line-based grep can't) and confirm it parses as JSON.
ld="$(printf '%s' "$html" | python3 -c '
import sys, re
m = re.search(r"<script[^>]*application/ld\+json[^>]*>(.*?)</script>", sys.stdin.read(), re.S)
print(m.group(1) if m else "")' 2>/dev/null)"
if [ -n "$ld" ] && printf '%s' "$ld" | python3 -c 'import sys,json;json.load(sys.stdin)' 2>/dev/null; then
  echo "✅ JSON-LD: present and valid."
else
  echo "⚠️  JSON-LD: missing or not valid JSON on the homepage."
fi

# 5. Freshness / which commit is live ----------------------------------------
lm="$(printf '%s' "$headers" | grep -i '^last-modified:' | sed 's/^[^:]*: *//')"
age="$(printf '%s' "$headers" | grep -i '^age:' | sed 's/^[^:]*: *//')"
[ -n "$lm" ] && echo "ℹ️  last-modified: $lm"
[ -n "$age" ] && echo "ℹ️  CF cache age: ${age}s"
if [ -n "$EXPECT_SHA" ]; then
  # The remote gh-pages commit message records the source SHA it was built from
  # ("Deploy website - based on <40-char sha>"). yarn deploy does NOT update your
  # local gh-pages ref, so always read origin/gh-pages, not the local branch.
  git fetch -q origin gh-pages 2>/dev/null || true
  remote_full="$(git log -1 --format=%s origin/gh-pages 2>/dev/null | grep -oE '[0-9a-f]{40}')"
  if [ -n "$remote_full" ]; then
    # Compare on the shorter of the two prefixes so 7- vs 8-char SHAs still match.
    n="${#EXPECT_SHA}"; [ "$n" -gt 12 ] && n=12
    if [ "$(printf '%s' "$remote_full" | cut -c1-"$n")" = "$(printf '%s' "$EXPECT_SHA" | cut -c1-"$n")" ]; then
      echo "✅ gh-pages built from ${remote_full:0:8} (matches expected $EXPECT_SHA)."
    else
      echo "⚠️  gh-pages built from ${remote_full:0:8} but expected $EXPECT_SHA"
      echo "    (did the deploy push? or is your local HEAD ahead of what shipped?)"
    fi
  fi
fi

echo
if [ "$fail" -eq 0 ]; then
  echo "✅ Deployment looks good."
else
  echo "❌ Deployment has issues (see above)."
  exit 1
fi
