---
title: 'Seu Localhost Merece um Domínio Real: Cloudflare Tunnels, mTLS e Preparação Pós-Quântica'
date: '2026-08-10'
tags:
  - cloudflare
  - redes
  - segurança
  - docker
  - tls
  - zero-trust
description: >-
  Substitua o ngrok por Cloudflare Tunnels, adicione mTLS para autenticação serviço-a-serviço e prepare suas origens para autenticação pós-quântica — tudo direto do seu laptop.
---

Você tem três serviços rodando localmente: uma API em Go na porta :8080, um frontend Next.js na :3000, e uma instância Postgres que você jurou que ia containerizar. Precisa testar um webhook do Stripe, mostrar o novo dashboard para um colega, e verificar se o seu handshake mTLS funciona — tudo isso sem commitar código, abrir portas no seu roteador, ou explicar ao seu provedor por que a porta 443 está subitamente ocupada.

Chegou a hora dos Cloudflare Tunnels. Não aquele "teste rápido" que você fez uma vez com `cloudflared tunnel --url localhost:3000` e esqueceu de existir. Estou falando de nível produção: tunnels nomeados com config-as-code, mTLS entre seus serviços locais, certificados reais que os navegadores confiam, e o novo suporte a autenticação pós-quântica que a Cloudflare acabou de lançar para conexões de origem. Tudo isso rodando a partir de um único `docker-compose.yml` que você pode versionar.

Ao final deste post, você terá um ambiente de desenvolvimento local que expõe qualquer serviço num hostname real com TLS válido, impõe TLS mútuo entre serviços, registra cada requisição para debug, e está pronto para o futuro pós-quântico — sem nunca precisar tocar na página de port forwarding do seu roteador.

## Por Que Seu Setup Atual de Localhost Está Te Travando

Você conhece a rotina. `ngrok http 3000` te dá `https://a1b2c3d4.ngrok-free.app` — válido por duas horas, subdomínio aleatório a cada restart. Webhooks do Stripe? Boa sorte configurando um endpoint de webhook que muda todos os dias. Você poderia pagar por um domínio reservado, mas isso custa $5/mês pelo privilégio de fazer tunnel através da infraestrutura de outra pessoa quando você já tem um domínio parado na Cloudflare.

Certificados autoassinados são piores. `mkcert -install` funciona até não funcionar mais — seu navegador confia nele, mas o `fetch()` no seu app Next.js não confia, seu cliente HTTP em Go rejeita, e o verificador de webhook do Stripe recusa terminantemente. Você acaba com `NODE_TLS_REJECT_UNAUTHORIZED=0` no seu `.env.local`, uma armadilha que você vai esquecer de remover antes de ir para produção.

```bash
# The "it works on my machine" certificate dance
mkcert -install
mkcert localhost 127.0.0.1 ::1
# Now configure every single client to trust this CA
export SSL_CERT_FILE="$(mkcert -CAROOT)/rootCA.pem"
```

Depois vem a malabarismo do `/etc/hosts`. `api.localhost`, `app.localhost`, `db.localhost` — todos apontando para `127.0.0.1`. Só que o Docker no macOS/Windows não vê `127.0.0.1` do mesmo jeito que o seu host vê. Você troca para `host.docker.internal`, então seu serviço Go não consegue alcançar o Postgres porque ele está numa rede Docker customizada, então você adiciona `network_mode: host` e agora conflitos de porta comem a sua tarde.

```yaml
# docker-compose.yml — the "works until it doesn't" approach
services:
  api:
    network_mode: host  # Congrats, no more port mapping, also no isolation
  postgres:
    network_mode: host  # Hope nothing else uses 5432
```

TLS de verdade sendo terminado? Esquece. Seu proxy reverso (Caddy, Traefik, Nginx) termina o TLS localmente, mas os certificados não são os mesmos que a produção usa. O encaminhamento de headers fica confuso — `X-Forwarded-For`, `X-Forwarded-Proto`, `Forwarded` — e a lógica da sua aplicação se comporta diferente atrás de um proxy do que se comportaria em bare metal.

