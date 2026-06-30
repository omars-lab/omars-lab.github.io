import { test, expect, Browser, Page } from '@playwright/test';

/**
 * VISUAL REGRESSION (visual project, :3000, Chromium).
 *
 * Why this exists: a faint compositing SEAM in the homepage hero was visible only on a hi-DPI
 * (retina, devicePixelRatio=2) screen and only during the flash animation. Every functional e2e ran
 * at DPR=1 and asserted on the DOM, so none of them saw it — it took manual eyes to catch. This spec
 * is the automated guard: it screenshots the hero across a MATRIX of {pixel density × viewport ×
 * theme} and compares to committed baselines, so a retina-only / animation-frame artifact (a seam, a
 * flash white-out, an overflow, a stray line) fails the diff instead of shipping silently.
 *
 * BASELINES: committed next to this spec (visual.spec.ts-snapshots/). To (re)generate after an
 * intentional visual change, run:  npx playwright test --project=visual --update-snapshots
 *
 * The forced-flash frame is the key one: it pins the flash overlay ON (the moment the seam appeared)
 * so the artifact is captured deterministically, not left to animation timing.
 */

// The {density × viewport} matrix. DPR 2 is the one that mattered for the seam.
const MATRIX = [
  { name: 'desktop-1x', width: 1280, height: 860, dpr: 1 },
  { name: 'desktop-2x', width: 1280, height: 860, dpr: 2 }, // retina: catches the seam class
  { name: 'mobile-2x', width: 390, height: 780, dpr: 2 },
];

async function openHero(
  browser: Browser,
  variant: 'control' | 'test',
  m: (typeof MATRIX)[number],
  theme: 'light' | 'dark',
): Promise<Page> {
  const context = await browser.newContext({
    viewport: { width: m.width, height: m.height },
    deviceScaleFactor: m.dpr,
    colorScheme: theme,
    reducedMotion: 'reduce', // freeze animations so the screenshot is deterministic
  });
  const page = await context.newPage();
  await page.addInitScript((t) => {
    try {
      localStorage.setItem('theme', t);
    } catch {
      /* noop */
    }
  }, theme);
  // `load` (not `networkidle`): the dev server holds an HMR websocket open, so `networkidle` never
  // settles reliably (it times out the goto before the screenshot). `load` fires deterministically;
  // the fixed settle below covers the client-side hydration of the A/B variant.
  await page.goto(`/?ab-homepage-hero-anim=${variant}`, { waitUntil: 'load' });
  await page.evaluate((t) => document.documentElement.setAttribute('data-theme', t), theme);
  // Let the hero resolve + settle (the A/B variant hydrates client-side).
  await page.waitForTimeout(1200);
  return page;
}

// Force the flash overlay ON (the hashed `flashOn` class) so the mid-flash frame is deterministic.
async function forceFlashOn(page: Page) {
  await page.evaluate(() => {
    const arch = document.querySelector('[class*="flashArchWrap"] > div');
    const cls = [...document.styleSheets]
      .flatMap((s) => {
        try {
          return [...s.cssRules];
        } catch {
          return [];
        }
      })
      .map((r) => (r as CSSStyleRule).selectorText || '')
      .join(' ')
      .match(/\bflashOn_[\w-]+/);
    if (arch && cls) arch.classList.add(cls[0]);
  });
  await page.waitForTimeout(150);
}

test.describe('Homepage hero — visual regression', () => {
  for (const m of MATRIX) {
    for (const theme of ['light', 'dark'] as const) {
      test(`control strip · ${m.name} · ${theme}`, async ({ browser }) => {
        const page = await openHero(browser, 'control', m, theme);
        await expect(page.locator('header').first()).toHaveScreenshot(
          `hero-control-${m.name}-${theme}.png`,
        );
        await page.context().close();
      });

      test(`flash gate (settled) · ${m.name} · ${theme}`, async ({ browser }) => {
        const page = await openHero(browser, 'test', m, theme);
        await expect(page.locator('header').first()).toHaveScreenshot(
          `hero-flash-${m.name}-${theme}.png`,
        );
        await page.context().close();
      });

      test(`flash gate (mid-flash) · ${m.name} · ${theme}`, async ({ browser }) => {
        // The mid-flash frame is where the retina compositing seam appeared. Pin the flash ON and
        // snapshot, so any seam/white-out reappearing fails the diff.
        const page = await openHero(browser, 'test', m, theme);
        await forceFlashOn(page);
        await expect(page.locator('header').first()).toHaveScreenshot(
          `hero-flash-peak-${m.name}-${theme}.png`,
        );
        await page.context().close();
      });

      // NOTE: baselines for variant_c (studio) + variant_d (boutique) land once their look settles
      // (task #119). The earlier train-station variant + its hero-train-* baselines were removed.
    }
  }
});
