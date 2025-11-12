import React, { useMemo, useEffect, useRef, useState, useCallback } from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';
import { useColorMode } from '@docusaurus/theme-common';

interface Node {
  id: string;
  label: string;
  title?: string;
  description?: string;
  group?: number;
  color?: string;
  children?: Node[];
  markdownSection?: string; // ID of markdown section this node links to
}

interface Link {
  source: string;
  target: string;
  value?: number;
  label?: string;
  id?: string; // Optional ID for anchor links
  markdownSection?: string; // ID of markdown section this edge links to
}

interface GraphData {
  nodes: Node[];
  links: Link[];
}

interface GraphRendererProps {
  data: GraphData;
  width?: number;
  height?: number;
  highlightNodeId?: string; // Optional node ID to highlight
  highlightEdgeId?: string; // Optional edge ID to highlight
  graphId?: string; // Optional unique ID for this graph instance (for URL hash support)
  onEdgeClick?: (edge: any) => void; // Optional callback when edge is clicked
  initialExpandedNodes?: Set<string>; // Optional set of node IDs to expand initially
}

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

// Debug flag to show node section separators
const DEBUG_SHOW_NODE_SECTIONS = false;

/**
 * ============================================================================
 * NODE RENDERING HELPER FUNCTIONS
 * ============================================================================
 * These functions handle the rendering of node elements (title, status indicators, etc.)
 * They are designed to be reusable and well-documented for AI navigation.
 */

/**
 * Calculates the radius of a node based on whether it has children.
 * 
 * Feature: Node sizing
 * Use case: Determines node size - parent nodes are larger (12px) than leaf nodes (8px)
 * 
 * @param hasChildren - Whether the node has child nodes
 * @returns Node radius in pixels
 */
const getNodeRadius = (hasChildren: boolean): number => {
  return hasChildren ? 12 : 8;
};

/**
 * Gets the display color for a node, falling back to default if not specified.
 * 
 * Feature: Node coloring
 * Use case: Provides consistent default color (Neo4j blue) when node color is not specified
 * 
 * @param nodeColor - Optional color from node data
 * @returns Color string (hex format)
 */
const getNodeColor = (nodeColor?: string): string => {
  return nodeColor || '#68BDF6';
};

/**
 * Extracts the display label for a node from various possible fields.
 * 
 * Feature: Node labeling
 * Use case: Gets the best available label for a node, checking title, name, and id in order
 * 
 * @param node - Node object with potential label fields
 * @returns Label string for display
 */
const getNodeLabel = (node: any): string => {
  return node.title || node.name || node.id || '';
};

/**
 * Validates that a node has valid coordinates for rendering.
 * 
 * Feature: Node coordinate validation
 * Use case: Prevents rendering errors by checking node coordinates are finite numbers
 * 
 * @param node - Node object with x, y coordinates
 * @returns True if node coordinates are valid for rendering
 */
const isValidNodeCoordinates = (node: any): boolean => {
  return node.x !== undefined && 
         node.y !== undefined && 
         isFinite(node.x) && 
         isFinite(node.y);
};

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
 */
const calculateAvailableTextWidth = (
  y: number,
  nodeY: number,
  nodeRadius: number,
  globalScale: number,
  padding: number = 6,
  lineIndex?: number
): number => {
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
};

/**
 * Calculates the center Y coordinate of the emoji/status indicator area.
 * 
 * Feature: Status indicator positioning
 * Use case: Positions status indicators (leaf emoji, expansion arrows) in bottom section
 * 
 * @param nodeY - Center Y coordinate of the node
 * @param nodeRadius - Radius of the node
 * @returns Y coordinate for the center of the bottom section (where emoji/status goes)
 */
const calculateEmojiAreaCenterY = (nodeY: number, nodeRadius: number): number => {
  const nodeDiameter = nodeRadius * 2;
  const sectionHeight = nodeDiameter / 5;
  const emojiAreaTop = nodeY - nodeRadius + (sectionHeight * 4);
  const emojiAreaBottom = nodeY + nodeRadius;
  return (emojiAreaTop + emojiAreaBottom) / 2;
};

/**
 * Determines the status indicator symbol and type for a node.
 * 
 * Feature: Node status visualization
 * Use case: Shows expansion state for parent nodes, leaf indicator for leaf nodes
 * 
 * @param hasChildren - Whether the node has child nodes
 * @param isExpanded - Whether the node is currently expanded (only relevant if hasChildren)
 * @returns Object with statusIndicator (string) and isTextLabel (boolean)
 */
const getNodeStatusIndicator = (
  hasChildren: boolean,
  isExpanded: boolean
): { statusIndicator: string; isTextLabel: boolean } => {
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
};

/**
 * Draws the node circle with optional highlight glow.
 * 
 * Feature: Node visual representation
 * Use case: Renders the circular node background with optional highlight effect
 * 
 * @param ctx - Canvas rendering context
 * @param nodeX - X coordinate of node center
 * @param nodeY - Y coordinate of node center
 * @param nodeRadius - Radius of the node
 * @param nodeColor - Fill color for the node
 * @param isHighlighted - Whether to draw highlight glow
 * @param isDarkMode - Whether dark mode is active (affects glow color)
 * @param borderColor - Color for node border
 * @param globalScale - Current zoom level (for border width scaling)
 */
const drawNodeCircle = (
  ctx: CanvasRenderingContext2D,
  nodeX: number,
  nodeY: number,
  nodeRadius: number,
  nodeColor: string,
  isHighlighted: boolean,
  isDarkMode: boolean,
  borderColor: string,
  globalScale: number
): void => {
  // Draw highlight glow for highlighted nodes
  if (isHighlighted) {
    const glowRadius = nodeRadius + 4;
    const gradient = ctx.createRadialGradient(nodeX, nodeY, nodeRadius, nodeX, nodeY, glowRadius);
    gradient.addColorStop(0, isDarkMode ? 'rgba(255, 215, 0, 0.8)' : 'rgba(255, 215, 0, 0.6)');
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(nodeX, nodeY, glowRadius, 0, 2 * Math.PI, false);
    ctx.fill();
  }
  
  // Draw node circle
  ctx.fillStyle = nodeColor;
  ctx.beginPath();
  ctx.arc(nodeX, nodeY, nodeRadius, 0, 2 * Math.PI, false);
  ctx.fill();
  
  // Draw node border (thicker and colored for highlighted nodes)
  if (isHighlighted) {
    ctx.strokeStyle = isDarkMode ? '#FFD700' : '#FFA500';
    ctx.lineWidth = 4 / globalScale;
  } else {
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 2 / globalScale;
  }
  ctx.stroke();
};

/**
 * Draws debug section separators to visualize the 5 horizontal sections of a node.
 * 
 * Feature: Debug visualization
 * Use case: Helps visualize node layout during development (top section, 3 middle sections, bottom section)
 * 
 * @param ctx - Canvas rendering context
 * @param nodeX - X coordinate of node center
 * @param nodeY - Y coordinate of node center
 * @param nodeRadius - Radius of the node
 * @param globalScale - Current zoom level (for line width scaling)
 */
const drawDebugSectionSeparators = (
  ctx: CanvasRenderingContext2D,
  nodeX: number,
  nodeY: number,
  nodeRadius: number,
  globalScale: number
): void => {
  if (!DEBUG_SHOW_NODE_SECTIONS) return;
  
  const nodeDiameter = nodeRadius * 2;
  const sectionHeight = nodeDiameter / 5;
  
  ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
  ctx.lineWidth = 2 / globalScale;
  const dashSize = 3 / globalScale;
  ctx.setLineDash([dashSize, dashSize]);
  
  // Draw 4 separator lines (dividing 5 sections)
  for (let i = 1; i < 5; i++) {
    const y = nodeY - nodeRadius + (sectionHeight * i);
    ctx.beginPath();
    // Calculate x positions for the line endpoints on the circle
    const angle = Math.asin((y - nodeY) / nodeRadius);
    const xOffset = Math.cos(angle) * nodeRadius;
    ctx.moveTo(nodeX - xOffset, y);
    ctx.lineTo(nodeX + xOffset, y);
    ctx.stroke();
  }
  
  ctx.setLineDash([]); // Reset line dash
};

/**
 * Calculates Y positions for the 3 text lines within a node.
 * Lines are centered in the middle 3 sections of the node (sections 1, 2, 3).
 * 
 * @param nodeY - Center Y coordinate of the node
 * @param nodeRadius - Radius of the node
 * @returns Array of 3 Y coordinates, one for each line
 */
const calculateLinePositions = (nodeY: number, nodeRadius: number): number[] => {
  const nodeDiameter = nodeRadius * 2;
  const sectionHeight = nodeDiameter / 5;
  const positions: number[] = [];
  
  for (let i = 0; i < 3; i++) {
    const sectionTop = nodeY - nodeRadius + (sectionHeight * (1 + i));
    const sectionBottom = nodeY - nodeRadius + (sectionHeight * (2 + i));
    positions.push((sectionTop + sectionBottom) / 2);
  }
  
  return positions;
};

/**
 * Breaks a long word into chunks that fit within the available width.
 * Only breaks at natural boundaries (hyphens, underscores, camelCase).
 * If no natural break exists and the word doesn't fit, returns empty array
 * (caller should truncate with ellipsis instead).
 * 
 * @param word - Word to break
 * @param ctx - Canvas context for measuring text
 * @param availableWidth - Maximum width available
 * @returns Array of word chunks that fit, or empty array if word can't be broken naturally
 */
const breakLongWord = (
  word: string,
  ctx: CanvasRenderingContext2D,
  availableWidth: number
): string[] => {
  if (ctx.measureText(word).width <= availableWidth) {
    return [word];
  }
  
  const chunks: string[] = [];
  let remaining = word;
  
  while (remaining.length > 0) {
    // Try to find a natural break point
    let bestBreakIndex = -1;
    let bestBreakLength = 0;
    
    // Check for hyphens/underscores first (preferred)
    const hyphenMatch = remaining.search(/[-_]/);
    if (hyphenMatch > 0 && hyphenMatch < remaining.length - 1) {
      const beforeBreak = remaining.substring(0, hyphenMatch + 1);
      if (ctx.measureText(beforeBreak).width <= availableWidth) {
        bestBreakIndex = hyphenMatch + 1;
        bestBreakLength = hyphenMatch + 1;
      }
    }
    
    // If no good hyphen break, try camelCase/PascalCase breaks
    if (bestBreakIndex === -1) {
      for (let i = 1; i < remaining.length; i++) {
        // Check for camelCase: lowercase followed by uppercase
        if (remaining[i - 1].match(/[a-z]/) && remaining[i].match(/[A-Z]/)) {
          const beforeBreak = remaining.substring(0, i);
          if (ctx.measureText(beforeBreak).width <= availableWidth) {
            bestBreakIndex = i;
            bestBreakLength = i;
          } else {
            break; // Can't fit even this, stop looking
          }
        }
        // Check for PascalCase: uppercase followed by uppercase+lowercase
        else if (i < remaining.length - 1 && 
                 remaining[i - 1].match(/[A-Z]/) && 
                 remaining[i].match(/[A-Z]/) && 
                 remaining[i + 1].match(/[a-z]/)) {
          const beforeBreak = remaining.substring(0, i);
          if (ctx.measureText(beforeBreak).width <= availableWidth) {
            bestBreakIndex = i;
            bestBreakLength = i;
          } else {
            break;
          }
        }
      }
    }
    
    // If we found a natural break, use it
    if (bestBreakIndex > 0) {
      const chunk = remaining.substring(0, bestBreakLength);
      chunks.push(chunk);
      remaining = remaining.substring(bestBreakLength);
      continue;
    }
    
    // No natural break found - return empty array to signal caller should truncate
    // Don't break character by character
    return [];
  }
  
  return chunks;
};

/**
 * Wraps text into up to 3 lines, distributing words across lines.
 * Implements CSS-like word-wrap: break-word behavior for long words.
 * 
 * @param text - Text to wrap
 * @param ctx - Canvas context for measuring text
 * @param fontSize - Current font size
 * @param linePositions - Y positions for each line
 * @param getAvailableWidth - Function to get available width at a Y position
 * @returns Array of text lines (up to 3)
 */
