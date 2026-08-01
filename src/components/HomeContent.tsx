'use client';

import { useTranslation } from '../i18n/useTranslation';
import { localizePath } from '@/i18n/urlUtils';

// Hero Section
export function HeroSection() {
  const { t, translations, lang } = useTranslation();
  const idx = translations.common.index;
  const nav = translations.common.nav;

  return (
    <section className="py-20 md:py-32 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="space-y-8">
          <div className="space-y-4">
            <p className="text-sm font-medium text-primary-600 dark:text-primary-400 tracking-wide uppercase">
              {t(idx.welcome)}
            </p>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight">
              {t(idx.greeting)} <span className="gradient-text">lacorte.dev</span>
            </h1>
            <p className="text-xl md:text-2xl text-[var(--color-text-muted)] leading-relaxed max-w-2xl">
              {t(idx.heroDescription)}
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            <a href={localizePath('/posts', lang)} className="btn btn-primary">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              {t(idx.readBlog)}
            </a>
            <a href={localizePath('/projects', lang)} className="btn btn-outline">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              {t(nav.projects)}
            </a>
            <a
              href="https://github.com/lacorte"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost text-[var(--color-text-muted)]"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              GitHub
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

// Recent Posts Header
export function RecentPostsHeader() {
  const { t, translations, lang } = useTranslation();
  const idx = translations.common.index;

  return (
    <div className="flex items-end justify-between mb-10">
      <div>
        <p className="text-sm font-medium text-primary-600 dark:text-primary-400 mb-2">{t(idx.latestPosts)}</p>
        <h2 className="text-3xl font-bold">{t(idx.recentPosts)}</h2>
      </div>
      <a
        href={localizePath('/posts', lang)}
        className="text-sm font-medium text-[var(--color-text-muted)] hover:text-primary-600 dark:hover:text-primary-400 transition-colors flex items-center gap-1"
      >
        {t(idx.viewAll)}
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </a>
    </div>
  );
}

// No Posts Message
export function NoPostsMessage() {
  const { t, translations } = useTranslation();
  const idx = translations.common.index;

  return (
    <div className="text-center py-16 px-6 rounded-2xl border border-dashed border-[var(--color-border)]">
      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary-500/10 flex items-center justify-center">
        <svg className="w-8 h-8 text-primary-500" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
        </svg>
      </div>
      <p className="text-lg font-medium mb-1">{t(idx.noPosts)}</p>
      <p className="text-sm text-[var(--color-text-muted)]">{t(idx.comingSoon)}</p>
    </div>
  );
}

// Popular Tools Section
export function PopularToolsSection() {
  const { t, translations, lang } = useTranslation();
  const idx = translations.common.index;

  const tools = [
    { href: '/tools/json', icon: '{ }', name: idx.jsonFormatter },
    { href: '/tools/qr-code', icon: '📱', name: idx.qrCode },
    { href: '/tools/color', icon: '🌈', name: idx.colorConverter },
    { href: '/tools/image-resizer', icon: '📐', name: idx.imageResizer },
    { href: '/tools/base64', icon: '🔄', name: idx.base64 },
    { href: '/tools/utm', icon: '📊', name: idx.utmBuilder },
    { href: '/tools/regex', icon: '🔍', name: idx.regexTester },
    { href: '/tools/password', icon: '🔐', name: idx.passwordGenerator },
  ];

  return (
    <section className="py-16 px-6 border-t border-[var(--color-border)]">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-sm font-medium text-primary-600 dark:text-primary-400 mb-2">{t(idx.webTools)}</p>
            <h2 className="text-3xl font-bold">{t(idx.popularTools)}</h2>
          </div>
          <a
            href={localizePath('/tools', lang)}
            className="text-sm font-medium text-[var(--color-text-muted)] hover:text-primary-600 dark:hover:text-primary-400 transition-colors flex items-center gap-1"
          >
            {t(idx.viewAll)}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {tools.map((tool) => (
            <a key={tool.href} href={localizePath(tool.href, lang)} className="group p-4 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)] hover:border-primary-500 hover:shadow-lg transition-all text-center">
              <span className="text-3xl mb-2 block">{tool.icon}</span>
              <span className="font-medium group-hover:text-primary-500 transition-colors">{t(tool.name)}</span>
            </a>
          ))}
        </div>

        <div className="mt-6 text-center">
          <a href={localizePath('/tools', lang)} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary-500 text-white font-medium hover:bg-primary-600 transition-colors">
            26{t(idx.seeAllTools)}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}

// Games Banner — always points at /games (not archived /projects/* routes)
export function GameCenterBanner() {
  const { t, translations, lang } = useTranslation();
  const idx = translations.common.index;

  return (
    <section className="py-16 px-6 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-orange-500/10 border-t border-[var(--color-border)]">
      <div className="max-w-4xl mx-auto">
        <a href={localizePath('/games', lang)} className="block group">
          <div className="flex flex-col md:flex-row items-center gap-8 p-8 bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] hover:border-primary-500/50 transition-all hover:shadow-xl">
            <div className="flex gap-2 text-5xl">
              <span className="animate-bounce" style={{ animationDelay: '0s' }}>🎮</span>
              <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>🎰</span>
              <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>🎡</span>
            </div>
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-2xl font-bold mb-2 group-hover:text-primary-500 transition-colors">
                {t(idx.gameCenterOpen)}
              </h2>
              <p className="text-[var(--color-text-muted)] mb-4">
                {t(idx.gameCenterDesc)}
              </p>
              <span className="inline-flex items-center gap-2 text-primary-500 font-medium">
                {t(idx.playNow)}
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </div>
          </div>
        </a>
      </div>
    </section>
  );
}

// Projects Section — games live under /games; catalog is currently empty
export function ProjectsSection() {
  const { t, translations, lang } = useTranslation();
  const idx = translations.common.index;
  const nav = translations.common.nav;

  return (
    <section className="py-20 px-6 bg-[var(--color-card)] border-t border-[var(--color-border)]">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-sm font-medium text-primary-600 dark:text-primary-400 mb-2">{t(idx.sideProjects)}</p>
            <h2 className="text-3xl font-bold">{t(nav.projects)}</h2>
          </div>
          <a
            href={localizePath('/projects', lang)}
            className="text-sm font-medium text-[var(--color-text-muted)] hover:text-primary-600 dark:hover:text-primary-400 transition-colors flex items-center gap-1"
          >
            {t(idx.viewAll)}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>

        <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-bg)] px-6 py-12 text-center">
          <p className="text-xl font-semibold mb-2">{t(idx.noProjectsYet)}</p>
          <p className="text-[var(--color-text-muted)] mb-6 max-w-md mx-auto">{t(idx.noProjectsHint)}</p>
          <a
            href={localizePath('/games', lang)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 text-white font-medium hover:bg-primary-700 transition-colors"
          >
            {t(idx.browseGames)}
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
