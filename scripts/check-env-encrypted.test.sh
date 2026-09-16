#!/usr/bin/env bash
# check-env-encrypted.test.sh — the gate must fire, and must fire for the right reason.
#
# Why this test is not optional: removing `.env` from .gitignore removed the only
# thing standing between a plaintext credential and a push. check-env-encrypted.sh
# is what replaced it. A gate whose failing direction was never exercised is
# indistinguishable from no gate at all, and it fails silently — the commit
# succeeds, which is precisely what it looks like when the gate is working and
# the file is clean.
#
# So every case below asserts BOTH directions: the bad input is rejected, the
# good input is accepted. Needs no network, no .env, and no dotenvx.
# Run: bash scripts/check-env-encrypted.test.sh
set -uo pipefail

REPO=$(cd "$(dirname "$0")/.." && pwd)
GATE="$REPO/scripts/check-env-encrypted.sh"
pass=0; fail=0
ok()  { echo "  ok   — $1"; pass=$((pass + 1)); }
bad() { echo "  FAIL — $1"; fail=$((fail + 1)); }

# A throwaway repo, so `git ls-files` and `git diff --cached` have something real
# to read. Testing against the live repo would make the result depend on whatever
# happens to be committed today.
sandbox() {
  d=$(mktemp -d)
  git -C "$d" init -q
  git -C "$d" config user.email t@t.t
  git -C "$d" config user.name t
  printf '%s' "$d"
}

# stage <dir> <path> <<'EOF' … — write a file and `git add` it without committing.
stage() {
  mkdir -p "$(dirname "$1/$2")"
  cat >"$1/$2"
  git -C "$1" add -f "$2"
}

gate() { ( cd "$1" && sh "$GATE" "${2:-tracked}" ) >"$1/out" 2>"$1/err"; echo $?; }

echo "check-env-encrypted:"

# 1 — THE CASE THE GITIGNORE USED TO COVER. A plaintext value in a staged .env.
#     This is `dotenvx decrypt` followed by `git add -A`, and before this gate
#     existed it would have been a clean commit.
d=$(sandbox)
stage "$d" .env <<'EOF'
# comment
SUPABASE_SERVICE_ROLE_KEY=this-value-is-not-encrypted
EOF
rc=$(gate "$d" --staged)
[ "$rc" -ne 0 ] && ok "a plaintext value in a staged .env is blocked" \
                || bad "PLAINTEXT VALUE COMMITTED CLEAN — the gate did not fire"
grep -q 'SUPABASE_SERVICE_ROLE_KEY' "$d/err" \
  && ok "the message names the offending key" \
  || bad "the failure does not say which key"

# 2 — And the same file, encrypted, must pass. Without this the gate could be a
#     blanket `exit 1` and case 1 would still look green.
d=$(sandbox)
stage "$d" .env <<'EOF'
#/ DOTENV_PUBLIC_KEY /
DOTENV_PUBLIC_KEY="0339e5f4b1a2c3d4e5f60718293a4b5c6d7e8f90"
SUPABASE_SERVICE_ROLE_KEY="encrypted:BBFVsCA1oCpTn3E0ZQ7l+bmzO2jNPeVh"
EMPTY_ON_PURPOSE=""
export EXPORTED_TOO="encrypted:BB2mQx9rLpKd"
EOF
rc=$(gate "$d" --staged)
[ "$rc" -eq 0 ] && ok "an encrypted .env passes (public key, empty, export form)" \
               || bad "the encrypted .env was rejected: $(cat "$d/err")"

# 3 — The private key. Its leak makes every encrypted value in the repo readable,
#     so it is blocked on the filename regardless of contents.
d=$(sandbox)
stage "$d" .env.keys <<'EOF'
DOTENV_PRIVATE_KEY="not-a-real-key-0000"
EOF
rc=$(gate "$d" --staged)
[ "$rc" -ne 0 ] && ok "a staged .env.keys is blocked" \
                || bad "THE PRIVATE KEY WAS COMMITTABLE"
grep -qi 'private key' "$d/err" && ok "and it says so in those words" \
                                || bad "the .env.keys refusal is not explained"

# 4 — Tenet 29. A line the reader cannot classify is an error, not a skip. If an
#     unparseable line were skipped, `SECRET=hunter2` written in a form this
#     reader does not recognise would sail through the check that exists to stop it.
d=$(sandbox)
stage "$d" .env <<'EOF'
this line is not a comment and not KEY=value
EOF
rc=$(gate "$d" --staged)
[ "$rc" -ne 0 ] && ok "an unclassifiable line fails closed" \
                || bad "an unparseable line was SKIPPED — the gate fails open"

# 5 — .env.example is exempt and must stay exempt: it is the key list a new
#     machine reads before it has any keys, and its values are placeholders.
d=$(sandbox)
stage "$d" .env.example <<'EOF'
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
EOF
rc=$(gate "$d" --staged)
[ "$rc" -eq 0 ] && ok ".env.example stays exempt" \
               || bad ".env.example was blocked: $(cat "$d/err")"

