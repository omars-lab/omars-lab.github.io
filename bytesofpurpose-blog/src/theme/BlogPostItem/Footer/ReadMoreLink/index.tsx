import React from 'react';
import Link from '@docusaurus/Link';
import type {Props} from '@theme/BlogPostItem/Footer/ReadMoreLink';

/**
 * Swizzled "Read more" link (wrap of the classic theme component).
 *
 * Why: Lighthouse's SEO `link-text` audit flags generic visible text like
 * "Read more" as non-descriptive, and it evaluates the link's *text content*,
 * ignoring `aria-label`. So the stock component (which only sets an aria-label)
 * scores 0 on /blog.
 *
 * Fix: make the link's accessible text descriptive, "Read more about <title>",
 * but visually clip the "<title>" part with the `.sr-only`-style span so the
 * eye still reads just "Read more →". This satisfies both crawlers/Lighthouse
 * and screen-reader users with one DOM string (no redundant aria-label).
 */
export default function BlogPostItemFooterReadMoreLink(props: Props): React.JSX.Element {
  const {blogPostTitle, ...linkProps} = props;
  return (
    <Link {...linkProps}>
      <b>
        Read more
        {blogPostTitle ? (
          <span className="readMoreVisuallyHidden"> about {blogPostTitle}</span>
        ) : null}
        <span aria-hidden="true"> →</span>
      </b>
    </Link>
  );
}
