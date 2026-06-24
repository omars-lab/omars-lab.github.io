import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import {useBlogPost} from '@docusaurus/plugin-content-blog/client';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import ShareButton from '@site/src/components/ShareButton';
import {isLocalhost} from '@site/src/experiments';
import {DraftBadge} from '@site/src/theme/DocSidebarItem/draftBadge';
import styles from './styles.module.css';

// Build a vscode://file/<abs-path> URI from the post's aliased source path
// (e.g. "@site/designs/2026-06-22-foo.mdx") + the dev-only absolute site dir.
// Returns null unless both are present (so prod, where siteDirDev is empty,
// yields no link). The path is URL-encoded per segment so spaces etc. survive.
function vscodeUriForSource(
  source: string | undefined,
  siteDir: string | undefined,
): string | null {
  if (!source || !siteDir) return null;
  const rel = source.replace(/^@site\//, '');
  const abs = `${siteDir.replace(/\/$/, '')}/${rel}`;
  const encoded = abs.split('/').map(encodeURIComponent).join('/');
  return `vscode://file/${encoded}`;
}

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
  const {siteConfig} = useDocusaurusContext();
  const {permalink, title} = metadata;
  const shareDescription =
    (frontMatter?.description as string | undefined) || metadata.description;
  const isDraft = useIsDraftPost(frontMatter);
  const TitleHeading = isBlogPostPage ? 'h1' : 'h2';

  // Dev-only: when a post is a draft, make its "D" badge a link that opens the
  // source file in VS Code (vscode://file/<abs-path>). Only renders when a draft
  // (so already localhost + non-prod) AND siteDirDev is set (empty in prod).
  const vscodeUri = isDraft
    ? vscodeUriForSource(
        (metadata as {source?: string}).source,
        siteConfig.customFields?.siteDirDev as string | undefined,
      )
    : null;

  const badge = isDraft ? (
    vscodeUri ? (
      <a
        href={vscodeUri}
        className={styles.draftEditLink}
        title="Open this draft's source in VS Code"
        aria-label="Open draft source in VS Code"
        onClick={(e) => e.stopPropagation()}>
        <DraftBadge />
      </a>
    ) : (
      <DraftBadge />
    )
  ) : null;

  const heading = (
    <TitleHeading className={clsx(styles.title, className)}>
      {isBlogPostPage ? title : <Link to={permalink}>{title}</Link>}
      {badge}
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
