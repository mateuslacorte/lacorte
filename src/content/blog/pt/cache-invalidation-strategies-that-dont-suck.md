---
title: 'Estratégias de invalidação de cache que realmente funcionam: HTTP, debug e conteúdo fresco'
date: '2026-07-27'
tags:
  - redes
  - backend
  - docker
  - observabilidade
  - bash
  - api
  - python
  - nginx
  - cache
  - otimização
description: >-
  Domine headers de cache HTTP, debugue cache miss com curl e monte estratégias
  de invalidação que funcionam — sem vendor lock-in nem mágica.
---

Invalidação de cache é uma das duas coisas difíceis em ciência da computação — em parte porque a outra (nomear coisas) é exatamente o que estraga a primeira. Você já viu o filme: um `Set-Cookie` perdido num endpoint JSON zera a taxa de acerto do CDN. Um `Vary: Accept-Encoding` faltando serve gzip quebrado pra cliente que não consegue decodificar. Seu `max-age=31536000` em assets versionados funciona lindamente… até você precisar rotacionar uma chave de assinatura ontem.

Este post não é teoria. É a checklist que eu percorro toda vez que um bug de cache cai na minha mesa — headers que realmente importam, comandos `curl` que mostram o que o CDN está vendo, padrões de invalidação que não pedem doutorado em sistemas distribuídos, e uma stack Docker Compose que você sobe pra ver os headers fluírem ao vivo. No fim você sabe quais diretivas `Cache-Control` merecem existir, como desenhar chaves de cache que sobrevivem a deploy, e o truque com `stale-while-revalidate` que te deixa dormir em paz durante um purge.

## Taxonomia dos headers: o que realmente importa

Muita gente trata `Cache-Control` como horóscopo — copia uma string do Stack Overflow, torce pro astro alinhar e fica se perguntando por que o CDN ainda serve o CSS da semana passada. Chega de chute. Aqui vai cada diretiva que paga o aluguel, o que ela faz de verdade e quando usar.

| Diretiva | Quem obedece | Quando usar |
|-----------|--------------|----------------|
| `public` | Todo mundo (navegador, CDN, proxy) | Assets estáticos, respostas de API públicas, qualquer coisa sem autenticação |
| `private` | Só o navegador | JSON específico do usuário, HTML com tokens CSRF, qualquer coisa atrás de sessão |
| `no-store` | Todo mundo — **não grave em disco** | Segredos, PII, `/auth/me`, respostas de pagamento |
| `no-cache` | Todo mundo — **revalide sempre** | Endpoints de mutação, resultados de busca, "frescor importa mais que velocidade" |
| `must-revalidate` | Todo mundo — velho = morto | Dados financeiros, contagem de estoque, qualquer coisa em que dado velho está errado |
| `max-age=N` | Navegador + caches compartilhados | Seu TTL base; `31536000` pra assets versionados, `300` pra API |
| `s-maxage=N` | **Só caches compartilhados** (CDN, proxies) | Sobrescreve o `max-age` na borda sem mexer no cache do navegador |
| `stale-while-revalidate=N` | Todo mundo | Serve dado velho por até N segundos enquanto a revalidação assíncrona roda — **a diretiva que te deixa dormir durante um purge** |
| `stale-if-error=N` | Todo mundo | Serve dado velho por até N segundos quando a origem devolve 5xx — seu colchão de incidente |
| `immutable` | Navegador | Assets versionados (`/app.a1b2c3.js`) — diz ao navegador "nunca revalide, jamais" |

**Combinações que funcionam:**
- Assets versionados: `Cache-Control: public, max-age=31536000, immutable`
- Ponto de entrada HTML: `Cache-Control: no-cache, must-revalidate` (ou `max-age=0, must-revalidate`)
- API privada: `Cache-Control: private, max-age=60, stale-while-revalidate=300`
- API pública: `Cache-Control: public, max-age=60, s-maxage=300, stale-while-revalidate=600`

### A armadilha do `Vary`

