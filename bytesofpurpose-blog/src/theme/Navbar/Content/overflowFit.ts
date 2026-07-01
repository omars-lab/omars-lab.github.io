/**
 * Pure priority+ fit for the navbar overflow menu. Zero React / theme imports, so it can be
 * unit-tested in isolation (no Docusaurus theme deps to resolve).
 *
 * Given each left item's measured width, the available row width, and the width to reserve for the
 * "More" trigger, return how many LEADING items stay inline. The rest fold into "More".
 *
 * - Everything fits (sum <= available) → all items inline (no More trigger, so no reserve needed).
 * - Otherwise greedily fit leading items within (available - reserve); the rest overflow.
 * - Always keep at least 1 item inline when there IS at least one (never a lonely "More").
 */
export function computeVisibleCount(
  widths: number[],
  available: number,
  reserve: number,
): number {
  const total = widths.reduce((a, b) => a + b, 0);
  if (total <= available) return widths.length;
  let used = 0;
  let count = 0;
  for (let i = 0; i < widths.length; i++) {
    if (used + widths[i] <= available - reserve) {
      used += widths[i];
      count++;
    } else {
      break;
    }
  }
  return Math.max(1, count);
}
