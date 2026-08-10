---
title: 'Your Localhost Deserves a Real Domain: Cloudflare Tunnels, mTLS, and Post-Quantum Prep'
date: '2026-08-10'
tags:
  - cloudflare
  - networking
  - security
  - docker
  - tls
  - zero-trust
description: >-
  Replace ngrok with Cloudflare Tunnels, add mTLS for service-to-service auth, and prepare your origins for post-quantum authentication — all from your laptop.
---

You've got three services running locally: a Go API on :8080, a Next.js frontend on :3000, and a Postgres instance you swore you'd containerize. You need to test a webhook from Stripe, show a colleague the new dashboard, and verify your mTLS handshake works — all without committing code, opening ports on your router, or explaining to your ISP why port 443 is suddenly busy.

Enter Cloudflare Tunnels. Not the 'quick try' you did once with `cloudflared tunnel --url localhost:3000` and forgot about. I'm talking production-grade: named tunnels with config-as-code, mTLS between your local services, real certificates that browsers trust, and the new post-quantum authentication support Cloudflare just shipped for origin connections. All running from a single `docker-compose.yml` you can version control.

By the end of this post, you'll have a local development environment that exposes any service on a real hostname with valid TLS, enforces mutual TLS between services, logs every request for debugging, and is ready for the post-quantum future — without ever touching your router's port forwarding page.

## Why Your Current Localhost Setup Is Holding You Back

You know the drill. `ngrok http 3000` gives you `https://a1b2c3d4.ngrok-free.app` — valid for two hours, random subdomain every restart. Stripe webhooks? Good luck configuring a webhook endpoint that changes daily. You could pay for a reserved domain, but that's $5/month for the privilege of tunneling through someone else's infrastructure when you already have a domain sitting at Cloudflare.

Self-signed certificates are worse. `mkcert -install` works until it doesn't — your browser trusts it, but `fetch()` in your Next.js app doesn't, your Go HTTP client rejects it, and Stripe's webhook verifier absolutely refuses it. You end up with `NODE_TLS_REJECT_UNAUTHORIZED=0` in your `.env.local`, a footgun you'll forget to remove before production.

```bash
# The "it works on my machine" certificate dance
mkcert -install
mkcert localhost 127.0.0.1 ::1
# Now configure every single client to trust this CA
export SSL_CERT_FILE="$(mkcert -CAROOT)/rootCA.pem"
```

Then there's `/etc/hosts` juggling. `api.localhost`, `app.localhost`, `db.localhost` — all pointing to `127.0.0.1`. Except Docker on macOS/Windows doesn't see `127.0.0.1` the same way your host does. You switch to `host.docker.internal`, then your Go service can't reach Postgres because it's on a custom Docker network, so you add `network_mode: host` and now port conflicts eat your afternoon.

```yaml
# docker-compose.yml — the "works until it doesn't" approach
services:
  api:
    network_mode: host  # Congrats, no more port mapping, also no isolation
  postgres:
    network_mode: host  # Hope nothing else uses 5432
```

Real TLS termination? Forget it. Your reverse proxy (Caddy, Traefik, Nginx) terminates TLS locally, but the certificates aren't the same ones production uses. Header forwarding gets messy — `X-Forwarded-For`, `X-Forwarded-Proto`, `Forwarded` — and your application logic behaves differently behind a proxy than it does on bare metal.

Mutual TLS? You've read the docs. You've generated client certs with `openssl req -newkey rsa:2048 -nodes -keyout client.key -x509 -days 365 -out client.crt`. You've configured your Go server to `RequireAndVerifyClientCert`. You've spent three hours debugging `x509: certificate signed by unknown authority` because the CA chain is one file off.

Here's the Stripe webhook failure that ruins your Friday:

