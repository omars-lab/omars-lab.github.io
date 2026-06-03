import React from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';
import {useAuth, signIn, signOut, type AuthUser} from '@site/src/lib/auth';
import styles from './styles.module.css';

// Navbar auth control: a "Sign in with LinkedIn" button when anonymous, a
// profile avatar + dropdown (email · sign out) when signed in. Registered as
// the custom navbar item type 'custom-auth' (see
// src/theme/NavbarItem/ComponentTypes.tsx) and placed position:'right' in
// docusaurus.config.js so it sits next to the color-mode toggle.
//
// Wrapped in <BrowserOnly> because it depends on the client-only AuthProvider
// (which fetches /api/me); during SSR/first paint we render a stable
// placeholder so the navbar layout doesn't jump. Degrades gracefully when
// /api/* is unreachable (localhost / Worker down) → stays the "Sign in" button.

function initials(user: AuthUser): string {
  const source = user.name || user.email || '';
  const parts = source.split(/[\s@._-]+/).filter(Boolean);
  const letters = (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '');
  return (letters || source[0] || '?').toUpperCase();
}

function SignInButton(): React.JSX.Element {
  return (
    <button
      type="button"
      className={styles.signIn}
      onClick={() => signIn()}
      aria-label="Sign in with LinkedIn">
      <span className={styles.signInIcon} aria-hidden="true">
        in
      </span>
      <span className={styles.signInLabel}>Sign in</span>
    </button>
  );
}

function ProfileMenu({user}: {user: AuthUser}): React.JSX.Element {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return undefined;
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className={styles.profile} ref={ref}>
      <button
        type="button"
        className={styles.avatarButton}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Signed in as ${user.email}`}>
        {user.picture ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className={styles.avatarImg} src={user.picture} alt="" />
        ) : (
          <span className={styles.avatarInitials} aria-hidden="true">
            {initials(user)}
          </span>
        )}
      </button>
      {open && (
        <div className={styles.dropdown} role="menu">
          <div className={styles.dropdownEmail} title={user.email}>
            {user.email}
          </div>
          <button
            type="button"
            className={styles.dropdownItem}
            role="menuitem"
            onClick={() => signOut()}>
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

function AuthControl(): React.JSX.Element {
  const {status, user} = useAuth();
  // While the single /api/me probe is in flight, show the Sign in button (the
  // common case is anonymous, and it avoids a layout-jumping spinner). When the
  // probe resolves to authenticated we swap to the avatar.
  if (status === 'authenticated' && user) {
    return <ProfileMenu user={user} />;
  }
  return <SignInButton />;
}

export default function AuthNavbarItem(): React.JSX.Element {
  // The stable `navbarAuthItem` class lets custom.css order this AFTER the color-mode
  // toggle in the navbar-right cluster (toggle on the left, profile/sign-in on the right).
  return (
    <span className="navbarAuthItem">
      <BrowserOnly fallback={<span className={styles.placeholder} aria-hidden="true" />}>
        {() => <AuthControl />}
      </BrowserOnly>
    </span>
  );
}
