'use client';

import { useState, useMemo } from 'react';
import { useTranslation, translations } from '../../i18n/useTranslation';
import type { Language } from '../../i18n';

type TranslateFn = (obj: { en: string } & Partial<Record<Language, string>>) => string;

const tc = translations.tools.cron;

interface CronParts {
  minute: string;
  hour: string;
  dayOfMonth: string;
  month: string;
  dayOfWeek: string;
}

function getPresets(t: TranslateFn) {
  return [
    { label: t(tc.presetEveryMinute), cron: '* * * * *' },
    { label: t(tc.presetEveryHour), cron: '0 * * * *' },
    { label: t(tc.presetMidnight), cron: '0 0 * * *' },
    { label: t(tc.presetNoon), cron: '0 12 * * *' },
    { label: t(tc.presetMonday), cron: '0 0 * * 1' },
    { label: t(tc.presetFirstOfMonth), cron: '0 0 1 * *' },
    { label: t(tc.presetWeekdays9am), cron: '0 9 * * 1-5' },
    { label: t(tc.presetEvery5min), cron: '*/5 * * * *' },
    { label: t(tc.presetEvery30min), cron: '*/30 * * * *' },
  ];
}

function getDaysOfWeek(t: TranslateFn) {
  return [
    { value: '0', label: t(tc.sun) },
    { value: '1', label: t(tc.mon) },
    { value: '2', label: t(tc.tue) },
    { value: '3', label: t(tc.wed) },
    { value: '4', label: t(tc.thu) },
    { value: '5', label: t(tc.fri) },
    { value: '6', label: t(tc.sat) },
  ];
}

function getMonths(t: TranslateFn) {
  return [
    { value: '1', label: t(tc.jan) },
    { value: '2', label: t(tc.feb) },
    { value: '3', label: t(tc.mar) },
    { value: '4', label: t(tc.apr) },
    { value: '5', label: t(tc.mayShort) },
    { value: '6', label: t(tc.jun) },
    { value: '7', label: t(tc.jul) },
    { value: '8', label: t(tc.aug) },
    { value: '9', label: t(tc.sep) },
    { value: '10', label: t(tc.oct) },
    { value: '11', label: t(tc.nov) },
    { value: '12', label: t(tc.dec) },
  ];
}

function fill(template: string, n: string): string {
  return template.replace('{n}', n);
}

function describeCron(
  parts: CronParts,
  t: TranslateFn,
  daysOfWeek: { value: string; label: string }[],
  months: { value: string; label: string }[],
): string {
  const { minute, hour, dayOfMonth, month, dayOfWeek } = parts;

  const descriptions: string[] = [];

  // Minute
  if (minute === '*') {
    descriptions.push(t(tc.everyMinute));
  } else if (minute.startsWith('*/')) {
    descriptions.push(fill(t(tc.everyNMinutes), minute.slice(2)));
  } else {
    descriptions.push(fill(t(tc.atMinute), minute));
  }

  // Hour
  if (hour === '*') {
    descriptions.push(t(tc.everyHour));
  } else if (hour.startsWith('*/')) {
    descriptions.push(fill(t(tc.everyNHours), hour.slice(2)));
  } else {
    descriptions.push(fill(t(tc.atHour), hour));
  }

  // Day of month
  if (dayOfMonth !== '*') {
    if (dayOfMonth.startsWith('*/')) {
      descriptions.push(fill(t(tc.everyNDays), dayOfMonth.slice(2)));
    } else {
      descriptions.push(fill(t(tc.onDay), dayOfMonth));
    }
  }

  // Month
  if (month !== '*') {
    const monthNames = months.find((m) => m.value === month);
    if (monthNames) {
      descriptions.push(fill(t(tc.inMonth), monthNames.label));
    }
  }

  // Day of week
  if (dayOfWeek !== '*') {
    if (dayOfWeek === '1-5') {
      descriptions.push(t(tc.onWeekdays));
    } else if (dayOfWeek === '0,6') {
      descriptions.push(t(tc.onWeekends));
    } else {
      const dayName = daysOfWeek.find((d) => d.value === dayOfWeek);
      if (dayName) {
        descriptions.push(fill(t(tc.onDayName), dayName.label));
      }
    }
  }

  return descriptions.join(' ');
}

