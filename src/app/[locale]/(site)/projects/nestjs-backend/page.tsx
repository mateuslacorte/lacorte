import type { Metadata } from 'next';
import Link from 'next/link';
import { FeatureCard, JsonLd, ProjectBreadcrumb } from '@/components/projects/ProjectPageParts';
import { parseLocale, t } from '@/i18n';
import { localizePath } from '@/i18n/urlUtils';
import {
  NESTJS_BACKEND_DEMO_URL,
  NESTJS_BACKEND_GITHUB_URL,
  NESTJS_BACKEND_SWAGGER_URL,
  nestjsBackendProject as copy,
} from '@/i18n/translations/projects-nestjs';
import { localeAlternates, localeOpenGraph } from '@/lib/localeMetadata';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const lang = parseLocale((await params).locale);
  const title = t(copy.metaTitle, lang);
  const description = t(copy.metaDescription, lang);
  return {
    title,
    description,
    alternates: localeAlternates('/projects/nestjs-backend', lang),
    openGraph: localeOpenGraph(lang, {
      title,
      description,
      urlPath: '/projects/nestjs-backend',
    }),
  };
}

export default async function NestjsBackendProjectPage({ params }: PageProps) {
  const lang = parseLocale((await params).locale);

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: t(copy.title, lang),
          description: t(copy.metaDescription, lang),
          applicationCategory: 'DeveloperApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          url: NESTJS_BACKEND_DEMO_URL,
          codeRepository: NESTJS_BACKEND_GITHUB_URL,
        }}
      />

      <section className="relative overflow-hidden py-16 px-4 bg-gradient-to-b from-primary-500/10 via-accent-500/5 to-transparent">
        <div className="relative max-w-5xl mx-auto">
          <ProjectBreadcrumb
            items={[
              { label: t(copy.breadcrumbHome, lang), href: localizePath('/', lang) },
              { label: t(copy.breadcrumbProjects, lang), href: localizePath('/projects', lang) },
              { label: t(copy.title, lang) },
            ]}
          />

          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2 mb-5">
              <span className="text-4xl mr-1" aria-hidden="true">
                🪺
              </span>
              <span className="inline-flex items-center px-3 py-1 text-sm font-medium rounded-full bg-primary-500/10 text-primary-700 dark:text-primary-300">
                {t(copy.badges.nest, lang)}
              </span>
              <span className="inline-flex items-center px-3 py-1 text-sm font-medium rounded-full bg-accent-500/15 text-accent-700 dark:text-accent-300">
                {t(copy.badges.apis, lang)}
              </span>
              <span className="inline-flex items-center px-3 py-1 text-sm font-medium rounded-full bg-primary-500/10 text-primary-700 dark:text-primary-300">
                {t(copy.badges.docker, lang)}
              </span>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-5">{t(copy.title, lang)}</h1>
            <p className="text-xl md:text-2xl leading-relaxed text-[var(--color-text-muted)] mb-8">
              {t(copy.pitch, lang)}
            </p>

            <div className="flex flex-wrap gap-4">
              <Link
                href={NESTJS_BACKEND_DEMO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-6 py-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold shadow-lg shadow-primary-500/20 transition-all hover:-translate-y-0.5"
              >
                {t(copy.ctaDemo, lang)}
              </Link>
              <Link
                href={NESTJS_BACKEND_SWAGGER_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-6 py-3 rounded-xl border border-primary-500/40 text-primary-700 dark:text-primary-300 hover:bg-primary-500/10 font-medium transition-colors"
              >
                {t(copy.ctaSwagger, lang)}
              </Link>
              <Link
                href={NESTJS_BACKEND_GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-6 py-3 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-card-hover)] font-medium transition-colors"
              >
                {t(copy.ctaGithub, lang)}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-8">{t(copy.featuresHeading, lang)}</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {copy.features.map((feature) => (
              <FeatureCard
                key={feature.title.en}
                title={t(feature.title, lang)}
                description={t(feature.description, lang)}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-4 border-t border-[var(--color-border)] bg-[var(--color-card)]/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold mb-8">{t(copy.stackHeading, lang)}</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {copy.stack.map((item) => (
              <div
                key={item.label.en}
                className="p-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)]"
              >
                <p className="text-sm uppercase tracking-wide text-[var(--color-text-muted)] mb-2">
                  {t(item.label, lang)}
                </p>
                <p className="font-semibold text-lg">{t(item.value, lang)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-4 border-t border-[var(--color-border)]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold mb-8">{t(copy.relatedHeading, lang)}</h2>
          <ul className="space-y-3">
            {copy.related.map((post) => (
              <li key={post.slug}>
                <Link
                  href={localizePath(`/posts/${post.slug}`, lang)}
                  className="text-lg font-medium text-primary-600 dark:text-primary-400 hover:underline"
                >
                  {t(post.title, lang)}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
