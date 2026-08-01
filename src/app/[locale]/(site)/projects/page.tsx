import type { Metadata } from 'next';
import Link from 'next/link';
import { projects } from '@/data/projects';
import { parseLocale, t } from '@/i18n';
import { localizePath } from '@/i18n/urlUtils';
import { commonTranslations } from '@/i18n/translations/common';
import { localeAlternates, localeOpenGraph } from '@/lib/localeMetadata';

interface ProjectsPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: ProjectsPageProps): Promise<Metadata> {
  const lang = parseLocale((await params).locale);
  const title = t(commonTranslations.projects.title, lang);
  const description = t(commonTranslations.projects.description, lang);
  return {
    title,
    description,
    alternates: localeAlternates('/projects', lang),
    openGraph: localeOpenGraph(lang, { title, description, urlPath: '/projects' }),
  };
}

export default async function ProjectsPage({ params }: ProjectsPageProps) {
  const lang = parseLocale((await params).locale);
  const proj = commonTranslations.projects;
  const idx = commonTranslations.index;

  return (
    <section className="py-16 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">{t(proj.title, lang)}</h1>
          <p className="text-xl text-[var(--color-text-muted)]">
            {t(proj.description, lang)}
          </p>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-16 px-6 rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-card)]">
            <p className="text-2xl font-semibold mb-3">{t(idx.noProjectsYet, lang)}</p>
            <p className="text-[var(--color-text-muted)] text-lg max-w-md mx-auto">
              {t(idx.noProjectsHint, lang)}
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link
                href={localizePath('/games', lang)}
                className="inline-flex items-center px-5 py-2.5 rounded-xl bg-primary-600 text-white font-medium hover:bg-primary-700 transition-colors"
              >
                {t(idx.browseGames, lang)}
              </Link>
              <Link
                href={localizePath('/tools', lang)}
                className="inline-flex items-center px-5 py-2.5 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-card-hover)] transition-colors"
              >
                {t(commonTranslations.nav.tools, lang)}
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Link
                key={project.slug}
                href={localizePath(`/projects/${project.slug}`, lang)}
                className="group relative overflow-hidden rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] hover:border-transparent transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${project.color} opacity-0 group-hover:opacity-10 transition-opacity`} />
                <div className="p-8">
                  {project.badge && (
                    <span className="absolute top-4 right-4 px-2 py-1 text-xs font-bold bg-primary-500 text-white rounded-full">
                      {project.badge}
                    </span>
                  )}
                  <div className="text-6xl mb-4 transform group-hover:scale-110 transition-transform duration-300">
                    {project.icon}
                  </div>
                  <h3 className="text-2xl font-bold mb-2 group-hover:text-primary-500 transition-colors">
                    {project.title}
                  </h3>
                  <p className="text-[var(--color-text-muted)] text-lg">
                    {project.description}
                  </p>
                  <div className="mt-6 flex items-center text-primary-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>{t(proj.viewProject, lang)}</span>
                    <svg className="w-5 h-5 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
