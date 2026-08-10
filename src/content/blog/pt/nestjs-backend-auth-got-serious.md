---
title: 'Backend NestJS de referência: a auth ficou séria'
date: '2026-08-10'
tags:
  - portfolio
  - nestjs
  - backend
  - typescript
  - auth
  - oauth
  - ldap
description: >-
  Um roster completo de IdPs sociais, mapeamento de grupo AD → role, Argon2id,
  Fastify e um redirect OAuth sem hash sobrando — o que entrou desde o post de
  ops de julho.
---


Em [julho](/posts/nestjs-backend-six-months-later) eu me gabei do encanamento: Compose, Graylog, `/health`, uma wiki que mora ao lado do Swagger. Auth ganhou um parágrafo educado. Google e Facebook já estavam lá. Eu disse "e mais" com cara de brochure.


Aí as duas semanas e meia seguintes aconteceram.


Este não é outro post de "eu adicionei Docker". É a superfície de auth alcançando a pia completa — e depois apagando três IdPs que não mereciam ficar.


## O Que Entrou


Entre 24 de julho e 10 de agosto:

- **Login social foi de dois provedores para um roster inteiro** (depois um roster um pouco menor e mais honesto)
- **Active Directory LDAP/LDAPS** com mapeamento real de **grupo → role** no login
- **Argon2id** no lugar de bcrypt para hash de senha
- **Express → Fastify** (sim, dez dias depois de eu escrever sobre um driver Apollo Express customizado — a comédia se escreve sozinha)
- Conclusão OAuth que sobrevive a **Chrome Custom Tabs** sem um `#` sobrando no final
- MetaMask SIWE, Steam OpenID, Apple `form_post`, e um **exchange code** de uso único para clientes mobile/web
- Páginas de wiki por provedor (EN + pt-BR) e um README em inglês alinhado com a realidade


