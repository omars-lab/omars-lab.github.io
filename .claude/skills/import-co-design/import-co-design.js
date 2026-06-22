#!/usr/bin/env node

/**
 * import-co-design.js — turn a public co-design HLD into a Designs-blog post.
 *
 * Co-design HLDs are authored in a separate work repo
 * (docs/architecture/co-designs/public/CO-DESIGN-*.md). This script imports one (or a
 * whole directory) into the Bytes of Purpose Designs blog (bytesofpurpose-blog/designs/)
 * as an .mdx post, applying every transform the site needs so the result BUILDS and
 * passes the repo's content hooks — chiefly the BLOCKING em-dash-voice hook, which
 * rejects any U+2014 ("—") in designs/*.mdx (including inside mermaid blocks; it has no
 * code-fence exemption). See .claude/skills/import-co-design/SKILL.md for the full story.
 *
 * What it does, given a source HLD path:
 *   1. Parse the source frontmatter + body (gray-matter).
 *   2. Map source frontmatter -> Designs frontmatter (slug `design-<kebab>`,
 *      sidebar_position = next free, authors:[oeid], tags, description from the exec
 *      summary, draft:true) + a `source:` provenance block (repo/path/id/status/imported).
 *   3. De-em-dash the BODY, context-aware, fence-aware:
 *        - inside ```mermaid / ``` fences and inline `code`: "—" -> "&#8212;"
 *          (renders identically; the hook scans the raw file, so the entity is required)
 *        - numeric range  a—b / a–b           -> "a to b"
 *        - parenthetical aside pair  A — x — B -> "A, x, B"
 *        - sentence-break  X — Y               -> "X. Y" or "X; Y"
 *   4. Rewrite cross-doc links `](./CO-DESIGN-…-hld.md)` -> `](/designs/<mapped-slug>)`
 *      for docs in this batch; links to NON-imported co-designs (e.g. the research doc)
 *      are de-linked to plain text so nothing dangles.
 *   5. Leave intact: same-doc `[§x.y](#anchor)` links, `[Assumption]` tags, mermaid
 *      diagrams, `<a id>` footnote anchors.
 *   6. Idempotent: if a designs post already carries a matching `source.id`, UPDATE that
 *      file in place (keep its slug + sidebar_position) instead of writing a duplicate.
 *   7. Print a per-file summary (em-dashes rewritten, links rewritten, create vs update).
 *
 * Usage:
 *   node .claude/skills/import-co-design/import-co-design.js <source-hld.md> [more.md ...]
 *   node .claude/skills/import-co-design/import-co-design.js --all <co-designs/public/>
 *   node .claude/skills/import-co-design/import-co-design.js --dry-run <source.md>
 *
 * Flags:
 *   --all <dir>   import every CO-DESIGN-*-hld.md in <dir> (skips *-research-* and any
 *                 doc whose visibility frontmatter is not `public`).
 *   --dry-run     print what WOULD be written; touch nothing.
 *
 * Exit codes: 0 ok · 1 usage / nothing-to-do / error.
 */

const fs = require('fs');
const path = require('path');

// gray-matter lives in the blog workspace's node_modules.
const BLOG = path.join(__dirname, '..', '..', '..', 'bytesofpurpose-blog');
const matter = require(path.join(BLOG, 'node_modules', 'gray-matter'));

const DESIGNS = path.join(BLOG, 'designs');

// ---------------------------------------------------------------------------
// small utilities
// ---------------------------------------------------------------------------

const EMDASH = '—'; // —
const ENDASH = '–'; // –

