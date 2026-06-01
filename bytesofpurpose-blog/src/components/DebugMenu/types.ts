import type {ReactNode} from 'react';

/**
 * A pluggable section of the floating DebugMenu. Add a section by appending one
 * of these to the `sections` array in index.tsx — the container handles the
 * framing, collapse, a11y, and styling. The first section is Experiments;
 * future sections (event log, flag dump, route/perf info, draft toggles…) drop
 * in the same way without restructuring the container.
 */
export type DebugSection = {
  /** Stable id (used as React key + collapse state key). */
  id: string;
  /** Human-readable heading shown in the panel. */
  title: string;
  /** Renders the section body. Called only on localhost in a dev build. */
  render: () => ReactNode;
};
