import React from 'react';
import clsx from 'clsx';
import Head from '@docusaurus/Head';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
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
        <div className={styles.buttons}>
          <Link className="button button--primary button--lg" to="/blog">
            Read the blog
          </Link>
          <Link
            className="button button--secondary button--lg"
            to="/welcome">
            Browse the docs
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
      description="Software engineering docs, blog posts, and system designs by Omar Eid — purposeful code, one byte at a time.">
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