```bash
# Terminal 1: Your Go API
$ go run main.go
2024/01/15 14:32:11 Starting server on :8080

# Terminal 2: ngrok (free tier, random URL)
$ ngrok http 8080
Forwarding  https://x7k9m2p1.ngrok-free.app -> http://localhost:8080

# Terminal 3: Stripe CLI (because dashboard webhook config is slow)
$ stripe listen --forward-to https://x7k9m2p1.ngrok-free.app/webhook/stripe
> Ready! Your webhook signing secret is whsec_abc123...

# Terminal 4: Trigger test event
$ stripe trigger payment_intent.succeeded
> Error: webhook delivery failed: Post "https://x7k9m2p1.ngrok-free.app/webhook/stripe": 
> x509: certificate signed by unknown authority
```

Stripe's outbound webhook client doesn't trust ngrok's certificate chain on the free tier. You could upgrade, or you could stop fighting your tools and give your localhost a real domain with real certificates that everything trusts — including Stripe, your browser, and your own service-to-service calls.

## Cloudflare Tunnels: The Mental Model You Actually Need

Stop thinking of `cloudflared` as a reverse proxy. It's not. It's an **outbound-only QUIC client** that holds a persistent, multiplexed connection to Cloudflare's edge. Your laptop initiates the connection. Your router sees nothing but outbound UDP/443. No port forwarding, no firewall rules, no "wait, does my ISP block port 80?" existential crises.

```
Browser → Cloudflare Edge (TLS termination) → QUIC tunnel → cloudflared (local) → HTTP service
```

That's the entire architecture. Cloudflare terminates TLS at the edge using your real certificate (issued via ACME, managed by them). The tunnel carries plain HTTP to your local service. Your Go API on `:8080` never sees a certificate. It just sees `Host: api.dev.lacorte.dev` and processes the request.

### Named Tunnels vs. Ephemeral: Grow Up

`cloudflared tunnel --url localhost:3000` creates an **ephemeral tunnel**. Random subdomain, no config persistence, dies when you `Ctrl+C`. Fine for "hey look at this real quick." Useless for webhooks, mTLS testing, or anything that survives a laptop sleep.

**Named tunnels** are the adult version. You create them once:

```bash
cloudflared tunnel create dev-env
# Output: Created tunnel dev-env with id 123e4567-e89b-12d3-a456-426614174000
```

This gives you a stable UUID. You then configure DNS once:

```bash
cloudflared tunnel route dns dev-env api.dev.lacorte.dev
cloudflared tunnel route dns dev-env app.dev.lacorte.dev
cloudflared tunnel route dns dev-env db.dev.lacorte.dev  # yes, really
```

### The `config.yml` You'll Actually Version Control

Forget flags. Put this in `~/.cloudflared/config.yml` (or `./cloudflared/config.yml` for the Docker setup coming next):

```yaml
tunnel: 123e4567-e89b-12d3-a456-426614174000
credentials-file: /home/user/.cloudflared/123e4567-e89b-12d3-a456-426614174000.json

ingress:
  - hostname: api.dev.lacorte.dev
    service: http://host.docker.internal:8080
    originRequest:
      noTLSVerify: true
  - hostname: app.dev.lacorte.dev
    service: http://host.docker.internal:3000
  - hostname: "*.dev.lacorte.dev"
    service: http_status:404
```

**Ingress rules match top-to-bottom.** First match wins. The wildcard catch-all at the bottom prevents "tunnel not found" errors from leaking your internal structure. `host.docker.internal` works because we're running `cloudflared` in Docker — more on that in the next section.

### TLS Termination: The Edge Does the Heavy Lifting

Cloudflare provisions a valid, publicly trusted certificate for `*.dev.lacorte.dev` via Let's Encrypt (or their own CA). Your browser sees a green lock. Your local service sees `X-Forwarded-Proto: https` and plain HTTP. This is the correct default. You **do not** want to manage certs on localhost. You **do not** want `mkcert` in your Dockerfile.

The tunnel encrypts traffic between edge and origin via QUIC. That's it. Your service stays dumb and happy.

## Docker Compose: One File to Rule Them All

Here's the entire stack — tunnel, API, frontend, and database — in one file you can `git commit` and `docker compose up -d` on any machine with Docker installed. No `cloudflared` binary on the host, no systemd units, no "works on my machine" excuses.

