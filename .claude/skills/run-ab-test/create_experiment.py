#!/usr/bin/env python3
"""
Create (or inspect) a PostHog experiment + its multivariate feature flag via the
REST API — no browser clicks. The official @posthog/cli has no flag/experiment
create command, but the REST API does, and it's scriptable with the personal
(phx_) key.

Reads credentials from the repo-root .env (per-var, NOT `source` — some values
contain shell-special chars that blank later vars; see CLAUDE.md):
  POSTHOG_PERSONAL_API_KEY  (phx_…)   — required, the bearer token
  POSTHOG_PROJECT_ID                   — required, numeric project id
Personal keys talk to the APP host (us.posthog.com), not the ingestion host in
POSTHOG_HOST (us.i.posthog.com).

The intended skill flow is:  create DRAFT → validate → (ask the human) → launch.

Usage:
  python3 create_experiment.py --check       # dry-run: show what WOULD be created, do nothing
  python3 create_experiment.py --create       # POST a DRAFT experiment (no traffic bucketed yet)
  python3 create_experiment.py --validate     # read the draft back; check variants/goal/draft state
  python3 create_experiment.py --launch       # start the existing draft (begins bucketing real traffic)
  python3 create_experiment.py --create --launch   # create + launch in one shot (skips the ask gate)

This script is intentionally split so the "go live" step stays a separate, deliberate
action: --check/--validate are read-only; --create makes a dormant draft; --launch is
the outward-facing step that starts splitting real traffic. Default is --check.
"""
import argparse
import json
import os
import re
import sys
import urllib.error
import urllib.request

API_HOST = "https://us.posthog.com"

# --- The experiment definition. Mirror of src/experiments.ts['support-button-copy']. ---
FLAG_KEY = "support-button-copy"
EXPERIMENT_NAME = "Support button copy"
CONVERSION_EVENT = "support button clicked"
VARIANTS = [
    {"key": "control", "name": "Buy me a coffee ☕", "rollout_percentage": 50},
    {"key": "test", "name": "Support the dev \U0001f49c", "rollout_percentage": 50},
]


def read_env_var(name, env_path):
    """Per-var .env extraction (robust to shell-special chars in other lines)."""
    if name in os.environ and os.environ[name]:
        return os.environ[name]
    try:
        with open(env_path) as fh:
            for line in fh:
                m = re.match(rf"^{re.escape(name)}=(.*)$", line)
                if m:
                    val = m.group(1)
                    val = re.sub(r"\s*#.*$", "", val)  # strip trailing comment
                    return val.strip().strip("\"'")
    except FileNotFoundError:
        pass
    return None


def api(method, path, key, body=None):
    url = f"{API_HOST}{path}"
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Authorization", f"Bearer {key}")
    req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode() or "{}")


def find_existing(auth_key, pid, kind):
    """kind in {'feature_flags','experiments'}. Returns the record matching FLAG_KEY, or None.
    auth_key is the API bearer token (NOT the experiment's flag key — those got confused once)."""
    field = "key" if kind == "feature_flags" else "feature_flag_key"
    status, data = api("GET", f"/api/projects/{pid}/{kind}/?limit=200", auth_key)
    if status != 200:
        return None
    for r in data.get("results", []):
        if r.get(field) == FLAG_KEY:
            return r
    return None


def is_launched(exp):
    """An experiment is 'running' once start_date is set (and not yet ended)."""
    return bool(exp.get("start_date")) and not exp.get("end_date")


