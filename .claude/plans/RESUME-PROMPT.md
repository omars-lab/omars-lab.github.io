# Resume Prompt — Docs Restructure Final Stretch (T14→T20)

Paste the block below after `/clear` to resume. It's structured as a **loop**: one task
per iteration, verify, commit, then advance. Stop conditions are explicit.

---

```
/loop Resume the docs topic-restructure — final stretch. Work ONE task per iteration as a
loop: pick the next task, do it, verify, commit, mark it completed, then continue to the
next. Pause the loop only at the explicit STOP/WAIT gates below.

SETUP (iteration 0 — do once):
- Read .claude/plans/linked-singing-clarke.md IN FULL (the approved plan). Also skim
  .claude/plans/RESTRUCTURE-HANDOFF.md and .claude/plans/piped-wishing-clover.md for
  history/findings.
- Run TaskList. T1–T13 are completed, T14 in_progress, T15–T20 pending. Do NOT recreate
  tasks. Mark each in_progress before starting, completed only when its verification passes.

INVARIANT (every iteration that touches docs/ must honor):
- All doc slugs are ABSOLUTE (Phase A froze them). NEVER reintroduce a relative slug —
  it silently re-couples URL to folder path.
- Baseline manifest: .claude/plans/routes-before.txt (569 routes). After any change:
    rm -rf bytesofpurpose-blog/build && (cd bytesofpurpose-blog && yarn clear >/dev/null)
    make build      # writes to bytesofpurpose-blog/build ; RUN IN BACKGROUND (~45s)
    cd /ABSOLUTE/path/bytesofpurpose-blog && find build -name '*.html' | sort > /tmp/routes-now.txt
    comm -23 /ABSOLUTE/path/.claude/plans/routes-before.txt /tmp/routes-now.txt   # removals
  REMOVED routes must be ONLY the approved retirements; ADDED only intended landings +
  tag pages. `cd` does NOT persist across Bash calls — use absolute paths. Drafts
  (draft:true) are excluded from the prod build (draft-target links 404 in build but
  resolve on publish; onBrokenLinks is 'warn' — that's fine).
- Commit after each task using the "Phase X (Tn): …" convention from this session.
  gitleaks pre-commit hook is active — never commit secrets. Honor the CLAUDE.md
  convention: a structure decision must update the structure validator in the same change.

LOCKED DECISIONS (do not re-ask):
- T14 ugly-slug cleanup + ~30 _category_.json label/position fixes are ALREADY in the
  working tree (build green, uncommitted). development/blogging/scripting slugs already
  cleaned to /development,/blogging,/scripting; the 3 old ugly URLs accepted as 404s.
- T15+T19+T20 CONSOLIDATE into ONE validator scripts/validate-docs-structure.js + ONE
  warn-only PostToolUse hook .claude/hooks/validate-docs-structure-hook.sh (mirror
  validate-draft-hook.sh) + a "topic-folder contract + slug/URL rules" section folded into
  the EXISTING review-reader-experience skill (NO new standalone skill) + a
  `make validate-structure` target.
- T18: produce a draft-triage recommendation table and WAIT — no autonomous draft:false
  flips or deletes.
- T17: take to deploy-ready (clean build + manifest diff + make validate-links +
  make validate-structure + make test-regression + ONE batched chrome-devtools visual
  sidebar pass across all 10 topics) and STOP — do NOT run the actual deploy.

LOOP — one per iteration, in order:
  T14  Finish: fix the 5 NO-DOC dead category links in 4-blogging/ docs (table is in the
       plan's Step 1; resolve each against the current build manifest — the real target is
       each sub-folder README's frozen slug `…/<name>/<name>`). Rebuild, verify manifest
       (NO-DOC broken count → 0; only intended deltas), commit, mark completed.
  T16  Correct the false "slug decouples URL from path" claim in: the
       review-reader-experience SKILL.md IA-audit section, the docs-topic-taxonomy memory,
       and the CLAUDE.md skills-map row. (No build needed.) Commit, mark completed.
  T15/T20  Build scripts/validate-docs-structure.js (checks in plan Step 3: absolute-slug
       ERROR; topic README+_category_ present; sub-folder categories; no orphan categories;
       kebab-case; no -techniques/topic-echo folders; depth ≤3; vocabulary-first/prompts-
       last; Welcome-index drift). Add the hook + settings.json registration + Makefile
       target + the skill section. Verify: make validate-structure runs clean on current
       tree; break one rule in a scratch edit and confirm it's caught; hook fires without
       blocking. Commit, mark T15 + T20 completed (and note T19 satisfied here).
  T18  Generate .claude/plans/draft-triage.tsv (path·topic·title·mtime·has-real-content)
       read-only; group by topic; recommend publish/keep/delete per doc; present the
       summary. >>> STOP THE LOOP and ask me for per-group decisions. <<<
  T17  After T18 decisions applied: clean build + manifest diff (record the retired URLs) +
       make validate-links + make validate-structure + make test-regression + batched
       visual sidebar pass. >>> STOP at deploy-ready and hand off to me. <<<

PACING: each build is ~45s — run builds in the background and continue prepping the next
edit while waiting; don't burn iterations polling. End the loop after T17 hands off (or at
the T18 WAIT gate). If a verification fails, do NOT mark the task complete — fix or surface
it. Start now with SETUP, then T14.
```

---

## Notes for the human
- The `/loop` self-paces; it will stop at the two WAIT/STOP gates (T18 decisions, T17
  deploy handoff) rather than acting irreversibly.
- If you'd rather drive manually, drop the leading `/loop ` and run it as a normal prompt —
  it still works, you just advance it yourself.
- Replace `/ABSOLUTE/path/` mentally — the repo root is
  `/Users/omareid/Workspace/git/projects/omars-lab.github.io`.
