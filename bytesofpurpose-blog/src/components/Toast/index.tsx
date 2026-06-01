import React from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';
import styles from './styles.module.css';

// Lightweight, dependency-free toast system (no toast lib in the repo).
//
// Usage:  import {showToast} from '@site/src/components/Toast';
//         showToast('Link copied');           // default
//         showToast('Saved', {icon: '🔖'});
//
// A single <ToastHost/> is mounted app-wide in src/theme/Root.tsx. showToast()
// dispatches a window CustomEvent that the host renders as an iOS-style card that
// slides in from the TOP-RIGHT and auto-dismisses.

export type ToastOptions = {icon?: string; durationMs?: number};

const EVENT = 'bop:toast';

export function showToast(message: string, opts: ToastOptions = {}): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(EVENT, {detail: {message, ...opts}}));
}

type ToastItem = {id: number; message: string; icon?: string; durationMs: number; leaving?: boolean};

function ToastHostImpl(): React.JSX.Element {
  const [items, setItems] = React.useState<ToastItem[]>([]);
  const nextId = React.useRef(1);

  const dismiss = React.useCallback((id: number) => {
    // Mark leaving (triggers slide-out), then remove after the animation.
    setItems((cur) => cur.map((t) => (t.id === id ? {...t, leaving: true} : t)));
    window.setTimeout(() => {
      setItems((cur) => cur.filter((t) => t.id !== id));
    }, 280);
  }, []);

  React.useEffect(() => {
    const onToast = (e: Event) => {
      const detail = (e as CustomEvent).detail || {};
      const id = nextId.current++;
      const durationMs = detail.durationMs ?? 2200;
      setItems((cur) => [...cur, {id, message: detail.message, icon: detail.icon, durationMs}]);
      window.setTimeout(() => dismiss(id), durationMs);
    };
    window.addEventListener(EVENT, onToast as EventListener);
    return () => window.removeEventListener(EVENT, onToast as EventListener);
  }, [dismiss]);

  if (items.length === 0) return <></>;

  return (
    <div className={styles.host} role="status" aria-live="polite">
      {items.map((t) => (
        <div
          key={t.id}
          className={t.leaving ? `${styles.toast} ${styles.leaving}` : styles.toast}
          onClick={() => dismiss(t.id)}>
          {t.icon && <span className={styles.icon}>{t.icon}</span>}
          <span className={styles.message}>{t.message}</span>
        </div>
      ))}
    </div>
  );
}

// Toasts are client-only (they react to runtime events); guard SSR.
export default function ToastHost(): React.JSX.Element {
  return <BrowserOnly>{() => <ToastHostImpl />}</BrowserOnly>;
}
