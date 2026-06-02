import React from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';
import {useAuth} from '@site/src/lib/auth';
import {openSignInModal} from '@site/src/components/SignInModal';
import styles from './styles.module.css';

// <Premium> — author-facing INLINE premium wrapper for marking a block within an otherwise
// free doc. Signed-in readers see the children; anonymous readers see a blurred sneak-peek
// with a lock overlay, and clicking opens the sign-in modal.
//
// IMPORTANT — soft vs hard gate:
//   • Whole-doc `premium: true` frontmatter is the HARD gate: the body is encrypted at
//     compile time and never ships in clear (see PremiumGate + rehype-premium-encrypt).
//   • This <Premium> inline wrapper is a SOFT gate: the children ARE in the bundle, just
//     visually blurred until sign-in. Use it for teasers / nudges, NOT for content that
//     must be cryptographically withheld. For must-hide content, make the whole doc
//     premium. (Documented in the manage-premium-content skill.)

function PremiumImpl({children}: {children: React.ReactNode}): React.JSX.Element {
  const {status} = useAuth();
  if (status === 'authenticated') {
    return <>{children}</>;
  }
  const openModal = () => openSignInModal({what: 'This section'});
  return (
    <span
      className={styles.wrap}
      role="button"
      tabIndex={0}
      onClick={openModal}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openModal();
        }
      }}
      aria-label="Premium section — sign in with LinkedIn to unlock">
      <span className={styles.blurred} aria-hidden="true">
        {children}
      </span>
      <span className={styles.overlay}>
        <span className={styles.pill}>
          <span aria-hidden="true">🔒</span> Sign in to unlock
        </span>
      </span>
    </span>
  );
}

export default function Premium({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  // Renders the children (unblurred) during SSR/first paint; the gate applies after the
  // client knows auth state. Acceptable for a SOFT gate (children are in the bundle anyway).
  return (
    <BrowserOnly fallback={<>{children}</>}>
      {() => <PremiumImpl>{children}</PremiumImpl>}
    </BrowserOnly>
  );
}