TLS mútuo? Você já leu a documentação. Já gerou certificados de cliente com `openssl req -newkey rsa:2048 -nodes -keyout client.key -x509 -days 365 -out client.crt`. Já configurou o seu servidor Go para `RequireAndVerifyClientCert`. Já passou três horas debugando `x509: certificate signed by unknown authority` porque a cadeia de CA está com um arquivo errado.

Aqui está a falha de webhook do Stripe que arruína a sua sexta-feira:

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

O cliente de webhooks de saída do Stripe não confia na cadeia de certificados do ngrok no plano gratuito. Você poderia fazer upgrade, ou poderia parar de brigar com as suas ferramentas e dar ao seu localhost um domínio real com certificados reais que todo mundo confia — incluindo o Stripe, o seu navegador, e as suas próprias chamadas serviço-a-serviço.

## Cloudflare Tunnels: O Modelo Mental Que Você Realmente Precisa

Pare de pensar no `cloudflared` como um proxy reverso. Ele não é. É um **cliente QUIC somente de saída** que mantém uma conexão persistente e multiplexada com a borda da Cloudflare. O seu laptop inicia a conexão. O seu roteador não vê nada além de UDP/443 de saída. Sem port forwarding, sem regras de firewall, sem crises existenciais do tipo "espera, meu provedor bloqueia a porta 80?".

```
Browser → Cloudflare Edge (TLS termination) → QUIC tunnel → cloudflared (local) → HTTP service
```

Essa é a arquitetura inteira. A Cloudflare termina o TLS na borda usando o seu certificado real (emitido via ACME, gerenciado por eles). O tunnel carrega HTTP puro até o seu serviço local. A sua API Go na `:8080` nunca vê um certificado. Ela só vê `Host: api.dev.lacorte.dev` e processa a requisição.

### Tunnels Nomeados vs. Efêmeros: Cresça

`cloudflared tunnel --url localhost:3000` cria um **tunnel efêmero**. Subdomínio aleatório, sem persistência de configuração, morre quando você aperta `Ctrl+C`. Bom para um "ei, olha isso rapidinho." Inútil para webhooks, teste de mTLS, ou qualquer coisa que precise sobreviver a um laptop hibernando.

**Tunnels nomeados** são a versão adulta. Você os cria uma vez:

```bash
cloudflared tunnel create dev-env
# Output: Created tunnel dev-env with id 123e4567-e89b-12d3-a456-426614174000
```

Isso te dá um UUID estável. Você então configura o DNS uma vez:

```bash
cloudflared tunnel route dns dev-env api.dev.lacorte.dev
cloudflared tunnel route dns dev-env app.dev.lacorte.dev
cloudflared tunnel route dns dev-env db.dev.lacorte.dev  # yes, really
```

### O `config.yml` Que Você Vai Realmente Versionar

Esqueça as flags. Coloque isto em `~/.cloudflared/config.yml` (ou `./cloudflared/config.yml` para o setup Docker que vem a seguir):

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

**As regras de ingress casam de cima para baixo.** O primeiro match vence. O catch-all wildcard no final impede que erros de "tunnel not found" revelem a sua estrutura interna. `host.docker.internal` funciona porque estamos rodando o `cloudflared` dentro do Docker — mais sobre isso na próxima seção.

### Terminação de TLS: A Borda Faz o Trabalho Pesado

A Cloudflare provisiona um certificado válido e publicamente confiável para `*.dev.lacorte.dev` via Let's Encrypt (ou a CA própria deles). O seu navegador vê um cadeado verde. O seu serviço local vê `X-Forwarded-Proto: https` e HTTP puro. Esse é o padrão correto. Você **não** quer gerenciar certificados no localhost. Você **não** quer o `mkcert` no seu Dockerfile.

O tunnel criptografa o tráfego entre a borda e a origem via QUIC. É isso. O seu serviço continua burro e feliz.

## Docker Compose: Um Arquivo Para Governar a Todos

Aqui está a stack inteira — tunnel, API, frontend e banco de dados — em um único arquivo que você pode `git commit` e rodar com `docker compose up -d` em qualquer máquina com Docker instalado. Sem binário `cloudflared` no host, sem units do systemd, sem desculpas de "funciona na minha máquina".

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

