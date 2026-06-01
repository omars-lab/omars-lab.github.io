#!/usr/bin/env python3
"""
Scan draft:true posts/docs and score which are READY to come out of draft.

This is a heuristic triage tool for the publish-site skill — it does NOT flip
anything. It surfaces candidates so a human (you) decides what to publish.

Signals per file (cheap, content-based):
  + word count (substance)            + has <!-- truncate --> (blog excerpt set)
  + number of ## sections (structure) + frontmatter completeness (title/desc/tags)
  - TODO/FIXME/WIP/placeholder/lorem   - "coming soon" / stub markers
  - very short (likely a stub/index)

Score → bucket: ready / review / stub. Output is grouped + sorted, ready first.

Usage:
  python3 draft_readiness.py                 # scan blog/ + docs/, table to stdout
  python3 draft_readiness.py --area blog     # only blog
  python3 draft_readiness.py --json          # machine-readable (for the skill to act on)
  python3 draft_readiness.py --min-score 5   # only show candidates at/above a score
"""
import argparse
import json
import os
import re
import sys

BLOG_ROOT = "bytesofpurpose-blog/blog"
DOCS_ROOT = "bytesofpurpose-blog/docs"

STUB_MARKERS = re.compile(r"\b(TODO|FIXME|WIP|placeholder|coming soon|lorem ipsum|tbd)\b", re.I)


def repo_root():
    # skill dir = .claude/skills/publish-site → repo root is three up
    return os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))


def frontmatter(text):
    """Return (fm_dict_ish, body). Only parses the leading --- ... --- block, shallowly."""
    if not text.startswith("---"):
        return {}, text
    end = text.find("\n---", 3)
    if end == -1:
        return {}, text
    fm_raw = text[3:end]
    body = text[end + 4:]
    fm = {}
    for line in fm_raw.splitlines():
        m = re.match(r"^([A-Za-z0-9_]+):\s*(.*)$", line)
        if m:
            fm[m.group(1)] = m.group(2).strip()
    return fm, body


def score_file(path):
    with open(path, encoding="utf-8", errors="replace") as fh:
        text = fh.read()
    fm, body = frontmatter(text)
    words = len(re.findall(r"\w+", body))
    h2 = len(re.findall(r"^##\s", body, re.M))
    has_truncate = "<!-- truncate -->" in body
    stub_hits = len(STUB_MARKERS.findall(body))
    has_title = bool(fm.get("title"))
    has_desc = bool(fm.get("description"))
    has_tags = bool(fm.get("tags"))

    score = 0
    if words >= 600: score += 4
    elif words >= 200: score += 2
    elif words >= 50: score += 1
    else: score -= 2                      # tiny → likely a stub/index
    if h2 >= 3: score += 2
    elif h2 >= 1: score += 1
    if has_truncate: score += 1           # author set an excerpt → intentional post
    if has_title and has_desc: score += 1
    if has_tags: score += 1
    score -= stub_hits                     # each unfinished marker drags it down

    bucket = "ready" if score >= 6 else ("review" if score >= 3 else "stub")
    return {
        "path": path,
        "words": words, "h2": h2, "truncate": has_truncate,
        "stub_markers": stub_hits,
        "fm_complete": has_title and has_desc and has_tags,
        "score": score, "bucket": bucket,
    }


def find_drafts(root):
    out = []
    for dirpath, _, files in os.walk(root):
        for name in files:
            if not name.endswith((".md", ".mdx")):
                continue
            if name.startswith("_"):       # _category_, _TEMPLATE, partials — skip
                continue
            p = os.path.join(dirpath, name)
            try:
                with open(p, encoding="utf-8", errors="replace") as fh:
                    head = fh.read(800)
            except OSError:
                continue
            if re.search(r"^draft:\s*true\s*$", head, re.M):
                out.append(p)
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--area", choices=["blog", "docs", "all"], default="all")
    ap.add_argument("--json", action="store_true")
    ap.add_argument("--min-score", type=int, default=None)
    args = ap.parse_args()

    root = repo_root()
    roots = []
    if args.area in ("blog", "all"): roots.append(os.path.join(root, BLOG_ROOT))
    if args.area in ("docs", "all"): roots.append(os.path.join(root, DOCS_ROOT))

    results = []
    for r in roots:
        if os.path.isdir(r):
            results += [score_file(p) for p in find_drafts(r)]
    for x in results:
        x["path"] = os.path.relpath(x["path"], root)
    if args.min_score is not None:
        results = [x for x in results if x["score"] >= args.min_score]
    results.sort(key=lambda x: (-x["score"], x["path"]))

    if args.json:
        print(json.dumps(results, indent=2))
        return

    by_bucket = {"ready": [], "review": [], "stub": []}
    for x in results:
        by_bucket[x["bucket"]].append(x)
    total = len(results)
    print(f"Scanned {total} draft docs → "
          f"{len(by_bucket['ready'])} ready, {len(by_bucket['review'])} worth reviewing, "
          f"{len(by_bucket['stub'])} stubs.\n")
    for bucket, label in [("ready", "✅ READY to un-draft"),
                          ("review", "🟡 REVIEW (close, may need polish)"),
                          ("stub", "⬜ STUB (skip)")]:
        items = by_bucket[bucket]
        if not items:
            continue
        print(f"== {label} ({len(items)}) ==")
        # don't dump 90 stubs; cap the stub list
        show = items if bucket != "stub" else items[:5]
        for x in show:
            flags = []
            if x["truncate"]: flags.append("truncate")
            if x["fm_complete"]: flags.append("fm✓")
            if x["stub_markers"]: flags.append(f"{x['stub_markers']}×todo")
            print(f"  [{x['score']:>2}] {x['words']:>5}w h2:{x['h2']} "
                  f"{' '.join(flags):<24} {x['path']}")
        if bucket == "stub" and len(items) > 5:
            print(f"  … and {len(items) - 5} more stubs (not listed).")
        print()
    print("Nothing is flipped. To publish: set `draft: false` (or remove the line) on the "
          "files you choose, then deploy via the deploy-site flow.")


if __name__ == "__main__":
    main()
