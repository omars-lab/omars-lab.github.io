/**
 * Utility functions for creating mocked canvas contexts for testing
 */

export interface MockCanvasContext {
  save: jest.Mock;
  restore: jest.Mock;
  beginPath: jest.Mock;
  arc: jest.Mock;
  clip: jest.Mock;
  fillText: jest.Mock;
  measureText: jest.Mock;
  font: string;
  textAlign: string;
  textBaseline: string;
  fillStyle: string;
  strokeStyle: string;
  lineWidth: number;
  setLineDash: jest.Mock;
  moveTo: jest.Mock;
  lineTo: jest.Mock;
  stroke: jest.Mock;
  fill: jest.Mock;
  createRadialGradient: jest.Mock;
  // Helper methods for testing
  getFillTextCalls: () => Array<{ text: string; x: number; y: number }>;
  getMeasureTextCalls: () => string[];
  clearCalls: () => void;
}

/**
 * Creates a mock canvas 2D context with tracking capabilities
 */
export function createMockCanvasContext(): MockCanvasContext {
  const fillTextCalls: Array<{ text: string; x: number; y: number }> = [];
  const measureTextCalls: string[] = [];
  
  const mockCtx = {
    save: jest.fn(),
    restore: jest.fn(),
    beginPath: jest.fn(),
    arc: jest.fn(),
    clip: jest.fn(),
    fillText: jest.fn((text: string, x: number, y: number) => {
      fillTextCalls.push({ text, x, y });
    }),
    measureText: jest.fn(function(this: any, text: string) {
      measureTextCalls.push(text);
      // Extract font size from ctx.font (e.g., "12px Sans-Serif" -> 12)
      const fontMatch = this.font.match(/(\d+(?:\.\d+)?)px/);
      const fontSize = fontMatch ? parseFloat(fontMatch[1]) : 10;
      // Approximate: 0.6 * fontSize per character for Sans-Serif font (more realistic)
      const width = text.length * fontSize * 0.6;
      return {
        width,
        actualBoundingBoxAscent: fontSize * 0.7,
        actualBoundingBoxDescent: fontSize * 0.2,
      };
    }),
    font: '',
    textAlign: 'left',
    textBaseline: 'alphabetic',
    fillStyle: '#000000',
    strokeStyle: '#000000',
    lineWidth: 1,
    setLineDash: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    stroke: jest.fn(),
    fill: jest.fn(),
    createRadialGradient: jest.fn(() => ({
      addColorStop: jest.fn(),
    })),
    // Helper methods for testing
    getFillTextCalls: () => fillTextCalls,
    getMeasureTextCalls: () => measureTextCalls,
    clearCalls: () => {
      fillTextCalls.length = 0;
      measureTextCalls.length = 0;
    },
  } as any;
  
  return mockCtx;
}

/**
 * Creates a mock node object for testing
 */
export function createMockNode(
  id: string,
  x: number = 0,
  y: number = 0,
  hasChildren: boolean = false
) {
  return {
    id,
    x,
    y,
    hasChildren,
    title: `Node ${id}`,
    name: `Node ${id}`,
  };
}

