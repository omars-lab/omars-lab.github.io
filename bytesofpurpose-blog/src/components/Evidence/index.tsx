import React from 'react';
import repoManifest from '@site/src/data/evidence-repos.json';
import styles from './styles.module.css';

// <Evidence>: footnote-grade source citation that points at a GitHub permalink
// (pinned commit SHA + line range) in one of the sibling source repos
// (qiyas / bikar / sacred-patterns).
//
// THE PRIVACY RULE (load-bearing): a clickable permalink renders ONLY when it
// would actually resolve for the viewer —
//   • the repo is PUBLIC (per src/data/evidence-repos.json), OR
//   • we are in DEV / localhost (it's just the author, behind their own GitHub auth).
// In the PROD build, a PRIVATE repo degrades to prose-only — "repo · path Lx-Ly · note"
// — so the public site never ships a 404 and never leaks an internal path/SHA.
//
// Offline-validated by scripts/validate-footnotes.js: every repo here must exist
// in the manifest, the SHA must be a real pushed commit in the local sibling repo,
// the path must exist at that SHA, and the line range must be within file bounds.
//
// Usage (inside a GFM footnote definition):
//   [^ari]: <Evidence repo="sacred-patterns" sha="746bed6"
//     path="docs/retrospectives/2026-06-06-image-to-dsl-retrospective.md"
//     lines="64-72" note="the ARI=1.0 result on the 12-pattern I1 corpus" />

type EvidenceProps = {
  repo: string;
  sha: string;
  path: string;
  /** "104-114" (range) or "42" (single line). Optional — omit to link the whole file. */
  lines?: string;
  /** Plain-English statement of what these lines justify. Shown in BOTH link and prose forms. */
  note: string;
};

type RepoMeta = {owner: string; name: string; public: boolean; localPath: string};

const REPOS = (repoManifest as {repos: Record<string, RepoMeta>}).repos;

// Parse "104-114" → {start:104,end:114}; "42" → {start:42,end:42}; "" → null.
function parseLines(lines?: string): {start: number; end: number} | null {
  if (!lines) return null;
  const m = String(lines).trim().match(/^(\d+)(?:-(\d+))?$/);
  if (!m) return null;
  const start = parseInt(m[1], 10);
  const end = m[2] ? parseInt(m[2], 10) : start;
  return {start, end};
}

function permalink(meta: RepoMeta, sha: string, path: string, lines?: string): string {
  const range = parseLines(lines);
  const frag = range ? (range.start === range.end ? `#L${range.start}` : `#L${range.start}-L${range.end}`) : '';
  return `https://github.com/${meta.owner}/${meta.name}/blob/${sha}/${path}${frag}`;
}

// "docs/.../2026-05-29-f2-face-class-is-wrong-retrieval-label.md" → the basename, for compact prose.
function basename(path: string): string {
  const parts = path.split('/');
  return parts[parts.length - 1] || path;
}

function lineLabel(lines?: string): string {
  const range = parseLines(lines);
  if (!range) return '';
  return range.start === range.end ? ` L${range.start}` : ` L${range.start}–L${range.end}`;
}

export default function Evidence({repo, sha, path, lines, note}: EvidenceProps): React.JSX.Element {
  const meta = REPOS[repo];

  // Unknown repo: fail visible, not silent — surfaces in dev + the validator catches it.
  if (!meta) {
    return (
      <span className={styles.broken}>
        ⚠ Evidence: unknown repo <code>{repo}</code> (not in evidence-repos.json): {note}
      </span>
    );
  }

  // Dev/localhost OR public repo → render the clickable permalink.
  // process.env.NODE_ENV is inlined by webpack at build time, so prod private repos
  // never even ship the href in the bundle.
  const isDev = process.env.NODE_ENV !== 'production';
  const mayLink = isDev || meta.public;

  const prose = (
    <>
      <code>{repo}</code> · <code>{basename(path)}</code>
      {lineLabel(lines)} · {note}
    </>
  );

  if (mayLink) {
    return (
      <span className={styles.evidence}>
        Evidence:{' '}
        <a href={permalink(meta, sha, path, lines)} target="_blank" rel="noopener noreferrer">
          {prose}
        </a>
        {!meta.public && isDev ? <span className={styles.devOnly} title="Private repo: this link renders only in dev"> (dev-only)</span> : null}
      </span>
    );
  }

  // Prod + private → prose only. No href, no 404, no leaked SHA/path beyond the basename.
  return <span className={styles.evidence}>Evidence: {prose}</span>;
}
