#!/usr/bin/env python3
"""Pull visitor stats from PostHog Cloud (US) for the blog.

Reads from the repo .env:
  POSTHOG_PERSONAL_API_KEY   personal API key (phx_...) — read scope, for the query API
  POSTHOG_PROJECT_ID         numeric project id (PostHog → Settings → Project)
  POSTHOG_API_HOST           default https://us.posthog.com (NOT the ingestion host)

Subcommands:
  stats  [--days N] [--host HOST]   pageviews / unique visitors over last N days (default 7)
  pages  [--days N] [--host HOST]   top pages by pageviews
  daily  [--days N] [--host HOST]   per-day pageviews & visitors

--host filters to a single domain (e.g. blog.bytesofpurpose.com); omit for all.
"""
import argparse
import json
import os
import sys
import urllib.request
import urllib.error

DEFAULT_HOST = "https://us.posthog.com"


def load_env():
    here = os.path.dirname(os.path.abspath(__file__))
    d, env_path = here, None
    for _ in range(6):
        cand = os.path.join(d, ".env")
        if os.path.exists(cand):
            env_path = cand
            break
        d = os.path.dirname(d)
    cfg = dict(os.environ)
    if env_path:
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                k, _, v = line.partition("=")
                cfg.setdefault(k.strip(), v.split("#", 1)[0].strip().strip('"').strip("'"))
    key = cfg.get("POSTHOG_PERSONAL_API_KEY")
    pid = cfg.get("POSTHOG_PROJECT_ID")
    host = cfg.get("POSTHOG_API_HOST", DEFAULT_HOST).rstrip("/")
    if not key:
        sys.exit("ERROR: POSTHOG_PERSONAL_API_KEY not set in .env")
    if not pid:
        sys.exit("ERROR: POSTHOG_PROJECT_ID not set in .env")
    return key, pid, host


def hogql(key, pid, host, query):
    url = f"{host}/api/projects/{pid}/query/"
    body = json.dumps({"query": {"kind": "HogQLQuery", "query": query}}).encode()
    req = urllib.request.Request(url, data=body, method="POST")
    req.add_header("Authorization", f"Bearer {key}")
    req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return json.load(r)
    except urllib.error.HTTPError as e:
        sys.exit(f"PostHog HTTP {e.code}: {e.read().decode()[:400]}")
    except urllib.error.URLError as e:
        sys.exit(f"Cannot reach PostHog at {url}: {e}")


def host_filter(host):
    return f"AND properties.$host = '{host}'" if host else ""


def cmd_stats(key, pid, api_host, args):
    f = host_filter(args.host)
    q = f"""
      SELECT count() AS pageviews, count(DISTINCT person_id) AS visitors
      FROM events
      WHERE event = '$pageview'
        AND timestamp >= now() - INTERVAL {args.days} DAY {f}
    """
    res = hogql(key, pid, api_host, q)
    row = (res.get("results") or [[0, 0]])[0]
    scope = args.host or "all sites"
    print(f"PostHog stats for {scope} — last {args.days} day(s):")
    print(f"  pageviews:        {row[0]}")
    print(f"  unique visitors:  {row[1]}")


def cmd_pages(key, pid, api_host, args):
    f = host_filter(args.host)
    q = f"""
      SELECT properties.$pathname AS path, count() AS views
      FROM events
      WHERE event = '$pageview'
        AND timestamp >= now() - INTERVAL {args.days} DAY {f}
      GROUP BY path ORDER BY views DESC LIMIT 25
    """
    res = hogql(key, pid, api_host, q)
    print(f"Top pages — last {args.days} day(s):")
    for path, views in res.get("results", []):
        print(f"  {views:>7}  {path}")


def cmd_daily(key, pid, api_host, args):
    f = host_filter(args.host)
    q = f"""
      SELECT toDate(timestamp) AS day, count() AS views,
             count(DISTINCT person_id) AS visitors
      FROM events
      WHERE event = '$pageview'
        AND timestamp >= now() - INTERVAL {args.days} DAY {f}
      GROUP BY day ORDER BY day
    """
    res = hogql(key, pid, api_host, q)
    print(f"Daily — last {args.days} day(s):")
    print(f"  {'date':12} {'views':>7} {'visitors':>9}")
    for day, views, visitors in res.get("results", []):
        print(f"  {str(day):12} {views:>7} {visitors:>9}")


def main():
    key, pid, api_host = load_env()
    p = argparse.ArgumentParser(description="PostHog visitor stats")
    sub = p.add_subparsers(dest="cmd", required=True)
    for name in ("stats", "pages", "daily"):
        s = sub.add_parser(name)
        s.add_argument("--days", type=int, default=7)
        s.add_argument("--host", default="blog.bytesofpurpose.com",
                       help="domain to filter ('' or 'all' for everything)")
    args = p.parse_args()
    if args.host in ("", "all"):
        args.host = None
    {"stats": cmd_stats, "pages": cmd_pages, "daily": cmd_daily}[args.cmd](
        key, pid, api_host, args)


if __name__ == "__main__":
    main()
