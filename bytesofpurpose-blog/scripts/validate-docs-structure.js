#!/usr/bin/env node

/**
 * validate-docs-structure.js — lints the topic-based docs information architecture.
 *
 * The docs/ tree is a TOPIC-based IA with a recurring folder contract (see the
 * review-reader-experience skill, "Topic-folder contract" section, and CLAUDE.md):
 *
 *   docs/
 *     welcome/              ← the topic index (Welcome); not itself a topic
 *     <N>-<topic>/          ← one root folder per reader-facing TOPIC
 *       README.{md,mdx}     ← topic landing, ABSOLUTE slug, _category_.json
 *       _category_.json     ← label + position
 *       terminology/        ← (optional) sorts FIRST
 *       <sub-folder>/       ← each carries a _category_.json; kebab-case
 *       prompts/            ← (optional) sorts LAST
 *
 * Invariants this checks (severity in []):
 *   absolute-slug   [ERROR] every doc has frontmatter `slug:` and it is ABSOLUTE (`/…`).
 *                           This is the whole URL-freeze guarantee — a relative slug
 *                           silently re-couples the URL to the folder path, so moving
 *                           the file moves the URL. Hook-blocking tier.
 *   topic-readme    [warn]  each root topic folder has a README.{md,mdx} with an
 *                           absolute slug + a _category_.json (label + position).
 *   subfolder-cat   [warn]  every sub-folder that contains docs has a _category_.json.
 *   orphan-cat      [warn]  a _category_.json in a dir with no docs AND no
 *                           docs-bearing descendants (pure dead category).
 *   numeric-prefix  [warn]  folder NAMES carry no numeric ordering prefix (`6-projects`);
 *                           order comes from `_category_.json` "position", never the
 *                           name. WHY: a name prefix couples order to identity — bumping
 *                           a `position` is a 1-line history-clean edit, whereas renaming
 *                           a prefixed folder rewrites every descendant's path.
 *   kebab-case      [warn]  doc/dir names are kebab-case, no spaces/uppercase
 *                           (`_`-prefixed names like _TEMPLATE/_category_ are exempt).
 *   framing-folder  [warn]  no framing-word / topic-echo sub-folder names
 *                           (`*-techniques`, `*-craftsmanship`, `definitions`).
 *   depth           [warn]  folder depth ≤ 5 under a topic root. The Craft/Self
 *                           split adds one container tier above the former topics
 *                           (craft = topic root → software-development → frontend-
 *                           development → techniques → <doc> is a legitimate depth-5
 *                           chain), so the contract is ≤5 from the craft/self root.
 *   terminology-first [warn]  a `terminology/` category sorts first (low position).
 *   prompts-last    [warn]  a `prompts/` category sorts last (high position).
 *   welcome-drift   [warn]  the Welcome topic-index cards (`### [Label](slug)`) match
 *                           the actual root topic folders + their README slugs.
 *   idea-exec-link  [warn]  the idea↔execution mapping convention: links inside an
 *                           `## Execution` section (Product Management idea docs) or an
 *                           `## Idea`/`## Origin` section (Software Development artifacts)
 *                           must resolve to an existing doc slug. Cross-topic dangling
 *                           cross-refs are warned (never blocks; backfill is incremental).
 *   description-missing  [warn]  doc has no frontmatter `description:` (feeds og:description
 *                           for SEO/social + the ShareButton "Here's what it covers:" message).
 *   description-length   [warn]  description outside ~50–160 chars (too thin for a useful
 *                           summary, or truncated in search/social cards).
 *   description-duplicate [warn]  same `description:` reused across docs — each page needs a
 *                           distinct summary (it's per-page SEO + per-page share text).
 *   blog-trigger-vocab [warn]  a doc's `blog_trigger:` value is outside the controlled
 *                           vocabulary (see BLOG_TRIGGERS). The blog-post-triggers doc
 *                           owns this taxonomy; an unknown trigger means the doc and the
 *                           taxonomy have drifted.
 *   blog-post-exists  [warn]  a doc sets `blog_post:` but no `/blog/` post carries that
 *                           slug — the companion-post back-reference dangles.
 *   blog-post-orphan  [warn]  a `/blog/` post links a `/docs/<slug>` whose doc has no
 *                           matching `blog_post:` back-reference — wire the loop closed
 *                           (the doc should point back at its companion post).
 *   legacy-namespace  [warn]  a doc's slug starts with a retired root namespace (e.g.
 *                           `/mental-models/`). That cross-cutting namespace was dissolved
 *                           into per-topic mental-models/ subdirs; new docs must be
 *                           topic-first (old URLs are preserved via client redirects).
 *   emoji-prefix-category [warn]  a `_category_.json` `label` (sidebar section) does not start
 *                           with an emoji. Convention: every sidebar section leads with one
 *                           emoji so the sidebar scans visually (see the topic→emoji map in
 *                           docs/.../emojis.mdx, slug /definitions/emojis-for-activities).
 *   emoji-prefix-doc  [warn]  AGGREGATE — count of docs whose resolved sidebar label
 *                           (`sidebar_label` || `title`) lacks a leading emoji. Emitted as a
 *                           single rolled-up finding (most leaf docs have no emoji today, so a
 *                           per-doc warn would bury the category findings). `--emoji` lists them.
 *   sidebar-label-missing [warn]  a doc has NEITHER `title` NOR `sidebar_label`, so its sidebar
 *                           entry falls back to the raw FILENAME. Regression guard (0 today).
 *
 * Usage:
 *   node scripts/validate-docs-structure.js [paths…]   # scan (default: docs/)
 *   node scripts/validate-docs-structure.js --json      # machine-readable findings
 *   node scripts/validate-docs-structure.js --error-only # ERROR-tier only; exit 2 (hook)
 *   node scripts/validate-docs-structure.js --emoji      # expand emoji-prefix-doc to one
 *                                                          finding per offending doc (else
 *                                                          rolled up into a single count)
 *
 * Exit codes: 0 clean · 1 problems found (scan) · 2 ERROR-tier found (--error-only).
 */

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
// Single source of truth for the sidebar-emoji convention (kind-map + learned per-folder
// overrides + root topics). Shared with the detection hook and the /suggest-emoji skill.
const { resolveFolderEmoji, isStandardFolder } = require('./lib/emoji-map.js');

