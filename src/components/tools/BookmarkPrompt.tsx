'use client';

import { useState, useEffect } from 'react';
import type { Language } from '../../i18n';

const STORAGE_KEY = 'lacorte_bookmark_dismissed';

const copy: Record<Language, { close: string; title: string; shortcut: string; suffix: string }> = {
  en: {
    close: 'Close',
    title: 'Bookmark this useful tool',
    shortcut: ' + D to add this page to your bookmarks',
    suffix: 'and find it faster next time.',
  },
  pt: {
    close: 'Fechar',
    title: 'Salve esta ferramenta nos favoritos',
    shortcut: ' + D para adicionar esta página aos favoritos',
    suffix: 'e encontre mais rápido da próxima vez.',
  },
};

interface BookmarkPromptProps {
  lang?: Language;
}

export default function BookmarkPrompt({ lang = 'en' }: BookmarkPromptProps) {
  const text = copy[lang];
  const [show, setShow] = useState(false);
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    // Check if already dismissed
    const dismissed = sessionStorage.getItem(STORAGE_KEY);
    if (!dismissed) {
      // Show after 5 seconds of tool usage
      const timer = setTimeout(() => setShow(true), 5000);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().indexOf('MAC') >= 0);
  }, []);

  const handleDismiss = () => {
    setShow(false);
    sessionStorage.setItem(STORAGE_KEY, 'true');
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
      <div className="relative max-w-sm p-4 rounded-xl bg-[var(--color-card)]
        border border-[var(--color-border)] shadow-xl"
      >
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 rounded-lg
            hover:bg-[var(--color-card-hover)] transition-colors"
          aria-label={text.close}
        >
          <svg className="w-4 h-4 text-[var(--color-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex items-start gap-3 pr-6">
          <span className="text-2xl">💡</span>
          <div>
            <p className="font-medium text-[var(--color-text)] mb-1">
              {text.title}
            </p>
            <p className="text-sm text-[var(--color-text-muted)]">
              {isMac ? '⌘' : 'Ctrl'}{text.shortcut}<br/>
              {text.suffix}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
