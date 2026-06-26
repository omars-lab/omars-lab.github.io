import React, {ReactNode} from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';

/**
 * Focus — mark the powerful word(s) in a <Quote> so they draw the eye. By default the word looks
 * normal; when the reader HOVERS the quote, a colored highlight underline SWEEPS in left-to-right
 * under each focus word, pulling attention to the parts worth focusing on.
 *
 *   <Quote source="Will Durant">
 *     We are what we <Focus>repeatedly do</Focus>. Excellence, then, is not an act, but a <Focus>habit</Focus>.
 *   </Quote>
 *
 * The sweep is driven by the parent .quote:hover (see styles.module.css), so hovering anywhere on
 * the quote animates ALL its focus words together. Respects prefers-reduced-motion: with motion
 * reduced, the highlight is shown statically (full, no animation) so the emphasis still reads.
 */
export interface FocusProps {
  children: ReactNode;
  className?: string;
}

const Focus: React.FC<FocusProps> = ({children, className}) => {
  return <span className={clsx(styles.focus, className)}>{children}</span>;
};

export default Focus;