def validate_experiment(exp):
    """Check the read-back experiment matches our intended config. Returns (ok, lines)."""
    lines = []
    ok = True

    def check(cond, msg):
        nonlocal ok
        lines.append(("✓" if cond else "✗") + " " + msg)
        ok = ok and cond

    flag = exp.get("feature_flag")
    flag_variants = []
    if isinstance(flag, dict):
        flag_variants = (flag.get("filters", {}).get("multivariate", {}) or {}).get("variants", []) or []
    got = {v.get("key"): v.get("rollout_percentage") for v in flag_variants}
    want = {v["key"]: v["rollout_percentage"] for v in VARIANTS}
    check(got == want, f"variants 50/50 control+test  (got {got or 'none'})")

    events = (exp.get("filters", {}) or {}).get("events", []) or []
    goal = events[0].get("id") if events else None
    check(goal == CONVERSION_EVENT, f"goal metric = '{CONVERSION_EVENT}'  (got '{goal}')")

    check(not is_launched(exp), "still in DRAFT (start_date empty) — safe, no traffic bucketed yet")
    return ok, lines


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--create", action="store_true", help="create (POST) a DRAFT experiment")
    ap.add_argument("--validate", action="store_true", help="read the experiment back and verify variants/goal/draft state")
    ap.add_argument("--launch", action="store_true", help="start the experiment (goes live, buckets real traffic)")
    ap.add_argument("--check", action="store_true", help="dry-run (default): show plan, change nothing")
    args = ap.parse_args()
    if not (args.create or args.validate or args.launch):
        args.check = True

    repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
    env_path = os.path.join(repo_root, ".env")
    pid = read_env_var("POSTHOG_PROJECT_ID", env_path)
    read_key = read_env_var("POSTHOG_PERSONAL_API_KEY", env_path)
    write_key = read_env_var("POSTHOG_WRITE_API_KEY", env_path)
    needs_write = args.create or args.launch
    # Write ops (create/launch) use the scoped write key; read ops (check/validate)
    # use the read-only key. Keeping them separate is least-privilege by design.
    key = write_key if needs_write else (read_key or write_key)
    if not pid:
        sys.exit("Missing POSTHOG_PROJECT_ID (.env or env).")
    if needs_write and not write_key:
        sys.exit("--create/--launch need POSTHOG_WRITE_API_KEY (a phx_ key with "
                 "experiment:write + feature_flag:write scopes). Add it to .env.")
    if not key:
        sys.exit("Missing POSTHOG_PERSONAL_API_KEY / POSTHOG_WRITE_API_KEY (.env or env).")
    if not key.startswith("phx_"):
        sys.exit(f"Personal API key should start with phx_ (got {key[:6]}…). "
                 "The phc_ project key can't manage experiments.")

    print(f"project={pid}  flag={FLAG_KEY}  goal='{CONVERSION_EVENT}'")
    for v in VARIANTS:
        print(f"  variant {v['key']:<8} {v['rollout_percentage']}%  → {v['name']}")

    existing_exp = find_existing(key, pid, "experiments")

    # ---- --validate : read the existing experiment back and check its config ----
    if args.validate:
        if not existing_exp:
            sys.exit(f"\n✗ no experiment '{FLAG_KEY}' exists yet. Run --create first.")
        # GET the full record (the list view may be summarized).
        st, exp = api("GET", f"/api/projects/{pid}/experiments/{existing_exp['id']}/", key)
        if st != 200:
            sys.exit(f"✗ couldn't read experiment {existing_exp['id']} ({st}).")
        print(f"\nvalidating experiment id {exp['id']}:")
        ok, lines = validate_experiment(exp)
        for ln in lines:
            print("  " + ln)
        if not ok:
            sys.exit("\n✗ validation failed — fix in the UI or recreate before launching.")
        print("\n✓ draft looks correct. Ready to launch when you are (--launch).")
        return

    # ---- --launch (without --create) : start an existing draft ----
    if args.launch and not args.create:
        if not existing_exp:
            sys.exit(f"\n✗ no experiment '{FLAG_KEY}' to launch. Run --create first.")
        st, exp = api("GET", f"/api/projects/{pid}/experiments/{existing_exp['id']}/", key)
        if st == 200 and is_launched(exp):
            print(f"\n⚠️  experiment {exp['id']} is already running (start_date {exp.get('start_date')}). Nothing to do.")
            return
        _launch(api, pid, key, existing_exp["id"])
        return

    # ---- create path (shared by --check, --create, --create --launch) ----
    existing_flag = find_existing(key, pid, "feature_flags")
    if existing_exp:
        print(f"\n⚠️  experiment already exists (id {existing_exp['id']}). "
              "Use --validate or --launch instead of --create.")
        return
    if existing_flag:
        print(f"\n⚠️  a feature flag '{FLAG_KEY}' already exists (id {existing_flag['id']}).")
        print("   The experiment endpoint wants to create its own flag — delete the bare flag "
              "first, or create the experiment in the UI linking this flag.")
        return

    # PostHog creates the linked multivariate flag when you POST the experiment with
    # parameters.feature_flag_variants. Created in DRAFT (start_date=None) unless launched.
    payload = {
        "name": EXPERIMENT_NAME,
        "feature_flag_key": FLAG_KEY,
        "description": "A/B: which Support-button copy drives more clicks. "
                       "Injection point: src/components/SupportButton.",
        "parameters": {
            "feature_flag_variants": [
                {"key": v["key"], "rollout_percentage": v["rollout_percentage"]} for v in VARIANTS
            ],
        },
        "filters": {
            "events": [{"id": CONVERSION_EVENT, "name": CONVERSION_EVENT, "type": "events", "order": 0}],
        },
    }

    if args.check:
        print("\n[--check] dry-run. Would POST to "
              f"/api/projects/{pid}/experiments/ :")
        print(json.dumps(payload, indent=2, ensure_ascii=False))
        print("\nRe-run with --create to create a DRAFT (recommended), then --validate, then --launch.")
        return

    print(f"\nPOST /api/projects/{pid}/experiments/ …")
    status, data = api("POST", f"/api/projects/{pid}/experiments/", key, payload)
    if status not in (200, 201):
        print(f"✗ create failed ({status}):")
        print(json.dumps(data, indent=2, ensure_ascii=False))
        sys.exit(1)
    exp_id = data.get("id")
    flag = data.get("feature_flag")
    flag_id = flag.get("id") if isinstance(flag, dict) else flag
    print(f"✓ created experiment id {exp_id} (DRAFT)  flag id {flag_id}")

    if args.launch:
        _launch(api, pid, key, exp_id)
    else:
        print("Left in DRAFT (no traffic bucketed). Next: --validate, then --launch.")


def _launch(api_fn, pid, key, exp_id):
    """PATCH start_date to now — marks the experiment running. The outward-facing step."""
    from datetime import datetime, timezone
    # Timestamp generated client-side at run time; fine for a one-shot script.
    now = datetime.now(timezone.utc).isoformat()
    print(f"Launching experiment {exp_id} (PATCH start_date={now})…")
    st, d2 = api_fn("PATCH", f"/api/projects/{pid}/experiments/{exp_id}/", key, {"start_date": now})
    if st not in (200, 201):
        print(f"✗ launch failed ({st}): {json.dumps(d2, ensure_ascii=False)}")
        sys.exit(1)
    print(f"✓ launched at {now}. Variants now bucket real traffic 50/50. "
          "Confirm the split with query-posthog once events flow.")


if __name__ == "__main__":
    main()
