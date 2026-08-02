'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import { toolsConfig } from '@/data/tools';
import { useTranslation } from '@/i18n/useTranslation';
import { localizePath } from '@/i18n/urlUtils';
import type { Language } from '@/i18n';

interface SearchTool {
  slug: string;
  title: string;
  description: string;
  icon: string;
  keywords: string[];
  href: string;
}

export default function ToolSearch({ lang: routeLang }: { lang?: Language } = {}) {
  const { t, lang, translations } = useTranslation(routeLang);
  const tp = translations.tools.toolsPage;
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const searchableTools = useMemo<SearchTool[]>(
    () =>
      toolsConfig.map((tool) => {
        const seo = tool.seo[lang];
        return {
          slug: tool.slug,
          title: seo.title.split(' - ')[0],
          description: seo.description,
          icon: tool.icon,
          keywords: [...tool.seo.en.keywords, ...tool.seo.pt.keywords],
          href: localizePath(`/tools/${tool.slug}`, lang),
        };
      }),
    [lang],
  );

  const filteredTools = useMemo(() => {
    if (!query.trim()) return [];

    const lowerQuery = query.toLowerCase();
    return searchableTools
      .filter(
        (tool) =>
          tool.title.toLowerCase().includes(lowerQuery) ||
          tool.description.toLowerCase().includes(lowerQuery) ||
          tool.keywords.some((k) => k.toLowerCase().includes(lowerQuery)),
      )
      .slice(0, 8);
  }, [query, searchableTools]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredTools]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }

      if (e.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || filteredTools.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filteredTools.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredTools[selectedIndex]) {
          window.location.href = filteredTools[selectedIndex].href;
        }
        break;
    }
  };

  return (
    <div className="relative w-full max-w-md">
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-muted)]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          onKeyDown={handleKeyDown}
          placeholder={t(tp.searchPlaceholder)}
          className="w-full pl-10 pr-4 py-3 rounded-xl
            bg-[var(--color-card)] border border-[var(--color-border)]
            focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20
            outline-none transition-all
            text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]"
        />
        <kbd
          className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2
          items-center gap-1 px-2 py-1 rounded
          bg-[var(--color-card-hover)] text-[var(--color-text-muted)]
          text-xs font-mono border border-[var(--color-border)]"
        >
          ⌘K
        </kbd>
      </div>

      {isOpen && filteredTools.length > 0 && (
        <div
          ref={listRef}
          className="absolute z-50 w-full mt-2 py-2 rounded-xl
            bg-[var(--color-card)] border border-[var(--color-border)]
            shadow-xl max-h-96 overflow-auto"
        >
          {filteredTools.map((tool, index) => (
            <Link
              key={tool.slug}
              href={tool.href}
              className={`flex items-center gap-3 px-4 py-3 transition-colors
                ${
                  index === selectedIndex
                    ? 'bg-primary-500/10 text-primary-500'
                    : 'hover:bg-[var(--color-card-hover)]'
                }`}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <span className="text-xl">{tool.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="font-medium">{tool.title}</div>
                <div className="text-sm text-[var(--color-text-muted)] truncate">{tool.description}</div>
              </div>
              <svg
                className="w-4 h-4 text-[var(--color-text-muted)]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>
      )}

      {isOpen && query && filteredTools.length === 0 && (
        <div
          className="absolute z-50 w-full mt-2 py-8 rounded-xl
          bg-[var(--color-card)] border border-[var(--color-border)]
          shadow-xl text-center text-[var(--color-text-muted)]"
        >
          <p>{t(tp.noResults)}</p>
          <p className="text-sm mt-1">{t(tp.noResultsHint)}</p>
        </div>
      )}
    </div>
  );
}
