import { test, expect, Page } from '@playwright/test';

/**
 * Proof for the dedicated /support page (replaces the standalone navbar coffee
 * button). Asserts: the page renders the headshot + the support channels
 * (Shopify / GitHub / LinkedIn) + the Buy-Me-a-Coffee card; clicking the coffee
 * CTA fires 'support button clicked' (surface: support-page) and clicking a
 * channel fires 'support channel clicked'. The Shopify card renders because
 * SHOPIFY_STORE_URL is a real link (it is omitted only while the '#' placeholder
 * is in effect).
 *
 * Runs in the posthog-prod project (POSTHOG_TEST_MODE=1 prod build on :4173).
 * Uses the same in-page capture spy as ingress-attribution / vote specs.
 */

const SUPPORT_URL = '/support';

async function installCaptureSpy(page: Page) {
  await page.addInitScript(() => {
    (window as any).__captured = [];
    (window as any).__spyInstalled = false;
    const record = (event: any, props: any) =>
      (window as any).__captured.push({ event, props });
    const tryWrap = () => {
      const ph = (window as any).posthog;
      if (!(window as any).__spyInstalled && ph && typeof ph.capture === 'function') {
        const orig = ph.capture.bind(ph);
        ph.capture = (event: any, props: any, ...rest: any[]) => {
          record(event, props);
          return orig(event, props, ...rest);
        };
        (window as any).__spyInstalled = true;
      }
    };
    const id = setInterval(() => {
      tryWrap();
      if ((window as any).__spyInstalled) clearInterval(id);
    }, 25);
    setTimeout(() => clearInterval(id), 12000);
  });
}

async function spyReady(page: Page) {
  await page.waitForFunction(() => (window as any).__spyInstalled === true, {
    timeout: 12000,
  });
}

type Captured = { event: string; props: Record<string, any> | undefined };

async function captured(page: Page): Promise<Captured[]> {
  return page.evaluate(() => (window as any).__captured || []);
}

test.describe('Support page', () => {
  test('renders headshot, channels, and coffee CTA', async ({ page }) => {
    await page.goto(SUPPORT_URL);
    await expect(page.locator('img[alt*="Omar"]')).toBeVisible();
    // The support channels render (presence, not in-viewport visibility —
    // a card can sit below the fold at the default viewport).
    expect(await page.getByText('Check out my Shopify store').count()).toBeGreaterThan(0);
    expect(await page.getByText('Follow me on GitHub').count()).toBeGreaterThan(0);
    expect(await page.getByText('Connect on LinkedIn').count()).toBeGreaterThan(0);
    // The coffee CTA scrolls into view and is visible.
    const coffee = page.getByTestId('support-coffee-button');
    await coffee.scrollIntoViewIfNeeded();
    await expect(coffee).toBeVisible();
  });

  test('coffee CTA fires "support button clicked" with surface=support-page', async ({
    page,
  }) => {
    await installCaptureSpy(page);
    await page.goto(SUPPORT_URL);
    await spyReady(page);

    // Don't actually navigate away (target=_blank opens a tab); just assert the
    // capture. Click via JS to avoid the popup.
    await page.getByTestId('support-coffee-button').click({ modifiers: ['Meta'] }).catch(() => {});
    // Fallback: dispatch click directly if the modifier-click didn't register.
    await page.evaluate(() => {
      const el = document.querySelector('[data-testid="support-coffee-button"]') as HTMLElement | null;
      el?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    await expect
      .poll(async () => (await captured(page)).some((c) => c.event === 'support button clicked'), {
        timeout: 8000,
      })
      .toBe(true);

    const ev = (await captured(page)).find((c) => c.event === 'support button clicked');
    expect(ev?.props?.surface).toBe('support-page');
  });

  test('channel click fires "support channel clicked"', async ({ page }) => {
    await installCaptureSpy(page);
    await page.goto(SUPPORT_URL);
    await spyReady(page);

    // GitHub card — dispatch click without following the external link.
    await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('a'));
      const gh = cards.find((a) => /Follow me on GitHub/.test(a.textContent || ''));
      gh?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    await expect
      .poll(async () => (await captured(page)).some((c) => c.event === 'support channel clicked'), {
        timeout: 8000,
      })
      .toBe(true);

    const ev = (await captured(page)).find((c) => c.event === 'support channel clicked');
    expect(ev?.props?.channel).toBe('github');
  });
});
