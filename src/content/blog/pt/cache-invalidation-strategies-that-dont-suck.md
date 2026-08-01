---
title: 'Estratégias de Invalidação de Cache Que Realmente Funcionam: Cache HTTP, Debug, e Não Servir Conteúdo Obsoleto'
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
  Domine os headers de cache HTTP, depure cache misses com curl, e construa
  estratégias de invalidação que funcionam — sem vendor lock-in ou mágica.
---

Invalidação de cache é uma das duas coisas difíceis em ciência da computação, principalmente porque a outra — nomear coisas — é como você estraga a primeira. Você já viu isso: um `Set-Cookie` perdido num endpoint JSON destrói a taxa de acerto do seu CDN. Um `Vary: Accept-Encoding` faltando serve conteúdo gzipado quebrado para um cliente que não consegue decodificar. Seu `max-age=31536000` em assets versionados funciona muito bem até você precisar rotacionar uma chave de assinatura ontem.

Esse não é um post teórico. É a checklist que eu sigo toda vez que um bug de cache cai no meu colo — headers que realmente importam, invocações de `curl` que revelam o que o CDN está vendo, padrões de invalidação que não exigem um doutorado em sistemas distribuídos, e uma stack Docker Compose que você pode subir para ver os headers fluírem em tempo real. No final você vai saber exatamente quais diretivas `Cache-Control` merecem seu lugar, como projetar chaves de cache que sobrevivem a deploys, e o truque com `stale-while-revalidate` que te deixa dormir tranquilo durante um purge de cache.

## A Taxonomia dos Headers: O Que Realmente Importa

A maioria dos desenvolvedores trata o `Cache-Control` como um horóscopo — copia uma string do Stack Overflow, torce para as estrelas se alinharem, e fica se perguntando por que o CDN está servindo o CSS da semana passada. Vamos parar de chutar. Aqui está cada diretiva que merece seu lugar, o que ela realmente faz, e quando usar.

| Diretiva | Quem obedece | Quando usar |
|-----------|--------------|----------------|
| `public` | Todo mundo (navegador, CDN, proxy) | Assets estáticos, respostas de API públicas, qualquer coisa sem autenticação |
| `private` | Só o navegador | JSON específico do usuário, HTML com tokens CSRF, qualquer coisa atrás de uma sessão |
| `no-store` | Todo mundo — **não grave em disco** | Segredos, PII, `/auth/me`, respostas de pagamento |
| `no-cache` | Todo mundo — **revalide sempre** | Endpoints de mutação, resultados de busca, "atualidade importa mais que velocidade" |
| `must-revalidate` | Todo mundo — velho = morto | Dados financeiros, contagens de estoque, qualquer coisa onde dado velho está errado |
| `max-age=N` | Navegador + caches compartilhados | Seu TTL base; `31536000` para assets versionados, `300` para API |
| `s-maxage=N` | **Só caches compartilhados** (CDN, proxies) | Sobrescreve o `max-age` na borda sem tocar no cache do navegador |
| `stale-while-revalidate=N` | Todo mundo | Serve dado velho por até N segundos enquanto a revalidação assíncrona roda — **a diretiva que te deixa dormir durante um purge** |
| `stale-if-error=N` | Todo mundo | Serve dado velho por até N segundos quando a origem retorna 5xx — seu buffer de incidente |
| `immutable` | Navegador | Assets versionados (`/app.a1b2c3.js`) — diz ao navegador "nunca revalide, jamais" |

**As jogadas combinadas:**
- Assets versionados: `Cache-Control: public, max-age=31536000, immutable`
- Ponto de entrada HTML: `Cache-Control: no-cache, must-revalidate` (ou `max-age=0, must-revalidate`)
- API privada: `Cache-Control: private, max-age=60, stale-while-revalidate=300`
- API pública: `Cache-Control: public, max-age=60, s-maxage=300, stale-while-revalidate=600`

### A Armadilha do `Vary`

