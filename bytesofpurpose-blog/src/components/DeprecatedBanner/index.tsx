import React from 'react';
import {isLocalhost} from '@site/src/experiments';
import styles from './styles.module.css';

/**
 * DeprecatedBanner renders a red top-of-page notice from a post's deprecation
 * frontmatter (`deprecated: true` + `deprecated_reason` + optional
 * `deprecated_for`). It is the on-page sibling of the dev-only "Dep" sidebar/title
 * badge (see src/theme/DocSidebarItem/deprecatedBadge) — the reader-facing warning
 * that a still-live page is outdated.
 *
 * Gated to localhost + non-prod exactly like the draft badge: deprecated pages DO
 * ship to production, but by design the deprecation signal is a dev-only cue for
 * now and never leaks to real readers. Renders nothing when not deprecated, in
 * production, or off-localhost.
 *
 * Mounted automatically by the swizzled doc/blog item wrappers (DocItem/Content,
 * BlogPostItem/Content) so an author never has to place it — they only set the
 * frontmatter.
 */
export interface DeprecatedBannerProps {
  deprecated?: unknown;
  reason?: unknown;
  replacement?: unknown;
}

function asText(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

export default function DeprecatedBanner({
  deprecated,
  reason,
  replacement,
}: DeprecatedBannerProps): React.JSX.Element | null {
  if (deprecated !== true) return null;
  // Dev-only, mirroring the draft/deprecated badge gate.
  if (process.env.NODE_ENV === 'production') return null;
  if (!isLocalhost()) return null;

  const reasonText = asText(reason);
  const replacementUrl = asText(replacement);

  return (
    <aside className={styles.banner} role="note" aria-label="Deprecated">
      <p className={styles.title}>⚠️ Deprecated</p>
      {reasonText && <p className={styles.reason}>{reasonText}</p>}
      {replacementUrl && (
        <p className={styles.replacement}>
          <a href={replacementUrl}>See the current version →</a>
        </p>
      )}
    </aside>
  );
}
