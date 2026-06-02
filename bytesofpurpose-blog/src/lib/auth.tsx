import React from 'react';
import {showToast} from '@site/src/components/Toast';

// Shared auth context for the LinkedIn-via-Cloudflare-Access sign-in.
//
// ONE place fetches /api/me (the Worker behind Access that validates the
// Access JWT and returns the signed-in identity). The navbar control, the
// premium page gate, the <Premium> block, and the sign-in modal all read the
// result through useAuth() instead of each firing their own request.
//
// Graceful degradation is the contract: on localhost there is no Worker (the
// dev server answers /api/me with the SPA fallback HTML → r.json() throws),
// and anonymous visitors get a 401 (Access redirects before the Worker runs).
// Either way we resolve to {status:'anonymous'} and the UI shows the signed-out
// affordances. Nothing here ever throws into the React tree.
//
// Cloudflare Access entry/exit points (no password, no custom backend):
//   sign in  → hitting any /api/* path triggers the Access → LinkedIn redirect.
//   sign out → /cdn-cgi/access/logout clears the CF_Authorization cookie.

export const ACCESS_LOGIN_PATH = '/api/me';
export const ACCESS_LOGOUT_PATH = '/cdn-cgi/access/logout';

/**
 * True when there is no Cloudflare Worker to talk to — i.e. local dev. On
 * localhost the dev server answers /api/* with the SPA-fallback HTML, so
 * navigating to the Access login path is a dead end (it never reaches LinkedIn).
 * signIn() uses this to show an explanatory toast instead of a broken redirect.
 */
export function isApiUnreachable(): boolean {
  if (typeof window === 'undefined') return true;
  const h = window.location.hostname;
  return (
    h === 'localhost' ||
    h === '127.0.0.1' ||
    h === '0.0.0.0' ||
    h === '[::1]' ||
    h.endsWith('.local')
  );
}

export interface AuthUser {
  email: string;
  /** OIDC `picture` claim if LinkedIn returns it; may be absent. */
  picture?: string;
  /** OIDC `name` claim if present; used for the avatar fallback initials. */
  name?: string;
}

export type AuthStatus = 'loading' | 'anonymous' | 'authenticated';

export interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;
}

const AuthContext = React.createContext<AuthState>({
  status: 'loading',
  user: null,
});

/**
 * Begin the Cloudflare Access → LinkedIn sign-in flow. Navigating to a gated
 * /api/* path makes Access 302 to LinkedIn, then return the reader here with a
 * CF_Authorization cookie set. `next` is where to land after auth completes.
 */
export function signIn(next: string = typeof window !== 'undefined'
  ? window.location.pathname + window.location.search
  : '/'): void {
  if (typeof window === 'undefined') return;
  // In local dev there is no Worker/Access in front of /api/*, so the redirect
  // would dead-end on the SPA-fallback HTML. Explain instead of navigating away.
  if (isApiUnreachable()) {
    showToast('Sign-in works on the live site, not localhost.', {icon: '🔒'});
    return;
  }
  // redirect_url is honoured by Access on the way back from the IdP.
  const url = `${ACCESS_LOGIN_PATH}?redirect_url=${encodeURIComponent(next)}`;
  window.location.assign(url);
}

/** Clear the Access session, then return to the current page. */
export function signOut(): void {
  if (typeof window === 'undefined') return;
  window.location.assign(ACCESS_LOGOUT_PATH);
}

/**
 * Fetch /api/me ONCE. Resolves to a user (authenticated) or null (anonymous /
 * localhost / unreachable). Never rejects — every failure mode maps to null.
 */
async function fetchMe(): Promise<AuthUser | null> {
  try {
    const r = await fetch('/api/me', {credentials: 'include'});
    if (!r.ok) return null;
    const ct = r.headers.get('content-type') || '';
    // Localhost dev server answers /api/me with a 200 + SPA-fallback HTML; only
    // trust a JSON response from the real Worker.
    if (!ct.includes('application/json')) return null;
    const data = (await r.json()) as Partial<AuthUser> | null;
    if (!data?.email) return null;
    return {email: data.email, picture: data.picture, name: data.name};
  } catch {
    return null;
  }
}

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const [state, setState] = React.useState<AuthState>({
    status: 'loading',
    user: null,
  });

  React.useEffect(() => {
    let cancelled = false;
    fetchMe().then((user) => {
      if (cancelled) return;
      setState(
        user
          ? {status: 'authenticated', user}
          : {status: 'anonymous', user: null},
      );
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  return React.useContext(AuthContext);
}

/**
 * Fetch the StatiCrypt passphrase the Worker vends at /api/unlock-key (gated by the
 * same Access JWT as /api/me). Resolves to the passphrase for a signed-in reader, or
 * null otherwise (401 / localhost HTML fallback / unreachable). Never throws.
 *
 * The premium page gate + <Premium> blocks call this once they know the reader is
 * authenticated, then hand the passphrase to decryptPremium(). The passphrase is held
 * only in memory for the decrypt — never persisted.
 */
export async function fetchUnlockKey(): Promise<string | null> {
  try {
    const r = await fetch('/api/unlock-key', {credentials: 'include'});
    if (!r.ok) return null;
    const ct = r.headers.get('content-type') || '';
    // The Worker returns the passphrase as JSON {passphrase} (see
    // workers/access-gate/src/index.ts). Localhost answers with the SPA HTML fallback
    // (not JSON) — guard so we never treat HTML as a key.
    if (!ct.includes('application/json')) return null;
    const data = (await r.json()) as {passphrase?: string} | null;
    return data?.passphrase || null;
  } catch {
    return null;
  }
}
