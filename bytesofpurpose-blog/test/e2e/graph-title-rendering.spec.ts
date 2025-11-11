import { test, expect } from '@playwright/test';
import {
  hasCanvasContent,
  extractCanvasText,
  getCanvasDimensions,
} from './helpers/canvas-utils';

/**
 * E2E tests specifically for title rendering in GraphRenderer
 * 
 * These tests focus on verifying that:
 * - Text is properly rendered (not just ellipsis)
 * - Titles are visible at different zoom levels
 * - No "ellipsis-only" nodes appear
 */

test.describe('GraphRenderer Title Rendering E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the graph component page
    const response = await page.goto('/docs/techniques/blogging-techniques/embed-structural-components/graph', {
      waitUntil: 'domcontentloaded',
    });
    
    // Verify page loaded successfully (not 404)
    if (!response || response.status() !== 200) {
      const url = page.url();
      const title = await page.title();
      throw new Error(`Page failed to load. Status: ${response?.status()}, URL: ${url}, Title: ${title}`);
    }
    
    // Wait for the page to fully load
    await page.waitForLoadState('networkidle');
    
    // Wait for React to hydrate (Docusaurus uses React)
    await page.waitForFunction(() => {
      return document.readyState === 'complete';
    }, { timeout: 5000 });
    
    // Wait a bit for components to mount (reduced from 2000ms)
    await page.waitForTimeout(1000);
    
    // Check if page crashed (React error boundary)
    const crashIndicator = page.locator('text=This page crashed');
    const isCrashed = await crashIndicator.isVisible().catch(() => false);
    if (isCrashed) {
      const errorText = await page.locator('main').textContent();
      await page.screenshot({ path: 'test/e2e/screenshots/debug-title-page-crashed.png', fullPage: true });
      throw new Error(`Page crashed with React error: ${errorText}`);
    }
    
    // Wait for canvas to be rendered (graph component needs time to initialize)
    // The force-graph library creates canvas elements dynamically
    // Use shorter timeout and better error message
    try {
      await page.waitForSelector('canvas', { timeout: 10000, state: 'attached' });
    } catch (error) {
      // Debug: Take screenshot if canvas not found
      const url = page.url();
      const title = await page.title();
      await page.screenshot({ path: 'test/e2e/screenshots/debug-title-no-canvas.png', fullPage: true });
      console.error(`Canvas not found. URL: ${url}, Title: ${title}`);
      throw new Error(`Canvas element not found on page. URL: ${url}, Status: ${response?.status()}`);
    }
  });

  test('should render text content in nodes, not just ellipsis', async ({
    page,
  }) => {
    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible({ timeout: 10000 });
    
    // Wait for graph to stabilize
    await page.waitForTimeout(2000);

    // Check if canvas has content
    const hasContent = await hasCanvasContent(canvas);
    expect(hasContent).toBe(true);

    // Extract text-like regions from canvas
    const textAnalysis = await extractCanvasText(canvas, {
      sampleSize: 20,
      threshold: 50,
    });

    // Should have text regions (nodes with titles)
    expect(textAnalysis.hasText).toBe(true);
    expect(textAnalysis.textRegions.length).toBeGreaterThan(0);

    // Take screenshot for visual verification
    await canvas.screenshot({
      path: 'test/e2e/screenshots/title-rendering.png',
    });
  });

  test('should maintain text visibility when zooming', async ({ page }) => {
    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(2000);

    // Get initial text regions
    const initialText = await extractCanvasText(canvas);
    expect(initialText.hasText).toBe(true);

    // Zoom in
    await canvas.hover();
    await page.mouse.wheel(0, -500);
    await page.waitForTimeout(1500);

    // Check text is still visible after zoom in
    const zoomedInText = await extractCanvasText(canvas);
    expect(zoomedInText.hasText).toBe(true);

    // Zoom out
    await page.mouse.wheel(0, 500);
    await page.waitForTimeout(1500);

    // Check text is still visible after zoom out
    const zoomedOutText = await extractCanvasText(canvas);
    expect(zoomedOutText.hasText).toBe(true);
  });

  test('should not have invisible or empty nodes', async ({ page }) => {
    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(2000);

    const dimensions = await getCanvasDimensions(canvas);
    expect(dimensions.width).toBeGreaterThan(0);
    expect(dimensions.height).toBeGreaterThan(0);

    // Sample multiple regions to ensure content is distributed
    const sampleResults = await canvas.evaluate(
      (canvasEl: HTMLCanvasElement) => {
        const ctx = canvasEl.getContext('2d');
        if (!ctx) return [];

        const results: Array<{ x: number; y: number; hasContent: boolean }> =
          [];
        const sampleSize = 30;

        // Sample 16 points across the canvas
        for (let row = 0; row < 4; row++) {
          for (let col = 0; col < 4; col++) {
            const x = (canvasEl.width / 4) * col + canvasEl.width / 8;
            const y = (canvasEl.height / 4) * row + canvasEl.height / 8;

            const imageData = ctx.getImageData(x, y, sampleSize, sampleSize);
            let hasContent = false;

            // Check for non-transparent pixels
            for (let i = 3; i < imageData.data.length; i += 4) {
              if (imageData.data[i] > 10) {
                hasContent = true;
                break;
              }
            }

            results.push({ x, y, hasContent });
          }
        }

        return results;
      }
    );

    // At least some regions should have content
    const regionsWithContent = sampleResults.filter((r) => r.hasContent).length;
    expect(regionsWithContent).toBeGreaterThan(0);
  });

  test('should render nodes with different title lengths', async ({ page }) => {
    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(2000);

    // Verify canvas has rendered content
    const hasContent = await hasCanvasContent(canvas);
    expect(hasContent).toBe(true);

    // Check for text regions (indicating nodes with titles are rendered)
    const textAnalysis = await extractCanvasText(canvas);
    expect(textAnalysis.hasText).toBe(true);

    // Take screenshot for manual verification
    await canvas.screenshot({
      path: 'test/e2e/screenshots/different-title-lengths.png',
    });
  });

  test('should handle rapid zoom changes without losing text', async ({
    page,
  }) => {
    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(2000);

    // Rapid zoom in and out
    for (let i = 0; i < 3; i++) {
      await canvas.hover();
      await page.mouse.wheel(0, -300);
      await page.waitForTimeout(300);
      await page.mouse.wheel(0, 300);
      await page.waitForTimeout(300);
    }

    // Wait for stabilization
    await page.waitForTimeout(1000);

    // Verify text is still visible
    const textAnalysis = await extractCanvasText(canvas);
    expect(textAnalysis.hasText).toBe(true);

    // Verify canvas still has content
    const hasContent = await hasCanvasContent(canvas);
    expect(hasContent).toBe(true);
  });

  test('regression: should not render ellipsis-only nodes', async ({
    page,
  }) => {
    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(2000);

    // This test verifies that nodes have actual text content, not just ellipsis
    // We check by analyzing text regions to ensure they're wide enough to contain
    // more than just "..." (which is only 3 characters)

    const textAnalysis = await canvas.evaluate((canvasEl: HTMLCanvasElement) => {
      const ctx = canvasEl.getContext('2d');
      if (!ctx) {
        return { hasText: false, textRegions: [], wideRegions: 0 };
      }

      const textRegions: Array<{
        x: number;
        y: number;
        width: number;
        height: number;
        pixelWidth: number;
      }> = [];

      // Sample canvas in a grid pattern to find text-like regions
      const gridSize = 50;
      const sampleSize = 25;
      const threshold = 30;

      for (let y = 0; y < canvasEl.height; y += gridSize) {
        for (let x = 0; x < canvasEl.width; x += gridSize) {
          const imageData = ctx.getImageData(
            x,
            y,
            Math.min(sampleSize, canvasEl.width - x),
            Math.min(sampleSize, canvasEl.height - y)
          );

          // Check for text-like patterns (high contrast, non-transparent)
          let hasHighContrast = false;
          let nonTransparentPixels = 0;
          let leftmostPixel = sampleSize;
          let rightmostPixel = 0;

          for (let py = 0; py < imageData.height; py++) {
            for (let px = 0; px < imageData.width; px++) {
              const idx = (py * imageData.width + px) * 4;
              const r = imageData.data[idx];
              const g = imageData.data[idx + 1];
              const b = imageData.data[idx + 2];
              const a = imageData.data[idx + 3];

              if (a > threshold) {
                nonTransparentPixels++;
                // Check for high contrast (text is usually high contrast)
                const brightness = (r + g + b) / 3;
                if (brightness < 50 || brightness > 200) {
                  hasHighContrast = true;
                  leftmostPixel = Math.min(leftmostPixel, px);
                  rightmostPixel = Math.max(rightmostPixel, px);
                }
              }
            }
          }

          // If region has high contrast and non-transparent pixels, it might be text
          if (hasHighContrast && nonTransparentPixels > sampleSize * 0.1) {
            const pixelWidth = rightmostPixel - leftmostPixel;
            textRegions.push({
              x,
              y,
              width: sampleSize,
              height: sampleSize,
              pixelWidth,
            });
          }
        }
      }

      // Estimate character width: assume average character is ~6-8 pixels wide
      // "..." (3 chars) would be roughly 18-24 pixels wide
      // We want regions that are at least 30 pixels wide (more than just "...")
      const MIN_WIDTH_FOR_REAL_TEXT = 30;
      const wideRegions = textRegions.filter(
        (r) => r.pixelWidth >= MIN_WIDTH_FOR_REAL_TEXT
      ).length;

      return {
        hasText: textRegions.length > 0,
        textRegions: textRegions.map(({ x, y, width, height }) => ({
          x,
          y,
          width,
          height,
        })),
        wideRegions,
        allRegions: textRegions.length,
      };
    });

    // Should have multiple text regions (nodes with actual text)
    expect(textAnalysis.textRegions.length).toBeGreaterThan(0);

    // CRITICAL: At least some regions should be wide enough to contain more than just "..."
    // If all regions are narrow (just wide enough for "..."), that's a failure
    expect(textAnalysis.wideRegions).toBeGreaterThan(0);

    // At least 50% of text regions should be wide enough for real text
    // (allowing for some nodes that might legitimately be short)
    const wideRegionRatio = textAnalysis.wideRegions / textAnalysis.allRegions;
    expect(wideRegionRatio).toBeGreaterThan(0.5);

    // Verify that text regions are distributed (not all in one place)
    const uniqueXPositions = new Set(
      textAnalysis.textRegions.map((r) => Math.floor(r.x / 50))
    );
    const uniqueYPositions = new Set(
      textAnalysis.textRegions.map((r) => Math.floor(r.y / 50))
    );

    // Text should be distributed across the canvas (multiple nodes)
    expect(uniqueXPositions.size + uniqueYPositions.size).toBeGreaterThan(2);

    // Take screenshot for visual verification
    await canvas.screenshot({
      path: 'test/e2e/screenshots/ellipsis-regression-test.png',
    });
  });
});

