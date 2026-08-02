'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getToolBySlug } from '@/data/tools';
import { useTranslation } from '@/i18n/useTranslation';
import { localizePath } from '@/i18n/urlUtils';
import type { Language } from '@/i18n';
import {
  getRecentTools,
  trackToolVisit,
  type RecentTool as Tool,
} from '../../lib/userData';

export { getRecentTools, trackToolVisit };

interface RecentToolsProps {
  className?: string;
  lang?: Language;
}

export default function RecentTools({ className = '', lang: routeLang }: RecentToolsProps) {
  const { t, lang, translations } = useTranslation(routeLang);
  const tp = translations.tools.toolsPage;
  const [tools, setTools] = useState<Tool[]>([]);

  useEffect(() => {
    setTools(getRecentTools());
  }, []);

  if (tools.length === 0) return null;

  return (
    <div className={`${className}`}>
      <h3 className="text-sm font-medium text-[var(--color-text-muted)] mb-3 flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        {t(tp.recentlyUsed)}
      </h3>
      <div className="flex flex-wrap gap-2">
        {tools.map((tool) => {
          const config = getToolBySlug(tool.slug);
          const title = config
            ? config.seo[lang].title.split(' - ')[0]
            : tool.title;
          return (
            <Link
              key={tool.slug}
              href={localizePath(`/tools/${tool.slug}`, lang)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm
              bg-[var(--color-card)] border border-[var(--color-border)]
              hover:border-primary-500 hover:text-primary-500 transition-colors"
            >
              <span>{tool.icon}</span>
              <span>{title}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
