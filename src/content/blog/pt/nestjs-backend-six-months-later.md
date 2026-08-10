---
title: 'Backend NestJS de referência, seis meses depois'
date: '2026-07-23'
tags:
  - portfólio
  - nestjs
  - backend
  - typescript
  - docker
  - observabilidade
description: >-
  Docker Compose, Graylog, health checks, documentação bilíngue e
  repositórios prontos pra CQRS — o que mudou no meu backend NestJS de
  referência desde janeiro.
---


Lá em janeiro eu escrevi sobre meu [backend NestJS de referência](/pt/posts/nestjs-reference-backend). Chamei de pronto pra produção. E eu quis dizer isso. Na maior parte.


Aí tentei tratar ele como coisa que você de fato colocaria no ar: um comando pra subir a stack inteira, logs que não dependessem de conta SaaS, um endpoint de saúde que o Docker pudesse cutucar, documentação morando ao lado da API em vez de apodrecer num README. Acontece que "referência" e "eu consigo entregar isso sem xingar" são barras um pouco diferentes.


Então passei uns dias de julho consertando isso. Nenhuma feature de negócio nova e brilhante. Só as coisas chatas que fazem um template ser honesto.


## O que mudou


A atualização de julho é quase toda **ops, documentação e endurecimento**:

- Stack completa de Docker Compose em vez de "se vira"
- Logtail fora, Graylog dentro
- Um endpoint `/health` de verdade
- NestJS 11 e Apollo Server 5
- Uma wiki bilíngue que não é pensamento de última hora
- Polimento de segurança e autenticação
- A implementação de CQRS mal feita, deletada — **pronto pra CQRS** deixado de propósito


Se você veio atrás de um módulo de WhatsApp novinho: desculpa. Isso já existia. Esse post é sobre fazer a coisa que já existia parar de mentir que estava pronta.


## Stack com um comando só


Antes, "rodar o projeto" significava: instalar metade da internet, subir Postgres, Mongo, Redis, MinIO, Kafka, e rezar. Charmoso pra um fim de semana. Terrível pra uma referência.


Agora tem um **Dockerfile** multi-stage (Node 22, dependências nativas pra canvas/bcrypt, healthcheck ligado no `/health`) e um Compose que sobe:

- **API** — o app Nest em si
- **PostgreSQL** e **MongoDB** — porque persistência dupla é o ponto
- **Redis** — cache
- **MinIO** — storage no formato S3
- **Kafka** (+ UI) — eventos sem inventar message bus do zero
- **MailHog** — SMTP falso pra reset de senha não vazar pra caixa de produção
- **OpenSearch + Graylog** — logs que você realmente abre no navegador


Uma linha, mais ou menos: `docker compose --env-file .env.docker up -d --build`. Depois disso você para de explicar o setup local no Slack.


