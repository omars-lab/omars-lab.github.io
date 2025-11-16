/**
 * ============================================================================
 * Graph Utility Functions (Re-export)
 * ============================================================================
 * This file re-exports all graph utility functions for backward compatibility.
 * 
 * For better organization, consider importing directly from:
 * - GraphDataUtils: Tree traversal, data cleaning
 * - GraphNodeUtils: Node properties, styling, validation
 * - GraphRenderingUtils: Rendering calculations, coordinates
 * - GraphTextUtils: Text processing, wrapping, font sizing
 * ============================================================================
 */

// Re-export from GraphDataUtils
export {
  findPathToNode,
  findNodeById,
  getAllNodesWithChildren,
  cleanNodeForSelection,
  cleanEdgeForSelection,
} from './GraphDataUtils';

// Re-export from GraphNodeUtils
export {
  getNodeRadius,
  getNodeColor,
  getNodeLabel,
  isValidNodeCoordinates,
  getNodeStatusIndicator,
} from './GraphNodeUtils';

// Re-export from GraphRenderingUtils
export {
  getEdgeCoordinates,
  calculateAvailableTextWidth,
  calculateEmojiAreaCenterY,
  calculateLinePositions,
  calculateOptimalTitleFontSize,
  calculateIndicatorFontSize,
} from './GraphRenderingUtils';

// Re-export from GraphTextUtils
export {
  breakLongWord,
  wrapTextIntoLines,
  truncateLine,
  calculateOptimalFontSize,
  applyZoomScaling,
} from './GraphTextUtils';
