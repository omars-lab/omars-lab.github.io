/**
 * ============================================================================
 * GraphRenderer Component
 * ============================================================================
 * 
 * A comprehensive force-directed graph visualization component built for Docusaurus.
 * 
 * KEY LEARNINGS & PATTERNS:
 * 
 * 1. BROWSER-ONLY RENDERING (SSR Prevention)
 *    - Uses BrowserOnly wrapper to prevent server-side rendering issues
 *    - Browser-only dependencies (react-force-graph-2d, d3-force, canvas APIs) 
 *      are dynamically imported inside BrowserOnly callback
 *    - This prevents "window is not defined" errors during static site generation
 * 
 * 2. INFINITE LOOP PREVENTION (Critical Pattern)
 *    - Problem: useEffect dependencies on callbacks/objects that change every render
 *    - Solution: Use refs to store latest callbacks/values, update refs in separate useEffect
 *    - Pattern: 
 *      ```ts
 *      const callbackRef = useRef(callback);
 *      useEffect(() => { callbackRef.current = callback; }, [callback]);
 *      // Then use callbackRef.current in other useEffects instead of callback
 *      ```
 *    - For graphData: Use graphDataRef to avoid dependency on object that changes when expandedNodes changes
 *    - For callbacks: Use highlightNodeRef/highlightEdgeRef to break dependency cycles
 * 
 * 3. DEPENDENCY ARRAY OPTIMIZATION
 *    - Instead of depending on entire objects (graphData), depend on primitives (graphData.nodes.length)
 *    - Use refs to track previous values and only run effects when meaningful changes occur
 *    - Example: Track previousGraphDataNodesLengthRef to prevent re-runs when count unchanged
 * 
 * 4. react-force-graph-2d vs react-force-graph
 *    - Use react-force-graph-2d (2D-only) instead of react-force-graph (includes 3D/VR/AR)
 *    - Avoids A-Frame dependencies that cause "AFRAME is not defined" errors
 *    - No need for custom webpack configuration to ignore A-Frame
 *    - Exports ForceGraph as default export, not named export
 * 
 * 5. REF ACCESS PATTERNS
 *    - graphRef.current points to component instance, not DOM element
 *    - Access underlying force-graph methods via: (graphRef.current as any)?.method?.()
 *    - Use optional chaining to safely access methods that may not exist
 *    - graphData() method doesn't exist on ref - use graphData from props/state instead
 * 
 * 6. STATE UPDATE OPTIMIZATION
 *    - Use functional updates (prev => new) to prevent unnecessary re-renders
 *    - Check if values actually changed before updating state
 *    - Example: Only update nodePositions if positions actually changed (threshold-based comparison)
 * 
 * ============================================================================
 */

import React, { useMemo, useEffect, useRef, useState, useCallback } from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';
import { useColorMode } from '@docusaurus/theme-common';
import styles from './GraphRenderer.module.css';
import { 
  Node, 
  Link, 
  GraphData, 
  GraphRendererProps 
} from './types';
import {
  findPathToNode,
  findNodeById,
  getNodeRadius,
  getNodeColor,
  getNodeLabel,
  cleanNodeForSelection,
  cleanEdgeForSelection,
  getAllNodesWithChildren,
  isValidNodeCoordinates,
  getEdgeCoordinates as getEdgeCoordinatesUtil,
  calculateAvailableTextWidth,
  calculateEmojiAreaCenterY,
  calculateLinePositions,
  getNodeStatusIndicator,
  breakLongWord,
  wrapTextIntoLines,
  truncateLine,
  calculateOptimalFontSize,
  applyZoomScaling,
  calculateOptimalTitleFontSize,
  calculateIndicatorFontSize,
} from './graphUtils';

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
 * Note: Core utility functions (getNodeRadius, getNodeColor, getNodeLabel, etc.)
 * are now imported from './graphUtils' to improve maintainability.
 * 
 * Functions below are component-specific rendering helpers that depend on
 * canvas context or component state.
 * ============================================================================
 */

// Note: isValidNodeCoordinates is now imported from './graphUtils'

// Note: calculateAvailableTextWidth, calculateEmojiAreaCenterY, and getNodeStatusIndicator
// are now imported from './graphUtils'

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

// Note: calculateLinePositions is now imported from './graphUtils'

// Note: breakLongWord is now imported from './graphUtils'

// Note: wrapTextIntoLines is now imported from './graphUtils'

// Note: calculateOptimalFontSize is now imported from './graphUtils'

// Note: applyZoomScaling is now imported from './graphUtils'

// Note: truncateLine is now imported from './graphUtils'

// Note: calculateOptimalTitleFontSize is now imported from './graphUtils'

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

// Note: calculateIndicatorFontSize is now imported from './graphUtils'

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

interface GraphRendererImplProps extends GraphRendererProps {
  ForceGraph2D: any;
  d3: any;
  NodeRenderer: any;
}

