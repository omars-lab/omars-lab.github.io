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
    title: 'Browse Engineering Docs',
    image: '/img/artifacts.svg',
    // image: '/img/undraw_docusaurus_mountain.svg',
    description: (
      <>
        Browse all sorts of engineering artifacts, from sequence diagrams, roadmaps, code snippets, 
        app templates, shortcuts, scripts, etc. 
      </>
    ),
    to: "/docs/intro",
    buttonText: "Docs"
  },
  {
    title: 'Browse Blog Posts',
    image: '/img/posts.svg',
    // image: '/img/undraw_docusaurus_tree.svg',
    description: (
      <>
        Browse through some entertaining blog posts, discover what you can do with technology, 
        gain a few ideas, and provide feedback!
      </>
    ),
    to: "/blog",
    buttonText: "Blog"
  },
  {
    title: 'Peak Underneath the Hood',
    image: '/img/engine.svg',
    // image: '/img/undraw_docusaurus_react.svg',
    description: (
      <>
        This site was made leveraging a variety of tools. To learn more about all the gears that are 
        chruning behind the sceens, see here.
      </>
    ),
    to: "/docs/designs/blog-design",
    buttonText: "Blueprint"
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
