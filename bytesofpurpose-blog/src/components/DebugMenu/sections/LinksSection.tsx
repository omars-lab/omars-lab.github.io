import React from 'react';
import type {DebugSection} from '../types';
import styles from '../styles.module.css';

// A quick debugging launchpad: external dashboards we hop to often while
// developing/operating the site. Append to LINKS to add another — the body just
// maps each entry to an external anchor. Dev-only (the whole DebugMenu is
// double-gated), so these admin URLs never reach the deployed bundle.

const LINKS: ReadonlyArray<{label: string; href: string}> = [
  {
    label: 'PostHog · internal-user filtering',
    href: 'https://us.posthog.com/project/448205/settings/project-product-analytics#internal-user-filtering',
  },
  {
    label: 'GitHub Actions',
    href: 'https://github.com/omars-lab/omars-lab.github.io/actions',
  },
  {
    label: 'GA4 · Intelligent Home',
    href: 'https://analytics.google.com/analytics/web/#/a195952157p286298793/reports/intelligenthome',
  },
];

function LinksBody(): React.JSX.Element {
  return (
    <div className={styles.links}>
      {LINKS.map((link) => (
        <a
          key={link.href}
          className={styles.link}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer">
          {link.label}
        </a>
      ))}
    </div>
  );
}

export const linksSection: DebugSection = {
  id: 'links',
  title: 'Links',
  render: () => <LinksBody />,
};
