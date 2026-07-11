#!/usr/bin/env node

/**
 * validate-kinds-guidance.js — keep the AUTHORING GUIDANCE in lockstep with the kind registry
 * (scripts/lib/blog-kinds.json).
 *
 * blog-kinds.json is the single source of truth for the post-kind taxonomy (emoji + description +
 * outline per kind). Several things already stay in sync with it MECHANICALLY: the outline checks
 * (validate-post-outline.js reads the JSON), the sidebar emoji (draft-docs plugin), and the READER
 * legend (the `legend-drift` check in validate-post-outline.js guards docs/handbook/README.mdx).
 *
 * This validator guards the OTHER side the mechanical checks miss: the AUTHORING skill's guidance
 * (the author-post skill — its per-kind checklists under kinds/*.md and the mechanics.md snapshot).
 * Guidance rots silently (the old author-blog-post skill shipped a stale 9-kind table while the JSON
 * had 32). The rules:
 *
 *   orphan-kind-file  [ERROR]  a kinds/<name>.md checklist exists for a `name` that is NOT a kind in
 *                              blog-kinds.json (the kind was renamed/removed but the checklist
 *                              lingers, so it points authors at a dead kind). Rename/remove it.
 *   missing-sot       [ERROR]  mechanics.md lost its "SOURCE OF TRUTH: blog-kinds.json" pointer —
 *                              the anti-duplication guardrail that stops the skill re-growing a
 *                              parallel kind table. It MUST be present.
 *   stale-kind-ref    [WARN]   mechanics.md / a kinds/*.md names a `kind: <x>` that is not in the
 *                              JSON (a stale reference — the kind was renamed). Advisory.
 *   uncovered-kind    [WARN]   informational: kinds in the JSON with no kinds/<name>.md checklist.
 *                              Most kinds legitimately don't need one (they're covered by their home
 *                              guide + the JSON outline); this is a nudge, never a failure.
 *
 * The fix when it ERRORs: reconcile the guidance with blog-kinds.json — see the `manage-kinds` skill
 * (which owns the add/rename/retire-a-kind lockstep) and author-post/mechanics.md.
 *
 * Usage:  node scripts/validate-kinds-guidance.js
 * Exit:   2 on any ERROR (orphan-kind-file / missing-sot); else 0 (WARNs never fail).
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const REPO = path.join(ROOT, '..'); // repo root (skills live outside bytesofpurpose-blog/)
const KINDS_JSON_REL = 'scripts/lib/blog-kinds.json';
const SKILL_DIR_REL = '.claude/skills/author-post';
const MECHANICS_REL = path.join(SKILL_DIR_REL, 'mechanics.md');
const KINDS_DIR_REL = path.join(SKILL_DIR_REL, 'kinds');

function readKinds() {
  const txt = fs.readFileSync(path.join(ROOT, KINDS_JSON_REL), 'utf8');
  return Object.keys(JSON.parse(txt).kinds || {});
}

// The kinds/<name>.md checklists that exist in the author-post skill (name = the kind slug).
function readKindFiles() {
  const dir = path.join(REPO, KINDS_DIR_REL);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => f.replace(/\.md$/, ''));
}

function main() {
  const kinds = new Set(readKinds());
  if (kinds.size === 0) {
    console.error(`✗ kinds-guidance: could not read any kinds from ${KINDS_JSON_REL} — is it intact?`);
    process.exit(2);
  }

  const errors = [];
  const warns = [];

  // ── orphan-kind-file [ERROR] ────────────────────────────────────────────────────────────────────
  const kindFiles = readKindFiles();
  for (const name of kindFiles) {
    if (!kinds.has(name)) {
      errors.push(
        `[orphan-kind-file] ${KINDS_DIR_REL}/${name}.md is a checklist for kind "${name}", which is NOT in blog-kinds.json. ` +
          `Rename it to the current kind slug, or remove it (the kind was renamed/retired).`,
      );
    }
  }

  // ── missing-sot [ERROR] ─────────────────────────────────────────────────────────────────────────
  const mechPath = path.join(REPO, MECHANICS_REL);
  let mechTxt = '';
  if (!fs.existsSync(mechPath)) {
    errors.push(`[missing-sot] ${MECHANICS_REL} does not exist — the authoring mechanics (kind system) must be documented there.`);
  } else {
    mechTxt = fs.readFileSync(mechPath, 'utf8');
    // The guardrail that stops the skill re-growing a parallel kind table.
    if (!/SOURCE OF TRUTH:\s*`?bytesofpurpose-blog\/scripts\/lib\/blog-kinds\.json`?/i.test(mechTxt) &&
        !/blog-kinds\.json[^\n]*source of truth/i.test(mechTxt)) {
      errors.push(
        `[missing-sot] ${MECHANICS_REL} lost its "SOURCE OF TRUTH: …/blog-kinds.json" pointer. ` +
          `Restore it so the skill does not re-grow a parallel (drift-prone) kind table.`,
      );
    }
  }

  // ── stale-kind-ref [WARN] — a `kind: <x>` named in guidance that isn't in the JSON ────────────────
  // Scan mechanics.md + every kinds/*.md for `kind: <slug>` references and flag unknown ones.
  const guidanceFiles = [];
  if (mechTxt) guidanceFiles.push([MECHANICS_REL, mechTxt]);
  for (const name of kindFiles) {
    const p = path.join(REPO, KINDS_DIR_REL, `${name}.md`);
    try {
      guidanceFiles.push([`${KINDS_DIR_REL}/${name}.md`, fs.readFileSync(p, 'utf8')]);
    } catch {
      /* ignore */
    }
  }
  const kindRefRe = /\bkind:\s*`?([a-z][a-z0-9-]*)`?/gi;
  const seenStale = new Set();
  for (const [rel, txt] of guidanceFiles) {
    let m;
    while ((m = kindRefRe.exec(txt)) !== null) {
      const ref = m[1].toLowerCase();
      // `kind:` in a template can legitimately be a placeholder; skip obvious non-kinds.
      if (ref === 'name' || ref === 'x' || ref === 'the') continue;
      if (!kinds.has(ref)) {
        const key = `${rel}::${ref}`;
        if (!seenStale.has(key)) {
          seenStale.add(key);
          warns.push(`[stale-kind-ref] ${rel} names \`kind: ${ref}\`, not in blog-kinds.json (renamed/retired?).`);
        }
      }
    }
  }

  // ── uncovered-kind [WARN] — informational only ────────────────────────────────────────────────────
  const covered = new Set(kindFiles.filter((n) => kinds.has(n)));
  const uncovered = [...kinds].filter((k) => !covered.has(k)).sort();

  // ── report ────────────────────────────────────────────────────────────────────────────────────────
  if (warns.length) {
    for (const w of warns) console.warn(`⚠ kinds-guidance: ${w}`);
  }
  // uncovered is intentionally quiet unless asked (it's the common, healthy state).
  if (process.argv.includes('--verbose') && uncovered.length) {
    console.warn(
      `⚠ kinds-guidance: ${uncovered.length} kind(s) have no kinds/<name>.md checklist (fine — most don't need one):\n   ${uncovered.join(', ')}`,
    );
  }

  if (errors.length === 0) {
    console.log(
      `✅ kinds-guidance: author-post guidance is in lockstep with ${KINDS_JSON_REL} ` +
        `(${kinds.size} kinds; ${covered.size} with a kinds/ checklist).`,
    );
    process.exit(0);
  }

  console.error(`🧩 kinds-guidance: ${errors.length} error(s) — the authoring guidance drifted from blog-kinds.json:`);
  for (const e of errors) console.error(`   • ${e}`);
  console.error(`\nReconcile with the \`manage-kinds\` skill (it owns the add/rename/retire-a-kind lockstep).`);
  process.exit(2);
}

main();