Se você só quer a demo: [nest.lacorte.dev](https://nest.lacorte.dev). Página do projeto neste site: [/projects/nestjs-backend](/projects/nestjs-backend). Código: [GitHub](https://github.com/mateuslacorte/nestjs-backend).


## Login Social: Adiciona Tudo, Depois Edita


Linha do tempo sem verniz de marketing:

1. **24 jul** — OAuth2 do X / Twitter com PKCE (`TwitterStrategy`, `GET /auth/twitter`)
2. **27 jul** — o big bang: GitHub, Figma, LinkedIn, Slack, Atlassian, GitLab, Bitbucket, Discord, Twitch, Amazon, Patreon, Dropbox, Reddit, Apple, Steam, MetaMask, mais AD LDAP, mais alguns IdPs que não sobreviveram
3. **9 ago** — Spotify removido. No mesmo dia: Microsoft e Coinbase removidos. Apple endurecido (`PassportStrategy(..., 6)` + `response_mode: form_post` forçado)


O que resta no HEAD é chato de propósito: Google, Facebook, X/Twitter, GitHub, Figma, LinkedIn, Slack, Atlassian, GitLab, Bitbucket, Discord, Twitch, Amazon, Patreon, Dropbox, Reddit, Apple, Steam OpenID, MetaMask SIWE — cada um com `GET /auth/<provider>` (+ callback `POST` da Apple), par strategy/guard do Passport, campos de vínculo no user (`githubId`, `metamaskId`, …) e página na wiki em `/auth/social/...`.


Spotify, Microsoft e Coinbase saíram da árvore. Os commits não narram uma tese de produto. Eu não vou inventar uma. Template que mantém strategy morta "por completude" mente para a próxima pessoa que clonar.


Linha de chegada compartilhada mobile/web: `POST /auth/exchange` via `OauthExchangeService` — troca um código de curta duração por tokens sem enfiar JWT em deep link.


## Active Directory Que Mapeia Grupos


O login AD entrou na leva de 27 de julho como bind + search: `POST /auth/ad/login`, `ActiveDirectoryLdapService`, guias em [/auth/active-directory](https://nest.lacorte.dev/auth/active-directory).


O que ele *não* fazia até 10 de agosto: ligar para `memberOf`.


Usuários novos ganhavam `AD_LDAP_DEFAULT_ROLES` plano. Re-logins não atualizavam roles a partir de security groups. Atributos LDAP multi-valorados eram, na prática, só o primeiro valor. Serve para demo de bind. Inútil se o seu mundo de GPO acha que Nest-Admins significa `admin`.


A correção mora em `ad-ldap-group-role-map.util.ts` e no `AuthService`:

- Buscar `memberOf` em `groups: string[]`
- Parsear `AD_LDAP_GROUP_ROLE_MAP` como `groupKey|role;…` (DN completo ou CN → `super|admin|manager|user`)
- Resolver roles na criação; opcionalmente **sincronizar a cada login AD** quando o mapa está definido e `AD_LDAP_SYNC_ROLES_ON_LOGIN` é true


```bash
# .env — esboço, não política de produção cole-e-reze
AD_LDAP_ENABLED=true
AD_LDAP_URL=ldaps://dc.example.com:636
AD_LDAP_BASE_DN=DC=example,DC=com
AD_LDAP_BIND_DN=CN=NestBind,OU=Service,DC=example,DC=com
AD_LDAP_BIND_PASSWORD=replace-me
AD_LDAP_DEFAULT_ROLES=user
AD_LDAP_GROUP_ROLE_MAP='CN=Nest-Admins,OU=Groups,DC=example,DC=com|admin;Nest-Managers|manager;Nest-Users|user'
AD_LDAP_SYNC_ROLES_ON_LOGIN=true
```


Cobertura unitária veio em `ad-ldap-group-role-map.util.spec.ts` e nos casos de AD em `auth.service.spec.ts`. Se o mapa estiver vazio, você ainda recebe defaults. Se estiver errado, recebe roles erradas — LDAP não perdoa typo.


## Senhas: Argon2id


No dia do Twitter também saiu o `bcrypt.config.ts` e entraram `password.util.ts` / `argon2.config.ts`. O hash é **argon2id** com knobs de env:


```ts
// resolveArgon2Options — defaults iguais ao template
{
  memoryCost: parsePositiveInt(process.env.ARGON2_MEMORY_COST, 19456),
  timeCost: parsePositiveInt(process.env.ARGON2_TIME_COST, 2),
  parallelism: parsePositiveInt(process.env.ARGON2_PARALLELISM, 1),
}
```


`isPasswordHashed` reconhece `$argon2id$` / `$argon2i$` / `$argon2d$`. Migre com cuidado se o seu fork já tem hashes bcrypt — o template é ponto de partida, não upgrade grátis para toda tabela de users em produção.


## Fastify, e o Hash Sobressalente do Inferno


O post de julho mencionou um driver Apollo **Express** customizado. Em 3 de agosto o adapter HTTP foi para **Fastify** (`@nestjs/platform-fastify`, driver Apollo Fastify, `@fastify/cookie` + `@fastify/session` + `@fastify/passport` para PKCE do Twitter).


Não foi estética. Callbacks OAuth para Expo AuthSession / Chrome Custom Tabs voltavam com um `#` vazio no redirect do cliente. Um `302 Location` nu ficava reanexando lixo. `sendOAuthClientRedirect` agora devolve HTML + `location.replace()` (e meta refresh) com a URL limpa por `stripTrailingEmptyHash`:


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


HTML chato. Deep links corretos. Testes em `oauth-client-redirect.spec.ts` cobrem URLs relativas, hashes de verdade e edge cases com `%`.


## Docs Que Admitem o Roster


Cada provedor ganhou página na wiki. AD ganhou guias LDAP e LDAPS. O README passou de português para inglês para a landing do GitHub bater com a wiki bilíngue em vez de contradizê-la.


Comece em [auth social](https://nest.lacorte.dev/auth/social) ou [AD](https://nest.lacorte.dev/auth/active-directory). O Swagger continua em [/swagger](https://nest.lacorte.dev/swagger).


## Experimente


1. Docs: [https://nest.lacorte.dev](https://nest.lacorte.dev)
2. Índice social: [https://nest.lacorte.dev/auth/social](https://nest.lacorte.dev/auth/social)
3. Guia AD: [https://nest.lacorte.dev/auth/active-directory](https://nest.lacorte.dev/auth/active-directory)
4. Swagger: [https://nest.lacorte.dev/swagger](https://nest.lacorte.dev/swagger)
5. Página do projeto: [/projects/nestjs-backend](/projects/nestjs-backend)
6. Repo: [github.com/mateuslacorte/nestjs-backend](https://github.com/mateuslacorte/nestjs-backend)


Janeiro foi a pia. Julho foi o encanamento. Agosto é "para de entregar um módulo de auth que só funciona para demo do Google e uma string de role default."


Ligue só os provedores que você vai configurar. Deixe o resto desligado. Esse é o ponto inteiro de uma referência: mostrar o padrão e deixar você apagar metade sem mentir sobre o que sobrou.
