import Link from 'next/link';
import { SiteLogoMark } from '@/components/SiteLogoMark';
import { defaultLang, t, type Language } from '@/i18n';
import { localizePath } from '@/i18n/urlUtils';
import { pageTranslations } from '@/i18n/translations/pages';
import { SITE_NAME } from '@/lib/site';

interface FooterProps {
  lang?: Language;
}

export default function Footer({ lang = defaultLang }: FooterProps) {
  const currentYear = new Date().getFullYear();
  const pf = pageTranslations.footer;

  return (
    <footer className="mt-auto border-t border-[var(--color-border)]">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="flex flex-col items-center gap-6">
          <Link href={localizePath('/', lang)} className="flex items-center gap-3 font-bold text-lg group">
            <SiteLogoMark />
            <span>{SITE_NAME}</span>
          </Link>

          <nav aria-label={t(pf.siteInfo, lang)}>
            <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-[var(--color-text-muted)]">
              <li>
                <Link href={localizePath('/about', lang)} className="hover:text-[var(--color-text)] hover:underline">
                  {t(pf.about, lang)}
                </Link>
              </li>
              <li>
                <Link href={localizePath('/contact', lang)} className="hover:text-[var(--color-text)] hover:underline">
                  {t(pf.contact, lang)}
                </Link>
              </li>
              <li>
                <Link href={localizePath('/privacy', lang)} className="hover:text-[var(--color-text)] hover:underline">
                  {t(pf.privacy, lang)}
                </Link>
              </li>
            </ul>
          </nav>

          <div className="flex items-center gap-2">
            <a
              href="https://linkedin.com/in/mateuslacorte"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-card-hover)] transition-colors"
              aria-label="LinkedIn"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4.98 3.5A2.5 2.5 0 1 0 5 8.5 2.5 2.5 0 0 0 4.98 3.5zM3 9h4v12H3zm7 0h3.8v1.7h.1c.5-.9 1.8-1.9 3.7-1.9 4 0 4.7 2.5 4.7 5.8V21h-4v-5.6c0-1.3 0-3.1-1.9-3.1s-2.2 1.5-2.2 3V21h-4z" />
              </svg>
            </a>
            <a
              href="mailto:mateus@lacorte.dev"
              className="p-2.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-card-hover)] transition-colors"
              aria-label="Email"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h18v10H3V7z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="m3 8 9 6 9-6" />
              </svg>
            </a>
            <a
              href="https://github.com/mateuslacorte"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-card-hover)] transition-colors"
              aria-label="GitHub"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            </a>
          </div>

          <p className="text-sm text-[var(--color-text-muted)]">
            &copy; {currentYear} {SITE_NAME}. Built with Next.js.
          </p>
        </div>
      </div>
    </footer>
  );
}
