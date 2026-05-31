# SDLC Skills Evaluation — omars-lab.github.io

Assessment of which repo workflows warrant a Claude skill vs. plain Makefile/docs.
Principle: **skills are for judgment-heavy or multi-step flows with gotchas**, not
for one-line passthroughs (`make start`). Created 2026-05-31.

## Makefile targets mapped to the SDLC

| Phase | Targets | Skill? | Rationale |
|---|---|---|---|
| **Setup** | `install`, `add`, `init-site`, `upgrade`, `update-prompts` | ❌ | One-liners; document in CLAUDE.md. |
| **Develop** | `start`, `start-prod`, `serve`, `clear`, `storybook`, `build-storybook` | ❌ | Trivial passthroughs; `run` built-in skill covers launching. |
| **Author content** | `fix-frontmatter`, `fix-blog-posts`, `check` | ✅ **author-blog-post** | MDX gotchas (`<br/>`, `{braces}`) silently fail the build late; frontmatter rules. Real judgment. **Built.** |
| **Build** | `build` | ⚠️ | Folded into deploy-site + author-blog-post (build is the gate). |
| **Test** | `test-e2e*`, `open-e2e-report`, `test-posthog` | ✅ **(analytics part)** | PostHog validation has deep gotchas (bot filter, prod-vs-dev). Covered by test-posthog + the spec. Generic e2e stays a Makefile target. |
| **Analytics** | `test-posthog` + `posthog_stats.py` | ✅ **manage-cloudflare-access** (stats) + integration plan | Stats readback + event plan. **Built.** |
| **Secure** | `secret-scan`, `install-hooks`, `audit` | ✅ **(done)** | gitleaks hook + config. **Built** (this session). |
| **Deploy** | `deploy`, `commit*`, `push*`, submodule targets | ✅ **deploy-site** | Multi-step, env-injection gotcha (PostHog key at build time), post-deploy verify. **Built.** |
| **Verify live** | (curl checks) | ✅ **validate-deployment** | Public/200 + Access + PostHog beacon checks. **Built.** |

## Recommendation summary

**Skills built this session (5):**
- `manage-cloudflare-access` — Access admin + PostHog stats
- `deploy-site` — safe build+deploy flow
- `validate-deployment` — post-deploy smoke checks
- `author-blog-post` — content/MDX/frontmatter guardrails
- (secret scanning delivered as Makefile + hook, not a skill — it's a gate, not a flow)

**Deliberately NOT skills** (document in CLAUDE.md instead): setup, dev-server,
storybook, generic e2e, submodule plumbing. These are mechanical and well-named.

**Next candidate (optional):** a `manage-changelog` skill — the repo has a custom
changelog system (`changelog/`, dedicated component, `changelog.tsx`) with its own
naming conventions (`YYYY-MM-DD-{category}-{action}-{descriptor}`) and a documented
process. That has enough convention/judgment to justify a skill if you maintain it
often.
