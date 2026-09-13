---
slug: driving-a-bambu-x2d-from-claude-code
title: "Driving a Bambu X2D from Claude Code"
kind: project
sidebar_label: "Bambu X2D + Claude Code"
description: "Wiring a brand-new Bambu X2D so Claude Code can take a design from source to a logged print with one command — and why each layer (Bambu Studio, Bambu Connect vs Developer Mode, an MCP, our own CLI, a skill) earns its place instead of being reinvented."
authors: [oeid]
tags: [3d-printing, claude, claude-code, mcp, automation, tooling]
date: 2026-09-13T10:00
draft: true
---

A new Bambu Lab X2D showed up on the bench, and I didn't want the workflow that every printer
nudges you toward: open the slicer, click around, drag a file, watch a screen. I wanted to type one
command and have Claude Code take a design from source to a *logged* print — sliced with the right
profile, dispatched, and recorded — without me babysitting a GUI.

Getting there meant stacking five pieces, and the interesting part wasn't installing any of them.
It was deciding, for each one, whether to **use it, wrap it, or build it** — because the wrong call
in either direction costs you later: reinvent what you should have reused and you inherit a
maintenance treadmill; glue together what you should have owned and you re-wire it by hand every
time.

<!-- truncate -->

## The goal, stated as one command

```
bambu print send plate.3mf --record
```

That's the whole target: a sliced plate goes to the printer, and a print record lands in the repo
in the same breath. Everything below exists to make that line trustworthy.

## The five layers, and why each one exists

Here's the stack, top to bottom:

```
our skill        → when/why, the decisions, the setup order      (judgment)
our CLI (bambu)  → our verbs, --help; source→slice→dispatch→record (mechanics)
  → an MCP       → control / status / upload / AMS / camera        (transport)
  → BambuStudio CLI → headless slicing
  → AppleScript  → GUI-only actions with no headless path
Bambu firmware   → MQTT / FTP / X.509 on the LAN
```

**Bambu Studio** is non-negotiable: it owns the slicer and the printer profiles, and it has a
headless CLI, so it's the slicing engine. The only real question there is *which* Bambu Studio.

**Bambu Studio: stable or beta?** Default to **stable**. The catch is that the X2D is brand-new
hardware, and a slicer only knows a printer it has a profile for. So the rule I landed on is:
install stable, and *only if* it doesn't list the X2D or its dual-nozzle profiles, add the beta
alongside it (they coexist). The tax on the beta is small but real — beta-saved 3MF projects can't
be uploaded to MakerWorld — so it's a fallback, not the default.

**Bambu Connect vs Developer Mode** is the fork that actually matters, and it's a security
decision, not a convenience one. In January 2025 Bambu shipped an *Authorization Control System*: a
login wall in front of direct printer control. Since then there are two ways for anything that
isn't Bambu's own app to reach the machine:

- **Bambu Connect** — the default, closed-source broker. It lets a third-party slicer *hand a
  sliced file to the printer*, and nothing more. It will not let an external program drive the
  machine.
- **Developer Mode** — an opt-in toggle on the printer that leaves MQTT, live stream, and FTP open
  on your LAN. This is what any programmatic controller needs.

If you want Claude to *monitor and control* the printer — not just drop a file — you need
Developer Mode. And you should say that out loud, because enabling it means **you** own your LAN
security and Bambu explicitly won't support that mode. I turned it on deliberately, on a trusted
home network, and I still install Bambu Connect: it's the GUI fallback for the rare action that has
no headless path.

## The layer I refused to build: the MCP

