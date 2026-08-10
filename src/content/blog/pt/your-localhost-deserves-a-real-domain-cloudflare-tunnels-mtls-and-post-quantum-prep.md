---
title: 'Seu localhost merece um domínio de verdade: Cloudflare Tunnels, mTLS e preparação pós-quântica'
date: '2026-08-10'
tags:
  - cloudflare
  - redes
  - segurança
  - docker
  - tls
  - zero-trust
description: >-
  Troque o ngrok por Cloudflare Tunnels, coloque mTLS entre serviços e prepare
  suas origins pra autenticação pós-quântica — tudo a partir do laptop.
---

Você tem três serviços rodando local: uma API em Go na :8080, um frontend Next.js na :3000 e um Postgres que você jurou que ia containerizar. Precisa testar um webhook do Stripe, mostrar o dashboard novo pro colega e conferir se o handshake mTLS funciona — sem commitar código, sem abrir porta no roteador e sem explicar pro provedor por que a 443 subitamente ficou ocupada.

Chegou a hora dos Cloudflare Tunnels. Não aquele "teste rápido" que você fez uma vez com `cloudflared tunnel --url localhost:3000` e esqueceu. Estou falando de nível produção: tunnels nomeados com config-as-code, mTLS entre os serviços locais, certificados de verdade em que o navegador confia, e o suporte novo a autenticação pós-quântica que a Cloudflare acabou de soltar pras conexões de origin. Tudo a partir de um único `docker-compose.yml` que você versiona.

No fim deste post você tem um ambiente de dev local que expõe qualquer serviço num hostname real com TLS válido, impõe TLS mútuo entre serviços, registra cada request pra debug e já está pronto pro futuro pós-quântico — sem nunca abrir a página de port forwarding do roteador.

## Por que o localhost atual te trava

Você conhece a rotina. `ngrok http 3000` te dá `https://a1b2c3d4.ngrok-free.app` — válido por duas horas, subdomínio aleatório a cada restart. Webhook do Stripe? Boa sorte configurando um endpoint que muda todo dia. Dá pra pagar domínio reservado, mas são US$ 5/mês pelo privilégio de fazer tunnel na infra de outra pessoa quando você já tem domínio parado na Cloudflare.

Certificado autoassinado é pior. `mkcert -install` funciona até não funcionar — o navegador confia, o `fetch()` do Next.js não, o cliente HTTP em Go rejeita, e o verificador de webhook do Stripe recusa de cara. Você acaba com `NODE_TLS_REJECT_UNAUTHORIZED=0` no `.env.local`, uma armadilha que vai esquecer de tirar antes de ir pra produção.

```bash
# The "it works on my machine" certificate dance
mkcert -install
mkcert localhost 127.0.0.1 ::1
# Now configure every single client to trust this CA
export SSL_CERT_FILE="$(mkcert -CAROOT)/rootCA.pem"
```

Aí vem o malabarismo do `/etc/hosts`. `api.localhost`, `app.localhost`, `db.localhost` — todos apontando pra `127.0.0.1`. Só que o Docker no macOS/Windows não vê `127.0.0.1` do mesmo jeito que o host. Você troca pra `host.docker.internal`, aí o serviço Go não alcança o Postgres porque ele está numa rede Docker customizada, aí você coloca `network_mode: host` e conflitos de porta comem a tarde.

```yaml
# docker-compose.yml — the "works until it doesn't" approach
services:
  api:
    network_mode: host  # Congrats, no more port mapping, also no isolation
  postgres:
    network_mode: host  # Hope nothing else uses 5432
```

Terminar TLS de verdade? Esquece. Seu proxy reverso (Caddy, Traefik, Nginx) termina TLS local, mas os certificados não são os mesmos da produção. Encaminhamento de header vira bagunça — `X-Forwarded-For`, `X-Forwarded-Proto`, `Forwarded` — e a lógica da aplicação se comporta diferente atrás de proxy do que em bare metal.

