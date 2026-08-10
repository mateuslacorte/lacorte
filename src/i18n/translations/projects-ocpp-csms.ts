import type { TranslationMap } from '@/i18n';

type Localized = TranslationMap;

export const ocppCsmsProject = {
  metaTitle: {
    en: 'OCPP CSMS | Node.js Charging Station Management',
    pt: 'CSMS OCPP | Gestão de estações de carga em Node.js',
  } satisfies Localized,
  metaDescription: {
    en: 'Open-source OCPP-J CSMS for Node.js — WebSocket transport, subprotocol negotiation, and OCA schema validation for 1.6, 2.0.1, and 2.1.',
    pt: 'CSMS OCPP-J open source para Node.js — transporte WebSocket, negociação de subprotocolo e validação de schemas OCA para 1.6, 2.0.1 e 2.1.',
  } satisfies Localized,
  breadcrumbHome: { en: 'Home', pt: 'Início' } satisfies Localized,
  breadcrumbProjects: { en: 'Projects', pt: 'Projetos' } satisfies Localized,
  title: { en: 'OCPP CSMS', pt: 'CSMS OCPP' } satisfies Localized,
  pitch: {
    en: 'A Node.js Charging Station Management System layer for OCPP-J — so stations can boot, heartbeat, authorize, and run sessions without you reinventing the wire protocol.',
    pt: 'Uma camada CSMS em Node.js para OCPP-J — para estações fazerem boot, heartbeat, autorizar e rodar sessões sem você reinventar o protocolo no fio.',
  } satisfies Localized,
  pitchExtra: {
    en: 'One shared WebSocket path, three protocol generations, official Open Charge Alliance schemas, and handlers where your product logic actually belongs.',
    pt: 'Um path WebSocket compartilhado, três gerações de protocolo, schemas oficiais da Open Charge Alliance e handlers onde a lógica do produto realmente mora.',
  } satisfies Localized,
  badges: {
    ocpp: { en: 'OCPP-J', pt: 'OCPP-J' } satisfies Localized,
    versions: { en: '1.6 · 2.0.1 · 2.1', pt: '1.6 · 2.0.1 · 2.1' } satisfies Localized,
    node: { en: 'Node.js 18+', pt: 'Node.js 18+' } satisfies Localized,
    openSource: { en: 'Open Source', pt: 'Open source' } satisfies Localized,
  },
  stats: [
    {
      label: { en: 'Protocols', pt: 'Protocolos' },
      value: { en: '1.6 / 2.0.1 / 2.1', pt: '1.6 / 2.0.1 / 2.1' },
    },
    {
      label: { en: 'Transport', pt: 'Transporte' },
      value: { en: 'JSON over WebSocket', pt: 'JSON sobre WebSocket' },
    },
    {
      label: { en: 'Validation', pt: 'Validação' },
      value: { en: 'OCA JSON Schemas', pt: 'Schemas JSON OCA' },
    },
  ],
  heroPanel: {
    title: { en: 'Wire shape', pt: 'Formato no fio' } satisfies Localized,
    endpoint: { en: 'ws://host/ocpp/:chargePointId', pt: 'ws://host/ocpp/:chargePointId' } satisfies Localized,
    call: { en: '[2, id, action, payload]', pt: '[2, id, action, payload]' } satisfies Localized,
    result: { en: '[3, id, payload]', pt: '[3, id, payload]' } satisfies Localized,
    subprotocol: { en: 'Sec-WebSocket-Protocol: ocpp2.1', pt: 'Sec-WebSocket-Protocol: ocpp2.1' } satisfies Localized,
  },
  ctaNpm: { en: 'View on npm', pt: 'Ver no npm' } satisfies Localized,
  ctaGithub: { en: 'View on GitHub', pt: 'Ver no GitHub' } satisfies Localized,
  ctaTutorial: { en: 'Read the tutorial', pt: 'Ler o tutorial' } satisfies Localized,
  featuresEyebrow: { en: 'Capabilities', pt: 'Capacidades' } satisfies Localized,
  featuresHeading: {
    en: 'What the CSMS layer owns',
    pt: 'O que a camada CSMS resolve',
  } satisfies Localized,
  features: [
    {
      title: {
        en: 'Shared path, negotiated version',
        pt: 'Path compartilhado, versão negociada',
      },
      description: {
        en: 'Every station hits the same WebSocket route. Version comes from Sec-WebSocket-Protocol — 1.6, 2.0.1, or 2.1 — with a preference order you control.',
        pt: 'Toda estação usa a mesma rota WebSocket. A versão vem de Sec-WebSocket-Protocol — 1.6, 2.0.1 ou 2.1 — com a ordem de preferência que você define.',
      },
    },
    {
      title: {
        en: 'CALL framing done right',
        pt: 'Framing CALL feito certo',
      },
      description: {
        en: 'Inbound CALL → your handler → CALLRESULT (or CALLERROR). Outbound call() waits for the station reply with timeouts and schema checks.',
        pt: 'CALL de entrada → seu handler → CALLRESULT (ou CALLERROR). call() de saída espera a resposta da estação com timeout e checagem de schema.',
      },
    },
    {
      title: {
        en: 'Official OCA schemas',
        pt: 'Schemas oficiais da OCA',
      },
      description: {
        en: 'Request and response payloads validated against Open Charge Alliance JSON schemas shipped with the package — catch FormatViolation early.',
        pt: 'Payloads de request e response validados contra schemas JSON da Open Charge Alliance que vêm no pacote — pegue FormatViolation cedo.',
      },
    },
    {
      title: {
        en: 'Action handlers, your domain',
        pt: 'Handlers de ação, seu domínio',
      },
      description: {
        en: 'onAction and onAny wire BootNotification, Authorize, transactions, and the rest. Billing, identity, and tariffs stay in your services.',
        pt: 'onAction e onAny ligam BootNotification, Authorize, transações e o resto. Billing, identidade e tarifas ficam nos seus serviços.',
      },
    },
    {
      title: {
        en: 'Live connection registry',
        pt: 'Registry de conexões vivas',
      },
      description: {
        en: 'Track who is online by chargePointId, filter by negotiated version, and gate operator commands on real presence.',
        pt: 'Acompanhe quem está online por chargePointId, filtre pela versão negociada e só dispare comandos de operação com presença real.',
      },
    },
    {
      title: {
        en: 'Mixed-fleet friendly',
        pt: 'Amigável a frota mista',
      },
      description: {
        en: 'Old 1.6 boxes and newer 2.x firmware can share one endpoint. Branch on ctx.version when payloads diverge.',
        pt: 'Caixas 1.6 antigas e firmware 2.x novo podem compartilhar um endpoint. Ramifique em ctx.version quando os payloads divergirem.',
      },
    },
  ],
  workflowEyebrow: { en: 'How it works', pt: 'Como funciona' } satisfies Localized,
  workflowHeading: {
    en: 'From socket to session in three moves',
    pt: 'Do socket à sessão em três movimentos',
  } satisfies Localized,
  workflow: [
    {
      title: { en: 'Accept and negotiate', pt: 'Aceite e negocie' },
      description: {
        en: 'Station connects to /ocpp/:id offering ocpp1.6 / ocpp2.0.1 / ocpp2.1. The server picks the best mutual match from your versions list.',
        pt: 'A estação conecta em /ocpp/:id oferecendo ocpp1.6 / ocpp2.0.1 / ocpp2.1. O servidor escolhe o melhor match mútuo da sua lista de versions.',
      },
    },
    {
      title: { en: 'Answer the essentials', pt: 'Responda o essencial' },
      description: {
        en: 'Handle BootNotification and Heartbeat first, then Authorize and the transaction loop for your chosen OCPP generation.',
        pt: 'Trate BootNotification e Heartbeat primeiro, depois Authorize e o loop de transação da geração OCPP que você escolheu.',
      },
    },
    {
      title: { en: 'Command when needed', pt: 'Comande quando precisar' },
      description: {
        en: 'Operators call Reset, UnlockConnector, or remote start through your API; you translate that into ocpp.call for the live version.',
        pt: 'Operadores pedem Reset, UnlockConnector ou start remoto pela sua API; você traduz isso em ocpp.call para a versão viva.',
      },
    },
  ],
  tryEyebrow: { en: 'Try it', pt: 'Experimente' } satisfies Localized,
  tryHeading: {
    en: 'Install, boot a station, grow handlers',
    pt: 'Instale, dê boot numa estação, cresça os handlers',
  } satisfies Localized,
  trySteps: [
    {
      en: 'Install the package from npm and register the OCPP layer with the versions you support.',
      pt: 'Instale o pacote no npm e registre a camada OCPP com as versões que você suporte.',
    },
    {
      en: 'Register BootNotification and Heartbeat, then point a simulator at ws://localhost:9000/ocpp/CP_001.',
      pt: 'Registre BootNotification e Heartbeat e aponte um simulador para ws://localhost:9000/ocpp/CP_001.',
    },
    {
      en: 'Add Authorize plus Start/Stop (1.6) or TransactionEvent (2.x) when you are ready for sessions.',
      pt: 'Adicione Authorize mais Start/Stop (1.6) ou TransactionEvent (2.x) quando estiver pronto para sessões.',
    },
    {
      en: 'Read the full walkthrough on the blog for framing, production notes, and a sane CSMS skeleton.',
      pt: 'Leia o passo a passo completo no blog para framing, notas de produção e um esqueleto de CSMS sensato.',
    },
  ],
  tryAsideTitle: {
    en: 'Library vs product',
    pt: 'Biblioteca vs produto',
  } satisfies Localized,
  tryAsideBody: {
    en: 'Transport, negotiation, framing, and schemas are the reusable parts. Auth rules, tariffs, roaming, and customer apps stay in your handlers and services.',
    pt: 'Transporte, negociação, framing e schemas são as partes reutilizáveis. Regras de auth, tarifas, roaming e apps de cliente ficam nos seus handlers e serviços.',
  } satisfies Localized,
  tryAsideNote: {
    en: 'OCPP-J only — JSON over WebSocket. Classic SOAP 1.6 is out of scope on purpose.',
    pt: 'Somente OCPP-J — JSON sobre WebSocket. O SOAP 1.6 clássico fica de fora de propósito.',
  } satisfies Localized,
  stackEyebrow: { en: 'Implementation', pt: 'Implementação' } satisfies Localized,
  stackHeading: { en: 'Stack at a glance', pt: 'Stack em um olhar' } satisfies Localized,
  stack: [
    {
      label: { en: 'Protocol', pt: 'Protocolo' },
      value: { en: 'OCPP-J 1.6, 2.0.1, 2.1', pt: 'OCPP-J 1.6, 2.0.1, 2.1' },
    },
    {
      label: { en: 'Runtime', pt: 'Runtime' },
      value: { en: 'Node.js 18+, TypeScript', pt: 'Node.js 18+, TypeScript' },
    },
    {
      label: { en: 'Wire', pt: 'Fio' },
      value: { en: 'WebSocket + CALL framing', pt: 'WebSocket + framing CALL' },
    },
    {
      label: { en: 'Schemas', pt: 'Schemas' },
      value: { en: 'Open Charge Alliance (Ajv)', pt: 'Open Charge Alliance (Ajv)' },
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
        pt: 'Construindo um CSMS OCPP em Node.js',
      },
      blurb: {
        en: 'Protocol-first tutorial: framing, BootNotification, sessions, and a sane CSMS skeleton for beginners.',
        pt: 'Tutorial com foco no protocolo: framing, BootNotification, sessões e um esqueleto de CSMS sensato para quem está começando.',
      },
    },
  ],
  faqEyebrow: { en: 'FAQ', pt: 'FAQ' } satisfies Localized,
  faqHeading: { en: 'Common questions', pt: 'Perguntas comuns' } satisfies Localized,
  faqs: [
    {
      question: {
        en: 'Is this a full billing / roaming product?',
        pt: 'Isso é um produto completo de billing / roaming?',
      },
      answer: {
        en: 'No. It is the OCPP transport and validation layer for a CSMS. You implement identity, transactions, tariffs, and operator UX on top.',
        pt: 'Não. É a camada de transporte e validação OCPP para um CSMS. Você implementa identidade, transações, tarifas e UX de operação por cima.',
      },
    },
    {
      question: {
        en: 'Which OCPP versions are supported?',
        pt: 'Quais versões OCPP são suportadas?',
      },
      answer: {
        en: 'OCPP-J 1.6, 2.0.1, and 2.1 on one shared path, with subprotocol negotiation. SOAP (OCPP-S) is not supported.',
        pt: 'OCPP-J 1.6, 2.0.1 e 2.1 num path compartilhado, com negociação de subprotocolo. SOAP (OCPP-S) não é suportado.',
      },
    },
    {
      question: {
        en: 'Do I need physical chargers to learn?',
        pt: 'Preciso de carregadores físicos para aprender?',
      },
      answer: {
        en: 'No. Use a station simulator or a small WebSocket client that sends CALL arrays. Prove Boot + Heartbeat before you touch hardware.',
        pt: 'Não. Use um simulador de estação ou um cliente WebSocket pequeno que envie arrays CALL. Prove Boot + Heartbeat antes de tocar no hardware.',
      },
    },
    {
      question: {
        en: 'Where should business logic live?',
        pt: 'Onde a lógica de negócio deve morar?',
      },
      answer: {
        en: 'In your handlers and application services. Keep framing and schemas in the library; keep auth, billing, and device policy in your code.',
        pt: 'Nos seus handlers e serviços de aplicação. Deixe framing e schemas na biblioteca; deixe auth, billing e política de dispositivo no seu código.',
      },
    },
  ],
  bottomCtaTitle: {
    en: 'Accept a socket. Answer Boot. Earn a session.',
    pt: 'Aceite um socket. Responda Boot. Ganhe uma sessão.',
  } satisfies Localized,
  bottomCtaBody: {
    en: 'Start from the npm package, the GitHub repo, or the protocol tutorial on the blog.',
    pt: 'Comece pelo pacote no npm, pelo repositório no GitHub ou pelo tutorial de protocolo no blog.',
  } satisfies Localized,
} as const;

export const OCPP_CSMS_NPM_URL = 'https://www.npmjs.com/package/fastify-ocpp';
export const OCPP_CSMS_GITHUB_URL = 'https://github.com/mateuslacorte/fastify-ocpp';
export const OCPP_CSMS_TUTORIAL_SLUG = 'ocpp-csms-nodejs-tutorial';
export const OCPP_CSMS_ICON = '/projects/ocpp-csms-icon.png';
