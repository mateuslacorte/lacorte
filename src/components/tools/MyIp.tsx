'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from '@/i18n/useTranslation';
import type { Language } from '@/i18n';

type IpPayload = {
  ip: string | null;
  version: 'ipv4' | 'ipv6' | null;
  country: string | null;
  userAgent: string | null;
  acceptLanguage: string | null;
};

function countryName(code: string, lang: Language): string {
  try {
    const display = new Intl.DisplayNames([lang === 'pt' ? 'pt-BR' : 'en'], {
      type: 'region',
    });
    return display.of(code) ?? code;
  } catch {
    return code;
  }
}

export default function MyIp({ lang: initialLang }: { lang?: Language } = {}) {
  const { t, lang, translations } = useTranslation(initialLang);
  const tt = translations.tools.myIp;
  const tc = translations.tools.common;

  const [data, setData] = useState<IpPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchIp = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch('/api/ip', { cache: 'no-store' });
      if (!res.ok) throw new Error('bad status');
      const json = (await res.json()) as IpPayload;
      setData(json);
    } catch {
      setError(true);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchIp();
  }, [fetchIp]);

  const copyIp = async () => {
    if (!data?.ip) return;
    try {
      await navigator.clipboard.writeText(data.ip);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div
        className="flex flex-col items-center justify-center gap-4 py-10 px-4 rounded-xl
          bg-[var(--color-bg)] border border-[var(--color-border)]"
      >
        <p className="text-sm uppercase tracking-wide text-[var(--color-text-muted)]">
          {t(tt.yourIp)}
        </p>

        {loading ? (
          <p className="text-2xl md:text-3xl font-mono text-[var(--color-text-muted)] animate-pulse">
            {t(tt.loading)}
          </p>
        ) : error || !data?.ip ? (
          <p className="text-lg text-center text-[var(--color-text-muted)]">{t(tt.unavailable)}</p>
        ) : (
          <p
            className="text-3xl md:text-5xl font-mono font-bold text-[var(--color-text)]
              break-all text-center select-all"
          >
            {data.ip}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={copyIp}
            disabled={!data?.ip || loading}
            className="px-4 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-primary-950
              font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {copied ? t(tc.copied) : t(tc.copy)}
          </button>
          <button
            type="button"
            onClick={() => void fetchIp()}
            disabled={loading}
            className="px-4 py-2 rounded-lg border border-[var(--color-border)]
              bg-[var(--color-card)] hover:bg-[var(--color-card-hover)]
              text-[var(--color-text)] transition-colors disabled:opacity-50"
          >
            {t(tt.refresh)}
          </button>
        </div>
      </div>

      {data && !loading && !error && (
        <dl className="grid gap-3 sm:grid-cols-2">
          {data.version && (
            <div className="p-4 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)]">
              <dt className="text-xs uppercase tracking-wide text-[var(--color-text-muted)] mb-1">
                {t(tt.ipVersion)}
              </dt>
              <dd className="font-mono text-[var(--color-text)]">
                {data.version === 'ipv4' ? t(tt.ipv4) : t(tt.ipv6)}
              </dd>
            </div>
          )}
          {data.country && (
            <div className="p-4 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)]">
              <dt className="text-xs uppercase tracking-wide text-[var(--color-text-muted)] mb-1">
                {t(tt.country)}
              </dt>
              <dd className="text-[var(--color-text)]">
                {countryName(data.country, lang)}{' '}
                <span className="text-[var(--color-text-muted)] font-mono text-sm">
                  ({data.country})
                </span>
              </dd>
            </div>
          )}
          {data.acceptLanguage && (
            <div className="p-4 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] sm:col-span-2">
              <dt className="text-xs uppercase tracking-wide text-[var(--color-text-muted)] mb-1">
                {t(tt.acceptLanguage)}
              </dt>
              <dd className="font-mono text-sm text-[var(--color-text)] break-all">
                {data.acceptLanguage}
              </dd>
            </div>
          )}
          {data.userAgent && (
            <div className="p-4 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] sm:col-span-2">
              <dt className="text-xs uppercase tracking-wide text-[var(--color-text-muted)] mb-1">
                {t(tt.userAgent)}
              </dt>
              <dd className="font-mono text-sm text-[var(--color-text)] break-all">
                {data.userAgent}
              </dd>
            </div>
          )}
        </dl>
      )}

      <div className="p-4 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)]">
        <p className="text-sm font-medium text-[var(--color-text)] mb-2">{t(tt.notesTitle)}</p>
        <ul className="text-sm text-[var(--color-text-muted)] space-y-1 list-disc pl-5">
          <li>{t(tt.note1)}</li>
          <li>{t(tt.note2)}</li>
          <li>{t(tt.note3)}</li>
        </ul>
      </div>
    </div>
  );
}
