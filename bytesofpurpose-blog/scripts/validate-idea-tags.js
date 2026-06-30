#!/usr/bin/env node

/**
 * validate-idea-tags.js — keep the board TAG-GLOSS registry (src/lib/idea-tags.ts) in lockstep
 * with the theme tags actually used on board posts.
 *
 * Each card on the Ideas/Experimentation board shows its theme tags, and every tag chip has a
 * hover/focus/tap tooltip explaining what the tag means (see KanbanBoard + src/lib/idea-tags.ts).
 * A tooltip is only useful if the tag HAS a gloss — so a board tag with no entry in IDEA_TAG_GLOSS
 * falls back to a generic "Ideas tagged …" bubble, which teaches the reader nothing. This validator
 * catches that drift: it collects the theme tags off every `board:`-carrying post and FAILS if any
 * is missing from the registry. It also WARNS on an orphan gloss (a registry entry for a tag no
 * board post uses) so the registry does not rot.
 *
 * The fix when it ERRORS: add the tag's one-sentence gloss to IDEA_TAG_GLOSS in src/lib/idea-tags.ts
 * (the same change that put the new tag on a post).
 *
 * Usage:  node scripts/validate-idea-tags.js
 * Exit:   2 if any board tag has no gloss; else 0 (orphan glosses are warn-only).
 */

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const ROOT = path.join(__dirname, '..');
const REGISTRY_REL = 'src/lib/idea-tags.ts';

// Post sources that can carry board cards — keep in lockstep with SOURCES in
// scripts/generate-kanban-data.js (the generator is the source of truth for the board's inputs).
const SOURCE_DIRS = ['blog', 'thoughts'];

// Always-on noise tags the board strips before showing chips — keep in lockstep with TAG_NOISE in
// scripts/generate-kanban-data.js. These never need a gloss (they are not chips).
const TAG_NOISE = new Set(['idea', 'ideas', 'thoughts', 'thought']);

// ── 1. Read the glossed tag slugs straight out of the registry source (no TS import). ─────────────
// The registry is `export const IDEA_TAG_GLOSS: Record<string,string> = { 'tag': '...', ... }`.
// We scan for the object KEYS (quoted or bare slug before a colon). Deliberately a string scan so
// the validator has zero build deps (matches validate-url-params' approach).
function readGlossedTags() {
  const txt = fs.readFileSync(path.join(ROOT, REGISTRY_REL), 'utf8');
  const start = txt.indexOf('IDEA_TAG_GLOSS');
  if (start === -1) return null;
  // bound the scan to the object literal so we don't pick up keys from the fallback function below.
  const open = txt.indexOf('{', start);
  const end = txt.indexOf('\n};', open);
  const body = txt.slice(open, end === -1 ? txt.length : end);
  const keys = new Set();
  // Each entry is its own line: `  'tag-slug': '...'` (or a bare `tag:` for slugs that are valid
  // identifiers). Scan line by line for a leading key, skipping comment lines — this is robust to
  // comment blocks BETWEEN entries (a regex with a `,`/`{` lookbehind misses the first key after a
  // comment). match  'slug':  /  "slug":  /  bareSlug:  at the start of a line.
  const lineKeyRe = /^\s*(?:'([a-z0-9-]+)'|"([a-z0-9-]+)"|([a-z][a-z0-9-]*))\s*:/i;
  for (const line of body.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('*')) continue; // comment line
    const m = lineKeyRe.exec(line);
    if (m) {
      const k = (m[1] || m[2] || m[3] || '').toLowerCase();
      if (k) keys.add(k);
    }
  }
  return keys;
}

// ── 2. Collect the theme tags off every board post. ──────────────────────────────────────────────
function themeTagsOf(tags) {
  if (!Array.isArray(tags)) return [];
  return tags
    .map((t) => (t == null ? '' : t.toString()).trim().toLowerCase())
    .filter((t) => t && !TAG_NOISE.has(t));
}

function collectBoardTags() {
  // tag → an example post that uses it (for the error message)
  const tagToPost = new Map();
  for (const rel of SOURCE_DIRS) {
    const dir = path.join(ROOT, rel);
    if (!fs.existsSync(dir)) continue;
    for (const name of fs.readdirSync(dir)) {
      if (!/\.mdx?$/.test(name) || name.startsWith('_')) continue;
      let fm;
      try {
        fm = matter(fs.readFileSync(path.join(dir, name), 'utf8')).data || {};
      } catch {
        continue;
      }
      // A post is a board post if it has `board:` OR an experiment kind (auto-boarded).
      const kind = (fm.kind || '').toString();
      const isBoard = !!fm.board || kind === 'experiment-plan' || kind === 'experiment-result';
      if (!isBoard) continue;
      for (const tag of themeTagsOf(fm.tags)) {
        if (!tagToPost.has(tag)) tagToPost.set(tag, `${rel}/${name}`);
      }
    }
  }
  return tagToPost;
}

// ── 3. Cross-check + report. ──────────────────────────────────────────────────────────────────────
function main() {
  const glossed = readGlossedTags();
  if (!glossed || glossed.size === 0) {
    console.error(`✗ idea-tags: could not parse IDEA_TAG_GLOSS from ${REGISTRY_REL} — is it intact?`);
    process.exit(2);
  }

  const boardTags = collectBoardTags();

  const missing = []; // {tag, post}  — board tag with NO gloss (ERROR)
  for (const [tag, post] of boardTags) {
    if (!glossed.has(tag)) missing.push({tag, post});
  }
  const orphans = []; // gloss for a tag no board post uses (WARN)
  for (const tag of glossed) {
    if (!boardTags.has(tag)) orphans.push(tag);
  }

  missing.sort((a, b) => a.tag.localeCompare(b.tag));
  orphans.sort();

  if (orphans.length > 0) {
    console.warn(
      `⚠ idea-tags: ${orphans.length} gloss(es) for tag(s) no board post uses (safe to keep, or prune):`,
    );
    for (const t of orphans) console.warn(`   • '${t}'`);
  }

  if (missing.length === 0) {
    console.log(
      `✅ idea-tags: every board tag has a gloss (${boardTags.size} tag(s) checked against ${glossed.size} in ${REGISTRY_REL}).`,
    );
    process.exit(0);
  }

  console.error(
    `🪧 idea-tags: ${missing.length} board tag(s) with NO gloss — add a one-line definition to IDEA_TAG_GLOSS in ${REGISTRY_REL}:`,
  );
  for (const {tag, post} of missing) {
    console.error(`   • '${tag}'  (e.g. on ${post})`);
  }
  console.error(
    `\nEach board chip's tooltip reads its gloss; a missing one falls back to a generic bubble that teaches nothing.`,
  );
  process.exit(2);
}

main();
