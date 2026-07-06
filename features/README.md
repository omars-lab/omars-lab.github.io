# Feature why-docs

This directory holds **why-docs**: one Markdown file per notable feature that records
**why** it exists and links the **exact code** that implements it. It answers the question
a future reader (or a future me) always asks: "why is this here, and where does it live?"

A why-doc is NOT API docs and NOT a changelog. It is the durable rationale behind a design
decision, pinned to the code so it cannot silently drift out of sync.

## The format

Each `features/<id>.md` has three parts:

- **`## Why`** the durable prose: the problem, the decision, the tradeoff. This is the part
  a human writes and re-reads.
- **`## Code`** a list of GitHub-permalink anchors to the exact blocks that implement it:

  ```
  - https://github.com/omars-lab/omars-lab.github.io/blob/<sha>/<path>#L<start>-L<end> - a short label
  ```

  The `<sha>` is provenance (it makes the link open the code as it was when documented);
  drift detection does NOT use it, so it need not be bumped by hand.
- **`## Notes`** (optional) anything else worth recording.

## How drift is caught (and auto-healed)

The engine (`bytesofpurpose-blog/scripts/features_lib.py`) is **content-hash based**, not
text-diff based. A cache (`features/.anchors.json`, committed so a fresh clone / CI can check
drift with no seed step) stores the normalized hash of each anchored block. On a check it
recomputes the current on-disk block's hash and compares:

- **ok** the hash matches: in sync.
- **moved** the hash is gone from the pinned location but found (unambiguously) elsewhere:
  the block only MOVED (a rename or a line-shift). The cache is re-keyed and the doc's line
  range is rewritten **silently** (nothing conceptually changed). To disambiguate two
  identical blocks, a hash of the block plus 3 lines of context on each side is used.
- **drift** the block content changed IN PLACE: a warning. This needs a human to re-read the
  `## Why` and decide if the rationale still holds, then re-pin.
- **missing** the file/range is gone and the block is nowhere: reported as drift.

The key invariant: a hook may only re-key **unchanged** content. It may **never** auto-bless
changed content. Real drift is a signal to review intent, using the **feature-docs** skill to
reconcile (re-read the why, then re-seed the hash).

Normalization means formatting-only edits (trailing whitespace, blank-line runs) do not trip
drift, so the check is quiet unless code behind a rationale genuinely changed.

## Commands

- **`make features-check`** the full sweep. Auto-heals moves, reports drift/missing/uncached,
  exits non-zero on any unreviewed drift (so a pre-commit / deploy pre-flight can gate on it).
- **`make features-seed`** seed the cache hash for any new/uncached anchors (run right after
  authoring or reconciling a doc).
- A PostToolUse hook (`.claude/hooks/check-feature-docs-hook.py`) runs on every edit: it
  silently re-keys a moved block and warns (never blocks) on real drift.

The **feature-docs** skill is the guided flow for authoring a new why-doc or reconciling a
drifted one.
