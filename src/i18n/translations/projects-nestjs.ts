import type { TranslationMap } from '@/i18n';

type Localized = TranslationMap;

export const nestjsBackendProject = {
  metaTitle: {
    en: 'NestJS Backend | Reference API Template',
    pt: 'Backend NestJS | Template de API de referência',
  } satisfies Localized,
  metaDescription: {
    en: 'Clone-ready NestJS 11 backend with REST + GraphQL, JWT and social auth, Postgres/Mongo, Redis, Kafka, MinIO, and Graylog — plus a live demo and Swagger.',
    pt: 'Backend NestJS 11 pronto pra clonar: REST + GraphQL, JWT e auth social, Postgres/Mongo, Redis, Kafka, MinIO e Graylog — com demo ao vivo e Swagger.',
  } satisfies Localized,
  breadcrumbHome: { en: 'Home', pt: 'Início' } satisfies Localized,
  breadcrumbProjects: { en: 'Projects', pt: 'Projetos' } satisfies Localized,
  title: { en: 'NestJS Backend', pt: 'Backend NestJS' } satisfies Localized,
  pitch: {
    en: 'A reference NestJS template you can clone and ship on: dual APIs, serious auth surface, Docker Compose infra, and docs that live next to the API.',
    pt: 'Um template NestJS de referência pra clonar e colocar no ar: REST + GraphQL, auth de verdade, infra no Docker Compose e docs no mesmo lugar da API.',
  } satisfies Localized,
  pitchExtra: {
    en: 'Six months of hardening later — health checks, Graylog, CQRS-ready repos, and a wiki that ships with the same container as Swagger.',
    pt: 'Depois de seis meses endurecendo — health checks, Graylog, repos prontos pra CQRS e uma wiki que sobe no mesmo container do Swagger.',
  } satisfies Localized,
  badges: {
    nest: { en: 'NestJS 11', pt: 'NestJS 11' } satisfies Localized,
    apis: { en: 'REST + GraphQL', pt: 'REST + GraphQL' } satisfies Localized,
    docker: { en: 'Docker Compose', pt: 'Docker Compose' } satisfies Localized,
    template: { en: 'Open Source Template', pt: 'Template open source' } satisfies Localized,
  },
  stats: [
    {
      label: { en: 'APIs', pt: 'APIs' },
      value: { en: 'REST + GraphQL', pt: 'REST + GraphQL' },
    },
    {
      label: { en: 'Infra', pt: 'Infra' },
      value: { en: 'Compose one-liner', pt: 'Compose em um comando' },
    },
    {
      label: { en: 'Coverage gate', pt: 'Limite de cobertura' },
      value: { en: '≥80% Jest', pt: '≥80% Jest' },
    },
  ],
  heroPanel: {
    title: { en: 'Live stack', pt: 'Stack ao vivo' } satisfies Localized,
    origin: { en: 'nest.lacorte.dev', pt: 'nest.lacorte.dev' } satisfies Localized,
    swagger: { en: 'Swagger UI', pt: 'Swagger UI' } satisfies Localized,
    health: { en: 'GET /health → ok', pt: 'GET /health → ok' } satisfies Localized,
    compose: { en: 'docker compose up -d --build', pt: 'docker compose up -d --build' } satisfies Localized,
  },
  ctaDemo: { en: 'Open Live Demo', pt: 'Abrir demo ao vivo' } satisfies Localized,
  ctaSwagger: { en: 'Open Swagger', pt: 'Abrir Swagger' } satisfies Localized,
  ctaGithub: { en: 'View on GitHub', pt: 'Ver no GitHub' } satisfies Localized,
  ctaHealth: { en: 'Check Health', pt: 'Checar health' } satisfies Localized,
  featuresEyebrow: { en: 'Capabilities', pt: 'Recursos' } satisfies Localized,
  featuresHeading: { en: 'What you get', pt: 'O que vem incluso' } satisfies Localized,
  features: [
    {
      title: { en: 'Auth that covers the real world', pt: 'Auth pro mundo real' },
      description: {
        en: 'JWT login/register/refresh, on-prem Active Directory (LDAP/LDAPS), and a long list of social providers — Google through Apple, Steam, MetaMask, and more.',
        pt: 'Login/registro/refresh com JWT, Active Directory on-prem (LDAP/LDAPS) e uma lista grande de provedores sociais — do Google ao Apple, Steam, MetaMask e por aí vai.',
      },
    },
    {
      title: { en: 'REST and GraphQL together', pt: 'REST e GraphQL no mesmo app' },
      description: {
        en: 'Versioned REST under `/api/v1` plus Apollo GraphQL on the same Fastify app, with Swagger for the HTTP surface.',
        pt: 'REST versionado em `/api/v1` e Apollo GraphQL no mesmo app Fastify, com Swagger cobrindo os endpoints HTTP.',
      },
    },
    {
      title: { en: 'CQRS-ready persistence', pt: 'Persistência pronta pra CQRS' },
      description: {
        en: 'Repository pattern with PostgreSQL (TypeORM) as the default users store and a MongoDB repository kept ready if you split commands and queries later.',
        pt: 'Padrão Repository com PostgreSQL (TypeORM) como store padrão de users e um repositório MongoDB de reserva se você separar commands e queries depois.',
      },
    },
    {
      title: { en: 'Messaging and object storage', pt: 'Mensageria e object storage' },
      description: {
        en: 'Redis cache, Apache Kafka, and MinIO ship in Compose so queues and files are not weekend projects.',
        pt: 'Cache Redis, Apache Kafka e MinIO já vêm no Compose — fila e arquivo não viram projeto de fim de semana.',
      },
    },
    {
      title: { en: 'Observability baked in', pt: 'Observabilidade de fábrica' },
      description: {
        en: 'Terminus health at `/health`, structured GELF logs into Graylog/OpenSearch, MailHog for local email, and a built-in wiki next to the API.',
        pt: 'Health do Terminus em `/health`, logs GELF estruturados no Graylog/OpenSearch, MailHog pra e-mail local e wiki embutida do lado da API.',
      },
    },
    {
      title: { en: 'Tests that gate commits', pt: 'Testes que barram commit' },
      description: {
        en: 'Jest unit suite with a global ≥80% coverage threshold and a Husky pre-commit hook that refuses soft passes.',
        pt: 'Suite Jest com threshold global de cobertura ≥80% e hook Husky de pre-commit que não deixa passar no “quase”.',
      },
    },
  ],
  workflowEyebrow: { en: 'How it works', pt: 'Como funciona' } satisfies Localized,
  workflowHeading: {
    en: 'From clone to healthy API in three moves',
    pt: 'Do clone à API no ar em três passos',
  } satisfies Localized,
  workflow: [
    {
      title: { en: 'Compose the kitchen sink', pt: 'Suba a stack completa' },
      description: {
        en: 'One `docker compose --env-file .env.docker up -d --build` brings up Postgres, Mongo, Redis, Kafka, MinIO, Graylog, and the API.',
        pt: 'Um `docker compose --env-file .env.docker up -d --build` sobe Postgres, Mongo, Redis, Kafka, MinIO, Graylog e a API.',
      },
    },
    {
      title: { en: 'Probe the live surface', pt: 'Mexa na API ao vivo' },
      description: {
        en: 'Hit Swagger, GraphQL, and the wiki on the same origin — no “docs over here, API somewhere else.”',
        pt: 'Abra Swagger, GraphQL e a wiki na mesma origem — sem “docs pra cá, API pra lá.”',
      },
    },
    {
      title: { en: 'Trust the health gate', pt: 'Confie no health check' },
      description: {
        en: '`GET /health` checks Postgres, Mongo, Redis, Kafka, and heap. Compose uses it as the container HEALTHCHECK.',
        pt: '`GET /health` verifica Postgres, Mongo, Redis, Kafka e heap. O Compose usa isso como HEALTHCHECK do container.',
      },
    },
  ],
  tryEyebrow: { en: 'Try it', pt: 'Experimente' } satisfies Localized,
  tryHeading: {
    en: 'Tour the demo or clone the template',
    pt: 'Explore a demo ou clone o template',
  } satisfies Localized,
  trySteps: [
    {
      en: 'Open the live docs at nest.lacorte.dev and skim the install walkthrough.',
      pt: 'Abra a docs ao vivo em nest.lacorte.dev e dê uma olhada no guia de instalação.',
    },
    {
      en: 'Explore the interactive API at /swagger — same origin as the wiki.',
      pt: 'Explore a API interativa em /swagger — mesma origem da wiki.',
    },
    {
      en: 'Clone the GitHub repo and bring the full stack up with Compose.',
      pt: 'Clone o repo no GitHub e suba a stack completa com Compose.',
    },
    {
      en: 'Confirm `/health` is green before you start deleting modules you do not need.',
      pt: 'Confirme que `/health` está verde antes de sair apagando módulos que você não precisa.',
    },
  ],
  tryAsideTitle: {
    en: 'What stays intentional',
    pt: 'O que é de propósito',
  } satisfies Localized,
  tryAsideBody: {
    en: 'CQRS-ready, not CQRS cosplay. Postgres is the active store; Mongo repos hang around for a real command/query split later. No fake command bus.',
    pt: 'Pronto pra CQRS, sem cosplay de CQRS. Postgres é o store ativo; os repos Mongo ficam de lado pra uma separação real de command/query depois. Sem command bus de mentira.',
  } satisfies Localized,
  tryAsideNote: {
    en: 'Security still exposes a SUPER-role admin surface for blocked and suspicious IPs — documented on the live wiki.',
    pt: 'A segurança ainda expõe endpoints admin com role SUPER pra IPs bloqueados e suspeitos — documentado na wiki ao vivo.',
  } satisfies Localized,
  stackEyebrow: { en: 'Implementation', pt: 'Implementação' } satisfies Localized,
  stackHeading: { en: 'Stack at a glance', pt: 'A stack em resumo' } satisfies Localized,
  stack: [
    { label: { en: 'Runtime', pt: 'Runtime' }, value: { en: 'NestJS 11, TypeScript, Fastify', pt: 'NestJS 11, TypeScript, Fastify' } },
    { label: { en: 'APIs', pt: 'APIs' }, value: { en: 'REST, GraphQL (Apollo), Swagger', pt: 'REST, GraphQL (Apollo), Swagger' } },
    { label: { en: 'Data', pt: 'Dados' }, value: { en: 'PostgreSQL, MongoDB, Redis', pt: 'PostgreSQL, MongoDB, Redis' } },
    { label: { en: 'Platform', pt: 'Plataforma' }, value: { en: 'Kafka, MinIO, Graylog, Docker Compose', pt: 'Kafka, MinIO, Graylog, Docker Compose' } },
  ],
  relatedEyebrow: { en: 'From the blog', pt: 'Do blog' } satisfies Localized,
  relatedHeading: { en: 'Related posts', pt: 'Posts relacionados' } satisfies Localized,
  relatedRead: { en: 'Read post', pt: 'Ler post' } satisfies Localized,
  related: [
    {
      slug: 'nestjs-backend-auth-got-serious',
      title: {
        en: 'NestJS Reference Backend: Auth Built for Real Products',
        pt: 'Backend NestJS de referência: auth pensada pra produto de verdade',
      },
      blurb: {
        en: 'Social login, AD group→role mapping, Argon2id, and mobile-friendly OAuth — for teams cloning a Nest boilerplate.',
        pt: 'Login social, mapeamento AD grupo→role, Argon2id e OAuth pensado pra mobile — pra times que clonam um boilerplate NestJS.',
      },
    },
    {
      slug: 'nestjs-reference-backend',
      title: {
        en: 'NestJS Reference Backend',
        pt: 'Backend de referência NestJS',
      },
      blurb: {
        en: 'The kitchen-sink template introduction — what ships and why.',
        pt: 'A apresentação do template completo — o que vem na caixa e por quê.',
      },
    },
    {
      slug: 'nestjs-backend-six-months-later',
      title: {
        en: 'NestJS Backend, Six Months Later',
        pt: 'Backend NestJS, seis meses depois',
      },
      blurb: {
        en: 'Docker hardening, Graylog, health checks, and docs that actually ship.',
        pt: 'Hardening no Docker, Graylog, health checks e docs que de fato sobem junto.',
      },
    },
  ],
  faqEyebrow: { en: 'FAQ', pt: 'FAQ' } satisfies Localized,
  faqHeading: { en: 'Common questions', pt: 'Perguntas frequentes' } satisfies Localized,
  faqs: [
    {
      question: {
        en: 'Is this production-ready or a demo?',
        pt: 'Isso está pronto pra produção ou só uma demo?',
      },
      answer: {
        en: 'It is a clone-ready reference template with a live demo. Expect to delete modules you do not need, then ship the rest with Compose or your own orchestration.',
        pt: 'É um template de referência pronto pra clonar, com demo ao vivo. Apague o que não precisa e suba o resto com Compose ou com a orquestração que você já usa.',
      },
    },
    {
      question: {
        en: 'Do I need every service in Compose?',
        pt: 'Preciso de todos os serviços no Compose?',
      },
      answer: {
        en: 'No. Compose brings the full kitchen sink for local realism. Trim Kafka, MinIO, or Graylog when your use case is thinner — health checks adapt to what you keep.',
        pt: 'Não. O Compose sobe a stack completa pra ficar realista no local. Corte Kafka, MinIO ou Graylog se o caso for mais enxuto — os health checks se adaptam ao que sobrar.',
      },
    },
    {
      question: {
        en: 'REST or GraphQL — which is primary?',
        pt: 'REST ou GraphQL — qual é o principal?',
      },
      answer: {
        en: 'Both ship. Most people start at Swagger for the HTTP surface; GraphQL stays at `/graphql` if that is your religion.',
        pt: 'Os dois vêm. A maioria começa no Swagger pelos endpoints HTTP; o GraphQL fica em `/graphql` se essa for a sua religião.',
      },
    },
    {
      question: {
        en: 'Where do the docs live?',
        pt: 'Onde fica a documentação?',
      },
      answer: {
        en: 'On the same origin as the API: nest.lacorte.dev for the wiki, /swagger for the interactive contract.',
        pt: 'Na mesma origem da API: nest.lacorte.dev pra wiki, /swagger pro contrato interativo.',
      },
    },
  ],
  bottomCtaTitle: {
    en: 'Clone it. Compose it. Cut what you do not need.',
    pt: 'Clone. Suba com Compose. Corte o que não precisa.',
  } satisfies Localized,
  bottomCtaBody: {
    en: 'The plumbing drains. Start from the live demo or the GitHub template.',
    pt: 'A parte chata já está pronta. Comece pela demo ao vivo ou pelo template no GitHub.',
  } satisfies Localized,
} as const;

export const NESTJS_BACKEND_DEMO_URL = 'https://nest.lacorte.dev';
export const NESTJS_BACKEND_SWAGGER_URL = 'https://nest.lacorte.dev/swagger';
export const NESTJS_BACKEND_HEALTH_URL = 'https://nest.lacorte.dev/health';
export const NESTJS_BACKEND_GITHUB_URL = 'https://github.com/mateuslacorte/nestjs-backend';
export const NESTJS_BACKEND_ICON = '/projects/nestjs-logo.png';