O `Vary` diz aos caches: "essa resposta muda de acordo com esses headers de requisição." Erre nele e você fragmenta o cache em pedaços inúteis. `Vary: Accept-Encoding` é o **único** valor que você provavelmente precisa — ele permite que o CDN armazene variantes gzip e brotli separadamente. `Vary: Accept` para negociação de conteúdo? Beleza. `Vary: User-Agent`? Você acabou de criar uma entrada de cache por versão de navegador. `Vary: Cookie`? Parabéns, você acabou de desabilitar o cache para todo usuário logado.

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

Suba ele, chame `curl -H "Accept-Encoding: gzip" localhost:8080/echo`, e veja a lógica do `Vary` em ação em tempo real. Próxima seção: vamos conectar isso a uma stack Docker Compose com um CDN de verdade na frente para você ver os headers mudando a cada salto.

## Debugando com curl: Veja O Que o CDN Vê

As DevTools do seu navegador mentem. Elas mostram o que o navegador *recebeu* depois que o service worker, o cache do navegador, e três extensões mexeram nos headers. O `curl` mostra o que realmente trafega no fio — desde que você pare de usar ele como um apelido do `wget`.

Comece pelas flags que importam. `-v` (ou `-i` para só os headers) imprime a resposta completa. `--compressed` pede gzip/br e *descomprime automaticamente* — crítico porque CDNs frequentemente servem valores de `ETag` diferentes para respostas comprimidas versus identity. `-H 'Accept-Encoding: gzip, br'` sem `--compressed` deixa você inspecionar o `Content-Encoding` e o `Vary` crus. `--resolve example.com:443:1.2.3.4` força o SNI e o host header para a sua máquina de staging sem tocar em `/etc/hosts`. E o impressor de veredito:

```bash
-o /dev/null -w 'http=%{http_code} age=%{header_age} cache=%{header_x-cache} cf=%{header_cf-cache-status} etag=%{header_etag} vary=%{header_vary}\n'
```

`Age` te diz quantos segundos o objeto ficou num cache compartilhado. `X-Cache` (ou `CF-Cache-Status`, `X-Served-By`, `Via`) revela *qual* camada serviu a resposta. `Vary` expõe se a chave de cache fragmenta em `Accept-Encoding`, `Accept`, ou o seu `X-Device-Type` customizado.

Empacote isso numa função de shell que você pode carregar no `.bashrc`:

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

Agora suba um laboratório local que espelha origem → borda → cliente. Salve esse `docker-compose.yml`:

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

`app.py` — um endpoint Flask que retorna um timestamp e um `ETag` baseado no mtime do arquivo:

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

`nginx.conf` — um reverse proxy mínimo que adiciona `X-Cache` e respeita o `stale-while-revalidate`:

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

Construa e rode:

```bash
docker compose up --build -d
```

Chame a origem diretamente:

```bash
cache-debug http://localhost:8080/asset
# http=200 age= cache= etag=W/"1723456789123456789-17" vary=Accept-Encoding
```

Chame a borda (nginx):

```bash
cache-debug http://localhost:8081/asset
# http=200 age=0 cache=MISS etag=W/"1723456789123456789-17" vary=Accept-Encoding
```

Chame de novo — `HIT`, `age` incrementa:

```bash
cache-debug http://localhost:8081/asset
# http=200 age=2 cache=HIT etag=W/"1723456789123456789-17" vary=Accept-Encoding
```

Agora você vê exatamente o que o CDN vê. Sem cache do navegador, sem service worker, sem mentiras.

## A Armadilha do Set-Cookie e Outros Assassinos Silenciosos

Você lançou uma API JSON. O CDN mostra 0% de taxa de acerto. Você checa os headers de resposta e lá está: `Set-Cookie: session=abc123; Path=/; HttpOnly` em toda chamada de `/api/users`. Parabéns — você acabou de tirar toda requisição autenticada do cache porque a maioria dos CDNs trata `Set-Cookie` como "essa resposta é pessoal, não guarde." A correção não é remover cookies do seu app; é removê-los na borda para endpoints públicos.

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

**A falta do `Vary: Accept-Encoding`** é o bug silencioso de corrupção de dados. Sua origem serve JSON gzipado. O CDN guarda em cache. Um cliente sem suporte a gzip (dispositivo IoT antigo, proxy mal configurado) recebe o stream gzip cacheado e engasga.

