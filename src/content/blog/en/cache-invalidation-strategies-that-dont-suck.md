---
title: 'Cache Invalidation Strategies That Don''t Suck: HTTP Caching, Debugging, and Not Serving Stale Garbage'
date: '2026-07-27'
tags:
  - networking
  - backend
  - docker
  - observability
  - bash
  - api
  - python
  - nginx
  - cache
  - optimization
description: >-
  Master HTTP caching headers, debug cache misses with curl, and build invalidation strategies that work — without vendor lock-in or magic.
---

Cache invalidation is one of the two hard things in computer science, mostly because the other one — naming things — is how you screw up the first. You’ve seen it: a stray `Set-Cookie` on a JSON endpoint nukes your CDN hit rate. A missing `Vary: Accept-Encoding` serves gzipped garbage to a client that can’t decode it. Your `max-age=31536000` on versioned assets works great until you need to rotate a signing key yesterday.

This isn’t a theory post. It’s the checklist I run through every time a caching bug lands in my lap — headers that actually matter, `curl` incantations that reveal what the CDN sees, invalidation patterns that don’t require a PhD in distributed systems, and a Docker Compose stack you can spin up to watch the headers flow in real time. By the end you’ll know exactly which `Cache-Control` directives earn their keep, how to design cache keys that survive deployments, and the one `stale-while-revalidate` trick that lets you sleep through a cache purge.

## The Header Taxonomy: What Actually Matters

Most developers treat `Cache-Control` like a horoscope — copy a string from Stack Overflow, hope the stars align, and wonder why the CDN serves last week's CSS. Let's stop guessing. Here's every directive that earns its keep, what it actually does, and when to reach for it.

| Directive | Who obeys it | When to use it |
|-----------|--------------|----------------|
| `public` | Everyone (browser, CDN, proxy) | Static assets, public API responses, anything without auth |
| `private` | Browser only | User-specific JSON, HTML with CSRF tokens, anything behind a session |
| `no-store` | Everyone — **do not write to disk** | Secrets, PII, `/auth/me`, payment responses |
| `no-cache` | Everyone — **revalidate every time** | Mutating endpoints, search results, "freshness matters more than speed" |
| `must-revalidate` | Everyone — stale = dead | Financial data, inventory counts, anything where stale is wrong |
| `max-age=N` | Browser + shared caches | Your baseline TTL; `31536000` for versioned assets, `300` for API |
| `s-maxage=N` | **Shared caches only** (CDN, proxies) | Override `max-age` for edge without touching browser cache |
| `stale-while-revalidate=N` | Everyone | Serve stale up to N seconds while async revalidation runs — **the sleep-through-a-purge directive** |
| `stale-if-error=N` | Everyone | Serve stale up to N seconds when origin returns 5xx — your incident buffer |
| `immutable` | Browser | Versioned assets (`/app.a1b2c3.js`) — tells browser "never revalidate, ever" |

**The combo moves:**
- Versioned assets: `Cache-Control: public, max-age=31536000, immutable`
- HTML entry point: `Cache-Control: no-cache, must-revalidate` (or `max-age=0, must-revalidate`)
- Private API: `Cache-Control: private, max-age=60, stale-while-revalidate=300`
- Public API: `Cache-Control: public, max-age=60, s-maxage=300, stale-while-revalidate=600`

### The `Vary` Trap

`Vary` tells caches: "this response differs by these request headers." Get it wrong and you fragment the cache into useless shards. `Vary: Accept-Encoding` is the **only** value you probably need — it lets the CDN store gzip and brotli variants separately. `Vary: Accept` for content negotiation? Fine. `Vary: User-Agent`? You've created a cache entry per browser version. `Vary: Cookie`? Congratulations, you just disabled caching for every logged-in user.

```python
# header_echo.py — run: pip install flask && python header_echo.py
from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route("/echo", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
def echo():
    # Filter noise; keep what caching cares about
    interesting = {
        k: v for k, v in request.headers
        if k.lower() in {
            "host", "user-agent", "accept", "accept-encoding",
            "accept-language", "cache-control", "if-none-match",
            "if-modified-since", "cookie", "authorization",
            "x-forwarded-for", "x-forwarded-proto", "via"
        }
    }
    return jsonify({
        "method": request.method,
        "path": request.path,
        "query": dict(request.args),
        "headers": interesting,
        "remote_addr": request.remote_addr,
    })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080)
```

