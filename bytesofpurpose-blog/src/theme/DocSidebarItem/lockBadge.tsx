import React from 'react';
import {useAllPluginInstancesData} from '@docusaurus/useGlobalData';
import styles from './lockBadge.module.css';

// Shared helper for the "premium" lock badge on sidebar items. Reads the premium-permalink
// set published by plugins/draft-docs (premiumPermalinks, alongside draftPermalinks) and
// tells the swizzled Link whether a given href is a premium (gated) doc.
//
// UNLIKE the draft badge (dev/localhost-only), the lock badge ships to PRODUCTION: premium
// docs DO publish to prod (encrypted), so readers should see which entries are gated.

function usePremiumPermalinks(): Set<string> {
  const data = useAllPluginInstancesData('draft-docs-plugin') as
    | {default?: {premiumPermalinks?: string[]}}
    | undefined;
  const list = data?.default?.premiumPermalinks ?? [];
  return React.useMemo(() => new Set(list.map(normalize)), [list]);
}

function normalize(href: string): string {
  if (!href) return href;
  return href.length > 1 ? href.replace(/\/$/, '') : href;
}

/** True when a leaf doc link is premium (gated). Works in production (the plugin data is
 *  populated there, and premium docs ship encrypted). */
export function useIsPremium(href?: string): boolean {
  const premium = usePremiumPermalinks();
  if (!href) return false;
  return premium.has(normalize(href));
}

export function LockBadge(): React.JSX.Element {
  return (
    <span
      className={styles.lockBadge}
      title="Premium: sign in with LinkedIn to unlock"
      aria-label="premium">
      🔒
    </span>
  );
}
