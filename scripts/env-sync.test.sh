#!/usr/bin/env bash
# env-sync.test.sh — the sidecar model's whole cost is drift, so drift detection
# is the thing that must be tested.
#
# `.env` stays plaintext and gitignored; `.env.encrypted` is committed. Nothing
# forces the two to agree except `env-sync.sh check`. If that check ever stops
# firing, the failure is invisible on this machine — everything keeps working,
# because everything here reads the plaintext `.env`. It surfaces on a second
# machine, weeks later, as credentials that are quietly out of date.
#
# So each case asserts an EXIT CODE, not just output. Run in throwaway
# directories with throwaway keypairs — never touches the repo's real .env.
# Run: bash scripts/env-sync.test.sh
set -uo pipefail

REPO=$(cd "$(dirname "$0")/.." && pwd)
pass=0; fail=0
ok()  { echo "  ok   — $1"; pass=$((pass + 1)); }
bad() { echo "  FAIL — $1"; fail=$((fail + 1)); }
expect() {  # expect <wanted-rc> <got-rc> <description>
  [ "$2" = "$1" ] && ok "$3" || bad "$3 (wanted exit $1, got $2)"
}

sandbox() {
  d=$(mktemp -d)
  mkdir -p "$d/scripts"
  cp "$REPO/scripts/env-sync.sh" "$REPO/scripts/check-env-encrypted.sh" "$d/scripts/"
  git -C "$d" init -q
  printf '%s' "$d"
}
sync() { ( cd "$1" && bash scripts/env-sync.sh "$2" ) >"$1/out" 2>"$1/err"; echo $?; }
# Like sync, but with $3 (NAME=value) EXPORTED into the environment first — used
# to prove dotenvx's process.env overlay cannot reach the stored/file value.
sync_env() { ( cd "$1" && export "$3" && bash scripts/env-sync.sh "$2" ) >"$1/out" 2>"$1/err"; echo $?; }

echo "env-sync:"

# 1 — Baseline. Encrypt, then check must agree with itself. Without this the
#     drift cases below could all be passing for the wrong reason.
d=$(sandbox); printf 'ALPHA=one\nBETA=two\n' > "$d/.env"
expect 0 "$(sync "$d" encrypt)" "encrypt succeeds on a fresh .env"
expect 0 "$(sync "$d" check)" "and check agrees immediately afterwards"
grep -q 'encrypted:' "$d/.env.encrypted" && ok "the sidecar holds ciphertext" \
                                         || bad "the sidecar is not encrypted"
grep -q '^ALPHA=one$' "$d/.env" && ok "the plaintext .env is left untouched" \
                                || bad "encrypt modified .env — the Makefile readers depend on it"

# 2 — A key added to .env and never re-encrypted. THE failure mode of this model:
#     works perfectly here, ships a stale secret to the next machine.
d=$(sandbox); printf 'ALPHA=one\n' > "$d/.env"
sync "$d" encrypt >/dev/null
printf 'BETA=two\n' >> "$d/.env"
expect 1 "$(sync "$d" check)" "a key present only in .env is caught"
grep -q 'BETA' "$d/err" && ok "and the drift report names it" \
                        || bad "the drift report does not say which key"

# 3 — Same key, different value. Strictly harder than case 2: the key sets match,
#     so anything comparing only names would call this in sync.
d=$(sandbox); printf 'ALPHA=one\n' > "$d/.env"
sync "$d" encrypt >/dev/null
printf 'ALPHA=rotated\n' > "$d/.env"
expect 1 "$(sync "$d" check)" "a changed VALUE is caught, not just a changed key set"
grep -q 'ALPHA' "$d/err" && ok "it names the key whose value moved" \
                         || bad "value drift reported without naming the key"
grep -q 'rotated' "$d/err" && bad "THE SECRET VALUE WAS PRINTED to stderr" \
                           || ok "and does not print either value"

# 4 — A key removed locally but still in the sidecar. The other direction; a
#     one-sided comparison would miss it.
d=$(sandbox); printf 'ALPHA=one\nBETA=two\n' > "$d/.env"
sync "$d" encrypt >/dev/null
printf 'ALPHA=one\n' > "$d/.env"
expect 1 "$(sync "$d" check)" "a key dropped from .env but left in the sidecar is caught"

# 5 — Tenet 29. A line the reader cannot classify is an error, not a skip: a
#     skipped line is a key that drift-checking silently stops covering.
d=$(sandbox); printf 'ALPHA=one\n' > "$d/.env"
sync "$d" encrypt >/dev/null
printf 'this is not a key=value line\n' >> "$d/.env"
expect 1 "$(sync "$d" check)" "an unparseable line in .env fails closed"
grep -q 'unparseable' "$d/err" && ok "and says so rather than reporting 'in sync'" \
                               || bad "the unparseable line was not reported as such"

