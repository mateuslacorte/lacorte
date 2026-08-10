import type { TranslationMap } from '@/i18n';

type Localized = TranslationMap;

export const nestjsBackendProject = {
  metaTitle: {
    en: 'NestJS Backend | Reference API Template',
    pt: 'Backend NestJS | Template de API de referência',
  } satisfies Localized,
  metaDescription: {
    en: 'Clone-ready NestJS 11 backend with REST + GraphQL, JWT and social auth, Postgres/Mongo, Redis, Kafka, MinIO, and Graylog — plus a live demo and Swagger.',
    pt: 'Backend NestJS 11 pronto para clonar com REST + GraphQL, JWT e auth social, Postgres/Mongo, Redis, Kafka, MinIO e Graylog — com demo ao vivo e Swagger.',
  } satisfies Localized,
  breadcrumbHome: { en: 'Home', pt: 'Início' } satisfies Localized,
  breadcrumbProjects: { en: 'Projects', pt: 'Projetos' } satisfies Localized,
  title: { en: 'NestJS Backend', pt: 'Backend NestJS' } satisfies Localized,
  pitch: {
    en: 'A reference NestJS template you can clone and ship on: dual APIs, serious auth surface, Docker Compose infra, and docs that live next to the API.',
    pt: 'Um template NestJS de referência para clonar e ir a produção: APIs duplas, superfície de auth séria, infra em Docker Compose e docs ao lado da API.',
  } satisfies Localized,
  badges: {
    nest: { en: 'NestJS 11', pt: 'NestJS 11' } satisfies Localized,
    apis: { en: 'REST + GraphQL', pt: 'REST + GraphQL' } satisfies Localized,
    docker: { en: 'Docker Compose', pt: 'Docker Compose' } satisfies Localized,
  },
  ctaDemo: { en: 'Open Live Demo', pt: 'Abrir demo ao vivo' } satisfies Localized,
  ctaSwagger: { en: 'Open Swagger', pt: 'Abrir Swagger' } satisfies Localized,
  ctaGithub: { en: 'View on GitHub', pt: 'Ver no GitHub' } satisfies Localized,
  featuresHeading: { en: 'What you get', pt: 'O que você ganha' } satisfies Localized,
  features: [
    {
      title: { en: 'Auth that covers the real world', pt: 'Auth que cobre o mundo real' },
      description: {
        en: 'JWT login/register/refresh, on-prem Active Directory (LDAP/LDAPS), and a long list of social providers — Google through Apple, Steam, MetaMask, and more.',
        pt: 'Login/registro/refresh com JWT, Active Directory on-prem (LDAP/LDAPS) e uma lista longa de provedores sociais — do Google ao Apple, Steam, MetaMask e mais.',
      },
    },
    {
      title: { en: 'REST and GraphQL together', pt: 'REST e GraphQL juntos' },
      description: {
        en: 'Versioned REST under `/api/v1` plus Apollo GraphQL on the same Fastify app, with Swagger for the HTTP surface.',
        pt: 'REST versionado em `/api/v1` e Apollo GraphQL no mesmo app Fastify, com Swagger para a superfície HTTP.',
      },
    },
    {
      title: { en: 'CQRS-ready persistence', pt: 'Persistência pronta para CQRS' },
      description: {
        en: 'Repository pattern with PostgreSQL (TypeORM) as the default users store and a MongoDB repository kept ready if you split commands and queries later.',
        pt: 'Padrão Repository com PostgreSQL (TypeORM) como store padrão de users e um repositório MongoDB pronto se você separar commands e queries depois.',
      },
    },
    {
      title: { en: 'Messaging and object storage', pt: 'Mensageria e object storage' },
      description: {
        en: 'Redis cache, Apache Kafka, and MinIO ship in Compose so queues and files are not weekend projects.',
        pt: 'Cache Redis, Apache Kafka e MinIO vêm no Compose para filas e arquivos não virarem projeto de fim de semana.',
      },
    },
    {
      title: { en: 'Observability baked in', pt: 'Observabilidade embutida' },
      description: {
        en: 'Terminus health at `/health`, structured GELF logs into Graylog/OpenSearch, MailHog for local email, and a built-in wiki next to the API.',
        pt: 'Health do Terminus em `/health`, logs GELF estruturados no Graylog/OpenSearch, MailHog para e-mail local e uma wiki embutida ao lado da API.',
      },
    },
    {
      title: { en: 'Tests that gate commits', pt: 'Testes que barram commits' },
      description: {
        en: 'Jest unit suite with a global ≥80% coverage threshold and a Husky pre-commit hook that refuses soft passes.',
        pt: 'Suite Jest com limiar global de cobertura ≥80% e hook Husky de pre-commit que recusa “quase passou”.',
      },
    },
  ],
  stackHeading: { en: 'Stack at a glance', pt: 'Stack em um olhar' } satisfies Localized,
  stack: [
    { label: { en: 'Runtime', pt: 'Runtime' }, value: { en: 'NestJS 11, TypeScript, Fastify', pt: 'NestJS 11, TypeScript, Fastify' } },
    { label: { en: 'APIs', pt: 'APIs' }, value: { en: 'REST, GraphQL (Apollo), Swagger', pt: 'REST, GraphQL (Apollo), Swagger' } },
    { label: { en: 'Data', pt: 'Dados' }, value: { en: 'PostgreSQL, MongoDB, Redis', pt: 'PostgreSQL, MongoDB, Redis' } },
    { label: { en: 'Platform', pt: 'Plataforma' }, value: { en: 'Kafka, MinIO, Graylog, Docker Compose', pt: 'Kafka, MinIO, Graylog, Docker Compose' } },
  ],
  relatedHeading: { en: 'Related posts', pt: 'Posts relacionados' } satisfies Localized,
  related: [
    {
      slug: 'nestjs-reference-backend',
      title: {
        en: 'NestJS Reference Backend',
        pt: 'Backend de referência NestJS',
      },
    },
    {
      slug: 'nestjs-backend-six-months-later',
      title: {
        en: 'NestJS Backend, Six Months Later',
        pt: 'Backend NestJS, seis meses depois',
      },
    },
  ],
} as const;

export const NESTJS_BACKEND_DEMO_URL = 'https://nest.lacorte.dev';
export const NESTJS_BACKEND_SWAGGER_URL = 'https://nest.lacorte.dev/swagger';
export const NESTJS_BACKEND_GITHUB_URL = 'https://github.com/mateuslacorte/nestjs-backend';
