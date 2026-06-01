import React from 'react';
import clsx from 'clsx';
import {ThemeClassNames} from '@docusaurus/theme-common';
import {useDoc} from '@docusaurus/plugin-content-docs/client';
import Heading from '@theme/Heading';
import MDXContent from '@theme/MDXContent';
import ShareButton from '@site/src/components/ShareButton';

// Swizzled @theme/DocItem/Content — re-implements the upstream component (which
// only renders a synthetic <h1> + the MDX body) and additionally mounts the
// inline <ShareButton> next to the doc title. Part of the ingress-attribution
// layer (see src/ingress-attribution-plan.md).
//
// Upstream renders a "synthetic title" only when the page has no top-level h1 in
// its markdown and front matter doesn't hide it. To show the share control on
// EVERY doc — including those whose h1 comes from the markdown content — we
// render the control in its own header row that is always present.

function useSyntheticTitle(): string | null {
  const {metadata, frontMatter, contentTitle} = useDoc();
  const shouldRender =
    !frontMatter.hide_title && typeof contentTitle === 'undefined';
  if (!shouldRender) {
    return null;
  }
  return metadata.title;
}

export default function DocItemContent({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const syntheticTitle = useSyntheticTitle();
  // Title + summary for the share message (frontmatter description, else doc desc).
  const {metadata, frontMatter} = useDoc();
  const shareTitle = metadata.title;
  const shareDescription =
    (frontMatter.description as string | undefined) || metadata.description;
  return (
    <div className={clsx(ThemeClassNames.docs.docMarkdown, 'markdown')}>
      {syntheticTitle ? (
        // Synthetic title: keep the exact <Heading as="h1"> (preserves TOC/anchor)
        // and place the share control inline beside it.
        <header
          style={{display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap'}}>
          <Heading as="h1">{syntheticTitle}</Heading>
          <ShareButton surface="doc-title" title={shareTitle} description={shareDescription} />
        </header>
      ) : (
        // Content-supplied h1 lives inside MDXContent; render the control above it.
        <div style={{display: 'flex', justifyContent: 'flex-end', marginBottom: '-0.5rem'}}>
          <ShareButton surface="doc-title" title={shareTitle} description={shareDescription} />
        </div>
      )}
      <MDXContent>{children}</MDXContent>
    </div>
  );
}
