import React from 'react';
import styles from './styles.module.css';

/**
 * Controls — live specimens of the brand's action controls and small UI chips, rendered from the
 * REPO's real Infima button classes and design tokens (not a copy), so the Buttons and Core
 * Components pages show what the site actually ships in light and dark.
 */

/** A row wrapper for button specimens. */
export function ButtonRow({children}: {children: React.ReactNode}): React.JSX.Element {
  return <div className={styles.buttonRow}>{children}</div>;
}

/** A row wrapper for chip specimens (tags / badges). */
export function ChipRow({children}: {children: React.ReactNode}): React.JSX.Element {
  return <div className={styles.chipRow}>{children}</div>;
}

/**
 * DemoButton — a specimen button using the site's real Infima classes. `variant` maps to the
 * shipping classes; `premium` is composed from the real --premium-gold* tokens (the repo has the
 * gold palette but no ready-made premium button class, so this is labeled honestly on the page).
 */
export interface DemoButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'premium';
  size?: 'sm' | 'md' | 'lg';
  iconLeft?: string;
  iconRight?: string;
  children: React.ReactNode;
}

export function DemoButton({
  variant = 'primary',
  size = 'md',
  iconLeft,
  iconRight,
  children,
}: DemoButtonProps): React.JSX.Element {
  if (variant === 'premium') {
    return (
      <span className={styles.premiumButton}>
        {iconLeft && <span aria-hidden="true">{iconLeft}</span>}
        {children}
        {iconRight && <span aria-hidden="true">{iconRight}</span>}
      </span>
    );
  }
  const variantClass =
    variant === 'secondary'
      ? 'button--secondary button--outline'
      : variant === 'ghost'
      ? 'button--link'
      : 'button--primary';
  const sizeClass = size === 'md' ? '' : ` button--${size}`;
  return (
    <button type="button" className={`button ${variantClass}${sizeClass}`}>
      {iconLeft && <span aria-hidden="true">{iconLeft} </span>}
      {children}
      {iconRight && <span aria-hidden="true"> {iconRight}</span>}
    </button>
  );
}

/** A pastel tag pill — the one correct use of a pastel (fill with --tea-ink on top). */
export function DemoTag({
  color = 'mint',
  children,
}: {
  color?: 'pink' | 'mint' | 'green';
  children: React.ReactNode;
}): React.JSX.Element {
  const fill =
    color === 'pink' ? styles.tagPink : color === 'green' ? styles.tagGreen : styles.tagMint;
  return <span className={`${styles.tagPill} ${fill}`}>{children}</span>;
}

/** A small status badge (green accent, or gold for premium). */
export function DemoBadge({
  gold = false,
  children,
}: {
  gold?: boolean;
  children: React.ReactNode;
}): React.JSX.Element {
  return <span className={`${styles.badge} ${gold ? styles.badgeGold : ''}`}>{children}</span>;
}

/** A callout / admonition specimen (green wash + primary left rule, or gold for premium). */
export function DemoCallout({
  title,
  gold = false,
  children,
}: {
  title: string;
  gold?: boolean;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <div className={`${styles.callout} ${gold ? styles.calloutGold : ''}`}>
      <div className={styles.calloutTitle}>{title}</div>
      <div className={styles.calloutBody}>{children}</div>
    </div>
  );
}
