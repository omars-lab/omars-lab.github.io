import React, {memo} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import {translate} from '@docusaurus/Translate';
import {useVisibleBlogSidebarItems} from '@docusaurus/plugin-content-blog/client';
import BlogSidebarContent from '@theme/BlogSidebar/Content';
import {useIsBlogDraft, DraftBadge} from '@site/src/theme/DocSidebarItem/draftBadge';
import {useBlogSidebarLabel} from '@site/src/theme/BlogSidebar/blogSidebarLabel';
import styles from './styles.module.css';

// Swizzled @theme/BlogSidebar/Desktop: identical to upstream, except the post
// list renders the dev/localhost-only "D" draft badge next to draft posts — the
// same badge used in the Craft/Journey docs sidebar, now on the Thoughts and
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
  const items = useVisibleBlogSidebarItems(sidebar.items);
  return (
    <aside className="col col--3">
      <nav
        className={clsx(styles.sidebar, 'thin-scrollbar')}
        aria-label={translate({
          id: 'theme.blog.sidebar.navAriaLabel',
          message: 'Blog recent posts navigation',
          description: 'The ARIA label for recent posts in the blog sidebar',
        })}>
        <div className={clsx(styles.sidebarItemTitle, 'margin-bottom--md')}>
          {sidebar.title}
        </div>
        <BlogSidebarContent
          items={items}
          ListComponent={ListComponent}
          yearGroupHeadingClassName={styles.yearGroupHeading}
        />
      </nav>
    </aside>
  );
}

export default memo(BlogSidebarDesktop);
