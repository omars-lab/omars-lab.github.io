import {test, expect, type Page} from '@playwright/test';

/**
 * Navbar priority+ overflow (dev project, :3000).
 *
 * The left navbar items stay on ONE line; when they don't all fit, the RIGHTMOST fold into a
 * "More ▾" dropdown (src/theme/Navbar/Content + NavbarItemsOverflow). Leftmost items keep their
 * inline priority. Below the mobile breakpoint (<=996px) the default hamburger takes over and the
 * overflow apparatus is inert. This spec locks that contract across viewport widths.
 *
 * The fold is a CLIENT enhancement (measure-on-mount + ResizeObserver), so we set the viewport,
 * load, and poll until the layout settles.
 */

const OVERFLOW_ROW = '[class*="overflowRow"]';

// The inline (non-"More") left links currently rendered on one line.
async function inlineLabels(page: Page): Promise<string[]> {
  return page.$$eval(`${OVERFLOW_ROW} .navbar__link`, (els) =>
    els
      .map((e) => (e.textContent || '').trim())
      .filter((t) => t && !t.startsWith('More')),
  );
}

// The "More" trigger (a dropdown navbar link labelled "More"), or null.
function moreTrigger(page: Page) {
  return page.locator(`${OVERFLOW_ROW} .navbar__link`, {hasText: /^More/}).first();
}

test.describe('Navbar priority+ overflow', () => {
  test('WIDE (1600px): everything fits inline, no "More" trigger', async ({page}) => {
    await page.setViewportSize({width: 1600, height: 800});
    await page.goto('/', {waitUntil: 'domcontentloaded'});
    await page.waitForLoadState('networkidle');

    // All primary destinations are inline; no overflow menu.
    await expect(moreTrigger(page)).toHaveCount(0);
    const inline = await inlineLabels(page);
    expect(inline).toContain('💻 Craft');
    expect(inline).toContain('❤️ Support'); // the rightmost item is inline when there's room
    // Single line: the row is one item tall (not wrapped).
    const h = await page.locator(OVERFLOW_ROW).evaluate((el) => el.getBoundingClientRect().height);
    expect(h).toBeLessThan(60);
  });

  test('MEDIUM (1100px): folds the rightmost into "More", keeps leftmost inline, single line', async ({
    page,
  }) => {
    await page.setViewportSize({width: 1100, height: 800});
    await page.goto('/', {waitUntil: 'domcontentloaded'});
    await page.waitForLoadState('networkidle');

    // The overflow trigger appears...
    await expect(moreTrigger(page)).toBeVisible({timeout: 10000});

    // ...the LEFTMOST item stays inline...
    const inline = await inlineLabels(page);
    expect(inline).toContain('💻 Craft');

    // ...and a RIGHTMOST item (Support) is NOT inline; it lives in the More menu (in order).
    expect(inline).not.toContain('❤️ Support');
    const menuItems = await moreTrigger(page)
      .locator('xpath=ancestor::*[contains(@class,"dropdown")]')
      .locator('.dropdown__menu a')
      .allTextContents();
    const menu = menuItems.map((t) => t.trim());
    expect(menu).toContain('❤️ Support');
    // Overflow order is preserved: Support comes after Vote/Todos in the menu.
    expect(menu.indexOf('❤️ Support')).toBeGreaterThan(menu.indexOf('🗳️ Vote'));

    // The bar stays on ONE line (the whole point: no wrap, no hamburger).
    const h = await page.locator(OVERFLOW_ROW).evaluate((el) => el.getBoundingClientRect().height);
    expect(h).toBeLessThan(60);

    // Nothing overflows the viewport horizontally.
    const overflowsX = await page.evaluate(() => {
      const inner = document.querySelector('.navbar__inner') as HTMLElement | null;
      return inner ? inner.scrollWidth - inner.clientWidth : 0;
    });
    expect(overflowsX).toBeLessThanOrEqual(1);
  });

  test('MOBILE (390px): the hamburger takes over, no "More" overflow trigger', async ({page}) => {
    await page.setViewportSize({width: 390, height: 800});
    await page.goto('/', {waitUntil: 'domcontentloaded'});
    await page.waitForLoadState('networkidle');

    // Below 996px the default mobile sidebar toggle (hamburger) is shown...
    await expect(page.locator('.navbar__toggle')).toBeVisible();
    // ...and the priority+ overflow apparatus does NOT add a "More" trigger (the inline items are
    // display:none here; the mobile sidebar holds the nav instead).
    await expect(moreTrigger(page)).toHaveCount(0);
  });
});
