/**
 * ============================================================================
 * Graph Data Utilities
 * ============================================================================
 * Functions for manipulating graph data structures, tree traversal, and data cleaning.
 * ============================================================================
 */

import { Node } from './types';

/**
 * Finds the path (all parent node IDs) to a target node in a tree structure.
 * 
 * @param targetId - The ID of the target node
 * @param nodes - Array of root nodes to search
 * @param path - Accumulated path (used internally for recursion)
 * @returns Array of node IDs from root to target, or null if not found
 * 
 * @example
 * ```typescript
 * // Input:
 * findPathToNode('c', [{ id: 'a', children: [{ id: 'b', children: [{ id: 'c' }] }] }])
 * // Output: ['a', 'b', 'c']
 * 
 * // Input:
 * findPathToNode('x', [{ id: 'a' }])
 * // Output: null
 * ```
 */
export function findPathToNode(
  targetId: string,
  nodes: Node[],
  path: string[] = []
): string[] | null {
  for (const node of nodes) {
    const currentPath = [...path, node.id];
    
    if (node.id === targetId) {
      return currentPath;
    }
    
    if (node.children) {
      const found = findPathToNode(targetId, node.children, currentPath);
      if (found) {
        return found;
      }
    }
  }
  return null;
}

/**
 * Finds a node by ID in a tree structure.
 * 
 * @param targetId - The ID of the node to find
 * @param nodes - Array of root nodes to search
 * @returns The found node or null
 * 
 * @example
 * ```typescript
 * // Input:
 * findNodeById('b', [{ id: 'a', children: [{ id: 'b' }] }])
 * // Output: { id: 'b' }
 * 
 * // Input:
 * findNodeById('x', [{ id: 'a' }])
 * // Output: null
 * ```
 */
export function findNodeById(targetId: string, nodes: Node[]): Node | null {
  for (const node of nodes) {
    if (node.id === targetId) {
      return node;
    }
    
    if (node.children) {
      const found = findNodeById(targetId, node.children);
      if (found) {
        return found;
      }
    }
  }
  return null;
}

/**
 * Gets all nodes that have children in a tree structure.
 * 
 * @param nodes - Array of root nodes
 * @returns Set of node IDs that have children
 * 
 * @example
 * ```typescript
 * // Input:
 * getAllNodesWithChildren([{ id: 'a', children: [{ id: 'b' }] }, { id: 'c' }])
 * // Output: Set(['a'])
 * 
 * // Input:
 * getAllNodesWithChildren([{ id: 'a' }, { id: 'b' }])
 * // Output: Set()
 * ```
 */
export function getAllNodesWithChildren(nodes: Node[]): Set<string> {
  const nodesWithChildren = new Set<string>();
  const traverse = (nodeList: Node[]) => {
    nodeList.forEach(node => {
      if (node.children && node.children.length > 0) {
        nodesWithChildren.add(node.id);
        traverse(node.children);
      }
    });
  };
  traverse(nodes);
  return nodesWithChildren;
}

/**
 * Cleans a node object by removing force-graph internal properties.
 * 
 * @param node - Raw node object from force-graph
 * @returns Cleaned node object with only relevant properties
 * 
 * @example
 * ```typescript
 * // Input:
 * cleanNodeForSelection({ 
 *   id: 'n1', 
 *   x: 100, 
 *   y: 200, 
 *   title: 'Node', 
 *   __internal: 'value',
 *   fx: 100,
 *   fy: 200
 * })
 * // Output: { 
 * //   id: 'n1', 
 * //   name: undefined, 
 * //   title: 'Node', 
 * //   label: undefined, 
 * //   description: '', 
 * //   group: undefined,
 * //   color: undefined,
 * //   hasChildren: undefined,
 * //   isExpanded: undefined,
 * //   markdownSection: undefined,
 * //   keyLinks: undefined
 * // }
 * ```
 */
export function cleanNodeForSelection(node: any) {
  return {
    id: node.id,
    name: node.name,
    title: node.title,
    label: node.label,
    description: typeof node.description === 'string' ? node.description : '',
    group: node.group,
    color: node.color,
    hasChildren: node.hasChildren,
    isExpanded: node.isExpanded,
    markdownSection: (node as any).markdownSection,
    keyLinks: (node as any).keyLinks,
  };
}

/**
 * Cleans an edge object by removing force-graph internal properties.
 * 
 * @param link - Raw link object from force-graph
 * @returns Cleaned edge object with only relevant properties
 * 
 * @example
 * ```typescript
 * // Input:
 * cleanEdgeForSelection({ 
 *   source: { id: 'a', x: 0, y: 0 }, 
 *   target: { id: 'b', x: 100, y: 100 }, 
 *   value: 1,
 *   __internal: 'value'
 * })
 * // Output: { 
 * //   id: undefined, 
 * //   source: 'a', 
 * //   target: 'b', 
 * //   value: 1, 
 * //   label: undefined, 
 * //   markdownSection: undefined 
 * // }
 * 
 * // Input:
 * cleanEdgeForSelection({ 
 *   source: 'a', 
 *   target: 'b', 
 *   id: 'e1' 
 * })
 * // Output: { 
 * //   id: 'e1', 
 * //   source: 'a', 
 * //   target: 'b', 
 * //   value: undefined, 
 * //   label: undefined, 
 * //   markdownSection: undefined 
 * // }
 * ```
 */
export function cleanEdgeForSelection(link: any) {
  const sourceId = typeof link.source === 'string' ? link.source : link.source?.id;
  const targetId = typeof link.target === 'string' ? link.target : link.target?.id;
  
  return {
    id: link.id,
    source: sourceId,
    target: targetId,
    value: link.value,
    label: link.label,
    markdownSection: link.markdownSection,
  };
}

