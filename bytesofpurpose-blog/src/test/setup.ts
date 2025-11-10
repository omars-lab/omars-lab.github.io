import 'jest-canvas-mock';
import '@testing-library/jest-dom';

// Mock canvas methods for better testing
global.HTMLCanvasElement.prototype.getContext = jest.fn((contextType: string) => {
  if (contextType === '2d') {
    return {
      save: jest.fn(),
      restore: jest.fn(),
      beginPath: jest.fn(),
      arc: jest.fn(),
      clip: jest.fn(),
      fillText: jest.fn(),
      measureText: jest.fn((text: string) => ({
        width: text.length * 6, // Approximate: 6px per character
        actualBoundingBoxAscent: 10,
        actualBoundingBoxDescent: 2,
      })),
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
    } as any;
  }
  return null;
});

