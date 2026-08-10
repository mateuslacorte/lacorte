'use client';

import { useEffect, useState } from 'react';
import type { Language } from '@/i18n';
import { useTranslation } from '@/i18n/useTranslation';

type HistoryItem = {
  shortUrl: string;
  targetUrl: string;
  code: string;
  createdAt: string;
};

const HISTORY_KEY = 'lacorte-short-links';
const MAX_HISTORY = 20;

function loadHistory(): HistoryItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as HistoryItem[];
    return Array.isArray(parsed) ? parsed.slice(0, MAX_HISTORY) : [];
  } catch {
    return [];
  }
}

function saveHistory(items: HistoryItem[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, MAX_HISTORY)));
  } catch {
    /* ignore quota */
  }
}

export default function LinkShortener({ lang: initialLang }: { lang?: Language } = {}) {
  const { t, translations } = useTranslation(initialLang);
  const tt = translations.tools.linkShortener;
  const tc = translations.tools.common;

  const [url, setUrl] = useState('');
  const [shortUrl, setShortUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  const shorten = async () => {
    setError('');
    setShortUrl('');
    setCopied(false);
    const trimmed = url.trim();
    if (!trimmed) {
      setError(t(tt.emptyUrl));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/short-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed }),
      });
      const data = (await res.json()) as {
        shortUrl?: string;
        targetUrl?: string;
        code?: string;
        createdAt?: string;
        error?: string;
      };

      if (!res.ok || !data.shortUrl || !data.code || !data.targetUrl) {
        setError(data.error ? data.error : t(tt.createFailed));
        return;
      }

      setShortUrl(data.shortUrl);
      const item: HistoryItem = {
        shortUrl: data.shortUrl,
        targetUrl: data.targetUrl,
        code: data.code,
        createdAt: data.createdAt ?? new Date().toISOString(),
      };
      const next = [item, ...history.filter((h) => h.code !== item.code)];
      setHistory(next);
      saveHistory(next);
    } catch {
      setError(t(tt.createFailed));
    } finally {
      setLoading(false);
    }
  };

  const copy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const clearHistory = () => {
    setHistory([]);
    saveHistory([]);
  };

  return (
    <div className="flex flex-col gap-6">
      <p className="text-[var(--color-text-muted)]">{t(tt.intro)}</p>

      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void shorten();
          }}
          placeholder={t(tt.urlPlaceholder)}
          className="flex-1 px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)]
            focus:outline-none focus:ring-2 focus:ring-primary-500/40"
          autoComplete="url"
          inputMode="url"
        />
        <button
          type="button"
          onClick={() => void shorten()}
          disabled={loading}
          className="px-6 py-3 rounded-xl bg-primary-500 text-primary-950 font-medium
            hover:bg-primary-600 disabled:opacity-50 transition-colors shrink-0"
        >
          {loading ? t(tt.shortening) : t(tt.shorten)}
        </button>
      </div>

      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {t(tc.error)}: {error}
        </p>
      ) : null}

      {shortUrl ? (
        <div className="p-5 rounded-2xl border border-primary-500/30 bg-primary-500/10 space-y-3">
          <p className="text-sm font-medium text-primary-800 dark:text-primary-200">{t(tt.yourLink)}</p>
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <a
              href={shortUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 font-mono text-lg break-all text-primary-700 dark:text-primary-300 hover:underline"
            >
              {shortUrl}
            </a>
            <button
              type="button"
              onClick={() => void copy(shortUrl)}
              className="px-4 py-2 rounded-lg bg-primary-600 text-primary-950 text-sm font-medium hover:bg-primary-700 transition-colors shrink-0"
            >
              {copied ? t(tc.copied) : t(tc.copy)}
            </button>
          </div>
        </div>
      ) : null}

      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 space-y-2 text-sm text-[var(--color-text-muted)]">
        <p className="font-medium text-[var(--color-text)]">{t(tt.notesTitle)}</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>{t(tt.note1)}</li>
          <li>{t(tt.note2)}</li>
          <li>{t(tt.note3)}</li>
        </ul>
      </div>

      {history.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-semibold">{t(tt.historyTitle)}</h3>
            <button
              type="button"
              onClick={clearHistory}
              className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            >
              {t(tt.clearHistory)}
            </button>
          </div>
          <ul className="divide-y divide-[var(--color-border)] rounded-xl border border-[var(--color-border)] overflow-hidden">
            {history.map((item) => (
              <li key={item.code} className="p-4 bg-[var(--color-card)] flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <a
                    href={item.shortUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-primary-600 dark:text-primary-400 hover:underline break-all"
                  >
                    {item.shortUrl}
                  </a>
                  <p className="text-sm text-[var(--color-text-muted)] truncate" title={item.targetUrl}>
                    {item.targetUrl}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void copy(item.shortUrl)}
                  className="text-sm text-primary-600 dark:text-primary-400 hover:underline shrink-0 self-start sm:self-center"
                >
                  {t(tc.copy)}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
