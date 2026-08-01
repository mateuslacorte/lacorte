'use client';

import { useState, useCallback } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import type { Language } from '../../i18n';

const CHAR_SETS = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  numbers: '0123456789',
  symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
};

function getPasswordStrength(password: string, options: { uppercase: boolean; lowercase: boolean; numbers: boolean; symbols: boolean }): { level: number; label: string } {
  let score = 0;

  // Length score
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;
  if (password.length >= 20) score += 1;

  // Character type score
  const typesUsed = Object.values(options).filter(Boolean).length;
  score += typesUsed;

  if (score <= 2) return { level: 1, label: 'weak' };
  if (score <= 4) return { level: 2, label: 'medium' };
  if (score <= 6) return { level: 3, label: 'strong' };
  return { level: 4, label: 'veryStrong' };
}

export default function PasswordGenerator({ lang: initialLang }: { lang?: Language } = {}) {
  const { t, translations } = useTranslation(initialLang);
  const tt = translations.tools.password;
  const tc = translations.tools.common;

  const [length, setLength] = useState(16);
  const [options, setOptions] = useState({
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
  });
  const [password, setPassword] = useState('');
  const [copied, setCopied] = useState(false);

  const generatePassword = useCallback(() => {
    let charset = '';
    if (options.uppercase) charset += CHAR_SETS.uppercase;
    if (options.lowercase) charset += CHAR_SETS.lowercase;
    if (options.numbers) charset += CHAR_SETS.numbers;
    if (options.symbols) charset += CHAR_SETS.symbols;

    if (!charset) {
      charset = CHAR_SETS.lowercase; // Fallback
    }

    let result = '';
    const array = new Uint32Array(length);
    crypto.getRandomValues(array);

    for (let i = 0; i < length; i++) {
      result += charset[array[i] % charset.length];
    }

    setPassword(result);
    setCopied(false);
  }, [length, options]);

  const copyPassword = async () => {
    if (!password) return;
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const strength = password ? getPasswordStrength(password, options) : null;

  const strengthColors: Record<number, string> = {
    1: 'bg-red-500',
    2: 'bg-yellow-500',
    3: 'bg-green-500',
    4: 'bg-emerald-500',
  };

  const strengthLabels: Record<string, { en: string }> = {
    weak: tt.weak,
    medium: tt.medium,
    strong: tt.strong,
    veryStrong: tt.veryStrong,
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Generated Password Display */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-[var(--color-text)]">
          {t(tc.result)}
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={password}
            readOnly
            placeholder={t({ en: 'Generated password', pt: 'Generated password' })}
            className="flex-1 px-4 py-3 rounded-lg border border-[var(--color-border)]
              bg-[var(--color-card)] text-[var(--color-text)] font-mono text-lg
              focus:outline-none"
          />
          <button
            onClick={copyPassword}
            disabled={!password}
            className="px-4 py-2 bg-[var(--color-card)] hover:bg-[var(--color-card-hover)]
              border border-[var(--color-border)] rounded-lg transition-colors
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {copied ? t(tc.copied) : t(tc.copy)}
          </button>
        </div>
      </div>

      {/* Strength indicator */}
      {strength && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-[var(--color-text-muted)]">{t(tt.strength)}</span>
            <span className="font-medium">{t(strengthLabels[strength.label])}</span>
          </div>
          <div className="h-2 bg-[var(--color-border)] rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${strengthColors[strength.level]}`}
              style={{ width: `${strength.level * 25}%` }}
            />
          </div>
        </div>
      )}

      {/* Length slider */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <label className="text-sm font-medium text-[var(--color-text)]">
            {t(tt.length)}
          </label>
          <span className="text-sm text-[var(--color-text-muted)]">{length}</span>
        </div>
        <input
          type="range"
          min="8"
          max="64"
          value={length}
          onChange={(e) => setLength(Number(e.target.value))}
          className="w-full accent-primary-500"
        />
        <div className="flex justify-between text-xs text-[var(--color-text-muted)]">
          <span>8</span>
          <span>64</span>
        </div>
      </div>

      {/* Options */}
      <div className="space-y-3">
        {[
          { key: 'uppercase', label: tt.uppercase },
          { key: 'lowercase', label: tt.lowercase },
          { key: 'numbers', label: tt.numbers },
          { key: 'symbols', label: tt.symbols },
        ].map(({ key, label }) => (
          <label key={key} className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={options[key as keyof typeof options]}
              onChange={(e) => setOptions({ ...options, [key]: e.target.checked })}
              className="w-5 h-5 rounded border-[var(--color-border)] text-primary-500
                focus:ring-primary-500 focus:ring-offset-0"
            />
            <span className="text-[var(--color-text)]">{t(label)}</span>
          </label>
        ))}
      </div>

      {/* Generate button */}
      <button
        onClick={generatePassword}
        className="w-full py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg
          font-medium transition-colors flex items-center justify-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        {t(tc.generate)}
      </button>
    </div>
  );
}
