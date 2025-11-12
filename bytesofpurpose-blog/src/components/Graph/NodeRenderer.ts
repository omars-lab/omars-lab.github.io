/**
 * NodeRenderer - Consolidated class for rendering graph nodes
 * 
 * This class encapsulates all node rendering logic including:
 * - Circle and border drawing
 * - Title text rendering with truncation and wrapping
 * - Status indicator rendering
 * - Debug visualization
 * - All related calculations
 */

interface NodeRendererOptions {
  ctx: CanvasRenderingContext2D;
  node: any;
  globalScale: number;
  isDarkMode: boolean;
  isHighlighted: boolean;
  isSelected?: boolean;
  nodeBorderColor: string;
  showDebugSeparators?: boolean;
}

interface NodeMetrics {
  radius: number;
  diameter: number;
  sectionHeight: number;
  color: string;
  label: string;
}

interface StatusIndicatorInfo {
  indicator: string;
  isTextLabel: boolean;
}

export class NodeRenderer {
  private ctx: CanvasRenderingContext2D;
  private node: any;
  private globalScale: number;
  private isDarkMode: boolean;
  private isHighlighted: boolean;
  private isSelected: boolean;
  private nodeBorderColor: string;
  private showDebugSeparators: boolean;
  private metrics: NodeMetrics;

  // Neo4j-like color palette
  private static readonly NEO4J_COLORS = [
    '#68BDF6', // Neo4j blue
    '#60BE86', // Green
    '#FF6B6B', // Red
    '#FFD93D', // Yellow
    '#A78BFA', // Purple
    '#FB7185', // Pink
    '#34D399', // Emerald
    '#FBBF24', // Amber
  ];

  // Constants
  private static readonly MAX_CHARS = 10; // Maximum 10 characters total (7 chars + 3 ellipsis)
  private static readonly CHARS_BEFORE_ELLIPSIS = 7; // First 7 chars from title, then "..."
  private static readonly DEBUG_SHOW_NODE_SECTIONS = false;

  constructor(options: NodeRendererOptions) {
    this.ctx = options.ctx;
    this.node = options.node;
    this.globalScale = options.globalScale;
    this.isDarkMode = options.isDarkMode;
    this.isHighlighted = options.isHighlighted;
    this.isSelected = options.isSelected ?? false;
    this.nodeBorderColor = options.nodeBorderColor;
    this.showDebugSeparators = options.showDebugSeparators ?? false;

    // Calculate node metrics
    this.metrics = this.calculateMetrics();
  }

  /**
   * Main render method - renders the complete node
   */
  public render(): void {
    if (!this.isValidCoordinates()) {
      return;
    }

    // Draw components in order (back to front)
    this.drawCircle();
    
    if (this.showDebugSeparators || NodeRenderer.DEBUG_SHOW_NODE_SECTIONS) {
      this.drawDebugSeparators();
    }

    const label = this.metrics.label;
    if (label) {
      this.drawTitle();
    }
    // Status indicator (emoji/arrow) is now rendered as floating menu outside the node
  }

  /**
   * Calculate node metrics (radius, color, label, etc.)
   */
  private calculateMetrics(): NodeMetrics {
    const radius = this.getNodeRadius(this.node.hasChildren);
    const diameter = radius * 2;
    const sectionHeight = diameter / 5;
    const color = this.getNodeColor(this.node.color);
    const label = this.getNodeLabel(this.node);

    return {
      radius,
      diameter,
      sectionHeight,
      color,
      label,
    };
  }

  /**
   * Validates that node has valid coordinates for rendering
   */
  private isValidCoordinates(): boolean {
    return (
      this.node.x !== undefined &&
      this.node.y !== undefined &&
      isFinite(this.node.x) &&
      isFinite(this.node.y)
    );
  }

  /**
   * Gets the radius of a node based on whether it has children
   */
  private getNodeRadius(hasChildren: boolean): number {
    return hasChildren ? 12 : 8;
  }