// Blog/doc kind -> emoji, from the taxonomy source of truth. A doc that carries a known
// `kind:` (e.g. `kind: hub`) gets its emoji PREPENDED at runtime by the draft-docs plugin's
// docs kind-emoji wiring, so such a doc's plain (emoji-less) title is INTENTIONAL and must
// not be flagged by the emoji-prefix-doc check below.
let KIND_EMOJI = {};
try {
  const {kinds} = JSON.parse(fs.readFileSync(path.join(__dirname, 'lib', 'blog-kinds.json'), 'utf8'));
  for (const [k, v] of Object.entries(kinds)) if (v.emoji) KIND_EMOJI[k] = v.emoji;
} catch {
  KIND_EMOJI = {};
}

const ROOT = path.join(__dirname, '..');
const DOCS = path.join(ROOT, 'docs');
const WELCOME = 'docs/welcome';

const SEVERITY = {
  'absolute-slug': 'error',
  'topic-readme': 'warn',
  'subfolder-cat': 'warn',
  'orphan-cat': 'warn',
  'kebab-case': 'warn',
  'framing-folder': 'warn',
  depth: 'warn',
  'terminology-first': 'warn',
  'prompts-last': 'warn',
  'welcome-drift': 'warn',
  'idea-exec-link': 'warn',
  'numeric-prefix': 'warn',
  // `description:` frontmatter — feeds both SEO (og:description) and the ShareButton
  // "Here's what it covers:" share message. All warn-tier (advisory, like the rest).
  'description-missing': 'warn',
  'description-length': 'warn',
  'description-duplicate': 'warn',
  // blog↔doc trigger convention — see docs/blogging/blog-post-triggers.mdx. A doc that
  // marks itself post-worthy (`blog_trigger:`) gets a companion post in /blog/ that links
  // back to it; these rules keep the taxonomy + the doc↔post back-reference honest.
  'blog-trigger-vocab': 'warn',
  'blog-post-exists': 'warn',
  'blog-post-orphan': 'warn',
  // Retired URL namespace. The cross-cutting /mental-models/* root slug namespace was
  // dissolved into per-topic mental-models/ subdirs (topic-first slugs); the old URLs
  // live on via client redirects. New docs must NOT reintroduce a /mental-models/* slug.
  'legacy-namespace': 'warn',
  // Premium-content gating (see the premium-content-gating design + manage-premium-content
  // skill). `premium: true` marks a doc whose body is ENCRYPTED at build time and gated
  // client-side (sign in with LinkedIn → Worker vends the key → in-browser decrypt). These
  // keep the frontmatter healthy + mutually-sane with `draft`. All warn-tier (advisory) —
  // the BLOCKING guarantee (no premium plaintext ever ships) is the separate ERROR-tier
  // deploy gate scripts/verify-premium-encrypted.js, not a lint rule.
  'premium-type': 'warn',
  'premium-draft-conflict': 'warn',
  'premium-needs-teaser': 'warn',
  // Sidebar-label emoji convention — every sidebar section (`_category_.json` label) leads
  // with one emoji so the sidebar scans visually (the topic→emoji map lives in
  // docs/.../emojis.mdx, slug /definitions/emojis-for-activities). All warn-tier (advisory).
  // emoji-prefix-doc is AGGREGATED into one finding by default (most leaf docs lack emoji);
  // `--emoji` expands it per-doc. sidebar-label-missing guards against a doc with no
  // title/sidebar_label falling back to its raw filename in the sidebar.
  'emoji-prefix-category': 'warn',
  'emoji-prefix-doc': 'warn',
  'sidebar-label-missing': 'warn',
};

