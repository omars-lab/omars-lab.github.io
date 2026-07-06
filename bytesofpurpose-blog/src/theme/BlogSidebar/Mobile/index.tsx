import React, {memo} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import {useVisibleBlogSidebarItems} from '@docusaurus/plugin-content-blog/client';
import {NavbarSecondaryMenuFiller} from '@docusaurus/theme-common';
import BlogSidebarContent from '@theme/BlogSidebar/Content';
import {useLocation} from '@docusaurus/router';
import {useIsBlogDraft, DraftBadge} from '@site/src/theme/DocSidebarItem/draftBadge';
import {useIsBlogDeprecated, DeprecatedBadge} from '@site/src/theme/DocSidebarItem/deprecatedBadge';
import {
  useBlogSidebarLabel,
  usePartitionedBlogItems,
  useTagScopedItems,
} from '@site/src/theme/BlogSidebar/blogSidebarLabel';
import styles from './styles.module.css';

// Swizzled @theme/BlogSidebar/Mobile: mirrors upstream, adding the same dev-only
// "D" draft badge as the Desktop sidebar (see ../Desktop) and the same short
// sidebar_label override. Draft badge is gated to localhost + non-prod; the short
// label ships to prod too.

function SidebarItemLink({item}: {item: {title: string; permalink: string}}) {
  const isDraft = useIsBlogDraft(item.permalink);
  const isDeprecated = useIsBlogDeprecated(item.permalink);
  const label = useBlogSidebarLabel(item.permalink, item.title);
  return (
    <Link
      isNavLink
      to={item.permalink}
      className="menu__link"
      activeClassName="menu__link--active"
      title={item.title}>
      {label}
      {isDraft && <DraftBadge />}
      {isDeprecated && <DeprecatedBadge />}
    </Link>
  );
}

const ListComponent = ({items}: {items: Array<{title: string; permalink: string}>}) => {
  return (
    <ul className="menu__list">
      {items.map((item) => (
        <li key={item.permalink} className="menu__list-item">
          <SidebarItemLink item={item} />
        </li>
      ))}
    </ul>
  );
};

function BlogSidebarMobileSecondaryMenu({sidebar}: any) {
  const allItems = useVisibleBlogSidebarItems(sidebar.items);
  const {pathname} = useLocation();
  const {items, tag} = useTagScopedItems(allItems, pathname);
  const [pinnedRaw, restRaw] = usePartitionedBlogItems(items);
  const pinned = tag ? [] : pinnedRaw;
  const rest = tag ? items : restRaw;
  return (
    <>
      {tag && (
        <div className={clsx('menu__list-item-collapsible', styles.mobileSectionTitle)}>
          Tagged: {tag}{' '}
          <Link to="/initiatives" aria-label={`Clear the "${tag}" tag filter`}>
            &times;
          </Link>
        </div>
      )}
      {pinned.length > 0 && (
        <>
          <div className={clsx('menu__list-item-collapsible', styles.mobileSectionTitle)}>Guides</div>
          <ListComponent items={pinned} />
          <div className={clsx('menu__list-item-collapsible', styles.mobileSectionTitle)}>
            {sidebar.title}
          </div>
        </>
      )}
      <BlogSidebarContent
        items={rest}
        ListComponent={ListComponent}
        yearGroupHeadingClassName={styles.yearGroupHeading}
      />
    </>
  );
}

function BlogSidebarMobile(props: any): React.JSX.Element {
  return (
    <NavbarSecondaryMenuFiller
      component={BlogSidebarMobileSecondaryMenu}
      props={props}
    />
  );
}

export default memo(BlogSidebarMobile);