```bash
curl -I -H "Accept-Encoding: gzip" https://api.example.com/data
# Response: Content-Encoding: gzip, Vary: Accept-Encoding  ✓

curl -I -H "Accept-Encoding: identity" https://api.example.com/data
# Response: Content-Encoding: gzip, Vary: Accept-Encoding  ✗ (served gzip to non-gzip client)
```

Correção: garanta que sua origem *sempre* envie `Vary: Accept-Encoding` quando a compressão estiver habilitada. No nginx:

```nginx
gzip on;
gzip_vary on;  # adds Vary: Accept-Encoding automatically
```

---

**O cargo-culting do `Pragma: no-cache`** — é legado do HTTP/1.0 que não faz nada no HTTP/1.1+. Se você ver isso, apague. Não é um fallback; é ruído.

```bash
curl -I https://example.com/asset.js | grep -i pragma
# Pragma: no-cache  ← delete this line from your config
```

---

**`Cache-Control: no-store` em assets públicos** — geralmente um copy-paste de um endpoint de autenticação. Sua logo, seu CSS, seus bundles JS versionados: eles querem `public, max-age=31536000, immutable`. `no-store` força todo cliente a revalidar a cada carregamento de página.

```bash
curl -I https://cdn.example.com/app.abc123.js
# Cache-Control: no-store  ← wrong
# Cache-Control: public, max-age=31536000, immutable  ← right
```

---

**Divergências de ETag entre restarts de container** — seu app gera `ETag: W/"abc123"` baseado em estado em memória ou inode do filesystem. O deploy reinicia os pods, o inode muda, o ETag muda, todo cliente revalida e dá cache miss.

```bash
# Before deploy
curl -I https://api.example.com/data | grep etag
# ETag: W/"inode-42-size-1024"

# After deploy (new container, new inode)
curl -I https://api.example.com/data | grep etag
# ETag: W/"inode-87-size-1024"  ← cache miss storm
```

Correção: derive os ETags do hash do conteúdo, não de metadados. No seu app:

```python
import hashlib
def etag_for(body: bytes) -> str:
    return f'W/"{hashlib.sha256(body).hexdigest()[:16]}"'
```

Ou deixe o nginx cuidar disso para arquivos estáticos:

```nginx
etag on;  # uses Last-Modified + content hash for static files
```

Cinco assassinos silenciosos. Cinco correções de uma linha. Sua taxa de acerto acabou de dobrar.

## Design de Chave de Cache: Versionamento, Fingerprints, e a Flag Immutable

Versionamento por query string (`/app.js?v=1.2.3`) é o equivalente em cache de escrever sua senha num post-it — funciona até não funcionar mais. A maioria dos CDNs e navegadores trata query strings como componentes da chave de cache, mas alguns as removem completamente (tô olhando pra você, configurações antigas do Cloudflare e certos proxies corporativos). Pior, `?v=123` não diz nada sobre o *conteúdo* — você pode incrementar a versão sem mudar um único byte, ou esquecer de incrementar depois de uma mudança real. De qualquer jeito você perde: cache misses ou assets velhos.

Nomes de arquivo com hash de conteúdo (`app.a1b2c3.js`) são a única estratégia que sobrevive ao contato com a realidade. O hash *é* a impressão digital do conteúdo. Mude um byte, o nome do arquivo muda, a chave de cache muda, o arquivo antigo expira naturalmente. Sem chamadas de API de purge, sem ansiedade de "será que eu lembrei de incrementar a versão?".

Gere hashes no momento do build com um one-liner que funciona em qualquer pipeline de CI:

```bash
# Bash + coreutils — no Node required
find dist -type f -name '*.js' -o -name '*.css' | while read f; do
  hash=$(sha256sum "$f" | cut -c1-8)
  mv "$f" "${f%.*}.$hash.${f##*.}"
done
```

Prefere Node? Mesmo resultado, zero dependências:

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

Agora o header `Cache-Control` para esses assets com fingerprint:

```
Cache-Control: max-age=31536000, immutable
```