mTLS? Você já leu a doc. Já gerou cert de cliente com `openssl req -newkey rsa:2048 -nodes -keyout client.key -x509 -days 365 -out client.crt`. Já configurou o servidor Go com `RequireAndVerifyClientCert`. Já passou três horas debugando `x509: certificate signed by unknown authority` porque a cadeia de CA estava um arquivo errado.

Aqui a falha de webhook do Stripe que estraga a sexta:

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

O cliente de webhook de saída do Stripe não confia na cadeia de certificados do ngrok no plano gratuito. Dá pra fazer upgrade — ou parar de brigar com as ferramentas e dar ao localhost um domínio de verdade, com certificados em que todo mundo confia: Stripe, navegador e as suas próprias chamadas serviço-a-serviço.

## Cloudflare Tunnels: o modelo mental que você precisa de fato

Pare de pensar no `cloudflared` como proxy reverso. Não é. É um **cliente QUIC só de saída** que mantém uma conexão persistente e multiplexada com a borda da Cloudflare. Seu laptop inicia a conexão. O roteador só vê UDP/443 de saída. Sem port forwarding, sem regra de firewall, sem crise existencial do tipo "será que meu provedor bloqueia a porta 80?".

```
Browser → Cloudflare Edge (TLS termination) → QUIC tunnel → cloudflared (local) → HTTP service
```

Essa é a arquitetura inteira. A Cloudflare termina o TLS na borda com o seu certificado de verdade (emitido via ACME, gerenciado por eles). O tunnel carrega HTTP puro até o serviço local. A API Go na `:8080` nunca vê certificado. Só vê `Host: api.dev.lacorte.dev` e processa a request.

### Tunnels nomeados vs. efêmeros: cresça

`cloudflared tunnel --url localhost:3000` cria um **tunnel efêmero**. Subdomínio aleatório, config sem persistência, morre no `Ctrl+C`. Serve pra um "ei, olha isso rapidinho." Inútil pra webhook, teste de mTLS ou qualquer coisa que precise sobreviver ao laptop hibernar.

**Tunnels nomeados** são a versão adulta. Você cria uma vez:

```bash
cloudflared tunnel create dev-env
# Output: Created tunnel dev-env with id 123e4567-e89b-12d3-a456-426614174000
```

Isso te dá um UUID estável. Aí você configura o DNS uma vez:

```bash
cloudflared tunnel route dns dev-env api.dev.lacorte.dev
cloudflared tunnel route dns dev-env app.dev.lacorte.dev
cloudflared tunnel route dns dev-env db.dev.lacorte.dev  # yes, really
```

### O `config.yml` que você de fato vai versionar

Esqueça as flags. Coloque isto em `~/.cloudflared/config.yml` (ou `./cloudflared/config.yml` pro setup Docker que vem a seguir):

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

**As regras de ingress casam de cima pra baixo.** O primeiro match vence. O catch-all wildcard no final impede que erros de "tunnel not found" vazem a estrutura interna. `host.docker.internal` funciona porque estamos rodando o `cloudflared` dentro do Docker — mais sobre isso na próxima seção.

### Terminação de TLS: a borda faz o trabalho pesado

A Cloudflare provisiona um certificado válido e publicamente confiável pra `*.dev.lacorte.dev` via Let's Encrypt (ou a CA própria deles). O navegador vê o cadeado. O serviço local vê `X-Forwarded-Proto: https` e HTTP puro. Esse é o default certo. Você **não** quer gerenciar certificado no localhost. Você **não** quer `mkcert` no Dockerfile.

O tunnel cifra o tráfego entre borda e origin via QUIC. É isso. Seu serviço continua burro e feliz.

## Docker Compose: um arquivo pra governar todos

Aqui está a stack inteira — tunnel, API, frontend e banco — num único arquivo que você `git commit` e sobe com `docker compose up -d` em qualquer máquina com Docker. Sem binário `cloudflared` no host, sem unit do systemd, sem desculpa de "funciona na minha máquina".

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

