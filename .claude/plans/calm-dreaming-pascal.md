# Plan: Import public co-designs into the Designs blog + a reusable skill

## Context

I author architecture HLDs ("co-designs") with Claude in a separate work repo at
`/Users/omareid/Workspace/work-git/docs/architecture/co-designs/public/`. Today they
live only there. I want them **published on the Designs blog** (`/designs`) of
`blog.bytesofpurpose.com`, plus **one showcase post** on the Thoughts blog (`/thoughts`)
that summarizes the collection and points readers to each design. And because I'll keep
writing co-designs, I want a **reusable skill** that turns any public co-design HLD into a
Designs-blog post repeatably (and idempotently re-imports when a source doc changes).

Decisions already made with the user:
- **Home:** the Designs blog (`bytesofpurpose-blog/designs/`), one full design post per HLD.
- **Scope:** the **4 HLDs**; SKIP the `*-research-legal-compliance.md` doc.
- **Two surfaces:** the full HLD becomes a **Designs post**; the casual lead-in/summary
  becomes a **separate `/thoughts` showcase post** linking to all 4.
- **Skill-first:** write the skill as the spec, then run it on the 4 docs as its first run.
- **De-em-dash:** context-aware auto-rewrite (the em-dash hook BLOCKS `—` in `designs/*.mdx`).
- **Provenance:** record each post's `source:` (repo/path/id/status/imported) in frontmatter
  so re-runs update the right post instead of duplicating.

## Source → target facts (verified)

The 4 source files (all `doc_type: hld`, `visibility: public`, `status: In Review`):

| Source file | Mermaid blocks | `—` in mermaid labels | Cross-doc links |
|---|---|---|---|
| `CO-DESIGN-2026-02-27-autonomous-build-agents-hld.md` | 14 | 5 | none |
| `CO-DESIGN-2026-06-21-site-scanner-lead-engine-hld.md` | 13 | 8 | none |
| `CO-DESIGN-2026-06-22-markdown-review-studio-hld.md` | 15 | 0 | none |
| `CO-DESIGN-2026-06-22-self-healing-storefront-agent-hld.md` | 15 | 8 | 4 → site-scanner |

Hazard scan: **no MDX build-breakers** in any file (no unescaped `{braces}` in prose, no
bare `<br>`; the `<a id>` tags in the storefront doc are valid JSX; HTML-comment examples
are inside code fences). Only transforms required are em-dash handling, mermaid-label
em-dash escaping, and the 4 cross-doc links.

Designs-blog conventions (from existing posts): filename `YYYY-MM-DD-<words>.mdx`; frontmatter
`slug` (prefixed `design-`), `sidebar_position`, `title`, `description`, `authors: [oeid]`,
`tags`, `draft`; **no `date` in frontmatter** (comes from filename); own `designs/authors.yml`
(only `oeid`); truncate marker `{/* truncate */}` or `<!-- truncate -->`. Mermaid renders
site-wide. Existing `sidebar_position` values run **1–8**, so new posts take **9–12** (by source date).

Validator scope confirmed: `validate-docs-structure.js` and the `blog_trigger` generator are
**docs/-only** and do NOT touch `designs/`. `validate-links` blocks only `bare-url` /
`url-as-text`. The **em-dash hook is the one blocking hazard** for `designs/*.mdx` (fires on
Write/Edit; no code-fence exemption — so files must be em-dash-free at write time).

## Approach

### Part A — Author the skill: `import-co-design` (`.claude/skills/import-co-design/SKILL.md`)

A new skill mirroring repo conventions (`name` + `description` frontmatter with a "Use when…"
clause; H1; step sections; troubleshooting table; cross-links to `author-blog-post`,
`publish-site`, `manage-frontmatter-descriptions`). It documents and drives the pipeline below,
backed by one transformer script in the skill dir.

**Transformer script** `.claude/skills/import-co-design/import-co-design.js` (Node, mirrors the
style of existing `bytesofpurpose-blog/scripts/*.js`). Given a source HLD path it:

1. **Parse frontmatter + body** of the source `.md`.
2. **Map frontmatter** → Designs frontmatter:
   - `slug: design-<kebab-of-title-sans-suffix>`
   - `title:` from source `title` (strip the em-dash subtitle if present; or de-em-dash it)
   - `description:` ← first sentence of the Executive Summary, trimmed to ~50–160 chars
     (the `manage-frontmatter-descriptions` length rule)
   - `authors: [oeid]` (map `Omar Eid`/`Claude`/`…(TBD)` → the `oeid` registry id)
   - `tags:` derived from doc subject (e.g. `[system-design, architecture, ai-agents, …]`)
   - `sidebar_position:` next free integer (9–12), assigned by source date order
   - `draft: true` (explicit — publish later via `publish-site`)
   - `source:` provenance block: `{ repo, path, id, status, imported }`
   - filename `YYYY-MM-DD-<kebab>.mdx` from source `date` + title
