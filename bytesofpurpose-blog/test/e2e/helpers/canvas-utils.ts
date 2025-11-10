/**
 * Helper utilities for testing canvas rendering in Playwright E2E tests
 */

/**
 * Extracts text-like patterns from canvas by analyzing pixel data
 * This is a simplified approach - for production, consider using OCR libraries
 */
export async function extractCanvasText(
  canvas: any,
  options: {
    sampleSize?: number;
    threshold?: number;
  } = {}
): Promise<{
  hasText: boolean;
  textRegions: Array<{ x: number; y: number; width: number; height: number }>;
}> {
  const { sampleSize = 10, threshold = 50 } = options;

  return await canvas.evaluate(
    (
      canvasEl: HTMLCanvasElement,
      opts: { sampleSize: number; threshold: number }
    ) => {
      const ctx = canvasEl.getContext('2d');
      if (!ctx) {
        return { hasText: false, textRegions: [] };
      }

      const textRegions: Array<{
        x: number;
        y: number;
        width: number;
        height: number;
      }> = [];

      // Sample canvas in a grid pattern to find text-like regions
      const gridSize = 50;
      for (let y = 0; y < canvasEl.height; y += gridSize) {
        for (let x = 0; x < canvasEl.width; x += gridSize) {
          const imageData = ctx.getImageData(
            x,
            y,
            Math.min(opts.sampleSize, canvasEl.width - x),
            Math.min(opts.sampleSize, canvasEl.height - y)
          );

          // Check for text-like patterns (high contrast, non-transparent)
          let hasHighContrast = false;
          let nonTransparentPixels = 0;

          for (let i = 0; i < imageData.data.length; i += 4) {
            const r = imageData.data[i];
            const g = imageData.data[i + 1];
            const b = imageData.data[i + 2];
            const a = imageData.data[i + 3];

            if (a > opts.threshold) {
              nonTransparentPixels++;
              // Check for high contrast (text is usually high contrast)
              const brightness = (r + g + b) / 3;
              if (brightness < 50 || brightness > 200) {
                hasHighContrast = true;
              }
            }
          }

          // If region has high contrast and non-transparent pixels, it might be text
          if (hasHighContrast && nonTransparentPixels > opts.sampleSize * 0.1) {
            textRegions.push({
              x,
              y,
              width: opts.sampleSize,
              height: opts.sampleSize,
            });
          }
        }
      }

      return {
        hasText: textRegions.length > 0,
        textRegions,
      };
    },
    { sampleSize, threshold }
  );
}

/**
 * Checks if canvas has rendered content (non-transparent pixels)
 */
export async function hasCanvasContent(canvas: any): Promise<boolean> {
  return await canvas.evaluate((canvasEl: HTMLCanvasElement) => {
    const ctx = canvasEl.getContext('2d');
    if (!ctx) return false;

    // Sample center area
    const centerX = canvasEl.width / 2;
    const centerY = canvasEl.height / 2;
    const sampleSize = 100;

    const imageData = ctx.getImageData(
      centerX - sampleSize / 2,
      centerY - sampleSize / 2,
      sampleSize,
      sampleSize
    );

    // Check if any pixel has alpha > 0
    for (let i = 3; i < imageData.data.length; i += 4) {
      if (imageData.data[i] > 0) {
        return true;
      }
    }

    return false;
  });
}

/**
 * Gets canvas dimensions
 */
export async function getCanvasDimensions(canvas: any): Promise<{
  width: number;
  height: number;
}> {
  return await canvas.evaluate((canvasEl: HTMLCanvasElement) => {
    return {
      width: canvasEl.width,
      height: canvasEl.height,
    };
  });
}

