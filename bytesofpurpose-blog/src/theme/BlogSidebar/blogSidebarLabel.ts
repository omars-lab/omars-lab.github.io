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

// Posts pinned ABOVE the year groups (`pinned: true` or `kind: legend`). The plugin
// publishes their permalinks; the swizzled BlogSidebar pulls these out of the year-grouped
// list and renders them at the very top, so an index/keystone isn't buried by its date.
function useBlogPinnedPermalinks(): Set<string> {
  const data = useAllPluginInstancesData('draft-docs-plugin') as
    | {default?: {blogPinnedPermalinks?: string[]}}
    | undefined;
  const list = data?.default?.blogPinnedPermalinks ?? [];
  return React.useMemo(() => new Set(list.map(normalize)), [list]);
}

export type BlogSidebarItem = {title: string; permalink: string; [k: string]: unknown};

// permalink -> tag slugs, published by the plugin so the sidebar can scope to a tag page.
function useBlogPostTags(): Record<string, string[]> {
  const data = useAllPluginInstancesData('draft-docs-plugin') as
    | {default?: {blogPostTags?: Record<string, string[]>}}
    | undefined;
  const raw = data?.default?.blogPostTags ?? {};
  return React.useMemo(() => {
    const out: Record<string, string[]> = {};
    for (const [permalink, tags] of Object.entries(raw)) out[normalize(permalink)] = tags;
    return out;
  }, [raw]);
}

/**
 * The tag slug the current page is filtered by, or null. Reads the URL: a blog tag page is
 * `<route>/tags/<tagSlug>` (e.g. /thoughts/tags/technical-debt). Pass the current pathname.
 */
export function currentTagSlug(pathname: string): string | null {
  const m = pathname.match(/\/tags\/([^/]+)\/?$/);
  return m ? decodeURIComponent(m[1]) : null;
}

/**
 * Scope sidebar items to the active tag when on a tag page; otherwise return them unchanged.
 * So the left "Posts" list matches the tag-filtered main area instead of showing everything.
 */
export function useTagScopedItems(
  items: BlogSidebarItem[],
  pathname: string,
): {items: BlogSidebarItem[]; tag: string | null} {
  const tagMap = useBlogPostTags();
  const tag = currentTagSlug(pathname);
  const scoped = React.useMemo(() => {
    if (!tag) return items;
    const filtered = items.filter((it) => (tagMap[normalize(it.permalink)] ?? []).includes(tag));
    // If we somehow matched nothing (tag map missing), don't hide the whole sidebar.
    return filtered.length ? filtered : items;
  }, [items, tagMap, tag]);
  return {items: scoped, tag};
}

/**
 * Split sidebar items into [pinned, rest]. Pinned items keep their source order; rest is
 * left untouched for the normal year grouping. Use in the BlogSidebar swizzle.
 */
export function usePartitionedBlogItems(items: BlogSidebarItem[]): [BlogSidebarItem[], BlogSidebarItem[]] {
  const pinned = useBlogPinnedPermalinks();
  return React.useMemo(() => {
    const top: BlogSidebarItem[] = [];
    const rest: BlogSidebarItem[] = [];
    for (const item of items) {
      (pinned.has(normalize(item.permalink)) ? top : rest).push(item);
    }
    return [top, rest];
  }, [items, pinned]);
}
