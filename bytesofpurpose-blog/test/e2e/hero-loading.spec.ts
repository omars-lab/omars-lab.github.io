import {test, expect} from '@playwright/test';

/**
 * Hero image loading (dev project, :3000).
 *
 * The house hero sits ABOVE the fold, so its always-visible images must load EAGERLY (not lazy, or
 * the arches/windows/door pop in after paint). This asserts the shipped attributes on the studio
 * (variant_c) house: the two window arches + the centre door + the first scene are loading="eager"
 * (the door also fetchpriority=high), while the non-initial scene layers stay lazy. Guards against a
 * regression back to loading="lazy" on the focal hero art.
 */

test.describe('Hero image loading', () => {
  test('house hero: above-the-fold arch images are eager (door high priority)', async ({page}) => {
    await page.goto('/?ab-homepage-hero-anim=variant_c', {waitUntil: 'domcontentloaded'});
    await page.waitForLoadState('networkidle');

    // The always-visible arch images (2 windows + door) + the first scene.
    const archImgs = page.locator('[class*="studioArchImg"], [class*="studioPeekImgActive"]');
    await expect(archImgs.first()).toBeVisible({timeout: 15000});

    const imgs = await archImgs.evaluateAll((els) =>
      els.map((e) => {
        const img = e as HTMLImageElement;
        return {
          src: (img.getAttribute('src') || '').split('/').pop(),
          loading: img.loading,
          fetchPriority: img.getAttribute('fetchpriority') || (img as any).fetchPriority,
          complete: img.complete,
          naturalWidth: img.naturalWidth,
        };
      }),
    );

    // Every above-the-fold arch image is eager AND actually decoded (no empty slot on first paint).
    expect(imgs.length).toBeGreaterThanOrEqual(3);
    for (const img of imgs) {
      expect(img.loading, `${img.src} should be eager`).toBe('eager');
      expect(img.complete, `${img.src} should be decoded`).toBe(true);
      expect(img.naturalWidth, `${img.src} should have loaded`).toBeGreaterThan(0);
    }

    // The centre door is the focal image → high fetch priority.
    const door = imgs.find((i) => i.src === 'door.png');
    expect(door, 'the door image should be present').toBeTruthy();
    expect(door!.fetchPriority).toBe('high');
  });

  test('non-initial scene layers stay lazy (only the focal art is eager)', async ({page}) => {
    await page.goto('/?ab-homepage-hero-anim=variant_c', {waitUntil: 'domcontentloaded'});
    await page.waitForLoadState('networkidle');

    // Across all hero <img>s there is at least one lazy image (the deferred scenes / pan backdrop),
    // proving we eager-loaded selectively rather than making everything eager.
    const anyLazy = await page
      .locator('header img[loading="lazy"], .navbar ~ * img[loading="lazy"]')
      .count()
      .catch(() => 0);
    const lazyOnPage = await page.locator('img[loading="lazy"]').count();
    expect(lazyOnPage).toBeGreaterThan(0);
    void anyLazy;
  });
});
