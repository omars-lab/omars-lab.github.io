import React from 'react';
import {useAllPluginInstancesData} from '@docusaurus/useGlobalData';
import {isLocalhost} from '@site/src/experiments';
import styles from './draftBadge.module.css';

// Shared helper for the (dev/localhost-only) draft badge on sidebar items.
// Reads the draft-permalink set published by plugins/draft-docs and tells the
// swizzled Link/Category whether a given href is a draft.

function useDraftPermalinks(): Set<string> {
  const data = useAllPluginInstancesData('draft-docs-plugin') as
    | {default?: {draftPermalinks?: string[]}}
    | undefined;
  const list = data?.default?.draftPermalinks ?? [];
  return React.useMemo(() => new Set(list.map(normalize)), [list]);
}

function normalize(href: string): string {
  // Compare without trailing slash so '/foo' and '/foo/' match.
  if (!href) return href;
  return href.length > 1 ? href.replace(/\/$/, '') : href;
}

/**
 * Returns true only when the badge should show: on localhost, in a dev build,
 * and the href is a known draft. Safe to call unconditionally (it no-ops in
 * production — the plugin data is empty there and isLocalhost() is false).
 */
export function useIsDraft(href?: string): boolean {
  const drafts = useDraftPermalinks();
  if (process.env.NODE_ENV === 'production') return false;
  if (!href || !isLocalhost()) return false;
  return drafts.has(normalize(href));
}

export function DraftBadge(): JSX.Element {
  return (
    <span className={styles.draftBadge} title="Draft — hidden in production">
      draft
    </span>
  );
}
