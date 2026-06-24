import React from 'react';
import {useAllPluginInstancesData} from '@docusaurus/useGlobalData';

// Resolves the SHORT sidebar label for a blog post. The Docusaurus blog sidebar item
// carries only {title, permalink} (it does not read the post's `sidebar_label:`
// frontmatter the way the docs sidebar does). The draft-docs plugin walks every blog
// post and publishes a {permalink -> sidebar_label} map; the swizzled BlogSidebar looks
// the label up here and falls back to the full title when none is set.
//
// Unlike the draft badge, this is NOT dev-gated: short sidebar labels are a real
// reader-facing improvement that should ship to production too.

function normalize(href: string): string {
  if (!href) return href;
  return href.length > 1 ? href.replace(/\/$/, '') : href;
}

function useBlogSidebarLabels(): Record<string, string> {
  const data = useAllPluginInstancesData('draft-docs-plugin') as
    | {default?: {blogSidebarLabels?: Record<string, string>}}
    | undefined;
  const raw = data?.default?.blogSidebarLabels ?? {};
  return React.useMemo(() => {
    const out: Record<string, string> = {};
    for (const [permalink, label] of Object.entries(raw)) {
      out[normalize(permalink)] = label;
    }
    return out;
  }, [raw]);
}

/**
 * The label to show for a blog post in the Posts sidebar: its `sidebar_label:` if set,
 * otherwise the full `title`. Pass the sidebar item's title + permalink.
 */
export function useBlogSidebarLabel(permalink: string | undefined, title: string): string {
  const labels = useBlogSidebarLabels();
  if (!permalink) return title;
  return labels[normalize(permalink)] ?? title;
}
