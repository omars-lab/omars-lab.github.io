#!/usr/bin/env bash
# env-sync.sh — keep the committed encrypted sidecar in step with the local .env.
#
# The shape, and why it is this shape:
#
#   .env                       plaintext, gitignored   <- Makefile targets read this
#   .env.encrypted             ciphertext, COMMITTED   <- what a new machine clones
#   .env.keys                  private key, gitignored <- lives in LastPass
#
# Encrypting .env in place is dotenvx's own recommendation and it was rejected
# here deliberately (same call as sibling repo bikar, whose machinery this is).
# Every consumer of .env in this repo reads it with `grep -E '^VAR=' .env | cut`
# — validate-design-clarity (DESIGN_LEAK_TERMS), validate-dev-service-token and
# serve/start (CF_ACCESS_CLIENT_ID/SECRET), rotate-premium-secret (CF_API_TOKEN),
# build-premium/serve (STATICRYPT_PASSPHRASE). Under in-place encryption every one
# of them would read the literal string `encrypted:BB…` as the value, and
# rotate-premium-secret would push that string to the Worker as the live secret.
# The sidecar leaves every existing reader untouched.
#
# The cost of that choice is drift — .env edited, sidecar not regenerated, and a
# second machine silently bootstraps stale credentials. `check` is the price:
# it is what makes the drift loud, and it is wired into `make env-check`.
#
# Usage:
#   env-sync.sh encrypt     .env          -> .env.encrypted   (after editing .env)
#   env-sync.sh check       assert the two hold the same keys and values
#   env-sync.sh bootstrap   .env.encrypted -> .env            (new machine)
#
# Never prints a secret value. Key names only — that is enough to diagnose drift
# and it is safe in CI logs and in a terminal someone is screen-sharing.
set -uo pipefail

CMD="${1:-}"
# Pinned, deliberately. `npx -y @dotenvx/dotenvx` (unpinned) resolves whatever npx
# has cached, and dotenvx 1.x -> 2.x changed where the private key lives: v1 wrote
# .env.keys on `encrypt`; v2 mints the key into the macOS login Keychain instead and
# writes no file. An unpinned bump therefore silently breaks the LastPass-portability
# model (nothing to push to the vault, nothing for a second machine to pull) with no
# error. Pin so the behavior this script depends on cannot drift under our feet.
DOTENVX="npx -y @dotenvx/dotenvx@2.28.0"

# --no-native disables dotenvx v2's OS-secret-store integration (the macOS Keychain,
# 1Password, Bitwarden). With it, `encrypt` writes the private key back to .env.keys
# (v1 behavior) and `decrypt` reads the key ONLY from .env.keys / the environment —
# never the Keychain. That is exactly the model these scripts and LastPass are built
# on: .env.keys (backed up in LastPass) is the single source of truth for the key.
# Without it, `encrypt` would leave the minted key stranded in this machine's Keychain
# (invisible to LastPass, unavailable to the next machine), and `decrypt` would fall
# back to the Keychain — silently defeating the "no key = fail" guard that check and
# bootstrap rely on. Passed at every call site as a subcommand option.
NO_NATIVE="--no-native"

die() { echo "ERROR: $*" >&2; exit 1; }

# dotenvx OVERLAYS process.env on BOTH encrypt and decrypt: an exported shell
# var whose name matches a key in the file silently replaces the file's/stored
# value, and nothing errors. It surfaces as phantom drift here, and — far worse
# — as a WRONG value written by `bootstrap` on any machine that happens to export
# a colliding name (a plain `STUDIO_HOST=studio` in someone's shell is enough).
# Running dotenvx with the file's own key names stripped from the environment
# makes the file on disk the single source of truth. Key NAMES are plaintext even
# in the encrypted sidecar, so deriving them from it leaks no secret value.
dotenvx_isolated() {
  local keyfile="$1"; shift
  local unsets="" n
  while IFS= read -r n; do
    [ -n "$n" ] && unsets="$unsets -u $n"
  done <<EOF
$(grep -oE '^(export[[:space:]]+)?[A-Za-z_][A-Za-z0-9_]*=' "$keyfile" | sed -E 's/^(export[[:space:]]+)?//; s/=$//')
EOF
  # shellcheck disable=SC2086
  env $unsets $DOTENVX "$@"
}