Spin it up, hit `curl -H "Accept-Encoding: gzip" localhost:8080/echo`, and watch the `Vary` logic play out in real time. Next section: we'll wire this into a Docker Compose stack with a real CDN in front so you can see the headers mutate at each hop.

## Debugging with curl: See What the CDN Sees

Your browser's DevTools lie. They show what the browser *received* after the service worker, the browser cache, and three extensions mangled the headers. `curl` shows what the wire actually carries — provided you stop using it like a `wget` alias.

Start with the flags that matter. `-v` (or `-i` for headers-only) prints the full response. `--compressed` asks for gzip/br and *automatically decompresses* — critical because CDNs often serve different `ETag` values for compressed vs. identity responses. `-H 'Accept-Encoding: gzip, br'` without `--compressed` lets you inspect the raw `Content-Encoding` and `Vary` headers. `--resolve example.com:443:1.2.3.4` forces SNI and host header to your staging box without touching `/etc/hosts`. And the verdict printer:

```bash
-o /dev/null -w 'http=%{http_code} age=%{header_age} cache=%{header_x-cache} cf=%{header_cf-cache-status} etag=%{header_etag} vary=%{header_vary}\n'
```

`Age` tells you how many seconds the object sat in a shared cache. `X-Cache` (or `CF-Cache-Status`, `X-Served-By`, `Via`) reveals *which* layer served it. `Vary` exposes whether the cache key fragments on `Accept-Encoding`, `Accept`, or your custom `X-Device-Type`.

Wrap it into a shell function you can source in `.bashrc`:

```bash
cache-debug() {
  local url="${1:?usage: cache-debug <url> [extra curl args]}"
  shift
  curl -sS -o /dev/null \
    -H 'Accept-Encoding: gzip, br' \
    --compressed \
    -w 'http=%{http_code} age=%{header_age} cache=%{header_x-cache} cf=%{header_cf-cache-status} etag=%{header_etag} vary=%{header_vary}\n' \
    "$@" "$url"
}
```

Now spin up a local lab that mirrors origin → edge → client. Save this `docker-compose.yml`:

```yaml
services:
  origin:
    build: .
    image: cache-lab-origin
    environment:
      - FLASK_APP=app.py
    ports: ["8080:8080"]

  edge:
    image: nginx:alpine
    ports: ["8081:80"]
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on: [origin]
```

`app.py` — a Flask endpoint that returns a timestamp and `ETag` based on file mtime:

```python
from flask import Flask, make_response
import os, time
app = Flask(__name__)
PATH = "/tmp/asset.txt"

@app.route("/asset")
def asset():
    with open(PATH, "w") as f:
        f.write(str(time.time()))
    stat = os.stat(PATH)
    etag = f'W/"{stat.st_mtime_ns}-{stat.st_size}"'
    resp = make_response(open(PATH).read())
    resp.headers["ETag"] = etag
    resp.headers["Cache-Control"] = "public, max-age=60, stale-while-revalidate=30"
    resp.headers["Last-Modified"] = time.strftime("%a, %d %b %Y %H:%M:%S GMT", time.gmtime(stat.st_mtime))
    return resp

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080)
```

`nginx.conf` — a minimal reverse proxy that adds `X-Cache` and respects `stale-while-revalidate`:

```nginx
events { worker_connections 1024; }
http {
  proxy_cache_path /tmp/cache levels=1:2 keys_zone=lab:10m inactive=60m use_temp_path=off;
  server {
    listen 80;
    location / {
      proxy_pass http://origin:8080;
      proxy_cache lab;
      proxy_cache_valid 200 60s;
      proxy_cache_use_stale updating http_500 http_502 http_503 http_504;
      add_header X-Cache $upstream_cache_status;
      proxy_set_header Host $host;
    }
  }
}
```

Build and run:

```bash
docker compose up --build -d
```

Hit the origin directly:

```bash
cache-debug http://localhost:8080/asset
# http=200 age= cache= etag=W/"1723456789123456789-17" vary=Accept-Encoding
```

Hit the edge (nginx):

