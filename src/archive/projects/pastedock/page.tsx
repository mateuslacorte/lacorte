import type { Metadata } from 'next';
import Link from 'next/link';
import { FeatureCard, JsonLd, ProjectBreadcrumb } from '@/components/projects/ProjectPageParts';
import { absoluteUrl } from '@/lib/site';

const pageTitle = 'PasteDock | macOS Menu Bar Clipboard Manager';
const pageDescription = 'PasteDock is a clipboard manager for macOS 14+ that lets you quickly search and restore recent clipboard history from the menu bar.';

const dmgUrl = 'https://github.com/lacorte/PasteDock/releases/latest/download/PasteDock.dmg';
const checksumUrl = 'https://github.com/lacorte/PasteDock/releases/latest/download/PasteDock.dmg.sha256';
const supportEmail = 'direcision@gmail.com';
const priceDisplay = 'US$4.99 one-time';

const features = [
  { title: 'Menu Bar Quick Picker', description: 'Open the quick picker with a shortcut and instantly find the clipboard item you need.' },
  { title: 'Text, Image, and File Support', description: 'Capture core clipboard types with type-specific previews and restore behavior.' },
  { title: 'Reliable Local Storage', description: 'Store clipboard history locally with SQLite and auto-trim old items using retention policies.' },
];

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: { canonical: absoluteUrl('/projects/pastedock') },
};

export default function PasteDockPage() {
  return (
    <>
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'PasteDock',
        description: pageDescription,
        applicationCategory: 'UtilitiesApplication',
        operatingSystem: 'macOS 14+',
        offers: { '@type': 'Offer', price: '4.99', priceCurrency: 'USD' },
        url: dmgUrl,
      }} />

      <section className="py-16 px-4 bg-gradient-to-b from-emerald-500/10 to-transparent">
        <div className="max-w-5xl mx-auto">
          <ProjectBreadcrumb items={[
            { label: 'Home', href: '/' },
            { label: 'Projects', href: '/projects' },
            { label: 'PasteDock' },
          ]} />

          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 flex items-center gap-3">
              <span>📋</span> PasteDock
            </h1>
            <p className="text-xl text-[var(--color-text-muted)] mb-8">
              A menu bar clipboard manager that helps you search and restore copied content in seconds.
            </p>

            <div className="flex flex-wrap gap-4 mb-4">
              <Link href={dmgUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition-colors">
                Download DMG
              </Link>
              <Link href={checksumUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-6 py-3 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-card-hover)] font-medium transition-colors">
                Download SHA256
              </Link>
              <Link href="/projects/pastedock/pricing" className="inline-flex items-center px-6 py-3 rounded-xl border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10 font-medium transition-colors">
                View Pricing
              </Link>
            </div>

            <p className="text-sm text-[var(--color-text-muted)] mb-8">
              Policies:
              <Link href="/projects/pastedock/terms" className="underline hover:text-[var(--color-text)] ml-1">Terms</Link>
              <span className="mx-1">·</span>
              <Link href="/projects/pastedock/privacy" className="underline hover:text-[var(--color-text)]">Privacy</Link>
              <span className="mx-1">·</span>
              <Link href="/projects/pastedock/refund" className="underline hover:text-[var(--color-text)]">Refund</Link>
              <span className="mx-2">·</span>
              Support: <a href={`mailto:${supportEmail}`} className="underline">{supportEmail}</a>
              <span className="mx-2">·</span>
              <Link href="/projects/pastedock/pricing" className="underline">{priceDisplay}</Link>
            </p>
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
