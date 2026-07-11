#!/bin/bash
# lib/selftest.sh — shared helpers for a hook's `--selftest` mode.
#
# THE CONTRACT: every validator hook (one that can BLOCK exit 2 or FLAG on stderr) ships a
# `--selftest` branch at the top of the file that PROVES it bites. The selftest feeds a crafted
# payload through the hook's own logic and asserts the outcome, then reports pass/fail. A shared
# runner (`make test-hooks`) invokes every hook with `--selftest`; the `validate-hook-tests`
# meta-guard fails if a non-exempt hook has no `--selftest`.
#
# A hook's selftest sources this file and uses the helpers:
#
#   source "$(dirname "$0")/lib/selftest.sh"
#   if [ "$1" = "--selftest" ]; then
#     # A planted-BAD payload that SHOULD trip the hook (exit 2, or a flag on stderr):
#     assert_blocks '{"tool_input":{"file_path":"/x/personalbook/note.md"}}'   # expects exit 2
#     # A CLEAN payload that should pass untouched:
#     assert_passes '{"tool_input":{"file_path":"/x/unrelated.txt"}}'          # expects exit 0, no flag
#     selftest_report; exit $?
#   fi
#
# `assert_blocks` / `assert_passes` re-invoke THIS hook (self) with the payload on stdin, in a
# subshell, and record the result. `assert_flags` is for warn-tier hooks that exit 0 but print a
# finding to stderr (they don't block, so "bite" == non-empty stderr matching a pattern).
#
# The self path is the calling hook: helpers use $SELFTEST_HOOK (set by the caller to "$0").

SELFTEST_PASS=0
SELFTEST_FAIL=0
SELFTEST_HOOK="${SELFTEST_HOOK:-$0}"

# Run the hook with the given stdin payload; capture exit code + stderr. Sets _rc and _err.
_run_hook() {
  local payload="$1"
  _err=$(printf '%s' "$payload" | bash "$SELFTEST_HOOK" 2>&1 >/dev/null)
  _rc=$?
}

# assert_blocks PAYLOAD [label] — the hook must EXIT 2 (a blocking hook refusing a bad write).
assert_blocks() {
  local payload="$1" label="${2:-blocks bad input}"
  _run_hook "$payload"
  if [ "$_rc" -eq 2 ]; then
    SELFTEST_PASS=$((SELFTEST_PASS + 1))
  else
    SELFTEST_FAIL=$((SELFTEST_FAIL + 1))
    echo "  ✗ $label: expected exit 2, got $_rc" >&2
  fi
}

# assert_flags PAYLOAD PATTERN [label] — a WARN-tier hook must exit 0 BUT print PATTERN to stderr
# (it doesn't block, but it must surface the finding).
assert_flags() {
  local payload="$1" pattern="$2" label="${3:-flags bad input}"
  _run_hook "$payload"
  if [ "$_rc" -eq 0 ] && printf '%s' "$_err" | grep -qE "$pattern"; then
    SELFTEST_PASS=$((SELFTEST_PASS + 1))
  else
    SELFTEST_FAIL=$((SELFTEST_FAIL + 1))
    echo "  ✗ $label: expected exit 0 + stderr matching /$pattern/, got rc=$_rc stderr=[${_err:0:120}]" >&2
  fi
}

# assert_passes PAYLOAD [label] — a CLEAN payload must exit 0 with NO finding on stderr.
assert_passes() {
  local payload="$1" label="${2:-passes clean input}"
  _run_hook "$payload"
  if [ "$_rc" -eq 0 ] && [ -z "$_err" ]; then
    SELFTEST_PASS=$((SELFTEST_PASS + 1))
  else
    SELFTEST_FAIL=$((SELFTEST_FAIL + 1))
    echo "  ✗ $label: expected exit 0 + empty stderr, got rc=$_rc stderr=[${_err:0:120}]" >&2
  fi
}

# assert_ignored PAYLOAD [label] — an out-of-scope payload must exit 0 (the hook doesn't apply).
# Same as assert_passes but named for clarity (a path the hook shouldn't even look at).
assert_ignored() { assert_passes "$1" "${2:-ignores out-of-scope input}"; }

selftest_report() {
  local name
  name=$(basename "$SELFTEST_HOOK")
  if [ "$SELFTEST_FAIL" -eq 0 ]; then
    echo "✅ $name: $SELFTEST_PASS selftest assertion(s) passed"
    return 0
  fi
  echo "❌ $name: $SELFTEST_FAIL of $((SELFTEST_PASS + SELFTEST_FAIL)) selftest assertion(s) FAILED" >&2
  return 1
}
