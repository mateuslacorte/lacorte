'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import FavoriteButton from '@/components/tools/FavoriteButton';
import ShareButton from '@/components/tools/ShareButton';
import BookmarkPrompt from '@/components/tools/BookmarkPrompt';
import RelatedTools from '@/components/tools/RelatedTools';
import { getToolComponent } from '@/components/tools/registry';
import { trackToolVisit } from '@/lib/userData';
import { useTranslation } from '@/i18n/useTranslation';
import { localizePath } from '@/i18n/urlUtils';
import type { Language } from '@/i18n';

interface ToolPageClientProps {
  slug: string;
  title: string;
  icon: string;
  description: string;
  category: string;
  lang?: Language;
}

export default function ToolPageClient({
  slug,
  title,
  icon,
  description,
  category,
  lang: routeLang,
}: ToolPageClientProps) {
  const { t, lang, translations } = useTranslation(routeLang);
  const nav = translations.common.nav;
  const ToolComponent = getToolComponent(slug);
  const shortTitle = title.split(' - ')[0];

  useEffect(() => {
    trackToolVisit(slug, shortTitle, icon);
  }, [slug, shortTitle, icon]);

  if (!ToolComponent) {
    return null;
  }

  return (
    <section className="py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <nav className="text-sm mb-6">
          <ol className="flex items-center gap-2 text-[var(--color-text-muted)]">
            <li>
              <Link href={localizePath('/', lang)} className="hover:text-primary-500">
                {t(nav.home)}
              </Link>
            </li>
            <li>/</li>
            <li>
              <Link href={localizePath('/tools', lang)} className="hover:text-primary-500">
                {t(nav.tools)}
              </Link>
            </li>
            <li>/</li>
            <li className="text-[var(--color-text)]">{shortTitle}</li>
          </ol>
        </nav>

        <header className="mb-8">
          <div className="flex items-start gap-4 mb-4">
            <span className="text-4xl">{icon}</span>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="text-3xl md:text-4xl font-bold">{shortTitle}</h1>
                <FavoriteButton slug={slug} title={shortTitle} icon={icon} />
                <ShareButton title={title} description={description} />
              </div>
              <p className="text-[var(--color-text-muted)] text-lg">{description}</p>
            </div>
          </div>
        </header>

        <div className="bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] p-4 md:p-8">
          <ToolComponent lang={lang} />
        </div>

        <RelatedTools currentSlug={slug} currentCategory={category} lang={lang} />
        <BookmarkPrompt lang={lang} />
      </div>
    </section>
  );
}
