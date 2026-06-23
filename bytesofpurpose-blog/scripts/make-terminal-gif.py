#!/usr/bin/env python3
"""Render a synthesized Claude Code terminal-session GIF from a small spec — no live
recording needed, fully reproducible. The output feeds the <Gif> component (frame="terminal").

Matched to how Claude Code actually renders: a cream/light UI, the user prompt in a grey
rounded bar with a › chevron, Claude's turn as a ● line, indented └ tool calls, an orange
✻ spinner, and a bottom input box + status line.

The ENGINE here is generic; the CONTENT comes from a JSON spec, so any post can generate its
own session gif without editing this file. (Ported + parameterized from the
getting-started-with-claude-agents onboarding-guide generator.)

Usage:
    python3 scripts/make-terminal-gif.py <spec.json> [--out static/img/<post>/session.gif]

The spec (see scripts/terminal-gif.sample.json) is:
    {
      "folder": "my-project",            # shown in the status line
      "model": "Opus 4.8",               # status line model name
      "progress": "▓░░░░░░░ ~10%",       # status line progress
      "width": 900, "height": 620,       # optional canvas size
      "transcript": [                    # rendered in order, revealed line by line
        {"kind": "promptbar", "text": "what stocks are worth considering today"},
        {"kind": "gap"},
        {"kind": "line", "segments": [{"t": "● ", "c": "ink"},
                                       {"t": "I'll survey the market…", "c": "muted"}]},
        {"kind": "line", "indent": 2, "segments": [{"t": "└ ", "c": "muted"},
                                                    {"t": "Bash", "c": "ink", "b": true},
                                                    {"t": "(ls -la)", "c": "muted"}]},
        {"kind": "spinner", "segments": [{"t": "Stewing… ", "c": "orange"},
                                          {"t": "(28s)", "c": "muted"}]}
      ]
    }

A segment is {"t": text, "c": color-name, "b": bold?}. Colors: ink, muted, orange, blue.
Also writes a poster PNG (the final frame) next to the gif, for the <Gif> poster= prop.
"""
import argparse
import json
import pathlib
import shutil
import subprocess
import sys

from PIL import Image, ImageDraw, ImageFont

# --- palette, matched to real Claude Code screenshots ----------------------
COLORS = {
    "ink": (51, 49, 46),        # #33312E primary text / bold
    "muted": (107, 105, 96),    # #6B6960 dim prose, paths, Running…
    "orange": (200, 116, 46),   # #C8742E spinner, $, /passes
    "blue": (91, 127, 176),     # #5B7FB0 model name, underlined paths
}
BG = (251, 244, 228)       # #FBF4E4 cream
BAR = (218, 216, 210)      # #DAD8D2 grey prompt bar
RULE = (227, 220, 201)     # #E3DCC9 hairlines
CURSOR = (107, 105, 96)

PADX = 26
LINE_H = 26
FS = 16


def load_font(size, bold=False):
    cands = [
        "/System/Library/Fonts/SFNSMono.ttf",
        "/System/Library/Fonts/Menlo.ttc",
        "/System/Library/Fonts/Monaco.ttf",
    ]
    for c in cands:
        if pathlib.Path(c).exists():
            try:
                if c.endswith(".ttc"):
                    return ImageFont.truetype(c, size, index=1 if bold else 0)
                return ImageFont.truetype(c, size)
            except OSError:
                continue
    return ImageFont.load_default()


FONT = load_font(FS)
FONT_B = load_font(FS, bold=True)


def seg_tuple(s):
    """Spec segment {t,c,b} -> (text, rgb, font)."""
    color = COLORS.get(s.get("c", "ink"), COLORS["ink"])
    return (s["t"], color, FONT_B if s.get("b") else FONT)


def draw_segments(d, x, y, segments):
    for text, color, font in segments:
        d.text((x, y), text, font=font, fill=color)
        x += d.textlength(text, font=font)
    return x


def draw_chrome(d, W, H, spec):
    """The persistent bottom input box + status line."""
    d.line([(PADX, H - 96), (W - PADX, H - 96)], fill=RULE)
    d.text((PADX, H - 78), "›", font=FONT, fill=COLORS["muted"])
    d.rectangle([PADX + 22, H - 80, PADX + 34, H - 60], fill=CURSOR)
    d.line([(PADX, H - 44), (W - PADX, H - 44)], fill=RULE)
    sy = H - 32
    x = draw_segments(d, PADX, sy, [(spec.get("model", "Opus 4.8"), COLORS["blue"], FONT),
                                    ("  |  ", COLORS["muted"], FONT)])
    # a small folder glyph (the monospace font can't render the color emoji)
    fx = x
    d.rectangle([fx, sy + 5, fx + 17, sy + 16], fill=(214, 178, 92))
    d.rectangle([fx, sy + 3, fx + 8, sy + 7], fill=(214, 178, 92))
    x = fx + 23
    draw_segments(d, x, sy, [(spec.get("folder", "project"), COLORS["muted"], FONT),
                             ("  |  ", COLORS["muted"], FONT),
                             (spec.get("progress", ""), COLORS["muted"], FONT)])


