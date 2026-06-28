import { test, expect, Page } from '@playwright/test';

/**
 * Homepage film-strip chooser (dev project, :3000).
 *
 * The hero chooser is a seamless, auto-cycling film strip of destination cards (Craft / Journey /
 * Ideas / Mindset / Initiatives / Questions / Designs). It is data-driven (a CHOOSER_CARDS array
 * in src/pages/index.tsx) and the track renders the card list TWICE so the CSS marquee can loop
 * with no visible seam.
 *
 * What this proves:
 *   1. The strip renders, with every destination card present and pointing at the right route +
 *      image.
 *   2. The seamless-loop duplicate exists (each card link appears twice) but is a11y/keyboard
 *      hidden, so a screen reader / tab order sees each destination ONCE (no double nav).
 *   3. The auto-scroll PAUSES on hover (so a moving card becomes a stable, clickable target).
 *   4. The reduced-motion (and by the same rule, touch) fallback turns the auto-scroll OFF and
 *      makes the strip a user-driven, scroll-snapping swipe reel (no hover-to-pause needed, which
 *      a touch device can't do).
 */

// The destinations the strip must surface, in order. Keep in lockstep with CHOOSER_CARDS in
// src/pages/index.tsx (this test is the guard that they don't silently drift).
const EXPECTED_CARDS: Array<{ href: string; img: string }> = [
  { href: '/craft', img: '/img/cards/craft.png' },
  { href: '/journey', img: '/img/cards/self.png' },
  { href: '/thoughts', img: '/img/cards/thinking.png' },
  { href: '/mindset', img: '/img/cards/mindset.png' },
  { href: '/initiatives', img: '/img/cards/initiatives.png' },
  { href: '/questions', img: '/img/cards/questions.png' },
  { href: '/designs', img: '/img/cards/designs.png' },
];

async function loadHome(page: Page) {
  const response = await page.goto('/', { waitUntil: 'domcontentloaded' });
  if (!response || response.status() !== 200) {
    throw new Error(`Homepage failed to load. Status: ${response?.status()}`);
  }
  await page.waitForLoadState('networkidle');
  const crashed = await page.locator('text=This page crashed').isVisible().catch(() => false);
  expect(crashed, 'homepage crashed (React error boundary)').toBe(false);
}

// All card links in the strip (both the real set and the aria-hidden duplicate set).
function allCardLinks(page: Page) {
  return page.locator('header a[class*="chooserCard"]');
}
// Only the "real" (non-duplicate) cards: the ones a screen reader / keyboard sees.
function realCardLinks(page: Page) {
  return page.locator('header a[class*="chooserCard"]:not([aria-hidden="true"])');
}

