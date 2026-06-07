import React, { CSSProperties, ReactNode, useRef } from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';

// A single card in the carousel. If `href` is set the whole card is a link.
export interface CarouselItem {
  title: string;
  description?: string;
  meta?: string; // small footer text, e.g. a domain or a label
  href?: string;
}

export interface CarouselCardProps {
  title: string;
  description?: string;
  meta?: ReactNode;
  href?: string;
  className?: string;
  style?: CSSProperties;
}

// Exposed so authors can compose custom cards if the simple `items` API
// isn't enough.
export const CarouselCard: React.FC<CarouselCardProps> = ({
  title,
  description,
  meta,
  href,
  className,
  style,
}) => {
  const content = (
    <>
      <span className={styles.cardTitle}>{title}</span>
      {description ? (
        <span className={styles.cardDescription}>{description}</span>
      ) : null}
      {meta ? <span className={styles.cardMeta}>{meta}</span> : null}
    </>
  );

  if (href) {
    return (
      <a
        className={clsx(styles.card, styles.cardLink, className)}
        style={style}
        href={href}
        target={href.startsWith('http') ? '_blank' : undefined}
        rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
      >
        {content}
      </a>
    );
  }

  return (
    <div className={clsx(styles.card, className)} style={style}>
      {content}
    </div>
  );
};

export interface CarouselProps {
  // Simple data-driven API
  items?: CarouselItem[];
  // Or compose CarouselCard children directly
  children?: ReactNode;
  // Show prev/next scroll buttons (default true)
  controls?: boolean;
  className?: string;
  style?: CSSProperties;
}

// A dependency-free, horizontally-scrollable row of cards built on CSS
// scroll-snap. Pass `items` for the common case, or `children` (CarouselCard)
// for full control.
const Carousel: React.FC<CarouselProps> = ({
  items,
  children,
  controls = true,
  className,
  style,
}) => {
  const trackRef = useRef<HTMLDivElement>(null);

  const scrollBy = (dir: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    // Scroll by ~80% of the visible width so a card always stays in view.
    track.scrollBy({ left: dir * track.clientWidth * 0.8, behavior: 'smooth' });
  };

  return (
    <div className={clsx(styles.carousel, className)} style={style}>
      {controls ? (
        <div className={styles.controls}>
          <button
            type="button"
            className={styles.control}
            aria-label="Scroll left"
            onClick={() => scrollBy(-1)}
          >
            ‹
          </button>
          <button
            type="button"
            className={styles.control}
            aria-label="Scroll right"
            onClick={() => scrollBy(1)}
          >
            ›
          </button>
        </div>
      ) : null}
      <div className={styles.track} ref={trackRef}>
        {items
          ? items.map((item, i) => <CarouselCard key={i} {...item} />)
          : children}
      </div>
    </div>
  );
};

export default Carousel;
