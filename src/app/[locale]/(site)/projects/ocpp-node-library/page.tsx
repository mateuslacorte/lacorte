import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { JsonLd, ProjectBreadcrumb } from '@/components/projects/ProjectPageParts';
import { parseLocale, t } from '@/i18n';
import { localizePath } from '@/i18n/urlUtils';
import {
  OCPP_NODE_LIBRARY_GITHUB_URL,
  OCPP_NODE_LIBRARY_ICON,
  OCPP_NODE_LIBRARY_NPM_URL,
  OCPP_NODE_LIBRARY_TUTORIAL_SLUG,
  ocppNodeLibraryProject as copy,
} from '@/i18n/translations/projects-ocpp-node-library';
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
    alternates: localeAlternates('/projects/ocpp-node-library', lang),
    openGraph: localeOpenGraph(lang, {
      title,
      description,
      urlPath: '/projects/ocpp-node-library',
    }),
  };
}

export default async function OcppNodeLibraryProjectPage({ params }: PageProps) {
  const lang = parseLocale((await params).locale);
  const tutorialHref = localizePath(`/posts/${OCPP_NODE_LIBRARY_TUTORIAL_SLUG}`, lang);

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
          url: OCPP_NODE_LIBRARY_NPM_URL,
          codeRepository: OCPP_NODE_LIBRARY_GITHUB_URL,
          image: OCPP_NODE_LIBRARY_ICON,
        }}
      />

      <section className="relative overflow-hidden py-20 md:py-28 px-4 bg-gradient-to-b from-emerald-500/15 via-teal-500/8 to-transparent">
        <div
          className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-emerald-500/25 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute bottom-0 left-1/4 h-56 w-56 rounded-full bg-teal-500/20 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute top-1/3 left-0 h-40 w-40 rounded-full bg-cyan-500/10 blur-3xl"
          aria-hidden
        />

        <div className="relative max-w-6xl mx-auto">
          <ProjectBreadcrumb
            items={[
              { label: t(copy.breadcrumbHome, lang), href: localizePath('/', lang) },
              { label: t(copy.breadcrumbProjects, lang), href: localizePath('/projects', lang) },
              { label: t(copy.title, lang) },
            ]}
          />

          <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-12 items-center">
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <Image
                  src={OCPP_NODE_LIBRARY_ICON}
                  alt={t(copy.title, lang)}
                  width={56}
                  height={56}
                  className="rounded-2xl shadow-lg shadow-emerald-500/25"
                  priority
                />
                <span className="inline-flex items-center px-3 py-1 text-sm font-medium rounded-full bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 font-mono">
                  {t(copy.badges.package, lang)}
                </span>
                <span className="inline-flex items-center px-3 py-1 text-sm font-medium rounded-full bg-red-500/15 text-red-800 dark:text-red-200">
                  {t(copy.badges.npm, lang)}
                </span>
                <span className="inline-flex items-center px-3 py-1 text-sm font-medium rounded-full bg-teal-500/20 text-teal-800 dark:text-teal-200">
                  {t(copy.badges.versions, lang)}
                </span>
                <span className="inline-flex items-center px-3 py-1 text-sm font-medium rounded-full bg-[var(--color-card)] border border-[var(--color-border)] text-[var(--color-text-muted)]">
                  {t(copy.badges.license, lang)}
                </span>
              </div>

              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-balance mb-5">
                {t(copy.title, lang)}
              </h1>
              <p className="text-xl md:text-2xl leading-relaxed text-[var(--color-text-muted)] mb-4">
                {t(copy.pitch, lang)}
              </p>
              <p className="text-base md:text-lg leading-relaxed text-[var(--color-text-muted)] mb-10 max-w-2xl">
                {t(copy.pitchExtra, lang)}
              </p>

              <div className="flex flex-wrap gap-3">
                <Link
                  href={OCPP_NODE_LIBRARY_NPM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-lg shadow-emerald-500/25 transition-all hover:-translate-y-0.5"
                >
                  {t(copy.ctaNpm, lang)}
                  <span className="ml-2" aria-hidden>
                    ↗
                  </span>
                </Link>
                <Link
                  href={OCPP_NODE_LIBRARY_GITHUB_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-6 py-3.5 rounded-xl border border-emerald-500/40 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-500/10 font-medium transition-colors"
                >
                  {t(copy.ctaGithub, lang)}
                </Link>
                <Link
                  href={tutorialHref}
                  className="inline-flex items-center px-6 py-3.5 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-card-hover)] font-medium transition-colors"
                >
                  {t(copy.ctaTutorial, lang)}
                </Link>
              </div>
            </div>

            <figure className="rounded-2xl border border-emerald-500/20 bg-[var(--color-card)] p-5 md:p-6 shadow-xl shadow-emerald-500/10">
              <div className="flex items-center gap-3 mb-4">
                <Image
                  src={OCPP_NODE_LIBRARY_ICON}
                  alt=""
                  width={40}
                  height={40}
                  className="rounded-xl"
                  aria-hidden
                />
                <div>
                  <p className="text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
                    {t(copy.heroPanel.title, lang)}
                  </p>
                  <p className="font-semibold font-mono text-sm text-emerald-700 dark:text-emerald-300">
                    {t(copy.heroPanel.packageName, lang)}
                  </p>
                </div>
              </div>
              <div className="space-y-3 font-mono text-sm">
                <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
                  <p className="text-[var(--color-text-muted)] text-xs mb-1">install</p>
                  <p className="text-emerald-600 dark:text-emerald-400 break-all">
                    {t(copy.heroPanel.install, lang)}
                  </p>
                </div>
                <div className="flex items-center justify-center text-[var(--color-text-muted)] text-xs">↓</div>
                <div className="rounded-xl border border-teal-500/25 bg-teal-500/10 p-4">
                  <p className="text-[var(--color-text-muted)] text-xs mb-1">register</p>
                  <p className="break-all">{t(copy.heroPanel.register, lang)}</p>
                </div>
                <div className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white p-4">
                  <p className="text-white/70 text-xs mb-1">api</p>
                  <p className="break-all">{t(copy.heroPanel.api, lang)}</p>
                </div>
              </div>
            </figure>
          </div>

          <div className="grid sm:grid-cols-3 gap-3 mt-12">
            {copy.stats.map((stat) => (
              <div
                key={stat.label.en}
                className="p-4 rounded-xl border border-emerald-500/15 bg-[var(--color-card)]/80 backdrop-blur-sm"
              >
                <p className="text-xs uppercase tracking-wide text-[var(--color-text-muted)] mb-1">
                  {t(stat.label, lang)}
                </p>
                <p className="font-semibold text-lg">{t(stat.value, lang)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <p className="text-sm font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 mb-3">
            {t(copy.featuresEyebrow, lang)}
          </p>
          <h2 className="text-3xl md:text-5xl font-bold text-balance mb-12">{t(copy.featuresHeading, lang)}</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {copy.features.map((feature, index) => (
              <article
                key={feature.title.en}
                className="group p-6 md:p-7 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/5 transition-all"
              >
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white flex items-center justify-center font-bold mb-5 shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                  {index + 1}
                </div>
                <h3 className="text-lg md:text-xl font-semibold mb-2 font-mono">{t(feature.title, lang)}</h3>
                <p className="leading-relaxed text-[var(--color-text-muted)]">{t(feature.description, lang)}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 border-y border-[var(--color-border)] bg-[var(--color-card)]/40">
        <div className="max-w-6xl mx-auto">
          <p className="text-sm font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 mb-3">
            {t(copy.workflowEyebrow, lang)}
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-balance mb-10">{t(copy.workflowHeading, lang)}</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {copy.workflow.map((step, index) => (
              <article
                key={step.title.en}
                className="relative p-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)]"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-semibold mb-5">
                  {index + 1}
                </div>
                <h3 className="text-xl font-semibold mb-2">{t(step.title, lang)}</h3>
                <p className="leading-relaxed text-[var(--color-text-muted)]">{t(step.description, lang)}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 mb-3">
              {t(copy.tryEyebrow, lang)}
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-balance mb-8">{t(copy.tryHeading, lang)}</h2>
            <ol className="space-y-5">
              {copy.trySteps.map((step, index) => (
                <li key={step.en} className="flex gap-4">
                  <span className="shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-emerald-600 to-teal-500 text-white flex items-center justify-center font-semibold shadow-sm">
                    {index + 1}
                  </span>
                  <span className="pt-1.5 leading-relaxed">{t(step, lang)}</span>
                </li>
              ))}
            </ol>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={OCPP_NODE_LIBRARY_NPM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition-colors"
              >
                {t(copy.ctaNpm, lang)}
              </Link>
              <Link
                href={tutorialHref}
                className="inline-flex items-center px-5 py-2.5 rounded-xl border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10 font-medium transition-colors"
              >
                {t(copy.ctaTutorial, lang)}
              </Link>
            </div>
          </div>

          <aside className="p-7 md:p-8 rounded-2xl border border-teal-500/30 bg-gradient-to-br from-emerald-500/15 via-teal-500/10 to-transparent self-start">
            <h3 className="text-2xl font-bold mb-3">{t(copy.tryAsideTitle, lang)}</h3>
            <p className="mb-4 leading-relaxed">{t(copy.tryAsideBody, lang)}</p>
            <p className="text-[var(--color-text-muted)] leading-relaxed">{t(copy.tryAsideNote, lang)}</p>
          </aside>
        </div>
      </section>

      <section className="py-20 px-4 border-t border-[var(--color-border)] bg-[var(--color-card)]/30">
        <div className="max-w-6xl mx-auto">
          <p className="text-sm font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 mb-3">
            {t(copy.stackEyebrow, lang)}
          </p>
          <h2 className="text-3xl md:text-4xl font-bold mb-10">{t(copy.stackHeading, lang)}</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {copy.stack.map((item) => (
              <div
                key={item.label.en}
                className="p-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] hover:border-emerald-500/30 transition-colors"
              >
                <p className="text-sm uppercase tracking-wide text-[var(--color-text-muted)] mb-2">
                  {t(item.label, lang)}
                </p>
                <p className="font-semibold text-lg md:text-xl">{t(item.value, lang)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 border-t border-[var(--color-border)]">
        <div className="max-w-6xl mx-auto">
          <p className="text-sm font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 mb-3">
            {t(copy.relatedEyebrow, lang)}
          </p>
          <h2 className="text-3xl md:text-4xl font-bold mb-10">{t(copy.relatedHeading, lang)}</h2>
          <div className="grid md:grid-cols-1 gap-6 max-w-2xl">
            {copy.related.map((post) => (
              <Link
                key={post.slug}
                href={localizePath(`/posts/${post.slug}`, lang)}
                className="group p-6 md:p-8 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] hover:border-emerald-500/40 hover:shadow-lg transition-all"
              >
                <h3 className="text-xl font-semibold mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  {t(post.title, lang)}
                </h3>
                <p className="text-[var(--color-text-muted)] mb-4">{t(post.blurb, lang)}</p>
                <span className="inline-flex items-center text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                  {t(copy.relatedRead, lang)}
                  <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 border-t border-[var(--color-border)] bg-[var(--color-card)]/40">
        <div className="max-w-3xl mx-auto">
          <p className="text-sm font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 mb-3 text-center">
            {t(copy.faqEyebrow, lang)}
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">{t(copy.faqHeading, lang)}</h2>
          <div className="space-y-4">
            {copy.faqs.map((faq) => (
              <details
                key={faq.question.en}
                className="group bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] overflow-hidden"
              >
                <summary className="flex items-center justify-between gap-4 p-5 cursor-pointer hover:bg-[var(--color-card-hover)] transition-colors font-medium list-none">
                  <span>{t(faq.question, lang)}</span>
                  <span className="shrink-0 text-[var(--color-text-muted)] group-open:rotate-45 transition-transform text-xl leading-none">
                    +
                  </span>
                </summary>
                <div className="px-5 pb-5 text-[var(--color-text-muted)] leading-relaxed">
                  {t(faq.answer, lang)}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="p-8 md:p-10 rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500 text-white flex flex-col md:flex-row md:items-center md:justify-between gap-8 shadow-xl shadow-emerald-500/20">
            <div className="flex items-start gap-5">
              <Image
                src={OCPP_NODE_LIBRARY_ICON}
                alt=""
                width={64}
                height={64}
                className="rounded-2xl shadow-lg ring-2 ring-white/20"
                aria-hidden
              />
              <div>
                <h2 className="text-2xl md:text-3xl font-bold mb-2">{t(copy.bottomCtaTitle, lang)}</h2>
                <p className="text-white/80 text-lg">{t(copy.bottomCtaBody, lang)}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 shrink-0">
              <Link
                href={OCPP_NODE_LIBRARY_NPM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-white text-emerald-800 hover:bg-emerald-50 font-semibold transition-colors"
              >
                {t(copy.ctaNpm, lang)}
              </Link>
              <Link
                href={OCPP_NODE_LIBRARY_GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-5 py-3 rounded-xl border border-white/40 hover:bg-white/10 font-semibold transition-colors"
              >
                {t(copy.ctaGithub, lang)}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