Note o `NEXT_PUBLIC_API_URL`: ele entra no bundle do frontend e roda no *navegador*, que não faz a menor ideia do que `api` resolve na rede Docker — esse nome só existe dentro da `appnet`. Aponte as variáveis voltadas pro browser pro hostname público do tunnel (`https://api.localhost.dev`). Se o frontend também faz chamada server-side (SSR, route handlers), essas rodam dentro da rede Docker e podem usar `http://api:8080` sem drama.

O serviço `cloudflared` monta dois arquivos: a *config de ingress* que mapeia hostnames pra serviços internos, e as *credenciais do tunnel* que provam à borda da Cloudflare qual tunnel é esse. Crie o `cloudflared/config.yml`:

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

Note os nomes DNS do Docker nos campos `service:`: `api:8080` e `frontend:3000` — isso é o `cloudflared`, na rede `appnet`, alcançando os containers pelos nomes DNS do Docker. Tráfego externo chega em `api.localhost.dev` e `app.localhost.dev` (apontados pro tunnel via DNS da Cloudflare), termina TLS na borda e roteia pela conexão QUIC até o container certo.

O campo `tunnel:` é o UUID gerado por `cloudflared tunnel create dev-env`, não um token — ID e token são credenciais diferentes, e uma não substitui a outra. Criar o tunnel grava um arquivo de credenciais em `~/.cloudflared/<uuid>.json`; copie pro diretório (ignorado pelo git) que você está montando:

```bash
cp ~/.cloudflared/123e4567-e89b-12d3-a456-426614174000.json ./cloudflared/credentials.json
```

Esse arquivo, montado como somente leitura acima, é o segredo de fato — nunca commit.

**Prefere pular o gerenciamento de arquivo de credenciais?** Use o modo token: tire `credentials-file` e o UUID de `tunnel:` do `config.yml`, e rode o `cloudflared` com um token obtido via `cloudflared tunnel token dev-env`:

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

O token codifica a identidade do tunnel, então não precisa montar `credentials-file` — mais simples pra CI ou ambiente descartável, ao custo de um segredo de longa duração parado no `.env`:

```bash
# .env (token mode only — keep out of version control)
TUNNEL_TOKEN=eyJhIjoi...your-token-from-cloudflare-dashboard...
```

O resto deste post assume o caminho de credenciais locais acima; troque pro modo token onde aparecer `credentials-file` se preferir esse caminho.

Rode `docker compose up -d`. Acompanhe `docker compose logs -f cloudflared` até ver a linha "Connection established". Pronto. Seu localhost agora tem hostnames de verdade, certificados válidos e uma topologia que sobrevive a reboot, mudança de rede e aquele colega que "só precisa ver rapidinho".

## TLS mútuo entre serviços locais sem dor de cabeça

Você já tem TLS válido da Cloudflare até o laptop pra tudo que o navegador acessa. Agora faça os *serviços* verificarem *uns aos outros* — sem header de "confia em mim", validação de certificado de verdade com uma CA que você controla. Isso é mTLS serviço-a-serviço: o listener `:8443` da API Go exige certificado de cliente antes de responder qualquer coisa, e qualquer chamador — outro serviço, um script, o `curl` — precisa apresentar um certificado assinado pela sua CA pra passar.

Primeiro, instale o `mkcert` e crie uma CA local em que o SO e os containers de fato confiem:

```bash
# macOS
brew install mkcert nss
# Linux
sudo apt install libnss3-tools && go install filippo.io/mkcert@latest
# Windows
choco install mkcert

mkcert -install
```

A flag `-install` adiciona a CA raiz ao trust store do sistema. No Linux, o Firefox precisa do `libnss3-tools` — o mkcert avisa, você ignora, e depois fica se perguntando por que o `curl` funciona e o Firefox não.

Gere certificados pra cada serviço. Use nomes DNS que casem com a config do tunnel, não `localhost`:

