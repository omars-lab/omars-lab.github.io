import React, {useCallback, useEffect, useRef, useState} from 'react';
import {ErrorCauseBoundary} from '@docusaurus/theme-common';
import NavbarItem from '@theme/NavbarItem';
import {computeVisibleCount} from './overflowFit';
import styles from './styles.module.css';

// Priority+ navbar: keep the left items on ONE line, and when they don't all fit, fold the
// RIGHTMOST ones into a "More ▾" dropdown. Order is preserved (leftmost = highest priority,
// stays inline longest), so a user still sees the primary destinations and reaches the rest in
// one click; instead of the whole nav collapsing to the mobile hamburger the moment it's tight.
//
// SSR-SAFE: the FIRST render (server + hydration) renders EVERY item inline, identical to
// upstream, so there's no hydration mismatch and the nav works with JS off. Only AFTER mount do
// we measure widths and fold; a client-only enhancement. A ResizeObserver re-folds on width
// changes (resize, zoom, font/emoji reflow).

type Item = {label?: string; [k: string]: unknown};

// The pure greedy fit (computeVisibleCount) lives in ./overflowFit so it can be unit-tested without
// loading React / the Docusaurus theme. Re-export for anything importing it from here historically.
export {computeVisibleCount} from './overflowFit';

// One item wrapped in the upstream error boundary (a bad item can't crash the whole nav).
function SafeItem({item, isDropdownItem}: {item: Item; isDropdownItem?: boolean}) {
  return (
    <ErrorCauseBoundary
      onError={(error) =>
        new Error(
          `A theme navbar item failed to render.\n${JSON.stringify(item, null, 2)}`,
          {cause: error},
        )
      }>
      <NavbarItem {...(item as any)} {...(isDropdownItem ? {isDropdownItem: true} : {})} />
    </ErrorCauseBoundary>
  );
}

export default function NavbarItemsOverflow({items}: {items: Item[]}): React.JSX.Element {
  // How many leading items render inline; the rest fold into "More". Start with ALL inline (=
  // items.length) so SSR + first client render match upstream exactly.
  const [visibleCount, setVisibleCount] = useState(items.length);
  const [mounted, setMounted] = useState(false);

  // Refs to the live containers we measure against.
  const rowRef = useRef<HTMLDivElement | null>(null); // the visible inline row (available width)
  const measureRef = useRef<HTMLDivElement | null>(null); // the hidden full-width copy
  const moreWidthRef = useRef<number>(0); // measured width of the "More" trigger (reserve it)

  // Measure each item's natural width from the hidden copy, then greedily fit as many as possible
  // into the AVAILABLE width and fold the rest. The available width is the space the left group
  // has WITHOUT pushing the right group off; i.e. the navbar inner width minus the logo/toggle
  // that precede us and minus the right group. (We can't use the overflow row's own clientWidth:
  // it's a content-sized flex child that grows to fit, so it would always report "everything
  // fits". We compute the real budget from navbar geometry instead.)
  const compute = useCallback(() => {
    const row = rowRef.current;
    const measure = measureRef.current;
    if (!row || !measure) return;

    // Below the mobile breakpoint the inline items are display:none (Infima); don't fold.
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 996px)').matches) {
      setVisibleCount(items.length);
      return;
    }

    const inner = row.closest('.navbar__inner') as HTMLElement | null;
    const leftContainer = row.closest('.navbar__items') as HTMLElement | null;
    const rightContainer = inner?.querySelector('.navbar__items--right') as HTMLElement | null;
    if (!inner || !leftContainer) return;

    // Space already spent by things in the LEFT container that are NOT our overflow row (the logo
    // and the mobile-sidebar toggle sit before us). EXCLUDE our own overflow row AND the hidden
    // measurement copy (it's absolutely-positioned but still reports a full-width rect, so counting
    // it would blow up the budget). Only IN-FLOW siblings count.
    let leftSiblings = 0;
    for (const child of Array.from(leftContainer.children)) {
      if (child === row || child === measure) continue;
      const el = child as HTMLElement;
      // skip absolutely-positioned / out-of-flow nodes (they don't consume row width)
      if (getComputedStyle(el).position === 'absolute') continue;
      leftSiblings += el.getBoundingClientRect().width;
    }
    const rightW = rightContainer ? rightContainer.getBoundingClientRect().width : 0;
    const GAP = 24; // breathing room so items never butt against the right group

    const avail = inner.clientWidth - leftSiblings - rightW - GAP;
    const widths = Array.from(measure.children).map(
      (c) => (c as HTMLElement).getBoundingClientRect().width,
    );
    const reserve = moreWidthRef.current || 90; // More-trigger width (fallback until measured)
    setVisibleCount(computeVisibleCount(widths, Math.max(0, avail), reserve));
  }, [items.length]);

  // Client-only enhancement: after the component mounts (the measure ruler + real navbar geometry
  // now exist), fold once and re-fold on every width change. One effect, runs on mount + whenever
  // `compute` changes (item set). No `mounted` gate needed: effects only run on the client, so the
  // SSR/first-hydration render already showed all items inline before this fires.
  useEffect(() => {
    setMounted(true);
    let raf = 0;
    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(compute);
    };
    // Fold IMMEDIATELY (synchronously in the effect), not only via rAF: in React StrictMode the
    // effect mounts, cleans up (cancelling the scheduled rAF), then re-mounts, so a fold that lived
    // only in the rAF could be cancelled and never fire. The immediate call guarantees the first
    // fold; the rAF then coalesces subsequent width-change recomputes.
    compute();
    schedule();
    const ro = new ResizeObserver(schedule);
    const inner = rowRef.current?.closest('.navbar__inner');
    if (inner) ro.observe(inner);
    else if (rowRef.current) ro.observe(rowRef.current);
    window.addEventListener('resize', schedule);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('resize', schedule);
    };
  }, [compute]);

  const visible = items.slice(0, visibleCount);
  const overflow = items.slice(visibleCount);

  // The "More ▾" trigger is a synthetic dropdown navbar item, rendered through the SAME
  // @theme/NavbarItem so it inherits the site's dropdown styling + click-outside + keyboard.
  const moreItem: Item = {
    type: 'dropdown',
    label: 'More',
    items: overflow.map((it) => ({...it})),
  };

  return (
    <>
      {/* The visible inline row (measured for available width). */}
      <div ref={rowRef} className={styles.overflowRow}>
        {visible.map((item, i) => (
          <SafeItem key={i} item={item} />
        ))}
        {mounted && overflow.length > 0 && (
          <div ref={(el) => { moreWidthRef.current = el?.getBoundingClientRect().width || moreWidthRef.current; }}
               className={styles.moreDropdown}>
            <SafeItem item={moreItem} />
          </div>
        )}
      </div>

      {/* Hidden full-width copy: the ruler we measure every item against. Rendered ALWAYS (it's
          visibility:hidden + position:absolute, so it's inert and out-of-flow in SSR and client
          alike) so real item widths are available on the very first post-mount measure (no race
          waiting for a second render). */}
      <div ref={measureRef} className={styles.measure} aria-hidden="true">
        {items.map((item, i) => (
          <SafeItem key={i} item={item} />
        ))}
      </div>
    </>
  );
}
