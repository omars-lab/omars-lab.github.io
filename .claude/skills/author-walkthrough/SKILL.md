---
name: author-walkthrough
description: Author an animated, scripted UX walkthrough for a blog/design post using the <Walkthrough> + <Mockup> components — a cursor that drags to select text, types a comment letter-by-letter, clicks a button, then crossfades to a Claude Code terminal that streams the "fix". The catalog of step types (move/highlight/dragSelect/type/comment/click/scene), the claude={prompt,steps} CLI scene, how to mark targetable elements with ids, the re-import-safe sidecar pattern, reduced-motion, and the gotchas (client-rendered so verify on the dev server; cursor positions are relative to the app scene; draft posts only render in dev). Use when asked to "show the UX in motion", animate a mockup, demo a click-through, or add a Claude-fixes-it walkthrough to a design post. Pairs with upgrade-post (component catalog), import-co-design (sidecar mechanics), and author-blog-post (MDX pitfalls).
---

# Author a UX Walkthrough

A `<Mockup>` shows what a UI looks like; a `<Walkthrough>` shows it being **used** — and,
for a Claude-driven tool, hands off to a Claude Code terminal that streams the fix. It is a
scripted, looping animation: cursor drags to select a phrase, a comment types in letter-by-
letter, a button is clicked, the app scene crossfades to a Claude CLI scene, then fades back.

The components live in `src/components/Walkthrough` and `src/components/Mockup` (both
registered in `src/theme/MDXComponents.tsx`, so no import is needed in a `docs/` page; in a
`designs/` sidecar you DO import them — see the sidecar pattern). The catalog of all post
components is the `upgrade-post` skill; this skill is the deep-dive on Walkthrough.

## The shape

```mdx
<Walkthrough
  claude={{
    prompt: 'see the latest feedback on review.studio/doc/hld',
    steps: ['reading the open comment', 'rewriting the passage', 'committed to git'],
  }}
  steps={[
    {type: 'dragSelect', target: '#sentence',  say: 'Select a phrase'},
    {type: 'type',       target: '#commentbox', text: 'Anchor this to the exact range?', say: 'Type a comment'},
    {type: 'click',      target: '#fix',        say: 'Fix with Claude'},
    {type: 'scene',      to: 'claude',          say: 'Claude reads the feedback and edits'},
    {type: 'scene',      to: 'app',             say: 'The edit lands back in the doc', hold: 1400},
  ]}
>
  <Mockup chrome="browser" title="Review Studio" url="review.studio/doc/hld">
    {/* the app scene — mark targetable elements with ids */}
    <p>… <span id="sentence">feedback is unanchored prose</span> …</p>
    <div id="commentbox"></div>
    <button id="fix">Fix with Claude</button>
  </Mockup>
</Walkthrough>
```

## Step types

