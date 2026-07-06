import React from 'react';
import {useAllPluginInstancesData} from '@docusaurus/useGlobalData';
import {isLocalhost} from '@site/src/experiments';
import styles from './deprecatedBadge.module.css';

// Shared helper for the (dev/localhost-only) "Dep" badge on sidebar items.
// Reads the deprecated-permalink set published by plugins/draft-docs and tells
// the swizzled Link/BlogSidebar whether a given href is a deprecated page.
//
// DEPRECATED pages (unlike drafts) DO ship to production — they stay live for
// URL stability/history. But by design their badge + banner are gated to
// localhost + non-prod exactly like the draft badge (mirrors useIsDraft), so the
// deprecation cue is dev-only for now and never leaks to the deployed site.

function useDeprecatedPermalinks(): Set<string> {
  const data = useAllPluginInstancesData('draft-docs-plugin') as
    | {default?: {deprecatedPermalinks?: string[]}}
    | undefined;
  const list = data?.default?.deprecatedPermalinks ?? [];
  return React.useMemo(() => new Set(list.map(normalize)), [list]);
}

function useBlogDeprecatedPermalinks(): Set<string> {
  const data = useAllPluginInstancesData('draft-docs-plugin') as
    | {default?: {blogDeprecatedPermalinks?: string[]}}
    | undefined;
  const list = data?.default?.blogDeprecatedPermalinks ?? [];
  return React.useMemo(() => new Set(list.map(normalize)), [list]);
}

/**
 * True when a BLOG sidebar item's permalink is a deprecated post. Used by the
 * swizzled BlogSidebar (Initiatives/Designs), whose items carry only a permalink
 * (no deprecated flag). Same localhost + non-prod gating as the docs badge.
 */
export function useIsBlogDeprecated(permalink?: string): boolean {
  const deprecated = useBlogDeprecatedPermalinks();
  if (process.env.NODE_ENV === 'production') return false;
  if (!permalink || !isLocalhost()) return false;
  return deprecated.has(normalize(permalink));
}

function normalize(href: string): string {
  // Compare without trailing slash so '/foo' and '/foo/' match.
  if (!href) return href;
  return href.length > 1 ? href.replace(/\/$/, '') : href;
}

/**
 * True when a LEAF doc link is deprecated. Gated to localhost + dev build; no-ops
 * in production (isLocalhost() is false there). Only leaf doc links are badged;
 * see plugins/draft-docs for why categories aren't.
 */
export function useIsDeprecated(href?: string): boolean {
  const deprecated = useDeprecatedPermalinks();
  if (process.env.NODE_ENV === 'production') return false;
  if (!href || !isLocalhost()) return false;
  return deprecated.has(normalize(href));
}

export function DeprecatedBadge(): React.JSX.Element {
  // Short "Dep" so the pill never wraps next to long sidebar labels; full word
  // is in the tooltip + aria-label.
  return (
    <span
      className={styles.deprecatedBadge}
      title="Deprecated"
      aria-label="deprecated">
      Dep
    </span>
  );
}