O `Vary` avisa os caches: "essa resposta muda conforme estes headers de requisição." Erre nele e você fragmenta o cache em pedaços inúteis. `Vary: Accept-Encoding` é o **único** valor que você provavelmente precisa — deixa o CDN guardar variantes gzip e brotli separadas. `Vary: Accept` pra negociação de conteúdo? Beleza. `Vary: User-Agent`? Você acabou de criar uma entrada por versão de navegador. `Vary: Cookie`? Parabéns: acabou de desligar o cache pra todo usuário logado.

```python
# header_echo.py — run: pip install flask && python header_echo.py
from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route("/echo", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
def echo():
    # Filter noise; keep what caching cares about
    interesting = {
        k: v for k, v in request.headers.items()
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

Sobe, chama `curl -H "Accept-Encoding: gzip" localhost:8080/echo` e vê a lógica do `Vary` ao vivo. Na próxima seção a gente pluga isso numa stack Docker Compose com um CDN de verdade na frente pra você ver os headers mudarem a cada salto.

## Debug com curl: veja o que o CDN vê

As DevTools do navegador mentem. Elas mostram o que o navegador *recebeu* depois que service worker, cache do browser e três extensões mexeram nos headers. O `curl` mostra o que realmente passa no fio — desde que você pare de usar ele como apelido do `wget`.

Comece pelas flags que importam. `-v` (ou `-i` só pros headers) imprime a resposta completa. `--compressed` pede gzip/br e *descomprime sozinho* — crítico porque CDNs costumam servir `ETag` diferente pra resposta comprimida versus identity. `-H 'Accept-Encoding: gzip, br'` sem `--compressed` deixa você inspecionar `Content-Encoding` e `Vary` crus. `--resolve example.com:443:1.2.3.4` força SNI e host header pra sua máquina de staging sem tocar em `/etc/hosts`. E o impressor de veredito:

```bash
-o /dev/null -D - | awk 'BEGIN{IGNORECASE=1}
  function trim(s){ sub(/\r$/, "", s); return s }
  /^HTTP\//{code=trim($2)}
  /^age:/{age=$0; sub(/\r$/, "", age); sub(/^age:[[:space:]]*/, "", age)}
  /^x-cache:/{cache=$0; sub(/\r$/, "", cache); sub(/^x-cache:[[:space:]]*/, "", cache)}
  /^cf-cache-status:/{cf=$0; sub(/\r$/, "", cf); sub(/^cf-cache-status:[[:space:]]*/, "", cf)}
  /^etag:/{etag=$0; sub(/\r$/, "", etag); sub(/^etag:[[:space:]]*/, "", etag)}
  /^vary:/{vary=$0; sub(/\r$/, "", vary); sub(/^vary:[[:space:]]*/, "", vary)}
  END{printf "http=%s age=%s cache=%s cf=%s etag=%s vary=%s\n", code, age, cache, cf, etag, vary}'
```

`Age` diz há quantos segundos o objeto ficou num cache compartilhado. `X-Cache` (ou `CF-Cache-Status`, `X-Served-By`, `Via`) revela *qual* camada serviu a resposta. `Vary` expõe se a chave de cache fragmenta em `Accept-Encoding`, `Accept` ou no seu `X-Device-Type` customizado.

Empacote numa função de shell pra carregar no `.bashrc`:

```bash
cache-debug() {
  local url="${1:?usage: cache-debug <url> [extra curl args]}"
  shift
  curl -sS -D - -o /dev/null \
    -H 'Accept-Encoding: gzip, br' \
    --compressed \
    "$@" "$url" | awk 'BEGIN{IGNORECASE=1}
      function trim(s){ sub(/\r$/, "", s); return s }
      /^HTTP\//{code=trim($2)}
      /^age:/{age=$0; sub(/\r$/, "", age); sub(/^age:[[:space:]]*/, "", age)}
      /^x-cache:/{cache=$0; sub(/\r$/, "", cache); sub(/^x-cache:[[:space:]]*/, "", cache)}
      /^cf-cache-status:/{cf=$0; sub(/\r$/, "", cf); sub(/^cf-cache-status:[[:space:]]*/, "", cf)}
      /^etag:/{etag=$0; sub(/\r$/, "", etag); sub(/^etag:[[:space:]]*/, "", etag)}
      /^vary:/{vary=$0; sub(/\r$/, "", vary); sub(/^vary:[[:space:]]*/, "", vary)}
      END{printf "http=%s age=%s cache=%s cf=%s etag=%s vary=%s\n", code, age, cache, cf, etag, vary}'
}
```

Agora sobe um laboratório local que espelha origem → borda → cliente. Salve esse `docker-compose.yml`:

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

`app.py` — endpoint Flask com corpo estável (pra o `proxy_cache` poder dar HIT) e `ETag` a partir do mtime. `POST /mutate` reescreve o arquivo quando você quiser forçar um miss:

```python
from flask import Flask, make_response
import os, time
app = Flask(__name__)
PATH = "/tmp/asset.txt"

