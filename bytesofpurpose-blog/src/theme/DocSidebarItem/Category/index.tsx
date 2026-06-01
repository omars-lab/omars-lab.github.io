import React from 'react';
import Category from '@theme-original/DocSidebarItem/Category';
import {useIsDraft} from '../draftBadge';
import styles from './styles.module.css';

// Swizzled (wrapper) DocSidebarItem/Category — delegates entirely to the
// upstream component (keeps its collapse/link behavior) and, on localhost in a
// dev build, marks the wrapper when the category's own index page is a draft.
// A CSS ::after then appends a "draft" pill to the category label. No-op in
// production (useIsDraft returns false). See ../draftBadge + plugins/draft-docs.
export default function DocSidebarItemCategory(props: any): JSX.Element {
  const href = props?.item?.href;
  const isDraft = useIsDraft(href);
  if (!isDraft) return <Category {...props} />;
  return (
    <div className={styles.draftCategory} data-draft="true">
      <Category {...props} />
    </div>
  );
}
