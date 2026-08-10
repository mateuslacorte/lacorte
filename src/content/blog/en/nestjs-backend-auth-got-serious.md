---
title: 'NestJS Reference Backend: Auth Built for Real Products'
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
  How the NestJS reference template handles social login, Active Directory,
  Argon2id, and mobile-friendly OAuth — for teams who need a solid starting
  point, not another demo that only supports Google.
---


If you are starting a NestJS API and know authentication will be more than “email + password + maybe Google,” you have probably felt the same trap: weeks spent wiring OAuth providers, LDAP for the corporate client, password hashing that will not embarrass you later, and deep links that break inside mobile browsers.


That is the audience for this update to my [NestJS reference backend](/posts/nestjs-reference-backend). The [July post](/posts/nestjs-backend-six-months-later) focused on ops — Compose, Graylog, health checks, docs next to Swagger. This one focuses on **auth you can enable selectively**: social identity providers, on-prem Active Directory, safer password hashing, and OAuth flows that behave on mobile.


Live demo: [nest.lacorte.dev](https://nest.lacorte.dev) · Project overview: [/projects/nestjs-backend](/projects/nestjs-backend) · Source: [GitHub](https://github.com/mateuslacorte/nestjs-backend)


## Who This Helps


You may find the template useful if you:

- Need a **clone-ready NestJS 11** app with REST and GraphQL already on Fastify
- Expect **more than one social login** (product, B2B portal, community app, or white-label)
- Have an enterprise stakeholder who asks for **Active Directory (LDAP/LDAPS)** and roles tied to security groups
- Ship a **mobile or Expo** client and need OAuth completion without fragile redirect hacks
- Want each provider documented so you can turn features **on or off** without reverse-engineering the repo


It is still a reference. You should delete what you do not use. The goal is a clear pattern per provider — not a permanent dependency on every IdP in the list.


## Social Login as Opt-In Modules


The template includes Passport strategies and routes for common providers, including Google, Facebook, X/Twitter (PKCE), GitHub, Figma, LinkedIn, Slack, Atlassian, GitLab, Bitbucket, Discord, Twitch, Amazon, Patreon, Dropbox, Reddit, Apple (`form_post` callback), Steam OpenID, and MetaMask SIWE.


Each provider typically follows the same shape:

- Config module and env flags (for example `GITHUB_AUTH_ENABLED`, client id/secret, callback URL, redirect allowlist, default roles)
- Strategy + guard pair
- `GET /auth/<provider>` and callback routes under `/api/v1`
- A user link field (`githubId`, `appleId`, …)
- A wiki guide under [/auth/social](https://nest.lacorte.dev/auth/social)


For mobile and SPA clients, `POST /auth/exchange` (`OauthExchangeService`) trades a short-lived exchange code for tokens so you do not have to put JWTs in deep links.


**Practical advice:** enable only the providers you will configure in your environment. Unused strategies stay out of the path when their `*_AUTH_ENABLED` flag is off. Providers that were not worth maintaining were removed from the tree so clones do not inherit dead code.


## Active Directory With Group → Role Mapping


Corporate pilots often start with “can we log in with AD?” and then ask for roles that match existing security groups. The template supports that path.


- Endpoint: `POST /auth/ad/login`
- Service: `ActiveDirectoryLdapService`
- Guides: [Active Directory](https://nest.lacorte.dev/auth/active-directory), plus LDAP / LDAPS pages


On login, the service can read `memberOf`, map groups to application roles (`super`, `admin`, `manager`, `user`) via `AD_LDAP_GROUP_ROLE_MAP`, and optionally sync those roles on every successful AD login (`AD_LDAP_SYNC_ROLES_ON_LOGIN`).


```bash
# Example — adjust DNs and secrets for your directory; this is not a production policy
AD_LDAP_ENABLED=true
AD_LDAP_URL=ldaps://dc.example.com:636
AD_LDAP_BASE_DN=DC=example,DC=com
AD_LDAP_BIND_DN=CN=NestBind,OU=Service,DC=example,DC=com
AD_LDAP_BIND_PASSWORD=replace-me
AD_LDAP_DEFAULT_ROLES=user
AD_LDAP_GROUP_ROLE_MAP='CN=Nest-Admins,OU=Groups,DC=example,DC=com|admin;Nest-Managers|manager;Nest-Users|user'
AD_LDAP_SYNC_ROLES_ON_LOGIN=true
```


If the map is empty, new users still receive `AD_LDAP_DEFAULT_ROLES`. If the map is wrong, roles will be wrong — treat the mapping as configuration you review with whoever owns AD.


## Password Hashing With Argon2id


Local accounts use **argon2id** through `password.util.ts`, with tunable cost parameters:


```ts
{
  memoryCost: parsePositiveInt(process.env.ARGON2_MEMORY_COST, 19456),
  timeCost: parsePositiveInt(process.env.ARGON2_TIME_COST, 2),
  parallelism: parsePositiveInt(process.env.ARGON2_PARALLELISM, 1),
}
```


`isPasswordHashed` recognizes standard Argon2 encodings. If you fork the template onto an existing bcrypt user table, plan a migration — the defaults are for greenfield or deliberate upgrades, not a silent rewrite of every stored hash.


## Fastify and Reliable OAuth Redirects


The HTTP stack runs on **Fastify** (`@nestjs/platform-fastify`), including the Apollo GraphQL driver and session support needed for Twitter PKCE (`@fastify/cookie`, `@fastify/session`, `@fastify/passport`).


A common failure mode with Expo AuthSession and Chrome Custom Tabs is a client redirect that picks up a trailing empty `#`. Instead of relying only on a raw `302 Location`, the template finishes the browser hop with a small HTML page that calls `location.replace()` on a cleaned URL (`sendOAuthClientRedirect` / `stripTrailingEmptyHash`):


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


That detail matters if your first users are on phones, not Postman.


## Documentation Next to the API


Auth is only useful if the next engineer can configure it without a Slack archaeology session. The built-in wiki covers the social index and AD flows in English and Brazilian Portuguese. The README is in English and points at the same paths. Swagger remains at [/swagger](https://nest.lacorte.dev/swagger) on the same origin as the docs.


## Getting Started


1. Browse the overview: [nest.lacorte.dev](https://nest.lacorte.dev)
2. Social login guides: [nest.lacorte.dev/auth/social](https://nest.lacorte.dev/auth/social)
3. Active Directory: [nest.lacorte.dev/auth/active-directory](https://nest.lacorte.dev/auth/active-directory)
4. Interactive API: [nest.lacorte.dev/swagger](https://nest.lacorte.dev/swagger)
5. Product page on this site: [/projects/nestjs-backend](/projects/nestjs-backend)
6. Clone: [github.com/mateuslacorte/nestjs-backend](https://github.com/mateuslacorte/nestjs-backend)


Bring the stack up with Compose, confirm `/health`, enable the auth providers you need, and remove the rest. The boilerplate is there so you spend time on your product — not re-implementing the same OAuth and AD wiring on every new Nest project.
