'use client';

import { useState, useCallback } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import type { Language } from '../../i18n';

function generateUUID(): string {
  if (crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export default function UuidGenerator({ lang: initialLang }: { lang?: Language } = {}) {
  const { t, translations } = useTranslation(initialLang);
  const tt = translations.tools.uuid;
  const tc = translations.tools.common;

  const [uuids, setUuids] = useState<string[]>([generateUUID()]);
  const [count, setCount] = useState(1);
  const [uppercase, setUppercase] = useState(false);
  const [hyphens, setHyphens] = useState(true);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const generate = useCallback(() => {
    const newUuids: string[] = [];
    for (let i = 0; i < count; i++) {
      let uuid = generateUUID();
      if (!hyphens) uuid = uuid.replace(/-/g, '');
      if (uppercase) uuid = uuid.toUpperCase();
      newUuids.push(uuid);
    }
    setUuids(newUuids);
    setCopiedIndex(null);
    setCopiedAll(false);
  }, [count, uppercase, hyphens]);

  const copyUuid = async (uuid: string, index: number) => {
    try {
      await navigator.clipboard.writeText(uuid);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const copyAll = async () => {
    try {
      await navigator.clipboard.writeText(uuids.join('\n'));
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const formatUuid = (uuid: string): string => {
    let formatted = uuid;
    if (!hyphens) formatted = formatted.replace(/-/g, '');
    if (uppercase) formatted = formatted.toUpperCase();
    else formatted = formatted.toLowerCase();
    return formatted;
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Options */}
      <div className="flex flex-wrap gap-4 items-center">
        {/* Count */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-[var(--color-text)]">{t(tt.count)}:</label>
          <input
            type="number"
            min="1"
            max="100"
            value={count}
            onChange={(e) => setCount(Math.max(1, Math.min(100, Number(e.target.value))))}
            className="w-20 px-3 py-2 rounded-lg border border-[var(--color-border)]
              bg-[var(--color-card)] text-[var(--color-text)] text-center
              focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Options checkboxes */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={uppercase}
            onChange={(e) => setUppercase(e.target.checked)}
            className="w-4 h-4 rounded border-[var(--color-border)] text-primary-500
              focus:ring-primary-500"
          />
          <span className="text-sm text-[var(--color-text)]">{t(tt.uppercase)}</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={hyphens}
            onChange={(e) => setHyphens(e.target.checked)}
            className="w-4 h-4 rounded border-[var(--color-border)] text-primary-500
              focus:ring-primary-500"
          />
          <span className="text-sm text-[var(--color-text)]">{t(tt.hyphens)}</span>
        </label>
      </div>

      {/* Generate Button */}
      <button
        onClick={generate}
        className="w-full py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg
          font-medium transition-colors flex items-center justify-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        {t(tc.generate)}
      </button>

      {/* UUIDs List */}
      <div className="space-y-2">
        {uuids.map((uuid, index) => (
          <div
            key={index}
            className="flex items-center gap-2 p-3 rounded-lg
              bg-[var(--color-card)] border border-[var(--color-border)]"
          >
            <code className="flex-1 font-mono text-[var(--color-text)] break-all">
              {formatUuid(uuid)}
            </code>
            <button
              onClick={() => copyUuid(formatUuid(uuid), index)}
              className="px-3 py-1 text-sm bg-[var(--color-bg)] hover:bg-[var(--color-card-hover)]
                border border-[var(--color-border)] rounded transition-colors whitespace-nowrap"
            >
              {copiedIndex === index ? t(tc.copied) : t(tc.copy)}
            </button>
          </div>
        ))}
      </div>

      {/* Copy All (if multiple) */}
      {uuids.length > 1 && (
        <button
          onClick={copyAll}
          className="w-full py-2 bg-[var(--color-card)] hover:bg-[var(--color-card-hover)]
            border border-[var(--color-border)] rounded-lg transition-colors"
        >
          {copiedAll
            ? t(tc.copied)
            : t({ en: 'Copy All', pt: 'Copy All' })}
        </button>
      )}

      {/* Info */}
      <div className="p-4 rounded-lg bg-[var(--color-card)] border border-[var(--color-border)]">
        <p className="text-sm text-[var(--color-text-muted)]">
          {t({ en: 'UUID v4 is randomly generated with an extremely low collision probability. Used for database IDs, session tokens, etc.', pt: 'UUID v4 is randomly generated with an extremely low collision probability. Used for database IDs, session tokens, etc.' })}
        </p>
      </div>
    </div>
  );
}
