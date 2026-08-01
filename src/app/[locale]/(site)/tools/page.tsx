import type { Metadata } from 'next';
import ToolsPageHeader from '@/components/tools/ToolsPageHeader';
import ToolSearch from '@/components/tools/ToolSearch';
import ToolsGrid from '@/components/tools/ToolsGrid';
import RecentTools from '@/components/tools/RecentTools';
import ToolsPageInfo from '@/components/tools/ToolsPageInfo';
import { parseLocale } from '@/i18n';
import { localeAlternates, localeOpenGraph } from '@/lib/localeMetadata';
import { toolCategories, toolsGridItemsWithChat } from '@/lib/toolsList';

interface ToolsPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: ToolsPageProps): Promise<Metadata> {
  const lang = parseLocale((await params).locale);
  const title = lang === 'pt' ? 'Ferramentas online' : 'Online Tools';
  const description =
    lang === 'pt'
      ? 'Ferramentas web úteis para desenvolvedores, designers, marketers e PMs — QR codes, senhas, conversores, utilitários e mais.'
      : 'Useful web tools for developers, designers, marketers, and PMs — QR codes, passwords, converters, developer utilities, and more.';

  return {
    title,
    description,
    alternates: localeAlternates('/tools', lang),
    openGraph: localeOpenGraph(lang, { title, description, urlPath: '/tools' }),
  };
}

export default function ToolsPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <ToolsPageHeader />
      <div className="mb-6">
        <ToolSearch />
      </div>
      <RecentTools className="mb-8" />
      <ToolsGrid tools={toolsGridItemsWithChat} categories={toolCategories} />
      <ToolsPageInfo />
    </div>
  );
}