É isso. Um ano, `immutable` diz ao navegador "essa sequência de bytes nunca vai mudar, nem mande uma requisição condicional." A RFC 8246 tornou isso padrão; todo navegador moderno respeita. Tire o `must-revalidate`, tire o `public` — `immutable` já implica os dois. Se você ainda está enviando `max-age=31536000` sem `immutable`, está desperdiçando idas e voltas em checagens de `If-None-Match` que sempre vão retornar 304.

HTML é a exceção. Você *quer* que o HTML revalide porque ele referencia esses assets com fingerprint. Dê a ele um `max-age` curto com uma janela de stale generosa:

```
Cache-Control: max-age=600, stale-while-revalidate=86400
```

Dez minutos fresco, 24 horas de stale-while-revalidate. O navegador serve o HTML em cache instantaneamente enquanto busca uma cópia fresca em background. Fez deploy de um build quebrado? Os usuários veem o HTML antigo (com suas referências de assets antigas) por até um dia enquanto você faz o rollback. Sem necessidade de purge de cache, sem 404s em assets com hash faltando. Essa é a rede de segurança que te deixa dormir tranquilo durante um deploy de sexta-feira.

## Invalidação Sem Lágrimas: Purge, Bypass, e Soft Purge

Três formas de limpar um cache, cada uma com um limiar de dor diferente. O **hard purge** bate na API do CDN — instantâneo, autoritativo, e rate-limited até a exaustão se você não tomar cuidado. O **cache-busting via mudança de chave** (nomes de arquivo com fingerprint, `max-age` immutable) é a resposta "correta" até você precisar rotacionar uma chave de assinatura *agora* e não puder esperar os clientes buscarem de novo. O **soft purge** via `stale-while-revalidate` é a opção civilizada: serve conteúdo velho imediatamente enquanto revalida em background. Seus usuários não veem picos de latência; sua origem vê uma única requisição de revalidação em vez de uma estampida.

Eu recorro ao soft purge por padrão. O hard purge é para emergências do tipo "vazamos PII numa resposta cacheada". A rotação de chave é para deploys.

Aqui está um purgador portátil que fala Cloudflare, Fastly, e nginx sem um único SDK de fornecedor. Salve como `purge.py`:

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

Conecte isso ao GitHub Actions para que só os assets alterados sejam purgados:

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

O filtro `grep` é o molho secreto — purga só os assets com fingerprint que realmente mudaram. Entradas HTML com `max-age=0, must-revalidate` não precisam de purge; elas revalidam a cada navegação.

## Observatório de Cache Local-First: Laboratório Docker Compose

Ler sobre headers num post de blog é bom. Ver `X-Cache: MISS` virar `HIT` no seu terminal enquanto você alterna uma diretiva `Cache-Control` é como o conhecimento gruda de verdade. Suba essa stack, cutuque ela, quebre ela, e você nunca mais vai ter que chutar o comportamento de cache.

### A Stack

Três containers, zero dependências externas:

- **nginx** — reverse proxy com `proxy_cache` habilitado, emite `X-Cache` para você ver HIT/MISS/BYPASS sem escavar logs
- **flask-origin** — app Python que retorna headers configuráveis via query params; muda o comportamento sem rebuild
- **cache-debug** — `curl` numa caixa com um Makefile para que seus comandos de teste sejam documentados e repetíveis

Crie um diretório e coloque esses arquivos dentro:

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

**nginx.conf** — a lógica de cache vive aqui, não num serviço gerenciado que você não consegue inspecionar:
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

**flask-origin/app.py** — headers controlados pela query string para você testar cenários sem editar código:
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

Observe o `X-Cache` mudando de `MISS` para `HIT` para `STALE` para `BYPASS`. Ajuste o `nginx.conf`, recarregue com `docker compose exec nginx nginx -s reload`, rode os alvos do Make de novo. Esse é o loop. Sem dashboard, sem CLI de fornecedor, sem chute. Quando seu cache de produção se comportar de forma estranha, você vai ter um modelo mental que bate com o que realmente acontece no fio — porque você viu acontecer no seu laptop.
