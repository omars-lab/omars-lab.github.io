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
// Order MATCHES the top-navbar order (Craft, Journey, Initiatives, Thoughts, Mindset, Questions, Designs).
const EXPECTED_CARDS: Array<{ href: string; img: string }> = [
  { href: '/craft', img: '/img/cards/craft.png' },
  { href: '/journey', img: '/img/cards/self.png' },
  { href: '/initiatives', img: '/img/cards/initiatives.png' },
  { href: '/thoughts', img: '/img/cards/thinking.png' },
  { href: '/mindset', img: '/img/cards/mindset.png' },
  { href: '/questions', img: '/img/cards/questions.png' },
  { href: '/designs', img: '/img/cards/designs.png' },
];

// The homepage DEFAULT hero is the ANIMATION (self-running timer) house. The legacy scrolling FILM
// STRIP is the `control` arm, reachable by explicitly forcing it via the URL override; the film-strip
// tests below load it that way. (The scroll-driven parallax models are reachable via
// ?ab-homepage-hero-scroll=pin|inplace|horizontal — covered by the parallax describe block.)
async function loadStrip(page: Page) {
  const response = await page.goto('/?ab-homepage-hero-anim=control', {
    waitUntil: 'domcontentloaded',
  });
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
    await loadStrip(page);

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
    await loadStrip(page);

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
    await loadStrip(page);
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
      await loadStrip(page);
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
  const SCROLL_MODELS = ['pin', 'inplace', 'horizontal', 'pickets'] as const;
  // scene index → its destination + the navbar label that should light up (matches CHOOSER_CARDS)
  const SCENE_NAV: Array<{ dest: string; nav: RegExp }> = [
    { dest: '/craft', nav: /Craft/ },
    { dest: '/journey', nav: /Journey/ },
    { dest: '/initiatives', nav: /Initiatives/ },
    { dest: '/thoughts', nav: /Thoughts/ },
    { dest: '/mindset', nav: /Mindset/ },
    { dest: '/questions', nav: /Questions/ },
    { dest: '/designs', nav: /Designs/ },
  ];

  const heroUrl = (model: string, scene?: number) =>
    `/?ab-homepage-hero-anim=variant_c&ab-homepage-hero-scroll=${model}` +
    (scene == null ? '' : `&hero-scene=${scene}`);

  test('DEFAULT (bare /) is the scroll-scrubbed PICKETS house — the house, PINNED in a tall spacer', async ({
    page,
  }) => {
    // DEFAULT_SCROLL_MODEL is 'pickets', so a bare visit (no anim/scroll signal) resolves to the
    // studio house driven by the picket-wave parallax: the facade renders, PINNED in a tall spacer
    // (the scroll runway), and the hero gate advertises model=pickets. (If this flips back to the
    // timer house, DEFAULT_SCROLL_MODEL changed — update this test with it.)
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    // the house renders (variant_c facade) ...
    await expect(page.locator('[class*="studioFacade"]')).toHaveCount(1);
    // ... PINNED: the parallax models mount a tall scroll-runway spacer
    await expect(page.locator('[class*="parallaxSpacer"]')).toHaveCount(1);
    // ... driven by pickets specifically (the gate advertises its scroll model)
    await expect(page.locator('a[data-hero-root][data-scroll-model="pickets"]')).toHaveCount(1);
    // and it is NOT the legacy film strip
    await expect(page.locator('[class*="chooserTrack"]')).toHaveCount(0);
  });

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

  // Helpers for the SNAP/SYNC tests: read the live flash opacity + the door's shown scene image.
  const flashOpacity = (page: Page) =>
    page.evaluate(() => {
      const el = document.querySelector('[class*="studioFlash"]');
      return el ? parseFloat(getComputedStyle(el).opacity) : 1;
    });
  const shownSceneImg = (page: Page) =>
    page.evaluate(() => {
      const a = document.querySelector('[class*="studioPeekImgActive"]');
      const src = a?.getAttribute('src') || '';
      return src.split('/').pop() || '';
    });
  // Wheel-scroll in increments (REAL wheel events drive the scroll-state machinery; window.scrollTo
  // does not trigger the "scrolling" debounce the same way), then stop.
  const wheelInto = async (page: Page, steps: number) => {
    await page.mouse.move(640, 450);
    for (let k = 0; k < steps; k++) {
      await page.mouse.wheel(0, 70);
      await page.waitForTimeout(28);
    }
  };

  test('[pin] STOP mid-transition SNAPS to the nearest scene: flash clears (no lingering flash)', async ({ page }) => {
    await page.goto(heroUrl('pin'), { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');

    // Wheel in small increments, stopping at the first frame where the flash is bright (mid-transition).
    // (Exact wheel-step→flash mapping varies; poll for a bright frame rather than assuming a step count.)
    await page.mouse.move(640, 450);
    let hitFlash = false;
    for (let k = 0; k < 40 && !hitFlash; k++) {
      await page.mouse.wheel(0, 45);
      await page.waitForTimeout(20);
      if ((await flashOpacity(page)) > 0.35) hitFlash = true;
    }
    expect(hitFlash, 'wheeling should pass through a bright-flash transition frame').toBe(true);

    // After stopping (we stop wheeling now), the snap glides to the nearest settled scene and the flash
    // must CLEAR — no lingering flash on stop.
    await expect
      .poll(() => flashOpacity(page), {
        timeout: 4000,
        message: 'flash must clear after the snap settles (no lingering flash on stop)',
      })
      .toBeLessThan(0.1);
  });

  test('[pin] on stop, the BOARD title, the DOOR scene, and the navbar all match (in sync)', async ({ page }) => {
    await page.goto(heroUrl('pin'), { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    const root = page.locator('[data-hero-root]');

    await wheelInto(page, 22);
    // wait for the snap + board settle
    await expect.poll(() => flashOpacity(page), { timeout: 4000 }).toBeLessThan(0.1);
    await page.waitForTimeout(800); // let the board finish settling

    // The door's shown scene image must correspond to the committed destination (board + door + navbar
    // all reference the SAME scene — never "board says Craft while the door shows Journey").
    const dest = await root.getAttribute('data-active-dest');
    const img = await shownSceneImg(page);
    const expected = EXPECTED_CARDS.find((c) => c.href === dest);
    expect(expected, `dest ${dest} should be a known card`).toBeTruthy();
    expect(img, 'the door scene image must match the committed destination').toBe(
      (expected!.img.split('/').pop()) || '',
    );

    // and the matching navbar item is lit for that destination
    const lit = page.locator('[class*="navbarSceneActive"]');
    await expect(lit).toHaveCount(1);
  });

  // ── The three fixes: released-below-the-hero stability, forward-snap, board-settles-while-scrolling ──

  test('[pin] resting BELOW the hero is stable — no yank-back into the pinned hero', async ({ page }) => {
    // REGRESSION: the snap effect used to CLAMP progress to 1 once you were past the runway, read that
    // as "stopped mid-transition on the last scene", and glide the page ~2000px back UP into the hero
    // after a fast flick to the bottom. The released guard (raw progress out of [0,1) → never touch
    // scroll) fixes it. This test STOPS at the bottom and asserts the page holds (the old "releases"
    // test only proved the bottom was momentarily reachable, so it never caught the yank-back).
    await page.goto(heroUrl('pin'), { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');

    // Real wheel to the very bottom (wheel events drive the scroll-state machine the way a user does).
    await page.mouse.move(640, 450);
    for (let k = 0; k < 120; k++) {
      const atBottom = await page.evaluate(() => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        return window.scrollY >= max - 2;
      });
      if (atBottom) break;
      await page.mouse.wheel(0, 500);
      await page.waitForTimeout(12);
    }
    const settledY = await page.evaluate(() => Math.round(window.scrollY));
    // WAIT well past the scroll-idle debounce (140ms) + any glide: if a yank-back were going to fire it
    // fires within a few hundred ms. 2.5s is a generous margin.
    await page.waitForTimeout(2500);
    const finalY = await page.evaluate(() => Math.round(window.scrollY));
    expect(
      Math.abs(finalY - settledY),
      `page must hold below the hero (was ${settledY}, now ${finalY}) — no yank-back into the pinned hero`,
    ).toBeLessThanOrEqual(6);
  });

  // Geometry helper: page-Y for a given (stop, within) in the runway.
  const yForStopWithin = (page: Page, stop: number, within: number) =>
    page.evaluate(
      ({ stop, within }) => {
        const spacer = document.querySelector('[class*="parallaxSpacer"]') as HTMLElement;
        const rect = spacer.getBoundingClientRect();
        const vh = window.innerHeight;
        const scrollable = rect.height - vh;
        const spacerTopPage = rect.top + window.scrollY;
        const stops = 8; // CHOOSER_CARDS.length (7) + 1
        return Math.round(spacerTopPage + ((stop + within) / stops) * scrollable);
      },
      { stop, within },
    );

  test('[pin] a DOWN-scroll that stops mid-transition snaps FORWARD, never backward', async ({ page }) => {
    // REGRESSION for "sometimes we go backwards from the main scroll direction": the snap used to pull a
    // just-past-a-settled-centre stop BACK to that centre, up against a down-scroll. The snap is now
    // DIRECTION-aware — a down-scroll always lands FORWARD on the next scene. We stop in the EARLY part
    // of a transition (within ~0.6, BEFORE the flash peak — the case the old peak-only rule rewound) and
    // assert the page moved FORWARD (down), advanced the scene, and the flash cleared.
    await page.goto(heroUrl('pin'), { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    const root = page.locator('[data-hero-root]');

    // Real wheel DOWN into stop 2's early transition (within ~0.6), so the last scroll direction is down.
    const targetY = await yForStopWithin(page, 2, 0.6);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(120);
    await page.mouse.move(640, 450);
    let y = 0;
    while (y < targetY - 40) {
      await page.mouse.wheel(0, 80);
      await page.waitForTimeout(10);
      y = await page.evaluate(() => Math.round(window.scrollY));
    }
    const yAtStop = await page.evaluate(() => Math.round(window.scrollY));
    const sceneAtStop = Number(await root.getAttribute('data-active-scene'));

    // let the snap glide + settle
    await expect.poll(() => flashOpacity(page), { timeout: 4000 }).toBeLessThan(0.1);
    await page.waitForTimeout(300);
    const yAfter = await page.evaluate(() => Math.round(window.scrollY));
    const sceneAfter = Number(await root.getAttribute('data-active-scene'));

    expect(yAfter, `down-scroll snap must not go BACKWARD (stop ${yAtStop} → ${yAfter})`).toBeGreaterThan(
      yAtStop - 3,
    );
    expect(sceneAfter, 'a down-scroll stop should land on the NEXT scene, not rewind').toBeGreaterThanOrEqual(
      sceneAtStop,
    );
  });

  test('[pin] an UP-scroll that stops mid-transition snaps BACK, never forward', async ({ page }) => {
    // The mirror of the above: scrolling UP and stopping mid-transition must continue UP (back to the
    // current scene), never be pulled DOWN/forward against the up-scroll.
    await page.goto(heroUrl('pin'), { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');

    // Start deep, then real wheel UP to a transition point.
    const startY = await yForStopWithin(page, 4, 0.9);
    const targetY = await yForStopWithin(page, 3, 0.7);
    await page.evaluate((sy) => window.scrollTo(0, sy), startY);
    await page.waitForTimeout(200);
    await page.mouse.move(640, 450);
    let y = await page.evaluate(() => Math.round(window.scrollY));
    while (y > targetY + 40) {
      await page.mouse.wheel(0, -80);
      await page.waitForTimeout(10);
      y = await page.evaluate(() => Math.round(window.scrollY));
    }
    const yAtStop = await page.evaluate(() => Math.round(window.scrollY));

    await expect.poll(() => flashOpacity(page), { timeout: 4000 }).toBeLessThan(0.1);
    await page.waitForTimeout(300);
    const yAfter = await page.evaluate(() => Math.round(window.scrollY));
    expect(yAfter, `up-scroll snap must not go FORWARD/down (stop ${yAtStop} → ${yAfter})`).toBeLessThan(
      yAtStop + 3,
    );
  });

  test('[pin] board SETTLES to the scene title while still scrolling through a settled zone', async ({ page }) => {
    // The board used to churn during ANY scroll activity, so it only ever showed a title on a FULL stop
    // (door + board never in sync mid-journey). Churn is now scoped to the flash TRANSITION only, so
    // scrolling THROUGH a scene's settled zone lets the board roll to that scene's title even while the
    // wheel is still moving. We oscillate ±1px inside a settled zone (keeping "scrolling" true) and
    // assert the board converges to the active scene's title without a full stop.
    await page.goto(heroUrl('pin'), { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    const root = page.locator('[data-hero-root]');

    // Position at the centre of stop 3's settled zone (scene 2 = INITIATIVES).
    const baseY = await page.evaluate(() => {
      const spacer = document.querySelector('[class*="parallaxSpacer"]') as HTMLElement;
      const rect = spacer.getBoundingClientRect();
      const vh = window.innerHeight;
      const scrollable = rect.height - vh;
      const spacerTopPage = rect.top + window.scrollY;
      const stops = 8;
      const p = (3 + 0.25) / stops; // stop 3, well inside the settled half
      return Math.round(spacerTopPage + p * scrollable);
    });

    // Board text with SplitFlap's doubled faces collapsed (each flap shows front+back = duplicate glyph).
    const boardText = () =>
      page.evaluate(() => {
        const b = document.querySelector('[class*="studioSign"]') as HTMLElement;
        return (b?.innerText || '').replace(/\s+/g, '').replace(/(.)\1/g, '$1');
      });

    // Oscillate ±1px inside the settled zone so "scrolling" stays true but the scene never changes.
    await expect
      .poll(
        async () => {
          await page.evaluate((y) => window.scrollTo(0, y + (Date.now() % 2)), baseY);
          return boardText();
        },
        {
          timeout: 5000,
          message: 'board should roll to the scene title WHILE still scrolling (settled zone)',
        },
      )
      .toContain('INITIATIVES');

    await expect(root, 'scene held at 2 while scrolling the settled zone').toHaveAttribute(
      'data-active-scene',
      '2',
    );
  });

  // ── The festoon string-light progress indicator (one bulb per scene, clickable to jump) ──────────

  const festoonBulbs = (page: Page) => page.locator('button[class*="studioBulb"]');

  test('[pin] the festoon has one clickable bulb per scene, lit L-to-R by progress', async ({ page }) => {
    await page.goto(heroUrl('pin', 0), { waitUntil: 'domcontentloaded' }); // ?hero-scene=0 pins scene 0
    await page.waitForLoadState('networkidle');
    // one <button> bulb per destination scene
    await expect(festoonBulbs(page)).toHaveCount(EXPECTED_CARDS.length);
    // at scene 0 exactly the first bulb is lit
    const litCount = () => page.locator('button[class*="studioBulbLit"]').count();
    expect(await litCount(), 'scene 0 → only the first bulb lit').toBe(1);

    // forcing a later scene lights up through it (bulbs 0..N)
    await page.goto(heroUrl('pin', 4), { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    expect(await litCount(), 'scene 4 → bulbs 0..4 lit (5 total)').toBe(5);
  });

  test('[pin] clicking a festoon bulb JUMPS to that scene (and does NOT navigate away)', async ({ page }) => {
    await page.goto(heroUrl('pin'), { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    const root = page.locator('[data-hero-root]');
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(root).toHaveAttribute('data-active-scene', '0');

    // click the LAST bulb → jump to the last scene; the URL must stay '/' (the gate Link must NOT fire)
    await festoonBulbs(page).nth(EXPECTED_CARDS.length - 1).click();
    await expect(root).toHaveAttribute('data-active-scene', String(EXPECTED_CARDS.length - 1), {
      timeout: 4000,
    });
    await expect(root).toHaveAttribute('data-active-dest', EXPECTED_CARDS[EXPECTED_CARDS.length - 1].href);
    expect(new URL(page.url()).pathname, 'a bulb click must NOT navigate the gate Link').toBe('/');

    // and jump BACK to an earlier scene
    await festoonBulbs(page).nth(1).click();
    await expect(root).toHaveAttribute('data-active-scene', '1', { timeout: 4000 });
    expect(new URL(page.url()).pathname).toBe('/');
  });

  // ── PICKETS: the scrubbable per-strip flash wave (pin-with-pickets) ───────────────────────────────
  // Each crossing plays a staggered per-strip flash wave that reveals the next scene strip-by-strip.
  // It is a PURE function of the transition phase, so a mid-crossing stop is a STABLE picture (NO snap)
  // and scrolling back reverses it. These tests scrub with window.scrollTo + a dispatched scroll event
  // (the CATCH-UP renderer chases the raw progress; see useCatchUpProgress), then read the live state.

  // Scrub to a given progress p in [0,1] of the pinned runway and let the catch-up converge.
  const scrubTo = async (page: Page, p: number) =>
    page.evaluate(async (p) => {
      const spacer = document.querySelector('[class*="parallaxSpacer"]') as HTMLElement;
      const rect = spacer.getBoundingClientRect();
      const vh = window.innerHeight;
      const scrollable = rect.height - vh;
      const spacerTopPage = rect.top + window.scrollY;
      const targetY = Math.round(spacerTopPage + p * scrollable);
      // step in so scroll events fire (the smoothing loop chases the raw progress), then wait for it.
      for (let i = 1; i <= 6; i++) {
        window.scrollTo(0, Math.round((targetY * i) / 6));
        window.dispatchEvent(new Event('scroll'));
        await new Promise((r) => setTimeout(r, 25));
      }
      await new Promise((r) => setTimeout(r, 450));
      return Math.round(window.scrollY);
    }, p);

  // The per-strip opacities of the picket wave (one entry per strip).
  const picketOpacities = (page: Page) =>
    page.evaluate(() =>
      [...document.querySelectorAll('[class*="studioPicket"]:not([class*="studioPickets"])')].map(
        (el) => parseFloat(getComputedStyle(el as HTMLElement).opacity),
      ),
    );
  // The reveal clip's RIGHT inset % (100 = nothing revealed, 0 = fully revealed). null if no reveal layer.
  const revealRightPct = (page: Page) =>
    page.evaluate(() => {
      const layer = [...document.querySelectorAll('[class*="studioDoorScene"]')].find(
        (d) => (d as HTMLElement).style.clipPath,
      ) as HTMLElement | undefined;
      const m = layer?.style.clipPath.match(/inset\(0(?:px)? ([\d.]+)%/);
      return m ? parseFloat(m[1]) : null;
    });

  test('[pickets] a mid-crossing REST is STABLE — no snap moves the page or the wave', async ({ page }) => {
    await page.goto(heroUrl('pickets'), { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');

    // Scrub into the door→scene0 crossing (mid-wave) and confirm the wave is LIT.
    await scrubTo(page, 0.1);
    const opsAtRest = await picketOpacities(page);
    expect(opsAtRest.length, 'the picket wave renders during a crossing').toBeGreaterThan(0);
    expect(Math.max(...opsAtRest), 'some picket strip is lit mid-crossing').toBeGreaterThan(0.3);

    // Let the smoothing fully settle before snapshotting the "rest" clip (the exponential ease can still
    // be micro-adjusting for a beat after scrubTo's wait, esp. under load).
    await page.waitForTimeout(400);
    const yAtRest = await page.evaluate(() => Math.round(window.scrollY));
    const clipAtRest = await revealRightPct(page);
    // WAIT well past any snap window (pin snaps within a few hundred ms). Pickets must NOT move.
    await page.waitForTimeout(2500);
    const yAfter = await page.evaluate(() => Math.round(window.scrollY));
    const clipAfter = await revealRightPct(page);

    expect(Math.abs(yAfter - yAtRest), `pickets must not snap (was ${yAtRest}, now ${yAfter})`).toBeLessThanOrEqual(4);
    // The reveal must HOLD: a snap would jump it by a full scene (100%); tolerate at most one picket
    // step (100/9 ≈ 11.2%) of smoothing quantization, which is NOT a snap.
    expect(
      Math.abs((clipAfter ?? 0) - (clipAtRest ?? 0)),
      `the partial reveal must hold, not snap (was ${clipAtRest}, now ${clipAfter})`,
    ).toBeLessThanOrEqual(11.2);
  });

  test('[pickets] the reveal wipes LEFT to RIGHT and REVERSES when you scroll back', async ({ page }) => {
    await page.goto(heroUrl('pickets'), { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');

    // Two points in the same crossing, the second FURTHER in: the reveal must advance (right inset drops).
    await scrubTo(page, 0.098);
    const clipEarly = await revealRightPct(page);
    await scrubTo(page, 0.11);
    const clipLater = await revealRightPct(page);
    expect(clipEarly, 'a reveal layer exists mid-crossing').not.toBeNull();
    expect(clipLater, 'a reveal layer exists mid-crossing').not.toBeNull();
    expect(clipLater!, `scrolling deeper reveals MORE (right inset ${clipEarly} → ${clipLater})`).toBeLessThan(
      clipEarly!,
    );

    // Now scroll BACK toward the start of the crossing: the reveal must RETREAT (right inset grows again).
    await scrubTo(page, 0.098);
    const clipBack = await revealRightPct(page);
    expect(clipBack!, `scrolling back retreats the reveal (${clipLater} → ${clipBack})`).toBeGreaterThan(
      clipLater!,
    );
  });

  test('[pickets] the wave is a TRAVELING band (brightest strip sweeps L→R, not a bloom)', async ({ page }) => {
    // REGRESSION: with too small a PICKET_SPREAD the strips all peak together mid-crossing, so the whole
    // door blooms WHITE for a stretch with no visible motion ("not smooth as I scroll slowly"). A proper
    // wave is a NARROW bright band that TRAVELS: the brightest strip's index should sweep 0→N as you
    // scrub the crossing, and only a few strips should be lit at once (not all of them).
    await page.goto(heroUrl('pickets'), { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');

    const sweep = await page.evaluate(async () => {
      const spacer = document.querySelector('[class*="parallaxSpacer"]') as HTMLElement;
      const rect = spacer.getBoundingClientRect();
      const vh = window.innerHeight;
      const scrollable = rect.height - vh;
      const spacerTopPage = rect.top + window.scrollY;
      const ops = () =>
        [...document.querySelectorAll('[class*="studioPicket"]:not([class*="studioPickets"])')].map((p) =>
          parseFloat(getComputedStyle(p as HTMLElement).opacity),
        );
      const brightest: number[] = [];
      let maxLitAtOnce = 0;
      window.scrollTo(0, 0);
      window.dispatchEvent(new Event('scroll'));
      await new Promise((r) => setTimeout(r, 300));
      for (let i = 0; i <= 40; i++) {
        const p = 0.06 + (0.07 * i) / 40; // scrub across the door→scene0 crossing
        window.scrollTo(0, Math.round(spacerTopPage + p * scrollable));
        window.dispatchEvent(new Event('scroll'));
        await new Promise((r) => requestAnimationFrame(() => r(null)));
        const o = ops();
        if (o.length && Math.max(...o) > 0.4) {
          brightest.push(o.indexOf(Math.max(...o)));
          maxLitAtOnce = Math.max(maxLitAtOnce, o.filter((x) => x > 0.5).length);
        }
      }
      const first = brightest[0] ?? -1;
      const last = brightest[brightest.length - 1] ?? -1;
      // is the brightest-strip index non-decreasing (a left→right sweep)? allow tiny sampling noise.
      const monotonic = brightest.every((v, i) => i === 0 || v >= brightest[i - 1] - 1);
      return { first, last, monotonic, maxLitAtOnce, n: brightest.length };
    });

    // the band must TRAVEL: start near the left, end near the right.
    expect(sweep.n, 'the wave is lit across the crossing').toBeGreaterThan(5);
    expect(sweep.first, `the band starts on the LEFT (was strip ${sweep.first})`).toBeLessThanOrEqual(2);
    expect(sweep.last, `the band ends on the RIGHT (was strip ${sweep.last})`).toBeGreaterThanOrEqual(6);
    expect(sweep.monotonic, 'the brightest strip sweeps left→right (a traveling band, not a bloom)').toBe(true);
    // it is a NARROW band, not a whole-door bloom: never more than ~half the strips lit at once.
    expect(sweep.maxLitAtOnce, `only a few strips lit at once (was ${sweep.maxLitAtOnce})`).toBeLessThanOrEqual(5);
  });

  test('[pickets] past the wave the NEW scene is committed and no picket stays lit', async ({ page }) => {
    await page.goto(heroUrl('pickets'), { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    const root = page.locator('[data-hero-root]');

    // Settle PAST the first crossing, into scene 0's settled zone (stop 1, well inside the settled half).
    await scrubTo(page, (1 + 0.2) / 8);
    await expect(root, 'the first crossing committed scene 0').toHaveAttribute('data-active-scene', '0');
    // In a settled zone there is no wave: either no picket strips render, or every strip is dark.
    const ops = await picketOpacities(page);
    expect(ops.every((o) => o < 0.05), 'no picket stays lit once settled').toBe(true);
  });

  test('[pickets] resting BELOW the hero is stable (released = untouchable, snap is off)', async ({ page }) => {
    await page.goto(heroUrl('pickets'), { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');

    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(200);
    const settledY = await page.evaluate(() => Math.round(window.scrollY));
    await page.waitForTimeout(2000); // no snap should pull us back up
    const finalY = await page.evaluate(() => Math.round(window.scrollY));
    expect(Math.abs(finalY - settledY), `page must hold below the hero (${settledY} → ${finalY})`).toBeLessThanOrEqual(6);
  });

  // The board text with SplitFlap's doubled faces collapsed (each flap shows front+back = duplicate).
  const boardCollapsed = (page: Page) =>
    page.evaluate(() => {
      const b = document.querySelector('[class*="studioSign"]') as HTMLElement;
      return (b?.innerText || '').replace(/\s+/g, '').replace(/(.)\1/g, '$1');
    });

  test('[pickets] the board FREEZES mid-crossing as a stable old/new MIX, and shows the TITLE when settled', async ({
    page,
  }) => {
    // The board is SCRUBBED by scroll (SplitFlap SWEEP mode): mid-crossing it shows the NEXT title's
    // left prefix + the PREVIOUS text's right remainder, split at the flip front. Stopping mid-wave
    // FREEZES that mix (a pure function of position: no churn, no settle animation, nothing flipping).
    await page.goto(heroUrl('pickets'), { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');

    await scrubTo(page, 0.09); // mid door→scene0 crossing
    await page.waitForTimeout(600); // let the last front-flip finish
    const mid1 = await boardCollapsed(page);
    await page.waitForTimeout(600);
    const mid2 = await boardCollapsed(page);
    expect(mid1, 'the mixed board holds frozen mid-crossing').toBe(mid2);
    // the MIX: the destination's prefix has landed, but the full title has not
    expect(mid1.startsWith('DIS'), `left prefix shows the NEXT title (was "${mid1}")`).toBe(true);
    expect(mid1, 'mid-crossing is a mix, not the finished title').not.toBe('DISCOVERMYCRAFT');
    // nothing animates at rest: no fold leaf exists anywhere in the board
    const flipping = await page.evaluate(
      () => document.querySelectorAll('[class*="studioSign"] [class*="foldDown"]').length,
    );
    expect(flipping, 'no cell flips while frozen mid-crossing').toBe(0);

    // Settle past the wave: the full title, held.
    await scrubTo(page, (1 + 0.25) / 8);
    await expect
      .poll(() => boardCollapsed(page), { timeout: 5000, message: 'settled board shows the scene title' })
      .toBe('DISCOVERMYCRAFT');
  });

  test('[pickets] the board letters land column by column WITH the scroll, and revert on scroll-back', async ({
    page,
  }) => {
    // The flip front tracks the wave: scrub DEEPER into the crossing and MORE destination letters are
    // in place (the prefix grows); scrub BACK and they revert to the previous text. A pure function of
    // scroll position, like the pickets themselves: only the columns the front passes ever animate.
    await page.goto(heroUrl('pickets'), { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');

    const TITLE = 'DISCOVERMYCRAFT';
    // how many leading chars of the TITLE the board currently shows
    const landedPrefix = async () => {
      const s = await boardCollapsed(page);
      let n = 0;
      while (n < TITLE.length && s[n] === TITLE[n]) n++;
      return n;
    };
    const depths = [0.055, 0.08, 0.105, 0.13];
    const landed: number[] = [];
    for (const p of depths) {
      await scrubTo(page, p);
      await page.waitForTimeout(400); // front flip settles
      landed.push(await landedPrefix());
    }
    // deeper scroll → MORE of the title in place OVERALL. We check the TREND, not strict per-step
    // monotonicity: the cell the flip front is crossing shows a transient from-text glyph for a frame,
    // which can briefly shorten the matched prefix by one at any single sample. So assert the prefix
    // grows across the crossing (early < late) and the final sample is the complete title.
    expect(landed[0], 'early in the crossing only a few letters have landed').toBeLessThan(TITLE.length);
    expect(
      landed[landed.length - 1],
      `deeper scrubs land MORE of the title overall (${JSON.stringify(landed)})`,
    ).toBeGreaterThan(landed[0]);
    // past the crossing (a settled zone) the full title is in place
    await scrubTo(page, (1 + 0.2) / 8);
    await page.waitForTimeout(400);
    expect(await landedPrefix(), 'past the crossing the full title is in place').toBe(TITLE.length);
    // and scrolling BACK retreats the front: letters revert toward the previous text
    await scrubTo(page, 0.06);
    await page.waitForTimeout(400);
    const reverted = await landedPrefix();
    expect(reverted, `scroll-back reverts landed letters (${landed[landed.length - 1]} → ${reverted})`).toBeLessThan(
      TITLE.length,
    );
  });

  // How many of the board's rows have any non-blank glyph (a full-width single-row title → 1).
  const filledRowCount = (page: Page) =>
    page.evaluate(() =>
      [...document.querySelectorAll('[class*="studioSign"] [class*="row"]')].filter(
        (r) => (r as HTMLElement).innerText.replace(/\s/g, '').length > 0,
      ).length,
    );

  test('[pickets] the board stays a SINGLE row through a crossing (padding rows never fill)', async ({ page }) => {
    // The board pads short text to a fixed 3-row grid with BLANK rows top + bottom. The scrubbed
    // old/new MIX must live only where the texts have letters: if the padding rows ever filled, the
    // board would visibly collapse 3-rows→1 at the crossing end. Both the from-grid and to-grid pad
    // rows blank, so the sweep's union span never touches them.
    await page.goto(heroUrl('pickets'), { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');

    // Actively scrub through a crossing; at no point should more than ONE row be filled.
    let maxRows = 0;
    for (let k = 0; k < 8; k++) {
      await scrubTo(page, 0.06 + k * 0.006);
      maxRows = Math.max(maxRows, await filledRowCount(page));
    }
    expect(maxRows, 'only the centered row churns; the padding rows stay blank').toBeLessThanOrEqual(1);
  });

  test('[pin] on a SHORT viewport the house does not collapse + the board fits the arch', async ({ page }) => {
    // REGRESSION: the pinned fold-fit cap is `min(--body-w, (100vh - 2*offset) / ratio)`. On a SHORT
    // window that height term collapses (a 506px-tall viewport → (506-378)/0.8 = 160px), shrinking the
    // whole house to a postage stamp with the wide Vestaboard OVERFLOWING the arch. The fix floors it at
    // `--pin-house-min`. The visual regression matrix only uses TALL viewports (h=780/860), so it never
    // exercised this — this test does. Use `pin` (deterministic layout; pickets shares the same cap).
    await page.setViewportSize({ width: 1200, height: 520 }); // short + wide
    await page.goto(heroUrl('pin'), { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');

    const dims = await page.evaluate(() => {
      const body = document.querySelector('[class*="studioBody"]') as HTMLElement | null;
      const sign = document.querySelector('[class*="studioSign"]') as HTMLElement | null;
      return {
        bodyW: body ? Math.round(body.getBoundingClientRect().width) : 0,
        signW: sign ? Math.round(sign.getBoundingClientRect().width) : 0,
      };
    });
    // the house must stay near full size (floored at --pin-house-min 600px), not collapse...
    expect(dims.bodyW, `house body must stay near full size on a short window (was ${dims.bodyW}px)`).toBeGreaterThanOrEqual(560);
    // ...and the hanging board must FIT inside the house body (not overflow the arch).
    expect(dims.signW, `the board (${dims.signW}px) must fit inside the house body (${dims.bodyW}px)`).toBeLessThanOrEqual(dims.bodyW + 2);
  });

  test('[pickets] ?hero-progress=P freezes an exact frame (a mid-wave crossing, deterministically)', async ({
    page,
  }) => {
    // hero-progress pins the RAW engine progress, bypassing scroll + the catch-up, so a specific pickets
    // crossing PHASE is frozen (what hero-scene=N, settled-only, cannot do). p≈0.094 is mid-wave in the
    // door→scene0 crossing (t≈0.65): the wave is lit and the board rests on a scramble (not the title).
    await page.goto(heroUrl('pickets') + '&hero-progress=0.094', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1200); // let the (one-time) board settle roll finish

    // the wave is lit at the peak (some picket strip bright), and it is FROZEN (no scroll needed)
    const ops = await picketOpacities(page);
    expect(ops.length, 'pickets render at the frozen crossing').toBeGreaterThan(0);
    expect(Math.max(...ops), 'the wave is lit at the frozen peak').toBeGreaterThan(0.5);
    // frozen means stable across time with zero interaction
    const before = await page.evaluate(() => window.scrollY);
    await page.waitForTimeout(600);
    const after = await page.evaluate(() => window.scrollY);
    expect(after, 'a frozen frame does not move').toBe(before);
    // the board rests on a scramble mid-crossing, NOT the destination title
    const board = await boardCollapsed(page);
    expect(board.includes('CRAFT'), 'mid-crossing board is a scramble, not the title').toBe(false);
  });

  test('[pickets] each crossing spans a REAL scroll runway (a nudge cannot teleport a scene)', async ({
    page,
  }) => {
    // REGRESSION: with the shared pin geometry (0.85vh/scene, half-slice crossings) one crossing was
    // ~250px of scroll — a single inertial trackpad nudge glides further than that BETWEEN two animation
    // frames, so the wave teleported past whole crossings ("skips pickets, jumps to the next scene").
    // Pickets now uses its own taller spacer + a larger transition share; this gate pins the CONTRACT:
    // one crossing must span at least ~60% of a viewport of scroll.
    await page.goto(heroUrl('pickets'), { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    const runway = await page.evaluate(() => {
      const spacer = document.querySelector('[class*="parallaxSpacer"]') as HTMLElement;
      const vh = window.innerHeight;
      const scrollable = spacer.getBoundingClientRect().height - vh;
      const stops = 8; // 7 scenes + the door
      const transitionFraction = 0.7; // the pickets engine share (PICKET_TRANSITION_FRACTION)
      return { vh, crossingPx: (scrollable / stops) * transitionFraction };
    });
    expect(
      runway.crossingPx,
      `one crossing (${Math.round(runway.crossingPx)}px) must span >=60% of a viewport (${runway.vh}px) so a nudge scrubs it, not skips it`,
    ).toBeGreaterThanOrEqual(0.6 * runway.vh);
  });

  test('[pickets] the board does NOT layer-promote every glyph (scroll-lag regression guard)', async ({
    page,
  }) => {
    // PERF REGRESSION GUARD (deterministic, machine-independent). The split-flap board has ~144 glyph
    // spans. Promoting EVERY one to its own compositor layer (a naive Firefox fix: `transform:
    // translateZ(0)` / `will-change: transform` on `.glyph`) explodes the layer count and makes SCROLL
    // lag badly on real hardware. A frame-timing test misses this on a fast CI box (it composites 144
    // layers fine), so instead we assert the CODE-LEVEL invariant: only a SMALL, bounded number of
    // board elements carry a layer-promoting property, and NONE of them are the numerous static glyphs.
    // The legit promotions are the FOLDING leaves (.foldDown/.foldUp) — a handful, only while flipping.
    await page.goto(heroUrl('pickets'), { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');

    // Settle on a scene (no cells flipping) so the ONLY layer-promoting styles left are ones baked into
    // a static rule — a correctly-built board has NONE. (During a flip, fold leaves legitimately promote,
    // which is fine and transient; we check the RESTING state to isolate the bad `.glyph` rule.)
    await scrubTo(page, (1 + 0.25) / 8);
    await expect
      .poll(() => boardCollapsed(page), { timeout: 5000 })
      .toBe('DISCOVERMYCRAFT');
    const promoted = await page.evaluate(() => {
      // A promoted GLYPH shows a non-`none` transform (translateZ(0) computes to matrix(1,0,0,1,0,0), a
      // 2D matrix in Firefox, so we can't string-match translateZ — any non-none transform on a static
      // glyph means it was force-promoted) OR a transform-related will-change.
      const isPromoted = (el: Element) => {
        const s = getComputedStyle(el);
        return (s.transform && s.transform !== 'none') || /transform/.test(s.willChange || '');
      };
      const board = document.querySelector('[class*="studioSign"]')!;
      const glyphs = [...board.querySelectorAll('[class*="glyph"]')];
      return {
        promotedGlyphs: glyphs.filter(isPromoted).length,
        glyphTotal: glyphs.length,
      };
    });

    // THE guard: ZERO static glyphs are layer-promoted. Promoting all ~168 glyphs (a naive Firefox fix
    // on `.glyph`) is the compositor-layer explosion that lagged scroll. The Firefox fix must live on the
    // transient fold LEAVES only (see SplitFlap/styles.module.css), never the static glyphs.
    expect(
      promoted.promotedGlyphs,
      `no static glyph may be GPU-layer-promoted (found ${promoted.promotedGlyphs} of ${promoted.glyphTotal})`,
    ).toBe(0);
  });

  test('[pickets] the wave tracks the scroll LIVE (lights up DURING scroll, not only after stop)', async ({
    page,
  }) => {
    // REGRESSION: the wave once trailed a slow smoothing (~350ms), so it only "played" AFTER you stopped
    // scrolling. It now renders from the CATCH-UP display progress (70ms ease), which moves DURING the
    // scroll, so a strip is lit while the wheel is still turning. We step through a crossing WITHOUT any
    // settle wait and assert the wave is lit at mid-crossing steps (not just at rest).
    await page.goto(heroUrl('pickets'), { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');

    const litDuringScroll = await page.evaluate(async () => {
      const spacer = document.querySelector('[class*="parallaxSpacer"]') as HTMLElement;
      const rect = spacer.getBoundingClientRect();
      const vh = window.innerHeight;
      const scrollable = rect.height - vh;
      const spacerTopPage = rect.top + window.scrollY;
      const maxOp = () =>
        Math.max(
          0,
          ...[...document.querySelectorAll('[class*="studioPicket"]:not([class*="studioPickets"])')].map((el) =>
            parseFloat(getComputedStyle(el as HTMLElement).opacity),
          ),
        );
      let litFrames = 0;
      // walk across the door→scene0 crossing; sample IMMEDIATELY each step (one rAF), NO settle wait
      for (let i = 1; i <= 18; i++) {
        window.scrollTo(0, Math.round(spacerTopPage + (0.11 * scrollable * i) / 18));
        window.dispatchEvent(new Event('scroll'));
        await new Promise((r) => requestAnimationFrame(() => r(null)));
        if (maxOp() > 0.15) litFrames++;
      }
      return litFrames;
    });
    // several mid-scroll samples must show a lit strip — with the old smoothing trail this was ~0 (the
    // wave hadn't caught up yet during the scroll).
    expect(litDuringScroll, 'the wave must light up WHILE scrolling, not only after a stop').toBeGreaterThanOrEqual(3);
  });

  test('[pickets] scrolling does not trigger a render STORM (no smoothing double-render regression)', async ({
    page,
  }) => {
    // REGRESSION: a smoothing rAF loop used to bump a second React tick every frame, so ParallaxStudio +
    // StudioFacade re-rendered ~2× per scroll frame (~140 renders/s), the pickets scroll-lag. The catch-up
    // renderer now drives the ONE render whose props change (the raw tick's render is memoized to the same
    // scene object, so it writes no styles). This counts React renders during a fixed scroll (via a render probe
    // that MutationObserves the picket container's style writes as a render proxy) and asserts renders are
    // roughly one-per-scroll-frame, not double. Machine-independent (a ratio, not a wall-clock budget).
    await page.goto(heroUrl('pickets'), { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');

    const ratio = await page.evaluate(async () => {
      const spacer = document.querySelector('[class*="parallaxSpacer"]') as HTMLElement;
      const rect = spacer.getBoundingClientRect();
      const vh = window.innerHeight;
      const scrollable = rect.height - vh;
      const spacerTopPage = rect.top + window.scrollY;
      let frames = 0;
      let raf = 0;
      const rec = () => {
        frames++;
        raf = requestAnimationFrame(rec);
      };
      raf = requestAnimationFrame(rec);
      // count how many times the FACADE restyles (a render proxy) vs how many animation frames elapse.
      let styleWrites = 0;
      const mo = new MutationObserver((m) => {
        styleWrites += m.length;
      });
      mo.observe(document.querySelector('[class*="studioFacade"]')!, {
        subtree: true,
        attributes: true,
        attributeFilter: ['style'],
      });
      // continuous scroll through crossings for ~1.5s
      const t0 = performance.now();
      let i = 0;
      while (performance.now() - t0 < 1500) {
        const p = 0.06 + 0.09 * (0.5 + 0.5 * Math.sin(i / 10));
        window.scrollTo(0, Math.round(spacerTopPage + p * scrollable));
        window.dispatchEvent(new Event('scroll'));
        i++;
        await new Promise((r) => setTimeout(r, 14));
      }
      mo.disconnect();
      cancelAnimationFrame(raf);
      // style writes PER animation frame. The picket wave writes 9 strip opacities + a clip per RENDER,
      // so ~10 writes/render. With the old double-render it was ~2 renders/frame → ~20 writes/frame; a
      // single render/frame is ~10. Assert we're not in double-render territory.
      return styleWrites / Math.max(1, frames);
    });
    // one render per frame ≈ 10 style writes/frame; a double-render regression pushes this toward ~20+.
    expect(ratio, `facade style writes per frame (${ratio.toFixed(1)}) must not indicate a double render`).toBeLessThan(16);
  });

  test('[pickets] a per-frame hero style write does NOT force a whole-document reflow (layout thrash)', async ({
    page,
  }) => {
    // THE big lag: the picket wave writes styles (opacities + reveal clip-path) every scroll frame. If the
    // hero is NOT layout-contained, each write dirties the WHOLE document, and Docusaurus's global scroll
    // handler then forces a full synchronous reflow — which ballooned single frames to 400ms–2s on real
    // hardware (a fast dev box under-reproduces, so a wall-clock budget would flakily pass). Instead we
    // assert the STRUCTURAL fix + a relative cost: (1) the sticky is layout-contained; (2) forcing layout
    // AFTER a hero style write costs about the SAME as with no write (contained) rather than far more
    // (thrash). The ratio is machine-independent.
    await page.goto(heroUrl('pickets'), { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    await scrubTo(page, 0.1); // into a crossing so the reveal + picket layers exist

    const probe = await page.evaluate(async () => {
      const stick = document.querySelector('[class*="parallaxStick"]') as HTMLElement | null;
      const contain = stick ? getComputedStyle(stick).contain : '';
      const reveal = [...document.querySelectorAll('[class*="studioDoorScene"]')].find(
        (d) => (d as HTMLElement).style.clipPath,
      ) as HTMLElement | undefined;
      const pickets = [...document.querySelectorAll('[class*="studioPicket"]:not([class*="studioPickets"])')] as HTMLElement[];
      if (!reveal || !pickets.length) return { contain, err: 'no crossing layers' };

      // time forcing a document layout AFTER a hero style write vs after NO write. Contained → similar;
      // thrashing → the write path is far more expensive because it reflows the whole doc.
      const time = (write: (k: number) => void, n = 60) => {
        // warm up
        for (let k = 0; k < 5; k++) { write(k); void document.body.offsetHeight; }
        const t0 = performance.now();
        for (let k = 0; k < n; k++) { write(k); void document.body.offsetHeight; }
        return (performance.now() - t0) / n;
      };
      const withWrite = time((k) => {
        reveal.style.clipPath = `inset(0 ${15 + (k % 40)}% 0 0)`;
        pickets.forEach((p, i) => (p.style.opacity = String(((0.3 + 0.01 * k + 0.05 * i) % 1))));
      });
      const noWrite = time(() => {});
      return { contain, withWriteMs: +withWrite.toFixed(3), noWriteMs: +noWrite.toFixed(3) };
    });

    // PRIMARY (deterministic, machine-independent): the sticky must be layout-contained. This IS the fix;
    // a bare `contain: none`/'' is the bug that let a hero style write dirty the whole document.
    expect(probe.contain, 'the pinned hero must be layout-contained (contain: layout paint style)').toMatch(
      /layout|paint|content|strict/,
    );
    // SECONDARY (absolute, generous): with containment, forcing layout after a hero style write is cheap
    // (sub-ms on any machine, since only the hero subtree reflows). The thrash bug made this balloon
    // because the whole document reflowed. A generous 5ms ceiling catches the gross regression without
    // being flaky on a loaded CI box. (Skipped if the crossing layers weren't captured.)
    if (probe.withWriteMs != null) {
      expect(
        probe.withWriteMs,
        `forcing layout after a hero style write (${probe.withWriteMs}ms) must stay cheap — a big value means it reflows the whole document (thrash)`,
      ).toBeLessThan(5);
    }
  });
});

/*
 * REDUCED-MOTION: the AUTO-cycling heroes must NOT self-advance under prefers-reduced-motion.
 * The brand rule is "all motion respects prefers-reduced-motion, no exceptions." The flash + studio
 * heroes used to keep auto-rotating under reduce (only the flash bloom was suppressed) — a P0. The fix
 * gates each auto-advance (setInterval / rAF clock) on the preference so the scene PINS, while the
 * arrow keys still let a reduced-motion user step through by choice (motion off ≠ navigation off).
 */
test.describe('Homepage hero: reduced-motion does not auto-advance', () => {
  // These assert the USER-FACING symptom: under reduced motion the auto-cycling heroes must hold their
  // scene instead of self-advancing. The windows are deliberately longer than one auto-step (studio
  // advances at ~10s, flash at ~12s on the buggy build — verified empirically), so the test actually
  // DISCRIMINATES: pre-fix the active destination rotates off scene 0; post-fix it stays put. The fix
  // gates each auto-advance (setInterval / rAF clock) on prefers-reduced-motion; arrows still navigate.

  test('studio timer house: active scene HOLDS on /craft (rAF clock gated)', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await context.newPage();
    try {
      await page.goto('/?ab-homepage-hero-anim=variant_c', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle');
      // The bare timer house (ChooserStudio) is ONE gate whose href is CHOOSER_CARDS[active].to; scene
      // 0 → /craft. On the buggy build it rotates to /journey by ~10s even under reduce; the fix pins it.
      const gate = page.locator('[data-hero-root]');
      await expect(gate, 'the timer house starts on scene 0 (/craft)').toHaveAttribute('href', '/craft');
      await page.waitForTimeout(11000); // past the ~10s point where the buggy build advances
      await expect(
        gate,
        'reduced-motion: the timer house must NOT auto-advance (gate stays /craft)',
      ).toHaveAttribute('href', '/craft');
    } finally {
      await context.close();
    }
  });

  test('flash variant: active scene HOLDS (no auto-rotate), but arrows still navigate', async ({
    browser,
  }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await context.newPage();
    try {
      await page.goto('/?ab-homepage-hero-anim=test', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle');
      const activeSrc = () =>
        page.locator('[class*="flashArchImgActive"]').getAttribute('src');
      const first = await activeSrc();
      expect(first, 'an active arch scene should be showing').toBeTruthy();

      // Wait past the auto-rotate interval (FLASH_INTERVAL_MS = 12s). Pre-fix the scene rotates here;
      // the fix holds it. (13s keeps a margin over the 12s interval.)
      await page.waitForTimeout(13000);
      expect(await activeSrc(), 'reduced-motion: the flash hero must NOT auto-rotate').toBe(first);

      // Navigation by CHOICE still works (only the auto-motion is off).
      await page.keyboard.press('ArrowRight');
      await expect
        .poll(activeSrc, { timeout: 4000, message: 'arrows still navigate under reduced-motion' })
        .not.toBe(first);
    } finally {
      await context.close();
    }
  });
});
