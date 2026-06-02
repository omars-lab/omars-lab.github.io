import React, { useEffect } from 'react';
import posthog from 'posthog-js';
// @ts-ignore - Docusaurus theme module
import Layout from '@theme/Layout';
import useBaseUrl from '@docusaurus/useBaseUrl';
import CoffeeButton from '@site/src/components/Support/CoffeeButton';
import styles from './support.module.css';

// The Shopify store. When this is a real URL the Shopify card renders (see the
// channels filter below); a '#' placeholder would be omitted so we never ship a
// CTA that opens a blank tab.
// Typed as `string` (not the literal) so the `!== '#'` placeholder guard below
// stays meaningful — if this is ever reset to '#', the card is omitted again.
const SHOPIFY_STORE_URL: string = 'https://bytesofpurpose.myshopify.com/';

const GITHUB_URL = 'https://github.com/omars-lab';
const LINKEDIN_URL = 'https://www.linkedin.com/in/oeid/';

type Channel = {
  key: string;
  icon: string;
  title: string;
  blurb: string;
  href: string;
  cta: string;
  external?: boolean;
};

export default function SupportPage(): React.JSX.Element {
  const headshot = useBaseUrl('/img/headshot.png');

  useEffect(() => {
    posthog.capture('support page viewed');
  }, []);

  const track = (channel: string) =>
    posthog.capture('support channel clicked', {
      channel,
      page_path:
        typeof window !== 'undefined' ? window.location.pathname : '/support',
    });

  const channels: Channel[] = [
    // Shopify card is only shown once SHOPIFY_STORE_URL is a real link — a '#'
    // placeholder would render a "Visit the store" CTA that opens a blank tab.
    ...(SHOPIFY_STORE_URL !== '#'
      ? [
          {
            key: 'shopify',
            icon: '🛍️',
            title: 'Check out my Shopify store',
            blurb:
              "I design and sell things I'd want to own myself — grabbing something is a real, tangible way to support the work here.",
            href: SHOPIFY_STORE_URL,
            cta: 'Visit the store',
            external: true,
          },
        ]
      : []),
    {
      key: 'github',
      icon: '⭐',
      title: 'Follow me on GitHub',
      blurb:
        'Star a repo, follow along, or open a thoughtful issue. Engagement on the code keeps me building in the open.',
      href: GITHUB_URL,
      cta: 'Follow on GitHub',
      external: true,
    },
    {
      key: 'linkedin',
      icon: '🤝',
      title: 'Connect on LinkedIn',
      blurb:
        "Let's stay in touch — connect, share a post, or reach out about working together.",
      href: LINKEDIN_URL,
      cta: 'Connect on LinkedIn',
      external: true,
    },
  ];

  return (
    <Layout
      title="Support"
      description="Ways to support my work — visit my Shopify store, follow on GitHub or LinkedIn, or buy me a coffee."
      noFooter={false}
    >
      <div className={`container margin-vert--lg ${styles.page}`}>
        <div className={styles.hero}>
          <img
            className={styles.headshot}
            src={headshot}
            alt="Omar Eid — headshot"
            width={160}
            height={160}
          />
          <div className={styles.heroText}>
            <h1>Support my work</h1>
            <p>
              Hi, I'm Omar. I write here about software, problem-solving, and
              building things in the open — and I run almost entirely on coffee
              ☕. If anything here helped you, here are a few ways to say thanks.
              No pressure, every one of them genuinely means a lot.
            </p>
          </div>
        </div>

        <div className={styles.channelGrid}>
          {channels.map((c) => (
            <a
              key={c.key}
              className={styles.channelCard}
              href={c.href}
              target={c.external ? '_blank' : undefined}
              rel={c.external ? 'noopener noreferrer' : undefined}
              onClick={() => track(c.key)}
            >
              <span className={styles.channelIcon} aria-hidden="true">
                {c.icon}
              </span>
              <span className={styles.channelTitle}>{c.title}</span>
              <span className={styles.channelBlurb}>{c.blurb}</span>
              <span className={styles.channelCta}>{c.cta} →</span>
            </a>
          ))}

          {/* The coffee CTA is a card in the same grid as the channels — but a
              <div> (not an <a>), since its action is the CoffeeButton (wired to
              the support-button-copy A/B experiment), not a single link. */}
          <div className={styles.channelCard}>
            <span className={styles.channelIcon} aria-hidden="true">
              ☕
            </span>
            <span className={styles.channelTitle}>…or buy me a coffee</span>
            <span className={styles.channelBlurb}>
              I'm only half-joking about the coffee — it's the fuel behind every
              late-night post and side project. A small tip keeps the pot full
              and the writing coming.
            </span>
            <div className={styles.coffeeCta}>
              <CoffeeButton linkClassName={styles.channelCta} />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
