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
  list-idps                    List configured Zero Trust login methods (IdPs). Read-only.
  show-idp <name|id>           Show one IdP's config (secrets are redacted by the API).
  create-gated-app <path>      Create a PATH-SCOPED Access app (e.g. blog.../api/me) with
        [--policy linkedin-any]  an "allow signed-in via LinkedIn" policy, and print its
        [--host <host>]          AUD tag (needed for the Worker's POLICY_AUD var). Unlike
                                 make-public, this PROTECTS a path (the Worker's /api/*)
                                 rather than opening a host. Pass --policy linkedin-any
                                 (default) to allow any LinkedIn-authenticated user.

A "subdomain" may be a bare label ("blog") or a full host ("blog.bytesofpurpose.com").
A <path> is a full path-scoped match like "blog.bytesofpurpose.com/api/me".

NOTE: today this account uses a wildcard-private + per-host-bypass model (see SKILL.md).
create-gated-app introduces the FIRST path-scoped, IdP-policy app (for the premium
key-vending Worker). wrangler cannot manage Access — this calls the CF API directly.
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


def get_idps(token):
    return api(token, "GET", f"/accounts/{ACCOUNT_ID}/access/identity_providers")


def resolve_linkedin_idp_id(token):
    """Return the LinkedIn login-method id WITHOUT needing the IdP-read scope.

    Listing IdPs requires `Access: Identity Providers: Read`, which this token
    doesn't have. But CREATING an app (or reading an existing one) only needs
    `Access: Apps: Edit`, which it does. The account's wildcard `Private Site`
    app already gates on LinkedIn via a `require: [{login_method:{id}}]` policy,
    so we read that id off the existing policies — the same id any new app reuses.

    Order: (1) scan existing app policies for a login_method id; (2) try the IdP
    list endpoint (works if the scope is present); (3) fall back to the known id.
    """
    # (1) Read it from an existing policy (works with Apps:Edit).
    try:
        for a in get_apps(token):
            for p in get_policies(token, a["id"]):
                for clause in (p.get("require") or []) + (p.get("include") or []):
                    lm = clause.get("login_method") if isinstance(clause, dict) else None
                    if lm and lm.get("id"):
                        return lm["id"]
    except SystemExit:
        pass
    # (2) Try the IdP list (needs Identity Providers: Read).
    try:
        for i in get_idps(token):
            if i.get("type") == "linkedin" or "linkedin" in (i.get("name", "").lower()):
                return i["id"]
    except SystemExit:
        pass
    # (3) Known LinkedIn IdP id on this account (see private-site/agent/
    #     sync-access-emails.sh; verified live 2026-06-02).
    return "cf942d89-9ecb-49a0-909c-f46dcdd9f9e8"


def cmd_list_idps(token, domain, args):
    idps = get_idps(token)
    if not idps:
        print("(no identity providers configured)")
        return
    for i in idps:
        print(f"{i.get('type',''):16} {i.get('name','')!r:30} id={i.get('id')}")


def cmd_show_idp(token, domain, args):
    idps = get_idps(token)
    target = args.target
    idp = next(
        (i for i in idps if i.get("id") == target or i.get("name") == target), None
    )
    if not idp:
        sys.exit(f"No IdP matching {target!r}. Run list-idps to see names/ids.")
    # The API redacts client_secret; safe to print.
    print(json.dumps(idp, indent=2))


def cmd_create_gated_app(token, domain, args):
    """Create ONE path-scoped Access app covering all given paths (one AUD).

    Pass one or more path matches; they go into a single app's self_hosted_domains
    so the Worker validates against a SINGLE POLICY_AUD. Prints the AUD tag.
    Idempotent: if an app already owns these exact paths, prints its AUD.
    """
    paths = args.target if isinstance(args.target, list) else [args.target]
    for p in paths:
        if "/" not in p:
            sys.exit(
                f"{p!r} is not a path-scoped match. Pass e.g. "
                f"'blog.{domain}/api/me'."
            )
    primary = paths[0]

    apps = get_apps(token)
    # Match an existing app that owns the primary path (as domain or in domains).
    existing = next(
        (a for a in apps
         if a.get("domain") == primary
         or primary in (a.get("self_hosted_domains") or [])),
        None,
    )
    if existing:
        full = api(token, "GET", f"/accounts/{ACCOUNT_ID}/access/apps/{existing['id']}")
        print(f"Gated app already exists (id={existing['id']}, "
              f"domains={full.get('self_hosted_domains')}).")
        print(f"  AUD (POLICY_AUD) = {full.get('aud')}")
        return

    if args.policy == "linkedin-any":
        # The LinkedIn IdP already exists on this account (private-site uses it).
        # Resolve its id WITHOUT the IdP-read scope by reading existing policies.
        idp_id = resolve_linkedin_idp_id(token)
        include = [{"login_method": {"id": idp_id}}]
        policy_name = "Allow - any LinkedIn user"
        print(f"  using LinkedIn login_method id={idp_id}")
    else:
        # Fallback: any authenticated identity (any configured login method).
        include = [{"everyone": {}}]
        policy_name = "Allow - any authenticated user"

    result = api(token, "POST", f"/accounts/{ACCOUNT_ID}/access/apps", {
        "name": "Access Gate (blog /api/*)",
        "type": "self_hosted",
        "self_hosted_domains": paths,
        "session_duration": "24h",
        "policies": [{
            "name": policy_name,
            "decision": "allow",
            "precedence": 1,
            "include": include,
        }],
    })
    print(f"Created gated app for {paths}: id={result['id']} ✓")
    print(f"  policy: {policy_name}")
    print(f"  AUD (set this as the Worker's POLICY_AUD var) = {result.get('aud')}")
    print("  Next: put POLICY_AUD + TEAM_DOMAIN in workers/access-gate/wrangler.toml,")
    print("        `wrangler secret put PREMIUM_PASSPHRASE`, then `wrangler deploy`.")


def cmd_add_destination(token, domain, args):
    """Add a path-scoped destination to an EXISTING gated app (by id), keeping its
    AUD, policies, and existing paths intact. Idempotent: a path already present is a
    no-op. Use to extend the '/api/*' gate when a new Worker endpoint is added (e.g.
    /api/redirect) — the AUD is unchanged, so the Worker's POLICY_AUD stays valid.

    Why a PATCH (not delete+recreate): recreating would mint a NEW AUD and break the
    Worker until wrangler.toml is updated + redeployed. Appending preserves the AUD.
    """
    app_id = args.target
    new_path = args.path
    if "/" not in new_path:
        sys.exit(f"{new_path!r} is not a path-scoped match (need e.g. 'blog.{domain}/api/redirect').")

    full = api(token, "GET", f"/accounts/{ACCOUNT_ID}/access/apps/{app_id}")
    domains = list(full.get("self_hosted_domains") or [])
    if new_path in domains:
        print(f"{new_path!r} already gated by {full.get('name')!r} (id={app_id}). No change.")
        print(f"  AUD = {full.get('aud')}")
        return

    domains.append(new_path)
    # CF derives `destinations` from self_hosted_domains on write; send both to be safe,
    # preserving the existing destinations + appending the new public URI.
    dests = list(full.get("destinations") or [])
    if not any(d.get("uri") == new_path for d in dests):
        dests.append({"type": "public", "uri": new_path})

    # The Access apps endpoint rejects PATCH under API-token auth (10405 "Method not
    # allowed for this authentication scheme") — it requires a FULL-OBJECT PUT. So we
    # echo the existing app config back, mutating only the two path fields. We strip
    # server-managed/read-only keys CF won't accept on write (ids/timestamps/aud).
    body = {k: v for k, v in full.items() if k not in (
        "id", "uid", "aud", "created_at", "updated_at",
        "destinations", "self_hosted_domains",
    )}
    body["self_hosted_domains"] = domains
    body["destinations"] = dests
    api(token, "PUT", f"/accounts/{ACCOUNT_ID}/access/apps/{app_id}", body)
    print(f"Added {new_path!r} to {full.get('name')!r} (id={app_id}). ✓")
    print(f"  self_hosted_domains now: {domains}")
    print(f"  AUD (unchanged) = {full.get('aud')}")


def cmd_delete_app_by_id(token, domain, args):
    """Delete an Access app by id (cleanup). Refuses the wildcard."""
    app = api(token, "GET", f"/accounts/{ACCOUNT_ID}/access/apps/{args.target}")
    if "*" in (app.get("domain") or ""):
        sys.exit(f"REFUSING to delete WILDCARD app {app.get('name')!r}.")
    api(token, "DELETE", f"/accounts/{ACCOUNT_ID}/access/apps/{args.target}")
    print(f"Deleted Access app {app.get('name')!r} ({args.target}).")


def main():
    token, domain = load_env()
    p = argparse.ArgumentParser(description="Manage Cloudflare Access for "
                                            "bytesofpurpose.com")
    sub = p.add_subparsers(dest="cmd", required=True)
    sub.add_parser("list")
    s = sub.add_parser("show"); s.add_argument("target")
    s = sub.add_parser("make-public"); s.add_argument("target")
    s = sub.add_parser("make-private"); s.add_argument("target")
    sub.add_parser("list-idps")
    s = sub.add_parser("show-idp"); s.add_argument("target")
    s = sub.add_parser("create-gated-app")
    s.add_argument("target", nargs="+",
                   help="one or more path-scoped matches, e.g. "
                        "blog.bytesofpurpose.com/api/me blog.bytesofpurpose.com/api/unlock-key")
    s.add_argument("--policy", default="linkedin-any",
                   choices=["linkedin-any", "any-auth"])
    s = sub.add_parser("delete-app"); s.add_argument("target", help="Access app id")
    s = sub.add_parser("add-destination",
                       help="append a path-scoped destination to an existing gated app (keeps AUD)")
    s.add_argument("target", help="Access app id")
    s.add_argument("path", help="path-scoped match, e.g. blog.bytesofpurpose.com/api/redirect")
    args = p.parse_args()
    {"list": cmd_list, "show": cmd_show,
     "make-public": cmd_make_public, "make-private": cmd_make_private,
     "list-idps": cmd_list_idps, "show-idp": cmd_show_idp,
     "create-gated-app": cmd_create_gated_app,
     "add-destination": cmd_add_destination,
     "delete-app": cmd_delete_app_by_id}[args.cmd](
        token, domain, args)


if __name__ == "__main__":
    main()
