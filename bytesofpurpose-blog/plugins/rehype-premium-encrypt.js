const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// StatiCrypt's proven engine + codec (AES-CBC + PBKDF2-600k + HMAC). Node path uses
// node:crypto.webcrypto automatically (the engine branches on typeof window).
const cryptoEngine = require('staticrypt/lib/cryptoEngine.js');
const codec = require('staticrypt/lib/codec.js').init(cryptoEngine);

/**
 * rehype-premium-encrypt — the HARD GATE, applied at MDX-COMPILE time (rehype stage).
 *
 * Why compile-time, not post-build HTML surgery: Docusaurus compiles each doc's body into
 * a JS chunk that hydrates client-side, so stripping only the built HTML still ships the
 * plaintext in the public JS bundle (proven 2026-06-02 — see the premium-gating design +
 * memory). Replacing the body with ciphertext at the rehype stage — BEFORE it becomes a JS
 * module — keeps plaintext out of BOTH the HTML and the JS bundle.
 *
 * For a `premium: true` doc, this plugin:
 *   1. Serializes the body HAST to HTML (hast-util-to-html) — the rendered look readers get.
 *   2. Encrypts that HTML with StatiCrypt's codec using STATICRYPT_PASSPHRASE (the SAME
 *      secret the Worker vends at /api/unlock-key). Fresh random salt per body.
 *   3. Writes the {salt, encoded} payload to static/premium/<id>.json → served at
 *      /premium/<id>.json (id = sha1 of the doc source path, stable across builds).
 *   4. REPLACES the body with a single <PremiumGate payload teaser/> MDX JSX element. The
 *      compiled chunk now contains only the gate — never the plaintext HTML.
 *
 * When STATICRYPT_PASSPHRASE is unset (local `yarn start`, authoring), the body is left
 * untouched so premium pages render normally in dev — the gate is a PROD concern.
 * verify-premium-encrypted.js (V5) is the blocking deploy gate that guarantees no premium
 * plaintext ever ships (it scans the built HTML AND the JS chunks).
 *
 * rehype/MDX transformers may be async — encryption (WebCrypto) is, so we return a Promise
 * and dynamically import the ESM-only serializer.
 */

const PASSPHRASE = process.env.STATICRYPT_PASSPHRASE;
const STATIC_DIR = path.join(__dirname, '..', 'static', 'premium');
const SITE_ROOT = path.join(__dirname, '..');

function payloadIdFor(vfilePath) {
  const rel = path.relative(SITE_ROOT, vfilePath || 'unknown');
  return crypto.createHash('sha1').update(rel).digest('hex').slice(0, 16);
}

// <PremiumGate payload="/premium/<id>.json" teaser="…" /> as an MDX JSX flow element.
function premiumGateNode(payloadUrl, teaser) {
  return {
    type: 'mdxJsxFlowElement',
    name: 'PremiumGate',
    attributes: [
      {type: 'mdxJsxAttribute', name: 'payload', value: payloadUrl},
      {type: 'mdxJsxAttribute', name: 'teaser', value: teaser || ''},
    ],
    children: [],
  };
}

module.exports = function rehypePremiumEncrypt() {
  return async function transformer(tree, vfile) {
    const fm = (vfile && vfile.data && vfile.data.frontMatter) || {};
    if (fm.premium !== true) return;

    // Dev / no passphrase: leave the body in clear so authoring + localhost just work.
    if (!PASSPHRASE) return;
    if (!tree.children || tree.children.length === 0) return;

    // MDX trees can carry top-level ESM nodes (mdxjsEsm = import/export statements) and MDX
    // expression nodes that hast-util-to-html cannot serialize (and that must be PRESERVED
    // for the JS module to compile). Separate them: serialize only the renderable HTML
    // nodes, keep the ESM/MDX nodes as-is.
    const isRenderable = (n) =>
      n.type !== 'mdxjsEsm' && n.type !== 'mdxFlowExpression' && n.type !== 'mdxTextExpression';
    const esmNodes = tree.children.filter((n) => !isRenderable(n));
    const bodyNodes = tree.children.filter(isRenderable);
    if (bodyNodes.length === 0) return;

    const {toHtml} = await import('hast-util-to-html');
    // Serialize ONLY the renderable body nodes (a synthetic root), not the ESM nodes.
    const bodyHtml = toHtml({type: 'root', children: bodyNodes});
    if (!bodyHtml.trim()) return;

    const salt = cryptoEngine.generateRandomSalt();
    const encoded = await codec.encode(bodyHtml, PASSPHRASE, salt);

    const id = payloadIdFor(vfile.path || (vfile.history && vfile.history[0]));
    fs.mkdirSync(STATIC_DIR, {recursive: true});
    fs.writeFileSync(path.join(STATIC_DIR, `${id}.json`), JSON.stringify({salt, encoded}));
    const payloadUrl = `/premium/${id}.json`;

    const teaser =
      (typeof fm.premium_teaser === 'string' && fm.premium_teaser.trim()) ||
      (typeof fm.description === 'string' && fm.description.trim()) ||
      '';

    // Keep the ESM/import nodes; replace the renderable body with the gate node — plaintext
    // never reaches the JS module.
    tree.children = [...esmNodes, premiumGateNode(payloadUrl, teaser)];
  };
};
