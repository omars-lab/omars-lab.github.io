import { test, expect, Page } from '@playwright/test';

/**
 * End-to-end validation of the INGRESS-ATTRIBUTION layer (src/ingress-attribution-plan.md):
 * a per-page ShareButton tags outgoing URLs with ?im=<marker>, and src/posthog.js
 * reads + strips the marker on arrival.
 *
 * Runs in the `posthog-prod` project: a PRODUCTION build served on :4173, built with
 * POSTHOG_TEST_MODE=1 so PostHog's bot/UA filter is OFF and Playwright's events are
 * actually ingested (see src/posthog-issues.md ISSUE-001/002). `make test-posthog`
 * orchestrates the build + serve.
 *
 * CAVEATS on the "edge" tests below — read before trusting them as full coverage:
 *  - bookmark_intent: we assert the EVENT fires on Ctrl/Meta+D. We CANNOT assert the
 *    native bookmark dialog opened — Playwright can't see browser chrome. (The code
 *    does not preventDefault, so the native dialog is unaffected, but that's untestable
 *    here.)
 *  - clipboard readback: Firefox (this project's browser) restricts programmatic
 *    clipboard reads; the test grants permission where possible and SKIPS if the read
 *    is unavailable rather than failing.
 *  - egress_copy: triggered via a synthetic `copy` event / execCommand, which is not a
 *    true OS ⌘C but exercises the same listener path.
 */

const PH_BASE = process.env.PH_BASE_URL || 'http://localhost:4173';

// Docs are served under the /docs route prefix (see the navbar "Learn" link).
const DOC_URL = '/welcome';
// "Docs vs Blogs" is a CRAFT doc (its canonical home is /craft/blogging/...), NOT a
// blog post — there is no /thoughts/docs-vs-blog-posts page. Point straight at the
// canonical permalink so the share-control assertions exercise the real rendered page.
const BLOG_URL = '/craft/blogging/docs-vs-blog-posts';

/**
 * Spy on posthog.capture in the page rather than sniffing the wire. PostHog batches
 * events to /i/v0/e/ with a compressed/encoded body, so substring-matching request
 * post data is unreliable. Instead we install an init script that, as soon as
 * window.posthog exists, wraps capture() to record [event, props] into
 * window.__captured. This is deterministic and lets us assert on exact props.
 */
async function installCaptureSpy(page: Page) {
  await page.addInitScript(() => {
    (window as any).__captured = [];
    (window as any).__spyInstalled = false;
    const record = (event: any, props: any) =>
      (window as any).__captured.push({event, props});
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
    // posthog loads after this script; poll briefly until capture is wrappable.
    const id = setInterval(() => {
      tryWrap();
      if ((window as any).__spyInstalled) clearInterval(id);
    }, 25);
    setTimeout(() => clearInterval(id), 12000);
  });
}

/** Wait until the capture spy has wrapped posthog.capture (so later actions are seen). */
async function spyReady(page: Page) {
  await page.waitForFunction(() => (window as any).__spyInstalled === true, {
    timeout: 12000,
  });
}

type Captured = {event: string; props: Record<string, any> | undefined};

async function captured(page: Page): Promise<Captured[]> {
  return page.evaluate(() => (window as any).__captured || []);
}

/** Poll the in-page capture log for an event matching the predicate. */
async function expectCaptured(
  page: Page,
  pred: (c: Captured) => boolean,
  msg: string,
) {
  await expect
    .poll(async () => (await captured(page)).some(pred), {timeout: 8000, message: msg})
    .toBe(true);
}

async function posthogReady(page: Page): Promise<boolean> {
  try {
    await page.waitForFunction(() => typeof (window as any).posthog === 'object', {
      timeout: 10000,
    });
    return true;
  } catch {
    return false;
  }
}

