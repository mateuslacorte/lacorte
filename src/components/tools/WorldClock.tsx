'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import type { Language } from '../../i18n';

interface Timezone {
  id: string;
  name: { en: string; pt?: string };
  offset: number; // hours from UTC
  city: string;
}

const TIMEZONES: Timezone[] = [
  { id: 'utc', name: { en: 'UTC', pt: 'UTC' }, offset: 0, city: 'UTC' },
  { id: 'kst', name: { en: 'Seoul', pt: 'Seoul' }, offset: 9, city: 'Seoul' },
  { id: 'jst', name: { en: 'Japan Standard Time', pt: 'Japan Standard Time' }, offset: 9, city: 'Tokyo' },
  { id: 'cst_china', name: { en: 'China Standard Time', pt: 'China Standard Time' }, offset: 8, city: 'Beijing' },
  { id: 'ist', name: { en: 'India Standard Time', pt: 'India Standard Time' }, offset: 5.5, city: 'Mumbai' },
  { id: 'gmt', name: { en: 'Greenwich Mean Time', pt: 'Greenwich Mean Time' }, offset: 0, city: 'London' },
  { id: 'cet', name: { en: 'Central European Time', pt: 'Central European Time' }, offset: 1, city: 'Paris' },
  { id: 'eet', name: { en: 'Eastern European Time', pt: 'Eastern European Time' }, offset: 2, city: 'Athens' },
  { id: 'est', name: { en: 'Eastern Standard Time', pt: 'Eastern Standard Time' }, offset: -5, city: 'New York' },
  { id: 'cst_us', name: { en: 'Central Standard Time', pt: 'Central Standard Time' }, offset: -6, city: 'Chicago' },
  { id: 'mst', name: { en: 'Mountain Standard Time', pt: 'Mountain Standard Time' }, offset: -7, city: 'Denver' },
  { id: 'pst', name: { en: 'Pacific Standard Time', pt: 'Pacific Standard Time' }, offset: -8, city: 'Los Angeles' },
  { id: 'akst', name: { en: 'Alaska Standard Time', pt: 'Alaska Standard Time' }, offset: -9, city: 'Anchorage' },
  { id: 'hst', name: { en: 'Hawaii Standard Time', pt: 'Hawaii Standard Time' }, offset: -10, city: 'Honolulu' },
  { id: 'aest', name: { en: 'Australian Eastern Time', pt: 'Australian Eastern Time' }, offset: 10, city: 'Sydney' },
  { id: 'nzst', name: { en: 'New Zealand Standard Time', pt: 'New Zealand Standard Time' }, offset: 12, city: 'Auckland' },
];