test.describe('Homepage film-strip chooser', () => {
  test('renders the strip with every destination card (correct route + image)', async ({ page }) => {
    await loadHome(page);

    const realCards = realCardLinks(page);
    await expect(realCards).toHaveCount(EXPECTED_CARDS.length);

    // Each expected destination is present once (in order) with its image.
    for (let i = 0; i < EXPECTED_CARDS.length; i++) {
      const { href, img } = EXPECTED_CARDS[i];
      const card = realCards.nth(i);
      await expect(card, `card ${i} should link to ${href}`).toHaveAttribute('href', href);
      await expect(
        card.locator(`img[src*="${img}"]`),
        `card ${i} should show ${img}`,
      ).toHaveCount(1);
    }
  });

  test('duplicates the set for the seamless loop, but hides the copy from a11y + keyboard', async ({
    page,
  }) => {
    await loadHome(page);

    // The track renders the list twice: total card links = 2 × the destinations.
    await expect(allCardLinks(page)).toHaveCount(EXPECTED_CARDS.length * 2);

    // The duplicate half is aria-hidden + removed from tab order, so each destination is announced
    // / focusable exactly once.
    const hidden = page.locator('header a[class*="chooserCard"][aria-hidden="true"]');
    await expect(hidden).toHaveCount(EXPECTED_CARDS.length);
    for (let i = 0; i < EXPECTED_CARDS.length; i++) {
      await expect(hidden.nth(i)).toHaveAttribute('tabindex', '-1');
    }
  });

  test('auto-scrolls, and pauses on hover (a moving card becomes a stable target)', async ({
    page,
  }) => {
    await loadHome(page);
    const track = page.locator('[class*="chooserTrack"]').first();
    await expect(track).toBeVisible();

    // The marquee animation is running by default.
    const playState = () =>
      track.evaluate((el) => getComputedStyle(el).animationPlayState);
    expect(await playState(), 'strip should auto-scroll by default').toBe('running');

    // Hovering the viewport pauses it.
    await page.locator('[class*="chooserViewport"]').first().hover();
    await expect
      .poll(playState, { message: 'strip should pause on hover' })
      .toBe('paused');
  });

  test('reduced-motion (and touch): no auto-scroll, becomes a user-driven swipe reel', async ({
    browser,
  }) => {
    // Emulate prefers-reduced-motion (the same CSS rule also fires on hover:none / pointer:coarse,
    // i.e. touch devices). The auto-scroll must be OFF and the strip an overflow-scroll snap reel.
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await context.newPage();
    try {
      await loadHome(page);
      const viewport = page.locator('[class*="chooserViewport"]').first();
      const track = page.locator('[class*="chooserTrack"]').first();

      expect(
        await track.evaluate((el) => getComputedStyle(el).animationName),
        'reduced-motion: the marquee animation must be off',
      ).toBe('none');
      expect(
        await viewport.evaluate((el) => getComputedStyle(el).overflowX),
        'reduced-motion: the strip must be a horizontally-scrollable reel',
      ).toBe('auto');
      // Snap reel: cards snap into place as the user scrolls.
      const snapType = await viewport.evaluate((el) => getComputedStyle(el).scrollSnapType);
      expect(snapType, 'reduced-motion: the reel should scroll-snap').toContain('x');

      // Every destination is still reachable (present in the DOM) in the reel.
      await expect(realCardLinks(page)).toHaveCount(EXPECTED_CARDS.length);
    } finally {
      await context.close();
    }
  });
});

/**
 * The hero animation is a multi-arm test (EXPERIMENTS['homepage-hero-anim']): control = the scrolling
 * strip (covered above), test/flash = the camera-flash rotator (covered here), plus the in-progress
 * variant_c (studio) + variant_d (boutique). On localhost the variant can be forced via the
 * ?ab-<key>=<variant> URL override (src/experiments.ts) using the variant KEY, so we can drive each
 * arm deterministically without PostHog.
 */
