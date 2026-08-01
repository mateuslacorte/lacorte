import Link from 'next/link';
import { redirect } from 'next/navigation';
import { isAdminUser } from '@/lib/supabase/server';

const tabs = [
  { href: '/admin/content', label: 'Content' },
  { href: '/admin/articles', label: 'Articles' },
] as const;

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const admin = await isAdminUser().catch(() => false);
  if (!admin) {
    redirect('/login?next=/admin');
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <header className="mb-8 border-b border-[var(--color-border)] pb-6">
        <p className="mb-1 text-sm font-semibold text-primary-600 dark:text-primary-400">LACORTE.DEV ADMIN</p>
        <h1 className="text-2xl font-bold">Admin dashboard</h1>
        <nav className="mt-4 flex gap-2">
          {tabs.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm font-medium hover:border-primary-500/50 hover:text-primary-600 dark:hover:text-primary-400"
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      </header>
      {children}
    </div>
  );
}
