'use client';

import { useState } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import type { Language } from '../../i18n';

type Mode = 'encode' | 'decode';

export default function UrlEncoder({ lang: initialLang }: { lang?: Language } = {}) {
  const { t, translations } = useTranslation(initialLang);
  const tc = translations.tools.urlEncoder;
  const common = translations.tools.common;

  const [mode, setMode] = useState<Mode>('encode');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [encodeComponent, setEncodeComponent] = useState(true);

  const handleConvert = (text: string, currentMode: Mode, useComponent: boolean) => {
    setError('');
    try {
      if (currentMode === 'encode') {
        const encoded = useComponent ? encodeURIComponent(text) : encodeURI(text);
        setOutput(encoded);
      } else {
        const decoded = useComponent ? decodeURIComponent(text) : decodeURI(text);
        setOutput(decoded);
      }
    } catch (e) {
      setError(t(tc.invalidInput));
      setOutput('');
    }
  };

  const handleInputChange = (value: string) => {
    setInput(value);
    if (value) {
      handleConvert(value, mode, encodeComponent);
    } else {
      setOutput('');
      setError('');
    }
  };

  const handleModeChange = (newMode: Mode) => {
    setMode(newMode);
    if (input) {
      handleConvert(input, newMode, encodeComponent);
    }
  };

  const handleComponentToggle = (useComponent: boolean) => {
    setEncodeComponent(useComponent);
    if (input) {
      handleConvert(input, mode, useComponent);
    }
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

  const examples = [
    { label: t(tc.exampleUrlSpaces), value: 'https://example.com/search?q=hello world' },
    { label: t(tc.exampleAccented), value: 'café' },
    { label: t(tc.exampleSpecialChars), value: 'name=John&age=30' },
    { label: t(tc.exampleEncodedUrl), value: 'https%3A%2F%2Fexample.com%2Fpath' },
  ];

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
          {t(tc.encode)}
        </button>
        <button
          onClick={() => handleModeChange('decode')}
          className={`flex-1 py-3 font-medium transition-colors
            ${mode === 'decode'
              ? 'bg-primary-500 text-white'
              : 'bg-[var(--color-card)] text-[var(--color-text)] hover:bg-[var(--color-card-hover)]'
            }`}
        >
          {t(tc.decode)}
        </button>
      </div>

      {/* Options */}
      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="encodeType"
            checked={encodeComponent}
            onChange={() => handleComponentToggle(true)}
            className="w-4 h-4 text-primary-500"
          />
          <span className="text-sm text-[var(--color-text)]">
            encodeURIComponent
            <span className="text-[var(--color-text-muted)] ml-1">
              ({t(tc.fullEncoding)})
            </span>
          </span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="encodeType"
            checked={!encodeComponent}
            onChange={() => handleComponentToggle(false)}
            className="w-4 h-4 text-primary-500"
          />
          <span className="text-sm text-[var(--color-text)]">
            encodeURI
            <span className="text-[var(--color-text-muted)] ml-1">
              ({t(tc.keepUrlStructure)})
            </span>
          </span>
        </label>
      </div>

      {/* Examples */}
      <div className="flex flex-wrap gap-2">
        {examples.map((example) => (
          <button
            key={example.label}
            onClick={() => handleInputChange(example.value)}
            className="px-3 py-1 text-xs bg-[var(--color-card)] hover:bg-[var(--color-card-hover)]
              border border-[var(--color-border)] rounded transition-colors"
          >
            {example.label}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-[var(--color-text)]">
          {t(common.input)}
        </label>
        <textarea
          value={input}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder={t(tc.inputPlaceholder)}
          rows={4}
          className="w-full px-4 py-3 rounded-lg border border-[var(--color-border)]
            bg-[var(--color-card)] text-[var(--color-text)] font-mono text-sm resize-y
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
            {t(common.result)}
          </label>
          <button
            onClick={copyOutput}
            disabled={!output}
            className="px-3 py-1 text-sm bg-[var(--color-card)] hover:bg-[var(--color-card-hover)]
              border border-[var(--color-border)] rounded-lg transition-colors
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {copied ? t(common.copied) : t(common.copy)}
          </button>
        </div>
        <textarea
          value={output}
          readOnly
          rows={4}
          className="w-full px-4 py-3 rounded-lg border border-[var(--color-border)]
            bg-[var(--color-bg)] text-[var(--color-text)] font-mono text-sm resize-y
            focus:outline-none"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Reference */}
      <div className="p-4 rounded-lg bg-[var(--color-card)] border border-[var(--color-border)]">
        <h3 className="text-sm font-medium text-[var(--color-text)] mb-2">
          {t(tc.difference)}
        </h3>
        <div className="text-sm text-[var(--color-text-muted)] space-y-1">
          <p><code className="bg-[var(--color-bg)] px-1 rounded">encodeURIComponent</code>: {t(tc.encodesAllChars)}</p>
          <p><code className="bg-[var(--color-bg)] px-1 rounded">encodeURI</code>: {t(tc.keepsUrlChars)}</p>
        </div>
      </div>
    </div>
  );
}