```bash
mkdir -p certs
mkcert -key-file certs/api-key.pem -cert-file certs/api.pem \
  api.localhost "*.api.localhost" 127.0.0.1 ::1
mkcert -key-file certs/web-key.pem -cert-file certs/web.pem \
  web.localhost "*.web.localhost" 127.0.0.1 ::1
mkcert -key-file certs/client-key.pem -cert-file certs/client.pem \
  "client.localhost"
```

O `client.pem` é o que qualquer chamador — outro serviço, um sidecar, um script — apresenta ao chamar a API direto.

O servidor precisa confiar na mesma raiz que assinou o `client.pem`. Copie a CA raiz do mkcert pro projeto pra a aplicação não depender do trust store do sistema:

```bash
cp "$(mkcert -CAROOT)/rootCA.pem" certs/rootCA.pem
```

Agora configure a API Go pra exigir e verificar certificados de cliente. Isso não é opcional — `ClientAuth: tls.RequireAndVerifyClientCert` significa sem cert, sem tráfego:

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

Equivalente em Node.js — mesmo princípio, menos linhas:

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

Isso resolve o mTLS serviço-a-serviço: qualquer chamador local que apresente o `client.pem` passa; qualquer outro é rejeitado na camada TLS. Vale ser preciso sobre duas questões relacionadas, mas diferentes, que isso *não* cobre:

- **Navegador → borda** continua exatamente como antes — HTTPS público puro, terminado pela Cloudflare com um certificado em que o navegador confia. O mTLS interno entre os seus serviços não muda isso.
- **Autenticação de cliente borda → origin** — provar que uma request que chega na origin de fato veio da borda da Cloudflare, e não de alguém que achou o seu IP — é uma feature separada chamada **Authenticated Origin Pulls**. Você ativa por zona no dashboard (SSL/TLS → Origin Server → Authenticated Origin Pulls) ou via API; a Cloudflare então apresenta um certificado de cliente assinado pela CA própria dela em cada request borda-pra-origin, e a stack TLS da origin verifica. Não existe campo `originRequest.mTLS` na config do `cloudflared` — essa chave não existe. Se quiser que o servidor Go/Node imponha isso também, adicione o certificado da CA de origin-pull da Cloudflare como outra entrada confiável em `ClientCAs` junto com a raiz do mkcert, e a lógica existente de `RequireAndVerifyClientCert` cobre os dois casos.

Pro setup deste post — um tunnel fazendo proxy pra um container na sua própria rede Docker confiável — `http://` puro pro serviço (como no `cloudflared/config.yml` acima) basta, e Authenticated Origin Pulls não é necessário. Recorra a ele quando a origin estiver diretamente acessível na internet pública e você precisar provar que a request veio da borda.

Teste o handshake mTLS serviço-a-serviço direto contra o servidor Go/Node:

```bash
# Present a valid client cert — should succeed
curl -v --cert certs/client.pem --key certs/client-key.pem \
  --cacert certs/rootCA.pem https://api.localhost:8443/health

# Without a client cert — should fail the TLS handshake
curl -v --cacert certs/rootCA.pem https://api.localhost:8443/health
```

Olhe os logs. Você vai ver `TLS handshake complete` com `peer certificates: 1` do lado do servidor. Pronto — autenticação mútua com zero segredo de longa duração no código. A CA nunca sai da sua máquina. Rotacione os certificados todo ano com um cron se estiver se sentindo responsável.

## Autenticação pós-quântica: o que dá pra ligar hoje

A Cloudflare soltou em silêncio a autenticação pós-quântica de origin no trimestre passado. Não é enfeite de marketing — é um handshake KEM híbrido (X25519+Kyber768) entre a borda deles e a sua origin. O modelo de ameaça é harvest-now-decrypt-later: alguém grava o tráfego TLS hoje, espera um CRQC (computador quântico criptograficamente relevante) e decifra depois as API keys, tokens de sessão e aquela mensagem de commit vergonhosa que você deu push pra produção. Auth PQ torna essa gravação inútil sem quebrar as trocas de chave clássica e pós-quântica ao mesmo tempo.