function formatTime(date: Date, offset: number): string {
  const utc = date.getTime() + date.getTimezoneOffset() * 60000;
  const targetTime = new Date(utc + offset * 3600000);
  return targetTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

function formatDate(date: Date, offset: number, lang: string): string {
  const utc = date.getTime() + date.getTimezoneOffset() * 60000;
  const targetTime = new Date(utc + offset * 3600000);
  const locale = 'en-US';
  return targetTime.toLocaleDateString(locale, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function getOffsetString(offset: number): string {
  const sign = offset >= 0 ? '+' : '-';
  const absOffset = Math.abs(offset);
  const hours = Math.floor(absOffset);
  const minutes = (absOffset - hours) * 60;
  if (minutes === 0) {
    return `UTC${sign}${hours}`;
  }
  return `UTC${sign}${hours}:${minutes.toString().padStart(2, '0')}`;
}

export default function WorldClock({ lang: initialLang }: { lang?: Language } = {}) {
  const { t, lang } = useTranslation(initialLang);

  // null until mount — avoid SSR/client clock mismatch (hydration can wipe html.dark).
  const [now, setNow] = useState<Date | null>(null);
  const [selectedZones, setSelectedZones] = useState<string[]>(['utc', 'est', 'gmt', 'jst']);
  const [inputTime, setInputTime] = useState('');
  const [inputDate, setInputDate] = useState('');
  const [inputZone, setInputZone] = useState('utc');

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleZone = (id: string) => {
    if (selectedZones.includes(id)) {
      if (selectedZones.length > 1) {
        setSelectedZones(selectedZones.filter((z) => z !== id));
      }
    } else {
      setSelectedZones([...selectedZones, id]);
    }
  };

  const convertedTimes = useMemo(() => {
    if (!inputTime || !inputDate) return null;

    const sourceZone = TIMEZONES.find((z) => z.id === inputZone);
    if (!sourceZone) return null;

    try {
      const [hours, minutes] = inputTime.split(':').map(Number);
      const [year, month, day] = inputDate.split('-').map(Number);

      // Create date in UTC
      const utcTime = Date.UTC(year, month - 1, day, hours - sourceZone.offset, minutes);

      return TIMEZONES.map((tz) => {
        const targetTime = new Date(utcTime + tz.offset * 3600000);
        return {
          ...tz,
          time: targetTime.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          }),
          date: targetTime.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          }),
        };
      });
    } catch {
      return null;
    }
  }, [inputTime, inputDate, inputZone, lang]);

  const setToNow = () => {
    const now = new Date();
    setInputDate(now.toISOString().split('T')[0]);
    setInputTime(now.toTimeString().slice(0, 5));
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Current Time Display */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {selectedZones.map((zoneId) => {
          const zone = TIMEZONES.find((z) => z.id === zoneId);
          if (!zone) return null;
          return (
            <div
              key={zone.id}
              className="p-4 rounded-lg bg-[var(--color-card)] border border-[var(--color-border)]
                text-center relative group"
            >
              <button
                onClick={() => toggleZone(zone.id)}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity
                  p-1 hover:bg-[var(--color-bg)] rounded"
              >
                <svg className="w-4 h-4 text-[var(--color-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <p className="text-sm text-[var(--color-text-muted)]">{zone.city}</p>
              <p className="text-3xl font-mono font-bold text-[var(--color-text)] my-2">
                {now ? formatTime(now, zone.offset) : '--:--:--'}
              </p>
              <p className="text-sm text-[var(--color-text-muted)]">
                {now ? formatDate(now, zone.offset, lang) : '—'}
              </p>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">
                {getOffsetString(zone.offset)}
              </p>
            </div>
          );
        })}
      </div>

      {/* Add Timezone */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-[var(--color-text)]">
          {t({ en: 'Add Timezone', pt: 'Add Timezone' })}
        </label>
        <div className="flex flex-wrap gap-2">
          {TIMEZONES.filter((z) => !selectedZones.includes(z.id)).map((zone) => (
            <button
              key={zone.id}
              onClick={() => toggleZone(zone.id)}
              className="px-3 py-1 text-sm bg-[var(--color-card)] hover:bg-[var(--color-card-hover)]
                border border-[var(--color-border)] rounded-lg transition-colors"
            >
              {zone.city}
            </button>
          ))}
        </div>
      </div>

      {/* Time Converter */}
      <div className="p-4 rounded-lg bg-[var(--color-card)] border border-[var(--color-border)] space-y-4">
        <h3 className="text-sm font-medium text-[var(--color-text)]">
          {t({ en: 'Time Converter', pt: 'Time Converter' })}
        </h3>

        <div className="flex flex-wrap gap-4 items-end">
          <div className="space-y-1">
            <label className="text-xs text-[var(--color-text-muted)]">
              {t({ en: 'Date', pt: 'Date' })}
            </label>
            <input
              type="date"
              value={inputDate}
              onChange={(e) => setInputDate(e.target.value)}
              className="px-3 py-2 rounded-lg border border-[var(--color-border)]
                bg-[var(--color-bg)] text-[var(--color-text)]
                focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-[var(--color-text-muted)]">
              {t({ en: 'Time', pt: 'Time' })}
            </label>
            <input
              type="time"
              value={inputTime}
              onChange={(e) => setInputTime(e.target.value)}
              className="px-3 py-2 rounded-lg border border-[var(--color-border)]
                bg-[var(--color-bg)] text-[var(--color-text)]
                focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-[var(--color-text-muted)]">
              {t({ en: 'Timezone', pt: 'Timezone' })}
            </label>
            <select
              value={inputZone}
              onChange={(e) => setInputZone(e.target.value)}
              className="px-3 py-2 rounded-lg border border-[var(--color-border)]
                bg-[var(--color-bg)] text-[var(--color-text)]
                focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {TIMEZONES.map((zone) => (
                <option key={zone.id} value={zone.id}>
                  {zone.city} ({getOffsetString(zone.offset)})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={setToNow}
            className="px-3 py-2 text-sm bg-primary-500 hover:bg-primary-600 text-white rounded-lg
              transition-colors"
          >
            {t({ en: 'Now', pt: 'Now' })}
          </button>
        </div>

        {/* Conversion Results */}
        {convertedTimes && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
            {convertedTimes.map((tz) => (
              <div
                key={tz.id}
                className={`p-2 rounded text-center text-sm ${
                  tz.id === inputZone
                    ? 'bg-primary-100 dark:bg-primary-900/30 border border-primary-300 dark:border-primary-700'
                    : 'bg-[var(--color-bg)]'
                }`}
              >
                <p className="text-[var(--color-text-muted)] text-xs">{tz.city}</p>
                <p className="font-mono font-medium text-[var(--color-text)]">{tz.time}</p>
                <p className="text-xs text-[var(--color-text-muted)]">{tz.date}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
