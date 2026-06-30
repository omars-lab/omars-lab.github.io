# Plan: Enrich the "Questions for X" post class with SectionBanner + Question components

## Context

The blog has 26 "questions for X" posts (all tagged `question-set`, all currently `draft: true`).
Each post has a flat structure: intro paragraph, then H2 sections with bullet-list questions.
The goal is to make each post significantly richer, AND to reframe the entire series under a
more personal, first-person title pattern: **"What I Ask Myself: To Find Purpose"** instead of
"Questions for Finding Your Purpose". This makes the post feel like a genuine personal artifact
(what *I* actually use) rather than a generic how-to list.

1. **SectionBanner** — a callout under each H2 that explains *why these questions matter*, auto-drafted
   by reading the section heading + its questions, then pasted in as a prop.
2. **Question card** — each bullet-list question becomes a `<Question>` component with inline metadata
   (why important, how often to ask, when you ask it, how often to record answers), rendered as a card
   with a click-to-open modal showing the full metadata.

Both components live in `@omars-lab/blog-ui` (published package, consumed locally via `file:../packages/blog-ui`).
The blog consumes the package as a local path reference — so a `yarn build` in `packages/blog-ui/`
is enough to update it without a real npm publish.

Scope for this implementation pass: **one proof-of-concept post** (`questions-for-finding-your-purpose.md`,
converted to `.mdx`). The pattern established here becomes the template for the remaining 25 posts.

### Title / slug reframe

Old title: `"Questions for Finding Your Purpose"`
New title: `"What I Ask Myself: To Find Purpose"`

The slug (`questions-for-finding-your-purpose`) stays unchanged to preserve existing links.
A `createRedirects` entry is NOT needed (slug is the same). The `title:` frontmatter changes;
the URL does not.

The title pattern for all 26 posts follows: `"What I Ask Myself: <To/When/About> <topic>"`.
For the PoC post, the subtitle is `To Find Purpose`.

