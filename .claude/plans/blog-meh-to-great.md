# Plan: Take the blog from "meh" to "great" — next-session priorities

## Intent (why this plan exists, and what "great" means here)
Omar asked, at the end of the restructure session, for a plan of the **most pressing
things to take the blog from meh to great** in the next session. This section captures
the reasoning so the plan is self-contained.

- **The problem isn't the bones — it's the surface.** Phases A–H fixed the information
  architecture (topics, URL-freeze, validators, the PM/SWDev split, clean folder
  numbering). That work is done and solid. So a plan that proposes *more restructuring*
  would be solving an already-solved problem. The remaining gap is everything a *reader*
  actually experiences: how much is visible, how polished it looks, whether the thinking
  flows, and whether the front doors sell it.
- **"Meh → great" is defined here as four shifts**, and every item maps to one:
  1. *Hollow → full* — half the content is hidden in drafts; published topics look thin
     (P0 publish sprint).
  2. *Unpolished → professional* — 151 bare URLs read as unfinished (P1 link fix).
  3. *Static reference → living* — the Blog (dated thinking) is a ghost town and the
     experiment loop runs on one data point (P1 blog revival, P2 experiments).
  4. *Filing cabinet → guided journey* — topic landings auto-list instead of orienting;
     the idea↔execution links are plumbing with nothing flowing (P2 mapping, P3 landings
     + reader-experience audit).
- **Why these and not others:** every item is grounded in something *measured this
  session* (counts below), is high impact-per-effort, and is independently shippable so a
  session can stop cleanly after any one. We deliberately exclude new features/redesigns
  until the existing surface is filled and polished — fill the house before adding rooms.
- **Greatness test for the next session:** a first-time reader landing on any topic finds
  it full, polished, oriented ("start here"), with recent dated posts proving it's alive
  and links that let them trace an idea to the code that realized it.

**Goal:** the IA restructure (Phases A–H) is done and URL-safe; the skeleton is strong.
But the blog still reads as a *personal scratchpad*, not a *destination*. This plan lists
the most pressing, highest-leverage moves to make it genuinely great for a first-time
reader. Ordered by impact-per-effort. Each item is scoped to be a clean next-session task.

## Where we are (evidence, measured this session)
- **159 published docs · 131 drafts** — but drafts are wildly uneven: software-development
  55, productivity 25, product-management 15, personal-growth 13. Half the site is hidden.
- **Only 4 blog posts** (docs-vs-blogs, DFS-vs-BFS, evolution-of-a-repo, my-contributions).
  The "Blog" is nearly empty while the "Docs" are huge — the dated-thinking channel is dormant.
- **151 bare-url link-hygiene errors** across the tree (validate-links). Reads as unpolished.
- **1 experiment** in the lab notebook (support-button-copy). The whole PostHog/A-B
  apparatus exists but is barely exercised.
- Structure is clean (validator: 0 errors, 2 known framing-folder warns). SEO descriptions:
  all 159 published docs have one. Good foundation — the gap is *content surface + polish*.

## The pressing things (priority order)

### P0 — Decide the draft story (the single biggest lever)
131 drafts = half the value is invisible. "Hold all" was right for one ship, but long-term
a 159-pub / 131-draft split makes topics look hollow (e.g. software-development shows a
fraction of its 55 drafts). **Pressing move:** a *publish sprint* — pick the 2–3 topics
where published depth most undersells the work (software-development, product-management,
productivity), read each publish-candidate for real (not word-count), and ship the ready
ones. Target: cut drafts from 131 → ~60, with every published topic feeling "full."
- Gate each with the existing draft-triage.tsv + a genuine quality read.
- Re-run the manifest after each batch (publishing ADDS routes; verify intended only).

### P1 — Fix the 151 bare-url link-hygiene errors
Pure polish debt, fully automatable. `make validate-links` flags them; `node
scripts/validate-links.js --fix` rewrites bare URLs → labeled links (it even fetches
titles with `--titles`). One pass + a skim = the whole site stops looking unfinished.
Low effort, high "feels professional" payoff. Do BEFORE flipping onBrokenLinks:'throw'.