```bash
cache-debug http://localhost:8081/asset
# http=200 age=0 cache=MISS etag=W/"1723456789123456789-17" vary=Accept-Encoding
```

Hit it again — `HIT`, `age` increments:

```bash
cache-debug http://localhost:8081/asset
# http=200 age=2 cache=HIT etag=W/"1723456789123456789-17" vary=Accept-Encoding
```

Now you see exactly what the CDN sees. No browser cache, no service worker, no lies.

## The Set-Cookie Footgun and Other Silent Killers

You shipped a JSON API. The CDN shows 0% hit rate. You check the response headers and there it is: `Set-Cookie: session=abc123; Path=/; HttpOnly` on every `/api/users` call. Congratulations — you just opted every authenticated request out of caching because most CDNs treat `Set-Cookie` as "this response is personal, don't cache it." The fix isn't removing cookies from your app; it's stripping them at the edge for public endpoints.

```nginx
# nginx.conf — strip cookies on API routes that shouldn't set them
map $request_uri $strip_cookie {
    ~^/api/(public|health)  1;
    default                0;
}

server {
    location /api/ {
        proxy_pass http://backend;
        proxy_hide_header Set-Cookie;
        # Only hide if map matches — keep auth endpoints intact
        if ($strip_cookie) {
            proxy_hide_header Set-Cookie;
        }
    }
}
```

Test it:

```bash
curl -I -H "Accept: application/json" https://api.example.com/api/public/status
# Before: Set-Cookie: session=...
# After:  (no Set-Cookie header)
```

---

**Missing `Vary: Accept-Encoding`** is the silent data-corruption bug. Your origin serves gzipped JSON. The CDN caches it. A client without gzip support (old IoT device, misconfigured proxy) gets the cached gzip stream and chokes.

```bash
curl -I -H "Accept-Encoding: gzip" https://api.example.com/data
# Response: Content-Encoding: gzip, Vary: Accept-Encoding  ✓

curl -I -H "Accept-Encoding: identity" https://api.example.com/data
# Response: Content-Encoding: gzip, Vary: Accept-Encoding  ✗ (served gzip to non-gzip client)
```

Fix: ensure your origin *always* sends `Vary: Accept-Encoding` when compression is enabled. In nginx:

```nginx
gzip on;
gzip_vary on;  # adds Vary: Accept-Encoding automatically
```

---

**`Pragma: no-cache` cargo-culting** — it's HTTP/1.0 garbage that does nothing in HTTP/1.1+. If you see it, delete it. It's not a fallback; it's noise.

```bash
curl -I https://example.com/asset.js | grep -i pragma
# Pragma: no-cache  ← delete this line from your config
```

---

**`Cache-Control: no-store` on public assets** — usually a copy-paste from an auth endpoint. Your logo, your CSS, your versioned JS bundles: they want `public, max-age=31536000, immutable`. `no-store` forces every client to revalidate on every page load.

```bash
curl -I https://cdn.example.com/app.abc123.js
# Cache-Control: no-store  ← wrong
# Cache-Control: public, max-age=31536000, immutable  ← right
```

---

**ETag mismatches across container restarts** — your app generates `ETag: W/"abc123"` based on in-memory state or filesystem inode. Deploy rolls pods, inode changes, ETag changes, every client revalidates and misses cache.

```bash
# Before deploy
curl -I https://api.example.com/data | grep etag
# ETag: W/"inode-42-size-1024"

# After deploy (new container, new inode)
curl -I https://api.example.com/data | grep etag
# ETag: W/"inode-87-size-1024"  ← cache miss storm
```

Fix: derive ETags from content hash, not metadata. In your app:

```python
import hashlib
def etag_for(body: bytes) -> str:
    return f'W/"{hashlib.sha256(body).hexdigest()[:16]}"'
```

Or let nginx handle it for static files:

```nginx
etag on;  # uses Last-Modified + content hash for static files
```

Five footguns. Five one-line fixes. Your hit rate just doubled.

## Cache Key Design: Versioning, Fingerprints, and the Immutable Flag

