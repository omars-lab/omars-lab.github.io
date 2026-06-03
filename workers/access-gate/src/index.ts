/**
 * access-gate — Cloudflare Worker behind a Cloudflare Access application.
 *
 * Two GET endpoints, both reachable only through the Access app (an
 * unauthenticated request is 302'd to LinkedIn by Access before this code
 * even runs — so the JWT below is belt-and-suspenders, not the only gate):
 *
 *   GET /api/me          → { email, name?, picture?, isInternal }  (identity + analytics flag)
 *   GET /api/unlock-key  → { passphrase }                (the StatiCrypt key-vend)
 *
 * The hard gate for premium content: /api/unlock-key returns the single
 * PREMIUM_PASSPHRASE secret ONLY to a request carrying a valid Access JWT
 * (a signed-in LinkedIn user). The client uses it to decrypt the build-time
 * ciphertext in the page bundle. See the premium-content-gating system design.
 *
 * JWT validation: every Access request carries `Cf-Access-Jwt-Assertion`. We
 * verify it against the team JWKS (https://<team>.cloudflareaccess.com/cdn-cgi/
 * access/certs) and assert `aud` contains POLICY_AUD (the Access app's AUD tag).
 */
import {
  createRemoteJWKSet,
  jwtVerify,
  type JWTPayload,
  type JWTVerifyGetKey,
} from 'jose';

export interface Env {
  /** Team domain, e.g. "myteam.cloudflareaccess.com" (no scheme). */
  TEAM_DOMAIN: string;
  /** The Access application AUD tag (from `cf_access.py create-gated-app`). */
  POLICY_AUD: string;
  /** The StatiCrypt passphrase the site uses to decrypt premium bodies. */
  PREMIUM_PASSPHRASE: string;
  /**
   * TEST SEAM ONLY. When set, this key resolver is used instead of the remote
   * team JWKS. Lets the test suite inject a locally-minted keyset without
   * reaching the network. Never populated in production (no var/secret feeds
   * it); production always builds the remote set from TEAM_DOMAIN.
   */
  __jwksResolver?: JWTVerifyGetKey;
}

// The single origin allowed to call these endpoints with credentials.
const ALLOWED_ORIGIN = 'https://blog.bytesofpurpose.com';

// Internal-tester roster for analytics filtering. Lives HERE (server-side) — not
// in the public site bundle — so author/tester emails never ship to readers and
// the `isInternal` flag is server-authoritative (the client can't spoof it). This
// replaces the old src/internal-testers.ts (which leaked these emails in main.*.js).
// To make it fully out-of-source later, read env.INTERNAL_EMAILS (a comma list) and
// merge — kept as a const for now so the roster is review-tracked in git.
const INTERNAL_EMAILS: ReadonlyArray<string> = ['omar_eid21@yahoo.com'];

function isInternalEmail(email: string): boolean {
  const e = email.toLowerCase();
  return INTERNAL_EMAILS.some((x) => x.toLowerCase() === e);
}

// Cache the JWKS keyset across requests in the same isolate (jose memoizes the
// remote fetch + respects cache headers). Keyed by team domain.
let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;
let jwksTeam: string | null = null;

function getJWKS(teamDomain: string) {
  if (!jwks || jwksTeam !== teamDomain) {
    jwks = createRemoteJWKSet(
      new URL(`https://${teamDomain}/cdn-cgi/access/certs`),
    );
    jwksTeam = teamDomain;
  }
  return jwks;
}

function corsHeaders(_req: Request): Record<string, string> {
  // The site is served from exactly one origin, so we always advertise that single
  // origin (credentials mode forbids "*"). A browser request from any OTHER origin
  // is rejected by the browser's own CORS check, since this value won't match its
  // Origin; same-origin and non-browser callers (the dev service-token proxy) are
  // unaffected. The real security boundary is the Access JWT below — CORS is not it.
  // `Vary: Origin` is kept so caches don't reuse this across origins if that ever
  // changes.
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
  };
}

function json(
  body: unknown,
  status: number,
  req: Request,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      ...corsHeaders(req),
    },
  });
}

/**
 * Validate the Access JWT. Returns the verified payload, or null if missing /
 * invalid / wrong audience.
 */
async function verifyAccessJwt(
  req: Request,
  env: Env,
): Promise<JWTPayload | null> {
  const token =
    req.headers.get('Cf-Access-Jwt-Assertion') ||
    // fallback: the httpOnly cookie Access sets
    (req.headers.get('Cookie') || '')
      .split(';')
      .map((c) => c.trim())
      .find((c) => c.startsWith('CF_Authorization='))
      ?.slice('CF_Authorization='.length);

  if (!token) return null;

  try {
    const resolver = env.__jwksResolver ?? getJWKS(env.TEAM_DOMAIN);
    const {payload} = await jwtVerify(token, resolver, {
      issuer: `https://${env.TEAM_DOMAIN}`,
      audience: env.POLICY_AUD,
    });
    return payload;
  } catch {
    return null;
  }
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);

    if (req.method === 'OPTIONS') {
      return new Response(null, {status: 204, headers: corsHeaders(req)});
    }
    if (req.method !== 'GET') {
      return json({error: 'method_not_allowed'}, 405, req);
    }

    // A valid Access JWT means the caller was admitted by an Access policy —
    // either a LinkedIn-identity user OR a non-identity service token (the
    // dev/localhost auth path). This is sufficient to vend the unlock key.
    const payload = await verifyAccessJwt(req, env);
    if (!payload) return json({error: 'unauthorized'}, 401, req);

    if (url.pathname === '/api/unlock-key') {
      // No email required — the key isn't tied to a person. Any admitted caller
      // (LinkedIn user or the dev service token) may decrypt premium content.
      return json({passphrase: env.PREMIUM_PASSPHRASE}, 200, req);
    }

    if (url.pathname === '/api/me') {
      // /api/me reports the signed-in identity, so it DOES need an email claim.
      // Service tokens have none (they're non-identity) → 401 no_email, which is
      // correct: the dev proxy uses /api/unlock-key, not /api/me, for identity.
      const email =
        (payload.email as string | undefined) ||
        (payload['custom'] as {email?: string} | undefined)?.email;
      if (!email) return json({error: 'no_email'}, 401, req);
      return json(
        {
          email,
          name: (payload.name as string | undefined) ?? undefined,
          picture: (payload.picture as string | undefined) ?? undefined,
          // Server-authoritative analytics flag — the client registers is_internal
          // from THIS, so the roster + emails stay off the public bundle.
          isInternal: isInternalEmail(email),
        },
        200,
        req,
      );
    }

    return json({error: 'not_found'}, 404, req);
  },
};
