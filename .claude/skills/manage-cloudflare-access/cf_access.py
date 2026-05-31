#!/usr/bin/env python3
"""Administer Cloudflare Access apps for bytesofpurpose.com.

Reads CF_API_TOKEN (and DOMAIN) from the repo .env. Never prints secret values.

Subcommands:
  list                         List all Access apps + their policies.
  show <subdomain|app-id>      Show one app's full config + policies.
  make-public <subdomain>      Create/ensure a bypass-everyone app for that hostname.
  make-private <subdomain>     Remove the public app so the hostname falls back under
                               the wildcard (*.domain) protection. Will not touch the
                               wildcard app itself.

A "subdomain" may be a bare label ("blog") or a full host ("blog.bytesofpurpose.com").
"""
import argparse
import json
import os
import sys
import urllib.request
import urllib.error

API = "https://api.cloudflare.com/client/v4"
ACCOUNT_ID = "e22f4531704a3141ddb150ac47eabc87"  # bytesofpurpose.com account


def load_env():
    """Load CF_API_TOKEN and DOMAIN from the nearest .env (repo root)."""
    here = os.path.dirname(os.path.abspath(__file__))
    # walk up to repo root looking for .env
    d = here
    env_path = None
    for _ in range(6):
        cand = os.path.join(d, ".env")
        if os.path.exists(cand):
            env_path = cand
            break
        d = os.path.dirname(d)
    token = os.environ.get("CF_API_TOKEN")
    domain = os.environ.get("DOMAIN")
    if env_path:
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                k, _, v = line.partition("=")
                k = k.strip()
                v = v.split("#", 1)[0].strip().strip('"').strip("'")
                if k == "CF_API_TOKEN" and not token:
                    token = v
                elif k == "DOMAIN" and not domain:
                    domain = v
    if not token:
        sys.exit("ERROR: CF_API_TOKEN not found in env or .env")
    return token, (domain or "bytesofpurpose.com")


def api(token, method, path, body=None):
    url = f"{API}{path}"
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Authorization", f"Bearer {token}")
    req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req) as r:
            resp = json.load(r)
    except urllib.error.HTTPError as e:
        resp = json.load(e)
    if not resp.get("success"):
        sys.exit("API ERROR: " + json.dumps(resp.get("errors"), indent=2))
    return resp["result"]


def fqdn(sub, domain):
    return sub if "." in sub else f"{sub}.{domain}"


def get_apps(token):
    return api(token, "GET", f"/accounts/{ACCOUNT_ID}/access/apps")


def get_policies(token, app_id):
    return api(token, "GET", f"/accounts/{ACCOUNT_ID}/access/apps/{app_id}/policies")


def find_app(apps, ident, domain):
    """Match by app id or exact domain (subdomain-friendly)."""
    host = fqdn(ident, domain)
    for a in apps:
        if a.get("id") == ident or a.get("domain") == host:
            return a
    return None


def cmd_list(token, domain, args):
    apps = get_apps(token)
    for a in apps:
        pols = get_policies(token, a["id"])
        pol_str = ", ".join(f"{p['name']}={p['decision']}" for p in pols) or "(none)"
        wild = "  ← WILDCARD" if "*" in (a.get("domain") or "") else ""
        print(f"{a['domain']:38} {a['name']!r:40} id={a['id']}{wild}")
        print(f"    policies: {pol_str}")


def cmd_show(token, domain, args):
    apps = get_apps(token)
    a = find_app(apps, args.target, domain)
    if not a:
        sys.exit(f"No app for {args.target!r}")
    full = api(token, "GET", f"/accounts/{ACCOUNT_ID}/access/apps/{a['id']}")
    pols = get_policies(token, a["id"])
    full["_policies"] = pols
    print(json.dumps(full, indent=2))


def cmd_make_public(token, domain, args):
    host = fqdn(args.target, domain)
    apps = get_apps(token)
    existing = next((a for a in apps if a.get("domain") == host), None)
    if existing:
        print(f"App for {host} already exists (id={existing['id']}). "
              f"Ensuring a bypass-everyone policy...")
        pols = get_policies(token, existing["id"])
        if any(p["decision"] == "bypass" for p in pols):
            print("  Already has a bypass policy. Nothing to do — should be public.")
            return
        api(token, "POST",
            f"/accounts/{ACCOUNT_ID}/access/apps/{existing['id']}/policies",
            {"name": "Public - Bypass Everyone", "decision": "bypass",
             "precedence": 1, "include": [{"everyone": {}}]})
        print("  Added bypass-everyone policy ✓")
        return
    result = api(token, "POST", f"/accounts/{ACCOUNT_ID}/access/apps", {
        "name": f"{host.split('.')[0].title()} (Public)",
        "type": "self_hosted",
        "domain": host,
        "session_duration": "24h",
        "policies": [{"name": "Public - Bypass Everyone", "decision": "bypass",
                      "precedence": 1, "include": [{"everyone": {}}]}],
    })
    print(f"Created public app for {host}: id={result['id']} ✓")
    print(f"  {host} is now publicly accessible (overrides wildcard).")


def cmd_make_private(token, domain, args):
    host = fqdn(args.target, domain)
    apps = get_apps(token)
    app = next((a for a in apps if a.get("domain") == host), None)
    if not app:
        sys.exit(f"No specific app for {host}. It may already be private via the wildcard.")
    if "*" in (app.get("domain") or ""):
        sys.exit(f"REFUSING: {host} resolves to a WILDCARD app ({app['name']!r}). "
                 f"Deleting it would expose every other subdomain. Aborting.")
    api(token, "DELETE", f"/accounts/{ACCOUNT_ID}/access/apps/{app['id']}")
    print(f"Deleted public app {app['name']!r} ({app['id']}).")
    print(f"  {host} now falls back under the wildcard Access protection.")


def main():
    token, domain = load_env()
    p = argparse.ArgumentParser(description="Manage Cloudflare Access for "
                                            "bytesofpurpose.com")
    sub = p.add_subparsers(dest="cmd", required=True)
    sub.add_parser("list")
    s = sub.add_parser("show"); s.add_argument("target")
    s = sub.add_parser("make-public"); s.add_argument("target")
    s = sub.add_parser("make-private"); s.add_argument("target")
    args = p.parse_args()
    {"list": cmd_list, "show": cmd_show,
     "make-public": cmd_make_public, "make-private": cmd_make_private}[args.cmd](
        token, domain, args)


if __name__ == "__main__":
    main()