// Retired root slug namespaces. A slug starting with any of these is a leftover from a
// dissolved cross-cutting namespace — new docs must be topic-first. (mental-models/* was
// dissolved into per-topic mental-models/ subdirs; old URLs preserved via redirects.)
const LEGACY_SLUG_PREFIXES = ['/mental-models/'];

// Controlled vocabulary for the `blog_trigger:` frontmatter key. The blog-post-triggers
// doc (docs/blogging/blog-post-triggers.mdx) is the source of truth for this taxonomy —
// keep the two in lockstep (it's the same "structure decisions update the checks" rule).
const BLOG_TRIGGERS = new Set(['conference', 'book', 'solution', 'poc', 'milestone', 'opinion']);
const BLOG = path.join(ROOT, 'blog');

// Description length bounds — re-exported from the shared SEO lib (scripts/lib/seo-frontmatter.js)
// so this validator and validate-seo.js never diverge on the thresholds (extend, don't duplicate).
const {DESC_MIN, DESC_MAX, checkDescription: seoCheckDescription} = require('./lib/seo-frontmatter');

// Folder names that echo a format/framing word instead of a reader topic.
const FRAMING_RE = /-techniques$|-craftsmanship$|^definitions$/;
const KEBAB_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const isDoc = (n) => /\.mdx?$/.test(n);
const isReadme = (n) => /^README\.mdx?$/.test(n);

// Does a label LEAD with an emoji? Used for the sidebar-label emoji convention. We skip a
// leading variation selector (U+FE0E/U+FE0F) — rare but harmless — then test the first real
// code point against the common emoji ranges: Misc-Symbols/Dingbats/arrows (U+2190–U+2BFF),
// the dingbat block (U+2600–U+27BF, subset of the prior range but kept explicit), the
// standalone star/sparkle (U+2B50/U+2728), and the full SMP emoji planes (>= U+1F000).
// NOTE: keep this in lockstep with the inline check in validate-docs-structure-hook.sh.
function startsWithEmoji(str) {
  if (!str) return false;
  let s = String(str).trim();
  if (!s) return false;
  let cp = s.codePointAt(0);
  if (cp === 0xfe0e || cp === 0xfe0f) {
    // leading variation selector — look at the next code point
    s = s.slice(s.codePointAt(0) > 0xffff ? 2 : 1);
    cp = s.codePointAt(0);
    if (cp === undefined) return false;
  }
  return (
    cp >= 0x1f000 ||
    (cp >= 0x2190 && cp <= 0x2bff) ||
    (cp >= 0x2600 && cp <= 0x27bf) ||
    cp === 0x2b50 ||
    cp === 0x2728
  );
}

// Docs whose resolved sidebar label (`sidebar_label` || `title`) lacks a leading emoji.
// Collected during the walk, then rolled up into ONE `emoji-prefix-doc` finding (or expanded
// per-doc under --emoji). Module-level so checkDoc can push without threading state.
const docsMissingEmoji = [];

const findings = [];
const add = (kind, loc, detail) =>
  findings.push({ kind, severity: SEVERITY[kind], loc, detail });

// --- fs helpers ----------------------------------------------------------