Tem um passo a passo de instalação na wiki ao vivo: [Clique aqui para ver](https://nest.lacorte.dev/backend/install).


## Logtail fora, Graylog dentro


O post de janeiro listava com orgulho o **Logtail**. Bonitinho. Só que: mais uma conta, mais uma fatura, mais um motivo pra um clone do template depender em silêncio de um fornecedor que você talvez não queira.


Troquei por **Graylog** via GELF, sentado ao lado do OpenSearch no Compose. Tem um módulozinho Graylog com logger, interceptor, filtro de exceção e um decorator `@NoLog()` pra endpoints que não deveriam encher o stream (tô de olho em você, health check).


O Graylog é glamouroso? Não. Ele é self-hosted e está no mesmo `docker compose` que o resto? Sim. Pra um backend de referência, isso importa mais do que um dashboard SaaS bonito.


## Saúde como contrato


"Está no ar?" costumava significar "o processo tá rodando, por favor não pergunte do Kafka."


Agora tem um **`GET /health`** com Terminus por trás que checa Postgres, Mongo, Redis, Kafka e heap de memória. É público, marcado com `@NoLog()`, e o `HEALTHCHECK` da imagem Docker bate nele. Chato. Correto. Exatamente o que você quer quando o Compose está decidindo se o container da API é de fato útil.


Ao vivo: [Confira o exemplo de health](https://nest.lacorte.dev/health).


## Documentação que mora junto com a API


O Swagger já estava lá. A wiki estava… presente. Chamar aquilo de documentação era generoso.


A leva de julho transformou a wiki em algo que eu realmente mandaria pra alguém:

- **Bilíngue** — en-US e pt-BR
- **SEO / Open Graph** — `APP_URL` apontando pro host de demo real
- Páginas de arquitetura, instalação, autenticação, e-mail, WhatsApp, WebSocket, segurança
- Favicons, `robots.txt`, um web manifest — as miudezas que fazem parecer site de verdade, e não pasta Pug esquecida


A demo vive em **[nestjs.lacorte.dev](https://nest.lacorte.dev)**. A API interativa está em **[nestjs.lacorte.dev/swagger](https://nest.lacorte.dev/swagger)**. Mesma origem que a documentação. Nada de "a doc tá aqui, a API tá em outro lugar, boa sorte."


O GraphQL ainda está em `/graphql` se essa for a sua religião. A maioria das pessoas mexendo no exemplo vai começar pelo Swagger. E tudo bem.


## CQRS: pronto, não fingindo


Hora da confissão: eu tinha uma implementação de CQRS nesse projeto. Era ruim. Não "precisa de um refactor" ruim — "isso tá ensinando o formato errado" ruim. Então eu arranquei tudo.


O que ficou é intencional e bem menos dramático: **pronto pra CQRS**.


Cada domínio pode manter repositórios duplos (Postgres via TypeORM, Mongo via Mongoose). Os serviços injetam o que precisam. Postgres é o storage ativo por padrão; os repos Mongo ficam esperando pra quando você de fato quiser separar comando/consulta, opcionalmente sincronizados via Kafka. Não existe um bus de comando falso fazendo cosplay de DDD.


Prefiro entregar um template que diz "é assim que você iria pra CQRS" do que um que afirma já estar lá e depois te faz duvidar de si mesmo por três dias. A página de arquitetura explica tudo: [Confira aqui](https://nest.lacorte.dev/architecture).


## Endurecimento


Algumas mudanças menores que não merecem manifesto próprio, mas que me irritariam se faltassem:

- **Jitter no TTL do JWT** — pra nem todo token da frota expirar no mesmo milissegundo e causar estouro de refresh
- **Captura de rotas inválidas** — caminhos desconhecidos podem alimentar o bloqueio de IP; wiki, GraphQL e `/health` ficam de fora pra tráfego de documentação não parecer ataque
- **NestJS 11 + Apollo Server 5** — com driver Apollo customizado pra Express, em vez de arrastar o `@nestjs/apollo` junto
- **Exemplos mais ricos no Swagger** — porque "string" como todo exemplo não ajuda ninguém


A segurança ainda tem o painel de admin com role SUPER pra IPs bloqueados/suspeitos. Detalhes [aqui](https://nest.lacorte.dev/security).


## Experimente


Se quiser o tour rápido:

1. Documentação: [https://nestjs.lacorte.dev](https://nest.lacorte.dev)
2. Exemplo de API (Swagger): [https://nestjs.lacorte.dev/swagger](https://nest.lacorte.dev/swagger)
3. Health: [https://nestjs.lacorte.dev/health](https://nest.lacorte.dev/health)
4. Arquitetura / pronto pra CQRS: [https://nestjs.lacorte.dev/architecture](https://nest.lacorte.dev/architecture)


O post de janeiro era "aqui tem um template Nest com tudo dentro." Esse aqui é "aqui está o mesmo monstro, só que o setup local e os logs finalmente fazem o que prometem."


Se quiser o código (ou quiser me julgar pela remoção do CQRS), está no [GitHub](https://github.com/mateuslacorte/nestjs-backend). Não me marca se o Graylog comer todo o seu disco — isso é entre você e seus volumes montados.
