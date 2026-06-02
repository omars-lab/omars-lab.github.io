import React from 'react';

// Shared auth context for the LinkedIn-via-Cloudflare-Access sign-in.
//
// ONE place fetches /api/me (the Worker behind Access that validates the
// Access JWT and returns the signed-in identity). The navbar control, the
// premium page gate, the <Premium> block, and the sign-in modal all read the
// result through useAuth() instead of each firing their own request.
//
// Graceful degradation is the contract: anonymous visitors get a 401 (Access
// redirects before the Worker runs), so we resolve to {status:'anonymous'} and
// the UI shows the signed-out affordances. Nothing here ever throws into the
// React tree.
//
// Dev/prod parity: `make start` proxies localhost/api/* → the real prod Worker
// (plugins/dev-api-proxy), so /api/* is reachable in dev too — no localhost
// special-casing here. Sign in once on https://blog.bytesofpurpose.com so the
// browser holds the CF_Authorization cookie; the proxy forwards it upstream.
//
// Cloudflare Access entry/exit points (no password, no custom backend):
//   sign in  → hitting any /api/* path triggers the Access → LinkedIn redirect.
//   sign out → /cdn-cgi/access/logout clears the CF_Authorization cookie.

export const ACCESS_LOGIN_PATH = '/api/me';
export const ACCESS_LOGOUT_PATH = '/cdn-cgi/access/logout';

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
  // /api/* is reachable in both prod and dev (the dev server proxies it to the
  // real Worker), so navigate unconditionally. redirect_url is honoured by
  // Access on the way back from the IdP.
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
 * unreachable). Never rejects — every failure mode maps to null.
 */
async function fetchMe(): Promise<AuthUser | null> {
  try {
    const r = await fetch('/api/me', {credentials: 'include'});
    if (!r.ok) return null;
    const ct = r.headers.get('content-type') || '';
    // Only trust a JSON response from the real Worker (a non-JSON body would be
    // an unexpected redirect/error page).
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
 * null otherwise (401 / unreachable). Never throws.
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
    // workers/access-gate/src/index.ts) — guard so we never treat a non-JSON
    // body (an unexpected redirect/error page) as a key.
    if (!ct.includes('application/json')) return null;
    const data = (await r.json()) as {passphrase?: string} | null;
    return data?.passphrase || null;
  } catch {
    return null;
  }
}
