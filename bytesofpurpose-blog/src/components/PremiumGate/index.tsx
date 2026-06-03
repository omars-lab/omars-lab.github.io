import React from 'react';
import posthog from 'posthog-js';
import {useAuth, fetchUnlockKey, signIn} from '@site/src/lib/auth';
import {decryptPremium} from '@site/src/lib/premium-crypto';
import {showToast} from '@site/src/components/Toast';
import styles from './styles.module.css';

// Page-level premium gate. The rehype-premium-encrypt plugin REPLACES an encrypted doc's
// body with <PremiumGate payload="/premium/<id>.json" teaser="…" /> at compile time, so
// the plaintext is in neither the HTML nor the JS bundle. This component:
//
//   - Anonymous: a gold "premium / locked" info pane (disclaimer ONLY — no CTA in it),
//     then two CTA cards in the body: (1) sign in with LinkedIn to unlock, (2) ask for
//     this to be made free. Both fire PostHog events.
//   - Signed in: fetches the passphrase (/api/unlock-key) + the encrypted payload, decrypts
//     in-browser (src/lib/premium-crypto, StatiCrypt engine), injects the body HTML.
//
// In DEV / unencrypted builds the plugin no-ops (no STATICRYPT_PASSPHRASE), so premium docs
// render their real body normally and this component never appears. It only exists on pages
// the build actually encrypted — so `payload` is always present here.

type GateState =
  | {phase: 'idle'}
  | {phase: 'unlocking'}
  | {phase: 'unlocked'; html: string}
  | {phase: 'error'};

function currentPath(): string | undefined {
  return typeof window !== 'undefined' ? window.location.pathname : undefined;
}

export default function PremiumGate({
  payload,
  teaser,
}: {
  payload: string;
  teaser?: string;
}): React.JSX.Element {
  const {status} = useAuth();
  const [state, setState] = React.useState<GateState>({phase: 'idle'});
  // Whether the reader has already asked for this to be free this session — flips the
  // request card to a thank-you state so the demand event can't be spammed.
  const [requested, setRequested] = React.useState(false);

  React.useEffect(() => {
    if (status !== 'authenticated') return undefined;
    let cancelled = false;
    setState({phase: 'unlocking'});
    (async () => {
      const [passphrase, payloadRes] = await Promise.all([
        fetchUnlockKey(),
        fetch(payload, {credentials: 'same-origin'}).then((r) => (r.ok ? r.json() : null)),
      ]);
      if (cancelled) return;
      if (!passphrase || !payloadRes) {
        setState({phase: 'error'});
        return;
      }
      const html = await decryptPremium(payloadRes, passphrase);
      if (cancelled) return;
      setState(html ? {phase: 'unlocked', html} : {phase: 'error'});
    })();
    return () => {
      cancelled = true;
    };
  }, [status, payload]);

  if (state.phase === 'unlocked') {
    // The injected HTML is OUR OWN build output (the doc's rendered body), fetched from
    // our origin and integrity-checked by the HMAC inside decryptPremium().
    return <div dangerouslySetInnerHTML={{__html: state.html}} />;
  }

  if (state.phase === 'unlocking') {
    return <p className={styles.status}>Unlocking premium content…</p>;
  }

  // Sign-in CTA: navigate to the LinkedIn flow + record the click as an intent signal.
  const onSignIn = () => {
    posthog.capture('premium_signin_click', {path: currentPath()});
    signIn();
  };

  // "Make this free" CTA: a demand signal for un-gating (NOT an unlock). Idempotent per
  // session via `requested`. Reuses the existing premium_interest event name so the
  // signed-out gate and the modal aggregate into one funnel.
  const onRequestFree = () => {
    if (requested) return;
    posthog.capture('premium_interest', {path: currentPath(), source: 'gate_card'});
    setRequested(true);
    showToast('Noted — thanks for the nudge!', {icon: '🙌'});
  };

  const failed = state.phase === 'error';

  return (
    <div className={styles.wrap}>
      {/* Disclaimer-only info pane — gold, says ONLY that this is premium/locked. */}
      <aside className={styles.notice} role="note">
        <span className={styles.noticeLock} aria-hidden="true">
          🔒
        </span>
        <div>
          <p className={styles.noticeTitle}>Premium content</p>
          <p className={styles.noticeBody}>
            {teaser
              ? teaser
              : 'The rest of this page is premium — sign in to read it.'}
          </p>
        </div>
      </aside>

      {/* Two CTA cards. */}
      <div className={styles.cards}>
        <div className={styles.card}>
          <span className={styles.cardIcon} aria-hidden="true">
            🔓
          </span>
          <h3 className={styles.cardTitle}>Unlock with LinkedIn</h3>
          <p className={styles.cardText}>
            Sign in with LinkedIn to read the rest. It’s free — the gate is just a friendly
            way to say hi.
          </p>
          <button type="button" className={styles.cardCtaPrimary} onClick={onSignIn}>
            <span className={styles.inMark} aria-hidden="true">
              in
            </span>
            Sign in with LinkedIn
          </button>
          {failed ? (
            <p className={styles.cardHint}>
              Couldn’t unlock just yet — signing in again should do it.
            </p>
          ) : null}
        </div>

        <div className={styles.card}>
          <span className={styles.cardIcon} aria-hidden="true">
            🙌
          </span>
          <h3 className={styles.cardTitle}>Rather it were free?</h3>
          <p className={styles.cardText}>
            Tell me you’d like this opened up — enough nudges and I’ll un-gate it. No sign-in
            needed.
          </p>
          <button
            type="button"
            className={styles.cardCtaSecondary}
            onClick={onRequestFree}
            disabled={requested}>
            {requested ? 'Thanks for the nudge! 🙌' : 'Ask me to make this free'}
          </button>
        </div>
      </div>
    </div>
  );
}
