---
title: 'Backend NestJS de referência: auth pensada pra produtos de verdade'
date: '2026-08-10'
tags:
  - portfólio
  - nestjs
  - backend
  - typescript
  - auth
  - oauth
  - ldap
description: >-
  Como o template NestJS de referência trata login social, Active Directory,
  Argon2id e OAuth que se comporta bem no mobile — pra times que precisam de
  um ponto de partida sólido, não só uma demo que funciona com Google.
---


Se você está começando uma API NestJS e já sabe que autenticação vai ser mais do que "e-mail + senha + talvez Google", provavelmente já caiu na mesma armadilha: semanas ligando provedor OAuth, LDAP pro cliente corporativo, hash de senha que não vai te envergonhar depois, e deep link que quebra dentro do navegador mobile.


Esse é o público desta atualização do meu [backend NestJS de referência](/pt/posts/nestjs-reference-backend). O [post de julho](/pt/posts/nestjs-backend-six-months-later) focou em ops — Compose, Graylog, health checks, documentação ao lado do Swagger. Este foca em **auth que você liga sob demanda**: provedores de identidade social, Active Directory on-prem, hashing mais seguro e fluxos OAuth que se comportam bem no mobile.


Demo ao vivo: [nest.lacorte.dev](https://nest.lacorte.dev) · Visão do projeto: [/projects/nestjs-backend](/projects/nestjs-backend) · Código: [GitHub](https://github.com/mateuslacorte/nestjs-backend)


## Pra quem isso ajuda


O template pode ser útil se você:

- Precisa de um app **NestJS 11 pronto pra clonar** com REST e GraphQL já no Fastify
- Espera **mais de um login social** (produto, portal B2B, app de comunidade ou white-label)
- Tem stakeholder enterprise pedindo **Active Directory (LDAP/LDAPS)** e roles ligadas a security groups
- Entrega um cliente **mobile ou Expo** e precisa concluir OAuth sem gambiarra frágil de redirect
- Quer cada provedor documentado pra ligar e desligar recurso **sem engenharia reversa no repo**


Continua sendo uma referência. Apague o que não for usar. O objetivo é um padrão claro por provedor — não uma dependência permanente de todos os IdPs da lista.


## Login social como módulos opt-in


O template inclui strategies e rotas Passport pra provedores comuns, entre eles Google, Facebook, X/Twitter (PKCE), GitHub, Figma, LinkedIn, Slack, Atlassian, GitLab, Bitbucket, Discord, Twitch, Amazon, Patreon, Dropbox, Reddit, Apple (callback `form_post`), Steam OpenID e MetaMask SIWE.


Cada provedor costuma seguir o mesmo formato:

- Módulo de config e flags de env (por exemplo `GITHUB_AUTH_ENABLED`, client id/secret, callback URL, allowlist de redirect, roles padrão)
- Par strategy + guard
- Rotas `GET /auth/<provider>` e callback em `/api/v1`
- Campo de vínculo no user (`githubId`, `appleId`, …)
- Guia na wiki em [/auth/social](https://nest.lacorte.dev/auth/social)


Pra clientes mobile e SPA, `POST /auth/exchange` (`OauthExchangeService`) troca um código de curta duração por tokens — assim você não precisa enfiar JWT em deep link.


**Conselho prático:** ligue só os provedores que você vai configurar no ambiente. Strategies não usadas ficam fora do caminho quando a flag `*_AUTH_ENABLED` está desligada. Provedores que não valiam a manutenção saíram da árvore pra clones não herdarem código morto.


## Active Directory com mapeamento grupo → role


Piloto corporativo costuma começar com "dá pra logar com AD?" e depois pede roles alinhadas aos security groups que já existem. O template cobre esse caminho.


- Endpoint: `POST /auth/ad/login`
- Serviço: `ActiveDirectoryLdapService`
- Guias: [Active Directory](https://nest.lacorte.dev/auth/active-directory), além das páginas LDAP / LDAPS


No login, o serviço pode ler `memberOf`, mapear grupos pra roles da aplicação (`super`, `admin`, `manager`, `user`) via `AD_LDAP_GROUP_ROLE_MAP` e, opcionalmente, sincronizar essas roles a cada login AD bem-sucedido (`AD_LDAP_SYNC_ROLES_ON_LOGIN`).


```bash
# Exemplo — ajuste DNs e segredos ao seu diretório; isto não é política de produção
AD_LDAP_ENABLED=true
AD_LDAP_URL=ldaps://dc.example.com:636
AD_LDAP_BASE_DN=DC=example,DC=com
AD_LDAP_BIND_DN=CN=NestBind,OU=Service,DC=example,DC=com
AD_LDAP_BIND_PASSWORD=replace-me
AD_LDAP_DEFAULT_ROLES=user
AD_LDAP_GROUP_ROLE_MAP='CN=Nest-Admins,OU=Groups,DC=example,DC=com|admin;Nest-Managers|manager;Nest-Users|user'
AD_LDAP_SYNC_ROLES_ON_LOGIN=true
```


Se o mapa estiver vazio, usuários novos ainda recebem `AD_LDAP_DEFAULT_ROLES`. Se o mapa estiver errado, as roles ficam erradas — trate o mapeamento como configuração revisada com quem é dono do AD.


## Hash de senha com Argon2id


Contas locais usam **argon2id** via `password.util.ts`, com parâmetros de custo ajustáveis:


```ts
{
  memoryCost: parsePositiveInt(process.env.ARGON2_MEMORY_COST, 19456),
  timeCost: parsePositiveInt(process.env.ARGON2_TIME_COST, 2),
  parallelism: parsePositiveInt(process.env.ARGON2_PARALLELISM, 1),
}
```


`isPasswordHashed` reconhece encodings padrão de Argon2. Se você forkar o template em cima de uma tabela de users já em bcrypt, planeje uma migração — os defaults servem pra projeto do zero ou upgrade deliberado, não pra reescrever em silêncio todo hash armazenado.


## Fastify e redirects OAuth confiáveis


A stack HTTP roda em **Fastify** (`@nestjs/platform-fastify`), incluindo o driver Apollo GraphQL e o suporte a sessão necessário pro PKCE do Twitter (`@fastify/cookie`, `@fastify/session`, `@fastify/passport`).


Um modo comum de falha com Expo AuthSession e Chrome Custom Tabs é o redirect do cliente ganhar um `#` vazio no final. Em vez de depender só de um `302 Location` cru, o template conclui o hop do navegador com uma página HTML pequena que chama `location.replace()` numa URL limpa (`sendOAuthClientRedirect` / `stripTrailingEmptyHash`):


```ts
export function sendOAuthClientRedirect(
  reply: AppReply,
  redirectUrl: string,
): void {
  const cleanUrl = stripTrailingEmptyHash(redirectUrl);
  const html =
    `<!DOCTYPE html><html><head><meta charset="utf-8">` +
    `<meta http-equiv="refresh" content="0;url=${escapeHtmlAttribute(cleanUrl)}">` +
    `<script>window.location.replace(${JSON.stringify(cleanUrl)});</script>` +
    `</head><body></body></html>`;

  reply
    .status(200)
    .header('Content-Type', 'text/html; charset=utf-8')
    .header('Cache-Control', 'no-store')
    .send(html);
}
```


Esse detalhe importa se os primeiros usuários estão no celular, não no Postman.


## Documentação ao lado da API


Auth só é útil se a próxima pessoa conseguir configurar sem escavação no Slack. A wiki embutida cobre o índice social e os fluxos de AD em inglês e português brasileiro. O README está em inglês e aponta pros mesmos caminhos. O Swagger continua em [/swagger](https://nest.lacorte.dev/swagger) na mesma origem da documentação.


## Como começar


1. Visão geral: [nest.lacorte.dev](https://nest.lacorte.dev)
2. Guias de login social: [nest.lacorte.dev/auth/social](https://nest.lacorte.dev/auth/social)
3. Active Directory: [nest.lacorte.dev/auth/active-directory](https://nest.lacorte.dev/auth/active-directory)
4. API interativa: [nest.lacorte.dev/swagger](https://nest.lacorte.dev/swagger)
5. Página do produto neste site: [/projects/nestjs-backend](/projects/nestjs-backend)
6. Clone: [github.com/mateuslacorte/nestjs-backend](https://github.com/mateuslacorte/nestjs-backend)


Sobe a stack com Compose, confirma `/health`, liga os provedores de auth que precisa e remove o resto. O boilerplate existe pra você gastar tempo no produto — não pra reimplementar o mesmo OAuth e AD em cada Nest novo.
