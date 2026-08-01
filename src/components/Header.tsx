'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SiteLogoMark } from '@/components/SiteLogoMark';
import { useTranslation } from '@/i18n/useTranslation';
import { localizePath, stripLocalePrefix } from '@/i18n/urlUtils';
import { type Language } from '@/i18n';
import { SITE_NAME } from '@/lib/site';

interface NavItem {
  href: string;
  labelKey: 'home' | 'blog' | 'articles' | 'jobs' | 'tools' | 'games' | 'projects';
}

const navItems: NavItem[] = [
  { href: '/', labelKey: 'home' },
  { href: '/posts', labelKey: 'blog' },
  { href: '/articles', labelKey: 'articles' },
  { href: '/jobs', labelKey: 'jobs' },
  { href: '/tools', labelKey: 'tools' },
  { href: '/games', labelKey: 'games' },
  { href: '/projects', labelKey: 'projects' },
];

const LANG_FLAGS: { lang: Language; flag: string; label: string }[] = [
  { lang: 'en', flag: '🇺🇸', label: 'English' },
  { lang: 'pt', flag: '🇧🇷', label: 'Português' },
];

export default function Header() {
  const pathname = usePathname() ?? '/';
  const basePath = stripLocalePrefix(pathname);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { lang, t, changeLanguage, translations } = useTranslation();
  const nav = translations.common.nav;
  const darkModeLabel = t(translations.common.ui.darkMode);

  const isActive = (href: string): boolean =>
    basePath === href || (href !== '/' && basePath.startsWith(href));

  const toggleTheme = () => {
    const root = document.documentElement;
    const isDark = root.classList.toggle('dark');
    const theme = isDark ? 'dark' : 'light';
    root.style.colorScheme = theme;
    localStorage.setItem('theme', theme);
  };

  return (
    <header className="sticky top-0 z-50 bg-[var(--color-bg)]/80 backdrop-blur-lg border-b border-[var(--color-border)]">
      <nav className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link
          href={localizePath('/', lang)}
          className="flex items-center gap-3 font-bold text-lg group"
        >
          <SiteLogoMark className="group-hover:shadow-primary-500/40 transition-shadow" />
          <span className="hidden sm:inline text-[var(--color-text)]">{SITE_NAME}</span>
        </Link>

        <div className="flex items-center gap-1">
          <ul className="hidden sm:flex items-center">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={localizePath(item.href, lang)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? 'text-primary-600 dark:text-primary-400 bg-primary-500/10'
                      : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-card-hover)]'
                  }`}
                >
                  {t(nav[item.labelKey])}
                </Link>
              </li>
            ))}
          </ul>

          <div
            className="ml-2 flex items-center gap-0.5 rounded-lg border border-[var(--color-border)] p-0.5"
            role="group"
            aria-label="Language"
          >
            {LANG_FLAGS.map(({ lang: code, flag, label }) => (
              <button
                key={code}
                type="button"
                onClick={() => changeLanguage(code)}
                className={`px-1.5 py-1 rounded-md text-base leading-none transition-colors ${
                  lang === code
                    ? 'bg-primary-500/15 ring-1 ring-primary-500/40'
                    : 'opacity-60 hover:opacity-100 hover:bg-[var(--color-card-hover)]'
                }`}
                aria-label={label}
                aria-pressed={lang === code}
                title={label}
              >
                <span aria-hidden="true">{flag}</span>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            className="ml-1 p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-card-hover)] transition-colors"
            aria-label={darkModeLabel}
          >
            <svg className="w-5 h-5 hidden dark:block" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <svg className="w-5 h-5 block dark:hidden" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            className="sm:hidden p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-card-hover)] transition-colors"
            aria-label={t({ en: 'Toggle menu', pt: 'Abrir menu' })}
          >
            {mobileOpen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <div className="sm:hidden border-t border-[var(--color-border)] bg-[var(--color-bg)]">
          <ul className="px-4 py-3 space-y-1">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={localizePath(item.href, lang)}
                  onClick={() => setMobileOpen(false)}
                  className={`block py-2.5 px-4 rounded-lg font-medium transition-colors ${
                    isActive(item.href)
                      ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400'
                      : 'text-[var(--color-text-muted)] hover:bg-[var(--color-card-hover)] hover:text-[var(--color-text)]'
                  }`}
                >
                  {t(nav[item.labelKey])}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
}
