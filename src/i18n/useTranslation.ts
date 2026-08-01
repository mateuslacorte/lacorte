// React hook for translations — locale follows LocaleProvider / URL
'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { defaultLang, setLanguage, type Language } from './index';
import { useLocale } from './LocaleProvider';
import { switchLocalePath } from './urlUtils';
import { toolTranslations } from './translations/tools';
import { gameTranslations } from './translations/games';
import { commonTranslations } from './translations/common';
import { chatTranslations } from './translations/chat';
import { pageTranslations } from './translations/pages';

const translations = {
  tools: toolTranslations,
  games: gameTranslations,
  common: commonTranslations,
  chat: chatTranslations,
  pages: pageTranslations,
} as const;

export function useTranslation(initialLang?: Language) {
  const pathname = usePathname() ?? '/';
  const router = useRouter();
  const contextLocale = useLocale();
  // Prefer URL/layout locale from LocaleProvider; avoid stale useState that can
  // keep English after navigating to /pt/...
  const lang: Language = initialLang ?? contextLocale ?? defaultLang;

  const t = useCallback(
    (translationObj: { en: string } & Partial<Record<Language, string>>): string => {
      return translationObj[lang] || translationObj[defaultLang] || translationObj.en;
    },
    [lang],
  );

  const changeLanguage = useCallback(
    (newLang: Language) => {
      setLanguage(newLang);
      router.push(switchLocalePath(pathname, newLang));
    },
    [pathname, router],
  );

  return {
    lang,
    t,
    changeLanguage,
    translations,
  };
}

export { translations };
