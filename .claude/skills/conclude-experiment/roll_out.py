#!/usr/bin/env python3
"""
Conclude a PostHog experiment by rolling the linked feature flag to 100% of the
chosen winner — the act-on-the-decision step. Read-only by default (--show);
the actual rollout (--winner control|test) uses the WRITE key.

Decision paths this supports:
  * keep CONTROL  → --winner control : flag serves control to everyone; you then
                    revert/clean up the injection point (or leave the flag pinned).
  * ship TEST     → --winner test    : flag serves test to everyone; later hard-code
                    the winner + retire the flag if you want.

It does NOT delete the flag or end the experiment record (reversible by design).
After rollout, update the experiment's timeline doc status + Outcome by hand /
via the conclude-experiment skill.

Reads creds from repo-root .env (per-var, not `source`):
  POSTHOG_PERSONAL_API_KEY (phx_, read)   POSTHOG_WRITE_API_KEY (phx_, write)
  POSTHOG_PROJECT_ID
Personal keys talk to us.posthog.com (app host).

Usage:
  python3 roll_out.py --show                       # current flag state (read-only)
  python3 roll_out.py --winner control             # pin everyone to control
  python3 roll_out.py --winner test                # pin everyone to test
"""
import argparse
import json
import os
import re
import sys
import urllib.error
import urllib.request

API_HOST = "https://us.posthog.com"
FLAG_KEY = "support-button-copy"   # edit per experiment, or pass --flag


def read_env_var(name, env_path):
    if name in os.environ and os.environ[name]:
        return os.environ[name]
    try:
        with open(env_path) as fh:
            for line in fh:
                m = re.match(rf"^{re.escape(name)}=(.*)$", line)
                if m:
                    return re.sub(r"\s*#.*$", "", m.group(1)).strip().strip("\"'")
    except FileNotFoundError:
        pass
    return None


def api(method, path, key, body=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(f"{API_HOST}{path}", data=data, method=method)
    req.add_header("Authorization", f"Bearer {key}")
    req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req) as r:
            return r.status, json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode() or "{}")


def find_flag(auth_key, pid, flag_key):
    st, d = api("GET", f"/api/projects/{pid}/feature_flags/?limit=200", auth_key)
    if st != 200:
        return None
    for f in d.get("results", []):
        if f.get("key") == flag_key:
            return f
    return None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--flag", default=FLAG_KEY, help="feature flag key")
    ap.add_argument("--show", action="store_true", help="show current flag state (read-only)")
    ap.add_argument("--winner", choices=["control", "test"], help="pin the flag to 100% of this variant (WRITE)")
    args = ap.parse_args()
    if not args.winner:
        args.show = True

    repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
    env_path = os.path.join(repo_root, ".env")
    pid = read_env_var("POSTHOG_PROJECT_ID", env_path)
    read_key = read_env_var("POSTHOG_PERSONAL_API_KEY", env_path)
    write_key = read_env_var("POSTHOG_WRITE_API_KEY", env_path)
    needs_write = bool(args.winner)
    key = write_key if needs_write else (read_key or write_key)
    if not pid:
        sys.exit("Missing POSTHOG_PROJECT_ID.")
    if needs_write and not write_key:
        sys.exit("--winner needs POSTHOG_WRITE_API_KEY (feature_flag:write scope).")
    if not key or not key.startswith("phx_"):
        sys.exit("Need a phx_ personal API key in .env.")

    flag = find_flag(key, pid, args.flag)
    if not flag:
        sys.exit(f"✗ no feature flag '{args.flag}' found in project {pid}.")
    fid = flag["id"]
    mv = (flag.get("filters", {}).get("multivariate", {}) or {}).get("variants", [])
    print(f"flag '{args.flag}' (id {fid}) active={flag.get('active')}")
    for v in mv:
        print(f"  {v.get('key'):<8} {v.get('rollout_percentage')}%")

    if args.show:
        print("\n[--show] read-only. Re-run with --winner control|test to pin 100% to a winner.")
        return

    # Pin the chosen variant to 100%, others to 0.
    new_variants = [
        {**v, "rollout_percentage": (100 if v.get("key") == args.winner else 0)}
        for v in mv
    ]
    filters = dict(flag.get("filters", {}))
    filters["multivariate"] = {**(filters.get("multivariate") or {}), "variants": new_variants}
    print(f"\nPinning 100% → '{args.winner}' (PATCH flag {fid})…")
    st, d = api("PATCH", f"/api/projects/{pid}/feature_flags/{fid}/", key, {"filters": filters})
    if st not in (200, 201):
        print(f"✗ rollout failed ({st}): {json.dumps(d, ensure_ascii=False)}")
        sys.exit(1)
    print(f"✓ '{args.winner}' now served to 100%. Reversible: re-run with the other winner, "
          "or restore 50/50 in the UI.")
    print("Next: update the experiment timeline doc (status → rolled-out/abandoned, fill Outcome), "
          "and optionally hard-code the winner + retire the flag.")


if __name__ == "__main__":
    main()
