/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import styles from './HomepageFeatures.module.css';

type FeatureItem = {
  title: string;
  image: string;
  to: string;
  buttonText: string;
  description: React.JSX.Element;
};

const FeatureList: FeatureItem[] = [
  {
    // The title is what gets ingested into SEO ...
    title: 'Software Engineering Docs',
    image: '/img/artifacts.svg',
    // image: '/img/undraw_docusaurus_mountain.svg',
    description: (
      <>
        Explore real world engineering artifacts. Examples include sequence diagrams, roadmaps, code snippets, 
        automations, scripts, etc. 
      </>
    ),
    to: "/craft",
    buttonText: "Docs"
  },
  {
    title: 'Software Blog Posts',
    image: '/img/posts.svg',
    // image: '/img/undraw_docusaurus_tree.svg',
    description: (
      <>
        Browse through some entertaining blog posts, discover what you can do with technology, 
        gain a few ideas, and provide feedback!
      </>
    ),
    to: "/blog",
    buttonText: "Blog Posts"
  },
  {
    title: 'System Designs and Architecture',
    image: '/img/engine.svg',
    // image: '/img/undraw_docusaurus_react.svg',
    description: (
      <>
        Peak underneath the hood and browse various designs including agentic system design, 
        the design for this very site, and more! 
      </>
    ),
    to: "/designs",
    buttonText: "Designs"
  },
];

function Feature({title, image, description, to, buttonText}: FeatureItem) {
  return (
    <div className={clsx('col col--4', styles.featureCol)}>
      <Link to={to} className={styles.featureCard}>
        <div className={styles.featureIconWrap}>
          <img className={styles.featureSvg} alt="" aria-hidden="true" src={image} />
        </div>
        <h3 className={styles.featureTitle}>{title}</h3>
        <p className={styles.featureDescription}>{description}</p>
        <span className={clsx('button button--primary button--lg', styles.featureButton)}>
          {buttonText}
        </span>
      </Link>
    </div>
  );
}

export default function HomepageFeatures(): React.JSX.Element {
  return (
    <section className={styles.features}>
      <div className="container">
        {/* h2 keeps the heading order h1 (hero) -> h2 -> h3 (feature titles). */}
        <h2 className={styles.featuresHeading}>Explore the site</h2>
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}

