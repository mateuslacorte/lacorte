---
title: 'NestJS Reference Backend, Six Months Later'
date: '2026-07-23'
tags:
  - portfolio
  - nestjs
  - backend
  - typescript
  - docker
  - observability
description: >-
  Docker Compose, Graylog, health checks, bilingual docs, and CQRS-ready repos —
  what changed in my NestJS reference backend since January.
---


Back in January I wrote about my [NestJS reference backend](/posts/nestjs-reference-backend). I called it production-ready. I meant it. Mostly.


Then I tried to treat it like something you'd actually deploy: one command to bring the whole stack up, logs that weren't glued to a SaaS account, a health endpoint Docker could poke, docs that lived next to the API instead of rotting in a README. Turns out "reference" and "I can ship this without swearing" are slightly different bars.


So I spent a couple of days in July fixing that. No shiny new business features. Just the boring stuff that makes a template honest.


## What Changed


The July update is almost entirely **ops, docs, and hardening**:

- Full Docker Compose stack instead of "figure it out yourself"
- Logtail out, Graylog in
- A real `/health` endpoint
- NestJS 11 and Apollo Server 5
- A bilingual wiki that isn't an afterthought
- Security and auth polish
- The badly done CQRS implementation, deleted — **CQRS-ready** left behind on purpose


If you came here looking for a brand-new WhatsApp module: sorry. That was already there. This post is about making the existing thing stop lying about being ready.


## One-Command Stack


Previously, "run the project" meant: install half the internet, stand up Postgres, Mongo, Redis, MinIO, Kafka, and prayer. Charming for a weekend. Terrible for a reference.


Now there's a multi-stage **Dockerfile** (Node 22, native deps for canvas/bcrypt, healthcheck wired to `/health`) and a Compose file that brings up:

- **API** — the Nest app itself
- **PostgreSQL** and **MongoDB** — because dual persistence is the point
- **Redis** — cache
- **MinIO** — S3-shaped storage
- **Kafka** (+ UI) — events without inventing a message bus from scratch
- **MailHog** — fake SMTP so password resets don't escape to production inboxes
- **OpenSearch + Graylog** — logs you can actually open in a browser


One line, roughly: `docker compose --env-file .env.docker up -d --build`. Then you can stop explaining your local setup in Slack.


There's an install walkthrough on the live wiki: [Click here to see](https://nestjs.lacorte.dev/backend/install).


## Logtail Out, Graylog In


The January post proudly listed **Logtail**. Cute. Also: another account, another bill, another reason a clone of the template silently depends on a vendor you might not want.


I swapped it for **Graylog** over GELF, sitting next to OpenSearch in Compose. There's a small Graylog module with a logger, an interceptor, an exception filter, and a `@NoLog()` decorator for endpoints that shouldn't spam your stream (looking at you, health checks).


Is Graylog glamorous? No. Is it self-hosted and sitting in the same `docker compose` as everything else? Yes. For a reference backend, that matters more than a pretty SaaS dashboard.


## Health as a Contract


"Is it up?" used to mean "the process is running, please don't ask about Kafka."


There's now a Terminus-backed **`GET /health`** that checks Postgres, Mongo, Redis, Kafka, and memory heap. It's public, it's marked `@NoLog()`, and the Docker image's `HEALTHCHECK` hits it. Boring. Correct. Exactly what you want when Compose is deciding whether your API container is actually useful.


Live: [Check out the health example](https://nestjs.lacorte.dev/health).


## Docs That Live With the API


Swagger was already there. The wiki was… present. Calling it documentation was generous.


The July pass turned the wiki into something I'd actually send someone:

- **Bilingual** — en-US and pt-BR
- **SEO / Open Graph** — `APP_URL` pointed at the real demo host
- Pages for architecture, install, auth, email, WhatsApp, WebSocket, security
- Favicons, `robots.txt`, a web manifest — the little things that make it feel like a site, not a leftover Pug folder


The demo lives at **[nestjs.lacorte.dev](https://nestjs.lacorte.dev)**. The interactive API is at **[nestjs.lacorte.dev/swagger](https://nestjs.lacorte.dev/swagger)**. Same origin as the docs. No "docs are over here, the API is somewhere else, good luck."


GraphQL is still at `/graphql` if that's your religion. Most people poking the example will start at Swagger. That's fine.


## CQRS: Ready, Not Pretending


Confession time: I had a CQRS implementation in this project. It was bad. Not "needs a refactor" bad — "this is teaching people the wrong shape" bad. So I ripped it out.


What stayed is intentional and much less dramatic: **CQRS-ready**.


Each domain can keep dual repositories (Postgres via TypeORM, Mongo via Mongoose). Services inject what they need. Postgres is the active store by default; Mongo repos hang around for when you actually want a command/query split, optionally synced over Kafka. There is no fake command bus pretending to be DDD cosplay.


I'd rather ship a template that says "here's how you'd go CQRS" than one that claims it already is and then gaslights you for three days. The architecture page spells it out: [Check it out here](https://nestjs.lacorte.dev/architecture).


## Hardening Bits


A few smaller changes that don't deserve their own manifesto but would annoy me if they were missing:

- **JWT TTL jitter** — so every token in the fleet doesn't expire in the same millisecond and stampede refresh
- **Catch-all invalid routes** — unknown paths can feed IP blocking; wiki, GraphQL, and `/health` are excluded so documentation traffic doesn't look like an attack
- **NestJS 11 + Apollo Server 5** — with a custom Express Apollo driver instead of dragging `@nestjs/apollo` along for the ride
- **Richer Swagger examples** — because "string" as every example helps nobody


Security still has the SUPER-role admin surface for blocked/suspicious IPs. Details [here](https://nestjs.lacorte.dev/security).


## Try It


If you want the short tour:

1. Docs: [https://nestjs.lacorte.dev](https://nestjs.lacorte.dev)
2. Example API (Swagger): [https://nestjs.lacorte.dev/swagger](https://nestjs.lacorte.dev/swagger)
3. Health: [https://nestjs.lacorte.dev/health](https://nestjs.lacorte.dev/health)
4. Architecture / CQRS-ready: [https://nestjs.lacorte.dev/architecture](https://nestjs.lacorte.dev/architecture)


The January post was "here's a kitchen sink Nest template." This one is "here's the same kitchen sink, but the plumbing actually drains."


If you want the code (or want to judge the CQRS deletion), it's on [GitHub](https://github.com/mateuslacorte/nestjs-backend). Don't @ me if Graylog eats your disk — that's between you and your volume mounts.
