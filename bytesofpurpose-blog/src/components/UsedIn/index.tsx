import React from 'react';
import Link from '@docusaurus/Link';
import usageData from './component-usage.json';
import styles from './styles.module.css';

/**
 * UsedIn renders the "used in" list for a showcase: the published posts/docs that actually use
 * this component/technique, generated from the corpus by generate-component-usage.js (so it can
 * never go stale). Drop it on a showcase doc; pass the showcase's own slug.
 *
 *   <UsedIn slug="/components/structural/card" />
 *
 * If nothing uses the technique yet, it renders a quiet "not used in a post yet" line instead of an
 * empty section (so a fresh showcase reads honestly rather than looking broken).
 */
const USAGE = usageData as Record<string, Array<{title: string; permalink: string}>>;

export interface UsedInProps {
  /** The showcase's own `slug` (e.g. "/components/structural/card"). */
  slug: string;
}

export default function UsedIn({slug}: UsedInProps): React.JSX.Element {
  const posts = USAGE[slug] || [];
  return (
    <div className={styles.usedIn}>
      <p className={styles.heading}>Used in</p>
      {posts.length === 0 ? (
        <p className={styles.empty}>Not used in a published post yet.</p>
      ) : (
        <ul className={styles.list}>
          {posts.map((p) => (
            <li key={p.permalink}>
              <Link to={p.permalink}>{p.title}</Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