# The plaintext files, and their sidecars. Derived rather than hardcoded so a new
# .env.<something> is covered the day it is created, not the day someone
# remembers to add it here.
plaintext_files() {
  for f in .env .env.*; do
    [ -e "$f" ] || continue
    case "$f" in
      *.encrypted|*.example|*.keys|*.keys.*|*.bak|*.orig) continue ;;
    esac
    echo "$f"
  done
}

sidecar_files() {
  for f in .env.encrypted .env.*.encrypted; do
    [ -e "$f" ] && echo "$f"
  done
}

need_dotenvx() {
  command -v npx >/dev/null 2>&1 || die "npx not found (need Node) — see CLAUDE.md for the Node floor."
}

# ── encrypt ─────────────────────────────────────────────────────────────────
# Regenerating the sidecar from scratch would be the obvious implementation and
# it is a trap: with no DOTENV_PUBLIC_KEY_* header and no .env.keys on disk,
# dotenvx mints a FRESH keypair, and the private key sitting in LastPass no
# longer opens the file that is about to be committed. Nothing errors — the
# commit is clean and the failure surfaces on the next machine that tries to
# bootstrap. So the existing header is carried over verbatim, and a run that
# would mint a new keypair says so out loud.
cmd_encrypt() {
  need_dotenvx
  local any=0
  for f in $(plaintext_files); do
    any=1
    local sidecar="$f.encrypted"
    local header=""
    if [ -f "$sidecar" ]; then
      header=$(grep -E '^DOTENV_PUBLIC_KEY[A-Z_]*=' "$sidecar" || true)
    fi
    if [ -z "$header" ] && [ ! -f .env.keys ]; then
      echo "NOTE: $sidecar has no public key and .env.keys is absent."
      echo "      This run MINTS A NEW KEYPAIR. The old ciphertext becomes"
      echo "      unreadable and the LastPass entry goes stale."
      echo "      If you meant to reuse the existing key: make env-keys-pull"
    fi

    # Copy only real KEY=value lines into the sidecar — never .env's comments or
    # blank lines. dotenvx does not encrypt a comment, so a commented-out secret
    # (a `# CF_API_TOKEN=…` left behind in .env) would ride into the COMMITTED
    # ciphertext as plaintext. The sidecar is a machine-only secrets transport; it
    # has no use for .env's prose. check-env-encrypted also blocks a commented
    # plaintext as a backstop, but the leak is best removed at the source.
    { [ -n "$header" ] && echo "$header"; grep -vE '^[[:space:]]*(#|$)' "$f"; } > "$sidecar"
    dotenvx_isolated "$f" encrypt $NO_NATIVE --no-armor -f "$sidecar" >/dev/null 2>&1 \
      || die "dotenvx encrypt failed on $sidecar"

    # Encrypting and not checking the result is how a plaintext value gets
    # committed under a filename that says otherwise.
    sh scripts/check-env-encrypted.sh --file "$sidecar" \
      || die "$sidecar still holds a plaintext value after encryption."
    echo "  encrypted  $f -> $sidecar"
  done
  [ "$any" = 1 ] || die "no plaintext .env files found in $(pwd)"
  cmd_check
}

