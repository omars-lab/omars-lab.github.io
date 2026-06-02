// Client-side decrypt for premium content (the reader half of the hard gate).
//
// Premium doc bodies ship to production ENCRYPTED (the rehype-premium-encrypt plugin does
// the build-time encode using StatiCrypt's codec); this module decrypts them in the browser
// once the Worker vends the passphrase to a signed-in reader (/api/unlock-key).
//
// We re-implement ONLY the decrypt half here, directly against window.crypto, byte-for-byte
// compatible with StatiCrypt's encode() output. WHY not import staticrypt's cryptoEngine.js
// (as the build step does): its first line is
//   const crypto = typeof window === 'undefined' ? require('node:crypto').webcrypto : window.crypto;
// and webpack statically resolves that `require('node:crypto')` when bundling for the
// browser → "UnhandledSchemeError: node:crypto". A pure-WebCrypto decrypt avoids pulling any
// Node builtin into the client bundle. The algorithm below mirrors cryptoEngine.js EXACTLY —
// keep them in lockstep (it's the same crypto scheme the build encrypts with).
//
//   key   = PBKDF2 chain over the passphrase + salt: 1k/SHA-1 → 14k/SHA-256 → 585k/SHA-256
//           (StatiCrypt raised iterations over time; the 3-round chain = 600k total).
//   msg   = HMAC-SHA256(64 hex) ++ IV(32 hex) ++ AES-CBC-ciphertext(hex), all over the
//           hashedPassword (the PBKDF2 output, hex). decode() verifies the HMAC then decrypts.

export interface EncryptedPayload {
  /** Hex salt (16 bytes / 32 hex chars). NOT secret — needed to derive the key. */
  salt: string;
  /** HMAC(64 hex) + IV(32 hex) + ciphertext — exactly StatiCrypt's encode() output. */
  encoded: string;
}

const te = new TextEncoder();

// Return type is pinned to Uint8Array<ArrayBuffer> (not the default ArrayBufferLike,
// which TS widens to include SharedArrayBuffer) so WebCrypto's BufferSource overloads
// accept the result directly. `new Uint8Array(number)` is always ArrayBuffer-backed.
function hexToBytes(hex: string): Uint8Array<ArrayBuffer> {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) out[i / 2] = parseInt(hex.substr(i, 2), 16);
  return out;
}
function bytesToHex(bytes: Uint8Array): string {
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += bytes[i].toString(16).padStart(2, '0');
  return s;
}

// One PBKDF2 round. `password` is utf8; output is the raw 256-bit key as a hex string
// (matching cryptoEngine.pbkdf2, which hex-stringifies the derived bits).
async function pbkdf2(
  password: string,
  salt: string,
  iterations: number,
  hash: 'SHA-1' | 'SHA-256',
): Promise<string> {
  const key = await crypto.subtle.importKey('raw', te.encode(password), 'PBKDF2', false, [
    'deriveBits',
  ]);
  const bits = await crypto.subtle.deriveBits(
    {name: 'PBKDF2', hash, iterations, salt: te.encode(salt)},
    key,
    256,
  );
  return bytesToHex(new Uint8Array(bits));
}

// StatiCrypt's 3-round hashPassword (legacy 1k/SHA-1 → 14k/SHA-256 → 585k/SHA-256).
async function hashPassword(password: string, salt: string): Promise<string> {
  let h = await pbkdf2(password, salt, 1000, 'SHA-1');
  h = await pbkdf2(h, salt, 14000, 'SHA-256');
  h = await pbkdf2(h, salt, 585000, 'SHA-256');
  return h;
}

async function hmacHex(hashedPassword: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    hexToBytes(hashedPassword),
    {name: 'HMAC', hash: 'SHA-256'},
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, te.encode(message));
  return bytesToHex(new Uint8Array(sig));
}

async function aesCbcDecrypt(encryptedMsg: string, hashedPassword: string): Promise<string> {
  const ivHex = encryptedMsg.substring(0, 32); // IV = 16 bytes = 32 hex chars
  const ctHex = encryptedMsg.substring(32);
  const key = await crypto.subtle.importKey(
    'raw',
    hexToBytes(hashedPassword),
    'AES-CBC',
    false,
    ['decrypt'],
  );
  const out = await crypto.subtle.decrypt(
    {name: 'AES-CBC', iv: hexToBytes(ivHex)},
    key,
    hexToBytes(ctHex),
  );
  return new TextDecoder().decode(new Uint8Array(out));
}

/**
 * Decrypt a premium payload with the passphrase the Worker vends. Resolves to the cleartext
 * body HTML on success, or null on any failure (wrong passphrase, tampered ciphertext,
 * malformed payload) — never throws. Mirrors StatiCrypt codec.decode: derive key, verify
 * HMAC, then AES-CBC decrypt.
 */
export async function decryptPremium(
  payload: EncryptedPayload,
  passphrase: string,
): Promise<string | null> {
  try {
    if (!payload?.salt || !payload?.encoded || !passphrase) return null;
    const hashedPassword = await hashPassword(passphrase, payload.salt);
    const signedMsg = payload.encoded;
    const hmac = signedMsg.substring(0, 64);
    const encryptedMsg = signedMsg.substring(64);
    const expected = await hmacHex(hashedPassword, encryptedMsg);
    if (expected !== hmac) return null; // signature mismatch — wrong key or tampered
    return await aesCbcDecrypt(encryptedMsg, hashedPassword);
  } catch {
    return null;
  }
}