export default function CronGenerator({ lang: initialLang }: { lang?: Language } = {}) {
  const { t } = useTranslation(initialLang);

  const PRESETS = useMemo(() => getPresets(t), [t]);
  const DAYS_OF_WEEK = useMemo(() => getDaysOfWeek(t), [t]);
  const MONTHS = useMemo(() => getMonths(t), [t]);

  const [parts, setParts] = useState<CronParts>({
    minute: '0',
    hour: '*',
    dayOfMonth: '*',
    month: '*',
    dayOfWeek: '*',
  });
  const [copied, setCopied] = useState(false);

  const cronExpression = useMemo(() => {
    return `${parts.minute} ${parts.hour} ${parts.dayOfMonth} ${parts.month} ${parts.dayOfWeek}`;
  }, [parts]);

  const description = useMemo(() => {
    return describeCron(parts, t, DAYS_OF_WEEK, MONTHS);
  }, [parts, t, DAYS_OF_WEEK, MONTHS]);

  const parseCron = (cron: string) => {
    const split = cron.split(' ');
    if (split.length === 5) {
      setParts({
        minute: split[0],
        hour: split[1],
        dayOfMonth: split[2],
        month: split[3],
        dayOfWeek: split[4],
      });
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(cronExpression);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Result */}
      <div className="p-6 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)]">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-[var(--color-text-muted)]">{t({ en: 'Cron Expression', pt: 'Expressão Cron' })}</span>
          <button
            onClick={copyToClipboard}
            className="px-3 py-1 text-sm bg-[var(--color-bg)] hover:bg-[var(--color-card-hover)]
              border border-[var(--color-border)] rounded transition-colors"
          >
            {copied ? t(translations.tools.common.copied) : t(translations.tools.common.copy)}
          </button>
        </div>
        <code className="block text-3xl font-mono text-center text-primary-500 py-4">
          {cronExpression}
        </code>
        <p className="text-center text-[var(--color-text-muted)] mt-4">
          {description}
        </p>
      </div>

      {/* Presets */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-[var(--color-text)]">
          {t(tc.presets)}
        </label>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.cron}
              onClick={() => parseCron(preset.cron)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors
                ${cronExpression === preset.cron
                  ? 'bg-primary-500 text-white'
                  : 'bg-[var(--color-card)] hover:bg-[var(--color-card-hover)] text-[var(--color-text)] border border-[var(--color-border)]'
                }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Editor */}
      <div className="grid grid-cols-5 gap-2">
        {[
          { key: 'minute', label: t(tc.min), range: '0-59' },
          { key: 'hour', label: t(tc.hour), range: '0-23' },
          { key: 'dayOfMonth', label: t(tc.day), range: '1-31' },
          { key: 'month', label: t(tc.month), range: '1-12' },
          { key: 'dayOfWeek', label: t(tc.dow), range: '0-6' },
        ].map(({ key, label, range }) => (
          <div key={key} className="space-y-1">
            <label className="block text-xs text-center text-[var(--color-text-muted)]">
              {label}
            </label>
            <input
              type="text"
              value={parts[key as keyof CronParts]}
              onChange={(e) => setParts({ ...parts, [key]: e.target.value })}
              className="w-full px-2 py-2 text-center font-mono text-lg rounded-lg
                border border-[var(--color-border)] bg-[var(--color-card)]
                text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <span className="block text-xs text-center text-[var(--color-text-muted)]">
              {range}
            </span>
          </div>
        ))}
      </div>

      {/* Quick selectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Day of Week Quick Select */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--color-text)]">
            {t(tc.dayOfWeek)}
          </label>
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => setParts({ ...parts, dayOfWeek: '*' })}
              className={`px-2 py-1 text-xs rounded ${parts.dayOfWeek === '*' ? 'bg-primary-500 text-white' : 'bg-[var(--color-card)] border border-[var(--color-border)]'}`}
            >
              {t(tc.everyLabel)}
            </button>
            <button
              onClick={() => setParts({ ...parts, dayOfWeek: '1-5' })}
              className={`px-2 py-1 text-xs rounded ${parts.dayOfWeek === '1-5' ? 'bg-primary-500 text-white' : 'bg-[var(--color-card)] border border-[var(--color-border)]'}`}
            >
              {t(tc.weekdays)}
            </button>
            <button
              onClick={() => setParts({ ...parts, dayOfWeek: '0,6' })}
              className={`px-2 py-1 text-xs rounded ${parts.dayOfWeek === '0,6' ? 'bg-primary-500 text-white' : 'bg-[var(--color-card)] border border-[var(--color-border)]'}`}
            >
              {t(tc.weekend)}
            </button>
            {DAYS_OF_WEEK.map((day) => (
              <button
                key={day.value}
                onClick={() => setParts({ ...parts, dayOfWeek: day.value })}
                className={`px-2 py-1 text-xs rounded ${parts.dayOfWeek === day.value ? 'bg-primary-500 text-white' : 'bg-[var(--color-card)] border border-[var(--color-border)]'}`}
              >
                {day.label}
              </button>
            ))}
          </div>
        </div>

        {/* Common Intervals */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--color-text)]">
            {t(tc.minuteInterval)}
          </label>
          <div className="flex flex-wrap gap-1">
            {['*', '0', '*/5', '*/10', '*/15', '*/30'].map((val) => (
              <button
                key={val}
                onClick={() => setParts({ ...parts, minute: val })}
                className={`px-2 py-1 text-xs rounded ${parts.minute === val ? 'bg-primary-500 text-white' : 'bg-[var(--color-card)] border border-[var(--color-border)]'}`}
              >
                {val === '*' ? t(tc.everyLabel) : val}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Reference */}
      <div className="p-4 rounded-lg bg-[var(--color-card)] border border-[var(--color-border)]">
        <h3 className="text-sm font-medium text-[var(--color-text)] mb-2">
          {t(tc.cronSyntax)}
        </h3>
        <div className="text-xs text-[var(--color-text-muted)] space-y-1 font-mono">
          <p><code>*</code> - {t(tc.anyValue)}</p>
          <p><code>,</code> - {t(tc.valueSeparator)}</p>
          <p><code>-</code> - {t(tc.rangeHint)}</p>
          <p><code>/</code> - {t(tc.stepHint)}</p>
        </div>
      </div>
    </div>
  );
}