# 6 — THE KEYPAIR TRAP. Re-encrypting must reuse the existing key. If it mints a
#     new one, the private key in LastPass no longer opens the file that is about
#     to be committed — and nothing errors. The commit is clean; the break
#     surfaces on the next machine that runs env-bootstrap.
d=$(sandbox); printf 'ALPHA=one\n' > "$d/.env"
sync "$d" encrypt >/dev/null
k1=$(shasum <"$d/.env.keys")
printf 'ALPHA=one\nBETA=two\n' > "$d/.env"
sync "$d" encrypt >/dev/null
k2=$(shasum <"$d/.env.keys")
[ "$k1" = "$k2" ] && ok "re-encrypting REUSES the keypair (LastPass copy stays valid)" \
                  || bad "re-encrypt ROTATED the keypair — the vault copy is now stale"

# 7 — The new-machine path, end to end: clone has the sidecar and the key, no .env.
d=$(sandbox); printf 'ALPHA=one\nBETA=two spaces here\n' > "$d/.env"
sync "$d" encrypt >/dev/null
orig=$(cat "$d/.env")
rm "$d/.env"
expect 0 "$(sync "$d" bootstrap)" "bootstrap reconstructs .env from the sidecar"
[ "$(grep '^ALPHA=' "$d/.env")" = "ALPHA=one" ] && ok "values survive the round trip" \
                                                 || bad "bootstrap did not restore the value"
grep -q 'DOTENV_PUBLIC_KEY' "$d/.env" \
  && bad "bootstrap left the public-key line in .env (a reader would trip on it)" \
  || ok "bootstrap strips dotenvx's own header out of .env"
[ "$(stat -f '%Lp' "$d/.env" 2>/dev/null || stat -c '%a' "$d/.env")" = "600" ] \
  && ok "the reconstructed .env is mode 600" || bad ".env was written world-readable"

# 8 — bootstrap must not clobber. On a machine mid-rotation the local .env may
#     hold the only copy of a secret that is not in the sidecar yet.
d=$(sandbox); printf 'ALPHA=one\n' > "$d/.env"
sync "$d" encrypt >/dev/null
printf 'ALPHA=local-edit-not-yet-encrypted\n' > "$d/.env"
sync "$d" bootstrap >/dev/null
grep -q 'local-edit-not-yet-encrypted' "$d/.env" \
  && ok "bootstrap refuses to overwrite an existing .env" \
  || bad "BOOTSTRAP DESTROYED LOCAL SECRETS"

# 9 — No key, no decrypt. Must fail loudly rather than report "in sync" by
#     comparing nothing against nothing.
d=$(sandbox); printf 'ALPHA=one\n' > "$d/.env"
sync "$d" encrypt >/dev/null
rm "$d/.env.keys"
expect 1 "$(sync "$d" check)" "check fails when .env.keys is missing"
expect 1 "$(sync "$d" bootstrap)" "bootstrap refuses without .env.keys"

# 11 — THE process.env OVERLAY TRAP. dotenvx overlays the shell environment on
#      both encrypt and decrypt: an exported var whose name collides with a key
#      (a bare STUDIO_HOST=studio in someone's shell is enough) silently
#      substitutes its value. Undetected, `check` cries phantom drift and — far
#      worse — `bootstrap` writes the SHELL's value into the new machine's .env.
#      The file on disk must win no matter what the environment holds.
d=$(sandbox); printf 'ALPHA=file-value\n' > "$d/.env"
expect 0 "$(sync_env "$d" encrypt 'ALPHA=env-value')" "encrypt ignores a colliding exported var"
expect 0 "$(sync_env "$d" check   'ALPHA=env-value')" "check ignores a colliding exported var (no phantom drift)"
rm "$d/.env"
sync_env "$d" bootstrap 'ALPHA=env-value' >/dev/null
[ "$(grep '^ALPHA=' "$d/.env")" = "ALPHA=file-value" ] \
  && ok "bootstrap writes the FILE value, not the shell's" \
  || bad "OVERLAY BUG: bootstrap wrote the shell's value into .env"

# 12 — COMMENTS DO NOT ENTER THE SIDECAR. dotenvx leaves comments untouched, so a
#      commented-out secret in .env would be committed as plaintext. encrypt must
#      build the sidecar from real KEY=value lines only.
d=$(sandbox)
printf 'ALPHA=one\n# CF_API_TOKEN=abcd1234plaintextleftbehind0000\n\nBETA=two\n' > "$d/.env"
expect 0 "$(sync "$d" encrypt)" "encrypt succeeds with a commented secret in .env"
grep -q 'plaintextleftbehind' "$d/.env.encrypted" \
  && bad "COMMENTED SECRET LEAKED into the sidecar as plaintext" \
  || ok "a commented-out secret in .env never reaches the sidecar"
# The original .env's own comment (naming CF_API_TOKEN) must not survive; dotenvx's
# added `#/` banner is expected and fine, so match the source comment specifically.
grep -q 'CF_API_TOKEN' "$d/.env.encrypted" \
  && bad "the source .env comment line survived into the sidecar" \
  || ok "and .env's own comment lines are stripped from the sidecar"
expect 0 "$(sync "$d" check)" "check is clean (comments ignored on both sides)"

# 10 — Misuse exits 2 rather than silently doing one of the three real things.
d=$(sandbox)
expect 2 "$(sync "$d" frobnicate)" "an unknown subcommand exits 2"

echo ""
echo "$pass passed, $fail failed"
[ "$fail" -eq 0 ]
