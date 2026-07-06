import React from 'react';
import Link from '@docusaurus/Link';
import Card from '@site/src/components/Card';
import CardBody from '@site/src/components/Card/CardBody';
import CardFooter from '@site/src/components/Card/CardFooter';
import styles from './RepoPointer.module.css';

/**
 * RepoPointer: a consistent "here's the source repo" pointer card for design posts.
 *
 * Built on the existing Card/CardBody/CardFooter primitives so it inherits the card
 * discipline (surface + hairline + gentle radius, shadow on hover not rest). One card
 * points at ONE repo (optionally a specific path and/or a pinned commit), unlike
 * <RepoCatalog> which lists many repos from a data file.
 *
 * The GitHub glyph is an inline SVG (no external asset) so the card renders offline and
 * under a strict CSP. All spacing/radius/color come from design-system tokens.
 *
 * URL resolution:
 *   - commit + path  → https://github.com/<repo>/tree/<commit>/<path>   (immutable permalink)
 *   - commit only    → https://github.com/<repo>/tree/<commit>
 *   - path only      → https://github.com/<repo>/tree/main/<path>
 *   - neither        → https://github.com/<repo>
 *
 * @example
 *   <RepoPointer
 *     repo="omars-lab/claude-plugin-marketplace"
 *     path="plugins/local-guide"
 *     blurb="A no-API-key Claude Code plugin over public civic data." />
 */

interface RepoPointerProps {
  /** GitHub "owner/name", e.g. "omars-lab/claude-plugin-marketplace". */
  repo: string;
  /** Optional path within the repo, e.g. "plugins/local-guide". */
  path?: string;
  /** Optional commit SHA (or tag) to pin an immutable permalink. Defaults to "main". */
  commit?: string;
  /** Optional branch to use when no commit is pinned. Defaults to "main". */
  branch?: string;
  /** One-line description of what the repo/path is. */
  blurb?: string;
  /** Override the footer link label. Defaults to "View on GitHub". */
  label?: string;
}

function buildUrl(repo: string, path?: string, commit?: string, branch?: string): string {
  const base = `https://github.com/${repo}`;
  const ref = commit || branch || 'main';
  if (path) {
    return `${base}/tree/${ref}/${path}`;
  }
  if (commit) {
    return `${base}/tree/${commit}`;
  }
  return base;
}

// Inline octocat mark: GitHub's own "mark-github" path (MIT-licensed Octicons).
function GitHubGlyph(): React.JSX.Element {
  return (
    <svg
      className={styles.glyph}
      viewBox="0 0 16 16"
      width="22"
      height="22"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="currentColor"
        d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8Z"
      />
    </svg>
  );
}

export default function RepoPointer({
  repo,
  path,
  commit,
  branch,
  blurb,
  label = 'View on GitHub',
}: RepoPointerProps): React.JSX.Element {
  const url = buildUrl(repo, path, commit, branch);
  const pinned = Boolean(commit);

  return (
    <Card className={styles.card}>
      <CardBody>
        <div className={styles.head}>
          <GitHubGlyph />
          <div className={styles.ids}>
            <Link className={styles.repo} to={url}>
              {repo}
            </Link>
            {path && <span className={styles.path}>{path}</span>}
          </div>
          {pinned && <span className={styles.pin}>@{commit!.slice(0, 7)}</span>}
        </div>
        {blurb && <p className={styles.blurb}>{blurb}</p>}
      </CardBody>
      <CardFooter>
        <Link className={styles.cta} to={url}>
          {label} <span aria-hidden="true">→</span>
        </Link>
      </CardFooter>
    </Card>
  );
}