```yaml
# docker-compose.yml
version: "3.9"

services:
  cloudflared:
    image: cloudflare/cloudflared:2024.12.0
    command: tunnel run --config /etc/cloudflared/config.yml
    volumes:
      - ./cloudflared/config.yml:/etc/cloudflared/config.yml:ro
      - ./cloudflared/credentials.json:/etc/cloudflared/credentials.json:ro
    networks:
      - appnet
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "cloudflared", "tunnel", "info"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 15s

  api:
    build: ./api
    environment:
      - DATABASE_URL=postgres://postgres:postgres@db:5432/app
      - PORT=8080
    networks:
      - appnet
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost:8080/health"]
      interval: 15s
      timeout: 5s
      retries: 3

  frontend:
    build: ./frontend
    environment:
      - NEXT_PUBLIC_API_URL=https://api.localhost.dev
    networks:
      - appnet
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost:3000"]
      interval: 15s
      timeout: 5s
      retries: 3

  db:
    image: postgres:16-alpine
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=app
    volumes:
      - pgdata:/var/lib/postgresql/data
    networks:
      - appnet
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

networks:
  appnet:
    driver: bridge

volumes:
  pgdata:
```

Notice `NEXT_PUBLIC_API_URL`: it gets baked into the frontend bundle and runs in the *browser*, which has no idea what `api` resolves to on the Docker network — that name only exists inside `appnet`. Point browser-facing env vars at the public tunnel hostname (`https://api.localhost.dev`). If your frontend also does server-side calls (SSR, route handlers), those execute inside the Docker network and can safely use `http://api:8080`.

The `cloudflared` service mounts two files: the *ingress config* that maps hostnames to internal services, and the *tunnel credentials* that prove to Cloudflare's edge which tunnel this is. Create `cloudflared/config.yml`:

```yaml
# cloudflared/config.yml
tunnel: 123e4567-e89b-12d3-a456-426614174000
credentials-file: /etc/cloudflared/credentials.json

ingress:
  - hostname: api.localhost.dev
    service: http://api:8080
    originRequest:
      httpHostHeader: api.localhost.dev
  - hostname: app.localhost.dev
    service: http://frontend:3000
    originRequest:
      httpHostHeader: app.localhost.dev
  - service: http_status:404
```

Notice the Docker DNS names in the `service:` fields: `api:8080` and `frontend:3000` — that's `cloudflared`, running on the `appnet` network, reaching your containers by their Docker DNS names. External traffic hits `api.localhost.dev` and `app.localhost.dev` (pointed at the tunnel via Cloudflare DNS), terminates TLS at the edge, and routes through the QUIC connection to the right container.

The `tunnel:` field is the UUID from `cloudflared tunnel create dev-env`, not a token — an ID and a token are different credentials, and one can't substitute for the other. Creating the tunnel writes a credentials file to `~/.cloudflared/<uuid>.json`; copy it into the (gitignored) directory you're mounting:

```bash
cp ~/.cloudflared/123e4567-e89b-12d3-a456-426614174000.json ./cloudflared/credentials.json
```

That file, mounted read-only above, is the actual secret — never commit it.

**Would rather skip managing a credentials file?** Use token mode instead: drop `credentials-file` and the `tunnel:` UUID from `config.yml`, and run `cloudflared` with a token from `cloudflared tunnel token dev-env`:

```yaml
# docker-compose.yml (cloudflared service, token mode alternative)
cloudflared:
  image: cloudflare/cloudflared:2024.12.0
  command: tunnel run --token ${TUNNEL_TOKEN}
  environment:
    - TUNNEL_TOKEN=${TUNNEL_TOKEN}
  volumes:
    - ./cloudflared/config.yml:/etc/cloudflared/config.yml:ro
  networks:
    - appnet
  restart: unless-stopped
```

The token encodes the tunnel identity, so there's no `credentials-file` mount — simpler for CI or throwaway environments, at the cost of a long-lived secret sitting in `.env`:

