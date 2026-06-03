import React from 'react';
import posthog from 'posthog-js';
import {showToast} from '@site/src/components/Toast';
import styles from './styles.module.css';

// Inline "share this page" control, rendered next to doc / blog-post H1 titles.
// Part of the ingress-attribution layer: each channel mints a URL tagged with a
// short `im` (ingressMarker) query param, which src/posthog.js reads + strips on
// arrival to attribute return traffic to the channel that produced the link.
// Full design: src/ingress-attribution-plan.md.

type Channel = 'share_cp' | 'share_em' | 'share_li' | 'share_x';

// Build the current page URL tagged with the given ingress marker.
function shareUrl(marker: Channel): string {
  const u = new URL(window.location.href);
  u.searchParams.set('im', marker);
  return u.toString();
}

// The page title, preferring the prop (from frontmatter) over the document <title>
// (which carries the " | Bytes of Purpose" suffix we don't want in a message).
function resolveTitle(propTitle?: string): string {
  if (propTitle) return propTitle.trim();
  const t = typeof document !== 'undefined' ? document.title : '';
  return t.replace(/\s*\|\s*Bytes of Purpose\s*$/i, '').trim();
}

// The page description/summary, preferring the prop (frontmatter description) and
// falling back to the og:description meta tag the site emits.
function resolveDescription(propDesc?: string): string {
  if (propDesc) return propDesc.trim();
  if (typeof document === 'undefined') return '';
  const meta = document.querySelector('meta[property="og:description"], meta[name="description"]');
  return (meta?.getAttribute('content') || '').trim();
}

// Friendly share message used as the email body and the X/LinkedIn post text:
//   "Hey, check out this post I came across: "<title>".
//    Here's what it covers: <summary>"
// "Here's what it covers:" reads cleanly regardless of how the description starts
// (our descriptions are often verb-first/SEO-style, e.g. "Learn the key differences…").
// The summary line is included only when a description is available.
//
// `maxLen` (used for X/Twitter only) caps the whole message: if it would exceed
// maxLen, the SUMMARY clause is trimmed at a word boundary and given an ellipsis,
// while the title clause is always preserved. X auto-appends the URL card from
// &url=, so we budget below the 280 limit (default cap 200) to leave room for it.
function composeMessage(title: string, description: string, maxLen?: number): string {
  const head = `Hey, check out this post I came across: "${title}".`;
  if (!description) return head;
  const summary = description.replace(/\.$/, '');
  let full = `${head} Here's what it covers: ${summary}.`;
  if (maxLen && full.length > maxLen) {
    // Trim only the summary; keep "Here's what it covers: …".
    const prefix = `${head} Here's what it covers: `;
    const room = Math.max(0, maxLen - prefix.length - 1); // -1 for the ellipsis
    let trimmed = summary.slice(0, room);
    const lastSpace = trimmed.lastIndexOf(' ');
    if (lastSpace > 0) trimmed = trimmed.slice(0, lastSpace);
    full = `${prefix}${trimmed}…`;
  }
  return full;
}

// X/Twitter post text budget, below the 280 limit to leave room for the URL card.
const X_MAX_LEN = 200;

function capture(channel: Channel, surface: string) {
  posthog.capture('egress_share', {
    channel,
    surface,
    // SSR-safe (component renders in swizzled theme): guard window access.
    path: typeof window !== 'undefined' ? window.location.pathname : undefined,
  });
}

// Reuses the clipboard-with-execCommand-fallback pattern from
// src/components/Graph/useGraphInteractions.ts (copyAnchorLink).
async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    // Fallback: older execCommand path for browsers/contexts without the async API.
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.select();
    let ok = false;
    try {
      ok = document.execCommand('copy');
    } catch (fallbackErr) {
      posthog.captureException(fallbackErr);
    }
    document.body.removeChild(textArea);
    return ok;
  }
}

const Icon = ({path, label}: {path: string; label: string}) => (
  <svg viewBox="0 0 24 24" role="img" aria-label={label}>
    <path d={path} />
  </svg>
);

