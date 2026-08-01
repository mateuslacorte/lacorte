import type { Metadata } from 'next';
import Link from 'next/link';
import { t, defaultLang } from '@/i18n';
import { pageTranslations } from '@/i18n/translations/pages';
import { JsonLd, ProjectBreadcrumb } from '@/components/projects/ProjectPageParts';
import { absoluteUrl, SITE_URL } from '@/lib/site';

const pageTitle = 'Local Price Extractor | On-Device Chrome Price Extraction';
const pageDescription = "Extract product prices from the page you are viewing with Chrome's built-in AI, without sending the page to a backend.";
const repositoryUrl = 'https://github.com/lacorte/local-price-extractor';

const workflow = [
  {
    title: 'Capture a bounded page view',
    description: 'Read only a bounded representation of the active shopping page after the user starts an analysis.',
  },
  {
    title: 'Structure with on-device AI',
    description: "Ask Chrome's built-in model for schema-constrained product, price, shipping, and link data.",
  },
  {
    title: 'Validate against the source',
    description: 'Reject prices and URLs that cannot be found in the captured page instead of trusting model output blindly.',
  },
];

const installSteps = [
  'Download the repository ZIP from GitHub or clone the public repository.',
  'Open chrome://extensions and enable Developer mode.',
  'Choose Load unpacked and select the repository directory.',
  t(pageTranslations.projects.installStepAnalyze, defaultLang),
];

const stack = [
  { label: 'Extension', value: 'Chrome Manifest V3, JavaScript' },
  { label: 'On-device model', value: 'Chrome LanguageModel API' },
  { label: 'Output controls', value: 'JSON Schema, source validation' },
  { label: 'Verification', value: 'Vitest, real Chrome fixture' },
];

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: { canonical: absoluteUrl('/projects/local-price-extractor') },
};

export default function LocalPriceExtractorPage() {
  const appSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Local Price Extractor',
    description: pageDescription,
    applicationCategory: 'BrowserApplication',
    operatingSystem: 'Desktop Google Chrome',
    codeRepository: repositoryUrl,
    url: `${SITE_URL}/projects/local-price-extractor`,
  };

  return (
    <>
      <JsonLd data={appSchema} />

      <section className="relative overflow-hidden py-16 px-4 bg-gradient-to-b from-amber-500/10 via-orange-500/5 to-transparent">
        <div className="relative max-w-5xl mx-auto">
          <ProjectBreadcrumb items={[
            { label: 'Home', href: '/' },
            { label: 'Projects', href: '/projects' },
            { label: 'Local Price Extractor' },
          ]} />

          <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-10 items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-5">
                <span className="text-4xl mr-1" aria-hidden="true">🏷️</span>
                <span className="px-3 py-1 text-sm font-medium rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-200">Experimental Prototype</span>
                <span className="px-3 py-1 text-sm font-medium rounded-full bg-orange-500/10 text-orange-800 dark:text-orange-200">On-Device AI</span>
                <span className="px-3 py-1 text-sm font-medium rounded-full bg-emerald-500/10 text-emerald-800 dark:text-emerald-200">No Backend</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-balance mb-5">Local Price Extractor</h1>
              <p className="text-xl md:text-2xl leading-relaxed text-[var(--color-text-muted)] mb-8">{pageDescription}</p>
              <a
                href={repositoryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-6 py-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-semibold shadow-lg shadow-orange-500/20 transition-colors"
              >
                View on GitHub <span className="ml-2" aria-hidden="true">↗</span>
              </a>
            </div>

            <figure className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-xl">
              <div className="rounded-xl border border-[var(--color-border)] p-4 mb-3">
                <p className="text-xs uppercase tracking-wide text-[var(--color-text-muted)] mb-2">Active shopping page</p>
                <div className="h-3 w-4/5 rounded bg-[var(--color-border)] mb-2" />
                <div className="h-3 w-2/5 rounded bg-amber-500/50" />
              </div>
              <div className="flex items-center justify-center gap-2 text-sm font-medium text-orange-700 dark:text-orange-300 py-2">
                <span>Chrome on-device AI</span><span aria-hidden="true">↓</span>
              </div>
              <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 font-mono text-sm">
                <p>{`{ "title": "Product",`}</p>
                <p className="pl-4">{`"price": 29900 }`}</p>
              </div>
            </figure>
          </div>

          <div className="grid sm:grid-cols-3 gap-3 mt-10">
            <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)]">
              <p className="text-xs uppercase text-[var(--color-text-muted)] mb-1">Platform</p>
              <p className="font-semibold">Chrome Extension</p>
            </div>
            <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)]">
              <p className="text-xs uppercase text-[var(--color-text-muted)] mb-1">Processing</p>
              <p className="font-semibold">Inside the browser</p>
            </div>
            <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)]">
              <p className="text-xs uppercase text-[var(--color-text-muted)] mb-1">Tested fixture</p>
              <p className="font-semibold tabular-nums">2 accepted · 0 rejected</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <p className="text-sm font-semibold uppercase tracking-wider text-orange-700 dark:text-orange-300 mb-3">How it works</p>
          <h2 className="text-3xl md:text-4xl font-bold text-balance mb-8">Model output is only the first draft</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {workflow.map((item, index) => (
              <article key={item.title} className="p-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)]">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center font-bold mb-5">{index + 1}</div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="leading-relaxed text-[var(--color-text-muted)]">{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-4 border-y border-[var(--color-border)] bg-[var(--color-card)]/30">
        <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-10">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-orange-700 dark:text-orange-300 mb-3">Install and try</p>
            <h2 className="text-3xl font-bold text-balance mb-6">Load it directly from GitHub</h2>
            <ol className="space-y-4">
              {installSteps.map((step, index) => (
                <li key={step} className="flex gap-4">
                  <span className="shrink-0 w-8 h-8 rounded-full bg-orange-600 text-white flex items-center justify-center font-semibold">{index + 1}</span>
                  <span className="pt-1 leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </div>
          <aside className="p-6 rounded-2xl border border-amber-500/25 bg-amber-500/10 self-start">
            <h2 className="text-2xl font-bold text-balance mb-3">Privacy boundary and limits</h2>
            <p className="mb-4">The prototype has no backend and includes no remote scripts. Captured page content is processed inside the user&apos;s Chrome environment.</p>
            <p className="mb-4">On-device extraction for non-English pages is experimental when the Prompt API language is not officially supported.</p>
            <p className="text-[var(--color-text-muted)]">Desktop Chrome must expose the built-in Prompt API and meet its on-device model hardware and storage requirements.</p>
          </aside>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-balance mb-8">Implementation evidence</h2>
          <div className="grid sm:grid-cols-2 gap-4 mb-10">
            {stack.map((item) => (
              <div key={item.label} className="p-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)]">
                <p className="text-sm uppercase tracking-wide text-[var(--color-text-muted)] mb-2">{item.label}</p>
                <p className="font-semibold text-lg">{item.value}</p>
              </div>
            ))}
          </div>
          <div className="p-6 md:p-8 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 text-white flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Inspect the prototype</h2>
              <p className="text-orange-50">Read the source, run the tests, and load the unpacked extension in Chrome.</p>
            </div>
            <a
              href={repositoryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center justify-center px-5 py-3 rounded-xl bg-white text-orange-800 hover:bg-amber-50 font-semibold"
            >
              Open GitHub repository
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