  /**
   * Gets the display color for a node, falling back to default if not specified
   */
  private getNodeColor(nodeColor?: string): string {
    return nodeColor || NodeRenderer.NEO4J_COLORS[0];
  }

  /**
   * Extracts the display label for a node from various possible fields
   */
  private getNodeLabel(node: any): string {
    return node.title || node.name || node.id || '';
  }

  /**
   * Draws the node circle with optional highlight glow or sun-like theming for selected nodes
   */
  public drawCircle(): void {
    const { x, y } = this.node;
    const { radius, color } = this.metrics;

    // Modern sun-like theming for selected nodes
    if (this.isSelected) {
      // Subtle outer aura - modern, refined glow
      const auraRadius = radius + 16;
      const auraGradient = this.ctx.createRadialGradient(x, y, radius * 0.9, x, y, auraRadius);
      auraGradient.addColorStop(0, 'rgba(255, 248, 220, 0.2)'); // Soft warm white
      auraGradient.addColorStop(0.4, 'rgba(255, 235, 180, 0.15)'); // Gentle peach-yellow
      auraGradient.addColorStop(0.7, 'rgba(255, 220, 150, 0.08)'); // Soft coral
      auraGradient.addColorStop(1, 'transparent');
      this.ctx.fillStyle = auraGradient;
      this.ctx.beginPath();
      this.ctx.arc(x, y, auraRadius, 0, 2 * Math.PI, false);
      this.ctx.fill();

      // Refined outer glow - smooth and elegant
      const outerGlowRadius = radius + 8;
      const outerGradient = this.ctx.createRadialGradient(x, y, radius * 0.7, x, y, outerGlowRadius);
      outerGradient.addColorStop(0, 'rgba(255, 245, 200, 0.3)'); // Soft cream
      outerGradient.addColorStop(0.5, 'rgba(255, 230, 160, 0.2)'); // Warm peach
      outerGradient.addColorStop(0.8, 'rgba(255, 210, 130, 0.1)'); // Gentle apricot
      outerGradient.addColorStop(1, 'transparent');
      this.ctx.fillStyle = outerGradient;
      this.ctx.beginPath();
      this.ctx.arc(x, y, outerGlowRadius, 0, 2 * Math.PI, false);
      this.ctx.fill();

      // Soft inner glow - adds depth without being overwhelming
      const innerGlowRadius = radius + 4;
      const innerGradient = this.ctx.createRadialGradient(x, y, radius * 0.4, x, y, innerGlowRadius);
      innerGradient.addColorStop(0, 'rgba(255, 255, 240, 0.5)'); // Soft ivory
      innerGradient.addColorStop(0.3, 'rgba(255, 245, 200, 0.3)'); // Cream
      innerGradient.addColorStop(0.7, 'rgba(255, 230, 180, 0.15)'); // Light peach
      innerGradient.addColorStop(1, 'transparent');
      this.ctx.fillStyle = innerGradient;
      this.ctx.beginPath();
      this.ctx.arc(x, y, innerGlowRadius, 0, 2 * Math.PI, false);
      this.ctx.fill();

      // Modern sun gradient - refined color palette with smooth transitions
      const sunGradient = this.ctx.createRadialGradient(x, y, radius * 0.15, x, y, radius);
      sunGradient.addColorStop(0, '#FFFEF7'); // Almost white, warm tint
      sunGradient.addColorStop(0.2, '#FFF8E1'); // Soft cream
      sunGradient.addColorStop(0.4, '#FFE082'); // Warm buttery yellow
      sunGradient.addColorStop(0.6, '#FFC947'); // Golden yellow
      sunGradient.addColorStop(0.8, '#FFB300'); // Rich amber
      sunGradient.addColorStop(1, '#FF8F00'); // Deep warm orange
      this.ctx.fillStyle = sunGradient;
      this.ctx.beginPath();
      this.ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
      this.ctx.fill();

      // No visible border for selected nodes - creates seamless modern appearance
    } else {
      // Regular node rendering
      // Draw highlight glow for highlighted nodes
      if (this.isHighlighted) {
        const glowRadius = radius + 4;
        const gradient = this.ctx.createRadialGradient(x, y, radius, x, y, glowRadius);
        gradient.addColorStop(0, this.isDarkMode ? 'rgba(255, 215, 0, 0.8)' : 'rgba(255, 215, 0, 0.6)');
        gradient.addColorStop(1, 'transparent');
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(x, y, glowRadius, 0, 2 * Math.PI, false);
        this.ctx.fill();
      }

      // Draw node circle
      this.ctx.fillStyle = color;
      this.ctx.beginPath();
      this.ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
      this.ctx.fill();

      // Draw node border (thicker and colored for highlighted nodes)
      if (this.isHighlighted) {
        this.ctx.strokeStyle = this.isDarkMode ? '#FFD700' : '#FFA500';
        this.ctx.lineWidth = 4 / this.globalScale;
      } else {
        this.ctx.strokeStyle = this.nodeBorderColor;
        this.ctx.lineWidth = 2 / this.globalScale;
      }
      this.ctx.stroke();
    }
  }