const wrapTextIntoLines = (
  text: string,
  ctx: CanvasRenderingContext2D,
  fontSize: number,
  linePositions: number[],
  getAvailableWidth: (y: number, lineIndex: number) => number
): string[] => {
  const words = text.trim().split(/\s+/).filter(w => w.length > 0);
  if (words.length === 0) return [];
  
  ctx.font = `${fontSize}px Sans-Serif`;
  const lines: string[] = [];
  let currentLine = '';
  const wordsPerLine = Math.max(1, Math.floor(words.length / 3));
  
  for (let wordIndex = 0; wordIndex < words.length; wordIndex++) {
    const word = words[wordIndex];
    
    if (lines.length >= 3) {
      // Try to add remaining words to last line if space allows
      if (currentLine) {
        const remainingWords = words.slice(wordIndex).join(' ');
        const testLine = `${currentLine} ${remainingWords}`;
        const lastLineY = linePositions[2];
        const availableWidth = getAvailableWidth(lastLineY, 2);
        if (ctx.measureText(testLine).width <= availableWidth) {
          lines[lines.length - 1] = testLine;
        } else {
          lines[lines.length - 1] = currentLine;
        }
      }
      break;
    }
    
    const lineIndex = lines.length;
    const lineY = linePositions[lineIndex];
    const availableWidth = getAvailableWidth(lineY, lineIndex);
    
    // Check if the word itself is too long
    const wordWidth = ctx.measureText(word).width;
    if (wordWidth > availableWidth) {
      // Word is too long, try to break it at natural boundaries
      if (currentLine) {
        // Save current line and start breaking the word
        lines.push(currentLine);
        currentLine = '';
      }
      
      // Try to break the long word into chunks at natural boundaries
      const wordChunks = breakLongWord(word, ctx, availableWidth);
      
      // If word can be broken naturally, use the chunks
      if (wordChunks.length > 0) {
        // Add as many chunks as we can fit in remaining lines
        for (let chunkIndex = 0; chunkIndex < wordChunks.length && lines.length < 3; chunkIndex++) {
          const chunk = wordChunks[chunkIndex];
          if (lines.length < 3) {
            lines.push(chunk);
          } else {
            // No more lines, add to last line if it fits
            const lastLineY = linePositions[2];
            const lastLineAvailableWidth = getAvailableWidth(lastLineY, 2);
            if (ctx.measureText(chunk).width <= lastLineAvailableWidth) {
              lines[lines.length - 1] = chunk;
            }
          }
        }
      } else {
        // Word can't be broken naturally - truncate with ellipsis
        const truncated = truncateLine(ctx, word, availableWidth);
        if (truncated && truncated.trim().length > 0) {
          lines.push(truncated);
        }
      }
      
      // Continue with next word
      continue;
    }
    
    // Normal word wrapping logic
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = ctx.measureText(testLine).width;
    const currentWords = testLine.split(/\s+/).length;
    
    const shouldWrapByWordCount = currentWords > wordsPerLine && lines.length < 3 && wordIndex < words.length - 1;
    const shouldWrapByWidth = testWidth > availableWidth;
    
    if ((shouldWrapByWordCount || shouldWrapByWidth) && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  
  if (currentLine && lines.length < 3) {
    lines.push(currentLine);
  }
  
  if (lines.length === 0 && words.length > 0) {
    lines.push(words[0]);
  }
  
  return lines;
};

/**
 * Finds the optimal font size that ensures all non-last lines fit within their available width.
 * 
 * @param ctx - Canvas context
 * @param lines - Text lines to fit
 * @param linePositions - Y positions for each line
 * @param getAvailableWidth - Function to get available width at a Y position
 * @param initialFontSize - Starting font size
 * @param minFontSize - Minimum allowed font size
 * @param maxTextHeight - Maximum allowed text height
 * @returns Optimal font size that fits all non-last lines
 */
const calculateOptimalFontSize = (
  ctx: CanvasRenderingContext2D,
  lines: string[],
  linePositions: number[],
  getAvailableWidth: (y: number, lineIndex: number) => number,
  initialFontSize: number,
  minFontSize: number,
  maxTextHeight: number
): number => {
  let fontSize = initialFontSize;
  
  // First, ensure font fits within height constraint
  ctx.font = `${fontSize}px Sans-Serif`;
  let textMetrics = ctx.measureText('M');
  let actualHeight = textMetrics.actualBoundingBoxAscent + textMetrics.actualBoundingBoxDescent || fontSize;
  
  while (actualHeight > maxTextHeight && fontSize > minFontSize) {
    fontSize = Math.max(minFontSize, fontSize - 0.5);
    ctx.font = `${fontSize}px Sans-Serif`;
    textMetrics = ctx.measureText('M');
    actualHeight = textMetrics.actualBoundingBoxAscent + textMetrics.actualBoundingBoxDescent || fontSize;
  }
  
  // Then, ensure all non-last lines fit width-wise
  // Allow font size to go slightly below minimum (to 2px) as last resort to ensure text is visible
  const absoluteMinFontSize = Math.max(2, minFontSize * 0.4);
  let attempts = 0;
  const maxAttempts = 50;
  let allFit = false;
  
  while (!allFit && fontSize >= absoluteMinFontSize && attempts < maxAttempts) {
    attempts++;
    allFit = true;
    ctx.font = `${fontSize}px Sans-Serif`;
    
    for (let i = 0; i < lines.length - 1; i++) {
      const line = lines[i];
      const lineY = linePositions[i];
      const availableWidth = getAvailableWidth(lineY, i);
      const lineWidth = ctx.measureText(line).width;
      
      if (lineWidth > availableWidth) {
        allFit = false;
        fontSize = Math.max(absoluteMinFontSize, fontSize - 0.5);
        break;
      }
    }
  }
  
  // Ensure we return at least the absolute minimum, but prefer the regular minimum
  return Math.max(absoluteMinFontSize, fontSize);
};

/**
 * Optionally scales font size with zoom level, ensuring it still fits within constraints.
 * 
 * @param ctx - Canvas context
 * @param baseFontSize - Base font size in screen pixels (already scaled by globalScale)
 * @param lines - Text lines
 * @param linePositions - Y positions for each line
 * @param getAvailableWidth - Function to get available width at a Y position
 * @param globalScale - Current zoom level
 * @param minFontSize - Minimum allowed font size in screen pixels
 * @param maxTextHeight - Maximum allowed text height in screen pixels
 * @returns Scaled font size (or base size if scaling doesn't fit)
 */
const applyZoomScaling = (
  ctx: CanvasRenderingContext2D,
  baseFontSize: number,
  lines: string[],
  linePositions: number[],
  getAvailableWidth: (y: number, lineIndex: number) => number,
  globalScale: number,
  minFontSize: number,
  maxTextHeight: number
): number => {
  // When zoomed out (globalScale < 1), just return base size (already scaled)
  if (globalScale <= 1) {
    return baseFontSize;
  }
  
  // When zoomed in moderately (1 < globalScale < 2), try to scale up conservatively
  if (globalScale >= 2) {
    return baseFontSize; // Don't scale at high zoom levels
  }
  
  const scaledFontSize = baseFontSize * (1 + Math.log(globalScale) * 0.1);
  let testFontSize = Math.max(minFontSize, scaledFontSize);
  const maxIterations = 100;
  const reductionStep = 0.15;
  let iterations = 0;
  
  while (testFontSize >= baseFontSize && iterations < maxIterations) {
    iterations++;
    ctx.font = `${testFontSize}px Sans-Serif`;
    
    // Check height constraint
    const textMetrics = ctx.measureText('M');
    const actualHeight = textMetrics.actualBoundingBoxAscent + textMetrics.actualBoundingBoxDescent || testFontSize;
    if (actualHeight > maxTextHeight) {
      testFontSize = Math.max(baseFontSize, testFontSize - reductionStep);
      continue;
    }
    
    // Check width constraints for non-last lines
    const safetyMargin = 8;
    let allFit = true;
    for (let i = 0; i < lines.length - 1; i++) {
      const line = lines[i];
      const lineY = linePositions[i];
      const availableWidth = getAvailableWidth(lineY, i);
      const lineWidth = ctx.measureText(line).width;
      
      if (lineWidth + safetyMargin > availableWidth) {
        allFit = false;
        break;
      }
    }
    
    if (allFit) {
      return testFontSize;
    }
    
    testFontSize = Math.max(baseFontSize, testFontSize - reductionStep);
  }
  
  return baseFontSize;
};

/**
 * Truncates a line of text to fit within available width, adding ellipsis if needed.
 * 
 * @param ctx - Canvas context
 * @param line - Text line to truncate
 * @param maxWidth - Maximum available width
 * @returns Truncated line with ellipsis if needed
 */
const truncateLine = (
  ctx: CanvasRenderingContext2D,
  line: string,
  maxWidth: number
): string => {
  const ellipsis = '...';
  const ellipsisWidth = ctx.measureText(ellipsis).width;
  const maxLineWidth = maxWidth - ellipsisWidth;
  const MIN_CHARS_BEFORE_ELLIPSIS = 20; // Minimum characters to show before ellipsis
  
  if (ctx.measureText(line).width <= maxWidth) {
    return line;
  }
  
  // If even ellipsis alone doesn't fit, return empty string (caller should handle)
  if (ellipsisWidth > maxWidth) {
    return '';
  }
  
  // Check if we can fit at least MIN_CHARS_BEFORE_ELLIPSIS + ellipsis
  const minTextNeeded = line.substring(0, Math.min(MIN_CHARS_BEFORE_ELLIPSIS, line.length));
  const minWidthNeeded = ctx.measureText(minTextNeeded + ellipsis).width;
  
  if (maxWidth < minWidthNeeded) {
    // Can't fit minimum required characters + ellipsis
    // Try to show as much as possible without ellipsis
    let truncated = line;
    while (truncated.length > 0 && ctx.measureText(truncated).width > maxWidth) {
      truncated = truncated.substring(0, truncated.length - 1);
    }
    // If we can fit at least some text without ellipsis, return it
    if (truncated.length > 0) {
      return truncated;
    }
    // Otherwise return empty (caller should handle)
    return '';
  }
  
  // We can fit at least MIN_CHARS_BEFORE_ELLIPSIS + ellipsis
  // Start with the first MIN_CHARS_BEFORE_ELLIPSIS characters
  let truncated = line.substring(0, Math.min(MIN_CHARS_BEFORE_ELLIPSIS, line.length));
  
  // If the minimum text + ellipsis fits, try to add more characters
  while (truncated.length < line.length && ctx.measureText(truncated + line[truncated.length] + ellipsis).width <= maxWidth) {
    truncated = truncated + line[truncated.length];
  }
  
  // If we couldn't fit even the minimum, fall back to showing as much as possible
  if (truncated.length < MIN_CHARS_BEFORE_ELLIPSIS && ctx.measureText(truncated + ellipsis).width > maxWidth) {
    // This shouldn't happen given our check above, but handle it gracefully
    truncated = line.substring(0, MIN_CHARS_BEFORE_ELLIPSIS);
    while (truncated.length > 0 && ctx.measureText(truncated + ellipsis).width > maxWidth) {
      truncated = truncated.substring(0, truncated.length - 1);
    }
    if (truncated.length === 0) {
      return '';
    }
  }
  
  return truncated + ellipsis;
};

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
 */
const calculateOptimalTitleFontSize = (
  ctx: CanvasRenderingContext2D,
  sectionHeightScreen: number,
  nodeDiameterScreen: number,
  minFontSize: number
): number => {
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
};

/**
 * Draws the title text within a node, displaying only the first 20 characters across 3 lines.
 * 
 * Simplified title rendering that:
 * - Shows only first 20 characters of the title
 * - Adds ellipsis if title is longer than 20 characters
 * - Distributes text across up to 3 lines
 * - Scales reactively with zoom level
 * - Uses canvas clipping to guarantee text never protrudes outside node circle
 * 
 * @param ctx - Canvas rendering context
 * @param node - Node object with x, y coordinates
 * @param nodeRadius - Radius of the node in graph coordinates
 * @param labelStr - Text to display (title/label)
 * @param fontSize - Base font size (unused, kept for API compatibility)
 * @param globalScale - Current zoom level (1.0 = no zoom)
 * @returns Y coordinate of emoji area center (for status indicator positioning)
 */
const drawTitle = (
  ctx: CanvasRenderingContext2D,
  node: any,
  nodeRadius: number,
  labelStr: string,
  fontSize: number,
  globalScale: number
): number => {
  const nodeDiameter = nodeRadius * 2;
  const sectionHeight = nodeDiameter / 5; // Each section is 1/5 of diameter
  const emojiAreaCenterY = calculateEmojiAreaCenterY(node.y, nodeRadius);
  
  // Early return if no text
  if (!labelStr || !labelStr.trim()) {
    return emojiAreaCenterY;
  }
  
  // Truncate to first 60 characters, replace last 3 chars with ellipsis if longer
  // This allows more text to be shown before pixel-based truncation happens
  // The pixel-based truncation will ensure at least 20 chars before ellipsis
  const MAX_CHARS = 60;
  const trimmed = labelStr.trim();
  
  console.log('[drawTitle] START', { 
    nodeId: node.id, 
    originalLabel: labelStr, 
    trimmed, 
    trimmedLength: trimmed.length 
  });
  
  // Ensure we have actual text content
  if (trimmed.length === 0) {
    console.log('[drawTitle] EARLY RETURN: empty trimmed text');
    return emojiAreaCenterY;
  }
  
  const displayText = trimmed.length > MAX_CHARS 
    ? trimmed.substring(0, MAX_CHARS - 3) + '...'  // Replace last 3 chars with ellipsis
    : trimmed;
  
  console.log('[drawTitle] Display text prepared', { 
    displayText, 
    displayTextLength: displayText.length,
    hasEllipsis: displayText.endsWith('...')
  });
  
  // Save current canvas state for clipping
  ctx.save();
  
  // Set up clipping path to ensure text never protrudes outside the node circle
  ctx.beginPath();
  ctx.arc(node.x, node.y, nodeRadius, 0, 2 * Math.PI);
  ctx.clip();
  
  try {
    // Calculate dimensions in screen pixels (accounting for zoom)
    const sectionHeightScreen = sectionHeight * globalScale;
    const nodeDiameterScreen = nodeDiameter * globalScale;
    
    // Minimum font size as a fixed percentage of section height
    const minFontSizeRatio = 0.12; // 12% of section height
    const minFontSize = Math.max(3, sectionHeightScreen * minFontSizeRatio);
    
    // Calculate optimal font size that fits within height constraints
    const optimalFontSize = calculateOptimalTitleFontSize(
      ctx,
      sectionHeightScreen,
      nodeDiameterScreen,
      minFontSize
    );
    
    // Calculate line positions and available widths
    const linePositions = calculateLinePositions(node.y, nodeRadius);
    const getAvailableWidth = (y: number, lineIndex: number): number => {
      return calculateAvailableTextWidth(y, node.y, nodeRadius, globalScale, 6, lineIndex);
    };
    
    // Helper to distribute text across lines
    const distributeText = (text: string, targetLines: number): string[] => {
      console.log('[distributeText] START', { text, textLength: text.length, targetLines });
      
      if (!text || text.length === 0) {
        console.log('[distributeText] EARLY RETURN: empty text');
        return [];
      }
      
      // If text is short enough, just return it as a single line
      // Don't break up text that's already short (less than ~10 chars per line would be)
      if (text.length <= 10) {
        console.log('[distributeText] Short text, returning as single line', { text });
        return [text];
      }
      
      const result: string[] = [];
      const charsPerLine = Math.ceil(text.length / targetLines);
      const words = text.split(/\s+/);
      
      console.log('[distributeText] Distribution params', { 
        charsPerLine, 
        wordsCount: words.length, 
        words 
      });
      
      // Check if text ends with ellipsis - we want to keep it with the last word
      const hasEllipsis = text.endsWith('...');
      
      // Try to break at word boundaries first
      if (words.length > 1) {
        let currentLine = '';
        for (let i = 0; i < words.length; i++) {
          const word = words[i];
          const isLastWord = i === words.length - 1;
          const testLine = currentLine ? `${currentLine} ${word}` : word;
          
          // If adding this word would exceed chars per line and we haven't filled all lines yet, start new line
          // But don't break if this is the last word and it contains ellipsis (keep ellipsis with text)
          if (testLine.length > charsPerLine && currentLine && result.length < targetLines - 1) {
            // Don't break if we're on the last word and it has ellipsis
            if (!(isLastWord && hasEllipsis)) {
              result.push(currentLine);
              currentLine = word;
            } else {
              currentLine = testLine;
            }
          } else {
            currentLine = testLine;
          }
        }
        if (currentLine) {
          result.push(currentLine);
        }
      } else {
        // Single word or no spaces - break character by character, but keep ellipsis together
        if (hasEllipsis && text.length > 3) {
          // Keep ellipsis with the last chunk - ensure last chunk has at least some text before ellipsis
          const textWithoutEllipsis = text.substring(0, text.length - 3);
          const remainingChars = textWithoutEllipsis.length;
          
          // If remaining text is very short, don't break it up
          if (remainingChars <= 7) {
            console.log('[distributeText] Short text with ellipsis, returning as single line', { text });
            return [text]; // Return whole text with ellipsis
          }
          
          const charsPerLineForText = Math.ceil(remainingChars / targetLines);
          
          for (let i = 0; i < remainingChars; i += charsPerLineForText) {
            const chunk = textWithoutEllipsis.substring(i, i + charsPerLineForText);
            if (i + charsPerLineForText >= remainingChars) {
              // Last chunk - add ellipsis, but ensure it has at least 1 char before ellipsis
              if (chunk.length > 0) {
                result.push(chunk + '...');
              } else {
                // If chunk is empty, add ellipsis to previous chunk or create a line with at least 1 char
                if (result.length > 0) {
                  result[result.length - 1] = result[result.length - 1] + '...';
                } else {
                  // This shouldn't happen, but safety check
                  console.log('[distributeText] WARNING: empty chunk, returning original text', { text });
                  return [text];
                }
              }
            } else {
              result.push(chunk);
            }
          }
        } else {
          // No ellipsis or very short text - break normally
          for (let i = 0; i < text.length; i += charsPerLine) {
            result.push(text.substring(i, i + charsPerLine));
          }
        }
      }
      
      console.log('[distributeText] Result before filtering', { result, resultLength: result.length });
      
      // Filter out empty lines and lines that are only ellipsis
      const filtered = result.filter(line => {
        const trimmed = line.trim();
        if (trimmed.length === 0 || trimmed === '...') {
          return false;
        }
        // Ensure there's at least one character before ellipsis (if ellipsis is present)
        if (trimmed.endsWith('...')) {
          const textBeforeEllipsis = trimmed.substring(0, trimmed.length - 3);
          return textBeforeEllipsis.length > 0;
        }
        return true;
      });
      
      // Return filtered lines (max 3)
      const finalResult = filtered.slice(0, 3);
      console.log('[distributeText] FINAL RESULT', { finalResult, finalResultLength: finalResult.length });
      
      return finalResult;
    };
    
    const lines: string[] = [];
    
    // Initial distribution
    let finalFontSize = optimalFontSize;
    const radiusScaleFactor = 1 - ((nodeRadius - 8) / 8) * 0.05;
    const maxTextHeight = sectionHeightScreen * 0.28 * radiusScaleFactor;
    const baseMaxFontSizeCap = Math.min(sectionHeightScreen * 0.18, nodeDiameterScreen * 0.035);
    const maxFontSizeCap = baseMaxFontSizeCap * radiusScaleFactor;
    const effectiveMinFontSize = Math.max(3, Math.min(minFontSize, maxFontSizeCap));
    
    // Helper to measure actual rendered text height
    const getActualTextHeight = (fs: number): number => {
      ctx.font = `${fs}px Sans-Serif`;
      ctx.textBaseline = 'middle';
      const metrics = ctx.measureText('M');
      const measuredHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
      return measuredHeight > 0 ? measuredHeight : fs * 1.5;
    };
    
    // Initial distribution - always call distributeText at least once
    ctx.font = `${finalFontSize}px Sans-Serif`;
    const initialDistributed = distributeText(displayText, 3);
    lines.push(...initialDistributed);
    
    console.log('[drawTitle] Initial distribution', {
      finalFontSize,
      linesCount: lines.length,
      lines
    });
    
    // Check if initial distribution fits
    let allFit = false;
    if (lines.length > 0) {
      allFit = true;
      for (let i = 0; i < lines.length && i < 3; i++) {
        const line = lines[i];
        const lineY = linePositions[i];
        const availableWidth = getAvailableWidth(lineY, i);
        const lineWidth = ctx.measureText(line).width;
        if (lineWidth > availableWidth * 0.98) {
          allFit = false;
          break;
        }
      }
    }
    
    // Adjust font size to fit width constraints
    let attempts = 0;
    const maxAttempts = 30;
    
    while (!allFit && finalFontSize >= effectiveMinFontSize && attempts < maxAttempts) {
      attempts++;
      allFit = true;
      
      // Verify height constraint
      const actualHeight = getActualTextHeight(finalFontSize);
      if (actualHeight > maxTextHeight) {
        const ratio = maxTextHeight / actualHeight;
        finalFontSize = finalFontSize * ratio * 0.90;
        finalFontSize = Math.max(effectiveMinFontSize, Math.min(finalFontSize, maxFontSizeCap));
        continue;
      }
      
      // Set font and distribute text
      ctx.font = `${finalFontSize}px Sans-Serif`;
      lines.length = 0;
      const distributed = distributeText(displayText, 3);
      lines.push(...distributed);
      
      console.log('[drawTitle] Font size adjustment loop', {
        attempt: attempts,
        finalFontSize,
        linesCount: lines.length,
        lines
      });
      
      // Check if all lines fit width-wise
      for (let i = 0; i < lines.length && i < 3; i++) {
        const line = lines[i];
        const lineY = linePositions[i];
        const availableWidth = getAvailableWidth(lineY, i);
        const lineWidth = ctx.measureText(line).width;
        
        console.log('[drawTitle] Line width check', {
          lineIndex: i,
          line,
          lineY,
          availableWidth,
          lineWidth,
          fits: lineWidth <= availableWidth * 0.98
        });
        
        if (lineWidth > availableWidth * 0.98) {
          allFit = false;
          break;
        }
      }
      
      if (!allFit) {
        const newFontSize = Math.max(effectiveMinFontSize, finalFontSize - 0.5);
        const newHeight = getActualTextHeight(newFontSize);
        if (newHeight <= maxTextHeight) {
          finalFontSize = Math.min(newFontSize, maxFontSizeCap);
        } else {
          break;
        }
      }
    }
    
    // Final font size verification
    let actualHeight = getActualTextHeight(finalFontSize);
    if (actualHeight > maxTextHeight) {
      const ratio = maxTextHeight / actualHeight;
      finalFontSize = finalFontSize * ratio * 0.90;
      finalFontSize = Math.max(effectiveMinFontSize, Math.min(finalFontSize, maxFontSizeCap));
      ctx.font = `${finalFontSize}px Sans-Serif`;
      lines.length = 0;
      const distributed = distributeText(displayText, 3);
      lines.push(...distributed);
    }
    
    // Set font for drawing
    ctx.font = `${finalFontSize}px Sans-Serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    
    console.log('[drawTitle] FINAL DRAWING STATE', {
      finalFontSize,
      linesCount: lines.length,
      lines,
      nodeX: node.x,
      nodeY: node.y,
      nodeRadius,
      globalScale
    });
    
    // Draw each line
    for (let i = 0; i < 3 && i < lines.length; i++) {
      const line = lines[i];
      
      console.log('[drawTitle] Drawing line', {
        lineIndex: i,
        line,
        lineLength: line ? line.length : 0,
        lineTrimmed: line ? line.trim() : null
      });
      
      if (!line || !line.trim() || line.trim() === '...') {
        console.log('[drawTitle] Skipping empty or ellipsis-only line', { lineIndex: i, line });
        continue;
      }
      
      const lineY = linePositions[i];
      const availableWidth = getAvailableWidth(lineY, i);
      const lineWidth = ctx.measureText(line).width;
      
      console.log('[drawTitle] Line measurements', {
        lineIndex: i,
        line,
        lineY,
        availableWidth,
        lineWidth,
        needsTruncation: lineWidth > availableWidth * 0.98
      });
      
      // Truncate if line doesn't fit
      if (lineWidth > availableWidth * 0.98) {
        const truncated = truncateLine(ctx, line, availableWidth * 0.98);
        console.log('[drawTitle] Truncating line', {
          lineIndex: i,
          original: line,
          truncated,
          truncatedLength: truncated ? truncated.length : 0
        });
        
        // Ensure we have meaningful text (not just ellipsis or empty)
        // If truncated line has ellipsis, ensure it has at least 20 characters before it
        if (truncated && truncated.trim().length > 3 && truncated !== '...') {
          const textBeforeEllipsis = truncated.replace('...', '');
          const hasEllipsis = truncated.endsWith('...');
          
          // If ellipsis is present, ensure we have at least 20 characters before it
          if (hasEllipsis && textBeforeEllipsis.length < 20) {
            console.log('[drawTitle] NOT drawing truncated line (less than 20 chars before ellipsis)', {
              lineIndex: i,
              truncated,
              textBeforeEllipsisLength: textBeforeEllipsis.length
            });
          } else if (textBeforeEllipsis.length > 0) {
            console.log('[drawTitle] Drawing truncated line', {
              lineIndex: i,
              truncated,
              textBeforeEllipsisLength: textBeforeEllipsis.length,
              x: node.x,
              y: lineY
            });
            ctx.fillText(truncated, node.x, lineY);
          } else {
            console.log('[drawTitle] NOT drawing truncated line (only ellipsis)', {
              lineIndex: i,
              truncated
            });
          }
        } else {
          console.log('[drawTitle] NOT drawing truncated line (empty or invalid result)', {
            lineIndex: i,
            truncated
          });
        }
        break;
      } else {
        console.log('[drawTitle] Drawing line as-is', {
          lineIndex: i,
          line,
          x: node.x,
          y: lineY
        });
        ctx.fillText(line, node.x, lineY);
      }
    }
    
    console.log('[drawTitle] DRAWING COMPLETE', { nodeId: node.id });
  } finally {
    // Always restore canvas state (removes clipping)
    ctx.restore();
  }
  
  return emojiAreaCenterY;
};

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
 */
const calculateIndicatorFontSize = (
  nodeRadius: number,
  isTextLabel: boolean,
  globalScale: number
): number => {
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
};

/**
 * Draws the status indicator (leaf emoji or expansion arrow) in the bottom section of a node.
 * 
 * Feature: Node status visualization
 * Use case: Displays visual indicators for node state:
 *           - Leaf nodes: Shows leaf emoji (🌿)
 *           - Parent nodes: Shows expansion arrow (▶ collapsed, ▼ expanded)
 * 
 * @param ctx - Canvas rendering context
 * @param nodeX - X coordinate of node center
 * @param emojiAreaCenterY - Y coordinate for the center of the bottom section
 * @param statusIndicator - The symbol/emoji to display
 * @param isTextLabel - Whether this is a text label (leaf) or arrow (parent)
 * @param nodeRadius - Radius of the node (for calculating font size)
 * @param indicatorFontSize - Font size for arrows (for parent nodes)
 */
const drawStatusIndicator = (
  ctx: CanvasRenderingContext2D,
  nodeX: number,
  emojiAreaCenterY: number,
  statusIndicator: string,
  isTextLabel: boolean,
  nodeRadius: number,
  indicatorFontSize: number
): void => {
  if (isTextLabel) {
    // For leaf emoji, calculate font size based on section height
    const nodeDiameter = nodeRadius * 2;
    const sectionHeight = nodeDiameter / 5;
    const textFontSize = sectionHeight * 0.15; // 15% of section height (reduced from 0.18 for smaller emoji)
    ctx.font = `${textFontSize}px Sans-Serif`;
  } else {
    // For arrows, use the provided indicator font size
    ctx.font = `${indicatorFontSize}px Sans-Serif`;
  }
  
  // Draw text/arrow centered in bottom section
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(statusIndicator, nodeX, emojiAreaCenterY);
};

const GraphRendererImpl: React.FC<GraphRendererProps> = ({ 
  data, 
  width = 800, 
  height = 600,
  highlightNodeId: propHighlightNodeId,
  highlightEdgeId: propHighlightEdgeId,
  graphId = 'graph',
  onEdgeClick,
  initialExpandedNodes
}) => {
  // Dynamically import browser-only dependencies
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ForceGraph = require('force-graph').default;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const d3 = require('d3-force');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { NodeRenderer } = require('./NodeRenderer');
  
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<any>(null);

  /**
   * Creates a reusable node rendering function for the force graph
   * This consolidates the node rendering logic to avoid duplication
   */
  const createNodeRenderer = useCallback((
    isDarkMode: boolean,
    highlightedNodeId: string | null,
    selectedNode: any,
    nodeBorderColor: string,
    expandedNodes: Set<string>
  ) => {
    return (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
      // Update node's expanded state from expandedNodes set
      node.isExpanded = expandedNodes.has(node.id);
      
      // Use NodeRenderer class to render the complete node
      const renderer = new NodeRenderer({
        ctx,
        node,
        globalScale,
        isDarkMode,
        isHighlighted: highlightedNodeId === node.id,
        isSelected: selectedNode?.id === node.id,
        nodeBorderColor,
        showDebugSeparators: DEBUG_SHOW_NODE_SECTIONS,
      });
      
      renderer.render();
    };
  }, []);

  // Helper function to clean node object (remove force-graph internal properties)
  const cleanNodeForSelection = useCallback((node: any) => {
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
  }, []);

  // Helper function to clean edge object (remove force-graph internal properties and ensure source/target are strings)
  const cleanEdgeForSelection = useCallback((link: any) => {
    // Extract source and target as strings (not node objects)
    const sourceId = typeof link.source === 'string' ? link.source : (link.source as any)?.id || String(link.source);
    const targetId = typeof link.target === 'string' ? link.target : (link.target as any)?.id || String(link.target);
    
    return {
      id: link.id,
      source: sourceId,
      target: targetId,
      label: link.label,
      value: link.value,
      type: (link as any).type,
      markdownSection: (link as any).markdownSection,
      similarities: (link as any).similarities,
      differences: (link as any).differences,
      sourceData: (link as any).sourceData,
      targetData: (link as any).targetData,
    };
  }, []);

  // Helper function to calculate edge width (same for all edges)
  const getEdgeWidth = useCallback((link: any, isHighlighted: boolean): number => {
    const baseWidth = Math.max(2, Math.sqrt(link.value || 1) * 2);
    return isHighlighted ? baseWidth * 1.5 : baseWidth;
  }, []);

  // Helper function to get edge coordinates (start/end points on node surfaces)
  const getEdgeCoordinates = useCallback((
    link: any,
    startNode: any,
    endNode: any,
    getNodeRadius: (hasChildren: boolean) => number
  ): { startX: number; startY: number; endX: number; endY: number; midX: number; midY: number } | null => {
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
  }, []);

  // Helper function to draw comparison edge (dashed, gray, no arrows)
  const drawComparisonEdge = useCallback((
    ctx: CanvasRenderingContext2D,
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    isHighlighted: boolean,
    isDarkMode: boolean,
    linkWidth: number
  ) => {
    ctx.save();
    // Longer dashes with more spacing between them
    ctx.setLineDash([12, 8]);
    // Reduce thickness - use 60% of normal edge width
    ctx.lineWidth = linkWidth * 0.6;
    // Lighter gray colors
    ctx.strokeStyle = isHighlighted 
      ? (isDarkMode ? '#FFD700' : '#FFA500')
      : (isDarkMode ? '#CCCCCC' : '#BBBBBB');
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalAlpha = 1.0;
    
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    
    ctx.restore();
  }, []);

  // Helper function to draw edge label (matches original normal edge label rendering)
  const drawEdgeLabel = useCallback((
    ctx: CanvasRenderingContext2D,
    label: string,
    midX: number,
    midY: number,
    globalScale: number,
    isHighlighted: boolean,
    isDarkMode: boolean
  ) => {
    // Use the same font size calculation as original normal edges (inverse scaling)
    const fontSize = 10 / globalScale;
    ctx.font = `${fontSize}px Sans-Serif`;
    const textWidth = ctx.measureText(label).width;
    const padding = 4 / globalScale;
    
    // Draw background
    ctx.fillStyle = isHighlighted 
      ? (isDarkMode ? 'rgba(255, 215, 0, 0.9)' : 'rgba(255, 215, 0, 0.9)')
      : (isDarkMode ? 'rgba(30, 30, 30, 0.9)' : 'rgba(255, 255, 255, 0.9)');
    ctx.fillRect(
      midX - textWidth / 2 - padding,
      midY - fontSize / 2 - padding,
      textWidth + padding * 2,
      fontSize + padding * 2
    );
    
    // Draw text
    ctx.fillStyle = isHighlighted
      ? '#000000'
      : (isDarkMode ? '#ffffff' : '#1a1a1a');
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, midX, midY);
  }, []);
  const outerContainerRef = useRef<HTMLDivElement>(null);
  const isAdjustingZoomRef = useRef<boolean>(false);
  const previousZoomRef = useRef<number>(1);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(initialExpandedNodes || new Set());
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [selectedEdge, setSelectedEdge] = useState<any>(null);
  const [highlightedNodeId, setHighlightedNodeId] = useState<string | null>(null);
  const [highlightedEdgeId, setHighlightedEdgeId] = useState<string | null>(null);
  const [paneVisible, setPaneVisible] = useState<boolean>(true);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; nodeId?: string; edgeId?: string } | null>(null);
  const rightClickPositionRef = useRef<{ x: number; y: number } | null>(null);
  const [nodePositions, setNodePositions] = useState<Map<string, { x: number; y: number; radius: number }>>(new Map());
  const [rightClickMenu, setRightClickMenu] = useState<{ nodeId: string; x: number; y: number } | null>(null);
  const { colorMode } = useColorMode();
  const isDarkMode = colorMode === 'dark';
  
  const menuBarHeight = 40;

  // Flatten nodes with children based on expansion state
  const flattenNodes = useCallback((nodes: Node[], expanded: Set<string>): { nodes: any[], links: any[] } => {
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

  // Toggle node expansion
  const toggleNodeExpansion = useCallback((nodeId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  }, []);

  // Get all nodes with children
  const getAllNodesWithChildren = useCallback((): Set<string> => {
    const nodesWithChildren = new Set<string>();
    const traverse = (nodes: Node[]) => {
      nodes.forEach(node => {
        if (node.children && node.children.length > 0) {
          nodesWithChildren.add(node.id);
          traverse(node.children);
        }
      });
    };
    traverse(data.nodes);
    return nodesWithChildren;
  }, [data]);

  // Expand all nodes
  const expandAll = useCallback(() => {
    const allNodesWithChildren = getAllNodesWithChildren();
    setExpandedNodes(allNodesWithChildren);
  }, [getAllNodesWithChildren]);

  // Collapse all nodes
  const collapseAll = useCallback(() => {
    setExpandedNodes(new Set());
    // Clear selected edge and node when collapsing all, as they may reference collapsed nodes
    setSelectedEdge(null);
    setSelectedNode(null);
    setHighlightedEdgeId(null);
    setHighlightedNodeId(null);
  }, []);

  // Update node positions for floating menu rendering
  const updateNodePositions = useCallback(() => {
    if (!graphRef.current || !containerRef.current) return;
    
    const graphData = graphRef.current.graphData();
    if (!graphData || !graphData.nodes) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    // Get the current zoom and pan transform
    const zoom = graphRef.current.zoom() || 1;
    
    // Force-graph uses canvas rendering
    // The canvas element should be inside the container
    const canvas = containerRef.current.querySelector('canvas');
    if (!canvas) {
      // Try SVG as fallback (though force-graph typically uses canvas)
      const svg = containerRef.current.querySelector('svg');
      if (!svg) {
        console.warn('Neither canvas nor SVG found in container');
        return;
      }
    }
    
    // Force-graph centers the graph at (width/2, height/2) in screen space
    // Graph coordinates are in the force simulation space (centered at origin)
    // We need to convert to screen coordinates relative to the container
    const positions = new Map<string, { x: number; y: number; radius: number }>();
    
    graphData.nodes.forEach((node: any) => {
      if (node.x !== undefined && node.y !== undefined && isFinite(node.x) && isFinite(node.y)) {
        // Convert graph coordinates to screen coordinates
        // Force-graph centers at (width/2, height/2), so we offset by that
        const screenX = (containerRect.width / 2) + (node.x * zoom);
        const screenY = (containerRect.height / 2) + (node.y * zoom);
        const radius = getNodeRadius(node.hasChildren) * zoom;
        
        positions.set(node.id, { x: screenX, y: screenY, radius });
      }
    });
    
    if (process.env.NODE_ENV === 'development' && positions.size > 0) {
      const firstPos = Array.from(positions.values())[0];
      console.log('First node position:', firstPos, 'Container:', { width: containerRect.width, height: containerRect.height, zoom });
    }
    
    setNodePositions(positions);
  }, []);

  // Update node positions periodically and on graph updates
  useEffect(() => {
    if (!graphRef.current) return;
    
    let animationFrameId: number;
    let intervalId: NodeJS.Timeout;
    
    const updatePositions = () => {
      updateNodePositions();
      animationFrameId = requestAnimationFrame(updatePositions);
    };
    
    // Update positions on animation frame for smooth updates
    animationFrameId = requestAnimationFrame(updatePositions);
    
    // Also update on zoom/pan changes
    intervalId = setInterval(updateNodePositions, 100);
    
    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [graphData, updateNodePositions]);

  // Auto center the graph
  const autoCenter = useCallback(() => {
    if (graphRef.current && graphData.nodes.length > 0) {
      // Calculate center of all nodes
      let minX = Infinity, maxX = -Infinity;
      let minY = Infinity, maxY = -Infinity;
      
      graphData.nodes.forEach((node: any) => {
        if (node.x !== undefined && node.y !== undefined) {
          minX = Math.min(minX, node.x);
          maxX = Math.max(maxX, node.x);
          minY = Math.min(minY, node.y);
          maxY = Math.max(maxY, node.y);
        }
      });

      if (minX !== Infinity) {
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;
        
        // Get current camera position
        const currentZoom = graphRef.current.zoom() || 1;
        const containerElement = containerRef.current?.parentElement;
        const actualWidth = containerElement ? containerElement.offsetWidth : width;
        const panelWidth = paneVisible ? Math.floor(actualWidth * 0.2) : 0;
        const graphWidth = actualWidth - panelWidth;
        
        // Center the view
        graphRef.current.centerAt(centerX, centerY, 1000);
      }
    }
  }, [graphData, width, paneVisible]);

  // Toggle pane visibility
  const togglePane = useCallback(() => {
    setPaneVisible(prev => !prev);
  }, []);

  // Copy anchor link to clipboard
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
      // Close context menu
      setContextMenu(null);
      // Optional: Show a brief success message (you could add a toast notification here)
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
  }, [graphId]);

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (rightClickMenu) {
        setRightClickMenu(null);
      }
      if (contextMenu) {
        setContextMenu(null);
      }
    };

    if (rightClickMenu || contextMenu) {
      document.addEventListener('click', handleClickOutside);
      document.addEventListener('contextmenu', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('contextmenu', handleClickOutside);
    };
  }, [rightClickMenu, contextMenu]);

  // Find path to a node (all parent node IDs)
  const findPathToNode = useCallback((targetId: string, nodes: Node[], path: string[] = []): string[] | null => {
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
  }, []);

  // Find a node by ID in the node tree
  const findNodeById = useCallback((targetId: string, nodes: Node[]): Node | null => {
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
  }, []);

  // Highlight a specific node by expanding parents and centering
  const highlightNode = useCallback((nodeId: string, scrollToGraph = false) => {
    if (!nodeId) return;
    
    // Scroll to graph if requested (for anchor links)
    if (scrollToGraph && outerContainerRef.current) {
      outerContainerRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    }
    
    // Find path to the node
    const path = findPathToNode(nodeId, data.nodes);
    if (!path) {
      console.warn(`Node not found: ${nodeId}`);
      return; // Node not found
    }
    
    // Expand all parent nodes (all nodes in path except the target)
    const parentsToExpand = path.slice(0, -1);
    
    // Find the target node
    const node = findNodeById(nodeId, data.nodes);
    
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      // Expand all parent nodes
      parentsToExpand.forEach(parentId => newSet.add(parentId));
      // Also expand the selected node itself if it has children (for URL fragment selection)
      if (scrollToGraph && node && node.children && node.children.length > 0) {
        newSet.add(nodeId);
      }
      return newSet;
    });
    
    // Set highlighted node
    setHighlightedNodeId(nodeId);
    
    // Also set as selected node (for sun theming) when called from URL fragment
    if (scrollToGraph && node) {
      setSelectedNode(cleanNodeForSelection(node));
    }
  }, [data.nodes, findPathToNode, findNodeById, cleanNodeForSelection]);

  // Highlight a specific edge
  const highlightEdge = useCallback((edgeId: string, scrollToGraph = false) => {
    if (!edgeId) return;
    
    // Check if the edge exists in the current graph data
    // This is important because if nodes are collapsed, edges referencing those nodes won't be in the graph
    const currentGraphData = graphData;
    const edge = currentGraphData.links.find((l: any) => l.id === edgeId);
    if (!edge) {
      console.warn(`Edge not found: ${edgeId} (source/target nodes may be collapsed)`);
      return; // Edge not found (possibly because source/target nodes are collapsed)
    }
    
    // Scroll to graph if requested (for anchor links)
    if (scrollToGraph && outerContainerRef.current) {
      outerContainerRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    }
    
    // Set highlighted edge
    setHighlightedEdgeId(edgeId);
  }, [graphData]);

  // Handle markdown section clicks that link to graph nodes/edges
  useEffect(() => {
    const handleMarkdownSectionClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Check if clicked element or its parent has a data-graph-node or data-graph-edge attribute
      let element: HTMLElement | null = target;
      let nodeId: string | null = null;
      let edgeId: string | null = null;
      
      // Traverse up the DOM tree to find data attributes
      while (element && element !== document.body) {
        if (element.dataset.graphNode) {
          nodeId = element.dataset.graphNode;
          break;
        }
        if (element.dataset.graphEdge) {
          edgeId = element.dataset.graphEdge;
          break;
        }
        element = element.parentElement;
      }
      
      if (nodeId) {
        e.preventDefault();
        highlightNode(nodeId, true);
        // Update URL hash
        if (graphId) {
          window.location.hash = `#${graphId}-node-${nodeId}`;
        }
      } else if (edgeId) {
        e.preventDefault();
        // Check if edge exists before trying to highlight/select it
        const edge = graphData.links.find((l: any) => l.id === edgeId);
        if (edge) {
          highlightEdge(edgeId, true);
          setSelectedEdge(cleanEdgeForSelection(edge));
          setSelectedNode(null);
          // Update URL hash
          if (graphId) {
            window.location.hash = `#${graphId}-edge-${edgeId}`;
          }
        } else {
          console.warn(`Edge not found: ${edgeId} (source/target nodes may be collapsed)`);
        }
      }
    };
    
    // Add click listener to document to catch all markdown section clicks
    document.addEventListener('click', handleMarkdownSectionClick, true);
    
    return () => {
      document.removeEventListener('click', handleMarkdownSectionClick, true);
    };
  }, [graphId, highlightNode, highlightEdge, graphData, setSelectedEdge, setSelectedNode]);

  // Handle URL hash changes
  useEffect(() => {
    const nodeHashPrefix = `#${graphId}-node-`;
    const edgeHashPrefix = `#${graphId}-edge-`;
    
    const checkHash = () => {
      const hash = window.location.hash;
      if (hash.startsWith(nodeHashPrefix)) {
        const nodeId = hash.substring(nodeHashPrefix.length);
        highlightNode(nodeId, true); // Scroll to graph when hash changes
      } else if (hash.startsWith(edgeHashPrefix)) {
        const edgeId = hash.substring(edgeHashPrefix.length);
        // Check if edge exists before trying to highlight/select it
        const edge = graphData.links.find((l: any) => l.id === edgeId);
        if (edge) {
          highlightEdge(edgeId, true); // Scroll to graph when hash changes
          setSelectedEdge(cleanEdgeForSelection(edge));
          setSelectedNode(null);
        } else {
          console.warn(`Edge not found: ${edgeId} (source/target nodes may be collapsed)`);
        }
      }
    };
    
    // Check initial hash
    checkHash();
    
    // Listen for hash changes
    window.addEventListener('hashchange', checkHash);
    
    return () => {
      window.removeEventListener('hashchange', checkHash);
    };
  }, [graphId, highlightNode, highlightEdge]);

  // Handle prop-based highlighting
  useEffect(() => {
    if (propHighlightNodeId) {
      highlightNode(propHighlightNodeId);
    }
  }, [propHighlightNodeId, highlightNode]);

  useEffect(() => {
    if (propHighlightEdgeId) {
      highlightEdge(propHighlightEdgeId);
    }
  }, [propHighlightEdgeId, highlightEdge]);

  // Re-center on highlighted node when graph data updates (after expansion)
  useEffect(() => {
    if (highlightedNodeId && graphRef.current && graphData.nodes.length > 0) {
      // Wait for node to be positioned by force simulation
      const attemptCenter = (attempts = 0) => {
        if (attempts > 30) return; // Give up after 3 seconds
        
        setTimeout(() => {
          if (graphRef.current) {
            // Get the current graph data (may have updated positions)
            const currentGraphData = graphRef.current.graphData();
            const node = currentGraphData?.nodes?.find((n: any) => n.id === highlightedNodeId);
            
            if (node && node.x !== undefined && node.y !== undefined && 
                isFinite(node.x) && isFinite(node.y)) {
              // Center and zoom on the node
              graphRef.current.centerAt(node.x, node.y, 1000);
              graphRef.current.zoom(1.5, 1000);
              setSelectedNode(cleanNodeForSelection(node));
            } else {
              // Node not yet positioned, try again
              attemptCenter(attempts + 1);
            }
          }
        }, 100);
      };
      
      attemptCenter();
    }
  }, [graphData, highlightedNodeId]);

  // Function to get and update graph width
  const updateGraphWidth = useCallback(() => {
    if (!containerRef.current || !graphRef.current) return;
    
    const containerElement = containerRef.current.parentElement;
    if (!containerElement) return;
    
    const actualWidth = containerElement.offsetWidth || width;
    const panelWidth = paneVisible ? Math.floor(actualWidth * 0.2) : 0;
    const graphWidth = actualWidth - panelWidth;
    const graphHeight = height - menuBarHeight;
    
    graphRef.current.width(graphWidth);
    graphRef.current.height(graphHeight);
  }, [width, height, paneVisible]);

  // Calculate bounding box of all visible nodes
  const calculateNodeBoundingBox = useCallback(() => {
    if (!graphRef.current) return null;
    
    const currentGraphData = graphRef.current.graphData();
    if (!currentGraphData || !currentGraphData.nodes || currentGraphData.nodes.length === 0) {
      return null;
    }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    let validNodes = 0;

    currentGraphData.nodes.forEach((node: any) => {
      if (node.x !== undefined && node.y !== undefined && 
          isFinite(node.x) && isFinite(node.y)) {
        const nodeRadius = getNodeRadius(node.hasChildren);
        minX = Math.min(minX, node.x - nodeRadius);
        minY = Math.min(minY, node.y - nodeRadius);
        maxX = Math.max(maxX, node.x + nodeRadius);
        maxY = Math.max(maxY, node.y + nodeRadius);
        validNodes++;
      }
    });

    if (validNodes === 0) return null;

    return {
      minX,
      minY,
      maxX,
      maxY,
      width: maxX - minX,
      height: maxY - minY,
      centerX: (minX + maxX) / 2,
      centerY: (minY + maxY) / 2,
    };
  }, []);

  // Check if zoom out would make cluster < 25% of viewport
  const canZoomOut = useCallback((newZoom: number) => {
    if (!graphRef.current || !containerRef.current) return true;
    
    const bbox = calculateNodeBoundingBox();
    if (!bbox) return true;

    const containerElement = containerRef.current.parentElement;
    if (!containerElement) return true;
    
    const actualWidth = containerElement.offsetWidth || width;
    const panelWidth = paneVisible ? Math.floor(actualWidth * 0.2) : 0;
    const graphWidth = actualWidth - panelWidth;
    const graphHeight = height - menuBarHeight;

    // Calculate what the bounding box would be at the new zoom level
    // The bounding box size in screen space = bbox size * zoom
    const screenWidth = bbox.width * newZoom;
    const screenHeight = bbox.height * newZoom;

    // Calculate percentage of viewport
    const viewportArea = graphWidth * graphHeight;
    const clusterArea = screenWidth * screenHeight;
    const percentage = (clusterArea / viewportArea) * 100;

    // Allow zoom out if cluster would still be >= 10% of viewport (reduced from 25% to allow more zoom out)
    return percentage >= 10;
  }, [calculateNodeBoundingBox, width, height, paneVisible]);

  // Check if zoom in would result in only one node visible
  // Allow zooming in much more - only prevent if a single node would take up >90% of viewport
  const canZoomIn = useCallback((newZoom: number) => {
    if (!graphRef.current || !containerRef.current) return true;
    
    const currentGraphData = graphRef.current.graphData();
    if (!currentGraphData || !currentGraphData.nodes || currentGraphData.nodes.length <= 1) {
      return true; // If there's only one node or none, allow zoom
    }

    const containerElement = containerRef.current.parentElement;
    if (!containerElement) return true;
    
    const actualWidth = containerElement.offsetWidth || width;
    const panelWidth = paneVisible ? Math.floor(actualWidth * 0.2) : 0;
    const graphWidth = actualWidth - panelWidth;
    const graphHeight = height - menuBarHeight;

    // Calculate viewport bounds in graph coordinates at new zoom
    const viewportGraphWidth = graphWidth / newZoom;
    const viewportGraphHeight = graphHeight / newZoom;

    // Get the current camera position
    let centerX: number, centerY: number;
    
    if (graphRef.current.screen2GraphCoords) {
      const center = graphRef.current.screen2GraphCoords(graphWidth / 2, graphHeight / 2);
      centerX = center.x;
      centerY = center.y;
    } else {
      const bbox = calculateNodeBoundingBox();
      if (!bbox) return true;
      centerX = bbox.centerX;
      centerY = bbox.centerY;
    }

    const halfWidth = viewportGraphWidth / 2;
    const halfHeight = viewportGraphHeight / 2;

    // Find the largest node size in the entire graph (not just visible ones)
    // This ensures we always have a reference point for zoom limits
    let maxNodeSizeInGraph = 0;
    currentGraphData.nodes.forEach((node: any) => {
      if (node.x !== undefined && node.y !== undefined && 
          isFinite(node.x) && isFinite(node.y)) {
        const nodeRadius = getNodeRadius(node.hasChildren);
        const nodeDiameter = nodeRadius * 2;
        maxNodeSizeInGraph = Math.max(maxNodeSizeInGraph, nodeDiameter);
      }
    });

    // Count visible nodes and find the largest node in viewport
    let visibleNodes = 0;
    let maxNodeSizeInViewport = 0;
    currentGraphData.nodes.forEach((node: any) => {
      if (node.x !== undefined && node.y !== undefined && 
          isFinite(node.x) && isFinite(node.y)) {
        const nodeRadius = getNodeRadius(node.hasChildren);
        const nodeDiameter = nodeRadius * 2;
        
        // Check if node is within viewport bounds (with some padding for edge cases)
        const padding = nodeRadius * 0.5; // Add padding to account for nodes partially visible
        if (node.x - nodeRadius - padding >= centerX - halfWidth &&
            node.x + nodeRadius + padding <= centerX + halfWidth &&
            node.y - nodeRadius - padding >= centerY - halfHeight &&
            node.y + nodeRadius + padding <= centerY + halfHeight) {
          visibleNodes++;
          maxNodeSizeInViewport = Math.max(maxNodeSizeInViewport, nodeDiameter);
        }
      }
    });

    // Use the largest node in viewport if available, otherwise use largest in graph
    const maxNodeSize = maxNodeSizeInViewport > 0 ? maxNodeSizeInViewport : maxNodeSizeInGraph;

    // Prevent zoom in if any node would take up more than 90% of viewport
    if (maxNodeSize > 0) {
      // Calculate the screen size of the largest node at the new zoom level
      const nodeScreenSize = maxNodeSize * newZoom;
      // Calculate the viewport size in screen coordinates
      const viewportScreenSize = Math.min(graphWidth, graphHeight);
      const nodePercentage = (nodeScreenSize / viewportScreenSize) * 100;
      
      // Prevent zoom if largest node would take up more than 90% of viewport
      if (nodePercentage >= 90) {
        return false;
      }
    }

    // Also prevent zoom if viewport in graph coordinates becomes too small
    // This prevents zooming in so much that the viewport is smaller than a single node
    // Use a more conservative limit based on the largest node size
    const minViewportSize = Math.min(viewportGraphWidth, viewportGraphHeight);
    const minAllowedViewportSize = maxNodeSizeInGraph > 0 ? maxNodeSizeInGraph * 3 : 50;
    if (minViewportSize < minAllowedViewportSize) {
      return false;
    }

    return true;
  }, [calculateNodeBoundingBox, width, height, paneVisible]);

  useEffect(() => {
    if (!containerRef.current) return;

    // Theme-based colors
    const backgroundColor = isDarkMode ? '#1e1e1e' : '#ffffff';
    const borderColor = isDarkMode ? '#333' : '#e0e0e0';
    const textColor = isDarkMode ? '#ffffff' : '#1a1a1a';
    const linkColor = isDarkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)';
    const arrowColor = isDarkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)';
    const nodeBorderColor = isDarkMode ? '#ffffff' : '#333333';

    // Get actual container width (use parent container if available, otherwise use prop)
    const containerElement = containerRef.current.parentElement;
    const actualWidth = containerElement ? containerElement.offsetWidth : width;
    const panelWidth = paneVisible ? Math.floor(actualWidth * 0.2) : 0;
    const graphWidth = actualWidth - panelWidth;
    const graphHeight = height - menuBarHeight;

    // Initialize force graph
    if (!graphRef.current) {
      graphRef.current = new ForceGraph(containerRef.current)
        .width(graphWidth)
        .height(graphHeight)
        .backgroundColor(backgroundColor)
        .nodeLabel((node: any) => getNodeLabel(node))
        .nodeVal((node: any) => getNodeRadius(node.hasChildren))
        // Note: nodeColor is not needed when using nodeCanvasObject with mode 'replace'
        .linkColor((link: any) => {
          // Comparison edges are drawn in linkCanvasObject with 'replace' mode, so hide default line
          if ((link as any).type === 'differentiating') {
            return 'rgba(0,0,0,0)'; // Fully transparent - use rgba instead of 'transparent' string
          }
          return linkColor;
        })
        .linkWidth((link: any) => {
          // Comparison edges are drawn in linkCanvasObject as dashed lines, so hide default line
          // Note: Setting to 0 might prevent linkCanvasObject from being called, so we use a very small value
          if ((link as any).type === 'differentiating') {
            return 0.1; // Very small width - should be invisible but still trigger linkCanvasObject
          }
          // Use same width calculation as helper function
          return getEdgeWidth(link, false);
        })
        .linkDirectionalArrowLength((link: any) => {
          // No arrows for comparison edges
          if ((link as any).type === 'differentiating') {
            return 0;
          }
          return 6;
        })
        .linkDirectionalArrowRelPos((link: any) => {
          // No arrows for comparison edges
          if ((link as any).type === 'differentiating') {
            return 0;
          }
          // Calculate the position where arrow tip should touch the node surface
          // Get node radius to account for node size
          const currentData = graphRef.current?.graphData();
          const targetNode = currentData?.nodes?.find((n: any) => n.id === link.target);
          if (targetNode && graphRef.current) {
            const nodeRadius = getNodeRadius(targetNode.hasChildren);
            // Calculate distance from source to target
            const sourceNode = currentData?.nodes?.find((n: any) => n.id === link.source);
            if (sourceNode && sourceNode.x !== undefined && sourceNode.y !== undefined &&
                targetNode.x !== undefined && targetNode.y !== undefined) {
              const dx = targetNode.x - sourceNode.x;
              const dy = targetNode.y - sourceNode.y;
              const distance = Math.sqrt(dx * dx + dy * dy);
              
              if (distance > 0) {
                // Position arrow so tip touches node surface
                // In force-graph, linkDirectionalArrowRelPos is where the arrow base is positioned
                // The arrow extends from relPos toward the target
                // Arrow tip position = relPos * distance + arrowLength
                // We want arrow tip to be at: distance - nodeRadius
                // So: relPos * distance + arrowLength = distance - nodeRadius
                // Therefore: relPos = (distance - nodeRadius - arrowLength) / distance
                const arrowLength = 6; // Match linkDirectionalArrowLength
                const relPos = Math.max(0, (distance - nodeRadius - arrowLength) / distance);
                // Ensure it's as close as possible to the target (but not beyond 1.0)
                return Math.min(0.999, Math.max(0.9, relPos));
              }
            }
          }
          return 0.98; // Default: very close to target node
        })
        .linkDirectionalArrowColor(() => arrowColor)
        .d3Force('link', d3.forceLink().id((d: any) => d.id).distance(50))
        .d3Force('charge', d3.forceManyBody().strength(-200))
        .d3Force('collision', d3.forceCollide().radius((d: any) => {
          const nodeRadius = getNodeRadius(d.hasChildren);
          return nodeRadius + 5; // Add padding around nodes
        }))
        .onNodeClick((node: any) => {
          // Clear context menu if open
          setContextMenu(null);
          
          // Clear edge highlight and selection if any
          if (highlightedEdgeId) {
            setHighlightedEdgeId(null);
          }
          if (selectedEdge) {
            setSelectedEdge(null);
          }
          
          // Check if this node is already selected
          const isAlreadySelected = selectedNode?.id === node.id;
          
          // Highlight the clicked node
          setHighlightedNodeId(node.id);
          
          // Update URL fragment to reflect the selected node
          if (graphId) {
            window.location.hash = `#${graphId}-node-${node.id}`;
          }
          
          // Only toggle expansion if node is already selected and has children
          // When selecting a new node, just select it without toggling
          if (isAlreadySelected && node.hasChildren) {
            toggleNodeExpansion(node.id);
          } else if (!isAlreadySelected && node.hasChildren) {
            // When selecting a new node with children, expand it
            setExpandedNodes(prev => {
              const newSet = new Set(prev);
              newSet.add(node.id);
              return newSet;
            });
          }
          
          // Always select the node to show details
          setSelectedNode(cleanNodeForSelection(node));
          setSelectedEdge(null);
        })
        .onNodeRightClick((node: any) => {
          // Show floating menu on right-click
          if (rightClickPositionRef.current) {
            setRightClickMenu({
              nodeId: node.id,
              x: rightClickPositionRef.current.x,
              y: rightClickPositionRef.current.y,
            });
            rightClickPositionRef.current = null;
          }
        })
        .onLinkClick((link: any) => {
          // Clear menus if open
          setRightClickMenu(null);
          setContextMenu(null);
          
          // Clear highlights if clicking a different edge
          if (highlightedEdgeId && highlightedEdgeId !== link.id) {
            setHighlightedEdgeId(null);
          }
          if (highlightedNodeId) {
            setHighlightedNodeId(null);
          }
          
          // Select the edge
          setSelectedEdge(cleanEdgeForSelection(link));
          setSelectedNode(null);
          
          // Update URL fragment to reflect the selected edge
          if (graphId && link.id) {
            window.location.hash = `#${graphId}-edge-${link.id}`;
          }
          
          // Call external callback if provided (for custom edge handling like AIFrameworkGraph)
          if (onEdgeClick) {
            onEdgeClick(link);
          }
        })
        .onLinkRightClick((link: any) => {
          // Use the stored right-click position
          if (rightClickPositionRef.current) {
            setContextMenu({ 
              x: rightClickPositionRef.current.x, 
              y: rightClickPositionRef.current.y, 
              edgeId: link.id,
              nodeId: undefined
            });
            rightClickPositionRef.current = null;
          }
        })
        // Note: Removed onNodeHover - sun theming only applies on click/selection, not hover
        .nodeCanvasObjectMode(() => 'replace') // Replace default node rendering with custom
        .nodeCanvasObject(createNodeRenderer(
          isDarkMode,
          highlightedNodeId,
          selectedNode,
          nodeBorderColor,
          expandedNodes
        ))
        .linkCanvasObjectMode((link: any) => {
          // Use 'replace' mode for comparison edges to ensure they're drawn
          // Use 'after' mode for regular edges to draw labels on top
          const linkType = (link as any).type;
          const isComparison = linkType === 'differentiating';
          return isComparison ? 'replace' : 'after';
        })
        .linkCanvasObject((link: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
          const isHighlighted = highlightedEdgeId === link.id;
          const linkType = (link as any).type;
          const isComparisonEdge = linkType === 'differentiating';
          
          // For comparison edges, draw dashed gray lines (replace mode)
          // For regular edges, we'll draw labels in 'after' mode
          if (isComparisonEdge && link.source && link.target) {
            const currentData = graphRef.current?.graphData();
            // Handle both string IDs and node objects
            const sourceId = typeof link.source === 'string' ? link.source : (link.source as any)?.id;
            const targetId = typeof link.target === 'string' ? link.target : (link.target as any)?.id;
            const startNode = currentData?.nodes?.find((n: any) => n.id === sourceId);
            const endNode = currentData?.nodes?.find((n: any) => n.id === targetId);
            
            const coords = getEdgeCoordinates(link, startNode, endNode, getNodeRadius);
            if (coords) {
              // Use same width calculation as normal edges
              const linkWidth = getEdgeWidth(link, isHighlighted);
              
              // Draw the dashed gray line for comparison edges
              drawComparisonEdge(
                ctx,
                coords.startX,
                coords.startY,
                coords.endX,
                coords.endY,
                isHighlighted,
                isDarkMode,
                linkWidth
              );
              
              // Draw label for comparison edges if zoomed in enough
              if (link.label && globalScale >= 0.5) {
                drawEdgeLabel(
                  ctx,
                  link.label,
                  coords.midX,
                  coords.midY,
                  globalScale,
                  isHighlighted,
                  isDarkMode
                );
              }
            }
          }
          
          // Only show edge labels when zoomed in enough (globalScale > 0.5)
          // Lowered threshold to make labels more visible
          const MIN_ZOOM_FOR_LABELS = 0.5;
          
          // Draw edge label if it exists and zoomed in enough (for non-comparison edges or on top of comparison edges)
          if (!isComparisonEdge && link.label && link.source && link.target && globalScale >= MIN_ZOOM_FOR_LABELS) {
            // Get nodes from the graph's current data
            const currentData = graphRef.current?.graphData();
            // Handle both string IDs and node objects
            const sourceId = typeof link.source === 'string' ? link.source : (link.source as any)?.id;
            const targetId = typeof link.target === 'string' ? link.target : (link.target as any)?.id;
            const startNode = currentData?.nodes?.find((n: any) => n.id === sourceId);
            const endNode = currentData?.nodes?.find((n: any) => n.id === targetId);
            
            if (startNode && endNode && 
                startNode.x !== undefined && startNode.y !== undefined &&
                endNode.x !== undefined && endNode.y !== undefined &&
                isFinite(startNode.x) && isFinite(startNode.y) &&
                isFinite(endNode.x) && isFinite(endNode.y)) {
              // Calculate midpoint of the edge, accounting for node radii
              const sourceRadius = getNodeRadius(startNode.hasChildren);
              const targetRadius = getNodeRadius(endNode.hasChildren);
              
              // Calculate direction vector
              const dx = endNode.x - startNode.x;
              const dy = endNode.y - startNode.y;
              const distance = Math.sqrt(dx * dx + dy * dy);
              
              if (distance > 0) {
                // Normalize direction
                const unitX = dx / distance;
                const unitY = dy / distance;
                
                // Calculate start and end points on node surfaces
                const startX = startNode.x + unitX * sourceRadius;
                const startY = startNode.y + unitY * sourceRadius;
                const endX = endNode.x - unitX * targetRadius;
                const endY = endNode.y - unitY * targetRadius;
                
                // Calculate midpoint of the visible edge (between node surfaces)
                const midX = (startX + endX) / 2;
                const midY = (startY + endY) / 2;
                
                // Use fixed font size that scales with zoom for readability
                const fontSize = Math.max(10, 12 * globalScale);
                ctx.font = `${fontSize}px Sans-Serif`;
                const textWidth = ctx.measureText(link.label).width;
                const padding = 4;
                
                // Draw background for label
                ctx.fillStyle = isHighlighted 
                  ? (isDarkMode ? 'rgba(255, 215, 0, 0.9)' : 'rgba(255, 215, 0, 0.9)')
                  : (isDarkMode ? 'rgba(30, 30, 30, 0.9)' : 'rgba(255, 255, 255, 0.9)');
                ctx.fillRect(
                  midX - textWidth / 2 - padding,
                  midY - fontSize / 2 - padding,
                  textWidth + padding * 2,
                  fontSize + padding * 2
                );
                
                // Draw label text
                ctx.fillStyle = isHighlighted
                  ? (isDarkMode ? '#000000' : '#000000')
                  : (isDarkMode ? '#ffffff' : '#1a1a1a');
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(link.label, midX, midY);
              }
            }
          }
        })
        .cooldownTicks(100)
        .onEngineStop(() => {
          // Graph has stabilized
        })
        .onNodeDrag((node: any) => {
          // Update node positions as nodes are dragged
          updateNodePositions();
        })
        .onNodeDragEnd((node: any) => {
          // Update node positions after drag ends
          updateNodePositions();
        })
        .onZoom((transform: { k: number; x: number; y: number }) => {
          // Update positions on zoom/pan
          updateNodePositions();
          
          // Intercept zoom changes and enforce limits
          if (!graphRef.current || isAdjustingZoomRef.current) {
            previousZoomRef.current = transform.k;
            return;
          }
          
          const newZoom = transform.k;
          const previousZoom = previousZoomRef.current;
          
          // Check zoom limits
          if (newZoom < previousZoom) {
            // Zooming out - check if allowed
            if (!canZoomOut(newZoom)) {
              // Prevent zoom out - revert to previous zoom
              isAdjustingZoomRef.current = true;
              graphRef.current.zoom(previousZoom, 0);
              setTimeout(() => {
                isAdjustingZoomRef.current = false;
              }, 10);
              return;
            }
          } else if (newZoom > previousZoom) {
            // Zooming in - check if allowed
            if (!canZoomIn(newZoom)) {
              // Prevent zoom in - revert to previous zoom
              isAdjustingZoomRef.current = true;
              graphRef.current.zoom(previousZoom, 0);
              setTimeout(() => {
                isAdjustingZoomRef.current = false;
              }, 10);
              return;
            }
          }
          
          // Update previous zoom if zoom was allowed
          previousZoomRef.current = newZoom;
        });
    }

    // Update graph data and theme when they change
    if (graphRef.current && containerRef.current) {
      updateGraphWidth();
      const comparisonCount = graphData.links.filter((l: any) => l.type === 'differentiating').length;
      console.log('Graph data set:', { 
        nodes: graphData.nodes.length, 
        links: graphData.links.length,
        comparisonEdges: comparisonCount,
        sampleLink: graphData.links[0] ? { 
          id: graphData.links[0].id, 
          type: (graphData.links[0] as any).type, 
          keys: Object.keys(graphData.links[0]),
          fullLink: graphData.links[0]
        } : null,
        allLinkTypes: [...new Set(graphData.links.map((l: any) => l.type))],
        linksWithType: graphData.links.filter((l: any) => l.type).length
      });
      graphRef.current.graphData(graphData);
      graphRef.current.backgroundColor(backgroundColor);
      graphRef.current.linkColor((link: any) => {
        // Comparison edges are drawn in linkCanvasObject with 'replace' mode, so hide default line
        if ((link as any).type === 'differentiating') {
          return 'rgba(0,0,0,0)'; // Fully transparent - use rgba instead of 'transparent' string
        }
        return linkColor;
      });
      graphRef.current.linkDirectionalArrowColor(() => arrowColor);
      
      // Ensure onZoom callback is set (in case it was overwritten)
      graphRef.current.onZoom((transform: { k: number; x: number; y: number }) => {
        // Intercept zoom changes and enforce limits
        if (!graphRef.current || isAdjustingZoomRef.current) {
          previousZoomRef.current = transform.k;
          return;
        }
        
        const newZoom = transform.k;
        const previousZoom = previousZoomRef.current;
        
        // Check zoom limits
        if (newZoom < previousZoom) {
          // Zooming out - check if allowed
          if (!canZoomOut(newZoom)) {
            // Prevent zoom out - revert to previous zoom
            isAdjustingZoomRef.current = true;
            graphRef.current.zoom(previousZoom, 0);
            setTimeout(() => {
              isAdjustingZoomRef.current = false;
            }, 10);
            return;
          }
        } else if (newZoom > previousZoom) {
          // Zooming in - check if allowed
          if (!canZoomIn(newZoom)) {
            // Prevent zoom in - revert to previous zoom
            isAdjustingZoomRef.current = true;
            graphRef.current.zoom(previousZoom, 0);
            setTimeout(() => {
              isAdjustingZoomRef.current = false;
            }, 10);
            return;
          }
        }
        
        // Update previous zoom if zoom was allowed
        previousZoomRef.current = newZoom;
      });
      
      // Initialize previous zoom ref if not set
      if (previousZoomRef.current === 1) {
        const currentZoom = graphRef.current.zoom();
        if (currentZoom) {
          previousZoomRef.current = currentZoom;
        }
      }
      
      // Add edge rendering with labels
      graphRef.current.linkCanvasObjectMode((link: any) => {
        // Use 'replace' mode for comparison edges to ensure they're drawn
        // Use 'after' mode for regular edges to draw labels on top
        const linkType = (link as any).type;
        const isComparison = linkType === 'differentiating';
        // Debug: log first few calls to verify callback is invoked
        if (!(window as any).__modeCallCountUseEffect) (window as any).__modeCallCountUseEffect = 0;
        (window as any).__modeCallCountUseEffect++;
        if ((window as any).__modeCallCountUseEffect <= 3) {
          console.log('linkCanvasObjectMode (useEffect) called:', { 
            call: (window as any).__modeCallCountUseEffect,
            id: link.id, 
            type: linkType, 
            isComparison,
            keys: Object.keys(link)
          });
        }
        // Debug: only log comparison edges after first 3 calls
        if (isComparison && (window as any).__modeCallCountUseEffect > 3) {
          console.log('linkCanvasObjectMode (useEffect, comparison):', { id: link.id, type: linkType });
        }
        return isComparison ? 'replace' : 'after';
      });
      graphRef.current.linkCanvasObject((link: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
        const isHighlighted = highlightedEdgeId === link.id;
        const linkType = (link as any).type;
        const isComparisonEdge = linkType === 'differentiating';
        
        // Draw comparison edges as dashed lines (must draw before labels to ensure visibility)
        if (isComparisonEdge && link.source && link.target) {
          const currentData = graphRef.current?.graphData();
          const sourceId = typeof link.source === 'string' ? link.source : (link.source as any)?.id;
          const targetId = typeof link.target === 'string' ? link.target : (link.target as any)?.id;
          const startNode = currentData?.nodes?.find((n: any) => n.id === sourceId);
          const endNode = currentData?.nodes?.find((n: any) => n.id === targetId);
          
          const coords = getEdgeCoordinates(link, startNode, endNode, getNodeRadius);
          if (coords) {
            // Use same width calculation as normal edges
            const linkWidth = getEdgeWidth(link, isHighlighted);
            
            // Draw the dashed gray line for comparison edges
            drawComparisonEdge(
              ctx,
              coords.startX,
              coords.startY,
              coords.endX,
              coords.endY,
              isHighlighted,
              isDarkMode,
              linkWidth
            );
            
            // Draw label for comparison edges if zoomed in enough
            if (link.label && globalScale >= 0.5) {
              drawEdgeLabel(
                ctx,
                link.label,
                coords.midX,
                coords.midY,
                globalScale,
                isHighlighted,
                isDarkMode
              );
            }
          }
        }
        
        // Draw edge label for non-comparison edges (in 'after' mode, labels appear on top)
        const MIN_ZOOM_FOR_LABELS = 0.5;
        if (!isComparisonEdge && link.label && link.source && link.target && globalScale >= MIN_ZOOM_FOR_LABELS) {
          const currentData = graphRef.current?.graphData();
          const sourceId = typeof link.source === 'string' ? link.source : (link.source as any)?.id;
          const targetId = typeof link.target === 'string' ? link.target : (link.target as any)?.id;
          const startNode = currentData?.nodes?.find((n: any) => n.id === sourceId);
          const endNode = currentData?.nodes?.find((n: any) => n.id === targetId);
          
          const coords = getEdgeCoordinates(link, startNode, endNode, getNodeRadius);
          if (coords) {
            drawEdgeLabel(
              ctx,
              link.label,
              coords.midX,
              coords.midY,
              globalScale,
              isHighlighted,
              isDarkMode
            );
          }
        }
      });
      
      // Update link color based on highlight
      graphRef.current.linkColor((link: any) => {
        // Comparison edges are drawn in linkCanvasObject with 'replace' mode, so hide default line
        if ((link as any).type === 'differentiating') {
          return 'rgba(0,0,0,0)'; // Fully transparent - use rgba instead of 'transparent' string
        }
        if (highlightedEdgeId === link.id) {
          return isDarkMode ? '#FFD700' : '#FFA500';
        }
        return linkColor;
      });
      
      graphRef.current.linkWidth((link: any) => {
        // Comparison edges are drawn in linkCanvasObject, so hide default line
        if ((link as any).type === 'differentiating') {
          return 0;
        }
        const baseWidth = Math.sqrt(link.value || 1);
        return highlightedEdgeId === link.id ? baseWidth * 2 : baseWidth;
      });
      
      graphRef.current.linkDirectionalArrowLength((link: any) => {
        // No arrows for comparison edges
        if ((link as any).type === 'differentiating') {
          return 0;
        }
        return 6;
      });
      
      // Force a redraw by reheating the simulation
      if (graphRef.current.d3ReheatSimulation) {
        graphRef.current.d3ReheatSimulation();
      }
    }

    // Setup resize observer to handle dynamic width changes
    const resizeObserver = new ResizeObserver(() => {
      updateGraphWidth();
    });
    
    if (containerRef.current?.parentElement) {
      resizeObserver.observe(containerRef.current.parentElement);
    }

    // Track right-click position on the canvas
    const handleCanvasContextMenu = (event: MouseEvent) => {
      if (containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        rightClickPositionRef.current = {
          x: event.clientX - containerRect.left,
          y: event.clientY - containerRect.top,
        };
      }
    };

    // Handle wheel events to enforce zoom limits (using capture phase to intercept before force-graph)
    const handleWheel = (event: WheelEvent) => {
      if (!graphRef.current || !containerRef.current) return;

      const currentZoom = graphRef.current.zoom() || 1;
      // Calculate zoom factor from wheel delta
      // Force-graph typically uses a zoom factor of ~1.1 per wheel step
      const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = currentZoom * zoomFactor;

      // Check if zoom is allowed
      if (zoomFactor > 1) {
        // Zooming in
        if (!canZoomIn(newZoom)) {
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
          return false;
        }
        
        // If there's a highlighted node, zoom into it instead of cursor position
        if (highlightedNodeId) {
          const currentGraphData = graphRef.current.graphData();
          const highlightedNode = currentGraphData?.nodes?.find((n: any) => n.id === highlightedNodeId);
          
          if (highlightedNode && 
              highlightedNode.x !== undefined && highlightedNode.y !== undefined &&
              isFinite(highlightedNode.x) && isFinite(highlightedNode.y)) {
            // Prevent default zoom behavior
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
            
            // Manually zoom and center on the highlighted node
            isAdjustingZoomRef.current = true;
            graphRef.current.zoom(newZoom, 100);
            graphRef.current.centerAt(highlightedNode.x, highlightedNode.y, 100);
            
            setTimeout(() => {
              isAdjustingZoomRef.current = false;
              previousZoomRef.current = newZoom;
            }, 150);
            
            return false;
          }
        }
      } else {
        // Zooming out
        if (!canZoomOut(newZoom)) {
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
          return false;
        }
        
        // If there's a highlighted node, keep it centered while zooming out
        if (highlightedNodeId) {
          const currentGraphData = graphRef.current.graphData();
          const highlightedNode = currentGraphData?.nodes?.find((n: any) => n.id === highlightedNodeId);
          
          if (highlightedNode && 
              highlightedNode.x !== undefined && highlightedNode.y !== undefined &&
              isFinite(highlightedNode.x) && isFinite(highlightedNode.y)) {
            // Prevent default zoom behavior
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
            
            // Manually zoom and center on the highlighted node
            isAdjustingZoomRef.current = true;
            graphRef.current.zoom(newZoom, 100);
            graphRef.current.centerAt(highlightedNode.x, highlightedNode.y, 100);
            
            setTimeout(() => {
              isAdjustingZoomRef.current = false;
              previousZoomRef.current = newZoom;
            }, 150);
            
            return false;
          }
        }
      }
    };

    // Get the canvas element and add context menu listener
    // Use a small delay to ensure canvas is rendered
    const setupCanvasListener = () => {
      const canvas = containerRef.current?.querySelector('canvas');
      if (canvas) {
        canvas.addEventListener('contextmenu', handleCanvasContextMenu);
        // Use capture phase to intercept wheel events before force-graph handles them
        canvas.addEventListener('wheel', handleWheel, { passive: false, capture: true });
        return canvas;
      }
      return null;
    };
    
    // Also add wheel listener to container with capture to catch events early
    if (containerRef.current) {
      containerRef.current.addEventListener('wheel', handleWheel, { passive: false, capture: true });
    }

    let canvas: HTMLCanvasElement | null = null;
    const timeoutId = setTimeout(() => {
      canvas = setupCanvasListener();
    }, 100);

    // Cleanup
    return () => {
      clearTimeout(timeoutId);
      resizeObserver.disconnect();
      if (canvas) {
        canvas.removeEventListener('contextmenu', handleCanvasContextMenu);
        canvas.removeEventListener('wheel', handleWheel, { capture: true } as any);
      }
      if (containerRef.current) {
        containerRef.current.removeEventListener('wheel', handleWheel, { capture: true } as any);
      }
      if (graphRef.current) {
        graphRef.current._destructor();
        graphRef.current = null;
      }
    };
  }, [graphData, width, height, toggleNodeExpansion, isDarkMode, updateGraphWidth, paneVisible, highlightedEdgeId, expandedNodes, canZoomIn, canZoomOut]);

  // Separate effect to update node rendering when selection/highlight changes
  // This avoids re-running the entire graph setup when only selection changes
  useEffect(() => {
    if (!graphRef.current) return;

    // Calculate theme-based node border color
    const nodeBorderColor = isDarkMode ? '#ffffff' : '#333333';

    // Update node canvas object to use theme-aware colors
    graphRef.current.nodeCanvasObjectMode(() => 'replace'); // Ensure default rendering is disabled
    graphRef.current.nodeCanvasObject(createNodeRenderer(
      isDarkMode,
      highlightedNodeId,
      selectedNode,
      nodeBorderColor,
      expandedNodes
    ));

    // Force a re-render of nodes (not the entire graph)
    if (graphRef.current.d3ReheatSimulation) {
      graphRef.current.d3ReheatSimulation();
    }
  }, [isDarkMode, highlightedNodeId, selectedNode, expandedNodes]);

  const containerBorderColor = isDarkMode ? '#333' : '#e0e0e0';
  const containerBackgroundColor = isDarkMode ? '#1e1e1e' : '#ffffff';
  const containerBoxShadow = isDarkMode 
    ? '0 4px 6px rgba(0, 0, 0, 0.3)' 
    : '0 4px 6px rgba(0, 0, 0, 0.1)';
  
  const panelBackgroundColor = isDarkMode ? '#2a2a2a' : '#fafafa';
  const panelTextColor = isDarkMode ? '#ffffff' : '#1a1a1a';
  const panelBorderColor = isDarkMode ? '#555' : '#e0e0e0';
  const menuBarBackgroundColor = isDarkMode ? '#252525' : '#f0f0f0';
  const menuBarBorderColor = isDarkMode ? '#444' : '#ddd';
  const menuBarTextColor = isDarkMode ? '#ffffff' : '#1a1a1a';
  const buttonHoverColor = isDarkMode ? '#333' : '#e0e0e0';

  const graphHeight = height - menuBarHeight;
  const graphAreaHeight = height - menuBarHeight;

  return (
    <div 
      ref={outerContainerRef}
      style={{
        width: '100%',
        border: `1px solid ${containerBorderColor}`,
        borderRadius: '8px',
        overflow: 'hidden',
        backgroundColor: containerBackgroundColor,
        boxShadow: containerBoxShadow,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        gap: '0',
        height: graphAreaHeight,
        position: 'relative',
      }}>
        <div ref={containerRef} style={{ 
          flex: paneVisible ? '1 1 80%' : '1 1 100%', 
          minWidth: 0, 
          height: graphAreaHeight,
          position: 'relative',
        }} />
        {/* Right-click floating menu */}
        {rightClickMenu && (() => {
          const node = graphData.nodes.find((n: any) => n.id === rightClickMenu.nodeId);
          if (!node) return null;
          
          const hasChildren = node.hasChildren;
          const isExpanded = expandedNodes.has(rightClickMenu.nodeId);
          const menuItems = [];
          
          // Add expand/fold option for parent nodes
          if (hasChildren) {
            menuItems.push({
              label: isExpanded ? 'Fold' : 'Expand',
              icon: isExpanded ? '▼' : '▶',
              action: () => {
                toggleNodeExpansion(rightClickMenu.nodeId);
                setRightClickMenu(null);
              },
            });
          }
          
          // Add anchor link option
          menuItems.push({
            label: 'Copy Anchor Link',
            icon: '📋',
            action: async () => {
              await copyAnchorLink(rightClickMenu.nodeId, undefined);
              setRightClickMenu(null);
            },
          });
          
          return (
            <div
              style={{
                position: 'absolute',
                left: `${rightClickMenu.x}px`,
                top: `${rightClickMenu.y}px`,
                backgroundColor: isDarkMode ? '#2a2a2a' : '#ffffff',
                border: `1px solid ${isDarkMode ? '#555' : '#ddd'}`,
                borderRadius: '8px',
                boxShadow: isDarkMode 
                  ? '0 4px 12px rgba(0, 0, 0, 0.5)' 
                  : '0 4px 12px rgba(0, 0, 0, 0.15)',
                padding: '4px',
                minWidth: '160px',
                zIndex: 1000,
              }}
              onClick={(e) => e.stopPropagation()}
              onContextMenu={(e) => e.preventDefault()}
            >
              {menuItems.map((item, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    item.action();
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    textAlign: 'left',
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: isDarkMode ? '#ffffff' : '#1a1a1a',
                    fontSize: '14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    borderRadius: '4px',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = isDarkMode ? '#333' : '#f0f0f0';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          );
        })()}
        {contextMenu && (
          <div
            style={{
              position: 'absolute',
              left: `${contextMenu.x}px`,
              top: `${contextMenu.y}px`,
              backgroundColor: isDarkMode ? '#2a2a2a' : '#ffffff',
              border: `1px solid ${isDarkMode ? '#555' : '#ddd'}`,
              borderRadius: '4px',
              boxShadow: isDarkMode 
                ? '0 4px 12px rgba(0, 0, 0, 0.5)' 
                : '0 4px 12px rgba(0, 0, 0, 0.15)',
              padding: '4px 0',
              minWidth: '180px',
              zIndex: 1000,
            }}
            onClick={(e) => e.stopPropagation()}
            onContextMenu={(e) => e.preventDefault()}
          >
            <button
              onClick={() => copyAnchorLink(contextMenu.nodeId, contextMenu.edgeId)}
              style={{
                width: '100%',
                padding: '8px 16px',
                textAlign: 'left',
                backgroundColor: 'transparent',
                border: 'none',
                color: isDarkMode ? '#ffffff' : '#1a1a1a',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = isDarkMode ? '#333' : '#f0f0f0';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              📋 Copy Anchor Link
            </button>
          </div>
        )}
        {paneVisible && (
          <div style={{
            flex: '0 0 20%',
            minWidth: 0,
            height: graphAreaHeight,
            borderLeft: `2px solid ${panelBorderColor}`,
            backgroundColor: panelBackgroundColor,
            padding: '12px',
            overflowY: 'auto',
            boxSizing: 'border-box',
          }}>
            {selectedNode ? (() => {
              // Find ingress and egress links for the selected node
              const ingressLinks = graphData.links.filter((link: any) => {
                const targetId = typeof link.target === 'string' ? link.target : link.target?.id;
                return targetId === selectedNode.id;
              });
              const egressLinks = graphData.links.filter((link: any) => {
                const sourceId = typeof link.source === 'string' ? link.source : link.source?.id;
                return sourceId === selectedNode.id;
              });

              // Get connected nodes
              const ingressNodes = ingressLinks.map((link: any) => {
                const sourceId = typeof link.source === 'string' ? link.source : link.source?.id;
                return graphData.nodes.find((n: any) => n.id === sourceId);
              }).filter(Boolean);

              const egressNodes = egressLinks.map((link: any) => {
                const targetId = typeof link.target === 'string' ? link.target : link.target?.id;
                return graphData.nodes.find((n: any) => n.id === targetId);
              }).filter(Boolean);

              // Function to handle node selection from panel
              const handleNodeClick = (nodeId: string) => {
                const node = graphData.nodes.find((n: any) => n.id === nodeId);
                if (node) {
                  setSelectedNode(cleanNodeForSelection(node));
                  setHighlightedNodeId(nodeId);
                  setSelectedEdge(null);
                  setHighlightedEdgeId(null);
                  
                  // Expand node if it has children (similar to onNodeClick behavior)
                  if (node.hasChildren && !expandedNodes.has(nodeId)) {
                    setExpandedNodes(prev => {
                      const newSet = new Set(prev);
                      newSet.add(nodeId);
                      return newSet;
                    });
                  }
                  
                  // Update URL fragment
                  if (graphId) {
                    window.location.hash = `#${graphId}-node-${nodeId}`;
                  }
                  
                  // Center on the node if graph is available
                  if (graphRef.current && node.x !== undefined && node.y !== undefined) {
                    graphRef.current.centerAt(node.x, node.y, 500);
                  }
                }
              };

              const linkStyle = {
                color: isDarkMode ? '#68BDF6' : '#2563eb',
                textDecoration: 'none',
                fontSize: '12px',
                cursor: 'pointer',
                display: 'block',
                padding: '4px 0',
                borderBottom: `1px solid ${isDarkMode ? '#333' : '#eee'}`,
                transition: 'opacity 0.2s',
              };

              const linkHoverStyle = {
                opacity: 0.7,
              };

              return (
                <div>
                  <h3 style={{
                    margin: '0 0 12px 0',
                    color: panelTextColor,
                    fontSize: '14px',
                    fontWeight: '600',
                    lineHeight: '1.4',
                  }}>
                    {selectedNode.title || selectedNode.name || selectedNode.id}
                  </h3>
                  {selectedNode.description && typeof selectedNode.description === 'string' && (
                    <p style={{
                      margin: '0 0 16px 0',
                      color: panelTextColor,
                      fontSize: '12px',
                      lineHeight: '1.5',
                      opacity: 0.85,
                    }}>
                      {selectedNode.description}
                    </p>
                  )}
                  {!selectedNode.description && (
                    <p style={{
                      margin: '0 0 16px 0',
                      color: panelTextColor,
                      fontSize: '12px',
                      lineHeight: '1.5',
                      opacity: 0.5,
                      fontStyle: 'italic',
                    }}>
                      No description
                    </p>
                  )}

                  {/* Ingress Section */}
                  {ingressNodes.length > 0 && (
                    <div style={{ marginBottom: '16px' }}>
                      <h4 style={{
                        margin: '0 0 8px 0',
                        color: panelTextColor,
                        fontSize: '12px',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        opacity: 0.8,
                      }}>
                        Ingress ({ingressNodes.length})
                      </h4>
                      <div style={{
                        backgroundColor: isDarkMode ? '#2a2a2a' : '#f5f5f5',
                        borderRadius: '4px',
                        padding: '8px',
                      }}>
                        {ingressNodes.map((node: any, idx: number) => {
                          const link = ingressLinks[idx];
                          const linkLabel = link?.label || 'connected from';
                          return (
                            <div key={node.id} style={{ marginBottom: idx < ingressNodes.length - 1 ? '8px' : '0' }}>
                              <a
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleNodeClick(node.id);
                                }}
                                style={linkStyle}
                                onMouseEnter={(e) => {
                                  Object.assign(e.currentTarget.style, linkHoverStyle);
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.opacity = '1';
                                }}
                              >
                                <span style={{ fontWeight: '500' }}>{node.title || node.name || node.id}</span>
                                {linkLabel && (
                                  <span style={{ opacity: 0.7, fontSize: '11px', marginLeft: '4px' }}>
                                    ({linkLabel})
                                  </span>
                                )}
                              </a>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Egress Section */}
                  {egressNodes.length > 0 && (
                    <div>
                      <h4 style={{
                        margin: '0 0 8px 0',
                        color: panelTextColor,
                        fontSize: '12px',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        opacity: 0.8,
                      }}>
                        Egress ({egressNodes.length})
                      </h4>
                      <div style={{
                        backgroundColor: isDarkMode ? '#2a2a2a' : '#f5f5f5',
                        borderRadius: '4px',
                        padding: '8px',
                      }}>
                        {egressNodes.map((node: any, idx: number) => {
                          const link = egressLinks[idx];
                          const linkLabel = link?.label || 'connected to';
                          return (
                            <div key={node.id} style={{ marginBottom: idx < egressNodes.length - 1 ? '8px' : '0' }}>
                              <a
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleNodeClick(node.id);
                                }}
                                style={linkStyle}
                                onMouseEnter={(e) => {
                                  Object.assign(e.currentTarget.style, linkHoverStyle);
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.opacity = '1';
                                }}
                              >
                                <span style={{ fontWeight: '500' }}>{node.title || node.name || node.id}</span>
                                {linkLabel && (
                                  <span style={{ opacity: 0.7, fontSize: '11px', marginLeft: '4px' }}>
                                    ({linkLabel})
                                  </span>
                                )}
                              </a>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Show message if no connections */}
                  {ingressNodes.length === 0 && egressNodes.length === 0 && (
                    <p style={{
                      margin: '16px 0 0 0',
                      color: panelTextColor,
                      fontSize: '12px',
                      opacity: 0.5,
                      fontStyle: 'italic',
                    }}>
                      No connections
                    </p>
                  )}

                  {/* External Links Section */}
                  {(selectedNode as any).keyLinks && (selectedNode as any).keyLinks.length > 0 && (
                    <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: `1px solid ${isDarkMode ? '#333' : '#eee'}` }}>
                      <h4 style={{
                        margin: '0 0 8px 0',
                        color: panelTextColor,
                        fontSize: '12px',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        opacity: 0.8,
                      }}>
                        Learn More
                      </h4>
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                      }}>
                        {(selectedNode as any).keyLinks.map((link: string, idx: number) => {
                          // Extract hostname for display, with error handling
                          let displayText = link;
                          try {
                            const url = new URL(link);
                            displayText = url.hostname.replace('www.', '');
                            // If it's a GitHub link, show a cleaner format
                            if (displayText.includes('github.com')) {
                              const pathParts = url.pathname.split('/').filter(p => p);
                              if (pathParts.length >= 2) {
                                displayText = `GitHub: ${pathParts[0]}/${pathParts[1]}`;
                              } else {
                                displayText = 'GitHub';
                              }
                            } else if (displayText.includes('medium.com')) {
                              displayText = 'Medium';
                            } else if (displayText.includes('docs.')) {
                              displayText = displayText.replace('docs.', '');
                            }
                          } catch (e) {
                            // If URL parsing fails, just use the link as-is
                            displayText = link.length > 50 ? link.substring(0, 50) + '...' : link;
                          }
                          
                          return (
                            <a
                              key={idx}
                              href={link}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                ...linkStyle,
                                display: 'inline-block',
                                fontSize: '11px',
                                wordBreak: 'break-word',
                              }}
                              onMouseEnter={(e) => {
                                Object.assign(e.currentTarget.style, linkHoverStyle);
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.opacity = '1';
                              }}
                              title={link} // Show full URL on hover
                            >
                              🔗 {displayText} →
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Markdown Section Link */}
                  {selectedNode.markdownSection && (
                    <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: `1px solid ${isDarkMode ? '#333' : '#eee'}` }}>
                      <h4 style={{
                        margin: '0 0 8px 0',
                        color: panelTextColor,
                        fontSize: '12px',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        opacity: 0.8,
                      }}>
                        Documentation
                      </h4>
                      <a
                        href={`#${selectedNode.markdownSection}`}
                        onClick={(e) => {
                          e.preventDefault();
                          // Use a small delay to ensure DOM is ready
                          setTimeout(() => {
                            // First try to find by ID in the main document
                            let section = document.getElementById(selectedNode.markdownSection!);
                            
                            // If not found, try with different ID formats (Docusaurus might add prefixes)
                            if (!section) {
                              // Try with article prefix (common in Docusaurus)
                              section = document.getElementById(`article-${selectedNode.markdownSection}`);
                            }
                            
                            // If still not found, try finding by data attribute
                            if (!section) {
                              section = document.querySelector(`[data-graph-node="${selectedNode.markdownSection}"]`) as HTMLElement;
                            }
                            
                            if (section) {
                              // Scroll the main window, not the pane
                              const rect = section.getBoundingClientRect();
                              const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                              const targetY = rect.top + scrollTop - (window.innerHeight / 2) + (rect.height / 2);
                              
                              window.scrollTo({
                                top: targetY,
                                behavior: 'smooth'
                              });
                              
                              // Highlight the section briefly
                              section.style.transition = 'background-color 0.3s';
                              section.style.backgroundColor = isDarkMode ? 'rgba(255, 215, 0, 0.2)' : 'rgba(255, 215, 0, 0.3)';
                              setTimeout(() => {
                                section!.style.backgroundColor = '';
                              }, 2000);
                            } else {
                              // Try to find by heading text if ID doesn't work
                              const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
                              for (const heading of Array.from(headings)) {
                                const headingEl = heading as HTMLElement;
                                const headingId = headingEl.id || headingEl.getAttribute('data-graph-node');
                                if (headingId === selectedNode.markdownSection || 
                                    headingEl.textContent?.toLowerCase().includes(selectedNode.markdownSection!.toLowerCase())) {
                                  const rect = headingEl.getBoundingClientRect();
                                  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                                  const targetY = rect.top + scrollTop - (window.innerHeight / 2) + (rect.height / 2);
                                  
                                  window.scrollTo({
                                    top: targetY,
                                    behavior: 'smooth'
                                  });
                                  
                                  headingEl.style.transition = 'background-color 0.3s';
                                  headingEl.style.backgroundColor = isDarkMode ? 'rgba(255, 215, 0, 0.2)' : 'rgba(255, 215, 0, 0.3)';
                                  setTimeout(() => {
                                    headingEl.style.backgroundColor = '';
                                  }, 2000);
                                  break;
                                }
                              }
                            }
                          }, 100);
                        }}
                        style={{
                          ...linkStyle,
                          display: 'inline-block',
                        }}
                        onMouseEnter={(e) => {
                          Object.assign(e.currentTarget.style, linkHoverStyle);
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.opacity = '1';
                        }}
                      >
                        📄 View in Documentation →
                      </a>
                    </div>
                  )}
                </div>
              );
            })() : selectedEdge ? (() => {
              // Get source and target nodes for the selected edge
              // Ensure source and target are strings (they should be after cleanEdgeForSelection, but be defensive)
              const sourceId = typeof selectedEdge.source === 'string' ? selectedEdge.source : (selectedEdge.source as any)?.id || String(selectedEdge.source);
              const targetId = typeof selectedEdge.target === 'string' ? selectedEdge.target : (selectedEdge.target as any)?.id || String(selectedEdge.target);
              
              const sourceNode = graphData.nodes.find((n: any) => n.id === sourceId);
              const targetNode = graphData.nodes.find((n: any) => n.id === targetId);
              
              // Get display names for source and target (for rendering)
              const sourceDisplayName = sourceNode?.title || sourceNode?.name || sourceId;
              const targetDisplayName = targetNode?.title || targetNode?.name || targetId;

              // Function to handle node selection from panel
              const handleNodeClick = (nodeId: string) => {
                const node = graphData.nodes.find((n: any) => n.id === nodeId);
                if (node) {
                  setSelectedNode(cleanNodeForSelection(node));
                  setHighlightedNodeId(nodeId);
                  setSelectedEdge(null);
                  setHighlightedEdgeId(null);
                  
                  // Expand node if it has children (similar to onNodeClick behavior)
                  if (node.hasChildren && !expandedNodes.has(nodeId)) {
                    setExpandedNodes(prev => {
                      const newSet = new Set(prev);
                      newSet.add(nodeId);
                      return newSet;
                    });
                  }
                  
                  // Update URL fragment
                  if (graphId) {
                    window.location.hash = `#${graphId}-node-${nodeId}`;
                  }
                  
                  // Center on the node if graph is available
                  if (graphRef.current && node.x !== undefined && node.y !== undefined) {
                    graphRef.current.centerAt(node.x, node.y, 500);
                  }
                }
              };

              const linkStyle = {
                color: isDarkMode ? '#68BDF6' : '#2563eb',
                textDecoration: 'none',
                fontSize: '12px',
                cursor: 'pointer',
                display: 'block',
                padding: '4px 0',
                borderBottom: `1px solid ${isDarkMode ? '#333' : '#eee'}`,
                transition: 'opacity 0.2s',
              };

              const linkHoverStyle = {
                opacity: 0.7,
              };

              return (
                <div>
                  <h3 style={{
                    margin: '0 0 12px 0',
                    color: panelTextColor,
                    fontSize: '14px',
                    fontWeight: '600',
                    lineHeight: '1.4',
                  }}>
                    {(selectedEdge as any).type === 'differentiating' 
                      ? `${sourceDisplayName} vs. ${targetDisplayName}`
                      : (selectedEdge.label || 'Edge')}
                  </h3>

                  {/* Source Node Section */}
                  {sourceNode && (
                    <div style={{ marginBottom: '16px' }}>
                      <h4 style={{
                        margin: '0 0 8px 0',
                        color: panelTextColor,
                        fontSize: '12px',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        opacity: 0.8,
                      }}>
                        Source
                      </h4>
                      <div style={{
                        backgroundColor: isDarkMode ? '#2a2a2a' : '#f5f5f5',
                        borderRadius: '4px',
                        padding: '8px',
                      }}>
                        <a
                          onClick={(e) => {
                            e.preventDefault();
                            handleNodeClick(sourceNode.id);
                          }}
                          style={linkStyle}
                          onMouseEnter={(e) => {
                            Object.assign(e.currentTarget.style, linkHoverStyle);
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.opacity = '1';
                          }}
                        >
                          <span style={{ fontWeight: '500' }}>{sourceNode.title || sourceNode.name || sourceNode.id}</span>
                        </a>
                        {sourceNode.description && (
                          <p style={{
                            margin: '4px 0 0 0',
                            color: panelTextColor,
                            fontSize: '11px',
                            opacity: 0.7,
                            lineHeight: '1.4',
                          }}>
                            {sourceNode.description}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Target Node Section */}
                  {targetNode && (
                    <div style={{ marginBottom: '16px' }}>
                      <h4 style={{
                        margin: '0 0 8px 0',
                        color: panelTextColor,
                        fontSize: '12px',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        opacity: 0.8,
                      }}>
                        Destination
                      </h4>
                      <div style={{
                        backgroundColor: isDarkMode ? '#2a2a2a' : '#f5f5f5',
                        borderRadius: '4px',
                        padding: '8px',
                      }}>
                        <a
                          onClick={(e) => {
                            e.preventDefault();
                            handleNodeClick(targetNode.id);
                          }}
                          style={linkStyle}
                          onMouseEnter={(e) => {
                            Object.assign(e.currentTarget.style, linkHoverStyle);
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.opacity = '1';
                          }}
                        >
                          <span style={{ fontWeight: '500' }}>{targetNode.title || targetNode.name || targetNode.id}</span>
                        </a>
                        {targetNode.description && (
                          <p style={{
                            margin: '4px 0 0 0',
                            color: panelTextColor,
                            fontSize: '11px',
                            opacity: 0.7,
                            lineHeight: '1.4',
                          }}>
                            {targetNode.description}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Comparison Details for Differentiating Edges */}
                  {(selectedEdge as any).type === 'differentiating' && (
                    <>
                      {/* Key Features Comparison */}
                      {(selectedEdge as any).sourceData && (selectedEdge as any).targetData && (
                        <div style={{
                          marginBottom: '16px',
                          padding: '12px',
                          backgroundColor: isDarkMode ? '#2a2a2a' : '#f5f5f5',
                          borderRadius: '4px',
                        }}>
                          <h4 style={{
                            margin: '0 0 8px 0',
                            color: panelTextColor,
                            fontSize: '12px',
                            fontWeight: '600',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            opacity: 0.8,
                          }}>
                            Key Features
                          </h4>
                          <div style={{ fontSize: '11px', lineHeight: '1.6' }}>
                            <div style={{ marginBottom: '12px' }}>
                              <strong style={{ color: isDarkMode ? '#68BDF6' : '#0066cc' }}>
                                {sourceDisplayName}:
                              </strong>
                              <ul style={{
                                margin: '4px 0 0 0',
                                paddingLeft: '20px',
                                listStyleType: 'disc',
                              }}>
                                {((selectedEdge as any).sourceData.key_features || []).map((feature: string, idx: number) => (
                                  <li key={idx}>{feature}</li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <strong style={{ color: isDarkMode ? '#60BE86' : '#006600' }}>
                                {targetDisplayName}:
                              </strong>
                              <ul style={{
                                margin: '4px 0 0 0',
                                paddingLeft: '20px',
                                listStyleType: 'disc',
                              }}>
                                {((selectedEdge as any).targetData.key_features || []).map((feature: string, idx: number) => (
                                  <li key={idx}>{feature}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Use Cases */}
                      {(selectedEdge as any).sourceData && (selectedEdge as any).targetData && (
                        <div style={{
                          marginBottom: '16px',
                          padding: '12px',
                          backgroundColor: isDarkMode ? '#2a2a2a' : '#f5f5f5',
                          borderRadius: '4px',
                        }}>
                          <h4 style={{
                            margin: '0 0 8px 0',
                            color: panelTextColor,
                            fontSize: '12px',
                            fontWeight: '600',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            opacity: 0.8,
                          }}>
                            Use Cases
                          </h4>
                          <div style={{ fontSize: '11px', lineHeight: '1.6' }}>
                            <div style={{ marginBottom: '8px' }}>
                              <strong>{sourceDisplayName}:</strong> {(selectedEdge as any).sourceData.main_use_case}
                            </div>
                            <div>
                              <strong>{targetDisplayName}:</strong> {(selectedEdge as any).targetData.main_use_case}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Similarities */}
                      {(selectedEdge as any).similarities && (selectedEdge as any).similarities.length > 0 && (
                        <div style={{
                          marginBottom: '16px',
                          padding: '12px',
                          backgroundColor: isDarkMode ? '#2a2a2a' : '#f5f5f5',
                          borderRadius: '4px',
                        }}>
                          <h4 style={{
                            margin: '0 0 8px 0',
                            color: '#60BE86',
                            fontSize: '12px',
                            fontWeight: '600',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                          }}>
                            Similarities
                          </h4>
                          <ul style={{
                            margin: 0,
                            paddingLeft: '20px',
                            fontSize: '11px',
                            lineHeight: '1.6',
                          }}>
                            {(selectedEdge as any).similarities.map((similarity: string, idx: number) => (
                              <li key={idx}>{similarity}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Differences */}
                      {(selectedEdge as any).differences && (
                        <div style={{
                          marginBottom: '16px',
                          padding: '12px',
                          backgroundColor: isDarkMode ? '#2a2a2a' : '#f5f5f5',
                          borderRadius: '4px',
                        }}>
                          <h4 style={{
                            margin: '0 0 8px 0',
                            color: '#FF6B6B',
                            fontSize: '12px',
                            fontWeight: '600',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                          }}>
                            Differences
                          </h4>
                          
                          {(selectedEdge as any).differences.source && (selectedEdge as any).differences.source.length > 0 && (
                            <div style={{ marginBottom: '12px' }}>
                              <strong style={{ fontSize: '11px', color: panelTextColor }}>
                                {selectedEdge.source} only:
                              </strong>
                              <ul style={{
                                margin: '4px 0 0 0',
                                paddingLeft: '20px',
                                fontSize: '11px',
                                lineHeight: '1.6',
                              }}>
                                {(selectedEdge as any).differences.source.map((diff: string, idx: number) => (
                                  <li key={idx}>{diff}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {(selectedEdge as any).differences.target && (selectedEdge as any).differences.target.length > 0 && (
                            <div>
                              <strong style={{ fontSize: '11px', color: panelTextColor }}>
                                {selectedEdge.target} only:
                              </strong>
                              <ul style={{
                                margin: '4px 0 0 0',
                                paddingLeft: '20px',
                                fontSize: '11px',
                                lineHeight: '1.6',
                              }}>
                                {(selectedEdge as any).differences.target.map((diff: string, idx: number) => (
                                  <li key={idx}>{diff}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Differentiators */}
                      {(selectedEdge as any).sourceData && (selectedEdge as any).targetData && (
                        <div style={{
                          padding: '12px',
                          backgroundColor: isDarkMode ? '#2a2a2a' : '#f5f5f5',
                          borderRadius: '4px',
                        }}>
                          <h4 style={{
                            margin: '0 0 8px 0',
                            color: panelTextColor,
                            fontSize: '12px',
                            fontWeight: '600',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            opacity: 0.8,
                          }}>
                            Key Differentiators
                          </h4>
                          <div style={{ fontSize: '11px', lineHeight: '1.6' }}>
                            <div style={{ marginBottom: '8px' }}>
                              <strong>{sourceDisplayName}:</strong> {(selectedEdge as any).sourceData.differentiators}
                            </div>
                            <div>
                              <strong>{targetDisplayName}:</strong> {(selectedEdge as any).targetData.differentiators}
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Markdown Section Link */}
                  {selectedEdge.markdownSection && (
                    <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: `1px solid ${isDarkMode ? '#333' : '#eee'}` }}>
                      <h4 style={{
                        margin: '0 0 8px 0',
                        color: panelTextColor,
                        fontSize: '12px',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        opacity: 0.8,
                      }}>
                        Documentation
                      </h4>
                      <a
                        href={`#${selectedEdge.markdownSection}`}
                        onClick={(e) => {
                          e.preventDefault();
                          // Use a small delay to ensure DOM is ready
                          setTimeout(() => {
                            // First try to find by ID in the main document
                            let section = document.getElementById(selectedEdge.markdownSection!);
                            
                            // If not found, try with different ID formats (Docusaurus might add prefixes)
                            if (!section) {
                              // Try with article prefix (common in Docusaurus)
                              section = document.getElementById(`article-${selectedEdge.markdownSection}`);
                            }
                            
                            // If still not found, try finding by data attribute
                            if (!section) {
                              section = document.querySelector(`[data-graph-edge="${selectedEdge.markdownSection}"]`) as HTMLElement;
                            }
                            
                            if (section) {
                              // Scroll the main window, not the pane
                              const rect = section.getBoundingClientRect();
                              const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                              const targetY = rect.top + scrollTop - (window.innerHeight / 2) + (rect.height / 2);
                              
                              window.scrollTo({
                                top: targetY,
                                behavior: 'smooth'
                              });
                              
                              // Highlight the section briefly
                              section.style.transition = 'background-color 0.3s';
                              section.style.backgroundColor = isDarkMode ? 'rgba(255, 215, 0, 0.2)' : 'rgba(255, 215, 0, 0.3)';
                              setTimeout(() => {
                                section!.style.backgroundColor = '';
                              }, 2000);
                            } else {
                              // Try to find by heading text if ID doesn't work
                              const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
                              for (const heading of Array.from(headings)) {
                                const headingEl = heading as HTMLElement;
                                const headingId = headingEl.id || headingEl.getAttribute('data-graph-edge');
                                if (headingId === selectedEdge.markdownSection || 
                                    headingEl.textContent?.toLowerCase().includes(selectedEdge.markdownSection!.toLowerCase())) {
                                  const rect = headingEl.getBoundingClientRect();
                                  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                                  const targetY = rect.top + scrollTop - (window.innerHeight / 2) + (rect.height / 2);
                                  
                                  window.scrollTo({
                                    top: targetY,
                                    behavior: 'smooth'
                                  });
                                  
                                  headingEl.style.transition = 'background-color 0.3s';
                                  headingEl.style.backgroundColor = isDarkMode ? 'rgba(255, 215, 0, 0.2)' : 'rgba(255, 215, 0, 0.3)';
                                  setTimeout(() => {
                                    headingEl.style.backgroundColor = '';
                                  }, 2000);
                                  break;
                                }
                              }
                            }
                          }, 100);
                        }}
                        style={{
                          ...linkStyle,
                          display: 'inline-block',
                        }}
                        onMouseEnter={(e) => {
                          Object.assign(e.currentTarget.style, linkHoverStyle);
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.opacity = '1';
                        }}
                      >
                        📄 View in Documentation →
                      </a>
                    </div>
                  )}
                </div>
              );
            })() : (
              <div style={{
                color: panelTextColor,
                fontSize: '12px',
                opacity: 0.5,
                fontStyle: 'italic',
              }}>
                Hover or click a node or edge
              </div>
            )}
          </div>
        )}
      </div>
      <div style={{
        height: menuBarHeight,
        borderTop: `1px solid ${menuBarBorderColor}`,
        backgroundColor: menuBarBackgroundColor,
        display: 'flex',
        alignItems: 'center',
        padding: '0 12px',
        gap: '8px',
        boxSizing: 'border-box',
      }}>
        <button
          onClick={autoCenter}
          style={{
            padding: '6px 12px',
            fontSize: '12px',
            backgroundColor: 'transparent',
            border: `1px solid ${menuBarBorderColor}`,
            borderRadius: '4px',
            color: menuBarTextColor,
            cursor: 'pointer',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = buttonHoverColor;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          Center
        </button>
        <button
          onClick={expandAll}
          style={{
            padding: '6px 12px',
            fontSize: '12px',
            backgroundColor: 'transparent',
            border: `1px solid ${menuBarBorderColor}`,
            borderRadius: '4px',
            color: menuBarTextColor,
            cursor: 'pointer',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = buttonHoverColor;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          Expand All
        </button>
        <button
          onClick={collapseAll}
          style={{
            padding: '6px 12px',
            fontSize: '12px',
            backgroundColor: 'transparent',
            border: `1px solid ${menuBarBorderColor}`,
            borderRadius: '4px',
            color: menuBarTextColor,
            cursor: 'pointer',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = buttonHoverColor;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          Collapse All
        </button>
        <div style={{ flex: 1 }} />
        <button
          onClick={togglePane}
          style={{
            padding: '6px 12px',
            fontSize: '12px',
            backgroundColor: 'transparent',
            border: `1px solid ${menuBarBorderColor}`,
            borderRadius: '4px',
            color: menuBarTextColor,
            cursor: 'pointer',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = buttonHoverColor;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          {paneVisible ? 'Hide Pane' : 'Show Pane'}
        </button>
      </div>
    </div>
  );
};

// Wrap the implementation with BrowserOnly to prevent SSR issues
const GraphRenderer: React.FC<GraphRendererProps> = (props) => {
  return (
    <BrowserOnly fallback={<div>Loading graph...</div>}>
      {() => <GraphRendererImpl {...props} />}
    </BrowserOnly>
  );
};

export default GraphRenderer;

