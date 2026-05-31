<wizard-report>

## PostHog Integration Summary

PostHog analytics has been integrated into the `bytesofpurpose-blog` Docusaurus v3 site. The integration uses `posthog-js` (browser SDK) initialised via a Docusaurus `clientModule`, with manual `posthog.capture()` calls added to the key interactive components. Exception autocapture is enabled globally.

### Changes made

| File | Change |
|------|--------|
| `bytesofpurpose-blog/package.json` | Added `posthog-js ^1.240.6` to `dependencies` |
| `bytesofpurpose-blog/.env` | Created with `POSTHOG_PROJECT_API_KEY`, `POSTHOG_KEY`, `POSTHOG_HOST` |
| `bytesofpurpose-blog/src/posthog.js` | Added `autocaptureExceptions: true` to `posthog.init` options |
| `bytesofpurpose-blog/src/components/VoteButton/index.tsx` | Added `blog post voted` capture on vote click |
| `bytesofpurpose-blog/src/components/SupportButton/index.tsx` | Added `support button clicked` capture on form submit |
| `bytesofpurpose-blog/src/components/Graph/useGraphInteractions.ts` | Added `graph node clicked` and `graph link copied` captures; added `posthog.captureException` in clipboard fallback |
| `bytesofpurpose-blog/src/components/Graph/GraphRenderer.tsx` | Added `graph expanded all` and `graph collapsed all` captures |
| `bytesofpurpose-blog/src/components/Changelog/Filters/ChangelogFilters.tsx` | Added `changelog filter changed` capture on every filter button click |
| `bytesofpurpose-blog/src/pages/changelog.tsx` | Added `changelog viewed` capture on page mount |

### Events

| Event name | Description | File |
|------------|-------------|------|
| `blog post voted` | User clicks a vote/reaction button on a blog post | `src/components/VoteButton/index.tsx` |
| `support button clicked` | User submits the PayPal donation form | `src/components/SupportButton/index.tsx` |
| `graph node clicked` | User clicks a node in an interactive graph | `src/components/Graph/useGraphInteractions.ts` |
| `graph link copied` | User copies an anchor link to a node or edge | `src/components/Graph/useGraphInteractions.ts` |
| `graph expanded all` | User expands all nodes in a graph | `src/components/Graph/GraphRenderer.tsx` |
| `graph collapsed all` | User collapses all nodes in a graph | `src/components/Graph/GraphRenderer.tsx` |
| `changelog filter changed` | User changes a filter on the changelog page | `src/components/Changelog/Filters/ChangelogFilters.tsx` |
| `changelog viewed` | User lands on the changelog page | `src/pages/changelog.tsx` |

### Dashboard and insights

- [PostHog Dashboard — Blog Analytics](/dashboard/1650838)
  - [Blog post votes over time](/insights/0nS3mDWI) — trends line chart of `blog post voted`
  - [Support button clicks](/insights/fJOwREIP) — total count of `support button clicked`
  - [Graph interaction activity](/insights/euf8iFG3) — multi-series trends of all graph events
  - [Changelog engagement funnel](/insights/SRRfdwSn) — funnel from `changelog viewed` → `changelog filter changed`
  - [Changelog filter usage by type](/insights/0dFpoA2k) — bar chart of `changelog filter changed` broken down by `filter_type`

</wizard-report>