Ativar exige duas coisas: HTTP/2 até a origin (o QUIC ainda não suporta auth PQ) e a feature flag. Pós-quântico é configuração **do tunnel inteiro**, não algo que você liga por regra de ingress — mora no nível superior do `config.yml`, junto de `tunnel:` e `credentials-file:`:

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

Sem arquivo de config por perto? A mesma flag existe como CLI `cloudflared tunnel run --post-quantum`, ou a variável `TUNNEL_POST_QUANTUM=true` — útil se você estiver no modo token da seção de compose.

Reinicie o container do tunnel: `docker compose restart cloudflared`. A borda da Cloudflare agora tenta uma troca de chave híbrida `X25519MLKEM768` com o seu `cloudflared` local, que fala HTTP/2 com os serviços.

A verificação não vem dos headers de resposta — o `cf-ray` não ganha sufixo `-pq`. Os caracteres depois do ray ID sempre são o código de aeroporto do datacenter (`-ORD` pra Chicago, `-GRU` pra São Paulo, e assim por diante), pós-quântico ou não. Confira estes em vez disso:

1. **Logs do `cloudflared`** com `--loglevel debug` — as linhas de conexão informam o grupo de troca de chaves negociado.
2. **`cdn-cgi/trace`**, acessado pelo hostname do próprio tunnel:

```bash
curl -s https://api.lab.lacorte.dev/cdn-cgi/trace
# ...
# tls=TLSv1.3
# kex=X25519MLKEM768
```

Um valor de `kex` igual a `X25519MLKEM768` (o grupo híbrido ML-KEM padronizado, antes lançado sob o nome de rascunho `X25519Kyber768Draft00`) confirma handshake pós-quântico nessa conexão. Pro trecho específico borda-pra-origin, cruze com o dashboard da Cloudflare → Zero Trust → Networks → Tunnels → o seu tunnel, e consulte a doc atual de pós-quântico da Cloudflare pelos campos exatos de verificação — essa área ainda está evoluindo.

Suporte de navegadores: Chrome 116+, Firefox 118+ e builds recentes do Safari suportam troca de chaves híbrida ML-KEM no TLS 1.3. A Cloudflare termina PQ na borda — o navegador negocia o grupo híbrido direto com a Cloudflare; a config PQ do tunnel governa o trecho borda-pra-origin. O fallback é automático: se a origin (ou a versão do `cloudflared`) não suportar PQ, a Cloudflare cai em silêncio pro X25519 clássico. Sem erro, sem request quebrada — você só vê um `kex` clássico.

Uma pegadinha: `http2Origin: true` exige que os serviços locais aceitem h2c (HTTP/2 em texto puro) ou TLS com um certificado em que o `cloudflared` confia. Como usamos mkcert na seção anterior, monte o diretório `certs/` dentro do container `cloudflared` (`- ./certs:/etc/cloudflared/certs:ro`) e adicione `caPool: /etc/cloudflared/certs/rootCA.pem` ao `originRequest` daquela regra se os serviços servirem HTTPS. Pra backends de HTTP puro — como `api` e `frontend` no compose deste post — o h2c funciona sem config extra, e você pode pular o `caPool` por completo.

Isso não é teatro de future-proofing. A flag existe, o hardware existe, e a config é uma linha. Ligue agora pra a saída do `cdn-cgi/trace` e os logs do `cloudflared` mostrarem `X25519MLKEM768`, e você poder dizer de boa que a stack de dev local está preparada pro pós-quântico.

## Debug, observabilidade e a saída do "funciona na minha máquina"

O tunnel está rodando. Os certificados validam. O handshake mTLS completa. Aí algo quebra — webhook devolve 502, um header some, o colega vê um erro diferente do seu. Hora de parar de chutar e olhar dado estruturado.

### Logging estruturado que não é uma porcaria

O `cloudflared` fala JSON quando você pede educado. Atualize o serviço no compose:

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

