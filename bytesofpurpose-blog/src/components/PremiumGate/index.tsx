import React from 'react';
import {useAuth, fetchUnlockKey} from '@site/src/lib/auth';
import {decryptPremium} from '@site/src/lib/premium-crypto';
import {openSignInModal} from '@site/src/components/SignInModal';
import styles from './styles.module.css';

// Page-level premium gate. The rehype-premium-encrypt plugin REPLACES an encrypted doc's
// body with <PremiumGate payload="/premium/<id>.json" teaser="…" /> at compile time, so
// the plaintext is in neither the HTML nor the JS bundle. This component:
//
//   - Anonymous: shows the teaser + a lock; clicking opens the sign-in modal.
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

export default function PremiumGate({
  payload,
  teaser,
}: {
  payload: string;
  teaser?: string;
}): React.JSX.Element {
  const {status} = useAuth();
  const [state, setState] = React.useState<GateState>({phase: 'idle'});

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

  // Anonymous / unlock failed: teaser + lock; click → sign-in modal.
  const openModal = () => openSignInModal({what: 'This content'});
  return (
    <div
      className={styles.gate}
      role="button"
      tabIndex={0}
      onClick={openModal}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openModal();
        }
      }}>
      {teaser ? <p className={styles.teaser}>{teaser}</p> : null}
      <div className={styles.lockRow}>
        <span className={styles.lockIcon} aria-hidden="true">
          🔒
        </span>
        <span className={styles.lockLabel}>
          {state.phase === 'error'
            ? 'Couldn’t unlock just yet — sign in with LinkedIn to read the rest.'
            : 'Sign in with LinkedIn to read the rest →'}
        </span>
      </div>
    </div>
  );
}
