#!/usr/bin/env node

/**
 * verify-premium-encrypted.js — V5: the BLOCKING safety net for the premium hard gate.
 *
 * The whole premium model rests on one guarantee: a `premium: true` doc's body NEVER ships
 * to gh-pages in cleartext — not in the HTML, and not in the JS bundle (Docusaurus compiles
 * doc bodies into JS chunks, so HTML-only checks are insufficient — proven 2026-06-02). The
 * compile-time encrypt plugin (plugins/rehype-premium-encrypt.js) replaces each premium body
 * with a <PremiumGate> + an encrypted sidecar. This gate runs AFTER build, BEFORE any
 * gh-pages push, and FAILS THE DEPLOY (non-zero exit) if anything leaked:
 *
 *   For every `premium: true` doc:
 *     - NONE of its body fingerprints (distinctive long tokens from the source body, minus
 *       the teaser) may appear ANYWHERE in build/ — HTML *or* JS *or* the sidecar payload.
 *       This is a literal absence-grep of the doc's own content across the whole build.
 *     - the encrypted sidecar build/premium/<id>.json MUST exist with {salt, encoded}.
 *   Any premium doc that fails → ERROR, non-zero exit, deploy aborts.
 *
 * ERROR-tier, not advisory: unencrypted premium leaking is a silent security failure. Wired
 * into deploy-site (step 3b, after build, before `yarn deploy`) AND the .githooks/pre-push
 * hook so it cannot be bypassed.
 *
 * Usage: node scripts/verify-premium-encrypted.js [--build-dir build]
 * Exit:  0 all premium bodies gated (or no premium docs) · 2 a premium body leaked.
 */

const fs = require('fs');
const path = require('path');
const {SITE_ROOT, collectPremiumDocs} = require('./lib/premium-docs');

// Recursively read every file under dir, calling cb(absPath, contents) for text-ish files.
function eachFile(dir, cb) {
  for (const e of fs.readdirSync(dir, {withFileTypes: true})) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      eachFile(full, cb);
    } else if (e.isFile()) {
      cb(full);
    }
  }
}

// Build an index of build/ file contents once (HTML + JS + JSON), so the absence-grep over
// many docs is a single pass. Returns [{path, text}].
function indexBuild(buildDir) {
  const files = [];
  eachFile(buildDir, (full) => {
    if (/\.(html|js|json|txt|xml)$/i.test(full)) {
      try {
        files.push({path: full, text: fs.readFileSync(full, 'utf8')});
      } catch {
        /* skip unreadable */
      }
    }
  });
  return files;
}

function main() {
  const args = process.argv.slice(2);
  const bdIdx = args.indexOf('--build-dir');
  const buildDir = path.resolve(SITE_ROOT, bdIdx >= 0 ? args[bdIdx + 1] : 'build');

  const premiumDocs = collectPremiumDocs();
  if (premiumDocs.length === 0) {
    console.log('🔒 verify-premium: no `premium: true` docs — nothing to gate. OK.');
    process.exit(0);
  }
  if (!fs.existsSync(buildDir)) {
    console.error(`🔒 verify-premium: build dir not found: ${buildDir}. FAIL.`);
    process.exit(2);
  }

  const buildFiles = indexBuild(buildDir);
  const failures = [];

  // 0. The passphrase itself must NEVER ship. It's a build-time secret (encrypts
  //    bodies) and the Worker's vended key — if it appeared in build/, anyone could
  //    decrypt every premium body offline. When STATICRYPT_PASSPHRASE is set (it is
  //    during `make build-premium`), assert its value is absent from the whole build.
  const passphrase = process.env.STATICRYPT_PASSPHRASE;
  if (passphrase && passphrase.length >= 8) {
    const leak = buildFiles.find((f) => f.text.includes(passphrase));
    if (leak) {
      failures.push(
        `PASSPHRASE LEAKED into ${path.relative(buildDir, leak.path)} — the decryption key ` +
          `shipped to the public bundle. Every premium body is now readable offline.`,
      );
    }
  }

  for (const doc of premiumDocs) {
    const src = path.relative(SITE_ROOT, doc.source);

    // 1. Absence-grep: NONE of the body fingerprints may appear anywhere in build/.
    if (doc.fingerprints.length === 0) {
      // No distinctive tokens (tiny/teaser-only body). Warn but rely on the structural checks.
      console.warn(
        `🔒 verify-premium: ${src} has no distinctive body tokens to fingerprint — relying on sidecar checks only.`,
      );
    }
    for (const fp of doc.fingerprints) {
      const hit = buildFiles.find((f) => f.text.includes(fp));
      if (hit) {
        failures.push(
          `${src} (${doc.permalink}): body token "${fp}" LEAKED into ${path.relative(buildDir, hit.path)} — premium content shipped in cleartext.`,
        );
      }
    }

    // 2. The encrypted sidecar must exist + be well-formed ciphertext.
    const sidecar = path.join(buildDir, 'premium', `${doc.payloadId}.json`);
    if (!fs.existsSync(sidecar)) {
      failures.push(
        `${src} (${doc.permalink}): missing encrypted sidecar premium/${doc.payloadId}.json — body was never encrypted (is STATICRYPT_PASSPHRASE set at build time?).`,
      );
      continue;
    }
    try {
      const payload = JSON.parse(fs.readFileSync(sidecar, 'utf8'));
      if (!payload.salt || !payload.encoded) {
        failures.push(`${src} (${doc.permalink}): sidecar payload missing salt/encoded.`);
      } else if (!/^[0-9a-f]+$/i.test(payload.encoded)) {
        failures.push(`${src} (${doc.permalink}): sidecar "encoded" is not hex ciphertext.`);
      }
    } catch {
      failures.push(`${src} (${doc.permalink}): sidecar payload is not valid JSON.`);
    }
  }

  if (failures.length) {
    console.error(
      `\n🔒 verify-premium: ${failures.length} premium leak(s)/gap(s) — ABORTING DEPLOY:\n`,
    );
    for (const f of failures) console.error(`  ✗ ${f}`);
    console.error(
      '\nUnencrypted premium content must never ship. Rebuild with STATICRYPT_PASSPHRASE set ' +
        '(so plugins/rehype-premium-encrypt.js encrypts the body), then re-run this gate.\n',
    );
    process.exit(2);
  }

  const keyNote = process.env.STATICRYPT_PASSPHRASE ? ' + passphrase absent' : '';
  console.log(
    `🔒 verify-premium: all ${premiumDocs.length} premium body(ies) absent from build HTML/JS + sidecars present${keyNote}. OK.`,
  );
  process.exit(0);
}

main();
