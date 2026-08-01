import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { parseLocale } from '@/i18n';
import { LocaleProvider } from '@/i18n/LocaleProvider';

interface SiteLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function SiteLayout({ children, params }: SiteLayoutProps) {
  const { locale: raw } = await params;
  const locale = parseLocale(raw);

  return (
    <LocaleProvider locale={locale}>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer lang={locale} />
    </LocaleProvider>
  );
}