```bash
# .env (token mode only — keep out of version control)
TUNNEL_TOKEN=eyJhIjoi...your-token-from-cloudflare-dashboard...
```

The rest of this post assumes the local-credentials path above; swap in token mode wherever you see `credentials-file` if you'd rather go that route.

Run `docker compose up -d`. Watch `docker compose logs -f cloudflared` for the "Connection established" line. That's it. Your localhost now has real hostnames, valid certs, and a topology that survives reboots, network changes, and that one colleague who "just needs to see it real quick."

## Mutual TLS Between Local Services Without the Headache

You've got valid TLS from Cloudflare to your laptop for anything a browser hits. Now make your *services* verify *each other* — no more "trust me bro" headers, real certificate validation with a CA you control. This is service-to-service mTLS: your Go API's `:8443` listener demands a client certificate before it answers anything, and any caller — another service, a script, `curl` — has to present one signed by your CA to get through.

First, install `mkcert` and create a local CA that your OS and containers will actually trust:

```bash
# macOS
brew install mkcert nss
# Linux
sudo apt install libnss3-tools && go install filippo.io/mkcert@latest
# Windows
choco install mkcert

mkcert -install
```

The `-install` flag adds the root CA to your system trust store. Firefox needs `libnss3-tools` on Linux — mkcert tells you this, but you'll ignore it and wonder why `curl` works but Firefox doesn't.

Generate certs for each service. Use DNS names that match your tunnel config, not `localhost`:

```bash
mkdir -p certs
mkcert -key-file certs/api-key.pem -cert-file certs/api.pem \
  api.localhost "*.api.localhost" 127.0.0.1 ::1
mkcert -key-file certs/web-key.pem -cert-file certs/web.pem \
  web.localhost "*.web.localhost" 127.0.0.1 ::1
mkcert -key-file certs/client-key.pem -cert-file certs/client.pem \
  "client.localhost"
```

`client.pem` is what any caller — another service, a sidecar, a script — presents when calling your API directly.

Your server needs to trust the same root that signed `client.pem`. Copy mkcert's root CA into your project so the app doesn't depend on the system trust store:

```bash
cp "$(mkcert -CAROOT)/rootCA.pem" certs/rootCA.pem
```

Now configure your Go API to require and verify client certs. This isn't optional — `ClientAuth: tls.RequireAndVerifyClientCert` means no cert, no traffic:

```go
// main.go
package main

import (
	"crypto/tls"
	"crypto/x509"
	"fmt"
	"log"
	"net/http"
	"os"
)

func handler() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		cn := "unknown"
		if len(r.TLS.PeerCertificates) > 0 {
			cn = r.TLS.PeerCertificates[0].Subject.CommonName
		}
		fmt.Fprintf(w, "mTLS ok, client CN: %s\n", cn)
	})
	return mux
}

func main() {
	caCert, err := os.ReadFile("certs/rootCA.pem")
	if err != nil {
		log.Fatal(err)
	}
	caPool := x509.NewCertPool()
	caPool.AppendCertsFromPEM(caCert)

	tlsConfig := &tls.Config{
		ClientCAs:  caPool,
		ClientAuth: tls.RequireAndVerifyClientCert,
		MinVersion: tls.VersionTLS12,
	}

	server := &http.Server{
		Addr:      ":8443",
		TLSConfig: tlsConfig,
		Handler:   handler(),
	}

	log.Fatal(server.ListenAndServeTLS("certs/api.pem", "certs/api-key.pem"))
}
```

Node.js equivalent — same principle, fewer lines:

```js
// server.js
const https = require('https');
const fs = require('fs');

const ca = fs.readFileSync('certs/rootCA.pem');
const server = https.createServer({
  key: fs.readFileSync('certs/api-key.pem'),
  cert: fs.readFileSync('certs/api.pem'),
  ca,
  requestCert: true,
  rejectUnauthorized: true,
}, (req, res) => {
  console.log('Client CN:', req.socket.getPeerCertificate().subject.CN);
  res.end('mTLS ok\n');
});
server.listen(8443);
```

