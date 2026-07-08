#!/bin/bash
# Stop hook: the HEAVY mermaid legibility check, run once at session end (not per edit).
#
# The cheap per-edit hook (validate-mermaid-complexity) scores a fence by TEXT metrics. This
# one actually HEADLESS-RENDERS the mermaid diagrams CHANGED this session (via Playwright) and
# flags what text can't see: a diagram that fails to render, whose nodes overlap, or that
# renders far too tall/wide to read. It is git-gated + scoped to changed files so it only runs
# when a session actually touched a design/blog diagram, and stays fast otherwise. Advisory:
# always exits 0, never blocks the Stop.

proj="${CLAUDE_PROJECT_DIR:-$(git -C "$(pwd)" rev-parse --show-toplevel 2>/dev/null)}"
[ -n "$proj" ] || exit 0
script="$proj/bytesofpurpose-blog/scripts/validate-mermaid-render.mjs"
[ -f "$script" ] || exit 0

# Gate 1: did this session change a design/blog/docs .md(x) that CONTAINS a mermaid fence?
# (Cheap git check first — never launch Chromium unless a real diagram changed.) Includes
# untracked (new) files, which `git diff HEAD` omits — a brand-new diagram post must count.
changed=$(
  {
    git -C "$proj" diff --name-only HEAD -- bytesofpurpose-blog 2>/dev/null
    git -C "$proj" ls-files --others --exclude-standard -- bytesofpurpose-blog 2>/dev/null
  } \
  | grep -E '\.(md|mdx)$' \
  | grep -E '/(designs|blog|docs)/' \
  | grep -v '/_' | sort -u || true)
[ -n "$changed" ] || exit 0

# Of those, keep only the ones that actually contain a ```mermaid fence.
have_mermaid=""
while IFS= read -r f; do
  [ -n "$f" ] || continue
  if grep -q '```mermaid' "$proj/$f" 2>/dev/null; then
    have_mermaid="yes"
    break
  fi
done <<< "$changed"
[ -n "$have_mermaid" ] || exit 0

# Run the heavy render check on just the changed files. It prints its own warnings to stderr;
# surface them, but never block (exit 0 regardless).
out=$(cd "$proj/bytesofpurpose-blog" && node "$script" --changed 2>&1)
case "$out" in
  *"[warn:mermaid-render-"*)
    printf '%s\n' "$out" >&2
    printf '\n(heavy mermaid render check, session end — advisory, does not block.)\n' >&2
    ;;
esac

exit 0
