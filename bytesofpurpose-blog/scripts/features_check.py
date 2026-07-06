#!/usr/bin/env python3
"""Full-sweep drift check for the features/ why-docs.

Run via `make features-check` (and useful in a pre-commit / deploy pre-flight).
For every anchor across every feature doc:

  - ok        -> in sync, nothing to do
  - moved     -> block relocated (rename / line-shift); re-key the cache silently and
                 rewrite the anchor's line range in the doc. NOT drift.
  - drift     -> block content changed in place; needs a human to re-read the why (use
                 the feature-docs skill to reconcile). Reported, non-zero exit.
  - uncached  -> anchor has no cache entry yet; seed it (with --seed).
  - missing   -> file/range gone and block not found anywhere; reported as drift.

Flags:
  --seed    Treat uncached anchors as authoritative and write their current hash into
            the cache (used right after authoring a doc).
  --quiet   Only print problems.

Exit 0 when everything is ok/moved (moves are auto-healed). Exit 1 when any drift/
missing/uncached remains, so a pre-commit / deploy pre-flight can fail on unreviewed drift.
"""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from features_lib import (  # noqa: E402
    Anchor,
    all_anchors,
    anchor_to_cache_entry,
    check_anchor,
    load_cache,
    save_cache,
    FEATURES_DIR,
)


def rewrite_doc_range(feature: str, old_key: str, new_key: str) -> None:
    """Update a moved anchor's path#L range inside its feature doc."""
    doc = FEATURES_DIR / f"{feature}.md"
    if not doc.exists():
        return
    old_path, old_frag = old_key.split("#", 1)
    new_path, new_frag = new_key.split("#", 1)
    text = doc.read_text(encoding="utf-8")
    updated = text.replace(f"{old_path}#{old_frag}", f"{new_path}#{new_frag}")
    if updated != text:
        doc.write_text(updated, encoding="utf-8")


def _rekey_moved(cache: dict, anchor: Anchor, moved_to: str) -> None:
    """Pop the old cache key, write a fresh entry at the new location, rewrite the doc."""
    cache.pop(anchor.key, None)
    np = moved_to.split("#")[0]
    ns = int(moved_to.split("#L")[1].split("-")[0])
    ne = int(moved_to.split("-L")[1])
    entry = anchor_to_cache_entry(
        Anchor(path=np, start=ns, end=ne, sha=anchor.sha, label=anchor.label,
               feature=anchor.feature, url=anchor.url)
    )
    if entry is not None:
        cache[moved_to] = entry
    rewrite_doc_range(anchor.feature, anchor.key, moved_to)


def main(argv: list[str]) -> int:
    seed = "--seed" in argv
    quiet = "--quiet" in argv

    cache = load_cache()
    anchors = all_anchors()
    if not anchors:
        if not quiet:
            print("No feature anchors found (features/*.md).")
        return 0

    problems = 0
    healed = 0
    seeded = 0
    for anchor in anchors:
        st = check_anchor(anchor, cache)

        if st.state == "ok":
            if not quiet:
                print(f"ok       {anchor.key}  [{anchor.feature}]")
            continue

        if st.state == "uncached":
            entry = anchor_to_cache_entry(anchor)
            if seed and entry is not None:
                cache[anchor.key] = entry
                seeded += 1
                if not quiet:
                    print(f"seeded   {anchor.key}  [{anchor.feature}]")
            else:
                problems += 1
                print(f"UNCACHED {anchor.key}  [{anchor.feature}] - {st.detail}"
                      f"{'' if entry else ' (unreadable)'}")
            continue

        if st.state == "moved":
            _rekey_moved(cache, anchor, st.moved_to)
            healed += 1
            print(f"moved    {anchor.key} -> {st.moved_to}  [{anchor.feature}] (auto-healed)")
            continue

        # drift / missing
        problems += 1
        print(f"DRIFT    {anchor.key}  [{anchor.feature}] - {st.detail}")
        print(f"         why-doc may be stale: features/{anchor.feature}.md")
        print(f"         reconcile with the feature-docs skill after re-reading the why.")

    if healed or seeded:
        save_cache(cache)

    if not quiet:
        print(
            f"\n{len(anchors)} anchor(s): "
            f"{healed} moved/healed, {seeded} seeded, {problems} needing review."
        )
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