function listDir(dir) {
  try {
    return fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
}
const rel = (p) => path.relative(ROOT, p);

/** docs directly in dir (md/mdx, excluding nothing — README counts as a doc). */
function docsIn(dir) {
  return listDir(dir).filter((e) => e.isFile() && isDoc(e.name));
}
/** any doc in dir or any descendant. */
function hasDocsDeep(dir) {
  const entries = listDir(dir);
  if (entries.some((e) => e.isFile() && isDoc(e.name))) return true;
  return entries.some((e) => e.isDirectory() && hasDocsDeep(path.join(dir, e.name)));
}
const hasCategory = (dir) => fs.existsSync(path.join(dir, '_category_.json'));

function readCategory(dir) {
  try {
    return JSON.parse(fs.readFileSync(path.join(dir, '_category_.json'), 'utf8'));
  } catch {
    return null;
  }
}

// A `_category_.json` label is a sidebar SECTION header; by convention it leads with an emoji
// so the sidebar scans visually (topic→emoji map: /definitions/emojis-for-activities). Flag a
// label that doesn't. `cat` may be pre-read (the caller already has it) or null → re-read.
function checkCategoryEmoji(dir, cat) {
  const c = cat || readCategory(dir);
  const label = c && typeof c.label === 'string' ? c.label : '';
  if (label && !startsWithEmoji(label)) {
    const relDir = rel(dir).replace(/^docs\//, '');
    const resolved = resolveFolderEmoji(relDir);
    const hint = resolved
      ? `prepend "${resolved}" (folder resolves to it)`
      : `folder is non-standard — run \`/suggest-emoji ${relDir}\` to pick one and record it`;
    add('emoji-prefix-category', rel(path.join(dir, '_category_.json')),
      `category label "${label}" has no leading emoji — sidebar sections lead with one for visual scanning; ${hint}`);
  }
}

// --- blog post slugs (companion-post resolution) ------------------------
// Memoized: blog posts declare a (relative) `slug:` in frontmatter. We resolve a doc's
// `blog_post:` back-reference against this set. Lazy so scoped/hook runs pay nothing
// unless a doc actually carries `blog_post:`.
let _blogSlugs = null;
function blogPostSlugs() {
  if (_blogSlugs) return _blogSlugs;
  _blogSlugs = new Set();
  for (const e of listDir(BLOG)) {
    if (!e.isFile() || !isDoc(e.name)) continue;
    try {
      const s = matter(fs.readFileSync(path.join(BLOG, e.name), 'utf8')).data.slug;
      if (typeof s === 'string' && s.trim()) _blogSlugs.add(s.trim().replace(/^\/+/, '').replace(/\/$/, ''));
    } catch { /* skip unparseable */ }
  }
  return _blogSlugs;
}

// --- per-doc check: absolute slug ---------------------------------------

function checkDoc(file) {
  let data;
  try {
    data = matter(fs.readFileSync(file, 'utf8')).data;
  } catch {
    return; // unparseable frontmatter — leave to MDX build
  }
  if (!('slug' in data) || data.slug === undefined || data.slug === null || data.slug === '') {
    add('absolute-slug', rel(file), 'doc has no frontmatter `slug:` — add an absolute slug (`slug: /…`)');
    return;
  }
  if (typeof data.slug !== 'string' || !data.slug.startsWith('/')) {
    add('absolute-slug', rel(file),
      `slug "${data.slug}" is relative — make it absolute (\`slug: /…\`) so the URL is pinned to a value, not the folder path`);
  } else {
    const legacy = LEGACY_SLUG_PREFIXES.find((p) => data.slug.startsWith(p));
    if (legacy) {
      add('legacy-namespace', rel(file),
        `slug "${data.slug}" uses the retired "${legacy}" namespace — that cross-cutting namespace was dissolved into per-topic mental-models/ subdirs; use a topic-first slug (the old URLs are preserved via client redirects)`);
    }
  }
  checkDescription(file, data);
  checkBlogTrigger(file, data);
  checkSidebarLabel(file, data);
  checkPremium(file, data);
}

// --- per-doc check: premium-content gating frontmatter ------------------
// `premium: true` marks a doc whose body is encrypted at build time (the encrypt
// pipeline + the client gate read this exact flag, as does the draft-docs plugin's
// premiumPermalinks). These rules keep the flag well-formed and mutually-sane with
// `draft`. See the premium-content-gating design + the manage-premium-content skill.
function checkPremium(file, data) {
  if (!('premium' in data)) return; // not a premium doc — nothing to check
  if (typeof data.premium !== 'boolean') {
    add('premium-type', rel(file),
      `premium "${data.premium}" must be a boolean (\`premium: true\` or \`premium: false\`) — the encrypt pipeline + client gate test \`premium === true\``);
    return;
  }
  if (data.premium !== true) return; // premium:false is a no-op (explicitly not gated)

  // A premium doc ships its body ENCRYPTED to prod; a draft doc doesn't ship at all.
  // Marking a doc BOTH is contradictory — the encrypt step would never see it (drafts
  // are excluded from the prod build), so it would silently never get gated.
  if (data.draft === true) {
    add('premium-draft-conflict', rel(file),
      'doc is both `premium: true` and `draft: true` — contradictory: drafts are excluded from the production build, so the premium body would never be encrypted/gated. Pick one (publish it as premium, or keep it a draft).');
  }

  // Anonymous readers see a sneak-peek before the lock. Without a `premium_teaser:`
  // (or a `description:` to fall back on) the locked page has nothing to show — a bare
  // lock with no hook. Warn so every premium page has an enticing preview.
  const teaser = typeof data.premium_teaser === 'string' ? data.premium_teaser.trim() : '';
  const desc = typeof data.description === 'string' ? data.description.trim() : '';
  if (!teaser && !desc) {
    add('premium-needs-teaser', rel(file),
      'premium doc has no `premium_teaser:` (nor a `description:` to fall back on) — anonymous readers would see a bare lock with no preview. Add a `premium_teaser:` sneak-peek that entices sign-in.');
  }
}

// --- per-doc check: sidebar label (filename-leak guard + emoji convention) ---
// The sidebar entry's text resolves to `sidebar_label` || `title`; with NEITHER, Docusaurus
// falls back to the raw doc-id (filename) — the `habits-mastering`-as-label symptom. We also
// collect docs whose resolved label lacks a leading emoji (rolled up later — see
// docsMissingEmoji / emoji-prefix-doc).
function checkSidebarLabel(file, data) {
  const sidebar = typeof data.sidebar_label === 'string' ? data.sidebar_label.trim() : '';
  const title = typeof data.title === 'string' ? data.title.trim() : '';
  const label = sidebar || title;
  if (!label) {
    add('sidebar-label-missing', rel(file),
      'doc has neither `title:` nor `sidebar_label:` — its sidebar entry falls back to the raw filename; add a `title:` (or `sidebar_label:`)');
    return;
  }
  // A doc with a known `kind:` gets its kind emoji prepended at runtime (draft-docs plugin),
  // so an emoji-less title is intentional — exempt it (mirrors how blog posts work).
  if (data.kind && KIND_EMOJI[data.kind]) return;
  if (!startsWithEmoji(label)) {
    // Suggest the emoji this doc's FOLDER resolves to (kind-map / learned override / root).
    // null → the folder is non-standard: point the author at /suggest-emoji instead of
    // guessing, so the choice is made once per folder and recorded in emoji-map.json.
    const relDir = path.dirname(rel(file)).replace(/^docs\//, '');
    const suggestion = resolveFolderEmoji(relDir);
    docsMissingEmoji.push({ loc: rel(file), label, suggestion, relDir });
  }
}

// --- per-doc check: blog↔doc trigger convention -------------------------
// See docs/blogging/blog-post-triggers.mdx. `blog_trigger:` marks a doc as post-worthy;
// `blog_post:` is the back-reference to its companion /blog/ post.
function checkBlogTrigger(file, data) {
  if ('blog_trigger' in data && data.blog_trigger != null && data.blog_trigger !== '') {
    if (!BLOG_TRIGGERS.has(String(data.blog_trigger))) {
      add('blog-trigger-vocab', rel(file),
        `blog_trigger "${data.blog_trigger}" is outside the controlled vocabulary (${[...BLOG_TRIGGERS].join(', ')}) — see docs/blogging/blog-post-triggers.mdx`);
    }
  }
  if ('blog_post' in data && typeof data.blog_post === 'string' && data.blog_post.trim()) {
    const want = data.blog_post.trim().replace(/^\/+/, '').replace(/\/$/, '');
    if (!blogPostSlugs().has(want)) {
      add('blog-post-exists', rel(file),
        `blog_post "${data.blog_post}" has no matching post in /blog/ (no post declares that slug) — generate it (\`make generate-blog-stub DOC=…\`) or fix the slug`);
    }
  }
}

// --- per-doc check: description presence + length -----------------------
// `description:` powers og:description (SEO/social preview) AND the ShareButton share
// message ("Here's what it covers: <description>"). See src/ingress-attribution-plan.md.
function checkDescription(file, data) {
  // Delegate to the shared SEO lib so the docs validator + validate-seo.js use identical rules.
  for (const f of seoCheckDescription(data)) add(f.id, rel(file), f.detail);
}

// --- recurse the tree, applying structural checks ------------------------

/** Walk every dir under docs/, collecting structural findings. depthFromTopic:
 *  -1 above topics, 0 at a topic root, 1+ inside. */
function walkDir(dir, depthFromTopic, topicName) {
  const entries = listDir(dir);

  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isFile()) {
      if (!isDoc(e.name)) continue; // only lint markdown/MDX docs (ignore .DS_Store, assets, etc.)
      checkDoc(full);
      // kebab-case on doc filenames (drop extension; exempt _-prefixed + README)
      const base = e.name.replace(/\.mdx?$/, '');
      if (!base.startsWith('_') && !isReadme(e.name) && !KEBAB_RE.test(base)) {
        add('kebab-case', rel(full), `filename "${e.name}" is not kebab-case`);
      }
      continue;
    }
    if (!e.isDirectory()) continue;

    const childDepth = depthFromTopic + 1;

    if (depthFromTopic >= 0 && !e.name.startsWith('_')) {
      // NO numeric ordering prefix in folder NAMES — order comes from the
      // `_category_.json` "position" field (or doc `sidebar_position`), never the name.
      // WHY: a name prefix couples *order* to *identity*. Reordering a prefixed folder
      // is a `git mv` that rewrites every descendant doc's path (churns history, risks
      // URLs if any slug were relative) — whereas bumping a `position` number is a
      // one-line, history-clean change. So names stay stable; positions do the ordering.
      const prefixMatch = e.name.match(/^(\d+)-/);
      if (prefixMatch) {
        add('numeric-prefix', rel(full),
          `folder "${e.name}" carries a numeric name prefix — drop it and order via _category_.json "position" instead (keeps reordering history-clean; names shouldn't encode order)`);
      }
      const nameNoPrefix = e.name.replace(/^\d+-/, '');
      if (!KEBAB_RE.test(nameNoPrefix)) {
        add('kebab-case', rel(full), `folder "${e.name}" is not kebab-case`);
      }
      // framing-word / topic-echo folder names
      if (FRAMING_RE.test(nameNoPrefix)) {
        add('framing-folder', rel(full),
          `folder "${e.name}" is a framing-word/topic-echo name — prefer a reader-facing topic noun`);
      }
    }

    // depth ≤ 5 under a topic root (topic root = depth 0; flag a folder at depth 6+).
    // craft/self add one container tier above the former topics — see header.
    if (childDepth >= 6) {
      add('depth', rel(full), `folder is ${childDepth} levels under topic "${topicName}" (contract: ≤5)`);
    }

    // sub-folder category presence + orphan check
    if (childDepth >= 1) {
      const directDocs = docsIn(full).length;
      if (directDocs > 0 && !hasCategory(full)) {
        add('subfolder-cat', rel(full), 'sub-folder contains docs but has no _category_.json');
      }
      if (hasCategory(full) && !hasDocsDeep(full)) {
        add('orphan-cat', rel(full), '_category_.json in a folder with no docs and no docs-bearing descendants (orphan)');
      }
      // terminology-first / prompts-last position conventions + emoji-prefix on the label
      if (hasCategory(full)) {
        const base = e.name.replace(/^\d+-/, '');
        const cat = readCategory(full);
        const pos = cat && typeof cat.position === 'number' ? cat.position : null;
        if (base === 'terminology' && pos !== null && pos > 2) {
          add('terminology-first', rel(full), `terminology/ has position ${pos} — convention sorts it FIRST (low position)`);
        }
        if (base === 'prompts' && pos !== null && pos < 5) {
          add('prompts-last', rel(full), `prompts/ has position ${pos} — convention sorts it LAST (high position)`);
        }
        checkCategoryEmoji(full, cat);
      }
    }

    // When descending from above-topics (depth -1) the child IS the topic root.
    const childTopic = depthFromTopic === -1 ? e.name : topicName;
    walkDir(full, childDepth, childTopic);
  }
}

// --- topic-root checks + Welcome drift -----------------------------------

// A root TOPIC = a direct child dir of docs/ that has a _category_.json (it's a
// sidebar section), except `welcome` (the index, not a topic). Folder names no longer
// carry numeric prefixes — order lives in each _category_.json "position" — so topic
// detection is by structure (has a category), not by a name pattern.
function topicFolders() {
  return listDir(DOCS)
    .filter((e) => e.isDirectory() && e.name !== 'welcome' && hasCategory(path.join(DOCS, e.name)))
    .map((e) => e.name)
    .sort();
}

function topicReadmeSlug(topic) {
  for (const r of ['README.md', 'README.mdx']) {
    const f = path.join(DOCS, topic, r);
    if (fs.existsSync(f)) {
      try {
        return matter(fs.readFileSync(f, 'utf8')).data.slug || null;
      } catch {
        return null;
      }
    }
  }
  return undefined; // no README at all
}

function checkTopicRoots() {
  for (const topic of topicFolders()) {
    const dir = path.join(DOCS, topic);
    const slug = topicReadmeSlug(topic);
    if (slug === undefined) {
      add('topic-readme', rel(dir), 'topic folder has no README.{md,mdx} landing page');
    } else if (!slug || typeof slug !== 'string' || !slug.startsWith('/')) {
      add('topic-readme', rel(dir), `topic README slug "${slug}" is missing or not absolute`);
    }
    if (!hasCategory(dir)) {
      add('topic-readme', rel(dir), 'topic folder has no _category_.json (label + position)');
    } else {
      checkCategoryEmoji(dir, null); // root topics also lead with an emoji
    }
  }
}

/**
 * Welcome drift: Craft and Journey are two SEPARATE docs instances (routeBasePath /craft,
 * /journey). The CHOOSER was folded into the homepage (`src/pages/index.tsx`) — its CTA
 * cards must route readers into BOTH halves: the homepage must link to /craft AND /journey.
 * (A `to="/craft"` Link or an href both count.)
 */
function checkWelcomeDrift() {
  const home = path.join(ROOT, 'src', 'pages', 'index.tsx');
  if (!fs.existsSync(home)) {
    add('welcome-drift', 'src/pages/index.tsx', 'no homepage to check the Craft/Journey chooser against');
    return;
  }
  const src = fs.readFileSync(home, 'utf8');
  for (const half of ['/craft', '/journey']) {
    // a to="/craft", ](/craft), or href="/craft" all count as "leads into this half"
    const re = new RegExp(`(?:to=|\\]\\(|href=)["']${half}(?=[/"')\\s#?]|$)`);
    if (!re.test(src)) {
      add('welcome-drift', 'src/pages/index.tsx', `homepage chooser does not link into ${half} (it must lead into both halves)`);
    }
  }
}

/** Every README.{md,mdx}'s absolute slug across the whole docs tree (for drift checks). */
function collectReadmeSlugs() {
  const out = new Set();
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.name.startsWith('.')) continue;
      const full = path.join(dir, e.name);
      if (e.isDirectory()) walk(full);
      else if (/^README\.mdx?$/i.test(e.name)) {
        try {
          const s = matter(fs.readFileSync(full, 'utf8')).data.slug;
          if (typeof s === 'string') out.add(s);
        } catch { /* unparseable frontmatter — skip */ }
      }
    }
  };
  walk(DOCS);
  return out;
}

