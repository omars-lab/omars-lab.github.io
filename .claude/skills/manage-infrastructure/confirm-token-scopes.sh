#!/usr/bin/env bash
# confirm-token-scopes.sh — prove (by behaviour) what CF_API_TOKEN can actually do.
#
# Cloudflare API tokens CANNOT introspect their own permissions unless they carry
# `User -> API Tokens -> Read` (ours does not — that call returns 9109). So the
# authoritative way to confirm scope is a CAPABILITY PROBE: hit one endpoint per
# permission and read 200/OK vs 403/10000. This is what this script does.
#
# Usage:  bash .claude/skills/manage-cloudflare-access/confirm-token-scopes.sh
# Reads CF_API_TOKEN from the repo-root .env (same per-var extraction the Makefile
# uses, so .env's shell-special chars can't blank it).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
ACCT=e22f4531704a3141ddb150ac47eabc87
TOKEN=$(grep -E '^CF_API_TOKEN=' "$ROOT/.env" | cut -d= -f2- | sed 's/[[:space:]]*#.*//' | tr -d ' "'"'"'')
[ -n "$TOKEN" ] || { echo "CF_API_TOKEN not found in $ROOT/.env" >&2; exit 1; }

api() { curl -sS -H "Authorization: Bearer $TOKEN" "$1"; }
verdict() { python3 -c 'import sys,json
d=json.load(sys.stdin)
print("OK" if d.get("success") else "code "+str((d.get("errors") or [{}])[0].get("code")))'; }

echo "== token status =="
api "https://api.cloudflare.com/client/v4/user/tokens/verify" \
  | python3 -c 'import sys,json; print(json.load(sys.stdin).get("result",{}).get("status","?"))'

echo
echo "== capability probes (permission -> result) =="
ZONE=$(api "https://api.cloudflare.com/client/v4/zones?name=bytesofpurpose.com" \
  | python3 -c 'import sys,json; d=json.load(sys.stdin); print(d["result"][0]["id"] if d.get("success") and d.get("result") else "")' 2>/dev/null || true)

printf "  %-34s %s\n" "Access: Apps (have already)"     "$(api "https://api.cloudflare.com/client/v4/accounts/$ACCT/access/apps"     | verdict)"
printf "  %-34s %s\n" "Workers Scripts:Edit (#19 need)" "$(api "https://api.cloudflare.com/client/v4/accounts/$ACCT/workers/scripts" | verdict)"
if [ -n "$ZONE" ]; then
  printf "  %-34s %s\n" "Workers Routes:Edit (#19 need)" "$(api "https://api.cloudflare.com/client/v4/zones/$ZONE/workers/routes" | verdict)"
else
  printf "  %-34s %s\n" "Workers Routes:Edit (#19 need)" "zone unreadable"
fi

echo
echo "OK = scope present · code 10000/9109 = scope MISSING (add it in the dashboard)"
echo "When BOTH Workers rows read OK, #19 is done and you can deploy the Worker."
