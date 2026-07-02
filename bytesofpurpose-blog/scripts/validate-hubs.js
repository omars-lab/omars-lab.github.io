#!/usr/bin/env node

/**
 * validate-hubs.js — keep the durable HUB system in lockstep with the hub registry.
 *
 * A "hub" is a /craft index page (kind: hub) that catalogs /initiatives posts of one activity
 * kind, grouped by area, via a generated <Catalog>. The SINGLE REGISTRY of hubs is the HUBS
 * manifest exported by scripts/generate-hubs-data.js (kind -> {out, file, areas}). This
 * validator checks both sides of that contract:
 *
 *  ERROR (exit 2) — would ship a broken hub:
 *   - a `kind: hub` doc whose body renders NO <Catalog> (the hub would be an empty page).
 *   - a `kind: hub` doc whose <Catalog kind="X"/> names a kind with no HUBS entry.
 *   - a hub-kind post (kind in HUBS) with NO `area:` (it silently vanishes from its hub).
 *   - a hub-kind post whose `area:` is not in that hub's `areas` list (lands in "other").
 *
 *  WARN — hygiene, not a build-breaker:
 *   - a hub kind in the registry with NO `kind: hub` doc rendering it (an orphan hub).
 *
 * The fix when it ERRORS: add the missing `area:` (or a <Catalog>), or correct the kind — the
 * same change that created the hub/post. To add a NEW hub, add an entry to the HUBS manifest in
 * generate-hubs-data.js AND a `kind: hub` doc that renders <Catalog kind="…"/> (see manage-hubs).
 *
 * Usage:  node scripts/validate-hubs.js
 * Exit:   2 on any ERROR; else 0.
 */

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const {HUBS} = require('./generate-hubs-data.js');

const ROOT = path.join(__dirname, '..');
const DOCS_DIR = path.join(ROOT, 'docs');
const BLOG_DIR = path.join(ROOT, 'blog');

// kind -> hub entry (the activity kinds that power a hub).
const HUB_KINDS = Object.fromEntries(Object.values(HUBS).map((h) => [h.kind, h]));

function listFiles(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, {withFileTypes: true})) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...listFiles(full));
    else if (/\.mdx?$/.test(e.name) && !e.name.startsWith('_')) out.push(full);
  }
  return out;
}

function read(file) {
  try {
    const g = matter(fs.readFileSync(file, 'utf8'));
    return {fm: g.data || {}, body: g.content || ''};
  } catch {
    return null;
  }
}

const errors = [];
const warns = [];
const hubKindsRendered = new Set(); // hub kinds that have a `kind: hub` doc rendering them

// ── 1. Every `kind: hub` DOC: renders a <Catalog> naming a registered kind. ─────────────────
for (const file of listFiles(DOCS_DIR)) {
  const r = read(file);
  if (!r || r.fm.kind !== 'hub') continue;
  const rel = path.relative(ROOT, file);
  const m = r.body.match(/<Catalog\s+kind=["']([a-z-]+)["']/);
  if (!m) {
    errors.push(`${rel}: kind: hub doc renders no <Catalog kind="…"/> (the hub would be empty).`);
    continue;
  }
  const kind = m[1];
  if (!HUB_KINDS[kind]) {
    errors.push(
      `${rel}: <Catalog kind="${kind}"/> names a kind with no HUBS entry — add it to the HUBS manifest in generate-hubs-data.js, or fix the kind.`,
    );
    continue;
  }
  hubKindsRendered.add(kind);
}

// ── 2. Every hub-kind POST: has a valid `area`. ─────────────────────────────────────────────
for (const file of listFiles(BLOG_DIR)) {
  const r = read(file);
  if (!r) continue;
  const kind = r.fm.kind;
  const hub = kind && HUB_KINDS[kind];
  if (!hub) continue;
  const rel = path.relative(ROOT, file);
  if (!r.fm.area) {
    errors.push(
      `${rel}: kind: ${kind} post has no \`area:\` — it will not appear on the ${kind} hub. Add area: ${hub.areas.filter((a) => a !== 'other').join('|')}.`,
    );
  } else if (!hub.areas.includes(r.fm.area)) {
    errors.push(
      `${rel}: area: "${r.fm.area}" is not a ${kind}-hub area (${hub.areas.join('|')}) — it will land under "other".`,
    );
  }
}

// ── 3. WARN on an orphan hub kind (registered but no doc renders it). ───────────────────────
for (const [id, hub] of Object.entries(HUBS)) {
  if (!hubKindsRendered.has(hub.kind)) {
    warns.push(
      `hub "${id}" (kind: ${hub.kind}) is in the HUBS registry but no \`kind: hub\` doc renders <Catalog kind="${hub.kind}"/>.`,
    );
  }
}

for (const w of warns) console.error(`⚠️  hubs: ${w}`);

if (errors.length === 0) {
  console.log(
    `✅ hubs: ${Object.keys(HUBS).length} hub(s) OK — every kind: hub doc renders a registered <Catalog>, every hub-kind post has a valid area.`,
  );
  process.exit(0);
}

console.error(`\n🗂  hubs: ${errors.length} problem(s) that would ship a broken hub:`);
for (const e of errors) console.error(`   • ${e}`);
console.error(
  `\nFix the area/<Catalog>/kind (the same change that created the hub or post). See the manage-hubs skill.`,
);
process.exit(2);
