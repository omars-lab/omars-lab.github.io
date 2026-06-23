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

function useBlogDraftPermalinks(): Set<string> {
  const data = useAllPluginInstancesData('draft-docs-plugin') as
    | {default?: {blogDraftPermalinks?: string[]}}
    | undefined;
  const list = data?.default?.blogDraftPermalinks ?? [];
  return React.useMemo(() => new Set(list.map(normalize)), [list]);
}

/**
 * True when a BLOG sidebar item's permalink is a draft post. Used by the swizzled
 * BlogSidebar (Thoughts/Designs), whose items carry only a permalink (no draft
 * flag). Same localhost + non-prod gating as the docs draft badge.
 */
export function useIsBlogDraft(permalink?: string): boolean {
  const drafts = useBlogDraftPermalinks();
  if (process.env.NODE_ENV === 'production') return false;
  if (!permalink || !isLocalhost()) return false;
  return drafts.has(normalize(permalink));
}

function normalize(href: string): string {
  // Compare without trailing slash so '/foo' and '/foo/' match.
  if (!href) return href;
  return href.length > 1 ? href.replace(/\/$/, '') : href;
}

/**
 * True when a LEAF doc link is a draft. Gated to localhost + dev build; no-ops in
 * production (plugin data is empty there and isLocalhost() is false). Only leaf
 * doc links are badged; see plugins/draft-docs for why categories aren't.
 */
export function useIsDraft(href?: string): boolean {
  const drafts = useDraftPermalinks();
  if (process.env.NODE_ENV === 'production') return false;
  if (!href || !isLocalhost()) return false;
  return drafts.has(normalize(href));
}

export function DraftBadge(): React.JSX.Element {
  // Single "D" so the pill never wraps next to long sidebar labels; full word
  // is in the tooltip + aria-label.
  return (
    <span
      className={styles.draftBadge}
      title="Draft, hidden in production"
      aria-label="draft">
      D
    </span>
  );
}
