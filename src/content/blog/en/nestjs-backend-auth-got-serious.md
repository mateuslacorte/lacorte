---
title: 'NestJS Reference Backend: Auth Got Serious'
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
  A full social IdP roster, AD group→role mapping, Argon2id, Fastify, and an
  OAuth redirect that stops trailing hashes — what landed since the July ops post.
---


In [July](/posts/nestjs-backend-six-months-later) I bragged about plumbing: Compose, Graylog, `/health`, a wiki that lives next to Swagger. Auth got a polite paragraph. Google and Facebook were already there. I said "and more" like a brochure.


Then the next two and a half weeks happened.


This is not another "I added Docker" post. This is the auth surface catching up with the kitchen sink — and then deleting three IdPs that did not earn their keep.


## What Landed


Between 24 July and 10 August:

- **Social login went from two providers to a full roster** (then a slightly smaller honest roster)
- **Active Directory LDAP/LDAPS** with real **group → role** mapping on login
- **Argon2id** instead of bcrypt for password hashing
- **Express → Fastify** (yes, ten days after I wrote about a custom Express Apollo driver — comedy writes itself)
- OAuth completion that survives **Chrome Custom Tabs** without a trailing `#`
- MetaMask SIWE, Steam OpenID, Apple `form_post`, and a one-time **exchange code** for mobile/web clients
- Per-provider wiki pages (EN + pt-BR) and an English README that matches reality