test.describe('Homepage hero A/B: camera-flash variant', () => {
  test('control (default / forced) renders the scrolling strip, not the gate', async ({ page }) => {
    await page.goto('/?ab-homepage-hero-anim=control', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[class*="chooserTrack"]')).toHaveCount(1);
    await expect(page.locator('[class*="flashGate"]')).toHaveCount(0);
  });

  test('test variant renders the camera-flash GATE, one arch scene visible at a time', async ({ page }) => {
    await page.goto('/?ab-homepage-hero-anim=test', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');

    // The flash gate replaces the scrolling strip. The whole portal is ONE link (the gate).
    const gate = page.locator('a[class*="flashGate"]');
    await expect(gate).toHaveCount(1);
    await expect(page.locator('[class*="chooserTrack"]')).toHaveCount(0);

    // All 7 arch scenes are stacked in the DOM, but exactly ONE is the active/visible one.
    await expect(page.locator('[class*="flashArchImg"]')).toHaveCount(EXPECTED_CARDS.length);
    await expect(page.locator('[class*="flashArchImgActive"]')).toHaveCount(1);

    // The departure board (the persistent Vestaboard) renders once.
    await expect(page.locator('[class*="flashBoard"]')).toHaveCount(1);
  });

  test('flash variant advances on → and goes back on ← (arrow-key nav)', async ({ page }) => {
    await page.goto('/?ab-homepage-hero-anim=test', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');

    // The active arch image identifies the current destination. We drive the rotation with the arrow
    // keys (a global keydown listener) rather than waiting out the ~12s auto-interval: it's the same
    // step() path and far faster/deterministic. The keys work without focusing the gate.
    const activeSrc = () =>
      page.locator('[class*="flashArchImgActive"]').getAttribute('src');
    const first = await activeSrc();
    expect(first, 'an active arch scene should be showing').toBeTruthy();

    await page.keyboard.press('ArrowRight');
    await expect
      .poll(activeSrc, { timeout: 4000, message: '→ should advance to the next scene' })
      .not.toBe(first);

    await page.keyboard.press('ArrowLeft');
    await expect
      .poll(activeSrc, { timeout: 4000, message: '← should return to the previous scene' })
      .toBe(first);
  });
});

// NOTE: variant D (boutique) full assertions land with the 4-arm test update (task #119) once its
// markup settles. The earlier train-station variant was replaced by studio/boutique, so its tests +
// baselines were removed. Variant C (the studio HOUSE) + its scroll-driven parallax are covered below.

/*
 * The SCROLL-DRIVEN PARALLAX hero (variant C house + the homepage-hero-scroll experiment). As you
 * scroll, the central door transforms into each scene, the board reflips, and the matching top-navbar
 * item highlights. This is hard to assert against raw scroll geometry, so the engine exposes a TEST
 * SEAM: `?hero-scene=N` forces a SPECIFIC scene (localhost-only, registered in src/lib/url-params.ts),
 * and the hero root carries `data-active-scene` / `data-active-dest`. We use the seam for deterministic
 * per-scene assertions, PLUS one real-scroll test that the active scene actually advances on scroll.
 */
test.describe('Homepage hero: scroll-driven parallax (variant C)', () => {
  const SCROLL_MODELS = ['pin', 'inplace', 'horizontal'] as const;
  // scene index → its destination + the navbar label that should light up (matches CHOOSER_CARDS)
  const SCENE_NAV: Array<{ dest: string; nav: RegExp }> = [
    { dest: '/craft', nav: /Craft/ },
    { dest: '/journey', nav: /Journey/ },
    { dest: '/thoughts', nav: /Thoughts/ },
    { dest: '/mindset', nav: /Mindset/ },
    { dest: '/initiatives', nav: /Initiatives/ },
    { dest: '/questions', nav: /Questions/ },
    { dest: '/designs', nav: /Designs/ },
  ];

  const heroUrl = (model: string, scene?: number) =>
    `/?ab-homepage-hero-anim=variant_c&ab-homepage-hero-scroll=${model}` +
    (scene == null ? '' : `&hero-scene=${scene}`);

  for (const model of SCROLL_MODELS) {
    test(`[${model}] renders the house hero (one click-through gate)`, async ({ page }) => {
      await page.goto(heroUrl(model), { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle');
      const gate = page.locator(`a[data-hero-root][data-scroll-model="${model}"]`);
      await expect(gate).toHaveCount(1);
      // the whole house is ONE link
      await expect(gate).toHaveAttribute('href', /\/(craft|journey|thoughts|mindset|initiatives|questions|designs)/);
    });

    test(`[${model}] ?hero-scene=N forces the scene → door dest + navbar highlight match`, async ({ page }) => {
      // Check a few representative scenes deterministically (no scrolling needed).
      for (const i of [0, 2, 5, 6]) {
        await page.goto(heroUrl(model, i), { waitUntil: 'domcontentloaded' });
        await page.waitForLoadState('networkidle');
        const root = page.locator('[data-hero-root]');
        await expect(root, `scene ${i} active`).toHaveAttribute('data-active-scene', String(i));
        await expect(root, `scene ${i} destination`).toHaveAttribute('data-active-dest', SCENE_NAV[i].dest);
        // the matching top-navbar item is lit (we own the highlight; homepage route is '/')
        const lit = page.locator('[class*="navbarSceneActive"]');
        await expect(lit, `navbar lit for scene ${i}`).toHaveCount(1);
        await expect(lit).toHaveText(SCENE_NAV[i].nav);
      }
    });
  }

  test('[pin] real scroll ADVANCES the active scene, then RELEASES (page reachable below)', async ({ page }) => {
    await page.goto(heroUrl('pin'), { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    const root = page.locator('[data-hero-root]');
    const sceneAt = () => root.getAttribute('data-active-scene');
    const start = await sceneAt();

    // scroll a few scene-bands deep; the active scene must change (scroll DECIDES the scene)
    await page.evaluate(() => window.scrollTo(0, window.innerHeight * 2.4));
    await expect
      .poll(sceneAt, { timeout: 4000, message: 'scrolling should advance the active scene' })
      .not.toBe(start);

    // RELEASE: scrolling to the very bottom must reach the page content below the hero (no scroll trap)
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    const reachedBottom = await page.evaluate(() => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      return Math.abs(window.scrollY - max) < 4;
    });
    expect(reachedBottom, 'pin model must release so the page below is reachable').toBe(true);
  });
});
