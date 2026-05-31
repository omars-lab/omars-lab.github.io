#!/usr/bin/env bash
# Post-deploy smoke checks for the Bytes of Purpose blog.
set -uo pipefail

URL="${1:-https://blog.bytesofpurpose.com}"
fail=0

echo "🔎 Validating $URL"
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

# 2. PostHog beacon present --------------------------------------------------
html="$(curl -sS --max-time 20 "$URL" 2>/dev/null)"
if printf '%s' "$html" | grep -qi 'posthog'; then
  echo "✅ PostHog: referenced in served page."
else
  echo "⚠️  PostHog: NOT found in HTML. Either POSTHOG_KEY was unset at build time,"
  echo "    or the reference is only in a lazy chunk (verify with the Playwright spec)."
fi

# 3. Freshness hint ----------------------------------------------------------
lm="$(printf '%s' "$headers" | grep -i '^last-modified:' | sed 's/^[^:]*: *//')"
age="$(printf '%s' "$headers" | grep -i '^age:' | sed 's/^[^:]*: *//')"
[ -n "$lm" ] && echo "ℹ️  last-modified: $lm"
[ -n "$age" ] && echo "ℹ️  CF cache age: ${age}s"

echo
if [ "$fail" -eq 0 ]; then
  echo "✅ Deployment looks good."
else
  echo "❌ Deployment has issues (see above)."
  exit 1
fi