Note o `NEXT_PUBLIC_API_URL`: ele é embutido no bundle do frontend e roda no *navegador*, que não tem a menor ideia do que `api` resolve na rede Docker — esse nome só existe dentro da `appnet`. Aponte as variáveis de ambiente voltadas para o navegador para o hostname público do tunnel (`https://api.localhost.dev`). Se o seu frontend também faz chamadas do lado do servidor (SSR, route handlers), essas executam dentro da rede Docker e podem usar `http://api:8080` com segurança.

O serviço `cloudflared` monta dois arquivos: a *configuração de ingress* que mapeia hostnames para serviços internos, e as *credenciais do tunnel* que provam à borda da Cloudflare qual tunnel é esse. Crie o `cloudflared/config.yml`:

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

Note os nomes DNS do Docker nos campos `service:`: `api:8080` e `frontend:3000` — isso é o `cloudflared`, rodando na rede `appnet`, alcançando os seus containers pelos nomes DNS do Docker. O tráfego externo chega em `api.localhost.dev` e `app.localhost.dev` (apontados para o tunnel via DNS da Cloudflare), termina o TLS na borda, e roteia através da conexão QUIC até o container certo.

O campo `tunnel:` é o UUID gerado por `cloudflared tunnel create dev-env`, não um token — um ID e um token são credenciais diferentes, e uma não substitui a outra. Criar o tunnel escreve um arquivo de credenciais em `~/.cloudflared/<uuid>.json`; copie-o para o diretório (ignorado pelo git) que você está montando:

```bash
cp ~/.cloudflared/123e4567-e89b-12d3-a456-426614174000.json ./cloudflared/credentials.json
```

Esse arquivo, montado como somente leitura acima, é o segredo de fato — nunca o commite.

**Prefere pular o gerenciamento de um arquivo de credenciais?** Use o modo token: remova `credentials-file` e o UUID de `tunnel:` do `config.yml`, e rode o `cloudflared` com um token obtido via `cloudflared tunnel token dev-env`:

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

O token codifica a identidade do tunnel, então não há montagem de `credentials-file` — mais simples para CI ou ambientes descartáveis, ao custo de um segredo de longa duração parado no `.env`:

```bash
# .env (token mode only — keep out of version control)
TUNNEL_TOKEN=eyJhIjoi...your-token-from-cloudflare-dashboard...
```

O resto deste post assume o caminho de credenciais locais acima; troque para o modo token onde você vir `credentials-file` se preferir esse caminho.

Rode `docker compose up -d`. Observe `docker compose logs -f cloudflared` até ver a linha "Connection established". É isso. O seu localhost agora tem hostnames reais, certificados válidos, e uma topologia que sobrevive a reboots, mudanças de rede, e aquele colega que "só precisa ver rapidinho".

## TLS Mútuo Entre Serviços Locais Sem Dor de Cabeça

Você já tem TLS válido da Cloudflare até o seu laptop para qualquer coisa que um navegador acesse. Agora faça os seus *serviços* verificarem *um ao outro* — sem mais headers de "confia em mim", validação de certificado real com uma CA que você controla. Isso é mTLS serviço-a-serviço: o listener `:8443` da sua API Go exige um certificado de cliente antes de responder qualquer coisa, e qualquer chamador — outro serviço, um script, o `curl` — precisa apresentar um certificado assinado pela sua CA para passar.

Primeiro, instale o `mkcert` e crie uma CA local que o seu sistema operacional e containers vão realmente confiar:

```bash
# macOS
brew install mkcert nss
# Linux
sudo apt install libnss3-tools && go install filippo.io/mkcert@latest
# Windows
choco install mkcert

mkcert -install
```

A flag `-install` adiciona a CA raiz ao trust store do seu sistema. O Firefox precisa do `libnss3-tools` no Linux — o mkcert avisa isso, mas você vai ignorar e depois vai ficar se perguntando por que o `curl` funciona mas o Firefox não.

Gere certificados para cada serviço. Use nomes DNS que combinem com a sua configuração de tunnel, não `localhost`:

