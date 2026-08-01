'use client';

import { useState } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import type { Language } from '../../i18n';

type Mode = 'encode' | 'decode';

export default function Base64Tool({ lang: initialLang }: { lang?: Language } = {}) {
  const { t, translations } = useTranslation(initialLang);
  const tt = translations.tools.base64;
  const tc = translations.tools.common;

  const [mode, setMode] = useState<Mode>('encode');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleConvert = () => {
    setError('');
    try {
      if (mode === 'encode') {
        // Handle Unicode properly
        const encoded = btoa(unescape(encodeURIComponent(input)));
        setOutput(encoded);
      } else {
        // Handle Unicode properly
        const decoded = decodeURIComponent(escape(atob(input)));
        setOutput(decoded);
      }
    } catch (e) {
      setError(t(tt.invalidBase64));
      setOutput('');
    }
  };

  const handleInputChange = (value: string) => {
    setInput(value);
    setError('');
    // Auto-convert on input change
    try {
      if (mode === 'encode') {
        const encoded = btoa(unescape(encodeURIComponent(value)));
        setOutput(encoded);
      } else {
        const decoded = decodeURIComponent(escape(atob(value)));
        setOutput(decoded);
      }
    } catch (e) {
      if (mode === 'decode' && value) {
        setError(t(tt.invalidBase64));
      }
      setOutput('');
    }
  };

  const handleModeChange = (newMode: Mode) => {
    setMode(newMode);
    setInput('');
    setOutput('');
    setError('');
  };

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

  const swapInputOutput = () => {
    setInput(output);
    setOutput(input);
    setMode(mode === 'encode' ? 'decode' : 'encode');
    setError('');
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Mode Toggle */}
      <div className="flex rounded-lg overflow-hidden border border-[var(--color-border)]">
        <button
          onClick={() => handleModeChange('encode')}
          className={`flex-1 py-3 font-medium transition-colors
            ${mode === 'encode'
              ? 'bg-primary-500 text-white'
              : 'bg-[var(--color-card)] text-[var(--color-text)] hover:bg-[var(--color-card-hover)]'
            }`}
        >
          {t(tt.encode)}
        </button>
        <button
          onClick={() => handleModeChange('decode')}
          className={`flex-1 py-3 font-medium transition-colors
            ${mode === 'decode'
              ? 'bg-primary-500 text-white'
              : 'bg-[var(--color-card)] text-[var(--color-text)] hover:bg-[var(--color-card-hover)]'
            }`}
        >
          {t(tt.decode)}
        </button>
      </div>

      {/* Input */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-[var(--color-text)]">
          {t(tc.input)} ({mode === 'encode' ? 'Text' : 'Base64'})
        </label>
        <textarea
          value={input}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder={t(tt.inputPlaceholder)}
          rows={5}
          className="w-full px-4 py-3 rounded-lg border border-[var(--color-border)]
            bg-[var(--color-card)] text-[var(--color-text)] font-mono resize-y
            focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {/* Swap Button */}
      <div className="flex justify-center">
        <button
          onClick={swapInputOutput}
          disabled={!output}
          className="p-2 rounded-full bg-[var(--color-card)] hover:bg-[var(--color-card-hover)]
            border border-[var(--color-border)] transition-colors disabled:opacity-50"
        >
          <svg className="w-6 h-6 text-[var(--color-text)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
        </button>
      </div>

      {/* Output */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="block text-sm font-medium text-[var(--color-text)]">
            {t(tc.output)} ({mode === 'encode' ? 'Base64' : 'Text'})
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
          rows={5}
          className="w-full px-4 py-3 rounded-lg border border-[var(--color-border)]
            bg-[var(--color-bg)] text-[var(--color-text)] font-mono resize-y
            focus:outline-none"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Info */}
      <p className="text-sm text-[var(--color-text-muted)] text-center">
        {t({ en: 'Base64 is a method to encode binary data as text', pt: 'Base64 is a method to encode binary data as text' })}
      </p>
    </div>
  );
}
