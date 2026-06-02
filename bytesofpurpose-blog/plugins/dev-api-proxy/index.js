/**
 * Local Docusaurus plugin: in DEV ONLY, proxy `/api/*` to the real production
 * Worker so localhost behaves like prod for premium gating.
 *
 * Why: the premium feature talks to a Cloudflare Worker at
 * `https://blog.bytesofpurpose.com/api/{me,unlock-key}` (gated by Cloudflare
 * Access → LinkedIn). With `make start` now ENCRYPTING premium bodies in dev
 * (STATICRYPT_PASSPHRASE from .env), the only missing half for true dev/prod
 * parity is the unlock KEY — which only the Worker can vend. Rather than a
 * dev-only key or a client fallback, we forward the dev server's `/api/*` to the
 * real Worker, carrying the reader's real Access cookie. Sign in once on
 * https://blog.bytesofpurpose.com and the browser holds the CF_Authorization
 * cookie; `changeOrigin` rewrites the Host so Access/Cloudflare route correctly.
 *
 * Mechanism: Docusaurus 3 surfaces webpack-dev-server config via a plugin's
 * `configureWebpack(...).devServer`. webpack-dev-server v5 (this repo: 5.2.2)
 * requires the ARRAY form of `proxy` (the v4 object form was removed).
 *
 * Dev-only by construction: `configureWebpack(config, isServer)` — we only add
 * the proxy for the client compiler, and webpack-dev-server only runs under
 * `yarn start`, never in `yarn build`. So nothing here touches production.
 *
 * DEV AUTH = CF ACCESS SERVICE TOKEN (not a forwarded cookie). A browser
 * CF_Authorization cookie CANNOT authenticate the dev path: it is httpOnly +
 * domain-scoped to blog.bytesofpurpose.com, so the browser never sends it to a
 * localhost request, and Access's login nonce is origin-bound so the login can't
 * even complete through the proxy ("Invalid login session"). Cloudflare's
 * documented answer for headless/localhost testing behind Access is a SERVICE
 * TOKEN: a static Cf-Access-Client-Id / Cf-Access-Client-Secret header pair, on
 * an Access policy whose action is "Service Auth". This proxy injects those two
 * headers (from CF_ACCESS_CLIENT_ID / CF_ACCESS_CLIENT_SECRET, which `make start`
 * exports from the gitignored .env) onto every proxied /api/* request, so dev
 * unlocks premium with NO browser login. The headers are added server-side by the
 * dev server — never exposed to the page, never in the prod bundle.
 */

const TARGET = 'https://blog.bytesofpurpose.com';

// Treat the .env placeholder (<PASTE_…>) as unset so a freshly-scaffolded .env
// doesn't inject bogus headers.
const real = (v) => (v && !v.startsWith('<PASTE') ? v : undefined);
const CLIENT_ID = real(process.env.CF_ACCESS_CLIENT_ID);
const CLIENT_SECRET = real(process.env.CF_ACCESS_CLIENT_SECRET);

module.exports = function devApiProxyPlugin() {
  return {
    name: 'dev-api-proxy',
    configureWebpack(_config, isServer) {
      // Only the client-side dev compiler hosts the dev server.
      if (isServer) return {};

      const hasToken = Boolean(CLIENT_ID && CLIENT_SECRET);
      if (!hasToken) {
        // Loud, but non-fatal: the proxy still forwards /api/* (useful for seeing
        // the real 302s), it just can't authenticate, so premium stays gated in dev.
        // eslint-disable-next-line no-console
        console.warn(
          '\n[dev-api-proxy] CF_ACCESS_CLIENT_ID/SECRET not set — /api/* will proxy but NOT authenticate.\n' +
            '  Premium will stay locked in dev. Add the CF Access service token to .env to unlock locally.\n',
        );
      }

      return {
        devServer: {
          proxy: [
            {
              context: ['/api'],
              target: TARGET,
              changeOrigin: true, // rewrite Host: → blog.bytesofpurpose.com
              secure: true,
              // Don't let the proxy follow Access's 302 to the IdP — surface it
              // to the browser so the app's signIn() redirect flow still works.
              followRedirects: false,
              // Inject the service-token headers so CF Access (Service Auth policy)
              // admits the request without a browser login. Only when configured.
              ...(hasToken && {
                headers: {
                  'CF-Access-Client-Id': CLIENT_ID,
                  'CF-Access-Client-Secret': CLIENT_SECRET,
                },
              }),
            },
          ],
        },
      };
    },
  };
};
