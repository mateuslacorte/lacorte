import { notFound } from 'next/navigation';
import { locales, parseLocale, htmlLang, type Language } from '@/i18n';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale: raw } = await params;
  if (!locales.includes(raw as Language)) notFound();
  const locale = parseLocale(raw);

  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: `document.documentElement.lang=${JSON.stringify(htmlLang(locale))};`,
        }}
      />
      {children}
    </>
  );
}
