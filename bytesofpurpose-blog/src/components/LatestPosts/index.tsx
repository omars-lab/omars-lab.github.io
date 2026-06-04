import React from 'react';
import Link from '@docusaurus/Link';
import {useAllPluginInstancesData} from '@docusaurus/useGlobalData';
import styles from './LatestPosts.module.css';

type RecentPost = {
  title: string;
  description: string;
  date: string;
  permalink: string;
  tags: string[];
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}

export default function LatestPosts(): React.JSX.Element | null {
  // Global data set by plugins/recent-posts at build time.
  const data = useAllPluginInstancesData('recent-posts-plugin') as
    | {default?: {posts?: RecentPost[]}}
    | undefined;
  const posts = data?.default?.posts ?? [];

  if (posts.length === 0) {
    return null;
  }

  return (
    <section className={styles.latest}>
      <div className="container">
        <div className={styles.header}>
          <h2 className={styles.heading}>Latest from the blog</h2>
          <Link to="/thoughts" className={styles.viewAll}>
            View all posts →
          </Link>
        </div>
        <div className="row">
          {posts.map((post) => (
            <div className="col col--4" key={post.permalink}>
              <Link to={post.permalink} className={styles.postCard}>
                <time className={styles.postDate} dateTime={post.date}>
                  {formatDate(post.date)}
                </time>
                <h3 className={styles.postTitle}>{post.title}</h3>
                {post.description && (
                  <p className={styles.postDescription}>{post.description}</p>
                )}
                {post.tags.length > 0 && (
                  <div className={styles.postTags}>
                    {post.tags.slice(0, 3).map((tag) => (
                      <span className={styles.postTag} key={tag}>
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
