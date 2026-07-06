#!/usr/bin/env python3
"""PostToolUse hook: keep the features/ why-docs honest as code changes.

After any Write/Edit, if the touched file is referenced by a feature anchor, re-check
that file's anchors:

  - moved  -> block relocated within/to this file: silently re-key the cache and rewrite
             the doc's line range. No warning (nothing conceptually changed).
  - drift  -> block content changed in place: WARN (stderr -> shown to Claude) that the
             feature's why-doc may be stale, and point at the feature-docs skill to
             reconcile. Non-blocking (exit 0).

This never blocks edits (always exit 0): drift is a signal to review intent, not an error.
The authoritative full sweep is `make features-check`.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

HOOK_DIR = Path(__file__).resolve().parent
REPO_ROOT = HOOK_DIR.parent.parent  # .claude/hooks -> repo root
sys.path.insert(0, str(REPO_ROOT / "bytesofpurpose-blog" / "scripts"))

try:
    from features_lib import (
        Anchor,
        all_anchors,
        anchor_to_cache_entry,
        check_anchor,
        load_cache,
        save_cache,
    )
    from features_check import rewrite_doc_range
except Exception:
    # If the engine can't import (not this repo / not set up), never break the tool.
    sys.exit(0)


def touched_paths(tool_input: dict) -> set:
    out = set()
    for key in ("file_path", "path", "notebook_path"):
        v = tool_input.get(key)
        if isinstance(v, str) and v:
            p = Path(v)
            try:
                out.add(str(p.resolve().relative_to(REPO_ROOT)))
            except Exception:
                out.add(v)
    return out


def main() -> int:
    try:
        payload = json.load(sys.stdin)
    except Exception:
        return 0

    tool_input = payload.get("tool_input", {}) or {}
    touched = touched_paths(tool_input)
    if not touched:
        return 0

    anchors = [a for a in all_anchors() if a.path in touched]
    if not anchors:
        return 0

    cache = load_cache()
    changed = False
    warnings = []

    for anchor in anchors:
        st = check_anchor(anchor, cache)
        if st.state == "moved":
            cache.pop(anchor.key, None)
            np = st.moved_to.split("#")[0]
            ns = int(st.moved_to.split("#L")[1].split("-")[0])
            ne = int(st.moved_to.split("-L")[1])
            entry = anchor_to_cache_entry(
                Anchor(path=np, start=ns, end=ne, sha=anchor.sha,
                       label=anchor.label, feature=anchor.feature, url=anchor.url)
            )
            if entry is not None:
                cache[st.moved_to] = entry
                rewrite_doc_range(anchor.feature, anchor.key, st.moved_to)
                changed = True
        elif st.state in ("drift", "missing"):
            warnings.append(
                f"  * {anchor.feature}: {anchor.key} - {st.detail}\n"
                f"    why-doc may be stale -> features/{anchor.feature}.md"
            )

    if changed:
        save_cache(cache)

    if warnings:
        print(
            "[feature-docs] Code changed behind a documented rationale. Review whether "
            "the why still holds, then reconcile with the feature-docs skill (it re-pins "
            "the anchor + cache):\n" + "\n".join(warnings),
            file=sys.stderr,
        )

    return 0


if __name__ == "__main__":
    sys.exit(main())
