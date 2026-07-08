#!/usr/bin/env python3
"""Convert a MindNode bundle into Mermaid mindmap text.

A `.mindnode` file is a macOS bundle (a directory). Despite the name, the
`contents.xml` inside it is an Apple *binary* property list, not XML. This
script reads that plist and emits Mermaid mindmap syntax
(https://mermaid.js.org/syntax/mindmap.html) on stdout, and nothing else, so it
composes cleanly into a pipeline (see the import-mindnode skill).

Two shapes of source are handled:
  - classic bundle : a directory `Foo.mindnode/` containing `contents.xml`
  - zipped single-file : a `Foo.mindnode` file that is actually a zip archive
    with `contents.xml` inside (newer MindNode). We try this as a fallback.

Mermaid mindmaps are a single-rooted tree with no cross-links, while a MindNode
document can hold several disconnected top-level nodes plus arbitrary
cross-connection arrows. So:
  - one top-level node  -> it becomes the mermaid `root((...))`
  - many top-level nodes -> we synthesize a root (the bundle name, or
    --root-label) and hang the top-level nodes under it
  - cross-connections    -> emitted as trailing `%% cross-connection:` comments
    (mermaid mindmaps cannot draw them; the comments preserve the information
    for a human or the <MindMap> component to represent another way)

Node titles in MindNode are stored as a small HTML snippet
(`<p style='...'>Label</p>`); we strip the markup and unescape entities.

Usage:
    python3 scripts/convert-mindnode.py <path/to/Bundle.mindnode> [--root-label "..."]

Stdlib only, no third-party dependencies.
"""

import argparse
import html
import io
import os
import plistlib
import re
import sys
import zipfile
from html.parser import HTMLParser


class _TextExtractor(HTMLParser):
    """Collect the visible text out of a MindNode title HTML snippet."""

    def __init__(self):
        super().__init__()
        self._parts = []

    def handle_data(self, data):
        self._parts.append(data)

    def text(self):
        return "".join(self._parts)


def strip_html(snippet):
    """`<p style='...'>The Starter</p>` -> `The Starter` (entities unescaped)."""
    if not snippet:
        return ""
    parser = _TextExtractor()
    parser.feed(snippet)
    parser.close()
    return html.unescape(parser.text()).strip()


def sanitize_label(text):
    """Make a label safe to sit inside a mermaid mindmap node.

    Mermaid treats `()[]{}` as shape delimiters and newlines as node breaks, so
    we neutralize them. We keep it readable rather than escaped: parentheses and
    brackets become their unicode fullwidth-ish look-alikes only when they would
    break parsing; here we simply swap to spaced/soft variants and collapse
    whitespace. The <MindMap> component parser applies the same normalization,
    so what renders on mermaid.live and in the component agree.
    """
    if not text:
        return ""
    # collapse any internal whitespace (titles may contain hard newlines)
    text = re.sub(r"\s+", " ", text).strip()
    # neutralize mermaid shape delimiters so a label never opens/closes a shape
    replacements = {
        "(": "（",  # fullwidth left paren
        ")": "）",  # fullwidth right paren
        "[": "［",  # fullwidth left bracket
        "]": "］",  # fullwidth right bracket
        "{": "｛",  # fullwidth left brace
        "}": "｝",  # fullwidth right brace
    }
    return "".join(replacements.get(ch, ch) for ch in text)


def node_location(node):
    """Parse the `{x, y}` location string into an (x, y) float tuple.

    MindNode stores each node's canvas position as a string like
    `{-501.478, -3525.546}`. We use x to recover the author's left-to-right
    reading order for top-level nodes (plist order is arbitrary). Returns
    (inf, inf) when absent so unpositioned nodes sort to the end stably.
    """
    loc = node.get("location")
    if isinstance(loc, str):
        nums = re.findall(r"-?\d+(?:\.\d+)?", loc)
        if len(nums) >= 2:
            return (float(nums[0]), float(nums[1]))
    return (float("inf"), float("inf"))


def node_title(node):
    title = node.get("title")
    if isinstance(title, dict):
        return strip_html(title.get("text", ""))
    if isinstance(title, str):
        return strip_html(title)
    return ""


