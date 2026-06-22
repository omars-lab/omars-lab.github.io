import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';

// Traveling-flow-dot for opt-in mermaid diagrams.
//
// A diagram wrapped in `<div class="mermaid-animated">` already gets marching-ants edge
// dashes from CSS (src/css/custom.css). This module LAYERS a single dot that travels the
// diagram's edges in sequence (edge 1 → edge 2 → … → loop), so the eye follows the flow
// through the system, not just "every edge is live".
//
// Why JS and not CSS: mermaid (theme-mermaid 11) renders client-side into an <svg> with
// UNSTABLE, per-render ids, and there is no CSS primitive for "move one element along
// path A, then path B, then C". So we wait for the svg, read each edge's geometry with
// getPointAtLength(), and drive a <circle> with requestAnimationFrame.
//
// Registered via clientModules in docusaurus.config.js. SSR-safe (guarded on canUseDOM).
// Idempotent: each container is animated at most once (a data flag guards re-entry), and
// a MutationObserver picks up diagrams that mermaid renders after route changes.

if (ExecutionEnvironment.canUseDOM) {
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const EDGE_SEL = 'path.flowchart-link, path.relation';
  const SPEED = 220; // px per second the dot travels along an edge
  const EDGE_PAUSE = 120; // ms pause at the end of each edge
  const DOT_R = 5;

  const prefersReduced =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Order edges by their start point (top-to-bottom, then left-to-right) so the dot's
  // journey reads roughly in the diagram's flow direction rather than raw DOM order.
  function orderedEdges(svg) {
    const edges = Array.from(svg.querySelectorAll(EDGE_SEL)).filter((p) => {
      try {
        return p.getTotalLength() > 1;
      } catch {
        return false;
      }
    });
    return edges
      .map((p) => {
        const start = p.getPointAtLength(0);
        return {p, x: start.x, y: start.y};
      })
      .sort((a, b) => a.y - b.y || a.x - b.x)
      .map((e) => e.p);
  }

  function animateContainer(container) {
    if (container.dataset.flowDotInit === '1') return;
    const svg = container.querySelector('svg');
    if (!svg) return;
    const edges = orderedEdges(svg);
    if (!edges.length) return;
    container.dataset.flowDotInit = '1';

    if (prefersReduced) return; // wrapper marked; honor reduced-motion (no moving dot)

    // The dot. A soft glow makes it read against the edge stroke.
    const dot = document.createElementNS(SVG_NS, 'circle');
    dot.setAttribute('r', String(DOT_R));
    dot.setAttribute('class', 'mermaid-flow-dot');
    dot.setAttribute('fill', 'var(--ifm-color-primary)');
    dot.setAttribute('stroke', 'var(--ifm-background-color, #fff)');
    dot.setAttribute('stroke-width', '1.5');
    dot.style.pointerEvents = 'none';
    svg.appendChild(dot);

    let edgeIndex = 0;
    let distance = 0;
    let pausedUntil = 0;
    let lastTs = 0;
    let rafId = 0;

    const place = (edge, d) => {
      const pt = edge.getPointAtLength(d);
      dot.setAttribute('cx', String(pt.x));
      dot.setAttribute('cy', String(pt.y));
    };

    const step = (ts) => {
      if (!lastTs) lastTs = ts;
      const dtMs = ts - lastTs;
      lastTs = ts;

      if (ts < pausedUntil) {
        rafId = window.requestAnimationFrame(step);
        return;
      }

      const edge = edges[edgeIndex];
      let len;
      try {
        len = edge.getTotalLength();
      } catch {
        // edge was removed (diagram re-rendered) — stop; the observer re-inits.
        return;
      }
      distance += (SPEED * dtMs) / 1000;

      if (distance >= len) {
        place(edge, len);
        edgeIndex = (edgeIndex + 1) % edges.length;
        distance = 0;
        pausedUntil = ts + EDGE_PAUSE;
      } else {
        place(edge, distance);
      }
      rafId = window.requestAnimationFrame(step);
    };

    place(edges[0], 0);
    rafId = window.requestAnimationFrame(step);

    // If the container leaves the DOM (route change), cancel the loop.
    const cleanup = new MutationObserver(() => {
      if (!document.contains(container)) {
        window.cancelAnimationFrame(rafId);
        cleanup.disconnect();
      }
    });
    cleanup.observe(document.body, {childList: true, subtree: true});
  }

  // mermaid renders asynchronously and re-renders on route changes; poll-scan with a
  // MutationObserver. Each container self-guards against double-init.
  const scan = () => {
    document.querySelectorAll('.mermaid-animated').forEach((c) => {
      // the svg may not be in yet; try, and the observer will retry on the next mutation.
      animateContainer(c);
    });
  };

  const start = () => {
    scan();
    const mo = new MutationObserver(() => scan());
    mo.observe(document.body, {childList: true, subtree: true});
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
}