Query-string versioning (`/app.js?v=1.2.3`) is the caching equivalent of writing your password on a sticky note — it works until it doesn't. Most CDNs and browsers treat query strings as cache key components, but some strip them entirely (looking at you, older Cloudflare configs and certain corporate proxies). Worse, `?v=123` says nothing about *content* — you can bump the version without changing a byte, or forget to bump it after a real change. Either way you lose: cache misses or stale assets.

Content-hash filenames (`app.a1b2c3.js`) are the only strategy that survives contact with reality. The hash *is* the content fingerprint. Change one byte, the filename changes, the cache key changes, the old file expires naturally. No purge API calls, no "did I remember to increment the version?" anxiety.

Generate hashes at build time with a one-liner that works in any CI pipeline:

```bash
# Bash + coreutils — no Node required
find dist -type f -name '*.js' -o -name '*.css' | while read f; do
  hash=$(sha256sum "$f" | cut -c1-8)
  mv "$f" "${f%.*}.$hash.${f##*.}"
done
```

Prefer Node? Same result, zero deps:

```bash
node -e "
const fs = require('fs'), crypto = require('crypto');
fs.readdirSync('dist').forEach(f => {
  if (!/\.(js|css)$/.test(f)) return;
  const hash = crypto.createHash('sha256').update(fs.readFileSync(`dist/${f}`)).digest('hex').slice(0, 8);
  fs.renameSync(`dist/${f}`, `dist/${f.replace(/\.(js|css)$/, '.' + hash + '.$1')}`);
});
"
```

Now the `Cache-Control` header for these fingerprinted assets:

```
Cache-Control: max-age=31536000, immutable
```

That's it. One year, `immutable` tells the browser "this byte sequence will never change, don't even send a conditional request." RFC 8246 made it standard; every modern browser respects it. Drop `must-revalidate`, drop `public` — `immutable` implies both. If you're still shipping `max-age=31536000` without `immutable`, you're wasting round-trips on `If-None-Match` checks that will always return 304.

HTML is the exception. You *want* HTML to revalidate because it references those fingerprinted assets. Give it a short `max-age` with a generous stale window:

```
Cache-Control: max-age=600, stale-while-revalidate=86400
```

Ten minutes fresh, 24 hours stale-while-revalidate. The browser serves cached HTML instantly while fetching a fresh copy in the background. Deploy a broken build? Users see the old HTML (with its old asset references) for up to a day while you roll back. No cache purge required, no 404s on missing hashed assets. That's the safety net that lets you sleep through a Friday deploy.

## Invalidation Without Tears: Purge, Bypass, and Soft Purge

Three ways to clear a cache, each with different pain thresholds. **Hard purge** hits the CDN API — instant, authoritative, and rate-limited into oblivion if you're not careful. **Cache-busting via key change** (fingerprinted filenames, immutable `max-age`) is the "correct" answer until you need to rotate a signing key *now* and can't wait for clients to re-fetch. **Soft purge** via `stale-while-revalidate` is the civilized option: serve stale content immediately while revalidating in the background. Your users see zero latency spikes; your origin sees a single revalidation request instead of a thundering herd.

I reach for soft purge by default. Hard purge is for "we leaked PII in a cached response" emergencies. Key rotation is for deployments.

Here's a portable purger that speaks Cloudflare, Fastly, and nginx without a single vendor SDK. Save as `purge.py`:

```python
#!/usr/bin/env python3
import os, sys, json, urllib.request, urllib.error

URLS = [u.strip() for u in os.getenv("PURGE_URLS", "").split() if u.strip()]
CF_ZONE = os.getenv("CF_ZONE_ID")
CF_TOKEN = os.getenv("CF_API_TOKEN")
FASTLY_SERVICE = os.getenv("FASTLY_SERVICE_ID")
FASTLY_TOKEN = os.getenv("FASTLY_API_TOKEN")
NGINX_CONTAINER = os.getenv("NGINX_CONTAINER")  # e.g. "my-nginx"

def http(method, url, headers=None, data=None):
    req = urllib.request.Request(url, data=data, headers=headers or {}, method=method)
    with urllib.request.urlopen(req, timeout=10) as resp:
        return resp.read(), resp.status

def purge_cloudflare(urls):
    if not (CF_ZONE and CF_TOKEN):
        return
    payload = json.dumps({"files": urls}).encode()
    headers = {"Authorization": f"Bearer {CF_TOKEN}", "Content-Type": "application/json"}
    http("POST", f"https://api.cloudflare.com/client/v4/zones/{CF_ZONE}/purge_cache", headers, payload)

def purge_fastly(urls):
    if not (FASTLY_SERVICE and FASTLY_TOKEN):
        return
    headers = {"Fastly-Key": FASTLY_TOKEN, "Accept": "application/json"}
    for url in urls:
        # Fastly purges by URL path; assumes same domain
        path = urllib.parse.urlparse(url).path
        http("POST", f"https://api.fastly.com/service/{FASTLY_SERVICE}/purge{path}", headers)

def purge_nginx():
    if not NGINX_CONTAINER:
        return
    os.system(f"docker exec {NGINX_CONTAINER} nginx -s reload")

if __name__ == "__main__":
    if not URLS:
        sys.exit("PURGE_URLS env var required (space-separated)")
    purge_cloudflare(URLS)
    purge_fastly(URLS)
    purge_nginx()
    print(f"Purged {len(URLS)} URLs")
```

