import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import {useBlogPost} from '@docusaurus/plugin-content-blog/client';
import ShareButton from '@site/src/components/ShareButton';
import {isLocalhost} from '@site/src/experiments';
import {DraftBadge} from '@site/src/theme/DocSidebarItem/draftBadge';
import styles from './styles.module.css';

// Swizzled @theme/BlogPostItem/Header/Title: re-implements the upstream Title
// and mounts the inline <ShareButton> beside the H1, but ONLY on the blog post
// page (not in the blog list, where the title renders as a linked <h2>).
// Part of the ingress-attribution layer (see src/ingress-attribution-plan.md).
//
// It also renders the same dev-only "D" draft badge used in the Craft/Journey
// docs sidebar — here for the Thoughts (/thoughts) and Designs (/designs) blogs,
// which have no docs sidebar so drafts surface as list cards + the post header.
// Blog posts carry their own frontmatter, so we read frontMatter.draft directly
// (no draft-docs plugin walk needed). Gated to localhost + non-prod exactly like
// the docs badge: draft:true posts are excluded from the production build, so the
// badge only ever has meaning in dev and never leaks to the deployed site.
function useIsDraftPost(frontMatter?: {draft?: boolean}): boolean {
  if (process.env.NODE_ENV === 'production') return false;
  return frontMatter?.draft === true && isLocalhost();
}

export default function BlogPostItemHeaderTitle({
  className,
}: {
  className?: string;
}): React.JSX.Element {
  const {metadata, frontMatter, isBlogPostPage} = useBlogPost();
  const {permalink, title} = metadata;
  const shareDescription =
    (frontMatter?.description as string | undefined) || metadata.description;
  const isDraft = useIsDraftPost(frontMatter);
  const TitleHeading = isBlogPostPage ? 'h1' : 'h2';

  const heading = (
    <TitleHeading className={clsx(styles.title, className)}>
      {isBlogPostPage ? title : <Link to={permalink}>{title}</Link>}
      {isDraft && <DraftBadge />}
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
