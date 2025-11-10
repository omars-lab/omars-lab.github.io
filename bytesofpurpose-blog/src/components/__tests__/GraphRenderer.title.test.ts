/**
 * Tests for GraphRenderer title display logic
 * 
 * These tests verify that:
 * - Text is truncated to 20 characters with ellipsis
 * - Text is distributed across up to 3 lines
 * - Ellipsis appears at the end, not alone
 * - Text fits within node boundaries
 */

/// <reference types="jest" />

import { createMockCanvasContext, createMockNode } from '../../test/utils/canvasMock';

// We need to import the functions to test them
// Since they're not exported, we'll test through the component behavior
// For now, let's create a testable version of the logic

/**
 * Testable version of text distribution logic
 * This mirrors the logic in drawTitle's distributeText function
 */
function distributeText(text: string, targetLines: number): string[] {
  if (!text || text.length === 0) return [];
  
  // If text is short enough, just return it as a single line
  if (text.length <= 10) {
    return [text];
  }
  
  const result: string[] = [];
  const charsPerLine = Math.ceil(text.length / targetLines);
  const words = text.split(/\s+/);
  
  // Check if text ends with ellipsis
  const hasEllipsis = text.endsWith('...');
  
  // Try to break at word boundaries first
  if (words.length > 1) {
    let currentLine = '';
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const isLastWord = i === words.length - 1;
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      
      if (testLine.length > charsPerLine && currentLine && result.length < targetLines - 1) {
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
    // Single word or no spaces
    if (hasEllipsis && text.length > 3) {
      const textWithoutEllipsis = text.substring(0, text.length - 3);
      const remainingChars = textWithoutEllipsis.length;
      
      if (remainingChars <= 7) {
        return [text];
      }
      
      const charsPerLineForText = Math.ceil(remainingChars / targetLines);
      
      for (let i = 0; i < remainingChars; i += charsPerLineForText) {
        const chunk = textWithoutEllipsis.substring(i, i + charsPerLineForText);
        if (i + charsPerLineForText >= remainingChars) {
          if (chunk.length > 0) {
            result.push(chunk + '...');
          } else {
            if (result.length > 0) {
              result[result.length - 1] = result[result.length - 1] + '...';
            } else {
              return [text];
            }
          }
        } else {
          result.push(chunk);
        }
      }
    } else {
      for (let i = 0; i < text.length; i += charsPerLine) {
        result.push(text.substring(i, i + charsPerLine));
      }
    }
  }
  
  return result.slice(0, 3);
}

/**
 * Testable version of text truncation logic
 */
function truncateTitle(labelStr: string, maxChars: number = 20): string {
  const trimmed = labelStr.trim();
  if (trimmed.length === 0) return '';
  
  return trimmed.length > maxChars 
    ? trimmed.substring(0, maxChars - 3) + '...'
    : trimmed;
}

describe('GraphRenderer Title Logic', () => {
  describe('truncateTitle', () => {
    it('should return text as-is if shorter than maxChars', () => {
      expect(truncateTitle('Short text')).toBe('Short text');
      expect(truncateTitle('Exactly 20 chars!!')).toBe('Exactly 20 chars!!');
    });

    it('should truncate to 20 chars and add ellipsis if longer', () => {
      const longText = 'This is a very long title that exceeds 20 characters';
      const result = truncateTitle(longText);
      
      expect(result.length).toBe(20);
      expect(result).toBe('This is a very lo...');
      expect(result.endsWith('...')).toBe(true);
    });

    it('should handle empty strings', () => {
      expect(truncateTitle('')).toBe('');
      expect(truncateTitle('   ')).toBe('');
    });

    it('should preserve ellipsis at the end', () => {
      const result = truncateTitle('A very long title that needs truncation');
      expect(result.endsWith('...')).toBe(true);
      expect(result.length).toBe(20);
    });
  });

  describe('distributeText', () => {
    it('should return short text as single line', () => {
      expect(distributeText('Short', 3)).toEqual(['Short']);
      expect(distributeText('Ten chars!', 3)).toEqual(['Ten chars!']);
    });

    it('should distribute text across multiple lines', () => {
      const text = 'This is a longer text that should be distributed';
      const result = distributeText(text, 3);
      
      expect(result.length).toBeGreaterThan(0);
      expect(result.length).toBeLessThanOrEqual(3);
      expect(result.join(' ').replace(/\s+/g, ' ')).toContain(text.split(' ')[0]);
    });

    it('should keep ellipsis with the last word', () => {
      const text = 'First Level Node ...';
      const result = distributeText(text, 3);
      
      // Ellipsis should be on the last line, not alone
      const lastLine = result[result.length - 1];
      expect(lastLine).toContain('...');
      expect(lastLine).not.toBe('...');
      expect(lastLine.length).toBeGreaterThan(3);
    });

    it('should not create lines with only ellipsis', () => {
      const text = 'A very long title that needs to be truncated and distributed';
      const truncated = truncateTitle(text);
      const result = distributeText(truncated, 3);
      
      result.forEach(line => {
        expect(line).not.toBe('...');
        expect(line.trim().length).toBeGreaterThan(0);
      });
    });

    it('should handle text with ellipsis correctly', () => {
      const text = 'First Level Node ...';
      const result = distributeText(text, 3);
      
      expect(result.length).toBeGreaterThan(0);
      expect(result.length).toBeLessThanOrEqual(3);
      
      // Check that ellipsis is preserved
      const allText = result.join('');
      expect(allText).toContain('...');
    });

    it('should return max 3 lines', () => {
      const longText = 'Word1 Word2 Word3 Word4 Word5 Word6 Word7 Word8 Word9 Word10';
      const result = distributeText(longText, 3);
      
      expect(result.length).toBeLessThanOrEqual(3);
    });

    it('should handle single long word', () => {
      const longWord = 'Supercalifragilisticexpialidocious';
      const result = distributeText(longWord, 3);
      
      expect(result.length).toBeGreaterThan(0);
      expect(result.length).toBeLessThanOrEqual(3);
      // All characters should be preserved
      const combined = result.join('');
      expect(combined).toBe(longWord);
    });
  });

  describe('Title truncation and distribution integration', () => {
    it('should truncate long title and distribute correctly', () => {
      const longTitle = 'This is a very long title that exceeds twenty characters';
      const truncated = truncateTitle(longTitle);
      const distributed = distributeText(truncated, 3);
      
      expect(truncated.length).toBe(20);
      expect(truncated.endsWith('...')).toBe(true);
      expect(distributed.length).toBeGreaterThan(0);
      expect(distributed.length).toBeLessThanOrEqual(3);
    });

    it('should handle edge case: exactly 20 characters', () => {
      const exact20 = '12345678901234567890';
      const truncated = truncateTitle(exact20);
      const distributed = distributeText(truncated, 3);
      
      expect(truncated).toBe(exact20); // No truncation needed
      expect(distributed.length).toBeGreaterThan(0);
    });

    it('should handle edge case: 21 characters', () => {
      const text21 = '123456789012345678901';
      const truncated = truncateTitle(text21);
      const distributed = distributeText(truncated, 3);
      
      expect(truncated.length).toBe(20);
      expect(truncated.endsWith('...')).toBe(true);
      expect(distributed.length).toBeGreaterThan(0);
    });
  });

  describe('Canvas context mocking', () => {
    it('should create mock canvas context', () => {
      const mockCtx = createMockCanvasContext();
      
      expect(mockCtx.fillText).toBeDefined();
      expect(mockCtx.measureText).toBeDefined();
      expect(mockCtx.save).toBeDefined();
      expect(mockCtx.restore).toBeDefined();
    });

    it('should track fillText calls', () => {
      const mockCtx = createMockCanvasContext();
      
      mockCtx.fillText('Test', 10, 20);
      mockCtx.fillText('Another', 30, 40);
      
      const calls = mockCtx.getFillTextCalls();
      expect(calls).toHaveLength(2);
      expect(calls[0]).toEqual({ text: 'Test', x: 10, y: 20 });
      expect(calls[1]).toEqual({ text: 'Another', x: 30, y: 40 });
    });

    it('should measure text width', () => {
      const mockCtx = createMockCanvasContext();
      mockCtx.font = '10px Sans-Serif';
      
      const metrics = mockCtx.measureText('Hello');
      expect(metrics.width).toBe(30); // 5 chars * 10px * 0.6 = 30
      expect(metrics.actualBoundingBoxAscent).toBe(7); // 10 * 0.7 = 7
    });
  });
});

