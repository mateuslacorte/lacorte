/** Archived — not routed. Kept for design reference; UI in src/components/dashboard/. */
import type { Metadata } from 'next';
import ExchangeRatesPanel from '@/components/dashboard/ExchangeRatesPanel';

export const metadata: Metadata = {
  title: 'FX Rates',
  description: 'Daily exchange-rate indicators in one view',
  robots: { index: false, follow: true },
};

export default function FxRatesArchivePage() {
  return (
    <section className="py-16 md:py-20 px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="space-y-3">
          <p className="text-sm font-medium text-primary-600 dark:text-primary-400">FX Rates (archived)</p>
          <h1 className="text-3xl md:text-4xl font-bold">Daily metrics</h1>
          <p className="text-[var(--color-text-muted)]">
            A quick view of exchange rates I check often.
          </p>
        </header>

        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6">
          <ExchangeRatesPanel />
        </div>
      </div>
    </section>
  );
}
