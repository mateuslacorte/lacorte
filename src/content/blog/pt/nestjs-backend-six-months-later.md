---
title: 'Backend de Referência NestJS, Seis Meses Depois'
date: '2026-07-23'
tags:
  - portfólio
  - nestjs
  - backend
  - typescript
  - docker
  - observabilidade
description: >-
  Docker Compose, Graylog, health checks, documentação bilíngue, e
  repositórios prontos para CQRS — o que mudou no meu backend de referência
  NestJS desde janeiro.
---


Lá em janeiro eu escrevi sobre meu [backend de referência NestJS](/pt/posts/nestjs-reference-backend). Eu chamei ele de pronto para produção. E eu quis dizer isso. Na maior parte.


Aí eu tentei tratar ele como algo que você realmente colocaria em produção: um comando para subir toda a stack, logs que não estivessem colados numa conta SaaS, um endpoint de saúde que o Docker pudesse cutucar, documentação que morasse ao lado da API em vez de apodrecer num README. Acontece que "referência" e "eu consigo entregar isso sem xingar" são barras ligeiramente diferentes.


Então passei alguns dias de julho consertando isso. Nenhuma funcionalidade de negócio nova e brilhante. Só as coisas chatas que fazem um template ser honesto.


## O Que Mudou


A atualização de julho é quase inteiramente **operações, documentação e blindagem**:

- Stack completa de Docker Compose em vez de "se vira sozinho"
- Logtail fora, Graylog dentro
- Um endpoint `/health` de verdade
- NestJS 11 e Apollo Server 5
- Uma wiki bilíngue que não é um pensamento tardio
- Polimento de segurança e autenticação
- A implementação de CQRS mal feita, deletada — **pronto para CQRS** deixado de propósito


Se você veio aqui procurando um módulo de WhatsApp novinho em folha: desculpa. Isso já existia. Esse post é sobre fazer a coisa que já existia parar de mentir que estava pronta.


## Stack com Um Comando Só


Antes, "rodar o projeto" significava: instalar metade da internet, subir Postgres, Mongo, Redis, MinIO, Kafka, e rezar. Charmoso para um fim de semana. Terrível para uma referência.


Agora existe um **Dockerfile** multi-stage (Node 22, dependências nativas para canvas/bcrypt, healthcheck conectado ao `/health`) e um arquivo Compose que sobe:

- **API** — o próprio app Nest
- **PostgreSQL** e **MongoDB** — porque persistência dupla é o ponto central
- **Redis** — cache
- **MinIO** — armazenamento no formato S3
- **Kafka** (+ UI) — eventos sem inventar um message bus do zero
- **MailHog** — SMTP falso para que resets de senha não escapem para caixas de entrada de produção
- **OpenSearch + Graylog** — logs que você realmente consegue abrir num navegador


Uma linha, mais ou menos: `docker compose --env-file .env.docker up -d --build`. Depois disso você pode parar de explicar seu setup local no Slack.