const GraphRendererImpl: React.FC<GraphRendererImplProps> = ({ 
  data, 
  width = 800, 
  height = 600,
  highlightNodeId: propHighlightNodeId,
  highlightEdgeId: propHighlightEdgeId,
  graphId = 'graph',
  onEdgeClick,
  initialExpandedNodes,
  ForceGraph2D,
  d3,
  NodeRenderer
}) => {
  const graphRef = useRef<any>(null); // This will hold the ForceGraph2D component instance (react-force-graph exposes underlying instance via ref)

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

  // Note: cleanNodeForSelection is imported from './graphUtils'

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
  // Uses getEdgeCoordinatesUtil from graphUtils, wrapped in useCallback for component use
  const getEdgeCoordinates = useCallback((
    link: any,
    startNode: any,
    endNode: any,
    getNodeRadiusFn: (hasChildren: boolean) => number
  ): { startX: number; startY: number; endX: number; endY: number; midX: number; midY: number } | null => {
    return getEdgeCoordinatesUtil(startNode, endNode, getNodeRadiusFn);
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

  // Note: getAllNodesWithChildren is imported from './graphUtils'
  // Wrapper to pass data.nodes
  const getAllNodesWithChildrenWrapper = useCallback((): Set<string> => {
    return getAllNodesWithChildren(data.nodes);
  }, [data]);

  // Expand all nodes
  const expandAll = useCallback(() => {
    const allNodesWithChildren = getAllNodesWithChildrenWrapper();
    setExpandedNodes(allNodesWithChildren);
  }, [getAllNodesWithChildrenWrapper]);

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
    if (!graphRef.current) return;
    
    // Use the graphData from props/state instead of calling graphData() on the ref
    // react-force-graph-2d ref exposes the instance, but we should use our data
    if (!graphData || !graphData.nodes) return;

    // Get the canvas element from the graph component
    // With react-force-graph-2d, the ref points to the component instance
    // We need to find the canvas from the DOM
    const canvas = document.querySelector('canvas') || null;
    if (!canvas) return;
    
    const containerRect = canvas.getBoundingClientRect();
    // Get the current zoom and pan transform - react-force-graph-2d exposes this via ref
    const zoom = (graphRef.current as any)?.zoom?.() || 1;
    
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
    
    // Remove console.log to prevent infinite logging
    // Only update positions if they've actually changed to prevent unnecessary re-renders
    setNodePositions(prevPositions => {
      // Check if positions have actually changed
      if (prevPositions.size !== positions.size) {
        return positions;
      }
      for (const [id, pos] of positions.entries()) {
        const prevPos = prevPositions.get(id);
        if (!prevPos || 
            Math.abs(prevPos.x - pos.x) > 0.1 || 
            Math.abs(prevPos.y - pos.y) > 0.1 || 
            Math.abs(prevPos.radius - pos.radius) > 0.1) {
          return positions;
        }
      }
      return prevPositions; // No change, return previous to prevent re-render
    });
  }, [graphData, getNodeRadius]);

  // Update node positions periodically and on graph updates
  // Use a ref to track if we should be updating to prevent infinite loops
  const isUpdatingPositionsRef = useRef(false);
  
  // Track previous graphData nodes length to prevent unnecessary re-runs
  const previousGraphDataNodesLengthForPositionsRef = useRef<number>(0);
  
  useEffect(() => {
    if (!graphRef.current || !graphData || !graphData.nodes.length) return;
    
    // Only re-run if nodes count actually changed
    if (previousGraphDataNodesLengthForPositionsRef.current === graphData.nodes.length && isUpdatingPositionsRef.current) {
      return;
    }
    
    previousGraphDataNodesLengthForPositionsRef.current = graphData.nodes.length;
    
    // Only start the update loop if not already running
    if (isUpdatingPositionsRef.current) return;
    isUpdatingPositionsRef.current = true;
    
    let animationFrameId: number;
    let lastUpdateTime = 0;
    const UPDATE_INTERVAL = 100; // Update at most every 100ms
    
    const updatePositions = (currentTime: number) => {
      // Throttle updates to prevent excessive re-renders
      if (currentTime - lastUpdateTime >= UPDATE_INTERVAL) {
        updateNodePositions();
        lastUpdateTime = currentTime;
      }
      animationFrameId = requestAnimationFrame(updatePositions);
    };
    
    // Start the update loop
    animationFrameId = requestAnimationFrame(updatePositions);
    
    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      isUpdatingPositionsRef.current = false;
    };
  }, [graphData.nodes.length, updateNodePositions]);

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
        
        // Get current camera position - access via ref
        const currentZoom = (graphRef.current as any)?.zoom?.() || 1;
        const graphContainer = graphRef.current?.parentElement;
        const containerElement = graphContainer?.parentElement;
        const actualWidth = containerElement ? containerElement.offsetWidth : width;
        const panelWidth = paneVisible ? Math.floor(actualWidth * 0.2) : 0;
        const graphWidth = actualWidth - panelWidth;
        
        // Center the view
        // Access centerAt via ref - react-force-graph-2d exposes underlying instance
        (graphRef.current as any)?.centerAt?.(centerX, centerY, 1000);
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

  // Note: findPathToNode and findNodeById are imported from './graphUtils'

  // Highlight a specific node by expanding parents and centering
  const highlightNode = useCallback((nodeId: string, scrollToGraph = false) => {
    if (!nodeId) return;
    
    // First check if node exists in current visible graph data (to avoid errors)
    const nodeExistsInGraph = graphData.nodes.some((n: any) => n.id === nodeId);
    if (!nodeExistsInGraph) {
      // Check if it exists in original data (might be collapsed)
      const path = findPathToNode(nodeId, data.nodes);
      if (!path) {
        // Only warn if node truly doesn't exist anywhere
        if (process.env.NODE_ENV === 'development') {
          console.warn(`Node not found: ${nodeId}`);
        }
        return; // Node not found
      }
    }
    
    // Scroll to graph if requested (for anchor links)
    if (scrollToGraph && outerContainerRef.current) {
      outerContainerRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    }
    
    // Find path to the node in original data
    const path = findPathToNode(nodeId, data.nodes);
    if (!path) {
      // If node exists in graph but not in original data, just highlight it
      setHighlightedNodeId(nodeId);
      return;
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
  }, [data.nodes, graphData.nodes, findPathToNode, findNodeById, cleanNodeForSelection]);

  // Highlight a specific edge
  const highlightEdge = useCallback((edgeId: string, scrollToGraph = false) => {
    if (!edgeId) return;
    
    // Check if the edge exists in the current graph data
    // This is important because if nodes are collapsed, edges referencing those nodes won't be in the graph
    const edge = graphData.links.find((l: any) => l.id === edgeId);
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

  /**
   * ============================================================================
   * INFINITE LOOP PREVENTION PATTERN
   * ============================================================================
   * 
   * PROBLEM: useEffect hooks that depend on callbacks or objects that change
   *          every render cause infinite loops (Maximum update depth exceeded).
   * 
   * SOLUTION: Store callbacks/values in refs and update refs in separate useEffect.
   *           Other useEffects use refs instead of direct dependencies.
   * 
   * WHY THIS WORKS:
   * - Refs don't trigger re-renders when updated
   * - Refs always hold the latest value
   * - Breaking the dependency cycle prevents infinite loops
   * 
   * PATTERN:
   * 1. Create ref: const callbackRef = useRef(callback)
   * 2. Update ref: useEffect(() => { callbackRef.current = callback }, [callback])
   * 3. Use ref: useEffect(() => { callbackRef.current() }, [otherStableDeps])
   * 
   * ============================================================================
   */
  
  // Use refs to store latest callbacks to avoid infinite loops
  const highlightNodeRef = useRef(highlightNode);
  const highlightEdgeRef = useRef(highlightEdge);
  
  // Update refs when callbacks change (doesn't cause re-render)
  useEffect(() => {
    highlightNodeRef.current = highlightNode;
    highlightEdgeRef.current = highlightEdge;
  }, [highlightNode, highlightEdge]);

  // Use ref to store latest graphData for event handlers (prevents infinite loops)
  // graphData changes when expandedNodes changes, but we don't want to re-run
  // event handlers every time - ref allows access to latest without dependency
  const graphDataRef = useRef(graphData);
  useEffect(() => {
    graphDataRef.current = graphData;
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
        highlightNodeRef.current(nodeId, true);
        // Update URL hash
        if (graphId) {
          window.location.hash = `#${graphId}-node-${nodeId}`;
        }
      } else if (edgeId) {
        e.preventDefault();
        // Use ref to get latest graphData
        const edge = graphDataRef.current.links.find((l: any) => l.id === edgeId);
        if (edge) {
          highlightEdgeRef.current(edgeId, true);
          setSelectedEdge(cleanEdgeForSelection(edge));
          setSelectedNode(null);
          // Update URL hash
          if (graphId) {
            window.location.hash = `#${graphId}-edge-${edgeId}`;
          }
        } else {
          if (process.env.NODE_ENV === 'development') {
            console.warn(`Edge not found: ${edgeId} (source/target nodes may be collapsed)`);
          }
        }
      }
    };
    
    // Add click listener to document to catch all markdown section clicks
    document.addEventListener('click', handleMarkdownSectionClick, true);
    
    return () => {
      document.removeEventListener('click', handleMarkdownSectionClick, true);
    };
  }, [graphId, setSelectedEdge, setSelectedNode]);

  // Handle URL hash changes
  useEffect(() => {
    const nodeHashPrefix = `#${graphId}-node-`;
    const edgeHashPrefix = `#${graphId}-edge-`;
    
    const checkHash = () => {
      const hash = window.location.hash;
      if (hash.startsWith(nodeHashPrefix)) {
        const nodeId = hash.substring(nodeHashPrefix.length);
        // Use ref to avoid dependency on highlightNode
        highlightNodeRef.current(nodeId, true); // Scroll to graph when hash changes
      } else if (hash.startsWith(edgeHashPrefix)) {
        const edgeId = hash.substring(edgeHashPrefix.length);
        // Use ref to get latest graphData
        const edge = graphDataRef.current.links.find((l: any) => l.id === edgeId);
        if (edge) {
          // Use ref to avoid dependency on highlightEdge
          highlightEdgeRef.current(edgeId, true); // Scroll to graph when hash changes
          setSelectedEdge(cleanEdgeForSelection(edge));
          setSelectedNode(null);
        } else {
          if (process.env.NODE_ENV === 'development') {
            console.warn(`Edge not found: ${edgeId} (source/target nodes may be collapsed)`);
          }
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
  }, [graphId, cleanEdgeForSelection, setSelectedEdge, setSelectedNode]);

  // Handle prop-based highlighting
  useEffect(() => {
    if (propHighlightNodeId) {
      highlightNodeRef.current(propHighlightNodeId);
    }
  }, [propHighlightNodeId]);

  useEffect(() => {
    if (propHighlightEdgeId) {
      highlightEdgeRef.current(propHighlightEdgeId);
    }
  }, [propHighlightEdgeId]);

  /**
   * ============================================================================
   * DEPENDENCY ARRAY OPTIMIZATION PATTERN
   * ============================================================================
   * 
   * PROBLEM: Depending on entire objects (like graphData) causes effects to run
   *          every time the object reference changes, even if content is the same.
   * 
   * SOLUTION: 
   * 1. Depend on primitives (graphData.nodes.length) instead of objects
   * 2. Use refs to track previous values
   * 3. Only run effect when meaningful changes occur
   * 
   * WHY THIS MATTERS:
   * - graphData is recreated when expandedNodes changes (due to useMemo)
   * - But we only care if node count actually changed
   * - Tracking previous values prevents unnecessary re-runs
   * 
   * ============================================================================
   */
  
  // Re-center on highlighted node when graph data updates (after expansion)
  // Use refs to track previous values and prevent infinite loops
  const previousHighlightedNodeIdRef = useRef<string | null>(null);
  const previousGraphDataNodesLengthRef = useRef<number>(0);
  
  useEffect(() => {
    // Only run if highlightedNodeId actually changed or graphData nodes count changed
    const nodeIdChanged = previousHighlightedNodeIdRef.current !== highlightedNodeId;
    const nodesCountChanged = previousGraphDataNodesLengthRef.current !== graphData.nodes.length;
    
    if (!nodeIdChanged && !nodesCountChanged) return;
    
    // Update refs
    previousHighlightedNodeIdRef.current = highlightedNodeId;
    previousGraphDataNodesLengthRef.current = graphData.nodes.length;
    
    if (highlightedNodeId && graphRef.current && graphData.nodes.length > 0) {
      // Wait for node to be positioned by force simulation
      const attemptCenter = (attempts = 0) => {
        if (attempts > 30) return; // Give up after 3 seconds
        
        setTimeout(() => {
          if (graphRef.current) {
            // Get the current graph data (may have updated positions)
            // Use graphData from state instead of calling graphData() on ref
            const node = graphData.nodes.find((n: any) => n.id === highlightedNodeId);
            
            if (node && node.x !== undefined && node.y !== undefined && 
                isFinite(node.x) && isFinite(node.y)) {
              // Center and zoom on the node
              // Access methods via ref - react-force-graph-2d exposes underlying instance
              (graphRef.current as any)?.centerAt?.(node.x, node.y, 1000);
              (graphRef.current as any)?.zoom?.(1.5, 1000);
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
  }, [highlightedNodeId, graphData.nodes.length, cleanNodeForSelection]);

  // Note: updateGraphWidth removed - ForceGraph2D handles resizing via props
  // Width and height are calculated above and passed as props to the component

  // Calculate bounding box of all visible nodes
  const calculateNodeBoundingBox = useCallback(() => {
    if (!graphRef.current) return null;
    
    // Use graphData from state instead of calling graphData() on ref
    if (!graphData || !graphData.nodes || graphData.nodes.length === 0) {
      return null;
    }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    let validNodes = 0;

    graphData.nodes.forEach((node: any) => {
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
    if (!graphRef.current) return true;
    
    const bbox = calculateNodeBoundingBox();
    if (!bbox) return true;

    // With react-force-graph-2d, ref points to component instance, not DOM
    // Access container via outerContainerRef instead
    const containerElement = outerContainerRef.current?.parentElement;
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
    if (!graphRef.current) return true;
    
    // Use graphData from state instead of calling graphData() on ref
    if (!graphData || !graphData.nodes || graphData.nodes.length <= 1) {
      return true; // If there's only one node or none, allow zoom
    }

    // With react-force-graph-2d, ref points to component instance, not DOM
    // Access container via outerContainerRef instead
    const containerElement = outerContainerRef.current?.parentElement;
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
    
    // Access screen2GraphCoords via ref - react-force-graph-2d exposes underlying instance
    if ((graphRef.current as any)?.screen2GraphCoords) {
      const center = (graphRef.current as any).screen2GraphCoords(graphWidth / 2, graphHeight / 2);
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
    graphData.nodes.forEach((node: any) => {
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
    graphData.nodes.forEach((node: any) => {
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

  // Theme-based colors (moved outside useEffect for use in props)
  const backgroundColor = isDarkMode ? '#1e1e1e' : '#ffffff';
  const linkColor = isDarkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)';
  const arrowColor = isDarkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)';
  const nodeBorderColor = isDarkMode ? '#ffffff' : '#333333';

  // Calculate graph dimensions
  // Note: With react-force-graph, we calculate dimensions based on props
  // The component will handle responsive sizing
  const outerContainerRef = useRef<HTMLDivElement>(null);
  const containerElement = outerContainerRef.current?.parentElement;
  const actualWidth = containerElement ? containerElement.offsetWidth : width;
  const panelWidth = paneVisible ? Math.floor(actualWidth * 0.2) : 0;
  const graphWidth = actualWidth - panelWidth;

  // Memoize graph data
  const memoizedGraphData = useMemo(() => graphData, [graphData]);

  // Create memoized callbacks for event handlers
  const handleNodeClick = useCallback((node: any) => {
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
  }, [highlightedEdgeId, selectedEdge, selectedNode, graphId, toggleNodeExpansion, setExpandedNodes, cleanNodeForSelection]);

  const handleNodeRightClick = useCallback((node: any) => {
    // Show floating menu on right-click
    if (rightClickPositionRef.current) {
      setRightClickMenu({
        nodeId: node.id,
        x: rightClickPositionRef.current.x,
        y: rightClickPositionRef.current.y,
      });
      rightClickPositionRef.current = null;
    }
  }, []);

  const handleLinkClick = useCallback((link: any) => {
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
  }, [highlightedEdgeId, highlightedNodeId, graphId, onEdgeClick, cleanEdgeForSelection]);

  const handleLinkRightClick = useCallback((link: any) => {
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
  }, []);

  const handleNodeDrag = useCallback((node: any) => {
    // Update node positions as nodes are dragged
    updateNodePositions();
  }, [updateNodePositions]);

  const handleNodeDragEnd = useCallback((node: any) => {
    // Update node positions after drag ends
    updateNodePositions();
  }, [updateNodePositions]);

  const handleZoom = useCallback((transform: { k: number; x: number; y: number }) => {
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
        // Access zoom via ref - react-force-graph-2d exposes underlying instance
        isAdjustingZoomRef.current = true;
        (graphRef.current as any)?.zoom?.(previousZoom, 0);
        setTimeout(() => {
          isAdjustingZoomRef.current = false;
        }, 10);
        return;
      }
    } else if (newZoom > previousZoom) {
      // Zooming in - check if allowed
      if (!canZoomIn(newZoom)) {
        // Prevent zoom in - revert to previous zoom
        // Access zoom via ref - react-force-graph-2d exposes underlying instance
        isAdjustingZoomRef.current = true;
        (graphRef.current as any)?.zoom?.(previousZoom, 0);
        setTimeout(() => {
          isAdjustingZoomRef.current = false;
        }, 10);
        return;
      }
    }
    
    // Update previous zoom if zoom was allowed
    previousZoomRef.current = newZoom;
  }, [updateNodePositions, canZoomOut, canZoomIn]);

  // Create memoized render functions
  const nodeCanvasObject = useMemo(() => createNodeRenderer(
    isDarkMode,
    highlightedNodeId,
    selectedNode,
    nodeBorderColor,
    expandedNodes
  ), [createNodeRenderer, isDarkMode, highlightedNodeId, selectedNode, nodeBorderColor, expandedNodes]);

  const linkCanvasObjectMode = useCallback((link: any) => {
    // Use 'replace' mode for comparison edges to ensure they're drawn
    // Use 'after' mode for regular edges to draw labels on top
    const linkType = (link as any).type;
    const isComparison = linkType === 'differentiating';
    return isComparison ? 'replace' : 'after';
  }, []);

  const linkCanvasObject = useCallback((link: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const isHighlighted = highlightedEdgeId === link.id;
    const linkType = (link as any).type;
    const isComparisonEdge = linkType === 'differentiating';
    
    // For comparison edges, draw dashed gray lines (replace mode)
    // For regular edges, we'll draw labels in 'after' mode
    if (isComparisonEdge && link.source && link.target) {
      // Use graphData from props/state instead of calling graphData() on ref
      // Handle both string IDs and node objects
      const sourceId = typeof link.source === 'string' ? link.source : (link.source as any)?.id;
      const targetId = typeof link.target === 'string' ? link.target : (link.target as any)?.id;
      const startNode = graphData.nodes.find((n: any) => n.id === sourceId);
      const endNode = graphData.nodes.find((n: any) => n.id === targetId);
      
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
      // Use graphData from props/state instead of calling graphData() on ref
      // Handle both string IDs and node objects
      const sourceId = typeof link.source === 'string' ? link.source : (link.source as any)?.id;
      const targetId = typeof link.target === 'string' ? link.target : (link.target as any)?.id;
      const startNode = graphData.nodes.find((n: any) => n.id === sourceId);
      const endNode = graphData.nodes.find((n: any) => n.id === targetId);
      
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
  }, [highlightedEdgeId, isDarkMode, getEdgeCoordinates, getNodeRadius, drawComparisonEdge, drawEdgeLabel]);

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
    return getEdgeWidth(link, false);
  }, [getEdgeWidth]);

  const linkDirectionalArrowLengthFn = useCallback((link: any) => {
    // No arrows for comparison edges
    if ((link as any).type === 'differentiating') {
      return 0;
    }
    return 6;
  }, []);

  const linkDirectionalArrowRelPosFn = useCallback((link: any) => {
    // No arrows for comparison edges
    if ((link as any).type === 'differentiating') {
      return 0;
    }
    // Calculate the position where arrow tip should touch the node surface
    // Use graphData from props/state instead of calling graphData() on ref
    const targetNode = graphData.nodes.find((n: any) => n.id === link.target);
    if (targetNode && graphRef.current) {
      const nodeRadius = getNodeRadius(targetNode.hasChildren);
      const sourceNode = graphData.nodes.find((n: any) => n.id === link.source);
      if (sourceNode && sourceNode.x !== undefined && sourceNode.y !== undefined &&
          targetNode.x !== undefined && targetNode.y !== undefined) {
        const dx = targetNode.x - sourceNode.x;
        const dy = targetNode.y - sourceNode.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
          const arrowLength = 6;
          const relPos = Math.max(0, (distance - nodeRadius - arrowLength) / distance);
          return Math.min(0.999, Math.max(0.9, relPos));
        }
      }
    }
    return 0.98; // Default: very close to target node
  }, [getNodeRadius]);

  const linkDirectionalArrowColorFn = useCallback(() => arrowColor, [arrowColor]);

  // Setup d3 forces - react-force-graph uses d3Force prop which can be a function
  // We'll set up individual forces via useEffect after component mounts
  // For now, create the force functions
  const d3ForceLinkFn = useMemo(() => d3.forceLink().id((d: any) => d.id).distance(50), [d3]);
  const d3ForceChargeFn = useMemo(() => d3.forceManyBody().strength(-200), [d3]);
  const d3ForceCollisionFn = useMemo(() => d3.forceCollide().radius((d: any) => {
    const nodeRadius = getNodeRadius(d.hasChildren);
    return nodeRadius + 5; // Add padding around nodes
  }), [d3, getNodeRadius]);

  // Setup d3 forces after component mounts
  useEffect(() => {
    if (!graphRef.current) return;
    
    // Set up d3 forces via imperative API (react-force-graph-2d exposes underlying instance)
    // Access d3Force via ref - react-force-graph-2d exposes underlying instance
    (graphRef.current as any)?.d3Force?.('link', d3ForceLinkFn);
    (graphRef.current as any)?.d3Force?.('charge', d3ForceChargeFn);
    (graphRef.current as any)?.d3Force?.('collision', d3ForceCollisionFn);
  }, [d3ForceLinkFn, d3ForceChargeFn, d3ForceCollisionFn]);

  // Update graph dimensions when container size changes
  // Note: With react-force-graph, most props are handled declaratively
  // This effect only handles imperative operations like resize observer
  useEffect(() => {
    if (!graphRef.current) return;
    
    // Initialize previous zoom ref if not set
    if (previousZoomRef.current === 1) {
        // Access zoom via ref - react-force-graph-2d exposes underlying instance
        const currentZoom = (graphRef.current as any)?.zoom?.();
        if (currentZoom) {
          previousZoomRef.current = currentZoom;
        }
    }

    // Setup resize observer to handle dynamic width changes
    const resizeObserver = new ResizeObserver(() => {
      // Update graph width/height when container resizes
      // Note: react-force-graph handles most updates via props, but we can update via ref if needed
      // The component will re-render with new props when dimensions change
    });
    
    // Observe the parent container for size changes
    const parentElement = graphRef.current?.parentElement?.parentElement;
    if (parentElement) {
      resizeObserver.observe(parentElement);
    }

    // Track right-click position on the canvas
    const handleCanvasContextMenu = (event: MouseEvent) => {
      const canvas = (event.target as HTMLElement)?.closest('canvas');
      if (canvas) {
        const containerRect = canvas.getBoundingClientRect();
        rightClickPositionRef.current = {
          x: event.clientX - containerRect.left,
          y: event.clientY - containerRect.top,
        };
      }
    };

    // Handle wheel events to enforce zoom limits (using capture phase to intercept before force-graph)
    const handleWheel = (event: WheelEvent) => {
      if (!graphRef.current) return;

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
          // Use graphData from state instead of calling graphData() on ref
          const highlightedNode = graphData.nodes.find((n: any) => n.id === highlightedNodeId);
          
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
          // Use graphData from state instead of calling graphData() on ref
          const highlightedNode = graphData.nodes.find((n: any) => n.id === highlightedNodeId);
          
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
      // Find canvas within the graph component
      const graphContainer = graphRef.current?.parentElement;
      const canvas = graphContainer?.querySelector('canvas');
      if (canvas) {
        canvas.addEventListener('contextmenu', handleCanvasContextMenu);
        // Use capture phase to intercept wheel events before force-graph handles them
        canvas.addEventListener('wheel', handleWheel, { passive: false, capture: true });
        return canvas;
      }
      return null;
    };
    
    // Also add wheel listener to graph container with capture to catch events early
    const graphContainer = graphRef.current?.parentElement;
    if (graphContainer) {
      graphContainer.addEventListener('wheel', handleWheel, { passive: false, capture: true });
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
      const graphContainer = graphRef.current?.parentElement;
      if (graphContainer) {
        graphContainer.removeEventListener('wheel', handleWheel, { capture: true } as any);
      }
      // Note: react-force-graph handles cleanup automatically, no need to call _destructor
    };
  }, [width, height, paneVisible, canZoomIn, canZoomOut, menuBarHeight]);

  // Note: Node rendering updates are handled via props (nodeCanvasObject) which is memoized
  // No separate effect needed - React will re-render when props change

  const graphAreaHeight = height - menuBarHeight;

  // Color variables for dynamic inline styles that can't be moved to CSS
  // (e.g., conditional colors, dynamic values, or styles applied via JavaScript)
  // Static styles have been migrated to GraphRenderer.module.css
  const panelTextColor = isDarkMode ? '#ffffff' : '#1a1a1a';
  const menuBarBackgroundColor = isDarkMode ? '#252525' : '#f0f0f0';
  const menuBarBorderColor = isDarkMode ? '#444' : '#ddd';
  const menuBarTextColor = isDarkMode ? '#ffffff' : '#1a1a1a';
  const buttonHoverColor = isDarkMode ? '#333' : '#e0e0e0';

  return (
    <div 
      ref={outerContainerRef}
      className={`${styles.container} ${isDarkMode ? styles.containerDark : styles.containerLight}`}
    >
      <div 
        className={styles.graphArea}
        style={{ height: graphAreaHeight }}
      >
        <div 
          className={`${styles.graphCanvas} ${paneVisible ? styles.graphCanvasWithPane : styles.graphCanvasWithoutPane}`}
          style={{ height: graphAreaHeight }}
        >
          <ForceGraph2D
            ref={graphRef}
            graphData={memoizedGraphData}
            width={graphWidth}
            height={height - menuBarHeight}
            backgroundColor={backgroundColor}
            nodeLabel={nodeLabel}
            nodeVal={nodeVal}
            linkColor={linkColorFn}
            linkWidth={linkWidthFn}
            linkDirectionalArrowLength={linkDirectionalArrowLengthFn}
            linkDirectionalArrowRelPos={linkDirectionalArrowRelPosFn}
            linkDirectionalArrowColor={linkDirectionalArrowColorFn}
            onNodeClick={handleNodeClick}
            onNodeRightClick={handleNodeRightClick}
            onLinkClick={handleLinkClick}
            onLinkRightClick={handleLinkRightClick}
            onNodeDrag={handleNodeDrag}
            onNodeDragEnd={handleNodeDragEnd}
            onZoom={handleZoom}
            nodeCanvasObjectMode={() => 'replace'}
            nodeCanvasObject={nodeCanvasObject}
            linkCanvasObjectMode={linkCanvasObjectMode}
            linkCanvasObject={linkCanvasObject}
            cooldownTicks={100}
            onEngineStop={() => {
              // Graph has stabilized
            }}
          />
        </div>
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
              className={`${styles.rightClickMenu} ${isDarkMode ? styles.rightClickMenuDark : styles.rightClickMenuLight}`}
              style={{
                left: `${rightClickMenu.x}px`,
                top: `${rightClickMenu.y}px`,
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
                  className={`${styles.rightClickMenuItem} ${isDarkMode ? styles.rightClickMenuItemDark : styles.rightClickMenuItemLight}`}
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
            className={`${styles.contextMenu} ${isDarkMode ? styles.contextMenuDark : styles.contextMenuLight}`}
            style={{
              left: `${contextMenu.x}px`,
              top: `${contextMenu.y}px`,
            }}
            onClick={(e) => e.stopPropagation()}
            onContextMenu={(e) => e.preventDefault()}
          >
            <button
              onClick={() => copyAnchorLink(contextMenu.nodeId, contextMenu.edgeId)}
              className={`${styles.contextMenuItem} ${isDarkMode ? styles.contextMenuItemDark : styles.contextMenuItemLight}`}
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
          <div 
            className={`${styles.sidePanel} ${isDarkMode ? styles.sidePanelDark : styles.sidePanelLight}`}
            style={{ height: graphAreaHeight }}
          >
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
                  // Access centerAt via ref - react-force-graph-2d exposes underlying instance
                  if (graphRef.current && node.x !== undefined && node.y !== undefined) {
                    (graphRef.current as any)?.centerAt?.(node.x, node.y, 500);
                  }
                }
              };

              // linkStyle: Static parts moved to CSS (panelLinkBase), only dynamic colors remain
              const linkStyle = {
                color: isDarkMode ? '#68BDF6' : '#2563eb',
                borderBottom: `1px solid ${isDarkMode ? '#333' : '#eee'}`,
              };

              const linkHoverStyle = {
                opacity: 0.7,
              };

              return (
                <div>
                  <h3 className={`${styles.panelTitle} ${isDarkMode ? styles.panelTitleDark : styles.panelTitleLight}`}>
                    {selectedNode.title || selectedNode.name || selectedNode.id}
                  </h3>
                  {selectedNode.description && typeof selectedNode.description === 'string' && (
                    <p className={`${styles.panelDescription} ${isDarkMode ? styles.panelDescriptionDark : styles.panelDescriptionLight}`}>
                      {selectedNode.description}
                    </p>
                  )}
                  {!selectedNode.description && (
                    <p className={`${styles.panelDescription} ${styles.panelDescriptionEmpty} ${isDarkMode ? styles.panelDescriptionDark : styles.panelDescriptionLight}`}>
                      No description
                    </p>
                  )}

                  {/* Ingress Section */}
                  {ingressNodes.length > 0 && (
                    <div style={{ marginBottom: '16px' }}>
                      <h4 className={`${styles.panelSectionTitle} ${isDarkMode ? styles.panelSectionTitleDark : styles.panelSectionTitleLight}`}>
                        Ingress ({ingressNodes.length})
                      </h4>
                      <div className={`${styles.panelSectionContent} ${isDarkMode ? styles.panelSectionContentDark : styles.panelSectionContentLight}`}>
                        {ingressNodes.map((node: any, idx: number) => {
                          const link = ingressLinks[idx];
                          const linkLabel = link?.label || 'connected from';
                          return (
                            <div key={node.id} className={idx < ingressNodes.length - 1 ? styles.panelNodeItem : styles.panelNodeItemLast}>
                              <a
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleNodeClick(node.id);
                                }}
                                className={`${styles.panelLink} ${isDarkMode ? styles.panelLinkDark : styles.panelLinkLight}`}
                                onMouseEnter={(e) => {
                                  Object.assign(e.currentTarget.style, linkHoverStyle);
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.opacity = '1';
                                }}
                              >
                                <span className={styles.panelLinkText}>{node.title || node.name || node.id}</span>
                                {linkLabel && (
                                  <span className={styles.panelLinkLabel}>
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
                      <h4 className={`${styles.panelSectionTitle} ${isDarkMode ? styles.panelSectionTitleDark : styles.panelSectionTitleLight}`}>
                        Egress ({egressNodes.length})
                      </h4>
                      <div className={`${styles.panelSectionContent} ${isDarkMode ? styles.panelSectionContentDark : styles.panelSectionContentLight}`}>
                        {egressNodes.map((node: any, idx: number) => {
                          const link = egressLinks[idx];
                          const linkLabel = link?.label || 'connected to';
                          return (
                            <div key={node.id} className={idx < egressNodes.length - 1 ? styles.panelNodeItem : styles.panelNodeItemLast}>
                              <a
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleNodeClick(node.id);
                                }}
                                className={`${styles.panelLink} ${isDarkMode ? styles.panelLinkDark : styles.panelLinkLight}`}
                                onMouseEnter={(e) => {
                                  Object.assign(e.currentTarget.style, linkHoverStyle);
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.opacity = '1';
                                }}
                              >
                                <span className={styles.panelLinkText}>{node.title || node.name || node.id}</span>
                                {linkLabel && (
                                  <span className={styles.panelLinkLabel}>
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
                    <p className={`${styles.panelNoConnections} ${isDarkMode ? styles.panelNoConnectionsDark : styles.panelNoConnectionsLight}`}>
                      No connections
                    </p>
                  )}

                  {/* External Links Section */}
                  {(selectedNode as any).keyLinks && (selectedNode as any).keyLinks.length > 0 && (
                    <div className={`${styles.panelSectionDivider} ${isDarkMode ? styles.panelSectionDividerDark : styles.panelSectionDividerLight}`}>
                      <h4 className={`${styles.panelSectionTitle} ${isDarkMode ? styles.panelSectionTitleDark : styles.panelSectionTitleLight}`}>
                        Learn More
                      </h4>
                      <div className={styles.panelExternalLinksContainer}>
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
                              className={`${styles.panelLinkBase} ${styles.panelExternalLink} ${isDarkMode ? styles.panelLinkDark : styles.panelLinkLight}`}
                              style={{
                                color: linkStyle.color,
                                borderBottom: linkStyle.borderBottom,
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
                    <div className={`${styles.panelSectionDivider} ${isDarkMode ? styles.panelSectionDividerDark : styles.panelSectionDividerLight}`}>
                      <h4 className={`${styles.panelSectionTitle} ${isDarkMode ? styles.panelSectionTitleDark : styles.panelSectionTitleLight}`}>
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
                        className={`${styles.panelLinkBase} ${styles.panelExternalLink} ${isDarkMode ? styles.panelLinkDark : styles.panelLinkLight}`}
                        style={{
                          color: linkStyle.color,
                          borderBottom: linkStyle.borderBottom,
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
                  // Access centerAt via ref - react-force-graph-2d exposes underlying instance
                  if (graphRef.current && node.x !== undefined && node.y !== undefined) {
                    (graphRef.current as any)?.centerAt?.(node.x, node.y, 500);
                  }
                }
              };

              // linkStyle: Static parts moved to CSS (panelLinkBase), only dynamic colors remain
              const linkStyle = {
                color: isDarkMode ? '#68BDF6' : '#2563eb',
                borderBottom: `1px solid ${isDarkMode ? '#333' : '#eee'}`,
              };

              const linkHoverStyle = {
                opacity: 0.7,
              };

              return (
                <div>
                  <h3 className={`${styles.panelTitle} ${isDarkMode ? styles.panelTitleDark : styles.panelTitleLight}`}>
                    {(selectedEdge as any).type === 'differentiating' 
                      ? `${sourceDisplayName} vs. ${targetDisplayName}`
                      : (selectedEdge.label || 'Edge')}
                  </h3>

                  {/* Source Node Section */}
                  {sourceNode && (
                    <div className={styles.panelEdgeSection}>
                      <h4 className={`${styles.panelSectionTitle} ${isDarkMode ? styles.panelSectionTitleDark : styles.panelSectionTitleLight}`}>
                        Source
                      </h4>
                      <div className={`${styles.panelSectionContent} ${isDarkMode ? styles.panelSectionContentDark : styles.panelSectionContentLight}`}>
                        <a
                          onClick={(e) => {
                            e.preventDefault();
                            handleNodeClick(sourceNode.id);
                          }}
                          className={`${styles.panelLinkBase} ${isDarkMode ? styles.panelLinkDark : styles.panelLinkLight}`}
                          style={{
                            color: linkStyle.color,
                            borderBottom: linkStyle.borderBottom,
                          }}
                          onMouseEnter={(e) => {
                            Object.assign(e.currentTarget.style, linkHoverStyle);
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.opacity = '1';
                          }}
                        >
                          <span className={styles.panelLinkText}>{sourceNode.title || sourceNode.name || sourceNode.id}</span>
                        </a>
                        {sourceNode.description && (
                          <p className={`${styles.panelEdgeNodeDescription} ${isDarkMode ? styles.panelEdgeNodeDescriptionDark : styles.panelEdgeNodeDescriptionLight}`}>
                            {sourceNode.description}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Target Node Section */}
                  {targetNode && (
                    <div className={styles.panelEdgeSection}>
                      <h4 className={`${styles.panelSectionTitle} ${isDarkMode ? styles.panelSectionTitleDark : styles.panelSectionTitleLight}`}>
                        Destination
                      </h4>
                      <div className={`${styles.panelSectionContent} ${isDarkMode ? styles.panelSectionContentDark : styles.panelSectionContentLight}`}>
                        <a
                          onClick={(e) => {
                            e.preventDefault();
                            handleNodeClick(targetNode.id);
                          }}
                          className={`${styles.panelLinkBase} ${isDarkMode ? styles.panelLinkDark : styles.panelLinkLight}`}
                          style={{
                            color: linkStyle.color,
                            borderBottom: linkStyle.borderBottom,
                          }}
                          onMouseEnter={(e) => {
                            Object.assign(e.currentTarget.style, linkHoverStyle);
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.opacity = '1';
                          }}
                        >
                          <span className={styles.panelLinkText}>{targetNode.title || targetNode.name || targetNode.id}</span>
                        </a>
                        {targetNode.description && (
                          <p className={`${styles.panelEdgeNodeDescription} ${isDarkMode ? styles.panelEdgeNodeDescriptionDark : styles.panelEdgeNodeDescriptionLight}`}>
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
                      {(selectedEdge as any).sourceData && (selectedEdge as any).targetData && (selectedEdge as any).sourceData.main_use_case && (
                        <div className={`${styles.panelSectionContent} ${isDarkMode ? styles.panelSectionContentDark : styles.panelSectionContentLight} ${styles.panelEdgeSection}`}>
                          <h4 className={`${styles.panelSectionTitle} ${isDarkMode ? styles.panelSectionTitleDark : styles.panelSectionTitleLight}`}>
                            Use Cases
                          </h4>
                          <div className={styles.panelUseCasesContainer}>
                            <div className={styles.panelUseCaseItem}>
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
                        <div className={`${styles.panelSimilaritiesContainer} ${isDarkMode ? styles.panelSimilaritiesContainerDark : styles.panelSimilaritiesContainerLight}`}>
                          <h4 className={styles.panelSimilaritiesTitle}>
                            Similarities
                          </h4>
                          <ul className={styles.panelSimilaritiesList}>
                            {(selectedEdge as any).similarities.map((similarity: string, idx: number) => (
                              <li key={idx}>{similarity}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Differences */}
                      {(selectedEdge as any).differences && (
                        <div className={`${styles.panelDifferencesContainer} ${isDarkMode ? styles.panelDifferencesContainerDark : styles.panelDifferencesContainerLight}`}>
                          <h4 className={styles.panelDifferencesTitle}>
                            Differences
                          </h4>
                          
                          {(selectedEdge as any).differences.source && (selectedEdge as any).differences.source.length > 0 && (
                            <div className={styles.panelDifferencesSection}>
                              <strong className={`${styles.panelDifferencesLabel} ${isDarkMode ? styles.panelDifferencesLabelDark : styles.panelDifferencesLabelLight}`}>
                                {selectedEdge.source} only:
                              </strong>
                              <ul className={styles.panelDifferencesListWithMargin}>
                                {(selectedEdge as any).differences.source.map((diff: string, idx: number) => (
                                  <li key={idx}>{diff}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {(selectedEdge as any).differences.target && (selectedEdge as any).differences.target.length > 0 && (
                            <div>
                              <strong className={`${styles.panelDifferencesLabel} ${isDarkMode ? styles.panelDifferencesLabelDark : styles.panelDifferencesLabelLight}`}>
                                {selectedEdge.target} only:
                              </strong>
                              <ul className={styles.panelDifferencesListWithMargin}>
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
                        <div className={`${styles.panelKeyDifferentiatorsContainer} ${isDarkMode ? styles.panelKeyDifferentiatorsContainerDark : styles.panelKeyDifferentiatorsContainerLight}`}>
                          <h4 className={`${styles.panelSectionTitle} ${isDarkMode ? styles.panelSectionTitleDark : styles.panelSectionTitleLight}`}>
                            Key Differentiators
                          </h4>
                          <div className={styles.panelKeyDifferentiatorsContent}>
                            <div className={styles.panelKeyDifferentiatorsItem}>
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
                    <div className={`${styles.panelSectionDivider} ${isDarkMode ? styles.panelSectionDividerDark : styles.panelSectionDividerLight}`}>
                      <h4 className={`${styles.panelSectionTitle} ${isDarkMode ? styles.panelSectionTitleDark : styles.panelSectionTitleLight}`}>
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
                        className={`${styles.panelLinkBase} ${styles.panelExternalLink} ${isDarkMode ? styles.panelLinkDark : styles.panelLinkLight}`}
                        style={{
                          color: linkStyle.color,
                          borderBottom: linkStyle.borderBottom,
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
              <div className={`${styles.panelEmptyState} ${isDarkMode ? styles.panelEmptyStateDark : styles.panelEmptyStateLight}`}>
                Hover or click a node or edge
              </div>
            )}
          </div>
        )}
      </div>
      <div 
        className={`${styles.menuBarBase} ${styles.menuBar} ${isDarkMode ? styles.menuBarDark : styles.menuBarLight}`}
        style={{
          height: menuBarHeight,
        }}
      >
        <button
          onClick={autoCenter}
          className={`${styles.menuBarButton} ${isDarkMode ? styles.menuBarButtonDark : styles.menuBarButtonLight}`}
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
          className={`${styles.menuBarButton} ${isDarkMode ? styles.menuBarButtonDark : styles.menuBarButtonLight}`}
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
          className={`${styles.menuBarButton} ${isDarkMode ? styles.menuBarButtonDark : styles.menuBarButtonLight}`}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = buttonHoverColor;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          Collapse All
        </button>
        <div className={styles.menuBarSpacer} />
        <button
          onClick={togglePane}
          className={`${styles.menuBarButton} ${styles.menuBarToggle} ${isDarkMode ? styles.menuBarButtonDark : styles.menuBarButtonLight}`}
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

/**
 * ============================================================================
 * BROWSER-ONLY WRAPPER
 * ============================================================================
 * 
 * WHY BrowserOnly IS NEEDED:
 * - Docusaurus generates static HTML (SSR/SSG)
 * - Browser-only APIs (window, canvas, force-graph) don't exist on server
 * - BrowserOnly ensures component only renders in browser, not during build
 * 
 * DYNAMIC IMPORT PATTERN:
 * - Load dependencies inside BrowserOnly callback using async import()
 * - Prevents bundling issues and circular dependencies
 * - Allows graceful loading states and error handling
 * 
 * react-force-graph-2d vs react-force-graph:
 * - react-force-graph-2d: 2D-only, no A-Frame dependencies
 * - react-force-graph: Includes 3D/VR/AR (A-Frame), causes "AFRAME is not defined" errors
 * - Use 2D version unless you need 3D/VR features
 * 
 * ============================================================================
 */
// Wrap the implementation with BrowserOnly to prevent SSR issues
const GraphRenderer: React.FC<GraphRendererProps> = (props) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dependencies, setDependencies] = useState<{
    ForceGraph2D: any;
    d3: any;
    NodeRenderer: any;
  } | null>(null);

  useEffect(() => {
    // Use dynamic import to avoid circular dependency issues
    const loadDependencies = async () => {
      try {
        // Use dynamic import instead of require to avoid initialization issues
        // Use react-force-graph-2d to avoid A-Frame dependencies (only needed for VR/AR components)
        const [reactForceGraphModule, d3Module, nodeRendererModule] = await Promise.all([
          import('react-force-graph-2d'),
          import('d3-force'),
          import('./NodeRenderer'),
        ]);

        // Extract ForceGraph2D from the module
        // react-force-graph-2d exports ForceGraph as default (not named export)
        const ForceGraph2D = (reactForceGraphModule as any).default;

        if (!ForceGraph2D) {
          console.error('ForceGraph2D not found. Available exports:', Object.keys(reactForceGraphModule));
          setError('ForceGraph2D component not found');
          return;
        }

        setDependencies({
          ForceGraph2D,
          d3: d3Module,
          NodeRenderer: nodeRendererModule.NodeRenderer,
        });
        setIsLoading(false);
      } catch (err) {
        console.error('Error loading GraphRenderer dependencies:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setIsLoading(false);
      }
    };

    loadDependencies();
  }, []);

  return (
    <BrowserOnly fallback={<div>Loading graph...</div>}>
      {() => {
        if (typeof window === 'undefined') {
          return <div>Loading graph...</div>;
        }

        if (isLoading) {
          return <div>Loading graph...</div>;
        }

        if (error || !dependencies) {
          return (
            <div>
              <div>Error loading graph: {error || 'Dependencies not loaded'}</div>
              <div style={{ fontSize: '12px', marginTop: '8px', color: '#666' }}>
                Please refresh the page.
              </div>
            </div>
          );
        }

        return (
          <GraphRendererImpl
            {...props}
            ForceGraph2D={dependencies.ForceGraph2D}
            d3={dependencies.d3}
            NodeRenderer={dependencies.NodeRenderer}
          />
        );
      }}
    </BrowserOnly>
  );
};

export default GraphRenderer;

