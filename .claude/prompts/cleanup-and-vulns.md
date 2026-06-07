# Prompt: post-premium cleanup + dependency vulnerability remediation

Work from the repo root: `/Users/omareid/Workspace/git/projects/omars-lab.github.io`.
This is the follow-up to the premium-gating PR merges (#5/#6/#7, all on `master` at
`9f6ff581`) and the subsequent site deploy. Two workstreams: (A) housekeeping loose
ends left by the deploy + the PR #6 review, and (B) the open GitHub Dependabot alerts.

## Hard rules (from CLAUDE.md — do not violate)

- **Never commit to `master` directly.** Each workstream gets its own branch + PR.
- **Track the work as tasks** (TaskCreate/TaskUpdate): one per discrete item below,
  marked `in_progress` when picked up and `completed` when done.
- **Secure-by-default / fail-closed.** Don't weaken any premium guard. After any change
  that rebuilds, the V5 leak gate (`scripts/verify-premium-encrypted.js`) must still pass.
- **The em-dash hook is active.** Any edit to reader-facing content (prose md/mdx under
  `docs|blog|designs|changelog`, any `.html`, JSX strings in `src/**`) containing a
  literal `—` will BLOCK (exit 2). If you hit it, STOP and ask me how to rephrase via
  AskUserQuestion — do not silently rewrite. Plan edits to avoid introducing em-dashes.
- **Repo is public + gitleaks pre-commit.** Never commit secrets. Secrets live only in
  the gitignored `.env`; extract per-var, never `source .env`.
- Run checks LOCALLY (no CI). Report outcomes faithfully — if something fails or is
  skipped, say so with the output.

---

## Workstream A — cleanup (branch: `chore/post-premium-cleanup`)

1. **Tracked Storybook build artifact churns on every build.**
   `bytesofpurpose-blog/static/storybook/project.json` is git-TRACKED and gets rewritten
   by every `yarn build` (timestamp/hash churn), leaving a dirty working tree after each
   deploy. Decide the right fix and apply it:
   - If this file (and the rest of `static/storybook/`) is a generated artifact, it
     should be **gitignored** and removed from tracking (`git rm --cached`), with the
     build regenerating it. Confirm nothing in the deploy/build depends on the committed
     copy first (grep the Makefile + scripts for `static/storybook`).
   - If it must stay tracked for a reason, document why and make the build stop rewriting
     it (or normalize the volatile field). Don't just `git checkout` it each time.