SPINNER_GLYPHS = ["✻", "✺", "✹", "✸"]


def render(spec, visible, W, H, spinner_phase=0, typed=None):
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    y = 28
    for entry in visible:
        kind = entry["kind"]
        if kind == "gap":
            y += LINE_H // 2 + 4
            continue
        if kind == "promptbar":
            d.rounded_rectangle([PADX - 8, y - 4, W - PADX, y + 24], radius=7, fill=BAR)
            draw_segments(d, PADX, y, [("› ", COLORS["muted"], FONT),
                                       (entry["text"], COLORS["ink"], FONT)])
            y += LINE_H + 6
            continue
        if kind == "spinner":
            glyph = SPINNER_GLYPHS[spinner_phase % 4]
            segs = [(glyph + " ", COLORS["orange"], FONT)] + [seg_tuple(s) for s in entry["segments"]]
            draw_segments(d, PADX, y, segs)
            y += LINE_H
            continue
        # normal line
        indent = entry.get("indent", 0) * 8
        draw_segments(d, PADX + indent, y, [seg_tuple(s) for s in entry["segments"]])
        y += LINE_H

    if typed is not None:
        text, n = typed
        d.rounded_rectangle([PADX - 8, 24, W - PADX, 52], radius=7, fill=BAR)
        x = draw_segments(d, PADX, 28, [("› ", COLORS["muted"], FONT)])
        shown = text[:n]
        d.text((x, 28), shown, font=FONT, fill=COLORS["ink"])
        cw = d.textlength(shown, font=FONT)
        d.rectangle([x + cw + 1, 30, x + cw + 11, 48], fill=CURSOR)

    draw_chrome(d, W, H, spec)
    return img


def build_frames(spec):
    W = spec.get("width", 900)
    H = spec.get("height", 620)
    transcript = spec["transcript"]
    frames, durations = [], []

    # 1) type the prompt (if the first entry is a promptbar)
    start = 0
    if transcript and transcript[0]["kind"] == "promptbar":
        text = transcript[0]["text"]
        for n in range(0, len(text) + 1):
            frames.append(render(spec, [], W, H, typed=(text, n)))
            durations.append(40 if n < len(text) else 450)
        start = 1

    # 2) reveal the rest line by line
    for i in range(start, len(transcript)):
        visible = transcript[: i + 1]
        frames.append(render(spec, visible, W, H))
        durations.append(120 if transcript[i]["kind"] == "gap" else 300)

    # 3) animate the spinner (if any) a few cycles, then hold
    has_spinner = any(e["kind"] == "spinner" for e in transcript)
    if has_spinner:
        for phase in range(8):
            frames.append(render(spec, transcript, W, H, spinner_phase=phase))
            durations.append(180)
        for _ in range(4):
            frames.append(render(spec, transcript, W, H, spinner_phase=7))
            durations.append(400)
    else:
        for _ in range(4):
            frames.append(render(spec, transcript, W, H))
            durations.append(400)
    return frames, durations


def main():
    ap = argparse.ArgumentParser(description="Synthesize a Claude Code terminal-session GIF.")
    ap.add_argument("spec", help="path to the JSON spec")
    ap.add_argument("--out", help="output gif path (default: alongside the spec, <spec>.gif)")
    args = ap.parse_args()

    spec_path = pathlib.Path(args.spec)
    spec = json.loads(spec_path.read_text())
    out = pathlib.Path(args.out) if args.out else spec_path.with_suffix(".gif")
    out.parent.mkdir(parents=True, exist_ok=True)

    frames, durations = build_frames(spec)
    frames[0].save(
        out, save_all=True, append_images=frames[1:],
        duration=durations, loop=0, optimize=True, disposal=2,
    )
    # a poster PNG (final frame) for the <Gif poster=…> reduced-motion / paused still
    poster = out.with_name(out.stem + "-poster.png")
    frames[-1].save(poster)
    print(f"wrote {out} ({out.stat().st_size // 1024} KB, {len(frames)} frames)")
    print(f"wrote {poster} (poster)")

    if shutil.which("gifsicle"):
        subprocess.run(["gifsicle", "-O3", "--colors", "80", "-o", str(out), str(out)], check=True)
        print(f"optimized -> {out.stat().st_size // 1024} KB")
    else:
        print("gifsicle not found - skipped optimization (brew install gifsicle)", file=sys.stderr)


if __name__ == "__main__":
    main()
