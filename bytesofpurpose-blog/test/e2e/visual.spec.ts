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

/*
 * PICKETS (variant_c + scroll=pickets) visual baselines. The picket wave is scroll-driven, so we FREEZE
 * a deterministic frame with ?hero-progress=P (localhost seam: pins raw engine progress, bypassing
 * scroll). Unlike the flash baselines, these do NOT use reducedMotion:'reduce' — that zeroes the picket
 * strips, so the wave wouldn't show. A frozen ?hero-progress frame is already static, so it is
 * deterministic without reduced motion. These catch a LOOK regression a numeric test can't: e.g. the
 * whole door washing to white strips, the reveal clipping wrong, or the strips misaligning.
 */
// p values live in the PICKETS engine mapping (PICKET_TRANSITION_FRACTION 0.7, 8 stops):
// p = (stop + within)/8, crossing = within in [0.3, 1], t = (within - 0.3)/0.7. If the pickets
// transition fraction changes, RE-DERIVE these three p values and regenerate the baselines.
const PICKET_STATES = [
  { name: 'settled', p: '0.144', note: 'scene 0 fully settled (stop 1, within 0.15) — NO wave' },
  { name: 'peak', p: '0.081', note: 'the wave at its peak (t=0.5) — the door lit by the strip bell' },
  { name: 'reveal', p: '0.101', note: 'past the peak (t≈0.73) — the new scene wiping in under dimming strips' },
];

async function openPickets(
  browser: Browser,
  p: string,
  m: (typeof MATRIX)[number],
  theme: 'light' | 'dark',
): Promise<Page> {
  const context = await browser.newContext({
    viewport: { width: m.width, height: m.height },
    deviceScaleFactor: m.dpr,
    colorScheme: theme,
    // NOT reduced: the picket strips are gated off under reduced motion. The ?hero-progress freeze makes
    // the frame static regardless, so the screenshot is still deterministic.
    reducedMotion: 'no-preference',
  });
  const page = await context.newPage();
  await page.addInitScript((t) => {
    try {
      localStorage.setItem('theme', t);
    } catch {
      /* noop */
    }
  }, theme);
  await page.goto(
    `/?ab-homepage-hero-anim=variant_c&ab-homepage-hero-scroll=pickets&hero-progress=${p}`,
    { waitUntil: 'load' },
  );
  await page.evaluate((t) => document.documentElement.setAttribute('data-theme', t), theme);
  await page.waitForSelector('[data-hero-root]', { timeout: 10000 });
  await page.waitForTimeout(1400); // hydrate + the one-time board settle roll
  return page;
}

test.describe('Homepage hero — pickets visual regression', () => {
  // Desktop only (the wave is the same shape at every DPR; mobile is door-only + covered by the studio
  // baselines when those land). Light + dark to catch theme-specific strip/scene blending.
  //
  // Screenshot the STICKY HERO, not the whole header: the pickets spacer makes the header ~9000px of
  // mostly-empty runway, and on an image that big the shared maxDiffPixelRatio dilutes a real hero
  // change (e.g. the whole BOARD text) below the tolerance — a stale baseline silently keeps passing.
  // The stick is the ~viewport-sized pinned house, so the ratio actually bites there.
  const m = MATRIX[0]; // desktop-1x
  for (const theme of ['light', 'dark'] as const) {
    for (const s of PICKET_STATES) {
      test(`pickets ${s.name} · ${m.name} · ${theme}`, async ({ browser }) => {
        const page = await openPickets(browser, s.p, m, theme);
        await expect(page.locator('[class*="parallaxStick"]').first()).toHaveScreenshot(
          `hero-pickets-${s.name}-${m.name}-${theme}.png`,
        );
        await page.context().close();
      });
    }
  }
});
