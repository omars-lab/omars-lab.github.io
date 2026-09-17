# dotenvx 2.x stores the private key in the macOS Keychain — pin + `--no-native`

**Date:** 2026-09-16
**Component:** `scripts/env-sync.sh` (the dotenvx secrets-at-rest sidecar)

## What was tried

The sidecar model rests on one invariant: **`.env.keys` is the single source of
truth for the private key** — `encrypt` writes it, `make env-keys-push` backs it up
to LastPass, a second machine pulls it and bootstraps. `env-sync.sh` invoked dotenvx
as `npx -y @dotenvx/dotenvx` — **unpinned**.

## What the evidence showed

`npx -y` resolves whatever it has cached, and the cache had rolled over from a dotenvx
1.x build to **2.28.0**. dotenvx changed where the minted key lives between majors:

- 1.x wrote `.env.keys` on `encrypt`. **2.28.0 writes no file** — a fresh `HOME` with
  the sidecar but no key cannot decrypt, proving the key is not in the committed file.
- 2.x mints the key into the **macOS login Keychain** (service name `dotenvx`),
  confirmed by a HOME before/after snapshot: `login.keychain-db` is modified and
  `security dump-keychain | grep dotenvx` shows `"svce"…="dotenvx"`.
- `dotenvx keypair -f <sidecar>` is a **reader** (extracts the key from the
  Keychain/env, returns `null` when none exists), not a minter.
- `dotenvx decrypt` **falls back to the Keychain** when `.env.keys` is absent — even
  with `-fk` at an empty file — so on the developer's own machine the "no key = fail"
  guard silently stops guarding.

Two silent, portability-breaking failures follow from the default behaviour: a fresh
`encrypt` strands the only copy of the key in this machine's Keychain (invisible to
`make env-keys-push`, unavailable to the next machine), and `env-check`/`env-bootstrap`
"succeed" off the Keychain with no `.env.keys`. `make test-env` failed 4 key-dependent
assertions.

Not a production data regression: the real `.env.keys` comes from LastPass and the
committed `.env.encrypted` is already v2-shaped (`DOTENV_PUBLIC_KEY_ENCRYPTED`).

## Why the approach changed

Relying on the tool's default key storage was the broken assumption. The undocumented-
by-name lever is **`--no-native`** ("disable OS secret store features" — it only
appears in `dotenvx keypair --help`, not `encrypt`/`decrypt` help). With `--no-native`,
2.x `encrypt` writes `.env.keys` again (no Keychain touch) and `decrypt` reads the key
*only* from the file/env.

Rejected alternatives: extracting the Keychain key to `.env.keys` via `dotenvx keypair`
after each `encrypt` (that *manages* a second key source instead of removing it), and
per-sandbox `HOME` isolation in the test harness (unnecessary once the Keychain is out
of the path).

## What replaced it

Two lines in `env-sync.sh`:

- **Pin** `npx -y @dotenvx/dotenvx@2.28.0` — an unpinned resolver must not be able to
  change a secrets tool's security-relevant behaviour under us.
- **`--no-native`** at every `encrypt`/`decrypt` call site (via the `NO_NATIVE` var),
  restoring `.env.keys` (LastPass) as the single source of truth.

## The guard

No new test was needed. `scripts/env-sync.test.sh` case 6 (`.env.keys` must exist and
be stable across a re-encrypt) can only pass if `encrypt` writes the file; case 9
(`check`/`bootstrap` must fail once `.env.keys` is removed) can only pass if `decrypt`
does not fall back to the Keychain. Both fail without `--no-native` and pass with it —
the suite is the regression guard, and the pin makes it deterministic. `make test-env`
→ 44/44 green.

## Note for bikar

bikar's byte-identical `env-sync.sh` had the same unpinned invocation; the same fix
(pin + `--no-native`) was carried there in NaqshCoffee/bikar#189. Tracked in memory
`bikar-secrets-and-supabase`.