That solves service-to-service mTLS: any local caller that presents `client.pem` gets through, anything else gets rejected at the TLS layer. It's worth being precise about two related but different concerns that this *doesn't* cover:

- **Browser → edge** stays exactly as described earlier — plain public HTTPS, terminated by Cloudflare with a certificate your browser trusts. Internal mTLS between your services doesn't change that.
- **Edge → origin client auth** — proving that a request reaching your origin actually came from Cloudflare's edge, not from anyone who found your IP — is a separate feature called **Authenticated Origin Pulls**. You enable it per zone in the dashboard (SSL/TLS → Origin Server → Authenticated Origin Pulls) or via the API; Cloudflare then presents a client certificate signed by its own CA on every edge-to-origin request, and your origin's TLS stack verifies it. There's no `originRequest.mTLS` field in `cloudflared`'s config — that key doesn't exist. If you want your Go/Node server to enforce this too, add Cloudflare's origin-pull CA certificate as another trusted `ClientCAs` entry alongside your mkcert root, and your existing `RequireAndVerifyClientCert` logic covers both cases.

For the setup in this post — a tunnel proxying to a container on your own trusted Docker network — plain `http://` to the service (as configured in `cloudflared/config.yml` earlier) is fine, and Authenticated Origin Pulls isn't necessary. Reach for it when your origin is directly reachable over the public internet and you need to prove a request is edge-originated.

Test the service-to-service mTLS handshake straight against your Go/Node server:

```bash
# Present a valid client cert — should succeed
curl -v --cert certs/client.pem --key certs/client-key.pem \
  --cacert certs/rootCA.pem https://api.localhost:8443/health

# Without a client cert — should fail the TLS handshake
curl -v --cacert certs/rootCA.pem https://api.localhost:8443/health
```

Watch the logs. You'll see `TLS handshake complete` with `peer certificates: 1` on the server side. That's it — mutual authentication with zero long-lived secrets in your code. The CA never leaves your machine. Rotate certs annually with a cron job if you're feeling responsible.

## Post-Quantum Authentication: What You Can Enable Today

Cloudflare quietly shipped post-quantum origin authentication last quarter. It's not marketing fluff — it's a hybrid KEM (X25519+Kyber768) handshake between their edge and your origin. The threat model is harvest-now-decrypt-later: someone records your TLS traffic today, waits for a CRQC (cryptographically relevant quantum computer), and retroactively decrypts your API keys, session tokens, and that embarrassing commit message you pushed to prod. PQ auth makes that recording useless without breaking both classical and post-quantum key exchanges simultaneously.

