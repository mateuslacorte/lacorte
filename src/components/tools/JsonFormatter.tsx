'use client';

import { useState, useCallback } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import type { Language } from '../../i18n';

export default function JsonFormatter({ lang: initialLang }: { lang?: Language } = {}) {
  const { t, translations } = useTranslation(initialLang);
  const tt = translations.tools.json;
  const tc = translations.tools.common;

  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [copied, setCopied] = useState(false);
  const [indentSize, setIndentSize] = useState(2);

  const formatJson = useCallback(() => {
    setError('');
    try {
      const parsed = JSON.parse(input);
      const formatted = JSON.stringify(parsed, null, indentSize);
      setOutput(formatted);
      setIsValid(true);
    } catch (e) {
      setError((e as Error).message);
      setIsValid(false);
      setOutput('');
    }
  }, [input, indentSize]);

  const minifyJson = useCallback(() => {
    setError('');
    try {
      const parsed = JSON.parse(input);
      const minified = JSON.stringify(parsed);
      setOutput(minified);
      setIsValid(true);
    } catch (e) {
      setError((e as Error).message);
      setIsValid(false);
      setOutput('');
    }
  }, [input]);

  const validateJson = useCallback(() => {
    setError('');
    try {
      JSON.parse(input);
      setIsValid(true);
      setError('');
    } catch (e) {
      setError((e as Error).message);
      setIsValid(false);
    }
  }, [input]);

  const copyOutput = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const loadSample = () => {
    const sample = {
      name: "Sample Object",
      version: "1.0.0",
      items: [
        { id: 1, name: "Item 1", active: true },
        { id: 2, name: "Item 2", active: false }
      ],
      metadata: {
        created: "2024-01-01",
        tags: ["sample", "json", "demo"]
      }
    };
    setInput(JSON.stringify(sample));
    setOutput('');
    setIsValid(null);
    setError('');
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={formatJson}
          className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg
            transition-colors font-medium"
        >
          {t(tt.format)}
        </button>
        <button
          onClick={minifyJson}
          className="px-4 py-2 bg-[var(--color-card)] hover:bg-[var(--color-card-hover)]
            border border-[var(--color-border)] rounded-lg transition-colors"
        >
          {t(tt.minify)}
        </button>
        <button
          onClick={validateJson}
          className="px-4 py-2 bg-[var(--color-card)] hover:bg-[var(--color-card-hover)]
            border border-[var(--color-border)] rounded-lg transition-colors"
        >
          {t(tt.validate)}
        </button>
        <button
          onClick={loadSample}
          className="px-4 py-2 bg-[var(--color-card)] hover:bg-[var(--color-card-hover)]
            border border-[var(--color-border)] rounded-lg transition-colors text-sm"
        >
          {t(tt.loadSample)}
        </button>

        {/* Indent size */}
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-sm text-[var(--color-text-muted)]">Indent:</span>
          <select
            value={indentSize}
            onChange={(e) => setIndentSize(Number(e.target.value))}
            className="px-2 py-1 rounded border border-[var(--color-border)]
              bg-[var(--color-card)] text-[var(--color-text)] text-sm"
          >
            <option value={2}>2 spaces</option>
            <option value={4}>4 spaces</option>
            <option value={1}>1 space</option>
          </select>
        </div>
      </div>

      {/* Validation Status */}
      {isValid !== null && (
        <div className={`p-3 rounded-lg flex items-center gap-2 ${
          isValid
            ? 'bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400'
            : 'bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400'
        }`}>
          {isValid ? (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {t(tt.valid)}
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              {t(tt.invalid)}
            </>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800">
          <code className="text-sm text-red-600 dark:text-red-400 break-all">{error}</code>
        </div>
      )}

      {/* Input/Output Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Input */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[var(--color-text)]">
            {t(tc.input)}
          </label>
          <textarea
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setIsValid(null);
              setError('');
            }}
            placeholder={t(tt.inputPlaceholder)}
            rows={15}
            className="w-full px-4 py-3 rounded-lg border border-[var(--color-border)]
              bg-[var(--color-card)] text-[var(--color-text)] font-mono text-sm resize-y
              focus:outline-none focus:ring-2 focus:ring-primary-500"
            spellCheck={false}
          />
        </div>

        {/* Output */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="block text-sm font-medium text-[var(--color-text)]">
              {t(tc.output)}
            </label>
            <button
              onClick={copyOutput}
              disabled={!output}
              className="px-3 py-1 text-sm bg-[var(--color-card)] hover:bg-[var(--color-card-hover)]
                border border-[var(--color-border)] rounded-lg transition-colors
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {copied ? t(tc.copied) : t(tc.copy)}
            </button>
          </div>
          <textarea
            value={output}
            readOnly
            rows={15}
            className="w-full px-4 py-3 rounded-lg border border-[var(--color-border)]
              bg-[var(--color-bg)] text-[var(--color-text)] font-mono text-sm resize-y
              focus:outline-none"
            spellCheck={false}
          />
        </div>
      </div>
    </div>
  );
}
