import type { Metadata } from 'next';
import Link from 'next/link';
import { ProjectBreadcrumb } from '@/components/projects/ProjectPageParts';
import { absoluteUrl } from '@/lib/site';

const lastUpdated = 'February 16, 2026';

export const metadata: Metadata = {
  title: 'PasteDock Terms of Service',
  description: 'Terms of Service for purchasing and using PasteDock.',
  alternates: { canonical: absoluteUrl('/projects/pastedock/terms') },
};

export default function PasteDockTermsPage() {
  return (
    <>
      <section className="py-16 px-4 bg-gradient-to-b from-emerald-500/10 to-transparent">
        <div className="max-w-4xl mx-auto">
          <ProjectBreadcrumb items={[
            { label: 'Home', href: '/' },
            { label: 'Projects', href: '/projects' },
            { label: 'PasteDock', href: '/projects/pastedock' },
            { label: 'Terms' },
          ]} />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Terms of Service</h1>
          <p className="text-[var(--color-text-muted)]">Last updated: {lastUpdated}</p>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {[
            { title: '1. Seller Information', body: <>PasteDock is sold by <strong>lacorte.dev (individual seller)</strong>. Support: <a className="underline" href="mailto:direcision@gmail.com">direcision@gmail.com</a>.</> },
            { title: '2. Product Scope', body: 'PasteDock is a utility application for macOS 14+ distributed through the official download page and release artifacts.' },
            { title: '3. License Grant', body: 'After a valid purchase, you receive a non-exclusive, non-transferable license to use PasteDock.' },
            { title: '4. Payments', body: 'Payments are processed by Paddle according to checkout settings and local legal requirements.' },
            { title: '5. Refunds', body: <>See the dedicated <Link className="underline" href="/projects/pastedock/refund">Refund Policy</Link>.</> },
          ].map((section) => (
            <article key={section.title} className="p-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] space-y-3">
              <h2 className="text-xl font-semibold">{section.title}</h2>
              <p className="text-[var(--color-text-muted)]">{section.body}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
