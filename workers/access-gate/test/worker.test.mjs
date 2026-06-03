/**
 * Proves the access-gate Worker's JWT gate end-to-end, WITHOUT Cloudflare:
 *   - mint an RS256 JWT with a key we control
 *   - serve its JWKS from a local http server (stands in for the team certs URL)
 *   - point the Worker's Env.TEAM_DOMAIN at that local server
 *   - drive the Worker's fetch() directly and assert the gate:
 *       no token        → 401
 *       valid token     → 200 {email} on /api/me, {passphrase} on /api/unlock-key
 *       wrong audience  → 401
 *       valid but no email claim → 401 no_email
 *
 * Run: node --test  (from workers/access-gate)
 *
 * The Worker fetches the team JWKS over HTTPS in production. jose's Node build
 * fetches via node:https (not globalThis.fetch), so a fetch monkeypatch can't
 * intercept it. Instead we use the Worker's `__jwksResolver` test seam: we mint
 * a keypair, build a LOCAL jose keyset from its public JWK, and inject it. This
 * exercises the REAL jwtVerify + issuer/audience/email checks — only the network
 * fetch of the public certs (not a security boundary) is stubbed.
 */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPair, SignJWT, exportJWK, createLocalJWKSet} from 'jose';

// Import the Worker under test (TS via tsx loader isn't available in plain node,
// so we point at a compiled-on-the-fly copy: node can't import .ts directly.
// We load the source through a tiny esbuild transform at runtime.)
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {build} from 'esbuild';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(__dirname, '..', 'src', 'index.ts');

async function loadWorker() {
  const out = await build({
    entryPoints: [SRC],
    bundle: true,
    format: 'esm',
    // Bundle for Node because the test runs under `node --test`; jose's node
    // runtime needs node builtins resolved. The Worker's own deploy bundle is
    // produced by wrangler (workerd target) — this transform is test-only.
    platform: 'node',
    write: false,
  });
  const code = out.outputFiles[0].text;
  const dataUrl =
    'data:text/javascript;base64,' + Buffer.from(code).toString('base64');
  return (await import(dataUrl)).default;
}

const TEAM = 'faketeam.cloudflareaccess.com';
const ISSUER = `https://${TEAM}`;
const AUD = 'test-access-app-aud-tag';

