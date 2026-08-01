'use client';

import { useState, useMemo } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import type { Language } from '../../i18n';

interface CronParts {
  minute: string;
  hour: string;
  dayOfMonth: string;
  month: string;
  dayOfWeek: string;
}

const PRESETS = [
  { label: { en: 'Every minute', pt: 'Every minute' }, cron: '* * * * *' },
  { label: { en: 'Every hour', pt: 'Every hour' }, cron: '0 * * * *' },
  { label: { en: 'Every day at midnight', pt: 'Every day at midnight' }, cron: '0 0 * * *' },
  { label: { en: 'Every day at noon', pt: 'Every day at noon' }, cron: '0 12 * * *' },
  { label: { en: 'Every Monday', pt: 'Every Monday' }, cron: '0 0 * * 1' },
  { label: { en: 'First of every month', pt: 'First of every month' }, cron: '0 0 1 * *' },
  { label: { en: 'Weekdays at 9 AM', pt: 'Weekdays at 9 AM' }, cron: '0 9 * * 1-5' },
  { label: { en: 'Every 5 minutes', pt: 'Every 5 minutes' }, cron: '*/5 * * * *' },
  { label: { en: 'Every 30 minutes', pt: 'Every 30 minutes' }, cron: '*/30 * * * *' },
];

const DAYS_OF_WEEK = [
  { value: '0', label: { en: 'Sun', pt: 'Sun' } },
  { value: '1', label: { en: 'Mon', pt: 'Mon' } },
  { value: '2', label: { en: 'Tue', pt: 'Tue' } },
  { value: '3', label: { en: 'Wed', pt: 'Wed' } },
  { value: '4', label: { en: 'Thu', pt: 'Thu' } },
  { value: '5', label: { en: 'Fri', pt: 'Fri' } },
  { value: '6', label: { en: 'Sat', pt: 'Sat' } },
];

const MONTHS = [
  { value: '1', label: { en: 'Jan', pt: 'Jan' } },
  { value: '2', label: { en: 'Feb', pt: 'Feb' } },
  { value: '3', label: { en: 'Mar', pt: 'Mar' } },
  { value: '4', label: { en: 'Apr', pt: 'Apr' } },
  { value: '5', label: { en: 'May', pt: 'May' } },
  { value: '6', label: { en: 'Jun', pt: 'Jun' } },
  { value: '7', label: { en: 'Jul', pt: 'Jul' } },
  { value: '8', label: { en: 'Aug', pt: 'Aug' } },
  { value: '9', label: { en: 'Sep', pt: 'Sep' } },
  { value: '10', label: { en: 'Oct', pt: 'Oct' } },
  { value: '11', label: { en: 'Nov', pt: 'Nov' } },
  { value: '12', label: { en: 'Dec', pt: 'Dec' } },
];

function describeCron(parts: CronParts, t: (obj: { en: string; pt?: string }) => string): string {
  const { minute, hour, dayOfMonth, month, dayOfWeek } = parts;

  const descriptions: string[] = [];

  // Minute
  if (minute === '*') {
    descriptions.push(t({ en: 'every minute', pt: 'every minute' }));
  } else if (minute.startsWith('*/')) {
    descriptions.push(t({ en: `every ${minute.slice(2)} minutes`, pt: `every ${minute.slice(2)} minutes` }));
  } else {
    descriptions.push(t({ en: `at minute ${minute}`, pt: `at minute ${minute}` }));
  }

  // Hour
  if (hour === '*') {
    descriptions.push(t({ en: 'every hour', pt: 'every hour' }));
  } else if (hour.startsWith('*/')) {
    descriptions.push(t({ en: `every ${hour.slice(2)} hours`, pt: `every ${hour.slice(2)} hours` }));
  } else {
    descriptions.push(t({ en: `at ${hour}:00`, pt: `at ${hour}:00` }));
  }

  // Day of month
  if (dayOfMonth !== '*') {
    if (dayOfMonth.startsWith('*/')) {
      descriptions.push(t({ en: `every ${dayOfMonth.slice(2)} days`, pt: `every ${dayOfMonth.slice(2)} days` }));
    } else {
      descriptions.push(t({ en: `on day ${dayOfMonth}`, pt: `on day ${dayOfMonth}` }));
    }
  }

  // Month
  if (month !== '*') {
    const monthNames = MONTHS.find((m) => m.value === month);
    if (monthNames) {
      descriptions.push(t({ en: `in ${monthNames.label.en}`, pt: `in ${monthNames.label.en}` }));
    }
  }

  // Day of week
  if (dayOfWeek !== '*') {
    if (dayOfWeek === '1-5') {
      descriptions.push(t({ en: 'on weekdays', pt: 'on weekdays' }));
    } else if (dayOfWeek === '0,6') {
      descriptions.push(t({ en: 'on weekends', pt: 'on weekends' }));
    } else {
      const dayName = DAYS_OF_WEEK.find((d) => d.value === dayOfWeek);
      if (dayName) {
        descriptions.push(t({ en: `on ${dayName.label.en}`, pt: `on ${dayName.label.en}` }));
      }
    }
  }

  return descriptions.join(' ');
}

