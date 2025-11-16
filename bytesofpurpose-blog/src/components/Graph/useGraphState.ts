/**
 * ============================================================================
 * useGraphState Hook
 * ============================================================================
 * Custom hook for managing graph component state.
 * ============================================================================
 */

import { useState, useRef } from 'react';
import { useColorMode } from '@docusaurus/theme-common';

export interface GraphState {
  expandedNodes: Set<string>;
  selectedNode: any;
  selectedEdge: any;
  highlightedNodeId: string | null;
  highlightedEdgeId: string | null;
  paneVisible: boolean;
  contextMenu: { x: number; y: number; nodeId?: string; edgeId?: string } | null;
  rightClickMenu: { nodeId: string; x: number; y: number } | null;
  nodePositions: Map<string, { x: number; y: number; radius: number }>;
  isDarkMode: boolean;
}

export interface GraphStateActions {
  setExpandedNodes: React.Dispatch<React.SetStateAction<Set<string>>>;
  setSelectedNode: React.Dispatch<React.SetStateAction<any>>;
  setSelectedEdge: React.Dispatch<React.SetStateAction<any>>;
  setHighlightedNodeId: React.Dispatch<React.SetStateAction<string | null>>;
  setHighlightedEdgeId: React.Dispatch<React.SetStateAction<string | null>>;
  setPaneVisible: React.Dispatch<React.SetStateAction<boolean>>;
  setContextMenu: React.Dispatch<React.SetStateAction<{ x: number; y: number; nodeId?: string; edgeId?: string } | null>>;
  setRightClickMenu: React.Dispatch<React.SetStateAction<{ nodeId: string; x: number; y: number } | null>>;
  setNodePositions: React.Dispatch<React.SetStateAction<Map<string, { x: number; y: number; radius: number }>>>;
  toggleNodeExpansion: (nodeId: string) => void;
  togglePane: () => void;
}

/**
 * Custom hook for managing graph state.
 * 
 * @param initialExpandedNodes - Initial set of expanded node IDs
 * @returns Graph state and actions
 * 
 * @example
 * ```tsx
 * const { state, actions } = useGraphState(new Set(['node1']));
 * 
 * // Access state
 * console.log(state.expandedNodes);
 * console.log(state.isDarkMode);
 * 
 * // Use actions
 * actions.toggleNodeExpansion('node2');
 * actions.setSelectedNode(node);
 * ```
 */
export function useGraphState(
  initialExpandedNodes?: Set<string>
): { state: GraphState; actions: GraphStateActions } {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(initialExpandedNodes || new Set());
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [selectedEdge, setSelectedEdge] = useState<any>(null);
  const [highlightedNodeId, setHighlightedNodeId] = useState<string | null>(null);
  const [highlightedEdgeId, setHighlightedEdgeId] = useState<string | null>(null);
  const [paneVisible, setPaneVisible] = useState<boolean>(true);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; nodeId?: string; edgeId?: string } | null>(null);
  const [rightClickMenu, setRightClickMenu] = useState<{ nodeId: string; x: number; y: number } | null>(null);
  const [nodePositions, setNodePositions] = useState<Map<string, { x: number; y: number; radius: number }>>(new Map());
  
  const rightClickPositionRef = useRef<{ x: number; y: number } | null>(null);
  
  const { colorMode } = useColorMode();
  const isDarkMode = colorMode === 'dark';

  const toggleNodeExpansion = (nodeId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  const togglePane = () => {
    setPaneVisible(prev => !prev);
  };

  const state: GraphState = {
    expandedNodes,
    selectedNode,
    selectedEdge,
    highlightedNodeId,
    highlightedEdgeId,
    paneVisible,
    contextMenu,
    rightClickMenu,
    nodePositions,
    isDarkMode,
  };

  const actions: GraphStateActions = {
    setExpandedNodes,
    setSelectedNode,
    setSelectedEdge,
    setHighlightedNodeId,
    setHighlightedEdgeId,
    setPaneVisible,
    setContextMenu,
    setRightClickMenu,
    setNodePositions,
    toggleNodeExpansion,
    togglePane,
  };

  return { state, actions };
}