// Minimal inline icon paths (Material-ish), no icon dependency added.
const ICONS = {
  copy: 'M16 1H4a2 2 0 0 0-2 2v14h2V3h12V1zm3 4H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zm0 16H8V7h11v14z',
  email: 'M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z',
  linkedin:
    'M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14zM8.34 17V10.5H6.17V17h2.17zM7.25 9.5a1.26 1.26 0 1 0 0-2.52 1.26 1.26 0 0 0 0 2.52zM18 17v-3.57c0-1.9-1.02-2.78-2.38-2.78-1.1 0-1.59.6-1.86 1.03V10.5h-2.17V17h2.17v-3.5c0-.93.18-1.83 1.33-1.83 1.13 0 1.14 1.06 1.14 1.89V17H18z',
  x: 'M18.9 2H22l-7.5 8.57L23.27 22h-6.9l-5.4-7.06L4.8 22H1.66l8.02-9.17L1 2h7.07l4.88 6.45L18.9 2zm-2.42 18h1.71L7.63 3.78H5.8L16.48 20z',
};

export const ShareButton = ({
  surface,
  title: propTitle,
  description: propDescription,
}: {
  surface: string;
  title?: string;
  description?: string;
}) => {
  const onCopy = async () => {
    const url = shareUrl('share_cp');
    const title = resolveTitle(propTitle);
    // Prefer the native share sheet on mobile; fall back to clipboard copy.
    const nav = typeof navigator !== 'undefined' ? navigator : undefined;
    if (nav?.share && /Mobi|Android/i.test(nav.userAgent || '')) {
      try {
        await nav.share({title, text: composeMessage(title, resolveDescription(propDescription)), url});
        capture('share_cp', surface);
        return;
      } catch {
        // user dismissed the sheet, or share failed; fall through to copy.
      }
    }
    const ok = await copyToClipboard(url);
    capture('share_cp', surface);
    if (ok) showToast('Link copied', {icon: '🔗'});
  };

  const openIntent = (channel: Channel, href: string, toast: string, icon: string) => {
    capture(channel, surface);
    showToast(toast, {icon});
    window.open(href, '_blank', 'noopener,noreferrer');
  };

  // The friendly message, computed once per share from the page's title + summary.
  // `maxLen` is passed for X only (to stay under the tweet limit); email has no cap.
  const message = (maxLen?: number) =>
    composeMessage(resolveTitle(propTitle), resolveDescription(propDescription), maxLen);

  const onEmail = () => {
    const url = shareUrl('share_em');
    const title = resolveTitle(propTitle);
    // Body: "Hey, check out this post… It talks about …" followed by the tagged link.
    const body = `${message()}\n\n${url}`;
    openIntent(
      'share_em',
      `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`,
      'Opening email…',
      '✉️',
    );
  };

  const onLinkedIn = () => {
    const url = shareUrl('share_li');
    // Use the documented shareArticle endpoint (mini=true). NB: LinkedIn no longer
    // accepts text/summary prefill params and the composer opens blank; the rich
    // preview is rendered from the target page's Open Graph tags (og:title/description/
    // image, which this site emits), attaching when the post is composed/submitted.
    openIntent(
      'share_li',
      `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}`,
      'Sharing on LinkedIn…',
      '💼',
    );
  };

  const onX = () => {
    const url = shareUrl('share_x');
    // X supports prefilled tweet text, so use the friendly message (it auto-appends the
    // URL card from &url=). Cap the text at X_MAX_LEN so a long description doesn't
    // blow past the tweet limit; the summary clause is trimmed, the title kept.
    openIntent(
      'share_x',
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(message(X_MAX_LEN))}`,
      'Sharing on X…',
      '𝕏',
    );
  };

  return (
    <span className={styles.row} data-testid="share-control" data-surface={surface}>
      <button
        type="button"
        className={styles.btn}
        onClick={onCopy}
        title="Copy link"
        aria-label="Copy link to this page"
        data-testid="share-copy">
        <Icon path={ICONS.copy} label="Copy link" />
      </button>
      <button
        type="button"
        className={styles.btn}
        onClick={onEmail}
        title="Share via email"
        aria-label="Share this page via email"
        data-testid="share-email">
        <Icon path={ICONS.email} label="Email" />
      </button>
      <button
        type="button"
        className={styles.btn}
        onClick={onLinkedIn}
        title="Share on LinkedIn"
        aria-label="Share this page on LinkedIn"
        data-testid="share-linkedin">
        <Icon path={ICONS.linkedin} label="LinkedIn" />
      </button>
      <button
        type="button"
        className={styles.btn}
        onClick={onX}
        title="Share on X"
        aria-label="Share this page on X"
        data-testid="share-x">
        <Icon path={ICONS.x} label="X" />
      </button>
    </span>
  );
};

export default ShareButton;
