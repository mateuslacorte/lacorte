import type { Metadata } from 'next';
import Link from 'next/link';
import { FeatureCard, JsonLd, ProjectBreadcrumb } from '@/components/projects/ProjectPageParts';
import { absoluteUrl } from '@/lib/site';

const pageTitle = 'Quick Issue | Mobile-First GitHub Issue Creator';
const pageDescription = 'Quick Issue is a PWA that helps you create GitHub issues in seconds from mobile with OAuth login, offline support, and automatic sync.';
const appUrl = 'https://quick-issue.vercel.app/';
const githubUrl = 'https://github.com/lacorte/quick-issue';

const features = [
  { title: 'Fast Issue Creation', description: 'Capture and submit issues in a few taps with a mobile-first form flow built for speed.' },
  { title: 'GitHub OAuth Login', description: 'Sign in with GitHub OAuth without managing personal access tokens manually.' },
  { title: 'Offline-First Workflow', description: 'Keep writing even without network access and sync queued issues automatically when online.' },
  { title: 'Touch-Friendly Labels', description: 'Use swipe-based label selection to quickly tag issues on small screens.' },
];

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: { canonical: absoluteUrl('/projects/quick-issue') },
};

export default function QuickIssuePage() {
  return (
    <>
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'Quick Issue',
        description: pageDescription,
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'Web Browser',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        url: appUrl,
      }} />

      <section className="py-16 px-4 bg-gradient-to-b from-indigo-500/10 to-transparent">
        <div className="max-w-5xl mx-auto">
          <ProjectBreadcrumb items={[
            { label: 'Home', href: '/' },
            { label: 'Projects', href: '/projects' },
            { label: 'Quick Issue' },
          ]} />

          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Quick Issue</h1>
            <p className="text-xl text-[var(--color-text-muted)] mb-8">
              Create GitHub issues in seconds from your phone with a fast workflow, offline support, and reliable sync.
            </p>

            <div className="flex flex-wrap gap-4 mb-8">
              <Link href={appUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors">
                Open Live App
              </Link>
              <Link href={githubUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-6 py-3 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-card-hover)] font-medium transition-colors">
                View on GitHub
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold mb-8">Core Features</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature) => (
              <FeatureCard key={feature.title} {...feature} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
