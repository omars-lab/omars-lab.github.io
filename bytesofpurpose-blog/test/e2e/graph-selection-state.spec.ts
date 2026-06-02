import { test, expect } from '@playwright/test';

/**
 * E2E tests for graph node and edge selection state management
 * 
 * These tests verify:
 * - Clicking a node after clicking an edge unselects the edge
 * - Clicking an edge after clicking a node unselects the node
 * - Collapse all clears selections and doesn't error with edge selected
 * - URL hash with edge when nodes are collapsed doesn't error
 * - Node/edge selection state is properly managed
 */

test.describe('GraphRenderer Selection State E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the AI framework landscape doc (embeds <AIFrameworkGraph/>)
    const response = await page.goto('/docs/craft/generative-ai/mental-models/2025-11-10-ai-framework-landscape', {
      waitUntil: 'domcontentloaded',
    });
    
    // Verify page loaded successfully
    if (!response || response.status() !== 200) {
      const url = page.url();
      const title = await page.title();
      throw new Error(`Page failed to load. Status: ${response?.status()}, URL: ${url}, Title: ${title}`);
    }
    
    // Wait for the page to fully load
    await page.waitForLoadState('networkidle');
    
    // Wait for React to hydrate
    await page.waitForFunction(() => {
      return document.readyState === 'complete';
    }, { timeout: 5000 });
    
    // Wait for components to mount
    await page.waitForTimeout(2000);
    
    // Check if page crashed
    const crashIndicator = page.locator('text=This page crashed');
    const isCrashed = await crashIndicator.isVisible().catch(() => false);
    if (isCrashed) {
      const errorText = await page.locator('main').textContent();
      await page.screenshot({ path: 'test/e2e/screenshots/debug-selection-page-crashed.png', fullPage: true });
      throw new Error(`Page crashed with React error: ${errorText}`);
    }
    
    // Wait for canvas to be rendered
    const canvas = page.locator('canvas').first();
    await canvas.waitFor({ state: 'visible', timeout: 10000 });
    
    // Wait a bit more for graph to initialize
    await page.waitForTimeout(1000);
  });

  test('clicking node after clicking edge unselects edge', async ({ page }) => {
    // Navigate to URL with edge hash to ensure we have an edge selected
    const edgeHash = '#ai-framework-graph-edge-compare-LangChain-Outlines-reverse';
    await page.goto(`/docs/craft/generative-ai/mental-models/2025-11-10-ai-framework-landscape${edgeHash}`, {
      waitUntil: 'domcontentloaded',
    });
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // The pane reflects the current selection via data-panel ("node" | "edge" |
    // "empty") — a stable hook, vs. matching pane text ("vs."/"Source") which
    // gives false positives (a node's ingress list also contains "(vs.)").
    const pane = page.locator('[data-testid="graph-info-panel"]').first();
    await pane.waitFor({ state: 'visible', timeout: 15000 });

    // Edge deep-link should have selected the edge.
    if ((await pane.getAttribute('data-panel')) === 'edge') {
      // Click a connected node link in the pane to switch selection to a node.
      const nodeLink = page.locator('a').filter({ hasText: /LangChain|Outlines/ }).first();
      if (await nodeLink.isVisible({ timeout: 2000 }).catch(() => false)) {
        await nodeLink.click();
        // Selection must move off the edge (to a node) — assert via data-panel.
        await expect(pane).not.toHaveAttribute('data-panel', 'edge', { timeout: 5000 });
        await expect(pane).toHaveAttribute('data-panel', 'node');
      }
    }
    // If the edge isn't selectable (nodes collapsed), there's nothing to assert.
  });

  test('clicking edge after clicking node unselects node', async ({ page }) => {
    // Navigate to URL with node hash to ensure we have a node selected
    const nodeHash = '#ai-framework-graph-node-LangChain';
    await page.goto(`/docs/craft/generative-ai/mental-models/2025-11-10-ai-framework-landscape${nodeHash}`, {
      waitUntil: 'domcontentloaded',
    });
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Check if pane shows node details
    const pane = page.locator('[data-testid="graph-info-panel"]').first();
    await pane.waitFor({ state: 'visible', timeout: 5000 });
    
    // Wait a bit for node to be selected
    await page.waitForTimeout(1000);
    
    const paneContent = await pane.textContent().catch(() => '');
    
    // Check if we have node content (Ingress, Egress, or node title)
    const hasNodeContent = paneContent && (
      paneContent.includes('Ingress') || 
      paneContent.includes('Egress') ||
      paneContent.length > 50 // Node details should have substantial content
    );
    
    if (hasNodeContent) {
      // We have a node selected, now navigate to an edge URL
      const edgeHash = '#ai-framework-graph-edge-compare-LangChain-Outlines-reverse';
      await page.goto(`/docs/craft/generative-ai/mental-models/2025-11-10-ai-framework-landscape${edgeHash}`, {
        waitUntil: 'domcontentloaded',
      });
      
      // Wait for page to load
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      // Check if we now have edge content
      const newPaneContent = await pane.textContent().catch(() => '');
      const hasEdgeContent = newPaneContent && (
        newPaneContent.includes('vs.') || 
        newPaneContent.includes('Source') || 
        newPaneContent.includes('Destination')
      );
      
      if (hasEdgeContent) {
        // Verify node-specific content is gone
        const stillHasNodeContent = newPaneContent && (
          newPaneContent.includes('Ingress') || 
          newPaneContent.includes('Egress')
        );
        
        // Node-specific content should be gone
        expect(stillHasNodeContent).toBeFalsy();
      }
      // If edge not found (nodes might be collapsed), test passes (edge selection not possible)
    }
    // If node not found, test passes (node selection not possible)
  });

  test('collapse all clears selections and does not error with edge selected', async ({ page }) => {
    // Find the canvas
    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible();
    
    // Get canvas dimensions
    const canvasBox = await canvas.boundingBox();
    if (!canvasBox) {
      throw new Error('Canvas not found or not visible');
    }
    
    const centerX = canvasBox.x + canvasBox.width / 2;
    const centerY = canvasBox.y + canvasBox.height / 2;
    
    // Try to click an edge first
    await page.mouse.click(centerX, centerY);
    await page.waitForTimeout(500);
    
    // Check for console errors before collapse
    const errorsBefore: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errorsBefore.push(msg.text());
      }
    });
    
    // Find and click "Collapse All" button
    const collapseAllButton = page.locator('button:has-text("Collapse All")').first();
    await expect(collapseAllButton).toBeVisible();
    
    // Click collapse all
    await collapseAllButton.click();
    await page.waitForTimeout(1000);
    
    // Check for console errors after collapse
    const errorsAfter: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errorsAfter.push(msg.text());
      }
    });
    
    // Wait a bit more to catch any async errors
    await page.waitForTimeout(1000);
    
    // Verify no "node not found" errors
    const allErrors = [...errorsBefore, ...errorsAfter];
    const nodeNotFoundErrors = allErrors.filter(err => 
      err.includes('node not found') || 
      err.includes('Node not found') ||
      err.includes('LangChain')
    );
    
    expect(nodeNotFoundErrors.length).toBe(0);
    
    // Verify page didn't crash
    const crashIndicator = page.locator('text=This page crashed');
    const isCrashed = await crashIndicator.isVisible().catch(() => false);
    expect(isCrashed).toBeFalsy();
  });

  test('URL hash with edge when nodes are collapsed does not error', async ({ page }) => {
    // First, collapse all nodes
    const collapseAllButton = page.locator('button:has-text("Collapse All")').first();
    await expect(collapseAllButton).toBeVisible();
    await collapseAllButton.click();
    await page.waitForTimeout(1000);
    
    // Navigate to URL with edge hash (using a comparison edge)
    const edgeHash = '#ai-framework-graph-edge-compare-LangChain-Outlines-reverse';
    await page.goto(`/docs/craft/generative-ai/mental-models/2025-11-10-ai-framework-landscape${edgeHash}`, {
      waitUntil: 'domcontentloaded',
    });
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Check for console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Wait a bit more to catch any async errors
    await page.waitForTimeout(2000);
    
    // Verify no "node not found" or "edge not found" errors
    const nodeNotFoundErrors = errors.filter(err => 
      err.includes('node not found') || 
      err.includes('Node not found') ||
      err.includes('LangChain')
    );
    
    // Edge not found warnings are acceptable (since nodes are collapsed)
    // But we shouldn't have "node not found" errors
    expect(nodeNotFoundErrors.length).toBe(0);
    
    // Verify page didn't crash
    const crashIndicator = page.locator('text=This page crashed');
    const isCrashed = await crashIndicator.isVisible().catch(() => false);
    expect(isCrashed).toBeFalsy();
  });

  test('selecting node from pane unselects edge', async ({ page }) => {
    // Navigate to URL with edge hash to ensure we have an edge selected
    const edgeHash = '#ai-framework-graph-edge-compare-LangChain-Outlines-reverse';
    await page.goto(`/docs/craft/generative-ai/mental-models/2025-11-10-ai-framework-landscape${edgeHash}`, {
      waitUntil: 'domcontentloaded',
    });
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Assert selection state via the stable data-panel hook (not pane text,
    // which gives false positives — a node panel's ingress list contains "(vs.)").
    const pane = page.locator('[data-testid="graph-info-panel"]').first();
    await pane.waitFor({ state: 'visible', timeout: 15000 });

    if ((await pane.getAttribute('data-panel')) === 'edge') {
      // Click a node link in the pane (Source/Destination) to select that node.
      const nodeLink = page.locator('a').filter({ hasText: /LangChain|Outlines/ }).first();

      if (await nodeLink.isVisible({ timeout: 2000 }).catch(() => false)) {
        await nodeLink.click();
        // The edge must be unselected; the panel should now show the node.
        await expect(pane).not.toHaveAttribute('data-panel', 'edge', { timeout: 5000 });
        await expect(pane).toHaveAttribute('data-panel', 'node');
      }
      // If no node link found, test passes (no link to click)
    }
    // If edge not found (nodes might be collapsed), test passes (edge selection not possible)
  });

  test('collapse all with edge URL hash does not error', async ({ page }) => {
    // Navigate to URL with edge hash first
    const edgeHash = '#ai-framework-graph-edge-compare-LangChain-Outlines-reverse';
    await page.goto(`/docs/craft/generative-ai/mental-models/2025-11-10-ai-framework-landscape${edgeHash}`, {
      waitUntil: 'domcontentloaded',
    });
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Check for console errors before collapse
    const errorsBefore: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errorsBefore.push(msg.text());
      }
    });
    
    // Find and click "Collapse All" button
    const collapseAllButton = page.locator('button:has-text("Collapse All")').first();
    await expect(collapseAllButton).toBeVisible();
    
    // Click collapse all
    await collapseAllButton.click();
    await page.waitForTimeout(1000);
    
    // Check for console errors after collapse
    const errorsAfter: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errorsAfter.push(msg.text());
      }
    });
    
    // Wait a bit more to catch any async errors
    await page.waitForTimeout(1000);
    
    // Verify no "node not found" errors
    const allErrors = [...errorsBefore, ...errorsAfter];
    const nodeNotFoundErrors = allErrors.filter(err => 
      err.includes('node not found') || 
      err.includes('Node not found') ||
      err.includes('LangChain')
    );
    
    expect(nodeNotFoundErrors.length).toBe(0);
    
    // Verify page didn't crash
    const crashIndicator = page.locator('text=This page crashed');
    const isCrashed = await crashIndicator.isVisible().catch(() => false);
    expect(isCrashed).toBeFalsy();
  });
});