Tem um passo a passo de instalação na wiki ao vivo: [Clique aqui para ver](https://nestjs.lacorte.dev/backend/install).


## Logtail Fora, Graylog Dentro


O post de janeiro listava com orgulho o **Logtail**. Bonitinho. Só que: mais uma conta, mais uma fatura, mais um motivo para um clone do template depender silenciosamente de um fornecedor que você talvez não queira.


Troquei por **Graylog** via GELF, sentado ao lado do OpenSearch no Compose. Tem um pequeno módulo Graylog com um logger, um interceptor, um filtro de exceção, e um decorator `@NoLog()` para endpoints que não deveriam poluir seu stream (tô olhando pra você, health checks).


O Graylog é glamouroso? Não. Ele é self-hosted e está sentado no mesmo `docker compose` que tudo o resto? Sim. Para um backend de referência, isso importa mais do que um dashboard SaaS bonito.


## Saúde Como Contrato


"Está no ar?" costumava significar "o processo está rodando, por favor não pergunte sobre o Kafka."


Agora existe um **`GET /health`** com Terminus por trás que checa Postgres, Mongo, Redis, Kafka, e heap de memória. É público, está marcado com `@NoLog()`, e o `HEALTHCHECK` da imagem Docker bate nele. Chato. Correto. Exatamente o que você quer quando o Compose está decidindo se seu container de API é realmente útil.


Ao vivo: [Confira o exemplo de health](https://nestjs.lacorte.dev/health).


## Documentação Que Mora Junto com a API


O Swagger já estava lá. A wiki estava... presente. Chamar aquilo de documentação era generoso.


A leva de julho transformou a wiki em algo que eu realmente enviaria para alguém:

- **Bilíngue** — en-US e pt-BR
- **SEO / Open Graph** — `APP_URL` apontando para o host de demonstração real
- Páginas de arquitetura, instalação, autenticação, e-mail, WhatsApp, WebSocket, segurança
- Favicons, `robots.txt`, um web manifest — as pequenas coisas que fazem parecer um site de verdade, e não uma pasta Pug esquecida


A demonstração vive em **[nestjs.lacorte.dev](https://nestjs.lacorte.dev)**. A API interativa está em **[nestjs.lacorte.dev/swagger](https://nestjs.lacorte.dev/swagger)**. Mesma origem que a documentação. Nada de "a documentação está aqui, a API está em algum outro lugar, boa sorte."


O GraphQL ainda está em `/graphql` se essa for a sua religião. A maioria das pessoas mexendo no exemplo vai começar pelo Swagger. E tudo bem.


## CQRS: Pronto, Não Fingindo


Hora da confissão: eu tinha uma implementação de CQRS nesse projeto. Era ruim. Não "precisa de um refactor" ruim — "isso está ensinando as pessoas o formato errado" ruim. Então eu arranquei tudo.


O que ficou é intencional e bem menos dramático: **pronto para CQRS**.


Cada domínio pode manter repositórios duplos (Postgres via TypeORM, Mongo via Mongoose). Os serviços injetam o que precisam. Postgres é o armazenamento ativo por padrão; os repositórios Mongo ficam esperando para quando você realmente quiser uma separação de comando/consulta, opcionalmente sincronizados via Kafka. Não existe um bus de comandos falso fingindo ser cosplay de DDD.


Prefiro entregar um template que diz "é assim que você iria para CQRS" do que um que afirma já estar lá e depois faz você duvidar de si mesmo por três dias. A página de arquitetura explica tudo: [Confira aqui](https://nestjs.lacorte.dev/architecture).


## Itens de Blindagem


Algumas mudanças menores que não merecem seu próprio manifesto, mas que me irritariam se estivessem faltando:

- **Jitter no TTL do JWT** — para que nem todo token da frota expire no mesmo milissegundo e cause uma estampida de refresh
- **Captura de rotas inválidas** — caminhos desconhecidos podem alimentar o bloqueio de IP; wiki, GraphQL, e `/health` ficam excluídos para que o tráfego de documentação não pareça um ataque
- **NestJS 11 + Apollo Server 5** — com um driver Apollo customizado para Express em vez de arrastar o `@nestjs/apollo` junto
- **Exemplos mais ricos no Swagger** — porque "string" como todo exemplo não ajuda ninguém


A segurança ainda tem a superfície de admin de papel SUPER para IPs bloqueados/suspeitos. Detalhes [aqui](https://nestjs.lacorte.dev/security).


## Experimente


Se você quiser o tour rápido:

1. Documentação: [https://nestjs.lacorte.dev](https://nestjs.lacorte.dev)
2. Exemplo de API (Swagger): [https://nestjs.lacorte.dev/swagger](https://nestjs.lacorte.dev/swagger)
3. Health: [https://nestjs.lacorte.dev/health](https://nestjs.lacorte.dev/health)
4. Arquitetura / pronto para CQRS: [https://nestjs.lacorte.dev/architecture](https://nestjs.lacorte.dev/architecture)


O post de janeiro era "aqui está um template Nest com pia de cozinha incluída." Esse aqui é "aqui está a mesma pia de cozinha, mas o encanamento realmente escoa."


Se você quiser o código (ou quiser me julgar pela remoção do CQRS), está no [GitHub](https://github.com/mateuslacorte/nestjs-backend). Não me marca se o Graylog comer todo o seu disco — isso é entre você e seus volumes montados.
