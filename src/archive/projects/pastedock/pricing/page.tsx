import type { Metadata } from 'next';
import Link from 'next/link';
import { ProjectBreadcrumb } from '@/components/projects/ProjectPageParts';
import { absoluteUrl } from '@/lib/site';

const supportEmail = 'direcision@gmail.com';
const lastUpdated = 'February 16, 2026';

export const metadata: Metadata = {
  title: 'PasteDock Pricing | US$4.99 One-Time',
  description: 'PasteDock pricing: US$4.99 one-time purchase for macOS 14+.',
  alternates: { canonical: absoluteUrl('/projects/pastedock/pricing') },
};

export default function PasteDockPricingPage() {
  return (
    <>
      <section className="py-16 px-4 bg-gradient-to-b from-emerald-500/10 to-transparent">
        <div className="max-w-4xl mx-auto">
          <ProjectBreadcrumb items={[
            { label: 'Home', href: '/' },
            { label: 'Projects', href: '/projects' },
            { label: 'PasteDock', href: '/projects/pastedock' },
            { label: 'Pricing' },
          ]} />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">PasteDock Pricing</h1>
          <p className="text-[var(--color-text-muted)]">Last updated: {lastUpdated}</p>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <article className="p-8 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)]">
            <p className="text-sm uppercase tracking-wide text-[var(--color-text-muted)] mb-2">One-time purchase</p>
            <h2 className="text-4xl font-bold mb-2">US$4.99</h2>
            <p className="text-[var(--color-text-muted)] mb-4">Single payment. No subscription.</p>
          </article>

          <article className="p-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] space-y-3">
            <h2 className="text-xl font-semibold">What is included</h2>
            <ul className="list-disc pl-5 text-[var(--color-text-muted)] space-y-2">
              <li>Full access to PasteDock for macOS 14+</li>
              <li>Updates according to current release policy</li>
              <li>Email support at <a className="underline" href={`mailto:${supportEmail}`}>{supportEmail}</a></li>
            </ul>
          </article>

          <article className="p-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] space-y-3">
            <h2 className="text-xl font-semibold">Legal and support</h2>
            <p className="text-[var(--color-text-muted)]">
              <Link className="underline" href="/projects/pastedock/terms">Terms</Link>
              <span className="mx-2">·</span>
              <Link className="underline" href="/projects/pastedock/privacy">Privacy</Link>
              <span className="mx-2">·</span>
              <Link className="underline" href="/projects/pastedock/refund">Refund</Link>
            </p>
          </article>
        </div>
      </section>
    </>
  );
}
