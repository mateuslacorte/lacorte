import type { Metadata } from 'next';
import Chat from '@/components/Chat';
import { parseLocale } from '@/i18n';
import { anonymousChatSeo } from '@/data/tools';
import { localeAlternates, localeOpenGraph } from '@/lib/localeMetadata';

interface AnonymousChatPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: AnonymousChatPageProps): Promise<Metadata> {
  const lang = parseLocale((await params).locale);
  const seo = anonymousChatSeo[lang];

  return {
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords,
    alternates: localeAlternates('/anonymous-chat', lang),
    openGraph: localeOpenGraph(lang, {
      title: seo.title,
      description: seo.description,
      urlPath: '/anonymous-chat',
    }),
  };
}

export default function AnonymousChatPage() {
  return (
    <div className="chat-container px-4 py-2" style={{ height: 'calc(100vh - 140px)' }}>
      <Chat />
    </div>
  );
}