### P1 — Revive the Blog channel (dated thinking)
4 posts is a ghost town next to 159 docs. The Docs-vs-Blog split only works if the Blog
breathes. **Pressing move:** seed 3–5 short posts from work already done — e.g. "Why I
restructured my docs into topics" (Phases A–H is a ready-made narrative), "Idea →
execution: how I link product management to code", a DFS/BFS-style explainer from the
interview-prep drafts. Cadence matters more than length.

### P2 — Make the idea↔execution mapping real (not just validated)
Phase G built the convention + validator, but ZERO links are authored yet. Right now it's
plumbing with nothing flowing through it. **Pressing move:** wire the obvious pairs —
PM ideas/initiatives that became real projects get an `## Execution` link; the built
artifacts link back under `## Idea`. Even 5–10 wired pairs make the PM↔SWDev split feel
intentional and navigable. The `idea-exec-link` check will keep them honest.

### P2 — Exercise the experiment apparatus
A whole A/B + PostHog + design/analyze/decide/conclude skill chain exists for ONE
experiment. Either run 1–2 real experiments (e.g. CTA copy, nav labels, a topic landing
hero) to populate the lab notebook and prove the loop end-to-end — or, if experiments
aren't a near-term priority, document that explicitly so the apparatus isn't mistaken
for active. Greatness here = visibly using your own tooling.

### P3 — First-impression polish (homepage + topic landings)
- **Homepage (`src/pages/index.tsx`)**: audit whether it sells the site in 5 seconds —
  who it's for, what's inside, where to start. (Welcome doc is good; the marketing page
  is the other front door.)
- **Topic landing READMEs**: now that topics are domain-organized, make each landing a
  real "start here" — a 2–3 sentence orientation + the 3 best docs to read first, not
  just an auto-list. High-traffic pages; worth hand-crafting.
- Run the **review-reader-experience** skill end-to-end against the post-restructure site
  for a fresh prioritized reader-eyes report (labels, nav, voice, dead ends).

### P3 — Tighten the build contract (after P0/P1)
Once drafts are triaged and bare-urls fixed, flip `onBrokenLinks: 'warn' → 'throw'` so
broken internal links fail the build (currently they 404 silently). Also resolve the 2
remaining framing-folder warns (documentation-techniques, problem-solving-techniques) or
formally accept them. Makes the structure self-enforcing.

## Suggested next-session order
1. **P1 bare-url --fix pass** (fast win, makes everything look better) → commit.
2. **P0 publish sprint** on software-development + product-management (the topics whose
   hidden depth most hurts) → manifest-verify each batch → commit.
3. **P1 blog revival**: draft 3 posts from existing work → commit.
4. **P2 idea↔execution wiring** for the clear pairs → commit.
5. **P3 reader-experience audit** → triage its findings into the following session.
6. (Stretch) P2 experiment run + P3 onBrokenLinks:'throw'.

## Guardrails (unchanged from the restructure)
- All slugs ABSOLUTE/frozen; never reintroduce a relative slug.
- Manifest diff (routes-before.txt) after any change that could move/add/remove routes;
  publishing a draft ADDS its route — that's expected, verify it's the intended one.
- `make validate-structure` (0 errors) + `make validate-links` before any deploy.
- A structure decision must update the validator + skill + CLAUDE.md in the same change.
- Builds collide across sessions (shared build/.docusaurus) — coordinate before building.
- Stage only your own paths in commits (lesson from Phase H: a blanket `git add docs`
  swept in another session's BookmarkletButton work).

## What's already solid (don't re-litigate)
Topic IA (11 clean topics, position-ordered, no name prefixes), URL-freeze guarantee,
the structure validator + warn-only hook, the PM/SWDev domain split, SEO descriptions on
every published doc, the changelog system. The foundation is good — this plan is about
*surface, polish, and flow*, not structure.