The `description:` frontmatter should also be rewritten in first person (e.g. "The questions I
return to when I want to understand why I exist, what gives life meaning, and how I want to be
remembered.") — short, personal, no "taxonomy of" framing.

The intro paragraph framing ("I don't think purpose is something you find once...") already works
well; it stays. The `What I Ask Myself:` title sets the expectation, the intro delivers on it.

---

## Task tracking

Create these tasks up front before starting:

1. **Build `SectionBanner` component in `@omars-lab/blog-ui`** — the "why this section matters" callout.
2. **Build `Question` + `QuestionModal` components in `@omars-lab/blog-ui`** — card + click-to-reveal detail modal.
3. **Export new components from `packages/blog-ui/src/index.ts`** and register in `MDXComponents.tsx`.
4. **Build the package** (`yarn build` in `packages/blog-ui/`) to update the local dist.
5. **Auto-draft section banner text** for `questions-for-finding-your-purpose` — read each H2 + its questions,
   reason about what the section is really asking, write a 1-2 sentence "why these questions matter" per section.
6. **Convert `questions-for-finding-your-purpose.md` → `.mdx`** — wrap each H2's "why" in `<SectionBanner>`,
   wrap each question bullet in `<Question>`, fill in the per-question metadata props.
7. **Verify locally** (`make start`, open `:3000/thoughts/questions-for-finding-your-purpose`).
8. **Update `upgrade-post` skill** to document the two new components (what / when / MDX snippet / gotchas).
9. **Update skills** — `upgrade-post` (add `SectionBanner` + `Question` catalog entries), `author-blog-post` (`.mdx` rule for question-set posts), `scan-blog-worthy` + `enhance-post` in hats repo (note the enrichment pass for imported question-set posts).
10. **Consider whether a skill for question-set creation/migration should move from `hats` to this repo** — the `scan-blog-worthy` + `enhance-post` skills cover importing raw notes; the enrichment with `SectionBanner` + `Question` is a blog-repo concern. Likely stays separated but cross-referenced.

---

## Component design

### `SectionBanner`

A styled callout placed immediately under each H2 heading, explaining why that cluster of questions matters.

**Location:** `packages/blog-ui/src/components/SectionBanner/`

**Props:**
```ts
interface SectionBannerProps {
  why: string;          // 1-2 sentence rationale (auto-drafted per section)
  className?: string;
  style?: CSSProperties;
}
```

**Render:** A horizontally-padded div with a left accent bar (2-4px, `--ifm-color-primary`), subtle
background tint (`--ifm-background-surface-color` + slight opacity), italic `why` text in
`--ifm-color-content-secondary`. Visually distinct from an admonition — quieter, more like a
"narrator aside".

**MDX usage (after implementation):**
```mdx
## Core purpose

<SectionBanner why="Purpose questions force you to articulate the 'why' beneath your daily choices. Without them, you drift toward whatever's loudest — not what's deepest." />

- What is the purpose of your life?
- ...
```

---

### `Question` + `QuestionModal`

Replaces each bullet-list question with a styled card that reveals a detail modal on click.

**Location:** `packages/blog-ui/src/components/Question/`

**Props:**
```ts
interface QuestionProps {
  children: ReactNode;              // the question text itself
  why?: string;                     // why this question matters
  howOften?: string;                // how often to ask it (e.g. "Weekly" / "In crisis moments")
  when?: string;                    // situations that trigger it
  record?: string;                  // how often to record answers
  className?: string;
}
```

**Card render (closed state):**
- Light bordered card, question text in body, a subtle "?" icon or expand indicator.
- On hover: slight elevation shadow.

**Modal (open state, triggered by click):**
- Follows the `SignInModal` pattern: overlay + popIn animation + Escape key close.
- Body shows: question text as heading, then labeled rows for `why`, `howOften`, `when`, `record`
  (only rows where the prop is provided are rendered).
- Dismiss via Escape, click outside, or a close button.

**Global modal host:** A `<QuestionModalHost />` component, mounted in `src/theme/Root.tsx` alongside
the existing `<SignInModalHost />`. Uses the same pub/sub pattern (`CustomEvent` + `window.dispatchEvent`).

**MDX usage:**
```mdx
<Question
  why="This cuts through the noise — it anchors every subsequent question to an actual foundation."
  howOften="Once per quarter or when you feel directionless"
  when="During annual reviews, major life transitions"
  record="Write a 1-paragraph answer each time; compare across quarters">
  What is the purpose of your life?
</Question>
```

---

## File changes

### New files (in `packages/blog-ui/src/components/`)
- `SectionBanner/index.tsx`
- `SectionBanner/styles.module.css`
- `Question/index.tsx`
- `Question/QuestionModal.tsx`
- `Question/styles.module.css`

### Modified files
- `packages/blog-ui/src/index.ts` — export `SectionBanner`, `Question`
- `bytesofpurpose-blog/src/theme/MDXComponents.tsx` — register `SectionBanner`, `Question`, `QuestionModalHost`
- `bytesofpurpose-blog/src/theme/Root.tsx` — mount `<QuestionModalHost />`
- `bytesofpurpose-blog/blog/2026-01-25-questions-for-finding-your-purpose.md` → renamed `.mdx`, content rewritten

### Skill updates

**Blog repo (`omars-lab.github.io/.claude/skills/`):**
- `upgrade-post/SKILL.md` — add `SectionBanner` and `Question` to the component catalog (what / when / snippet / gotchas)
- `author-blog-post/SKILL.md` — note that question-set posts must be `.mdx` (not `.md`) when using these components

**Hats repo (`/Users/omareid/Workspace/git/hats/.claude/skills/`):**
- `scan-blog-worthy/SKILL.md` — the existing "question-set post format" section (line 257) already describes how to import; update two things: (1) change the title rule from `Questions for <X>` to `What I Ask Myself: <To/When/About> <topic>`; (2) add a note that after import the post should be converted to `.mdx` and enriched with `SectionBanner` + `Question` via the blog repo's `upgrade-post` skill.
- `enhance-post/SKILL.md` — no meaningful update needed; enhance-post handles prose polishing, not MDX component enrichment. That's a separate step handled post-import in the blog repo.

**Decision: nothing moves from hats to blog repo.** The boundary is clean — hats owns "scan private notes → import as question-set post"; blog repo owns "enrich with components". They are referenced, not merged.

---

## Auto-drafting banner text (step 5)

For each H2 in `questions-for-finding-your-purpose.md`:
1. Read the section title + all bullet questions under it.
2. Reason: what is the underlying theme? What shifts in someone who regularly sits with these? What blind spot do they break?
3. Write a 1-2 sentence `why` (no em-dashes, no AI filler phrases, honest and direct).
4. Paste as `<SectionBanner why="..." />` immediately after the H2.

This reasoning step is done inline by Claude (read the file, think, write) -- no external script or API call needed.

---

## Build + verify

```bash
# Build the updated package
cd packages/blog-ui && yarn build

# Start local dev server
make start   # :3000

# Open in browser
# http://localhost:3000/thoughts/questions-for-finding-your-purpose
# - Check SectionBanner renders under each H2
# - Click a Question card -> modal opens with metadata
# - Press Escape -> modal closes
# - Check dark mode
```

---

## Skill update note

The `upgrade-post` skill should gain two catalog entries:
- **SectionBanner** — WHAT / WHEN / MDX snippet / gotcha (only for question-set posts or any post with clustered H2 sections that need a rationale callout)
- **Question** — WHAT / WHEN / MDX snippet / gotcha (replaces bullet lists when per-question metadata exists)

The `author-blog-post` skill should note that question-set posts must be `.mdx` (not `.md`) when using these components.