| `type` | what it does | needs |
|---|---|---|
| `move` | glides the cursor to the target's center | `target` |
| `highlight` | moves there + shows a static highlight box over the target | `target` |
| `dragSelect` | moves to the target's start, then DRAGS across it so the highlight grows progressively (looks like selecting text) | `target` |
| `type` | moves to the target, then types `text` letter-by-letter INTO it (mirrors into the element's textContent) | `target`, `text` |
| `comment` | moves to the target's edge and drops `text` as the box content at once | `target`, `text` |
| `click` | moves to the target's center and plays a click ripple | `target` |
| `scene` | crossfades to `'app'` or `'claude'`; on `'claude'` it types the prompt + streams the steps | `to` |

Every step takes an optional `say` (the caption shown under the player) and `hold` (ms to
pause after the step; default ~1000).

## The Claude scene

`claude={{prompt, steps}}` drives the built-in terminal scene (a dark "claude code" panel).
On a `{type:'scene', to:'claude'}` step it types `prompt` in letter-by-letter (with a blinking
caret) then streams each `steps` line. Lead the steps with `●` for tool/thinking lines and a
final `✓` for the result, e.g. `['● reading the open comment', '✓ committed to git']`. The two
scenes grid-stack in one viewport cell, so the Claude scene REPLACES the mock in place (it
does not render stacked below it).

## Marking targets

The cursor finds elements by CSS selector **inside the app scene**, so give the mockup HTML
stable ids (`id="sentence"`, `id="commentbox"`, `id="fix"`). Prefix them so they read as
walkthrough anchors (e.g. `#wt-sentence`). For `type`, point at an EMPTY box (a `<div id="…">`
with a min-height) — the engine fills its textContent as it types.

## The re-import-safe sidecar pattern (imported design posts)

A `<Walkthrough>` is hand-crafted, so on an `import-co-design` post it must live in the
**mockup sidecar**, not the regenerated post body:

1. Put the `<Walkthrough>` + `<Mockup>` inside `designs/_mockups/<name>.mdx` (a default-
   exported component; `import Mockup` + `import Walkthrough` at the top).
2. Link it from the post frontmatter: `mockups: ./_mockups/<name>.mdx`.
3. The importer injects `import Mockups … <Mockups/>` after the truncate marker and PRESERVES
   it across re-imports; it never regenerates the sidecar. (See `import-co-design`.)

For a hand-authored post (not an import), put the `<Walkthrough>` directly in the post body.

## Verify (always prove — client-rendered)

The walkthrough animates in the browser (it is NOT in the static HTML), and design posts are
`draft: true` (dev-only). So verify on the dev server, ideally with Playwright:

```bash
( cd bytesofpurpose-blog && yarn docusaurus clear && yarn start )   # :3000, drafts shown
# then assert in a real browser that the steps fire:
#   cursor transform changes between steps (cursor moves)
#   the highlight box width grows (dragSelect)
#   #wt-commentbox textContent length grows (type)
#   the .claude scene reaches opacity>0.5 (crossfade) and .claudeLine count grows (stream)
```
The e2e spec `test/e2e/co-design-imports.spec.ts` has a worked assertion (the
"plays the full fix-with-Claude flow" test) — copy its sampling loop.

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Cursor lands in the wrong spot | targets are measured relative to the APP SCENE; an offset parent inside threw it off | keep ids on elements directly in the mockup; avoid `position` on intermediate wrappers unless intended. |
| Claude scene renders BELOW the mock | the two scenes weren't grid-stacked | both `.scene`s must share one grid cell (`grid-area:1/1`); the viewport then sizes to the taller scene. |
| Nothing animates | the post is `draft:true` and you looked at the prod build; or the dev cache is stale | view on the dev server (`:3000`); `yarn docusaurus clear` first. |
| `type` shows nothing | the target box has no room / wasn't found | point `type` at an empty `<div id>` with a `min-height`; check the id matches. |
| Edit to the post body wiped the walkthrough | it was in the post, not the sidecar, and the post got re-imported | move it into `designs/_mockups/<name>.mdx` + the `mockups:` frontmatter link. |
| An em-dash in a caption/label blocks the edit | the em-dash hook flags U+2014 in `designs/*.mdx` | use a comma/period/colon (or `·`). Empty cells: leave blank, don't use `—`. |

## Files

- `bytesofpurpose-blog/src/components/Walkthrough/` — the engine (index.tsx + styles).
- `bytesofpurpose-blog/src/components/Mockup/` — the framed app scene.
- `bytesofpurpose-blog/designs/_mockups/markdown-review-studio.mdx` — the worked example.
- `bytesofpurpose-blog/test/e2e/co-design-imports.spec.ts` — the rendered-proof spec.

## Learnings log (newest first)

- 2026-06-23 — Created. The walkthrough is a two-scene crossfade engine (app `<Mockup>` +
  built-in Claude CLI). dragSelect/type animate progressively (not instant) so it reads like
  a real session. Grid-stacking the scenes in one cell was the fix for the Claude scene
  rendering under the mock frame. Client-rendered + draft-only, so only a real-browser check
  proves it.