export default function CronGenerator({ lang: initialLang }: { lang?: Language } = {}) {
  const { t, lang } = useTranslation(initialLang);

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
    return describeCron(parts, t);
  }, [parts, t]);

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
          <span className="text-sm text-[var(--color-text-muted)]">Cron Expression</span>
          <button
            onClick={copyToClipboard}
            className="px-3 py-1 text-sm bg-[var(--color-bg)] hover:bg-[var(--color-card-hover)]
              border border-[var(--color-border)] rounded transition-colors"
          >
            {copied ? t({ en: 'Copied!', pt: 'Copied!' }) : t({ en: 'Copy', pt: 'Copy' })}
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
          {t({ en: 'Presets', pt: 'Presets' })}
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
              {t(preset.label)}
            </button>
          ))}
        </div>
      </div>

      {/* Editor */}
      <div className="grid grid-cols-5 gap-2">
        {[
          { key: 'minute', label: { en: 'Min', pt: 'Min' }, range: '0-59' },
          { key: 'hour', label: { en: 'Hour', pt: 'Hour' }, range: '0-23' },
          { key: 'dayOfMonth', label: { en: 'Day', pt: 'Day' }, range: '1-31' },
          { key: 'month', label: { en: 'Month', pt: 'Month' }, range: '1-12' },
          { key: 'dayOfWeek', label: { en: 'DoW', pt: 'DoW' }, range: '0-6' },
        ].map(({ key, label, range }) => (
          <div key={key} className="space-y-1">
            <label className="block text-xs text-center text-[var(--color-text-muted)]">
              {t(label)}
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
            {t({ en: 'Day of Week', pt: 'Day of Week' })}
          </label>
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => setParts({ ...parts, dayOfWeek: '*' })}
              className={`px-2 py-1 text-xs rounded ${parts.dayOfWeek === '*' ? 'bg-primary-500 text-white' : 'bg-[var(--color-card)] border border-[var(--color-border)]'}`}
            >
              {t({ en: 'Every', pt: 'Every' })}
            </button>
            <button
              onClick={() => setParts({ ...parts, dayOfWeek: '1-5' })}
              className={`px-2 py-1 text-xs rounded ${parts.dayOfWeek === '1-5' ? 'bg-primary-500 text-white' : 'bg-[var(--color-card)] border border-[var(--color-border)]'}`}
            >
              {t({ en: 'Weekdays', pt: 'Weekdays' })}
            </button>
            <button
              onClick={() => setParts({ ...parts, dayOfWeek: '0,6' })}
              className={`px-2 py-1 text-xs rounded ${parts.dayOfWeek === '0,6' ? 'bg-primary-500 text-white' : 'bg-[var(--color-card)] border border-[var(--color-border)]'}`}
            >
              {t({ en: 'Weekend', pt: 'Weekend' })}
            </button>
            {DAYS_OF_WEEK.map((day) => (
              <button
                key={day.value}
                onClick={() => setParts({ ...parts, dayOfWeek: day.value })}
                className={`px-2 py-1 text-xs rounded ${parts.dayOfWeek === day.value ? 'bg-primary-500 text-white' : 'bg-[var(--color-card)] border border-[var(--color-border)]'}`}
              >
                {t(day.label)}
              </button>
            ))}
          </div>
        </div>

        {/* Common Intervals */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--color-text)]">
            {t({ en: 'Minute Interval', pt: 'Minute Interval' })}
          </label>
          <div className="flex flex-wrap gap-1">
            {['*', '0', '*/5', '*/10', '*/15', '*/30'].map((val) => (
              <button
                key={val}
                onClick={() => setParts({ ...parts, minute: val })}
                className={`px-2 py-1 text-xs rounded ${parts.minute === val ? 'bg-primary-500 text-white' : 'bg-[var(--color-card)] border border-[var(--color-border)]'}`}
              >
                {val === '*' ? t({ en: 'Every', pt: 'Every' }) : val}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Reference */}
      <div className="p-4 rounded-lg bg-[var(--color-card)] border border-[var(--color-border)]">
        <h3 className="text-sm font-medium text-[var(--color-text)] mb-2">
          {t({ en: 'Cron Syntax', pt: 'Cron Syntax' })}
        </h3>
        <div className="text-xs text-[var(--color-text-muted)] space-y-1 font-mono">
          <p><code>*</code> - {t({ en: 'any value', pt: 'any value' })}</p>
          <p><code>,</code> - {t({ en: 'value separator (1,3,5)', pt: 'value separator (1,3,5)' })}</p>
          <p><code>-</code> - {t({ en: 'range (1-5)', pt: 'range (1-5)' })}</p>
          <p><code>/</code> - {t({ en: 'step (*/5 = every 5)', pt: 'step (*/5 = every 5)' })}</p>
        </div>
      </div>
    </div>
  );
}
