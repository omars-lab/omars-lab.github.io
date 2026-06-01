#!/bin/bash
# Integration tests for the validate-links PostToolUse hook + the --fix mode.
#
# Drives .claude/hooks/validate-links-hook.sh with crafted PostToolUse JSON
# payloads (the shape Claude Code sends on stdin) and asserts exit codes +
# messages. Also exercises scripts/validate-links.js --fix / --error-only.
#
# Run: make test-link-hook   (or: bash test/integration/validate-links-hook.test.sh)
# No external deps beyond node + jq (already required by the hook).

set -u

# Resolve repo root regardless of where we're invoked from.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BLOG_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"          # bytesofpurpose-blog
PROJ_DIR="$(cd "$BLOG_DIR/.." && pwd)"               # repo root
HOOK="$PROJ_DIR/.claude/hooks/validate-links-hook.sh"
VALIDATOR="$BLOG_DIR/scripts/validate-links.js"

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

pass=0; fail=0
ok()   { printf '  ✅ %s\n' "$1"; pass=$((pass+1)); }
bad()  { printf '  ❌ %s\n' "$1"; fail=$((fail+1)); }

# Build a PostToolUse payload for a given file path.
payload() { printf '{"tool_input":{"file_path":"%s"},"cwd":"%s","tool_name":"Write"}' "$1" "$PROJ_DIR"; }

# Run the hook with a payload; capture exit code + combined output.
run_hook() {
  HOOK_OUT="$(payload "$1" | "$HOOK" 2>&1)"; HOOK_RC=$?
}

echo "validate-links hook — integration tests"
echo "  repo:   $PROJ_DIR"

# --- preflight -----------------------------------------------------------
[ -x "$HOOK" ]      || { echo "FATAL: hook not found/executable: $HOOK"; exit 1; }
[ -f "$VALIDATOR" ] || { echo "FATAL: validator not found: $VALIDATOR"; exit 1; }

# --- 1. clean .md → exit 0, silent --------------------------------------
f="$TMP/clean.md"
printf -- '---\ntitle: t\n---\n\nSee [Example](https://example.com) for details.\n' > "$f"
run_hook "$f"
[ "$HOOK_RC" -eq 0 ] && ok "clean file → exit 0" || bad "clean file → expected 0, got $HOOK_RC"
[ -z "$HOOK_OUT" ]   && ok "clean file → no output" || bad "clean file → expected silence, got: $HOOK_OUT"

# --- 2. bare URL (ERROR tier) → exit 2 + actionable message --------------
f="$TMP/bare.md"
printf -- '---\ntitle: t\n---\n\nSee https://example.com/foo/bar here.\n' > "$f"
run_hook "$f"
[ "$HOOK_RC" -eq 2 ] && ok "bare URL → exit 2 (blocks)" || bad "bare URL → expected 2, got $HOOK_RC"
echo "$HOOK_OUT" | grep -q -- '--fix' && ok "bare URL → message suggests --fix" || bad "bare URL → message missing --fix hint"
echo "$HOOK_OUT" | grep -qi 'ERROR' && ok "bare URL → flagged as ERROR tier" || bad "bare URL → not labeled ERROR"

# --- 3. url-as-text (ERROR tier) → exit 2 --------------------------------
f="$TMP/urltext.md"
printf -- '---\ntitle: t\n---\n\n[https://example.com/x](https://example.com/x)\n' > "$f"
run_hook "$f"
[ "$HOOK_RC" -eq 2 ] && ok "url-as-text → exit 2 (blocks)" || bad "url-as-text → expected 2, got $HOOK_RC"

# --- 4. long-url (WARN tier only) → exit 0, does NOT block ----------------
f="$TMP/longwarn.md"
long="https://example.com/$(printf 'a%.0s' {1..150})"
printf -- '---\ntitle: t\n---\n\n[ok](%s)\n' "$long" > "$f"
run_hook "$f"
[ "$HOOK_RC" -eq 0 ] && ok "WARN-only (long-url) → exit 0 (no block)" || bad "WARN-only → expected 0, got $HOOK_RC"

# --- 5. non-markdown file → ignored (exit 0) -----------------------------
f="$TMP/notes.txt"
printf -- 'See https://example.com/foo here.\n' > "$f"
run_hook "$f"
[ "$HOOK_RC" -eq 0 ] && ok "non-.md file → ignored (exit 0)" || bad "non-.md → expected 0, got $HOOK_RC"

# --- 6. missing file_path → exit 0 (defensive) ---------------------------
HOOK_OUT="$(printf '{"tool_input":{},"cwd":"%s"}' "$PROJ_DIR" | "$HOOK" 2>&1)"; HOOK_RC=$?
[ "$HOOK_RC" -eq 0 ] && ok "missing file_path → exit 0" || bad "missing file_path → expected 0, got $HOOK_RC"

# --- 7. --fix converts bare URL and clears ERROR tier --------------------
f="$TMP/fixme.md"
printf -- '---\ntitle: t\n---\n\n* https://github.com/ClearURLs/Addon\n' > "$f"
node "$VALIDATOR" --fix "$f" >/dev/null 2>&1
grep -q '\[GitHub — ClearURLs/Addon\](https://github.com/ClearURLs/Addon)' "$f" \
  && ok "--fix → bare URL became [GitHub — ClearURLs/Addon](…)" \
  || bad "--fix → expected tiered label, got: $(grep github "$f")"
node "$VALIDATOR" "$f" --error-only >/dev/null 2>&1
[ $? -eq 0 ] && ok "--fix → ERROR tier cleared afterward" || bad "--fix → ERROR tier still present"

# --- 8. --fix produces no MDX-unsafe <url> autolinks ---------------------
f="$TMP/tier3.md"
# A URL with a long, unreadable last segment forces Tier-3 (host-only) labeling.
printf -- '---\ntitle: t\n---\n\n* https://betterprogramming.pub/a-step-by-step-guide-to-create-homebrew-taps-from-github-repos-f33d3755ba74\n' > "$f"
node "$VALIDATOR" --fix "$f" >/dev/null 2>&1
! grep -qE '<https?://' "$f" && ok "--fix → no bare <url> autolinks (MDX-safe)" || bad "--fix → emitted an <url> autolink"
grep -qE '\]\(https?://' "$f" && ok "--fix → Tier-3 still a proper [label](url)" || bad "--fix → Tier-3 not a markdown link"

# --- summary -------------------------------------------------------------
echo ""
echo "  $pass passed, $fail failed"
[ "$fail" -eq 0 ]