// --- idea↔execution mapping (in-body convention) -------------------------

/** Collect every doc's absolute slug → a Set, for cross-ref resolution. */
function collectSlugs() {
  const slugs = new Set();
  (function rec(dir) {
    for (const e of listDir(dir)) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) rec(full);
      else if (isDoc(e.name)) {
        try {
          const s = matter(fs.readFileSync(full, 'utf8')).data.slug;
          if (typeof s === 'string' && s.startsWith('/')) slugs.add(s.replace(/\/$/, ''));
        } catch { /* skip */ }
      }
    }
  })(DOCS);
  return slugs;
}

/** Corpus-wide: flag identical `description:` values reused across docs (each should be
 *  a distinct summary, since it feeds per-page SEO + the per-page share message). */
function checkDuplicateDescriptions() {
  const byDesc = new Map(); // normalized description → [relPaths]
  (function rec(dir) {
    for (const e of listDir(dir)) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) rec(full);
      else if (isDoc(e.name)) {
        try {
          const d = matter(fs.readFileSync(full, 'utf8')).data.description;
          if (typeof d === 'string' && d.trim()) {
            const key = d.trim().toLowerCase();
            (byDesc.get(key) || byDesc.set(key, []).get(key)).push(rel(full));
          }
        } catch { /* skip */ }
      }
    }
  })(DOCS);
  for (const [, paths] of byDesc) {
    if (paths.length > 1) {
      for (const p of paths) {
        add('description-duplicate', p,
          `description is identical to ${paths.length - 1} other doc(s) (${paths.filter((x) => x !== p).join(', ')}) — each page needs a distinct summary`);
      }
    }
  }
}

