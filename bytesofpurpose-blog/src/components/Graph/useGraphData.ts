/**
 * ============================================================================
 * useGraphData Hook
 * ============================================================================
 * Custom hook for graph data transformation and flattening.
 * ============================================================================
 */

import { useMemo, useCallback } from 'react';
import { Node, Link, GraphData } from './types';

// Neo4j-like color palette
const NEO4J_COLORS = [
  '#68BDF6', // Neo4j blue
  '#60BE86', // Green
  '#FF6B6B', // Red
  '#FFD93D', // Yellow
  '#A78BFA', // Purple
  '#FB7185', // Pink
  '#34D399', // Emerald
  '#FBBF24', // Amber
];

export interface FlattenedGraphData {
  nodes: any[];
  links: any[];
}

/**
 * Custom hook for transforming graph data based on expansion state.
 * 
 * @param data - Original graph data with hierarchical nodes
 * @param expandedNodes - Set of expanded node IDs
 * @returns Flattened graph data for force-graph rendering
 * 
 * @example
 * ```tsx
 * const { graphData, flattenNodes } = useGraphData(originalData, expandedNodes);
 * 
 * // graphData contains flattened nodes and links
 * console.log(graphData.nodes.length); // Number of visible nodes
 * console.log(graphData.links.length); // Number of visible links
 * ```
 */
export function useGraphData(
  data: GraphData,
  expandedNodes: Set<string>
): { graphData: FlattenedGraphData; flattenNodes: (nodes: Node[], expanded: Set<string>) => FlattenedGraphData } {
  // Flatten nodes with children based on expansion state
  const flattenNodes = useCallback((nodes: Node[], expanded: Set<string>): FlattenedGraphData => {
    const flattenedNodes: any[] = [];
    const flattenedLinks: any[] = [];
    const nodeMap = new Map<string, any>();

    const processNode = (node: Node, index: number, parentId?: string) => {
      // Preserve all node properties (including keyLinks, markdownSection, etc.)
      // But exclude children array and force-graph internal properties
      const { children, ...nodeProps } = node as any;
      const nodeData = {
        ...nodeProps, // Spread all properties except children
        id: node.id,
        name: node.label,
        title: node.title || node.label,
        description: typeof node.description === 'string' ? node.description : (node.description as any)?.toString?.() || '',
        group: node.group ?? (index % NEO4J_COLORS.length),
        color: node.color ?? NEO4J_COLORS[index % NEO4J_COLORS.length],
        hasChildren: node.children && node.children.length > 0,
        isExpanded: expanded.has(node.id),
        originalNode: node,
      };
      
      flattenedNodes.push(nodeData);
      nodeMap.set(node.id, nodeData);

      // Add link to parent if exists
      if (parentId) {
        flattenedLinks.push({
          source: parentId,
          target: node.id,
          value: 1,
          id: `${parentId}-${node.id}`, // Generate ID for parent-child links
        });
      }

      // Process children if node is expanded
      if (node.children && expanded.has(node.id)) {
        node.children.forEach((child, childIndex) => {
          processNode(child, childIndex, node.id);
        });
      }
    };

    nodes.forEach((node, index) => {
      processNode(node, index);
    });

    // Add original links - preserve ALL properties including type, similarities, differences, etc.
    data.links.forEach((link, index) => {
      flattenedLinks.push({
        ...link, // Spread all properties first
        source: link.source,
        target: link.target,
        value: link.value ?? 1,
        id: link.id || `${link.source}-${link.target}-${index}`, // Generate ID if not provided
      });
    });

    return { nodes: flattenedNodes, links: flattenedLinks };
  }, [data]);

  // Transform data to format expected by force-graph
  const graphData = useMemo(() => {
    return flattenNodes(data.nodes, expandedNodes);
  }, [data, expandedNodes, flattenNodes]);

  return { graphData, flattenNodes };
}

