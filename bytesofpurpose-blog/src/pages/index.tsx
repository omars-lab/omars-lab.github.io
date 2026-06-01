import React from 'react';
import clsx from 'clsx';
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
            to="/docs/welcome/intro">
            Browse the docs
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home(): JSX.Element {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={siteConfig.title}
      description="Software engineering docs, blog posts, and system designs by Omar Eid — purposeful code, one byte at a time.">
      <HomepageHeader />
      <main>
        <HomepageFeatures />
        <LatestPosts />
      </main>
    </Layout>
  );
}