For Claude to talk to the printer it needs an [MCP](https://modelcontextprotocol.io/) server — the
bridge that turns "check status" or "start print" into the MQTT/FTP calls the firmware understands.
There are several open-source ones, and my first instinct was to write my own so I'd control the
whole stack. I'm glad I didn't. Here's the field I compared:

| Project | Runtime | Slicing/STL | Claude Code | Maintenance | Note |
|---|---|---|---|---|---|
| **griches/bambu-mcp** | Node | no (uses existing 3mf/gcode) | `claude mcp add` | ~45★, active, MIT | multi-printer; handles the Jan-2025 X.509 auth |
| rowbotik/bambu-printer-mcp | Node | yes, built-in | `.mcp.json` | fresh fork, GPL | control + STL + slice in one package |
| schwarztim/bambu-mcp | TS | upload only | config file | ~19★ | most explicit about certificate signing |
| Shockedrope/bambu-mcp-server | Python | no | Desktop only | ~7★ | monitor + basic control |
| mcpmarket "Bambu 3D Print Automation" | — | wraps BambuStudio CLI | skill | — | model search + headless slice + dispatch |

Two things settled it. First, **the hard part is a moving target.** The genuinely fiddly layer is
MQTT + FTPS + that X.509 certificate auth — and it's *exactly* the layer Bambu keeps changing with
firmware updates. Rebuilding it myself would mean re-solving, on every firmware bump, a problem the
maintained servers already track. That's not control; it's a subscription to other people's churn.

Second, **none of them list the X2D in their model tables yet** (newest is the H2 series). So model
support for a week-old printer is an open question in *all* of them. That's not an argument for
building my own — it's an argument for not hard-coding a model list at all, and for verifying X2D
support as a setup step regardless of which server I pick.

So I picked **griches/bambu-mcp** — best-maintained, MIT, first-class Claude Code support, and it
already handles the certificate auth — and treated it as dumb transport.

## The layer I *did* build: a CLI companion

If the MCP is transport, what's left that's actually mine? The *workflow*. My designs come out of a
geometry engine as source files; they need to be sliced with the right dual-nozzle profile,
dispatched, and — the part no generic tool does — **recorded**, so that six months from now I can
answer "what did this print teach me?" None of the community tools know about my repo's print-record
format. That glue is the thing worth owning.

So I wrote a small CLI, `bambu`, with command groups instead of one flat blob of flags:

- `bambu setup` — `doctor` (preflight every dependency and connection, and *name what's missing*),
  `mcp`, `studio`
- `bambu status` — `show`, `monitor`, `camera` (read-only; proves the pipe before anything is sent)
- `bambu slice` — headless slicing via the BambuStudio CLI
- `bambu print` — `send --record`, `pause`, `resume`, `stop`
- `bambu validate` — mesh checks, profile checks, and "does this record pass the gate"

Under the hood each verb asks a little router for the cheapest capable backend: the MCP for
control, the BambuStudio CLI for slicing, and — only where there's no headless path — AppleScript
driving the GUI app, every such call timeout-bounded so a stuck dialog can't freeze the run. The
CLI is an MCP *client*, so a human and Claude drive the printer through the same code path instead
of two that can drift apart.

Why a CLI at all, instead of letting Claude call the MCP tools directly? Because a single,
predictable command is something you can put on an allow-list and read the `--help` of. The help
*is* the documentation. "Take this source file, slice it for the X2D's auxiliary nozzle, and log
the run" collapses into one line I can trust, instead of a fresh pile of tool calls assembled from
scratch every time.

## The judgment layer: a skill

The last piece is the smallest and the one that ties it together — a Claude Code *skill* that
carries the *when and why*: the decisions above, the setup order, a troubleshooting table, and a
per-print rubric it reads at run time ("is this plate a real prototype or just decoration?"). The
skill is judgment; the CLI is mechanics; the MCP is transport. Keeping those three separate is the
whole trick — each can change without dragging the others.

## The setup, in order

1. Put the printer on the LAN, note its IP.
2. Install [Bambu Studio](https://bambulab.com/en/download/studio) (stable; beta only if the X2D
   profiles are missing). X2D reference: [Bambu support](https://bambulab.com/en/support/804923811139526656).
3. Enable **LAN Mode**, then **Developer Mode**; record the access code and serial.
   ([Bambu Connect explainer](https://wiki.bambulab.com/en/software/bambu-connect) ·
   [the announcement](https://blog.bambulab.com/updates-and-third-party-integration-with-bambu-connect/).)
4. Install [Bambu Connect](https://wiki.bambulab.com/en/software/bambu-connect) (the GUI fallback).
5. Wire [griches/bambu-mcp](https://github.com/griches/bambu-mcp) into `.mcp.json` (keep it out of
   git — it carries the token).
6. Stand up the CLI and run `bambu setup doctor` until it's green.
7. `bambu status show` — reach the printer read-only before you ever send it a file.

## The security note, because it's the load-bearing one

Developer Mode trades a locked-down default for open local control. That's the right trade for a
homelab printer on a network I trust and the wrong one for a machine on a shared or exposed LAN. The
token that authorizes control is a secret: it lives in one gitignored file and nowhere else, and the
tooling masks it rather than printing it. If any of that isn't true for your setup, stay on Bambu
Connect and hand files to the printer by hand — slower, but you keep the wall up.

The pattern underneath all of this generalizes past 3D printing: **reuse the moving target, own the
glue, and keep judgment, mechanics, and transport in separate layers.** The printer was just the
excuse to draw the lines in the right places.
