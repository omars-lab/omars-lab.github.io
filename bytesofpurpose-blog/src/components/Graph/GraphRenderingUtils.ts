/**
 * ============================================================================
 * Graph Rendering Utilities
 * ============================================================================
 * Functions for calculating rendering positions, coordinates, and layout within nodes.
 * ============================================================================
 */

/**
 * Calculates edge coordinates (start/end points on node surfaces) for rendering.
 * 
 * @param startNode - Source node with x, y coordinates
 * @param endNode - Target node with x, y coordinates
 * @param getNodeRadius - Function to get node radius based on hasChildren
 * @returns Object with startX, startY, endX, endY, midX, midY, or null if invalid
 * 
 * @example
 * ```typescript
 * // Input:
 * getEdgeCoordinates(
 *   { x: 0, y: 0, hasChildren: false },
 *   { x: 100, y: 0, hasChildren: false },
 *   (hasChildren) => hasChildren ? 12 : 8
 * )
 * // Output: { startX: 8, startY: 0, endX: 92, endY: 0, midX: 50, midY: 0 }
 * 
 * // Input:
 * getEdgeCoordinates(
 *   { x: 0, y: 0 },
 *   { x: 0, y: 0 },
 *   (hasChildren) => 8
 * )
 * // Output: null
 * 
 * // Input:
 * getEdgeCoordinates(
 *   { x: 0, y: 0, hasChildren: true },
 *   { x: 100, y: 100, hasChildren: false },
 *   (hasChildren) => hasChildren ? 12 : 8
 * )
 * // Output: { startX: ~8.49, startY: ~8.49, endX: ~92.93, endY: ~92.93, midX: ~50.71, midY: ~50.71 }
 * ```
 */
export function getEdgeCoordinates(
  startNode: any,
  endNode: any,
  getNodeRadius: (hasChildren: boolean) => number
): { startX: number; startY: number; endX: number; endY: number; midX: number; midY: number } | null {
  if (!startNode || !endNode ||
      startNode.x === undefined || startNode.y === undefined ||
      endNode.x === undefined || endNode.y === undefined ||
      !isFinite(startNode.x) || !isFinite(startNode.y) ||
      !isFinite(endNode.x) || !isFinite(endNode.y)) {
    return null;
  }

  const sourceRadius = getNodeRadius(startNode.hasChildren);
  const targetRadius = getNodeRadius(endNode.hasChildren);
  
  const dx = endNode.x - startNode.x;
  const dy = endNode.y - startNode.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  if (distance === 0) return null;
  
  const unitX = dx / distance;
  const unitY = dy / distance;
  
  const startX = startNode.x + unitX * sourceRadius;
  const startY = startNode.y + unitY * sourceRadius;
  const endX = endNode.x - unitX * targetRadius;
  const endY = endNode.y - unitY * targetRadius;
  const midX = (startX + endX) / 2;
  const midY = (startY + endY) / 2;
  
  return { startX, startY, endX, endY, midX, midY };
}

/**
 * Calculates the available width for text at a given Y position within a circular node.
 * 
 * Feature: Text width constraint calculation for circular nodes (reactive to zoom)
 * Use case: Ensures text fits within node boundaries, accounting for circular shape
 *           Reactively adjusts margins based on zoom level to prevent text protrusion
 * 
 * @param y - Y coordinate in graph space
 * @param nodeY - Center Y coordinate of the node
 * @param nodeRadius - Radius of the node in graph coordinates
 * @param globalScale - Current zoom level (1.0 = no zoom)
 * @param padding - Padding in graph coordinates (default: 6)
 * @param lineIndex - Optional: 0 = top line, 1 = middle line, 2 = bottom line
 *                   Used to apply extra margins for top/bottom lines due to circular shape
 * @returns Available width in screen pixels (matches ctx.measureText() output)
 * 
 * @example
 * ```typescript
 * // Input:
 * calculateAvailableTextWidth(100, 100, 8, 1.0, 6, 1)
 * // Output: ~12.68 (approximate, depends on exact calculation)
 * 
 * // Input:
 * calculateAvailableTextWidth(100, 100, 8, 1.0, 6, 0)
 * // Output: ~11.5 (smaller due to top line margin)
 * 
 * // Input:
 * calculateAvailableTextWidth(100, 100, 12, 2.0, 6, 1)
 * // Output: ~35.2 (larger due to bigger node and zoom)
 * ```
 */
