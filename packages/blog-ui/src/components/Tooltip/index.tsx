import React, {CSSProperties, ReactNode, useCallback, useId, useRef, useState} from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';

/**
 * Tooltip — a small, theme-aware hover/focus/tap popover for explaining UI affordances.
 *
 * Built for the Question badges (where "Medium" / "Moderate" mean nothing without context),
 * but generic. Wrap any inline element; `content` is shown on hover, keyboard focus, and tap
 * (touch toggles it). Accessible: the trigger gets aria-describedby pointing at the bubble.
 *
 *   <Tooltip content={<><b>Priority: Medium</b><br/>Moderately foundational.</>}>
 *     <span className="badge">Medium</span>
 *   </Tooltip>
 *
 * Keep `content` short (a label + one sentence). For a full legend, link to the keystone post.
 */
export interface TooltipProps {
  /** What to show in the bubble. A short node: a bolded label + a sentence works best. */
  content: ReactNode;
  children: ReactNode;
  /** Preferred side. Defaults to 'top'; flips are not computed (keep triggers away from edges). */
  placement?: 'top' | 'bottom';
  className?: string;
  style?: CSSProperties;
}

const Tooltip: React.FC<TooltipProps> = ({content, children, placement = 'top', className, style}) => {
  const [open, setOpen] = useState(false);
  const id = useId();
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setOpen(true);
  }, []);
  const hide = useCallback(() => {
    setOpen(false);
  }, []);
  const toggle = useCallback(() => setOpen((o) => !o), []);

  return (
    <span
      className={clsx(styles.wrap, className)}
      style={style}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      onClick={toggle}
      onKeyDown={(e) => {
        if (e.key === 'Escape') hide();
      }}
      tabIndex={0}
      aria-describedby={open ? id : undefined}>
      {children}
      <span
        id={id}
        role="tooltip"
        className={clsx(styles.bubble, styles[placement], open && styles.open)}
        aria-hidden={!open}>
        {content}
      </span>
    </span>
  );
};

export default Tooltip;
