'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslation } from '../../i18n/useTranslation';
import { localizePath } from '@/i18n/urlUtils';
import type { Language } from '../../i18n';

interface Tool {
  slug: string;
  title: { en: string; pt?: string };
  description: { en: string; pt?: string };
  icon: string;
  category: string;
}

interface Category {
  id: string;
  label: { en: string; pt?: string };
}

interface ToolsGridProps {
  tools: Tool[];
  categories: Category[];
  lang?: Language;
}

export default function ToolsGrid({ tools, categories, lang: routeLang }: ToolsGridProps) {
  const { t, lang, translations } = useTranslation(routeLang);
  const tp = translations.tools.toolsPage;
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredTools =
    selectedCategory === 'all'
      ? tools
      : tools.filter((tool) => tool.category === selectedCategory);

  const getLocalizedText = (obj: { en: string; pt?: string }) => obj[lang] || obj.en;

  const hrefFor = (slug: string) => {
    if (slug.startsWith('/')) return localizePath(slug, lang);
    return localizePath(`/tools/${slug}`, lang);
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-8">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
              ${
                selectedCategory === category.id
                  ? 'bg-primary-500 text-white'
                  : 'bg-[var(--color-card)] hover:bg-[var(--color-card-hover)] text-[var(--color-text)] border border-[var(--color-border)]'
              }`}
          >
            {getLocalizedText(category.label)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTools.map((tool) => (
          <Link
            key={tool.slug}
            href={hrefFor(tool.slug)}
            className="group p-6 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)]
              hover:border-primary-500 hover:shadow-lg transition-all"
          >
            <div className="flex items-start gap-4">
              <span className="text-3xl">{tool.icon}</span>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-[var(--color-text)] group-hover:text-primary-500 transition-colors">
                  {getLocalizedText(tool.title)}
                </h3>
                <p className="text-sm text-[var(--color-text-muted)] mt-1">
                  {getLocalizedText(tool.description)}
                </p>
              </div>
              <svg
                className="w-5 h-5 text-[var(--color-text-muted)] group-hover:text-primary-500 transition-colors flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-8 text-center text-[var(--color-text-muted)]">
        {t(tp.totalPrefix)}{' '}
        <span className="font-bold text-[var(--color-text)]">{filteredTools.length}</span>
        {t(tp.totalSuffix)}
      </div>
    </div>
  );
}