@app.route("/asset")
def asset():
    # Stable body so ETag/proxy_cache can demonstrate HIT across requests
    if not os.path.exists(PATH):
        with open(PATH, "w") as f:
            f.write("cache-lab-asset-v1\n")
    with open(PATH) as f:
        body = f.read()
    stat = os.stat(PATH)
    etag = f'W/"{stat.st_mtime_ns}-{stat.st_size}"'
    resp = make_response(body)
    resp.headers["ETag"] = etag
    resp.headers["Cache-Control"] = "public, max-age=60, stale-while-revalidate=30"
    resp.headers["Last-Modified"] = time.strftime("%a, %d %b %Y %H:%M:%S GMT", time.gmtime(stat.st_mtime))
    return resp

@app.route("/mutate", methods=["POST"])
def mutate():
    with open(PATH, "w") as f:
        f.write(f"cache-lab-asset-{time.time()}\n")
    return {"ok": True}

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080)
```

`nginx.conf` — reverse proxy mínimo que adiciona `X-Cache` e respeita `stale-while-revalidate`:

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

Build e sobe:

```bash
docker compose up --build -d
```

Chama a origem direto:

```bash
cache-debug http://localhost:8080/asset
# http=200 age= cache= etag=W/"1723456789123456789-17" vary=Accept-Encoding
```

Chama a borda (nginx):

```bash
cache-debug http://localhost:8081/asset
# http=200 age=0 cache=MISS etag=W/"1723456789123456789-17" vary=Accept-Encoding
```

Chama de novo — `HIT`, `age` sobe:

```bash
cache-debug http://localhost:8081/asset
# http=200 age=2 cache=HIT etag=W/"1723456789123456789-17" vary=Accept-Encoding
```

Agora você vê exatamente o que o CDN vê. Sem cache do navegador, sem service worker, sem mentira.

## A armadilha do Set-Cookie e outros assassinos silenciosos

Você lançou uma API JSON. O CDN mostra 0% de hit rate. Olha os headers de resposta e lá está: `Set-Cookie: session=abc123; Path=/; HttpOnly` em toda chamada de `/api/users`. Parabéns — você tirou toda requisição autenticada do cache, porque a maioria dos CDNs trata `Set-Cookie` como "essa resposta é pessoal, não guarda." A correção não é remover cookies do app; é stripá-los na borda em endpoints públicos.

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

Teste:

```bash
curl -I -H "Accept: application/json" https://api.example.com/api/public/status
# Before: Set-Cookie: session=...
# After:  (no Set-Cookie header)
```

---

**Falta de `Vary: Accept-Encoding`** é o bug silencioso de corrupção de dado. Sua origem serve JSON gzipado. O CDN guarda. Um cliente sem gzip (IoT antigo, proxy mal configurado) recebe o stream gzip cacheado e engasga.

```bash
curl -I -H "Accept-Encoding: gzip" https://api.example.com/data
# Response: Content-Encoding: gzip, Vary: Accept-Encoding  ✓

