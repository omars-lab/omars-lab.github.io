// MindMap shared SVG geometry helpers : pure functions used by BOTH the React
// component (index.tsx) and the standalone SVG-string serializer that the preview
// CLI (scripts/render-mindmap.mjs) uses. Keeping the shape math here means the
// PNG preview and the in-page render are pixel-identical, which is the whole point
// of the visual-validation loop (compare our PNG to the original .mindnode
// QuickLook preview without building the blog).

import type { MindMapLayout, PlacedMindNode } from './layout';
import type { MindAccent } from './parser';

/** Visual style of the map: 'mindnode' (cream/brown, default) or 'blog' (the site's
 *  green/tea design tokens). Distinct from the light/dark COLOR MODE below. */
export type MindStyle = 'mindnode' | 'blog';

/** Corner radius per shape. Circle/root are drawn as a pill (rx = h/2). */
export function nodeRadius(node: Pick<PlacedMindNode, 'shape' | 'h'>): number {
  switch (node.shape) {
    case 'root':
    case 'circle':
      return node.h / 2;
    case 'square':
      return 4;
    case 'hexagon':
      return 2;
    default:
      return 10;
  }
}

/** Stroke width tapers with depth so deep branches read as finer. */
export function nodeStrokeWidth(depth: number): number {
  if (depth === 0) return 2.4;
  if (depth === 1) return 1.8;
  return 1.3;
}

export function connectorStrokeWidth(depth: number): number {
  return Math.max(1, 3 - depth * 0.5);
}

// ---- Standalone SVG serializer -------------------------------------------
// Used by the preview CLI (scripts/render-mindmap.mjs) to emit a self-contained
// .svg (inline styles, no external CSS) that we rasterize to PNG for the visual
// validation loop against the original .mindnode QuickLook preview. The geometry
// is the SAME layout the React component renders, so the PNG faithfully previews
// what ships in the post.

export type MindTheme = 'light' | 'dark';

interface Palette {
  canvas: string;
  nodeFill: string;
  rootFill: string;
  border: string;
  borderSoft: string;
  connector: string;
  ink: string;
  link: string;
  /** Per-accent node fill + border, keyed by accent name. */
  accentFill: Record<MindAccent, string>;
  accentBorder: Record<MindAccent, string>;
}

// Concrete palettes for the STANDALONE serializer (the preview CLI). The React
// component gets the same colors from CSS tokens instead (styles.module.css), so
// keep these two in sync. Style x mode = 4 palettes. Accent tints mirror the
// blog's tea-pastel accents.
const ACCENT_LIGHT: Record<MindAccent, string> = {
  green: '#d2ffc4',
  mint: '#adfff5',
  pink: '#ffc5d3',
  blue: '#cfe3ff',
  amber: '#ffe6b0',
  violet: '#e3d1ff',
};
const ACCENT_BORDER_LIGHT: Record<MindAccent, string> = {
  green: '#4a8a69',
  mint: '#3d9c94',
  pink: '#c96b83',
  blue: '#5b86c2',
  amber: '#b58a3d',
  violet: '#8a6bc2',
};
const ACCENT_DARK: Record<MindAccent, string> = {
  green: '#2f5d47',
  mint: '#2a5551',
  pink: '#5d2f3d',
  blue: '#2f435d',
  amber: '#5d4a2f',
  violet: '#463d5d',
};
const ACCENT_BORDER_DARK: Record<MindAccent, string> = {
  green: '#6fbf95',
  mint: '#6fbfb5',
  pink: '#bf6f87',
  blue: '#6f92bf',
  amber: '#bfa06f',
  violet: '#9a6fbf',
};

