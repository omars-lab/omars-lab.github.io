#!/usr/bin/env node
/**
 * preview-share-message.js — show the EXACT share output a page produces.
 *
 * Mirrors the ShareButton logic (src/components/ShareButton/index.tsx:
 * composeMessage + shareUrl + the mailto/X/LinkedIn intent URLs) so a page's
 * frontmatter `description:` can be tuned for how it actually reads when shared
 * — not guessed. The skill `manage-frontmatter-descriptions` calls this.
 *
 * Keep in lockstep with ShareButton: composeMessage(), shareUrl(), onEmail/onX/
 * onLinkedIn intent construction, and the markers (share_cp/em/li/x). If the
 * component's wording or endpoints change, change them here too.
 *
 * Usage:
 *   node scripts/preview-share-message.js docs/welcome/README.md
 *   node scripts/preview-share-message.js docs/welcome/README.md blog/2024-01-01-foo.md
 * Output: per page — resolved title/summary, the friendly message, the exact
 * email/X/LinkedIn URLs, and the SEO/share length verdict (50–160, matches the
 * validate-docs-structure description-length rule).
 */
const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const SITE = 'https://blog.bytesofpurpose.com';
const DESC_MIN = 50; // keep in sync with validate-docs-structure.js
const DESC_MAX = 160;
const X_MAX_LEN = 200; // keep in sync with ShareButton's X_MAX_LEN

// --- ShareButton parity (do not drift from index.tsx) -------------------

// shareUrl(marker): the page URL tagged with ?im=<marker>.
function shareUrl(slug, marker) {
  const u = new URL(slug.startsWith('/') ? slug : `/${slug}`, SITE);
  u.searchParams.set('im', marker);
  return u.toString();
}

// composeMessage(title, description, maxLen?): the friendly email body / X text.
// maxLen (X only) trims the summary clause at a word boundary + ellipsis.
function composeMessage(title, description, maxLen) {
  const head = `Hey, check out this post I came across: "${title}".`;
  if (!description) return head;
  const summary = description.replace(/\.$/, '');
  let full = `${head} Here's what it covers: ${summary}.`;
  if (maxLen && full.length > maxLen) {
    const prefix = `${head} Here's what it covers: `;
    const room = Math.max(0, maxLen - prefix.length - 1);
    let trimmed = summary.slice(0, room);
    const lastSpace = trimmed.lastIndexOf(' ');
    if (lastSpace > 0) trimmed = trimmed.slice(0, lastSpace);
    full = `${prefix}${trimmed}…`;
  }
  return full;
}

// --- per-page preview ----------------------------------------------------

function previewFile(file) {
  const abs = path.resolve(file);
  if (!fs.existsSync(abs)) {
    console.error(`  ✗ not found: ${file}`);
    return;
  }
  const { data } = matter(fs.readFileSync(abs, 'utf8'));
  const title = (data.title || '(no title — falls back to document.title at runtime)').trim();
  const description = typeof data.description === 'string' ? data.description.trim() : '';
  const slug = data.slug || '(no slug)';

  const message = composeMessage(title, description); // email body (uncapped)
  const xMessage = composeMessage(title, description, X_MAX_LEN); // X text (capped)
  const emailBody = `${message}\n\n${shareUrl(slug, 'share_em')}`;
  const emailUrl = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(emailBody)}`;
  const xUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl(slug, 'share_x'))}&text=${encodeURIComponent(xMessage)}`;
  const liUrl = `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(shareUrl(slug, 'share_li'))}`;

  // Length verdict (matches the validator's description-length rule).
  let verdict;
  if (!description) verdict = '⚠ MISSING — no summary line; share message is title-only, weak SEO card';
  else if (description.length < DESC_MIN) verdict = `⚠ ${description.length} chars — under ${DESC_MIN}; too thin`;
  else if (description.length > DESC_MAX) verdict = `⚠ ${description.length} chars — over ${DESC_MAX}; truncated in cards`;
  else verdict = `✓ ${description.length} chars — in the ${DESC_MIN}–${DESC_MAX} share/SEO range`;

  console.log(`\n━━ ${file}`);
  console.log(`  title:   ${title}`);
  console.log(`  summary: ${description || '(none)'}`);
  console.log(`  length:  ${verdict}`);
  console.log(`\n  Friendly message (email body, uncapped):`);
  console.log(`    ${message}`);
  if (xMessage !== message) {
    console.log(`\n  X text (capped at ${X_MAX_LEN}, ${xMessage.length} chars):`);
    console.log(`    ${xMessage}`);
  }
  console.log(`\n  Copy-link clipboard:  ${shareUrl(slug, 'share_cp')}`);
  console.log(`  Email (mailto):       ${emailUrl}`);
  console.log(`  X / Twitter:          ${xUrl}`);
  console.log(`  LinkedIn:             ${liUrl}`);
  console.log(`    (LinkedIn composer opens blank by design — preview renders from OG tags.)`);
}

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error('Usage: node scripts/preview-share-message.js <doc-or-blog-file> [more files…]');
  process.exit(2);
}
files.forEach(previewFile);
