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

  // Mermaid encodes each flowchart edge's source + target node in its id / data-id as
  // `…L_<source>_<target>_<index>` (e.g. L_UI_SRV_0 = UI -> SRV). We parse that to build
  // the real graph — far more reliable than guessing flow from screen geometry.
  function parseEdge(pathEl) {
    const raw =
      pathEl.getAttribute('data-id') || pathEl.id || pathEl.getAttribute('class') || '';
    const m = raw.match(/L[_-](.+?)[_-](.+?)[_-]\d+$/);
    if (!m) return null;
    let len = 0;
    try {
      len = pathEl.getTotalLength();
    } catch {
      return null;
    }
    if (len <= 1) return null;
    return {p: pathEl, from: m[1], to: m[2], len};
  }

  // Collect parsed edges; empty if the diagram isn't a node-labeled flowchart (e.g. ER /
  // class / sequence) — those fall back to dashes-only.
  function collectEdges(svg) {
    const edges = [];
    svg.querySelectorAll(EDGE_SEL).forEach((p) => {
      const e = parseEdge(p);
      if (e) edges.push(e);
    });
    return edges;
  }

  // Verbs that, when they appear on an edge label, signal MOVEMENT/ACTION (a flow) rather
  // than a static relationship. Read from the diagram's CONTENT (the edge labels), which
  // is what actually distinguishes "data moves A->B->C" from "these systems relate".
  const FLOW_VERBS =
    /\b(invoke[sd]?|edit[s]?|read[s]?|write[s]?|send[s]?|push|pull|fetch|commit[s]?|ship[s]?|run[s]?|scan[s]?|score[s]?|rank[s]?|generate[s]?|produce[s]?|emit[s]?|trigger[s]?|dispatch|process(es)?|transform[s]?|deliver[s]?|return[s]?|reply|reports?|drives?|calls?|requests?|responds?|updates?|ideate[s]?|measure[s]?|decide[s]?|enrich(es)?|discover[s]?|outreach|becomes?|configures?)\b/i;

  // Classify a diagram as FLOW (gets the traveling dot) vs CONTEXT (dashes only), from the
  // diagram's CONTENT: how many of its labeled edges carry an action verb. A flow/activity
  // diagram describes things MOVING ("invoke", "edits", "commit", "scan", "score"); a
  // context/relationship diagram is mostly unlabeled or noun-relations. Returns a verdict
  // the caller combines with the author's explicit directive (which always wins).
  // `edgeLabels` is the list of edge-label strings rendered for this diagram.
  function labelsLookLikeFlow(edgeLabels) {
    const labeled = edgeLabels.filter((t) => t && t.trim());
    if (!labeled.length) return false; // nothing labeled -> can't tell from content -> no dot by default
    const verbish = labeled.filter((t) => FLOW_VERBS.test(t)).length;
    // FLOW when a clear share of the LABELED edges read as actions.
    return verbish / labeled.length >= 0.4;
  }

  // Pull the rendered edge-label strings for a diagram's svg.
  function edgeLabelsOf(svg) {
    return Array.from(svg.querySelectorAll('.edgeLabel'))
      .map((n) => (n.textContent || '').trim())
      .filter(Boolean);
  }

  // Order edges into a single walk: start at a source (in-degree 0, else lowest in-degree
  // / top-left), then repeatedly take an unused edge out of the current node; when the
  // current node has no unused out-edge, jump to the nearest node that still has one.
  // Produces a path that follows the flow node-to-node instead of by screen position.
  function walkOrder(edges) {
    const out = {}; // node -> [edge,…] not yet used
    const indeg = {};
    const outdeg = {};
    for (const e of edges) {
      (out[e.from] = out[e.from] || []).push(e);
      outdeg[e.from] = (outdeg[e.from] || 0) + 1;
      indeg[e.to] = (indeg[e.to] || 0) + 1;
      indeg[e.from] = indeg[e.from] || 0;
    }
    const nodes = Object.keys({...indeg, ...outdeg});
    // pick a start: prefer a true source (indeg 0, has out-edges)
    let start =
      nodes.find((n) => (indeg[n] || 0) === 0 && (outdeg[n] || 0) > 0) ||
      nodes.sort((a, b) => (indeg[a] || 0) - (indeg[b] || 0))[0];

    const used = new Set();
    const order = [];
    let current = start;
    while (order.length < edges.length) {
      const avail = (out[current] || []).filter((e) => !used.has(e));
      let next;
      if (avail.length) {
        next = avail[0];
      } else {
        // no out-edge from here: jump to any node that still has an unused out-edge
        const jumpNode = Object.keys(out).find((n) =>
          (out[n] || []).some((e) => !used.has(e))
        );
        if (jumpNode == null) break;
        next = out[jumpNode].find((e) => !used.has(e));
      }
      used.add(next);
      order.push(next.p);
      current = next.to;
    }
    // append any leftover (disconnected) edges so the dot still covers them
    for (const e of edges) if (!used.has(e)) order.push(e.p);
    return order;
  }

  function animateContainer(container) {
    if (container.dataset.flowDotInit === '1') return;
    const svg = container.querySelector('svg');
    if (!svg) return;
    const parsed = collectEdges(svg);
    if (!parsed.length) return; // wait for mermaid to finish rendering edges
    container.dataset.flowDotInit = '1';

    if (prefersReduced) return; // honor reduced-motion (no moving dot; dashes still flow)

    // The TWO-TIER model: the marching-ants dashes (CSS) animate on EVERY .mermaid-animated
    // diagram. The traveling DOT is added ONLY to flow/activity diagrams — on a context /
    // relationship diagram a sequential dot looks random, so we explicitly DON'T add it.
    //
    // The decision is CONTENT-based, in two layers (author intent wins):
    //   1. AUTHOR DIRECTIVE (from the source `%% animate: flow|none`, stamped by the
    //      importer as a wrapper class):
    //        .flow-dot     -> always add the dot
    //        .no-flow-dot  -> never add the dot
    //   2. otherwise the EDGE-LABEL heuristic: do the diagram's edge labels read as
    //      actions/verbs (a flow) vs static relations (context)?
    const forced = container.classList.contains('flow-dot');
    const suppressed = container.classList.contains('no-flow-dot');
    if (suppressed) {
      container.dataset.flowDotKind = 'none(author)';
      return;
    }
    const decideFlow = forced || labelsLookLikeFlow(edgeLabelsOf(svg));
    if (!decideFlow) {
      container.dataset.flowDotKind = 'context'; // recorded for the e2e + debugging
      return;
    }
    container.dataset.flowDotKind = forced ? 'flow(author)' : 'flow(labels)';

    const edges = walkOrder(parsed);

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
