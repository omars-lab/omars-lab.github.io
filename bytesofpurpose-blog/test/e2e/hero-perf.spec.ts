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

test('[pickets] an inertial FLICK sweeps THROUGH every picket and scene (no teleport, no skipped commit)', async () => {
  // THE core scrub-fidelity contract. A trackpad flick moves hundreds of px BETWEEN two animation
  // frames (real events then synthesized momentum), so a renderer that is a pure f(rawScroll)
  // TELEPORTS: pickets skip, and a nudge lands on the next scene with no wave at all. The catch-up
  // renderer (useCatchUpProgress: 70ms ease + speed cap) must instead SWEEP the display through every
  // intermediate state. We fire ONE decaying-momentum flick spanning ~2 crossings under CPU throttle,
  // sample the brightest strip + committed scene every frame (during the flick AND the catch-up tail),
  // and assert (1) the brightest strip passes through MANY ordered positions (a sweep, not a jump) and
  // (2) every scene commit is consecutive (nothing skipped). Fails on raw-only rendering.
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
      const slice = scrollable / 8;
      const top = rect.top + window.scrollY;
      window.scrollTo(0, top);
      window.dispatchEvent(new Event('scroll'));
      await new Promise((r) => setTimeout(r, 500));
      const brightest = () => {
        const ps = [...document.querySelectorAll('[class*="studioPicket"]:not([class*="studioPickets"])')];
        let bi: number | null = null;
        let bo = 0.1;
        ps.forEach((p, i) => {
          const o = parseFloat(getComputedStyle(p as HTMLElement).opacity);
          if (o > bo) { bo = o; bi = i; }
        });
        return bi;
      };
      const committed = () =>
        document.querySelector('[data-hero-root]')?.getAttribute('data-active-scene') ?? null;
      const strips: number[] = [];
      const commits: string[] = [];
      const sample = () => {
        const b = brightest();
        if (b != null && (strips.length === 0 || strips[strips.length - 1] !== b)) strips.push(b);
        const c = committed();
        if (c != null && (commits.length === 0 || commits[commits.length - 1] !== c)) commits.push(c);
      };
      // ONE inertial flick: 8 quick decaying steps spanning ~2 slices, sampled per frame...
      let y = top;
      let v = slice * 0.45;
      for (let i = 0; i < 8; i++) {
        y += v;
        v *= 0.87;
        window.scrollTo(0, Math.round(y));
        window.dispatchEvent(new Event('scroll'));
        await new Promise((r) => requestAnimationFrame(() => r(null)));
        sample();
      }
      // ...then watch the catch-up tail play out (~2 crossings at the speed cap, throttled: allow 3s)
      const t0 = performance.now();
      while (performance.now() - t0 < 3000) {
        await new Promise((r) => requestAnimationFrame(() => r(null)));
        sample();
      }
      return { strips, commits, endY: Math.round(window.scrollY - top) };
    });
    await client.send('Emulation.setCPUThrottlingRate', { rate: 1 });

    // (1) the wave SWEPT: many distinct brightest-strip positions rendered (a raw teleport shows ~1-3)
    expect(
      result.strips.length,
      `the brightest strip must pass through many positions (saw ${JSON.stringify(result.strips)})`,
    ).toBeGreaterThanOrEqual(6);
    // ...and in order (within each crossing the index only climbs; a new crossing restarts low)
    let orderly = true;
    for (let i = 1; i < result.strips.length; i++) {
      const prev = result.strips[i - 1];
      const cur = result.strips[i];
      if (cur < prev && cur > 2) orderly = false; // a drop that isn't a new-crossing restart
    }
    expect(orderly, `strips sweep in order, restarting per crossing (${JSON.stringify(result.strips)})`).toBe(true);
    // (2) NO skipped scene: every commit is exactly the next scene
    const nums = result.commits.map(Number);
    const consecutive = nums.every((n, i) => i === 0 || n === nums[i - 1] + 1);
    expect(
      consecutive,
      `scene commits must be consecutive, none skipped (saw ${JSON.stringify(result.commits)})`,
    ).toBe(true);
    expect(nums.length, 'the flick crossed at least one scene').toBeGreaterThanOrEqual(1);
  } finally {
    await page.close();
  }
});

test('[pickets] rapid-succession flicks cycle EVERY scene in order and the wave settles after', async () => {
  // The requested experience: "cycle through all pickets and scenes in immediate scrolls in rapid
  // succession". Three back-to-back flicks (~1 crossing each, short pauses) must commit scenes 0, 1, 2
  // in order with none skipped, and once input stops the catch-up must CONVERGE (its target here is a
  // settled zone, so every strip goes dark) instead of animating forever.
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
      const slice = scrollable / 8;
      const top = rect.top + window.scrollY;
      window.scrollTo(0, top);
      window.dispatchEvent(new Event('scroll'));
      await new Promise((r) => setTimeout(r, 500));
      const commits: string[] = [];
      const sampleCommit = () => {
        const c = document.querySelector('[data-hero-root]')?.getAttribute('data-active-scene');
        if (c != null && (commits.length === 0 || commits[commits.length - 1] !== c)) commits.push(c);
      };
      // three flicks, each landing on the NEXT stop's settled centre (a real "scroll, pause, scroll")
      for (let stop = 1; stop <= 3; stop++) {
        const targetY = top + (stop + 0.15) * slice; // the stop's settled zone (within < 0.3)
        // a quick 5-step burst toward the target
        const startY = window.scrollY;
        for (let s = 1; s <= 5; s++) {
          window.scrollTo(0, Math.round(startY + ((targetY - startY) * s) / 5));
          window.dispatchEvent(new Event('scroll'));
          await new Promise((r) => requestAnimationFrame(() => r(null)));
          sampleCommit();
        }
        // brief pause with fingers lifted; keep sampling while the catch-up sweeps
        const t0 = performance.now();
        while (performance.now() - t0 < 450) {
          await new Promise((r) => requestAnimationFrame(() => r(null)));
          sampleCommit();
        }
      }
      // input over: the wave must CONVERGE to the settled zone (all strips dark) within ~1.5s
      let convergedAt = -1;
      const t1 = performance.now();
      while (performance.now() - t1 < 2500) {
        await new Promise((r) => requestAnimationFrame(() => r(null)));
        sampleCommit();
        const ops = [...document.querySelectorAll('[class*="studioPicket"]:not([class*="studioPickets"])')].map(
          (p) => parseFloat(getComputedStyle(p as HTMLElement).opacity),
        );
        if ((ops.length === 0 || Math.max(...ops) < 0.05) && convergedAt < 0) {
          convergedAt = performance.now() - t1;
          break;
        }
      }
      return { commits, convergedAt: Math.round(convergedAt) };
    });
    await client.send('Emulation.setCPUThrottlingRate', { rate: 1 });

    // all three scenes committed, in order, none skipped
    expect(result.commits, `scenes must cycle 0→1→2 in order (saw ${JSON.stringify(result.commits)})`).toEqual([
      '0',
      '1',
      '2',
    ]);
    // and the wave settled (no strip lit) once input stopped — it does not animate forever
    expect(result.convergedAt, `the wave must go dark after input stops (convergedAt=${result.convergedAt}ms)`).toBeGreaterThanOrEqual(0);
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