/** Map every doc's absolute slug → its `blog_post:` back-reference (or null). Used to
 *  verify the doc↔post loop is closed from the post side. */
function collectDocBackRefs() {
  const bySlug = new Map(); // docSlug (no leading /) → blog_post value (normalized) | null
  (function rec(dir) {
    for (const e of listDir(dir)) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) { rec(full); continue; }
      if (!isDoc(e.name)) continue;
      try {
        const d = matter(fs.readFileSync(full, 'utf8')).data;
        if (typeof d.slug !== 'string' || !d.slug.startsWith('/')) continue;
        const slug = d.slug.replace(/^\/+/, '').replace(/\/$/, '');
        const back = typeof d.blog_post === 'string' && d.blog_post.trim()
          ? d.blog_post.trim().replace(/^\/+/, '').replace(/\/$/, '')
          : null;
        bySlug.set(slug, back);
      } catch { /* skip */ }
    }
  })(DOCS);
  return bySlug;
}

/** From the post side: a /blog/ post links a /docs/<slug>; the linked doc should carry a
 *  `blog_post:` back-reference to this post. Flag docs that are linked-to but don't point
 *  back (the loop is half-open). */
function checkBlogPostOrphans() {
  const backRefs = collectDocBackRefs();
  for (const e of listDir(BLOG)) {
    if (!e.isFile() || !isDoc(e.name)) continue;
    const full = path.join(BLOG, e.name);
    let parsed;
    try { parsed = matter(fs.readFileSync(full, 'utf8')); } catch { continue; }
    const postSlug = typeof parsed.data.slug === 'string'
      ? parsed.data.slug.trim().replace(/^\/+/, '').replace(/\/$/, '')
      : null;
    const linkRe = /\]\(\/docs\/([^)\s#]+)/g;
    let m;
    const seen = new Set();
    while ((m = linkRe.exec(parsed.content)) !== null) {
      const docSlug = m[1].replace(/\/$/, '');
      if (seen.has(docSlug)) continue;
      seen.add(docSlug);
      if (!backRefs.has(docSlug)) continue; // link to a non-doc or unknown slug — out of scope here
      const back = backRefs.get(docSlug);
      if (back === null) {
        add('blog-post-orphan', `blog/${e.name}`,
          `post links /docs/${docSlug} but that doc has no \`blog_post:\` back-reference — add \`blog_post: ${postSlug || '<this-post-slug>'}\` to close the loop`);
      } else if (postSlug && back !== postSlug) {
        add('blog-post-orphan', `blog/${e.name}`,
          `post links /docs/${docSlug}, whose \`blog_post:\` is "${back}" — expected "${postSlug}" (the doc points back at a different post)`);
      }
    }
  }
}

/** Extract the body lines under a `## <heading>` section (until the next `##`). */
function sectionBody(src, headingRe) {
  const lines = src.split('\n');
  const out = [];
  let inSec = false;
  for (const line of lines) {
    if (/^##\s/.test(line)) {
      inSec = headingRe.test(line.replace(/^##\s+/, '').trim());
      continue;
    }
    if (inSec) out.push(line);
  }
  return out.join('\n');
}

/** Validate that every internal /docs link inside Execution/Idea sections resolves. */
function checkIdeaExecLinks(slugs) {
  (function rec(dir) {
    for (const e of listDir(dir)) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) { rec(full); continue; }
      if (!isDoc(e.name)) continue;
      let src;
      try { src = fs.readFileSync(full, 'utf8'); } catch { continue; }
      const r = path.relative(DOCS, full);
      const isPM = r.startsWith('product-management/');
      const isDev = r.startsWith('2-development/');
      // PM idea docs carry `## Execution`; SW Dev artifacts carry `## Idea`/`## Origin`.
      const body = isPM
        ? sectionBody(src, /^execution$/i)
        : isDev
          ? sectionBody(src, /^(idea|origin)$/i)
          : '';
      if (!body.trim()) continue;
      const linkRe = /\]\((\/docs\/[^)\s#]+)/g;
      let m;
      while ((m = linkRe.exec(body)) !== null) {
        const slug = m[1].replace(/^\/docs/, '').replace(/\/$/, '');
        if (!slugs.has(slug)) {
          add('idea-exec-link', r,
            `${isPM ? '## Execution' : '## Idea/Origin'} link ${m[1]} does not resolve to an existing doc slug`);
        }
      }
    }
  })(DOCS);
}

// --- main ----------------------------------------------------------------

function main() {
  const args = process.argv.slice(2);
  const json = args.includes('--json');
  const errorOnly = args.includes('--error-only');
  const emoji = args.includes('--emoji');
  const targets = args.filter((a) => !a.startsWith('--'));

  if (targets.length) {
    // Scoped run (hook): only per-doc slug checks on the given files (fast, no tree walk).
    // NOTE: checkDoc collects doc-emoji misses into docsMissingEmoji, but we deliberately do
    // NOT emit the emoji-prefix-doc finding here — it's a corpus-wide aggregate, meaningless
    // for a single file, and the hook is --error-only anyway (warn-tier never surfaces there).
    for (const t of targets) {
      const abs = path.isAbsolute(t) ? t : path.join(process.cwd(), t);
      if (fs.existsSync(abs) && fs.statSync(abs).isFile() && isDoc(abs)) checkDoc(abs);
    }
  } else {
    // Full run.
    walkDir(DOCS, -1, null);
    checkTopicRoots();
    checkWelcomeDrift();
    checkIdeaExecLinks(collectSlugs());
    checkDuplicateDescriptions();
    checkBlogPostOrphans();
    // Roll up doc-label emoji misses. Default: ONE aggregate finding (most leaf docs have no
    // emoji today; a per-doc warn would bury the actionable category findings). `--emoji`
    // expands to one finding per offending doc for when you actually want the full list.
    if (docsMissingEmoji.length) {
      if (emoji) {
        for (const d of docsMissingEmoji) {
          const hint = d.suggestion
            ? `suggested: prepend "${d.suggestion}" (folder ${d.relDir} resolves to it)`
            : `folder ${d.relDir} is non-standard — run \`/suggest-emoji ${d.relDir}\` to pick one and record it`;
          add('emoji-prefix-doc', d.loc, `sidebar label "${d.label}" has no leading emoji — ${hint}`);
        }
      } else {
        const ask = docsMissingEmoji.filter((d) => !d.suggestion).length;
        const askNote = ask
          ? ` (${ask} are in non-standard folders — run \`/suggest-emoji\` for those)`
          : '';
        add('emoji-prefix-doc', 'docs/',
          `${docsMissingEmoji.length} doc label(s) lack a leading emoji${askNote} — re-run with --emoji to list them with per-doc suggestions (category labels are reported individually above)`);
      }
    }
  }

  let out = findings;
  if (errorOnly) out = out.filter((f) => f.severity === 'error');

  if (json) {
    console.log(JSON.stringify(out, null, 2));
    process.exit(out.length ? (errorOnly ? 2 : 1) : 0);
  }

  if (!out.length) {
    if (!errorOnly) console.log('✅ docs structure: no problems found.');
    process.exit(0);
  }

  const errs = out.filter((f) => f.severity === 'error').length;
  console.log(`🏗  docs structure: ${out.length} problem(s) (${errs} error, ${out.length - errs} warn)\n`);
  const byKind = {};
  for (const f of out) {
    byKind[f.kind] = (byKind[f.kind] || 0) + 1;
    const tag = f.severity === 'error' ? 'ERROR' : 'warn';
    console.log(`  ${f.loc}  [${tag}:${f.kind}] ${f.detail}`);
  }
  console.log('\nSummary: ' + Object.entries(byKind).map(([k, n]) => `${k}=${n}`).join('  '));
  process.exit(errorOnly ? 2 : 1);
}

main();
