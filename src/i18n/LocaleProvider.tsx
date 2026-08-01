'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { defaultLang, type Language } from '@/i18n';

const LocaleContext = createContext<Language>(defaultLang);

export function LocaleProvider({
  locale,
  children,
}: {
  locale: Language;
  children: ReactNode;
}) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

export function useLocale(): Language {
  return useContext(LocaleContext);
}
