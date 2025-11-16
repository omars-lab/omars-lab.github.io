/**
 * ============================================================================
 * GraphCanvas Component
 * ============================================================================
 * Wrapper component for ForceGraph2D that handles canvas rendering.
 * ============================================================================
 */

import React, { useMemo, useCallback } from 'react';
import { getNodeRadius, getNodeLabel } from './graphUtils';

export interface GraphCanvasProps {
  ForceGraph2D: any;
  graphData: any;
  width: number;
  height: number;
  backgroundColor: string;
  linkColor: string;
  arrowColor: string;
  nodeBorderColor: string;
  highlightedNodeId: string | null;
  highlightedEdgeId: string | null;
  selectedNode: any;
  expandedNodes: Set<string>;
  isDarkMode: boolean;
  graphRef: React.RefObject<any>;
  nodeRenderer: (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => void;
  linkCanvasObjectMode: (link: any) => 'replace' | 'after' | 'before';
  linkCanvasObject: (link: any, ctx: CanvasRenderingContext2D, globalScale: number) => void;
  onNodeClick: (node: any) => void;
  onNodeRightClick: (node: any, event: MouseEvent) => void;
  onLinkClick: (link: any, event: MouseEvent) => void;
  onLinkRightClick: (link: any, event: MouseEvent) => void;
  onNodeDrag: (node: any) => void;
  onNodeDragEnd: (node: any) => void;
  onZoom: (transform: { k: number; x: number; y: number }) => void;
}

/**
 * Canvas component wrapper for ForceGraph2D.
 * 
 * @example
 * ```tsx
 * <GraphCanvas
 *   ForceGraph2D={ForceGraph2D}
 *   graphData={graphData}
 *   width={800}
 *   height={600}
 *   backgroundColor="#ffffff"
 *   linkColor="#000000"
 *   arrowColor="#000000"
 *   nodeBorderColor="#333333"
 *   highlightedNodeId={null}
 *   highlightedEdgeId={null}
 *   selectedNode={null}
 *   expandedNodes={new Set()}
 *   isDarkMode={false}
 *   graphRef={graphRef}
 *   nodeRenderer={nodeRenderer}
 *   linkCanvasObjectMode={linkCanvasObjectMode}
 *   linkCanvasObject={linkCanvasObject}
 *   onNodeClick={handleNodeClick}
 *   onNodeRightClick={handleNodeRightClick}
 *   onLinkClick={handleLinkClick}
 *   onLinkRightClick={handleLinkRightClick}
 *   onNodeDrag={handleNodeDrag}
 *   onNodeDragEnd={handleNodeDragEnd}
 *   onZoom={handleZoom}
 * />
 * ```
 */
export const GraphCanvas: React.FC<GraphCanvasProps> = ({
  ForceGraph2D,
  graphData,
  width,
  height,
  backgroundColor,
  linkColor,
  arrowColor,
  nodeBorderColor,
  highlightedNodeId,
  highlightedEdgeId,
  selectedNode,
  expandedNodes,
  isDarkMode,
  graphRef,
  nodeRenderer,
  linkCanvasObjectMode,
  linkCanvasObject,
  onNodeClick,
  onNodeRightClick,
  onLinkClick,
  onLinkRightClick,
  onNodeDrag,
  onNodeDragEnd,
  onZoom,
}) => {
  // Memoize graph data
  const memoizedGraphData = useMemo(() => graphData, [graphData]);

  // Create memoized props functions for ForceGraph2D
  const nodeLabel = useCallback((node: any) => getNodeLabel(node), []);
  const nodeVal = useCallback((node: any) => getNodeRadius(node.hasChildren), []);

  const linkColorFn = useCallback((link: any) => {
    // Comparison edges are drawn in linkCanvasObject with 'replace' mode, so hide default line
    if ((link as any).type === 'differentiating') {
      return 'rgba(0,0,0,0)'; // Fully transparent
    }
    return linkColor;
  }, [linkColor]);

  const linkWidthFn = useCallback((link: any) => {
    // Comparison edges are drawn in linkCanvasObject, so hide default line
    if ((link as any).type === 'differentiating') {
      return 0.1; // Very small width - should be invisible but still trigger linkCanvasObject
    }
    const baseWidth = Math.max(2, Math.sqrt(link.value || 1) * 2);
    return highlightedEdgeId === link.id ? baseWidth * 1.5 : baseWidth;
  }, [highlightedEdgeId]);

  const linkDirectionalArrowLengthFn = useCallback((link: any) => {
    // Don't show arrows for comparison edges
    if ((link as any).type === 'differentiating') {
      return 0;
    }
    return 6;
  }, []);

  const linkDirectionalArrowRelPosFn = useCallback(() => 1, []);

  const linkDirectionalArrowColorFn = useCallback((link: any) => {
    // Don't show arrows for comparison edges
    if ((link as any).type === 'differentiating') {
      return 'rgba(0,0,0,0)';
    }
    return arrowColor;
  }, [arrowColor]);

  return (
    <ForceGraph2D
      ref={graphRef}
      graphData={memoizedGraphData}
      width={width}
      height={height}
      backgroundColor={backgroundColor}
      nodeLabel={nodeLabel}
      nodeVal={nodeVal}
      linkColor={linkColorFn}
      linkWidth={linkWidthFn}
      linkDirectionalArrowLength={linkDirectionalArrowLengthFn}
      linkDirectionalArrowRelPos={linkDirectionalArrowRelPosFn}
      linkDirectionalArrowColor={linkDirectionalArrowColorFn}
      onNodeClick={onNodeClick}
      onNodeRightClick={onNodeRightClick}
      onLinkClick={onLinkClick}
      onLinkRightClick={onLinkRightClick}
      onNodeDrag={onNodeDrag}
      onNodeDragEnd={onNodeDragEnd}
      onZoom={onZoom}
      nodeCanvasObjectMode={() => 'replace'}
      nodeCanvasObject={nodeRenderer}
      linkCanvasObjectMode={linkCanvasObjectMode}
      linkCanvasObject={linkCanvasObject}
      cooldownTicks={100}
      onEngineStop={() => {
        // Graph has stabilized
      }}
    />
  );
};