# 6 — Nested paths, since the repo has more than one .env (packages/*/.env).
#
# The fixture value is deliberately NOT secret-shaped. The first draft used a
# PAT-shaped string and gitleaks blocked this very commit — correctly, since it
# cannot tell a test fixture from the real thing. Note that this gate does not
# care what the value looks like: it checks for the ABSENCE of an `encrypted:`
# prefix, so a boring string exercises exactly the same path.
d=$(sandbox)
stage "$d" packages/web/.env.production <<'EOF'
API_TOKEN=not-encrypted-just-a-plain-string
EOF
rc=$(gate "$d" --staged)
[ "$rc" -ne 0 ] && ok "a nested packages/web/.env.production is caught too" \
                || bad "a nested .env escaped the gate"

# 7 — --staged reads the STAGED BLOB, not the worktree. Encrypt, stage, then
#     decrypt on disk: the commit is clean and must be allowed. The mirror case
#     — stage plaintext, then encrypt on disk — must still be blocked, because
#     what gets committed is the blob, not the file you are looking at.
d=$(sandbox)
stage "$d" .env <<'EOF'
TOKEN="encrypted:BB2mQx9rLpKdXX"
EOF
cat >"$d/.env" <<'EOF'
TOKEN=plaintext-in-the-worktree-only
EOF
rc=$(gate "$d" --staged)
[ "$rc" -eq 0 ] && ok "--staged judges the staged blob, not the dirty worktree" \
               || bad "--staged read the worktree file instead of the blob"

d=$(sandbox)
stage "$d" .env <<'EOF'
TOKEN=plaintext-that-is-actually-staged
EOF
cat >"$d/.env" <<'EOF'
TOKEN="encrypted:BB2mQx9rLpKdXX"
EOF
rc=$(gate "$d" --staged)
[ "$rc" -ne 0 ] && ok "and a later encrypt on disk does not launder a staged plaintext" \
                || bad "staged plaintext passed because the worktree copy looked fine"

# 8 — tracked mode (make / CI): committed history, not the index.
d=$(sandbox)
stage "$d" .env <<'EOF'
TOKEN=plaintext
EOF
git -C "$d" commit -q -m "oops"
rc=$(gate "$d")
[ "$rc" -ne 0 ] && ok "tracked mode catches an already-committed plaintext" \
                || bad "tracked mode passed a committed plaintext"

# 9 — An untracked plaintext .env is NOT a violation. This is the normal working
#     state on a machine mid-rotation; blocking it would make the gate something
#     people disable.
d=$(sandbox)
mkdir -p "$d"; cat >"$d/.env" <<'EOF'
TOKEN=plaintext-but-never-added
EOF
rc=$(gate "$d")
[ "$rc" -eq 0 ] && ok "an untracked plaintext .env is left alone" \
               || bad "the gate fired on a file git does not track"

# 11 — THE COMMENTED-SECRET BLIND SPOT. dotenvx does not encrypt comments, so a
#      commented-out `# CF_API_TOKEN=<plaintext>` left in .env rides into the
#      COMMITTED sidecar as cleartext. A check that skips every `#` line waves it
#      through; gitleaks caught exactly this on the real sidecar. The gate must
#      block a comment that un-comments to a KEY=plaintext assignment.
d=$(sandbox)
stage "$d" .env.encrypted <<'EOF'
#/ DOTENV_PUBLIC_KEY /
DOTENV_PUBLIC_KEY="0339e5f4b1a2c3d4e5f60718293a4b5c6d7e8f90"
TOKEN="encrypted:BB2mQx9rLpKdXX"
# CF_API_TOKEN=abcd1234plaintextleftbehind0000
EOF
rc=$(gate "$d" --staged)
[ "$rc" -ne 0 ] && ok "a commented-out plaintext value is blocked" \
                || bad "COMMENTED PLAINTEXT SECRET COMMITTED CLEAN — the gate skipped a # line"
grep -q 'CF_API_TOKEN' "$d/err" && ok "and the message names the commented key" \
                                || bad "the commented-plaintext refusal does not name the key"

# 12 — …but the hardening must not turn prose comments or commented CIPHERTEXT into
#      false positives, or the gate becomes noise people route around.
d=$(sandbox)
stage "$d" .env.encrypted <<'EOF'
#/ DOTENV_PUBLIC_KEY /
DOTENV_PUBLIC_KEY="0339e5f4b1a2c3d4e5f60718293a4b5c6d7e8f90"
# this token is set in the Worker, not here
TOKEN="encrypted:BB2mQx9rLpKdXX"
# LEGACY_TOKEN=encrypted:BBoldButStillCiphertext
# EMPTY_COMMENTED=
EOF
rc=$(gate "$d" --staged)
[ "$rc" -eq 0 ] && ok "prose comments and commented ciphertext/empty pass" \
               || bad "the commented-secret check false-positived: $(cat "$d/err")"

# 10 — Misuse is an error, not a default. A typo'd flag must not silently run the
#      weaker check.
d=$(sandbox)
rc=$(gate "$d" --stagedd)
[ "$rc" -eq 2 ] && ok "an unknown mode exits 2 rather than guessing" \
                || bad "an unknown mode was treated as a valid run (rc=$rc)"

echo ""
echo "$pass passed, $fail failed"
[ "$fail" -eq 0 ]
