<!--
  Claude task archive — append-only log of completed Claude Code tasks.

  CONVENTION (see root CLAUDE.md): when 10+ tasks are completed, append a new
  batch here, then delete those tasks from the task list. This file is the
  durable record so the live task list stays short.

  FORMAT — one "## " batch per archive event; the changelog generator
  (scripts/generate-changelog-data.js) splits on these headings and renders one
  changelog card per batch. Keep the structure:

  ## YYYY-MM-DD — Short batch title
  <!-- meta: type=feature category=development priority=medium component=Claude -->
  One-sentence summary of the batch (becomes the card description).

  - Completed task subject
  - Completed task subject
  ...

  Defaults if meta omitted: type=chore, category=development, priority=medium,
  component=Claude. Date drives the card's execution/inception date.
-->

## 2026-06-01 — Blog modernization + regression / a11y / SEO harness
<!-- meta: type=feature category=development priority=high component=Site -->
Modernized the site's front door (tokens, fonts, hero, cards, latest-posts strip), fixed all Lighthouse a11y/SEO bugs to 100, and stood up an always-on regression harness (Playwright projects + axe a11y + SEO gates) — then burned down the resulting test/a11y debt.

- Fix the two Lighthouse a11y bugs (image-alt + heading-order)
- Add design-token layer + Inter font to custom.css
- Redesign homepage hero + feature cards
- Add Latest posts strip to homepage
- Polish blog index + navbar (CSS-only)
- Verify: build, Lighthouse re-run, e2e, deploy
- Set up regression testing for the site (3-project Playwright model)
- Set up proper accessibility scans (axe-core WCAG 2 A/AA, light + dark)
- Set up SEO scan / enhancement (on-page checks + Lighthouse)
- Fix 3 flaky graph-selection-state E2E cases (deep-link edge selection)
- Burn down baselined a11y debt (code-token contrast, task-list labels, prose link underlines)
- SEO enhancements: homepage WebSite/Organization JSON-LD + per-page validity test

## 2026-05-31 — A/B experiment lifecycle + analytics enablement
<!-- meta: type=feature category=development priority=high component=Experiments -->
Built the end-to-end A/B experimentation system (PostHog), launched the first experiment, purged rotated secrets from git history, and shipped the site.

- A/B test: define support-button-copy experiment
- Create PostHog experiment support-button-copy (REST API: create/validate/launch)
- Validate A/B variants via Playwright (+ per-variant screenshots)
- A/B: add flag injection point in SupportButton
- Design experiment timeline folder structure (published lab notebook)
- Add experiment entry template + timeline index
- Backfill support-button-copy experiment entry
- Wire timeline convention into run-ab-test skill
- Create design-experiment skill (pre-experiment design doc)
- Create analyze-experiment skill (data + recommendation)
- Create conclude-experiment skill (execute rollout)
- Create decide-experiment skill (decision gates + readout)
- Create publish-site skill (draft-readiness triage + deploy)
- Rewrite git history to purge rotated credentials (filter-repo) + force-push