curl -I -H "Accept-Encoding: identity" https://api.example.com/data
# Response: Content-Encoding: gzip, Vary: Accept-Encoding  ✗ (served gzip to non-gzip client)
```

Correção: garanta que a origem *sempre* mande `Vary: Accept-Encoding` quando compressão estiver ligada. No nginx:

```nginx
gzip on;
gzip_vary on;  # adds Vary: Accept-Encoding automatically
```

---

**Culto ao `Pragma: no-cache`** — é legado do HTTP/1.0 que não faz nada no HTTP/1.1+. Se aparecer, apague. Não é fallback; é ruído.

```bash
curl -I https://example.com/asset.js | grep -i pragma
# Pragma: no-cache  ← delete this line from your config
```

---

**`Cache-Control: no-store` em assets públicos** — geralmente copy-paste de um endpoint de auth. Logo, CSS, bundles JS versionados: eles querem `public, max-age=31536000, immutable`. `no-store` força todo cliente a revalidar a cada page load.

```bash
curl -I https://cdn.example.com/app.abc123.js
# Cache-Control: no-store  ← wrong
# Cache-Control: public, max-age=31536000, immutable  ← right
```

---

**ETag que muda entre restart de container** — o app gera `ETag: W/"abc123"` com base em estado em memória ou inode do filesystem. Deploy reinicia os pods, inode muda, ETag muda, todo cliente revalida e toma cache miss.

```bash
# Before deploy
curl -I https://api.example.com/data | grep etag
# ETag: W/"inode-42-size-1024"

# After deploy (new container, new inode)
curl -I https://api.example.com/data | grep etag
# ETag: W/"inode-87-size-1024"  ← cache miss storm
```

Correção: derive ETags do hash do conteúdo, não de metadado. No app:

```python
import hashlib
def etag_for(body: bytes) -> str:
    return f'W/"{hashlib.sha256(body).hexdigest()[:16]}"'
```

Ou deixe o nginx cuidar disso em arquivo estático:

```nginx
etag on;  # uses Last-Modified + content hash for static files
```

Cinco armadilhas silenciosas. Cinco correções de uma linha. Sua taxa de acerto acabou de dobrar.

## Design de chave de cache: versionamento, fingerprint e a flag immutable

Versionar por query string (`/app.js?v=1.2.3`) é o equivalente em cache de anotar a senha num post-it — funciona até não funcionar. A maioria dos CDNs e navegadores trata query string como parte da chave, mas alguns cortam ela por completo (tô olhando pra você, configs antigas do Cloudflare e certos proxies corporativos). Pior: `?v=123` não diz nada sobre o *conteúdo* — dá pra incrementar a versão sem mudar um byte, ou esquecer de incrementar depois de mudança real. Nos dois casos você perde: cache miss ou asset velho.

Nome de arquivo com hash de conteúdo (`app.a1b2c3.js`) é a única estratégia que sobrevive ao contato com a realidade. O hash *é* a impressão digital do conteúdo. Muda um byte, muda o nome do arquivo, muda a chave de cache, o arquivo antigo expira sozinho. Sem chamada de API de purge, sem ansiedade de "será que eu lembrei de bumpar a versão?".

Gere hashes no build com um one-liner que roda em qualquer pipeline de CI:

```bash
# Bash + coreutils — no Node required
find dist -type f -name '*.js' -o -name '*.css' | while read f; do
  hash=$(sha256sum "$f" | cut -c1-8)
  mv "$f" "${f%.*}.$hash.${f##*.}"
