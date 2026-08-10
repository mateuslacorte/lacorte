import type { TranslationMap } from '@/i18n';

export interface ProjectCard {
  slug: string;
  title: TranslationMap;
  description: TranslationMap;
  icon: string;
  color: string;
  badge?: TranslationMap;
}

/** Live project catalog. Archived page sources live under src/archive/projects/. */
export const projects: ProjectCard[] = [
  {
    slug: 'ocpp-csms',
    title: {
      en: 'OCPP CSMS',
      pt: 'CSMS OCPP',
    },
    description: {
      en: 'Node.js OCPP-J CSMS layer — WebSocket transport, negotiation, and schemas for 1.6, 2.0.1, and 2.1.',
      pt: 'Camada CSMS OCPP-J em Node.js — transporte WebSocket, negociação e schemas para 1.6, 2.0.1 e 2.1.',
    },
    icon: '/projects/ocpp-csms-icon.png',
    color: 'from-emerald-500 to-teal-500',
    badge: {
      en: 'Library',
      pt: 'Biblioteca',
    },
  },
  {
    slug: 'nestjs-backend',
    title: {
      en: 'NestJS Backend',
      pt: 'Backend NestJS',
    },
    description: {
      en: 'Production-ready NestJS template with REST, GraphQL, auth, and a full Docker stack.',
      pt: 'Template NestJS pronto para produção com REST, GraphQL, autenticação e stack Docker completa.',
    },
    icon: '/projects/nestjs-logo.png',
    color: 'from-primary-500 to-accent-500',
    badge: {
      en: 'Template',
      pt: 'Template',
    },
  },
];