  /**
   * Draws debug section separators to visualize the 5 horizontal sections of a node
   */
  public drawDebugSeparators(): void {
    if (!NodeRenderer.DEBUG_SHOW_NODE_SECTIONS && !this.showDebugSeparators) return;

    const { x, y } = this.node;
    const { radius, sectionHeight } = this.metrics;

    this.ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
    this.ctx.lineWidth = 2 / this.globalScale;
    const dashSize = 3 / this.globalScale;
    this.ctx.setLineDash([dashSize, dashSize]);

    // Draw 4 separator lines (dividing 5 sections)
    for (let i = 1; i < 5; i++) {
      const yPos = y - radius + (sectionHeight * i);
      this.ctx.beginPath();
      // Calculate x positions for the line endpoints on the circle
      const angle = Math.asin((yPos - y) / radius);
      const xOffset = Math.cos(angle) * radius;
      this.ctx.moveTo(x - xOffset, yPos);
      this.ctx.lineTo(x + xOffset, yPos);
      this.ctx.stroke();
    }

    this.ctx.setLineDash([]); // Reset line dash
  }

  /**
   * Gets status indicator information (emoji or arrow)
   */
  private getStatusIndicator(): StatusIndicatorInfo {
    const hasChildren = this.node.hasChildren;
    const isExpanded = this.node.isExpanded || false;

    if (hasChildren) {
      return {
        indicator: isExpanded ? '▼' : '▶',
        isTextLabel: false,
      };
    } else {
      return {
        indicator: '🌿',
        isTextLabel: false,
      };
    }
  }

  /**
   * Calculates the Y coordinate for the emoji area center (bottom section)
   */
  private calculateEmojiAreaCenterY(): number {
    const { y } = this.node;
    const { radius, sectionHeight } = this.metrics;
    const emojiAreaTop = y - radius + (sectionHeight * 4);
    const emojiAreaBottom = y + radius;
    return (emojiAreaTop + emojiAreaBottom) / 2;
  }

  /**
   * Calculates the available width for text at a given Y position within a circular node
   */
  private calculateAvailableTextWidth(
    y: number,
    padding: number = 6,
    lineIndex?: number
  ): number {
    const { y: nodeY } = this.node;
    const { radius } = this.metrics;

    // Calculate vertical offset from node center
    const verticalOffset = Math.abs(y - nodeY);
    
    // Calculate chord width at this Y position using circle geometry
    const chordWidth = 2 * Math.sqrt(Math.max(0, radius * radius - verticalOffset * verticalOffset));
    
    // Convert to screen coordinates
    const screenPadding = padding * this.globalScale;
    const baseWidth = (chordWidth * this.globalScale) - (screenPadding * 2);
    
    // Apply reactive safety margins
    // Use more conservative margins for parent nodes (radius 12) to prevent text overflow
    const isTopOrBottom = lineIndex === 0 || lineIndex === 2;
    const baseMarginPercentage = isTopOrBottom ? 0.15 : 0.10;
    // Increase margin multiplier for larger nodes to be more conservative
    const radiusMultiplier = 1 + ((radius - 8) / 8) * 0.3; // Increased from 0.2 to 0.3
    const marginPercentage = baseMarginPercentage * radiusMultiplier;
    const percentageMargin = baseWidth * marginPercentage;
    
    const baseFixedMargin = isTopOrBottom ? 5 : 4;
    const radiusScaledMargin = baseFixedMargin * (radius / 8);
    const fixedMargin = radiusScaledMargin * this.globalScale;
    const totalMargin = percentageMargin + fixedMargin;
    
    const availableWidth = baseWidth - totalMargin;
    return Math.max(2, availableWidth);
  }

