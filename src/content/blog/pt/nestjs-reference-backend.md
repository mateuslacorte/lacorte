---
title: Backend de referência NestJS
date: '2026-01-06'
tags:
  - portfólio
  - nestjs
  - backend
  - typescript
  - graphql
  - referência
description: >-
  Um template de backend NestJS completo com tudo que você poderia precisar —
  e provavelmente um monte de coisa que você não precisa. É um projeto de
  referência pra usar como ponto de partida.
---


Montei esse backend NestJS como projeto de referência e template inicial pra aplicações backend modernas. Depois de configurar as mesmas coisas de novo e de novo em projetos diferentes, decidi juntar numa base só os padrões e integrações comuns que você normalmente precisa.


## O projeto


É um template NestJS pronto pra produção, com base sólida pra montar aplicação escalável. Tem autenticação, integração com banco, cache, upload de arquivo, comunicação em tempo real e mais — tudo estruturado e pronto pra usar.


A ideia era algo que o desenvolvedor clonasse e começasse a lógica de negócio na hora, sem gastar dias montando boilerplate de feature comum.


## A stack


**Framework principal:**
- **NestJS** — framework Node.js pra aplicação séria
- **TypeScript** — type safety e DX melhor
- **GraphQL (Apollo)** — query language moderna pra API
- **APIs REST** — endpoint HTTP clássico


**Bancos de dados:**
- **MongoDB** (Mongoose/Typegoose) — documento, schema flexível
- **PostgreSQL** (TypeORM) — relacional, dado estruturado
- **Redis** — cache em memória


**Autenticação & segurança:**
- **JWT** — auth baseada em token
- **Passport** — strategies de autenticação
- **bcrypt** — hash de senha
- **Rate limiting** — proteção contra abuso


**Tempo real & comunicação:**
- **WebSockets** (Socket.io) — comunicação bidirecional em tempo real
- **E-mail** (Nodemailer) — SMTP
- **WhatsApp** — integração de mensagem
- **Kafka** — fila de mensagem pra arquitetura orientada a evento


**Armazenamento & arquivos:**
- **MinIO** — object storage compatível com S3
- **Serviço de upload** — lida com upload multipart


**Logging & monitoramento:**
- **Logtail** — agregação centralizada de log


**Documentação:**
- **Swagger** — documentação interativa da API
- **Wiki** — documentação embutida


**Outras funcionalidades:**
- **Tarefas agendadas** — suporte a cron job
- **Processamento de imagem** — Canvas/Jimp
- **Leitura de QR code** — leitura de código de barras


## Funcionalidades principais


### Autenticação & autorização


Sistema completo de auth com JWT e controle de acesso por papel (RBAC). Inclui login, cadastro, redefinição de senha e refresh token.


### Suporte multi-banco


Arquitetura flexível com MongoDB (documento) e PostgreSQL (relacional), pra você escolher a ferramenta certa pra cada caso.


### Sistema de cache


Cache com Redis e decorators pra cachear no nível do método. Tem interceptors pro Mongoose e pro TypeORM pra cachear resultado de query automaticamente.


### Upload de arquivo


Upload robusto com MinIO pra object storage. Validação, processamento e servir arquivo com segurança.


### Gateway WebSocket


Gateway WebSocket abstrato pra facilitar meter tempo real na aplicação. Inclui validação de mensagem e padrões de handler.


### GraphQL & REST


As duas estão disponíveis — você escolhe o que faz sentido pro frontend, ou usa as duas ao mesmo tempo.


### Segurança


Módulo de segurança embutido com bloqueio de IP, rate limiting e validação ampla de request. Guard global de JWT protege todas as rotas por padrão.


### Documentação


Swagger UI pra API e uma wiki embutida pro projeto, pra facilitar a vida de quem chega no time.


## Arquitetura


O projeto segue as boas práticas do NestJS com arquitetura modular:
- **Modules** — módulos por funcionalidade (auth, users, email, etc.)
- **Common** — utilitários e serviços compartilhados (cache, upload, WebSocket, segurança)
- **Config** — configuração centralizada
- **DTOs** — objetos de transferência com validação
- **Guards** — autenticação e autorização
- **Interceptors** — logging, cache e afins
- **Decorators** — decorators customizados pra padrões comuns


Cada módulo é autocontido e dá pra estender ou remover conforme o projeto.


## Por que isso é útil


Esse projeto de referência economiza tempo de desenvolvimento de verdade:
1. **Integrações já configuradas** — os serviços comuns já estão de pé
2. **Boas práticas** — código segue as convenções do NestJS e do TypeScript
3. **Tipagem** — TypeScript de ponta a ponta, tipado direito
4. **Documentação** — código documentado, com exemplos
5. **Flexibilidade** — design modular: use só o que precisa
6. **Padrões de produção** — tratamento de erro, validação, logging e segurança já inclusos


Em vez de gastar dias ou semanas montando auth, conexão de banco, upload e outras features comuns, você clona e vai direto pra lógica de negócio.


## Casos de uso


Esse template serve bem pra:
- **Começar projeto novo** — já sai com as features comuns
- **Aprender NestJS** — ver como estruturar uma aplicação Nest de verdade
- **Implementação de referência** — usar de guia nos seus próprios projetos
- **Prototipar rápido** — MVP com as peças já no lugar


Seja SaaS, backend de API ou app em tempo real, o template dá uma base sólida pra construir em cima.


Esse backend NestJS de referência é um ponto de partida completo pro desenvolvimento backend moderno. Tem os padrões e integrações comuns que você vai precisar, estruturados e prontos pra usar. Em vez de reinventar a roda em todo projeto, você foca no que torna a aplicação sua.


O projeto mostra padrões NestJS do mundo real e serve tanto de template quanto de material de estudo pra montar backend escalável.


Se quiser usar, [aqui está o link do GitHub](https://github.com/mateuslacorte/nestjs-backend).
