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
  description: JSX.Element;
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
    to: "/docs/welcome/intro",
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
        Peak underneath the hood and browse various designs including the design for this very site. 
      </>
    ),
    to: "/designs/blog-design",
    buttonText: "Designs"
  },
];

function Feature({title, image, description, to, buttonText}: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <img className={styles.featureSvg} alt={title} src={image} />
      </div>
      <div className="text--center padding-horiz--md">
        <h3>{title}</h3>
        <p>{description}</p>
        <Link
            className="button button--secondary button--lg"
            to={to}>
            {buttonText}
          </Link>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): JSX.Element {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
