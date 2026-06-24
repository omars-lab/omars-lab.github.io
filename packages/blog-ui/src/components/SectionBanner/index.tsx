import React, {CSSProperties} from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';

/**
 * SectionBanner — a quiet left-accent callout placed under an H2 heading to explain
 * why that cluster of questions matters. Used in "What I Ask Myself" question-set posts.
 *
 * Softer than a Docusaurus admonition (no colored background, no title chip) — it reads
 * as a narrator aside, not a warning or tip. The `why` prop is a 1-2 sentence rationale
 * written by the author for that specific section.
 *
 *   ## Core purpose
 *   <SectionBanner why="Purpose questions force you to articulate the why beneath your daily choices." />
 *   <Question ...>What is the purpose of your life?</Question>
 */
export interface SectionBannerProps {
  why: string;
  className?: string;
  style?: CSSProperties;
}

const SectionBanner: React.FC<SectionBannerProps> = ({why, className, style}) => (
  <div className={clsx(styles.banner, className)} style={style}>
    <p className={styles.text}>{why}</p>
  </div>
);

export default SectionBanner;