  /**
   * Calculates Y position for the single text line (middle section)
   */
  private calculateLinePosition(): number {
    const { y } = this.node;
    const { radius, sectionHeight } = this.metrics;
    // Return center of middle section (section 2 of 5)
    const sectionTop = y - radius + (sectionHeight * 2);
    const sectionBottom = y - radius + (sectionHeight * 3);
    return (sectionTop + sectionBottom) / 2;
  }

  /**
   * Truncates text to exactly 10 characters: first 7 chars + "..." if longer than 10
   */
  private truncateToMaxChars(text: string): string {
    if (text.length <= NodeRenderer.MAX_CHARS) {
      return text;
    }
    // First 7 chars + "..." = 10 chars total
    return text.substring(0, NodeRenderer.CHARS_BEFORE_ELLIPSIS) + '...';
  }


  /**
   * Draws the title text within a node (simplified: single line, max 10 chars)
   * Returns the Y coordinate of emoji area center for status indicator positioning
   */
  public drawTitle(): number {
    const emojiAreaCenterY = this.calculateEmojiAreaCenterY();
    const labelStr = String(this.metrics.label || this.node.id || '');
    
    if (!labelStr || !labelStr.trim()) {
      return emojiAreaCenterY;
    }
    
    const trimmed = labelStr.trim();
    
    if (trimmed.length === 0) {
      return emojiAreaCenterY;
    }
    
    // Truncate to max 10 chars: first 7 + "..." if longer
    const displayText = this.truncateToMaxChars(trimmed);
    
    this.ctx.save();
    
    // Set up clipping path
    const { x, y } = this.node;
    const { radius } = this.metrics;
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, 2 * Math.PI);
    this.ctx.clip();
    
    try {
      const { radius } = this.metrics;
      
      // Get line position (middle section)
      const lineY = this.calculateLinePosition();
      const availableWidth = this.calculateAvailableTextWidth(lineY, 6, 1); // lineIndex 1 = middle line
      
      // Use a FIXED font size that does NOT scale with zoom
      // The node circle scales with zoom (via canvas transform), but text should maintain
      // constant size relative to the node. So we use a fixed font size in screen pixels.
      // Font size is always in screen pixels, so we use a fixed value based on base radius
      const minFontSize = radius >= 12 ? 4 : 3;
      const maxFontSize = radius >= 12 ? 6 : 5;
      
      // Use a fixed font size that doesn't scale with zoom
      // This ensures text maintains constant size relative to node regardless of zoom
      // Use a reasonable fixed size: 12% of base radius converted to a reasonable pixel value
      // For radius 12: use ~1.5px base, but apply minimum of 4px
      // For radius 8: use ~1.0px base, but apply minimum of 3px
      // Actually, since we want it to not grow, let's use the minimum as the fixed size
      let fontSize = minFontSize; // Fixed size: 4px for parents, 3px for leaves
      
      // Measure text width and ensure it fits within available width
      // The available width scales with zoom, but we're using a fixed font size
      // So at high zoom, available width is large, and fixed font size will fit easily
      // At low zoom, available width is small, and we may need to reduce font size
      this.ctx.font = `${fontSize}px Sans-Serif`;
      let textWidth = this.ctx.measureText(displayText).width;
      
      // If fixed font size doesn't fit, reduce it until it does
      // Use a very conservative threshold (0.8) to ensure text stays well within bounds
      while (textWidth > availableWidth * 0.8 && fontSize > minFontSize) {
        fontSize = Math.max(minFontSize, fontSize - 0.5);
        this.ctx.font = `${fontSize}px Sans-Serif`;
        textWidth = this.ctx.measureText(displayText).width;
      }
      
      // Final check: if text still doesn't fit, calculate exact fitting size
      if (textWidth > availableWidth * 0.8 && fontSize > minFontSize) {
        const scaleFactor = (availableWidth * 0.8) / textWidth;
        fontSize = Math.max(minFontSize, fontSize * scaleFactor);
      }
      
      // CRITICAL: Ensure font size NEVER exceeds maxFontSize
      // This prevents text from growing at high zoom levels
      fontSize = Math.min(fontSize, maxFontSize);
      
      // Draw the text
      this.ctx.font = `${fontSize}px Sans-Serif`;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      // Use dark text for selected nodes (sun-like theming) to contrast with bright yellow/orange
      // Use white text for regular nodes to contrast with dark backgrounds
      this.ctx.fillStyle = this.isSelected ? '#1a1a1a' : '#ffffff';
      this.ctx.fillText(displayText, x, lineY);
    } finally {
      this.ctx.restore();
    }
    