Wire it into GitHub Actions so only changed assets get purged:

```yaml
# .github/workflows/deploy.yml
- name: Compute changed asset URLs
  id: changed
  run: |
    git diff --name-only ${{ github.event.before }} ${{ github.sha }} \
      | grep -E '\.(js|css|png|woff2)$' \
      | sed 's|^|https://cdn.example.com/|' \
      | tr '\n' ' ' > changed_urls.txt
    echo "urls=$(cat changed_urls.txt)" >> $GITHUB_OUTPUT

- name: Purge CDN
  if: steps.changed.outputs.urls != ''
  env:
    PURGE_URLS: ${{ steps.changed.outputs.urls }}
    CF_ZONE_ID: ${{ secrets.CF_ZONE_ID }}
    CF_API_TOKEN: ${{ secrets.CF_API_TOKEN }}
    FASTLY_SERVICE_ID: ${{ secrets.FASTLY_SERVICE_ID }}
    FASTLY_API_TOKEN: ${{ secrets.FASTLY_API_TOKEN }}
    NGINX_CONTAINER: cdn-nginx
  run: python3 purge.py
```

The `grep` filter is the secret sauce — purge only fingerprinted assets that actually changed. HTML entries with `max-age=0, must-revalidate` need no purge; they revalidate on every navigation.

## Local-First Cache Observatory: Docker Compose Lab

Reading headers in a blog post is fine. Watching `X-Cache: MISS` flip to `HIT` in your terminal while you toggle a `Cache-Control` directive is how the knowledge sticks. Spin this stack, poke it, break it, and you'll never guess at cache behaviour again.

### The Stack

Three containers, zero external dependencies:

- **nginx** — reverse proxy with `proxy_cache` enabled, emits `X-Cache` so you see HIT/MISS/BYPASS without digging through logs
- **flask-origin** — Python app that returns configurable headers via query params; change behaviour without rebuilding
- **cache-debug** — `curl` in a box with a Makefile so your test commands are documented and repeatable

Create a directory and drop these files in:

**docker-compose.yml**
```yaml
version: "3.9"
services:
  nginx:
    image: nginx:alpine
    ports:
      - "8080:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - nginx_cache:/var/cache/nginx
    depends_on:
      - flask-origin
  flask-origin:
    build: ./flask-origin
    expose:
      - "5000"
    environment:
      - DEFAULT_CACHE_CONTROL=public, max-age=60
  cache-debug:
    build: ./cache-debug
    depends_on:
      - nginx
volumes:
  nginx_cache:
```

**nginx.conf** — the cache logic lives here, not in a managed service you can't inspect:
```nginx
events { worker_connections 1024; }
http {
  proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=lab:10m inactive=60m use_temp_path=off;
  add_header X-Cache $upstream_cache_status;
  server {
    listen 80;
    location / {
      proxy_pass http://flask-origin:5000;
      proxy_cache lab;
      proxy_cache_key "$scheme$request_method$host$request_uri";
      proxy_cache_valid 200 302 10m;
      proxy_cache_valid 404 1m;
      proxy_cache_lock on;
      proxy_cache_use_stale updating error timeout http_500 http_502 http_503 http_504;
      add_header X-Cache-Status $upstream_cache_status;
    }
  }
}
```

