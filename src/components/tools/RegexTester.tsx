'use client';

import { useState, useMemo } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import type { Language } from '../../i18n';

interface Match {
  text: string;
  index: number;
  groups: string[];
}

export default function RegexTester({ lang: initialLang }: { lang?: Language } = {}) {
  const { t, translations } = useTranslation(initialLang);
  const tt = translations.tools.regex;
  const tc = translations.tools.common;

  const [pattern, setPattern] = useState('');
  const [flags, setFlags] = useState('g');
  const [testString, setTestString] = useState('');
  const [error, setError] = useState('');

  const flagOptions = [
    { value: 'g', label: 'Global (g)', desc: { en: 'Global search', pt: 'Global search' } },
    { value: 'i', label: 'Ignore case (i)', desc: { en: 'Case insensitive', pt: 'Case insensitive' } },
    { value: 'm', label: 'Multiline (m)', desc: { en: 'Multiline', pt: 'Multiline' } },
    { value: 's', label: 'Dotall (s)', desc: { en: '. matches newline', pt: '. matches newline' } },
  ];

  const toggleFlag = (flag: string) => {
    if (flags.includes(flag)) {
      setFlags(flags.replace(flag, ''));
    } else {
      setFlags(flags + flag);
    }
  };

  const { matches, highlightedText } = useMemo(() => {
    if (!pattern || !testString) {
      return { matches: [], highlightedText: testString };
    }

    try {
      const regex = new RegExp(pattern, flags);
      setError('');

      const foundMatches: Match[] = [];
      let match: RegExpExecArray | null;

      if (flags.includes('g')) {
        while ((match = regex.exec(testString)) !== null) {
          foundMatches.push({
            text: match[0],
            index: match.index,
            groups: match.slice(1),
          });
          // Prevent infinite loop for zero-length matches
          if (match[0].length === 0) {
            regex.lastIndex++;
          }
        }
      } else {
        match = regex.exec(testString);
        if (match) {
          foundMatches.push({
            text: match[0],
            index: match.index,
            groups: match.slice(1),
          });
        }
      }

      // Create highlighted text
      let highlighted = '';
      let lastIndex = 0;

      foundMatches.forEach((m, i) => {
        highlighted += escapeHtml(testString.slice(lastIndex, m.index));
        highlighted += `<mark class="bg-yellow-300 dark:bg-yellow-600 rounded px-0.5">${escapeHtml(m.text)}</mark>`;
        lastIndex = m.index + m.text.length;
      });

      highlighted += escapeHtml(testString.slice(lastIndex));

      return { matches: foundMatches, highlightedText: highlighted };
    } catch (e) {
      setError((e as Error).message);
      return { matches: [], highlightedText: testString };
    }
  }, [pattern, flags, testString]);

  function escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
      .replace(/\n/g, '<br/>');
  }

  const commonPatterns = [
    { name: 'Email', pattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}' },
    { name: 'URL', pattern: 'https?:\\/\\/[\\w\\-._~:/?#[\\]@!$&\'()*+,;=]+' },
    { name: 'Phone', pattern: '\\d{2,3}-\\d{3,4}-\\d{4}' },
    { name: 'IPv4', pattern: '\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}' },
    { name: 'Date (YYYY-MM-DD)', pattern: '\\d{4}-\\d{2}-\\d{2}' },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Pattern Input */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-[var(--color-text)]">
          {t(tt.pattern)}
        </label>
        <div className="flex items-center gap-2">
          <span className="text-[var(--color-text-muted)]">/</span>
          <input
            type="text"
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            placeholder="[a-z]+"
            className="flex-1 px-4 py-2 rounded-lg border border-[var(--color-border)]
              bg-[var(--color-card)] text-[var(--color-text)] font-mono
              focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <span className="text-[var(--color-text-muted)]">/</span>
          <input
            type="text"
            value={flags}
            onChange={(e) => setFlags(e.target.value)}
            className="w-16 px-2 py-2 rounded-lg border border-[var(--color-border)]
              bg-[var(--color-card)] text-[var(--color-text)] font-mono text-center
              focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Flags */}
      <div className="flex flex-wrap gap-2">
        {flagOptions.map(({ value, label, desc }) => (
          <button
            key={value}
            onClick={() => toggleFlag(value)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors
              ${flags.includes(value)
                ? 'bg-primary-500 text-white'
                : 'bg-[var(--color-card)] text-[var(--color-text)] border border-[var(--color-border)] hover:bg-[var(--color-card-hover)]'
              }`}
            title={t(desc)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Common Patterns */}
      <div className="space-y-2">
        <label className="text-sm text-[var(--color-text-muted)]">
          {t(tt.commonPatterns)}
        </label>
        <div className="flex flex-wrap gap-2">
          {commonPatterns.map(({ name, pattern: p }) => (
            <button
              key={name}
              onClick={() => setPattern(p)}
              className="px-2 py-1 text-xs bg-[var(--color-card)] hover:bg-[var(--color-card-hover)]
                border border-[var(--color-border)] rounded transition-colors"
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400">
          <code className="text-sm">{error}</code>
        </div>
      )}

      {/* Test String */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-[var(--color-text)]">
          {t(tt.testString)}
        </label>
        <textarea
          value={testString}
          onChange={(e) => setTestString(e.target.value)}
          placeholder={t(tt.testStringPlaceholder)}
          rows={4}
          className="w-full px-4 py-3 rounded-lg border border-[var(--color-border)]
            bg-[var(--color-card)] text-[var(--color-text)] resize-y
            focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {/* Highlighted Result */}
      {testString && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[var(--color-text)]">
            {t(tt.matches)} ({matches.length})
          </label>
          <div
            className="p-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)]
              font-mono text-sm whitespace-pre-wrap break-all"
            dangerouslySetInnerHTML={{ __html: highlightedText }}
          />
        </div>
      )}

      {/* Matches List */}
      {matches.length > 0 && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[var(--color-text)]">
            {t(tt.matchDetails)}
          </label>
          <div className="max-h-60 overflow-y-auto space-y-2">
            {matches.map((match, index) => (
              <div
                key={index}
                className="p-3 rounded-lg bg-[var(--color-card)] border border-[var(--color-border)]"
              >
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--color-text-muted)]">#{index + 1}</span>
                  <span className="text-[var(--color-text-muted)]">index: {match.index}</span>
                </div>
                <code className="block mt-1 text-[var(--color-text)] font-mono">{match.text}</code>
                {match.groups.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-[var(--color-border)]">
                    <span className="text-xs text-[var(--color-text-muted)]">{t(tt.groups)}:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {match.groups.map((group, gi) => (
                        <code
                          key={gi}
                          className="px-2 py-0.5 text-xs bg-[var(--color-bg)] rounded"
                        >
                          ${gi + 1}: {group || '(empty)'}
                        </code>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {pattern && testString && matches.length === 0 && !error && (
        <div className="p-4 rounded-lg bg-[var(--color-card)] border border-[var(--color-border)] text-center">
          <span className="text-[var(--color-text-muted)]">{t(tt.noMatch)}</span>
        </div>
      )}
    </div>
  );
}
