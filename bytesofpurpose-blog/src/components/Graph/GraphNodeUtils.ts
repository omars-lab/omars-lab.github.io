/**
 * ============================================================================
 * Graph Node Utilities
 * ============================================================================
 * Functions for node properties, styling, validation, and status indicators.
 * ============================================================================
 */

/**
 * Calculates the radius of a node based on whether it has children.
 * 
 * @param hasChildren - Whether the node has child nodes
 * @returns Node radius in pixels
 * 
 * @example
 * ```typescript
 * // Input:
 * getNodeRadius(true)
 * // Output: 12
 * 
 * // Input:
 * getNodeRadius(false)
 * // Output: 8
 * ```
 */
export function getNodeRadius(hasChildren: boolean): number {
  return hasChildren ? 12 : 8;
}

/**
 * Gets the display color for a node, falling back to default if not specified.
 * 
 * @param nodeColor - Optional color from node data
 * @returns Color string (hex format)
 * 
 * @example
 * ```typescript
 * // Input:
 * getNodeColor('#FF0000')
 * // Output: '#FF0000'
 * 
 * // Input:
 * getNodeColor()
 * // Output: '#68BDF6'
 * 
 * // Input:
 * getNodeColor(undefined)
 * // Output: '#68BDF6'
 * ```
 */
export function getNodeColor(nodeColor?: string): string {
  return nodeColor || '#68BDF6';
}

/**
 * Extracts the display label for a node from various possible fields.
 * 
 * @param node - Node object with potential label fields
 * @returns Label string for display
 * 
 * @example
 * ```typescript
 * // Input:
 * getNodeLabel({ title: 'My Node', name: 'node1', id: 'n1' })
 * // Output: 'My Node'
 * 
 * // Input:
 * getNodeLabel({ name: 'node1', id: 'n1' })
 * // Output: 'node1'
 * 
 * // Input:
 * getNodeLabel({ id: 'n1' })
 * // Output: 'n1'
 * 
 * // Input:
 * getNodeLabel({})
 * // Output: ''
 * ```
 */
export function getNodeLabel(node: any): string {
  return node.title || node.name || node.id || '';
}

/**
 * Validates that a node has valid coordinates for rendering.
 * 
 * @param node - Node object with x, y coordinates
 * @returns True if node coordinates are valid for rendering
 * 
 * @example
 * ```typescript
 * // Input:
 * isValidNodeCoordinates({ x: 100, y: 200 })
 * // Output: true
 * 
 * // Input:
 * isValidNodeCoordinates({ x: Infinity, y: 200 })
 * // Output: false
 * 
 * // Input:
 * isValidNodeCoordinates({ x: 100 })
 * // Output: false
 * 
 * // Input:
 * isValidNodeCoordinates({ x: NaN, y: 200 })
 * // Output: false
 * ```
 */
export function isValidNodeCoordinates(node: any): boolean {
  return node.x !== undefined && 
         node.y !== undefined && 
         isFinite(node.x) && 
         isFinite(node.y);
}

/**
 * Determines the status indicator symbol and type for a node.
 * 
 * Feature: Node status visualization
 * Use case: Shows expansion state for parent nodes, leaf indicator for leaf nodes
 * 
 * @param hasChildren - Whether the node has child nodes
 * @param isExpanded - Whether the node is currently expanded (only relevant if hasChildren)
 * @returns Object with statusIndicator (string) and isTextLabel (boolean)
 * 
 * @example
 * ```typescript
 * // Input:
 * getNodeStatusIndicator(true, true)
 * // Output: { statusIndicator: '▼', isTextLabel: false }
 * 
 * // Input:
 * getNodeStatusIndicator(true, false)
 * // Output: { statusIndicator: '▶', isTextLabel: false }
 * 
 * // Input:
 * getNodeStatusIndicator(false, false)
 * // Output: { statusIndicator: '🌿', isTextLabel: false }
 * ```
 */
export function getNodeStatusIndicator(
  hasChildren: boolean,
  isExpanded: boolean
): { statusIndicator: string; isTextLabel: boolean } {
  if (hasChildren) {
    return {
      statusIndicator: isExpanded ? '▼' : '▶', // Down arrow = expanded, right arrow = collapsed
      isTextLabel: false
    };
  } else {
    return {
      statusIndicator: '🌿', // Leaf emoji for leaf nodes
      isTextLabel: false
    };
  }
}

