import React, { CSSProperties } from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';
import { parseMindmap } from './parser';
import { computeMindLayout, type MindLayout, type MindDensity, MIND } from './layout';
import { nodeRadius, nodeStrokeWidth, connectorStrokeWidth, type MindStyle } from './render';

/**
 * MindMap : a themed mind-map rendered as one inline SVG from Mermaid mindmap
 * text. The author writes ordinary mermaid mindmap syntax
 * (https://mermaid.js.org/syntax/mindmap.html) as the component's children, so
 * the same text renders on mermaid.live too. On top of that we add real clickable
 * nodes : write a node's label as a markdown link `[Text](#anchor)` (a same-page
 * heading) or `[Text](/blog/slug#anchor)` (another page) and that node renders as
 * an <a>. Mermaid's own mindmap renderer can do neither links
 * (mermaid-js/mermaid#4099) nor reliable theming (mermaid-js/mermaid#5156), which
 * is why this component parses and lays the diagram out itself (same approach as
 * FlowDiagram).
 *
 * Two visual styles via `theme`: 'mindnode' (default) is Apple MindNode's look
 * (cream canvas, white rounded nodes, dark-brown border, pale-olive connectors);
 * 'blog' aliases the site's design tokens (brand green + tea pastels, the page
 * surfaces) so the map matches the rest of the blog. BOTH respect light/dark mode
 * automatically. A node can carry an accent tint with a mermaid `:::name` class
 * (green/mint/pink/blue/amber/violet). `density="compact"` tightens spacing for
 * large maps. `className`/`style` pass through to the figure, so a post can
 * override any `--bopmind-*` token inline. Malformed mindmap text throws at render
 * time, which fails the SSG build : an unreadable diagram does not ship.
 *
 * Usage in MDX (children are a template literal so `#` and parens survive MDX):
 *
 *   <MindMap title="Orchestrating Roles" theme="blog">{`
 *   mindmap
 *     root((Orchestrating Roles))
 *       [The Starter](#the-starter) ::: green
 *       [The Executor](#the-executor)
 *       [The Finisher](/blog/other-post#finisher)
 *   `}</MindMap>
 */
export interface MindMapProps {
  /** Accessible title (SVG <title>) and salt for unique ids. Required. */
  title: string;
  /** The mermaid mindmap text. Pass as children (template literal) or `chart`. */
  children?: string;
  chart?: string;
  /** Optional caption under the figure. */
  caption?: string;
  /** 'ltr' (default) grows rightward; 'spread' centers the root, two-sided (MindNode look). */
  layout?: MindLayout;
  /** 'mindnode' (default, cream/brown) or 'blog' (the site's green/tea design tokens). */
  theme?: MindStyle;
  /** 'comfortable' (default) or 'compact' (tighter spacing for large maps). */
  density?: MindDensity;
  className?: string;
  style?: CSSProperties;
}

const MindMap: React.FC<MindMapProps> = ({
  title,
  children,
  chart,
  caption,
  layout = 'ltr',
  theme = 'mindnode',
  density = 'comfortable',
  className,
  style,
}) => {
  const source = (chart ?? children ?? '').toString();
  // parseMindmap / computeMindLayout throw on malformed input : that fails the
  // SSG build, the intended blocking gate (an unreadable diagram does not ship).
  const { root } = parseMindmap(source);
  const model = computeMindLayout(root, title, layout, density);

  const { salt, svgW, svgH, nodes, connectors } = model;
  const titleId = `${salt}-mind-title`;

  return (
    <figure
      className={clsx(styles.mind, theme === 'blog' && styles.themeBlog, className)}
      style={style}
    >
      <div className={styles.scroll}>
        <svg
          viewBox={`0 0 ${svgW} ${svgH}`}
          role="img"
          aria-labelledby={titleId}
          preserveAspectRatio="xMidYMid meet"
          className={styles.canvas}
        >
          <title id={titleId}>{title}</title>

          <g className={styles.connectorsG}>
            {connectors.map((c, i) => (
              <g key={i} className={styles.connectorG}>
                {/* Wide, invisible hit-area so the thin connector is easy to
                    hover: an SVG stroke only receives pointer events on its
                    visible width. This transparent path sits under the visible
                    one; hovering anywhere on the group highlights the line. The
                    linked nodes render AFTER (on top), so they stay clickable. */}
                <path
                  d={c.path}
                  className={styles.connectorHit}
                  fill="none"
                  aria-hidden="true"
                />
                <path
                  d={c.path}
                  className={styles.connector}
                  style={
                    {
                      strokeWidth: connectorStrokeWidth(c.depth),
                      '--i': i,
                    } as CSSProperties
                  }
                  fill="none"
                />
              </g>
            ))}
          </g>

          <g className={styles.nodesG}>
            {nodes.map((n) => {
              const rx = nodeRadius(n);
              const sw = nodeStrokeWidth(n.depth);
              const box = (
                <>
                  <rect
                    x={n.cx - n.w / 2}
                    y={n.cy - n.h / 2}
                    width={n.w}
                    height={n.h}
                    rx={rx}
                    className={clsx(
                      styles.box,
                      styles[`depth-${Math.min(n.depth, 3)}`],
                      n.accent && styles[`accent-${n.accent}`],
                      n.href && styles.boxLink,
                    )}
                    style={{ strokeWidth: sw }}
                  />
                  <text
                    x={n.cx}
                    y={n.cy}
                    className={clsx(
                      styles.label,
                      n.depth === 0 && styles.labelRoot,
                      n.href && styles.labelLink,
                    )}
                  >
                    {n.label}
                  </text>
                </>
              );
              const groupStyle = { '--i': n.order } as CSSProperties;
              if (n.href) {
                const external = /^https?:\/\//.test(n.href);
                return (
                  <a
                    key={n.order}
                    href={n.href}
                    className={clsx(styles.node, styles.nodeLink)}
                    style={groupStyle}
                    {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    aria-label={`${n.label} (link)`}
                  >
                    {box}
                  </a>
                );
              }
              return (
                <g key={n.order} className={styles.node} style={groupStyle}>
                  {box}
                </g>
              );
            })}
          </g>
        </svg>
      </div>
      {caption && <figcaption className={styles.caption}>{caption}</figcaption>}
    </figure>
  );
};

export default MindMap;
export { MIND };
