import { test, expect, Page } from '@playwright/test';

/**
 * Proof that the /vote page's Vote button fires the `idea_voted` PostHog event
 * with the locked properties (idea_slug, idea_title, type, page_path), and that
 * a vote persists across reload (localStorage dedup).
 *
 * Runs in the `posthog-prod` project: a PRODUCTION build served on :4173, built
 * with POSTHOG_TEST_MODE=1 so PostHog's bot/UA filter is OFF and the synthetic
 * click's event is actually captured. Mirrors the capture-spy approach used in
 * ingress-attribution.spec.ts: wrap posthog.capture() in-page and assert on the
 * recorded [event, props] rather than sniffing the batched wire payload.
 */

const VOTE_URL = '/vote';

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

test.describe('Vote on Post Ideas page', () => {
  test('renders the two seed idea cards', async ({ page }) => {
    await page.goto(VOTE_URL);
    await expect(page.getByText('AI taught me how to review code')).toBeVisible();
    await expect(page.getByText('AI taught me how to manage')).toBeVisible();
  });

  test('clicking Vote fires idea_voted with the locked props', async ({ page }) => {
    await installCaptureSpy(page);
    await page.goto(VOTE_URL);
    await spyReady(page);

    // Click the first card's Vote button.
    const firstVote = page.getByRole('button', { name: /Vote/ }).first();
    await firstVote.click();

    await expect
      .poll(async () => (await captured(page)).some((c) => c.event === 'idea_voted'), {
        timeout: 8000,
      })
      .toBe(true);

    const events = (await captured(page)).filter((c) => c.event === 'idea_voted');
    expect(events.length).toBeGreaterThanOrEqual(1);

    const props = events[0].props || {};
    expect(props).toHaveProperty('idea_slug');
    expect(props).toHaveProperty('idea_title');
    expect(props).toHaveProperty('type', 'post');
    expect(props.page_path).toBe('/vote');
    // idea_slug must be one of the two seeds (clean frontmatter slugs).
    expect([
      'ai-taught-me-how-to-review-code',
      'ai-taught-me-how-to-manage',
    ]).toContain(props.idea_slug);
  });

  test('a vote persists across reload (localStorage dedup)', async ({ page }) => {
    await page.goto(VOTE_URL);

    const firstVote = page.getByRole('button', { name: /Vote/ }).first();
    await expect(firstVote).toContainText('Vote');
    await firstVote.click();
    await expect(firstVote).toContainText('Voted');
    await expect(firstVote).toBeDisabled();

    // Reload — the button must come back as "Voted" (read from localStorage),
    // not re-enabled, so the same device can't trivially re-vote.
    await page.reload();
    const afterReload = page.getByRole('button', { name: /Voted/ }).first();
    await expect(afterReload).toBeVisible();
    await expect(afterReload).toBeDisabled();
  });
});