done
```

Prefere Node? Mesmo resultado, zero dependência:

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

Agora o header `Cache-Control` pra esses assets com fingerprint:

```
Cache-Control: max-age=31536000, immutable
```

É isso. Um ano; `immutable` diz ao navegador "essa sequência de bytes nunca muda, nem manda requisição condicional." A RFC 8246 padronizou; todo browser moderno respeita. Tire o `must-revalidate`, tire o `public` — `immutable` já implica os dois. Se você ainda manda `max-age=31536000` sem `immutable`, está queimando round-trip em checagens de `If-None-Match` que sempre voltam 304.

HTML é a exceção. Você *quer* que o HTML revalide porque ele referencia esses assets com fingerprint. Dê um `max-age` curto com janela de stale generosa:

```
Cache-Control: max-age=600, stale-while-revalidate=86400
```

Dez minutos fresco, 24 horas de stale-while-revalidate. O navegador serve o HTML em cache na hora enquanto busca uma cópia fresca em background. Deployou build quebrado? Usuário vê o HTML antigo (com referências de asset antigas) por até um dia enquanto você faz rollback. Sem purge obrigatório, sem 404 em asset com hash faltando. Essa é a rede de segurança que te deixa dormir tranquilo num deploy de sexta.

## Invalidação sem drama: purge, bypass e soft purge

Três jeitos de limpar um cache, cada um com um limiar de dor diferente. O **hard purge** bate na API do CDN — instantâneo, autoritativo, e rate-limited até a exaustão se você não tomar cuidado. O **cache-busting por mudança de chave** (nome de arquivo com fingerprint, `max-age` immutable) é a resposta "certa"… até você precisar rotacionar uma chave de assinatura *agora* e não puder esperar o cliente refetchar. O **soft purge** via `stale-while-revalidate` é a opção civilizada: serve conteúdo velho na hora enquanto revalida em background. Usuário não vê pico de latência; origem vê uma única requisição de revalidação em vez de uma estampida.

Eu parto pro soft purge por padrão. Hard purge é pra emergência do tipo "vazamos PII numa resposta cacheada". Rotação de chave é pra deploy.

Aqui vai um purgador portátil que fala Cloudflare, Fastly e nginx sem um SDK de fornecedor sequer. Salve como `purge.py`:

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

Pluga no GitHub Actions pra purgar só os assets que mudaram:

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

O filtro `grep` é o pulo do gato — purga só assets com fingerprint que de fato mudaram. Entrada HTML com `max-age=0, must-revalidate` não precisa de purge; ela revalida a cada navegação.

## Observatório de cache local-first: laboratório Docker Compose

Ler header num post de blog é bom. Ver `X-Cache: MISS` virar `HIT` no terminal enquanto você troca uma diretiva `Cache-Control` é como o conhecimento gruda de verdade. Sobe essa stack, cutuca, quebra — e nunca mais precisa chutar comportamento de cache.

### A stack

Três containers, zero dependência externa:

- **nginx** — reverse proxy com `proxy_cache` ligado, emite `X-Cache` pra você ver HIT/MISS/BYPASS sem escavar log
- **flask-origin** — app Python que devolve headers configuráveis via query param; muda o comportamento sem rebuild
- **cache-debug** — `curl` numa caixa com Makefile pra os comandos de teste ficarem documentados e repetíveis

Crie um diretório e jogue esses arquivos dentro:

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

**nginx.conf** — a lógica de cache mora aqui, não num serviço gerenciado que você não consegue inspecionar:
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

**flask-origin/app.py** — headers controlados pela query string pra testar cenário sem editar código:
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

**cache-debug/Makefile** — sua suíte de regressão. Rode `make test-hit` a partir do host via `docker compose run --rm cache-debug test-hit`:
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

### Rodando

```bash
docker compose up --build -d
docker compose run --rm cache-debug test-miss
docker compose run --rm cache-debug test-hit
docker compose run --rm cache-debug test-stale
docker compose run --rm cache-debug test-vary
docker compose run --rm cache-debug test-cookie-footgun
```

Observe o `X-Cache` mudando de `MISS` pra `HIT` pra `STALE` pra `BYPASS`. Ajuste o `nginx.conf`, recarregue com `docker compose exec nginx nginx -s reload`, rode os alvos do Make de novo. Esse é o loop. Sem dashboard, sem CLI de fornecedor, sem chute. Quando o cache de produção se comportar estranho, você vai ter um modelo mental que bate com o que realmente acontece no fio — porque você viu acontecer no laptop.
