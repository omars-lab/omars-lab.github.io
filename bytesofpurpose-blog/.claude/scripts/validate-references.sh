#!/usr/bin/env bash
#
# validate-references.sh — Detect stale reference data files.
#
# Companion to the `refresh-references` skill. Read-only: never edits files.
#
# Posts render reference carousels from JSON files in src/data/references/. Each
# file is abstracted from one or more SOURCE notes in the personalbook repo and
# records that lineage in a `_provenance` block:
#
#   "_provenance": {
#     "source": "<repo-relative path in personalbook>",
#     "source_commit": "<commit the JSON was last reconciled against>",
#     "note": "..."
#   }
#
# A reference file is STALE when its source note has new commits AFTER
# source_commit — i.e. the source grew (likely new links/resources) but the JSON
# wasn't refreshed. This script flags those so you can run `refresh-references`.
#
# It checks:
#   - every references/*.json parses and (if it has cards) has a _provenance block
#   - _provenance.source EXISTS in the personalbook repo
#   - _provenance.source_commit is a real commit TOUCHING that source
#   - no commits touch the source AFTER source_commit (else: STALE warning)
#
# Exit status: 1 if any ERROR (malformed/missing source), else 0.
# Staleness is a WARNING (never fails) — it's a "go refresh" nudge, not a blocker.
#
# Usage:
#   .claude/scripts/validate-references.sh [REFERENCES_DIR] [PERSONALBOOK_REPO]

set -uo pipefail

BLOG_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
REF_DIR="${1:-$BLOG_ROOT/src/data/references}"

# personalbook repo: arg 2, else env, else a sensible sibling default.
PBOOK="${2:-${PERSONALBOOK_REPO:-/Users/omareid/Workspace/git/personalbook}}"

errors=0
warnings=0
stale=0
err()  { printf 'ERROR    %s\n   └─ %s\n' "$1" "$2"; errors=$((errors+1)); }
warn() { printf 'WARNING  %s\n   └─ %s\n' "$1" "$2"; warnings=$((warnings+1)); }
ok()   { printf 'OK       %s\n' "$1"; }

if [[ ! -d "$REF_DIR" ]]; then
  echo "No references dir at $REF_DIR — nothing to validate."
  exit 0
fi
if [[ ! -d "$PBOOK/.git" ]]; then
  err "personalbook repo not found" "looked at: $PBOOK (set PERSONALBOOK_REPO or pass arg 2)"
  exit 1
fi

# Small Python helper to read JSON fields (jq may not be installed).
read_json() { # <file> <python-expr-on-d>
  python3 -c "import json,sys
d=json.load(open(sys.argv[1]))
try:
    print(($2) or '')
except Exception:
    print('')
" "$1" 2>/dev/null
}

shopt -s nullglob
found_any=0
for f in "$REF_DIR"/*.json; do
  found_any=1
  base="$(basename "$f")"

  # Parses?
  if ! python3 -c "import json,sys; json.load(open(sys.argv[1]))" "$f" 2>/dev/null; then
    err "$base" "not valid JSON"
    continue
  fi

  # Count card categories (any top-level array key other than _provenance).
  ncards="$(read_json "$f" "sum(len(v) for k,v in d.items() if k!='_provenance' and isinstance(v,list))")"
  ncards="${ncards:-0}"

  src="$(read_json "$f" "d.get('_provenance',{}).get('source','')")"
  scommit="$(read_json "$f" "d.get('_provenance',{}).get('source_commit','')")"

  if [[ -z "$src" ]]; then
    if [[ "$ncards" -gt 0 ]]; then
      warn "$base" "has $ncards cards but no _provenance.source — can't track freshness"
    else
      ok "$base (empty, no provenance)"
    fi
    continue
  fi

  # Source must exist in personalbook.
  if [[ ! -f "$PBOOK/$src" ]]; then
    err "$base" "_provenance.source does not exist in personalbook: $src"
    continue
  fi

  if [[ -z "$scommit" ]]; then
    warn "$base" "no _provenance.source_commit — can't tell if stale (source: $src)"
    continue
  fi

  # source_commit must be a real commit that touched the source.
  if ! git -C "$PBOOK" cat-file -e "${scommit}^{commit}" 2>/dev/null; then
    err "$base" "_provenance.source_commit is not a real commit: $scommit"
    continue
  fi

  # Commits touching the source AFTER source_commit => stale.
  newer="$(git -C "$PBOOK" log --oneline "${scommit}..HEAD" -- "$src" 2>/dev/null | wc -l | tr -d ' ')"
  if [[ "${newer:-0}" -gt 0 ]]; then
    warn "$base" "STALE: $newer commit(s) touched '$src' since source_commit ${scommit:0:8}. Run refresh-references."
    stale=$((stale+1))
  else
    ok "$base (fresh — $ncards cards, source up to date)"
  fi
done

if [[ "$found_any" -eq 0 ]]; then
  echo "No *.json reference files in $REF_DIR — nothing to validate."
  exit 0
fi

echo
printf 'Summary: %d error(s), %d warning(s), %d stale file(s).\n' "$errors" "$warnings" "$stale"
[[ "$errors" -eq 0 ]]