If you only want the demo: [nest.lacorte.dev](https://nest.lacorte.dev). Project page on this site: [/projects/nestjs-backend](/projects/nestjs-backend). Code: [GitHub](https://github.com/mateuslacorte/nestjs-backend).


## Social Login: Add Everything, Then Edit


Timeline without the marketing gloss:

1. **24 Jul** — X / Twitter OAuth2 with PKCE (`TwitterStrategy`, `GET /auth/twitter`)
2. **27 Jul** — the big bang: GitHub, Figma, LinkedIn, Slack, Atlassian, GitLab, Bitbucket, Discord, Twitch, Amazon, Patreon, Dropbox, Reddit, Apple, Steam, MetaMask, plus AD LDAP, plus a few IdPs that did not survive
3. **9 Aug** — Spotify removed. Same day: Microsoft and Coinbase removed. Apple hardened (`PassportStrategy(..., 6)` + forced `response_mode: form_post`)


What remains at HEAD is boring on purpose: Google, Facebook, X/Twitter, GitHub, Figma, LinkedIn, Slack, Atlassian, GitLab, Bitbucket, Discord, Twitch, Amazon, Patreon, Dropbox, Reddit, Apple, Steam OpenID, MetaMask SIWE — each with `GET /auth/<provider>` (+ Apple's `POST` callback), a Passport strategy/guard pair, user link fields (`githubId`, `metamaskId`, …), and a wiki page under `/auth/social/...`.


Spotify, Microsoft, and Coinbase left the tree. The commits do not narrate a product thesis. I am not inventing one. Templates that keep dead strategies "for completeness" lie to the next person who clones them.


Shared mobile/web finish line: `POST /auth/exchange` via `OauthExchangeService` — swap a short-lived code for tokens without stuffing JWTs into a deep link.


## Active Directory That Maps Groups


AD login shipped in the July 27 wave as bind + search: `POST /auth/ad/login`, `ActiveDirectoryLdapService`, guides at [/auth/active-directory](https://nest.lacorte.dev/auth/active-directory).


What it did *not* do until 10 August: care about `memberOf`.


New users got flat `AD_LDAP_DEFAULT_ROLES`. Re-logins did not refresh roles from security groups. Multi-valued LDAP attributes were effectively first-value-only. Fine for a demo bind. Useless if your GPO world thinks Nest-Admins means `admin`.


The fix lives in `ad-ldap-group-role-map.util.ts` and `AuthService`:

- Fetch `memberOf` into `groups: string[]`
- Parse `AD_LDAP_GROUP_ROLE_MAP` as `groupKey|role;…` (full DN or CN → `super|admin|manager|user`)
- Resolve roles on create; optionally **sync on every AD login** when the map is set and `AD_LDAP_SYNC_ROLES_ON_LOGIN` is true


```bash
# .env — sketch, not a paste-and-pray production policy
AD_LDAP_ENABLED=true
AD_LDAP_URL=ldaps://dc.example.com:636
AD_LDAP_BASE_DN=DC=example,DC=com
AD_LDAP_BIND_DN=CN=NestBind,OU=Service,DC=example,DC=com
AD_LDAP_BIND_PASSWORD=replace-me
AD_LDAP_DEFAULT_ROLES=user
AD_LDAP_GROUP_ROLE_MAP='CN=Nest-Admins,OU=Groups,DC=example,DC=com|admin;Nest-Managers|manager;Nest-Users|user'
AD_LDAP_SYNC_ROLES_ON_LOGIN=true
```


Unit coverage followed in `ad-ldap-group-role-map.util.spec.ts` and AD cases in `auth.service.spec.ts`. If your map is empty, you still get defaults. If it is wrong, you get wrong roles — LDAP does not forgive typos.


## Passwords: Argon2id


Twitter day also deleted `bcrypt.config.ts` and added `password.util.ts` / `argon2.config.ts`. Hashing is **argon2id** with env knobs:


```ts
// resolveArgon2Options — defaults match the template
{
  memoryCost: parsePositiveInt(process.env.ARGON2_MEMORY_COST, 19456),
  timeCost: parsePositiveInt(process.env.ARGON2_TIME_COST, 2),
  parallelism: parsePositiveInt(process.env.ARGON2_PARALLELISM, 1),
}
```


`isPasswordHashed` recognizes `$argon2id$` / `$argon2i$` / `$argon2d$`. Migrate carefully if you already have bcrypt hashes in a fork — the template is a starting point, not a free upgrade path for every deployed user table.


## Fastify, and the Trailing Hash From Hell


The July post mentioned a custom **Express** Apollo driver. On 3 August the HTTP adapter moved to **Fastify** (`@nestjs/platform-fastify`, Fastify Apollo driver, `@fastify/cookie` + `@fastify/session` + `@fastify/passport` for Twitter PKCE).


That was not aesthetic. OAuth callbacks into Expo AuthSession / Chrome Custom Tabs were coming back with a trailing empty `#` on the client redirect. A bare `302 Location` kept re-attaching garbage. `sendOAuthClientRedirect` now returns HTML + `location.replace()` (and a meta refresh) with the URL scrubbed by `stripTrailingEmptyHash`:


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


Boring HTML. Correct deep links. Tests in `oauth-client-redirect.spec.ts` cover relative URLs, real hashes, and `%` edge cases.


## Docs That Admit the Roster


Each provider got a wiki page. AD got LDAP and LDAPS guides. The README flipped from Portuguese to English so the GitHub landing page matches the bilingual wiki instead of contradicting it.


Start at [auth social](https://nest.lacorte.dev/auth/social) or [AD](https://nest.lacorte.dev/auth/active-directory). Swagger still sits at [/swagger](https://nest.lacorte.dev/swagger).


## Try It


1. Docs: [https://nest.lacorte.dev](https://nest.lacorte.dev)
2. Social index: [https://nest.lacorte.dev/auth/social](https://nest.lacorte.dev/auth/social)
3. AD guide: [https://nest.lacorte.dev/auth/active-directory](https://nest.lacorte.dev/auth/active-directory)
4. Swagger: [https://nest.lacorte.dev/swagger](https://nest.lacorte.dev/swagger)
5. Project page: [/projects/nestjs-backend](/projects/nestjs-backend)
6. Repo: [github.com/mateuslacorte/nestjs-backend](https://github.com/mateuslacorte/nestjs-backend)


January was the kitchen sink. July was plumbing. August is "please stop shipping an auth module that only works for Google demos and a default role string."


Enable only the providers you will configure. Leave the rest off. That is the whole point of a reference: show the pattern, then let you delete half of it without lying about what is left.