test('access-gate JWT gate', async (t) => {
  const worker = await loadWorker();
  const {publicKey, privateKey} = await generateKeyPair('RS256');
  const jwk = await exportJWK(publicKey);
  jwk.kid = 'test-key-1';
  jwk.alg = 'RS256';
  jwk.use = 'sig';

  // Local keyset standing in for the remote team JWKS (the public certs aren't
  // a secret; the security boundary is the signature + issuer + aud + email
  // checks, all of which run for real below).
  const __jwksResolver = createLocalJWKSet({keys: [jwk]});

  const env = {
    TEAM_DOMAIN: TEAM,
    POLICY_AUD: AUD,
    PREMIUM_PASSPHRASE: 'super-secret-passphrase',
    __jwksResolver,
  };

  const mint = (claims, aud = AUD) =>
    new SignJWT(claims)
      .setProtectedHeader({alg: 'RS256', kid: 'test-key-1'})
      .setIssuer(ISSUER)
      .setAudience(aud)
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(privateKey);

  const call = (pathname, headers = {}) =>
    worker.fetch(
      new Request(`https://blog.bytesofpurpose.com${pathname}`, {
        method: 'GET',
        headers,
      }),
      env,
    );

  await t.test('no token → 401', async () => {
    const r = await call('/api/me');
    assert.equal(r.status, 401);
  });

  await t.test('valid token → /api/me returns email + isInternal=false for a reader', async () => {
    const jwt = await mint({email: 'reader@example.com', name: 'A Reader'});
    const r = await call('/api/me', {'Cf-Access-Jwt-Assertion': jwt});
    assert.equal(r.status, 200);
    const body = await r.json();
    assert.equal(body.email, 'reader@example.com');
    assert.equal(body.name, 'A Reader');
    assert.equal(body.isInternal, false);
  });

  await t.test('/api/me flags a roster email as isInternal (case-insensitive)', async () => {
    const jwt = await mint({email: 'Omar_Eid21@YAHOO.com'});
    const r = await call('/api/me', {'Cf-Access-Jwt-Assertion': jwt});
    assert.equal(r.status, 200);
    const body = await r.json();
    assert.equal(body.isInternal, true);
  });

  await t.test('valid token → /api/unlock-key vends the passphrase', async () => {
    const jwt = await mint({email: 'reader@example.com'});
    const r = await call('/api/unlock-key', {'Cf-Access-Jwt-Assertion': jwt});
    assert.equal(r.status, 200);
    const body = await r.json();
    assert.equal(body.passphrase, 'super-secret-passphrase');
  });

  await t.test('wrong audience → 401', async () => {
    const jwt = await mint({email: 'reader@example.com'}, 'some-other-aud');
    const r = await call('/api/unlock-key', {'Cf-Access-Jwt-Assertion': jwt});
    assert.equal(r.status, 401);
  });

  await t.test('valid signature but no email claim → /api/me 401', async () => {
    const jwt = await mint({sub: 'no-email-here'});
    const r = await call('/api/me', {'Cf-Access-Jwt-Assertion': jwt});
    assert.equal(r.status, 401);
    const body = await r.json();
    assert.equal(body.error, 'no_email');
  });

  // Service tokens are non-identity (no email claim). They are admitted by the
  // /api/* app's Service Auth policy (the dev/localhost auth path), and MUST be
  // able to vend the unlock key even though they can't use /api/me.
  await t.test('no email claim (service token) → /api/unlock-key still vends', async () => {
    const jwt = await mint({sub: 'service-token', common_name: 'blog-dev'});
    const r = await call('/api/unlock-key', {'Cf-Access-Jwt-Assertion': jwt});
    assert.equal(r.status, 200);
    const body = await r.json();
    assert.equal(body.passphrase, 'super-secret-passphrase');
  });

  await t.test('token via CF_Authorization cookie also works', async () => {
    const jwt = await mint({email: 'cookie@example.com'});
    const r = await call('/api/me', {Cookie: `CF_Authorization=${jwt}`});
    assert.equal(r.status, 200);
    const body = await r.json();
    assert.equal(body.email, 'cookie@example.com');
  });

  // ---- /api/redirect: the post-sign-in bounce (authenticated-only 303) ----------

  // Helper: build /api/redirect?redirect_url=<raw> with a valid token, return Response.
  const redirectCall = async (rawRedirect, headers) => {
    const qs =
      rawRedirect === undefined
        ? ''
        : `?redirect_url=${encodeURIComponent(rawRedirect)}`;
    return call(`/api/redirect${qs}`, headers);
  };

  await t.test('/api/redirect 303s an authed nav to a safe same-origin path', async () => {
    const jwt = await mint({email: 'reader@example.com'});
    const r = await redirectCall('/craft/premium-gating-demo', {
      'Cf-Access-Jwt-Assertion': jwt,
    });
    assert.equal(r.status, 303);
    assert.equal(
      r.headers.get('Location'),
      'https://blog.bytesofpurpose.com/craft/premium-gating-demo',
    );
    // never cache an auth-dependent redirect
    assert.equal(r.headers.get('Cache-Control'), 'no-store');
  });

  await t.test('/api/redirect requires auth — no token → 401, no Location', async () => {
    const r = await redirectCall('/craft/premium-gating-demo');
    assert.equal(r.status, 401);
    assert.equal(r.headers.get('Location'), null);
  });

  // Open-redirect / header-injection attempts must all collapse to '/'.
  const OPEN_REDIRECT_ATTEMPTS = [
    ['absolute https URL', 'https://evil.com/phish'],
    ['protocol-relative', '//evil.com'],
    ['encoded protocol-relative', '%2F%2Fevil.com'],
    ['backslash trick', '/\\evil.com'],
    ['javascript scheme', '/javascript:alert(1)'],
    ['no leading slash', 'evil.com'],
    ['CRLF header split', '/ok%0d%0aSet-Cookie:+x=1'],
    ['empty', ''],
  ];
  for (const [label, attempt] of OPEN_REDIRECT_ATTEMPTS) {
    await t.test(`/api/redirect blocks open-redirect: ${label}`, async () => {
      const jwt = await mint({email: 'reader@example.com'});
      const r = await redirectCall(attempt, {'Cf-Access-Jwt-Assertion': jwt});
      assert.equal(r.status, 303);
      assert.equal(
        r.headers.get('Location'),
        'https://blog.bytesofpurpose.com/',
        `"${attempt}" should have collapsed to the origin root`,
      );
    });
  }

  await t.test('/api/redirect preserves query + hash on a safe path', async () => {
    const jwt = await mint({email: 'reader@example.com'});
    const r = await redirectCall('/craft/x?a=1&b=2#frag', {
      'Cf-Access-Jwt-Assertion': jwt,
    });
    assert.equal(r.status, 303);
    assert.equal(
      r.headers.get('Location'),
      'https://blog.bytesofpurpose.com/craft/x?a=1&b=2#frag',
    );
  });

  // A trailing slash on the endpoint path must still route (the CF route `*` reaches
  // the Worker for /api/redirect/ too; the Worker normalizes so it doesn't 404).
  await t.test('/api/redirect/ (trailing slash) still 303s', async () => {
    const jwt = await mint({email: 'reader@example.com'});
    const r = await worker.fetch(
      new Request(
        'https://blog.bytesofpurpose.com/api/redirect/?redirect_url=%2Fcraft%2Fx',
        {method: 'GET', headers: {'Cf-Access-Jwt-Assertion': jwt}},
      ),
      env,
    );
    assert.equal(r.status, 303);
    assert.equal(r.headers.get('Location'), 'https://blog.bytesofpurpose.com/craft/x');
  });

  await t.test('/api/me/ (trailing slash) still returns identity', async () => {
    const jwt = await mint({email: 'reader@example.com'});
    const r = await worker.fetch(
      new Request('https://blog.bytesofpurpose.com/api/me/', {
        method: 'GET',
        headers: {'Cf-Access-Jwt-Assertion': jwt},
      }),
      env,
    );
    assert.equal(r.status, 200);
    assert.equal((await r.json()).email, 'reader@example.com');
  });
});
