import { test, expect, chromium, Browser, Page } from '@playwright/test';

/*
 * HERO SCROLL PERFORMANCE — reproduces the pickets scroll LAG on a fast CI box.
 *
 * Why this exists: the pickets picket-wave writes styles every scroll frame. A layout-thrash bug (the
 * hero not being layout-contained) made a single scroll frame balloon to 400ms–2s on real hardware,
 * while a fast dev box / CI showed ~60fps and every correctness test passed. Wall-clock frame budgets
 * are flaky across machines, so we DELIBERATELY SLOW THE MACHINE DOWN: Chromium's CDP
 * `Emulation.setCPUThrottlingRate` throttles the CPU (here 6×), simulating a slower device, so the
 * thrash becomes reproducible even on a fast runner. Then we assert no frame is catastrophically long.
 *
 * This is Chromium-only (Firefox/WebKit have no CPU-throttle CDP), so it runs in its own project. It is
 * a coarse gate: it catches a GROSS regression (a multi-hundred-ms frame), not micro-jitter, so the
 * threshold is generous enough to be stable under CI load.
 */

const BASE = process.env.HERO_PERF_BASE_URL || 'http://localhost:3000';
const heroUrl = (model: string) =>
  `${BASE}/?ab-homepage-hero-anim=variant_c&ab-homepage-hero-scroll=${model}`;

let browser: Browser;
test.beforeAll(async () => {
  browser = await chromium.launch();
});
test.afterAll(async () => {
  await browser?.close();
});

// Drive a real, steady scroll through several pickets crossings under CPU throttle and record the
// per-frame timing (rAF gaps) from inside the page, then return the worst frame + how many blew the
// budget. Under the thrash bug this returned multi-hundred-ms worst frames even at moderate throttle.
async function measureScrollFrames(page: Page, throttleRate: number) {
  const client = await page.context().newCDPSession(page);
  await client.send('Emulation.setCPUThrottlingRate', { rate: throttleRate });
  const stats = await page.evaluate(async () => {
    const el = document.querySelector('[class*="parallaxSpacer"]') as HTMLElement;
    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight;
    const scrollable = rect.height - vh;
    const spacerTopPage = rect.top + window.scrollY;
    const deltas: number[] = [];
    let last = performance.now();
    let raf = 0;
    const rec = (t: number) => {
      deltas.push(t - last);
      last = t;
      raf = requestAnimationFrame(rec);
    };
    raf = requestAnimationFrame(rec);
    // steady sweep repeating through crossings for ~2s (throttled, so wall-clock is longer)
    const t0 = performance.now();
    let i = 0;
    while (performance.now() - t0 < 2000) {
      const p = 0.05 + 0.1 * ((i / 60) % 1);
      window.scrollTo(0, Math.round(spacerTopPage + p * scrollable));
      window.dispatchEvent(new Event('scroll'));
      i++;
      await new Promise((r) => setTimeout(r, 16));
    }
    cancelAnimationFrame(raf);
    const d = deltas.slice(3).sort((a, b) => a - b);
    return {
      frames: d.length,
      p50: +d[Math.floor(d.length * 0.5)].toFixed(1),
      p95: +d[Math.floor(d.length * 0.95)].toFixed(1),
      worst: +d[d.length - 1].toFixed(1),
      over100: d.filter((x) => x > 100).length, // catastrophic hitches (the reported multi-100ms lag)
    };
  });
  await client.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  return stats;
}

test('[pickets] no MULTI-SECOND frame hitch while scrolling (CPU-throttled to reproduce slow HW)', async () => {
  test.setTimeout(60000); // throttled scroll + measurement takes longer than the default
  const page = await browser.newPage();
  try {
    // load WITHOUT throttle (throttle only around the scroll measurement); don't wait networkidle (the
    // CF Access /api/me probe never idles), just let the hero mount.
    await page.goto(heroUrl('pickets'), { waitUntil: 'load' });
    await page.waitForSelector('[class*="parallaxSpacer"]', { timeout: 15000 });
    await page.waitForTimeout(800);
    // 6× ≈ a mid device. The ORIGINAL bug (hero not layout-contained) produced 400ms–2000ms frames here;
    // the fix (contain on the sticky) keeps the worst frame well under that. This is the HARD gate: no
    // multi-hundred-ms hitch (the layout-thrash class). A smaller residual pickets cost (the masked+
    // clipped scene image on a commit) only shows at extreme throttle and is tracked separately.
    const stats = await measureScrollFrames(page, 6);
    expect(
      stats.worst,
      `worst frame (${stats.worst}ms) must not be a multi-100ms hitch — that is the layout-thrash bug`,
    ).toBeLessThan(250);
  } finally {
    await page.close();
  }
});

