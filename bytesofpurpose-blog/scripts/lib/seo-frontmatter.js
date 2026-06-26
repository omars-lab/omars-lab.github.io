/**
 * seo-frontmatter.js — SHARED SEO frontmatter checks, the single source of truth for the
 * description/title thresholds + the per-file SEO finding logic.
 *
 * WHY shared: `validate-docs-structure.js` checks description over `docs/` only; `validate-seo.js`
 * runs the SAME checks over the BLOG instances (blog/designs/thoughts/changelog) that the docs
 * validator deliberately skips. Both call these functions so the rules never diverge (extend, do
 * not duplicate). A `description:` feeds BOTH `<meta name=description>` + `og:description` (SEO +
 * the social card) AND the ShareButton message, so it is the highest-leverage SEO field.
 *
 * Each function returns an array of findings: {id, detail}. The caller attaches the file path +
 * tier and aggregates. Tiers are the caller's concern; the recommended tiers are in the comments.
 */

// Description length window. ~50 chars is the floor for a useful summary; ~160 is where search
// engines + social cards truncate. (Mirrors the long-standing docs thresholds.)
const DESC_MIN = 50;
const DESC_MAX = 160;

// Title length: Google truncates page titles around 60 chars (hard cap ~70 before it is almost
// always cut). Warn past 60, and treat past 70 as the firm ceiling.
const TITLE_SOFT_MAX = 60;
const TITLE_HARD_MAX = 70;

/** Strip a leading emoji + whitespace from a title so the length check measures the real words. */
function titleText(raw) {
  if (typeof raw !== 'string') return '';
  return raw.replace(/^\s*\p{Extended_Pictographic}️?\s*/u, '').trim();
}

/**
 * Description checks for one file's frontmatter. Returns findings (warn-tier at the caller):
 *   description-missing  — no `description:` (Docusaurus falls back to the first content line,
 *                          which is unreliable; an explicit one is best practice)
 *   description-length   — outside the ~50–160 window
 */
function checkDescription(data) {
  const findings = [];
  const desc = typeof data.description === 'string' ? data.description.trim() : '';
  if (!desc) {
    findings.push({
      id: 'description-missing',
      detail: 'no frontmatter `description:` — add one (feeds SEO meta + og:description + the share message)',
    });
    return findings;
  }
  if (desc.length < DESC_MIN) {
    findings.push({
      id: 'description-length',
      detail: `description is ${desc.length} chars — shorter than ${DESC_MIN}; too thin for a useful SEO/share summary`,
    });
  } else if (desc.length > DESC_MAX) {
    findings.push({
      id: 'description-length',
      detail: `description is ${desc.length} chars — longer than ${DESC_MAX}; it will be truncated in search/social cards`,
    });
  }
  return findings;
}

/**
 * Title checks for one file's frontmatter. Returns findings (warn-tier at the caller):
 *   title-missing  — no `title:` (the page title falls back to the filename, an SEO defect)
 *   title-length   — the title (minus a leading emoji) is over the SERP truncation window
 */
function checkTitle(data) {
  const findings = [];
  const raw = data.title;
  if (typeof raw !== 'string' || !raw.trim()) {
    findings.push({
      id: 'title-missing',
      detail: 'no frontmatter `title:` — the page <title> falls back to the filename (poor SEO)',
    });
    return findings;
  }
  const t = titleText(raw);
  if (t.length > TITLE_HARD_MAX) {
    findings.push({
      id: 'title-length',
      detail: `title is ${t.length} chars — over the ${TITLE_HARD_MAX}-char ceiling; search engines will cut it`,
    });
  } else if (t.length > TITLE_SOFT_MAX) {
    findings.push({
      id: 'title-length',
      detail: `title is ${t.length} chars — over ~${TITLE_SOFT_MAX}; it may be truncated in search results`,
    });
  }
  return findings;
}

/**
 * Keywords format check. `keywords:` is the ONLY field that emits `<meta name=keywords>`; it is
 * low-value for SEO today, so we do NOT require it — but if present it must be a non-empty list
 * or comma string (a stray `keywords: true` or `keywords: []` ships an empty/broken tag).
 */
function checkKeywords(data) {
  if (!('keywords' in data) || data.keywords == null) return [];
  const k = data.keywords;
  const ok =
    (Array.isArray(k) && k.length > 0 && k.every((x) => typeof x === 'string' && x.trim())) ||
    (typeof k === 'string' && k.trim().length > 0);
  if (ok) return [];
  return [
    {
      id: 'keywords-format',
      detail: '`keywords:` is present but empty/malformed — use a non-empty list or comma string, or remove it',
    },
  ];
}

/**
 * Image-exists check. A per-page `image:` overrides the global social card; if it points at a
 * static asset that is not on disk, the page ships a 404 og:image (the most common silent
 * social-card break). `staticDir` is the absolute path to the site's `static/` dir.
 */
function checkImageExists(data, staticDir, fs, path) {
  if (typeof data.image !== 'string' || !data.image.trim()) return [];
  const img = data.image.trim();
  // Only validate site-local images (a leading slash → relative to static/). Skip absolute URLs.
  if (/^https?:\/\//i.test(img)) return [];
  const rel = img.replace(/^\//, '');
  const onDisk = fs.existsSync(path.join(staticDir, rel));
  if (onDisk) return [];
  return [
    {
      id: 'image-missing',
      detail: `image: ${img} does not exist under static/ — the og:image would 404 (fix the path or remove image:)`,
    },
  ];
}

/**
 * Corpus duplicate-description check. Given a list of {file, description}, returns a Map of
 * normalized-description → [files] for any description shared by 2+ files. The caller turns each
 * into a `description-duplicate` finding. Each page needs a distinct og:description + share text.
 */
function findDuplicateDescriptions(entries) {
  const byDesc = new Map();
  for (const {file, description} of entries) {
    if (typeof description === 'string' && description.trim()) {
      const key = description.trim().toLowerCase();
      if (!byDesc.has(key)) byDesc.set(key, []);
      byDesc.get(key).push(file);
    }
  }
  const dups = new Map();
  for (const [key, files] of byDesc) {
    if (files.length > 1) dups.set(key, files);
  }
  return dups;
}

module.exports = {
  DESC_MIN,
  DESC_MAX,
  TITLE_SOFT_MAX,
  TITLE_HARD_MAX,
  titleText,
  checkDescription,
  checkTitle,
  checkKeywords,
  checkImageExists,
  findDuplicateDescriptions,
};