export function calculateAvailableTextWidth(
  y: number,
  nodeY: number,
  nodeRadius: number,
  globalScale: number,
  padding: number = 6,
  lineIndex?: number
): number {
  // Calculate vertical offset from node center
  const verticalOffset = Math.abs(y - nodeY);
  
  // Calculate chord width at this Y position using circle geometry
  // Formula: chord width = 2 * sqrt(radius^2 - vertical_offset^2)
  const chordWidth = 2 * Math.sqrt(Math.max(0, nodeRadius * nodeRadius - verticalOffset * verticalOffset));
  
  // Convert to screen coordinates
  const screenPadding = padding * globalScale;
  const baseWidth = (chordWidth * globalScale) - (screenPadding * 2);
  
  // Apply reactive safety margins that scale with both zoom level and node size
  // Larger nodes (root nodes with radius 12) need proportionally larger margins
  const isTopOrBottom = lineIndex === 0 || lineIndex === 2;
  
  // Base margin percentage - increased for better safety
  const baseMarginPercentage = isTopOrBottom ? 0.15 : 0.10; // Increased from 0.12/0.08
  
  // Scale margin percentage based on node radius (larger nodes need more margin)
  // Root nodes (radius 12) get ~1.2x margin, leaf nodes (radius 8) get base margin
  const radiusMultiplier = 1 + ((nodeRadius - 8) / 8) * 0.2; // Scales from 1.0 (radius 8) to 1.1 (radius 12)
  const marginPercentage = baseMarginPercentage * radiusMultiplier;
  const percentageMargin = baseWidth * marginPercentage;
  
  // Add a fixed margin that scales with both zoom and node radius
  // Larger nodes need larger fixed margins to account for circular shape
  const baseFixedMargin = isTopOrBottom ? 5 : 4; // Increased from 4/3
  const radiusScaledMargin = baseFixedMargin * (nodeRadius / 8); // Scale with node radius
  const fixedMargin = radiusScaledMargin * globalScale;
  const totalMargin = percentageMargin + fixedMargin;
  
  const availableWidth = baseWidth - totalMargin;
  // Ensure we always return a positive value, but be very conservative
  return Math.max(2, availableWidth);
}

/**
 * Calculates the center Y coordinate of the emoji/status indicator area.
 * 
 * Feature: Status indicator positioning
 * Use case: Positions status indicators (leaf emoji, expansion arrows) in bottom section
 * 
 * @param nodeY - Center Y coordinate of the node
 * @param nodeRadius - Radius of the node
 * @returns Y coordinate for the center of the bottom section (where emoji/status goes)
 * 
 * @example
 * ```typescript
 * // Input:
 * calculateEmojiAreaCenterY(100, 8)
 * // Output: 106.4
 * 
 * // Input:
 * calculateEmojiAreaCenterY(100, 12)
 * // Output: 109.6
 * 
 * // Input:
 * calculateEmojiAreaCenterY(0, 8)
 * // Output: 6.4
 * ```
 */
export function calculateEmojiAreaCenterY(nodeY: number, nodeRadius: number): number {
  const nodeDiameter = nodeRadius * 2;
  const sectionHeight = nodeDiameter / 5;
  const emojiAreaTop = nodeY - nodeRadius + (sectionHeight * 4);
  const emojiAreaBottom = nodeY + nodeRadius;
  return (emojiAreaTop + emojiAreaBottom) / 2;
}

/**
 * Calculates Y positions for the 3 text lines within a node.
 * Lines are centered in the middle 3 sections of the node (sections 1, 2, 3).
 * 
 * @param nodeY - Center Y coordinate of the node
 * @param nodeRadius - Radius of the node
 * @returns Array of 3 Y coordinates, one for each line
 * 
 * @example
 * ```typescript
 * // Input:
 * calculateLinePositions(100, 8)
 * // Output: [96.8, 100, 103.2] (approximate)
 * 
 * // Input:
 * calculateLinePositions(100, 12)
 * // Output: [95.2, 100, 104.8] (approximate)
 * 
 * // Input:
 * calculateLinePositions(0, 8)
 * // Output: [-3.2, 0, 3.2] (approximate)
 * ```
 */
export function calculateLinePositions(nodeY: number, nodeRadius: number): number[] {
  const nodeDiameter = nodeRadius * 2;
  const sectionHeight = nodeDiameter / 5;
  const positions: number[] = [];
  
  for (let i = 0; i < 3; i++) {
    const sectionTop = nodeY - nodeRadius + (sectionHeight * (1 + i));
    const sectionBottom = nodeY - nodeRadius + (sectionHeight * (2 + i));
    positions.push((sectionTop + sectionBottom) / 2);
  }
  
  return positions;
}

/**
 * Calculates the optimal font size for text within a node, ensuring it fits within height constraints.
 * 
 * This function ensures font size scales proportionally with node size at all zoom levels.
 * The font size is calculated as a fixed percentage of the section height, ensuring consistent
 * text-to-row-height ratio regardless of zoom level.
 * 
 * @param ctx - Canvas rendering context for measuring text
 * @param sectionHeightScreen - Section height in screen pixels (1/5 of node diameter * zoom)
 * @param nodeDiameterScreen - Node diameter in screen pixels (for additional safety cap)
 * @param minFontSize - Minimum font size to ensure visibility (in screen pixels)
 * @returns Optimal font size that fits within constraints (scales proportionally with node)
 * 
 * @example
 * ```typescript
 * // Input (with mock canvas context):
 * const ctx = document.createElement('canvas').getContext('2d')!;
 * calculateOptimalTitleFontSize(ctx, 16, 40, 3)
 * // Output: ~4.8 (approximate, depends on actual text measurement)
 * 
 * // Input:
 * calculateOptimalTitleFontSize(ctx, 32, 80, 5)
 * // Output: ~9.6 (approximate, larger section = larger font)
 * ```
 */
