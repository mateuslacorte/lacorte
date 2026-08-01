import type { Metadata } from 'next';
import Link from 'next/link';
import { ProjectBreadcrumb } from '@/components/projects/ProjectPageParts';
import { absoluteUrl } from '@/lib/site';

const lastUpdated = 'February 16, 2026';

export const metadata: Metadata = {
  title: 'PasteDock Refund Policy',
  description: 'Refund Policy for PasteDock purchases.',
  alternates: { canonical: absoluteUrl('/projects/pastedock/refund') },
};

export default function PasteDockRefundPage() {
  return (
    <>
      <section className="py-16 px-4 bg-gradient-to-b from-emerald-500/10 to-transparent">
        <div className="max-w-4xl mx-auto">
          <ProjectBreadcrumb items={[
            { label: 'Home', href: '/' },
            { label: 'Projects', href: '/projects' },
            { label: 'PasteDock', href: '/projects/pastedock' },
            { label: 'Refund' },
          ]} />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Refund Policy</h1>
          <p className="text-[var(--color-text-muted)]">Last updated: {lastUpdated}</p>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {[
            { title: '1. Eligibility', body: <>You can request a full refund within <strong>7 days</strong> of purchase.</> },
            { title: '2. How to Request', body: <>Send your request to <a className="underline" href="mailto:direcision@gmail.com">direcision@gmail.com</a> with your purchase email and transaction reference.</> },
            { title: '3. Processing', body: 'Refunds are processed through Paddle to the original payment method.' },
            { title: '4. Exceptions', body: 'We may deny refund requests in cases of abuse or fraud.' },
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
