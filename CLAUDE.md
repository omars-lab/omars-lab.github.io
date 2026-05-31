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
| A/B testing | `run-ab-test` | per-experiment workflow: flag injection point, Playwright, data, rollout |
| Content authoring | `author-blog-post` | frontmatter + MDX pitfalls (`<br/>`, `{braces}`) |
| Deploy | `deploy-site` | secret-scan → build (PostHog env) → gh-pages → verify |
| Verify live | `validate-deployment` | post-deploy 200/Access/PostHog-beacon checks |

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
