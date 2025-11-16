/**
 * ============================================================================
 * useGraphInteractions Hook
 * ============================================================================
 * Custom hook for graph interaction event handlers.
 * ============================================================================
 */

import { useCallback, useRef } from 'react';
import { cleanNodeForSelection, cleanEdgeForSelection, getNodeRadius } from './graphUtils';

export interface GraphInteractionHandlers {
  handleNodeClick: (node: any) => void;
  handleNodeRightClick: (node: any, event: MouseEvent) => void;
  handleLinkClick: (link: any, event: MouseEvent) => void;
  handleLinkRightClick: (link: any, event: MouseEvent) => void;
  handleNodeDrag: (node: any) => void;
  handleNodeDragEnd: (node: any) => void;
  handleZoom: (zoom: number) => void;
  copyAnchorLink: (nodeId?: string, edgeId?: string) => Promise<void>;
}

export interface GraphInteractionConfig {
  graphId: string;
  graphRef: React.RefObject<any>;
  graphData: any;
  expandedNodes: Set<string>;
  setSelectedNode: (node: any) => void;
  setSelectedEdge: (edge: any) => void;
  setHighlightedNodeId: (id: string | null) => void;
  setHighlightedEdgeId: (id: string | null) => void;
  setExpandedNodes: React.Dispatch<React.SetStateAction<Set<string>>>;
  setContextMenu: (menu: { x: number; y: number; nodeId?: string; edgeId?: string } | null) => void;
  setRightClickMenu: (menu: { nodeId: string; x: number; y: number } | null) => void;
  rightClickPositionRef: React.MutableRefObject<{ x: number; y: number } | null>;
}

/**
 * Custom hook for graph interaction event handlers.
 * 
 * @param config - Configuration object with state setters and refs
 * @returns Object with all interaction handlers
 * 
 * @example
 * ```tsx
 * const handlers = useGraphInteractions({
 *   graphId: 'my-graph',
 *   graphRef,
 *   graphData,
 *   expandedNodes,
 *   setSelectedNode,
 *   setSelectedEdge,
 *   setHighlightedNodeId,
 *   setHighlightedEdgeId,
 *   setExpandedNodes,
 *   setContextMenu,
 *   setRightClickMenu,
 *   rightClickPositionRef
 * });
 * 
 * // Use in ForceGraph2D
 * <ForceGraph2D
 *   onNodeClick={handlers.handleNodeClick}
 *   onLinkClick={handlers.handleLinkClick}
 *   // ... other handlers
 * />
 * ```
 */
export function useGraphInteractions(
  config: GraphInteractionConfig
): GraphInteractionHandlers {
  const {
    graphId,
    graphRef,
    graphData,
    expandedNodes,
    setSelectedNode,
    setSelectedEdge,
    setHighlightedNodeId,
    setHighlightedEdgeId,
    setExpandedNodes,
    setContextMenu,
    setRightClickMenu,
    rightClickPositionRef,
  } = config;

  const handleNodeClick = useCallback((node: any) => {
    // Clear context menu if open
    setContextMenu(null);
    
    // Toggle expansion if node has children
    if (node.hasChildren) {
      setExpandedNodes(prev => {
        const newSet = new Set(prev);
        if (newSet.has(node.id)) {
          newSet.delete(node.id);
        } else {
          newSet.add(node.id);
        }
        return newSet;
      });
    }
    
    // Select and highlight the node
    setSelectedNode(cleanNodeForSelection(node));
    setHighlightedNodeId(node.id);
    setSelectedEdge(null);
    setHighlightedEdgeId(null);
    
    // Update URL fragment
    if (graphId) {
      window.location.hash = `#${graphId}-node-${node.id}`;
    }
  }, [graphId, setExpandedNodes, setSelectedNode, setHighlightedNodeId, setSelectedEdge, setHighlightedEdgeId, setContextMenu]);

  const handleNodeRightClick = useCallback((node: any, event: MouseEvent) => {
    event.preventDefault();
    rightClickPositionRef.current = { x: event.clientX, y: event.clientY };
    setRightClickMenu({ nodeId: node.id, x: event.clientX, y: event.clientY });
  }, [setRightClickMenu, rightClickPositionRef]);

  const handleLinkClick = useCallback((link: any, event: MouseEvent) => {
    event.stopPropagation();
    setContextMenu(null);
    
    const cleanedEdge = cleanEdgeForSelection(link);
    setSelectedEdge(cleanedEdge);
    setHighlightedEdgeId(cleanedEdge.id || null);
    setSelectedNode(null);
    setHighlightedNodeId(null);
    
    // Update URL fragment
    if (graphId && cleanedEdge.id) {
      window.location.hash = `#${graphId}-edge-${cleanedEdge.id}`;
    }
  }, [graphId, setSelectedEdge, setHighlightedEdgeId, setSelectedNode, setHighlightedNodeId, setContextMenu]);

  const handleLinkRightClick = useCallback((link: any, event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    const cleanedEdge = cleanEdgeForSelection(link);
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      edgeId: cleanedEdge.id,
    });
  }, [setContextMenu]);

  const handleNodeDrag = useCallback((node: any) => {
    // Update node position in graph data if needed
    // Force-graph handles this automatically, but we can add custom logic here
  }, []);

  const handleNodeDragEnd = useCallback((node: any) => {
    // Handle drag end if needed
  }, []);

  const handleZoom = useCallback((zoom: number) => {
    // Handle zoom changes if needed
  }, []);

  const copyAnchorLink = useCallback(async (nodeId?: string, edgeId?: string) => {
    let anchorLink: string;
    if (nodeId) {
      anchorLink = `${window.location.origin}${window.location.pathname}#${graphId}-node-${nodeId}`;
    } else if (edgeId) {
      anchorLink = `${window.location.origin}${window.location.pathname}#${graphId}-edge-${edgeId}`;
    } else {
      return;
    }
    
    try {
      await navigator.clipboard.writeText(anchorLink);
      setContextMenu(null);
    } catch (err) {
      console.error('Failed to copy link:', err);
      // Fallback: try using the older method
      const textArea = document.createElement('textarea');
      textArea.value = anchorLink;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setContextMenu(null);
      } catch (fallbackErr) {
        console.error('Fallback copy failed:', fallbackErr);
      }
      document.body.removeChild(textArea);
    }
  }, [graphId, setContextMenu]);

  return {
    handleNodeClick,
    handleNodeRightClick,
    handleLinkClick,
    handleLinkRightClick,
    handleNodeDrag,
    handleNodeDragEnd,
    handleZoom,
    copyAnchorLink,
  };
}