const PALETTES: Record<MindStyle, Record<MindTheme, Palette>> = {
  mindnode: {
    light: {
      canvas: '#fdf3df',
      nodeFill: '#fffdf8',
      rootFill: '#fff8ec',
      border: '#663300',
      borderSoft: '#9c7a4d',
      connector: '#c9c48f',
      ink: '#535353',
      link: '#8a4b1f',
      accentFill: ACCENT_LIGHT,
      accentBorder: ACCENT_BORDER_LIGHT,
    },
    dark: {
      canvas: '#2a2320',
      nodeFill: '#37302b',
      rootFill: '#40352c',
      border: '#c69a63',
      borderSoft: '#8a6f4c',
      connector: '#7d7350',
      ink: '#ece3d4',
      link: '#e0a86a',
      accentFill: ACCENT_DARK,
      accentBorder: ACCENT_BORDER_DARK,
    },
  },
  blog: {
    light: {
      canvas: '#f4f6f5', // --ifm-background-surface-color
      nodeFill: '#ffffff',
      rootFill: '#eafaf1', // brand-green tint
      border: '#3c7256', // --ifm-color-primary
      borderSoft: '#7fae97',
      connector: '#8fb8a4',
      ink: '#14201a', // --ifm-heading-color
      link: '#3c7256',
      accentFill: ACCENT_LIGHT,
      accentBorder: ACCENT_BORDER_LIGHT,
    },
    dark: {
      canvas: '#242827', // --ifm-background-surface-color (dark)
      nodeFill: '#1c1f1e',
      rootFill: '#25352d',
      border: '#6fbf95', // --ifm-color-primary (dark)
      borderSoft: '#4f7a63',
      connector: '#4f7a63',
      ink: '#f4f6f5',
      link: '#6fbf95',
      accentFill: ACCENT_DARK,
      accentBorder: ACCENT_BORDER_DARK,
    },
  },
};

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Serialize a computed layout to a standalone SVG string. `pad` adds a cream
 * border around the figure (matching the component's padded card) so the
 * rasterized PNG reads like the in-page render. Deterministic; no DOM.
 */
export function toSVGString(
  model: MindMapLayout,
  title: string,
  theme: MindTheme = 'light',
  style: MindStyle = 'mindnode',
): string {
  const p = (PALETTES[style] ?? PALETTES.mindnode)[theme];
  const pad = 16;
  const w = model.svgW + pad * 2;
  const h = model.svgH + pad * 2;

  const connectors = model.connectors
    .map(
      (c) =>
        `<path d="${c.path}" fill="none" stroke="${p.connector}" ` +
        `stroke-width="${connectorStrokeWidth(c.depth)}" stroke-linecap="round" ` +
        `transform="translate(${pad} ${pad})"/>`,
    )
    .join('\n    ');

  const nodes = model.nodes
    .map((n) => {
      const rx = nodeRadius(n);
      const sw = nodeStrokeWidth(n.depth);
      const isRoot = n.depth === 0;
      // Accent (if any) tints fill + border; otherwise depth/link decide them.
      const accentFill = n.accent ? p.accentFill[n.accent] : undefined;
      const accentBorder = n.accent ? p.accentBorder[n.accent] : undefined;
      const stroke = accentBorder ?? (n.href ? p.link : n.depth >= 2 ? p.borderSoft : p.border);
      const fill = accentFill ?? (isRoot ? p.rootFill : p.nodeFill);
      const textFill = n.href ? p.link : p.ink;
      const weight = isRoot ? 600 : 500;
      const deco = n.href ? ' text-decoration="underline"' : '';
      return (
        `<g transform="translate(${pad} ${pad})">` +
        `<rect x="${(n.cx - n.w / 2).toFixed(1)}" y="${(n.cy - n.h / 2).toFixed(1)}" ` +
        `width="${n.w}" height="${n.h}" rx="${rx}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>` +
        `<text x="${n.cx.toFixed(1)}" y="${n.cy.toFixed(1)}" fill="${textFill}" ` +
        `font-family="'Gill Sans','Gill Sans MT',system-ui,sans-serif" font-size="14" font-weight="${weight}" ` +
        `text-anchor="middle" dominant-baseline="central"${deco}>${esc(n.label)}</text>` +
        `</g>`
      );
    })
    .join('\n    ');

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" ` +
    `role="img" aria-label="${esc(title)}">\n` +
    `  <rect x="0" y="0" width="${w}" height="${h}" rx="14" fill="${p.canvas}"/>\n` +
    `  <g>\n    ${connectors}\n  </g>\n` +
    `  <g>\n    ${nodes}\n  </g>\n` +
    `</svg>\n`
  );
}