```bash
mkdir -p certs
mkcert -key-file certs/api-key.pem -cert-file certs/api.pem \
  api.localhost "*.api.localhost" 127.0.0.1 ::1
mkcert -key-file certs/web-key.pem -cert-file certs/web.pem \
  web.localhost "*.web.localhost" 127.0.0.1 ::1
mkcert -key-file certs/client-key.pem -cert-file certs/client.pem \
  "client.localhost"
```

O `client.pem` é o que qualquer chamador — outro serviço, um sidecar, um script — apresenta ao chamar a sua API diretamente.

O seu servidor precisa confiar na mesma raiz que assinou o `client.pem`. Copie a CA raiz do mkcert para dentro do seu projeto para que a aplicação não dependa do trust store do sistema:

```bash
cp "$(mkcert -CAROOT)/rootCA.pem" certs/rootCA.pem
```

Agora configure a sua API Go para exigir e verificar certificados de cliente. Isso não é opcional — `ClientAuth: tls.RequireAndVerifyClientCert` significa sem certificado, sem tráfego:

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

Isso resolve o mTLS serviço-a-serviço: qualquer chamador local que apresente o `client.pem` passa, qualquer outro é rejeitado na camada TLS. Vale a pena ser preciso sobre duas questões relacionadas, mas diferentes, que isso *não* cobre:

- **Navegador → borda** continua exatamente como descrito antes — HTTPS público puro, terminado pela Cloudflare com um certificado em que o seu navegador confia. O mTLS interno entre os seus serviços não muda isso.
- **Autenticação de cliente borda → origem** — provar que uma requisição que chega na sua origem realmente veio da borda da Cloudflare, e não de qualquer um que descobriu o seu IP — é uma funcionalidade separada chamada **Authenticated Origin Pulls**. Você a ativa por zona no dashboard (SSL/TLS → Origin Server → Authenticated Origin Pulls) ou via API; a Cloudflare então apresenta um certificado de cliente assinado pela CA própria dela em cada requisição borda-para-origem, e a stack TLS da sua origem o verifica. Não existe um campo `originRequest.mTLS` na configuração do `cloudflared` — essa chave não existe. Se você quiser que o seu servidor Go/Node imponha isso também, adicione o certificado da CA de origin-pull da Cloudflare como outra entrada confiável em `ClientCAs` junto com a sua raiz do mkcert, e a sua lógica existente de `RequireAndVerifyClientCert` cobre os dois casos.

Para o setup deste post — um tunnel fazendo proxy para um container na sua própria rede Docker confiável — `http://` puro para o serviço (como configurado no `cloudflared/config.yml` anteriormente) é suficiente, e o Authenticated Origin Pulls não é necessário. Recorra a ele quando a sua origem está diretamente acessível pela internet pública e você precisa provar que uma requisição se originou na borda.

Teste o handshake mTLS serviço-a-serviço diretamente contra o seu servidor Go/Node:

```bash
# Present a valid client cert — should succeed
curl -v --cert certs/client.pem --key certs/client-key.pem \
  --cacert certs/rootCA.pem https://api.localhost:8443/health

# Without a client cert — should fail the TLS handshake
curl -v --cacert certs/rootCA.pem https://api.localhost:8443/health
```

Observe os logs. Você vai ver `TLS handshake complete` com `peer certificates: 1` do lado do servidor. É isso — autenticação mútua com zero segredos de longa duração no seu código. A CA nunca sai da sua máquina. Rotacione os certificados anualmente com um cron job se você estiver se sentindo responsável.

## Autenticação Pós-Quântica: O Que Você Pode Ativar Hoje

A Cloudflare lançou silenciosamente a autenticação pós-quântica de origem no trimestre passado. Não é enfeite de marketing — é um handshake KEM híbrido (X25519+Kyber768) entre a borda deles e a sua origem. O modelo de ameaça é harvest-now-decrypt-later: alguém grava o seu tráfego TLS hoje, espera por um CRQC (computador quântico criptograficamente relevante), e retroativamente decifra as suas API keys, tokens de sessão, e aquela mensagem de commit vergonhosa que você deu push para produção. A autenticação PQ torna essa gravação inútil sem quebrar as trocas de chave clássica e pós-quântica simultaneamente.

