import React from 'react';
import {useAllPluginInstancesData} from '@docusaurus/useGlobalData';

// Reads the {permalink -> kind emoji} map published by plugins/draft-docs for DOCS that
// carry a `kind:` (e.g. `kind: hub` -> 🗂️). The swizzled DocSidebarItem/Link prepends this
// emoji to the sidebar label, mirroring how blog posts get a kind emoji. Drift-free: the
// emoji comes from scripts/lib/blog-kinds.json via the plugin, never hand-typed.

function useDocsKindEmojiMap(): Record<string, string> {
  const data = useAllPluginInstancesData('draft-docs-plugin') as
    | {default?: {docsKindEmoji?: Record<string, string>}}
    | undefined;
  const map = data?.default?.docsKindEmoji ?? {};
  // Re-key without a trailing slash so '/foo' and '/foo/' both match.
  return React.useMemo(() => {
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(map)) out[normalize(k)] = v;
    return out;
  }, [map]);
}

function normalize(href: string): string {
  if (!href) return href;
  return href.length > 1 ? href.replace(/\/$/, '') : href;
}

/** The kind emoji for a doc sidebar link, or '' if the doc has no (known) kind. */
export function useDocKindEmoji(href?: string): string {
  const map = useDocsKindEmojiMap();
  if (!href) return '';
  return map[normalize(href)] || '';
}
