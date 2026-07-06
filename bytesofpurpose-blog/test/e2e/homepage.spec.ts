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
  const SCROLL_MODELS = ['pin', 'inplace', 'horizontal'] as const;
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

  test('DEFAULT (bare /) is the ANIMATION timer house — the house, in normal flow, NOT a pinned spacer', async ({
    page,
  }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    // the house renders (variant_c facade) ...
    await expect(page.locator('[class*="studioFacade"]')).toHaveCount(1);
    // ... in NORMAL flow: the timer hero has NO tall parallax spacer (that's the pin/horizontal models)
    await expect(page.locator('[class*="parallaxSpacer"]')).toHaveCount(0);
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

  test('[pin] STOP past the flash peak SNAPS FORWARD (agrees with the door, never rewinds)', async ({ page }) => {
    // The door commits to the NEXT scene at the flash PEAK (t >= 0.5). So a stop PAST the peak has
    // already shown the next scene; snapping BACKWARD to the scene we were leaving would contradict the
    // visuals. The forward-bias lands on the committed scene. We drive to a point past the peak using
    // the spacer geometry (deterministic), nudge to register a real scroll, stop, and assert the snap
    // moved FORWARD (scrollY did not decrease) and kept the committed scene, with the flash cleared.
    await page.goto(heroUrl('pin'), { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    const root = page.locator('[data-hero-root]');

    // Park in the LATE part of stop 2's transition (within ~0.85 → t ~0.7, past the 0.5 peak).
    const target = await page.evaluate(() => {
      const spacer = document.querySelector('[class*="parallaxSpacer"]') as HTMLElement;
      const rect = spacer.getBoundingClientRect();
      const vh = window.innerHeight;
      const scrollable = rect.height - vh;
      const spacerTopPage = rect.top + window.scrollY;
      const stops = 8; // CHOOSER_CARDS.length (7) + 1
      const p = (2 + 0.85) / stops; // stop 2, within 0.85
      return { y: Math.round(spacerTopPage + p * scrollable) };
    });
    await page.evaluate((y) => window.scrollTo(0, y), target.y);
    await page.waitForTimeout(30);
    // a tiny real wheel nudge so the scroll-state machine registers activity then settles
    await page.mouse.move(640, 450);
    await page.mouse.wheel(0, 3);
    await page.waitForTimeout(40);
    const sceneAtStop = await root.getAttribute('data-active-scene');
    const yAtStop = await page.evaluate(() => Math.round(window.scrollY));

    // let the snap glide + settle
    await expect.poll(() => flashOpacity(page), { timeout: 4000 }).toBeLessThan(0.1);
    await page.waitForTimeout(300);
    const sceneAfter = await root.getAttribute('data-active-scene');
    const yAfter = await page.evaluate(() => Math.round(window.scrollY));

    expect(sceneAfter, 'the committed scene must not rewind past the flash peak').toBe(sceneAtStop);
    expect(yAfter, `snap must move FORWARD, not back up (stop ${yAtStop} → ${yAfter})`).toBeGreaterThanOrEqual(
      yAtStop - 2,
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
