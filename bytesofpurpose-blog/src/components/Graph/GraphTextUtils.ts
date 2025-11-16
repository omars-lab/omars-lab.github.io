/**
 * ============================================================================
 * Graph Text Utilities
 * ============================================================================
 * Functions for text processing, wrapping, truncation, and font size calculation.
 * ============================================================================
 */

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
 * 
 * @example
 * ```typescript
 * // Input:
 * const ctx = document.createElement('canvas').getContext('2d')!;
 * ctx.font = '12px Sans-Serif';
 * breakLongWord('hello-world', ctx, 50)
 * // Output: ['hello-', 'world']
 * 
 * // Input:
 * breakLongWord('camelCaseWord', ctx, 40)
 * // Output: ['camel', 'CaseWord'] (breaks at camelCase boundary)
 * 
 * // Input:
 * breakLongWord('verylongword', ctx, 30)
 * // Output: [] (no natural break, caller should truncate)
 * 
 * // Input:
 * breakLongWord('short', ctx, 50)
 * // Output: ['short'] (fits without breaking)
 * ```
 */
export function breakLongWord(
  word: string,
  ctx: CanvasRenderingContext2D,
  availableWidth: number
): string[] {
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
}

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
 * 
 * @example
 * ```typescript
 * // Input:
 * const ctx = document.createElement('canvas').getContext('2d')!;
 * ctx.font = '12px Sans-Serif';
 * const linePositions = [96.8, 100, 103.2];
 * const getAvailableWidth = (y: number, lineIndex: number) => 50;
 * wrapTextIntoLines('Hello world this is a test', ctx, 12, linePositions, getAvailableWidth)
 * // Output: ['Hello world', 'this is a', 'test']
 * 
 * // Input:
 * wrapTextIntoLines('Short', ctx, 12, linePositions, getAvailableWidth)
 * // Output: ['Short']
 * 
 * // Input:
 * wrapTextIntoLines('Very long word that needs breaking', ctx, 12, linePositions, getAvailableWidth)
 * // Output: ['Very long', 'word that', 'needs...'] (truncated if needed)
 * ```
 */
export function wrapTextIntoLines(
  text: string,
  ctx: CanvasRenderingContext2D,
  fontSize: number,
  linePositions: number[],
  getAvailableWidth: (y: number, lineIndex: number) => number
): string[] {
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
}

/**
 * Truncates a line of text to fit within available width, adding ellipsis if needed.
 * 
 * @param ctx - Canvas context
 * @param line - Text line to truncate
 * @param maxWidth - Maximum available width
 * @returns Truncated line with ellipsis if needed
 * 
 * @example
 * ```typescript
 * // Input:
 * const ctx = document.createElement('canvas').getContext('2d')!;
 * ctx.font = '12px Sans-Serif';
 * truncateLine(ctx, 'This is a very long line of text', 100)
 * // Output: 'This is a very long...'
 * 
 * // Input:
 * truncateLine(ctx, 'Short', 100)
 * // Output: 'Short' (no truncation needed)
 * 
 * // Input:
 * truncateLine(ctx, 'A', 5)
 * // Output: '' (even ellipsis doesn't fit)
 * ```
 */
export function truncateLine(
  ctx: CanvasRenderingContext2D,
  line: string,
  maxWidth: number
): string {
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
}

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
 * 
 * @example
 * ```typescript
 * // Input:
 * const ctx = document.createElement('canvas').getContext('2d')!;
 * const lines = ['Line one', 'Line two', 'Line three'];
 * const linePositions = [96.8, 100, 103.2];
 * const getAvailableWidth = (y: number, lineIndex: number) => 50;
 * calculateOptimalFontSize(ctx, lines, linePositions, getAvailableWidth, 12, 8, 20)
 * // Output: ~10.5 (reduced to fit width constraints)
 * 
 * // Input:
 * calculateOptimalFontSize(ctx, ['Short'], linePositions, getAvailableWidth, 12, 8, 20)
 * // Output: 12 (no reduction needed)
 * ```
 */
export function calculateOptimalFontSize(
  ctx: CanvasRenderingContext2D,
  lines: string[],
  linePositions: number[],
  getAvailableWidth: (y: number, lineIndex: number) => number,
  initialFontSize: number,
  minFontSize: number,
  maxTextHeight: number
): number {
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
}

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
 * 
 * @example
 * ```typescript
 * // Input:
 * const ctx = document.createElement('canvas').getContext('2d')!;
 * const lines = ['Line one', 'Line two'];
 * const linePositions = [96.8, 100];
 * const getAvailableWidth = (y: number, lineIndex: number) => 50;
 * applyZoomScaling(ctx, 12, lines, linePositions, getAvailableWidth, 1.5, 8, 20)
 * // Output: ~12.4 (slightly scaled up due to zoom)
 * 
 * // Input:
 * applyZoomScaling(ctx, 12, lines, linePositions, getAvailableWidth, 0.5, 8, 20)
 * // Output: 12 (no scaling when zoomed out)
 * 
 * // Input:
 * applyZoomScaling(ctx, 12, lines, linePositions, getAvailableWidth, 2.5, 8, 20)
 * // Output: 12 (no scaling at high zoom levels)
 * ```
 */
export function applyZoomScaling(
  ctx: CanvasRenderingContext2D,
  baseFontSize: number,
  lines: string[],
  linePositions: number[],
  getAvailableWidth: (y: number, lineIndex: number) => number,
  globalScale: number,
  minFontSize: number,
  maxTextHeight: number
): number {
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
}

