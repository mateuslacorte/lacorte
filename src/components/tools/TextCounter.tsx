'use client';

import { useState, useMemo } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import type { Language } from '../../i18n';

interface TextStats {
  characters: number;
  charactersNoSpace: number;
  words: number;
  lines: number;
  sentences: number;
  paragraphs: number;
}

function analyzeText(text: string): TextStats {
  const characters = text.length;
  const charactersNoSpace = text.replace(/\s/g, '').length;

  // Words: split by whitespace and filter empty strings
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;

  // Lines: split by newlines
  const lines = text ? text.split(/\r\n|\r|\n/).length : 0;

  // Sentences: split by sentence-ending punctuation
  const sentences = text.trim() ? (text.match(/[.!?]+(?:\s|$)/g) || []).length : 0;

  // Paragraphs: split by double newlines
  const paragraphs = text.trim() ? text.split(/\n\s*\n/).filter((p) => p.trim()).length : 0;

  return {
    characters,
    charactersNoSpace,
    words,
    lines,
    sentences: sentences || (text.trim() ? 1 : 0),
    paragraphs: paragraphs || (text.trim() ? 1 : 0),
  };
}

export default function TextCounter({ lang: initialLang }: { lang?: Language } = {}) {
  const { t, translations } = useTranslation(initialLang);
  const tt = translations.tools.textCounter;
  const tc = translations.tools.common;

  const [text, setText] = useState('');

  const stats = useMemo(() => analyzeText(text), [text]);

  const statItems = [
    { key: 'characters', label: tt.characters, value: stats.characters, color: 'bg-blue-500' },
    { key: 'charactersNoSpace', label: tt.charactersNoSpace, value: stats.charactersNoSpace, color: 'bg-indigo-500' },
    { key: 'words', label: tt.words, value: stats.words, color: 'bg-purple-500' },
    { key: 'lines', label: tt.lines, value: stats.lines, color: 'bg-pink-500' },
    { key: 'sentences', label: tt.sentences, value: stats.sentences, color: 'bg-rose-500' },
    { key: 'paragraphs', label: tt.paragraphs, value: stats.paragraphs, color: 'bg-orange-500' },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {statItems.map(({ key, label, value, color }) => (
          <div
            key={key}
            className="p-4 rounded-lg bg-[var(--color-card)] border border-[var(--color-border)]
              flex flex-col items-center gap-1"
          >
            <span className="text-3xl font-bold text-[var(--color-text)]">{value.toLocaleString()}</span>
            <span className="text-sm text-[var(--color-text-muted)]">{t(label)}</span>
            <div className={`w-8 h-1 rounded ${color}`} />
          </div>
        ))}
      </div>

      {/* Text Input */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-[var(--color-text)]">
          {t(tc.input)}
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t(tt.placeholder)}
          rows={10}
          className="w-full px-4 py-3 rounded-lg border border-[var(--color-border)]
            bg-[var(--color-card)] text-[var(--color-text)] resize-y
            focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => setText('')}
          className="px-4 py-2 bg-[var(--color-card)] hover:bg-[var(--color-card-hover)]
            border border-[var(--color-border)] rounded-lg transition-colors"
        >
          {t(tc.clear)}
        </button>
        <button
          onClick={async () => {
            const clipText = await navigator.clipboard.readText();
            setText(clipText);
          }}
          className="px-4 py-2 bg-[var(--color-card)] hover:bg-[var(--color-card-hover)]
            border border-[var(--color-border)] rounded-lg transition-colors"
        >
          {t({ en: 'Paste', pt: 'Paste' })}
        </button>
      </div>

      {/* Reading time estimate */}
      {stats.words > 0 && (
        <div className="p-4 rounded-lg bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800">
          <p className="text-center text-[var(--color-text)]">
            {t({ en: 'Estimated reading time', pt: 'Estimated reading time' })}:{' '}
            <span className="font-bold text-primary-600 dark:text-primary-400">
              {Math.ceil(stats.words / 200)} {t({ en: 'min', pt: 'min' })}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