**flask-origin/Dockerfile**
```dockerfile
FROM python:3.12-alpine
WORKDIR /app
RUN pip install --no-cache-dir flask gunicorn
COPY app.py .
EXPOSE 5000
CMD ["gunicorn", "-b", "0.0.0.0:5000", "app:app"]
```

**flask-origin/app.py** — headers driven by query string so you can test scenarios without editing code:
```python
import os
from flask import Flask, request, Response

app = Flask(__name__)
DEFAULT_CC = os.getenv("DEFAULT_CACHE_CONTROL", "public, max-age=60")

@app.route("/")
def index():
    cc = request.args.get("cc", DEFAULT_CC)
    vary = request.args.get("vary")
    body = f"Cache-Control: {cc}\n"
    resp = Response(body, mimetype="text/plain")
    resp.headers["Cache-Control"] = cc
    if vary:
        resp.headers["Vary"] = vary
    return resp

@app.route("/set-cookie")
def set_cookie():
    resp = Response("cookie set", mimetype="text/plain")
    resp.headers["Cache-Control"] = "public, max-age=60"
    resp.set_cookie("session", "abc123", httponly=True, secure=False, samesite="Lax")
    return resp
```

**cache-debug/Dockerfile**
```dockerfile
FROM curlimages/curl:8.7.1
WORKDIR /lab
COPY Makefile .
ENTRYPOINT ["make"]
```

**cache-debug/Makefile** — your regression suite. Run `make test-hit` from the host via `docker compose run --rm cache-debug test-hit`:
```makefile
HOST ?= nginx
BASE_URL = http://$(HOST)

test-miss:
	curl -s -o /dev/null -w "MISS: %{http_code} %{header_x_cache}\n" -H "Cache-Control: no-cache" $(BASE_URL)/?cc=public,max-age=60

test-hit:
	curl -s -o /dev/null -w "1st: %{http_code} %{header_x_cache}\n" $(BASE_URL)/?cc=public,max-age=60
	curl -s -o /dev/null -w "2nd: %{http_code} %{header_x_cache}\n" $(BASE_URL)/?cc=public,max-age=60

test-stale:
	curl -s -o /dev/null -w "Fresh: %{http_code} %{header_x_cache}\n" $(BASE_URL)/?cc=public,max-age=1,stale-while-revalidate=30
	sleep 2
	curl -s -o /dev/null -w "Stale: %{http_code} %{header_x_cache}\n" $(BASE_URL)/?cc=public,max-age=1,stale-while-revalidate=30

test-vary:
	curl -s -o /dev/null -w "No-Accept: %{http_code} %{header_x_cache}\n" $(BASE_URL)/?cc=public,max-age=60&vary=Accept-Encoding
	curl -s -o /dev/null -w "Gzip: %{http_code} %{header_x_cache}\n" -H "Accept-Encoding: gzip" $(BASE_URL)/?cc=public,max-age=60&vary=Accept-Encoding
	curl -s -o /dev/null -w "Brotli: %{http_code} %{header_x_cache}\n" -H "Accept-Encoding: br" $(BASE_URL)/?cc=public,max-age=60&vary=Accept-Encoding

test-cookie-footgun:
	curl -s -o /dev/null -w "JSON with cookie: %{http_code} %{header_x_cache}\n" $(BASE_URL)/set-cookie
	curl -s -o /dev/null -w "Second req: %{http_code} %{header_x_cache}\n" $(BASE_URL)/set-cookie

.PHONY: test-miss test-hit test-stale test-vary test-cookie-footgun
```

### Run It

```bash
docker compose up --build -d
docker compose run --rm cache-debug test-miss
docker compose run --rm cache-debug test-hit
docker compose run --rm cache-debug test-stale
docker compose run --rm cache-debug test-vary
docker compose run --rm cache-debug test-cookie-footgun
```

Watch `X-Cache` flip from `MISS` to `HIT` to `STALE` to `BYPASS`. Tweak `nginx.conf`, reload with `docker compose exec nginx nginx -s reload`, rerun the Make targets. That's the loop. No dashboard, no vendor CLI, no guessing. When your production cache behaves strangely, you'll have a mental model that matches the wire — because you watched it happen on your laptop.
