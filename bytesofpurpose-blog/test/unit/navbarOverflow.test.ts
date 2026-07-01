import {computeVisibleCount} from '../../src/theme/Navbar/Content/overflowFit';

/**
 * Unit test for the pure priority+ fit used by the navbar overflow menu. Given each item's measured
 * width, the available row width, and the width reserved for the "More" trigger, computeVisibleCount
 * returns how many LEADING items stay inline (the rest fold into "More"). No DOM needed.
 */
describe('computeVisibleCount (navbar priority+ fit)', () => {
  test('everything fits → all items inline, no reserve consumed', () => {
    const widths = [100, 100, 100]; // sum 300
    expect(computeVisibleCount(widths, 400, 90)).toBe(3);
  });

  test('exact fit (sum === available) still shows all', () => {
    expect(computeVisibleCount([100, 100, 100], 300, 90)).toBe(3);
  });

  test("doesn't fit → greedily fits leading items within (available - reserve)", () => {
    // 5 items @100 = 500 > 420 available. Reserve 90 for More → budget 330 → 3 items (300) fit, 4th
    // (400) would exceed. So 3 inline, 2 overflow.
    expect(computeVisibleCount([100, 100, 100, 100, 100], 420, 90)).toBe(3);
  });

  test('reserve is respected (a larger More trigger folds one more item)', () => {
    // Same widths/available as above but a wider reserve (150) → budget 270 → 2 items fit.
    expect(computeVisibleCount([100, 100, 100, 100, 100], 420, 150)).toBe(2);
  });

  test('variable widths fold at the right boundary', () => {
    // widths sum 1137 (the real navbar), available 849, reserve 90 → budget 759.
    // 82+105+116+114+105+120 = 642 (6 items) fit; +121 = 763 > 759 → stop. Expect 6.
    const widths = [82, 105, 116, 114, 105, 120, 121, 104, 79, 88, 104];
    expect(computeVisibleCount(widths, 849, 90)).toBe(6);
  });

  test('always keeps at least ONE item inline (never a lonely More)', () => {
    // Even absurdly tight: the first item alone exceeds the budget → floor of 1.
    expect(computeVisibleCount([500, 100, 100], 200, 90)).toBe(1);
  });

  test('empty list → zero visible', () => {
    expect(computeVisibleCount([], 400, 90)).toBe(0);
  });
});