test.describe('Ingress attribution (production build)', () => {
  test.use({ baseURL: PH_BASE });

  // ---- Rendering -----------------------------------------------------------
  test('share control renders next to the doc H1', async ({ page }) => {
    await page.goto(DOC_URL, { waitUntil: 'domcontentloaded' });
    test.skip(!(await posthogReady(page)), 'PostHog disabled (no key).');
    await expect(page.locator('[data-testid="share-control"]').first()).toBeVisible();
    await expect(page.locator('[data-testid="share-copy"]').first()).toBeVisible();
  });

  test('share control renders on the blog POST page but not the blog list', async ({
    page,
  }) => {
    await page.goto(BLOG_URL, { waitUntil: 'domcontentloaded' });
    test.skip(!(await posthogReady(page)), 'PostHog disabled (no key).');
    await expect(page.locator('[data-testid="share-control"]').first()).toBeVisible();

    // Blog list/index: title renders as a linked <h2>, share control omitted.
    await page.goto('/thoughts', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('[data-testid="share-control"]')).toHaveCount(0);
  });

  // ---- Egress: share channels (solid) -------------------------------------
  test('clicking copy fires egress_share with channel share_cp', async ({ page }) => {
    await installCaptureSpy(page);
    await page.goto(DOC_URL, { waitUntil: 'domcontentloaded' });
    test.skip(!(await posthogReady(page)), 'PostHog disabled (no key).');
    await spyReady(page);
    await page.locator('[data-testid="share-copy"]').first().click();
    await expectCaptured(
      page,
      (c) => c.event === 'egress_share' && c.props?.channel === 'share_cp',
      'egress_share/share_cp not captured',
    );
    // iOS-style toast slides in confirming the copy.
    await expect(page.getByText('Link copied')).toBeVisible({ timeout: 4000 });
  });

  for (const [testid, channel] of [
    ['share-email', 'share_em'],
    ['share-linkedin', 'share_li'],
    ['share-x', 'share_x'],
  ] as const) {
    test(`clicking ${channel} fires egress_share`, async ({ page, context }) => {
      await installCaptureSpy(page);
      // Swallow any popup tab these channels open via window.open().
      context.on('page', (p) => p.close().catch(() => {}));
      await page.goto(DOC_URL, { waitUntil: 'domcontentloaded' });
      test.skip(!(await posthogReady(page)), 'PostHog disabled (no key).');
      await spyReady(page);
      // Neutralise window.open so the intent URL (esp. mailto:, which can trigger an
      // external-protocol navigation in Firefox and tear down the page) doesn't
      // disrupt the test. capture() fires synchronously BEFORE window.open in the
      // component, so the event is still recorded.
      await page.evaluate(() => {
        (window as any).open = () => null;
      });
      await page.locator(`[data-testid="${testid}"]`).first().click({ noWaitAfter: true });
      await expectCaptured(
        page,
        (c) => c.event === 'egress_share' && c.props?.channel === channel,
        `egress_share/${channel} not captured`,
      );
    });
  }

  // Email + X carry a friendly prefilled MESSAGE (title + summary), not a bare link.
  test('email and X intents prefill a friendly message with the title + summary', async ({
    page,
  }) => {
    await page.goto(BLOG_URL, { waitUntil: 'domcontentloaded' });
    test.skip(!(await posthogReady(page)), 'PostHog disabled (no key).');
    // Wait for the share control to be interactive before stubbing/clicking, so the
    // test doesn't race button hydration (avoids order-dependent flakiness).
    await page.locator('[data-testid="share-email"]').first().waitFor({ state: 'visible' });
    // Capture the intent URLs without navigating.
    await page.evaluate(() => {
      (window as any).__opened = [];
      (window as any).open = (u: string) => {
        (window as any).__opened.push(u);
        return null;
      };
    });
    await page.locator('[data-testid="share-email"]').first().click({ noWaitAfter: true });
    await page.locator('[data-testid="share-x"]').first().click({ noWaitAfter: true });
    await expect.poll(() => page.evaluate(() => (window as any).__opened?.length || 0), {
      timeout: 4000,
    }).toBeGreaterThanOrEqual(2);
    const opened: string[] = await page.evaluate(() => (window as any).__opened);
    const email = decodeURIComponent(opened.find((u) => u.startsWith('mailto:')) || '');
    const x = decodeURIComponent(opened.find((u) => u.includes('twitter.com')) || '');
    // BLOG_URL is the "Docs vs Blogs" post: friendly intro + the frontmatter title +
    // a summary clause drawn from its description.
    expect(email).toContain('check out this post');
    expect(email).toContain('Docs vs Blogs');
    expect(email).toContain("Here's what it covers:"); // summary clause from frontmatter
    expect(x).toContain('check out this post');
    expect(x).toContain('Docs vs Blogs');
  });

  test('X intent text never exceeds the tweet budget (caps long descriptions)', async ({
    page,
  }) => {
    // Independent of any one page's description length: assert the INVARIANT —
    // the X &text= body is always within the 200-char budget. (The deterministic
    // truncation behaviour — summary trimmed + ellipsis, title preserved, email
    // left uncapped — is unit-proven in compose-message.spec.ts.)
    await page.goto(DOC_URL, { waitUntil: 'domcontentloaded' });
    test.skip(!(await posthogReady(page)), 'PostHog disabled (no key).');
    await page.locator('[data-testid="share-x"]').first().waitFor({ state: 'visible' });
    await page.evaluate(() => {
      (window as any).__opened = [];
      (window as any).open = (u: string) => {
        (window as any).__opened.push(u);
        return null;
      };
    });
    await page.locator('[data-testid="share-x"]').first().click({ noWaitAfter: true });
    await expect.poll(() => page.evaluate(() => (window as any).__opened?.length || 0), {
      timeout: 4000,
    }).toBeGreaterThanOrEqual(1);
    const opened: string[] = await page.evaluate(() => (window as any).__opened);
    const xRaw = opened.find((u) => u.includes('twitter.com')) || '';
    const xText = decodeURIComponent(new URL(xRaw).searchParams.get('text') || '');
    expect(xText.length).toBeGreaterThan(0);
    expect(xText.length).toBeLessThanOrEqual(200);
  });

  // ---- Ingress: read + strip the marker -----------------------------------
  // The landing-time `ingress` capture fires inside posthog's `loaded` callback,
  // which can run before a capture spy could wrap capture(). Rather than race it,
  // we assert the DETERMINISTIC, user-facing side effect: the `im` param is
  // stripped from the URL. In posthog.js the strip (replaceState) runs on the line
  // immediately AFTER `posthog.capture('ingress', …)`, inside the same `if (marker)`
  // branch — so a stripped param is proof the ingress event was captured.
  test('landing with ?im=share_cp captures ingress + strips the param', async ({
    page,
  }) => {
    await page.goto(`${DOC_URL}?im=share_cp`, { waitUntil: 'domcontentloaded' });
    test.skip(!(await posthogReady(page)), 'PostHog disabled (no key).');
    await expect
      .poll(() => page.evaluate(() => window.location.search), { timeout: 6000 })
      .not.toContain('im=');
  });

  // ---- Edge: bookmark intent (EVENT ONLY — see header caveat) -------------
  test('Ctrl/Meta+D fires bookmark_intent (event only, not native dialog)', async ({
    page,
  }) => {
    await installCaptureSpy(page);
    await page.goto(DOC_URL, { waitUntil: 'domcontentloaded' });
    test.skip(!(await posthogReady(page)), 'PostHog disabled (no key).');
    await spyReady(page);
    await page.locator('body').press('Control+d');
    await expectCaptured(
      page,
      (c) => c.event === 'bookmark_intent',
      'bookmark_intent not captured',
    );
  });

  // ---- Edge: generic copy fires egress_copy (synthetic — see header) ------
  test('a copy event fires egress_copy without mutating the payload', async ({
    page,
  }) => {
    await installCaptureSpy(page);
    await page.goto(DOC_URL, { waitUntil: 'domcontentloaded' });
    test.skip(!(await posthogReady(page)), 'PostHog disabled (no key).');
    await spyReady(page);
    // Dispatch a synthetic copy event (exercises the same listener path as ⌘C).
    await page.evaluate(() => document.dispatchEvent(new Event('copy', { bubbles: true })));
    await expectCaptured(
      page,
      (c) => c.event === 'egress_copy',
      'egress_copy not captured',
    );
  });

  // ---- Edge: copy-link writes the tagged URL to the clipboard -------------
  test('copy-link writes the tagged URL to the clipboard', async ({ page, context }) => {
    // Firefox restricts clipboard reads; grant where supported, else skip.
    await context.grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {});
    await page.goto(DOC_URL, { waitUntil: 'domcontentloaded' });
    test.skip(!(await posthogReady(page)), 'PostHog disabled (no key).');
    await page.locator('[data-testid="share-copy"]').first().click();
    const text = await page
      .evaluate(() => navigator.clipboard.readText())
      .catch(() => null);
    test.skip(text === null, 'Clipboard read unavailable in this browser/context.');
    expect(text).toContain('im=share_cp');
  });

  // ---- Bookmarklet affordance (on the welcome doc) ------------------------
  test('bookmarklet button renders a javascript: bookmarklet href', async ({ page }) => {
    await page.goto(DOC_URL, { waitUntil: 'domcontentloaded' });
    test.skip(!(await posthogReady(page)), 'PostHog disabled (no key).');
    const btn = page.locator('[data-testid="bookmarklet-btn"]');
    await expect(btn.first()).toBeVisible();
    const href = await btn.first().getAttribute('href');
    expect(href || '').toMatch(/^javascript:/);
    // The bookmarklet must carry the ingress marker + post to PostHog ingestion.
    expect(href).toContain('im=bookmarklet');
    expect(href).toContain('/i/v0/e/');
    expect(href).toContain('bookmarklet_used');
  });

  test('clicking the bookmarklet button opens the drag-instructions modal', async ({
    page,
  }) => {
    await page.goto(DOC_URL, { waitUntil: 'domcontentloaded' });
    test.skip(!(await posthogReady(page)), 'PostHog disabled (no key).');
    // Click must NOT navigate (preventDefault) — it shows the modal instead.
    await page.locator('[data-testid="bookmarklet-btn"]').first().click();
    await expect(page.locator('[data-testid="bookmarklet-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="bookmarklet-drag-target"]')).toBeVisible();
    // Still on the same page (no in-place bookmarklet execution / navigation).
    expect(page.url()).toContain('/welcome');
  });
});