# ── check ───────────────────────────────────────────────────────────────────
# Compares key sets AND values, reports key names only. Values are compared in
# python so nothing is ever echoed, interpolated into a shell word, or written
# to a temp file.
#
# Decrypt (isolated), NOT get. `dotenvx get` additionally interpolates $VAR
# references, so a password containing `$` comes back altered; decrypt returns the
# stored value verbatim. Both, though, overlay process.env — hence dotenvx_isolated,
# which strips the file's own key names from the environment first. The result is
# exactly what `bootstrap` reconstructs (bootstrap runs the same isolated decrypt),
# so `check` predicts what a new machine will actually write to .env.
cmd_check() {
  need_dotenvx
  local rc=0 any=0
  for sidecar in $(sidecar_files); do
    any=1
    local f="${sidecar%.encrypted}"
    if [ ! -f "$f" ]; then
      echo "  skip       $sidecar (no local $f — run: make env-bootstrap)"
      continue
    fi
    local decrypted
    decrypted=$(dotenvx_isolated "$sidecar" decrypt $NO_NATIVE --stdout -f "$sidecar" 2>/dev/null) || {
      echo "  FAIL       $sidecar — cannot decrypt. Is .env.keys present? (make env-keys-pull)" >&2
      rc=1; continue
    }
    DEC_ENV="$decrypted" python3 - "$f" "$sidecar" <<'PY' || rc=1
import os, sys, re

plain_path, sidecar = sys.argv[1], sys.argv[2]

# One reader for both sides, so no parse asymmetry can invent a phantom drift.
# A line that cannot be classified is an error, not a skip: a silently-skipped
# line is a key that drift-checking never covers. Banner (#/…) and the public-key
# line are dropped — bootstrap strips them out of the reconstructed .env too.
def parse(text, collect_bad=None):
    out = {}
    for n, line in enumerate(text.splitlines(), 1):
        s = line.strip()
        if not s or s.startswith('#'):
            continue
        m = re.match(r'^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)=(.*)$', s)
        if not m:
            if collect_bad is not None:
                collect_bad.append(n)
            continue
        k, v = m.group(1), m.group(2)
        # An inline comment on an UNQUOTED value is what dotenvx strips when it
        # encrypts, so strip it here too or a `KEY=val # note` line reads as drift.
        if v[:1] not in ('"', "'"):
            v = re.sub(r'\s+#.*$', '', v)
        v = v.strip()
        if len(v) >= 2 and v[0] == v[-1] and v[0] in "\"'":
            v = v[1:-1]
        if k.startswith('DOTENV_PUBLIC_KEY'):
            continue
        out[k] = v
    return out

bad = []
plain = parse(open(plain_path).read(), collect_bad=bad)
dec = parse(os.environ['DEC_ENV'])

missing = sorted(set(plain) - set(dec))      # in .env, never encrypted
extra   = sorted(set(dec) - set(plain))      # encrypted, since removed locally
differ  = sorted(k for k in set(plain) & set(dec) if plain[k] != dec[k])

if bad:
    print(f"  FAIL       {plain_path}: unparseable line(s) at {bad} — cannot verify drift", file=sys.stderr)
if missing:
    print(f"  DRIFT      in {plain_path} but not {sidecar}: {', '.join(missing)}", file=sys.stderr)
if extra:
    print(f"  DRIFT      in {sidecar} but not {plain_path}: {', '.join(extra)}", file=sys.stderr)
if differ:
    print(f"  DRIFT      value differs (names only): {', '.join(differ)}", file=sys.stderr)

if bad or missing or extra or differ:
    print(f"             Fix with: make env-encrypt", file=sys.stderr)
    sys.exit(1)
print(f"  in sync    {plain_path} == {sidecar}  ({len(plain)} keys)")
PY
  done
  [ "$any" = 1 ] || echo "  (no encrypted sidecars in $(pwd) — nothing to compare)"
  return $rc
}

# ── bootstrap ───────────────────────────────────────────────────────────────
# The whole point of the exercise: a second machine, one LastPass entry.
# Refuses to clobber an existing .env — overwriting the local secrets of a
# machine that is mid-rotation is not recoverable from here.
cmd_bootstrap() {
  need_dotenvx
  [ -f .env.keys ] || die ".env.keys not found. Run: make env-keys-pull"
  local any=0
  for sidecar in $(sidecar_files); do
    any=1
    local f="${sidecar%.encrypted}"
    if [ -f "$f" ]; then
      echo "  skip       $f already exists (not overwriting; delete it first if that is what you want)"
      continue
    fi
    # Drop dotenvx's banner and public-key line: this file is the plaintext one
    # that the Makefile targets consume with `grep -E '^VAR=' .env | cut`, and a
    # DOTENV_PUBLIC_KEY line would just be dead weight in it.
    dotenvx_isolated "$sidecar" decrypt $NO_NATIVE --stdout -f "$sidecar" 2>/dev/null \
      | grep -vE '^#/|^DOTENV_PUBLIC_KEY[A-Z_]*=' > "$f" \
      || die "could not decrypt $sidecar (is .env.keys the right key?)"
    [ -s "$f" ] || { rm -f "$f"; die "decrypting $sidecar produced an empty $f"; }
    chmod 600 "$f"
    echo "  bootstrapped  $sidecar -> $f  ($(grep -cE '^[A-Za-z_][A-Za-z0-9_]*=' "$f") keys, mode 600)"
  done
  [ "$any" = 1 ] || die "no .env*.encrypted files found — nothing to bootstrap from"
  cmd_check
}

case "$CMD" in
  encrypt)   cmd_encrypt ;;
  check)     cmd_check ;;
  bootstrap) cmd_bootstrap ;;
  *) echo "usage: $0 {encrypt|check|bootstrap}" >&2; exit 2 ;;
esac
