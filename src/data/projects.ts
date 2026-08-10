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
