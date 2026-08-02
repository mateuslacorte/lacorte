'use client';

import Link from 'next/link';
import { toolsConfig } from '@/data/tools';
import { useTranslation } from '@/i18n/useTranslation';
import { localizePath } from '@/i18n/urlUtils';
import type { Language } from '@/i18n';

interface RelatedToolsProps {
  currentSlug: string;
  currentCategory: string;
  lang?: Language;
}

export default function RelatedTools({
  currentSlug,
  currentCategory,
  lang: routeLang,
}: RelatedToolsProps) {
  const { t, lang, translations } = useTranslation(routeLang);
  const relatedHeading = translations.tools.common.relatedTools;

  const relatedTools = toolsConfig
    .filter((tool) => tool.slug !== currentSlug)
    .sort((a, b) => {
      if (a.category === currentCategory && b.category !== currentCategory) return -1;
      if (a.category !== currentCategory && b.category === currentCategory) return 1;
      return 0;
    })
    .slice(0, 4)
    .map((tool) => {
      const seo = tool.seo[lang];
      return {
        slug: tool.slug,
        title: seo.title.split(' - ')[0],
        description: seo.description,
        icon: tool.icon,
      };
    });

  return (
    <section className="mt-12 pt-8 border-t border-[var(--color-border)]">
      <h2 className="text-xl font-bold text-[var(--color-text)] mb-6 flex items-center gap-2">
        <span>🔧</span> {t(relatedHeading)}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {relatedTools.map((tool) => (
          <Link
            key={tool.slug}
            href={localizePath(`/tools/${tool.slug}`, lang)}
            className="group flex items-center gap-4 p-4 rounded-xl
              bg-[var(--color-card)] border border-[var(--color-border)]
              hover:border-primary-500 hover:shadow-md transition-all"
          >
            <span className="text-2xl">{tool.icon}</span>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-[var(--color-text)] group-hover:text-primary-500 transition-colors">
                {tool.title}
              </h3>
              <p className="text-sm text-[var(--color-text-muted)] truncate">{tool.description}</p>
            </div>
            <svg
              className="w-5 h-5 text-[var(--color-text-muted)] group-hover:text-primary-500 transition-colors flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        ))}
      </div>
    </section>
  );
}
