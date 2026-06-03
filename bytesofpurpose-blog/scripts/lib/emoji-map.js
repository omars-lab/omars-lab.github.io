// Shared resolver for the sidebar-emoji convention. The data lives in emoji-map.json
// (single source of truth); this module loads it and answers two questions used by the
// validator, the detection hook, and the /suggest-emoji skill:
//
//   resolveFolderEmoji(relDir) -> the emoji a folder's docs should lead with, or null
//   isStandardFolder(relDir)   -> is this folder a KNOWN kind / learned / root (vs a
//                                 non-standard grab-bag the skill should ask about)?
//
// `relDir` is a path RELATIVE TO docs/ using forward slashes, instance included
// (e.g. "craft/blogging/embed-diagrams", "craft/software-development/scripting/research").
//
// Resolution order (most specific wins):
//   1. learned per-folder override  (folders[relDir])           — any depth
//   2. kind of the LAST path segment (kinds[basename])           — e.g. .../research -> 🔬
//   3. root topic, ONLY when relDir IS the root itself           — e.g. craft/blogging -> ✍️
// Anything that matches one of these is a "standard" folder. A folder matching none is
// non-standard: it needs a human-chosen emoji (the skill writes it back into `folders`).
//
// IMPORTANT: the root match is deliberately NOT a catch-all for everything nested under a
// topic — otherwise a grab-bag subfolder (craft/blogging/embed-diagrams) would silently
// inherit the topic emoji and never trigger the ask flow, defeating the hybrid intent. A
// nested non-kind folder resolves to null on purpose so the skill prompts for a fitting
// emoji and records it in `folders`.

const fs = require('fs');
const path = require('path');

const MAP_PATH = path.join(__dirname, 'emoji-map.json');

let _map = null;
function loadMap() {
  if (_map) return _map;
  try {
    _map = JSON.parse(fs.readFileSync(MAP_PATH, 'utf8'));
  } catch {
    _map = { kinds: {}, roots: {}, folders: {} };
  }
  _map.kinds = _map.kinds || {};
  _map.roots = _map.roots || {};
  _map.folders = _map.folders || {};
  return _map;
}

const norm = (relDir) => String(relDir || '').replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');

// The emoji a folder's docs should lead with — or null if the folder is non-standard
// (no kind/learned/root match). See resolution order above.
function resolveFolderEmoji(relDir) {
  const m = loadMap();
  const dir = norm(relDir);
  if (!dir) return null;

  if (m.folders[dir]) return m.folders[dir];

  const segs = dir.split('/');
  const base = segs[segs.length - 1];
  if (m.kinds[base]) return m.kinds[base];

  // Root match ONLY when relDir is the topic root itself (exactly instance/topic), so
  // nested grab-bag folders fall through to null and trigger the ask flow.
  if (segs.length === 2 && m.roots[dir]) return m.roots[dir];

  return null;
}

// Is this folder one the system already knows how to emoji (kind / learned / root)?
// A `false` here is what the detection hook nudges on and the skill resolves.
function isStandardFolder(relDir) {
  return resolveFolderEmoji(relDir) !== null;
}

module.exports = { loadMap, resolveFolderEmoji, isStandardFolder, MAP_PATH };