Enabling it requires two things: HTTP/2 to your origin (QUIC doesn't support PQ auth yet) and the feature flag. Post-quantum is a **tunnel-wide** setting, not something you toggle per ingress rule — it lives at the top level of `config.yml`, alongside `tunnel:` and `credentials-file:`:

```yaml
# cloudflared/config.yml (tunnel-wide post-quantum flag)
tunnel: 123e4567-e89b-12d3-a456-426614174000
credentials-file: /etc/cloudflared/credentials.json
post-quantum: true

ingress:
  - hostname: api.lab.lacorte.dev
    service: http://api:8080
    originRequest:
      http2Origin: true
  - hostname: app.lab.lacorte.dev
    service: http://frontend:3000
    originRequest:
      http2Origin: true
  - service: http_status:404
```

No config file handy? The same flag exists as the `cloudflared tunnel run --post-quantum` CLI flag, or the `TUNNEL_POST_QUANTUM=true` environment variable — useful if you're running token mode from the compose section earlier.

Restart the tunnel container: `docker compose restart cloudflared`. Cloudflare's edge now attempts a hybrid `X25519MLKEM768` key exchange with your local `cloudflared`, which speaks HTTP/2 to your services.

Verification doesn't come from response headers — `cf-ray` doesn't grow a `-pq` suffix. The characters after the ray ID are always the datacenter's airport code (`-ORD` for Chicago, `-GRU` for São Paulo, and so on), post-quantum or not. Check these instead:

1. **`cloudflared` logs** at `--loglevel debug` — the connection log lines report the negotiated key exchange group.
2. **`cdn-cgi/trace`**, hit through your own tunnel hostname:

```bash
curl -s https://api.lab.lacorte.dev/cdn-cgi/trace
# ...
# tls=TLSv1.3
# kex=X25519MLKEM768
```

A `kex` value of `X25519MLKEM768` (the standardized hybrid ML-KEM group, formerly shipped under the draft name `X25519Kyber768Draft00`) confirms a post-quantum handshake for that connection. For the edge-to-origin leg specifically, cross-check the Cloudflare dashboard → Zero Trust → Networks → Tunnels → your tunnel, and consult Cloudflare's current post-quantum documentation for the exact verification fields — this is an area that's still evolving.

Browser support: Chrome 116+, Firefox 118+, and recent Safari builds support ML-KEM hybrid key exchange in TLS 1.3. Cloudflare terminates PQ at the edge — your browser negotiates the hybrid group with Cloudflare directly; the tunnel's PQ setting governs the edge-to-origin leg. Fallback is automatic: if your origin (or `cloudflared` version) doesn't support PQ, Cloudflare silently falls back to classical X25519. No errors, no broken requests — you'll just see a classical `kex` value instead.

One gotcha: `http2Origin: true` requires your local services to accept h2c (HTTP/2 cleartext) or TLS with a certificate `cloudflared` trusts. Since we're using mkcert in the previous section, mount your `certs/` directory into the `cloudflared` container (`- ./certs:/etc/cloudflared/certs:ro`) and add `caPool: /etc/cloudflared/certs/rootCA.pem` to that rule's `originRequest` if your services serve HTTPS. For plain HTTP backends — like `api` and `frontend` in this post's compose file — h2c works out of the box, and you can skip `caPool` entirely.

This isn't future-proofing theatre. The flag exists, the hardware exists, and the config is one line. Enable it now so your `cdn-cgi/trace` output and `cloudflared` logs show `X25519MLKEM768`, and you can honestly say your local dev stack is post-quantum ready.

## Debugging, Observability, and the 'It Works on My Machine' Exit Strategy

You've got the tunnel running. The certs validate. The mTLS handshake completes. Now something breaks — a webhook returns 502, a header gets stripped, a colleague sees a different error than you do. Time to stop guessing and start looking at structured data.

### Structured Logging That Doesn't Suck

`cloudflared` speaks JSON when you ask nicely. Update your compose service:

```yaml
# docker-compose.yml (cloudflared service, with logging/metrics flags)
services:
  cloudflared:
    image: cloudflare/cloudflared:2024.12.0
    command: >
      tunnel
      --config /etc/cloudflared/config.yml
      --loglevel debug
      --logfile /var/log/cloudflared/access.log
      --metrics 0.0.0.0:2000
      run
    volumes:
      - ./cloudflared:/etc/cloudflared:ro
      - tunnel-logs:/var/log/cloudflared
    ports:
      - "2000:2000"  # Prometheus metrics
```

The `--logfile` flag writes JSON lines to a volume you can tail, ship to Loki, or `jq` into submission:

```bash
docker compose exec cloudflared tail -f /var/log/cloudflared/access.log | jq '.'
```

Sample output when a request hits your Go API:

```json
{
  "level": "info",
  "ts": "2024-12-15T14:32:11.456Z",
  "logger": "proxy",
  "msg": "completed request",
  "request_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "method": "POST",
  "url": "https://api.lacorte.dev/webhooks/stripe",
  "status": 200,
  "duration_ms": 47,
  "origin_ip": "100.64.0.3",
  "protocol": "h2",
  "tls_version": "TLS 1.3",
  "cipher_suite": "TLS_AES_256_GCM_SHA384",
  "pq_kem": "X25519MLKEM768"
}
```

Notice `pq_kem`? That's your post-quantum handshake confirmation, mirroring the `kex` value from `cdn-cgi/trace` above. If it's missing or absent from your actual log output, your origin config isn't negotiating the hybrid KEM — double check the tunnel-wide `post-quantum: true` flag from the previous section, and confirm which fields your `cloudflared` version actually emits, since structured log schemas evolve between releases.

### Zero Trust Dashboard: The Source of Truth

Cloudflare's Zero Trust dashboard (Dash → Zero Trust → Logs → HTTP) shows every request that traversed your tunnel, complete with:

- Request/response headers (sanitized)
- TLS negotiation details
- mTLS client cert validation result
- WAF rule matches
- Geographic origin

Filter by `cf-ray` header to correlate with your local logs. The dashboard retains 72 hours on the free plan — enough to debug that "it worked yesterday" incident.

### Exposing Non-HTTP Services: `cloudflared tunnel route ip`

Your Postgres container lives in the compose network. Your colleague's `psql` client lives on their laptop. Don't SSH tunnel. Route the subnet:

```bash
# Run once per tunnel (persists in Cloudflare's config)
cloudflared tunnel route ip add 172.20.0.0/16 <TUNNEL_NAME> --config /etc/cloudflared/config.yml
```

Now any device on the tunnel (including your colleague's `cloudflared access tcp --hostname db.lacorte.dev --url tcp://localhost:5432`) reaches `172.20.0.5:5432` directly. Works for printers, internal APIs, that weird USB license dongle server — anything with an IP.

Update `config.yml` to advertise the route:

```yaml
# cloudflared/config.yml
tunnel: <TUNNEL_ID>
credentials-file: /etc/cloudflared/credentials.json
ingress:
  - hostname: api.lacorte.dev
    service: https://api:8080
    originRequest:
      httpHostHeader: api.lacorte.dev
  - hostname: app.lacorte.dev
    service: https://frontend:3000
  - service: http_status:404
warp-routing:
  enabled: true
```

The `warp-routing` block enables the IP routes you added via CLI. No extra ports, no `socat` hacks.

### Team Workflow: Commit, Share, Run

Your repo now contains:

```
.
├── docker-compose.yml
├── cloudflared/
│   ├── config.yml
│   └── credentials.json  # gitignored!
├── certs/
│   ├── local-ca.pem
│   ├── api.pem
│   └── frontend.pem
└── .env.example          # TUNNEL_TOKEN=...
```

**`.gitignore`:**
```
cloudflared/credentials.json
certs/*.pem
certs/*.key
.env
```

**`.env.example`:**
```
TUNNEL_TOKEN=eyJhIjoi...  # from `cloudflared tunnel token <NAME>`
```

Onboard a new dev in three steps:

```bash
git clone git@github.com:you/local-stack.git
cp .env.example .env
# Paste tunnel token from 1Password/Bitwarden into .env
docker compose up -d
```

They get identical hostnames, identical certs, identical mTLS enforcement, identical logging. No "works on my machine" because the machine *is* the compose file.

### Staging Promotion Checklist

Before you copy this pattern to staging, verify:

- [ ] Tunnel token stored in secret manager (not `.env`), injected at deploy time
- [ ] `cloudflared` runs as non-root user (`user: "1000:1000"` in compose, or dedicated K8s ServiceAccount)
- [ ] Metrics endpoint (`:2000`) scraped by Prometheus with `job="cloudflared-tunnel"`
- [ ] Log volume mounted to persistent storage or shipped to Loki/Vector
- [ ] `warp-routing` enabled and IP routes documented in runbook
- [ ] mTLS CA cert rotated annually (calendar reminder: `mkcert -install` regenerates root)
- [ ] Post-quantum KEM verified in staging logs (`pq_kem` field present)
- [ ] Failover tunnel configured with different `TUNNEL_TOKEN` in separate region
- [ ] `cloudflared` version pinned in compose (`2024.12.0`, not `latest`)
- [ ] Runbook includes: `cloudflared tunnel route ip delete` cleanup procedure

You've replaced a fragile `ngrok` habit with infrastructure you can version, review, and debug. The tunnel is code now. Treat it like code.
