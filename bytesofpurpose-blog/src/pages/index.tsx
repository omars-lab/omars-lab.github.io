import React from 'react';
import clsx from 'clsx';
import Head from '@docusaurus/Head';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styles from './index.module.css';
import HomepageFeatures from '../components/HomepageFeatures';
import LatestPosts from '../components/LatestPosts';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={styles.heroBanner}>
      <div className="container">
        <h1 className={styles.heroTitle}>{siteConfig.title}</h1>
        <p className={styles.heroSubtitle}>{siteConfig.tagline}</p>
        {/* Four-card chooser (folded in from the old /welcome page): Craft = what I
            impact (the outward work, shared); Self = who I am (the inward journey);
            Thoughts = what I'm thinking lately (the blog); Mindset = the quotes that
            move me. Each card leads with an arched illustration, then title + body. */}
        <div className={styles.chooser}>
          <Link className={styles.chooserCard} to="/craft">
            <div className={styles.chooserCardImageWrap}>
              <img
                className={styles.chooserCardImage}
                src={useBaseUrl('/img/cards/craft.png')}
                alt="Omar at his desk, headphones on, writing code"
                loading="lazy"
                width={400}
                height={400}
              />
            </div>
            <div className={styles.chooserCardTitle}>💻 Discover My Craft</div>
            <p className={styles.chooserCardBody}>What I build, and share.</p>
          </Link>
          <Link className={styles.chooserCard} to="/self">
            <div className={styles.chooserCardImageWrap}>
              <img
                className={styles.chooserCardImage}
                src={useBaseUrl('/img/cards/self.png')}
                alt="Omar standing in prayer on a rug at home"
                loading="lazy"
                width={400}
                height={400}
              />
            </div>
            <div className={styles.chooserCardTitle}>🪞 Discover My Journey</div>
            <p className={styles.chooserCardBody}>Who I'm becoming.</p>
          </Link>
          <Link className={styles.chooserCard} to="/blog">
            <div className={styles.chooserCardImageWrap}>
              <img
                className={styles.chooserCardImage}
                src={useBaseUrl('/img/cards/thinking.png')}
                alt="Omar in thought, hand to his chin"
                loading="lazy"
                width={400}
                height={400}
              />
            </div>
            <div className={styles.chooserCardTitle}>💭 Browse My Thoughts</div>
            <p className={styles.chooserCardBody}>What I'm thinking about lately.</p>
          </Link>
          <Link className={styles.chooserCard} to="/mindset">
            <div className={styles.chooserCardImageWrap}>
              <img
                className={styles.chooserCardImage}
                src={useBaseUrl('/img/cards/mindset.png')}
                alt="Omar conducting an orchestra from the podium"
                loading="lazy"
                width={400}
                height={400}
              />
            </div>
            <div className={styles.chooserCardTitle}>🧠 Explore My Mindset</div>
            <p className={styles.chooserCardBody}>The quotes that move me.</p>
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home(): React.JSX.Element {
  const {siteConfig} = useDocusaurusContext();
  const {url, title, tagline} = siteConfig;

  // WebSite + Organization JSON-LD for richer SERP results. Blog posts get their
  // own BlogPosting JSON-LD automatically from the Docusaurus blog plugin, so we
  // only add site-level structured data here on the homepage.
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${url}/#website`,
        url: `${url}/`,
        name: title,
        description: tagline,
        publisher: {'@id': `${url}/#organization`},
      },
      {
        '@type': 'Organization',
        '@id': `${url}/#organization`,
        name: title,
        url: `${url}/`,
        logo: `${url}/img/logo.svg`,
        founder: {'@type': 'Person', name: 'Omar Eid'},
        sameAs: [
          'https://github.com/omars-lab',
          'https://www.linkedin.com/in/oeid/',
        ],
      },
    ],
  };

  return (
    <Layout
      description="Software engineering docs, blog posts, and system designs by Omar Eid: purposeful code, one byte at a time.">
      {/* Raw <title> overrides Docusaurus' templated "<title> | <siteTitle>" so
          the homepage browser tab reads exactly "Omars Blog". */}
      <Head>
        <title>Omars Blog</title>
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Head>
      <HomepageHeader />
      <main>
        <HomepageFeatures />
        <LatestPosts />
      </main>
    </Layout>
  );
}
