import type { Metadata } from 'next';
import Link from 'next/link';
import { ProjectBreadcrumb } from '@/components/projects/ProjectPageParts';
import { absoluteUrl } from '@/lib/site';

const lastUpdated = 'February 16, 2026';

export const metadata: Metadata = {
  title: 'PasteDock Privacy Policy',
  description: 'Privacy Policy for PasteDock purchases and support.',
  alternates: { canonical: absoluteUrl('/projects/pastedock/privacy') },
};

export default function PasteDockPrivacyPage() {
  return (
    <>
      <section className="py-16 px-4 bg-gradient-to-b from-emerald-500/10 to-transparent">
        <div className="max-w-4xl mx-auto">
          <ProjectBreadcrumb items={[
            { label: 'Home', href: '/' },
            { label: 'Projects', href: '/projects' },
            { label: 'PasteDock', href: '/projects/pastedock' },
            { label: 'Privacy' },
          ]} />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-[var(--color-text-muted)]">Last updated: {lastUpdated}</p>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {[
            { title: '1. Data Controller', body: <>For PasteDock purchase and support operations, the data controller is <strong>lacorte.dev (individual seller)</strong>. Contact: <a className="underline" href="mailto:direcision@gmail.com">direcision@gmail.com</a>.</> },
            { title: '2. Data We Collect', body: 'Purchase and billing details processed by Paddle, support communication details, and basic website analytics data.' },
            { title: '3. How We Use Data', body: 'Process orders, provide support, respond to refund requests, and comply with legal obligations.' },
            { title: '4. Data Sharing', body: 'We share data only with essential providers such as Paddle for payment processing.' },
            { title: '5. Your Rights', body: <>You may request access, correction, or deletion by contacting <a className="underline" href="mailto:direcision@gmail.com">direcision@gmail.com</a>.</> },
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
