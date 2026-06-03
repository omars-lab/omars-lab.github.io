import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import {useBlogPost} from '@docusaurus/plugin-content-blog/client';
import ShareButton from '@site/src/components/ShareButton';
import styles from './styles.module.css';

// Swizzled @theme/BlogPostItem/Header/Title: re-implements the upstream Title
// and mounts the inline <ShareButton> beside the H1, but ONLY on the blog post
// page (not in the blog list, where the title renders as a linked <h2>).
// Part of the ingress-attribution layer (see src/ingress-attribution-plan.md).
export default function BlogPostItemHeaderTitle({
  className,
}: {
  className?: string;
}): React.JSX.Element {
  const {metadata, frontMatter, isBlogPostPage} = useBlogPost();
  const {permalink, title} = metadata;
  const shareDescription =
    (frontMatter?.description as string | undefined) || metadata.description;
  const TitleHeading = isBlogPostPage ? 'h1' : 'h2';

  const heading = (
    <TitleHeading className={clsx(styles.title, className)}>
      {isBlogPostPage ? title : <Link to={permalink}>{title}</Link>}
    </TitleHeading>
  );

  if (!isBlogPostPage) {
    return heading;
  }

  return (
    <div className={styles.titleRow}>
      {heading}
      <ShareButton surface="blog-title" title={title} description={shareDescription} />
    </div>
  );
}