Ativá-la exige duas coisas: HTTP/2 até a sua origem (o QUIC ainda não suporta autenticação PQ) e a feature flag. Pós-quântico é uma configuração **de tunnel inteiro**, não algo que você alterna por regra de ingress — ela vive no nível superior do `config.yml`, junto de `tunnel:` e `credentials-file:`:

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

Sem um arquivo de config por perto? A mesma flag existe como a flag de CLI `cloudflared tunnel run --post-quantum`, ou a variável de ambiente `TUNNEL_POST_QUANTUM=true` — útil se você estiver rodando o modo token da seção de compose anterior.

Reinicie o container do tunnel: `docker compose restart cloudflared`. A borda da Cloudflare agora tenta uma troca de chave híbrida `X25519MLKEM768` com o seu `cloudflared` local, que fala HTTP/2 com os seus serviços.

A verificação não vem dos headers de resposta — o `cf-ray` não ganha um sufixo `-pq`. Os caracteres depois do ray ID sempre são o código de aeroporto do datacenter (`-ORD` para Chicago, `-GRU` para São Paulo, e assim por diante), pós-quântico ou não. Verifique estes, em vez disso:

1. **Logs do `cloudflared`** com `--loglevel debug` — as linhas de log de conexão informam o grupo de troca de chaves negociado.
2. **`cdn-cgi/trace`**, acessado através do próprio hostname do seu tunnel:

```bash
curl -s https://api.lab.lacorte.dev/cdn-cgi/trace
# ...
# tls=TLSv1.3
# kex=X25519MLKEM768
```

Um valor de `kex` igual a `X25519MLKEM768` (o grupo híbrido ML-KEM padronizado, antes lançado sob o nome de rascunho `X25519Kyber768Draft00`) confirma um handshake pós-quântico para essa conexão. Para o trecho específico borda-para-origem, cruze a informação com o dashboard da Cloudflare → Zero Trust → Networks → Tunnels → o seu tunnel, e consulte a documentação atual de pós-quântico da Cloudflare para os campos exatos de verificação — essa é uma área que ainda está evoluindo.

Suporte de navegadores: Chrome 116+, Firefox 118+, e builds recentes do Safari suportam troca de chaves híbrida ML-KEM no TLS 1.3. A Cloudflare termina PQ na borda — o seu navegador negocia o grupo híbrido diretamente com a Cloudflare; a configuração PQ do tunnel governa o trecho borda-para-origem. O fallback é automático: se a sua origem (ou a versão do `cloudflared`) não suportar PQ, a Cloudflare silenciosamente cai para o X25519 clássico. Sem erros, sem requisições quebradas — você só vai ver um valor de `kex` clássico em vez disso.

Uma pegadinha: `http2Origin: true` exige que os seus serviços locais aceitem h2c (HTTP/2 em texto puro) ou TLS com um certificado em que o `cloudflared` confia. Já que estamos usando o mkcert na seção anterior, monte o seu diretório `certs/` dentro do container `cloudflared` (`- ./certs:/etc/cloudflared/certs:ro`) e adicione `caPool: /etc/cloudflared/certs/rootCA.pem` ao `originRequest` daquela regra se os seus serviços servirem HTTPS. Para backends de HTTP puro — como `api` e `frontend` no compose file deste post — o h2c funciona sem configuração adicional, e você pode pular o `caPool` completamente.

Isso não é teatro de future-proofing. A flag existe, o hardware existe, e a configuração é uma linha só. Ative agora para que a saída do seu `cdn-cgi/trace` e os logs do `cloudflared` mostrem `X25519MLKEM768`, e você possa honestamente dizer que a sua stack de dev local está preparada para o pós-quântico.

## Debug, Observabilidade, e a Estratégia de Saída do "Funciona na Minha Máquina"

O tunnel está rodando. Os certificados validam. O handshake mTLS completa. Aí algo quebra — um webhook retorna 502, um header é removido, um colega vê um erro diferente do seu. Hora de parar de adivinhar e começar a olhar dados estruturados.

### Logging Estruturado Que Não é Uma Porcaria

O `cloudflared` fala JSON quando você pede educadamente. Atualize o seu serviço no compose:

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

