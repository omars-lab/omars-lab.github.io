# dotenvx overlays `process.env` — and it corrupts `bootstrap`

**Date:** 2026-09-14
**Component:** `scripts/env-sync.sh` (the dotenvx secrets-at-rest sidecar)

## What was tried

The sidecar machinery was ported from sibling repo **bikar**, which encrypts a
committed `.env.encrypted` and reconstructs the plaintext `.env` on a new machine
with `dotenvx decrypt`. `env-sync.sh check` compares the local `.env` against the
sidecar to make drift loud. The port was intended to be behaviour-identical.

## What the evidence showed

`make env-encrypt` reported phantom drift on `STUDIO_HOST` (and, transiently,
`UMAMI_ADMIN_PASS`) even though the sidecar was freshly regenerated from `.env`.
Diagnosing without ever printing a secret value (sha-12 fingerprints and lengths
only):

- The plaintext `.env` value of `STUDIO_HOST` was `mac-studio.local` (len 16).
- `dotenvx decrypt --stdout` returned `studio` (len 6) — which was **exactly the
  value the shell happened to export** as `$STUDIO_HOST`, not the stored value.
- Running the same decrypt under `env -u STUDIO_HOST` returned `mac-studio.local`,
  matching the file.

So the sidecar was **correct**. dotenvx **overlays `process.env` over the file it
decrypts**: any exported shell variable whose name collides with a key silently
substitutes its value. `dotenvx get` does this too, and additionally interpolates
`$VAR` references (which is what first altered the `$`-bearing `UMAMI_ADMIN_PASS`).
A bare `export STUDIO_HOST=studio` in someone's shell profile is enough to trigger
it, with no error anywhere.

This is not a cosmetic check bug. **`bootstrap` runs the same decrypt**, so on any
machine that exports a colliding name, `make env-bootstrap` would write the
*shell's* value into the reconstructed `.env` — the exact silent-wrong-credential
failure the sidecar model exists to prevent.

## Why the approach changed

Comparing against `dotenvx decrypt` instead of `dotenvx get` (the first fix
attempted) removes the `$`-interpolation half of the problem but **not** the
`process.env` overlay — both commands overlay. Relying on a dotenvx flag to
disable the overlay was rejected: the transport/CLI is a moving target, and a flag
that exists today may change.

## What replaced it

A `dotenvx_isolated` helper (in `env-sync.sh`) that runs every dotenvx invocation
— `encrypt`, and both `decrypt` paths (`check` and `bootstrap`) — under `env -u`
for each key the file defines, so the environment can never reach a stored value.
Key **names** are plaintext even in the encrypted sidecar, so deriving the unset
list from it leaks nothing. This makes the file on disk the single source of truth
and makes `check` predict exactly what `bootstrap` will write.

Regression coverage: `scripts/env-sync.test.sh` case 11 exports a colliding
`ALPHA=env-value`, then asserts `encrypt`/`check` see no drift and `bootstrap`
writes the file's `ALPHA=file-value`, not the shell's. It fails against a
non-isolated decrypt and passes with the helper.

## Note for bikar

bikar's `env-sync.sh` has the same latent bug — it just has not yet been run on a
machine that exports a name colliding with one of its keys. The `dotenvx_isolated`
fix should be carried back there. Tracked in memory `bikar-secrets-and-supabase`.