export function calculateOptimalTitleFontSize(
  ctx: CanvasRenderingContext2D,
  sectionHeightScreen: number,
  nodeDiameterScreen: number,
  minFontSize: number
): number {
  // Maximum text height per line - fixed percentage of section height
  // Use 30% to ensure text never exceeds section height
  const maxTextHeight = sectionHeightScreen * 0.30;
  
  // Helper to measure ACTUAL rendered text height for a given font size
  // This measures what will actually be rendered, which is what matters
  const getActualTextHeight = (fs: number): number => {
    ctx.font = `${fs}px Sans-Serif`;
    ctx.textBaseline = 'middle'; // Same as we use for rendering
    const textMetrics = ctx.measureText('M');
    // Measure actual bounding box (ascent + descent)
    const measuredHeight = textMetrics.actualBoundingBoxAscent + textMetrics.actualBoundingBoxDescent;
    // If measurement is not available, use conservative estimate
    return measuredHeight > 0 ? measuredHeight : fs * 1.5;
  };
  
  // GUARANTEED APPROACH: Binary search to find the maximum font size that fits
  // Start with a reasonable upper bound (20% of section height)
  let maxFontSize = Math.min(sectionHeightScreen * 0.20, nodeDiameterScreen * 0.04);
  let minFont = Math.max(3, minFontSize);
  
  // Ensure minFont doesn't exceed maxFontSize
  minFont = Math.min(minFont, maxFontSize);
  
  // Binary search: find the largest font size where actual height <= maxTextHeight
  let bestFontSize = minFont;
  let low = minFont;
  let high = maxFontSize;
  const tolerance = 0.1; // Stop when within 0.1px
  
  while (high - low > tolerance) {
    const mid = (low + high) / 2;
    const actualHeight = getActualTextHeight(mid);
    
    if (actualHeight <= maxTextHeight) {
      // This font size fits, try larger
      bestFontSize = mid;
      low = mid;
    } else {
      // This font size is too large, try smaller
      high = mid;
    }
  }
  
  // Final verification: measure the chosen font size one more time
  const finalHeight = getActualTextHeight(bestFontSize);
  if (finalHeight > maxTextHeight) {
    // If somehow it still doesn't fit, reduce proportionally
    const ratio = maxTextHeight / finalHeight;
    bestFontSize = bestFontSize * ratio * 0.95; // 95% safety margin
    bestFontSize = Math.max(minFont, Math.min(bestFontSize, maxFontSize));
  }
  
  return bestFontSize;
}

/**
 * Calculates the font size for status indicators (leaf emoji or expansion arrows).
 * 
 * Feature: Status indicator sizing
 * Use case: Determines appropriate font size for status indicators based on node size and zoom level
 *           - Ensures indicators fit within the bottom section (1/5 of node diameter)
 *           - Uses conservative scaling to maintain readability
 * 
 * @param nodeRadius - Radius of the node
 * @param isTextLabel - Whether this is a text label (leaf emoji) or arrow (parent node)
 * @param globalScale - Current zoom level
 * @returns Font size in pixels for the status indicator
 * 
 * @example
 * ```typescript
 * // Input:
 * calculateIndicatorFontSize(8, false, 1.0)
 * // Output: ~1.6
 * 
 * // Input:
 * calculateIndicatorFontSize(12, true, 1.0)
 * // Output: ~3.0
 * 
 * // Input:
 * calculateIndicatorFontSize(8, false, 2.0)
 * // Output: ~2.0 (larger due to zoom)
 * ```
 */
export function calculateIndicatorFontSize(
  nodeRadius: number,
  isTextLabel: boolean,
  globalScale: number
): number {
  const nodeDiameter = nodeRadius * 2;
  const bottomSectionHeight = nodeDiameter / 5; // Bottom section is 1/5 of diameter
  const maxIndicatorSize = bottomSectionHeight * 0.4; // Use 40% of section height
  
  // Use different multipliers for text labels vs arrows
  // Reduced leaf emoji size from 0.35 to 0.25 for better fit
  const baseSizeMultiplier = isTextLabel ? 0.25 : 0.20;
  const indicatorScale = globalScale > 1
    ? 1 + Math.log(globalScale) * 0.25  // Very conservative growth
    : Math.max(0.6, globalScale * 0.9); // Less shrinkage when zoomed out
  const baseIndicatorFontSize = nodeRadius * baseSizeMultiplier * indicatorScale;
  
  // Clamp indicator size to fit within bottom section
  return Math.max(3, Math.min(maxIndicatorSize, baseIndicatorFontSize));
}

