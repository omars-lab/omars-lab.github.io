import React from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';
import posthog from 'posthog-js';
import {signIn} from '@site/src/lib/auth';
import {showToast} from '@site/src/components/Toast';
import styles from './styles.module.css';

// App-wide "Sign in with LinkedIn to unlock" modal, opened from any locked surface
// (a premium page gate, a locked <Premium> block, the navbar). Dependency-free, same
// window-CustomEvent + single-host pattern as the Toast system.
//
// Usage:  import {openSignInModal} from '@site/src/components/SignInModal';
//         openSignInModal({ what: 'this deep-dive' });   // optional context line
//
// A single <SignInModalHost/> is mounted app-wide in src/theme/Root.tsx.

const EVENT = 'bop:signin-modal';

export interface SignInModalOptions {
  /** What the reader is trying to unlock, e.g. "this premium guide". */
  what?: string;
}

export function openSignInModal(opts: SignInModalOptions = {}): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(EVENT, {detail: opts}));
}

function SignInModalImpl(): React.JSX.Element | null {
  const [open, setOpen] = React.useState(false);
  const [what, setWhat] = React.useState<string>('');
  // Whether the reader has already pressed "make this public" this open — flips the
  // button to a thank-you state so they can't fire the event repeatedly.
  const [interested, setInterested] = React.useState(false);

  const close = React.useCallback(() => setOpen(false), []);

  // Register that the reader would rather this content were free/public. Distinct
  // from the LinkedIn sign-in CTA: it's a demand signal for un-gating, not an unlock.
  const registerInterest = React.useCallback(() => {
    posthog.capture('premium_interest', {
      path: typeof window !== 'undefined' ? window.location.pathname : undefined,
      what: what || undefined,
    });
    setInterested(true);
    showToast('Noted — thanks for the nudge!', {icon: '🙌'});
  }, [what]);

  React.useEffect(() => {
    const onOpen = (e: Event) => {
      const detail = (e as CustomEvent).detail || {};
      setWhat(typeof detail.what === 'string' ? detail.what : '');
      setInterested(false);
      setOpen(true);
    };
    window.addEventListener(EVENT, onOpen as EventListener);
    return () => window.removeEventListener(EVENT, onOpen as EventListener);
  }, []);

  React.useEffect(() => {
    if (!open) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, close]);

  if (!open) return null;

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label="Sign in to unlock premium content"
      onClick={close}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className={styles.close}
          aria-label="Dismiss"
          onClick={close}>
          ×
        </button>
        <div className={styles.lock} aria-hidden="true">
          🔒
        </div>
        <h2 className={styles.title}>A purposeful deep-dive</h2>
        <p className={styles.body}>
          {what ? `${what} is ` : 'This piece is '}
          one I put extra care into, so it’s reserved for signed-in readers. Sign in
          with LinkedIn to unlock it — no password, and your email is only used to say
          hello.
        </p>
        <button
          type="button"
          className={styles.cta}
          onClick={() => signIn()}>
          <span className={styles.ctaIcon} aria-hidden="true">
            in
          </span>
          Sign in with LinkedIn to unlock
        </button>
        <button
          type="button"
          className={styles.interest}
          onClick={registerInterest}
          disabled={interested}>
          {interested
            ? '✓ Thanks — I’ll take the hint'
            : 'Or: tell me you’d rather this were free'}
        </button>
        <button type="button" className={styles.dismiss} onClick={close}>
          Maybe later
        </button>
      </div>
    </div>
  );
}

export default function SignInModalHost(): React.JSX.Element {
  return <BrowserOnly>{() => <SignInModalImpl />}</BrowserOnly>;
}