def load_mindmap(path):
    """Return the `mindMap` dict from a .mindnode bundle or zipped file."""
    if os.path.isdir(path):
        contents = os.path.join(path, "contents.xml")
        if not os.path.isfile(contents):
            raise SystemExit(
                f"error: {path} is a directory but has no contents.xml; "
                f"is it a MindNode bundle?"
            )
        with open(contents, "rb") as fh:
            data = plistlib.load(fh)
    elif zipfile.is_zipfile(path):
        with zipfile.ZipFile(path) as zf:
            name = next(
                (n for n in zf.namelist() if n.endswith("contents.xml")), None
            )
            if name is None:
                raise SystemExit(
                    f"error: {path} is a zip archive but has no contents.xml "
                    f"entry; unsupported MindNode format."
                )
            data = plistlib.load(io.BytesIO(zf.read(name)))
    else:
        raise SystemExit(
            f"error: {path} is neither a MindNode bundle directory nor a zip "
            f"archive. Point this at a .mindnode bundle."
        )

    mindmap = data.get("mindMap")
    if not isinstance(mindmap, dict):
        raise SystemExit(
            f"error: {path} parsed, but has no `mindMap` dictionary. This may "
            f"be a MindNode format this script does not understand yet."
        )
    return mindmap


def bundle_name(path):
    base = os.path.basename(os.path.normpath(path))
    if base.endswith(".mindnode"):
        base = base[: -len(".mindnode")]
    return base or "Mind Map"


def emit_tree(nodes, out, depth):
    """Depth-first emit of nodes as indented mermaid mindmap lines.

    Indentation carries the hierarchy in mermaid; 2 spaces per level. Labels are
    emitted bare (no shape brackets) so they read as default rounded nodes.
    """
    for node in nodes:
        label = sanitize_label(node_title(node)) or "(untitled)"
        out.append("  " * depth + label)
        subs = node.get("subnodes") or []
        emit_tree(subs, out, depth + 1)


def build_mermaid(mindmap, root_label):
    main_nodes = mindmap.get("mainNodes") or []
    # Top-level nodes are scattered across the canvas in arbitrary plist order;
    # recover the author's left-to-right reading order from their x position.
    main_nodes = sorted(main_nodes, key=lambda n: node_location(n)[0])
    out = ["mindmap"]

    if len(main_nodes) == 1:
        root = main_nodes[0]
        out.append("  root((" + sanitize_label(node_title(root)) + "))")
        emit_tree(root.get("subnodes") or [], out, depth=2)
    else:
        out.append("  root((" + sanitize_label(root_label) + "))")
        emit_tree(main_nodes, out, depth=2)

    # Cross-connections: resolve node ids to labels, emit as comments.
    id_to_label = {}

    def index(nodes):
        for n in nodes:
            nid = n.get("nodeID")
            if nid:
                id_to_label[nid] = node_title(n)
            index(n.get("subnodes") or [])

    index(main_nodes)

    connections = mindmap.get("crossConnections") or []
    if connections:
        out.append("")
        for c in connections:
            start = id_to_label.get(c.get("startNodeID"), "?")
            end = id_to_label.get(c.get("endNodeID"), "?")
            label = ""
            title = c.get("title")
            if isinstance(title, dict):
                label = strip_html(title.get("text", ""))
            arrow = f"{start} --> {end}"
            if label:
                arrow = f"{start} -->|{label}| {end}"
            out.append(f"%% cross-connection: {arrow}")

    return "\n".join(out) + "\n"


def main(argv=None):
    parser = argparse.ArgumentParser(
        description="Convert a MindNode bundle to Mermaid mindmap text (stdout)."
    )
    parser.add_argument("bundle", help="path to a .mindnode bundle or file")
    parser.add_argument(
        "--root-label",
        default=None,
        help="root node label when the document has multiple top-level nodes "
        "(defaults to the bundle name)",
    )
    args = parser.parse_args(argv)

    mindmap = load_mindmap(args.bundle)
    root_label = args.root_label or bundle_name(args.bundle)
    sys.stdout.write(build_mermaid(mindmap, root_label))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
