/** Archived — not routed. Kept for design reference only (no sample data). */
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Content OS',
  description: 'Archived content operations dashboard layout reference',
  robots: { index: false, follow: true },
};

export default function ContentOsArchivePage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">ARCHIVED REFERENCE</p>
      <h1 className="mt-2 text-4xl font-bold">Content OS (archived)</h1>
      <p className="mt-4 text-[var(--color-text-muted)]">
        Live curation lives at /admin/content.
      </p>
    </main>
  );
}
