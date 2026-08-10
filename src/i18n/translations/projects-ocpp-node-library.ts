import type { TranslationMap } from '@/i18n';

type Localized = TranslationMap;

export const ocppNodeLibraryProject = {
  metaTitle: {
    en: 'OCPP Node Library | fastify-ocpp on npm',
    pt: 'Biblioteca OCPP Node | fastify-ocpp no npm',
  } satisfies Localized,
  metaDescription: {
    en: 'fastify-ocpp — Node.js OCPP-J library for CSMS backends. Subprotocol negotiation, CALL framing, OCA schemas, onAction/call API for 1.6, 2.0.1, and 2.1.',
    pt: 'fastify-ocpp — biblioteca OCPP-J em Node.js para backends CSMS. Negociação de subprotocolo, framing CALL, schemas OCA e API onAction/call para 1.6, 2.0.1 e 2.1.',
  } satisfies Localized,
  breadcrumbHome: { en: 'Home', pt: 'Início' } satisfies Localized,
  breadcrumbProjects: { en: 'Projects', pt: 'Projetos' } satisfies Localized,
  title: { en: 'OCPP Node Library', pt: 'Biblioteca OCPP Node' } satisfies Localized,
  pitch: {
    en: 'The npm package that turns a Node server into an OCPP-J CSMS endpoint — negotiation, framing, schema validation, and a clean handler API.',
    pt: 'O pacote npm que transforma um servidor Node num endpoint CSMS OCPP-J — negociação, framing, validação de schema e uma API limpa de handlers.',
  } satisfies Localized,
  pitchExtra: {
    en: 'Install `fastify-ocpp`, register once, then own BootNotification, Authorize, transactions, and outbound Reset / remote start in your code — not in a fork of the wire protocol.',
    pt: 'Instale `fastify-ocpp`, registre uma vez e cuide de BootNotification, Authorize, transações e Reset / start remoto no seu código — não num fork do protocolo.',
  } satisfies Localized,
  badges: {
    package: { en: 'fastify-ocpp', pt: 'fastify-ocpp' } satisfies Localized,
    npm: { en: 'npm', pt: 'npm' } satisfies Localized,
    versions: { en: '1.6 · 2.0.1 · 2.1', pt: '1.6 · 2.0.1 · 2.1' } satisfies Localized,
    license: { en: 'GPL-3.0', pt: 'GPL-3.0' } satisfies Localized,
  },
  stats: [
    {
      label: { en: 'Package', pt: 'Pacote' },
      value: { en: 'fastify-ocpp @1.0.0', pt: 'fastify-ocpp @1.0.0' },
    },
    {
      label: { en: 'Runtime', pt: 'Runtime' },
      value: { en: 'Node.js 18+', pt: 'Node.js 18+' },
    },
    {
      label: { en: 'Types', pt: 'Types' },
      value: { en: 'TypeScript included', pt: 'TypeScript incluso' },
    },
  ],
  heroPanel: {
    title: { en: 'From npm', pt: 'Do npm' } satisfies Localized,
    packageName: { en: 'fastify-ocpp', pt: 'fastify-ocpp' } satisfies Localized,
    install: { en: 'npm i fastify-ocpp', pt: 'npm i fastify-ocpp' } satisfies Localized,
    register: {
      en: "register(fastifyOcpp, { versions, path })",
      pt: "register(fastifyOcpp, { versions, path })",
    } satisfies Localized,
    api: {
      en: 'ocpp.onAction · ocpp.call · registry',
      pt: 'ocpp.onAction · ocpp.call · registry',
    } satisfies Localized,
  },
  ctaNpm: { en: 'Install on npm', pt: 'Instalar no npm' } satisfies Localized,
  ctaGithub: { en: 'View on GitHub', pt: 'Ver no GitHub' } satisfies Localized,
  ctaTutorial: { en: 'Read the tutorial', pt: 'Ler o tutorial' } satisfies Localized,
  featuresEyebrow: { en: 'Package surface', pt: 'Superfície do pacote' } satisfies Localized,
  featuresHeading: {
    en: 'What you get when you install',
    pt: 'O que você ganha ao instalar',
  } satisfies Localized,
  features: [
    {
      title: {
        en: 'versions + shared path',
        pt: 'versions + path compartilhado',
      },
      description: {
        en: 'Configure `versions: [\'2.1\',\'2.0.1\',\'1.6\']` and `path: \'/ocpp\'`. Stations hit one route; Sec-WebSocket-Protocol picks the match.',
        pt: 'Configure `versions: [\'2.1\',\'2.0.1\',\'1.6\']` e `path: \'/ocpp\'`. As estações usam uma rota; o Sec-WebSocket-Protocol escolhe o match.',
      },
    },
    {
      title: {
        en: 'onAction / onAny',
        pt: 'onAction / onAny',
      },
      description: {
        en: 'Register handlers per action (optionally per version). Return a plain object — the package wraps CALLRESULT and validates it.',
        pt: 'Registre handlers por ação (opcionalmente por versão). Devolva um objeto simples — o pacote monta o CALLRESULT e valida.',
      },
    },
    {
      title: {
        en: 'call + getConnection',
        pt: 'call + getConnection',
      },
      description: {
        en: 'Outbound CSMS→station CALLs with timeout. Inspect `conn.version` before choosing RemoteStart vs RequestStartTransaction.',
        pt: 'CALLs de saída CSMS→estação com timeout. Veja `conn.version` antes de escolher RemoteStart ou RequestStartTransaction.',
      },
    },
    {
      title: {
        en: 'OCA schemas (Ajv)',
        pt: 'Schemas OCA (Ajv)',
      },
      description: {
        en: '`validateIncoming` / `validateOutgoing` default on. Official Open Charge Alliance JSON schemas ship inside the package.',
        pt: '`validateIncoming` / `validateOutgoing` ligados por padrão. Os schemas JSON oficiais da Open Charge Alliance vêm no pacote.',
      },
    },
    {
      title: {
        en: 'registry.list()',
        pt: 'registry.list()',
      },
      description: {
        en: 'Live map of chargePointId → connection. Filter by negotiated version and gate operator commands on real presence.',
        pt: 'Mapa vivo chargePointId → conexão. Filtre pela versão negociada e só dispare comando de operação com presença real.',
      },
    },
    {
      title: {
        en: 'Ops knobs built in',
        pt: 'Knobs de ops embutidos',
      },
      description: {
        en: '`callTimeoutMs`, `rejectDuplicateConnections`, `onConnect` / `onDisconnect` — production defaults without reinventing the session layer.',
        pt: '`callTimeoutMs`, `rejectDuplicateConnections`, `onConnect` / `onDisconnect` — defaults de produção sem reinventar a camada de sessão.',
      },
    },
  ],
  workflowEyebrow: { en: 'How it works', pt: 'Como funciona' } satisfies Localized,
  workflowHeading: {
    en: 'Install, register, wire handlers',
    pt: 'Instale, registre, ligue os handlers',
  } satisfies Localized,
  workflow: [
    {
      title: { en: 'Install the package', pt: 'Instale o pacote' },
      description: {
        en: '`npm i fastify-ocpp` (Node 18+). The package ships `dist/`, TypeScript types, and the OCA `schemas/` tree.',
        pt: '`npm i fastify-ocpp` (Node 18+). O pacote traz `dist/`, types TypeScript e a árvore `schemas/` da OCA.',
      },
    },
    {
      title: { en: 'Register once', pt: 'Registre uma vez' },
      description: {
        en: 'Pass `versions` (allow-list + preference) and `path`. You get `app.ocpp` — handlers, outbound call, and the registry.',
        pt: 'Passe `versions` (allow-list + preferência) e `path`. Você ganha `app.ocpp` — handlers, call de saída e o registry.',
      },
    },
    {
      title: { en: 'Own the domain', pt: 'Cuide do domínio' },
      description: {
        en: 'Implement BootNotification, Heartbeat, Authorize, transactions. Use `ocpp.call` from your operator API for Reset and remote start.',
        pt: 'Implemente BootNotification, Heartbeat, Authorize, transações. Use `ocpp.call` na sua API de operação para Reset e start remoto.',
      },
    },
  ],
  tryEyebrow: { en: 'Try it', pt: 'Experimente' } satisfies Localized,
  tryHeading: {
    en: 'From registry to first BootNotification',
    pt: 'Do registry ao primeiro BootNotification',
  } satisfies Localized,
  trySteps: [
    {
      en: 'Run `npm i fastify-ocpp` in a Node 18+ project.',
      pt: 'Rode `npm i fastify-ocpp` num projeto Node 18+.',
    },
    {
      en: 'Register with `versions: [\'2.1\',\'2.0.1\',\'1.6\']` and `path: \'/ocpp\'`.',
      pt: 'Registre com `versions: [\'2.1\',\'2.0.1\',\'1.6\']` e `path: \'/ocpp\'`.',
    },
    {
      en: 'Add `onAction(\'BootNotification\')` and `onAction(\'Heartbeat\')`, then point a simulator at `/ocpp/CP_001`.',
      pt: 'Adicione `onAction(\'BootNotification\')` e `onAction(\'Heartbeat\')` e aponte um simulador para `/ocpp/CP_001`.',
    },
    {
      en: 'Read the protocol tutorial when you are ready for Authorize and full sessions.',
      pt: 'Leia o tutorial de protocolo quando for a hora de Authorize e sessões completas.',
    },
  ],
  tryAsideTitle: {
    en: 'Library boundary',
    pt: 'Limite da biblioteca',
  } satisfies Localized,
  tryAsideBody: {
    en: 'fastify-ocpp owns transport, negotiation, CALL framing, and schemas. Your app owns auth, billing, tariffs, and operator UX in handlers.',
    pt: 'O fastify-ocpp cuida de transporte, negociação, framing CALL e schemas. Seu app cuida de auth, billing, tarifas e UX de operação nos handlers.',
  } satisfies Localized,
  tryAsideNote: {
    en: 'OCPP-J only. SOAP 1.6 is out of scope. License: GPL-3.0-only.',
    pt: 'Somente OCPP-J. SOAP 1.6 fica de fora. Licença: GPL-3.0-only.',
  } satisfies Localized,
  stackEyebrow: { en: 'Package facts', pt: 'Fatos do pacote' } satisfies Localized,
  stackHeading: { en: 'What ships on npm', pt: 'O que sobe no npm' } satisfies Localized,
  stack: [
    {
      label: { en: 'Name', pt: 'Nome' },
      value: { en: 'fastify-ocpp', pt: 'fastify-ocpp' },
    },
    {
      label: { en: 'Protocols', pt: 'Protocolos' },
      value: { en: 'OCPP-J 1.6, 2.0.1, 2.1', pt: 'OCPP-J 1.6, 2.0.1, 2.1' },
    },
    {
      label: { en: 'Surface', pt: 'Superfície' },
      value: { en: 'onAction, call, registry, schemas', pt: 'onAction, call, registry, schemas' },
    },
    {
      label: { en: 'License', pt: 'Licença' },
      value: { en: 'GPL-3.0-only', pt: 'GPL-3.0-only' },
    },
  ],
  relatedEyebrow: { en: 'From the blog', pt: 'Do blog' } satisfies Localized,
  relatedHeading: { en: 'Related posts', pt: 'Posts relacionados' } satisfies Localized,
  relatedRead: { en: 'Read post', pt: 'Ler post' } satisfies Localized,
  related: [
    {
      slug: 'ocpp-csms-nodejs-tutorial',
      title: {
        en: 'Building an OCPP CSMS in Node.js',
        pt: 'Montando um CSMS OCPP em Node.js',
      },
      blurb: {
        en: 'Protocol-first tutorial: framing, BootNotification, sessions, and a sane CSMS skeleton.',
        pt: 'Tutorial com foco no protocolo: framing, BootNotification, sessões e um esqueleto de CSMS que faz sentido.',
      },
    },
  ],
  faqEyebrow: { en: 'FAQ', pt: 'FAQ' } satisfies Localized,
  faqHeading: { en: 'Common questions', pt: 'Perguntas comuns' } satisfies Localized,
  faqs: [
    {
      question: {
        en: 'What exactly is fastify-ocpp?',
        pt: 'O que é o fastify-ocpp, exatamente?',
      },
      answer: {
        en: 'An npm library that adds an OCPP-J CSMS WebSocket endpoint to a Node app: subprotocol negotiation, CALL framing, OCA schema validation, handlers, and outbound call().',
        pt: 'Uma biblioteca npm que adiciona um endpoint WebSocket CSMS OCPP-J a um app Node: negociação de subprotocolo, framing CALL, validação OCA, handlers e call() de saída.',
      },
    },
    {
      question: {
        en: 'Does it include billing or roaming?',
        pt: 'Vem com billing ou roaming?',
      },
      answer: {
        en: 'No. Those live in your handlers and services. The package stops at a correct, validated OCPP conversation.',
        pt: 'Não. Isso mora nos seus handlers e serviços. O pacote para numa conversa OCPP correta e validada.',
      },
    },
    {
      question: {
        en: 'Which OCPP versions are supported?',
        pt: 'Quais versões OCPP são suportadas?',
      },
      answer: {
        en: 'OCPP-J 1.6, 2.0.1, and 2.1 on one shared path. SOAP (OCPP-S) is not supported.',
        pt: 'OCPP-J 1.6, 2.0.1 e 2.1 num path compartilhado. SOAP (OCPP-S) não é suportado.',
      },
    },
    {
      question: {
        en: 'Where should my business logic live?',
        pt: 'Onde fica a lógica de negócio?',
      },
      answer: {
        en: 'In onAction handlers and application services that call ocpp.call. Do not fork the library to change tariffs or auth rules.',
        pt: 'Nos handlers onAction e nos serviços que chamam ocpp.call. Não faça fork da biblioteca para mudar tarifa ou regra de auth.',
      },
    },
  ],
  bottomCtaTitle: {
    en: 'npm i fastify-ocpp — then wire your first handler.',
    pt: 'npm i fastify-ocpp — e ligue o primeiro handler.',
  } satisfies Localized,
  bottomCtaBody: {
    en: 'Grab the package on npm, clone the repo, or read the CSMS tutorial when you want the full protocol walkthrough.',
    pt: 'Pegue o pacote no npm, clone o repo ou leia o tutorial de CSMS quando quiser o passeio completo pelo protocolo.',
  } satisfies Localized,
} as const;

export const OCPP_NODE_LIBRARY_NPM_URL = 'https://www.npmjs.com/package/fastify-ocpp';
export const OCPP_NODE_LIBRARY_GITHUB_URL = 'https://github.com/mateuslacorte/fastify-ocpp';
export const OCPP_NODE_LIBRARY_TUTORIAL_SLUG = 'ocpp-csms-nodejs-tutorial';
export const OCPP_NODE_LIBRARY_ICON = '/projects/ocpp-node-library-icon.png';
