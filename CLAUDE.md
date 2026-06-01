# CLAUDE.md — omars-lab.github.io

Guidance for Claude Code working in this repo. **This file routes to skills; it does
not duplicate them.** When you learn something reusable, flush it into the right
skill (below), not here. Keep this file a short index + repo-wide conventions only.

## ⚠️ Operating convention: information goes in the proper skill

When you discover a setup step, gotcha, troubleshooting fix, or workflow, **write it
into the skill that owns that area** (SKILL.md), not into ad-hoc notes or this file.
Each skill is the single source of truth for its domain. If a fact spans areas, put
it in the most specific skill and cross-link. Update the skill's Troubleshooting
table when you hit and resolve a new failure mode.

## ⚠️ Operating convention: archive completed tasks to the changelog

When the task list reaches **10+ completed tasks**, archive them and prune:
1. Append a new dated batch to `bytesofpurpose-blog/changelog/CLAUDE-CHANGELOG.md`
   (format documented in that file's header): a `## YYYY-MM-DD — Title` heading, a
   `<!-- meta: ... -->` line, a one-line summary, and the completed task subjects as
   a bullet list.
2. Run `node bytesofpurpose-blog/scripts/generate-changelog-data.js` so the entry
   renders on the site (the generator splits that file into one changelog card per
   batch — no code change needed per batch).
3. **Then delete those completed tasks** (TaskUpdate → `deleted`) so the live task
   list stays short. Leave pending/in_progress tasks untouched.
The CLAUDE-CHANGELOG.md is the durable record; the task list is just the working set.

## ⚠️ Operating convention: structure decisions must update the structure checks

The docs are a **topic-based information architecture** with a recurring folder
contract (each root topic = a reader-facing topic; each topic has a README landing
with an **absolute** `slug:`, a `_category_.json`, optional `vocabulary/` first and
`prompts/` last; kebab-case names with **no numeric name prefix** — order via
`_category_.json` `position` / `sidebar_position`, never the folder name, so reordering
stays history-clean; no framing-word/topic-echo folders; depth ≤4; every
doc carries an **absolute** slug so a move never changes a URL). A large topic may split
into **domain sub-topics** (e.g. `Software Development` → `backend-development/`,
`frontend-development/`, `scripting/`, `plugins/`, each with `research/projects/
techniques/tinkering/`); the idea→ship LIFECYCLE is the separate `Product Management`
topic, linked to its executions via the in-body `## Execution`/`## Idea` mapping
convention (warn-validated). **Whenever you make a
decision that changes this structure or its conventions** (add/rename/retire a topic,
change the recurring shape, add a naming rule, change slug/draft policy), you **must
update the structure-checking validators + hooks in the same change** so they encode
the new rule — never let the docs and the checks drift. The contract is owned by the
`review-reader-experience` skill ("Topic-folder contract + validator" section) and
enforced by `bytesofpurpose-blog/scripts/validate-docs-structure.js`
(`make validate-structure`) + the warn-only PostToolUse `Write|Edit` hook
`.claude/hooks/validate-docs-structure-hook.sh` (registered in `.claude/settings.json`
alongside `validate-links-hook.sh` / `validate-draft-hook.sh`). Absolute-slug is the
only ERROR tier; the rest are warn-tier advisories. If the validator doesn't yet encode
a rule you just introduced, add the rule to it as part of the decision. The skill's
SKILL.md is the source of truth for the contract; keep it and the checks in lockstep.

## The site

Docusaurus 3 blog/docs (`bytesofpurpose-blog/`) → GitHub Pages (`gh-pages`) →
`https://blog.bytesofpurpose.com` (public; Cloudflare Access bypass app). Build/dev
via the root `Makefile`. Secrets in the gitignored root `.env`.

## Skills map (SDLC) — use these, keep them current

| Area | Skill | Owns |
|---|---|---|
| Cloudflare Access | `manage-cloudflare-access` | make subdomains public/private; account/wildcard model |
| Analytics setup | `setup-posthog` | obtain/place the 4 PostHog keys; CLI install; key gotchas |
| Analytics queries | `query-posthog` | official @posthog/cli readback, HogQL, confirmations |
| Experiment design | `design-experiment` | pre-experiment design doc (hypothesis, placement rationale) → timeline entry |
| A/B testing (execute) | `run-ab-test` | flag injection point, create/validate/launch (REST API), Playwright |
| Experiment analysis | `analyze-experiment` | pull exposure+conversion split, significance, write Outcome + a recommendation |
| Experiment decision | `decide-experiment` | apply decision gates (significance/MDE/guardrails) + judgment → recorded decision readout |
| Experiment rollout | `conclude-experiment` | execute the decision: roll flag to 100% / keep control, clean up, finalize doc |
| Content authoring | `author-blog-post` | frontmatter + MDX pitfalls (`<br/>`, `{braces}`) |
| Reader-experience audit | `review-reader-experience` | audit the site through the reader's eyes: long/jargony sidebar+navbar labels, confusing layout / ignored buttons, writer-focused voice, file/folder IA (nesting, orphan categories, mis-homed docs, re-org — URL-safe only because every slug is **absolute**; a relative slug bakes the path into the URL, and editing a slug VALUE 404s silently) → prioritized report |
| Link hygiene | `validate-links` | lint source for bare/long/tracking/generic links (`make validate-links`) |
| Publish | `publish-site` | triage draft-readiness → un-draft approved → deploy; wraps `deploy-site` |
| Deploy | `deploy-site` | secret-scan → build (PostHog env) → gh-pages → verify |
| Verify live | `validate-deployment` | post-deploy 200/Access/PostHog-beacon checks |
| Regression / E2E | `bytesofpurpose-blog/test/e2e/README.md` (no skill) | Playwright **3-project model** (dev :3000 / prod-build :4173 / posthog-prod test-mode :4173); axe a11y + SEO gates; dev-only-surfaces **absence** test (DebugMenu/draft badges must not ship). `make test-regression`. Build-only transforms (rehype, draft exclusion) need the prod build, not `yarn start`. |

## Repo-wide gotchas (details live in the linked skill)

- **`.env` is fragile to `source`** — some values (e.g. `UMAMI_ADMIN_PASS`,
  `QUIP_ACCESS_TOKEN`) contain shell-special chars that break `source .env` and
  silently blank later vars (e.g. `POSTHOG_KEY`). Extract per-var instead:
  `grep -E '^VAR=' .env | cut -d= -f2- | sed 's/[[:space:]]*#.*//' | tr -d ' "'\'''`.
  The `make test-posthog` target does this; reuse the pattern.
- **PostHog needs `POSTHOG_KEY` at BUILD time** (read in `docusaurus.config.js`) →
  see `deploy-site` / `setup-posthog`.
- **PostHog drops bot/automated-browser events** → build with `POSTHOG_TEST_MODE=1`
  for e2e → see `run-ab-test` / `posthog-issues.md`.
- **MDX build-breakers**: bare `<br>` and unescaped `{word}` → see `author-blog-post`.
- **Repo is PUBLIC** + gitleaks pre-commit hook (`make install-hooks`). Never commit
  secrets; rotate, don't just scrub.

## Living analytics docs

- `bytesofpurpose-blog/src/posthog-integration-plan.md` — what events/why + verify.
- `bytesofpurpose-blog/src/posthog-issues.md` — debugging log / resolved issues.

## Experiment timeline (lab notebook)

- `bytesofpurpose-blog/docs/4-development/6-projects/experiments/` — **one published doc
  per experiment** (design + living status + outcome) + `README.md` timeline table +
  `_TEMPLATE.md`. Lifecycle: `design-experiment` → `run-ab-test` → `analyze-experiment`
  → `decide-experiment` → `conclude-experiment`. Keep each doc's status + the README
  table current as an experiment moves through the phases.