A flag `--logfile` escreve linhas JSON num volume que você pode acompanhar com tail, mandar pro Loki ou processar com `jq`:

```bash
docker compose exec cloudflared tail -f /var/log/cloudflared/access.log | jq '.'
```

Saída de exemplo quando uma request chega na API Go:

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

Notou o `pq_kem`? Essa é a confirmação do handshake pós-quântico, espelhando o `kex` do `cdn-cgi/trace` acima. Se estiver ausente na saída de log real, a config da origin não está negociando o KEM híbrido — confira de novo a flag `post-quantum: true` de tunnel inteiro da seção anterior, e veja quais campos a sua versão do `cloudflared` de fato emite, já que esquemas de log estruturado mudam entre releases.

### Dashboard Zero Trust: a fonte da verdade

O dashboard Zero Trust da Cloudflare (Dash → Zero Trust → Logs → HTTP) mostra cada request que atravessou o tunnel, completo com:

- Headers de request/resposta (sanitizados)
- Detalhes da negociação TLS
- Resultado da validação do certificado de cliente mTLS
- Matches de regras do WAF
- Origem geográfica

Filtre pelo header `cf-ray` pra correlacionar com os logs locais. O dashboard retém 72 horas no plano gratuito — o bastante pra debugar aquele incidente de "funcionava ontem".

### Expondo serviços não-HTTP: `cloudflared tunnel route ip`

Seu container Postgres vive na rede do compose. O `psql` do colega vive no laptop dele. Não faça tunnel SSH. Roteie a subnet:

```bash
# Run once per tunnel (persists in Cloudflare's config)
cloudflared tunnel route ip add 172.20.0.0/16 <TUNNEL_NAME> --config /etc/cloudflared/config.yml
```

Agora qualquer device no tunnel (incluindo o `cloudflared access tcp --hostname db.lacorte.dev --url tcp://localhost:5432` do colega) alcança `172.20.0.5:5432` direto. Funciona pra impressora, API interna, aquele servidor esquisito de dongle USB de licença — qualquer coisa com IP.

Atualize o `config.yml` pra anunciar a rota:

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

O bloco `warp-routing` habilita as rotas de IP que você adicionou via CLI. Sem porta extra, sem gambiarra com `socat`.

### Fluxo de time: commit, compartilhe, rode

Seu repositório agora contém:

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

Integre um dev novo em três passos:

```bash
git clone git@github.com:you/local-stack.git
cp .env.example .env
# Paste tunnel token from 1Password/Bitwarden into .env
docker compose up -d
```

Todo mundo recebe hostname idêntico, certificado idêntico, imposição de mTLS idêntica, logging idêntico. Sem "funciona na minha máquina" porque a máquina *é* o compose file.

### Checklist de promoção pra staging

Antes de copiar esse padrão pra staging, confira:

- [ ] Token do tunnel num gerenciador de segredos (não no `.env`), injetado na hora do deploy
- [ ] `cloudflared` roda como usuário não-root (`user: "1000:1000"` no compose, ou ServiceAccount dedicada no K8s)
- [ ] Endpoint de métricas (`:2000`) coletado pelo Prometheus com `job="cloudflared-tunnel"`
- [ ] Volume de log montado em armazenamento persistente ou enviado ao Loki/Vector
- [ ] `warp-routing` habilitado e rotas de IP documentadas no runbook
- [ ] Certificado da CA mTLS rotacionado anualmente (lembrete de calendário: `mkcert -install` regenera a raiz)
- [ ] KEM pós-quântico verificado nos logs de staging (campo `pq_kem` presente)
- [ ] Tunnel de failover configurado com um `TUNNEL_TOKEN` diferente em outra região
- [ ] Versão do `cloudflared` fixada no compose (`2024.12.0`, não `latest`)
- [ ] Runbook inclui: procedimento de limpeza `cloudflared tunnel route ip delete`

Você trocou um hábito frágil de `ngrok` por infra que dá pra versionar, revisar e debugar. O tunnel agora é código. Trate como código.
