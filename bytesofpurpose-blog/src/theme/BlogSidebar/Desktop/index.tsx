import React, {memo} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import {translate} from '@docusaurus/Translate';
import {useVisibleBlogSidebarItems} from '@docusaurus/plugin-content-blog/client';
import BlogSidebarContent from '@theme/BlogSidebar/Content';
import {useLocation} from '@docusaurus/router';
import {useIsBlogDraft, DraftBadge} from '@site/src/theme/DocSidebarItem/draftBadge';
import {
  useBlogSidebarLabel,
  usePartitionedBlogItems,
  useTagScopedItems,
} from '@site/src/theme/BlogSidebar/blogSidebarLabel';
import styles from './styles.module.css';

// Swizzled @theme/BlogSidebar/Desktop: identical to upstream, except the post
// list renders the dev/localhost-only "D" draft badge next to draft posts — the
// same badge used in the Craft/Journey docs sidebar, now on the Initiatives and
// Designs blog "Posts" sidebar. Draft state comes from the blogDraftPermalinks
// set published by plugins/draft-docs (blog sidebar items carry only a permalink,
// no draft flag). Gated to localhost + non-prod; no-op in production.

function SidebarItemLink({
  item,
  linkClassName,
  linkActiveClassName,
}: {
  item: {title: string; permalink: string};
  linkClassName?: string;
  linkActiveClassName?: string;
}) {
  const isDraft = useIsBlogDraft(item.permalink);
  const label = useBlogSidebarLabel(item.permalink, item.title);
  return (
    <Link
      isNavLink
      to={item.permalink}
      className={linkClassName}
      activeClassName={linkActiveClassName}
      title={item.title}>
      {label}
      {isDraft && <DraftBadge />}
    </Link>
  );
}

const ListComponent = ({items}: {items: Array<{title: string; permalink: string}>}) => {
  return (
    <ul className={clsx(styles.sidebarItemList, 'clean-list')}>
      {items.map((item) => (
        <li key={item.permalink} className={styles.sidebarItem}>
          <SidebarItemLink
            item={item}
            linkClassName={styles.sidebarItemLink}
            linkActiveClassName={styles.sidebarItemLinkActive}
          />
        </li>
      ))}
    </ul>
  );
};

function BlogSidebarDesktop({sidebar}: any): React.JSX.Element {
  const allItems = useVisibleBlogSidebarItems(sidebar.items);
  const {pathname} = useLocation();
  // On a /tags/<tag> page, scope the sidebar to that tag so it matches the filtered main
  // area (otherwise the heading says "1 post" while the sidebar shows everything).
  const {items, tag} = useTagScopedItems(allItems, pathname);
  // Pinned posts (`pinned: true` / `kind: legend`) render ABOVE the year groups so an
  // index/keystone isn't buried by its date; the rest year-group as normal. (Skip pinning
  // when scoped to a tag — the list is already short and on-topic.)
  const [pinnedRaw, restRaw] = usePartitionedBlogItems(items);
  const pinned = tag ? [] : pinnedRaw;
  const rest = tag ? items : restRaw;
  return (
    <aside className="col col--3">
      <nav
        className={clsx(styles.sidebar, 'thin-scrollbar')}
        aria-label={translate({
          id: 'theme.blog.sidebar.navAriaLabel',
          message: 'Blog recent posts navigation',
          description: 'The ARIA label for recent posts in the blog sidebar',
        })}>
        {tag ? (
          // Scoped to a tag: show the active tag as a cancelable facet. The × clears back
          // to all posts (the blog root), matching the tag-filtered main area.
          <div className={clsx(styles.sidebarItemTitle, 'margin-bottom--md')}>
            <span className={styles.tagFacet}>
              <span className={styles.tagFacetLabel}>{tag}</span>
              <Link
                to="/initiatives"
                className={styles.tagFacetClear}
                aria-label={`Clear the "${tag}" tag filter`}
                title="Show all posts">
                &times;
              </Link>
            </span>
          </div>
        ) : pinned.length > 0 ? (
          <>
            {/* Pinned legends/keystones get their own "Guides" section at the very top; the
                dated posts below keep the "Posts" heading (sidebar.title). */}
            <div className={clsx(styles.sidebarItemTitle, 'margin-bottom--md')}>Guides</div>
            <ListComponent items={pinned} />
            <div className={clsx(styles.sidebarItemTitle, styles.sidebarSectionTitle)}>
              {sidebar.title}
            </div>
          </>
        ) : (
          <div className={clsx(styles.sidebarItemTitle, 'margin-bottom--md')}>{sidebar.title}</div>
        )}
        <BlogSidebarContent
          items={rest}
          ListComponent={ListComponent}
          yearGroupHeadingClassName={styles.yearGroupHeading}
        />
      </nav>
    </aside>
  );
}

export default memo(BlogSidebarDesktop);
