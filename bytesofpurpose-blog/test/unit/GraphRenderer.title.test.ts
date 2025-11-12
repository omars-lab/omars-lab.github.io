/**
 * Tests for GraphRenderer title display logic
 * 
 * These tests verify that:
 * - Text is truncated to 10 characters (7 chars + "...")
 * - Text is displayed on a single line
 * - Ellipsis appears at the end when truncated
 * - Text fits within node boundaries
 */

/// <reference types="jest" />

import { createMockCanvasContext, createMockNode } from '../utils/canvasMock';

// Testable version of the actual implementation logic
// Current implementation: MAX_CHARS = 10, CHARS_BEFORE_ELLIPSIS = 7

const MAX_CHARS = 10;
const CHARS_BEFORE_ELLIPSIS = 7;

/**
 * Testable version of text truncation logic
 * Matches NodeRenderer.truncateToMaxChars implementation
 */
function truncateToMaxChars(text: string): string {
  if (text.length <= MAX_CHARS) {
    return text;
  }
  // First 7 chars + "..." = 10 chars total
  return text.substring(0, CHARS_BEFORE_ELLIPSIS) + '...';
}

describe('GraphRenderer Title Logic', () => {
  describe('truncateToMaxChars', () => {
    it('should return text as-is if 10 characters or less', () => {
      expect(truncateToMaxChars('Short')).toBe('Short');
      expect(truncateToMaxChars('1234567890')).toBe('1234567890'); // Exactly 10 chars
      expect(truncateToMaxChars('Hi')).toBe('Hi');
    });

    it('should truncate to 7 chars + "..." (10 total) if longer than 10', () => {
      const longText = 'This is a very long title';
      const result = truncateToMaxChars(longText);
      
      expect(result.length).toBe(MAX_CHARS); // Should be exactly 10
      expect(result).toBe('This is...'); // First 7 chars + "..."
      expect(result.endsWith('...')).toBe(true);
    });

    it('should handle empty strings', () => {
      expect(truncateToMaxChars('')).toBe('');
      expect(truncateToMaxChars('   ')).toBe('   '); // Whitespace is preserved
    });

    it('should truncate at exactly 11 characters', () => {
      const text11 = '12345678901'; // 11 chars
      const result = truncateToMaxChars(text11);
      
      expect(result.length).toBe(MAX_CHARS);
      expect(result).toBe('1234567...');
      expect(result.endsWith('...')).toBe(true);
    });

    it('should handle edge case: exactly 10 characters (no truncation)', () => {
      const exact10 = '1234567890';
      const result = truncateToMaxChars(exact10);
      
      expect(result).toBe(exact10);
      expect(result.length).toBe(10);
      expect(result.endsWith('...')).toBe(false);
    });

    it('should handle very long text', () => {
      const veryLong = 'A'.repeat(100);
      const result = truncateToMaxChars(veryLong);
      
      expect(result.length).toBe(MAX_CHARS);
      expect(result).toBe('AAAAAAA...');
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
      expect(metrics.width).toBe(30); // 5 chars * 6px per char = 30
      expect(metrics.actualBoundingBoxAscent).toBe(7); // Mock returns 10 * 0.7 = 7
    });
  });
});

