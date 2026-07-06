import React from 'react';
import clsx from 'clsx';
import {blogPostContainerID} from '@docusaurus/utils-common';
import {useBlogPost} from '@docusaurus/plugin-content-blog/client';
import MDXContent from '@theme/MDXContent';
import PostQuestions from '@site/src/components/PostQuestions';

// Swizzled @theme/BlogPostItem/Content: re-implements the upstream component
// (which just wraps the MDX body) and additionally renders the "Questions this
// post answers" box from the post's `questions:` frontmatter, ABOVE the body,
// on the full post page only (not on blog list cards, where isBlogPostPage is
// false). See src/components/PostQuestions.
export default function BlogPostItemContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}): React.JSX.Element {
  const {isBlogPostPage, frontMatter} = useBlogPost();
  return (
    <div
      // This ID is used for the feed generation to locate the main content.
      id={isBlogPostPage ? blogPostContainerID : undefined}
      className={clsx('markdown', className)}>
      {isBlogPostPage && (
        <PostQuestions questions={(frontMatter as {questions?: unknown}).questions} />
      )}
      <MDXContent>{children}</MDXContent>
    </div>
  );
}
