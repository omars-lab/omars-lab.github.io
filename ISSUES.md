# Issue index

Dedup index for tracked GitHub issues (mostly **deferred audit/review findings** — see the
"track DEFERRED findings as GitHub issues" tenet in `CLAUDE.md`). **Check this before filing
a new issue** so we don't create duplicates; if a matching open issue exists, comment on it
instead of opening another.

This file is **self-maintained**: the PostToolUse hook `.claude/hooks/gh-issue-index-hook.sh`
appends a row after every `gh issue create`. GitHub is the source of truth — if you close or
dedup an issue outside the normal flow, update its status here in the same step.

| # | Status | Finding-key | Title | Source | Screenshot |
|---|---|---|---|---|---|
<!-- gh-issue-index: new rows appended below this line by the hook -->
| 15 | closed (#23) | mobile-doc-footer-row-overflow | [#15](https://github.com/omars-lab/omars-lab.github.io/issues/15) doc-footer `.row` overflows article ~16px | audit-mobile 2026-06-03 | mobile-premium-share-row-and-pager.png |
| 16 | closed (#23) | mobile-changelog-tiny-text | [#16](https://github.com/omars-lab/omars-lab.github.io/issues/16) changelog text down to 10.4px | audit-mobile 2026-06-03 | mobile-changelog-small-text.png |
| 17 | closed (#23) | mobile-chrome-tap-targets-sub44 | [#17](https://github.com/omars-lab/omars-lab.github.io/issues/17) navbar/footer tap targets <44px | audit-mobile 2026-06-03 | (across mobile-*.png) |
| 18 | closed (#22) | mobile-premium-cta-height | [#18](https://github.com/omars-lab/omars-lab.github.io/issues/18) premium CTA 36px tall | audit-mobile 2026-06-03 | mobile-premium-share-row-and-pager.png |
| 19 | closed (#22) | mobile-pager-midword-break | [#19](https://github.com/omars-lab/omars-lab.github.io/issues/19) pager breaks "Entrepreneurship" mid-word | audit-mobile 2026-06-03 | mobile-premium-share-row-and-pager.png |
| 20 | closed (#22) | mobile-share-row-crammed | [#20](https://github.com/omars-lab/omars-lab.github.io/issues/20) share row crammed on premium card | audit-mobile 2026-06-03 | mobile-premium-share-row-and-pager.png |
| 21 | closed (#22) | desktop-doc-measure-and-whitespace | [#21](https://github.com/omars-lab/omars-lab.github.io/issues/21) doc line-length ~94ch + wide-screen whitespace | audit-desktop 2026-06-03 | desktop-docs-line-length-1440.png, desktop-docs-whitespace-2560.png |
| 27 | closed (#30) | stale-test-self-renamed-journey | [#27](https://github.com/omars-lab/omars-lab.github.io/issues/27) craft-self-split asserts navbar 'Self' (renamed to 'Journey') | frontend-design regression 2026-06-05 | (e2e, no screenshot) |
| 28 | closed (#30) | stale-test-ingress-welcome-dead-route | [#28](https://github.com/omars-lab/omars-lab.github.io/issues/28) ingress DOC_URL='/welcome' is a dead route | frontend-design regression 2026-06-05 | (e2e, no screenshot) |
| 29 | closed (#30) | flaky-test-ab-copy-drift | [#29](https://github.com/omars-lab/omars-lab.github.io/issues/29) support-ab-test copy drifts from live flag payload | frontend-design regression 2026-06-05 | (e2e, no screenshot) |

All screenshots: `~/Library/CloudStorage/Dropbox/bytesofpurpose-audits/2026-06-03/`
| 79 | open | _(set key)_ | [#79](https://github.com/omars-lab/omars-lab.github.io/issues/79) | _(set source)_ | _(set path)_ |