2. **Broken links + broken anchor surfaced by the build** (currently `onBrokenLinks: 'warn'`
   in `docusaurus.config.js:24`, so they don't fail the build — but they're real). Fix the
   sources, don't suppress:
   - `/changelog/...` entries link to non-existent `/changelog/development/...` and
     `/changelog/content/...` paths and to `/blogging` (several). These look like stale
     changelog cross-links — trace them to the generator
     (`scripts/generate-changelog-data.js`) or the source `CLAUDE-CHANGELOG.md` and fix
     at the source.
   - `/craft/product-management/experiments` links to
     `./2026-05-31-support-button-copy.md` which resolves to a missing path — fix the
     relative link.
   - **Broken anchor** on `/craft/premium-gating-demo` → `#the-gated-body`: this anchor
     lives inside the **encrypted** premium body, so it legitimately doesn't exist in the
     public HTML. Either remove/relocate the link that points at it, or confirm it's
     expected-and-harmless and add a short note (don't leave it as an unexplained warning).
   - After fixing, consider whether `onBrokenLinks` should be flipped back to `'throw'`
     so regressions fail loudly. Propose it; don't flip it if real unfixable warnings remain.
   - Owning skill: `validate-links` (`make validate-links`). Run it.

3. **PR #6 review follow-ups (low severity, were deferred — your call whether to fix now):**
   - `PremiumGate/index.tsx`: the `requested` ("make it free") state never resets on
     client-side nav between premium docs. Negligible today (one premium doc) but if you
     touch the file, reset it in the unlock effect (key on `payload`) so a second premium
     doc starts fresh.
   - e2e `premium-gating.spec.ts` / `signin-redirect.spec.ts` use
     `getByRole('button', {name: /sign in with linkedin/i}).last()`. The signed-out
     navbar also exposes that label, so `.last()` leans on DOM order. Scope the assertion
     to the gate card container (e.g. within `[class*='card']`) so the test can't silently
     pass on the wrong button.

**Verify A:** `make validate-links`, then a clean `yarn build` shows zero (or only the
explicitly-accepted) broken-link/anchor warnings and leaves the working tree clean (no
storybook churn). Open the PR; do NOT deploy from this branch unless the link fixes change
rendered output you want live now.

---

## Workstream B — dependency vulnerabilities (branch: `chore/dependabot-remediation`)

GitHub reports **22 open Dependabot alerts** (high/medium/low) across two manifests.
NOTE: the raw alert list double-counts — many are historical advisories for the same
package that one version bump clears. Don't chase alert IDs; bump the **installed**
version past the highest `first_patched_version` and re-resolve. Code scanning is not
configured and secret scanning is disabled (separate decision — see B4).

Two manifests:
- `bytesofpurpose-blog/yarn.lock` (the site — the bulk)
- `workers/access-gate/package-lock.json` (the Worker — just `undici`)

### B1 — Worker (`workers/access-gate`), smallest + security-relevant
- `undici < 6.24.0` (medium). This is in the access-gate Worker dep tree. Bump to
  `>= 6.24.0`, `npm install`, then **`npm test` must stay 22/22** (the Worker test suite).
  This is the gate's own code path, so prioritize it.

### B2 — Site security-relevant highs (prioritize; these touch crypto / sanitization / the gate)
- **`node-forge < 1.4.0` (high)** — transitively pulled by **StatiCrypt** (the premium
  encryption engine). Directly relevant to the premium gate's crypto. Get the tree to
  `>= 1.4.0`.
- **`dompurify <= 3.3.1` (medium, XSS)** and **`@braintree/sanitize-url < 6.0.1`
  (medium)** — both are **mermaid**'s HTML/URL sanitizers; the gate injects decrypted
  HTML, and mermaid renders user-diagram content, so sanitizer CVEs matter. Bumping
  `mermaid` to `>= 11.15.0` (fixed line) should clear these + the 8 `mermaid` alerts.
- **`serialize-javascript` (high `<= 7.0.2`)**, **`handlebars 4.0.0–4.7.8` (high)**,
  **`minimatch` (high, multiple ranges)**, **`tar` (high, multiple)**,
  **`basic-ftp` (incl. one critical `< 5.2.0`)** — all build/tooling transitives. Bump
  the parents (storybook, webpack, docusaurus tooling) so these resolve. `basic-ftp`'s
  critical is the highest-severity single item — confirm it's gone after the bump.

### B3 — Remaining medium/low (mop-up)
- `storybook < 8.6.17` (high), `postcss < 8.5.10`, `ws < 8.20.1`, `ajv < 8.18.0`,
  `qs` (several), `webpack <= 5.104.0` (low), `webpack-dev-server <= 5.2.3`,
  `@babel/plugin-transform-modules-systemjs <= 7.29.3` (high), `diff < 5.2.2` (low),
  `@ai-sdk/provider-utils <= 3.0.97` (low, **no patch available** — note it and move on).
  Most clear as a side effect of the B2 parent bumps; resolve the stragglers with
  `yarn upgrade <pkg>` or a `resolutions` entry only where a transitive can't be lifted
  otherwise.

### Method (do NOT blanket-`yarn upgrade` everything — Docusaurus pins are fragile)
1. `gh api repos/omars-lab/omars-lab.github.io/dependabot/alerts --paginate --jq '.[]|select(.state=="open")|{sev:.security_advisory.severity,pkg:.dependency.package.name,mani:.dependency.manifest_path,fixed:(.security_vulnerability.first_patched_version.identifier//"none")}'`
   to get the live list, then group by package.
2. Prefer targeted bumps: `yarn upgrade <pkg>@<ver>` or a `resolutions`/`overrides`
   entry for deep transitives. Keep `@docusaurus/*` packages pinned to the **same exact
   core version** as each other (a known repo gotcha — mismatched Docusaurus internals
   break the build).
3. After each batch, **rebuild and re-test**:
   - `make build-premium` (encrypted build) must succeed **and the V5 leak gate must pass**.
   - `make test-premium-e2e` → **4/4** (premium hard-gate intact).
   - `make test-regression` if touched anything broader (a11y + SEO gates; see
     `test/e2e/README.md` — uses the 3-project Playwright model).
   - Worker: `cd workers/access-gate && npm test` → **22/22**.
4. Re-run the Dependabot query; confirm the open count dropped and no NEW alert appeared
   from an introduced version. Report the before/after count and any alert you chose to
   accept (e.g. the no-patch `@ai-sdk/provider-utils` low) with a one-line justification.

**Verify B:** open the PR with a table of {package, old→new, alerts cleared}. Don't merge
on red. If a bump can't be made without breaking the build (Docusaurus pin conflict),
STOP and report it rather than forcing it.

### B4 — Repo security posture (propose, don't silently enable)
- **Secret scanning is disabled** and **code scanning has no analysis configured.** For a
  PUBLIC repo with a history of leaked-then-rotated creds, both are worth enabling. Propose
  enabling GitHub secret scanning + push protection, and a minimal CodeQL workflow (JS/TS).
  These are repo-admin/settings changes — surface them as a recommendation for me to
  approve; don't assume the auth scope or flip settings without asking.

---

## Order & sequencing
- A and B are independent → separate branches/PRs, can go in either order. Suggest B1
  (Worker undici) first (smallest, security-relevant, isolated test), then B2/B3, then A.
- After each PR merges, sync `master` (`git checkout master && git pull --ff-only`) before
  the next, per the merge convention.
- **No site redeploy is required for B** unless a dep bump changes rendered output you want
  live; if it does, follow the `deploy-site` skill (encrypted build + fail-closed deploy +
  V5 re-run + `validate-deployment` check) exactly as in the last session.

## When done
Give me a one-paragraph status: which PRs opened/merged, Dependabot open-count before→after,
which alerts were accepted (and why), whether the storybook churn + broken links are fixed,
and what (if anything — e.g. the B4 settings toggles) needs my action.