    return emojiAreaCenterY;
  }

  /**
   * Draws the status indicator (emoji or arrow) in the bottom section
   */
  public drawStatusIndicator(emojiAreaCenterY: number, statusInfo: StatusIndicatorInfo): void {
    const { x } = this.node;
    const { radius } = this.metrics;
    const { indicator, isTextLabel } = statusInfo;

    // Calculate font size based on radius (in graph coordinates)
    // Use a smaller ratio than text because emojis/arrows appear larger at the same font size
    // The canvas transform automatically scales coordinates, so we need to scale font size
    // to match. Use radius as the base since it's the primary size metric.
    const radiusScreen = radius * this.globalScale;
    
    // Use a smaller ratio for symbols to prevent them from growing too fast
    // Symbols (emojis/arrows) typically render larger than text at the same font size
    // Emojis are set to half the size they were before
    const fontSizeRatio = isTextLabel ? 0.03 : 0.07; // 3% for emojis (half of 6%), 7% for arrows
    let fontSize = radiusScreen * fontSizeRatio;
    
    // Cap font size at high zoom levels to prevent excessive growth
    // Use a fixed maximum in screen pixels that allows scaling but prevents excessive growth
    // The cap is based on base radius: smaller nodes (radius 8) cap at 4px, larger nodes (radius 12) cap at 5px
    const maxFontSizeScreen = isTextLabel 
      ? (radius <= 8 ? 4 : 5)  // Cap emojis: 4px for small nodes, 5px for large nodes
      : (radius <= 8 ? 8 : 10); // Cap arrows: 8px for small nodes, 10px for large nodes
    fontSize = Math.min(fontSize, maxFontSizeScreen);
    
    // Ensure minimum size (in screen pixels)
    const minFontSize = isTextLabel ? 2 : 6;
    fontSize = Math.max(minFontSize, fontSize);

    // Save context for rotation
    this.ctx.save();
    
    // Rotate emoji to the left (negative rotation = counterclockwise)
    // Only rotate leaf emojis, not arrows
    if (isTextLabel) {
      this.ctx.translate(x, emojiAreaCenterY);
      this.ctx.rotate(-0.2); // Rotate ~11.5 degrees to the left
      this.ctx.translate(-x, -emojiAreaCenterY);
    }

    this.ctx.font = `${fontSize}px Sans-Serif`;
    this.ctx.fillStyle = '#ffffff';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(indicator, x, emojiAreaCenterY);
    
    // Restore context
    this.ctx.restore();
  }

  /**
   * Getter for node metrics (useful for external calculations)
   */
  public getMetrics(): NodeMetrics {
    return { ...this.metrics };
  }
}