3. **De-em-dash the body** (context-aware), OUTSIDE mermaid/code fences:
   - parenthetical aside pair `A — x — B` → `A, x, B` (or parens)
   - numeric range `a—b` / `a–b` → `a to b`
   - sentence-break `X — Y` → `X. Y` / `X; Y`
   - **inside ```mermaid fences:** replace `—` with `&#8212;` (renders identically; the hook
     scans the raw file so the entity is required there).
4. **Rewrite cross-doc links:** `./CO-DESIGN-<other>-hld.md` (and `CO-DESIGN-0002`-style) →
   `/designs/<mapped-slug>` using a source-id→slug map built from the batch. Links to the
   **skipped** research doc → convert to plain text (no dangling link).
5. **Leave intact:** same-doc `[§x.y](#kebab)` anchors (headings auto-generate ids), the
   `[Assumption]` tags, mermaid diagrams, the `<a id>` footnote anchors.
6. **Idempotent re-run:** if a Designs post already has `source.id` matching, **update that
   file in place** (preserve its `sidebar_position`/`slug`) instead of creating a new one.
7. **Print a summary** (what changed, em-dash count rewritten, links rewritten) — no silent caps.

The script writes the file via fs; because the em-dash hook fires on the harness `Write`/`Edit`
tool (not on a Node `fs.writeFile`), running the script through `node` sidesteps a per-occurrence
prompt — but the file is still left em-dash-free so a later manual `Edit` won't trip the hook.

**SKILL.md sections:** Purpose + scope (Designs blog, public co-designs only); "What it does"
(the 7 steps); "Run it" (`node .claude/skills/import-co-design/import-co-design.js <source.md>`
or `--all <dir>`); "Frontmatter mapping" table; "The de-em-dash rules"; "Re-import / update"
(provenance, idempotency); "Showcase post" (how to refresh the `/thoughts` post — Part C);
"Verify" (build, grep for `—`, check `/designs` index); Troubleshooting table; cross-links.

### Part B — Run the skill on the 4 docs

Execute the transformer on the 4 HLDs → 4 new files in `bytesofpurpose-blog/designs/`:
- `2026-02-27-autonomous-build-agents.mdx` (`design-autonomous-build-agents`, pos 9)
- `2026-06-21-site-scanner-lead-engine.mdx` (`design-site-scanner-lead-engine`, pos 10)
- `2026-06-22-markdown-review-studio.mdx` (`design-markdown-review-studio`, pos 11)
- `2026-06-22-self-healing-storefront-agent.mdx` (`design-self-healing-storefront-agent`, pos 12)

All `draft: true`. The storefront doc's 4 links rewrite to `/designs/design-site-scanner-lead-engine`.

### Part C — The showcase Thoughts post

One post `bytesofpurpose-blog/blog/2026-06-22-system-designs-co-designed-with-claude.md`
(`slug: system-designs-co-designed-with-claude`, `authors: [oeid]`, `date: 2026-06-22T10:00`,
`draft: true`, tags incl. `system-design, architecture, claude`). Structure: short first-person
intro on co-designing HLDs with Claude → `<!-- truncate -->` → a one-paragraph lead-in per design
(the story + why it exists) each linking to its `/designs/design-…` post → a closing note. No
`blog_trigger` (that's docs-only).

## Files

- **New:** `.claude/skills/import-co-design/SKILL.md`
- **New:** `.claude/skills/import-co-design/import-co-design.js` (transformer)
- **New (generated by B):** 4 × `bytesofpurpose-blog/designs/YYYY-MM-DD-*.mdx`
- **New (C):** `bytesofpurpose-blog/blog/2026-06-22-system-designs-co-designed-with-claude.md`
- **Not modified:** `docusaurus.config.js` (Designs plugin + mermaid already configured), the
  validators/hooks (designs/ is out of their scope), `designs/authors.yml` (`oeid` already exists).

## Verification

1. **No em-dashes shipped:** `grep -rn $'—' bytesofpurpose-blog/designs/2026-* bytesofpurpose-blog/blog/2026-06-22-system-designs-*.md` → expect **zero** hits (mermaid uses `&#8212;`).
2. **Build passes:** `cd bytesofpurpose-blog && yarn build` (catches MDX/mermaid errors; Docusaurus `onBrokenLinks` catches bad internal links). Spot-check the build log for the 4 designs routes + the thoughts route.
3. **Serve + eyeball:** `yarn serve` (:4173) → visit `/designs` (4 new entries present, since `draft:true` they only show in dev/`--build` if drafts shown — verify on dev `yarn start` :3000), open one design post and confirm mermaid renders + cross-link to site-scanner resolves; open `/thoughts/system-designs-co-designed-with-claude` and click through each link.
4. **Idempotency check:** re-run the transformer on one source doc → confirm it UPDATES the existing `.mdx` (same slug/position) rather than creating a duplicate.
5. **Link hygiene:** `make validate-links` → no new ERROR-tier findings.

## Out of scope / deferred

- Publishing (flipping `draft:false`) and deploying — that's the `publish-site` → `deploy-site`
  flow, run later on approval, not part of this change.
- The research-legal-compliance doc — skipped per decision (the skill can import it later as a
  `research`-type post if wanted).