A flag `--logfile` escreve linhas JSON num volume que você pode acompanhar com tail, enviar para o Loki, ou processar com `jq`:

```bash
docker compose exec cloudflared tail -f /var/log/cloudflared/access.log | jq '.'
```

Saída de exemplo quando uma requisição chega na sua API Go:

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

Notou o `pq_kem`? Essa é a confirmação do seu handshake pós-quântico, espelhando o valor de `kex` do `cdn-cgi/trace` visto acima. Se estiver ausente da sua saída de log real, a configuração da sua origem não está negociando o KEM híbrido — verifique de novo a flag `post-quantum: true` de tunnel inteiro da seção anterior, e confirme quais campos a sua versão do `cloudflared` realmente emite, já que os esquemas de log estruturado evoluem entre releases.

### Dashboard Zero Trust: A Fonte da Verdade

O dashboard Zero Trust da Cloudflare (Dash → Zero Trust → Logs → HTTP) mostra cada requisição que atravessou o seu tunnel, completo com:

- Headers de requisição/resposta (sanitizados)
- Detalhes da negociação TLS
- Resultado da validação do certificado de cliente mTLS
- Matches de regras do WAF
- Origem geográfica

Filtre pelo header `cf-ray` para correlacionar com os seus logs locais. O dashboard retém 72 horas no plano gratuito — suficiente para debugar aquele incidente de "funcionava ontem".

### Expondo Serviços Não-HTTP: `cloudflared tunnel route ip`

O seu container Postgres vive na rede do compose. O cliente `psql` do seu colega vive no laptop dele. Não faça tunnel SSH. Roteie a subnet:

```bash
# Run once per tunnel (persists in Cloudflare's config)
cloudflared tunnel route ip add 172.20.0.0/16 <TUNNEL_NAME> --config /etc/cloudflared/config.yml
```

Agora qualquer dispositivo no tunnel (incluindo o `cloudflared access tcp --hostname db.lacorte.dev --url tcp://localhost:5432` do seu colega) alcança `172.20.0.5:5432` diretamente. Funciona para impressoras, APIs internas, aquele servidor de dongle de licença USB esquisito — qualquer coisa com um IP.

Atualize o `config.yml` para anunciar a rota:

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

O bloco `warp-routing` habilita as rotas de IP que você adicionou via CLI. Sem portas extras, sem gambiarras com `socat`.

### Fluxo de Time: Commit, Compartilhe, Rode

O seu repositório agora contém:

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

Integre um novo dev em três passos:

```bash
git clone git@github.com:you/local-stack.git
cp .env.example .env
# Paste tunnel token from 1Password/Bitwarden into .env
docker compose up -d
```

Todos recebem hostnames idênticos, certificados idênticos, imposição de mTLS idêntica, logging idêntico. Sem "funciona na minha máquina" porque a máquina *é* o compose file.

### Checklist de Promoção Para Staging

Antes de copiar esse padrão para staging, verifique:

- [ ] Token do tunnel armazenado num gerenciador de segredos (não no `.env`), injetado no momento do deploy
- [ ] `cloudflared` roda como usuário não-root (`user: "1000:1000"` no compose, ou ServiceAccount dedicada no K8s)
- [ ] Endpoint de métricas (`:2000`) coletado pelo Prometheus com `job="cloudflared-tunnel"`
- [ ] Volume de log montado em armazenamento persistente ou enviado ao Loki/Vector
- [ ] `warp-routing` habilitado e rotas de IP documentadas no runbook
- [ ] Certificado da CA mTLS rotacionado anualmente (lembrete de calendário: `mkcert -install` regenera a raiz)
- [ ] KEM pós-quântico verificado nos logs de staging (campo `pq_kem` presente)
- [ ] Tunnel de failover configurado com um `TUNNEL_TOKEN` diferente em outra região
- [ ] Versão do `cloudflared` fixada no compose (`2024.12.0`, não `latest`)
- [ ] Runbook inclui: procedimento de limpeza `cloudflared tunnel route ip delete`

Você substituiu um hábito frágil de `ngrok` por infraestrutura que você pode versionar, revisar e debugar. O tunnel agora é código. Trate-o como código.
