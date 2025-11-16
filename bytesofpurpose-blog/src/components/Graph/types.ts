/**
 * ============================================================================
 * Graph Type Definitions
 * ============================================================================
 * Shared type definitions for graph components.
 * ============================================================================
 */

export interface Node {
  id: string;
  label: string;
  title?: string;
  description?: string;
  group?: number;
  color?: string;
  children?: Node[];
  markdownSection?: string; // ID of markdown section this node links to
}

export interface Link {
  source: string;
  target: string;
  value?: number;
  label?: string;
  id?: string; // Optional ID for anchor links
  markdownSection?: string; // ID of markdown section this edge links to
}

export interface GraphData {
  nodes: Node[];
  links: Link[];
}

export interface GraphRendererProps {
  data: GraphData;
  width?: number;
  height?: number;
  highlightNodeId?: string; // Optional node ID to highlight
  highlightEdgeId?: string; // Optional edge ID to highlight
  graphId?: string; // Optional unique ID for this graph instance (for URL hash support)
  onEdgeClick?: (edge: any) => void; // Optional callback when edge is clicked
  initialExpandedNodes?: Set<string>; // Optional set of node IDs to expand initially
}

