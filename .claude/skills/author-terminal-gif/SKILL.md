---
name: author-terminal-gif
description: Generate a synthesized Claude Code terminal-session GIF (no live recording) from a small JSON spec, to feed the <Gif> component on a blog/design post. Covers the generator script (Pillow frames + gifsicle), the spec format (folder/model/progress + a transcript of promptbar/line/gap/spinner entries with colored bold segments), where to put the output, and how to wire it into <Gif frame="terminal">. Use when a post wants to show a Claude Code session in motion (the agent running, tool calls streaming, a shortlist appearing) without recording a real terminal. Pairs with upgrade-post (the <Gif> catalog entry) and author-walkthrough (the live-scripted alternative).
---

# Author a synthesized terminal-session GIF

When a post wants to show a Claude Code session *in motion* (the prompt typing, the `●` turns,
`└` tool calls streaming, a shortlist appearing, the `✻` spinner) but you do not want to record
a real terminal, generate one. The generator is **reproducible** (same spec → same gif, no live
session) and the output drops straight into the `<Gif frame="terminal">` component.

This is the recorded/synthesized-motion sibling of `author-walkthrough`: a `<Walkthrough>` is a
live, scripted DOM animation; a terminal GIF is a baked clip that reads as a genuine CLI session.

## Generate it

```bash
python3 bytesofpurpose-blog/scripts/make-terminal-gif.py <spec.json> \
  --out bytesofpurpose-blog/static/img/<post>/session.gif
```

It writes the gif AND a `<post>/session-poster.png` (the final frame) for the `<Gif poster=…>`
reduced-motion / paused still. It optimizes with `gifsicle` if installed (`brew install
gifsicle`), typically cutting the gif to well under 100 KB. Needs Pillow (`pip install Pillow`).

## The spec

A JSON file. `scripts/terminal-gif.sample.json` is a complete worked example. Shape:

```json
{
  "folder": "my-project",          // status-line folder name
  "model": "Opus 4.8",             // status-line model
  "progress": "▓░░░░░░░ ~10%",     // status-line progress
  "transcript": [
    {"kind": "promptbar", "text": "the user's prompt"},
    {"kind": "gap"},
    {"kind": "line", "segments": [
        {"t": "● ", "c": "ink"},
        {"t": "Claude's reply prose…", "c": "muted"}]},
    {"kind": "line", "indent": 2, "segments": [
        {"t": "└ ", "c": "muted"},
        {"t": "Bash", "c": "ink", "b": true},
        {"t": "(a command …)", "c": "muted"}]},
    {"kind": "spinner", "segments": [
        {"t": "Stewing… ", "c": "orange"},
        {"t": "(28s · ↓ 636 tokens)", "c": "muted"}]}
  ]
}
```

- **Entry kinds:** `promptbar` (the grey user-input bar with a `›` chevron; if it is FIRST, the
  gif opens by TYPING it letter-by-letter), `line` (a transcript line; optional `indent` in
  half-character steps), `gap` (a blank half-line), `spinner` (an orange `✻` line that animates
  through a few glyph cycles at the end).
- **Segments** `{t, c, b}`: `t` = text, `c` = color (`ink` / `muted` / `orange` / `blue`), `b` =
  bold. Match real Claude Code: bold `ink` for tool names + tickers, `muted` for prose/paths,
  `blue` for file paths Claude opened, `orange` for the spinner + credits.
- **Animation is automatic:** prompt types in, transcript reveals line by line, the spinner (if
  present) cycles then holds. You only write the content.

## Wire it into the post

```mdx
<Gif src="/img/<post>/session.gif" poster="/img/<post>/session-poster.png"
     alt="Claude Code running the <agent> agent: the prompt, tool calls, and a shortlist"
     frame="terminal" title="claude code"
     caption={<><b>A real session.</b> The agent runs its skills, then pauses for approval.</>} />
```

See the `<Gif>` entry in `upgrade-post` for the component props. `alt` is required; `poster` is
strongly recommended (it is the reduced-motion + paused still).

## Verify (always prove)

The gif is a static asset, so a build is not needed to check it, but confirm it RENDERS:

```bash
python3 -c "from PIL import Image; g=Image.open('<out>.gif'); print(g.format, g.n_frames, g.size)"
# expect: GIF, dozens of frames, your WxH
```

Then view the post on the dev server and confirm the `<Gif>` shows the frame, the gif plays,
and the play/pause toggle swaps to the poster.

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Glyphs render as boxes (emoji, ✻) | the monospace font lacks the glyph | the script uses SF Mono / Menlo (mac); the folder emoji is drawn as a rect on purpose. Stick to the ✻ spinner set + ASCII. |
| Gif is large (>200 KB) | gifsicle not installed, or too many colors | `brew install gifsicle`; it re-runs with `--colors 80`. Keep the canvas at the default 900×620. |
| Text clipped at the bottom | transcript taller than the canvas | trim lines or raise `"height"` in the spec; the bottom ~96px is reserved for the input box + status line. |
| Fonts differ on Linux/CI | the mac font paths are absent | run the generator locally (mac) and commit the gif; it is a build artifact you check in, not generated in CI. |

## Files

- `bytesofpurpose-blog/scripts/make-terminal-gif.py` — the parameterized generator (engine).
- `bytesofpurpose-blog/scripts/terminal-gif.sample.json` — a complete worked spec.
- `packages/blog-ui/src/components/Gif/` — the `<Gif>` component the output feeds.

## Learnings log (newest first)

- 2026-06-23 — Created by parameterizing the getting-started-with-claude-agents onboarding-guide
  generator: the rendering engine (palette/fonts/segments/chrome/typing+reveal+spinner) was
  generic; only the transcript + status-line folder were project-specific, so they moved into a
  JSON spec. Output is a checked-in asset (mac fonts, not reproduced in CI). Pairs with the new
  `<Gif>` component (the presentation half).