test('[pin] no catastrophic frame hitch while scrolling (baseline, same throttle)', async () => {
  // Baseline: the simpler pin flash should also stay smooth under the same throttle. If BOTH pin and
  // pickets hitch, the cause is shared (the house/board), not pickets-specific — useful triage signal.
  test.setTimeout(60000);
  const page = await browser.newPage();
  try {
    await page.goto(heroUrl('pin'), { waitUntil: 'load' });
    await page.waitForSelector('[class*="parallaxSpacer"]', { timeout: 15000 });
    await page.waitForTimeout(800);
    const stats = await measureScrollFrames(page, 6);
    // Pin is the baseline/triage signal, not a hard gate: allow the odd single ~100ms frame (an image
    // decode on a scene commit under heavy throttle), but a multi-100ms hitch or many of them means a
    // shared house/board perf problem, not pickets-specific. Keep the worst-case sane.
    expect(stats.worst, `pin worst frame (${stats.worst}ms) must not be a multi-100ms hitch`).toBeLessThan(250);
    expect(stats.over100, `pin: catastrophic frames should be rare (worst=${stats.worst}ms)`).toBeLessThanOrEqual(2);
  } finally {
    await page.close();
  }
});

test('[pickets] the wave MOVES during short start/stop scroll bursts (trackpad-gesture pattern)', async () => {
  // The reported symptom: "pickets don't move until I stop scrolling" during a real trackpad gesture —
  // scroll a bit, stop, lift fingers, scroll a bit more. If the per-frame paint is too slow (the 1024px
  // masked+clipped scene image), the rendered wave LAGS the scroll and only catches up on the pause, so
  // it reads as "only moves after I stop". Under CPU throttle we drive several SHORT bursts with pauses
  // and assert the wave's opacity actually CHANGES *while* each burst is scrolling (tracking live), not
  // only during the pause.
  test.setTimeout(60000);
  const page = await browser.newPage();
  try {
    await page.goto(heroUrl('pickets'), { waitUntil: 'load' });
    await page.waitForSelector('[class*="parallaxSpacer"]', { timeout: 15000 });
    await page.waitForTimeout(800);
    const client = await page.context().newCDPSession(page);
    await client.send('Emulation.setCPUThrottlingRate', { rate: 6 });

    const result = await page.evaluate(async () => {
      const spacer = document.querySelector('[class*="parallaxSpacer"]') as HTMLElement;
      const rect = spacer.getBoundingClientRect();
      const vh = window.innerHeight;
      const scrollable = rect.height - vh;
      const spacerTopPage = rect.top + window.scrollY;
      const maxOp = () => {
        const ps = [...document.querySelectorAll('[class*="studioPicket"]:not([class*="studioPickets"])')];
        return ps.length ? Math.max(...ps.map((p) => parseFloat(getComputedStyle(p as HTMLElement).opacity))) : -1;
      };
      // walk progress 0 → through ~2-3 crossings as SHORT BURSTS with pauses between them, and for each
      // burst record whether the wave's lit-opacity CHANGED across the burst's own frames (moved live).
      let burstsWithLiveMotion = 0;
      let burstsThatCrossed = 0;
      const bursts = 10;
      let p = 0.02;
      for (let b = 0; b < bursts; b++) {
        const opsThisBurst: number[] = [];
        // one burst = ~6 quick scroll steps (fingers moving), sampling the wave each step, NO settle
        for (let s = 0; s < 6; s++) {
          p += 0.006;
          window.scrollTo(0, Math.round(spacerTopPage + p * scrollable));
          window.dispatchEvent(new Event('scroll'));
          await new Promise((r) => requestAnimationFrame(() => r(null)));
          opsThisBurst.push(maxOp());
        }
        const lit = opsThisBurst.filter((o) => o > 0.1);
        if (lit.length >= 1) burstsThatCrossed++;
        const distinct = new Set(opsThisBurst.filter((o) => o > 0.1).map((o) => Math.round(o * 20)));
        if (distinct.size >= 2) burstsWithLiveMotion++;
        // PAUSE — lift fingers off the trackpad
        await new Promise((r) => setTimeout(r, 180));
      }
      return { burstsWithLiveMotion, burstsThatCrossed };
    });
    await client.send('Emulation.setCPUThrottlingRate', { rate: 1 });

    // Of the bursts inside a crossing, several must show the wave changing live DURING the burst (not
    // frozen until the pause). Require at least 2 bursts with live intra-burst motion.
    expect(
      result.burstsWithLiveMotion,
      `the wave must move WITH the scroll during bursts (live-motion bursts=${result.burstsWithLiveMotion}, crossing bursts=${result.burstsThatCrossed})`,
    ).toBeGreaterThanOrEqual(2);
  } finally {
    await page.close();
  }
});
