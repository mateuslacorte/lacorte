'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import type { Language } from '../../i18n';

export default function TimestampConverter({ lang: initialLang }: { lang?: Language } = {}) {
  const { t, lang, translations } = useTranslation(initialLang);
  const tc = translations.tools.timestamp;
  const tcc = translations.tools.common;

  const [timestamp, setTimestamp] = useState('');
  const [dateString, setDateString] = useState('');
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [unit, setUnit] = useState<'seconds' | 'milliseconds'>('seconds');

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const parseTimestamp = (ts: string): Date | null => {
    const num = parseInt(ts);
    if (isNaN(num)) return null;

    // Auto-detect: if > 10 digits, assume milliseconds
    if (ts.length > 10 || unit === 'milliseconds') {
      return new Date(num);
    }
    return new Date(num * 1000);
  };

  const parseDateString = (ds: string): number | null => {
    const date = new Date(ds);
    if (isNaN(date.getTime())) return null;
    return unit === 'milliseconds' ? date.getTime() : Math.floor(date.getTime() / 1000);
  };

  const timestampDate = parseTimestamp(timestamp);
  const dateTimestamp = parseDateString(dateString);

  const formatDate = (date: Date): string => {
    const locale = 'en-US';
    return date.toLocaleString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  const formatISO = (date: Date): string => {
    return date.toISOString();
  };

  const formatRelative = (date: Date): string => {
    const now = Date.now();
    const diff = now - date.getTime();
    const absDiff = Math.abs(diff);

    const seconds = Math.floor(absDiff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    let result = '';
    if (years > 0) result = `${years}${t(tc.yearsAgo)}`;
    else if (months > 0) result = `${months}${t(tc.monthsAgo)}`;
    else if (days > 0) result = `${days}${t(tc.daysAgo)}`;
    else if (hours > 0) result = `${hours}${t(tc.hoursAgo)}`;
    else if (minutes > 0) result = `${minutes}${t(tc.minutesAgo)}`;
    else result = `${seconds}${t(tc.secondsAgo)}`;

    return diff > 0 ? `${result} ${t(tc.ago)}` : `${result} ${t(tc.later)}`;
  };

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const currentTimestamp = unit === 'milliseconds' ? currentTime : Math.floor(currentTime / 1000);

  const commonTimes = [
    { labelKey: 'inOneHour' as const, getTs: () => Math.floor(Date.now() / 1000) + 3600 },
    { labelKey: 'tomorrow' as const, getTs: () => Math.floor(Date.now() / 1000) + 86400 },
    { labelKey: 'inOneWeek' as const, getTs: () => Math.floor(Date.now() / 1000) + 604800 },
    { labelKey: 'inOneMonth' as const, getTs: () => Math.floor(Date.now() / 1000) + 2592000 },
    { label: '2000/1/1', getTs: () => 946684800 },
    { label: '2024/1/1', getTs: () => 1704067200 },
    { label: '2025/1/1', getTs: () => 1735689600 },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Current Time */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-primary-500/10 to-primary-500/5 border border-primary-500/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-[var(--color-text-muted)]">{t(tc.currentTimestamp)}</p>
            <p className="text-2xl font-mono font-bold text-primary-500">
              {currentTimestamp}
            </p>
          </div>
          <button
            onClick={() => {
              setTimestamp(String(currentTimestamp));
              copyText(String(currentTimestamp));
            }}
            className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            {t(tc.copyAndUse)}
          </button>
        </div>
        <p className="text-sm text-[var(--color-text-muted)] mt-2">
          {formatDate(new Date(currentTime))}
        </p>
      </div>

      {/* Unit Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setUnit('seconds')}
          className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors
            ${unit === 'seconds'
              ? 'bg-primary-500 text-white'
              : 'bg-[var(--color-card)] hover:bg-[var(--color-card-hover)] text-[var(--color-text)] border border-[var(--color-border)]'
            }`}
        >
          {t(tc.seconds)}
        </button>
        <button
          onClick={() => setUnit('milliseconds')}
          className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors
            ${unit === 'milliseconds'
              ? 'bg-primary-500 text-white'
              : 'bg-[var(--color-card)] hover:bg-[var(--color-card-hover)] text-[var(--color-text)] border border-[var(--color-border)]'
            }`}
        >
          {t(tc.milliseconds)}
        </button>
      </div>

      {/* Timestamp to Date */}
      <div className="p-4 rounded-lg bg-[var(--color-card)] border border-[var(--color-border)]">
        <h3 className="font-medium text-[var(--color-text)] mb-4">⏱️ {t(tc.timestampToDate)}</h3>
        <div className="space-y-4">
          <input
            type="text"
            value={timestamp}
            onChange={(e) => setTimestamp(e.target.value.replace(/\D/g, ''))}
            placeholder={unit === 'milliseconds' ? '1704067200000' : '1704067200'}
            className="w-full px-4 py-3 rounded-lg border border-[var(--color-border)]
              bg-[var(--color-bg)] text-[var(--color-text)] font-mono
              focus:outline-none focus:ring-2 focus:ring-primary-500"
          />

          {timestampDate && (
            <div className="space-y-2">
              <div className="p-3 rounded-lg bg-[var(--color-bg)]">
                <p className="text-sm text-[var(--color-text-muted)]">{t(tc.localTime)}</p>
                <p className="font-medium text-[var(--color-text)]">{formatDate(timestampDate)}</p>
              </div>
              <div className="p-3 rounded-lg bg-[var(--color-bg)]">
                <p className="text-sm text-[var(--color-text-muted)]">ISO 8601</p>
                <p className="font-mono text-[var(--color-text)]">{formatISO(timestampDate)}</p>
              </div>
              <div className="p-3 rounded-lg bg-[var(--color-bg)]">
                <p className="text-sm text-[var(--color-text-muted)]">{t(tc.relativeTime)}</p>
                <p className="font-medium text-primary-500">{formatRelative(timestampDate)}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Date to Timestamp */}
      <div className="p-4 rounded-lg bg-[var(--color-card)] border border-[var(--color-border)]">
        <h3 className="font-medium text-[var(--color-text)] mb-4">📅 {t(tc.dateToTimestamp)}</h3>
        <div className="space-y-4">
          <input
            type="datetime-local"
            value={dateString}
            onChange={(e) => setDateString(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-[var(--color-border)]
              bg-[var(--color-bg)] text-[var(--color-text)]
              focus:outline-none focus:ring-2 focus:ring-primary-500"
          />

          {dateTimestamp !== null && (
            <div className="p-3 rounded-lg bg-[var(--color-bg)] flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--color-text-muted)]">Unix Timestamp</p>
                <p className="font-mono font-bold text-[var(--color-text)]">{dateTimestamp}</p>
              </div>
              <button
                onClick={() => copyText(String(dateTimestamp))}
                className="px-3 py-1 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm transition-colors"
              >
                {t(tcc.copy)}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Common Timestamps */}
      <div className="p-4 rounded-lg bg-[var(--color-card)] border border-[var(--color-border)]">
        <h3 className="font-medium text-[var(--color-text)] mb-3">📌 {t(tc.commonTimestamps)}</h3>
        <div className="space-y-2">
          {commonTimes.map((item, idx) => (
            <button
              key={idx}
              onClick={() => setTimestamp(String(unit === 'milliseconds' ? item.getTs() * 1000 : item.getTs()))}
              className="w-full p-2 rounded-lg text-left hover:bg-[var(--color-bg)]
                text-[var(--color-text-muted)] transition-colors flex justify-between"
            >
              <span>{'labelKey' in item && item.labelKey ? t(tc[item.labelKey]) : item.label}</span>
              <span className="font-mono text-sm">{item.getTs()}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="p-4 rounded-lg bg-[var(--color-card)] border border-[var(--color-border)]">
        <h3 className="font-medium text-[var(--color-text)] mb-2">💡 {t(tc.whatIsTimestamp)}</h3>
        <p className="text-sm text-[var(--color-text-muted)]">
          {t(tc.timestampExplanation)}
        </p>
      </div>
    </div>
  );
}