function kebab(s) {
  return String(s)
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

// Drop a trailing " — Subtitle" / " – Subtitle" the HLD title often carries, so the
// slug/title read cleanly. Keeps the lead phrase.
function leadTitle(title) {
  return String(title).split(new RegExp(`\\s*[${EMDASH}${ENDASH}]\\s*`))[0].trim();
}

// First sentence of a paragraph, em-dashes already removed, clamped to ~155 chars for
// the og:description / ShareButton (the manage-frontmatter-descriptions ~50–160 rule).
function clampDescription(text) {
  const oneLine = text.replace(/\s+/g, ' ').trim();
  // first sentence-ish
  const m = oneLine.match(/^(.*?[.!?])(\s|$)/);
  let d = (m ? m[1] : oneLine).trim();
  if (d.length > 158) d = d.slice(0, 155).replace(/[\s,;:]+\S*$/, '') + '…';
  return d;
}

// ---------------------------------------------------------------------------
// de-em-dash — context- and fence-aware
// ---------------------------------------------------------------------------

// Replace every em/en-dash inside a code/mermaid span with the HTML entity. The entity
// renders as a real em-dash in both prose and mermaid labels, and the hook (which greps
// the raw bytes for U+2014) does not see it.
function entityizeDashes(s) {
  return s.split(EMDASH).join('&#8212;').split(ENDASH).join('&#8211;');
}

// Context-aware rewrite of a single PROSE line (no fences here).
//
// Order matters. A SPACED dash (" — ") is virtually always punctuation, never a range,
// so handle it FIRST and never let the range rule touch it. A TIGHT dash between
// numbers/short codes ("60–70", "D1–D19") is a range -> "to".
function deEmDashLine(line) {
  let out = line;

  // 1) RANGE: a TIGHT (unspaced) dash flanked by a digit or short A–Z+digit code on each
  //    side, e.g. "60–70%", "D1–D19", "2–3x". Spaced dashes are deliberately excluded.
  out = out.replace(
    new RegExp(`\\b([A-Za-z]?\\d+)[${EMDASH}${ENDASH}]([A-Za-z]?\\d+)\\b`, 'g'),
    '$1 to $2'
  );

  const D = `[${EMDASH}${ENDASH}]`;

  // 2) TITLE / HEADING: an ATX heading ("# Title — Subtitle") reads as one title, so a
  //    spaced dash there becomes a COLON, not a sentence break.
  if (/^\s{0,3}#{1,6}\s/.test(out)) {
    out = out.replace(new RegExp(`\\s+${D}\\s+`), ': ');
  }

  // 3) DECISION LABEL: "**D1 — Execution**", "- **D3 — Autonomy (…)**:", a bold/code
  //    code-or-id label immediately followed by a spaced dash reads as "label: value".
  out = out.replace(
    new RegExp(`(\\*\\*[^*]*?|\`[^\`]*?)\\s+${D}\\s+`, 'g'),
    '$1: '
  );
  // also the common un-bolded "D<n> — Label" / "OQ<n> — Label" decision shorthand.
  out = out.replace(
    new RegExp(`\\b([A-Z]{1,3}\\d+)\\s+${D}\\s+`, 'g'),
    '$1: '
  );

  // 4) SPACED dash punctuation: " — " (one or more spaces each side).
  const spaced = new RegExp(`\\s+${D}\\s+`, 'g');
  const matches = out.match(spaced) || [];
  if (matches.length >= 2) {
    // parenthetical aside PAIR (or list of asides): A — x — B -> "A, x, B".
    out = out.replace(spaced, ', ');
    out = out.replace(/,\s*([.!?])/g, '$1'); // ", ." -> "."
    out = out.replace(/,(\s*,)+/g, ','); // collapse ", ," runs
  } else if (matches.length === 1) {
    // single spaced dash = sentence break. Period if the clause that follows starts with
    // a capital letter (independent clause); otherwise a semicolon (always grammatical).
    out = out.replace(spaced, (m, idx) => {
      const after = out.slice(idx + m.length);
      return /^[A-Z]/.test(after) ? '. ' : '; ';
    });
  }

  // 5) any remaining (tight, non-range) em-dash: comma; stray en-dash: hyphen.
  out = out.split(EMDASH).join(', ').split(ENDASH).join('-');
  return out;
}

// Walk the body line by line, tracking fenced code blocks. Inside fences -> entityize.
// Outside fences -> protect inline `code` spans (entityize their dashes), then run the
// context-aware prose rewrite on the rest.
function deEmDashBody(body) {
  const lines = body.split('\n');
  let inFence = false;
  let fenceTick = '';
  let prose = 0;
  let fenced = 0;

  const result = lines.map((line) => {
    const fenceMatch = line.match(/^(\s*)(`{3,}|~{3,})(.*)$/);
    if (fenceMatch) {
      const tick = fenceMatch[2];
      if (!inFence) {
        inFence = true;
        fenceTick = tick[0].repeat(3);
      } else if (line.trim().startsWith(fenceTick)) {
        inFence = false;
      }
      // the fence line itself: entityize any dash in an info-string just in case.
      if ((line.match(new RegExp(`[${EMDASH}${ENDASH}]`, 'g')) || []).length) fenced++;
      return entityizeDashes(line);
    }

    if (inFence) {
      if ((line.match(new RegExp(`[${EMDASH}${ENDASH}]`, 'g')) || []).length) fenced++;
      return entityizeDashes(line);
    }

    // Outside a fence: split out inline `code` spans (leave their content alone except
    // for dash-entityizing), and on the prose run em-dash + MDX-safety transforms.
    const parts = line.split(/(`[^`]*`)/g);
    const rebuilt = parts
      .map((p) => {
        if (p.startsWith('`') && p.endsWith('`')) return entityizeDashes(p);
        if (new RegExp(`[${EMDASH}${ENDASH}]`).test(p)) prose++;
        return mdxSafeLine(deEmDashLine(p));
      })
      .join('');
    return rebuilt;
  });

  return { body: result.join('\n'), prose, fenced };
}

// MDX-safety for a PROSE segment (already outside fences and inline code). MDX parses
// `<…>` as JSX, so constructs that are valid in plain markdown break the build:
//   - bare autolinks  <https://x>  ->  a real markdown link [host/path](url)
//     (descriptive-ish text avoids the validate-links `url-as-text` warning, and is
//      valid MDX). Also strip the angle brackets MDX would treat as a tag.
//   - a stray `<` used as "less than" in prose ("< 50ms", "x < y") -> &lt;
function mdxSafeLine(seg) {
  let out = seg;

  // 1) bare autolink <https://…> or <http://…>  ->  [shortened](url)
  out = out.replace(/<((https?:\/\/)[^>\s]+)>/g, (m, url) => {
    const text = url.replace(/^https?:\/\//, '').replace(/\/$/, '');
    return `[${text}](${url})`;
  });

  // 2) bare autolink <mailto:…> or <foo@bar>  ->  plain text (rare in these docs)
  out = out.replace(/<((mailto:)?[^>\s@]+@[^>\s]+)>/g, '$1');

  // 3) a "less-than" sign that MDX would read as the start of a tag: `<` followed by a
  //    space or a digit (e.g. "< 50ms", "<5"). Escape to the HTML entity.
  out = out.replace(/<(?=[\s0-9=])/g, '&lt;');

  return out;
}

// ---------------------------------------------------------------------------
// cross-doc link rewriting
// ---------------------------------------------------------------------------

// idMap: source-id (and bare basename) -> /designs/<slug>. Rewrites markdown links that
// point at another co-design file. Links to co-designs NOT in idMap are de-linked.
function rewriteLinks(body, idMap) {
  let rewritten = 0;
  let delinked = 0;

  // [text](./CO-DESIGN-….md)  or  (CO-DESIGN-….md)  or with #anchor
  const linkRe = /\[([^\]]+)\]\((\.\/)?(CO-DESIGN-[^)\s#]+?)(\.md)?(#[^)\s]+)?\)/g;

  const out = body.replace(linkRe, (full, text, _dot, target, _ext, anchor) => {
    const base = target.replace(/\.md$/, '');
    const slug = idMap[base] || idMap[base + '-hld'] || idMap[base.replace(/-hld$/, '')];
    if (slug) {
      rewritten++;
      return `[${text}](${slug}${anchor || ''})`;
    }
    // points at a co-design we did NOT import -> drop the link, keep the text.
    delinked++;
    return text;
  });

  return { body: out, rewritten, delinked };
}

// ---------------------------------------------------------------------------
// animate the first ("hero") mermaid diagram
// ---------------------------------------------------------------------------

// Wrap the FIRST ```mermaid block in <div class="mermaid-animated">…</div> so its edges
// get the marching-ants flow animation (the opt-in CSS in src/css/custom.css). Only the
// first diagram, so the page has one animated hero flow without every diagram moving.
// Deterministic + idempotent: re-running on already-wrapped output is a no-op because we
// detect an existing wrapper. Returns {body, animated:boolean}.
function animateFirstMermaid(body) {
  if (/<div className="mermaid-animated">/.test(body)) {
    return {body, animated: true}; // already wrapped (idempotent re-import)
  }
  const lines = body.split('\n');
  let start = -1;
  let end = -1;
  let inFence = false;
  for (let i = 0; i < lines.length; i++) {
    if (!inFence && /^\s*```mermaid\s*$/.test(lines[i])) {
      inFence = true;
      start = i;
    } else if (inFence && /^\s*```\s*$/.test(lines[i])) {
      end = i;
      break;
    }
  }
  if (start === -1 || end === -1) return {body, animated: false};
  // MDX needs blank lines around a JSX block element.
  lines.splice(end + 1, 0, '', '</div>');
  lines.splice(start, 0, '<div className="mermaid-animated">', '');
  return {body: lines.join('\n'), animated: true};
}

// ---------------------------------------------------------------------------
// footnotes — convert the HLDs' <a id> anchor style to GFM footnotes
// ---------------------------------------------------------------------------

// Source style:
//   reference:  …takes 16 weeks.[[a3]](#a3)
//   definition: <a id="a3"></a>**[a3]** CraftUp, *…* <url> (accessed …)
// GFM target:
//   reference:  …takes 16 weeks.[^a3]
//   definition: [^a3]: CraftUp, *…* <url> (accessed …)
// Docusaurus renders [^id]/[^id]: as a real footnotes section with back-links.
function convertFootnotes(body) {
  let refs = 0;
  let defs = 0;

  // 1) references: [[a3]](#a3)  ->  [^a3]   (also tolerate [[a3]](#a3 "title"))
  body = body.replace(/\[\[([a-zA-Z]\d+)\]\]\(#\1(?:\s+"[^"]*")?\)/g, (m, id) => {
    refs++;
    return `[^${id}]`;
  });

  // 2) definitions: a line that starts with <a id="a3"></a>**[a3]** <rest>
  //    -> [^a3]: <rest>
  body = body.replace(
    /^<a id="([a-zA-Z]\d+)">\s*<\/a>\s*\*\*\[\1\]\*\*\s*/gm,
    (m, id) => {
      defs++;
      return `[^${id}]: `;
    }
  );

  return { body, refs, defs };
}

// ---------------------------------------------------------------------------
// admonitions — labeled blockquote scope-notes -> :::note / :::tip / :::warning
// ---------------------------------------------------------------------------

// Map a blockquote label to an admonition kind + title. Only SINGLE-line, LABELED
// blockquotes (`> **Label:** …`) convert; plain or multi-line quotes are left as-is so
// we never mangle a pull-quote or a multi-paragraph aside.
const ADMONITION_LABELS = {
  'scope note': ['note', 'Scope'],
  scope: ['note', 'Scope'],
  note: ['note', 'Note'],
  terminology: ['info', 'Terminology'],
  legend: ['info', 'Legend'],
  'phased rollout': ['info', 'Phased rollout'],
  'completeness check': ['tip', 'Completeness check'],
  'design implication': ['tip', 'Design implication'],
  assumption: ['warning', 'Assumption'],
};

function convertAdmonitions(body) {
  const lines = body.split('\n');
  let converted = 0;
  const out = [];
  let inFence = false;
  let fenceTick = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const fenceMatch = line.match(/^(\s*)(`{3,}|~{3,})/);
    if (fenceMatch) {
      const tick = fenceMatch[2][0].repeat(3);
      if (!inFence) {
        inFence = true;
        fenceTick = tick;
      } else if (line.trim().startsWith(fenceTick)) {
        inFence = false;
      }
      out.push(line);
      continue;
    }
    if (inFence) {
      out.push(line);
      continue;
    }

    // a labeled blockquote whose NEXT line is NOT also a blockquote (single-line quote)
    const m = line.match(/^>\s*\*\*([^:*]+):\*\*\s*(.+)$/);
    const nextIsQuote = i + 1 < lines.length && /^>/.test(lines[i + 1]);
    const prevIsQuote = out.length > 0 && /^>/.test(out[out.length - 1]);
    if (m && !nextIsQuote && !prevIsQuote) {
      const key = m[1].trim().toLowerCase();
      const spec = ADMONITION_LABELS[key];
      if (spec) {
        const [kind, title] = spec;
        out.push(`:::${kind}[${title}]`);
        out.push(m[2].trim());
        out.push(':::');
        converted++;
        continue;
      }
    }
    out.push(line);
  }

  return { body: out.join('\n'), converted };
}

// ---------------------------------------------------------------------------
// frontmatter mapping
// ---------------------------------------------------------------------------

// Hand-tuned tag sets per known co-design subject; falls back to a generic set.
function deriveTags(srcId, title) {
  const t = (srcId + ' ' + title).toLowerCase();
  const tags = ['system-design', 'architecture'];
  if (/agent|autonomous|llm|ai\b|genai/.test(t)) tags.push('ai-agents');
  if (/scanner|lead|ecommerce|outreach/.test(t)) tags.push('ecommerce', 'lead-generation');
  if (/storefront|conversion|a\/?b|experiment|cro/.test(t)) tags.push('ab-testing', 'cro');
  if (/build|delivery|saas/.test(t)) tags.push('saas-delivery');
  if (/markdown|review|claude code/.test(t)) tags.push('claude-code', 'developer-tools');
  return Array.from(new Set(tags));
}

// Pull the first prose paragraph of the Executive Summary for the description.
function execSummaryFirstPara(body) {
  const lines = body.split('\n');
  let i = lines.findIndex((l) => /^#+\s+Executive Summary/i.test(l));
  if (i === -1) return '';
  const para = [];
  for (i = i + 1; i < lines.length; i++) {
    const l = lines[i];
    if (/^#+\s/.test(l)) break; // next heading
    if (/^>/.test(l)) continue; // skip blockquote scope-notes
    if (l.trim() === '') {
      if (para.length) break;
      continue;
    }
    para.push(l);
  }
  // strip markdown emphasis + bold-label prefixes like "**The problem.** "
  return para
    .join(' ')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/[*_`]/g, '')
    .replace(/^\s*(The problem\.|The solution\.)\s*/i, '')
    .trim();
}

function firstAuthorIsClaude(srcAuthors) {
  return (srcAuthors || []).some((a) => /claude/i.test(a));
}

// ---------------------------------------------------------------------------
// per-file import
// ---------------------------------------------------------------------------

function listExistingDesigns() {
  if (!fs.existsSync(DESIGNS)) return [];
  return fs
    .readdirSync(DESIGNS)
    .filter((n) => /\.mdx?$/.test(n))
    .map((n) => {
      const fp = path.join(DESIGNS, n);
      const parsed = matter(fs.readFileSync(fp, 'utf8'));
      return { file: n, fp, data: parsed.data };
    });
}

function nextSidebarPosition(existing) {
  const max = existing.reduce(
    (m, e) => Math.max(m, Number(e.data.sidebar_position) || 0),
    0
  );
  return max + 1;
}

// Build the source-id -> designs-slug map for a batch (used for link rewriting).
function buildIdMap(sources) {
  const map = {};
  for (const s of sources) {
    map[s.id] = `/designs/${s.slug}`;
  }
  return map;
}

function planImport(srcPath) {
  const raw = fs.readFileSync(srcPath, 'utf8');
  const { data, content } = matter(raw);
  const id = data.id || path.basename(srcPath, '.md');
  const lead = leadTitle(data.title || id);
  const slug = 'design-' + kebab(lead);
  return { srcPath, raw, data, content, id, lead, slug };
}

function renderPost(plan, idMap, sidebarPosition, existingFile) {
  const { data, content, id, lead, slug, srcPath } = plan;

  // 1) structural conversions on the RAW body first (so the prose passes below then
  //    clean up the text inside footnote defs + admonition bodies):
  //    a) <a id> footnote anchors -> GFM [^id]
  const fn = convertFootnotes(content);
  //    b) labeled blockquote scope-notes -> admonitions
  const adm = convertAdmonitions(fn.body);
  // 2) de-em-dash the body (fence-aware) + MDX-safety (autolinks, stray '<')
  const dd = deEmDashBody(adm.body);
  // 3) rewrite cross-doc links
  const lk = rewriteLinks(dd.body, idMap);
  // 4) animate the first mermaid diagram (opt-in CSS wrapper)
  const anim = animateFirstMermaid(lk.body);
  let body = anim.body;

  // 3) description from exec summary (run through the prose de-em-dasher first)
  const descRaw = execSummaryFirstPara(content);
  const description = clampDescription(deEmDashLine(descRaw));

  // 4) title (de-em-dashed lead phrase)
  const title = deEmDashLine(lead);

  // assemble frontmatter (preserve slug + sidebar_position on update)
  const fm = {
    slug: (existingFile && existingFile.data.slug) || slug,
    sidebar_position:
      (existingFile && existingFile.data.sidebar_position) || sidebarPosition,
    title,
    description,
    authors: ['oeid'],
    tags: deriveTags(id, lead),
    draft: true,
    source: {
      repo: 'work-git',
      path:
        'docs/architecture/co-designs/' +
        srcPath.split('/co-designs/')[1], // keep the public/… suffix
      id,
      status: data.status || 'In Review',
      imported: IMPORT_DATE,
    },
  };

  // ensure a truncate marker after the first paragraph if none present
  if (!/<!--\s*truncate\s*-->|\{\/\*\s*truncate\s*\*\/\}/.test(body)) {
    // insert after the first non-empty prose paragraph following the H1
    body = insertTruncate(body);
  }

  const file = matter.stringify('\n' + body.replace(/^\n+/, ''), fm);
  return {
    file,
    fm,
    stats: dd,
    links: lk,
    footnotes: fn,
    admonitions: adm,
    animated: anim.animated,
  };
}

function insertTruncate(body) {
  const lines = body.split('\n');
  // find the first H1, then the end of the first paragraph after it
  let i = lines.findIndex((l) => /^#\s/.test(l));
  if (i === -1) i = 0;
  let j = i + 1;
  // skip blank lines
  while (j < lines.length && lines[j].trim() === '') j++;
  // walk to end of this paragraph
  while (j < lines.length && lines[j].trim() !== '') j++;
  lines.splice(j, 0, '', '<!-- truncate -->');
  return lines.join('\n');
}

// Normalize a frontmatter date to YYYY-MM-DD. gray-matter parses an unquoted YAML date
// into a JS Date, so String(date) would give "Thu Feb 26 …"; handle both Date and string.
function isoDate(d) {
  if (d instanceof Date && !isNaN(d)) {
    // use UTC parts to avoid a TZ off-by-one on the date authored in the doc
    return d.toISOString().slice(0, 10);
  }
  const s = String(d);
  const m = s.match(/\d{4}-\d{2}-\d{2}/);
  return m ? m[0] : s.slice(0, 10);
}

// filename YYYY-MM-DD-<kebab>.mdx from source date + lead title
function postFilename(plan) {
  return `${isoDate(plan.data.date)}-${kebab(plan.lead)}.mdx`;
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const DRY = args.includes('--dry-run');
// IMPORT_DATE is passed in via env (scripts can't call Date.now in some harnesses); the
// SKILL documents exporting IMPORT_DATE. Fallback to today's ISO date if the shell set it.
const IMPORT_DATE = process.env.IMPORT_DATE || todayISO();

function todayISO() {
  // node Date is fine when run directly via `node`; guard for safety.
  try {
    return new Date().toISOString().slice(0, 10);
  } catch {
    return 'unknown';
  }
}

function collectSources(args) {
  const out = [];
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--all') {
      const dir = args[++i];
      const files = fs
        .readdirSync(dir)
        .filter((n) => /^CO-DESIGN-.*-hld\.md$/.test(n))
        .filter((n) => !/research/i.test(n))
        .map((n) => path.join(dir, n));
      for (const f of files) {
        const { data } = matter(fs.readFileSync(f, 'utf8'));
        if (data.visibility && data.visibility !== 'public') continue;
        out.push(f);
      }
    } else if (a === '--dry-run') {
      continue;
    } else if (a.endsWith('.md')) {
      out.push(a);
    }
  }
  return out;
}

function main() {
  const sources = collectSources(args);
  if (!sources.length) {
    console.error(
      'usage: import-co-design.js <source-hld.md> [...] | --all <dir> [--dry-run]'
    );
    process.exit(1);
  }

  const existing = listExistingDesigns();
  const plans = sources.map(planImport);
  const idMap = buildIdMap(plans);

  let nextPos = nextSidebarPosition(existing);

  for (const plan of plans) {
    // idempotency: find an existing designs post with the same source.id
    const match = existing.find(
      (e) => e.data && e.data.source && e.data.source.id === plan.id
    );
    const sidebarPos = match ? match.data.sidebar_position : nextPos;
    const { file, fm, stats, links, footnotes, admonitions, animated } =
      renderPost(plan, idMap, sidebarPos, match);

    const outName = match ? match.file : postFilename(plan);
    const outPath = path.join(DESIGNS, outName);
    const action = match ? 'UPDATE' : 'CREATE';

    const summary =
      `${action} ${outName}  (pos ${fm.sidebar_position}, ` +
      `em-dash prose:${stats.prose} fenced:${stats.fenced}, ` +
      `links rewritten:${links.rewritten} delinked:${links.delinked}, ` +
      `footnotes:${footnotes.defs} admonitions:${admonitions.converted} ` +
      `animated:${animated ? 'yes' : 'no'})`;

    if (DRY) {
      console.log('[dry-run] ' + summary);
    } else {
      fs.writeFileSync(outPath, file);
      console.log(summary);
    }
    // advance the position counter for the next NEW post (dry-run too, so the preview
    // shows the real positions it would assign).
    if (!match) nextPos += 1;
  }

  if (!DRY) {
    console.log(
      `\nDone. ${plans.length} co-design(s) imported into ${path.relative(
        process.cwd(),
        DESIGNS
      )}.`
    );
    console.log(
      'Next: verify no raw em-dash shipped ->  grep -rn "\\u2014" ' +
        'bytesofpurpose-blog/designs/  (expect zero), then yarn build.'
    );
  }
}

// Run main() only when invoked directly (node import-co-design.js …), NOT when required
// as a module (the unit tests import the pure transform functions below).
if (require.main === module) {
  main();
}

// Exported for unit tests (test/unit/import-co-design.test.ts). These are the pure
// transform functions — no filesystem, deterministic given their input.
module.exports = {
  kebab,
  leadTitle,
  clampDescription,
  deEmDashLine,
  deEmDashBody,
  mdxSafeLine,
  entityizeDashes,
  rewriteLinks,
  convertFootnotes,
  convertAdmonitions,
  animateFirstMermaid,
  deriveTags,
  isoDate,
};
