#!/bin/bash
# Stop hook: if this session touched PERSONAL / CAREER / EMPLOYER-CONFIDENTIAL or premium:true
# content, nudge to run the privacy-review skill BEFORE anything gets published/deployed, so a
# sensitive doc is never shipped by accident. The load-bearing lesson: premium gating encrypts the
# BODY only; the title, slug/URL, description, teaser, tags, and any listing README ship in CLEAR.
# Premium hides the CONTENT, not the FACT. Advisory; always exits 0 (never blocks).
#
# It reads the session transcript (path on stdin from the Stop payload) and fires ONLY when
# sensitive-content signals appear AND the privacy-review skill was NOT already run this session.
#
# --selftest (MUST be BEFORE `input=$(cat)`, or it hangs waiting on stdin): proves the hook FLAGS a
# transcript with a premium/career signal, and IGNORES a transcript with neither.

if [ "$1" = "--selftest" ]; then
  SELFTEST_HOOK="$0"
  # shellcheck source=lib/selftest.sh
  source "$(dirname "$0")/lib/selftest.sh"

  # Helper: write a temp transcript file and emit the Stop payload pointing at it.
  _mk() { local f; f=$(mktemp); printf '%s' "$1" > "$f"; printf '{"transcript_path":"%s"}' "$f"; }

  # BAD (should FLAG): a transcript that marks a doc premium AND is about a career/job doc, with NO
  # privacy-review mention → the hook must print the reminder to stderr.
  assert_flags "$(_mk 'editing docs/journey/career-development/foo.mdx with premium: true and job-search outreach')" \
    'privacy.review' 'flags premium career content with no review'

  # CLEAN (should IGNORE): an unrelated transcript (no sensitive signal) → stays quiet.
  assert_ignored "$(_mk 'refactored the FlowDiagram component and fixed a mermaid selector')" \
    'ignores unrelated session'

  # CLEAN (should IGNORE): sensitive signal present BUT the privacy-review skill already ran → quiet.
  assert_ignored "$(_mk 'career-development premium: true doc; ran privacy-review skill and kept it off the repo')" \
    'ignores when privacy-review already ran'

  selftest_report; exit $?
fi

input=$(cat)
transcript=$(printf '%s' "$input" | jq -r '.transcript_path // empty')

# No transcript → can't tell; stay silent.
[ -n "$transcript" ] && [ -f "$transcript" ] || exit 0

# Did this session touch SENSITIVE content? Signals: a premium mark, or career/job-search/personal
# vocabulary near content edits. Kept broad on purpose (a false nudge is cheap; a missed leak is not).
if ! grep -qiE 'premium:[[:space:]]*true|premium_teaser|career-development|job.?search|\brecruiter\b|outreach|(personal|confidential)[- ]?(finance|health|family|material)|resume|cover letter' "$transcript" 2>/dev/null; then
  exit 0
fi

# Already reviewed this session? If the privacy-review skill was invoked/referenced, assume the
# loop closed and stay quiet to avoid nagging.
if grep -qiE 'privacy.review|could an employer see|premium hides the .*not the fact' "$transcript" 2>/dev/null; then
  exit 0
fi

cat >&2 <<'EOF'
🔐 privacy-review reminder: this session touched sensitive/personal/premium content.
   Before publishing, un-drafting, or deploying it, run the privacy-review skill.
   Remember the mental model: premium gating encrypts the BODY only. The title, slug/URL,
   description, premium_teaser, tags, and any README that LISTS the doc all ship PUBLIC in
   clear. Premium hides the CONTENT, not the FACT (a gated "Targeting Director at LangChain"
   doc still broadcasts the job search via its title + URL + teaser).
   Two passes: (1) audit the clear-fields for leaks; (2) read it as an employer / competitor /
   recruiter / search engine. Then pick a disposition: publish · de-identify into a case study ·
   draft:true · or keep OFF the repo (local file + purge git). This is advisory; it will not block.
EOF
exit 0
