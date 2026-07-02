#!/usr/bin/env node
/**
 * Stop hook: remind to RESTART the local dev server when this session changed the ROUTE
 * TABLE while a `make start` server is running.
 *
 * Why: a long-running Docusaurus dev server (`make start`, :3000) caches its route table
 * at startup. When a session ADDS / MOVES / DELETES a route-shaping file (a doc, a slug, a
 * redirect, a component registration), those routes go stale until the server is restarted
 * — and `curl` returns a FALSE 200 for a stale route, so it is easy to believe you verified
 * something you did not (this is the serve-locally "stale route table" gotcha). A restart
 * (prestart re-runs generate-assets and rebuilds the route table) fixes it.
 *
 * Fires ONLY when BOTH are true (else silent — a reminder that cries wolf gets ignored):
 *   (a) a dev server is actually listening on :3000, AND
 *   (b) this session touched a route-shaping file.
 *
 * Route-shaping = something that changes which URLs exist or where they resolve:
 *   - a moved/added/deleted doc or blog post (docs/**, blog/**, thoughts/**, changelog/**,
 *     designs/**, mindset/** … any .md/.mdx under a content dir), or a _category_.json
 *   - an edit to docusaurus.config.js (redirects / plugin routes) or a sidebars-*.js
 *   - an edit to src/theme/MDXComponents.tsx (a newly registered component a page uses)
 *   - an edit to a page under src/pages/**
 * A pure body edit to an EXISTING doc does NOT need a restart (the dev server hot-reloads
 * content), so we do not fire on a plain Write/Edit to a single existing content file with
 * an unchanged path — we key on ADD/DELETE/RENAME and on the config/registration files.
 *
 * Output: non-blocking advisory. Print to stderr + emit {systemMessage}; always exit 0.
 */
const fs = require('fs');
const { execSync } = require('child_process');

function readStdin() {
  try { return fs.readFileSync(0, 'utf8'); } catch { return ''; }
}

// Is a dev server listening on :3000? (make start / docusaurus start). Best-effort: if we
// cannot tell, assume NOT running (fail quiet — never nag when unsure).
function devServerRunning() {
  try {
    const out = execSync('lsof -ti:3000 2>/dev/null', { encoding: 'utf8' }).trim();
    return out.length > 0;
  } catch {
    return false;
  }
}

// Route-shaping path predicate.
function isRouteShaping(p) {
  if (!p) return false;
  // Config / registration files whose EDIT alone can change routing.
  if (/bytesofpurpose-blog\/docusaurus\.config\.js$/.test(p)) return true;
  if (/bytesofpurpose-blog\/sidebars-[\w-]+\.js$/.test(p)) return true;
  if (/bytesofpurpose-blog\/src\/theme\/MDXComponents\.tsx$/.test(p)) return true;
  if (/bytesofpurpose-blog\/src\/pages\//.test(p)) return true;
  // Content files: a doc/post or a category descriptor.
  if (/bytesofpurpose-blog\/(docs|blog|thoughts|mindset|questions|changelog|designs)\/.*\.(md|mdx)$/.test(p)) return true;
  if (/bytesofpurpose-blog\/.*\/_category_\.json$/.test(p)) return true;
  return false;
}

// From a Bash command string, pull paths that were MOVED/DELETED (git mv / git rm / rm /
// mv). An add of a brand-new route also needs a restart; new files show up via Write to a
// route-shaping path (handled in the transcript scan), so here we focus on move/delete.
function routeShapingInBashCmd(cmd) {
  if (!cmd) return false;
  if (!/\b(git\s+mv|git\s+rm|(^|\s)mv\s|(^|\s)rm\s|rmdir)\b/.test(cmd)) return false;
  // Any route-shaping-looking token in the command?
  return /bytesofpurpose-blog\/(docs|blog|thoughts|mindset|questions|changelog|designs)\/\S+\.(md|mdx)|_category_\.json|docusaurus\.config\.js|MDXComponents\.tsx|src\/pages\//.test(cmd);
}

function main() {
  let input;
  try { input = JSON.parse(readStdin() || '{}'); } catch { process.exit(0); }
  if (input.stop_hook_active) process.exit(0);           // avoid re-trigger loops

  // Cheap gate FIRST: if no dev server is up, there is nothing to restart.
  if (!devServerRunning()) process.exit(0);

  const transcript = input.transcript_path;
  if (!transcript || !fs.existsSync(transcript)) process.exit(0);

  let raw;
  try { raw = fs.readFileSync(transcript, 'utf8'); } catch { process.exit(0); }

  const hits = new Set();
  for (const line of raw.split('\n')) {
    if (!line) continue;
    let o;
    try { o = JSON.parse(line); } catch { continue; }
    const content = o && o.message && o.message.content;
    if (!Array.isArray(content)) continue;
    for (const c of content) {
      if (c.type !== 'tool_use' || !c.input) continue;
      // Write to a route-shaping path = a NEW file at a new route (or a config/registration
      // edit). A plain Edit to an existing content doc hot-reloads, so we treat Write as the
      // add signal and Edit as significant only for the config/registration files.
      if (c.name === 'Write' && isRouteShaping(c.input.file_path)) {
        hits.add(c.input.file_path);
      } else if (c.name === 'Edit' || c.name === 'MultiEdit') {
        const p = c.input.file_path || '';
        if (/docusaurus\.config\.js$|sidebars-[\w-]+\.js$|MDXComponents\.tsx$|src\/pages\//.test(p)) {
          hits.add(p);
        }
      } else if (c.name === 'Bash' && routeShapingInBashCmd(c.input.command)) {
        hits.add('(git mv/rm of a content route)');
      }
    }
  }

  if (hits.size === 0) process.exit(0);

  const sample = [...hits].slice(0, 4).map((h) => `  • ${h.replace(/^.*bytesofpurpose-blog\//, '')}`);
  const msg = [
    '',
    '🔁 Dev-server restart reminder: a server is running on :3000 and this session changed',
    '   the ROUTE TABLE (added/moved/deleted a doc, a redirect, a slug, or a component',
    '   registration). A long-running `make start` caches routes at startup, so new/moved',
    '   routes are STALE until you restart — and curl returns a false 200 for a stale route.',
    'Route-shaping change(s) this session:',
    ...sample,
    (hits.size > 4 ? `  • …and ${hits.size - 4} more` : ''),
    'Restart to refresh (prestart re-runs generate-assets + rebuilds the route table):',
    '   lsof -ti:3000 | xargs -r kill ; make start',
    '(See the serve-locally skill: "stale route table" gotcha.)',
    '',
  ].filter(Boolean).join('\n');

  process.stderr.write(msg + '\n');
  process.stdout.write(JSON.stringify({ systemMessage: msg }) + '\n');
  process.exit(0);
}

main();
