import React from 'react';
import clsx from 'clsx';
import {ThemeClassNames} from '@docusaurus/theme-common';
import {isActiveSidebarItem} from '@docusaurus/plugin-content-docs/client';
import Link from '@docusaurus/Link';
import isInternalUrl from '@docusaurus/isInternalUrl';
import IconExternalLink from '@theme/Icon/ExternalLink';
import {useIsDraft, DraftBadge} from '../draftBadge';
import {useIsDeprecated, DeprecatedBadge} from '../deprecatedBadge';
import {useIsPremium, LockBadge} from '../lockBadge';
import {useDocKindEmoji} from '../kindEmoji';
import styles from './styles.module.css';

// Swizzled (forked) DocSidebarItem/Link: identical to the upstream component
// except it (a) prepends a kind emoji for docs that carry a `kind:` (e.g. kind: hub
// -> 🗂️, derived from blog-kinds.json via the draft-docs plugin — see ../kindEmoji),
// and (b) appends a dev/localhost-only "draft" badge for draft docs. See ../draftBadge
// (gated to localhost + non-prod; no-op in production).

// True when a string already begins with an emoji, so we don't double-prefix a label
// a human already emoji'd. Mirrors plugins/draft-docs' startsWithEmoji.
function startsWithEmoji(s: string): boolean {
  return /^\s*[\p{Extended_Pictographic}←-⇿⌀-➿️]/u.test(s);
}
function LinkLabel({label}: {label: string}) {
  return (
    <span title={label} className={styles.linkLabel}>
      {label}
    </span>
  );
}

export default function DocSidebarItemLink({
  item,
  onItemClick,
  activePath,
  level,
  index,
  ...props
}: any): React.JSX.Element {
  const {href, label, className, autoAddBaseUrl} = item;
  const isActive = isActiveSidebarItem(item, activePath);
  const isInternalLink = isInternalUrl(href);
  const isDraft = useIsDraft(href);
  const isDeprecated = useIsDeprecated(href);
  const isPremium = useIsPremium(href);
  // Prepend the doc's kind emoji (e.g. 🗂️ for kind: hub) unless the label already has one.
  const kindEmoji = useDocKindEmoji(href);
  const displayLabel =
    kindEmoji && !startsWithEmoji(label) ? `${kindEmoji} ${label}` : label;
  return (
    <li
      className={clsx(
        ThemeClassNames.docs.docSidebarItemLink,
        ThemeClassNames.docs.docSidebarItemLinkLevel(level),
        'menu__list-item',
        className,
      )}
      key={label}>
      <Link
        className={clsx(
          'menu__link',
          !isInternalLink && styles.menuExternalLink,
          isPremium && styles.premiumLink,
          {
            'menu__link--active': isActive,
          },
        )}
        autoAddBaseUrl={autoAddBaseUrl}
        aria-current={isActive ? 'page' : undefined}
        to={href}
        {...(isInternalLink && {
          onClick: onItemClick ? () => onItemClick(item) : undefined,
        })}
        {...props}>
        <LinkLabel label={displayLabel} />
        {isDraft && <DraftBadge />}
        {isDeprecated && <DeprecatedBadge />}
        {isPremium && <LockBadge />}
        {!isInternalLink && <IconExternalLink />}
      </Link>
    </li>
  );
}
