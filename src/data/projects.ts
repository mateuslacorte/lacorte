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
    slug: 'ocpp-node-library',
    title: {
      en: 'OCPP Node Library',
      pt: 'Biblioteca OCPP Node',
    },
    description: {
      en: 'fastify-ocpp on npm — OCPP-J CSMS library with negotiation, framing, schemas, and onAction/call for 1.6–2.1.',
      pt: 'fastify-ocpp no npm — biblioteca OCPP-J pra CSMS, com negociação, framing, schemas e onAction/call nas versões 1.6–2.1.',
    },
    icon: '/projects/ocpp-node-library-icon.png',
    color: 'from-emerald-500 to-teal-500',
    badge: {
      en: 'npm',
      pt: 'npm',
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
      pt: 'Template NestJS pronto pra produção, com REST, GraphQL, auth e stack Docker completa.',
    },
    icon: '/projects/nestjs-logo.png',
    color: 'from-primary-500 to-accent-500',
    badge: {
      en: 'Template',
      pt: 'Template',
    },
  },
];
