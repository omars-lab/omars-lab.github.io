import React, {memo} from 'react';
import Link from '@docusaurus/Link';
import {useVisibleBlogSidebarItems} from '@docusaurus/plugin-content-blog/client';
import {NavbarSecondaryMenuFiller} from '@docusaurus/theme-common';
import BlogSidebarContent from '@theme/BlogSidebar/Content';
import {useIsBlogDraft, DraftBadge} from '@site/src/theme/DocSidebarItem/draftBadge';
import styles from './styles.module.css';

// Swizzled @theme/BlogSidebar/Mobile: mirrors upstream, adding the same dev-only
// "D" draft badge as the Desktop sidebar (see ../Desktop). Gated to localhost +
// non-prod; no-op in production.

function SidebarItemLink({item}: {item: {title: string; permalink: string}}) {
  const isDraft = useIsBlogDraft(item.permalink);
  return (
    <Link
      isNavLink
      to={item.permalink}
      className="menu__link"
      activeClassName="menu__link--active">
      {item.title}
      {isDraft && <DraftBadge />}
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
  const items = useVisibleBlogSidebarItems(sidebar.items);
  return (
    <BlogSidebarContent
      items={items}
      ListComponent={ListComponent}
      yearGroupHeadingClassName={styles.yearGroupHeading}
    />
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
